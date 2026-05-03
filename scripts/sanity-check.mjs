import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readFile(filename) {
  try {
    return fs.readFileSync(path.join(rootDir, filename), 'utf8');
  } catch (err) {
    console.error(`❌ Could not read ${filename}`);
    return null;
  }
}

let hasErrors = false;
let hasWarnings = false;

function checkWebGL() {
  const content = readFile('webgl-engine.jsx');
  if (!content) return;
  if (content.includes('mobileRef')) {
    console.error('❌ FAIL: webgl-engine.jsx contains "mobileRef"');
    hasErrors = true;
  }
}

function checkCapture() {
  const content = readFile('screens-v2-rest.jsx');
  if (!content) return;
  // Look for <CaptureOverlay ... frameColor={frameColor}
  // Using a regex to see if frameColor={frameColor} exists, avoiding safeFrameColor
  if (/<CaptureOverlay[^>]*frameColor=\{frameColor\}/.test(content)) {
    console.warn('⚠️ WARN: screens-v2-rest.jsx passes frameColor directly without safeFrameColor fallback to CaptureOverlay');
    hasWarnings = true;
  }
}

function checkDeco() {
  const content = readFile('screens-v2-deco.jsx');
  if (!content) return;
  
  // 1. ctx / offscreen precision check
  const requiredCtxPatterns = [
    'const cvs = compositionCanvasRef.current;',
    "const ctx = cvs.getContext('2d');",
    'if (!ctx) return;',
    "const off = document.createElement('canvas');",
    "const offCtx = off.getContext('2d');",
    'if (!offCtx) return;',
    'ctx.drawImage(off, 0, 0);'
  ];
  for (const pattern of requiredCtxPatterns) {
    if (!content.includes(pattern)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx is missing required async render guard pattern: "${pattern}"`);
      hasErrors = true;
    }
  }

  // 2. Pointer event check
  const requiredPointer = [
    'onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel',
    'setPointerCapture', 'releasePointerCapture'
  ];
  for (const ev of requiredPointer) {
    if (!content.includes(ev)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx is missing pointer event requirement: "${ev}"`);
      hasErrors = true;
    }
  }
  
  const forbiddenEvents = [
    'onPointerLeave={onDrawEnd}',
    'onTouchStart', 'onTouchMove', 'onTouchEnd'
  ];
  for (const ev of forbiddenEvents) {
    if (content.includes(ev)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains forbidden event: "${ev}"`);
      hasErrors = true;
    }
  }

  // 3. fontsReady check
  const requiredFonts = [
    'const [fontsReady, setFontsReady]',
    'document.fonts',
    '!fontsReady',
    'fontsReady' // Should ideally check inside dependency array, but testing presence is a good start
  ];
  for (const p of requiredFonts) {
    if (!content.includes(p)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx is missing fontsReady logic: "${p}"`);
      hasErrors = true;
    }
  }

  if (/draw\(\);\s*(const|let|var)\s+raf\s*=\s*requestAnimationFrame\(draw\)/.test(content)) {
    console.error('❌ FAIL: screens-v2-deco.jsx contains double render pattern "draw(); const raf = requestAnimationFrame(draw)"');
    hasErrors = true;
  }
}

function checkTask() {
  const content = readFile('task.md');
  if (!content) return;
  
  if (content.includes('[x] PR 5 — Mobile opt-in')) {
    console.error('❌ FAIL: task.md has "[x] PR 5 — Mobile opt-in" marked as complete. It must be [~] until real device QA passes.');
    hasErrors = true;
  }
}

console.log('🔍 Running IMMM Sanity Checks...');
checkWebGL();
checkCapture();
checkDeco();
checkTask();

if (hasErrors) {
  console.error('\n💥 Sanity check failed! Fix the errors above before committing.');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️ Sanity check passed with warnings. Please review them.');
} else {
  console.log('\n✅ All sanity checks passed.');
}
