#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function readFile(filename) {
  try {
    return fs.readFileSync(path.join(rootDir, filename), 'utf8');
  } catch (err) {
    return null;
  }
}

let hasErrors = false;

console.log('🔥 Running RC Smoke Tests...\n');

// 1. release-manifest.json valid JSON
const manifest = readFile('release-manifest.json');
if (!manifest) {
  console.error('❌ SMOKE-1: release-manifest.json not found');
  hasErrors = true;
} else {
  try {
    JSON.parse(manifest);
    console.log('✅ SMOKE-1: release-manifest.json valid JSON');
  } catch (e) {
    console.error('❌ SMOKE-1: release-manifest.json invalid JSON:', e.message);
    hasErrors = true;
  }
}

// 2. dist/release-manifest.json valid JSON
const distManifest = readFile('dist/release-manifest.json');
if (!distManifest) {
  console.error('❌ SMOKE-2: dist/release-manifest.json not found');
  hasErrors = true;
} else {
  try {
    JSON.parse(distManifest);
    console.log('✅ SMOKE-2: dist/release-manifest.json valid JSON');
  } catch (e) {
    console.error('❌ SMOKE-2: dist/release-manifest.json invalid JSON:', e.message);
    hasErrors = true;
  }
}

// 3. manifest cache and sw CACHE_NAME major version match
if (manifest && readFile('sw.js')) {
  try {
    const m = JSON.parse(manifest);
    const swContent = readFile('sw.js');
    const cacheMatch = swContent.match(/const CACHE_NAME = '([^']+)'/);
    const swCacheName = cacheMatch ? cacheMatch[1] : '';
    if (swCacheName.includes(m.cache)) {
      console.log(`✅ SMOKE-3: Cache versions match (${m.cache})`);
    } else {
      console.error(`❌ SMOKE-3: Cache mismatch — manifest cache:${m.cache}, sw:${swCacheName}`);
      hasErrors = true;
    }
  } catch (e) {
    console.error('❌ SMOKE-3: Cache comparison failed');
    hasErrors = true;
  }
}

// 4. index.html has no @babel/standalone
const indexHtml = readFile('index.html');
if (indexHtml && indexHtml.includes('@babel/standalone')) {
  console.error('❌ SMOKE-4: index.html contains @babel/standalone (must be precompiled)');
  hasErrors = true;
} else {
  console.log('✅ SMOKE-4: index.html precompiled (no @babel/standalone)');
}

// 5. dist main files exist
const distFiles = ['app.js', 'main.js', 'screens-v2-deco.js', 'screens-v2-rest.js'];
let distOk = true;
distFiles.forEach(f => {
  const content = readFile(`dist/${f}`);
  if (!content) {
    console.error(`❌ SMOKE-5: dist/${f} missing`);
    distOk = false;
    hasErrors = true;
  }
});
if (distOk) console.log('✅ SMOKE-5: All dist main files exist');

// 6. fake immm.io URL check
const shareFiles = ['screens-v2-deco.jsx', 'dist/screens-v2-deco.js'];
let noFakeUrl = true;
shareFiles.forEach(f => {
  const content = readFile(f);
  if (content && content.includes('immm.io/share')) {
    console.error(`❌ SMOKE-6: ${f} contains fake immm.io/share URL`);
    noFakeUrl = false;
    hasErrors = true;
  }
});
if (noFakeUrl) console.log('✅ SMOKE-6: No fake immm.io URLs found');

// 7. localStorage.clear / sessionStorage.clear check
const srcFiles = ['main.jsx', 'screens-v2-deco.jsx', 'screens-v2-rest.jsx'];
let noClear = true;
srcFiles.forEach(f => {
  const content = readFile(f);
  if (content) {
    const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
    const codeOnly = lines.join('\n');
    if (codeOnly.includes('localStorage.clear()') || codeOnly.includes('sessionStorage.clear()')) {
      console.error(`❌ SMOKE-7: ${f} contains localStorage.clear() or sessionStorage.clear()`);
      noClear = false;
      hasErrors = true;
    }
  }
});
if (noClear) console.log('✅ SMOKE-7: No localStorage.clear() or sessionStorage.clear() found');

// 8. pgpt file check
let noPgpt = true;
try {
  const files = fs.readdirSync(rootDir, { recursive: true, encoding: 'utf8' });
  files.forEach(f => {
    if ((f.includes('pgpt.mjs') || f.includes('pgpt_daemon') || f.includes('pgpt')) && !f.includes('scripts/rc-smoke')) {
      console.error(`❌ SMOKE-8: stray pgpt file found: ${f}`);
      noPgpt = false;
      hasErrors = true;
    }
  });
  if (noPgpt) console.log('✅ SMOKE-8: No pgpt stray files');
} catch (e) {
  console.warn('⚠️  SMOKE-8: Could not scan for pgpt files');
}

// 9. dist/main.js syntax check
const distMain = readFile('dist/main.js');
if (distMain) {
  try {
    new vm.Script(distMain);
    console.log('✅ SMOKE-9: dist/main.js syntax valid');
  } catch (e) {
    console.error('❌ SMOKE-9: dist/main.js syntax error:', e.message.split('\n')[0]);
    hasErrors = true;
  }
} else {
  console.error('❌ SMOKE-9: dist/main.js not found');
  hasErrors = true;
}

// 10. dist/screens-v2-deco.js syntax check
const distDeco = readFile('dist/screens-v2-deco.js');
if (distDeco) {
  try {
    new vm.Script(distDeco);
    console.log('✅ SMOKE-10: dist/screens-v2-deco.js syntax valid');
  } catch (e) {
    console.error('❌ SMOKE-10: dist/screens-v2-deco.js syntax error:', e.message.split('\n')[0]);
    hasErrors = true;
  }
} else {
  console.error('❌ SMOKE-10: dist/screens-v2-deco.js not found');
  hasErrors = true;
}

console.log('\n' + (hasErrors ? '💥 Smoke test failed!' : '✅ RC smoke test passed!'));
process.exit(hasErrors ? 1 : 0);
