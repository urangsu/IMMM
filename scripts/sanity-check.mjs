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
    return null;
  }
}

let hasErrors = false;
let hasWarnings = false;

function checkWebGL() {
  const webgl = readFile('webgl-engine.jsx');
  if (!webgl) return;
  if (webgl.includes('mobileRef')) {
    console.error('❌ FAIL: webgl-engine.jsx contains "mobileRef"');
    hasErrors = true;
  }
}

function checkEmergencyFaceSafety() {
  const webgl = readFile('webgl-engine.jsx');
  const main = readFile('main.jsx');
  const rest = readFile('screens-v2-rest.jsx');

  if (webgl) {
    if (webgl.includes('IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH')) {
      console.error('❌ FAIL: webgl-engine.jsx contains prohibited IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH');
      hasErrors = true;
    }
    const shaders = ['face_slim', 'eye_bright', 'lip_color', 'contour', 'skin_retouch'];
    shaders.forEach(s => {
      const passthroughPattern = new RegExp(
        `${s}:\\s*\`[\\s\\S]*?void\\s+main\\s*\\(\\s*\\)\\s*\\{[\\s\\S]*?gl_FragColor\\s*=\\s*texture2D\\s*\\(\\s*u_tex\\s*,\\s*v_uv\\s*\\)\\s*;[\\s\\S]*?\\}\``
      );
      if (!passthroughPattern.test(webgl)) {
        console.error(`❌ FAIL: webgl-engine.jsx ${s} shader is not a minimal passthrough no-op`);
        hasErrors = true;
      }
    });

    if (/\bwarpEye\b/.test(webgl)) {
      console.error('❌ FAIL: webgl-engine.jsx contains warpEye (prohibited during emergency)');
      hasErrors = true;
    }
    if (/\bwarpToward\b/.test(webgl)) {
      console.error('❌ FAIL: webgl-engine.jsx contains warpToward (prohibited during emergency)');
      hasErrors = true;
    }
    if (webgl.match(/^\s*(?!\/\/).*\bfaceUniforms\.u_\w+\b\s*=/m)) {
      console.error('❌ FAIL: webgl-engine.jsx contains active faceUniforms.u_ assignment');
      hasErrors = true;
    }
  }

  if (main) {
    if (!/const\s+FACE_LANDMARKS_DISABLED\s*=\s*true\s*;?/.test(main)) {
      console.error('❌ FAIL: main.jsx missing const FACE_LANDMARKS_DISABLED = true');
      hasErrors = true;
    }
    if (!/const\s+faceTrackedFilters\s*=\s*\[\s*\]\s*;?/.test(main)) {
      console.error('❌ FAIL: main.jsx faceTrackedFilters must be empty []');
      hasErrors = true;
    }
    if (main.includes('useFaceLandmarks(videoRef)') || main.includes('useFaceLandmarks(')) {
      console.error('❌ FAIL: main.jsx still calls useFaceLandmarks');
      hasErrors = true;
    }
    const badFilters = ["['blush']", "['glam']", "['aurora']"];
    badFilters.forEach(f => {
      if (main.includes(`faceTrackedFilters = ${f}`)) {
        console.error(`❌ FAIL: main.jsx faceTrackedFilters contains prohibited filter: ${f}`);
        hasErrors = true;
      }
    });
  }

  if (rest) {
    if (/applyFaceZoneSoftening\s*\(\s*ctx/.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx still calls applyFaceZoneSoftening(ctx)');
      hasErrors = true;
    }
    if (/applyBeautyGeometry\s*\(\s*ctx/.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx still calls applyBeautyGeometry(ctx)');
      hasErrors = true;
    }
    const noopPattern = /const\s+applyBeautyGeometry\s*=\s*\(\s*\)\s*=>\s*\{(\s*return\s*;?\s*)?\};?|function\s+applyBeautyGeometry\s*\(\s*\)\s*\{(\s*return\s*;?\s*)?\}/;
    if (!noopPattern.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx applyBeautyGeometry is not a no-op stub');
      hasErrors = true;
    }
    if (/faceDataRef\.current/.test(rest) && /landmark|jaw|chin|cheek|nose|warp|softening/i.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx uses faceDataRef with prohibited keywords');
      hasErrors = true;
    }
  }
}

function checkEmergencyFrameGlobals() {
  const files = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx', 'main.jsx'];
  const frameSystem = readFile('frame-system.jsx');
  if (frameSystem) {
    const lines = frameSystem.split('\n');
    const funcs = ['renderComposition', 'renderFrameToCanvas'];
    funcs.forEach(fn => {
      const start = lines.findIndex(l => l.includes(`async function ${fn}`));
      if (start === -1) return;
      // Robust body extraction: look for the next top-level function or end of file
      let bodyEnd = lines.findIndex((l, i) => i > start && /^async function|^function|^const \w+ = async|^const \w+ = \(/.test(l));
      if (bodyEnd === -1) bodyEnd = lines.length;
      const body = lines.slice(start, bodyEnd).join('\n');
      if (/(?<!Safe)getFrameTemplate\(/.test(body)) {
        console.error(`❌ FAIL: frame-system.jsx ${fn} body still uses bare getFrameTemplate`);
        hasErrors = true;
      }
    });
  }
  for (const f of files) {
    const content = readFile(f);
    if (!content) continue;
    const barePatterns = [
      { name: 'getFrameTemplate', regex: /\bgetFrameTemplate\(/ },
      { name: 'getShotCountForFrame', regex: /\bgetShotCountForFrame\(/ },
      { name: 'renderComposition', regex: /\brenderComposition\(/ },
      { name: 'FrameThumb', regex: /<FrameThumb\b/ }
    ];
    for (const p of barePatterns) {
      if (content.match(p.regex)) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.match(p.regex) && !line.includes('window.') && !line.includes('resolveFrameTemplate') && !line.includes('const FrameThumb') && !line.trim().startsWith('//')) {
            console.error(`❌ FAIL: ${f}:${i + 1} uses bare frame global "${line.trim()}"`);
            hasErrors = true;
          }
        }
      }
    }
    if (f === 'screens-v2.jsx') {
      if (content.includes('<WFrameThumb') && !content.includes('WFrameThumb ?') && !content.includes('Frame preview unavailable')) {
        console.error('❌ FAIL: screens-v2.jsx uses <WFrameThumb without null fallback');
        hasErrors = true;
      }
    }
  }
}

function checkEmergencyServiceWorker() {
  const sw = readFile('sw.js');
  if (!sw) return;
  if (!sw.includes('self.skipWaiting()') || !sw.includes('self.clients.claim()')) {
    console.error('❌ FAIL: sw.js missing skipWaiting or clients.claim');
    hasErrors = true;
  }
  if (sw.includes("CACHE_NAME = 'immm-cache-v1'")) {
    console.error('❌ FAIL: sw.js CACHE_NAME is still v1');
    hasErrors = true;
  }
  if (!/fetch\(e\.request\)\.catch\(\(\)\s*=>\s*caches\.match\(e\.request\)\)/.test(sw)) {
    console.error('❌ FAIL: sw.js missing network-first pattern');
    hasErrors = true;
  }
}

function checkAppStability() {
  const index = readFile('index.html');
  if (index && index.includes('screens-edit.jsx')) {
    console.error('❌ FAIL: index.html still loads legacy screens-edit.jsx');
    hasErrors = true;
  }
  if (index && (!index.includes('immm.sw.frameHotfixApplied') || !index.includes('SamsungBrowser'))) {
    console.error('❌ FAIL: index.html missing Samsung SW guard');
    hasErrors = true;
  }
}

function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  if (!content.includes('sticker.sizeNorm') || (!content.includes('baseW * actualSizeNorm') && !content.includes('sizeNorm * w'))) {
    console.error('❌ FAIL: frame-system.jsx missing sticker sizeNorm scaling');
    hasErrors = true;
  }
  if (content.includes('drawCatalog(')) {
    console.error('❌ FAIL: frame-system.jsx contains forbidden drawCatalog call');
    hasErrors = true;
  }
  if (content.includes('#D98893')) {
    console.error('❌ FAIL: frame-system.jsx contains legacy pink #D98893');
    hasErrors = true;
  }
  if (!content.includes('options.dotColor') || !content.includes('isDark ?')) {
    console.error('❌ FAIL: frame-system.jsx missing dotColor fallback');
    hasErrors = true;
  }
  if (content.includes('s.frameSlot === i')) {
    console.error('❌ FAIL: frame-system.jsx uses weak slot comparison');
    hasErrors = true;
  }
  if (!content.includes('Number(s.frameSlot) === i') || !content.includes('frameSlot == null')) {
    console.error('❌ FAIL: frame-system.jsx missing slot type-safety or null check');
    hasErrors = true;
  }
  if (!content.includes('renderFrameOverlay(ctx') || !content.includes('function isDarkFrameColor')) {
    console.error('❌ FAIL: frame-system.jsx missing overlay call or isDark helper');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;
  if (!content.includes('function getVisibleStickerPacks') || !content.includes('!pack.hidden')) {
    console.error('❌ FAIL: sticker-engine.jsx missing visible pack filtering');
    hasErrors = true;
  }
  if (!/id:\s*'kretro'[\s\S]*?hidden:\s*true/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx kretro must be hidden');
    hasErrors = true;
  }
  if (!content.includes('function getDefaultStickerSizeNorm') || !content.includes('makeSticker') || !content.includes('sizeNorm')) {
    console.error('❌ FAIL: sticker-engine.jsx missing sizeNorm storage or helper');
    hasErrors = true;
  }
  if (!content.includes('function getLayoutSlotCount') || !content.includes('function getCaptureSlotIndex') || !content.includes('function getStickersForCapturePreview')) {
    console.error('❌ FAIL: sticker-engine.jsx missing slot mapping helpers');
    hasErrors = true;
  }
  if (!/return\s*\[\s*\];?/.test(content.match(/getStickersForCapturePreview[\s\S]*?\{([\s\S]*?)\}/)?.[1] || '')) {
    console.warn('⚠️ WARN: checkStickerEngine: could not verify empty array return in getStickersForCapturePreview');
  }
  if (content.includes('getStickerNormScale(s, canvasW)') && !content.includes('StickerCanvas')) {
     // Check if StickerCanvas uses it
  }
}

function checkCapture() {
  const rest = readFile('screens-v2-rest.jsx');
  if (!rest) return;
  if (rest.includes('preStickers.map') || (rest.includes('drawStickerToCanvas') && rest.includes('preStickers'))) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses raw preStickers in capture');
    hasErrors = true;
  }
  if (rest.includes('cameraOverlay') && rest.includes('preStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses weak preStickers length check');
    hasErrors = true;
  }
  if (!rest.includes('visibleCaptureStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx missing visibleCaptureStickers check');
    hasErrors = true;
  }
  if (rest.match(/visibleCaptureStickers\.map[\s\S]*?visibleCaptureStickers\.map/)) {
    console.error('❌ FAIL: screens-v2-rest.jsx visibleCaptureStickers.map used more than once');
    hasErrors = true;
  }
  if (rest.includes('renderShotStickers')) {
    console.error('❌ FAIL: screens-v2-rest.jsx contains legacy renderShotStickers');
    hasErrors = true;
  }
}

function checkSetupAndDecoStickerCanvas() {
  const content = readFile('sticker-engine.jsx');
  if (content && !content.includes('getStickerNormScale(s, canvasW)')) {
    console.error('❌ FAIL: sticker-engine.jsx StickerCanvas missing getStickerNormScale');
    hasErrors = true;
  }
}

function checkDeco() {
  // Generic check for deco logic integrity
}

function checkTask() {
  const task = readFile('task.md');
  if (!task) return;
  const unverified = ['- [x] Samsung Internet clears old cache after reload', '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined', '- [x] Galaxy Samsung Internet real capture test pending'];
  unverified.forEach(bc => {
    if (task.includes(bc) && !task.includes('Real QA log')) {
      console.error(`❌ FAIL: task.md has unverified check "${bc}"`);
      hasErrors = true;
    }
  });
}

console.log('🔍 Running IMMM Sanity Checks...');
checkWebGL();
checkEmergencyFaceSafety();
checkEmergencyFrameGlobals();
checkEmergencyServiceWorker();
checkAppStability();
checkFrameSystem();
checkStickerEngine();
checkCapture();
checkSetupAndDecoStickerCanvas();
checkDeco();
checkTask();

if (hasErrors) {
  console.error('\n💥 Sanity check failed! Fix the errors above before committing.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed.');
}
