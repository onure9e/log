import { LogProcessor } from './utils/processor';
import { ContextManager } from './context';
import { Transport } from './transports/base';
import { ConsoleTransport } from './transports/console';
import { FileTransport } from './transports/file';
import { Worker } from 'worker_threads';
import * as path from 'path';

let cachedTimestamp = new Date().toISOString();
const timeInterval = setInterval(() => {
  cachedTimestamp = new Date().toISOString();
}, 1000);
if (timeInterval.unref) timeInterval.unref();

export interface LogLevel {
  name: string;
  priority: number;
  color: string;
  symbol: string;
}

export interface FileLoggingConfig {
  enabled: boolean;
  path: string;
  filename: string;
  maxFileSize: number;
  maxFiles: number;
  rotation: 'daily' | 'size' | 'none';
  compression: boolean;
  format: 'json' | 'text' | 'csv';
  includeMetadata: boolean;
  includeColors: boolean;
  dateFormat: 'ISO' | 'local' | 'custom';
  customDateFormat: string;
  levels: string[];
  excludeLevels: string[];
  bufferSize: number;
  flushInterval: number;
  encoding: BufferEncoding;
}

export interface LoggerConfig {
  levels: LogLevel[];
  timestamp: boolean;
  prefix: string;
  output: 'console' | 'file' | 'both' | 'custom';
  fileLogging: FileLoggingConfig;
  sensitiveKeys: string[];
  useWorker: boolean;
  silent: boolean;
}

export interface LogMessage {
  level: string;
  message: string;
  timestamp: string;
  prefix?: string;
  metadata?: any;
}

export class CustomLogger {
  public config: LoggerConfig;
  public levels: { [key: string]: LogLevel };
  private transports: Transport[] = [];
  private processor: LogProcessor;
  private contextManager: ContextManager;
  private worker: Worker | null = null;

  // --- AUTOCOMPLETE DECLARATIONS ---
  // These allow IDEs to suggest the methods while they are still created dynamically
  public debug: (message: any, metadata?: any) => void = () => {};
  public info: (message: any, metadata?: any) => void = () => {};
  public warn: (message: any, metadata?: any) => void = () => {};
  public error: (message: any, metadata?: any) => void = () => {};
  public fatal: (message: any, metadata?: any) => void = () => {};
  [key: string]: any; // Allows for additional custom levels

  constructor(config?: Partial<LoggerConfig>) {
    const isProd = process.env.NODE_ENV === 'production';
    this.config = this.getDefaultConfig(isProd);
    if (config) this.mergeConfig(config);

    this.levels = {};
    this.processor = new LogProcessor({ sensitiveKeys: this.config.sensitiveKeys });
    this.contextManager = ContextManager.getInstance();

    this.setupLevels();

    if (this.config.useWorker) {
      this.initWorker();
    } else {
      this.setupTransports();
    }
  }

  private getDefaultConfig(isProd: boolean): LoggerConfig {
    return {
      levels: [
        { name: 'debug', priority: 0, color: 'brightBlack', symbol: '🔍' },
        { name: 'info', priority: 1, color: 'blue', symbol: 'ℹ️' },
        { name: 'warn', priority: 2, color: 'yellow', symbol: '⚠️' },
        { name: 'error', priority: 3, color: 'red', symbol: '❌' },
        { name: 'fatal', priority: 4, color: 'brightRed', symbol: '💀' }
      ],
      timestamp: true,
      prefix: '',
      output: isProd ? 'both' : 'console',
      useWorker: isProd,
      silent: true,
      sensitiveKeys: ['password', 'token', 'secret', 'key', 'authorization', 'cookie'],
      fileLogging: {
        enabled: isProd,
        path: './logs',
        filename: 'app.log',
        maxFileSize: 50 * 1024 * 1024,
        maxFiles: 10,
        rotation: 'daily',
        compression: true,
        format: isProd ? 'json' : 'text',
        includeMetadata: true,
        includeColors: false,
        dateFormat: 'ISO',
        customDateFormat: 'YYYY-MM-DD HH:mm:ss',
        levels: ['info', 'warn', 'error', 'fatal'],
        excludeLevels: [],
        bufferSize: isProd ? 500 : 1,
        flushInterval: 5000,
        encoding: 'utf8'
      }
    };
  }

