/**
 * Node CLI Test Runner for CelebraAI
 * Runs all 13 automated tests headlessly and prints results with exit codes.
 */

const fs = require('fs');
const path = require('path');

// Mock browser globals for headless testing
global.window = {};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.performance = { now: () => Date.now() };

// Load modules in order
const baseDir = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(baseDir, 'scripts', 'state.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'scripts', 'ai-generator.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'scripts', 'budget.js'), 'utf8'));
eval(fs.readFileSync(path.join(baseDir, 'scripts', 'test-suite.js'), 'utf8'));

console.log('\n⚡ Running CelebraAI Automated Test Suite in Node.js...\n');

window.testRunner.runAll().then(results => {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  results.forEach(r => {
    const symbol = r.passed ? '✓' : '✗';
    const tag = `[${r.category}]`;
    console.log(`${symbol} ${tag.padEnd(16)} ${r.name.padEnd(52)} (${r.duration}ms)`);
    if (r.error) {
      console.error(`  ↳ Error: ${r.error}`);
    }
  });

  console.log(`\n======================================================`);
  console.log(`  Tests: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
