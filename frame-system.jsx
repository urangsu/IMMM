// frame-system.jsx — frame templates, unified canvas renderer, local gallery, QR/share adapters

const FRAME_TEMPLATE_ALIASES = {
  strip: '1x4',
  grid: '2x2',
  trip: '1x3',
  polaroid: '1x1',
  layered: '2x2',
};

function parseHexColor(hex) {
  const s = String(hex || '').trim();
  if (!s.startsWith('#')) return null;
  const v = s.slice(1);
  if (v.length === 3) {
    return {
      r: parseInt(v[0] + v[0], 16),
      g: parseInt(v[1] + v[1], 16),
      b: parseInt(v[2] + v[2], 16),
    };
  }
  if (v.length === 6) {
    return {
      r: parseInt(v.slice(0, 2), 16),
      g: parseInt(v.slice(2, 4), 16),
      b: parseInt(v.slice(4, 6), 16),
    };
  }
  return null;
}

function isDarkFrameColor(color) {
  const rgb = parseHexColor(color);
  if (!rgb) {
    return /^#(0{3,6}|1{3,6}|111111|000000?)$/i.test(String(color || '').trim());
  }
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance < 0.45;
}

if (typeof window !== 'undefined') {
  window.isDarkFrameColor = isDarkFrameColor;
}

const FRAME_TEMPLATES = {
  '1x4': {
    id: 'core-1x4',
    type: '1x4',
    name: 'Classic 1x4',
    ko: '클래식 1x4',
    canvasSize: { width: 560, height: 1808 },
    theme: { frameFill: '#fff', textColor: '#555', logoColor: '#111', dotColor: '#111' },
    photoRects: [
      { x: 0.093, y: 0.092, w: 0.814, h: 0.189 },
      { x: 0.093, y: 0.297, w: 0.814, h: 0.189 },
      { x: 0.093, y: 0.501, w: 0.814, h: 0.189 },
      { x: 0.093, y: 0.706, w: 0.814, h: 0.189 },
    ],
    logo: { x: 0.071, y: 0.038, fontSize: 0.06 },
    dot: { x: 0.92, y: 0.038, r: 0.024 },
    captionRect: { x: 0, y: 0.90, w: 1, h: 0.10 },
    date: { x: 0.5, y: 0.5, fontSize: 0.04, align: 'center' },
    photoSlots: [], // Legacy compat
  },
  '2x2': {
    id: 'core-2x2',
    type: '2x2',
    name: 'Gallery 2x2',
    ko: '갤러리 2x2',
    canvasSize: { width: 880, height: 1096 },
    theme: { frameFill: '#fff', textColor: '#555', logoColor: '#111', dotColor: '#111' },
    photoRects: [
      { x: 0.08, y: 0.155, w: 0.398, h: 0.319 },
      { x: 0.523, y: 0.155, w: 0.398, h: 0.319 },
      { x: 0.08, y: 0.511, w: 0.398, h: 0.319 },
      { x: 0.523, y: 0.511, w: 0.398, h: 0.319 },
    ],
    logo: { x: 0.068, y: 0.064, fontSize: 0.045 },
    dot: { x: 0.932, y: 0.064, r: 0.016 },
    captionRect: { x: 0, y: 0.86, w: 1, h: 0.14 },
    date: { x: 0.5, y: 0.5, fontSize: 0.035, align: 'center' },
    photoSlots: [],
  },
  '1x1': {
    id: 'core-1x1',
    type: '1x1',
    name: 'Polaroid 1x1',
    ko: '폴라로이드 1x1',
    canvasSize: { width: 880, height: 1070 },
    theme: { frameFill: '#fff', textColor: '#555', logoColor: '#111', dotColor: '#111' },
    photoRects: [
      { x: 0.051, y: 0.10, w: 0.898, h: 0.68 }, // Structure consistent for black/white
    ],
    logo: { x: 0.051, y: 0.045, fontSize: 0.042, letterSpacing: 2 },
    dot: { x: 0.92, y: 0.045, r: 0.018 },
    captionRect: { x: 0.051, y: 0.78, w: 0.898, h: 0.22 },
    date: { x: 0.5, y: 0.62, fontSize: 0.048, align: 'center' },
    photoSlots: [],
  },
};

