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

console.log('🔍 Running IMMM Final Hardened Sanity Checks...');
checkVisibleFilters();
checkWebglVisiblePipelines();
checkEmergencyFaceSafety();
checkDeco();

if (hasErrors) {
  console.error('\n💥 Sanity check failed! Fix the code or die.');
  process.exit(1);
} else {
  console.log('\n✅ All sanity checks passed. Zero-Distortion & Zero-Crash baseline confirmed.');
}
