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
      'IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH', 'warpEye', 'warpToward', 'u_eyeScale', 'u_eyeRadius', 'faceUniforms.u_', 'useFaceLandmarks', 'useFaceDistortion'
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
    const forbiddenChecks = [
      'Galaxy S23+',
      'Samsung Internet 0.6× toggle verified',
      'Chrome 0.6× toggle verified',
      '1× return path verified',
      'Debug camera pill shows correct device'
    ];
    forbiddenChecks.forEach(f => {
      if (section.includes(`[x] ${f}`)) {
        console.error(`❌ FAIL: task.md Phase C item "${f}" must not be checked [x] until real-device QA is done`);
        hasErrors = true;
      }
    });
  }

  const unverified = ['- [x] Samsung Internet clears old cache after reload', '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined'];
  unverified.forEach(bc => {
    if (task.includes(bc) && !task.includes('Real QA log')) {
      console.error(`❌ FAIL: task.md has unverified check "${bc}" (Galaxy QA pending)`);
      hasErrors = true;
    }
  });
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
  const overlayBlock = fs.match(/function\s+renderFrameOverlay[\s\S]*?\{([\s\S]*?)\n\}/);
  if (overlayBlock && !overlayBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderFrameOverlay missing getFrameTheme call");
    hasErrors = true;
  }
  const compBlock = fs.match(/async\s+function\s+renderComposition[\s\S]*?\{([\s\S]*?)\n\}/);
  if (compBlock && !compBlock[1].includes('getFrameTheme(')) {
    console.error("❌ FAIL: renderComposition missing getFrameTheme call");
    hasErrors = true;
  }

  if (fs.includes('window.getFrameTemplate(') && fs.includes('function getFrameTemplateSafe')) {
    const safeBlock = fs.match(/function\s+getFrameTemplateSafe[\s\S]*?\{([\s\S]*?)\}/);
    if (safeBlock) {
      const body = safeBlock[1];
      const localIdx = body.indexOf('getFrameTemplate(');
      const windowIdx = body.indexOf('window.getFrameTemplate(');
      if (windowIdx !== -1 && (localIdx === -1 || windowIdx < localIdx)) {
        console.error("❌ FAIL: getFrameTemplateSafe must prefer local getFrameTemplate before window.getFrameTemplate");
        hasErrors = true;
      }
    }
  }

  const hardcodedColors = ["dotColor: '#000'", "dotColor: '#111'", "logoColor: '#111'", "logoColor: '#fff'"];
  [rest, deco, setup].forEach((content, i) => {
    const name = ['screens-v2-rest.jsx', 'screens-v2-deco.jsx', 'screens-v2.jsx'][i];
    if (!content) return;
    hardcodedColors.forEach(c => {
      if (content.includes(c)) {
        console.error(`❌ FAIL: ${name} contains hardcoded theme color: ${c}`);
        hasErrors = true;
      }
    });

    // Aggressive Zoom Button Check (Raw Text +/-)
    const rawZoomIconPatterns = [
      />\s*\+\s*<\/button>/,
      />\s*-\s*<\/button>/,
      />\s*−\s*<\/button>/,
      />\s*＋\s*<\/button>/,
    ];
    if (name !== 'screens-v2-rest.jsx') {
      rawZoomIconPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          console.error(`❌ FAIL: ${name} contains raw text zoom icons (+/-)`);
          hasErrors = true;
        }
      });
    }
  });

  checkDecoZoomButtons(deco);
}

