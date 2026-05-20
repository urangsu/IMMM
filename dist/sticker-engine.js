// sticker-engine.jsx — Draggable, scalable, rotatable sticker canvas with z-index control

var {
  useState: useSE,
  useEffect: useEE,
  useRef: useRR,
  useCallback: useCB
} = React;
var SlottedStickersCtx = React.createContext({});

// ─────────────────────────────────────────────────────────────
// Data model
// Sticker: { id, kind: 'preset'|'upload'|'text'|'draw', payload, x, y, scale, rotation, z }
//   preset.payload = { libId }    — references STICKER_CATALOG
//   upload.payload = { dataUrl }  — user-uploaded image
//   text.payload   = { text, font, color, size }
//   draw.payload   = { svgPath, color, stroke }
// ─────────────────────────────────────────────────────────────

var STICKER_CATALOG = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    ko: '미니멀',
    premium: false,
    recommended: true,
    price: 0,
    owned: true,
    locked: false,
    items: [{
      id: 'm-heart-1',
      type: 'mini',
      kind: 'heart',
      fill: '#D98893'
    }, {
      id: 'm-star-1',
      type: 'mini',
      kind: 'star',
      fill: '#FFE8A3'
    }, {
      id: 'm-sparkle',
      type: 'mini',
      kind: 'sparkle',
      fill: '#1A1A1F'
    }, {
      id: 'm-dot',
      type: 'mini',
      kind: 'dot',
      fill: '#D98893'
    }, {
      id: 'm-heart-2',
      type: 'mini',
      kind: 'heart',
      fill: '#F4C8CC'
    }, {
      id: 'm-immm-logo',
      type: 'immm-logo',
      text: 'IMMM',
      fill: '#111'
    }, {
      id: 'm-camera',
      type: 'mini',
      kind: 'camera',
      fill: '#1A1A1F'
    }, {
      id: 'm-smile',
      type: 'mini',
      kind: 'smile',
      fill: '#FFE8A3'
    }, {
      id: 'm-ribbon',
      type: 'mini',
      kind: 'ribbon',
      fill: '#D98893'
    }, {
      id: 'm-moment',
      type: 'text',
      text: 'my moment',
      font: '"Plus Jakarta Sans"',
      size: 18,
      color: '#1A1A1F'
    }]
  },
  handwrit: {
    id: 'handwrit',
    name: 'Handwritten',
    ko: '손글씨',
    premium: false,
    recommended: false,
    price: 0,
    owned: true,
    locked: false,
    items: [{
      id: 'h-fav',
      type: 'text',
      text: 'my fav',
      font: 'Caveat',
      size: 34,
      color: '#D98893'
    }, {
      id: 'h-year',
      type: 'text',
      text: '2026',
      font: 'Caveat',
      size: 32,
      color: '#1A1A1F'
    }, {
      id: 'h-immm',
      type: 'text',
      text: 'immm ♡',
      font: 'Caveat',
      size: 30,
      color: '#D98893'
    }, {
      id: 'h-best',
      type: 'text',
      text: 'best day',
      font: 'Caveat',
      size: 32,
      color: '#1A1A1F'
    }, {
      id: 'h-forever',
      type: 'text',
      text: 'forever',
      font: 'Caveat',
      size: 32,
      color: '#D98893'
    }]
  },
  // kretro는 품질 미달로 신규 UI에서는 숨긴다.
  // 기존 저장 데이터 호환을 위해 catalog와 renderer는 유지한다.
  // 신규 선택 UI에서는 getVisibleStickerPacks()를 통해 제외한다.
  kretro: {
    id: 'kretro',
    name: 'K-Variety Retro',
    ko: '예능 자막',
    premium: true,
    recommended: true,
    price: 900,
    owned: true,
    locked: false,
    purchaseId: 'sticker_kretro_premium',
    hidden: true,
    items: [{
      id: 'r-1',
      type: 'burst',
      text: '다 같이!',
      fill: '#FFEB3B',
      tc: '#E53935'
    }, {
      id: 'r-2',
      type: 'burst',
      text: '흥!',
      fill: '#FF6B88',
      tc: '#fff',
      fs: 16
    }, {
      id: 'r-3',
      type: 'cloud',
      text: '우하하',
      fill: '#FFF59D',
      tc: '#1B5E20'
    }, {
      id: 'r-4',
      type: 'burst',
      text: '백 년!',
      fill: '#FFEB3B',
      tc: '#E53935'
    }, {
      id: 'r-5',
      type: 'burst',
      text: '만 년!',
      fill: '#FFEB3B',
      tc: '#0277BD'
    }, {
      id: 'r-6',
      type: 'cloud',
      text: '꿀맛',
      fill: '#FFF59D',
      tc: '#E53935'
    }, {
      id: 'r-7',
      type: 'cloud',
      text: '오늘은 축제다!',
      fill: '#fff',
      tc: '#111',
      w: 120
    }, {
      id: 'r-8',
      type: 'cloud',
      text: '영원히 사랑해!',
      fill: '#fff',
      tc: '#D81B60',
      w: 130
    }, {
      id: 'r-9',
      type: 'burst',
      text: '딸꾹',
      fill: '#81D4FA',
      tc: '#fff'
    }, {
      id: 'r-10',
      type: 'cloud',
      text: '혼미',
      fill: '#FFF59D',
      tc: '#E53935',
      w: 70
    }]
  }
};
function getVisibleStickerPacks() {
  return Object.entries(STICKER_CATALOG).filter(([key, pack]) => !pack.hidden);
}
function getVisibleStickerItems() {
  return getVisibleStickerPacks().flatMap(([key, pack]) => pack.items || []);
}
if (typeof window !== 'undefined') {
  window.getVisibleStickerPacks = getVisibleStickerPacks;
  window.getVisibleStickerItems = getVisibleStickerItems;
}
function getStickerByLibId(libId) {
  for (var pack of Object.values(STICKER_CATALOG)) {
    var f = pack.items.find(i => i.id === libId);
    if (f) return f;
  }
  return null;
}
function renderLibSticker(item, scale = 1) {
  if (!item) return null;
  if (item.type === 'burst') return /*#__PURE__*/React.createElement(Starburst, {
    text: item.text,
    fill: item.fill,
    textColor: item.tc,
    fontSize: (item.fs || 11) * scale,
    w: (item.w || 90) * scale,
    h: (item.h || 70) * scale
  });
  if (item.type === 'cloud') return /*#__PURE__*/React.createElement(CloudBubble, {
    text: item.text,
    fill: item.fill,
    textColor: item.tc,
    fontSize: (item.fs || 11) * scale,
    w: (item.w || 100) * scale,
    h: (item.h || 60) * scale
  });
  if (item.type === 'mini') {
    var charMap = {
      heart: '♥',
      star: '★',
      sparkle: '✦',
      dot: '●',
      camera: '📷',
      smile: '☺',
      ribbon: '🎀'
    };
    var ch = charMap[item.kind] || '●';
    return /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 28 * scale,
        color: item.fill,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
        display: 'inline-block'
      }
    }, ch);
  }
  if (item.type === 'immm-logo') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: '"Plus Jakarta Sans", system-ui',
        fontSize: 22 * scale,
        fontWeight: 800,
        letterSpacing: '0.16em',
        color: item.fill || '#111',
        userSelect: 'none',
        pointerEvents: 'none',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }
    }, "IMMM");
  }
  if (item.type === 'text') return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: item.font,
      fontSize: item.size * scale,
      color: item.color,
      whiteSpace: 'nowrap'
    }
  }, item.text);
  return null;
}
function renderStickerInstance(s, scaleMul = 1) {
  if (s.kind === 'preset') {
    var item = getStickerByLibId(s.payload.libId);
    return renderLibSticker(item, scaleMul);
  }
  if (s.kind === 'upload') {
    return /*#__PURE__*/React.createElement("img", {
      src: s.payload.dataUrl,
      draggable: false,
      style: {
        width: 120,
        height: 'auto',
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none'
      }
    });
  }
  if (s.kind === 'text') {
    return /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: s.payload.font,
        fontSize: s.payload.size,
        color: s.payload.color,
        whiteSpace: 'nowrap',
        fontWeight: 600
      }
    }, s.payload.text);
  }
  if (s.kind === 'setlog') {
    var {
      time,
      caption,
      theme
    } = s.payload;
    var fg = theme === 'white' ? '#fff' : '#000';
    var shadow = theme === 'white' ? '0 1px 5px rgba(0,0,0,0.38)' : '0 1px 3px rgba(255,255,255,0.55)';
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '2px 4px',
        background: 'transparent',
        textAlign: 'center',
        userSelect: 'none',
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 28,
        fontWeight: 800,
        color: fg,
        lineHeight: 1,
        textShadow: shadow,
        fontFamily: '"Plus Jakarta Sans", system-ui'
      }
    }, time), caption ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: fg,
        opacity: 0.7,
        marginTop: 4,
        lineHeight: 1.2,
        textShadow: shadow,
        fontFamily: 'Pretendard, system-ui'
      }
    }, caption) : null);
  }
  return null;
}

