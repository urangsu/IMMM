// frame-presets.jsx — frame preset data model, custom frame storage, canvas helpers

const FRAME_PRESET_STORAGE_KEY = 'immm.v2.customFrames';
const FRAME_PRESET_SELECTION_KEY = 'immm.v2.selectedFramePresetId';
const FRAME_PACK_UNLOCK_STORAGE_KEY = 'immm.v2.unlockedFramePacks';
const FRAME_FAVORITE_STORAGE_KEY = 'immm.v2.favoriteFramePresets';
const FRAME_LIKE_STORAGE_KEY = 'immm.v2.frameLikes';
const FRAME_USE_STORAGE_KEY = 'immm.v2.frameUses';
const FRAME_PACK_FAVORITE_STORAGE_KEY = 'immm.v2.favoriteFramePacks';
const DESIGNER_DRAFT_RECOVERY_KEY = 'immm.v2.designerDraftRecovery';
const FRAME_EXPORT_PRESET_STORAGE_KEY = 'immm.v2.exportPresets';

const FRAME_BLEND_MODE_WHITELIST = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'];
const FRAME_LAYER_TYPES = ['background', 'photo-slots', 'overlays', 'text', 'stickers', 'watermark', 'fx'];
const FRAME_SYSTEM_LAYER_TYPES = ['background', 'photo-slots', 'watermark'];

const FRAME_EXPORT_PRESETS = [
  { id: 'hd', name: 'HD', widthFactor: 1, heightFactor: 1, description: 'Original high quality export.' },
  { id: 'instagram-story', name: 'Instagram Story', widthFactor: 0.5625, heightFactor: 1, description: 'Vertical story export.' },
  { id: 'instagram-post', name: 'Instagram Post', widthFactor: 1, heightFactor: 1, description: 'Square social export.' },
  { id: 'wallpaper', name: 'Wallpaper', widthFactor: 1.2, heightFactor: 1, description: 'Wide wallpaper-friendly export.' },
  { id: 'polaroid-print', name: 'Polaroid Print', widthFactor: 1, heightFactor: 1, description: 'Print-ready export.' },
  { id: 'mini-print', name: 'Mini Print', widthFactor: 0.75, heightFactor: 0.75, description: 'Compact print export.' },
];

const DEFAULT_FRAME_AUTHOR = {
  name: 'IMMM Studio',
  handle: '@immm',
  url: '',
};

const DEFAULT_CUSTOM_AUTHOR = {
  name: 'You',
  handle: '',
  url: '',
};

const DEFAULT_IMPORTED_AUTHOR = {
  name: 'Imported',
  handle: '',
  url: '',
};

function getDefaultCreatorProfileSafe(source = 'builtin') {
  const builtin = typeof DEFAULT_CREATOR_PROFILE !== 'undefined' ? DEFAULT_CREATOR_PROFILE : DEFAULT_FRAME_AUTHOR;
  const local = typeof DEFAULT_LOCAL_CREATOR_PROFILE !== 'undefined' ? DEFAULT_LOCAL_CREATOR_PROFILE : DEFAULT_CUSTOM_AUTHOR;
  return source === 'custom' ? local : builtin;
}

const DEFAULT_FRAME_LICENSE = 'internal';

const FRAME_PRESET_CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'character', label: 'Character' },
  { id: 'travel', label: 'Travel' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'couple', label: 'Couple' },
  { id: 'my-frames', label: 'My Frames' },
];

function normalizeAuthor(author, fallback = DEFAULT_FRAME_AUTHOR) {
  const source = author && typeof author === 'object' ? author : null;
  return {
    name: String(source?.name || fallback.name || 'IMMM Studio'),
    handle: String(source?.handle || fallback.handle || ''),
    url: String(source?.url || fallback.url || ''),
  };
}

function normalizeLicense(license) {
  const value = String(license || DEFAULT_FRAME_LICENSE).toLowerCase();
  return ['personal', 'commercial', 'brand-collab', 'internal'].includes(value) ? value : DEFAULT_FRAME_LICENSE;
}

function readStringArrayStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item || '')).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function writeStringArrayStorage(key, values) {
  const safe = Array.isArray(values) ? values.map((item) => String(item || '')).filter(Boolean) : [];
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(safe))));
  return safe;
}

function mergeUniqueStrings(base, extra = []) {
  return Array.from(new Set([...(Array.isArray(base) ? base : []), ...(Array.isArray(extra) ? extra : [])].map((item) => String(item || '')).filter(Boolean)));
}

function readJsonStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function getCreatorApiSafe() {
  return typeof window !== 'undefined' ? window.IMMMCreatorProfiles || null : null;
}

function getMotionApiSafe() {
  return typeof window !== 'undefined' ? window.IMMMMotionFrameContract || null : null;
}

function normalizeMotionLayersSafe(layers, preset = null) {
  const motionApi = getMotionApiSafe();
  if (motionApi?.normalizeMotionLayers) {
    return motionApi.normalizeMotionLayers(layers || motionApi.createMotionFrameLayersFromPreset?.(preset) || []);
  }
  return Array.isArray(layers)
    ? layers.map((layer, index) => ({
        id: String(layer?.id || `motion_${index}_${Math.random().toString(36).slice(2, 8)}`),
        type: String(layer?.type || 'animated-overlay'),
        animation: String(layer?.animation || 'pulse'),
        duration: Math.max(120, Math.floor(Number(layer?.duration) || 1200)),
        loop: layer?.loop !== false,
        easing: String(layer?.easing || 'ease-in-out'),
        opacity: Number.isFinite(layer?.opacity) ? clampNumber(layer.opacity, 0, 1) : 1,
        blendMode: normalizeBlendMode(layer?.blendMode),
        zIndex: Number.isFinite(layer?.zIndex) ? Number(layer.zIndex) : index,
        visible: layer?.visible !== false,
      }))
    : [];
}

function normalizeBlendMode(mode) {
  const value = String(mode || 'normal');
  return FRAME_BLEND_MODE_WHITELIST.includes(value) ? value : 'normal';
}

function createFrameLayer(partial = {}, index = 0) {
  return {
    id: String(partial.id || `layer_${index}_${Math.random().toString(36).slice(2, 8)}`),
    type: FRAME_LAYER_TYPES.includes(partial.type) ? String(partial.type) : 'overlays',
    visible: partial.visible !== false,
    locked: Boolean(partial.locked),
    opacity: Number.isFinite(partial.opacity) ? clampNumber(partial.opacity, 0, 1) : 1,
    blendMode: normalizeBlendMode(partial.blendMode),
    zIndex: Number.isFinite(partial.zIndex) ? Number(partial.zIndex) : index,
  };
}

