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
    canvasSize: { width: 800, height: 1080 },
    previewImage: 'asset/1x1.png',
    premium: false,
    recommended: true,
    price: 0,
    owned: true,
    locked: false,
    purchaseId: null,
    author: 'IMMM',
    logoSafeArea: { x: 64, y: 38, width: 672, height: 112 },
    overlayLayer: 'logo-top',
    photoSlots: [
      { x: 84, y: 174, width: 632, height: 632 },
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

function drawCatalogSticker(ctx, item, scalePx) {
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (item.type === 'mini') {
    const sz = 44 * scalePx;
    ctx.fillStyle = item.fill || '#D98893';
    ctx.lineWidth = 2 * scalePx;
    if (item.kind === 'heart') {
      ctx.beginPath();
      ctx.moveTo(0, sz * 0.3);
      ctx.bezierCurveTo(-sz * 0.4, -sz * 0.2, -sz * 0.4, -sz * 0.7, 0, -sz * 0.4);
      ctx.bezierCurveTo(sz * 0.4, -sz * 0.7, sz * 0.4, -sz * 0.2, 0, sz * 0.3);
      ctx.fill(); ctx.stroke();
    } else if (item.kind === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? sz * 0.5 : sz * 0.25;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (item.kind === 'dot') {
      ctx.beginPath(); ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (item.kind === 'sparkle') {
      ctx.beginPath();
      ctx.moveTo(0, -sz / 2); ctx.lineTo(0, sz / 2);
      ctx.moveTo(-sz / 2, 0); ctx.lineTo(sz / 2, 0);
      ctx.stroke();
    }
  } else if (item.type === 'text') {
    ctx.fillStyle = item.color || '#111';
    ctx.font = `${(item.size || 30) * scalePx}px ${item.font || 'Caveat'}, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || '', 0, 0);
  } else {
    const w = (item.w || 100) * scalePx;
    const h = (item.h || 64) * scalePx;
    ctx.fillStyle = item.fill || '#fff';
    ctx.lineWidth = 2 * scalePx;
    if (item.type === 'burst') {
      const rO = Math.min(w, h) / 2 - 2 * scalePx;
      const rI = rO * 0.74;
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const r = i % 2 === 0 ? rO : rI;
        const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = item.tc || '#111';
    ctx.font = `800 ${(item.fs || 11) * scalePx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || '', 0, 0);
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

async function renderFrameToCanvas(input) {
  const template = getFrameTemplate(input.layout || input.templateType);
  const scale = input.scale || 1;
  const w = template.canvasSize.width * scale;
  const h = template.canvasSize.height * scale;
  const cvs = document.createElement('canvas');
  cvs.width = Math.round(w);
  cvs.height = Math.round(h);
  const ctx = cvs.getContext('2d');
  const bg = input.frameColor || '#fff';
  const isDark = ['#111', '#111111', '#000', '#000000'].includes(String(bg).toLowerCase());
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const selected = input.selected || [];
  const shots = input.shots || [];
  const images = await Promise.all(template.photoSlots.map((_, i) => {
    const shot = shots[selected[i]];
    return loadImageForCanvas(shot?.dataUrl);
  }));

  for (let i = 0; i < template.photoSlots.length; i++) {
    const slot = template.photoSlots[i];
    const x = slot.x * scale;
    const y = slot.y * scale;
    const sw = slot.width * scale;
    const sh = slot.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, sw, sh);
    ctx.clip();
    ctx.fillStyle = '#e7e7e7';
    ctx.fillRect(x, y, sw, sh);
    drawCoverToCtx(ctx, images[i], x, y, sw, sh);
    const slotted = (input.stickers || []).filter((s) => s.frameSlot === i);
    for (const s of slotted) {
      const local = { ...s, x: s.slotX ?? 50, y: s.slotY ?? 50 };
      ctx.save();
      ctx.translate(x, y);
      await drawStickerToCtx(ctx, local, sw, sh, scale);
      ctx.restore();
    }
    ctx.restore();
  }

  for (const s of (input.stickers || []).filter((st) => st.frameSlot == null)) {
    await drawStickerToCtx(ctx, s, w, h, scale);
  }

  (input.drawStrokes || []).filter(Boolean).forEach((stroke) => {
    if (!Array.isArray(stroke.points) || stroke.points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = stroke.color || '#111';
    ctx.fillStyle = stroke.color || '#111';
    ctx.lineWidth = Math.max(1, (stroke.width || 3) * scale * 0.9);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    stroke.points.forEach(([px, py], idx) => {
      const x = px / 100 * w;
      const y = py / 100 * h;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  });

  if (input.dateText !== false) {
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.78)' : '#555';
    ctx.font = `${22 * scale}px Caveat, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }), w / 2, h - 34 * scale);
    ctx.restore();
  }

  drawLogoLayer(ctx, template, {
    logo: input.logo,
    accent: input.accent,
    inkColor: isDark ? '#fff' : '#111',
  }, scale);

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

Object.assign(window, {
  FRAME_TEMPLATES,
  FRAME_TEMPLATE_ALIASES,
  getFrameTemplate,
  getShotCountForFrame,
  FrameRenderEngine,
  LocalGalleryStore,
  ShareStore,
  generateQrDataUrl,
});