// ─── Capture slot filter helpers ─────────────────────────────────────────────
// captureIndex is 0-based: shot 1 = index 0, shot 5 = index 4, etc.

function getLayoutSlotCount(layout) {
  if (layout === 'trip') return 3; // 1x3
  if (layout === 'polaroid') return 1; // 1x1
  if (layout === 'grid') return 4; // 2x2
  if (layout === 'strip') return 4; // 1x4
  return 4;
}
function getCaptureSlotIndex(captureIndex, layout) {
  var slotCount = getLayoutSlotCount(layout);
  if (captureIndex == null) return null;
  if (captureIndex < 0) return null;
  if (captureIndex >= slotCount) return null;
  return captureIndex;
}

// Returns only stickers visible during a given capture shot preview.
// Free stickers (no frameSlot) are NOT shown during live capture — they must not be baked per-shot.
// Slot stickers only show when captureIndex matches their slot.
// Extra candidate shots (captureIndex >= slotCount) always return [].
function getStickersForCapturePreview(preStickers, captureIndex, layout) {
  var slotIndex = getCaptureSlotIndex(captureIndex, layout);
  if (slotIndex == null) return [];
  return (preStickers || []).filter(s => {
    if (s.frameSlot == null) return false;
    return Number(s.frameSlot) === Number(slotIndex);
  });
}
if (typeof window !== 'undefined') {
  window.getLayoutSlotCount = getLayoutSlotCount;
  window.getCaptureSlotIndex = getCaptureSlotIndex;
  window.getStickersForCapturePreview = getStickersForCapturePreview;
}
function getCatalogStickerBaseSize(item) {
  if (!item) return {
    w: 64,
    h: 64
  };
  if (item.type === 'mini') {
    return {
      w: 44,
      h: 44
    };
  }
  if (item.type === 'immm-logo') {
    return {
      w: 72,
      h: 30
    };
  }
  if (item.type === 'text') {
    var fs = item.size || 32;
    var text = item.text || '';
    return {
      w: Math.max(44, Math.min(180, text.length * fs * 0.58)),
      h: Math.max(34, fs * 1.25)
    };
  }
  if (item.type === 'burst') {
    return {
      w: item.w || 90,
      h: item.h || 70
    };
  }
  if (item.type === 'cloud') {
    return {
      w: item.w || 100,
      h: item.h || 60
    };
  }
  return {
    w: 64,
    h: 64
  };
}
function getUploadStickerBaseSize(sticker) {
  var w = Number(sticker?.payload?.width) || Number(sticker?.payload?.naturalWidth) || 120;
  var h = Number(sticker?.payload?.height) || Number(sticker?.payload?.naturalHeight) || 120;
  var aspect = w > 0 && h > 0 ? h / w : 1;
  return {
    w: 120,
    h: Math.max(24, 120 * aspect)
  };
}
function getStickerHitboxSize(sticker) {
  if (!sticker) return {
    w: 64,
    h: 64
  };
  if (sticker.kind === 'preset') {
    var item = getStickerByLibId(sticker.payload?.libId);
    return getCatalogStickerBaseSize(item);
  }
  if (sticker.kind === 'upload') {
    return getUploadStickerBaseSize(sticker);
  }
  if (sticker.kind === 'text') {
    var size = sticker.payload?.size || 32;
    var text = sticker.payload?.text || '';
    return {
      w: Math.max(44, Math.min(220, text.length * size * 0.58)),
      h: Math.max(34, size * 1.25)
    };
  }
  if (sticker.kind === 'setlog') {
    return {
      w: 140,
      h: 64
    };
  }
  return {
    w: 64,
    h: 64
  };
}
function getStickerVisualBounds(sticker) {
  if (!sticker) return {
    w: 64,
    h: 64
  };
  if (sticker.kind === 'preset') {
    var item = getStickerByLibId(sticker.payload?.libId);
    return getCatalogStickerBaseSize(item);
  }
  if (sticker.kind === 'upload') return getUploadStickerBaseSize(sticker);
  if (sticker.kind === 'text') {
    var size = sticker.payload?.size || 32;
    var text = sticker.payload?.text || '';
    return {
      w: Math.max(44, Math.min(220, text.length * size * 0.58)),
      h: Math.max(34, size * 1.25)
    };
  }
  if (sticker.kind === 'setlog') return {
    w: 140,
    h: 64
  };
  return {
    w: 64,
    h: 64
  };
}
function getInteractionBounds(sticker, mode, decoScale, canvasW) {
  var raw = mode === 'deco-overlay' ? getStickerVisualBounds(sticker) : getStickerHitboxSize(sticker);
  var visualW;
  var visualH;
  if (sticker.sizeNorm && canvasW) {
    visualW = sticker.sizeNorm * canvasW;
    visualH = visualW * (raw.h / raw.w);
  } else if (mode === 'deco-overlay') {
    visualW = raw.w * (decoScale?.x || 1);
    visualH = raw.h * (decoScale?.y || 1);
  } else {
    visualW = raw.w;
    visualH = raw.h;
  }
  return {
    w: Math.max(24, visualW),
    h: Math.max(24, visualH),
    visualW,
    visualH
  };
}
function getStickerNormScale(sticker, canvasW) {
  if (!sticker.sizeNorm || !canvasW) return 1;
  var baseBounds = getStickerVisualBounds({
    ...sticker,
    sizeNorm: null
  });
  var targetW = sticker.sizeNorm * canvasW;
  return targetW / baseBounds.w;
}

