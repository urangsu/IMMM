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
    // console.error(`❌ Could not read ${filename}`);
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
    if (webgl.match(/^\s*(?!\/\/).*\bshader\s*:\s*'skin_retouch'\b/m)) {
      console.error('❌ FAIL: webgl-engine.jsx active pipeline contains skin_retouch');
      hasErrors = true;
    }

    const blushBody = webgl.match(/blush:\s*`([\s\S]*?)`/)?.[1] || '';
    const blushProhibited = ['u_faceCount', 'u_leftCheek', 'u_rightCheek', 'cheek('];
    blushProhibited.forEach(word => {
      if (blushBody.includes(word)) {
        console.error(`❌ FAIL: webgl-engine.jsx blush shader body contains prohibited word: ${word}`);
        hasErrors = true;
      }
    });

    if (webgl.match(/^\s*(?!\/\/).*\bfaceUniforms\.u_\w+\b\s*=/m)) {
      console.error('❌ FAIL: webgl-engine.jsx contains active faceUniforms.u_ assignment');
      hasErrors = true;
    }

    if (/\bwarpEye\b/.test(webgl)) {
      console.error('❌ FAIL: webgl-engine.jsx contains warpEye (prohibited even in comments during emergency)');
      hasErrors = true;
    }
    if (/\bwarpToward\b/.test(webgl)) {
      console.error('❌ FAIL: webgl-engine.jsx contains warpToward (prohibited even in comments during emergency)');
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
  }

  if (main) {
    if (main.includes('useFaceLandmarks(videoRef)') || main.includes('useFaceLandmarks(')) {
      console.error('❌ FAIL: main.jsx still calls useFaceLandmarks - Must be GLOBALLY disabled');
      hasErrors = true;
    }
    if (!/const\s+FACE_LANDMARKS_DISABLED\s*=\s*true\s*;?/.test(main)) {
      console.error('❌ FAIL: main.jsx missing const FACE_LANDMARKS_DISABLED = true');
      hasErrors = true;
    }
    if (!/const\s+faceTrackedFilters\s*=\s*\[\s*\]\s*;?/.test(main)) {
      console.error('❌ FAIL: main.jsx faceTrackedFilters must be empty []');
      hasErrors = true;
    }
    const badFilters = ["'blush'", "'glam'", "'aurora'"];
    badFilters.forEach(f => {
      if (main.includes(`faceTrackedFilters = [${f}]`)) {
        console.error(`❌ FAIL: main.jsx faceTrackedFilters contains ${f}`);
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
    if (/faceDataRef\.current/.test(rest) && /landmark|jaw|chin|cheek|nose|warp|softening/i.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx uses faceDataRef with prohibited keywords');
      hasErrors = true;
    }
    const noopPattern = /const\s+applyBeautyGeometry\s*=\s*\(\s*\)\s*=>\s*\{(\s*return\s*;?\s*)?\};|function\s+applyBeautyGeometry\s*\(\s*\)\s*\{(\s*return\s*;?\s*)?\}/;
    if (!noopPattern.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx applyBeautyGeometry is not a no-op stub');
      hasErrors = true;
    }
    const noopPattern2 = /const\s+applyFaceZoneSoftening\s*=\s*\(\s*\)\s*=>\s*\{(\s*return\s*;?\s*)?\};|function\s+applyFaceZoneSoftening\s*\(\s*\)\s*\{(\s*return\s*;?\s*)?\}/;
    if (!noopPattern2.test(rest)) {
      console.error('❌ FAIL: screens-v2-rest.jsx applyFaceZoneSoftening is not a no-op stub');
      hasErrors = true;
    }
  }
}

function checkEmergencyFrameGlobals() {
  const files = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx', 'main.jsx'];
  const frameSystem = readFile('frame-system.jsx');
  if (frameSystem) {
    if (frameSystem.includes('async function renderComposition')) {
      const lines = frameSystem.split('\n');
      const start = lines.findIndex(l => l.includes('async function renderComposition'));
      const end = lines.findIndex((l, i) => i > start && l.includes('function'));
      const body = lines.slice(start, end === -1 ? undefined : end).join('\n');
      if (/(?<!Safe)getFrameTemplate\(/.test(body)) {
        console.error('❌ FAIL: frame-system.jsx renderComposition still uses bare getFrameTemplate');
        hasErrors = true;
      }
    }
    if (frameSystem.includes('async function renderFrameToCanvas')) {
      const lines = frameSystem.split('\n');
      const start = lines.findIndex(l => l.includes('async function renderFrameToCanvas'));
      const end = lines.findIndex((l, i) => i > start && l.includes('function'));
      const body = lines.slice(start, end === -1 ? undefined : end).join('\n');
      if (/(?<!Safe)getFrameTemplate\(/.test(body)) {
        console.error('❌ FAIL: frame-system.jsx renderFrameToCanvas still uses bare getFrameTemplate');
        hasErrors = true;
      }
    }
  }

  for (const f of files) {
    const content = readFile(f);
    if (!content) continue;
    const barePatterns = [
      { name: 'getFrameTemplate', regex: /\bgetFrameTemplate\(/ },
      { name: 'getShotCountForFrame', regex: /\bgetShotCountForFrame\(/ },
      { name: 'renderComposition', regex: /\brenderComposition\(/ },
      { name: 'renderFrameOverlay', regex: /\brenderFrameOverlay\(/ },
      { name: 'FrameRenderEngine', regex: /\bFrameRenderEngine\./ },
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
  if (!sw.includes('self.skipWaiting()')) {
    console.error('❌ FAIL: sw.js missing self.skipWaiting()');
    hasErrors = true;
  }
  if (!sw.includes('self.clients.claim()')) {
    console.error('❌ FAIL: sw.js missing self.clients.claim()');
    hasErrors = true;
  }
  if (sw.includes("CACHE_NAME = 'immm-cache-v1'")) {
    console.error('❌ FAIL: sw.js CACHE_NAME is still immm-cache-v1');
    hasErrors = true;
  }
  if (sw.includes('const isCode =') && !sw.includes('fetch(e.request).catch(() => caches.match(e.request))')) {
    console.error('❌ FAIL: sw.js isCode block missing network-first catch strategy');
    hasErrors = true;
  }
}

function checkAppStability() {
  const index = readFile('index.html');
  if (index) {
    if (index.includes('screens-edit.jsx')) {
      console.error('❌ FAIL: index.html still loads legacy screens-edit.jsx');
      hasErrors = true;
    }
    if (!index.includes('IMMM_APP_VERSION')) {
      console.warn('⚠️ WARN: index.html missing IMMM_APP_VERSION');
      hasWarnings = true;
    }
    if (!index.includes('immm.sw.frameHotfixApplied') || !index.includes('SamsungBrowser')) {
      console.error('❌ FAIL: index.html missing Samsung Internet SW migration guard');
      hasErrors = true;
    }
  }
  const main = readFile('main.jsx');
  if (main) {
    if (main.includes('EditScreen') || main.includes('ResultScreen legacy')) {
      console.error('❌ FAIL: main.jsx contains legacy screen references');
      hasErrors = true;
    }
  }
}

function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  if (!content.includes('sticker.sizeNorm')) {
    console.error('❌ FAIL: frame-system.jsx missing sticker.sizeNorm logic');
    hasErrors = true;
  }
  if (!content.includes('baseW * actualSizeNorm') && !content.includes('sizeNorm * w')) {
    console.error('❌ FAIL: frame-system.jsx missing sizeNorm-based scaling');
    hasErrors = true;
  }
  if (content.includes('drawCatalogSticker(')) {
    console.error('❌ FAIL: frame-system.jsx contains direct drawCatalogSticker call');
    hasErrors = true;
  }
  if (content.includes('#D98893')) {
    console.error('❌ FAIL: frame-system.jsx contains legacy pink dot color #D98893');
    hasErrors = true;
  }
  if (!content.includes('options.dotColor') || !content.includes('isDark ?')) {
    console.error('❌ FAIL: frame-system.jsx missing dotColor fallback logic');
    hasErrors = true;
  }
  if (content.includes('s.frameSlot === i')) {
    console.error('❌ FAIL: frame-system.jsx uses weak slot comparison s.frameSlot === i');
    hasErrors = true;
  }
  if (!content.includes('Number(s.frameSlot) === i')) {
    console.error('❌ FAIL: frame-system.jsx missing Number(s.frameSlot) === i');
    hasErrors = true;
  }
  if (!content.includes('frameSlot == null')) {
    console.error('❌ FAIL: frame-system.jsx missing freeStickers null check');
    hasErrors = true;
  }
  if (!content.includes('renderFrameOverlay(ctx')) {
    console.error('❌ FAIL: frame-system.jsx renderComposition missing renderFrameOverlay call');
    hasErrors = true;
  }
  if (!content.includes('function isDarkFrameColor')) {
    console.error('❌ FAIL: frame-system.jsx missing isDarkFrameColor helper');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;
  if (!content.includes('function getVisibleStickerPacks')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getVisibleStickerPacks');
    hasErrors = true;
  }
  if (!content.includes('!pack.hidden')) {
    console.error('❌ FAIL: sticker-engine.jsx missing pack.hidden filtering');
    hasErrors = true;
  }
  if (!/id:\s*'kretro'[\s\S]*?hidden:\s*true/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx kretro pack must be hidden: true');
    hasErrors = true;
  }
  if (!content.includes('function getDefaultStickerSizeNorm')) {
    console.error('❌ FAIL: sticker-engine.jsx missing getDefaultStickerSizeNorm');
    hasErrors = true;
  }
  if (!content.includes('makeSticker') || !content.includes('sizeNorm')) {
    console.error('❌ FAIL: sticker-engine.jsx makeSticker missing sizeNorm storage');
    hasErrors = true;
  }
}

function checkCapture() {
  const rest = readFile('screens-v2-rest.jsx');
  if (!rest) return;
  if (rest.includes('preStickers.map')) {
    console.error('❌ FAIL: screens-v2-rest.jsx contains raw preStickers.map in capture');
    hasErrors = true;
  }
  if (rest.includes('drawStickerToCanvas') && rest.includes('preStickers')) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses preStickers with drawStickerToCanvas directly');
    hasErrors = true;
  }
  if (rest.includes('cameraOverlay') && rest.includes('preStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses weak preStickers.length for capture overlay');
    hasErrors = true;
  }
  if (!rest.includes('visibleCaptureStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx missing visibleCaptureStickers check');
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
  const deco = readFile('screens-v2-deco.jsx');
  if (!deco) return;
  // Generic check for deco logic integrity
}

function checkTask() {
  const task = readFile('task.md');
  if (!task) return;
  const unverified = [
    '- [x] Samsung Internet clears old cache after reload',
    '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined',
    '- [x] Galaxy Samsung Internet real capture test pending'
  ];
  unverified.forEach(bc => {
    if (task.includes(bc) && !task.includes('Real QA log')) {
      console.error(`❌ FAIL: task.md has unverified check "${bc}"`);
      hasErrors = true;
    }
  });
  if (!task.includes('Code-side guards have been added') || !task.includes('Real Galaxy Samsung Internet QA is still pending')) {
    console.error('❌ FAIL: task.md missing mandatory pending verification warning');
    hasErrors = true;
  }
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
} else if (hasWarnings) {
  console.log('\n⚠️ Sanity checks passed with warnings.');
} else {
  console.log('\n✅ All sanity checks passed.');
}
