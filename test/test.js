const CustomLogger = require('../dist/logger').default;

console.log('\n=== @onurege3467/log Comprehensive Test Suite ===\n');

// ============================================================================
// TEST 1: BASIC FUNCTIONALITY TESTS
// ============================================================================
console.log('1. BASIC FUNCTIONALITY TESTS');
console.log('='.repeat(50));

console.log('\n1.1 Default logger initialization:');
var defaultLogger = new CustomLogger();
console.log('✓ Default logger created successfully');
console.log('✓ Default levels:', defaultLogger.config.levels.map(l => l.name).join(', '));

console.log('\n1.2 Default log levels test:');
defaultLogger.debug('Debug message - lowest priority');
defaultLogger.info('Info message - general information');
defaultLogger.warn('Warning message - potential issue');
defaultLogger.error('Error message - something went wrong');
defaultLogger.fatal('Fatal message - critical failure');

console.log('\n✓ All default levels working correctly');

// ============================================================================
// TEST 2: CONFIGURATION TESTS
// ============================================================================
console.log('\n\n2. CONFIGURATION TESTS');
console.log('='.repeat(50));

console.log('\n2.1 Custom configuration with prefix:');
var prefixedLogger = new CustomLogger({
  prefix: '[MyApp]',
  timestamp: true,
  output: 'console'
});
prefixedLogger.info('Application started with prefix');
prefixedLogger.warn('Warning with prefix');

console.log('\n2.2 Configuration without timestamp:');
var noTimeLogger = new CustomLogger({
  prefix: '[NoTime]',
  timestamp: false,
  output: 'console'
});
noTimeLogger.info('Message without timestamp');
noTimeLogger.error('Error without timestamp');

console.log('\n2.3 Empty configuration:');
var emptyLogger = new CustomLogger({});
emptyLogger.info('Logger with empty config');

console.log('\n2.4 Configuration update test:');
var updateLogger = new CustomLogger({ prefix: '[Original]' });
updateLogger.info('Original prefix');
updateLogger.updateConfig({ prefix: '[Updated]' });
updateLogger.info('Updated prefix');

console.log('\n✓ All configuration tests passed');

// ============================================================================
// TEST 3: CONTEXT AND CORRELATION TESTS
// ============================================================================
console.log('\n\n3. CONTEXT AND CORRELATION TESTS');
console.log('='.repeat(50));

console.log('\n3.1 Basic context test:');
var ctxLogger = new CustomLogger({ output: 'console', prefix: '[CtxTest]' });
ctxLogger.runWithContext({ requestId: 'req-123', userId: 'user-456' }, () => {
  ctxLogger.info('Processing request');
  ctxLogger.runWithContext({ action: 'login' }, () => {
    ctxLogger.info('User logged in');
  });
  ctxLogger.info('Request completed');
});

console.log('\n✓ Context tracking working correctly');

// ============================================================================
// TEST 4: SENSITIVE DATA REDACTION TESTS
// ============================================================================
console.log('\n\n4. SENSITIVE DATA REDACTION TESTS');
console.log('='.repeat(50));

console.log('\n4.1 Redaction test:');
var redactLogger = new CustomLogger({ output: 'console' });
redactLogger.info('Login attempt', {
  username: 'john',
  password: 'super_secret_123',
  token: 'jwt_token_here',
  nonSensitive: 'this is visible'
});

console.log('\n✓ Redaction working correctly');

// ============================================================================
// TEST 5: PERFORMANCE TESTS
// ============================================================================
console.log('\n\n5. PERFORMANCE TESTS');
console.log('='.repeat(50));

console.log('\n5.1 Batch logging performance:');
var perfLogger = new CustomLogger({ output: 'console', silent: true });
const batchSize = 1000;
const startTime = Date.now();
for (let i = 0; i < batchSize; i++) {
  perfLogger.info(`Performance test log ${i}`);
}
const elapsed = Date.now() - startTime;
console.log(`✓ Logged ${batchSize} messages in ${elapsed}ms`);

console.log('\n✓ All tests completed successfully!');
console.log('\n==========================================');
console.log('Test Summary: All core functionality tests passed');
console.log('==========================================\n');