// ─────────────────────────────────────────────────────────────
function StickerCanvas({
  stickers,
  setStickers,
  selectedId,
  setSelectedId,
  width,
  height,
  children,
  T,
  hideVisuals = false,
  mode = 'default',
  style = {},
  decoScale = {
    x: 1,
    y: 1
  },
  canvasW = null,
  layout = null
}) {
  var canvasRef = useRR(null);
  var [dragState, setDragState] = useSE(null);
  var [snapMode, setSnapMode] = useSE(false);
  var [slotClips, setSlotClips] = useSE({}); // slotIndex -> {top,right,bottom,left} in % of canvas

  var getVirtualSlotRects = useCB(() => {
    if (!canvasRef.current || !layout) return [];
    var getTpl = typeof window !== 'undefined' ? window.getFrameTemplateSafe || window.getFrameTemplate : null;
    var template = typeof getTpl === 'function' ? getTpl(layout) : null;
    var slots = template?.photoSlots || [];
    var baseW = template?.canvasSize?.width || 0;
    var baseH = template?.canvasSize?.height || 0;
    if (!slots.length || !baseW || !baseH) return [];
    var localW = canvasRef.current.offsetWidth || canvasRef.current.getBoundingClientRect().width || 1;
    var localH = canvasRef.current.offsetHeight || canvasRef.current.getBoundingClientRect().height || 1;
    return slots.map((slot, index) => ({
      index,
      left: slot.x / baseW * localW,
      top: slot.y / baseH * localH,
      width: slot.width / baseW * localW,
      height: slot.height / baseH * localH,
      minX: slot.x / baseW * 100,
      maxX: (slot.x + slot.width) / baseW * 100,
      minY: slot.y / baseH * 100,
      maxY: (slot.y + slot.height) / baseH * 100
    }));
  }, [layout]);
  var measureSlots = useCB(() => {
    if (!canvasRef.current) return;
    var cRect = canvasRef.current.getBoundingClientRect();
    var clips = {};
    var domSlots = Array.from(canvasRef.current.querySelectorAll('[data-frame-slot]'));
    domSlots.forEach(el => {
      var i = parseInt(el.dataset.frameSlot);
      var r = el.getBoundingClientRect();
      clips[i] = {
        top: (r.top - cRect.top) / cRect.height * 100,
        left: (r.left - cRect.left) / cRect.width * 100,
        right: (cRect.right - r.right) / cRect.width * 100,
        bottom: (cRect.bottom - r.bottom) / cRect.height * 100,
        // usable area bounds (0-100% of canvas)
        minX: (r.left - cRect.left) / cRect.width * 100,
        maxX: (r.right - cRect.left) / cRect.width * 100,
        minY: (r.top - cRect.top) / cRect.height * 100,
        maxY: (r.bottom - cRect.top) / cRect.height * 100
      };
    });
    if (domSlots.length === 0) {
      getVirtualSlotRects().forEach(slot => {
        clips[slot.index] = {
          top: slot.minY,
          left: slot.minX,
          right: 100 - slot.maxX,
          bottom: 100 - slot.maxY,
          minX: slot.minX,
          maxX: slot.maxX,
          minY: slot.minY,
          maxY: slot.maxY
        };
      });
    }
    setSlotClips(clips);
  }, [getVirtualSlotRects]);
  useEE(() => {
    measureSlots();
    var ro = new ResizeObserver(measureSlots);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [measureSlots]);
  var snapToSlot = (slotEl, slotIndex) => {
    if (!canvasRef.current) return;
    measureSlots();
    var cRect = canvasRef.current.getBoundingClientRect();
    var sRect = slotEl.getBoundingClientRect ? slotEl.getBoundingClientRect() : null;
    var cx = sRect ? (sRect.left - cRect.left + sRect.width / 2) / cRect.width * 100 : slotEl.minX + (slotEl.maxX - slotEl.minX) / 2;
    var cy = sRect ? (sRect.top - cRect.top + sRect.height / 2) / cRect.height * 100 : slotEl.minY + (slotEl.maxY - slotEl.minY) / 2;
    setStickers(prev => prev.map(s => s.id === selectedId ? {
      ...s,
      x: cx,
      y: cy,
      frameSlot: slotIndex,
      slotX: 50,
      slotY: 50
    } : s));
    setSnapMode(false);
  };
  var unSnap = id => {
    setStickers(prev => prev.map(s => s.id === id ? {
      ...s,
      frameSlot: undefined
    } : s));
  };
  var getSlotOverlays = () => {
    if (!canvasRef.current) return [];
    var domSlots = Array.from(canvasRef.current.querySelectorAll('[data-frame-slot]'));
    if (domSlots.length > 0) return domSlots;
    return getVirtualSlotRects();
  };
  var onPointerDown = (e, s, mode = 'move') => {
    e.stopPropagation();
    var rect = canvasRef.current.getBoundingClientRect();
    setSelectedId(s.id);
    var startX = e.clientX,
      startY = e.clientY;
    setDragState({
      id: s.id,
      mode,
      startX,
      startY,
      initX: s.x,
      initY: s.y,
      initScale: s.scale,
      initRot: s.rotation,
      rectW: rect.width,
      rectH: rect.height,
      centerX: rect.left + rect.width * (s.x / 100),
      centerY: rect.top + rect.height * (s.y / 100),
      slotBounds: s.frameSlot != null ? slotClips[s.frameSlot] : null
    });
  };
  useEE(() => {
    if (!dragState) return;
    var onMove = e => {
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      setStickers(prev => prev.map(s => {
        if (s.id !== dragState.id) return s;
        if (dragState.mode === 'move') {
          var nx = dragState.initX + dx / dragState.rectW * 100;
          var ny = dragState.initY + dy / dragState.rectH * 100;
          var extra = {};
          if (s.frameSlot != null && dragState.slotBounds) {
            var b = dragState.slotBounds;
            nx = Math.max(b.minX, Math.min(b.maxX, nx));
            ny = Math.max(b.minY, Math.min(b.maxY, ny));
            extra.slotX = (nx - b.minX) / (b.maxX - b.minX) * 100;
            extra.slotY = (ny - b.minY) / (b.maxY - b.minY) * 100;
          }
          return {
            ...s,
            x: nx,
            y: ny,
            ...extra
          };
        }
        if (dragState.mode === 'scale-rotate') {
          // distance from center controls scale; angle controls rotation
          var cx = dragState.centerX,
            cy = dragState.centerY;
          var initVx = dragState.startX - cx,
            initVy = dragState.startY - cy;
          var curVx = e.clientX - cx,
            curVy = e.clientY - cy;
          var initDist = Math.hypot(initVx, initVy) || 1;
          var curDist = Math.hypot(curVx, curVy) || 1;
          var initAng = Math.atan2(initVy, initVx);
          var curAng = Math.atan2(curVy, curVx);
          var newScale = Math.max(0.25, Math.min(4, dragState.initScale * (curDist / initDist)));
          var newRot = dragState.initRot + (curAng - initAng) * 180 / Math.PI;
          return {
            ...s,
            scale: newScale,
            rotation: newRot
          };
        }
        return s;
      }));
    };
    var onUp = () => setDragState(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, setStickers]);
  var sortedStickers = [...stickers].sort((a, b) => (a.z || 0) - (b.z || 0));
  var slottedMap = {};
  sortedStickers.filter(s => s.frameSlot != null).forEach(s => {
    if (!slottedMap[s.frameSlot]) slottedMap[s.frameSlot] = [];
    slottedMap[s.frameSlot].push(s);
  });
  var renderStickerControls = (s, isSel) => {
    if (!isSel) return null;
    var invScale = 1 / Math.max(0.25, Math.min(4, s.scale || 1));
    var tr = `scale(${invScale})`;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onPointerDown: e => onPointerDown(e, s, 'scale-rotate'),
      style: {
        position: 'absolute',
        top: -12,
        right: -12,
        width: 28,
        height: 28,
        background: '#fff',
        borderRadius: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'nwse-resize',
        zIndex: 200,
        transform: tr,
        transformOrigin: 'center'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 12 12"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v2M3 3h2M9 9v-2M9 9h-2M3 9h6V3",
      stroke: "#1A1A1F",
      strokeWidth: "1.3",
      fill: "none",
      strokeLinecap: "round"
    }))), /*#__PURE__*/React.createElement("div", {
      onPointerDown: e => {
        e.stopPropagation();
        if (s.frameSlot != null) {
          unSnap(s.id);
          setSnapMode(false);
        } else {
          setSnapMode(v => !v);
        }
      },
      title: s.frameSlot != null ? '틀에서 꺼내기' : '틀 안에 넣기',
      style: {
        position: 'absolute',
        bottom: -12,
        left: '50%',
        zIndex: 200,
        width: 28,
        height: 28,
        background: s.frameSlot != null ? '#1A1A1F' : snapMode ? '#D98893' : '#fff',
        borderRadius: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: `translateX(-50%) ${tr}`,
        transformOrigin: 'center'
      }
    }, s.frameSlot != null ? /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 12 12"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "1",
      y: "1",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: "#fff",
      strokeWidth: "1.2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "7",
      y: "1",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: "#fff",
      strokeWidth: "1.2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M5 9.5l2-2M7 9.5l-2-2",
      stroke: "#D98893",
      strokeWidth: "1.4",
      strokeLinecap: "round"
    })) : /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 12 12"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "1",
      y: "1",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: snapMode ? '#fff' : '#1A1A1F',
      strokeWidth: "1.2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "7",
      y: "1",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: snapMode ? '#fff' : '#1A1A1F',
      strokeWidth: "1.2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "1",
      y: "8",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: snapMode ? '#fff' : '#1A1A1F',
      strokeWidth: "1.2",
      fill: "none"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "7",
      y: "8",
      width: "4",
      height: "3",
      rx: "0.5",
      stroke: snapMode ? '#fff' : '#1A1A1F',
      strokeWidth: "1.2",
      fill: "none"
    }))), /*#__PURE__*/React.createElement("div", {
      onPointerDown: e => {
        e.stopPropagation();
        setStickers(prev => prev.filter(x => x.id !== s.id));
        setSelectedId(null);
      },
      style: {
        position: 'absolute',
        top: -12,
        left: -12,
        width: 28,
        height: 28,
        zIndex: 200,
        background: '#1A1A1F',
        borderRadius: 999,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transform: tr,
        transformOrigin: 'center'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "12",
      height: "12",
      viewBox: "0 0 10 10"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M2 2l6 6M8 2L2 8",
      stroke: "#fff",
      strokeWidth: "1.5",
      strokeLinecap: "round"
    }))));
  };
  var renderStickerVisual = (s, visualScale, opacity = 1) => {
    var raw = getStickerVisualBounds(s);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: raw.w,
        height: raw.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${visualScale})`,
        transformOrigin: 'center',
        opacity
      }
    }, renderStickerInstance(s, 1));
  };
  return /*#__PURE__*/React.createElement(SlottedStickersCtx.Provider, {
    value: slottedMap
  }, /*#__PURE__*/React.createElement("div", {
    ref: canvasRef,
    onPointerDown: () => {
      setSelectedId(null);
      setSnapMode(false);
    },
    style: {
      position: 'relative',
      width,
      height,
      touchAction: 'none',
      userSelect: 'none',
      ...style
    }
  }, children, snapMode && (() => {
    var slots = getSlotOverlays();
    var cRect = canvasRef.current?.getBoundingClientRect();
    if (!cRect) return null;
    var cssScale = cRect.width / (canvasRef.current.offsetWidth || 1);
    return slots.map((el, i) => {
      var isVirtual = !el.getBoundingClientRect;
      var sRect = isVirtual ? null : el.getBoundingClientRect();
      var left = isVirtual ? el.left : (sRect.left - cRect.left) / cssScale;
      var top = isVirtual ? el.top : (sRect.top - cRect.top) / cssScale;
      var w = isVirtual ? el.width : sRect.width / cssScale;
      var h = isVirtual ? el.height : sRect.height / cssScale;
      var slotIndex = isVirtual ? el.index : i;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        onPointerDown: e => {
          e.stopPropagation();
          snapToSlot(el, slotIndex);
        },
        style: {
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          background: 'rgba(0,0,0,0.35)',
          border: '1.5px solid rgba(255,255,255,0.7)',
          borderRadius: 3,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(2px)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 26,
          height: 26,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 13 13"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M6.5 2v9M2 6.5h9",
        stroke: "#1A1A1F",
        strokeWidth: "2",
        strokeLinecap: "round"
      }))));
    });
  })(), sortedStickers.filter(s => s.frameSlot == null).map(s => {
    var isSel = s.id === selectedId;
    var visualScale = getStickerNormScale(s, canvasW);
    var userScale = s.scale || 1;
    var hitbox = getInteractionBounds(s, mode, decoScale, canvasW);
    var outlineW = hitbox.visualW || hitbox.w;
    var outlineH = hitbox.visualH || hitbox.h;
    if (mode === 'deco-overlay' && window.IMMM_DEBUG_STICKER) {
      console.debug('[IMMM deco sticker]', {
        id: s.id,
        kind: s.kind,
        libId: s.payload?.libId,
        sizeNorm: s.sizeNorm,
        scale: s.scale,
        visualScale,
        userScale,
        rawBounds: getStickerVisualBounds(s),
        interactionBounds: hitbox,
        decoScale,
        canvasW,
        mode
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      onPointerDown: e => onPointerDown(e, s, 'move'),
      onClick: e => e.stopPropagation(),
      style: {
        position: 'absolute',
        left: `${s.x}%`,
        top: `${s.y}%`,
        transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg) scale(${userScale})`,
        transformOrigin: 'center',
        cursor: dragState?.id === s.id ? 'grabbing' : 'grab',
        zIndex: (s.z || 0) + 1,
        willChange: 'transform',
        transition: dragState?.id === s.id ? 'none' : 'box-shadow 0.2s'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sticker-hit-target",
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: hitbox.w,
        height: hitbox.h
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sticker-outline-box",
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: outlineW,
        height: outlineH,
        outline: isSel ? `1.5px dashed ${T?.pinkDeep || '#D98893'}` : 'none',
        outlineOffset: isSel ? 2 : 0,
        padding: 0
      }
    }, renderStickerVisual(s, visualScale, hideVisuals ? 0 : 1), renderStickerControls(s, isSel))));
  }), sortedStickers.filter(s => s.frameSlot != null).map(s => {
    var isSel = s.id === selectedId;
    var visualScale = getStickerNormScale(s, canvasW);
    var userScale = s.scale || 1;
    var hitbox = getInteractionBounds(s, mode, decoScale, canvasW);
    var outlineW = hitbox.visualW || hitbox.w;
    var outlineH = hitbox.visualH || hitbox.h;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: s.id
    }, /*#__PURE__*/React.createElement("div", {
      onPointerDown: e => onPointerDown(e, s, 'move'),
      onClick: e => e.stopPropagation(),
      style: {
        position: 'absolute',
        left: `${s.x}%`,
        top: `${s.y}%`,
        transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg) scale(${userScale})`,
        transformOrigin: 'center',
        cursor: dragState?.id === s.id ? 'grabbing' : 'grab',
        zIndex: (s.z || 0) + 50,
        willChange: 'transform',
        opacity: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: hitbox.w,
        height: hitbox.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, renderStickerVisual(s, visualScale, hideVisuals ? 0 : 1))), isSel && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: `${s.x}%`,
        top: `${s.y}%`,
        transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg) scale(${userScale})`,
        transformOrigin: 'center',
        zIndex: (s.z || 0) + 51,
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "sticker-outline-box",
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: outlineW,
        height: outlineH,
        outline: `1.5px dashed ${T?.pinkDeep || '#D98893'}`,
        outlineOffset: 2,
        padding: 0,
        pointerEvents: 'auto'
      }
    }, renderStickerVisual(s, visualScale, 0), renderStickerControls(s, true))));
  })));
}
function getDefaultStickerSizeNorm(item) {
  if (!item) return 0.16;
  if (item.type === 'mini') return 0.16;
  if (item.type === 'immm-logo') return 0.28;
  if (item.type === 'text') return 0.24;
  if (item.type === 'burst' || item.type === 'cloud') return 0.34;
  return 0.16;
}

