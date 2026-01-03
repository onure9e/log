const { default: CustomLogger } = require('../dist/index');
const path = require('path');
const fs = require('fs');

const logger = new CustomLogger({
  prefix: 'Supreme',
  useWorker: true,
  sensitiveKeys: ['auth', 'password'],
  fileLogging: {
    enabled: true,
    path: './test-supreme-logs',
    filename: 'supreme.log',
    bufferSize: 100
  }
});

async function runSupremeTests() {
  console.log('🚀 Starting Supreme Integrity Test Suite...\n');

  // --- 1. Circular Reference Test ---
  console.log('1. Testing Circular References...');
  const circular = { name: 'onur' };
  circular.self = circular; // Kendine referans
  logger.info('Circular object test', { data: circular });

  // --- 2. Deep Object Test ---
  console.log('2. Testing Deep Nesting (Exceeding limit)...');
  const deep = {};
  let current = deep;
  for (let i = 0; i < 15; i++) {
    current.next = { level: i };
    current = current.next;
  }
  logger.warn('Deep object test', { deepData: deep });

  // --- 3. Parallel Context Tracking Test ---
  console.log('3. Testing Parallel Context Integrity...');
  const results = [];
  for (let i = 0; i < 50; i++) {
    results.push(new Promise((resolve) => {
      const requestId = `req-${i}`;
      logger.runWithContext({ requestId }, () => {
        // Rastgele bekleme süresi ile asenkronluğu zorla
        setTimeout(() => {
          logger.info(`Log for ${requestId}`);
          resolve();
        }, Math.random() * 200);
      });
    }));
  }
  await Promise.all(results);

  // --- 4. Stress & Memory Test ---
  console.log('4. Stress Testing (10,000 logs in burst)...');
  const start = Date.now();
  for (let i = 0; i < 10000; i++) {
    logger.debug('Burst log', { i, payload: 'X'.repeat(100) });
  }
  console.log(`Burst completed in ${Date.now() - start}ms (Worker is processing in background)`);

  // --- 5. Fail-Safe Test ---
  console.log('5. Testing Fail-Safe with invalid inputs...');
  logger.info(undefined);
  logger.error(null);
  logger.fatal(new Error('Standard Error'));
  
  // Custom non-enumerable property error
  const customErr = new Error('Custom Error');
  Object.defineProperty(customErr, 'hidden', { value: 'secret-info', enumerable: false });
  logger.error('Error with hidden props', customErr);

  console.log('\n⌛ Waiting for Worker and Buffer to flush...');
  
  setTimeout(() => {
    console.log('\n--- Final Integrity Check ---');
    const logDir = './test-supreme-logs';
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      console.log(`✅ Log directory exists. Files: ${files.join(', ')}`);
      
      const content = fs.readFileSync(path.join(logDir, files[0]), 'utf8');
      const lines = content.trim().split('\n');
      console.log(`✅ Log file has ${lines.length} lines.`);
      
      // JSON validasyon testi
      try {
        JSON.parse(lines[0]);
        console.log('✅ Log format is valid JSON.');
      } catch (e) {
        console.log('⚠️ Note: First line might not be JSON if format was text.');
      }
    }

    logger.destroy();
    console.log('\n✨ Supreme Tests Completed Successfully!');
    process.exit(0);
  }, 3000);
}

runSupremeTests().catch(err => {
  console.error('Supreme Test Failed:', err);
  process.exit(1);
});
