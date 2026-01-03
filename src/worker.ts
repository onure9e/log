import { parentPort, workerData } from 'worker_threads';
import { LogProcessor } from './utils/processor';
import { ConsoleTransport } from './transports/console';
import { FileTransport } from './transports/file';
import { Transport } from './transports/base';

if (!parentPort) {
  throw new Error('This file must be run as a worker thread');
}

const { config, levels } = workerData;
const processor = new LogProcessor({ sensitiveKeys: config.sensitiveKeys });
const transports: Transport[] = [];

// Setup Transports in Worker
if (config.output === 'console' || config.output === 'both') {
  transports.push(new ConsoleTransport({ levels }));
}
if (config.output === 'file' || config.output === 'both') {
  transports.push(new FileTransport(config.fileLogging, levels));
}

// Listen for log messages from main thread
parentPort.on('message', (logRequest) => {
  try {
    const { level, message, timestamp, prefix, metadata } = logRequest;

    // Perform heavy operations here
    const processedMeta = metadata ? processor.process(metadata) : undefined;
    
    const logMessage = {
      level,
      message,
      timestamp,
      prefix,
      metadata: processedMeta
    };

    // Fan-out to transports
    for (let i = 0; i < transports.length; i++) {
      transports[i].log(logMessage);
    }
  } catch (err) {
    // Internal worker error - try to report back
    console.error('Logger Worker Internal Error:', err);
  }
});

// Cleanup on exit
process.on('SIGTERM', () => {
  transports.forEach((t: any) => t.destroy?.());
  process.exit(0);
});