function checkDecoZoomButtons(deco) {
  if (!deco) return;

  if (!deco.includes('ZoomPlusIcon')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ZoomPlusIcon");
    hasErrors = true;
  }
  if (!deco.includes('ZoomMinusIcon')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ZoomMinusIcon");
    hasErrors = true;
  }

  // 3. Raw text buttons
  const rawPatterns = [
    />\+<\/button>/,
    />−<\/button>/,
    />-<\/button>/,
    />＋<\/button>/
  ];
  rawPatterns.forEach(p => {
    if (p.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains raw text zoom button matching ${p}`);
      hasErrors = true;
    }
  });

  const styleMatch = deco.match(/const\s+zoomBtnStyle\s*=\s*\{([\s\S]*?)\};/);
  if (!styleMatch) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing zoomBtnStyle definition");
    hasErrors = true;
  } else {
    const s = styleMatch[1];
    if (!s.includes('width: 56')) { console.error("❌ FAIL: screens-v2-deco.jsx missing width: 56"); hasErrors = true; }
    if (!s.includes('height: 56')) { console.error("❌ FAIL: screens-v2-deco.jsx missing height: 56"); hasErrors = true; }
    if (!s.includes("display: 'inline-flex'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing display: 'inline-flex'"); hasErrors = true; }
    if (!s.includes("alignItems: 'center'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing alignItems: 'center'"); hasErrors = true; }
    if (!s.includes("justifyContent: 'center'")) { console.error("❌ FAIL: screens-v2-deco.jsx missing justifyContent: 'center'"); hasErrors = true; }
    if (!s.includes('padding: 0')) { console.error("❌ FAIL: screens-v2-deco.jsx missing padding: 0"); hasErrors = true; }
  }
}

function checkPhaseCCameraZoom() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');
  const task = fs.readFileSync('task.md', 'utf8');

  // 1. main.jsx checks
  if (!main.includes('const [activeCameraDeviceId')) { console.error("❌ FAIL: main.jsx missing activeCameraDeviceId state"); hasErrors = true; }
  if (!main.includes('const [normalCameraDeviceId')) { console.error("❌ FAIL: main.jsx missing normalCameraDeviceId state"); hasErrors = true; }
  if (!main.includes('const [wideCameraActive')) { console.error("❌ FAIL: main.jsx missing wideCameraActive state"); hasErrors = true; }
  if (!main.includes('const toggleWideCamera =')) { console.error("❌ FAIL: main.jsx missing toggleWideCamera callback"); hasErrors = true; }
  if (!main.includes('applyCameraZoom(0.6)')) { console.error("❌ FAIL: main.jsx missing hardware zoom path (0.6x)"); hasErrors = true; }
  if (!main.includes('switchCameraDevice(candidate.deviceId)')) { console.error("❌ FAIL: main.jsx missing device switch fallback path"); hasErrors = true; }


  // 2. screens-v2-rest.jsx checks
  // 2. screens-v2-rest.jsx checks
  if (!rest.includes('toggleWideCamera')) { console.error("❌ FAIL: screens-v2-rest.jsx missing toggleWideCamera prop/usage"); hasErrors = true; }
  if (rest.includes('onClick={() => canPointSix && applyCameraZoom?.(0.6)}') || rest.includes('onClick={() => canOne && applyCameraZoom?.(1)}')) {
    console.error("❌ FAIL: screens-v2-rest.jsx still has separate 0.6x and 1x buttons");
    hasErrors = true;
  }

  if (rest.includes('<button') && rest.includes('isWideActive ? \'1×\' : \'0.6×\'')) {
    // Single toggle confirmed
  } else {
    console.error("❌ FAIL: screens-v2-rest.jsx missing single toggle button for camera zoom");
    hasErrors = true;
  }

  if (!rest.includes("maxHeight: mobile ? 'min(68vh, 620px)' : 'none'")) {
    console.error("❌ FAIL: screens-v2-rest.jsx mobile camera preview maxHeight not optimized (should be min(68vh, 620px))");
    hasErrors = true;
  }

  // Shutter row grouping check
  const shutterRowMatch = rest.match(/Shutter row[\s\S]*?cameraOverlay/);
  const shutterRow = shutterRowMatch ? shutterRowMatch[0] : "";

  if (!shutterRow.includes('toggleAuto') || (!shutterRow.includes('toggleWideCamera') && !shutterRow.includes('onToggle'))) {
    console.error("❌ FAIL: screens-v2-rest.jsx shutter row missing Auto or 0.6x toggle");
    hasErrors = true;
  }
  if (!shutterRow.includes('timerLen') || !shutterRow.includes('shotCount-idx')) {
    console.error("❌ FAIL: screens-v2-rest.jsx shutter row missing Timer or Left counter");
    hasErrors = true;
  }

  if (!rest.includes("position:'absolute', right:0, display:'flex', gap:6, alignItems:'center'")) {
    console.error("❌ FAIL: screens-v2-rest.jsx right side controls (timer/left) must be grouped on the right");
    hasErrors = true;
  }

  if (rest.includes('isWideActive ? \'1×\' : \'0.6×\'') && rest.split('isWideActive ? \'1×\' : \'0.6×\'').length > 2) {
    console.error("❌ FAIL: screens-v2-rest.jsx has duplicate 0.6x toggle buttons");
    hasErrors = true;
  }

  if (!rest.includes('WideCameraDebugPill') || !rest.includes('DebugWideDevicePicker')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing debug camera components");
    hasErrors = true;
  }

  if (!rest.includes('{debugCamera && <WideCameraDebugPill />}') || !rest.includes('{showWidePicker && <DebugWideDevicePicker />}')) {
    console.error("❌ FAIL: screens-v2-rest.jsx debug components missing correct guards");
    hasErrors = true;
  }

  if (rest.includes('scale(0.6)')) {
    console.error("❌ FAIL: screens-v2-rest.jsx contains prohibited CSS scale(0.6)");
    hasErrors = true;
  }
  if (!rest.includes('[IMMM capture crop]')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing [IMMM capture crop] log");
    hasErrors = true;
  }
}

function checkRuntimeVersion() {
  const html = fs.readFileSync('index.html', 'utf8');
  const main = fs.readFileSync('main.jsx', 'utf8');
  const sw = fs.readFileSync('sw.js', 'utf8');

  if (!html.includes('IMMM_APP_VERSION = \'2026-05-10-rc2.2\'')) {
    console.error("❌ FAIL: index.html missing or incorrect IMMM_APP_VERSION");
    hasErrors = true;
  }
  if (!html.includes('IMMM_BUILD_LABEL = \'rc2.2-react-production-umd\'')) {
    console.error("❌ FAIL: index.html missing IMMM_BUILD_LABEL");
    hasErrors = true;
  }
  if (html.includes('IMMM_COMMIT = \'91bc1ba\'')) {
    console.error("❌ FAIL: index.html contains misleading IMMM_COMMIT = '91bc1ba'");
    hasErrors = true;
  }
  if (!html.includes('IMMM_RC_BASELINE = \'ca3df30\'')) {
    console.error("❌ FAIL: index.html missing or incorrect IMMM_RC_BASELINE");
    hasErrors = true;
  }
  if (!html.includes('IMMM_STABLE_BASELINE = \'8b5e42c\'')) {
    console.error("❌ FAIL: index.html missing IMMM_STABLE_BASELINE");
    hasErrors = true;
  }
  if (!main.includes('[IMMM build]') || !main.includes('rcBaseline: window.IMMM_RC_BASELINE') || !main.includes('cacheName:')) {
    console.error("❌ FAIL: main.jsx missing or incorrect [IMMM build] console log");
    hasErrors = true;
  }
  if (!main.includes('window.IMMM_RC_BASELINE')) {
    console.error("❌ FAIL: main.jsx BuildPill must use IMMM_RC_BASELINE");
    hasErrors = true;
  }
  if (!sw.includes('immm-cache-v6-2026-05-10-rc2.2')) {
    console.error("❌ FAIL: sw.js missing immm-cache-v6-2026-05-10-rc2.2");
    hasErrors = true;
  }
  if (sw.includes('immm-cache-v1') || sw.includes('immm-cache-v4')) {
    console.error("❌ FAIL: sw.js contains legacy cache name");
    hasErrors = true;
  }
  if (!sw.includes('.respondWith(') || !sw.includes('fetch(')) {
    console.error("❌ FAIL: sw.js missing network-first logic (safety check)");
    hasErrors = true;
  }
}

function checkWidePickerSafety() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  if (!rest.includes('const debugCamera =')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing debugCamera variable");
    hasErrors = true;
  }

  // Debug components check
  if (!rest.includes('<WideCameraDebugPill />') || !rest.includes('<DebugWideDevicePicker />')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing named debug camera components");
    hasErrors = true;
  }

  if (!rest.includes('{debugCamera && <WideCameraDebugPill />}') || !rest.includes('{showWidePicker && <DebugWideDevicePicker />}')) {
    console.error("❌ FAIL: screens-v2-rest.jsx debug components missing correct guards");
    hasErrors = true;
  }

  const diagnosticStrings = [
    'zoom unsupported',
    'wide: {String(wideCameraActive)}',
    'activeDev: {String(activeCameraDeviceId).slice(-4)}',
    'normalDev: {String(normalCameraDeviceId).slice(-4)}',
    'fWide: {frontWideCandidates.length}',
    'rWide: {rearWideCandidates.length}'
  ];
  diagnosticStrings.forEach(s => {
    if (!rest.includes(s)) {
      console.error(`❌ FAIL: screens-v2-rest.jsx missing diagnostic string: ${s}`);
      hasErrors = true;
    }
  });

  // Forbidden: automatic switchCameraDevice call with wide candidate
  const autoPatterns = [
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(frontWideCandidates/,
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(rearWideCandidates/,
    /useEffect\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(frontWideCandidates/,
    /useEffect\s*\(\s*async\s*\(\s*\)\s*=>\s*\{[\s\S]*?switchCameraDevice\(rearWideCandidates/
  ];

  autoPatterns.forEach(p => {
    if (p.test(main)) {
      console.error("❌ FAIL: main.jsx contains automatic switch to wide candidates in useEffect");
      hasErrors = true;
    }
    if (p.test(rest)) {
      console.error("❌ FAIL: screens-v2-rest.jsx contains automatic switch to wide candidates in useEffect");
      hasErrors = true;
    }
  });

  if (/const\s+shouldShowZoomControls\s*=\s*[^;]*?Candidates\.length/.test(rest)) {
    console.error("❌ FAIL: shouldShowZoomControls depends on candidate count (forbidden)");
    hasErrors = true;
  }

  // Reactivity check for BuildPill in main.jsx
  if (!main.includes('debugBuildVisible') || !main.includes('setInterval') || !main.includes('clearInterval')) {
    console.error("❌ FAIL: main.jsx missing debugBuildVisible state or interval polling for BuildPill reactivity");
    hasErrors = true;
  }
}

function checkResultUX() {
  const deco = fs.readFileSync('screens-v2-deco.jsx', 'utf8');

  // Hardening: Prohibit destructive clears
  const destructivePatterns = [
    { pattern: 'localStorage.clear()', error: 'prohibited localStorage.clear()' },
    { pattern: 'sessionStorage.clear()', error: 'prohibited sessionStorage.clear()' },
    { pattern: 'caches.delete', error: 'prohibited caches.delete' },
    { pattern: 'serviceWorker.unregister', error: 'prohibited serviceWorker.unregister' }
  ];
  destructivePatterns.forEach(({ pattern, error }) => {
    if (deco.includes(pattern)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains ${error}`);
      hasErrors = true;
    }
  });

  // Hardening: Verify states for used setters
  const stateSetters = [
    { setter: 'setDownloading', state: 'useState(false)' },
    { setter: 'setSharing', state: 'useState(false)' },
    { setter: 'setSaveSheetUrl', state: 'useState(null)' },
    { setter: 'setQrShare', state: 'useState(null)' },
    { setter: 'setQrBusy', state: 'useState(false)' },
    { setter: 'setShowMoreActions', state: 'useState(false)' }
  ];

  stateSetters.forEach(({ setter, state }) => {
    if (deco.includes(setter) && !deco.includes(state)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx uses ${setter} but missing ${state} declaration`);
      hasErrors = true;
    }
  });

  // Hardening: finally blocks for busy states
  if (deco.includes('const handleShare')) {
    if (!deco.includes('finally {') || !deco.includes('setSharing(false)')) {
      console.error("❌ FAIL: handleShare must have both finally block AND setSharing(false)");
      hasErrors = true;
    }
  }
  if (deco.includes('const handleDownload')) {
    if (!deco.includes('finally {') || !deco.includes('setDownloading(false)')) {
      console.error("❌ FAIL: handleDownload must have both finally block AND setDownloading(false)");
      hasErrors = true;
    }
  }

  // Hardening: triggerDownload and iOS revoke logic
  if (!deco.includes('const triggerDownload =')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing triggerDownload function");
    hasErrors = true;
  }

  // Phase 3.11 UX Polish: Menu Actions & Routing
  const actions = [
    { label: 'Redecorate', target: "go('deco')" },
    { label: 'Retake', target: "go('setup')" },
    { label: 'New Session', target: "go('landing')" }
  ];
  actions.forEach(a => {
    if (!deco.includes(a.label)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing Result menu action: ${a.label}`);
      hasErrors = true;
    }
    const actionRegex = new RegExp(`${a.label}.*?${a.target.replace('(', '\\(').replace(')', '\\)')}`, 's');
    if (!actionRegex.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx Result action ${a.label} has incorrect routing (expected ${a.target})`);
      hasErrors = true;
    }
  });

  // Result More Menu Touch Polish (Phase 3.12)
  if (!deco.includes('width: 196') && !deco.includes('width: 200')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result More menu missing 196/200px width (touch UX risk)");
    hasErrors = true;
  }

  // QR/Video Preparing (Disabled) (Hardened)
  const qrPrepButton = deco.match(/<button[\s\S]*?QR Share[\s\S]*?Preparing[\s\S]*?<\/button>/);
  if (!qrPrepButton || !qrPrepButton[0].includes('disabled')) {
    console.error("❌ FAIL: QR Share (Preparing) must be disabled");
    hasErrors = true;
  }

  const videoPrepButton = deco.match(/<button[\s\S]*?Save Video[\s\S]*?Preparing[\s\S]*?<\/button>/);
  if (!videoPrepButton || !videoPrepButton[0].includes('disabled')) {
    console.error("❌ FAIL: Save Video (Preparing) must be disabled");
    hasErrors = true;
  }

  if (deco.includes('onClick={handleQrShare}') || deco.includes('onClick={handleVideoDownload}')) {
    // Check if these are connected to buttons that say Preparing
    if (qrPrepButton && qrPrepButton[0].includes('onClick={handleQrShare}')) {
      console.error("❌ FAIL: screens-v2-deco.jsx QR Share (Preparing) has functional onClick");
      hasErrors = true;
    }
    if (videoPrepButton && videoPrepButton[0].includes('onClick={handleVideoDownload}')) {
      console.error("❌ FAIL: screens-v2-deco.jsx Save Video (Preparing) has functional onClick");
      hasErrors = true;
    }
  }

  if (!deco.includes('getFormattedFilename')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getFormattedFilename function");
    hasErrors = true;
  }

  if (!deco.includes('IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png')) {
    console.error("❌ FAIL: screens-v2-deco.jsx incorrect filename format logic");
    hasErrors = true;
  }

  // Ensure filename always ends with .png
  if (deco.includes('getFormattedFilename') && !deco.includes('return `IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png`;')) {
    console.error("❌ FAIL: getFormattedFilename must return .png extension");
    hasErrors = true;
  }

  // Forbidden: reintroduction of Date.now() filenames
  if (deco.includes('IMMM_${Date.now()}.png')) {
    console.error("❌ FAIL: screens-v2-deco.jsx re-introduced Date.now() filename");
    hasErrors = true;
  }

  if (!deco.includes('navigator.share') || !deco.includes('navigator.canShare')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Web Share API check");
    hasErrors = true;
  }
  if (!deco.includes('addToast')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Toast notification system");
    hasErrors = true;
  }

  // Result Print Intro checks
  if (!deco.includes('ResultPrintIntro')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing ResultPrintIntro component");
    hasErrors = true;
  }
  if (!deco.includes('showPrintIntro')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing showPrintIntro state");
    hasErrors = true;
  }
  const timerMatch = deco.match(/setTimeout\(\(\)\s*=>\s*setShowPrintIntro\(false\),\s*(.+?)\)/);
  if (timerMatch) {
    const timeoutStr = timerMatch[1];
    if (/^\d+$/.test(timeoutStr)) {
      const timeout = parseInt(timeoutStr);
      if (timeout > 2300) {
        console.error(`❌ FAIL: ResultPrintIntro timeout is too long: ${timeout}ms (max 2300ms)`);
        hasErrors = true;
      }
    }
  }
  const forbiddenAssets = ['.gif', 'lottie'];
  forbiddenAssets.forEach(a => {
    if (deco.includes(a) && !deco.includes('handleVideoDownload')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited asset reference: ${a}`);
      hasErrors = true;
    }
  });

  // Hotfix checks: restored state
  if (!deco.includes('const [toasts, setToasts] = React.useState([])')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing toasts state");
    hasErrors = true;
  }
  if (!deco.includes('const [showMoreActions, setShowMoreActions] = React.useState(false)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing showMoreActions state");
    hasErrors = true;
  }
  if (deco.includes('toasts.map') && !deco.includes('const [toasts,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses toasts.map but missing state");
    hasErrors = true;
  }
  if (deco.includes('setToasts') && !deco.includes('const [toasts,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses setToasts but missing state");
    hasErrors = true;
  }
  if (deco.includes('showMoreActions') && !deco.includes('const [showMoreActions,')) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses showMoreActions but missing state");
    hasErrors = true;
  }

  // Phase 3.11 UX Polish: Menu Actions & Routing (Restored)
  if (!deco.includes('Redecorate') || !deco.includes('Retake') || !deco.includes('New Session')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Result menu action labels");
    hasErrors = true;
  }
  if (!deco.includes("go('deco')") || !deco.includes("go('setup')") || !deco.includes("go('landing')")) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing Result routing targets");
    hasErrors = true;
  }
  if (!deco.includes('setShowMoreActions(false)') || !deco.includes('setShowMoreActions(!showMoreActions)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing More menu toggle/close logic");
    hasErrors = true;
  }

  // Storage safety check
  const forbiddenClears = ['localStorage.clear', 'sessionStorage.clear', 'caches.delete', 'serviceWorker.unregister'];
  forbiddenClears.forEach(f => {
    if (deco.includes(f)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx contains prohibited storage/worker cleanup: ${f}`);
      hasErrors = true;
    }
  });

  // matchMedia guard check
  if (deco.includes('window.matchMedia') && !deco.includes("typeof window.matchMedia === 'function'")) {
    console.error("❌ FAIL: screens-v2-deco.jsx uses window.matchMedia without typeof check");
    hasErrors = true;
  }

  // Preview blank fix check (showPrintIntro dependency in draw effect)
  if (!deco.includes('showPrintIntro])')) {
    console.error("❌ FAIL: screens-v2-deco.jsx draw effect missing showPrintIntro dependency (preview blank risk)");
    hasErrors = true;
  }

  // Result Preview Recovery checks (Phase 3.9 Offscreen Render Hotfix)
  const resultStates = ['resultPreviewSrc', 'resultPreviewStatus', 'resultPreviewError'];
  resultStates.forEach(s => {
    if (!deco.includes(s)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing Result preview state: ${s}`);
      hasErrors = true;
    }
  });

  if (!deco.includes('renderFinalResultBlob')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing renderFinalResultBlob offscreen helper");
    hasErrors = true;
  }

  // Function-level containment checks for DOM capture risk
  const finalAssetFunctions = ['getFinalResultBlob', 'handleDownload', 'handleShare', 'buildFinalResultAsset', 'renderFinalResultBlob'];
  finalAssetFunctions.forEach(fn => {
    const fnRegex = new RegExp(`(const ${fn} =|async function ${fn}\\()`, 's');
    if (!fnRegex.test(deco)) {
      console.error(`❌ FAIL: screens-v2-deco.jsx missing required function: ${fn}`);
      hasErrors = true;
      return;
    }

    // Extract function body to check strictly
    const startIdx = deco.indexOf(fn);
    const body = deco.substring(startIdx, startIdx + 2500);

    if (fn === 'renderFinalResultBlob') {
      if (!body.includes("document.createElement('canvas')") || !body.includes('toBlob') || !body.includes('renderComposition')) {
        console.error("❌ FAIL: renderFinalResultBlob missing offscreen canvas or renderComposition/toBlob logic");
        hasErrors = true;
      }
    } else if (fn === 'getFinalResultBlob') {
      if (!body.includes('renderFinalResultBlob')) {
        console.error("❌ FAIL: getFinalResultBlob must use renderFinalResultBlob");
        hasErrors = true;
      }
    }

    if (body.includes('captureFrameAsBlob')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx function ${fn} contains captureFrameAsBlob`);
      hasErrors = true;
    }

    if (fn !== 'buildFinalResultAsset' && body.includes('captureRef')) {
      console.error(`❌ FAIL: screens-v2-deco.jsx function ${fn} contains captureRef`);
      hasErrors = true;
    }
  });

  if (!deco.includes('<img src={resultPreviewSrc}') && !deco.includes('src={resultPreviewSrc}')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result preview not using <img> with resultPreviewSrc");
    hasErrors = true;
  }

  // Result Preview Sizing Tuning (Phase 3.19 Final)
  if (!deco.includes('getResultPreviewBaseWidth')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getResultPreviewBaseWidth helper");
    hasErrors = true;
  }
  if (!deco.includes('targetHeightVh') || !deco.includes('maxHeightPx')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultPreviewFit missing targetHeightVh or maxHeightPx");
    hasErrors = true;
  }

  // Validate enlarged base widths
  if (!deco.includes('if (layoutId === \'strip\') return 340;')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing desktop strip base width 340");
    hasErrors = true;
  }
  if (!deco.includes('if (layoutId === \'strip\') return 230;')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing mobile strip base width 230");
    hasErrors = true;
  }

  // Validate enlarged maxScale
  const stripMaxScaleMatch = deco.match(/strip: \{ maxScale: isMobile \? \d+\.\d+ : (\d+\.\d+)/);
  if (stripMaxScaleMatch) {
    const val = parseFloat(stripMaxScaleMatch[1]);
    if (val < 2.2) {
      console.error(`❌ FAIL: screens-v2-deco.jsx desktop strip maxScale ${val} is too small (min 2.2)`);
      hasErrors = true;
    }
  }

  if (deco.includes('ResultPrintIntro') && (deco.includes('resultFrame=') || deco.includes('resultFrame:'))) {
    console.error("❌ FAIL: screens-v2-deco.jsx ResultPrintIntro still uses resultFrame (DOM risk)");
    hasErrors = true;
  }

  // Single Source usage check (Phase 3.8/3.9/3.10)
  if (!deco.includes('exportBlobRef.current = { key: getExportKey(), blob }')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing asset caching for Save/Share");
    hasErrors = true;
  }
  // Deco Zoom Fit checks
  if (!deco.includes('getDecoFitMaxScale')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getDecoFitMaxScale helper");
    hasErrors = true;
  }

  if (deco.includes('minHeight: mobile ? \'clamp')) {
    if (!deco.includes('660px')) {
      console.error("❌ FAIL: screens-v2-deco.jsx Result preview container missing enlarged clamp height (660px)");
      hasErrors = true;
    }
  }

  // Result Final Display Sizing (Phase 3.23 - 3.26)
  if (!deco.includes('getResultDisplayFit')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing getResultDisplayFit helper");
    hasErrors = true;
  }
  if (!deco.includes('resultStageHeight')) {
    console.error("❌ FAIL: screens-v2-deco.jsx missing resultStageHeight helper");
    hasErrors = true;
  }
  
  // Phase 3.26 Row Budget Grid Layout Check (Content-bound)
  if (!deco.includes('gridTemplateRows: \'auto auto auto auto\'') || !deco.includes('alignContent: \'start\'')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result desktop root missing content-bound grid template");
    hasErrors = true;
  }

  // Validate strip specific rules in getResultDisplayFit (Updated for Phase 3.26)
  if (!deco.includes('minScale: isMobile ? 0.76 : 0.70')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultDisplayFit missing strip minScale rules (expected 0.70 for desktop)");
    hasErrors = true;
  }
  if (!deco.includes('targetHeightVh: isMobile ? 52 : 58')) {
    console.error("❌ FAIL: screens-v2-deco.jsx getResultDisplayFit missing strip targetHeightVh rules (expected 58 for desktop)");
    hasErrors = true;
  }

  // Validate container height rules (Updated for Phase 3.26)
  if (!deco.includes('clamp(520px, 58vh, 700px)')) {
    console.error("❌ FAIL: screens-v2-deco.jsx resultStageHeight missing desktop strip clamp height (expected 700px max)");
    hasErrors = true;
  }

  if (!deco.includes('marginTop: 4')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result action row marginTop too large (expected 4)");
    hasErrors = true;
  }

  if (!deco.includes('marginBottom: 2')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result title block marginBottom too large (expected 2)");
    hasErrors = true;
  }

  if (!deco.includes('padding: 0, height: resultStageHeight')) {
    console.error("❌ FAIL: screens-v2-deco.jsx Result preview container missing zero padding or height binding");
    hasErrors = true;
  }
}

function checkCameraCapabilityHarden() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  // Phase 3.28 Strict Diagnostics
  if (!main.includes('function getCameraDebugSnapshot') && !main.includes('getCameraDebugSnapshot = React.useCallback')) {
    console.error("❌ FAIL: main.jsx missing getCameraDebugSnapshot helper");
    hasErrors = true;
  }

  // Phase 3.28 Hardware Zoom Verification (Strict)
  if (!main.includes('applyCameraZoom') || !main.includes('reason:') || !main.includes('ok:')) {
    console.error("❌ FAIL: main.jsx missing applyCameraZoom result object return (ok/path/reason)");
    hasErrors = true;
  }
  
  if (main.includes('afterZoom === undefined') && main.includes('return true')) {
     // Check if undefined is still treated as success
     const lines = main.split('\n');
     const undefLine = lines.findIndex(l => l.includes('afterZoom === undefined'));
     if (undefLine !== -1 && (lines[undefLine+1].includes('return true') || lines[undefLine+2].includes('return true'))) {
        console.error("❌ FAIL: main.jsx treats undefined afterZoom as success (false positive)");
        hasErrors = true;
     }
  }

  // Phase 3.28 Device Switch Verification (Strict)
  if (!main.includes('switchCameraDevice') || !main.includes('reason:')) {
    console.error("❌ FAIL: main.jsx missing switchCameraDevice result object return");
    hasErrors = true;
  }

  // Phase 3.28 Debug Manual Picker
  if (!rest.includes('DebugWideDevicePicker') || !rest.includes('cameraDevices.map')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing manual DebugWideDevicePicker");
    hasErrors = true;
  }

  // Forbidden Fake Wide
  const forbidden = [
    'scale(0.6)', 'transform: \'scale(0.6)\'', 'drawImage(.*0.6.*)', 'ctx.scale(0.6)'
  ];
  forbidden.forEach(pat => {
    if (new RegExp(pat).test(main) || new RegExp(pat).test(rest)) {
      console.error(`❌ FAIL: Forbidden fake wide implementation found: ${pat}`);
      hasErrors = true;
    }
  });

  // Debug Reason/Path Tracking
  if (!main.includes('lastWideToggleReason') || !rest.includes('lastWideTogglePath')) {
    console.error("❌ FAIL: Camera toggle diagnostics missing in main/rest");
    hasErrors = true;
  }
}

function checkCameraDiagnosticFinal() {
  const main = fs.readFileSync('main.jsx', 'utf8');
  const rest = fs.readFileSync('screens-v2-rest.jsx', 'utf8');

  // Phase 3.29 onDebugSwitchCameraDevice
  if (!main.includes('onDebugSwitchCameraDevice') || !rest.includes('onDebugSwitchCameraDevice')) {
    console.error("❌ FAIL: main/rest missing onDebugSwitchCameraDevice helper");
    hasErrors = true;
  }

  // Phase 3.29 switch verification hardening
  if (main.includes('settings.label')) {
     console.error("❌ FAIL: main.jsx still uses unreliable settings.label for verification");
     hasErrors = true;
  }
  if (!main.includes('unverified-device-switch')) {
     console.error("❌ FAIL: main.jsx missing unverified-device-switch reason for hidden deviceIds");
     hasErrors = true;
  }

  // Phase 3.29 merged reasons
  if (!main.includes('hardware:') || !main.includes('device:')) {
     console.error("❌ FAIL: main.jsx missing merged hardware/device failure reasons");
     hasErrors = true;
  }

  // Phase 3.29 cameraToggleBusy
  if (!rest.includes('disabled={cameraToggleBusy}') || !rest.includes('cameraToggleBusy ? \'...\'')) {
     console.error("❌ FAIL: screens-v2-rest.jsx missing busy state visual feedback on buttons");
     hasErrors = true;
  }

  // Phase 3.29 debug picker logic
  if (rest.includes('onClick={() => switchCameraDevice?.(d.deviceId)}')) {
     console.error("❌ FAIL: DebugWideDevicePicker calling switchCameraDevice directly (should use onDebugSwitchCameraDevice)");
     hasErrors = true;
  }
  
  if (!rest.includes('groupId')) {
     console.error("❌ FAIL: DebugWideDevicePicker missing groupId display");
     hasErrors = true;
  }
}

function checkCleanCottonTheme() {
  const index = fs.existsSync('index.html') ? fs.readFileSync('index.html', 'utf8') : null;
  const setup = fs.existsSync('screens-v2.jsx') ? fs.readFileSync('screens-v2.jsx', 'utf8') : null;
  const app = fs.existsSync('app.jsx') ? fs.readFileSync('app.jsx', 'utf8') : null;
  const fsys = fs.existsSync('frame-system.jsx') ? fs.readFileSync('frame-system.jsx', 'utf8') : null;

  if (index && !index.includes('#FCFCFA')) {
    console.error("❌ FAIL: index.html missing clean cotton background #FCFCFA");
    hasErrors = true;
  }
  if (app && !app.includes("bg: '#FCFCFA'")) {
    console.error("❌ FAIL: app.jsx TOKENS.A missing clean cotton background #FCFCFA");
    hasErrors = true;
  }
  if (setup) {
    if (!setup.includes('T.bgAlt') && !setup.includes('#F8F8F5')) {
      console.error("❌ FAIL: screens-v2.jsx missing clean cotton stage background token (T.bgAlt or #F8F8F5)");
      hasErrors = true;
    }
    if (!setup.includes('T.line') && !setup.includes('#E5E2DA')) {
      console.error("❌ FAIL: screens-v2.jsx missing frame picker card border token (T.line or #E5E2DA)");
      hasErrors = true;
    }
    if (setup.includes('#FDFCF8')) {
      // Check if it's in a comment or active code. The prompt says remove it from Setup background.
      const lines = setup.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('#FDFCF8') && !line.trim().startsWith('//')) {
          console.warn(`⚠️ WARN: screens-v2.jsx:L${i + 1} still contains #FDFCF8. Ensure it is not active background.`);
        }
      });
    }
  }

  // Forbidden leakage/modification checks
  if (fsys && (fsys.includes('#FCFCFA') || fsys.includes('#F8F8F5'))) {
    console.error("❌ FAIL: frame-system.jsx contains clean cotton tokens (must not be modified)");
    hasErrors = true;
  }

  // Palette preservation check (defined in screens-v2.jsx UI)
  if (setup) {
    const palette = ['#F1C0C5', '#A6C8DE', '#E6C8BE', '#A2352B'];
    palette.forEach(c => {
      if (!setup.toLowerCase().includes(c.toLowerCase())) {
        console.error(`❌ FAIL: screens-v2.jsx missing original palette color: ${c}`);
        hasErrors = true;
      }
    });
  }
}