function buildDefaultFrameLayers() {
  return [
    createFrameLayer({ id: 'layer-background', type: 'background', zIndex: -40, locked: true }),
    createFrameLayer({ id: 'layer-photo-slots', type: 'photo-slots', zIndex: -20, locked: true }),
    createFrameLayer({ id: 'layer-overlays', type: 'overlays', zIndex: -5 }),
    createFrameLayer({ id: 'layer-text', type: 'text', zIndex: 5 }),
    createFrameLayer({ id: 'layer-stickers', type: 'stickers', zIndex: 10 }),
    createFrameLayer({ id: 'layer-watermark', type: 'watermark', zIndex: 20, locked: true }),
    createFrameLayer({ id: 'layer-fx', type: 'fx', zIndex: 30 }),
  ];
}

function normalizeFrameLayers(layers) {
  const defaults = buildDefaultFrameLayers();
  const source = Array.isArray(layers) && layers.length ? layers : defaults;
  const byType = new Map();

  source.forEach((layer, index) => {
    const normalized = createFrameLayer(layer, index);
    if (!normalized || !FRAME_LAYER_TYPES.includes(normalized.type)) return;
    byType.set(normalized.type, normalized);
  });

  return defaults
    .map((fallbackLayer, index) => {
      const incoming = byType.get(fallbackLayer.type) || {};
      return createFrameLayer({
        ...fallbackLayer,
        ...incoming,
        id: incoming.id || fallbackLayer.id,
        visible: FRAME_SYSTEM_LAYER_TYPES.includes(fallbackLayer.type) ? true : incoming.visible !== false,
        locked: FRAME_SYSTEM_LAYER_TYPES.includes(fallbackLayer.type) ? true : Boolean(incoming.locked),
        zIndex: Number.isFinite(incoming.zIndex) ? Number(incoming.zIndex) : fallbackLayer.zIndex,
      }, index);
    })
    .sort((a, b) => Number(a.zIndex) - Number(b.zIndex));
}

function getFrameLayerOrder(preset) {
  return normalizeFrameLayers(preset?.layers || []);
}

function getFrameLikeIds() {
  return mergeUniqueStrings([], readJsonStorage(FRAME_LIKE_STORAGE_KEY, []));
}

function saveFrameLikeIds(ids) {
  return writeJsonStorage(FRAME_LIKE_STORAGE_KEY, Array.from(new Set(Array.isArray(ids) ? ids : [])));
}

function toggleFrameLikeId(frameId, current = null) {
  if (!frameId) return [];
  const existing = Array.isArray(current) ? current : getFrameLikeIds();
  const next = existing.includes(frameId)
    ? existing.filter((id) => id !== frameId)
    : [...existing, frameId];
  saveFrameLikeIds(next);
  return next;
}

function getFrameUseCounts() {
  const raw = readJsonStorage(FRAME_USE_STORAGE_KEY, {});
  return raw && typeof raw === 'object' ? raw : {};
}

function saveFrameUseCounts(counts) {
  return writeJsonStorage(FRAME_USE_STORAGE_KEY, counts && typeof counts === 'object' ? counts : {});
}

function incrementFrameUseCount(frameId) {
  if (!frameId) return 0;
  const counts = getFrameUseCounts();
  const next = { ...counts, [frameId]: (Number(counts[frameId]) || 0) + 1 };
  saveFrameUseCounts(next);
  return next[frameId];
}

function getFrameUseCount(frameId) {
  if (!frameId) return 0;
  const counts = getFrameUseCounts();
  return Number(counts[frameId]) || 0;
}

function loadFavoriteFramePackIds() {
  return readStringArrayStorage(FRAME_PACK_FAVORITE_STORAGE_KEY);
}

function saveFavoriteFramePackIds(ids) {
  return writeStringArrayStorage(FRAME_PACK_FAVORITE_STORAGE_KEY, ids);
}

function toggleFavoriteFramePackId(packId, current = null) {
  if (!packId) return [];
  const existing = Array.isArray(current) ? current : loadFavoriteFramePackIds();
  const next = existing.includes(packId)
    ? existing.filter((id) => id !== packId)
    : [...existing, packId];
  saveFavoriteFramePackIds(next);
  return next;
}

function getFrameTrendingScore(frame, likes = 0, uses = 0) {
  const creatorApi = getCreatorApiSafe();
  const score = creatorApi?.getTrendingScore || (typeof getTrendingScore === 'function' ? getTrendingScore : null);
  const likeCount = Number(likes ?? frame?.likes ?? 0) || 0;
  const useCount = Number(uses ?? frame?.uses ?? 0) || 0;
  if (typeof score === 'function') {
    return score({ likes: likeCount, uses: useCount, createdAt: frame?.createdAt, updatedAt: frame?.updatedAt });
  }
  const recentBoost = frame?.updatedAt || frame?.createdAt ? 10 : 0;
  return likeCount * 3 + useCount * 2 + recentBoost;
}

function getExportPresets() {
  return FRAME_EXPORT_PRESETS.slice();
}

function getExportPresetById(id) {
  if (!id) return null;
  return getExportPresets().find((preset) => preset.id === id) || null;
}

function normalizeExportPreset(preset) {
  if (!preset || typeof preset !== 'object') return null;
  return {
    id: String(preset.id || 'hd'),
    name: String(preset.name || 'HD'),
    widthFactor: clampNumber(preset.widthFactor ?? 1, 0.25, 4),
    heightFactor: clampNumber(preset.heightFactor ?? 1, 0.25, 4),
    description: String(preset.description || ''),
  };
}

function getDefaultExportPresetId() {
  const presets = getExportPresets();
  return presets[0]?.id || 'hd';
}

