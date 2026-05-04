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
    const skinRetouchBody = webgl.match(/skin_retouch:\s*`([\s\S]*?)`/)?.[1] || '';
    if (skinRetouchBody.includes('u_blurredTex')) {
      console.error('❌ FAIL: webgl-engine.jsx skin_retouch shader body contains u_blurredTex');
      hasErrors = true;
    }
    if (skinRetouchBody.includes('u_maskTex')) {
      console.error('❌ FAIL: webgl-engine.jsx skin_retouch shader body contains u_maskTex');
      hasErrors = true;
    }
    if (skinRetouchBody.includes('finalMask')) {
      console.error('❌ FAIL: webgl-engine.jsx skin_retouch shader body contains finalMask');
      hasErrors = true;
    }
    if (skinRetouchBody.includes('getSkinConfidence')) {
      console.error('❌ FAIL: webgl-engine.jsx skin_retouch shader body contains getSkinConfidence');
      hasErrors = true;
    }
    if (skinRetouchBody.includes('mix(ori, blur')) {
      console.error('❌ FAIL: webgl-engine.jsx skin_retouch shader body contains mix(ori, blur');
      hasErrors = true;
    }
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

    if (webgl.includes('uv = warpEye')) {
      console.error('❌ FAIL: webgl-engine.jsx contains active warpEye calls');
      hasErrors = true;
    }
    if (webgl.includes('uv = warpToward')) {
      console.error('❌ FAIL: webgl-engine.jsx contains active warpToward calls');
      hasErrors = true;
    }

    const shaders = ['face_slim', 'eye_bright', 'lip_color', 'contour', 'skin_retouch'];
    shaders.forEach(s => {
      const pattern = new RegExp(`${s}:\\s*\`[\\s\\S]*?void\\s+main\\(\\)\\s*\\{[\\s\\S]*?gl_FragColor=texture2D\\(u_tex,v_uv\\);[\\s\\S]*?\\}\``);
      if (!pattern.test(webgl)) {
        console.error(`❌ FAIL: webgl-engine.jsx ${s} shader is not a minimal passthrough no-op`);
        hasErrors = true;
      }
    });
  }

  if (main) {
    if (main.includes('useFaceLandmarks(videoRef)')) {
      console.error('❌ FAIL: main.jsx still calls useFaceLandmarks(videoRef) - Must be GLOBALLY disabled');
      hasErrors = true;
    }
    if (!main.includes('const FACE_LANDMARKS_DISABLED = true')) {
      console.error('❌ FAIL: main.jsx missing const FACE_LANDMARKS_DISABLED = true');
      hasErrors = true;
    }
    if (!main.includes('const faceTrackedFilters = [];')) {
      console.error('❌ FAIL: main.jsx faceTrackedFilters must be empty []');
      hasErrors = true;
    }
  }

  if (rest) {
    if (!rest.includes('const applyBeautyGeometry = () => { return; };')) {
      console.error('❌ FAIL: screens-v2-rest.jsx applyBeautyGeometry is not a no-op stub');
      hasErrors = true;
    }
    if (!rest.includes('const applyFaceZoneSoftening = () => { return; };')) {
      console.error('❌ FAIL: screens-v2-rest.jsx applyFaceZoneSoftening is not a no-op stub');
      hasErrors = true;
    }
    if (rest.match(/applyFaceZoneSoftening\(\s*ctx/)) {
      console.error('❌ FAIL: screens-v2-rest.jsx still calls applyFaceZoneSoftening(ctx');
      hasErrors = true;
    }
  }
}

