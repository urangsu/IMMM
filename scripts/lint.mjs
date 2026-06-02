import { execSync } from 'node:child_process';
import fs from 'node:fs';
import babel from '@babel/core';

let hasErrors = false;

// 1. JS/MJS files syntax check via node --check
const targetFiles = [
  'scripts/build-precompile.mjs',
  'scripts/sanity-check.mjs',
  'sw.js'
];

console.log('🔍 Linting JS/MJS files with node --check...');
for (const file of targetFiles) {
  try {
    if (fs.existsSync(file)) {
      execSync(`node --check ${file}`, { stdio: 'ignore' });
      console.log(`  ✓ ${file} syntax ok`);
    }
  } catch (err) {
    console.error(`  ✗ ${file} syntax check failed!`);
    hasErrors = true;
  }
}

// 2. JSX files parsing check via Babel API
console.log('🔍 Linting JSX files with Babel parse check...');
const jsxFiles = fs.readdirSync('.').filter(f => f.endsWith('.jsx'));

for (const file of jsxFiles) {
  try {
    babel.transformFileSync(file, {
      presets: [['@babel/preset-react', { runtime: 'classic' }]],
      plugins: ['@babel/plugin-transform-block-scoping'],
      code: false,
      ast: false
    });
    console.log(`  ✓ ${file} parse ok`);
  } catch (err) {
    console.error(`  ✗ ${file} babel check failed!`);
    console.error(err.message);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n💥 Lint check failed! Please fix syntax errors.');
  process.exit(1);
} else {
  console.log('\n✨ Lint check passed successfully.');
}
