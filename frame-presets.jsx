// frame-presets.jsx — frame preset data model, custom frame storage, canvas helpers

const FRAME_PRESET_STORAGE_KEY = 'immm.v2.customFrames';
const FRAME_PRESET_SELECTION_KEY = 'immm.v2.selectedFramePresetId';

const FRAME_PRESET_CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'character', label: 'Character' },
  { id: 'travel', label: 'Travel' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'couple', label: 'Couple' },
  { id: 'my-frames', label: 'My Frames' },
];

const FRAME_PRESET_LAYOUT_SIZES = {
  '1x4': { width: 560, height: 1808 },
  '2x2': { width: 880, height: 1096 },
  '1x3': { width: 700, height: 1380 },
  '1x1': { width: 880, height: 1070 },
  strip: { width: 560, height: 1808 },
  grid: { width: 880, height: 1096 },
  trip: { width: 700, height: 1380 },
  polaroid: { width: 880, height: 1070 },
};

function normalizePresetLayout(layout) {
  if (layout === '1x4' || layout === 'strip') return 'strip';
  if (layout === '2x2' || layout === 'grid') return 'grid';
  if (layout === '1x3' || layout === 'trip') return 'trip';
  if (layout === '1x1' || layout === 'polaroid') return 'polaroid';
  return 'strip';
}

const FRAME_PRESET_LAYOUT_SLOTS = {
  '1x4': [
    { x: 0.093, y: 0.092, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.297, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.501, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.706, width: 0.814, height: 0.189, radius: 0.02 },
  ],
  '2x2': [
    { x: 0.08, y: 0.155, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.523, y: 0.155, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.08, y: 0.511, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.523, y: 0.511, width: 0.398, height: 0.319, radius: 0.03 },
  ],
  '1x3': [
    { x: 0.08, y: 0.114, width: 0.84, height: 0.215, radius: 0.03 },
    { x: 0.08, y: 0.392, width: 0.84, height: 0.215, radius: 0.03 },
    { x: 0.08, y: 0.67, width: 0.84, height: 0.215, radius: 0.03 },
  ],
  '1x1': [
    { x: 0.051, y: 0.10, width: 0.898, height: 0.68, radius: 0.035 },
  ],
  strip: [
    { x: 0.093, y: 0.092, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.297, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.501, width: 0.814, height: 0.189, radius: 0.02 },
    { x: 0.093, y: 0.706, width: 0.814, height: 0.189, radius: 0.02 },
  ],
  grid: [
    { x: 0.08, y: 0.155, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.523, y: 0.155, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.08, y: 0.511, width: 0.398, height: 0.319, radius: 0.03 },
    { x: 0.523, y: 0.511, width: 0.398, height: 0.319, radius: 0.03 },
  ],
  trip: [
    { x: 0.08, y: 0.114, width: 0.84, height: 0.215, radius: 0.03 },
    { x: 0.08, y: 0.392, width: 0.84, height: 0.215, radius: 0.03 },
    { x: 0.08, y: 0.67, width: 0.84, height: 0.215, radius: 0.03 },
  ],
  polaroid: [
    { x: 0.051, y: 0.10, width: 0.898, height: 0.68, radius: 0.035 },
  ],
};

