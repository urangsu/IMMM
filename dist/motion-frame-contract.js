// motion-frame-contract.jsx — optional motion layers for IMMM frame presets

var MOTION_FRAME_LAYER_TYPES = ['animated-overlay', 'frame-intro', 'sparkle-effect', 'floating-stickers', 'looping-gradient', 'subtle-glow'];
var MOTION_FRAME_BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'];
function normalizeMotionLayer(layer, index = 0) {
  if (!layer || typeof layer !== 'object') return null;
  var type = String(layer.type || 'animated-overlay');
  return {
    id: String(layer.id || `motion_${index}_${Math.random().toString(36).slice(2, 8)}`),
    type: MOTION_FRAME_LAYER_TYPES.includes(type) ? type : 'animated-overlay',
    animation: String(layer.animation || 'pulse'),
    duration: Math.max(120, Math.floor(Number(layer.duration) || 1200)),
    loop: layer.loop !== false,
    easing: String(layer.easing || 'ease-in-out'),
    opacity: Number.isFinite(layer.opacity) ? Math.max(0, Math.min(1, Number(layer.opacity))) : 1,
    blendMode: MOTION_FRAME_BLEND_MODES.includes(layer.blendMode) ? layer.blendMode : 'normal',
    zIndex: Number.isFinite(layer.zIndex) ? Number(layer.zIndex) : index,
    visible: layer.visible !== false
  };
}
function normalizeMotionLayers(layers) {
  return Array.isArray(layers) ? layers.map((layer, index) => normalizeMotionLayer(layer, index)).filter(Boolean) : [];
}
function createMotionFrameLayersFromPreset(preset = null) {
  var name = String(preset?.name || 'Frame');
  var mood = String(preset?.category || 'basic');
  var palette = preset?.background?.type === 'gradient' ? Array.isArray(preset.background?.value?.stops) ? preset.background.value.stops : ['#FFF', '#F5F5F5'] : [preset?.frameColor || '#FFFFFF', '#F8F8F8'];
  return normalizeMotionLayers([{
    type: 'frame-intro',
    animation: 'fade-up',
    duration: 900,
    loop: false,
    easing: 'ease-out',
    zIndex: 0
  }, {
    type: 'animated-overlay',
    animation: mood === 'travel' ? 'floating-stickers' : 'sparkle',
    duration: 1600,
    loop: true,
    easing: 'ease-in-out',
    opacity: 0.7,
    zIndex: 10
  }, {
    type: 'looping-gradient',
    animation: `gradient-${palette.join('-')}`,
    duration: 2400,
    loop: true,
    easing: 'linear',
    opacity: 0.22,
    zIndex: -1
  }, {
    type: 'subtle-glow',
    animation: `glow-${name.toLowerCase().replace(/\s+/g, '-')}`,
    duration: 1800,
    loop: true,
    easing: 'ease-in-out',
    opacity: 0.15,
    zIndex: 99
  }]);
}
function createMotionFrameContract(input = {}) {
  return {
    id: String(input.id || `motion-${Date.now().toString(36)}`),
    enabled: input.enabled !== false,
    motionLayers: normalizeMotionLayers(input.motionLayers),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
function validateMotionFrameContract(contract) {
  if (!contract || typeof contract !== 'object') return {
    ok: false,
    error: 'Motion contract missing'
  };
  if (contract.enabled === false) return {
    ok: true,
    contract
  };
  if (!Array.isArray(contract.motionLayers)) return {
    ok: false,
    error: 'motionLayers must be an array'
  };
  if (contract.motionLayers.some(layer => !MOTION_FRAME_LAYER_TYPES.includes(layer.type))) {
    return {
      ok: false,
      error: 'Motion layer type invalid'
    };
  }
  return {
    ok: true,
    contract: {
      ...contract,
      motionLayers: normalizeMotionLayers(contract.motionLayers)
    }
  };
}
var IMMMMotionFrameContract = {
  MOTION_FRAME_LAYER_TYPES,
  MOTION_FRAME_BLEND_MODES,
  normalizeMotionLayer,
  normalizeMotionLayers,
  createMotionFrameLayersFromPreset,
  createMotionFrameContract,
  validateMotionFrameContract
};
if (typeof window !== 'undefined') {
  window.IMMMMotionFrameContract = IMMMMotionFrameContract;
  Object.assign(window, IMMMMotionFrameContract);
}