// Map legacy photoSlots to new photoRects
Object.keys(FRAME_TEMPLATES).forEach(k => {
  const t = FRAME_TEMPLATES[k];
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
  const type = FRAME_TEMPLATE_ALIASES[layoutOrType] || layoutOrType || '1x4';
  return FRAME_TEMPLATES[type] || FRAME_TEMPLATES['1x4'];
}

function getShotCountForFrame(layoutOrType) {
  return getFrameTemplate(layoutOrType).photoSlots.length;
}

function loadImageForCanvas(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

function drawCoverToCtx(ctx, img, x, y, w, h) {
  if (!img) return;
  const ar = img.width / img.height;
  const dar = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
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
  const label = item?.label || item?.text || item?.id || '♡';
  ctx.save();
  ctx.fillStyle = item?.color || item?.tc || item?.fill || '#111';
  ctx.font = `700 ${28 * scalePx}px Pretendard, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

async function drawStickerToCtx(ctx, sticker, baseW, baseH, scalePx = 1) {
  if (!sticker) return;
  ctx.save();
  const cx = (sticker.x / 100) * baseW;
  const cy = (sticker.y / 100) * baseH;
  ctx.translate(cx, cy);
  ctx.rotate((sticker.rotation || 0) * Math.PI / 180);
  const actualSizeNorm = sticker.sizeNorm ?? sticker.payload?.sizeNorm;

  let raw = { w: 64, h: 64 };
  if (typeof getStickerVisualBounds === 'function') {
    raw = getStickerVisualBounds(sticker);
  } else if (sticker.kind === 'preset') {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(sticker.payload?.libId) : null;
    raw = typeof getCatalogStickerBaseSize === 'function' ? getCatalogStickerBaseSize(item) : raw;
  } else if (sticker.kind === 'upload') {
    raw = { w: 120, h: 120 };
  } else if (sticker.kind === 'text') {
    const size = sticker.payload?.size || 32;
    const text = sticker.payload?.text || '';
    raw = { w: Math.max(44, Math.min(220, text.length * size * 0.58)), h: Math.max(34, size * 1.25) };
  } else if (sticker.kind === 'setlog') {
    raw = { w: 140, h: 64 };
  }

  const targetW = actualSizeNorm ? baseW * actualSizeNorm : raw.w * scalePx;
  const drawScale = targetW / (raw.w || 1);
  const effectiveScale = drawScale * (sticker.scale || 1);
  ctx.scale(effectiveScale, effectiveScale);

  if (sticker.kind === 'preset') {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(sticker.payload.libId) : null;
    try {
      const drawCatalog = typeof drawCatalogSticker === 'function' ? drawCatalogSticker : (typeof window !== 'undefined' ? window.drawCatalogSticker : null);
      if (item && typeof drawCatalog === 'function') {
        drawCatalog(ctx, item, 1);
      } else if (item) {
        drawFallbackSticker(ctx, item, 1);
      }
    } catch (err) {
      console.warn('[IMMM] preset sticker render failed, using fallback', err);
      if (item) drawFallbackSticker(ctx, item, 1);
    }
  } else if (sticker.kind === 'upload') {
    const img = await loadImageForCanvas(sticker.payload.dataUrl);
    if (img) {
      const w = 120;
      const h = w / (img.width / img.height || 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
  } else if (sticker.kind === 'text') {
    ctx.fillStyle = sticker.payload.color || '#111';
    // sizeNorm is applied via ctx.scale(effectiveScale) above.
    const fontPx = sticker.payload.size || 32;
    ctx.font = `600 ${fontPx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.payload.text || '', 0, 0);
  } else if (sticker.kind === 'setlog') {
    const { time, caption, theme } = sticker.payload;
    const fg = theme === 'white' ? '#fff' : '#000';
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
  let curX = x;
  for (const ch of text) {
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
  let s = (seed ^ 0xdeadbeef) >>> 0;
  s ^= s << 13; s ^= s >> 17; s ^= s << 5;
  return (s >>> 0) / 0xffffffff;
}

/**
 * Distance-based sparkle stamp.
 * Stamps at fixed world-space intervals regardless of pointer speed/device.
 * Uses a deterministic seed so preview and export produce identical results.
 */
function renderSparkleStroke(ctx, stroke, w, h, lineWidth) {
  if (!Array.isArray(stroke.points) || stroke.points.length < 1) return;
  const spacing = lineWidth * 2.2;  // world-space distance between stamps
  const sz = lineWidth * 1.5;
  const baseSeed = stroke.seed || 0;
  let accumulated = 0;
  let stampIdx = 0;

  ctx.fillStyle = stroke.color || '#fff';
  ctx.globalAlpha = 0.85;

  for (let i = 1; i < stroke.points.length; i++) {
    const [ax, ay] = stroke.points[i - 1];
    const [bx, by] = stroke.points[i];
    const segX = (bx - ax) / 100 * w;
    const segY = (by - ay) / 100 * h;
    const segLen = Math.sqrt(segX * segX + segY * segY);
    if (segLen === 0) continue;
    const ux = segX / segLen;
    const uy = segY / segLen;

    let d = accumulated === 0 ? 0 : spacing - accumulated;
    while (d <= segLen) {
      const tx = (ax / 100 * w) + ux * d;
      const ty = (ay / 100 * h) + uy * d;
      const rotSeed = seededRand(baseSeed + stampIdx * 7);
      const rot = rotSeed * Math.PI * 2;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.25, -sz * 0.25); ctx.lineTo(sz, 0); ctx.lineTo(sz * 0.25, sz * 0.25);
      ctx.lineTo(0, sz); ctx.lineTo(-sz * 0.25, sz * 0.25); ctx.lineTo(-sz, 0); ctx.lineTo(-sz * 0.25, -sz * 0.25);
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
  const bg = options.frameColor || template.theme?.frameFill || '#fff';
  const isDark = isDarkFrameColor(bg);

  const textColor = options.textColor || (isDark ? '#eee' : (template.theme?.textColor || '#555'));
  const logoColor = options.logoColor || (isDark ? '#fff' : (template.theme?.logoColor || '#111'));
  // Dot: always use theme dotColor; on white frames ensure dark fallback for visibility
  const rawDotColor = template.theme?.dotColor;
  const dotColor = options.dotColor || rawDotColor || (isDark ? 'rgba(255,255,255,0.88)' : '#111');

  // 1. Logo
  if (options.logo !== false && template.logo) {
    ctx.save();
    ctx.fillStyle = logoColor;
    const fs = template.logo.fontSize * width;
    ctx.font = `800 ${fs}px "Plus Jakarta Sans", sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const lx = template.logo.x * width;
    const ly = template.logo.y * height;
    const spacing = template.logo.letterSpacing || 0;
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
    const fs = template.date.fontSize * width;
    ctx.font = `700 ${fs}px "Plus Jakarta Sans", Pretendard, sans-serif`;
    ctx.globalAlpha = 0.82;
    ctx.textAlign = template.date.align || 'center';
    ctx.textBaseline = 'middle';

    const dateStr = (typeof options.dateText === 'string' && options.dateText)
      ? options.dateText
      : new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' });

    let dx, dy;
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
  const slotCount = typeof getLayoutSlotCount === 'function'
    ? getLayoutSlotCount(layout)
    : 4;
  return Number(sticker.frameSlot) >= 0 && Number(sticker.frameSlot) < slotCount;
}

async function renderComposition(ctx, data, options = {}) {
  const template = getFrameTemplate(data.layout || data.templateType);
  const scale = options.scale || 1;
  const w = template.canvasSize.width * scale;
  const h = template.canvasSize.height * scale;

  // 1. Background
  const bg = data.frameColor || template.theme.frameFill;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 2. Photo Slots
  const selected = data.selected || [];
  const shots = data.shots || [];
  const images = await Promise.all(template.photoSlots.map((_, i) => {
    const shot = shots[selected[i]];
    return loadImageForCanvas(shot?.dataUrl);
  }));

  for (let i = 0; i < template.photoSlots.length; i++) {
    const slot = template.photoSlots[i];
    const sx = slot.x * scale;
    const sy = slot.y * scale;
    const sw = slot.width * scale;
    const sh = slot.height * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(sx, sy, sw, sh);
    
    if (images[i]) {
      drawCoverToCtx(ctx, images[i], sx, sy, sw, sh);
    }
    
    // Slotted stickers — only valid slots for this layout
    const slotted = (data.stickers || [])
      .filter((s) => Number(s.frameSlot) === i && isStickerValidForLayout(s, data.layout || data.templateType));
    for (const s of slotted) {
      const local = { ...s, x: s.slotX ?? 50, y: s.slotY ?? 50 };
      ctx.save();
      ctx.translate(sx, sy);
      await drawStickerToCtx(ctx, local, sw, sh, scale);
      ctx.restore();
    }
    ctx.restore();
  }

  // 3. Global Stickers (not in slots) — validate layout-slot compatibility
  const freeStickers = (data.stickers || []).filter((st) =>
    st.frameSlot == null && isStickerValidForLayout(st, data.layout || data.templateType));
  for (const s of freeStickers) {
    await drawStickerToCtx(ctx, s, w, h, scale);
  }

  // 4. Drawing Strokes
  const drawStrokes = data.drawStrokes || [];
  drawStrokes.filter(Boolean).forEach((stroke) => {
    if (!Array.isArray(stroke.points) || stroke.points.length < 1) return;

    // Prefer normalized width (0~1 of frame width), fall back to absolute px * scale
    const lineWidth = stroke.widthNorm
      ? stroke.widthNorm * w
      : (stroke.width || 3) * scale;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.brush === 'sparkle') {
      renderSparkleStroke(ctx, stroke, w, h, lineWidth);
    } else {
      if (stroke.points.length < 2) { ctx.restore(); return; }
      ctx.strokeStyle = stroke.color || '#111';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      stroke.points.forEach(([px, py], idx) => {
        const tx = (px / 100) * w;
        const ty = (py / 100) * h;
        if (idx === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      });
      ctx.stroke();
    }
    ctx.restore();
  });

  // 5. Unified Overlay (Logo, Dot, Date)
  renderFrameOverlay(ctx, template, w, h, {
    frameColor: data.frameColor,
    logo: data.logo,
    dateText: data.dateText,
    accent: data.accent
  });
}

async function renderFrameToCanvas(input) {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  const template = getFrameTemplate(input.layout || input.templateType);
  const scale = input.scale || 1;
  const w = template.canvasSize.width * scale;
  const h = template.canvasSize.height * scale;
  
  const cvs = document.createElement('canvas');
  cvs.width = Math.round(w);
  cvs.height = Math.round(h);
  const ctx = cvs.getContext('2d');

  await renderComposition(ctx, input, { scale });

  return cvs;
}

const FrameRenderEngine = {
  renderToCanvas: renderFrameToCanvas,
  async renderToBlob(input, type = 'image/png', quality = 0.96) {
    const canvas = await renderFrameToCanvas(input);
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  },
  async renderToDataUrl(input, type = 'image/png', quality = 0.96) {
    const canvas = await renderFrameToCanvas(input);
    return canvas.toDataURL(type, quality);
  },
  drawStickerToCanvas: drawStickerToCtx,
  drawCover: drawCoverToCtx,
};

const LocalGalleryStore = {
  dbName: 'immm.local.gallery',
  version: 1,
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('photos')) {
          const store = db.createObjectStore('photos', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('source', 'source');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async putPhoto(photo) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(photo);
      tx.oncomplete = () => resolve(photo);
      tx.onerror = () => reject(tx.error);
    });
  },
  async listPhotos() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const req = tx.objectStore('photos').getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt));
      req.onerror = () => reject(req.error);
    });
  },
  async deletePhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};

const ShareStore = {
  ttlDays: 7,
  config() {
    return window.IMMM_SUPABASE || {
      url: window.IMMM_SUPABASE_URL,
      anonKey: window.IMMM_SUPABASE_ANON_KEY,
      bucket: window.IMMM_SUPABASE_BUCKET || 'shared-results',
    };
  },
  isConfigured() {
    const c = this.config();
    return Boolean(c?.url && c?.anonKey && c?.bucket);
  },
  async createShare(blob, metadata = {}) {
    const id = `sh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = Date.now() + this.ttlDays * 86400000;
    if (!this.isConfigured()) {
      const localUrl = URL.createObjectURL(blob);
      return {
        id,
        url: localUrl,
        qrUrl: localUrl,
        expiresAt,
        mode: 'local-preview',
        metadata,
      };
    }
    const c = this.config();
    const path = `${id}.png`;
    const upload = await fetch(`${c.url}/storage/v1/object/${c.bucket}/${path}`, {
      method: 'POST',
      headers: {
        apikey: c.anonKey,
        Authorization: `Bearer ${c.anonKey}`,
        'Content-Type': 'image/png',
        'x-upsert': 'false',
      },
      body: blob,
    });
    if (!upload.ok) throw new Error(`Supabase upload failed: ${upload.status}`);
    const publicUrl = `${c.url}/storage/v1/object/public/${c.bucket}/${path}`;
    const shareUrl = `${location.origin}${location.pathname}#/s/${id}?u=${encodeURIComponent(publicUrl)}&e=${expiresAt}`;
    localStorage.setItem(`immm.share.${id}`, JSON.stringify({ id, publicUrl, expiresAt, metadata }));
    return { id, url: publicUrl, qrUrl: shareUrl, expiresAt, mode: 'supabase', metadata };
  },
};

function generateQrDataUrl(text) {
  if (window.QRCode?.toDataURL) {
    return window.QRCode.toDataURL(text, { margin: 1, width: 512 });
  }
  return Promise.resolve(null);
}

/**
 * A consistent, canvas-based preview component.
 */
function FrameThumb({ layout, shots, selected, filter, frameColor, stickers = [], drawStrokes = [], logo, dateText, accent, scale = 1, orientation }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const draw = async () => {
      if (!canvasRef.current) return;
      const cvs = canvasRef.current;
      const ctx = cvs.getContext('2d');
      const getTpl = window.getFrameTemplateSafe || (typeof getFrameTemplate === 'function' ? getFrameTemplate : null);
      const template = getTpl ? getTpl(layout) : null;
      if (!template) {
        console.warn('[IMMM] skip draw: frame template unavailable', layout);
        return;
      }
      
      const baseW = template.canvasSize.width;
      const baseH = template.canvasSize.height;
      cvs.width = baseW;
      cvs.height = baseH;

      const data = {
        layout, shots, selected, filter, frameColor,
        stickers, drawStrokes, logo, dateText, accent, orientation
      };
      const renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (renderComp) await renderComp(ctx, data, { scale: 1 });
    };
    draw();
  }, [layout, shots, selected, filter, frameColor, stickers, drawStrokes, logo, dateText, accent, orientation]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: 200 * scale * (layout === 'strip' || layout === 'trip' ? 1 : 1.2), 
        height: 'auto', 
        display: 'block',
        maxWidth: '100%'
      }} 
    />
  );
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
  const t = getFrameTemplateSafe(layoutOrType);
  return t?.photoSlots?.length || 4;
}

Object.assign(window, {
  FRAME_TEMPLATES,
  FRAME_TEMPLATE_ALIASES,
  getFrameTemplate,
  getFrameTemplateSafe,
  getShotCountForFrame,
  getShotCountForFrameSafe,
  FrameRenderEngine,
  renderComposition,
  renderFrameOverlay,
  FrameThumb,
  LocalGalleryStore,
  ShareStore,
  generateQrDataUrl,
});
