// frame-system.jsx — frame templates, unified canvas renderer, local gallery, QR/share adapters

function revokeBlobUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
}
function isExportPerfDebugEnabled() {
  try {
    return Boolean(window?.IMMM_DEBUG_PERF || window?.IMMM_DEBUG_BUILD);
  } catch {
    return false;
  }
}
function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}
function logExportPerf(label, data) {
  if (isExportPerfDebugEnabled()) console.info?.('[IMMM export perf]', label, data);
}
var requestIdleCallbackSafe = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback.bind(window) : cb => setTimeout(() => cb({
  didTimeout: true,
  timeRemaining: () => 0
}), 1);
var cancelIdleCallbackSafe = typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback.bind(window) : id => clearTimeout(id);
var FRAME_TEMPLATE_ALIASES = {
  strip: '1x4',
  grid: '2x2',
  trip: '1x3',
  polaroid: '1x1',
  layered: '2x2'
};
function parseHexColor(hex) {
  var s = String(hex || '').trim();
  if (!s.startsWith('#')) return null;
  var v = s.slice(1);
  if (v.length === 3) {
    return {
      r: parseInt(v[0] + v[0], 16),
      g: parseInt(v[1] + v[1], 16),
      b: parseInt(v[2] + v[2], 16)
    };
  }
  if (v.length === 6) {
    return {
      r: parseInt(v.slice(0, 2), 16),
      g: parseInt(v.slice(2, 4), 16),
      b: parseInt(v.slice(4, 6), 16)
    };
  }
  return null;
}
function isDarkFrameColor(color) {
  var rgb = parseHexColor(color);
  if (!rgb) {
    return /^#(0{3,6}|1{3,6}|111111|000000?)$/i.test(String(color || '').trim());
  }
  var luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance < 0.25;
}
if (typeof window !== 'undefined') {
  window.isDarkFrameColor = isDarkFrameColor;
}

/**
 * Common theme resolver for frames.
 * Ensures consistent contrast for Logo, Dot, and Date across all renders.
 */