function generateFrameIdea(prompt = '') {
  const text = String(prompt || '').trim().toLowerCase();
  const hash = Array.from(text).reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) >>> 0, 7);
  const themes = [
    { layout: 'grid', background: { type: 'gradient', value: { type: 'linear', angle: 20, stops: ['#FFF1F7', '#F4D7FF'] } }, text: 'kawaii day', watermark: 'IMMM' },
    { layout: 'strip', background: { type: 'pattern', value: { pattern: 'dots', color: '#FFF7FB', dotColor: 'rgba(17,17,17,0.05)' } }, text: 'film diary', watermark: 'IMMM' },
    { layout: 'trip', background: { type: 'gradient', value: { type: 'linear', angle: 90, stops: ['#F7FBFF', '#E5F1FF'] } }, text: 'wedding notes', watermark: 'IMMM' },
    { layout: 'polaroid', background: { type: 'solid', value: '#FFFFFF' }, text: 'retro note', watermark: 'IMMM' },
  ];
  const pick = themes[hash % themes.length];
  return {
    prompt,
    background: pick.background,
    decorations: [
      { type: 'shape', shape: 'heart', x: 0.08, y: 0.06, width: 0.08, height: 0.07, rotation: -12, opacity: 0.92, zIndex: 1, fill: '#F08BA5' },
      { type: 'text', text: pick.text, x: 0.5, y: 0.92, width: 0.2, height: 0.05, rotation: 0, opacity: 0.84, zIndex: 2, fill: '#6B574E', fontWeight: 800 },
    ],
    recommendedLayout: pick.layout,
    watermark: { text: pick.watermark, x: 0.5, y: 0.962, opacity: 0.45 },
    palette: [String((pick.background?.value?.stops || ['#FFF', '#F6F6F6'])[0]), String((pick.background?.value?.stops || ['#FFF', '#F6F6F6'])[1])],
  };
}

function saveDesignerDraftRecovery(draft) {
  if (!draft) return null;
  const payload = {
    savedAt: new Date().toISOString(),
    draft: normalizeDesignerDraft(draft),
  };
  writeJsonStorage(DESIGNER_DRAFT_RECOVERY_KEY, payload);
  return payload;
}

function loadDesignerDraftRecovery() {
  const payload = readJsonStorage(DESIGNER_DRAFT_RECOVERY_KEY, null);
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.draft) return null;
  return payload;
}

function clearDesignerDraftRecovery() {
  try {
    localStorage.removeItem(DESIGNER_DRAFT_RECOVERY_KEY);
  } catch (_) {}
}

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
    opacity: 1,
  };
}

