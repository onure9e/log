import CustomLogger, { LoggerConfig, LogLevel, LogMessage } from './logger';

export * from './logger';
export * from './transports/base';
export * from './transports/console';
export * from './transports/file';
export * from './context'; // Export context manager for advanced usage

// Create a default instance
export const defaultLogger = new CustomLogger();

// Factory function
export function createLogger(config?: Partial<LoggerConfig>): CustomLogger {
  return new CustomLogger(config);
}

export default CustomLogger;
