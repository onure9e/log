/**
 * Benchmark Test Suite for @onurege3467/log vs Popular Alternatives
 * 
 * This benchmark compares the performance of different logging libraries:
 * - @onurege3467/log (our library)
 * - winston (most popular)
 * - pino (fastest JSON logger)
 * - debug (lightweight)
 * - console.log (native)
 */

var fs = require('fs');
var path = require('path');

// Try to load alternative libraries
var alternatives = {};

try {
  alternatives.winston = require('winston');
} catch (e) {
  console.log('⚠️  winston not installed, skipping...');
}

try {
  alternatives.pino = require('pino');
} catch (e) {
  console.log('⚠️  pino not installed, skipping...');
}

try {
  alternatives.debug = require('debug');
} catch (e) {
  console.log('⚠️  debug not installed, skipping...');
}

// Our library
var CustomLogger = require('../dist/index').default;

console.log('🚀 Starting Benchmark Test Suite...\n');

// Test configurations
var testConfigs = [
  { name: 'Simple String', message: 'Hello World', metadata: null },
  { name: 'With Metadata', message: 'User login', metadata: { userId: 12345, ip: '192.168.1.1' } },
  { name: 'Complex Metadata', message: 'API Request', metadata: { 
    method: 'POST', 
    path: '/api/users', 
    headers: { 'content-type': 'application/json' },
    body: { name: 'John Doe', email: 'john@example.com' }
  }},
  { name: 'Long Message', message: 'A'.repeat(1000), metadata: null },
  { name: 'Deep Object', message: 'Complex data', metadata: {
    nested: {
      level1: {
        level2: {
          level3: {
            data: 'deep value',
            array: [1, 2, 3, 4, 5],
            object: { key: 'value' }
          }
        }
      }
    }
  }}
];

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
    console.log(message, metadata ? JSON.stringify(metadata) : '');
  };
};

// Winston
if (alternatives.winston) {
  testFunctions['winston'] = function() {
    var logger = alternatives.winston.createLogger({
      level: 'info',
      format: alternatives.winston.format.simple(),
      transports: [
        new alternatives.winston.transports.Console()
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
    var logger = alternatives.pino();
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
      debug(message, metadata ? JSON.stringify(metadata) : '');
    };
  };
}

// Run benchmarks
var results = {};
var iterations = 10000;

console.log(`📊 Running benchmarks with ${iterations.toLocaleString()} iterations each...\n`);

// Test each library
for (var libName in testFunctions) {
  console.log(`Testing ${libName}...`);
  results[libName] = {};
  
  for (var i = 0; i < testConfigs.length; i++) {
    var config = testConfigs[i];
    var loggerFn = testFunctions[libName]();
    
    // Suppress console output during benchmark
    var originalLog = console.log;
    console.log = function() {};
    
    var result = benchmark(
      config.name,
      function() {
        loggerFn(config.message, config.metadata);
      },
      iterations
    );
    
    console.log = originalLog;
    results[libName][config.name] = result;
  }
}

// Display results
console.log('\n' + '='.repeat(80));
console.log('🏆 BENCHMARK RESULTS');
console.log('='.repeat(80));

// Create comparison table
var tableHeaders = ['Library', 'Simple String', 'With Metadata', 'Complex Metadata', 'Long Message', 'Deep Object'];
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
console.log('-'.repeat(100));
console.log(tableHeaders.map(h => h.padEnd(20)).join(' | '));
console.log('-'.repeat(100));

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

// Memory usage comparison
console.log('\n💾 Memory Usage Comparison:');
console.log('-'.repeat(80));

var memUsage = process.memoryUsage();
console.log(`Current memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);

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

console.log('\n' + '='.repeat(80));
console.log('✅ Benchmark completed!');
console.log('='.repeat(80));
