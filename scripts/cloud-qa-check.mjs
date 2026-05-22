import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readFile(filename) {
  try {
    return fs.readFileSync(path.join(rootDir, filename), 'utf8');
  } catch (_) {
    return '';
  }
}

function fail(message) {
  throw new Error(message);
}

function createStorageStub() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
}

function loadFramePresetsApi() {
  const distPath = path.join(rootDir, 'dist', 'frame-presets.js');
  if (!fs.existsSync(distPath)) {
    fail('dist/frame-presets.js missing');
  }
  const code = fs.readFileSync(distPath, 'utf8');
  const sandbox = {
    window: {},
    localStorage: createStorageStub(),
    sessionStorage: createStorageStub(),
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Array,
    Object,
    Boolean,
    RegExp,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 2000 });
  const api = sandbox.window.IMMMFramePresets;
  if (!api) {
    fail('window.IMMMFramePresets not found in dist/frame-presets.js');
  }
  return api;
}

function assertIncludes(content, needle, label) {
  if (!content.includes(needle)) {
    fail(`${label} missing ${needle}`);
  }
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function main() {
  const requiredFiles = [
    'scripts/export-frame-samples.mjs',
    'qa/frame-samples/index.html',
    'docs/FRAME_DESIGN_QA.md',
    'QA_MATRIX.md',
    'FIELD_QA_SCRIPT.md',
  ];
  requiredFiles.forEach((file) => {
    if (!fs.existsSync(path.join(rootDir, file))) {
      fail(`required QA artifact missing: ${file}`);
    }
  });

  const framePresets = readFile('frame-presets.jsx');
  const screens = readFile('screens-v2.jsx');
  const mainJs = readFile('main.jsx');
  const task = readFile('task.md');
  const sampleScript = readFile('scripts/export-frame-samples.mjs');
  const qaScript = readFile('scripts/cloud-qa-check.mjs');
  const sampleHtml = readFile('qa/frame-samples/index.html');

  assertIncludes(framePresets, 'FRAME_PACKS', 'frame-presets.jsx');
  assertIncludes(framePresets, 'clean-white-4cut', 'frame-presets.jsx');
  assertIncludes(framePresets, 'clean-cotton-4cut', 'frame-presets.jsx');
  assertIncludes(framePresets, 'black-studio-4cut', 'frame-presets.jsx');
  assertIncludes(framePresets, 'kitsch-bear-2x2', 'frame-presets.jsx');
  assertIncludes(framePresets, 'heart-gem-2x2', 'frame-presets.jsx');
  assertIncludes(framePresets, 'travel-ticket-1x4', 'frame-presets.jsx');
  assertIncludes(framePresets, 'birthday-ribbon-2x2', 'frame-presets.jsx');
  assertIncludes(framePresets, 'friend-bubble-1x3', 'frame-presets.jsx');
  assertIncludes(framePresets, 'clean-polaroid-1x1', 'frame-presets.jsx');
  assertIncludes(framePresets, 'author', 'frame-presets.jsx');
  assertIncludes(framePresets, 'license', 'frame-presets.jsx');
  assertIncludes(framePresets, 'watermark', 'frame-presets.jsx');
  assertIncludes(framePresets, 'normalizePresetLayout', 'frame-presets.jsx');
  assertIncludes(framePresets, 'drawFramePresetBackground', 'frame-presets.jsx');
  assertIncludes(framePresets, 'drawFramePresetWatermark', 'frame-presets.jsx');
  assertIncludes(framePresets, 'sanitizeFrameSticker', 'frame-presets.jsx');

  assertIncludes(screens, 'Featured', 'screens-v2.jsx');
  assertIncludes(screens, 'Free', 'screens-v2.jsx');
  assertIncludes(screens, 'My Frames', 'screens-v2.jsx');
  assertIncludes(screens, 'Premium', 'screens-v2.jsx');
  assertIncludes(screens, 'layoutMatchedFramePreset', 'screens-v2.jsx');
  assertIncludes(screens, 'selectedFramePresetId', 'screens-v2.jsx');
  assertIncludes(screens, 'Apply', 'screens-v2.jsx');
  assertIncludes(screens, 'Save Frame', 'screens-v2.jsx');
  assertIncludes(screens, 'Frame Designer Studio', 'screens-v2.jsx');

  assertIncludes(mainJs, 'selectedFramePresetId', 'main.jsx');
  assertIncludes(mainJs, 'localStorage.setItem(\'immm.v2.selectedFramePresetId\'', 'main.jsx');

  assertIncludes(sampleScript, 'dist/frame-presets.js', 'scripts/export-frame-samples.mjs');
  assertIncludes(sampleScript, 'frame-samples', 'scripts/export-frame-samples.mjs');
  assertIncludes(sampleScript, 'index.html', 'scripts/export-frame-samples.mjs');
  assertIncludes(qaScript, 'FRAME_PACKS', 'scripts/cloud-qa-check.mjs');

  if (!sampleHtml.includes('IMMM Frame Samples QA')) {
    fail('qa/frame-samples/index.html missing generated QA title');
  }

  const api = loadFramePresetsApi();
  if (!framePresets.includes('BUILTIN_FRAME_PRESETS')) {
    fail('frame-presets.jsx missing BUILTIN_FRAME_PRESETS declaration');
  }
  const builtins = api.getBuiltinFramePresets();
  if (!Array.isArray(builtins) || builtins.length < 9) {
    fail('builtin frame preset count should be at least 9');
  }

  const requiredPresetIds = new Set([
    'clean-white-4cut',
    'clean-cotton-4cut',
    'black-studio-4cut',
    'kitsch-bear-2x2',
    'heart-gem-2x2',
    'travel-ticket-1x4',
    'birthday-ribbon-2x2',
    'friend-bubble-1x3',
    'clean-polaroid-1x1',
  ]);
  requiredPresetIds.forEach((id) => {
    if (!builtins.some((preset) => preset.id === id)) {
      fail(`missing required preset id: ${id}`);
    }
  });

  builtins.forEach((preset) => {
    if (!preset.author?.name) {
      fail(`preset ${preset.id} missing author metadata`);
    }
    if (!preset.license) {
      fail(`preset ${preset.id} missing license metadata`);
    }
    if (!preset.watermark || typeof preset.watermark.text !== 'string') {
      fail(`preset ${preset.id} missing watermark metadata`);
    }
    const canvas = preset.canvasSize || { width: 0, height: 0 };
    const slots = Array.isArray(preset.photoSlots) ? preset.photoSlots : [];
    if (slots.length === 0) {
      fail(`preset ${preset.id} missing photo slots`);
    }
    const layout = String(preset.layout || '');
    const expectedSlotCount = layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
    if (slots.length !== expectedSlotCount) {
      fail(`preset ${preset.id} slot count mismatch for ${layout}`);
    }
    slots.forEach((slot, index) => {
      if (slot.width <= 0 || slot.height <= 0) {
        fail(`preset ${preset.id} slot ${index} has invalid size`);
      }
      if (slot.x < 0 || slot.y < 0 || slot.x + slot.width > canvas.width || slot.y + slot.height > canvas.height) {
        fail(`preset ${preset.id} slot ${index} exceeds canvas bounds`);
      }
      if (layout === 'polaroid' && slot.y + slot.height > Math.round(canvas.height * 0.84)) {
        fail(`preset ${preset.id} polaroid slot breaks bottom safe area`);
      }
    });
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        if (rectsOverlap(slots[i], slots[j])) {
          fail(`preset ${preset.id} has overlapping slots`);
        }
      }
    }
    if ((Array.isArray(preset.decorations) ? preset.decorations.length : 0) > 20) {
      fail(`preset ${preset.id} has too many decorations`);
    }
  });

  if (api.getDefaultFramePresetIdForLayout('grid', []) === 'clean-cotton-4cut') {
    fail('grid default preset should not resolve to strip preset');
  }
  if (api.getDefaultFramePresetIdForLayout('2x2', []) === 'clean-cotton-4cut') {
    fail('2x2 default preset should not resolve to strip preset');
  }
  if (api.getDefaultFramePresetIdForLayout('trip', []) !== 'friend-bubble-1x3') {
    fail('trip default preset should resolve to friend-bubble-1x3');
  }
  if (api.getDefaultFramePresetIdForLayout('1x1', []) !== 'clean-polaroid-1x1') {
    fail('1x1 default preset should resolve to clean-polaroid-1x1');
  }

  const packs = api.getFramePacks([]);
  if (!Array.isArray(packs) || packs.length < 3) {
    fail('FRAME_PACKS should expose at least three packs');
  }
  if (!packs.some((pack) => pack.priceType === 'free')) {
    fail('missing free frame pack');
  }
  if (!packs.some((pack) => pack.priceType === 'premium')) {
    fail('missing premium frame pack');
  }
  packs.forEach((pack) => {
    if (!Array.isArray(pack.presetIds) || pack.presetIds.length === 0) {
      fail(`pack ${pack.id} missing preset ids`);
    }
    if (!pack.coverPresetId || !pack.presetIds.includes(pack.coverPresetId)) {
      fail(`pack ${pack.id} coverPresetId must resolve inside presetIds`);
    }
    if (!pack.author?.name || !pack.license) {
      fail(`pack ${pack.id} missing author/license metadata`);
    }
  });

  const sampleImport = api.validateFramePackJson(JSON.stringify({
    pack: {
      id: 'qa-pack',
      name: 'QA Pack',
      presetIds: ['qa-preset'],
      coverPresetId: 'qa-preset',
    },
    presets: [{
      id: 'qa-preset',
      stickers: [{ kind: 'upload', payload: { dataUrl: 'data:image/png;base64,AAAA' } }],
    }],
  }));
  if (sampleImport.ok) {
    fail('frame pack import validation should reject upload sticker dataUrl payloads');
  }

  const customSave = api.createCustomFramePresetFromAppState({
    name: 'QA Frame',
    stickers: [{ kind: 'upload', payload: { dataUrl: 'data:image/png;base64,AAAA' } }],
    background: { type: 'solid', value: '#fff' },
  });
  if (JSON.stringify(customSave).includes('dataUrl')) {
    fail('custom frame save leaked dataUrl');
  }

  if (/sanitizeFrameSticker\s*\(\s*(deco|decorations|frame\.decorations)/.test(framePresets)) {
    fail('decorations should not flow through sanitizeFrameSticker');
  }

  const forbiddenClears = [framePresets, screens, mainJs, sampleScript, qaScript];
  forbiddenClears.forEach((content) => {
    const stripped = content
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, ''))
      .join('\n');
    if (/\blocalStorage\.clear\s*\(/.test(stripped) || /\bsessionStorage\.clear\s*\(/.test(stripped)) {
      fail('forbidden storage clear detected');
    }
  });

  console.log('✓ cloud QA contract checks passed');
}

try {
  main();
} catch (err) {
  console.error(`❌ FAIL: ${err.message}`);
  process.exitCode = 1;
}
