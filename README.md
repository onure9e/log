# @onurege3467/log 🚀

An enterprise-ready, high-performance logging library for Node.js. Optimized for production with **Worker Threads**, **Sensitive Data Redaction**, and **Asynchronous Context Tracking**. Built with TypeScript for full type safety.

[![npm version](https://img.shields.io/npm/v/@onurege3467/log.svg)](https://www.npmjs.com/package/@onurege3467/log)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 Elite Features

- 🧵 **Worker Threads**: Offload serialization and I/O to background threads. Near-zero overhead on your main event loop.
- 🛡️ **Ultra-Security Redaction**: Automatically masks passwords, API keys, and sensitive patterns (Stripe, AWS, Credit Cards) even inside strings and deep objects.
- 🆔 **Async Context Tracking**: Automatically attach `requestId` or `userId` to all logs within a request flow using Node.js `AsyncLocalStorage`.
- 🔌 **Modular Transport System**: Easily extend logging to Console, File, or your own custom transports.
- 📜 **Smart Error Serialization**: Properly serializes `Error` objects, including stacks, hidden properties, and custom metadata.
- 🌐 **Auto-Environment Detection**: Intelligently switches between human-readable (Dev) and optimized JSON (Prod) formats.
- 🔄 **Safe & Reliable**: Built-in protection against circular references and extremely deep objects.
- ⚡ **High Performance**: Features time caching and hot-path optimizations to rival libraries like Pino.

---

## 📦 Installation

```bash
npm install @onurege3467/log
```

---

## 🚀 Quick Start

### Basic Usage
```typescript
import { CustomLogger } from '@onurege3467/log';

const logger = new CustomLogger();

logger.info('Server started on port 3000');
logger.warn('Low disk space', { available: '15%' });
logger.error('Database connection failed', new Error('Timeout'));
```

### Production Mode (Zero-Config)
In production (`NODE_ENV=production`), the logger automatically enables **Worker Threads** and **JSON formatting** for ELK/Datadog compatibility.

```javascript
// Automatically optimized for Production
const logger = new CustomLogger(); 
```

---

## 🛡️ Sensitive Data Protection (Redaction)

The logger automatically scrubs sensitive information from log messages and metadata.

```typescript
logger.info('Connecting to service', { 
  apiKey: 'AKIA1234567890ABCDEF', // Automatically masked
  password: 'super-secret-pass'   // Automatically masked
});

// String pattern detection
logger.info('User requested: https://my-app.com/api?token=secret-123');
// Output: User requested: https://my-app.com/api?token=[REDACTED]
```

---

## 🆔 Asynchronous Context Tracking

Trace a request's logs through different functions without passing IDs manually.

```typescript
logger.runWithContext({ requestId: 'req-123', userId: 42 }, () => {
  doSomething(); // Any logger call inside here will include requestId and userId
});

function doSomething() {
  logger.info('Performing action'); 
  // Output includes: {"requestId":"req-123","userId":42}
}
```

---

## 🧵 Worker Threads Performance

For high-traffic applications, enable Worker Threads to keep your application snappy.

```typescript
const logger = new CustomLogger({
  useWorker: true // Processes logs in a separate thread
});
```

---

## ⚙️ Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prefix` | string | `''` | Add a prefix to all log messages |
| `timestamp` | boolean | `true` | Enable/disable timestamps |
| `output` | string | `'console'` | `'console'`, `'file'`, `'both'`, `'custom'` |
| `useWorker` | boolean | `false` | Enable background worker thread (true in Prod) |
| `sensitiveKeys` | string[] | `[...]` | Custom keys to be redacted |
| `silent` | boolean | `true` | Fail-safe mode: logger errors won't crash app |

### Custom Log Levels
```typescript
logger.addLevel({
  name: 'success',
  priority: 1,
  color: 'green',
  symbol: '✅'
});

logger.success('Operation complete!');
```

---

## 📁 File Logging

High-performance file logging with rotation and compression.

```typescript
const logger = new CustomLogger({
  fileLogging: {
    enabled: true,
    path: './logs',
    filename: 'app.log',
    rotation: 'daily',
    maxFiles: 10,
    format: 'json'
  }
});
```

---

## 📊 Performance Comparison

| Library | Total Overhead | Context Support | Worker Threads |
|---------|---------------|-----------------|----------------|
| **@onurege3467/log** | **Near-Zero** | **Native** | **Yes** |
| winston | Medium | via Plugins | No |
| pino | Ultra-Low | Native | via Extreme Mode |

---

## 🧪 Testing

```bash
npm run test:all
```

## 📄 License

MIT © [onure9e](https://github.com/onure9e)
