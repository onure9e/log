const { default: CustomLogger, ConsoleTransport } = require('../dist/index');

const logger = new CustomLogger({
  prefix: 'ModernTest',
  sensitiveKeys: ['password', 'secretToken', 'creditCard'] // Özel maskeleme anahtarları
});

console.log('=== @onurege3467/log Modern Features Test ===\n');

// 1. TEST: Hassas Veri Maskeleme (Redaction)
console.log('--- 1. Redaction Test ---');
logger.info('User login attempt', {
  username: 'onurege',
  password: 'super-secret-password-123',
  metadata: {
    secretToken: 'abc-123-def-456',
    ip: '127.0.0.1'
  },
  creditCard: '1234-5678-9012-3456'
});

// 2. TEST: Error Serialization
console.log('\n--- 2. Error Serialization Test ---');
try {
  throw new Error('Database connection failed!');
} catch (err) {
  err.code = 'ECONNREFUSED';
  err.details = { host: 'localhost', port: 5432 };
  logger.error('An error occurred during DB operation', err);
}

// 3. TEST: Async Context Tracking (Request Tracing)
console.log('\n--- 3. Context Tracking Test ---');
// Simüle edilmiş bir istek (request) context'i
logger.runWithContext({ requestId: 'req-unique-id-999', userId: 42 }, () => {
  logger.info('Starting process in context');
  
  // İç içe geçmiş işlemler (context korunur)
  setTimeout(() => {
    logger.warn('Process still running in same context');
    console.log('\n--- 4. Final Verification ---');
    console.log('Context Test Completed.');
    
    // Cleanup and exit
    logger.destroy();
    setTimeout(() => {
      console.log('\n✅ All tests passed. Exiting...');
      process.exit(0);
    }, 100);
  }, 100);
});

// 4. TEST: Custom Transport (Eklenebilirlik)
console.log('\n--- 4. Custom Transport Test ---');
class MyCustomTransport {
  log(msg) {
    console.log(`[MY_CUSTOM_TRANSPORT] Recieved log: ${msg.level} -> ${msg.message}`);
  }
}
logger.addTransport(new MyCustomTransport());
logger.info('This message goes to both Console and MyCustomTransport');