function checkEmergencyFrameGlobals() {
  const files = [
    'screens-v2-rest.jsx',
    'screens-v2-deco.jsx',
    'screens-v2.jsx',
    'screens-edit.jsx',
    'main.jsx',
    'app.jsx'
  ];

  const frameSystem = readFile('frame-system.jsx');
  if (frameSystem) {
    if (!frameSystem.includes('function getFrameTemplateSafe')) {
      console.error('❌ FAIL: frame-system.jsx missing getFrameTemplateSafe');
      hasErrors = true;
    }
    // Rule 5: renderComposition must use getFrameTemplateSafe
    if (frameSystem.includes('async function renderComposition')) {
       const lines = frameSystem.split('\n');
       const start = lines.findIndex(l => l.includes('async function renderComposition'));
       const end = lines.findIndex((l, i) => i > start && l.includes('async function'));
       const body = lines.slice(start, end === -1 ? undefined : end).join('\n');
       if (/(?<!Safe)getFrameTemplate\(/.test(body)) {
         console.error('❌ FAIL: frame-system.jsx renderComposition still uses bare getFrameTemplate');
         hasErrors = true;
       }
    }
    // Rule 6: renderFrameToCanvas must use getFrameTemplateSafe
    if (frameSystem.includes('async function renderFrameToCanvas')) {
       const lines = frameSystem.split('\n');
       const start = lines.findIndex(l => l.includes('async function renderFrameToCanvas'));
       const end = lines.findIndex((l, i) => i > start && l.includes("function")); const body = lines.slice(start, end === -1 ? undefined : end).join('\n');
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

    if (f === 'screens-edit.jsx') {
      if (content.includes('Object.assign(window, {') && /\bFrameThumb\b/.test(content)) {
        console.error('❌ FAIL: screens-edit.jsx still exports FrameThumb; collision with frame-system.jsx');
        hasErrors = true;
      }
    }

    // Rule 4: screens-v2.jsx WFrameThumb fallback
    if (f === 'screens-v2.jsx') {
      if (content.includes('<WFrameThumb') && !content.includes('?')) {
        console.error('❌ FAIL: screens-v2.jsx uses <WFrameThumb without null fallback ternary');
        hasErrors = true;
      }
    }
  }
}

function checkEmergencyServiceWorker() {
  const sw = readFile('sw.js');
  if (!sw) return;

  if (sw.includes("CACHE_NAME = 'immm-cache-v1'")) {
    console.error('❌ FAIL: sw.js CACHE_NAME is still immm-cache-v1');
    hasErrors = true;
  }
  if (!sw.includes('self.skipWaiting()')) {
    console.error('❌ FAIL: sw.js missing self.skipWaiting()');
    hasErrors = true;
  }
  if (!sw.includes('self.clients.claim()')) {
    console.error('❌ FAIL: sw.js missing self.clients.claim()');
    hasErrors = true;
  }

  const isCacheFirstForCode = sw.includes('isCode') && sw.includes('caches.match(e.request).then((res) => res || fetch(e.request))');
  if (sw.includes('const isCode =') && !/network-first/i.test(sw)) {
    console.error('❌ FAIL: sw.js isCode block missing network-first strategy');
    hasErrors = true;
  }
}

function checkAppStability() {
  const index = readFile('index.html');
  if (index) {
    // Rule 3: screens-edit.jsx load
    if (index.includes('screens-edit.jsx')) {
      console.error('❌ FAIL: index.html still loads legacy screens-edit.jsx');
      hasErrors = true;
    }
    // Rule 7: IMMM_APP_VERSION
    if (!index.includes('IMMM_APP_VERSION')) {
      console.warn('⚠️ WARN: index.html missing IMMM_APP_VERSION');
      hasWarnings = true;
    }
    // Rule 8: Samsung SW guard
    if (!index.includes('immm.sw.frameHotfixApplied')) {
      console.warn('⚠️ WARN: index.html missing Samsung Internet SW migration guard');
      hasWarnings = true;
    }
  }

  const task = readFile('task.md');
  if (task) {
    // Rule 1, 2: task.md false check
    const badChecks = [
      '- [x] Samsung Internet clears old cache after reload',
      '- [x] Capture → Select → Deco does not throw getFrameTemplate undefined'
    ];
    for (const bc of badChecks) {
      if (task.includes(bc) && !task.includes('Real QA log')) {
        console.error(`❌ FAIL: task.md has unverified check "${bc}" without Real QA log`);
        hasErrors = true;
      }
    }
  }
}

function checkFrameSystem() {
  const content = readFile('frame-system.jsx');
  if (!content) return;
  if (content.includes('drawCatalogSticker') && !content.includes('drawFallbackSticker')) {
    console.error('❌ FAIL: frame-system.jsx calls drawCatalogSticker but missing drawFallbackSticker definition');
    hasErrors = true;
  }
}

function checkStickerEngine() {
  const content = readFile('sticker-engine.jsx');
  if (!content) return;
  if (content.includes("id: 'kretro'") && !content.includes('hidden: true')) {
    console.error('❌ FAIL: sticker-engine.jsx kretro pack is not hidden');
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

if (hasErrors) {
  console.error('\n💥 Sanity check failed! Fix the errors above before committing.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️ Sanity checks passed with warnings.');
} else {
  console.log('\n✅ All sanity checks passed.');
}