// Helpers for creating stickers
function makeSticker(kind, payload, opts = {}) {
  var defaultScale = 1;
  var defaultSizeNorm = null;

  // Hoist legacy payload.sizeNorm if present
  if (payload && payload.sizeNorm !== undefined) {
    defaultSizeNorm = payload.sizeNorm;
    // Don't mutate payload to avoid side effects, but it will be overridden by logic using sticker.sizeNorm
  }
  if (kind === 'preset') {
    var item = getStickerByLibId(payload.libId);
    if (item) {
      if (item.type === 'burst' || item.type === 'cloud') defaultScale = 0.9;
      defaultSizeNorm = getDefaultStickerSizeNorm(item);
    }
  }
  return {
    id: 'st_' + Math.random().toString(36).slice(2, 9),
    kind,
    payload,
    x: opts.x ?? 40 + Math.random() * 20,
    y: opts.y ?? 30 + Math.random() * 30,
    scale: opts.scale ?? defaultScale,
    sizeNorm: opts.sizeNorm ?? defaultSizeNorm,
    rotation: opts.rotation ?? Math.random() * 20 - 10,
    z: opts.z ?? Date.now()
  };
}
function bringForward(stickers, id) {
  var maxZ = Math.max(0, ...stickers.map(s => s.z || 0));
  return stickers.map(s => s.id === id ? {
    ...s,
    z: maxZ + 1
  } : s);
}
function sendBackward(stickers, id) {
  var minZ = Math.min(0, ...stickers.map(s => s.z || 0));
  return stickers.map(s => s.id === id ? {
    ...s,
    z: minZ - 1
  } : s);
}

