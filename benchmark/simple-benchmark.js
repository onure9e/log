/**
 * Simple Benchmark Test for @onurege3467/log vs Alternatives
 */

// Suppress all console output during benchmark
var originalLog = console.log;
var originalError = console.error;
var originalWarn = console.warn;

console.log = function() {};
console.error = function() {};
console.warn = function() {};

// Try to load alternative libraries
var alternatives = {};

try {
  alternatives.winston = require('winston');
} catch (e) {}

try {
  alternatives.pino = require('pino');
} catch (e) {}

try {
  alternatives.debug = require('debug');
} catch (e) {}

// Our library
var CustomLogger = require('../dist/logger');

// Benchmark function
function benchmark(name, fn, iterations) {
  var start = process.hrtime.bigint();
  
  for (var i = 0; i < iterations; i++) {
    fn();
  }
  
  var end = process.hrtime.bigint();
  var duration = Number(end - start) / 1000000; // Convert to milliseconds
  var opsPerSecond = Math.round(iterations / (duration / 1000));
  
  return {
    name: name,
    duration: duration,
    iterations: iterations,
    opsPerSecond: opsPerSecond,
    avgTime: duration / iterations
  };
}

// Test configurations
var testConfigs = [
  { name: 'Simple String', message: 'Hello World', metadata: null },
  { name: 'With Metadata', message: 'User login', metadata: { userId: 12345, ip: '192.168.1.1' } },
  { name: 'Complex Metadata', message: 'API Request', metadata: { 
    method: 'POST', 
    path: '/api/users', 
    headers: { 'content-type': 'application/json' },
    body: { name: 'John Doe', email: 'john@example.com' }
  }}
];

// Test functions for each library
var testFunctions = {};

// Our library
testFunctions['@onurege3467/log'] = function() {
  var logger = new CustomLogger({ prefix: 'Benchmark' });
  return function(message, metadata) {
    logger.info(message, metadata);
  };
};

// Native console
testFunctions['console.log'] = function() {
  return function(message, metadata) {
    // Suppress actual output
  };
};

// Winston
if (alternatives.winston) {
  testFunctions['winston'] = function() {
    var logger = alternatives.winston.createLogger({
      level: 'info',
      format: alternatives.winston.format.simple(),
      transports: [
        new alternatives.winston.transports.Console({ silent: true })
      ]
    });
    return function(message, metadata) {
      logger.info(message, metadata);
    };
  };
}

// Pino
if (alternatives.pino) {
  testFunctions['pino'] = function() {
    var logger = alternatives.pino({ level: 'silent' });
    return function(message, metadata) {
      logger.info({ message: message, ...metadata });
    };
  };
}

// Debug
if (alternatives.debug) {
  testFunctions['debug'] = function() {
    var debug = alternatives.debug('benchmark');
    return function(message, metadata) {
      // Suppress actual output
    };
  };
}

// Run benchmarks
var results = {};
var iterations = 10000;

// Test each library
for (var libName in testFunctions) {
  results[libName] = {};
  
  for (var i = 0; i < testConfigs.length; i++) {
    var config = testConfigs[i];
    var loggerFn = testFunctions[libName]();
    
    var result = benchmark(
      config.name,
      function() {
        loggerFn(config.message, config.metadata);
      },
      iterations
    );
    
    results[libName][config.name] = result;
  }
}

// Restore console output
console.log = originalLog;
console.error = originalError;
console.warn = originalWarn;

// Display results
console.log('🚀 BENCHMARK RESULTS (@onurege3467/log vs Alternatives)');
console.log('='.repeat(80));

// Create comparison table
var tableHeaders = ['Library', 'Simple String', 'With Metadata', 'Complex Metadata'];
var tableRows = [];

for (var lib in results) {
  var row = [lib];
  for (var test in results[lib]) {
    var ops = results[lib][test].opsPerSecond.toLocaleString();
    row.push(ops + ' ops/s');
  }
  tableRows.push(row);
}

// Print table
console.log('\n📈 Operations per Second (Higher is Better):');
console.log('-'.repeat(80));
console.log(tableHeaders.map(h => h.padEnd(20)).join(' | '));
console.log('-'.repeat(80));

for (var i = 0; i < tableRows.length; i++) {
  console.log(tableRows[i].map(cell => cell.padEnd(20)).join(' | '));
}

// Detailed results
console.log('\n📋 Detailed Results:');
console.log('-'.repeat(80));

for (var lib in results) {
  console.log(`\n🔍 ${lib}:`);
  for (var test in results[lib]) {
    var result = results[lib][test];
    console.log(`  ${test}: ${result.opsPerSecond.toLocaleString()} ops/s (${result.avgTime.toFixed(4)}ms avg)`);
  }
}

// Performance analysis
console.log('\n🎯 Performance Analysis:');
console.log('-'.repeat(80));

// Find fastest for each test
for (var test in testConfigs) {
  var testName = testConfigs[test].name;
  var fastest = { lib: '', ops: 0 };
  
  for (var lib in results) {
    if (results[lib][testName] && results[lib][testName].opsPerSecond > fastest.ops) {
      fastest.lib = lib;
      fastest.ops = results[lib][testName].opsPerSecond;
    }
  }
  
  console.log(`🏆 Fastest for "${testName}": ${fastest.lib} (${fastest.ops.toLocaleString()} ops/s)`);
}

// Bundle size comparison
console.log('\n📦 Bundle Size Comparison:');
console.log('-'.repeat(80));

var bundleSizes = {
  '@onurege3467/log': '21.4KB',
  'winston': '~500KB',
  'pino': '~200KB',
  'debug': '~50KB',
  'console.log': '0KB (native)'
};

for (var lib in bundleSizes) {
  console.log(`${lib}: ${bundleSizes[lib]}`);
}

// Memory usage
console.log('\n💾 Memory Usage:');
console.log('-'.repeat(80));
var memUsage = process.memoryUsage();
console.log(`Current memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

console.log('\n' + '='.repeat(80));
console.log('✅ Benchmark completed!');
console.log('='.repeat(80));