function clampNumber(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

function clampRectToCanvas(rect, canvasSize, minWidth = 48, minHeight = 48) {
  const width = Number(canvasSize?.width) || 1;
  const height = Number(canvasSize?.height) || 1;
  const nextWidth = clampNumber(rect?.width ?? minWidth, minWidth, width);
  const nextHeight = clampNumber(rect?.height ?? minHeight, minHeight, height);
  const nextX = clampNumber(rect?.x ?? 0, 0, Math.max(0, width - nextWidth));
  const nextY = clampNumber(rect?.y ?? 0, 0, Math.max(0, height - nextHeight));
  return {
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
    radius: clampNumber(rect?.radius ?? 0, 0, Math.max(0, Math.min(nextWidth, nextHeight) / 2)),
  };
}

function normalizeDesignerDecoration(deco, canvasSize) {
  if (!deco || typeof deco !== 'object') return null;
  const rect = clampRectToCanvas({
    x: deco.x,
    y: deco.y,
    width: deco.width,
    height: deco.height,
    radius: deco.radius,
  }, canvasSize, 24, 24);
  return makeDecoration({
    ...deco,
    ...rect,
    opacity: Number.isFinite(deco.opacity) ? clampNumber(deco.opacity, 0, 1) : 1,
    zIndex: Number.isFinite(deco.zIndex) ? deco.zIndex : 0,
    layer: deco.layer || (Number.isFinite(deco.zIndex) && deco.zIndex < 0 ? 'back' : 'front'),
  });
}

function createFrameDesignerDraft(basePreset = null) {
  const preset = normalizeFramePreset(basePreset || getBuiltinFramePresets()[0] || null) || normalizeFramePreset({
    id: `draft-${Date.now().toString(36)}`,
    name: 'Untitled Frame',
    layout: '1x4',
    background: createBackground('solid', '#FFFFFF'),
    photoSlots: getPhotoSlotsForLayout('1x4'),
    decorations: [],
    watermark: { text: 'IMMM', x: 0.5, y: 0.94, opacity: 0.48 },
  });
  if (!preset) return null;
  const createdAt = preset.createdAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();
  return {
    id: preset.source === 'custom' ? (preset.id || `draft-${Date.now().toString(36)}`) : `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: preset.name || 'Untitled Frame',
    layout: normalizePresetLayout(preset.layout || '1x4'),
    canvasSize: clonePlain(preset.canvasSize || getCanvasSizeForLayout(preset.layout || '1x4')),
    frameColor: preset.frameColor || '#FFFFFF',
    background: clonePlain(preset.background || createBackground('solid', '#FFFFFF')),
    photoSlots: (Array.isArray(preset.photoSlots) ? preset.photoSlots : getPhotoSlotsForLayout(preset.layout || '1x4')).map((slot) => clampRectToCanvas(slot, preset.canvasSize || getCanvasSizeForLayout(preset.layout || '1x4'), 24, 24)),
    decorations: Array.isArray(preset.decorations)
      ? preset.decorations.map((deco) => normalizeDesignerDecoration(deco, preset.canvasSize || getCanvasSizeForLayout(preset.layout || '1x4'))).filter(Boolean)
      : [],
    stickers: Array.isArray(preset.stickers)
      ? preset.stickers.map((sticker) => sanitizeFrameSticker(sticker)).filter(Boolean)
      : [],
    drawStrokes: Array.isArray(preset.drawStrokes)
      ? preset.drawStrokes.map((stroke) => sanitizeDrawStroke(stroke)).filter(Boolean)
      : [],
    watermark: preset.watermark ? { ...preset.watermark } : { text: 'IMMM', x: 0.5, y: 0.94, opacity: 0.48 },
    author: normalizeAuthor(preset.author, preset.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR),
    license: normalizeLicense(preset.license || DEFAULT_FRAME_LICENSE),
    packId: preset.packId || null,
    packName: preset.packName || null,
    tags: Array.isArray(preset.packTags) ? preset.packTags.slice() : [],
    createdAt,
    updatedAt,
    creatorId: String(preset.creatorId || (preset.author?.name === 'You' ? 'you' : 'immm-studio')),
    creator: preset.creator ? normalizeAuthor(preset.creator, preset.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR) : normalizeAuthor(preset.author, preset.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR),
    likes: Math.max(0, Math.floor(Number(preset.likes) || 0)),
    uses: Math.max(0, Math.floor(Number(preset.uses) || 0)),
    trendingScore: Math.max(0, Math.floor(Number(preset.trendingScore) || 0)),
    layers: normalizeFrameLayers(preset.layers),
    motionLayers: normalizeMotionLayersSafe(preset.motionLayers, preset),
  };
}

function normalizeDesignerDraft(draft) {
  if (!draft || typeof draft !== 'object') return null;
  const layout = normalizePresetLayout(draft.layout || '1x4');
  const canvasSize = clonePlain(draft.canvasSize || getCanvasSizeForLayout(layout));
  const baseSlots = Array.isArray(draft.photoSlots) && draft.photoSlots.length ? draft.photoSlots : getPhotoSlotsForLayout(layout);
  const photoSlots = baseSlots.map((slot) => clampRectToCanvas(slot, canvasSize, 24, 24));
  const decorations = Array.isArray(draft.decorations)
    ? draft.decorations.map((deco) => normalizeDesignerDecoration(deco, canvasSize)).filter(Boolean)
    : [];
  const stickers = Array.isArray(draft.stickers)
    ? draft.stickers.map((sticker) => sanitizeFrameSticker(sticker)).filter(Boolean)
    : [];
  const drawStrokes = Array.isArray(draft.drawStrokes)
    ? draft.drawStrokes.map((stroke) => sanitizeDrawStroke(stroke)).filter(Boolean)
    : [];
  const background = draft.background ? clonePlain(draft.background) : createBackground('solid', draft.frameColor || '#FFFFFF');
  background.opacity = Number.isFinite(background.opacity) ? clampNumber(background.opacity, 0, 1) : 1;
  return {
    id: String(draft.id || `draft-${Date.now().toString(36)}`),
    name: String(draft.name || 'Untitled Frame'),
    layout,
    canvasSize: {
      width: Number(canvasSize.width) || getCanvasSizeForLayout(layout).width,
      height: Number(canvasSize.height) || getCanvasSizeForLayout(layout).height,
    },
    frameColor: String(draft.frameColor || background.value || '#FFFFFF'),
    background,
    photoSlots,
    decorations,
    stickers,
    drawStrokes,
    watermark: draft.watermark ? {
      text: String(draft.watermark.text ?? 'IMMM'),
      x: clampNumber(draft.watermark.x ?? 0.5, 0, 1),
      y: clampNumber(draft.watermark.y ?? 0.94, 0, 1),
      opacity: clampNumber(draft.watermark.opacity ?? 0.48, 0, 1),
      fill: draft.watermark.fill || undefined,
      fontWeight: draft.watermark.fontWeight || 800,
    } : { text: 'IMMM', x: 0.5, y: 0.94, opacity: 0.48, fontWeight: 800 },
    author: normalizeAuthor(draft.author, draft.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR),
    license: normalizeLicense(draft.license || DEFAULT_FRAME_LICENSE),
    packId: draft.packId || null,
    packName: draft.packName || null,
    tags: Array.isArray(draft.tags) ? draft.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
    createdAt: draft.createdAt || null,
    updatedAt: draft.updatedAt || null,
    creatorId: String(draft.creatorId || (draft.author?.name === 'You' ? 'you' : 'immm-studio')),
    creator: draft.creator ? normalizeAuthor(draft.creator, draft.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR) : normalizeAuthor(draft.author, draft.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR),
    likes: Math.max(0, Math.floor(Number(draft.likes) || 0)),
    uses: Math.max(0, Math.floor(Number(draft.uses) || 0)),
    trendingScore: Math.max(0, Math.floor(Number(draft.trendingScore) || 0)),
    layers: normalizeFrameLayers(draft.layers),
    motionLayers: normalizeMotionLayersSafe(draft.motionLayers, draft),
  };
}

function validateDesignerDraft(draft) {
  const normalized = normalizeDesignerDraft(draft);
  if (!normalized) {
    return { ok: false, error: 'Designer draft is invalid' };
  }
  if (!normalized.name.trim()) {
    return { ok: false, error: 'Frame name is required' };
  }
  const slotCount = getPhotoSlotsForLayout(normalized.layout).length;
  if (!Array.isArray(normalized.photoSlots) || normalized.photoSlots.length !== slotCount) {
    return { ok: false, error: 'Photo slot count does not match layout' };
  }
  if (normalized.canvasSize.width <= 0 || normalized.canvasSize.height <= 0) {
    return { ok: false, error: 'Canvas size is invalid' };
  }
  const json = JSON.stringify(normalized);
  if (json.includes('dataUrl') || json.includes('data:image/')) {
    return { ok: false, error: 'Designer draft must not contain dataUrl' };
  }
  if (json.length > 1024 * 1024) {
    return { ok: false, error: 'Designer draft is too large' };
  }
  return { ok: true, draft: normalized };
}

function draftToCustomFramePreset(draft) {
  const validation = validateDesignerDraft(draft);
  if (!validation.ok) return null;
  const normalized = validation.draft;
  return sanitizeCustomFramePreset({
    id: normalized.id,
    name: normalized.name,
    layout: normalized.layout,
    frameColor: normalized.frameColor,
    background: normalized.background,
    photoSlots: normalized.photoSlots,
    decorations: normalized.decorations,
    stickers: Array.isArray(normalized.stickers) ? normalized.stickers : [],
    drawStrokes: Array.isArray(normalized.drawStrokes) ? normalized.drawStrokes : [],
    watermark: normalized.watermark,
    createdAt: normalized.createdAt || new Date().toISOString(),
    updatedAt: normalized.updatedAt || new Date().toISOString(),
    author: normalized.author,
    license: normalized.license,
    packId: normalized.packId,
    packName: normalized.packName,
    packTags: normalized.tags,
    packPriceType: 'free',
    packPriceLabel: 'Free',
  });
}

function duplicateFramePresetAsDraft(preset) {
  const normalized = normalizeFramePreset(preset);
  if (!normalized) return null;
  const draft = createFrameDesignerDraft(normalized);
  if (!draft) return null;
  draft.id = `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  draft.name = `${normalized.name || 'Frame'} Copy`;
  draft.createdAt = new Date().toISOString();
  draft.updatedAt = new Date().toISOString();
  return draft;
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
  author,
  license,
  packId,
  packName,
  packDescription,
  packTags,
  packPriceType,
  packPriceLabel,
  packLocked,
  creatorId,
  creator,
  likes,
  uses,
  layers,
  motionLayers,
}) {
  const resolvedLayout = normalizePresetLayout(layout || '1x4');
  const size = canvasSize || getCanvasSizeForLayout(resolvedLayout);
  const creatorApi = getCreatorApiSafe();
  const defaultCreator = normalizeAuthor(author || creator || (creatorId === 'you' ? DEFAULT_CUSTOM_AUTHOR : DEFAULT_FRAME_AUTHOR));
  const resolvedCreator = creatorApi?.normalizeCreatorProfile
    ? creatorApi.normalizeCreatorProfile(creator || getDefaultCreatorProfileSafe(creatorId === 'you' ? 'custom' : 'builtin'))
    : {
      id: String(creatorId || (defaultCreator.name === 'You' ? 'you' : 'immm-studio')),
      name: defaultCreator.name,
      bio: '',
      avatarColor: defaultCreator.name === 'You' ? '#D98893' : '#1A1A1F',
      instagram: '',
      website: '',
      verified: defaultCreator.name !== 'You',
      socialLinks: [],
      packsCreated: 0,
      likes: 0,
    };
  const resolvedMotionLayers = normalizeMotionLayersSafe(motionLayers, { name, category, background, frameColor, layout: resolvedLayout });
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
    author: defaultCreator,
    license: normalizeLicense(license),
    packId: packId || null,
    packName: packName || null,
    packDescription: packDescription || null,
    packTags: Array.isArray(packTags) ? packTags.map((tag) => String(tag || '').toLowerCase()).filter(Boolean) : [],
    packPriceType: packPriceType || 'free',
    packPriceLabel: packPriceLabel || 'Free',
    packLocked: Boolean(packLocked),
    creatorId: String(creatorId || resolvedCreator.id || 'immm-studio'),
    creator: resolvedCreator,
    likes: Math.max(0, Math.floor(Number(likes) || 0)),
    uses: Math.max(0, Math.floor(Number(uses) || 0)),
    layers: normalizeFrameLayers(layers),
    motionLayers: resolvedMotionLayers,
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

function makePack({
  id,
  name,
  description,
  category,
  priceType = 'free',
  priceLabel = 'Free',
  presetIds = [],
  coverPresetId = '',
  tags = [],
  locked = false,
  featured = false,
  author = DEFAULT_FRAME_AUTHOR,
  license = DEFAULT_FRAME_LICENSE,
}) {
  return {
    id,
    name,
    description,
    category,
    priceType,
    priceLabel,
    presetIds: Array.from(new Set((presetIds || []).map((presetId) => String(presetId || '')).filter(Boolean))),
    coverPresetId: String(coverPresetId || presetIds?.[0] || ''),
    tags: Array.from(new Set((tags || []).map((tag) => String(tag || '').toLowerCase()).filter(Boolean))),
    locked: Boolean(locked),
    featured: Boolean(featured),
    author: normalizeAuthor(author),
    license: normalizeLicense(license),
    source: 'builtin',
  };
}

const BUILTIN_FRAME_PACKS = [
  makePack({
    id: 'basic-clean-pack',
    name: 'Basic Clean Pack',
    description: 'Clean frames for everyday use.',
    category: 'basic',
    priceType: 'free',
    priceLabel: 'Free',
    presetIds: ['clean-white-4cut', 'clean-cotton-4cut', 'black-studio-4cut', 'clean-polaroid-1x1'],
    coverPresetId: 'clean-white-4cut',
    tags: ['clean', 'minimal', 'daily'],
    locked: false,
    featured: true,
  }),
  makePack({
    id: 'travel-starter-pack',
    name: 'Travel Starter Pack',
    description: 'Postcard-style frames for trips and memories.',
    category: 'travel',
    priceType: 'free',
    priceLabel: 'Free',
    presetIds: ['travel-ticket-1x4', 'friend-bubble-1x3'],
    coverPresetId: 'travel-ticket-1x4',
    tags: ['travel', 'postcard', 'stamp'],
    locked: false,
    featured: true,
  }),
  makePack({
    id: 'kitsch-character-pack',
    name: 'Kitsch Character Pack',
    description: 'Cute character mood for playful sessions.',
    category: 'character',
    priceType: 'premium',
    priceLabel: 'Pro',
    presetIds: ['kitsch-bear-2x2', 'heart-gem-2x2'],
    coverPresetId: 'kitsch-bear-2x2',
    tags: ['cute', 'character', 'kitsch'],
    locked: true,
    featured: true,
  }),
  makePack({
    id: 'birthday-celebration-pack',
    name: 'Birthday Celebration Pack',
    description: 'Party frames for birthdays and special days.',
    category: 'birthday',
    priceType: 'premium',
    priceLabel: 'Pro',
    presetIds: ['birthday-ribbon-2x2'],
    coverPresetId: 'birthday-ribbon-2x2',
    tags: ['birthday', 'party', 'gift'],
    locked: true,
  }),
];

const BUILTIN_FRAME_PRESETS = buildBuiltinFramePresets();

function normalizeFramePreset(preset) {
  if (!preset || typeof preset !== 'object') return null;
  const layout = normalizePresetLayout(preset.layout || '1x4');
  const size = preset.canvasSize || getCanvasSizeForLayout(layout);
  const builtinPack = getBuiltinFramePackForPresetId(preset.id) || null;
  const creatorApi = getCreatorApiSafe();
  const motionApi = getMotionApiSafe();
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
  const layers = normalizeFrameLayers(preset.layers);
  const motionLayers = normalizeMotionLayersSafe(preset.motionLayers, preset);
  const creator = creatorApi?.normalizeCreatorProfile
    ? creatorApi.normalizeCreatorProfile(preset.creator || getDefaultCreatorProfileSafe(preset.creatorId === 'you' ? 'custom' : 'builtin'))
    : normalizeAuthor(preset.creator || preset.author, preset.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : (preset.source === 'imported' ? DEFAULT_IMPORTED_AUTHOR : (builtinPack?.author || DEFAULT_FRAME_AUTHOR)));
  const likes = Math.max(0, Math.floor(Number(preset.likes) || 0));
  const uses = Math.max(0, Math.floor(Number(preset.uses) || 0));

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
    layers,
    motionLayers,
    watermark: preset.watermark ? { ...preset.watermark } : { text: 'IMMM', x: 0.5, y: 0.94 },
    createdAt: preset.createdAt || null,
    updatedAt: preset.updatedAt || null,
    source: preset.source === 'custom' ? 'custom' : preset.source === 'imported' ? 'imported' : 'builtin',
    deletedAt: preset.deletedAt || null,
    author: normalizeAuthor(preset.author || creator, preset.source === 'custom' ? DEFAULT_CUSTOM_AUTHOR : preset.source === 'imported' ? DEFAULT_IMPORTED_AUTHOR : (builtinPack?.author || DEFAULT_FRAME_AUTHOR)),
    license: normalizeLicense(preset.license || builtinPack?.license || DEFAULT_FRAME_LICENSE),
    packId: preset.packId || builtinPack?.id || null,
    packName: preset.packName || builtinPack?.name || null,
    packDescription: preset.packDescription || builtinPack?.description || null,
    packTags: Array.isArray(preset.packTags) ? preset.packTags.map((tag) => String(tag || '').toLowerCase()).filter(Boolean) : (builtinPack?.tags || []),
    packPriceType: preset.packPriceType || builtinPack?.priceType || 'free',
    packPriceLabel: preset.packPriceLabel || builtinPack?.priceLabel || 'Free',
    packLocked: Boolean(preset.packLocked ?? builtinPack?.locked ?? false),
    creatorId: String(preset.creatorId || creator?.id || (preset.source === 'custom' ? 'you' : 'immm-studio')),
    creator,
    likes,
    uses,
    trendingScore: getFrameTrendingScore(preset, likes, uses),
  };
}

function getBuiltinFramePresets() {
  return BUILTIN_FRAME_PRESETS.map((preset) => normalizeFramePreset(preset));
}

function getBuiltinFramePackForPresetId(presetId) {
  if (!presetId) return null;
  return BUILTIN_FRAME_PACKS.find((pack) => Array.isArray(pack.presetIds) && pack.presetIds.includes(presetId)) || null;
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
      .map((preset) => normalizeFramePreset({ ...preset, source: preset.source === 'imported' ? 'imported' : 'custom' }))
      .filter((preset) => preset && !preset.deletedAt);
  } catch (error) {
    console.warn('[IMMM] loadCustomFramePresets failed:', error);
    return [];
  }
}