function checkStrayFiles() {
  const strayFiles = ['pgpt.mjs', 'pgpt_daemon.py'];
  strayFiles.forEach(f => {
    if (fs.existsSync(f)) {
      console.error(`❌ FAIL: IMMM workspace contains stray file: ${f}`);
      hasErrors = true;
    }
  });

  try {
    const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
    if (gitFiles.includes('pgpt')) {
      console.error(`❌ FAIL: IMMM workspace git tracks stray pgpt files`);
      hasErrors = true;
    }
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.includes('pgpt')) {
      console.error(`❌ FAIL: IMMM workspace has dirty/untracked pgpt files:\n${gitStatus.split('\n').filter(l => l.includes('pgpt')).join('\n')}`);
      hasErrors = true;
    }
  } catch (e) { }
}

function checkFramePickerResilience() {
  if (!fs.existsSync('screens-v2.jsx')) return;
  const v2 = fs.readFileSync('screens-v2.jsx', 'utf8');

  if (v2.includes('if (!tpl) return null;')) {
    console.error("❌ FAIL: screens-v2.jsx contains 'if (!tpl) return null;' which hides frame buttons");
    hasErrors = true;
  }
  if (!v2.includes('function FramePickerFallback')) {
    console.error("❌ FAIL: screens-v2.jsx missing FramePickerFallback component");
    hasErrors = true;
  }
  if (!v2.includes('canRenderRealThumb') && !v2.includes('Boolean(WFrameThumb && tpl)')) {
    console.error("❌ FAIL: screens-v2.jsx missing canRenderRealThumb guard for frame picker");
    hasErrors = true;
  }

  // Declaration order check
  const tplIdx = v2.indexOf('const tpl = resolveFrameTemplate(o.id)');
  const thumbIdx = v2.indexOf('const canRenderRealThumb =');
  if (tplIdx === -1) {
    console.error("❌ FAIL: screens-v2.jsx missing 'const tpl = resolveFrameTemplate(o.id)'");
    hasErrors = true;
  } else if (thumbIdx !== -1 && thumbIdx < tplIdx) {
    console.error("❌ FAIL: screens-v2.jsx 'canRenderRealThumb' declared before 'tpl'");
    hasErrors = true;
  }
  // Check for sibling overlay (should be ternary/conditional)
  if (v2.includes('<FramePickerFallback') && v2.includes('<WFrameThumb') && v2.indexOf('<FramePickerFallback') < v2.indexOf('<WFrameThumb')) {
    const framePickerSection = v2.substring(v2.indexOf('frameTab'), v2.indexOf('filterTab'));
    if (framePickerSection.includes('<FramePickerFallback') && framePickerSection.includes('<WFrameThumb')) {
      // If they are both present without a ternary operator nearby
      if (!framePickerSection.includes('?')) {
        console.error("❌ FAIL: screens-v2.jsx frame picker might be overlaying fallback and real thumb");
        hasErrors = true;
      }
    }
  }
  if (v2.includes('Frame preview unavailable')) {
    console.error("❌ FAIL: screens-v2.jsx should not use 'Frame preview unavailable' text");
    hasErrors = true;
  }
  if (!v2.includes('setLayout(o.id)')) {
    console.error("❌ FAIL: screens-v2.jsx frame picker buttons missing setLayout call");
    hasErrors = true;
  }
}

