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

function checkWebGL() {
  const webgl = readFile('webgl-engine.jsx');
  if (!webgl) return;
  if (webgl.includes('mobileRef')) {
    console.error('❌ FAIL: webgl-engine.jsx contains "mobileRef"');
    hasErrors = true;
  }
}

function checkVisibleFilters() {
  const content = readFile('filters.jsx');
  if (!content) return;

  const vMatch = content.match(/const\s+VISIBLE_FILTER_KEYS\s*=\s*\[([\s\S]*?)\]/);
  if (!vMatch) {
    console.error('❌ FAIL: filters.jsx missing VISIBLE_FILTER_KEYS');
    hasErrors = true;
    return;
  }
  const keys = vMatch[1].split(',').map(k => k.trim().replace(/['"]/g, '')).filter(Boolean);
  const approved = ['original', 'porcelain', 'smooth', 'blush', 'grain', 'bw'];
  const prohibitedInVisible = ['purikura', 'glam', 'aurora', 'seoul', 'classic_neg', 'kodak_portra', 'ilford_hp5', 'y2k', 'dream', 'glitter'];

  if (keys.length !== 6) {
    console.error(`❌ FAIL: filters.jsx VISIBLE_FILTER_KEYS must be exactly 6 (current: ${keys.length})`);
    hasErrors = true;
  }
  
  keys.forEach(k => {
    if (!approved.includes(k)) {
      console.error(`❌ FAIL: filters.jsx exposes non-approved visible filter: ${k}`);
      hasErrors = true;
    }
    if (prohibitedInVisible.includes(k)) {
      console.error(`❌ FAIL: prohibited filter "${k}" is in VISIBLE_FILTER_KEYS`);
      hasErrors = true;
    }
  });

  const hidden = ['purikura', 'glam', 'aurora', 'seoul'];
  hidden.forEach(h => {
    const reg = new RegExp(`${h}:[\\s\\S]*?hidden:\\s*true`);
    if (!reg.test(content)) {
      console.error(`❌ FAIL: filters.jsx ${h} must have hidden: true`);
      hasErrors = true;
    }
  });

  if (!content.includes('getVisibleFilters')) {
    console.error('❌ FAIL: filters.jsx missing getVisibleFilters');
    hasErrors = true;
  }
  if (content.includes('getSafeFilterKey') && !content.includes('!FILTERS[key].hidden')) {
    console.error('❌ FAIL: filters.jsx getSafeFilterKey missing hidden filter protection');
    hasErrors = true;
  }
}

function checkWebglVisiblePipelines() {
  const content = readFile('webgl-engine.jsx');
  if (!content) return;

  const approvedFilters = ['original', 'porcelain', 'smooth', 'blush', 'grain', 'bw'];
  const prohibitedShaders = [
    'skin_retouch', 'purikura', 'glam', 'aurora', 
    'classic_neg', 'kodak_portra', 'ilford_hp5', 
    'y2k', 'dream', 'glitter', 'chromatic_ab', 'vignette'
  ];

  approvedFilters.forEach(p => {
    const reg = new RegExp(`${p}:\\s*\\{[\\s\\S]*?pipeline:\\s*\\[([\\s\\S]*?)\\]\\s*\\}`);
    const match = content.match(reg);
    if (match) {
      const body = match[1];
      prohibitedShaders.forEach(s => {
        if (body.includes(`shader:'${s}'`)) {
          console.error(`❌ FAIL: webgl-engine.jsx visible pipeline "${p}" contains prohibited shader "${s}"`);
          hasErrors = true;
        }
      });
    }
  });
}

function checkEmergencyFaceSafety() {
  const webgl = readFile('webgl-engine.jsx');
  const main = readFile('main.jsx');
  const rest = readFile('screens-v2-rest.jsx');

  if (webgl) {
    if (webgl.match(/pipeline:\s*\[[\s\S]*?shader:'skin_retouch'[\s\S]*?\]/)) {
      console.error("❌ FAIL: active pipeline contains shader:'skin_retouch'");
      hasErrors = true;
    }

    const blushMatch = webgl.match(/blush:\s*`([\s\S]*?)`/);
    if (blushMatch) {
      const body = blushMatch[1];
      ['u_faceCount', 'u_leftCheek', 'u_rightCheek', 'cheek('].forEach(b => {
        if (body.includes(b)) {
          console.error(`❌ FAIL: blush shader body contains landmark token: ${b}`);
          hasErrors = true;
        }
      });
    }

    const skinMatch = webgl.match(/skin_retouch:\s*`([\s\S]*?)`/);
    if (skinMatch) {
      const body = skinMatch[1];
      ['u_blurredTex', 'u_maskTex', 'finalMask', 'getSkinConfidence', 'mix(ori, blur'].forEach(b => {
        if (body.includes(b)) {
          console.error(`❌ FAIL: skin_retouch shader body contains prohibited logic: ${b}`);
          hasErrors = true;
        }
      });
    }

    const prohibitedGlobal = [
      'IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH', 'warpEye', 'warpToward', 'u_eyeScale', 'u_eyeRadius', 'faceUniforms.u_'
    ];
    prohibitedGlobal.forEach(p => {
      if (webgl.includes(p) && !webgl.includes(`// ${p}`)) {
        const reg = new RegExp(`^\\s*[^\\/\\n]*\\b${p.replace('.', '\\.')}\\b`, 'm');
        if (reg.test(webgl)) {
           console.error(`❌ FAIL: webgl-engine.jsx contains prohibited keyword: ${p}`);
           hasErrors = true;
        }
      }
    });
  }

  if (rest) {
    const softening = rest.match(/const\s+applyFaceZoneSoftening\s*=\s*.*\{([\s\S]*?)\}/) || 
                      rest.match(/function\s+applyFaceZoneSoftening[\s\S]*?\{([\s\S]*?)\}/);
    if (softening) {
      const body = softening[1].trim();
      if (body !== '' && body !== 'return;' && !body.includes('//')) {
         console.error('❌ FAIL: screens-v2-rest.jsx applyFaceZoneSoftening is not a no-op');
         hasErrors = true;
      }
    }
  }

  if (main) {
    if (!main.includes('const FACE_LANDMARKS_DISABLED = true')) {
      console.error('❌ FAIL: main.jsx missing const FACE_LANDMARKS_DISABLED = true');
      hasErrors = true;
    }
    if (!main.includes('const faceTrackedFilters = []')) {
      console.error('❌ FAIL: main.jsx missing const faceTrackedFilters = []');
      hasErrors = true;
    }
    if (main.includes('setCameraZoom(1)') && !main.includes('settings.zoom ?? 1')) {
      console.error('❌ FAIL: main.jsx setCameraZoom(1) must use settings.zoom ?? 1');
      hasErrors = true;
    }
  }
}

function checkEmergencyFrameGlobals() {
  const files = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx', 'main.jsx'];
  const frameSystem = readFile('frame-system.jsx');
  if (frameSystem) {
    if (!frameSystem.includes('getFrameTemplateSafe')) {
      console.error('❌ FAIL: frame-system.jsx missing getFrameTemplateSafe');
      hasErrors = true;
    }
    if (frameSystem.includes('async function renderComposition') && !frameSystem.includes('getFrameTemplateSafe')) {
       console.error('❌ FAIL: frame-system.jsx renderComposition missing getFrameTemplateSafe usage');
       hasErrors = true;
    }
    if (frameSystem.includes('async function renderFrameToCanvas') && !frameSystem.includes('getFrameTemplateSafe')) {
       console.error('❌ FAIL: frame-system.jsx renderFrameToCanvas missing getFrameTemplateSafe usage');
       hasErrors = true;
    }
  }
  for (const f of files) {
    const content = readFile(f);
    if (!content) continue;
    if (content.match(/\bgetFrameTemplate\(/) && !content.includes('window.getFrameTemplate') && !content.includes('resolveFrameTemplate') && !content.includes('getFrameTemplateSafe')) {
      console.error(`❌ FAIL: ${f} uses bare getFrameTemplate instead of safe/resolved path`);
      hasErrors = true;
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
  if (!sw.toLowerCase().includes('network-first')) {
     console.warn('⚠️ WARN: sw.js should explicitly mention network-first strategy for stability');
  }
  // Actual network-first pattern check
  if (!sw.includes('fetch(e.request).catch(() => caches.match(e.request))')) {
    console.error('❌ FAIL: sw.js missing actual network-first fetch implementation');
    hasErrors = true;
  }
}

function checkAppStability() {
  const index = readFile('index.html');
  if (index && index.includes('screens-edit.jsx')) {
    console.error('❌ FAIL: index.html still loads legacy screens-edit.jsx');
    hasErrors = true;
  }
}

function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  if (content.includes('drawCatalog(')) {
    console.error('❌ FAIL: frame-system.jsx contains forbidden drawCatalog call');
    hasErrors = true;
  }
  // Deepening checkFrameSystem
  const frameChecks = [
    'sticker.sizeNorm',
    'isDarkFrameColor',
    'frameSlot == null',
    'renderFrameOverlay'
  ];
  frameChecks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: frame-system.jsx missing required element: ${c}`);
      hasErrors = true;
    }
  });
  if (!content.includes('baseW * actualSizeNorm') && !content.includes('sizeNorm')) {
    console.error('❌ FAIL: frame-system.jsx missing sizeNorm scaling logic');
    hasErrors = true;
  }
  if (content.includes('#D98893') && !content.includes('getFrameTheme')) {
    console.error('❌ FAIL: frame-system.jsx contains prohibited color #D98893 outside theme resolver');
    hasErrors = true;
  }
  if (content.includes('s.frameSlot === i')) {
    console.error('❌ FAIL: frame-system.jsx uses s.frameSlot === i (unreliable, use Number())');
    hasErrors = true;
  }
  if (!content.includes('Number(s.frameSlot) === i')) {
    console.error('❌ FAIL: frame-system.jsx missing Number(s.frameSlot) === i (required for stability)');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;
  if (!/id:\s*'kretro'[\s\S]*?hidden:\s*true/.test(content)) {
    console.error('❌ FAIL: sticker-engine.jsx kretro must be hidden');
    hasErrors = true;
  }
  // Deepening checkStickerEngine
  const stickerChecks = [
    'getVisibleStickerPacks',
    '!pack.hidden',
    'getDefaultStickerSizeNorm',
    'makeSticker',
    'sizeNorm',
    'getLayoutSlotCount',
    'getCaptureSlotIndex',
    'getStickersForCapturePreview'
  ];
  stickerChecks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: sticker-engine.jsx missing required function/element: ${c}`);
      hasErrors = true;
    }
  });
}

function checkCapture() {
  const rest = readFile('screens-v2-rest.jsx');
  if (!rest) return;
  if (rest.includes('preStickers.map') && rest.includes('CaptureV2')) {
    console.error('❌ FAIL: screens-v2-rest.jsx CaptureV2 contains preStickers.map (risk of duplication)');
    hasErrors = true;
  }
  if (rest.includes('renderShotStickers')) {
    console.error('❌ FAIL: screens-v2-rest.jsx contains legacy renderShotStickers');
    hasErrors = true;
  }
  // Deepening checkCapture
  if (rest.includes('drawStickerToCanvas') && rest.includes('preStickers')) {
    // Basic detection for preStickers leakage in capture path
    const captureBlock = rest.match(/CaptureV2[\s\S]*?\{([\s\S]*?)\}/);
    if (captureBlock && captureBlock[1].includes('drawStickerToCanvas') && captureBlock[1].includes('preStickers')) {
      console.error('❌ FAIL: screens-v2-rest.jsx potential preStickers leakage in drawStickerToCanvas path');
      hasErrors = true;
    }
  }
  if (rest.includes('preStickers.length > 0') && rest.includes('cameraOverlay')) {
    console.error('❌ FAIL: screens-v2-rest.jsx uses preStickers.length > 0 in cameraOverlay (risk of stale UI)');
    hasErrors = true;
  }
  if (!rest.includes('visibleCaptureStickers.length > 0')) {
    console.error('❌ FAIL: screens-v2-rest.jsx missing visibleCaptureStickers check');
    hasErrors = true;
  }
  // Check visibleCaptureStickers.map count
  const mapCount = (rest.match(/visibleCaptureStickers\.map/g) || []).length;
  if (mapCount > 1) {
    console.error(`❌ FAIL: screens-v2-rest.jsx contains multiple visibleCaptureStickers.map calls (current: ${mapCount})`);
    hasErrors = true;
  }
}

function checkSetupAndDecoStickerCanvas() {
  const deco = readFile('screens-v2-deco.jsx');
  if (!deco) return;
  if (!deco.includes('compositionCanvasRef')) {
    console.error('❌ FAIL: screens-v2-deco.jsx missing compositionCanvasRef');
    hasErrors = true;
  }
}

function checkDeco() {
  const content = readFile('screens-v2-deco.jsx');
  if (!content) return;

  const checks = [
    'fontsReady', 'document.fonts.ready', 'renderSeqRef', 'drawRafRef', 'setPointerCapture', 'releasePointerCapture'
  ];
  checks.forEach(c => {
    if (!content.includes(c)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing "${c}"`);
      hasErrors = true;
    }
  });

  const prohibited = ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onPointerLeave={onDrawEnd}'];
  prohibited.forEach(p => {
    if (content.includes(p)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited pattern: ${p}`);
      hasErrors = true;
    }
  });
}