function saveCustomFramePresets(frames) {
  const safe = (Array.isArray(frames) ? frames : [])
    .map((preset) => {
      if (preset && preset.source === 'imported') {
        return sanitizeImportedFramePreset(preset, {
          id: preset.packId || null,
          name: preset.packName || null,
          description: preset.packDescription || null,
          tags: preset.packTags || [],
          priceType: preset.packPriceType || 'imported',
          priceLabel: preset.packPriceLabel || 'Imported',
          author: preset.author || DEFAULT_IMPORTED_AUTHOR,
          license: preset.license || DEFAULT_FRAME_LICENSE,
        });
      }
      return sanitizeCustomFramePreset(preset);
    })
    .filter(Boolean);
  localStorage.setItem(FRAME_PRESET_STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

function getImportedFramePackGroups(customFrames = []) {
  const groups = new Map();
  (Array.isArray(customFrames) ? customFrames : []).forEach((frame) => {
    if (!frame || frame.deletedAt || frame.source !== 'imported') return;
    const normalized = normalizeFramePreset({ ...frame, source: 'imported' });
    const packId = normalized.packId || `imported-${normalized.id}`;
    if (!groups.has(packId)) {
      groups.set(packId, {
        id: packId,
        name: normalized.packName || normalized.name || 'Imported Pack',
        description: normalized.packDescription || 'Imported frame pack.',
        category: normalized.category || 'my-frames',
        priceType: normalized.packPriceType || 'imported',
        priceLabel: normalized.packPriceLabel || 'Imported',
        presetIds: [],
        coverPresetId: normalized.id,
        tags: Array.isArray(normalized.packTags) ? normalized.packTags : [],
        locked: false,
        featured: false,
        author: normalizeAuthor(normalized.author, DEFAULT_IMPORTED_AUTHOR),
        license: normalizeLicense(normalized.license),
        source: 'imported',
      });
    }
    const pack = groups.get(packId);
    pack.presetIds.push(normalized.id);
    if (!pack.coverPresetId) pack.coverPresetId = normalized.id;
  });
  return Array.from(groups.values()).map((pack) => ({
    ...pack,
    presetIds: Array.from(new Set(pack.presetIds)),
  }));
}

function getFramePacks(customFrames = []) {
  return [...BUILTIN_FRAME_PACKS, ...getImportedFramePackGroups(customFrames)];
}

function getFramePackById(id, customFrames = []) {
  if (!id) return null;
  return getFramePacks(customFrames).find((pack) => pack.id === id) || null;
}

function getFramePresetsByPack(packId, customFrames = []) {
  if (!packId) return [];
  const pack = getFramePackById(packId, customFrames);
  if (!pack) return [];
  const presetIds = Array.isArray(pack.presetIds) ? pack.presetIds : [];
  const all = listFramePresets(customFrames);
  return presetIds
    .map((presetId) => all.find((preset) => preset.id === presetId) || null)
    .filter(Boolean);
}

function getUnlockedFramePackIds() {
  const defaults = BUILTIN_FRAME_PACKS.filter((pack) => !pack.locked).map((pack) => pack.id);
  return mergeUniqueStrings(defaults, readStringArrayStorage(FRAME_PACK_UNLOCK_STORAGE_KEY));
}

function saveUnlockedFramePackIds(ids) {
  return writeStringArrayStorage(FRAME_PACK_UNLOCK_STORAGE_KEY, ids);
}

function isFramePackUnlocked(packId) {
  if (!packId) return false;
  const pack = BUILTIN_FRAME_PACKS.find((item) => item.id === packId);
  if (!pack) return true;
  if (!pack.locked) return true;
  return getUnlockedFramePackIds().includes(packId);
}

function unlockFramePackForDev(packId) {
  if (!packId) return [];
  const next = mergeUniqueStrings(getUnlockedFramePackIds(), [packId]);
  saveUnlockedFramePackIds(next);
  return next;
}

function loadFavoriteFramePresetIds() {
  return readStringArrayStorage(FRAME_FAVORITE_STORAGE_KEY);
}

function saveFavoriteFramePresetIds(ids) {
  return writeStringArrayStorage(FRAME_FAVORITE_STORAGE_KEY, ids);
}

function toggleFavoriteFramePresetId(presetId, current = null) {
  if (!presetId) return [];
  const existing = Array.isArray(current) ? current : loadFavoriteFramePresetIds();
  const next = existing.includes(presetId)
    ? existing.filter((id) => id !== presetId)
    : [...existing, presetId];
  saveFavoriteFramePresetIds(next);
  return next;
}

function isFavoriteFramePresetId(presetId, favorites = null) {
  if (!presetId) return false;
  const current = Array.isArray(favorites) ? favorites : loadFavoriteFramePresetIds();
  return current.includes(presetId);
}

function framePackHasDataUrl(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(obj, 'dataUrl')) return true;
  return JSON.stringify(obj).includes('"dataUrl"') || JSON.stringify(obj).includes('data:image/');
}

function sanitizeImportedFramePreset(frame, packMeta = {}) {
  const normalized = normalizeFramePreset({
    ...frame,
    source: 'imported',
    author: frame.author || packMeta.author || DEFAULT_IMPORTED_AUTHOR,
    license: frame.license || packMeta.license || DEFAULT_FRAME_LICENSE,
    packId: frame.packId || packMeta.id || null,
    packName: frame.packName || packMeta.name || null,
    packDescription: frame.packDescription || packMeta.description || null,
    packTags: frame.packTags || packMeta.tags || [],
    packPriceType: frame.packPriceType || packMeta.priceType || 'imported',
    packPriceLabel: frame.packPriceLabel || packMeta.priceLabel || 'Imported',
    packLocked: false,
  });
  if (!normalized) return null;
  normalized.source = 'imported';
  normalized.author = normalizeAuthor(normalized.author, DEFAULT_IMPORTED_AUTHOR);
  normalized.license = normalizeLicense(normalized.license);
  normalized.packId = normalized.packId || packMeta.id || null;
  normalized.packName = normalized.packName || packMeta.name || null;
  normalized.packDescription = normalized.packDescription || packMeta.description || null;
  normalized.packTags = Array.isArray(normalized.packTags) ? normalized.packTags : [];
  normalized.packPriceType = normalized.packPriceType || 'imported';
  normalized.packPriceLabel = normalized.packPriceLabel || 'Imported';
  normalized.importedAt = new Date().toISOString();
  return normalized;
}

function validateFramePackJson(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'Empty frame pack JSON' };
  }
  if (raw.length > 1024 * 1024) {
    return { ok: false, error: 'Frame pack JSON too large' };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return { ok: false, error: 'Invalid JSON' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Frame pack must be an object' };
  }
  if (framePackHasDataUrl(parsed)) {
    return { ok: false, error: 'Frame pack JSON must not contain dataUrl' };
  }
  const pack = parsed.pack && typeof parsed.pack === 'object' ? parsed.pack : {};
  const presets = Array.isArray(parsed.presets) ? parsed.presets : [];
  if (!Array.isArray(presets) || presets.length === 0) {
    return { ok: false, error: 'Frame pack has no presets' };
  }
  const normalizedPack = makePack({
    id: String(pack.id || `imported-${Date.now().toString(36)}`),
    name: String(pack.name || 'Imported Pack'),
    description: String(pack.description || 'Imported frame pack.'),
    category: String(pack.category || 'imported'),
    priceType: String(pack.priceType || 'imported'),
    priceLabel: String(pack.priceLabel || 'Imported'),
    presetIds: presets.map((preset) => String(preset.id || '')).filter(Boolean),
    coverPresetId: String(pack.coverPresetId || presets[0]?.id || ''),
    tags: Array.isArray(pack.tags) ? pack.tags : [],
    locked: false,
    featured: false,
    author: pack.author || DEFAULT_IMPORTED_AUTHOR,
    license: pack.license || DEFAULT_FRAME_LICENSE,
  });
  if (framePackHasDataUrl(pack)) {
    return { ok: false, error: 'Frame pack metadata must not contain dataUrl' };
  }
  if (!normalizedPack.coverPresetId || !normalizedPack.presetIds.includes(normalizedPack.coverPresetId)) {
    return { ok: false, error: 'Frame pack cover must be one of the preset ids' };
  }
  return { ok: true, pack: normalizedPack, presets };
}

