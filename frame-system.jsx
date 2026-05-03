// frame-system.jsx — frame templates, unified canvas renderer, local gallery, QR/share adapters

const FRAME_TEMPLATE_ALIASES = {
  strip: '1x4',
  grid: '2x2',
  trip: '1x3',
  polaroid: '1x1',
  layered: '2x2',
};

const FRAME_TEMPLATES = {
  '1x4': {
    id: 'core-1x4',
    type: '1x4',
    name: 'Classic 1x4',
    ko: '클래식 1x4',
    canvasSize: { width: 560, height: 1808 },
    previewImage: 'asset/1x4.png',
    premium: false,
    recommended: true,
    price: 0,
    owned: true,
    locked: false,
    purchaseId: null,
    author: 'IMMM',
    logoSafeArea: { x: 40, y: 34, width: 480, height: 110 },
    overlayLayer: 'logo-top',
    photoSlots: [
      { x: 52, y: 166, width: 456, height: 342 },
      { x: 52, y: 536, width: 456, height: 342 },
      { x: 52, y: 906, width: 456, height: 342 },
      { x: 52, y: 1276, width: 456, height: 342 },
    ],
  },
  '2x2': {
    id: 'core-2x2',
    type: '2x2',
    name: 'Gallery 2x2',
    ko: '갤러리 2x2',
    canvasSize: { width: 880, height: 1096 },
    previewImage: 'asset/2x2.png',
    premium: false,
    recommended: true,
    price: 0,
    owned: true,
    locked: false,
    purchaseId: null,
    author: 'IMMM',
    logoSafeArea: { x: 60, y: 36, width: 760, height: 110 },
    overlayLayer: 'logo-top',
    photoSlots: [
      { x: 70, y: 170, width: 350, height: 350 },
      { x: 460, y: 170, width: 350, height: 350 },
      { x: 70, y: 560, width: 350, height: 350 },
      { x: 460, y: 560, width: 350, height: 350 },
    ],
  },
  '1x3': {
    id: 'core-1x3',
    type: '1x3',
    name: 'Triple 1x3',
    ko: '트리플 1x3',
    canvasSize: { width: 560, height: 1424 },
    previewImage: 'asset/1x3.png',
    premium: false,
    recommended: false,
    price: 0,
    owned: true,
    locked: false,
    purchaseId: null,
    author: 'IMMM',
    logoSafeArea: { x: 40, y: 34, width: 480, height: 110 },
    overlayLayer: 'logo-top',
    photoSlots: [
      { x: 52, y: 166, width: 456, height: 342 },
      { x: 52, y: 548, width: 456, height: 342 },
      { x: 52, y: 930, width: 456, height: 342 },
    ],
  },
  '1x1': {
    id: 'core-1x1',
    type: '1x1',
    name: 'Polaroid 1x1',
    ko: '폴라로이드 1x1',
    canvasSize: { width: 880, height: 1070 }, // 88:107 ratio
    previewImage: 'asset/1x1.png',
    premium: false,
    recommended: true,
    price: 0,
    owned: true,
    locked: false,
    purchaseId: null,
    author: 'IMMM',
    logoSafeArea: { x: 45, y: 34, width: 790, height: 110 },
    overlayLayer: 'logo-top',
    photoSlots: [
      // Normalized: x: 0.051, y: 0.042, w: 0.898, h: 0.738
      { x: 44.8, y: 44.9, width: 790.2, height: 789.6 },
    ],
  },
};

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

