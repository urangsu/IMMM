import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const fails = [];
const req = (ok, msg) => { if (!ok) fails.push(msg); };
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));

['dist/frame-presets.js', 'dist/frame-system.js', 'dist/screens-v2.js', 'dist/main.js'].forEach((f) => req(exists(f), `missing ${f}`));
['docs/STORAGE_CONTRACT.md','docs/DESIGNER_QA.md','docs/TOUCH_POLICY.md','docs/RENDER_PARITY_CHECKLIST.md','docs/FRAME_DESIGN_QA.md','QA_MATRIX.md','FIELD_QA_SCRIPT.md'].forEach((f) => req(exists(f), `missing ${f}`));

const framePresetsSrc = read('frame-presets.jsx');
const frameSystem = read('frame-system.jsx') + '\n' + read('dist/frame-system.js');
const screens = read('screens-v2.jsx') + '\n' + read('dist/screens-v2.js');
const main = read('main.jsx') + '\n' + read('dist/main.js');
const touch = read('sticker-engine.jsx') + read('screens-v2-deco.jsx') + screens;
const creator = read('creator-profile.jsx') + read('dist/creator-profile.js');

const sandbox = { window: {}, console, Math, Date };
vm.createContext(sandbox);
vm.runInContext(read('dist/frame-presets.js'), sandbox);
const api = sandbox.window.IMMMFramePresets || {};
const presets = api.getBuiltinFramePresets ? api.getBuiltinFramePresets() : [];
const packs = api.getBuiltinFramePacks ? api.getBuiltinFramePacks() : [];

const layoutSlotCount = { strip: 4, grid: 4, trip: 3, polaroid: 1 };
const normalized = (l) => api.normalizePresetLayout ? api.normalizePresetLayout(l) : l;
const allowedShapes = new Set(['rect','rounded-rect','circle','heart','star','line','ribbon','ticket','stamp','speech']);
const allowedLayers = new Set(api.FRAME_LAYER_TYPES || ['background','photo-slots','overlays','text','stickers','watermark','fx']);
const allowedBlend = new Set(api.FRAME_BLEND_MODE_WHITELIST || ['normal','multiply','screen','overlay','soft-light']);

req(presets.length > 0, 'builtin presets missing');
const presetIds = new Set();
for (const p of presets) {
  req(!presetIds.has(p.id), `duplicate preset id: ${p.id}`); presetIds.add(p.id);
  const l = normalized(p.layout);
  req(['strip','grid','trip','polaroid'].includes(l), `invalid preset layout: ${p.id}/${p.layout}`);
  req((p.photoSlots || []).length === layoutSlotCount[l], `slot count mismatch: ${p.id}`);
  const cs = p.canvasSize || {};
  req(Number.isFinite(cs.width) && Number.isFinite(cs.height), `invalid canvasSize: ${p.id}`);
  for (const s of (p.photoSlots || [])) {
    ['x','y','width','height'].forEach((k)=>req(Number.isFinite(s[k]), `slot ${k} NaN: ${p.id}`));
    const norm = s.x <= 1 && s.y <= 1 && s.width <= 1 && s.height <= 1;
    const maxW = norm ? 1 : cs.width;
    const maxH = norm ? 1 : cs.height;
    req(s.x >= 0 && s.y >= 0 && s.x + s.width <= maxW && s.y + s.height <= maxH, `slot outside canvas: ${p.id}`);
    req(s.width >= (norm ? 0.08 : 48) && s.height >= (norm ? 0.08 : 48), `slot too small: ${p.id}`);
  }
  const slots = p.photoSlots || [];
  for (let i=0;i<slots.length;i++) for (let j=i+1;j<slots.length;j++) {
    const a=slots[i], b=slots[j];
    const overlap = a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
    req(!overlap, `overlapping slots: ${p.id}`);
  }
  for (const d of (p.decorations || [])) {
    ['x','y','width','height','opacity'].forEach((k)=>req(Number.isFinite(d[k]), `decoration ${k} NaN: ${p.id}`));
    req(d.opacity >= 0 && d.opacity <= 1, `invalid decoration opacity: ${p.id}`);
    if (d.type === 'shape') req(allowedShapes.has(d.shape), `unsupported shape ${d.shape}: ${p.id}`);
    if (d.blendMode) req(allowedBlend.has(d.blendMode), `invalid blendMode ${d.blendMode}: ${p.id}`);
    if ((d.type === 'text') && String(d.text || '').toUpperCase().includes('IMMM') && (d.layer || 'front') === 'front') req(false, `watermark duplicated as text decoration: ${p.id}`);
  }
  for (const ly of (p.layers || [])) req(allowedLayers.has(ly.type), `unsupported layer type ${ly.type}: ${p.id}`);
}

