import { Transport } from './base';
import { LogMessage, LogLevel, FileLoggingConfig } from '../logger';

// Lazy load liteFS
let liteFS: any;
function getLiteFS(): any {
  if (!liteFS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    liteFS = require('@onurege3467/light-fs');
  }
  return liteFS;
}

export class FileTransport implements Transport {
  private logBuffer: string[] = [];
  private lastFlush: number = Date.now();
  private flushIntervalTimer: NodeJS.Timeout | null = null;
  private config: FileLoggingConfig;
  private levels: { [key: string]: LogLevel };

  constructor(config: FileLoggingConfig, levels: { [key: string]: LogLevel }) {
    this.config = config;
    this.levels = levels;
    this.init();
  }

  private init(): void {
    if (!this.config.enabled) return;
    try {
      const lfs = getLiteFS();
      lfs.configure({
        cacheEnabled: true,
        cacheMaxAge: 30000,
        cacheSize: 100,
        compressionEnabled: this.config.compression,
        compressionThreshold: 1024
      });
      this.ensureLogDirectory();
      this.startFlushInterval();
    } catch (error: any) {
      console.error('✗ Failed to initialize file logging:', error.message);
      this.config.enabled = false;
    }
  }

  public log(message: LogMessage): void {
    if (!this.shouldLog(message.level)) return;
    try {
      const formattedLog = this.formatLogForFile(message);
      this.logBuffer.push(formattedLog);
      if (this.logBuffer.length >= this.config.bufferSize) {
        this.flushBuffer();
      }
    } catch (error: any) {
      console.error('✗ Failed to write to log file:', error.message);
    }
  }

  private shouldLog(levelName: string): boolean {
    if (!this.config.enabled) return false;
    if (this.config.excludeLevels.includes(levelName)) return false;
    if (this.config.levels.length > 0 && !this.config.levels.includes(levelName)) return false;
    return true;
  }

  private ensureLogDirectory(): void {
    try {
      const lfs = getLiteFS();
      if (!lfs.exists(this.config.path)) lfs.mkdir(this.config.path, { recursive: true });
    } catch (error: any) {
      console.error('✗ Failed to create log directory:', error.message);
    }
  }

  private getLogFilePath(): string {
    let filename = this.config.filename;
    if (this.config.rotation === 'daily') {
      const dateStr = new Date().toISOString().split('T')[0];
      const nameParts = filename.split('.');
      const ext = nameParts.pop();
      filename = `${nameParts.join('.')}-${dateStr}.${ext}`;
    }
    return `${this.config.path}/${filename}`;
  }

  private formatLogForFile(logMessage: LogMessage): string {
    const formattedLog: any = {
      timestamp: logMessage.timestamp,
      level: logMessage.level.toUpperCase(),
      message: logMessage.message
    };

    if (logMessage.prefix) formattedLog.prefix = logMessage.prefix;
    if (this.config.includeMetadata && logMessage.metadata) {
      formattedLog.metadata = logMessage.metadata;
    }

    const level = this.levels[logMessage.level];
    if (level?.symbol) formattedLog.symbol = level.symbol;

    switch (this.config.format) {
      case 'json': return JSON.stringify(formattedLog);
      case 'csv': return this.formatAsCSV(formattedLog);
      default: return this.formatAsText(formattedLog);
    }
  }

  private formatAsText(logData: any): string {
    let out = `[${logData.timestamp}] [${logData.level}] `;
    if (logData.prefix) out += `[${logData.prefix}] `;
    if (logData.symbol) out += logData.symbol + ' ';
    out += logData.message;
    if (logData.metadata) out += ` | ${JSON.stringify(logData.metadata)}`;
    return out;
  }

  private formatAsCSV(logData: any): string {
    const msg = String(logData.message).split('"').join('""');
    const meta = logData.metadata ? JSON.stringify(logData.metadata).split('"').join('""') : '';
    return [
      logData.timestamp,
      logData.level,
      logData.prefix || '',
      logData.symbol || '',
      `"${msg}"`,
      logData.metadata ? `"${meta}"` : ''
    ].join(',');
  }

  public flushBuffer(): void {
    if (this.logBuffer.length === 0) return;
    try {
      const logFilePath = this.getLogFilePath();
      const content = this.logBuffer.join('\n') + '\n';
      const lfs = getLiteFS();
      const existingContent = lfs.exists(logFilePath) ? lfs.readFileSync(logFilePath, this.config.encoding) : '';
      lfs.writeFileSync(logFilePath, existingContent + content, this.config.encoding);
      this.logBuffer = [];
      this.lastFlush = Date.now();
    } catch (error: any) {
      console.error('✗ Failed to flush log buffer:', error.message);
    }
  }

  private startFlushInterval(): void {
    this.flushIntervalTimer = setInterval(() => this.flushBuffer(), this.config.flushInterval);
  }

  public destroy(): void {
    if (this.flushIntervalTimer) {
      clearInterval(this.flushIntervalTimer);
      this.flushIntervalTimer = null;
    }
    this.flushBuffer();
  }
  
  public getStats = () => ({ bufferSize: this.logBuffer.length, lastFlush: this.lastFlush });
  public getFiles = () => {
     const lfs = getLiteFS();
     return lfs.exists(this.config.path) ? lfs.readdir(this.config.path).filter((f: string) => f.endsWith('.log')) : [];
  };
}