function checkStabilityAuditDocumented() {
  if (!fs.existsSync('task.md')) return;
  const task = fs.readFileSync('task.md', 'utf8');
  if (!task.includes('## Full App Bottleneck & Risk Audit (Phase 3.31)')) {
    console.error("❌ FAIL: task.md missing finalized stability audit section (Phase 3.31)");
    hasErrors = true;
  }
  if (!task.includes('## Runtime Production UMD Hotfix (Phase 3.32)')) {
    console.error("❌ FAIL: task.md missing finalized stability audit section (Phase 3.32)");
    hasErrors = true;
  }
  if (!task.includes('## Babel Standalone Removal Scope (Phase 3.33)')) {
    console.error("❌ FAIL: task.md missing Babel Standalone Removal Scope (Phase 3.33)");
    hasErrors = true;
  }
  if (!task.includes('## Blob URL Lifecycle Cleanup (Phase 3.34)')) {
    console.error("❌ FAIL: task.md missing Blob URL Lifecycle Cleanup (Phase 3.34)");
    hasErrors = true;
  }
  if (!task.includes('| Priority | Area | File | Risk | Symptom | Recommendation | Follow-up Commit |')) {
    console.error("❌ FAIL: task.md missing risk table header");
    hasErrors = true;
  }
  if (!task.includes('React UMD switched from development to production')) {
    console.error("❌ FAIL: task.md missing React production UMD confirmation in Phase 3.32");
    hasErrors = true;
  }
  if (!task.includes('Babel standalone removed via production build pipeline')) {
    console.error("❌ FAIL: task.md missing Babel removal goal in Phase 3.32");
    hasErrors = true;
  }
  if (!task.includes('Choose build strategy')) {
    console.error("❌ FAIL: task.md missing 'Choose build strategy' in Phase 3.33");
    hasErrors = true;
  }
  if (!task.includes('iOS long-press save URL not revoked immediately')) {
    console.error("❌ FAIL: task.md missing iOS long-press save URL guard in Phase 3.34");
    hasErrors = true;
  }
}

