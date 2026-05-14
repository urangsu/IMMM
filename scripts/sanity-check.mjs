import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'node:vm';

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

function checkRepositoryScope() {
  const taskContent = readFile('task.md');
  if (!taskContent) return;

  if (!taskContent.includes('## Repository Scope Guard')) {
    console.error('❌ FAIL: task.md missing "## Repository Scope Guard" section');
    hasErrors = true;
  }

  if (taskContent.includes('MyTeam is out of scope') && taskContent.includes('/Users/su/Desktop/MyTeam')) {
    // Basic presence check passed
  } else {
     console.error('❌ FAIL: task.md Repository Scope Guard section is incomplete');
     hasErrors = true;
  }

  // Cross-repo mention check in new task sections
  const lines = taskContent.split('\n');
  let currentHeader = '';
  lines.forEach(line => {
    if (line.startsWith('## ')) currentHeader = line;
    if (currentHeader.includes('Phase 3.54') || currentHeader.includes('Current Execution')) {
       if (line.includes('MyTeam') && !line.includes('out of scope') && !line.includes('Guard')) {
         console.error('❌ FAIL: Unauthorized MyTeam mention in task.md');
         hasErrors = true;
       }
       if (line.includes('TASK.md')) {
         console.error('❌ FAIL: Unauthorized TASK.md mention in task.md');
         hasErrors = true;
       }
    }
  });

  // Verify git root if possible (optional but recommended in shell context)
  if (rootDir.includes('MyTeam')) {
    console.error('❌ FAIL: Sanity check running from wrong repository root (MyTeam detected)');
    hasErrors = true;
  }
}

checkRepositoryScope();

function checkCaptureSessionSystem() {
  const model = readFile('session-model.jsx');
  const adapter = readFile('session-adapter.jsx');
  
  if (!model) {
    console.error('❌ FAIL: session-model.jsx missing');
    hasErrors = true;
    return;
  }
  if (!adapter) {
    console.error('❌ FAIL: session-adapter.jsx missing');
    hasErrors = true;
    return;
  }

  // Model required strings
  const modelRequired = [
    'window.IMMMSessionModel',
    'SESSION_MODES',
    'MEDIA_TYPES',
    'SOURCE_TYPES',
    'SHARE_STATUSES',
    'EXPORT_STATUSES',
    'createCaptureSession',
    'createMediaAsset',
    'createSelectedCut',
    'createRenderRecipe',
    'createEditRecipe',
    'createShareState',
    'createExportState',
    'validateCaptureSession',
    'normalizeCaptureSession',
    'runSessionModelSelfTest',
    'clonePlain'
  ];

  modelRequired.forEach(r => {
    if (!model.includes(r)) {
      console.error(`❌ FAIL: session-model.jsx missing ${r}`);
      hasErrors = true;
    }
  });

  // Adapter required strings
  const adapterRequired = [
    'window.IMMMSessionAdapter',
    'ADAPTER_VERSION',
    'createSessionSnapshot',
    'createMediaAssetsFromShots',
    'createSelectedCutsFromSelection',
    'createRenderRecipeFromAppState',
    'createEditRecipeFromAppState',
    'createResultAssetContract',
    'runSessionAdapterSelfTest'
  ];

  adapterRequired.forEach(r => {
    if (!adapter.includes(r)) {
      console.error(`❌ FAIL: session-adapter.jsx missing ${r}`);
      hasErrors = true;
    }
  });

  const distModel = readFile('dist/session-model.js');
  const distAdapter = readFile('dist/session-adapter.js');

  if (distModel && distAdapter) {
    if (!distModel.includes('runSessionModelSelfTest')) {
      console.error('❌ FAIL: dist/session-model.js missing runSessionModelSelfTest');
      hasErrors = true;
    }
    if (!distAdapter.includes('runSessionAdapterSelfTest')) {
      console.error('❌ FAIL: dist/session-adapter.js missing runSessionAdapterSelfTest');
      hasErrors = true;
    }

    if (!hasErrors) {
      // Execute actual self-tests in VM
      try {
        const sandbox = {
          window: {},
          crypto: { randomUUID: () => 'test-uuid-0000-1111' },
          Date,
          Math,
          console
        };
        vm.createContext(sandbox);
        
        // Order matters: model then adapter
        vm.runInContext(distModel, sandbox);
        vm.runInContext(distAdapter, sandbox);

        const modelObj = sandbox.window.IMMMSessionModel;
        const adapterObj = sandbox.window.IMMMSessionAdapter;

        if (!modelObj) throw new Error('window.IMMMSessionModel not found after execution');
        if (!adapterObj) throw new Error('window.IMMMSessionAdapter not found after execution');

        // 1. Model Positive self-test
        const modelTestResult = modelObj.runSessionModelSelfTest();
        if (!modelTestResult.ok) {
          console.error('❌ FAIL: IMMMSessionModel.runSessionModelSelfTest() failed:', modelTestResult.errors);
          hasErrors = true;
        }

        // 2. Adapter Positive self-test
        const adapterTestResult = adapterObj.runSessionAdapterSelfTest();
        if (!adapterTestResult.ok) {
          console.error('❌ FAIL: IMMMSessionAdapter.runSessionAdapterSelfTest() failed:', adapterTestResult.errors);
          hasErrors = true;
        }

        // 3. Negative tests (Model)
        const badMode = modelObj.createCaptureSession({ mode: 'invalid_mode_xyz' });
        if (modelObj.validateCaptureSession(badMode).ok) {
          console.error('❌ FAIL: validateCaptureSession allowed invalid mode');
          hasErrors = true;
        }

      } catch (err) {
        console.error('💥 FAIL: Exception during Session System VM self-test execution:', err.message);
        hasErrors = true;
      }
    }
  }

  const build = readFile('scripts/build-precompile.mjs');
  if (build) {
    if (!build.includes('session-model.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing session-model.jsx');
      hasErrors = true;
    }
    if (!build.includes('session-adapter.jsx')) {
      console.error('❌ FAIL: build-precompile.mjs manifest missing session-adapter.jsx');
      hasErrors = true;
    }
  }

  const index = readFile('index.html');
  if (index) {
    ['dist/session-model.js', 'dist/session-adapter.js'].forEach(d => {
      if (!index.includes(d)) {
        console.error(`❌ FAIL: index.html missing ${d}`);
        hasErrors = true;
      }
    });

    const modelIdx = index.indexOf('dist/session-model.js');
    const adapterIdx = index.indexOf('dist/session-adapter.js');
    const systemIdx = index.indexOf('dist/frame-system.js');
    
    if (modelIdx > adapterIdx) {
      console.error('❌ FAIL: session-model.js must be loaded BEFORE session-adapter.js');
      hasErrors = true;
    }
    if (adapterIdx > systemIdx) {
      console.error('❌ FAIL: session-adapter.js must be loaded BEFORE frame-system.js');
      hasErrors = true;
    }
  }

  const sw = readFile('sw.js');
  if (sw) {
    if (!sw.includes('./dist/session-model.js')) {
      console.error('❌ FAIL: sw.js ASSETS missing ./dist/session-model.js');
      hasErrors = true;
    }
    if (!sw.includes('./dist/session-adapter.js')) {
      console.error('❌ FAIL: sw.js ASSETS missing ./dist/session-adapter.js');
      hasErrors = true;
    }
  }
}