function getFrameTheme(template, options = {}) {
  var frameBg = options.frameColor || template?.theme?.frameFill || '#ffffff';
  var dark = isDarkFrameColor(frameBg);
  var markColor = dark ? '#FFFFFF' : '#111111';
  var dotColor = markColor;
  var dateColor = dark ? 'rgba(255,255,255,0.82)' : '#6B6B6B';
  var photoBg = dark ? 'rgba(255,255,255,0.03)' : '#FAF9F6';
  return {
    frameBg,
    photoBg,
    markColor,
    dotColor,
    dateColor,
    textColor: dateColor,
    isDark: dark
  };
}
if (typeof window !== 'undefined') {
  window.getFrameTheme = getFrameTheme;
}
function getFramePresetApiSafe() {
  if (typeof window === 'undefined') return null;
  return window.IMMMFramePresets || null;
}
var FRAME_TEMPLATES = {
  '1x4': {
    id: 'core-1x4',
    type: '1x4',
    name: 'Classic 1x4',
    ko: '클래식 1x4',
    canvasSize: {
      width: 560,
      height: 1808
    },
    theme: {
      frameFill: '#fff'
    },
    photoRects: [{
      x: 0.093,
      y: 0.092,
      w: 0.814,
      h: 0.189
    }, {
      x: 0.093,
      y: 0.297,
      w: 0.814,
      h: 0.189
    }, {
      x: 0.093,
      y: 0.501,
      w: 0.814,
      h: 0.189
    }, {
      x: 0.093,
      y: 0.706,
      w: 0.814,
      h: 0.189
    }],
    logo: {
      x: 0.071,
      y: 0.038,
      fontSize: 0.06
    },
    dot: {
      x: 0.92,
      y: 0.038,
      r: 0.024
    },
    captionRect: {
      x: 0,
      y: 0.90,
      w: 1,
      h: 0.10
    },
    date: {
      x: 0.5,
      y: 0.5,
      fontSize: 0.04,
      align: 'center'
    },
    photoSlots: [] // Legacy compat
  },
  '2x2': {
    id: 'core-2x2',
    type: '2x2',
    name: 'Gallery 2x2',
    ko: '갤러리 2x2',
    canvasSize: {
      width: 880,
      height: 1096
    },
    theme: {
      frameFill: '#fff'
    },
    photoRects: [{
      x: 0.08,
      y: 0.155,
      w: 0.398,
      h: 0.319
    }, {
      x: 0.523,
      y: 0.155,
      w: 0.398,
      h: 0.319
    }, {
      x: 0.08,
      y: 0.511,
      w: 0.398,
      h: 0.319
    }, {
      x: 0.523,
      y: 0.511,
      w: 0.398,
      h: 0.319
    }],
    logo: {
      x: 0.068,
      y: 0.064,
      fontSize: 0.045
    },
    dot: {
      x: 0.932,
      y: 0.064,
      r: 0.016
    },
    captionRect: {
      x: 0,
      y: 0.86,
      w: 1,
      h: 0.14
    },
    date: {
      x: 0.5,
      y: 0.5,
      fontSize: 0.035,
      align: 'center'
    },
    photoSlots: []
  },
  '1x3': {
    id: 'core-1x3',
    type: '1x3',
    name: 'Trip 1x3',
    ko: '트립 1x3',
    canvasSize: {
      width: 560,
      height: 1200
    },
    theme: {
      frameFill: '#fff'
    },
    photoRects: [{
      x: 0.093,
      y: 0.092,
      w: 0.814,
      h: 0.26
    }, {
      x: 0.093,
      y: 0.38,
      w: 0.814,
      h: 0.26
    }, {
      x: 0.093,
      y: 0.668,
      w: 0.814,
      h: 0.26
    }],
    logo: {
      x: 0.071,
      y: 0.03,
      fontSize: 0.05
    },
    dot: {
      x: 0.92,
      y: 0.03,
      r: 0.024
    },
    captionRect: {
      x: 0,
      y: 0.92,
      w: 1,
      h: 0.08
    },
    date: {
      x: 0.5,
      y: 0.5,
      fontSize: 0.035,
      align: 'center'
    },
    photoSlots: []
  },
  '1x1': {
    id: 'core-1x1',
    type: '1x1',
    name: 'Polaroid 1x1',
    ko: '폴라로이드 1x1',
    canvasSize: {
      width: 880,
      height: 1070
    },
    theme: {
      frameFill: '#fff'
    },
    photoRects: [{
      x: 0.051,
      y: 0.10,
      w: 0.898,
      h: 0.68
    } // Structure consistent for black/white
    ],
    logo: {
      x: 0.051,
      y: 0.045,
      fontSize: 0.042,
      letterSpacing: 2
    },
    dot: {
      x: 0.92,
      y: 0.045,
      r: 0.018
    },
    captionRect: {
      x: 0.051,
      y: 0.78,
      w: 0.898,
      h: 0.22
    },
    date: {
      x: 0.5,
      y: 0.62,
      fontSize: 0.048,
      align: 'center'
    },
    photoSlots: []
  }
};