function exportCustomFramePackJson(frames = [], options = {}) {
  const now = new Date().toISOString();
  const presets = (Array.isArray(frames) ? frames : [])
    .filter((frame) => frame && frame.source !== 'builtin' && !frame.deletedAt)
    .map((frame) => sanitizeCustomFramePreset({ ...frame, source: frame.source === 'imported' ? 'imported' : 'custom' }))
    .filter(Boolean);
  const pack = makePack({
    id: options.id || `my-frames-${Date.now().toString(36)}`,
    name: options.name || 'My Frames Export',
    description: options.description || 'Exported custom frames pack.',
    category: options.category || 'my-frames',
    priceType: 'free',
    priceLabel: 'Free',
    presetIds: presets.map((preset) => preset.id),
    coverPresetId: options.coverPresetId || presets[0]?.id || '',
    tags: options.tags || ['my-frames'],
    locked: false,
    featured: false,
    author: options.author || DEFAULT_CUSTOM_AUTHOR,
    license: options.license || 'personal',
  });
  return JSON.stringify({
    schemaVersion: '1.0.0',
    kind: 'frame-pack',
    exportedAt: now,
    pack,
    presets,
  }, null, 2);
}

function importFramePackJson(raw) {
  const validation = validateFramePackJson(raw);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }
  const { pack, presets } = validation;
  const importedAt = new Date().toISOString();
  const existingIds = new Set(listFramePresets().map((preset) => preset.id));
  const remap = new Map();
  const nextPresets = presets.map((frame, index) => {
    const nextId = String(frame.id || '').trim() || `imported-${index}-${Date.now().toString(36)}`;
    const uniqueId = existingIds.has(nextId) || remap.has(nextId)
      ? `imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      : nextId;
    remap.set(frame.id, uniqueId);
    existingIds.add(uniqueId);
    const sanitized = sanitizeImportedFramePreset({ ...frame, id: uniqueId, source: 'imported' }, pack);
    if (!sanitized) return null;
    sanitized.id = uniqueId;
    sanitized.packId = pack.id;
    sanitized.packName = pack.name;
    sanitized.packDescription = pack.description;
    sanitized.packTags = pack.tags;
    sanitized.importedAt = importedAt;
    return sanitized;
  }).filter(Boolean);
  if (nextPresets.length === 0) {
    return { ok: false, error: 'No valid presets to import' };
  }
  return {
    ok: true,
    pack,
    presets: nextPresets,
  };
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
    author: normalizeAuthor(frame.author, DEFAULT_CUSTOM_AUTHOR),
    license: normalizeLicense(frame.license || 'personal'),
    packId: frame.packId || 'my-frames-pack',
    packName: frame.packName || 'My Frames',
    packDescription: frame.packDescription || 'Your saved frames.',
    packTags: Array.isArray(frame.packTags) ? frame.packTags : ['my-frames'],
    packPriceType: frame.packPriceType || 'free',
    packPriceLabel: frame.packPriceLabel || 'Free',
    creatorId: frame.creatorId || 'you',
    creator: frame.creator || getDefaultCreatorProfileSafe('custom'),
    likes: frame.likes || 0,
    uses: frame.uses || 0,
    trendingScore: frame.trendingScore || 0,
    layers: frame.layers || [],
    motionLayers: frame.motionLayers || [],
  });

  preset.stickers = stickers;
  preset.drawStrokes = drawStrokes;
  preset.background = background;
  preset.createdAt = frame.createdAt || preset.createdAt;
  preset.updatedAt = new Date().toISOString();
  preset.source = 'custom';
  preset.deletedAt = frame.deletedAt || null;
  preset.author = normalizeAuthor(frame.author, DEFAULT_CUSTOM_AUTHOR);
  preset.license = normalizeLicense(frame.license || 'personal');
  preset.packId = frame.packId || 'my-frames-pack';
  preset.packName = frame.packName || 'My Frames';
  preset.packDescription = frame.packDescription || 'Your saved frames.';
  preset.packTags = Array.isArray(frame.packTags) ? frame.packTags : ['my-frames'];
  preset.packPriceType = frame.packPriceType || 'free';
  preset.packPriceLabel = frame.packPriceLabel || 'Free';
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
    author: input.author || DEFAULT_CUSTOM_AUTHOR,
    license: input.license || 'personal',
    packId: input.packId || 'my-frames-pack',
    packName: input.packName || 'My Frames',
    packDescription: input.packDescription || 'Your saved frames.',
    packTags: input.packTags || ['my-frames'],
    packPriceType: input.packPriceType || 'free',
    packPriceLabel: input.packPriceLabel || 'Free',
  });
  frame.createdAt = input.createdAt || now;
  frame.updatedAt = now;
  frame.category = 'my-frames';
  frame.author = normalizeAuthor(input.author, DEFAULT_CUSTOM_AUTHOR);
  frame.license = normalizeLicense(input.license || 'personal');
  return frame;
}

function listFramePresets(customFrames = []) {
  return [
    ...getBuiltinFramePresets(),
    ...customFrames
      .map((preset) => normalizeFramePreset({ ...preset, source: preset.source === 'imported' ? 'imported' : 'custom' }))
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
    return (customFrames || []).map((preset) => normalizeFramePreset({ ...preset, source: preset.source === 'imported' ? 'imported' : 'custom' })).filter((preset) => preset && !preset.deletedAt);
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
  ctx.globalAlpha = Number.isFinite(background.opacity) ? clampNumber(background.opacity, 0, 1) : 1;
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
  const layerConfig = typeof layer === 'object' && layer ? layer : null;
  const layerKey = layerConfig?.type || layer || 'all';
  if (layerKey === 'background' || layerKey === 'photo-slots' || layerKey === 'watermark') {
    return;
  }
  const decorations = Array.isArray(preset.decorations) ? preset.decorations : [];
  const list = decorations
    .filter((deco) => {
      if (layerKey === 'all') return true;
      if (layerKey === 'back') return deco.layer === 'back' || (Number(deco.zIndex) || 0) < 0;
      if (layerKey === 'front') return deco.layer !== 'back' && (Number(deco.zIndex) || 0) >= 0;
      if (layerKey === 'text') return deco.type === 'text';
      if (layerKey === 'stickers') return deco.type !== 'text';
      if (layerKey === 'overlays') return deco.type !== 'text' && (deco.layer === 'front' || (Number(deco.zIndex) || 0) >= 0);
      if (layerKey === 'fx') return deco.type !== 'text';
      return true;
    })
    .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));
  ctx.save();
  if (layerConfig?.opacity != null) {
    ctx.globalAlpha = clampNumber(layerConfig.opacity, 0, 1);
  }
  if (layerConfig?.blendMode) {
    ctx.globalCompositeOperation = normalizeBlendMode(layerConfig.blendMode);
  }
  list.forEach((deco) => drawFrameDecoration(ctx, deco, width, height));
  ctx.restore();
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

const FRAME_PACKS = BUILTIN_FRAME_PACKS;

const IMMMFramePresets = {
  FRAME_PRESET_STORAGE_KEY,
  FRAME_PRESET_SELECTION_KEY,
  FRAME_PACK_UNLOCK_STORAGE_KEY,
  FRAME_FAVORITE_STORAGE_KEY,
  FRAME_PRESET_CATEGORIES,
  FRAME_PACKS,
  getCanvasSizeForLayout,
  getPhotoSlotsForLayout,
  getBuiltinFramePresets,
  getFramePacks,
  getFramePackById,
  getFramePresetsByPack,
  getCustomFramePresets,
  loadCustomFramePresets,
  saveCustomFramePresets,
  getUnlockedFramePackIds,
  saveUnlockedFramePackIds,
  isFramePackUnlocked,
  unlockFramePackForDev,
  loadFavoriteFramePresetIds,
  saveFavoriteFramePresetIds,
  toggleFavoriteFramePresetId,
  isFavoriteFramePresetId,
  listFramePresets,
  getFramePresetById,
  getFramePresetsByCategory,
  getDefaultFramePresetIdForLayout,
  getFramePresetCategories: getFramePresetCategoriesWithCounts,
  isFramePresetCustom,
  createCustomFramePresetFromAppState,
  sanitizeCustomFramePreset,
  sanitizeImportedFramePreset,
  createFrameDesignerDraft,
  normalizeDesignerDraft,
  validateDesignerDraft,
  draftToCustomFramePreset,
  duplicateFramePresetAsDraft,
  clampRectToCanvas,
  sanitizeFrameSticker,
  sanitizeDrawStroke,
  normalizeFramePreset,
  normalizeAuthor,
  normalizeLicense,
  drawFramePresetBackground,
  drawFramePresetLayer,
  drawFramePresetOverlay,
  drawFramePresetWatermark,
  drawFrameDecoration,
  createBackground,
  clonePlain,
  normalizePresetLayout,
  normalizeMotionLayersSafe,
  FRAME_BLEND_MODE_WHITELIST,
  FRAME_LAYER_TYPES,
  FRAME_EXPORT_PRESETS,
  getExportPresets,
  getExportPresetById,
  getDefaultExportPresetId,
  generateFrameIdea,
  getFrameLikeIds,
  saveFrameLikeIds,
  toggleFrameLikeId,
  incrementFrameUseCount,
  getFrameUseCount,
  getFrameTrendingScore,
  loadFavoriteFramePackIds,
  saveFavoriteFramePackIds,
  toggleFavoriteFramePackId,
  loadDesignerDraftRecovery,
  saveDesignerDraftRecovery,
  clearDesignerDraftRecovery,
  getFrameLayerOrder,
  exportCustomFramePackJson,
  validateFramePackJson,
  importFramePackJson,
};

if (typeof window !== 'undefined') {
  window.IMMMFramePresets = IMMMFramePresets;
  Object.assign(window, IMMMFramePresets);
}