function clonePlain(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function getCanvasSizeForLayout(layout) {
  const normalized = normalizePresetLayout(layout);
  return FRAME_PRESET_LAYOUT_SIZES[normalized] || FRAME_PRESET_LAYOUT_SIZES.strip;
}

function getPhotoSlotsForLayout(layout) {
  const normalized = normalizePresetLayout(layout);
  const size = getCanvasSizeForLayout(normalized);
  return (FRAME_PRESET_LAYOUT_SLOTS[normalized] || FRAME_PRESET_LAYOUT_SLOTS.strip).map((slot) => ({
    x: Math.round(slot.x * size.width),
    y: Math.round(slot.y * size.height),
    width: Math.round(slot.width * size.width),
    height: Math.round(slot.height * size.height),
    radius: slot.radius || 0,
  }));
}

function createBackground(type, value) {
  return {
    type: type || 'solid',
    value: value || '#FFFFFF',
  };
}

function makeDecoration(partial) {
  return {
    id: partial.id || `deco_${Math.random().toString(36).slice(2, 8)}`,
    type: partial.type || 'shape',
    shape: partial.shape || 'circle',
    text: partial.text || '',
    x: Number.isFinite(partial.x) ? partial.x : 0,
    y: Number.isFinite(partial.y) ? partial.y : 0,
    width: Number.isFinite(partial.width) ? partial.width : 80,
    height: Number.isFinite(partial.height) ? partial.height : 80,
    rotation: Number.isFinite(partial.rotation) ? partial.rotation : 0,
    opacity: Number.isFinite(partial.opacity) ? partial.opacity : 1,
    zIndex: Number.isFinite(partial.zIndex) ? partial.zIndex : 0,
    fill: partial.fill || partial.color || '#111111',
    stroke: partial.stroke || null,
    strokeWidth: Number.isFinite(partial.strokeWidth) ? partial.strokeWidth : 0,
    fontFamily: partial.fontFamily || '"Plus Jakarta Sans", Pretendard, system-ui',
    fontWeight: partial.fontWeight || 700,
    radius: Number.isFinite(partial.radius) ? partial.radius : 24,
    layer: partial.layer || (Number.isFinite(partial.zIndex) && partial.zIndex < 0 ? 'back' : 'front'),
  };
}

function makePreset({
  id,
  name,
  category,
  layout,
  background,
  photoSlots,
  decorations,
  watermark,
  frameColor,
  canvasSize,
}) {
  const resolvedLayout = normalizePresetLayout(layout || '1x4');
  const size = canvasSize || getCanvasSizeForLayout(resolvedLayout);
  return {
    id,
    name,
    category,
    layout: resolvedLayout,
    canvasSize: { width: size.width, height: size.height },
    frameColor: frameColor || (background?.type === 'solid' && typeof background.value === 'string' ? background.value : '#FFFFFF'),
    background: background || createBackground('solid', '#FFFFFF'),
    photoSlots: Array.isArray(photoSlots) && photoSlots.length ? photoSlots.map((slot) => ({ ...slot })) : getPhotoSlotsForLayout(resolvedLayout),
    decorations: Array.isArray(decorations) ? decorations.map((deco) => makeDecoration(deco)) : [],
    watermark: watermark ? { ...watermark } : { text: 'IMMM', x: 0.5, y: 0.94 },
    createdAt: null,
    updatedAt: null,
    source: 'builtin',
  };
}

function buildBuiltinFramePresets() {
  const stripSize = getCanvasSizeForLayout('1x4');
  const gridSize = getCanvasSizeForLayout('2x2');
  const tripSize = getCanvasSizeForLayout('1x3');
  const polaroidSize = getCanvasSizeForLayout('1x1');

  return [
    makePreset({
      id: 'clean-white-4cut',
      name: 'Clean White 4cut',
      category: 'basic',
      layout: 'strip',
      background: createBackground('solid', '#FFFFFF'),
      frameColor: '#FFFFFF',
      photoSlots: getPhotoSlotsForLayout('1x4'),
      decorations: [
        { type: 'shape', shape: 'line', x: 0.082, y: 0.043, width: 0.836, height: 0.006, rotation: 0, opacity: 0.24, zIndex: -2, fill: '#1A1A1F' },
        { type: 'shape', shape: 'line', x: 0.082, y: 0.955, width: 0.836, height: 0.006, rotation: 0, opacity: 0.14, zIndex: 1, fill: '#1A1A1F' },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.45 },
      canvasSize: stripSize,
    }),
    makePreset({
      id: 'clean-cotton-4cut',
      name: 'Clean Cotton 4cut',
      category: 'basic',
      layout: 'strip',
      background: createBackground('pattern', {
        pattern: 'dots',
        color: '#F9F6F2',
        dotColor: 'rgba(17,17,17,0.04)',
      }),
      frameColor: '#F9F6F2',
      decorations: [
        { type: 'shape', shape: 'ribbon', x: 0.07, y: 0.028, width: 0.18, height: 0.06, rotation: -5, opacity: 0.7, zIndex: -2, fill: '#EFC9D0' },
        { type: 'text', text: 'soft cotton', x: 0.79, y: 0.055, width: 0.14, height: 0.03, rotation: 0, opacity: 0.66, zIndex: 1, fill: '#6F6A64', fontWeight: 600 },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.42 },
      canvasSize: stripSize,
    }),
    makePreset({
      id: 'black-studio-4cut',
      name: 'Black Studio 4cut',
      category: 'basic',
      layout: 'strip',
      background: createBackground('solid', '#111111'),
      frameColor: '#111111',
      decorations: [
        { type: 'shape', shape: 'line', x: 0.08, y: 0.04, width: 0.84, height: 0.006, rotation: 0, opacity: 0.4, zIndex: -2, fill: '#FFFFFF' },
        { type: 'shape', shape: 'line', x: 0.08, y: 0.956, width: 0.84, height: 0.006, rotation: 0, opacity: 0.3, zIndex: 1, fill: '#FFFFFF' },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.7, fill: '#FFFFFF' },
      canvasSize: stripSize,
    }),
    makePreset({
      id: 'kitsch-bear-2x2',
      name: 'Kitsch Bear 2x2',
      category: 'character',
      layout: 'grid',
      background: createBackground('gradient', {
        type: 'linear',
        angle: 20,
        stops: ['#FFD9D2', '#FFF6D9', '#F8E7FF'],
      }),
      frameColor: '#FFF6F0',
      decorations: [
        { type: 'shape', shape: 'circle', x: 0.045, y: 0.045, width: 0.09, height: 0.09, rotation: 0, opacity: 0.95, zIndex: -2, fill: '#A7715A' },
        { type: 'shape', shape: 'circle', x: 0.10, y: 0.045, width: 0.09, height: 0.09, rotation: 0, opacity: 0.95, zIndex: -2, fill: '#A7715A' },
        { type: 'shape', shape: 'heart', x: 0.50, y: 0.07, width: 0.09, height: 0.07, rotation: -8, opacity: 0.95, zIndex: 1, fill: '#E58AA0' },
        { type: 'shape', shape: 'star', x: 0.88, y: 0.08, width: 0.08, height: 0.08, rotation: 14, opacity: 0.85, zIndex: 1, fill: '#F1C75B' },
        { type: 'text', text: 'bear mood', x: 0.5, y: 0.94, width: 0.16, height: 0.04, rotation: 0, opacity: 0.7, zIndex: 1, fill: '#6B574E', fontWeight: 700 },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.45 },
      canvasSize: gridSize,
    }),
    makePreset({
      id: 'heart-gem-2x2',
      name: 'Heart Gem 2x2',
      category: 'character',
      layout: 'grid',
      background: createBackground('gradient', {
        type: 'radial',
        stops: ['#FFF1F7', '#F4D7FF', '#E8F3FF'],
      }),
      frameColor: '#FFF4FB',
      decorations: [
        { type: 'shape', shape: 'heart', x: 0.08, y: 0.06, width: 0.08, height: 0.07, rotation: -16, opacity: 0.92, zIndex: -1, fill: '#FF7FA4' },
        { type: 'shape', shape: 'heart', x: 0.86, y: 0.075, width: 0.08, height: 0.07, rotation: 14, opacity: 0.92, zIndex: -1, fill: '#9A74FF' },
        { type: 'shape', shape: 'star', x: 0.50, y: 0.06, width: 0.07, height: 0.07, rotation: 0, opacity: 0.8, zIndex: 1, fill: '#F2BE52' },
        { type: 'shape', shape: 'circle', x: 0.47, y: 0.92, width: 0.08, height: 0.08, rotation: 0, opacity: 0.18, zIndex: -2, fill: '#FFFFFF' },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.48 },
      canvasSize: gridSize,
    }),
    makePreset({
      id: 'travel-ticket-1x4',
      name: 'Travel Ticket 1x4',
      category: 'travel',
      layout: 'strip',
      background: createBackground('gradient', {
        type: 'linear',
        angle: 90,
        stops: ['#F7FBFF', '#E5F1FF', '#FFF8E9'],
      }),
      frameColor: '#F8FBFF',
      decorations: [
        { type: 'shape', shape: 'ticket', x: 0.058, y: 0.038, width: 0.18, height: 0.07, rotation: -4, opacity: 0.88, zIndex: -2, fill: '#D7ECFF' },
        { type: 'text', text: 'TRAVEL LOG', x: 0.51, y: 0.053, width: 0.18, height: 0.03, rotation: 0, opacity: 0.72, zIndex: 1, fill: '#5D6D7B', fontWeight: 800 },
        { type: 'shape', shape: 'stamp', x: 0.82, y: 0.925, width: 0.09, height: 0.09, rotation: 12, opacity: 0.66, zIndex: 1, fill: '#5C8DB8' },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.46 },
      canvasSize: stripSize,
    }),
    makePreset({
      id: 'birthday-ribbon-2x2',
      name: 'Birthday Ribbon 2x2',
      category: 'birthday',
      layout: 'grid',
      background: createBackground('pattern', {
        pattern: 'confetti',
        color: '#FFF7FB',
        accentColors: ['#FF8F9B', '#FFD66B', '#9FD3FF', '#9EE0A8'],
      }),
      frameColor: '#FFF7FB',
      decorations: [
        { type: 'shape', shape: 'ribbon', x: 0.03, y: 0.03, width: 0.22, height: 0.08, rotation: -8, opacity: 0.95, zIndex: -1, fill: '#F2A4C4' },
        { type: 'shape', shape: 'ribbon', x: 0.76, y: 0.04, width: 0.20, height: 0.08, rotation: 10, opacity: 0.95, zIndex: -1, fill: '#F9C05C' },
        { type: 'text', text: 'happy day', x: 0.5, y: 0.065, width: 0.16, height: 0.03, rotation: 0, opacity: 0.82, zIndex: 1, fill: '#7A6471', fontWeight: 700 },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.44 },
      canvasSize: gridSize,
    }),
    makePreset({
      id: 'friend-bubble-1x3',
      name: 'Friend Bubble 1x3',
      category: 'couple',
      layout: 'trip',
      background: createBackground('pattern', {
        pattern: 'bubbles',
        color: '#F7FAFF',
        bubbleColor: 'rgba(120, 146, 182, 0.08)',
      }),
      frameColor: '#F8FBFF',
      decorations: [
        { type: 'shape', shape: 'speech', x: 0.05, y: 0.04, width: 0.16, height: 0.08, rotation: -4, opacity: 0.88, zIndex: -1, fill: '#FFFFFF' },
        { type: 'shape', shape: 'heart', x: 0.82, y: 0.05, width: 0.07, height: 0.06, rotation: 6, opacity: 0.9, zIndex: 1, fill: '#F08BA5' },
        { type: 'text', text: 'FRIENDS', x: 0.5, y: 0.94, width: 0.12, height: 0.03, rotation: 0, opacity: 0.72, zIndex: 1, fill: '#637487', fontWeight: 800 },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.962, opacity: 0.42 },
      canvasSize: tripSize,
    }),
    makePreset({
      id: 'clean-polaroid-1x1',
      name: 'Clean Polaroid 1x1',
      category: 'basic',
      layout: 'polaroid',
      background: createBackground('solid', '#FFFFFF'),
      frameColor: '#FFFFFF',
      photoSlots: getPhotoSlotsForLayout('1x1'),
      decorations: [
        { type: 'shape', shape: 'line', x: 0.08, y: 0.08, width: 0.84, height: 0.006, rotation: 0, opacity: 0.18, zIndex: -1, fill: '#111111' },
        { type: 'text', text: 'POLAROID', x: 0.5, y: 0.88, width: 0.4, height: 0.05, rotation: 0, opacity: 0.48, zIndex: 1, fill: '#111111', fontWeight: 700 },
      ],
      watermark: { text: 'IMMM', x: 0.5, y: 0.955, opacity: 0.42 },
      canvasSize: polaroidSize,
    }),
  ];
}

const BUILTIN_FRAME_PRESETS = buildBuiltinFramePresets();

function normalizeFramePreset(preset) {
  if (!preset || typeof preset !== 'object') return null;
  const layout = normalizePresetLayout(preset.layout || '1x4');
  const size = preset.canvasSize || getCanvasSizeForLayout(layout);
  const photoSlots = Array.isArray(preset.photoSlots) && preset.photoSlots.length ? preset.photoSlots.map((slot) => ({
    x: Number(slot.x) || 0,
    y: Number(slot.y) || 0,
    width: Number(slot.width) || 0,
    height: Number(slot.height) || 0,
    radius: Number(slot.radius) || 0,
  })) : getPhotoSlotsForLayout(layout);

  const decorations = Array.isArray(preset.decorations)
    ? preset.decorations.map((deco) => makeDecoration(deco))
    : [];
  const stickers = Array.isArray(preset.stickers)
    ? preset.stickers.map((sticker) => sanitizeFrameSticker(sticker)).filter(Boolean)
    : [];
  const drawStrokes = Array.isArray(preset.drawStrokes)
    ? preset.drawStrokes.map((stroke) => sanitizeDrawStroke(stroke)).filter(Boolean)
    : [];

  return {
    id: String(preset.id || ''),
    name: String(preset.name || 'Untitled Frame'),
    category: String(preset.category || 'basic'),
    layout,
    canvasSize: {
      width: Number(size.width) || getCanvasSizeForLayout(layout).width,
      height: Number(size.height) || getCanvasSizeForLayout(layout).height,
    },
    frameColor: preset.frameColor || (preset.background?.type === 'solid' && typeof preset.background.value === 'string' ? preset.background.value : '#FFFFFF'),
    background: preset.background ? clonePlain(preset.background) : createBackground('solid', '#FFFFFF'),
    photoSlots,
    decorations,
    stickers,
    drawStrokes,
    watermark: preset.watermark ? { ...preset.watermark } : { text: 'IMMM', x: 0.5, y: 0.94 },
    createdAt: preset.createdAt || null,
    updatedAt: preset.updatedAt || null,
    source: preset.source === 'custom' ? 'custom' : 'builtin',
    deletedAt: preset.deletedAt || null,
  };
}

function getBuiltinFramePresets() {
  return BUILTIN_FRAME_PRESETS.map((preset) => normalizeFramePreset(preset));
}

function getCustomFramePresets() {
  return loadCustomFramePresets();
}

function loadCustomFramePresets() {
  try {
    const raw = localStorage.getItem(FRAME_PRESET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((preset) => normalizeFramePreset({ ...preset, source: 'custom' }))
      .filter((preset) => preset && !preset.deletedAt);
  } catch (error) {
    console.warn('[IMMM] loadCustomFramePresets failed:', error);
    return [];
  }
}

function saveCustomFramePresets(frames) {
  const safe = (Array.isArray(frames) ? frames : [])
    .map((preset) => sanitizeCustomFramePreset(preset))
    .filter(Boolean);
  localStorage.setItem(FRAME_PRESET_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

function sanitizeFrameSticker(sticker) {
  if (!sticker || typeof sticker !== 'object') return null;
  if (sticker.kind === 'upload') return null;

  const cleaned = {
    id: String(sticker.id || `st_${Math.random().toString(36).slice(2, 9)}`),
    kind: String(sticker.kind || 'preset'),
    payload: clonePlain(sticker.payload || {}),
    x: Number.isFinite(sticker.x) ? sticker.x : 50,
    y: Number.isFinite(sticker.y) ? sticker.y : 50,
    scale: Number.isFinite(sticker.scale) ? sticker.scale : 1,
    rotation: Number.isFinite(sticker.rotation) ? sticker.rotation : 0,
    z: Number.isFinite(sticker.z) ? sticker.z : Date.now(),
  };

  if (cleaned.kind === 'preset') {
    cleaned.payload = { libId: cleaned.payload?.libId || cleaned.payload?.id || '' };
  } else if (cleaned.kind === 'text') {
    cleaned.payload = {
      text: String(cleaned.payload?.text || ''),
      font: String(cleaned.payload?.font || 'Pretendard'),
      color: String(cleaned.payload?.color || '#111111'),
      size: Number(cleaned.payload?.size) || 32,
    };
  } else if (cleaned.kind === 'setlog') {
    cleaned.payload = {
      time: String(cleaned.payload?.time || ''),
      caption: String(cleaned.payload?.caption || ''),
      theme: String(cleaned.payload?.theme || 'white'),
    };
  }

  if (String(cleaned.payload?.dataUrl || '').length > 0) {
    delete cleaned.payload.dataUrl;
  }

  return cleaned;
}

function sanitizeDrawStroke(stroke) {
  if (!stroke || typeof stroke !== 'object') return null;
  if (String(stroke.dataUrl || stroke.photoData || '').length > 0) return null;
  const points = Array.isArray(stroke.points)
    ? stroke.points
      .filter((pt) => Array.isArray(pt) && pt.length >= 2)
      .map(([x, y]) => [Number(x) || 0, Number(y) || 0])
    : [];
  if (points.length < 2) return null;
  return {
    color: String(stroke.color || '#111111'),
    width: Number(stroke.width) || 3,
    widthNorm: Number.isFinite(stroke.widthNorm) ? stroke.widthNorm : null,
    brush: String(stroke.brush || 'pen'),
    points,
    seed: Number.isFinite(stroke.seed) ? stroke.seed : 0,
  };
}

function sanitizeCustomFramePreset(frame) {
  if (!frame || typeof frame !== 'object') return null;
  const decorations = Array.isArray(frame.decorations)
    ? frame.decorations.map((deco) => makeDecoration(deco)).filter(Boolean)
    : [];
  const stickers = Array.isArray(frame.stickers)
    ? frame.stickers.map((sticker) => sanitizeFrameSticker(sticker)).filter(Boolean)
      : [];

  const drawStrokes = Array.isArray(frame.drawStrokes)
    ? frame.drawStrokes.map((stroke) => sanitizeDrawStroke(stroke)).filter(Boolean)
    : [];

  const background = frame.background ? clonePlain(frame.background) : createBackground('solid', frame.frameColor || '#FFFFFF');

  const preset = normalizeFramePreset({
    id: frame.id || `custom-${Date.now().toString(36)}`,
    name: String(frame.name || 'My Frame'),
    category: 'my-frames',
    layout: frame.layout || '1x4',
    frameColor: frame.frameColor || background.value || '#FFFFFF',
    background,
    photoSlots: frame.photoSlots || getPhotoSlotsForLayout(frame.layout || '1x4'),
    decorations,
    stickers,
    watermark: frame.watermark || { text: 'IMMM', x: 0.5, y: 0.94 },
    canvasSize: frame.canvasSize || getCanvasSizeForLayout(frame.layout || '1x4'),
    source: 'custom',
    createdAt: frame.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  preset.stickers = stickers;
  preset.drawStrokes = drawStrokes;
  preset.background = background;
  preset.createdAt = frame.createdAt || preset.createdAt;
  preset.updatedAt = new Date().toISOString();
  preset.source = 'custom';
  preset.deletedAt = frame.deletedAt || null;
  return preset;
}

function createCustomFramePresetFromAppState(input = {}) {
  const now = new Date().toISOString();
  const frame = sanitizeCustomFramePreset({
    id: input.id,
    name: input.name || 'My Frame',
    layout: input.layout || '1x4',
    frameColor: input.frameColor || '#FFFFFF',
    background: input.background || createBackground('solid', input.frameColor || '#FFFFFF'),
    decorations: input.decorations || [],
    stickers: input.stickers || [],
    drawStrokes: input.drawStrokes || [],
    watermark: input.watermark || { text: 'IMMM', x: 0.5, y: 0.94 },
    photoSlots: input.photoSlots || getPhotoSlotsForLayout(input.layout || '1x4'),
    canvasSize: input.canvasSize || getCanvasSizeForLayout(input.layout || '1x4'),
    createdAt: input.createdAt || now,
  });
  frame.createdAt = input.createdAt || now;
  frame.updatedAt = now;
  frame.category = 'my-frames';
  return frame;
}

function listFramePresets(customFrames = []) {
  return [
    ...getBuiltinFramePresets(),
    ...customFrames
      .map((preset) => normalizeFramePreset({ ...preset, source: 'custom' }))
      .filter((preset) => preset && !preset.deletedAt),
  ];
}

function getFramePresetById(id, customFrames = []) {
  if (!id) return null;
  const all = listFramePresets(customFrames);
  return all.find((preset) => preset.id === id) || null;
}

function getFramePresetsByCategory(category, customFrames = []) {
  if (category === 'my-frames') {
    return (customFrames || []).map((preset) => normalizeFramePreset({ ...preset, source: 'custom' })).filter((preset) => preset && !preset.deletedAt);
  }
  return listFramePresets(customFrames).filter((preset) => preset.category === category && preset.source !== 'custom');
}

function getDefaultFramePresetIdForLayout(layout, customFrames = []) {
  const normalizedLayout = normalizePresetLayout(layout);
  if (normalizedLayout === 'strip') return 'clean-white-4cut';
  if (normalizedLayout === 'grid') return 'heart-gem-2x2';
  if (normalizedLayout === 'trip') return 'friend-bubble-1x3';
  if (normalizedLayout === 'polaroid') return 'clean-polaroid-1x1';
  const builtins = getBuiltinFramePresets().filter((preset) => preset.layout === normalizedLayout);
  return builtins[0]?.id || null;
}

function getPresetBackgroundFill(background, width, height) {
  if (!background) return null;
  if (background.type === 'solid') return background.value || '#FFFFFF';
  if (background.type === 'gradient') return background.value || null;
  if (background.type === 'pattern') return background.value || null;
  return null;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius || 0, Math.min(width, height) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawHeartPath(ctx, x, y, width, height) {
  const topCurveHeight = height * 0.3;
  ctx.moveTo(x + width / 2, y + height * 0.95);
  ctx.bezierCurveTo(x + width * 1.1, y + height * 0.62, x + width * 0.92, y + topCurveHeight, x + width * 0.5, y + topCurveHeight);
  ctx.bezierCurveTo(x + width * 0.08, y + topCurveHeight, x - width * 0.1, y + height * 0.62, x + width / 2, y + height * 0.95);
}

function drawStarPath(ctx, x, y, width, height, points = 5) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const outer = Math.min(width, height) / 2;
  const inner = outer * 0.45;
  let angle = -Math.PI / 2;
  const step = Math.PI / points;
  ctx.moveTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    angle += step;
  }
  ctx.closePath();
}

function drawFrameDecoration(ctx, deco, width, height) {
  if (!deco) return;
  const x = deco.x * width;
  const y = deco.y * height;
  const w = deco.width * width;
  const h = deco.height * height;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((Number(deco.rotation) || 0) * Math.PI / 180);
  ctx.globalAlpha = Number.isFinite(deco.opacity) ? deco.opacity : 1;
  ctx.fillStyle = deco.fill || '#111111';
  if (deco.stroke) {
    ctx.strokeStyle = deco.stroke;
    ctx.lineWidth = deco.strokeWidth || Math.max(1, Math.min(w, h) * 0.03);
  }

  if (deco.type === 'text') {
    const fontSize = Math.max(10, Math.min(160, Math.min(w, h)));
    ctx.font = `${deco.fontWeight || 700} ${fontSize}px ${deco.fontFamily || '"Plus Jakarta Sans", Pretendard, system-ui'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(deco.text || '', 0, 0);
    ctx.restore();
    return;
  }

  ctx.beginPath();
  switch (deco.shape) {
    case 'line':
      ctx.fillRect(-w / 2, -h / 2, w, Math.max(1, h));
      break;
    case 'roundedRect':
    case 'ticket':
    case 'speech':
      drawRoundedRect(ctx, -w / 2, -h / 2, w, h, deco.radius || Math.min(w, h) * 0.2);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
    case 'heart':
      drawHeartPath(ctx, -w / 2, -h / 2, w, h);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
    case 'star':
      drawStarPath(ctx, -w / 2, -h / 2, w, h, 5);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
    case 'stamp':
      drawRoundedRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.15);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
    case 'ribbon':
      drawRoundedRect(ctx, -w / 2, -h / 4, w, h / 2, Math.min(w, h) * 0.14);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
    case 'circle':
    default:
      ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
      if (deco.stroke) ctx.stroke();
      break;
  }
  ctx.restore();
}

function drawFramePresetBackground(ctx, preset, width, height) {
  const background = preset?.background;
  if (!background) return;
  ctx.save();
  if (background.type === 'solid') {
    ctx.fillStyle = background.value || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'gradient') {
    const cfg = background.value || {};
    let gradient;
    if (cfg.type === 'radial') {
      gradient = ctx.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.44, Math.max(width, height) * 0.65);
    } else {
      const angle = Number(cfg.angle || 0) * Math.PI / 180;
      const dx = Math.cos(angle) * width * 0.5;
      const dy = Math.sin(angle) * height * 0.5;
      gradient = ctx.createLinearGradient(width * 0.5 - dx, height * 0.5 - dy, width * 0.5 + dx, height * 0.5 + dy);
    }
    const stops = Array.isArray(cfg.stops) && cfg.stops.length ? cfg.stops : ['#FFFFFF', '#F6F6F6'];
    const steps = Math.max(1, stops.length - 1);
    stops.forEach((stop, idx) => gradient.addColorStop(steps === 0 ? 0 : idx / steps, stop));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (background.type === 'pattern') {
    const cfg = background.value || {};
    ctx.fillStyle = cfg.color || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    const pattern = cfg.pattern || 'dots';
    if (pattern === 'dots') {
      ctx.fillStyle = cfg.dotColor || 'rgba(0,0,0,0.04)';
      const step = Math.max(30, Math.min(width, height) * 0.06);
      for (let y = 0; y < height + step; y += step) {
        for (let x = 0; x < width + step; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1.2, step * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'confetti') {
      const colors = cfg.accentColors || ['#FF8F9B', '#FFD66B', '#9FD3FF'];
      for (let i = 0; i < 110; i++) {
        const x = (i * 97) % width;
        const y = (i * 53) % height;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(((i * 13) % 360) * Math.PI / 180);
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-4, -1, 8, 2);
        ctx.restore();
      }
    } else if (pattern === 'bubbles') {
      ctx.fillStyle = cfg.bubbleColor || 'rgba(0,0,0,0.05)';
      for (let i = 0; i < 34; i++) {
        const x = (i * 83) % width;
        const y = (i * 127) % height;
        const r = 10 + (i % 5) * 6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawFramePresetLayer(ctx, preset, width, height, layer = 'all') {
  if (!preset) return;
  const decorations = Array.isArray(preset.decorations) ? preset.decorations : [];
  const list = decorations
    .filter((deco) => layer === 'all' || (layer === 'back' ? (deco.layer === 'back' || (Number(deco.zIndex) || 0) < 0) : (deco.layer !== 'back' && (Number(deco.zIndex) || 0) >= 0)))
    .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));
  list.forEach((deco) => drawFrameDecoration(ctx, deco, width, height));
}

function drawFramePresetWatermark(ctx, preset, width, height) {
  const watermark = preset?.watermark;
  if (!watermark?.text) return;
  ctx.save();
  ctx.fillStyle = watermark.fill || 'rgba(17,17,17,0.48)';
  ctx.globalAlpha = watermark.opacity ?? 0.48;
  ctx.font = `${watermark.fontWeight || 800} ${Math.max(10, Math.round(width * 0.024))}px "Plus Jakarta Sans", system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(watermark.text, (watermark.x || 0.5) * width, (watermark.y || 0.94) * height);
  ctx.restore();
}

function drawFramePresetOverlay(ctx, preset, width, height, options = {}) {
  if (!preset) return;
  if (options.background !== false) drawFramePresetBackground(ctx, preset, width, height);
  drawFramePresetLayer(ctx, preset, width, height, options.layer || 'all');
  if (options.watermark !== false) drawFramePresetWatermark(ctx, preset, width, height);
}

function getFramePresetCategoriesWithCounts(customFrames = []) {
  return FRAME_PRESET_CATEGORIES.map((category) => {
    if (category.id === 'my-frames') {
      return { ...category, count: (customFrames || []).filter((preset) => !preset.deletedAt).length };
    }
    return {
      ...category,
      count: getBuiltinFramePresets().filter((preset) => preset.category === category.id).length,
    };
  });
}

function isFramePresetCustom(preset) {
  return preset?.source === 'custom';
}

const IMMMFramePresets = {
  FRAME_PRESET_STORAGE_KEY,
  FRAME_PRESET_SELECTION_KEY,
  FRAME_PRESET_CATEGORIES,
  getCanvasSizeForLayout,
  getPhotoSlotsForLayout,
  getBuiltinFramePresets,
  getCustomFramePresets,
  loadCustomFramePresets,
  saveCustomFramePresets,
  listFramePresets,
  getFramePresetById,
  getFramePresetsByCategory,
  getDefaultFramePresetIdForLayout,
  getFramePresetCategories: getFramePresetCategoriesWithCounts,
  isFramePresetCustom,
  createCustomFramePresetFromAppState,
  sanitizeCustomFramePreset,
  sanitizeFrameSticker,
  sanitizeDrawStroke,
  normalizeFramePreset,
  drawFramePresetBackground,
  drawFramePresetLayer,
  drawFramePresetOverlay,
  drawFramePresetWatermark,
  drawFrameDecoration,
  createBackground,
  clonePlain,
  normalizePresetLayout,
};

if (typeof window !== 'undefined') {
  window.IMMMFramePresets = IMMMFramePresets;
  Object.assign(window, IMMMFramePresets);
}