// Map legacy photoSlots to new photoRects
Object.keys(FRAME_TEMPLATES).forEach(k => {
  var t = FRAME_TEMPLATES[k];
  if (!t.photoSlots || t.photoSlots.length === 0) {
    t.photoSlots = t.photoRects.map(r => ({
      x: r.x * t.canvasSize.width,
      y: r.y * t.canvasSize.height,
      width: r.w * t.canvasSize.width,
      height: r.h * t.canvasSize.height
    }));
  }
});
function getFrameTemplate(layoutOrType) {
  var type = FRAME_TEMPLATE_ALIASES[layoutOrType] || layoutOrType || '1x4';
  return FRAME_TEMPLATES[type] || FRAME_TEMPLATES['1x4'];
}
function getShotCountForFrame(layoutOrType) {
  return getFrameTemplateSafe(layoutOrType).photoSlots.length;
}
function loadImageForCanvas(src) {
  return new Promise(resolve => {
    if (!src) {
      resolve(null);
      return;
    }
    var img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}
function drawCoverToCtx(ctx, img, x, y, w, h) {
  if (!img) return;
  var ar = img.width / img.height;
  var dar = w / h;
  var sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ar > dar) {
    sh = img.height;
    sw = sh * dar;
    sx = (img.width - sw) / 2;
  } else {
    sw = img.width;
    sh = sw / dar;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
function drawFallbackSticker(ctx, item, scalePx = 1) {
  var label = item?.label || item?.text || item?.id || '♡';
  ctx.save();
  ctx.fillStyle = item?.color || item?.tc || item?.fill || '#111';
  ctx.font = `700 ${28 * scalePx}px Pretendard, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}
function collectUploadStickerSources(stickers = []) {
  var sources = new Set();
  for (var s of stickers || []) {
    if (s?.kind === 'upload' && s?.payload?.dataUrl) {
      sources.add(s.payload.dataUrl);
    }
  }
  return Array.from(sources);
}
async function preloadStickerImages(stickers = []) {
  var sources = collectUploadStickerSources(stickers);
  var entries = await Promise.all(sources.map(async src => {
    try {
      return [src, await loadImageForCanvas(src)];
    } catch (err) {
      if (isExportPerfDebugEnabled()) {
        console.warn?.('[IMMM export] sticker preload failed:', src, err);
      }
      return [src, null];
    }
  }));
  return new Map(entries);
}
async function drawStickerToCtx(ctx, sticker, baseW, baseH, scalePx = 1, assets = {}) {
  if (!sticker) return;

  // Validate sticker position (should be 0-100)
  var x = Math.max(0, Math.min(100, Number(sticker.x) || 50));
  var y = Math.max(0, Math.min(100, Number(sticker.y) || 50));
  if ((x !== sticker.x || y !== sticker.y) && sticker.x != null && sticker.y != null) {
    console.warn(`[IMMM] Sticker position out of bounds: x=${sticker.x}, y=${sticker.y}`);
  }
  ctx.save();
  var cx = x / 100 * baseW;
  var cy = y / 100 * baseH;
  ctx.translate(cx, cy);
  ctx.rotate((sticker.rotation || 0) * Math.PI / 180);
  var actualSizeNorm = sticker.sizeNorm ?? sticker.payload?.sizeNorm;
  var raw = {
    w: 64,
    h: 64
  };
  if (typeof getStickerVisualBounds === 'function') {
    raw = getStickerVisualBounds(sticker);
  } else if (sticker.kind === 'preset') {
    var item = typeof getStickerByLibId === 'function' ? getStickerByLibId(sticker.payload?.libId) : null;
    raw = typeof getCatalogStickerBaseSize === 'function' ? getCatalogStickerBaseSize(item) : raw;
  } else if (sticker.kind === 'upload') {
    raw = {
      w: 120,
      h: 120
    };
  } else if (sticker.kind === 'text') {
    var size = sticker.payload?.size || 32;
    var text = sticker.payload?.text || '';
    raw = {
      w: Math.max(44, Math.min(220, text.length * size * 0.58)),
      h: Math.max(34, size * 1.25)
    };
  } else if (sticker.kind === 'setlog') {
    raw = {
      w: 140,
      h: 64
    };
  }
  var targetW = actualSizeNorm ? baseW * actualSizeNorm : raw.w * scalePx;
  var drawScale = targetW / (raw.w || 1);
  var effectiveScale = drawScale * (sticker.scale || 1);
  ctx.scale(effectiveScale, effectiveScale);
  if (sticker.kind === 'preset') {
    var _item = typeof getStickerByLibId === 'function' ? getStickerByLibId(sticker.payload.libId) : null;
    try {
      var globalDraw = typeof drawCatalogSticker === 'function' ? drawCatalogSticker : typeof window !== 'undefined' ? window.drawCatalogSticker : null;
      if (_item && typeof globalDraw === 'function') {
        globalDraw(ctx, _item, 1);
      } else if (_item) {
        drawFallbackSticker(ctx, _item, 1);
      }
    } catch (err) {
      console.warn('[IMMM] preset sticker render failed, using fallback', err);
      if (_item) drawFallbackSticker(ctx, _item, 1);
    }
  } else if (sticker.kind === 'upload') {
    var src = sticker.payload.dataUrl;
    var hasPreload = assets?.uploadImages?.has?.(src);
    var preloaded = hasPreload ? assets.uploadImages.get(src) : undefined;
    var img = hasPreload ? preloaded : await loadImageForCanvas(src);
    if (img) {
      var w = 120;
      var h = w / (img.width / img.height || 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
  } else if (sticker.kind === 'text') {
    ctx.fillStyle = sticker.payload.color || '#111';
    // sizeNorm is applied via ctx.scale(effectiveScale) above.
    var fontPx = sticker.payload.size || 32;
    ctx.font = `600 ${fontPx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.payload.text || '', 0, 0);
  } else if (sticker.kind === 'setlog') {
    var {
      time,
      caption,
      theme
    } = sticker.payload;
    var fg = theme === 'white' ? '#fff' : '#000';
    ctx.fillStyle = fg;
    ctx.shadowColor = theme === 'white' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 4;
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(time || '', 0, 0);
    if (caption) {
      ctx.globalAlpha = 0.8;
      ctx.font = '600 12px Pretendard, sans-serif';
      ctx.fillText(caption, 0, 32);
    }
  }
  ctx.restore();
}

/**
 * Draws text with explicit per-character spacing (cross-browser safe).
 * Replaces ctx.letterSpacing which is not supported on all platforms.
 */
function drawLetterSpacedText(ctx, text, x, y, spacingPx) {
  var curX = x;
  for (var ch of text) {
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + spacingPx;
  }
}

/**
 * Deterministic pseudo-random from a seed integer.
 * Returns a float in [0, 1). Same seed → same sequence.
 */
function seededRand(seed) {
  // xorshift32
  var s = (seed ^ 0xdeadbeef) >>> 0;
  s ^= s << 13;
  s ^= s >> 17;
  s ^= s << 5;
  return (s >>> 0) / 0xffffffff;
}

/**
 * Distance-based sparkle stamp.
 * Stamps at fixed world-space intervals regardless of pointer speed/device.
 * Uses a deterministic seed so preview and export produce identical results.
 */
function renderSparkleStroke(ctx, stroke, w, h, lineWidth) {
  if (!Array.isArray(stroke.points) || stroke.points.length < 1) return;
  var spacing = lineWidth * 2.2; // world-space distance between stamps
  var sz = lineWidth * 1.5;
  var baseSeed = stroke.seed || 0;
  var accumulated = 0;
  var stampIdx = 0;
  ctx.fillStyle = stroke.color || '#fff';
  ctx.globalAlpha = 0.85;
  for (var i = 1; i < stroke.points.length; i++) {
    var [ax, ay] = stroke.points[i - 1];
    var [bx, by] = stroke.points[i];
    var segX = (bx - ax) / 100 * w;
    var segY = (by - ay) / 100 * h;
    var segLen = Math.sqrt(segX * segX + segY * segY);
    if (segLen === 0) continue;
    var ux = segX / segLen;
    var uy = segY / segLen;
    var d = accumulated === 0 ? 0 : spacing - accumulated;
    while (d <= segLen) {
      var tx = ax / 100 * w + ux * d;
      var ty = ay / 100 * h + uy * d;
      var rotSeed = seededRand(baseSeed + stampIdx * 7);
      var rot = rotSeed * Math.PI * 2;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.25, -sz * 0.25);
      ctx.lineTo(sz, 0);
      ctx.lineTo(sz * 0.25, sz * 0.25);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.25, sz * 0.25);
      ctx.lineTo(-sz, 0);
      ctx.lineTo(-sz * 0.25, -sz * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      stampIdx++;
      d += spacing;
    }
    accumulated = segLen - (d - spacing);
    if (accumulated < 0) accumulated = 0;
  }
}

/**
 * Unified Frame Overlay Renderer — single source of truth.
 * Used for Picker preview, Live Capture overlay, and Export.
 * options.dateText: string to show | false to hide | undefined = auto (today)
 */
function renderFrameOverlay(ctx, template, width, height, options = {}) {
  var theme = getFrameTheme(template, {
    frameColor: options.frameColor
  });
  var textColor = options.textColor || theme.dateColor;
  var logoColor = options.logoColor || theme.markColor;
  var dotColor = options.dotColor || theme.dotColor;

  // 1. Logo
  if (options.logo !== false && template.logo) {
    ctx.save();
    ctx.fillStyle = logoColor;
    var fs = template.logo.fontSize * width;
    ctx.font = `800 ${fs}px "Plus Jakarta Sans", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    var lx = template.logo.x * width;
    var ly = template.logo.y * height;
    var spacing = template.logo.letterSpacing || 0;
    if (spacing > 0) {
      drawLetterSpacedText(ctx, 'IMMM', lx, ly, spacing * (width / (template.canvasSize?.width || width)));
    } else {
      ctx.fillText('IMMM', lx, ly);
    }
    ctx.restore();
  }

  // 2. Dot — always render when template.dot exists
  if (template.dot) {
    ctx.save();
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(template.dot.x * width, template.dot.y * height, template.dot.r * width, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Date
  // options.dateText === false  → hide
  // options.dateText === string → use that string
  // options.dateText === undefined/null → auto (today)
  if (options.dateText !== false && template.date) {
    ctx.save();
    ctx.fillStyle = textColor;
    var _fs = template.date.fontSize * width;
    ctx.font = `700 ${_fs}px "Plus Jakarta Sans", Pretendard, sans-serif`;
    ctx.globalAlpha = 0.82;
    ctx.textAlign = template.date.align || 'center';
    ctx.textBaseline = 'middle';
    var dateStr = typeof options.dateText === 'string' && options.dateText ? options.dateText : new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    var dx, dy;
    if (template.captionRect) {
      dx = (template.captionRect.x + template.captionRect.w * template.date.x) * width;
      dy = (template.captionRect.y + template.captionRect.h * template.date.y) * height;
    } else {
      dx = template.date.x * width;
      dy = template.date.y * height;
    }
    ctx.fillText(dateStr, dx, dy);
    ctx.restore();
  }
}

/**
 * Renders the entire composition to a canvas context.
 * Unified path for both Preview and Export.
 */
/**
 * Returns true if the sticker should be rendered in the given layout.
 * Free stickers (no frameSlot) are always valid.
 * Slot stickers are only valid if their slot index falls within the layout's slot count.
 */
function isStickerValidForLayout(sticker, layout) {
  if (sticker?.frameSlot == null) return true;
  var slotCount = typeof getLayoutSlotCount === 'function' ? getLayoutSlotCount(layout) : 4;
  return Number(sticker.frameSlot) >= 0 && Number(sticker.frameSlot) < slotCount;
}
async function renderComposition(ctx, data, options = {}) {
  var tStart = nowMs();
  var template = getFrameTemplateSafe(data.layout || data.templateType);
  if (!template) {
    throw new Error('[IMMM frame template unavailable]');
  }
  var scale = options.scale || 1;
  var w = template.canvasSize.width * scale;
  var h = template.canvasSize.height * scale;
  var framePreset = data.framePreset || null;
  var theme = getFrameTheme(template, data);
  var presetApi = getFramePresetApiSafe();
  var drawPresetBackground = presetApi?.drawFramePresetBackground || window.drawFramePresetBackground || null;
  var drawPresetLayer = presetApi?.drawFramePresetLayer || window.drawFramePresetLayer || null;
  var drawPresetWatermark = presetApi?.drawFramePresetWatermark || window.drawFramePresetWatermark || null;
  var orderedLayers = framePreset?.layers?.length ? presetApi?.getFrameLayerOrder?.(framePreset) || framePreset.layers : [];

  // 1. Background
  if (framePreset && typeof drawPresetBackground === 'function') {
    drawPresetBackground(ctx, framePreset, w, h);
  } else {
    ctx.fillStyle = theme.frameBg;
    ctx.fillRect(0, 0, w, h);
  }

  // 1b. Preload Stickers (parallel)
  var tPreloadStart = nowMs();
  var stickerAssets = {
    uploadImages: await preloadStickerImages(data.stickers || [])
  };
  logExportPerf('sticker-preload', {
    ms: nowMs() - tPreloadStart,
    count: stickerAssets.uploadImages.size
  });

  // 2. Photo Slots
  var selected = data.selected || [];
  var shots = data.shots || [];
  var tPhotoStart = nowMs();
  var photoSlots = framePreset?.photoSlots?.length ? framePreset.photoSlots : template.photoSlots;
  var images = await Promise.all(photoSlots.map((_, i) => {
    var shot = shots[selected[i]];
    return loadImageForCanvas(shot?.dataUrl);
  }));
  logExportPerf('photo-slots', {
    ms: nowMs() - tPhotoStart,
    count: images.length
  });
  var tStickerDrawStart = nowMs();
  if (framePreset && typeof drawPresetLayer === 'function' && orderedLayers.length) {
    orderedLayers.filter(layer => layer && layer.visible !== false && Number(layer.zIndex) < 0).forEach(layer => {
      if (layer.type !== 'background' && layer.type !== 'photo-slots') {
        drawPresetLayer(ctx, framePreset, w, h, layer);
      }
    });
  } else if (framePreset && typeof drawPresetLayer === 'function') {
    drawPresetLayer(ctx, framePreset, w, h, 'back');
  }
  var _loop = async function (i) {
    var slot = photoSlots[i];
    var sx = slot.x * scale;
    var sy = slot.y * scale;
    var sw = slot.width * scale;
    var sh = slot.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    ctx.fillStyle = theme.photoBg;
    ctx.fillRect(sx, sy, sw, sh);
    if (images[i]) {
      drawCoverToCtx(ctx, images[i], sx, sy, sw, sh);
    }

    // Slotted stickers — only valid slots for this layout
    var slotted = (data.stickers || []).filter(s => Number(s.frameSlot) === i && isStickerValidForLayout(s, data.layout || data.templateType));
    for (var _s of slotted) {
      var local = {
        ..._s,
        x: _s.slotX ?? 50,
        y: _s.slotY ?? 50
      };
      ctx.save();
      ctx.translate(sx, sy);
      await drawStickerToCtx(ctx, local, sw, sh, scale, stickerAssets);
      ctx.restore();
    }
    ctx.restore();
  };
  for (var i = 0; i < photoSlots.length; i++) {
    await _loop(i);
  }

  // 3. Global Stickers (not in slots) — validate layout-slot compatibility
  var freeStickers = (data.stickers || []).filter(st => st.frameSlot == null && isStickerValidForLayout(st, data.layout || data.templateType));
  for (var s of freeStickers) {
    await drawStickerToCtx(ctx, s, w, h, scale, stickerAssets);
  }
  logExportPerf('sticker-draw', {
    ms: nowMs() - tStickerDrawStart
  });
  logExportPerf('render-total', {
    ms: nowMs() - tStart
  });

  // 4. Drawing Strokes
  var drawStrokes = data.drawStrokes || [];
  drawStrokes.filter(Boolean).forEach(stroke => {
    if (!Array.isArray(stroke.points) || stroke.points.length < 1) return;

    // Prefer normalized width (0~1 of frame width), fall back to absolute px * scale
    var lineWidth = stroke.widthNorm ? stroke.widthNorm * w : (stroke.width || 3) * scale;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (stroke.brush === 'sparkle') {
      renderSparkleStroke(ctx, stroke, w, h, lineWidth);
    } else {
      if (stroke.points.length < 2) {
        ctx.restore();
        return;
      }
      ctx.strokeStyle = stroke.color || '#111';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      stroke.points.forEach(([px, py], idx) => {
        // Validate point coordinates are valid numbers
        if (typeof px !== 'number' || typeof py !== 'number') {
          console.warn(`[IMMM] Invalid stroke point at index ${idx}:`, [px, py]);
          return;
        }
        var tx = px / 100 * w;
        var ty = py / 100 * h;
        if (idx === 0) ctx.moveTo(tx, ty);else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
    }
    ctx.restore();
  });
  if (framePreset && typeof drawPresetLayer === 'function' && orderedLayers.length) {
    orderedLayers.filter(layer => layer && layer.visible !== false && Number(layer.zIndex) >= 0).forEach(layer => {
      if (layer.type !== 'background' && layer.type !== 'photo-slots') {
        drawPresetLayer(ctx, framePreset, w, h, layer);
      }
    });
  } else if (framePreset && typeof drawPresetLayer === 'function') {
    drawPresetLayer(ctx, framePreset, w, h, 'front');
  }

  // 5. Unified Overlay (Logo, Dot, Date)
  renderFrameOverlay(ctx, template, w, h, {
    frameColor: data.frameColor,
    logo: data.logo,
    dateText: data.dateText,
    accent: data.accent
  });
  if (framePreset && typeof drawPresetWatermark === 'function') {
    drawPresetWatermark(ctx, framePreset, w, h);
  }
}
async function renderFrameToCanvas(input) {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  var template = getFrameTemplateSafe(input.layout || input.templateType);
  if (!template) {
    throw new Error('[IMMM] frame template unavailable');
  }
  var scale = input.scale || 1;
  var w = template.canvasSize.width * scale;
  var h = template.canvasSize.height * scale;
  var cvs = document.createElement('canvas');
  cvs.width = Math.round(w);
  cvs.height = Math.round(h);
  var ctx = cvs.getContext('2d');
  await window.renderComposition(ctx, input, {
    scale
  });
  return cvs;
}
var FrameRenderEngine = {
  renderToCanvas: renderFrameToCanvas,
  async renderToBlob(input, type = 'image/png', quality = 0.96) {
    var canvas = await renderFrameToCanvas(input);
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  },
  async renderToDataUrl(input, type = 'image/png', quality = 0.96) {
    var canvas = await renderFrameToCanvas(input);
    return canvas.toDataURL(type, quality);
  },
  drawStickerToCanvas: drawStickerToCtx,
  drawCover: drawCoverToCtx
};
var LocalGalleryStore = {
  dbName: 'immm.local.gallery',
  version: 1,
  open() {
    return new Promise((resolve, reject) => {
      var req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = () => {
        var db = req.result;
        if (!db.objectStoreNames.contains('photos')) {
          var store = db.createObjectStore('photos', {
            keyPath: 'id'
          });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('source', 'source');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async putPhoto(photo) {
    var db = await this.open();
    return new Promise((resolve, reject) => {
      var tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(photo);
      tx.oncomplete = () => resolve(photo);
      tx.onerror = () => reject(tx.error);
    });
  },
  async listPhotos() {
    var db = await this.open();
    return new Promise((resolve, reject) => {
      var tx = db.transaction('photos', 'readonly');
      var req = tx.objectStore('photos').getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt));
      req.onerror = () => reject(req.error);
    });
  },
  async deletePhoto(id) {
    var db = await this.open();
    return new Promise((resolve, reject) => {
      var tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
var ShareStore = {
  ttlDays: 7,
  localUrls: new Map(),
  // id -> { url, createdAt }

  config() {
    return window.IMMM_SUPABASE || {
      url: window.IMMM_SUPABASE_URL,
      anonKey: window.IMMM_SUPABASE_ANON_KEY,
      bucket: window.IMMM_SUPABASE_BUCKET || 'shared-results'
    };
  },
  isConfigured() {
    var c = this.config();
    return Boolean(c?.url && c?.anonKey && c?.bucket);
  },
  clearExpired(maxAgeMs = 600000) {
    // Default 10 mins for local previews
    var now = Date.now();
    for (var [id, info] of this.localUrls.entries()) {
      if (now - info.createdAt > maxAgeMs) {
        this.revokeShare(id);
      }
    }
  },
  revokeShare(id) {
    var info = this.localUrls.get(id);
    if (info) {
      revokeBlobUrl(info.url);
      this.localUrls.delete(id);
    }
  },
  clearAllLocalUrls() {
    for (var id of this.localUrls.keys()) {
      this.revokeShare(id);
    }
  },
  async createShare(blob, metadata = {}) {
    this.clearExpired(); // Auto-cleanup on every share attempt
    var id = `sh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    var expiresAt = Date.now() + this.ttlDays * 86400000;
    if (!this.isConfigured()) {
      var localUrl = URL.createObjectURL(blob);
      this.localUrls.set(id, {
        url: localUrl,
        createdAt: Date.now()
      });
      return {
        id,
        url: localUrl,
        qrUrl: localUrl,
        expiresAt,
        mode: 'local-preview',
        metadata
      };
    }
    var c = this.config();
    var path = `${id}.png`;
    var upload = await fetch(`${c.url}/storage/v1/object/${c.bucket}/${path}`, {
      method: 'POST',
      headers: {
        apikey: c.anonKey,
        Authorization: `Bearer ${c.anonKey}`,
        'Content-Type': 'image/png',
        'x-upsert': 'false'
      },
      body: blob
    });
    if (!upload.ok) throw new Error(`Supabase upload failed: ${upload.status}`);
    var publicUrl = `${c.url}/storage/v1/object/public/${c.bucket}/${path}`;
    var shareUrl = `${location.origin}${location.pathname}#/s/${id}?u=${encodeURIComponent(publicUrl)}&e=${expiresAt}`;
    localStorage.setItem(`immm.share.${id}`, JSON.stringify({
      id,
      publicUrl,
      expiresAt,
      metadata
    }));
    return {
      id,
      url: publicUrl,
      qrUrl: shareUrl,
      expiresAt,
      mode: 'supabase',
      metadata
    };
  }
};
function generateQrDataUrl(text) {
  if (window.QRCode?.toDataURL) {
    return window.QRCode.toDataURL(text, {
      margin: 1,
      width: 512
    });
  }
  return Promise.resolve(null);
}

/**
 * A consistent, canvas-based preview component.
 */
function FrameThumb({
  layout,
  shots,
  selected,
  filter,
  frameColor,
  stickers = [],
  drawStrokes = [],
  logo,
  dateText,
  accent,
  scale = 1,
  orientation,
  framePreset = null
}) {
  var canvasRef = React.useRef(null);
  React.useEffect(() => {
    var cancelled = false;
    var idleId = null;
    var draw = async () => {
      if (cancelled) return;
      if (!canvasRef.current) return;
      var cvs = canvasRef.current;
      var ctx = cvs.getContext('2d');
      var getTpl = window.getFrameTemplateSafe || (typeof getFrameTemplate === 'function' ? getFrameTemplate : null);
      var template = getTpl ? getTpl(layout) : null;
      if (!template) {
        console.warn('[IMMM] skip draw: frame template unavailable', layout);
        return;
      }
      var baseW = template.canvasSize.width;
      var baseH = template.canvasSize.height;
      cvs.width = baseW;
      cvs.height = baseH;
      var data = {
        layout,
        shots,
        selected,
        filter,
        frameColor,
        stickers,
        drawStrokes,
        logo,
        dateText,
        accent,
        orientation
      };
      if (framePreset) {
        data.framePreset = framePreset;
      }
      var renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (renderComp) await renderComp(ctx, data, {
        scale: 1
      });
    };
    idleId = requestIdleCallbackSafe(() => {
      draw();
    });
    return () => {
      cancelled = true;
      if (idleId != null) cancelIdleCallbackSafe(idleId);
    };
  }, [layout, shots, selected, filter, frameColor, stickers, drawStrokes, logo, dateText, accent, orientation, framePreset]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      width: 200 * scale * (layout === 'strip' || layout === 'trip' ? 1 : 1.2),
      height: 'auto',
      display: 'block',
      maxWidth: '100%'
    }
  });
}
function getFrameTemplateSafe(layoutOrType) {
  if (typeof getFrameTemplate === 'function') {
    return getFrameTemplate(layoutOrType);
  }
  if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
    return window.getFrameTemplate(layoutOrType);
  }
  console.error('[IMMM] getFrameTemplate unavailable; using emergency 1x4 fallback');
  return FRAME_TEMPLATES?.['1x4'];
}
function getShotCountForFrameSafe(layoutOrType) {
  var t = getFrameTemplateSafe(layoutOrType);
  return t?.photoSlots?.length || 4;
}
function getFrameGeometry(layoutOrType) {
  var t = getFrameTemplateSafe(layoutOrType);
  if (!t) return null;
  return {
    width: t.canvasSize.width,
    height: t.canvasSize.height,
    slotCount: t.photoSlots?.length || 4,
    photoSlots: t.photoSlots || [],
    photoRects: t.photoRects || []
  };
}
function getLayoutSlotCount(layoutOrType) {
  return getShotCountForFrameSafe(layoutOrType);
}
Object.assign(window, {
  FRAME_TEMPLATES,
  FRAME_TEMPLATE_ALIASES,
  getFrameTemplate,
  getFrameTemplateSafe,
  getShotCountForFrame,
  getShotCountForFrameSafe,
  getFrameGeometry,
  getLayoutSlotCount,
  FrameRenderEngine,
  renderComposition,
  renderFrameOverlay,
  FrameThumb,
  LocalGalleryStore,
  ShareStore,
  generateQrDataUrl,
  getFrameTheme
});