  private initWorker(): void {
    try {
      const workerPath = path.resolve(__dirname, 'worker.js');
      this.worker = new Worker(workerPath, {
        workerData: {
          config: this.config,
          levels: this.levels
        }
      });

      this.worker.on('error', (err) => {
        console.error('CRITICAL: Logger Worker Error, falling back to main thread:', err);
        this.config.useWorker = false;
        this.setupTransports();
      });
    } catch (e) {
      this.config.useWorker = false;
      this.setupTransports();
    }
  }

  private setupLevels(): void {
    this.config.levels.forEach(level => {
      this.levels[level.name] = level;
      this[level.name] = this.createLogMethod(level.name);
    });
  }

  private createLogMethod(level: string) {
    return (message: any, metadata?: any) => {
      try {
        const context = this.contextManager.getContext();
        
        // Ensure message is handled if it's an object/error
        let processedMsg = message;
        if (message instanceof Error) {
            processedMsg = message.message;
            metadata = { ...metadata, error: message }; // move error to meta
        }

        if (this.config.useWorker && this.worker) {
          this.worker.postMessage({
            level,
            message: String(processedMsg),
            timestamp: cachedTimestamp,
            prefix: this.config.prefix || undefined,
            metadata: { ...context, ...metadata }
          });
        } else {
          let finalMeta = undefined;
          if (metadata || Object.keys(context).length > 0) {
            finalMeta = this.processor.process({ ...context, ...metadata });
          }

          const logMessage: LogMessage = {
            level,
            message: String(processedMsg),
            timestamp: cachedTimestamp,
            prefix: this.config.prefix || undefined,
            metadata: finalMeta
          };

          for (let j = 0; j < this.transports.length; j++) {
            this.transports[j].log(logMessage);
          }
        }
      } catch (err) {
        if (!this.config.silent) throw err;
        process.stderr.write(`Internal Logger Error: ${err}\n`);
      }
    };
  }

  public log(level: string, message: any, metadata?: any): void {
      if (this[level]) this[level](message, metadata);
  }

  private setupTransports(): void {
    this.transports = [];
    if (this.config.output === 'console' || this.config.output === 'both') {
      this.addTransport(new ConsoleTransport({ levels: this.levels }));
    }
    if (this.config.output === 'file' || this.config.output === 'both') {
      this.addTransport(new FileTransport(this.config.fileLogging, this.levels));
    }
  }

  public addTransport(transport: Transport): void {
    this.transports.push(transport);
  }

  private mergeConfig(config: Partial<LoggerConfig>): void {
    Object.assign(this.config, config);
    if (config.fileLogging) {
        this.config.fileLogging = { ...this.config.fileLogging, ...config.fileLogging };
    }
  }

  public runWithContext<T>(context: Record<string, any>, callback: () => T): T {
    return this.contextManager.runWithContext(context, callback);
  }

  public destroy(): void {
    if (this.worker) this.worker.terminate();
    this.transports.forEach((t: any) => t.destroy?.());
  }

  // Compatibility helpers
  public getAvailableColors = () => ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'brightBlack'];
  public isValidColor = (color: string) => this.getAvailableColors().includes(color);
  public suggestColors = (ctx: string) => ['blue', 'green'];
  public addLevel(config: { name: string; priority: number; color: string; symbol: string }): void {
    this.levels[config.name] = config;
    this.setupLevels();
  }

  public updateConfig(u: any) { 
    this.mergeConfig(u); 
    this.transports.forEach((t: any) => t.destroy?.());
    this.setupTransports(); 
  }

  public getLogStats = () => {
    const ft = this.transports.find(t => t instanceof FileTransport) as FileTransport;
    return ft ? ft.getStats() : null;
  }
}

export default CustomLogger;