function checkBlobUrlLifecycle() {
  const deco = readFile('screens-v2-deco.jsx');
  const fsys = readFile('frame-system.jsx');

  if (deco) {
    if (!deco.includes('resultPreviewUrlRef')) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing resultPreviewUrlRef for blob lifecycle");
      hasErrors = true;
    }
    if (!deco.includes('saveSheetUrlRef')) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing saveSheetUrlRef for blob lifecycle");
      hasErrors = true;
    }
    if (deco.includes('setTimeout(() => URL.revokeObjectURL(saveSheetUrl),')) {
       console.error("❌ FAIL: screens-v2-deco.jsx uses immediate timeout for saveSheetUrl (unstable on iOS)");
       hasErrors = true;
    }
    if (!deco.includes('function revokeBlobUrl(url)')) {
       console.error("❌ FAIL: screens-v2-deco.jsx missing revokeBlobUrl helper");
       hasErrors = true;
    }
    // Verify helper usage
    const lines = deco.split('\n');
    let inHelper = false;
    lines.forEach((l, i) => {
      if (l.includes('function revokeBlobUrl')) inHelper = true;
      if (!inHelper && l.includes('URL.revokeObjectURL')) {
        console.error(`❌ FAIL: screens-v2-deco.jsx:L${i+1} manual URL.revokeObjectURL call detected`);
        hasErrors = true;
      }
      if (inHelper && l.includes('}')) inHelper = false;
    });
  }

  if (fsys) {
    if (!fsys.includes('revokeShare') || !fsys.includes('clearExpired')) {
      console.error("❌ FAIL: frame-system.jsx missing ShareStore cleanup methods");
      hasErrors = true;
    }
    if (!fsys.includes('localUrls: new Map()')) {
      console.error("❌ FAIL: frame-system.jsx missing localUrls map for ShareStore lifecycle");
      hasErrors = true;
    }
    if (!fsys.includes('function revokeBlobUrl(url)')) {
       console.error("❌ FAIL: frame-system.jsx missing revokeBlobUrl helper");
       hasErrors = true;
    }
  }
}

