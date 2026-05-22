import fs from 'fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distPath = path.join(rootDir, 'dist', 'frame-presets.js');
const outputDir = path.join(rootDir, 'qa', 'frame-samples');
const outputPath = path.join(outputDir, 'index.html');

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
  if (!fs.existsSync(distPath)) {
    throw new Error('dist/frame-presets.js not found. Run npm run build:precompile first.');
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
    throw new Error('window.IMMMFramePresets not found in dist/frame-presets.js');
  }
  return api;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSlotPreview(slot, canvas) {
  const canvasWidth = Number(canvas?.width) || 1;
  const canvasHeight = Number(canvas?.height) || 1;
  const left = ((slot.x || 0) / canvasWidth) * 100;
  const top = ((slot.y || 0) / canvasHeight) * 100;
  const width = ((slot.width || 0) / canvasWidth) * 100;
  const height = ((slot.height || 0) / canvasHeight) * 100;
  return `<div class="slot" style="left:${left.toFixed(3)}%;top:${top.toFixed(3)}%;width:${width.toFixed(3)}%;height:${height.toFixed(3)}%;border-radius:${Number(slot.radius || 0)}px;"></div>`;
}

function renderPresetCard(preset) {
  const slots = Array.isArray(preset.photoSlots) ? preset.photoSlots : [];
  const canvas = preset.canvasSize || { width: 1000, height: 1500 };
  const pack = preset.packName || 'My Frames';
  const author = preset.author?.name || 'IMMM Studio';
  const license = preset.license || 'internal';
  const decorations = Array.isArray(preset.decorations) ? preset.decorations.length : 0;
  const motionLayers = Array.isArray(preset.motionLayers) ? preset.motionLayers.length : 0;
  return `
    <section class="card">
      <div class="thumb">
        ${slots.map((slot) => renderSlotPreview(slot, canvas)).join('')}
        <div class="thumb-label">${escapeHtml(preset.name)}</div>
      </div>
      <div class="meta">
        <div class="name">${escapeHtml(preset.name)}</div>
        <div class="sub">${escapeHtml(preset.id)} · ${escapeHtml(preset.layout)} · ${escapeHtml(canvas.width)}x${escapeHtml(canvas.height)}</div>
        <div class="sub">${slots.length} slots · ${decorations} decorations · ${motionLayers} motion layers</div>
        <div class="sub">${escapeHtml(pack)} · ${escapeHtml(author)} · ${escapeHtml(license)}</div>
      </div>
    </section>
  `;
}

function renderChecklist(api, presets) {
  const packNames = api.getFramePacks([]).map((pack) => pack.name).join(', ');
  return `
    <aside class="panel">
      <h2>QA Checklist</h2>
      <ul>
        <li>Frame Store uses Featured / Free / My Frames / Premium tabs</li>
        <li>Preset layout matches selectedFramePresetId and layoutMatchedFramePreset</li>
        <li>Built-in presets include Clean White, Cotton, Studio, Kitsch, Heart, Travel, Birthday, Friend, and Polaroid</li>
        <li>Custom frame save excludes photo dataUrl and upload sticker dataUrl</li>
        <li>My Frames supports rename, duplicate, soft delete, and restore-safe loading</li>
        <li>Current packs: ${escapeHtml(packNames)}</li>
      </ul>
      <div class="note">Generated from dist/frame-presets.js for visual QA review.</div>
    </aside>
  `;
}

function buildHtml(api) {
  const presets = api.listFramePresets([]);
  const packs = api.getFramePacks([]);
  const grouped = [
    { title: 'Featured', items: presets.filter((preset) => preset.featured) },
    { title: 'Basic', items: presets.filter((preset) => preset.category === 'basic') },
    { title: 'Character', items: presets.filter((preset) => preset.category === 'character') },
    { title: 'Travel', items: presets.filter((preset) => preset.category === 'travel') },
    { title: 'Birthday', items: presets.filter((preset) => preset.category === 'birthday') },
    { title: 'Couple', items: presets.filter((preset) => preset.category === 'couple') },
    { title: 'My Frames', items: presets.filter((preset) => preset.source === 'custom') },
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>IMMM Frame Samples QA</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f4ef; color: #1a1a1f; }
      header { position: sticky; top: 0; z-index: 2; background: rgba(245,244,239,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(26,26,31,0.08); padding: 20px 24px; }
      h1 { margin: 0; font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; }
      .subhead { margin-top: 6px; color: #5b5b66; font-size: 13px; line-height: 1.5; }
      main { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; padding: 20px 24px 32px; align-items: start; }
      .section { margin-bottom: 24px; }
      .section h2 { margin: 0 0 12px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
      .card { background: #fff; border: 1px solid rgba(26,26,31,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(26,26,31,0.04); }
      .thumb { position: relative; aspect-ratio: 2 / 3; background: linear-gradient(180deg, #ffffff, #f4f1eb); overflow: hidden; }
      .slot { position: absolute; background: rgba(26,26,31,0.14); border: 1px solid rgba(26,26,31,0.2); box-sizing: border-box; }
      .thumb-label { position: absolute; left: 12px; right: 12px; bottom: 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(26,26,31,0.8); }
      .meta { padding: 12px 14px 14px; }
      .name { font-size: 15px; font-weight: 700; line-height: 1.3; }
      .sub { margin-top: 4px; font-size: 12px; color: #5b5b66; line-height: 1.45; word-break: break-word; }
      .panel { position: sticky; top: 92px; background: #fff; border: 1px solid rgba(26,26,31,0.08); border-radius: 12px; padding: 16px; box-shadow: 0 8px 30px rgba(26,26,31,0.04); }
      .panel h2 { margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; }
      .panel ul { margin: 0; padding-left: 18px; color: #34343f; font-size: 13px; line-height: 1.6; }
      .note { margin-top: 14px; color: #5b5b66; font-size: 12px; line-height: 1.45; }
      .packs { margin-top: 12px; font-size: 12px; color: #5b5b66; line-height: 1.45; }
      @media (max-width: 980px) { main { grid-template-columns: 1fr; } .panel { position: static; } }
    </style>
  </head>
  <body>
    <header>
      <h1>IMMM Frame Samples QA</h1>
      <div class="subhead">Built from dist/frame-presets.js. Review frame geometry, pack metadata, author/license tags, and sample coverage before shipping.</div>
      <div class="packs">Packs: ${escapeHtml(packs.map((pack) => `${pack.name} (${pack.priceLabel})`).join(' · '))}</div>
    </header>
    <main>
      <div>
        ${grouped
          .map(
            (group) => `
              <section class="section">
                <h2>${escapeHtml(group.title)} (${group.items.length})</h2>
                <div class="grid">
                  ${group.items.map(renderPresetCard).join('')}
                </div>
              </section>
            `,
          )
          .join('')}
      </div>
      ${renderChecklist(api, presets)}
    </main>
  </body>
</html>`;
}

function main() {
  const api = loadFramePresetsApi();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, buildHtml(api), 'utf8');
  console.log(`✓ wrote ${path.relative(rootDir, outputPath)}`);
}

main();