// Canvas renderer for preset catalog stickers
function drawCatalogSticker(ctx, item, scalePx = 1) {
  if (!item) return;
  ctx.save();
  if (item.type === 'immm-logo') {
    ctx.fillStyle = item.fill || '#111';
    var fs = 22 * scalePx;
    ctx.font = `800 ${fs}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // letter spacing approximation: draw each char spaced
    var text = 'IMMM';
    var spacing = fs * 0.16;
    var totalW = ctx.measureText(text).width + spacing * (text.length - 1);
    var x = -totalW / 2;
    for (var ch of text) {
      var cw = ctx.measureText(ch).width;
      ctx.fillText(ch, x + cw / 2, 0);
      x += cw + spacing;
    }
  } else if (item.type === 'burst' || item.type === 'cloud') {
    ctx.fillStyle = item.tc || '#111';
    ctx.font = `800 ${(item.fs || 11) * 2 * scalePx}px "Plus Jakarta Sans", Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || '', 0, 0);
  } else if (item.type === 'mini') {
    ctx.fillStyle = item.fill || '#111';
    ctx.font = `700 ${32 * scalePx}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var charMap = {
      'heart': '♥',
      'star': '★',
      'sparkle': '✦',
      'dot': '●',
      'camera': '📷',
      'smile': '☺',
      'ribbon': '🎀'
    };
    ctx.fillText(charMap[item.kind] || '●', 0, 0);
  } else if (item.type === 'text') {
    ctx.fillStyle = item.color || '#111';
    ctx.font = `600 ${(item.size || 32) * scalePx}px ${item.font || 'Pretendard'}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || '', 0, 0);
  } else {
    ctx.fillStyle = item.color || item.tc || item.fill || '#111';
    ctx.font = `700 ${28 * scalePx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || item.label || item.id || '♡', 0, 0);
  }
  ctx.restore();
}
Object.assign(window, {
  STICKER_CATALOG,
  getStickerByLibId,
  renderLibSticker,
  renderStickerInstance,
  StickerCanvas,
  SlottedStickersCtx,
  makeSticker,
  bringForward,
  sendBackward,
  drawCatalogSticker
});