async function drawStickerToCtx(ctx, sticker, baseW, baseH, scalePx = 1) {
  if (!sticker) return;
  ctx.save();
  const cx = (sticker.x / 100) * baseW;
  const cy = (sticker.y / 100) * baseH;
  ctx.translate(cx, cy);
  ctx.rotate((sticker.rotation || 0) * Math.PI / 180);
  ctx.scale(sticker.scale || 1, sticker.scale || 1);

  if (sticker.kind === 'preset') {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(sticker.payload.libId) : null;
    if (item) drawCatalogSticker(ctx, item, scalePx);
  } else if (sticker.kind === 'upload') {
    const img = await loadImageForCanvas(sticker.payload.dataUrl);
    if (img) {
      const w = 120 * scalePx;
      const h = w / (img.width / img.height || 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
  } else if (sticker.kind === 'text') {
    ctx.fillStyle = sticker.payload.color || '#111';
    ctx.font = `600 ${(sticker.payload.size || 32) * scalePx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.payload.text || '', 0, 0);
  } else if (sticker.kind === 'setlog') {
    const { time, caption, theme } = sticker.payload;
    const fg = theme === 'white' ? '#fff' : '#000';
    ctx.fillStyle = fg;
    ctx.shadowColor = theme === 'white' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 4 * scalePx;
    ctx.font = `800 ${28 * scalePx}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(time || '', 0, 0);
    if (caption) {
      ctx.globalAlpha = 0.8;
      ctx.font = `600 ${12 * scalePx}px Pretendard, sans-serif`;
      ctx.fillText(caption, 0, 32 * scalePx);
    }
  }
  ctx.restore();
}

function drawLogoLayer(ctx, template, opts, scale) {
  if (opts.logo === false) return;
  const safe = template.logoSafeArea;
  ctx.save();
  ctx.fillStyle = opts.inkColor || '#111';
  ctx.font = `800 ${Math.max(18, safe.height * 0.26 * scale)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('IMMM', safe.x * scale, (safe.y + safe.height / 2) * scale);
  ctx.fillStyle = opts.accent || '#D98893';
  ctx.beginPath();
  ctx.arc((safe.x + safe.width - 12) * scale, (safe.y + safe.height / 2) * scale, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Renders the entire composition to a canvas context.
 * Unified path for both Preview and Export.
 */
async function renderComposition(ctx, data, options = {}) {
  const template = getFrameTemplate(data.layout || data.templateType);
  const scale = options.scale || 1;
  const w = template.canvasSize.width * scale;
  const h = template.canvasSize.height * scale;

  // 1. Background
  const bg = data.frameColor || '#fff';
  const isDark = ['#111', '#111111', '#000', '#000000'].includes(String(bg).toLowerCase());
  const inkColor = isDark ? '#fff' : '#111';
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
    
    // Slotted stickers
    const slotted = (data.stickers || []).filter((s) => s.frameSlot === i);
    for (const s of slotted) {
      const local = { ...s, x: s.slotX ?? 50, y: s.slotY ?? 50 };
      ctx.save();
      ctx.translate(sx, sy);
      await drawStickerToCtx(ctx, local, sw, sh, scale);
      ctx.restore();
    }
    ctx.restore();
  }

  // 3. Global Stickers (not in slots)
  const freeStickers = (data.stickers || []).filter((st) => st.frameSlot == null);
  for (const s of freeStickers) {
    await drawStickerToCtx(ctx, s, w, h, scale);
  }

  // 4. Drawing Strokes
  const drawStrokes = data.drawStrokes || [];
  drawStrokes.filter(Boolean).forEach((stroke) => {
    if (!Array.isArray(stroke.points) || stroke.points.length < 2) return;
    
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (stroke.brush === 'sparkle') {
      const step = 8; // Consistent spacing
      const sz = (stroke.width || 3) * scale * 1.5;
      ctx.fillStyle = stroke.color || '#fff';
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < stroke.points.length; i += step) {
        const [px, py] = stroke.points[i];
        const tx = (px / 100) * w;
        const ty = (py / 100) * h;
        
        ctx.save();
        ctx.translate(tx, ty);
        // Draw sparkle star stamp
        ctx.beginPath();
        const s = sz;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.25, -s * 0.25); ctx.lineTo(s, 0); ctx.lineTo(s * 0.25, s * 0.25);
        ctx.lineTo(0, s); ctx.lineTo(-s * 0.25, s * 0.25); ctx.lineTo(-s, 0); ctx.lineTo(-s * 0.25, -s * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = stroke.color || '#111';
      ctx.lineWidth = (stroke.width || 3) * scale;
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

  // 5. Text & Logo
  if (data.dateText !== false) {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.78)' : '#555';
    // Use scale-aware font size
    ctx.font = `${22 * scale}px Caveat, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const dateStr = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' });
    ctx.fillText(dateStr, w / 2, h - (template.type === '1x1' ? 44 : 34) * scale);
    ctx.restore();
  }

  drawLogoLayer(ctx, template, {
    logo: data.logo,
    accent: data.accent,
    inkColor: isDark ? '#fff' : '#111',
  }, scale);
}

async function renderFrameToCanvas(input) {
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
      const template = getFrameTemplate(layout);
      if (!template) return;
      
      const baseW = template.canvasSize.width;
      const baseH = template.canvasSize.height;
      cvs.width = baseW;
      cvs.height = baseH;

      const data = {
        layout, shots, selected, filter, frameColor,
        stickers, drawStrokes, logo, dateText, accent, orientation
      };
      await renderComposition(ctx, data, { scale: 1 });
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

Object.assign(window, {
  FRAME_TEMPLATES,
  FRAME_TEMPLATE_ALIASES,
  getFrameTemplate,
  getShotCountForFrame,
  FrameRenderEngine,
  renderComposition,
  FrameThumb,
  LocalGalleryStore,
  ShareStore,
  generateQrDataUrl,
});