function checkReactProductionMode() {
  if (!fs.existsSync('index.html')) return;
  const index = fs.readFileSync('index.html', 'utf8');
  if (index.includes('react.development.js') || index.includes('react-dom.development.js')) {
    console.error("❌ FAIL: index.html is using React development build (P0 Risk)");
    hasErrors = true;
  }
  if (!index.includes('react.production.min.js') || !index.includes('react-dom.production.min.js')) {
    console.error("❌ FAIL: index.html missing React production build");
    hasErrors = true;
  }
  if (index.includes('@babel/standalone')) {
    console.warn("⚠️ WARN: index.html is using Babel standalone runtime (P0 Risk)");
  }
}

console.log('🔍 Running IMMM COMPREHENSIVE Hardened Sanity Checks...');
checkRuntimeVersion();
checkWidePickerSafety();
checkWebGL();
checkVisibleFilters();
checkWebglVisiblePipelines();
checkEmergencyFaceSafety();
checkEmergencyFrameGlobals();
checkEmergencyServiceWorker();
checkAppStability();
checkCameraCapabilityHarden();
checkCameraDiagnosticFinal();
checkCleanCottonTheme();
checkFrameSystem();
checkStickerEngine();
checkCapture();
checkSetupAndDecoStickerCanvas();
checkDeco();
checkFrameThemeUnification();
checkTask();
checkPhaseCCameraZoom();
checkResultUX();
checkFramePickerResilience();
checkStrayFiles();
checkBlobUrlLifecycle();
checkStabilityAuditDocumented();
checkReactProductionMode();


if (hasErrors) {
  console.error('\n💥 Sanity check failed! DO NOT REMOVE GUARDS. FIX THE CODE.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed. Zero-Distortion & Zero-Crash baseline restored.');
}
