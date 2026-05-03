import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  
  if (content.includes('drawCatalogSticker') && !content.includes('drawFallbackSticker')) {
    console.error('❌ FAIL: frame-system.jsx calls drawCatalogSticker but missing drawFallbackSticker definition');
    hasErrors = true;
  }
  
  // Check if preset branch has try/catch
  if (content.includes('if (sticker.kind === \'preset\')') && !content.includes('try {') && !content.includes('catch (err)')) {
    console.error('❌ FAIL: frame-system.jsx preset branch is missing try/catch wrapper');
    hasErrors = true;
  }
  
  if (content.includes('Caveat, cursive') && content.includes('template.date.fontSize')) {
    console.error('❌ FAIL: frame-system.jsx uses Caveat font for polaroid date. Use Pretendard/Plus Jakarta Sans.');
    hasErrors = true;
  }

  if (!content.includes('"Plus Jakarta Sans", Pretendard') && !content.includes('Pretendard, "Plus Jakarta Sans"')) {
    console.error('❌ FAIL: frame-system.jsx date font missing Plus Jakarta Sans.');
    hasErrors = true;
  }

  if (!/async\s+function\s+drawStickerToCtx[\s\S]*sticker\.sizeNorm/.test(content)) {
    console.error('❌ FAIL: frame-system.jsx drawStickerToCtx must reference sticker.sizeNorm');
    hasErrors = true;
  }

  if (!/const\s+targetW\s*=\s*actualSizeNorm\s*\?\s*baseW\s*\*\s*actualSizeNorm/.test(content)) {
    console.error('❌ FAIL: frame-system.jsx drawStickerToCtx must derive export sticker width from baseW * sizeNorm');
    hasErrors = true;
  }

  if (/drawCatalog\(ctx,\s*item,\s*scalePx\)/.test(content)) {
    console.error('❌ FAIL: frame-system.jsx preset draw path still passes scalePx after ctx scale; this can double-scale stickers');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;

  if (!content.includes('function getStickerHitboxSize')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getStickerHitboxSize helper');
    hasErrors = true;
  }
  
  if (!content.includes('function getCatalogStickerBaseSize')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getCatalogStickerBaseSize helper');
    hasErrors = true;
  }

  if (content.includes('return 72;') || content.includes('return 72')) {
    console.error('❌ FAIL: sticker-engine.jsx getStickerHitboxSize still uses scalar return 72 fallback instead of {w, h}');
    hasErrors = true;
  }
  
  if (content.includes('width: hideVisuals ? getStickerHitboxSize(s) :')) {
    console.error('❌ FAIL: sticker-engine.jsx uses raw getStickerHitboxSize(s) scalar for width/height');
    hasErrors = true;
  }
  
  if (content.includes('height: hideVisuals ? getStickerHitboxSize(s) :')) {
    console.error('❌ FAIL: sticker-engine.jsx uses raw getStickerHitboxSize(s) scalar for width/height');
    hasErrors = true;
  }

  // Check if hideVisuals wrapper is hiding controls
  if (content.includes('opacity: hideVisuals ? 0 : 1') && content.match(/opacity:\s*hideVisuals\s*\?\s*0\s*:\s*1[^>]*>\s*\{renderStickerInstance[^}]*\}\s*\{renderStickerControls/)) {
    console.error('❌ FAIL: sticker-engine.jsx wrapper opacity 0 hides interaction controls');
    hasErrors = true;
  }

  // Check if controls are fixed size (using invScale)
  if (!content.includes('1 / (s.scale || 1)') && !content.includes('invScale')) {
    console.warn('⚠️ WARN: sticker-engine.jsx renderStickerControls may be scaling with sticker. Need inverse scale.');
    hasWarnings = true;
  }

  // Check getStickerVisualBounds exists
  if (!content.includes('function getStickerVisualBounds')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getStickerVisualBounds helper');
    hasErrors = true;
  }

  // Check getStickerVisualBounds returns {w,h}
  if (content.includes('function getStickerVisualBounds') && !content.includes('return { w:') && !content.includes('return {w:')) {
    console.error('❌ FAIL: sticker-engine.jsx getStickerVisualBounds does not return {w,h} objects');
    hasErrors = true;
  }

  // Check m-immm-logo exists in STICKER_CATALOG
  if (!content.includes("'m-immm-logo'")) {
    console.error('❌ FAIL: sticker-engine.jsx Minimal pack missing m-immm-logo item');
    hasErrors = true;
  }

  // kretro must be hidden
  if (content.includes("id: 'kretro'") && !content.includes('hidden: true')) {
    console.error('❌ FAIL: sticker-engine.jsx kretro pack is not hidden');
    hasErrors = true;
  }

  // getInteractionBounds must exist
  if (!content.includes('function getInteractionBounds')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getInteractionBounds helper');
    hasErrors = true;
  }

  // getInteractionBounds must apply decoScale in deco-overlay mode
  if (content.includes('function getInteractionBounds') &&
      !content.includes('decoScale?.x') && !content.includes('decoScale.x')) {
    console.error('❌ FAIL: sticker-engine.jsx getInteractionBounds does not apply decoScale.x');
    hasErrors = true;
  }
  
  if (content.includes('function getInteractionBounds')) {
    if (!content.includes('getInteractionBounds(sticker, mode, decoScale, canvasW)')) {
      console.error('❌ FAIL: sticker-engine.jsx getInteractionBounds must accept canvasW in signature');
      hasErrors = true;
    }
    if (!content.includes('sticker.sizeNorm') || !content.includes('canvasW')) {
      console.error('❌ FAIL: sticker-engine.jsx getInteractionBounds must use sizeNorm and canvasW');
      hasErrors = true;
    }
    if (content.includes('const visualW = raw.w * (decoScale?.x || 1);') || content.includes('let visualW = raw.w * (decoScale?.x || 1);')) {
      console.error('❌ FAIL: sticker-engine.jsx getInteractionBounds relies purely on decoScale without sizeNorm');
      hasErrors = true;
    }
    if (!content.includes('visualW') || !content.includes('visualH')) {
      console.warn('⚠️ WARN: sticker-engine.jsx getInteractionBounds should return visualW/visualH for outline box');
      hasWarnings = true;
    }
    if (!content.includes('Math.max(24') && !content.includes('Math.max( 24') && !content.includes('Math.max(visualW, 24)') && !content.includes('Math.max(24, visualW)')) {
      console.warn('⚠️ WARN: sticker-engine.jsx getInteractionBounds should ensure hit target is at least 24px');
      hasWarnings = true;
    }
  }

  if (content.includes('function renderStickerInstance') && content.includes('renderLibSticker(item, 1)')) {
    console.error('❌ FAIL: sticker-engine.jsx renderStickerInstance preset path ignores scaleMul parameter');
    hasErrors = true;
  }

  if (!content.includes('function getDefaultStickerSizeNorm')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getDefaultStickerSizeNorm helper');
    hasErrors = true;
  }

  if (!/function\s+makeSticker[\s\S]*sizeNorm:\s*opts\.sizeNorm\s*\?\?\s*defaultSizeNorm/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx makeSticker must persist sizeNorm on created stickers');
    hasErrors = true;
  }

  if (!/const\s+visualScale\s*=\s*getStickerNormScale\(s,\s*canvasW\)/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx StickerCanvas visual size must derive from sizeNorm via getStickerNormScale');
    hasErrors = true;
  }

  if (/effectiveScale\s*=\s*\(s\.scale\s*\|\|\s*1\)\s*\*\s*normScale/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx StickerCanvas still multiplies sizeNorm into wrapper transform');
    hasErrors = true;
  }

  if (/hitbox\.(w|h)\s*\/\s*normScale/.test(content) || /visualW\s*\/\s*normScale/.test(content) || /visualH\s*\/\s*normScale/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx StickerCanvas still compensates hitbox/outline by dividing through normScale');
    hasErrors = true;
  }

  // StickerCanvas must default mode='default' and decoScale={x:1,y:1}
  if (!content.includes("mode = 'default'")) {
    console.warn('⚠️ WARN: sticker-engine.jsx StickerCanvas mode default is not \'default\'');
    hasWarnings = true;
  }
  if (!content.includes("decoScale = { x: 1, y: 1 }")) {
    console.warn('⚠️ WARN: sticker-engine.jsx StickerCanvas decoScale default is not {x:1, y:1}');
    hasWarnings = true;
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

function checkRuntimeBootGuards() {
  const screens = readFile('screens-v2.jsx');
  const main = readFile('main.jsx');
  if (!screens || !main) return;

  if (/canvasW=\{frameW\}\s*\n\s*\}\s*height/.test(screens)) {
    console.error('❌ FAIL: screens-v2.jsx contains stray JSX brace after canvasW={frameW}');
    hasErrors = true;
  }

  const suspiciousPropBrace = /[A-Za-z0-9_$-]+=\{[^}\n]+\}\s*\n\s*\}\s+height=\{/;
  if (suspiciousPropBrace.test(screens)) {
    console.error('❌ FAIL: screens-v2.jsx contains suspicious "} height={" JSX prop pattern');
    hasErrors = true;
  }

  if (main.includes('<ScreenTransition')) {
    const hasDefinition =
      /function\s+ScreenTransition\s*\(/.test(screens) ||
      /const\s+ScreenTransition\s*=/.test(screens) ||
      /window\.ScreenTransition\s*=/.test(screens) ||
      /Object\.assign\(window,[\s\S]*ScreenTransition/.test(screens);
    if (!hasDefinition) {
      console.error('❌ FAIL: main.jsx uses <ScreenTransition> but no ScreenTransition definition/export was found');
      hasErrors = true;
    }
  }
}

function checkSetupAndDecoStickerCanvas() {
  const setup = readFile('screens-v2.jsx');
  const deco = readFile('screens-v2-deco.jsx');
  if (!setup || !deco) return;

  if (!/<StickerCanvas[\s\S]*canvasW=\{frameW\}/.test(setup)) {
    console.error('❌ FAIL: screens-v2.jsx SetupScreen StickerCanvas must receive canvasW={frameW}');
    hasErrors = true;
  }

  if (!/<StickerCanvas[\s\S]*canvasW=\{frameW\}/.test(deco)) {
    console.error('❌ FAIL: screens-v2-deco.jsx Deco StickerCanvas must receive canvasW={frameW}');
    hasErrors = true;
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

  // 4. StickerCanvas must use mode="deco-overlay"
  if (!content.includes('mode="deco-overlay"') && !content.includes("mode='deco-overlay'")) {
    console.error('❌ FAIL: screens-v2-deco.jsx StickerCanvas missing mode="deco-overlay" prop');
    hasErrors = true;
  }

  // 5. Pack expander UI
  if (!content.includes('pack.items.slice(0, 5)') && !content.includes('slice(0,5)')) {
    console.warn('⚠️ WARN: screens-v2-deco.jsx sticker picker missing pack expander (show 5 + button)');
    hasWarnings = true;
  }

  // 6. decoScale must be computed and passed to StickerCanvas
  if (!content.includes('decoScale')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing decoScale state/computation');
    hasErrors = true;
  }
  if (!content.includes('canvasSize.width') && !content.includes('canvasSize?.width')) {
    console.error('❌ FAIL: screens-v2-deco.jsx decoScale does not reference template.canvasSize.width');
    hasErrors = true;
  }
  if (!content.includes('decoScale={decoScale}')) {
    console.error('❌ FAIL: screens-v2-deco.jsx StickerCanvas missing decoScale prop');
    hasErrors = true;
  }
  // y-axis must use explicit cssH = frameW * (baseH / baseW)
  if (!content.includes('cssH') || !content.includes('cssH / baseH')) {
    console.warn('⚠️ WARN: screens-v2-deco.jsx decoScale y-axis should use cssH = frameW * (baseH/baseW); y: cssH/baseH');
    hasWarnings = true;
  }
}

function checkTask() {
  const content = readFile('task.md');
  if (!content) return;
  
  if (content.includes('[x] PR 5 — Mobile opt-in')) {
    console.error('❌ FAIL: task.md has "[x] PR 5 — Mobile opt-in" marked as complete. It must be [~] until real device QA passes.');
    hasErrors = true;
  }
  
  if (content.includes('commit 99c50f0') && content.includes('Pass/Fail: Pass')) {
    console.warn('⚠️ WARN: task.md contains QA Pass log for commit 99c50f0, which lacked sizeNorm implementation');
    hasWarnings = true;
  }

  let head = null;
  try {
    head = execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    head = null;
  }

  if (head) {
    const passLogs = [...content.matchAll(/###\s+\d{4}-\d{2}-\d{2}[^\n]*commit\s+([a-f0-9]+)[\s\S]*?- Pass\/Fail:\s*Pass/g)];
    for (const match of passLogs) {
      const sha = match[1];
      if (sha !== head && !head.startsWith(sha) && !sha.startsWith(head)) {
        console.warn(`⚠️ WARN: task.md contains Pass QA log for old commit ${sha}; current HEAD is ${head}`);
        hasWarnings = true;
      }
    }
  }
}

console.log('🔍 Running IMMM Sanity Checks...');
checkWebGL();
checkFrameSystem();
checkStickerEngine();
checkCapture();
checkRuntimeBootGuards();
checkSetupAndDecoStickerCanvas();
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