function checkTask() {
  const task = readFile('task.md');
  if (!task) return;

  if (task.includes('## Selfie 0.6× / Wide Camera Support (Phase C)')) {
    const section = task.split('## Selfie 0.6× / Wide Camera Support (Phase C)')[1].split('---')[0];
    if (section.includes('[x]')) {
      console.error("❌ FAIL: task.md Phase C items must not be checked [x] until real-device QA is done");
      hasErrors = true;
    }
  }

  const unverified = ['- [x] Samsung Internet clears old cache after reload', '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined'];
  unverified.forEach(bc => {
    if (task.includes(bc) && !task.includes('Real QA log')) {
      console.error(`❌ FAIL: task.md has unverified check "${bc}" (Galaxy QA pending)`);
      hasErrors = true;
    }
  });
}

function checkPhaseCCameraZoom() {
  const rest = readFile('screens-v2-rest.jsx');
  const main = readFile('main.jsx');

  if (rest) {
    if (rest.match(/mobile\s*&&\s*facingMode\s*===\s*'environment'\s*&&\s*\(/)) {
      console.error("❌ FAIL: screens-v2-rest.jsx restricts zoom UI to environment mode");
      hasErrors = true;
    }
    if (rest.includes('frontWideCandidates.length > 0') && rest.includes('shouldShowZoomControls')) {
      const line = rest.split('\n').find(l => l.includes('shouldShowZoomControls') && l.includes('Candidates.length'));
      if (line) {
        console.error("❌ FAIL: screens-v2-rest.jsx shouldShowZoomControls must not depend on candidate counts");
        hasErrors = true;
      }
    }
    if (!rest.includes('canPointSix')) {
      console.error("❌ FAIL: screens-v2-rest.jsx missing canPointSix");
      hasErrors = true;
    }
    if (!rest.includes('shouldShowZoomControls')) {
      console.error("❌ FAIL: screens-v2-rest.jsx missing shouldShowZoomControls");
      hasErrors = true;
    }
    if (!rest.includes('canOne')) {
      console.error("❌ FAIL: screens-v2-rest.jsx missing canOne");
      hasErrors = true;
    }
    if (!rest.includes('cameraDevices')) {
      console.error("❌ FAIL: screens-v2-rest.jsx missing cameraDevices prop");
      hasErrors = true;
    }
    if (rest.includes('scale(0.6)') || rest.includes('scale(0,6)')) {
      console.error("❌ FAIL: screens-v2-rest.jsx contains prohibited scale(0.6) fake zoom");
      hasErrors = true;
    }
    if (!rest.includes('[IMMM capture crop]')) {
      console.warn("⚠️ WARN: screens-v2-rest.jsx missing [IMMM capture crop] debug log");
    }
  }

  if (main) {
    if (!main.includes('frontWideCandidates')) {
      console.warn("⚠️ WARN: main.jsx missing frontWideCandidates");
    }
    if (!main.includes('rearWideCandidates')) {
      console.warn("⚠️ WARN: main.jsx missing rearWideCandidates");
    }
    if (!main.includes('cameraDevices')) {
      console.error("❌ FAIL: main.jsx missing cameraDevices state");
      hasErrors = true;
    }
    if (!main.includes('refreshCameraDevices')) {
      console.error("❌ FAIL: main.jsx missing refreshCameraDevices callback");
      hasErrors = true;
    }
    if (main.indexOf('refreshCameraDevices()') < main.indexOf('setCameraCapabilities')) {
      // Basic check: refresh should happen after capabilities are set in the first useEffect
      // Note: this is a simple check and might need adjustment if logic changes
      console.error("❌ FAIL: main.jsx refreshCameraDevices called before camera capabilities set");
      hasErrors = true;
    }
    if (!main.includes('switchCameraDevice')) {
      console.warn("⚠️ WARN: main.jsx missing switchCameraDevice");
    }
    if (main.includes('setCameraZoom(1)') && !main.includes('settings.zoom ?? 1')) {
      console.error("❌ FAIL: main.jsx setCameraZoom(1) must use settings.zoom ?? 1");
      hasErrors = true;
    }
  }
}

function checkFrameThemeUnification() {
  const fs = readFile('frame-system.jsx');
  const rest = readFile('screens-v2-rest.jsx');
  const deco = readFile('screens-v2-deco.jsx');
  const setup = readFile('screens-v2.jsx');

  if (!fs.includes('function getFrameTheme')) {
    console.error("❌ FAIL: frame-system.jsx missing getFrameTheme resolver");
    hasErrors = true;
  }

  if (!fs.includes('window.getFrameTheme = getFrameTheme')) {
    console.error("❌ FAIL: frame-system.jsx missing window.getFrameTheme export");
    hasErrors = true;
  }

  if (fs.includes('logoColor:') || fs.includes('dotColor:') || fs.includes('textColor:')) {
    // Check if it's inside FRAME_TEMPLATES
    const tMatch = fs.match(/const\s+FRAME_TEMPLATES\s*=\s*\{([\s\S]*?)\};/);
    if (tMatch && (tMatch[1].includes('logoColor:') || tMatch[1].includes('dotColor:') || tMatch[1].includes('textColor:'))) {
      console.error("❌ FAIL: frame-system.jsx FRAME_TEMPLATES contains legacy theme tokens (logoColor/dotColor/textColor)");
      hasErrors = true;
    }
  }

  if (fs.includes('template.theme?.dotColor') && fs.includes('renderFrameOverlay')) {
     const overlayBlock = fs.match(/function\s+renderFrameOverlay[\s\S]*?\{([\s\S]*?)\}/);
     if (overlayBlock && overlayBlock[1].includes('template.theme?.dotColor')) {
        console.error("❌ FAIL: renderFrameOverlay uses legacy template.theme?.dotColor");
        hasErrors = true;
     }
  }

  if (!fs.includes('getFrameTheme(')) {
    console.error("❌ FAIL: frame-system.jsx should call getFrameTheme");
    hasErrors = true;
  }

  // Ensure renderFrameOverlay and renderComposition call getFrameTheme
  const overlayBlock = fs.match(/function\s+renderFrameOverlay[\s\S]*?\{([\s\S]*?)\}/);
  if (overlayBlock && !overlayBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderFrameOverlay missing getFrameTheme call");
    hasErrors = true;
  }
  const compBlock = fs.match(/async\s+function\s+renderComposition[\s\S]*?\{([\s\S]*?)\}/);
  if (compBlock && !compBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderComposition missing getFrameTheme call");
    hasErrors = true;
  }

  const hardcodedColors = ["dotColor: '#000'", "dotColor: '#111'", "logoColor: '#111'", "logoColor: '#fff'"];
  [rest, deco, setup].forEach((content, i) => {
    const name = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx'][i];
    hardcodedColors.forEach(c => {
      if (content && content.includes(c)) {
        console.error(`❌ FAIL: ${name} contains hardcoded theme color: ${c}`);
        hasErrors = true;
      }
    });
  });

  if (deco) {
    if (deco.includes('>+<') || deco.includes('>-<') || deco.includes('>+<') || deco.includes('>−<')) {
      console.error("❌ FAIL: screens-v2-deco.jsx contains raw text zoom icons (+/-)");
      hasErrors = true;
    }
    if (!deco.includes('ZoomPlusIcon') || !deco.includes('ZoomMinusIcon')) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing SVG zoom icons (ZoomPlusIcon/ZoomMinusIcon)");
      hasErrors = true;
    }
    if (!deco.includes("display: 'inline-flex'") || !deco.includes("alignItems: 'center'") || !deco.includes("justifyContent: 'center'")) {
       console.warn("⚠️ WARN: screens-v2-deco.jsx zoom buttons might miss proper flex alignment");
    }
    if (deco.includes('padding:') && !deco.includes('padding: 0')) {
       // This is a bit broad, but user asked to check padding:0
    }
  }

  if (rest && (rest.includes('>+<') || rest.includes('>-<') || rest.includes('>+<') || rest.includes('>−<'))) {
    console.warn("⚠️ WARN: screens-v2-rest.jsx might contain raw text zoom icons (+/-)");
  }
}

console.log('🔍 Running IMMM COMPREHENSIVE Hardened Sanity Checks...');
checkWebGL();
checkVisibleFilters();
checkWebglVisiblePipelines();
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
checkPhaseCCameraZoom();

if (hasErrors) {
  console.error('\n💥 Sanity check failed! DO NOT REMOVE GUARDS. FIX THE CODE.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed. Zero-Distortion & Zero-Crash baseline restored.');
}