checkCaptureSessionSystem();

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
  if (!rest.includes('toggleWideCamera')) { console.error("❌ FAIL: screens-v2-rest.jsx missing toggleWideCamera prop/usage"); hasErrors = true; }
  
  if (rest.includes('cameraZoomOptions.map')) {
    // Zoom rail architecture confirmed
    if (!rest.includes('opt.label') || !rest.includes('setCameraZoom(opt.value)')) {
       console.error("❌ FAIL: screens-v2-rest.jsx zoom rail mapping is incomplete");
       hasErrors = true;
    }
  } else {
    console.error("❌ FAIL: screens-v2-rest.jsx missing zoom rail (cameraZoomOptions.map)");
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

  if (!html.includes('IMMM_APP_VERSION = \'2026-05-12-rc2.3\'')) {
    console.error("❌ FAIL: index.html missing or incorrect IMMM_APP_VERSION");
    hasErrors = true;
  }
  if (!html.includes('IMMM_BUILD_LABEL = \'rc2.3-precompiled-entry\'')) {
    console.error("❌ FAIL: index.html missing IMMM_BUILD_LABEL");
    hasErrors = true;
  }
  if (html.includes('IMMM_COMMIT = \'91bc1ba\'')) {
    console.error("❌ FAIL: index.html contains misleading IMMM_COMMIT = '91bc1ba'");
    hasErrors = true;
  }
  if (!html.includes('IMMM_RC_BASELINE = \'b3f7f1c\'')) {
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
  if (!sw.includes('immm-cache-v7-') && !sw.includes('immm-cache-v8-') && !sw.includes('immm-cache-v9-')) {
    console.error("❌ FAIL: sw.js missing recent immm-cache version (v7, v8 or v9)");
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
    // Verify helper usage
    const lines = fsys.split('\n');
    let inHelper = false;
    lines.forEach((l, i) => {
      if (l.includes('function revokeBlobUrl')) inHelper = true;
      if (!inHelper && l.includes('URL.revokeObjectURL')) {
        console.error(`❌ FAIL: frame-system.jsx:L${i+1} manual URL.revokeObjectURL call detected`);
        hasErrors = true;
      }
      if (inHelper && l.includes('}')) inHelper = false;
    });
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
function checkStickerPreload() {
  const fsys = readFile('frame-system.jsx');
  if (!fsys) return;

  const order = [
    'function drawFallbackSticker',
    'function collectUploadStickerSources',
    'async function preloadStickerImages',
    'async function drawStickerToCtx'
  ];

  let lastIndex = -1;
  order.forEach(fn => {
    const idx = fsys.indexOf(fn);
    if (idx === -1) {
      console.error(`❌ FAIL: frame-system.jsx missing ${fn}`);
      hasErrors = true;
    } else if (idx < lastIndex) {
      console.error(`❌ FAIL: frame-system.jsx helper order incorrect: ${fn} appears before its predecessor`);
      hasErrors = true;
    }
    lastIndex = idx;
  });

  // Nesting check: ensure no helpers are defined inside drawFallbackSticker
  const startIdx = fsys.indexOf('function drawFallbackSticker');
  const endIdx = fsys.indexOf('function collectUploadStickerSources');
  if (startIdx !== -1 && endIdx !== -1) {
    const body = fsys.slice(startIdx, endIdx);
    if (body.includes('async function') || body.includes('function collectUploadStickerSources')) {
       console.error("❌ FAIL: frame-system.jsx has nested helpers inside drawFallbackSticker (missing closing brace?)");
       hasErrors = true;
    }
  }

  const requirements = [
    'collectUploadStickerSources',
    'preloadStickerImages',
    'uploadImages',
    'Promise.all',
    'drawStickerToCtx(ctx, local, sw, sh, scale, stickerAssets)',
    'drawStickerToCtx(ctx, s, w, h, scale, stickerAssets)',
    'assets.uploadImages.get'
  ];

  requirements.forEach(req => {
    if (!fsys.includes(req)) {
      console.error(`❌ FAIL: frame-system.jsx missing sticker preload requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (!fsys.includes('preloadStickerImages(data.stickers || [])')) {
      console.error("❌ FAIL: renderComposition missing preloadStickerImages call");
      hasErrors = true;
  }

  if (!fsys.includes('catch (err)') || !fsys.includes('return [src, null]')) {
      console.error("❌ FAIL: preloadStickerImages missing failure isolation (try-catch or null return)");
      hasErrors = true;
  }

  if (!fsys.includes('uploadImages?.has')) {
      console.error("❌ FAIL: drawStickerToCtx missing preload existence check (uploadImages?.has)");
      hasErrors = true;
  }

  const perfRequirements = [
    'isExportPerfDebugEnabled',
    'logExportPerf',
    'nowMs',
    '[IMMM export perf]',
    'sticker-preload',
    'render-total'
  ];

  perfRequirements.forEach(req => {
    if (!fsys.includes(req)) {
      console.error(`❌ FAIL: frame-system.jsx missing export perf requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (!fsys.includes('if (isExportPerfDebugEnabled())') || !fsys.includes('sticker preload failed')) {
      console.error("❌ FAIL: frame-system.jsx sticker preload failure warning not wrapped in debug check");
      hasErrors = true;
  }
}

function checkBabelMigrationPlan() {
  const task = readFile('task.md');
  if (!task) return;

  const requirements = [
    'Babel Standalone Removal Build Plan',
    'Script Inventory',
    'Global / API Dependency Map',
    'Build Strategy Selection',
    'Babel CLI Precompile',
    'Build Manifest Strategy',
    'Do not use glob order',
    'index.precompiled.html',
    'babel app.jsx filters.jsx webgl-engine.jsx',
    '`app.jsx` -> `dist/app.js`',
    '`main.jsx` -> `dist/main.js`'
  ];

  requirements.forEach(req => {
    if (!task.includes(req)) {
      console.error(`❌ FAIL: task.md missing Babel migration plan requirement: ${req}`);
      hasErrors = true;
    }
  });

  if (task.includes('babel scripts/*.jsx')) {
      console.error("❌ FAIL: task.md contains incorrect build command 'babel scripts/*.jsx'");
      hasErrors = true;
  }

  const index = readFile('index.html');
  if (index) {
    // Phase 3.52: @babel/standalone must be removed from index.html
    if (index.includes('@babel/standalone')) {
      console.error('❌ FAIL: index.html still contains @babel/standalone (Phase 3.52: production entry switch required)');
      hasErrors = true;
    }
    if (index.includes('type="text/babel"')) {
      console.error('❌ FAIL: index.html still contains type="text/babel" (Phase 3.52: production entry switch required)');
      hasErrors = true;
    }
    // Must load dist scripts in order
    const distOrder = ['dist/app.js','dist/filters.js','dist/webgl-engine.js','dist/mediapipe-face.js',
      'dist/sticker-engine.js','dist/frame-system.js','dist/screens-v2.js',
      'dist/screens-v2-rest.js','dist/screens-v2-deco.js','dist/main.js'];
    let lastIdx = -1;
    let orderOk = true;
    distOrder.forEach(s => {
      const pos = index.indexOf(s);
      if (pos === -1) { orderOk = false; }
      else if (pos < lastIdx) { orderOk = false; }
      else lastIdx = pos;
    });
    if (!orderOk) {
      console.error('❌ FAIL: index.html dist script order does not match manifest order');
      hasErrors = true;
    }
  }

  const packageJson = readFile('package.json');
  if (packageJson) {
    if (!packageJson.includes('build:precompile')) {
       console.error('❌ FAIL: package.json missing build:precompile script');
       hasErrors = true;
    }
  } else {
    console.error('❌ FAIL: package.json missing (Phase 3.40 requirement)');
    hasErrors = true;
  }
  // Phase 3.40 Artifact Checks (precompiled.html remains Babel-free)
  const precompiled = readFile('index.precompiled.html');
  if (precompiled) {
    if (precompiled.includes('@babel/standalone')) {
      console.error('❌ FAIL: index.precompiled.html still contains @babel/standalone');
      hasErrors = true;
    }
    if (precompiled.includes('type="text/babel"')) {
      console.error('❌ FAIL: index.precompiled.html still contains type="text/babel"');
      hasErrors = true;
    }
    if (!precompiled.includes('dist/main.js')) {
      console.error('❌ FAIL: index.precompiled.html missing dist/main.js entry');
      hasErrors = true;
    }
  } else {
    console.warn('⚠️ WARN: index.precompiled.html not found (Phase 3.40 incomplete)');
  }

  // Phase 3.52 & 3.56: sw.js CACHE_NAME and dist precache guards
  const swJs = readFile('sw.js');
  if (swJs) {
    if (!swJs.includes('rc2.3-precompiled') && !swJs.includes('v7-') && !swJs.includes('v8-') && !swJs.includes('v9-')) {
      console.error('❌ FAIL: sw.js CACHE_NAME not bumped to rc2.3-precompiled, v8 or v9 series');
      hasErrors = true;
    }
    ['dist/app.js','dist/filters.js','dist/webgl-engine.js','dist/screens-v2-rest.js','dist/main.js'].forEach(d => {
      if (!swJs.includes(d)) {
        console.error(`❌ FAIL: sw.js ASSETS missing ${d}`);
        hasErrors = true;
      }
    });
    if (!swJs.includes('self.skipWaiting()')) {
      console.error('❌ FAIL: sw.js missing skipWaiting');
      hasErrors = true;
    }
    if (!swJs.includes('self.clients.claim')) {
      console.error('❌ FAIL: sw.js missing clients.claim');
      hasErrors = true;
    }
  }

  // Phase 3.52: QR / Video disabled guard
  const deco = readFile('screens-v2-deco.jsx');
  if (deco) {
    // handleQrShare / handleVideoDownload must NOT be wired to onClick directly
    const qrClickPattern = /onClick\s*=\s*\{[^}]*handleQrShare/;
    const videoClickPattern = /onClick\s*=\s*\{[^}]*handleVideoDownload/;
    if (qrClickPattern.test(deco)) {
      console.error('❌ FAIL: screens-v2-deco.jsx handleQrShare is wired to onClick (must stay disabled)');
      hasErrors = true;
    }
    if (videoClickPattern.test(deco)) {
      console.error('❌ FAIL: screens-v2-deco.jsx handleVideoDownload is wired to onClick (must stay disabled)');
      hasErrors = true;
    }
    // captureFrameAsBlob must NOT appear in final asset path
    if (deco.includes('captureFrameAsBlob') && deco.includes('getFinalResultBlob')) {
      console.error('❌ FAIL: screens-v2-deco.jsx captureFrameAsBlob found in final asset path context');
      hasErrors = true;
    }
    if (!deco.includes('renderFinalResultBlob')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing renderFinalResultBlob (result export path broken)');
      hasErrors = true;
    }
  }

  // Phase 3.52: task.md gate sections
  const task352 = readFile('task.md');
  if (task352) {
    if (!task352.includes('1×4 Preview / Capture / Export Crop Parity Gate')) {
      console.error('❌ FAIL: task.md missing 1×4 Crop Parity Gate section');
      hasErrors = true;
    }
    if (!task352.includes('QR / Video Production Gate')) {
      console.error('❌ FAIL: task.md missing QR / Video Production Gate section');
      hasErrors = true;
    }
    if (!task352.includes('CaptureSession Model Contract')) {
      console.error('❌ FAIL: task.md missing CaptureSession Model Contract section');
      hasErrors = true;
    }
    if (!task352.includes('Production Precompiled Entry Switch + Crop Parity Gate (Phase 3.52)')) {
      console.error('❌ FAIL: task.md missing Phase 3.52 section');
      hasErrors = true;
    }
  }

  const buildScript = readFile('scripts/build-precompile.mjs');
  if (buildScript) {
    if (!buildScript.includes('process.exit(1)') || !buildScript.includes('console.error')) {
      console.error('❌ FAIL: scripts/build-precompile.mjs must fail (process.exit(1)) on import/export');
      hasErrors = true;
    }
    if (buildScript.includes('console.warn') && (buildScript.includes('import/export') || buildScript.includes('import ') || buildScript.includes('export '))) {
      console.error('❌ FAIL: scripts/build-precompile.mjs must not just warn on import/export');
      hasErrors = true;
    }
    if (!buildScript.includes('plugin-transform-block-scoping')) {
      console.error('❌ FAIL: scripts/build-precompile.mjs missing @babel/plugin-transform-block-scoping (required to prevent classic script lexical collision)');
      hasErrors = true;
    }
  }

  const pkgJson = readFile('package.json');
  if (pkgJson && !pkgJson.includes('plugin-transform-block-scoping')) {
    console.error('❌ FAIL: package.json missing @babel/plugin-transform-block-scoping');
    hasErrors = true;
  }

  // Multi-script classic global lexical collision guard
  const distFiles = ['dist/app.js', 'dist/filters.js', 'dist/webgl-engine.js',
    'dist/mediapipe-face.js', 'dist/sticker-engine.js', 'dist/frame-system.js',
    'dist/screens-v2.js', 'dist/screens-v2-rest.js', 'dist/screens-v2-deco.js', 'dist/main.js'];
  const collisionSymbols = ['ZoomMinusIcon', 'ZoomPlusIcon'];
  collisionSymbols.forEach(sym => {
    let count = 0;
    distFiles.forEach(df => {
      const content = readFile(df);
      if (content && new RegExp(`const ${sym}\\b`).test(content)) count++;
    });
    if (count > 0) {
      console.error(`❌ FAIL: dist contains top-level 'const ${sym}' — will cause SyntaxError in classic multi-script context`);
      hasErrors = true;
    }
  });
  distFiles.forEach(df => {
    const content = readFile(df);
    if (content && /^const /m.test(content)) {
      console.error(`❌ FAIL: ${df} contains top-level const — block-scoping transform must convert all const/let to var`);
      hasErrors = true;
    }
    if (content && /^let /m.test(content)) {
      console.error(`❌ FAIL: ${df} contains top-level let — block-scoping transform must convert all const/let to var`);
      hasErrors = true;
    }
  });


  // Workspace Hygiene & QA Truth Checks
  const gitignore = readFile('.gitignore');
  if (gitignore) {
    if (!gitignore.includes('node_modules/')) {
      console.error('❌ FAIL: .gitignore missing node_modules/');
      hasErrors = true;
    }
    if (gitignore.includes('dist/')) {
      console.error('❌ FAIL: .gitignore should NOT contain dist/ (tracked in Phase 3.40)');
      hasErrors = true;
    }
  }

  // Phase 3.49 Precompiled Sync Check
  const distRest = readFile('dist/screens-v2-rest.js');
  if (distRest) {
    if (!distRest.includes('SoftLightGlyph')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js is out of sync (missing SoftLightGlyph)');
      hasErrors = true;
    }
    if (!distRest.includes('Selfie Light')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js is out of sync (missing Selfie Light label)');
      hasErrors = true;
    }
    if (distRest.includes('🤳') || distRest.includes('🔦') || distRest.includes('💡')) {
      console.error('❌ FAIL: dist/screens-v2-rest.js still contains crude emojis');
      hasErrors = true;
    }
  }

  const task349 = readFile('task.md');
  if (task349 && !task349.includes('Precompiled Sync + Capture Full Flow QA + Entry Switch Readiness (Phase 3.49)')) {
     console.error('❌ FAIL: task.md missing Phase 3.49 Roadmap section');
     hasErrors = true;
  }

  const task350 = readFile('task.md');
  if (task350) {
    if (!task350.includes('Actual Precompiled Full-Flow Release Gate (Phase 3.50)')) {
       console.error('❌ FAIL: task.md missing Phase 3.50 Release Gate section');
       hasErrors = true;
    }
    if (!task350.includes('Entry Switch Package Draft')) {
       console.error('❌ FAIL: task.md missing Entry Switch Package Draft');
       hasErrors = true;
    }
    if (task350.includes('- [x] index.html switch approved') && task350.includes('decision: Not Ready')) {
       console.error('❌ FAIL: index.html switch approved while decision is Not Ready');
       hasErrors = true;
    }
  }

  // Phase 3.51 Release Gate Correction
  const task351 = readFile('task.md');
  if (task351) {
    const correctOrder = 'app -> filters -> webgl-engine -> mediapipe-face -> sticker-engine -> frame-system -> screens-v2 -> screens-v2-rest -> screens-v2-deco -> main';
    const wrongOrder = 'webgl-engine -> app -> filters';
    
    if (task351.includes(wrongOrder)) {
       console.error('❌ FAIL: task.md contains wrong dist script order (Phase 3.51 Correction needed)');
       hasErrors = true;
    }
    if (!task351.includes(correctOrder)) {
       console.error('❌ FAIL: task.md missing correct dist script order (Phase 3.51 requirement)');
       hasErrors = true;
    }
    if (!task351.includes('Phase 3.50 is a release gate draft')) {
       console.error('❌ FAIL: task.md missing Phase 3.50 draft clarification');
       hasErrors = true;
    }
    if (!task351.includes('Full-flow verification remains pending')) {
       console.error('❌ FAIL: task.md missing full-flow pending status');
       hasErrors = true;
    }
    if (!task351.includes('Parallel Stabilization While Full-Flow QA Is Pending')) {
       console.error('❌ FAIL: task.md missing Parallel Stabilization section');
       hasErrors = true;
    }
  }

  const taskForQA = readFile('task.md');
  if (taskForQA) {
    if (taskForQA.includes('## Precompiled Entry Smoke Test (Phase 3.45)')) {
      console.error('❌ FAIL: Phase 3.45 in task.md must be labeled as "Plan" until actually verified');
      hasErrors = true;
    }
    // Check for premature "Success" in Phase 3.45 area
    const phase345Section = taskForQA.split('## Precompiled Entry Smoke Test')[1]?.split('---')[0] || '';
    if (phase345Section.includes('boot: Success') || phase345Section.includes('capture: Success')) {
      console.error('❌ FAIL: task.md contains premature "Success" reports in Phase 3.45');
      hasErrors = true;
    }
  }

  // Phase 3.53: Post-Switch Release Gate
  const task353 = readFile('task.md');
  if (task353) {
    if (!task353.includes('Production Precompiled Post-Switch Release Gate (Phase 3.53)')) {
      console.error('❌ FAIL: task.md missing Phase 3.53 Post-Switch Release Gate section');
      hasErrors = true;
    }
    if (!task353.includes('Production Precompiled Rollback Plan')) {
      console.error('❌ FAIL: task.md missing Rollback Plan section');
      hasErrors = true;
    }
    // If Release approved is checked, Desktop Chrome must also be checked
    const approvedChecked = task353.includes('- [x] Release approved');
    const desktopPending = task353.includes('- [ ] Desktop Chrome production boot verified');
    if (approvedChecked && desktopPending) {
      console.error('❌ FAIL: Release approved checked but Desktop Chrome boot not yet verified');
      hasErrors = true;
    }
    // SW guard must also be pending if release not ready
    const swPending = task353.includes('- [ ] Service Worker registered');
    if (approvedChecked && swPending) {
      console.error('❌ FAIL: Release approved checked but Service Worker verification still pending');
      hasErrors = true;
    }
  }

  // Phase 3.54: Document structure + evidence guards
  const task354 = readFile('task.md');
  if (task354) {
    if (!task354.includes('## 🚀 Phase B — WebGL Skin Retouch Roadmap')) {
      console.error('❌ FAIL: task.md missing Phase B heading (document structure regression)');
      hasErrors = true;
    }
    if (!task354.includes('Phase 3.54 Evidence')) {
      console.error('❌ FAIL: task.md missing Phase 3.54 Evidence section');
      hasErrors = true;
    }
    const relApproved354 = task354.includes('- [x] Release approved');
    const bothBootsPending = task354.includes('- [ ] Desktop Chrome production boot verified') &&
                             task354.includes('- [ ] Galaxy S23+ Chrome boot verified');
    const allCapturePending = task354.includes('- [ ] Desktop Chrome capture entry verified') &&
                              task354.includes('- [ ] Galaxy S23+ Chrome capture verified');
    if (relApproved354 && bothBootsPending) {
      console.error('❌ FAIL: Release approved but neither Desktop nor Galaxy boot is verified');
      hasErrors = true;
    }
    if (relApproved354 && allCapturePending) {
      console.error('❌ FAIL: Release approved but no capture entry is verified');
      hasErrors = true;
    }
    if (relApproved354 && task354.includes('- [ ] Service Worker registered')) {
      console.error('❌ FAIL: Release approved but Service Worker still pending');
      hasErrors = true;
    }
  }
}

function checkCameraArchitecture() {
  const main = readFile('main.jsx');
  const rest = readFile('screens-v2-rest.jsx');
  if (!main || !rest) return;

  const adapterHelpers = ['setCameraZoom', 'setCameraTorch', 'runScreenFlash'];
  adapterHelpers.forEach(h => {
    if (!main.includes(h)) {
      console.error(`❌ FAIL: main.jsx missing camera control adapter helper: ${h}`);
      hasErrors = true;
    }
  });

  if (!main.includes('cameraZoomOptions') || !main.includes('type: \'hardware\'')) {
    console.error("❌ FAIL: main.jsx missing capability-based zoom option model");
    hasErrors = true;
  }

  if (!rest.includes('screenFlashActive') && !rest.includes('screenFlashEnabled')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing screen flash light simulation");
    hasErrors = true;
  }

  // Phase 3.48 UI Polish
  if (!rest.includes('function SoftLightGlyph()')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing SoftLightGlyph component");
    hasErrors = true;
  }
  if (rest.includes('💡') || rest.includes('🔦') || rest.includes('🤳')) {
     // Use regex to check if they are in the Light button specifically if needed, 
     // but general grep is safer for "removal of crude icons".
     console.error("❌ FAIL: screens-v2-rest.jsx still contains crude emojis in Capture UI");
     hasErrors = true;
  }
  if (!rest.includes('Selfie Light')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing 'Selfie Light' label for front camera");
    hasErrors = true;
  }
  if (!rest.includes('aria-label') || !rest.includes('Turn on selfie light')) {
    console.error("❌ FAIL: screens-v2-rest.jsx missing accessibility aria-labels for Light control");
    hasErrors = true;
  }

  // FAKE ZOOM GUARDS
  if (main.includes('scale(0.6') || rest.includes('scale(0.6') || rest.includes('transform: \'scale(0.6\'')) {
    console.error("❌ FAIL: Prohibited fake 0.6x CSS scale detected");
    hasErrors = true;
  }

  const task = readFile('task.md');
  if (task && !task.includes('Camera Control Architecture (Phase 3.41)')) {
    console.error("❌ FAIL: task.md missing Phase 3.41 Camera Architecture roadmap");
    hasErrors = true;
  }
}

function checkCameraModelAndBestCut() {
  const main = readFile('main.jsx');
  const task = readFile('task.md');

  if (main) {
    if (!main.includes('function deriveCameraZoomOptions')) {
      console.error('❌ FAIL: main.jsx missing deriveCameraZoomOptions helper');
      hasErrors = true;
    }
    if (!main.includes('cameraZoomOptions = React.useMemo')) {
      console.error('❌ FAIL: main.jsx cameraZoomOptions must be a derived useMemo model');
      hasErrors = true;
    }
    if (main.includes('setCameraZoomOptions')) {
      console.error('❌ FAIL: main.jsx contains prohibited setCameraZoomOptions state setter');
      hasErrors = true;
    }
    if (!main.includes('function getCaptureShotCountForLayout')) {
      console.error('❌ FAIL: main.jsx missing getCaptureShotCountForLayout helper');
      hasErrors = true;
    }
    // Polaroid Best Cut: 3 shots instead of 1
    if (main.match(/layout\s*===\s*'polaroid'\s*\?\s*1\s*:\s*6/) && main.includes('captureShotCount')) {
      console.error('❌ FAIL: main.jsx polaroid captureShotCount must be 3 (Best Cut contract)');
      hasErrors = true;
    }
    // Hotfix 3.42: 1x Return Path
    if (!main.includes('val === 1 && wideCameraActive')) {
      console.error('❌ FAIL: main.jsx missing 1x return path for wide camera');
      hasErrors = true;
    }
    if (!main.includes('switchCameraDevice(normalCameraDeviceId)')) {
      console.error('❌ FAIL: main.jsx missing normal camera device return path');
      hasErrors = true;
    }
    if (!main.includes('type: \'lens-return\'')) {
      console.error('❌ FAIL: main.jsx missing lens-return option type');
      hasErrors = true;
    }

    // Torch Duplication Guard
    const torchSetterMatch = main.match(/setTorchEnabled\(settings\.torch \|\| false\)/g);
    if (torchSetterMatch && torchSetterMatch.length >= 2) {
      console.error('❌ FAIL: main.jsx contains duplicate setTorchEnabled calls');
      hasErrors = true;
    }

    // Capture Shot Count Policy
    if (!main.includes("layout === 'polaroid') return 3")) {
      console.error('❌ FAIL: main.jsx getCaptureShotCountForLayout missing polaroid=3 policy');
      hasErrors = true;
    }
    if (!main.includes("layout === 'trip') return 5")) {
      console.error('❌ FAIL: main.jsx getCaptureShotCountForLayout missing trip=5 policy');
      hasErrors = true;
    }

    // Hotfix 3.43: Zoom QA Instrumentation
    if (!main.includes('cameraZoomHistory')) {
      console.error('❌ FAIL: main.jsx missing cameraZoomHistory state');
      hasErrors = true;
    }
    if (!main.includes('pushCameraZoomHistory')) {
      console.error('❌ FAIL: main.jsx missing pushCameraZoomHistory helper');
      hasErrors = true;
    }
    if (!main.includes('trackLabel: track?.label') || !main.includes('zoomCap: capabilities.zoom')) {
      console.error('❌ FAIL: main.jsx getCameraDebugSnapshot missing FOV proxy fields');
      hasErrors = true;
    }

    // Camera Prewarm Check (Persistent getUserMedia)
    if (!main.includes('navigator.mediaDevices.getUserMedia') || !main.includes('streamRef.current = s')) {
      console.error('❌ FAIL: main.jsx missing persistent camera prewarm (getUserMedia on mount)');
      hasErrors = true;
    }
  }

  const rest = readFile('screens-v2-rest.jsx');
  if (rest) {
    if (!rest.includes('Math.abs') || !rest.includes('0.08')) {
      console.error('❌ FAIL: screens-v2-rest.jsx missing zoom active tolerance logic');
      hasErrors = true;
    }
    if (!rest.includes('ZoomHistoryPanel')) {
      console.error('❌ FAIL: screens-v2-rest.jsx missing ZoomHistoryPanel debug UI');
      hasErrors = true;
    }
    if (rest.includes('<ZoomHistoryPanel />') && !rest.includes('debugCamera &&')) {
       console.error('❌ FAIL: screens-v2-rest.jsx ZoomHistoryPanel must be gated by debugCamera');
       hasErrors = true;
    }
  }

  if (task) {
    const requiredSections = [
      'Best Cut Capture Contract',
      'Future Edit Capabilities',
      'Prewarm Policy',
      '카메라 Prewarm 제거 금지'
    ];
    requiredSections.forEach(s => {
      if (!task.includes(s)) {
        console.error(`❌ FAIL: task.md missing required section: ${s}`);
        hasErrors = true;
      }
    });
  }
}

function checkLaunchAssets() {
  const assets = [
    'privacy.html',
    'og.png',
    'icon-192.png',
    'app-icon-1024.png',
    'icon-512.png',
    'icon-maskable-512.png'
  ];
  assets.forEach(asset => {
    if (!fs.existsSync(asset)) {
      console.error(`❌ FAIL: Phase 3.54 Launch Asset missing: ${asset}`);
      hasErrors = true;
    }
  });
}

function checkAlbumStickerGate() {
  const deco = readFile('screens-v2-deco.jsx');
  const frame = readFile('frame-system.jsx');

  if (deco) {
    if (!deco.includes('fileRef')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing fileRef (album import input ref)');
      hasErrors = true;
    }
    if (!deco.includes('addUpload')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing addUpload');
      hasErrors = true;
    }
    if (!deco.includes('FileReader')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing FileReader (album import handler)');
      hasErrors = true;
    }
    if (!deco.includes('accept="image/*"')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing accept="image/*" on file input');
      hasErrors = true;
    }
    const hasKoreanLabel = deco.includes('내 앨범') || deco.includes('Album') || deco.includes('가져오기');
    if (!hasKoreanLabel) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing album import label (내 앨범 / Album)');
      hasErrors = true;
    }
    if (!deco.includes("makeSticker('upload'")) {
      console.error("❌ FAIL: screens-v2-deco.jsx missing makeSticker('upload') call");
      hasErrors = true;
    }
  }

  if (frame) {
    if (!frame.includes('payload.dataUrl')) {
      console.error('❌ FAIL: frame-system.jsx missing payload.dataUrl (upload sticker export path)');
      hasErrors = true;
    }
    if (!frame.includes('preloadStickerImages')) {
      console.error('❌ FAIL: frame-system.jsx missing preloadStickerImages');
      hasErrors = true;
    }
    if (!frame.includes('uploadImages')) {
      console.error('❌ FAIL: frame-system.jsx missing uploadImages (upload sticker cache in drawStickerToCtx)');
      hasErrors = true;
    }
  }

  const task = readFile('task.md');
  if (task) {
    if (!task.includes('Product Roadmap Re-anchor')) {
      console.error('❌ FAIL: task.md missing "Product Roadmap Re-anchor" section');
      hasErrors = true;
    }
    if (!task.includes('Album Image Sticker Restore Gate')) {
      console.error('❌ FAIL: task.md missing "Album Image Sticker Restore Gate" section');
      hasErrors = true;
    }
  }
}

function checkImmm356SeoCopy() {
  const task = readFile('task.md');
  const index = readFile('index.html');

  if (task) {
    // Required sections
    if (!task.includes('IMMM-Only SEO / ASO / Launch Copy Strategy')) {
      console.error('❌ FAIL: task.md missing "IMMM-Only SEO / ASO / Launch Copy Strategy" section');
      hasErrors = true;
    }
    if (!task.includes('IMMM Soft Launch Channel Plan')) {
      console.error('❌ FAIL: task.md missing "IMMM Soft Launch Channel Plan" section');
      hasErrors = true;
    }

    // Guard against cross-product bleed after this Phase
    const lines = task.split('\n');
    let inSeoSection = false;
    lines.forEach((line, i) => {
      if (line.includes('IMMM-Only SEO') || line.includes('IMMM Soft Launch Channel Plan')) {
        inSeoSection = true;
      }
      if (inSeoSection && line.startsWith('## ') && !line.includes('IMMM') && !line.includes('Phase B') && !line.includes('Phase')) {
        inSeoSection = false;
      }
      if (inSeoSection) {
        if (/MyTeam/.test(line) && !line.includes('NOT part of this document') && !line.includes('separate product')) {
          console.error(`❌ FAIL: task.md SEO section contains unauthorized MyTeam reference (line ${i + 1})`);
          hasErrors = true;
        }
        if (/When We Meet/.test(line) && !line.includes('NOT part of this document') && !line.includes('separate product')) {
          console.error(`❌ FAIL: task.md SEO section contains unauthorized "When We Meet" reference (line ${i + 1})`);
          hasErrors = true;
        }
      }
    });
  }

  if (index) {
    // Guard: no misleading claims in index.html
    const misleadingPhrases = [
      'QR 공유 가능',
      '영상 저장 가능',
      '카카오에 바로 공유',
      'cloud share',
    ];
    misleadingPhrases.forEach(phrase => {
      if (index.toLowerCase().includes(phrase.toLowerCase())) {
        console.error(`❌ FAIL: index.html contains misleading feature claim: "${phrase}"`);
        hasErrors = true;
      }
    });
  }
}

function checkImmm357AlbumQA() {
  const task = readFile('task.md');
  const deco = readFile('screens-v2-deco.jsx');
  const setup = readFile('screens-v2.jsx');

  if (task) {
    if (!task.includes('Album Image Sticker Real QA + Export Parity')) {
      console.error('❌ FAIL: task.md missing "Album Image Sticker Real QA + Export Parity" section');
      hasErrors = true;
    }
  }

  // Hardening guard: BOTH components must have the same reset + resize logic
  const components = [
    { name: 'screens-v2-deco.jsx', content: deco },
    { name: 'screens-v2.jsx', content: setup }
  ];

  components.forEach(c => {
    if (c.content) {
      if (!c.content.includes("e.target.value = ''")) {
        console.error(`❌ FAIL: ${c.name} missing input value reset in onFile`);
        hasErrors = true;
      }
      if (!c.content.includes('MAX_EDGE = 2048')) {
        console.error(`❌ FAIL: ${c.name} missing MAX_EDGE = 2048 resize logic`);
        hasErrors = true;
      }
      if (!c.content.includes("type.startsWith('image/')")) {
        console.error(`❌ FAIL: ${c.name} missing image type guard in onFile`);
        hasErrors = true;
      }
    }
  });
}

checkStrayFiles();
checkBlobUrlLifecycle();
checkStickerPreload();
checkBabelMigrationPlan();
checkCameraArchitecture();
checkCameraModelAndBestCut();
checkStabilityAuditDocumented();
checkReactProductionMode();
checkLaunchAssets();
checkAlbumStickerGate();
checkImmm356SeoCopy();
function checkImmm358Parity() {
  const task = readFile('task.md');
  const deco = readFile('screens-v2-deco.jsx');
  const frame = readFile('frame-system.jsx');

  if (task) {
    if (!task.includes('1×4 Strip Preview / Export Parity + Save Reliability')) {
      console.error('❌ FAIL: task.md missing "1×4 Strip Preview / Export Parity + Save Reliability" section');
      hasErrors = true;
    }
  }

  if (deco) {
    // Filename format check
    if (!deco.includes('IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing or incorrect filename format (IMMM_YYYY-MM-DD_HHmm.png)');
      hasErrors = true;
    }

    // iOS fallback check
    if (!deco.includes('isIOS()') || !deco.includes('이미지를 길게 눌러 저장하세요')) {
      console.error('❌ FAIL: screens-v2-deco.jsx missing iOS long-press save fallback');
      hasErrors = true;
    }

    // Pure Canvas Export check (No DOM capture in final path)
    if (deco.includes('html2canvas')) {
      console.error('❌ FAIL: screens-v2-deco.jsx contains html2canvas (DOM capture forbidden for final export)');
      hasErrors = true;
    }
    
    const lines = deco.split('\n');
    const handleDownloadStart = lines.findIndex(l => l.includes('const handleDownload = async'));
    if (handleDownloadStart !== -1) {
      const handleDownloadBlock = lines.slice(handleDownloadStart, handleDownloadStart + 15).join('\n');
      if (handleDownloadBlock.includes('captureRef')) {
        console.error('❌ FAIL: handleDownload in screens-v2-deco.jsx appears to use captureRef (DOM capture forbidden)');
        hasErrors = true;
      }
      if (!handleDownloadBlock.includes('getFinalResultBlob()')) {
        console.error('❌ FAIL: handleDownload in screens-v2-deco.jsx missing getFinalResultBlob call');
        hasErrors = true;
      }
    }
  }

  if (frame) {
    // 1x4 Strip Parity check
    if (!frame.includes('width: 560, height: 1808')) {
      console.error('❌ FAIL: frame-system.jsx missing 1x4 strip canvas dimensions (560x1808)');
      hasErrors = true;
    }
    if (!frame.includes('w: 0.814, h: 0.189')) {
      console.error('❌ FAIL: frame-system.jsx missing 1x4 strip photoRect dimensions (4:3 aspect parity)');
      hasErrors = true;
    }
  }
}

checkStrayFiles();
checkBlobUrlLifecycle();
checkStickerPreload();
checkBabelMigrationPlan();
checkCameraArchitecture();
checkCameraModelAndBestCut();
checkStabilityAuditDocumented();
checkReactProductionMode();
checkLaunchAssets();
checkAlbumStickerGate();
checkImmm356SeoCopy();
checkImmm357AlbumQA();
checkImmm358Parity();


if (hasErrors) {
  console.error('\n💥 Sanity check failed! DO NOT REMOVE GUARDS. FIX THE CODE.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed. Zero-Distortion & Zero-Crash baseline restored.');
}