const packIds = new Set();
for (const pack of packs) {
  req(!packIds.has(pack.id), `duplicate pack id: ${pack.id}`); packIds.add(pack.id);
  for (const pid of (pack.presetIds || [])) req(presetIds.has(pid), `pack ${pack.id} references missing preset ${pid}`);
}

req(creator.includes('CREATOR_PROFILE_STORAGE_KEY'), 'missing CREATOR_PROFILE_STORAGE_KEY');
req(/SamsungBrowser|isSamsungInternet/.test(touch), 'missing Samsung guard');
req(/onTouchStart|touchstart/.test(touch) && /onTouchMove|touchmove/.test(touch) && /onTouchEnd|touchend/.test(touch), 'missing touch fallback');
req(/touchcancel/i.test(touch), 'missing touchcancel cleanup');
req(/useTouchFallback|USE_TOUCH_FALLBACK/.test(touch), 'missing touch dedupe guard');
req(/passive:\s*false/.test(touch) || /preventDefault/.test(touch), 'missing passive false/preventDefault path');
req(main.includes("localStorage.setItem('immm.v2.selectedFramePresetId'"), 'missing selectedFramePresetId setItem');
req(screens.includes('layoutMatchedFramePreset'), 'missing layoutMatchedFramePreset');
req(/framePreset=\{layoutMatchedFramePreset\}/.test(screens), 'setup preview not using layoutMatchedFramePreset');
req(/openDesigner\([^)]*layoutMatchedFramePreset/.test(screens), 'designer open not using layoutMatchedFramePreset');
req(/applyFramePreset\([^)]*layoutMatchedFramePreset/.test(screens), 'apply not using layoutMatchedFramePreset');
req(frameSystem.includes('drawableLayers') && /drawableLayers\s*=\s*orderedLayers\.filter/.test(frameSystem), 'missing drawableLayers filter');
req(!framePresetsSrc.includes('localStorage.clear()') && !main.includes('localStorage.clear()'), 'localStorage.clear forbidden');
req(!main.includes('sessionStorage.clear()'), 'sessionStorage.clear forbidden');

const keys = ['immm.v2.customFrames','immm.v2.selectedFramePresetId','immm.v2.designerDraftRecovery','immm.v2.unlockedFramePacks','immm.v2.favoriteFramePresets','immm.v2.favoriteFramePacks','immm.v2.frameLikes','immm.v2.frameUses','immm.v2.creatorProfiles','immm.v2.screen','immm.v2.sel'];
const allText = [framePresetsSrc, frameSystem, screens, main, creator].join('\n');
keys.forEach((k)=>req(allText.includes(k), `missing storage key ${k}`));

const bad=[]; const walk=(d)=>{ for (const e of fs.readdirSync(d,{withFileTypes:true})) { const p=path.join(d,e.name); if (e.isDirectory()) { if (!p.includes('/.git/')) walk(p); } else if (/pgpt/i.test(e.name)) bad.push(path.relative(root,p)); } }; walk(root);
req(bad.length===0, `forbidden pgpt files: ${bad.join(', ')}`);

if (fails.length) { fails.forEach((m)=>console.error('❌ FAIL:',m)); process.exit(1); }
console.log('✅ Cloud QA contract checks passed');
