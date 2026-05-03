// sticker-engine.jsx — Draggable, scalable, rotatable sticker canvas with z-index control

const { useState: useSE, useEffect: useEE, useRef: useRR, useCallback: useCB } = React;

const SlottedStickersCtx = React.createContext({});

// ─────────────────────────────────────────────────────────────
// Data model
// Sticker: { id, kind: 'preset'|'upload'|'text'|'draw', payload, x, y, scale, rotation, z }
//   preset.payload = { libId }    — references STICKER_CATALOG
//   upload.payload = { dataUrl }  — user-uploaded image
//   text.payload   = { text, font, color, size }
//   draw.payload   = { svgPath, color, stroke }
// ─────────────────────────────────────────────────────────────

const STICKER_CATALOG = {
  minimal: {
    id: 'minimal', name: 'Minimal', ko: '미니멀', premium: false, recommended: true, price: 0, owned: true, locked: false,
    items: [
      { id:'m-heart-1', type:'mini', kind:'heart', fill:'#D98893' },
      { id:'m-heart-2', type:'mini', kind:'heart', fill:'#F4C8CC' },
      { id:'m-star-1', type:'mini', kind:'star', fill:'#FFE8A3' },
      { id:'m-sparkle', type:'mini', kind:'sparkle', fill:'#1A1A1F' },
      { id:'m-dot', type:'mini', kind:'dot', fill:'#D98893' },
    ],
  },
  handwrit: {
    id: 'handwrit', name: 'Handwritten', ko: '손글씨', premium: false, recommended: false, price: 0, owned: true, locked: false,
    items: [
      { id:'h-fav', type:'text', text:'my fav', font:'Caveat', size:34, color:'#D98893' },
      { id:'h-year', type:'text', text:'2026', font:'Caveat', size:32, color:'#1A1A1F' },
      { id:'h-immm', type:'text', text:'immm ♡', font:'Caveat', size:30, color:'#D98893' },
      { id:'h-best', type:'text', text:'best day', font:'Caveat', size:32, color:'#1A1A1F' },
      { id:'h-forever', type:'text', text:'forever', font:'Caveat', size:32, color:'#D98893' },
    ],
  },
  kretro: {
    id: 'kretro', name: 'K-Variety Retro', ko: '예능 자막', premium: true, recommended: true, price: 900, owned: true, locked: false, purchaseId: 'sticker_kretro_premium',
    items: [
      { id:'r-1', type:'burst', text:'다 같이!', fill:'#FFEB3B', tc:'#E53935' },
      { id:'r-2', type:'burst', text:'흥!', fill:'#FF6B88', tc:'#fff', fs:16 },
      { id:'r-3', type:'cloud', text:'우하하', fill:'#FFF59D', tc:'#1B5E20' },
      { id:'r-4', type:'burst', text:'백 년!', fill:'#FFEB3B', tc:'#E53935' },
      { id:'r-5', type:'burst', text:'만 년!', fill:'#FFEB3B', tc:'#0277BD' },
      { id:'r-6', type:'cloud', text:'꿀맛', fill:'#FFF59D', tc:'#E53935' },
      { id:'r-7', type:'cloud', text:'오늘은 축제다!', fill:'#fff', tc:'#111', w:120 },
      { id:'r-8', type:'cloud', text:'영원히 사랑해!', fill:'#fff', tc:'#D81B60', w:130 },
      { id:'r-9', type:'burst', text:'딸꾹', fill:'#81D4FA', tc:'#fff' },
      { id:'r-10', type:'cloud', text:'혼미', fill:'#FFF59D', tc:'#E53935', w:70 },
    ],
  },
};

function getStickerByLibId(libId) {
  for (const pack of Object.values(STICKER_CATALOG)) {
    const f = pack.items.find(i => i.id === libId);
    if (f) return f;
  }
  return null;
}

function renderLibSticker(item, scale=1) {
  if (!item) return null;
  if (item.type === 'burst') return <Starburst text={item.text} fill={item.fill} textColor={item.tc} fontSize={(item.fs||11)*scale} w={(item.w||90)*scale} h={(item.h||70)*scale}/>;
  if (item.type === 'cloud') return <CloudBubble text={item.text} fill={item.fill} textColor={item.tc} fontSize={(item.fs||11)*scale} w={(item.w||100)*scale} h={(item.h||60)*scale}/>;
  if (item.type === 'mini') return <MiniSticker kind={item.kind} fill={item.fill} w={44*scale} h={44*scale}/>;
  if (item.type === 'text') return <span style={{ fontFamily:item.font, fontSize:item.size*scale, color:item.color, whiteSpace:'nowrap' }}>{item.text}</span>;
  return null;
}

// Renders a single sticker instance (for preview or deco surface)
function renderStickerInstance(s, scaleMul=1) {
  if (s.kind === 'preset') {
    const item = getStickerByLibId(s.payload.libId);
    return renderLibSticker(item, 1);
  }
  if (s.kind === 'upload') {
    return <img src={s.payload.dataUrl} draggable={false} style={{ width: 120, height: 'auto', display:'block', userSelect:'none', pointerEvents:'none' }}/>;
  }
  if (s.kind === 'text') {
    return <span style={{ fontFamily:s.payload.font, fontSize:s.payload.size, color:s.payload.color, whiteSpace:'nowrap', fontWeight:600 }}>{s.payload.text}</span>;
  }
  if (s.kind === 'setlog') {
    const { time, caption, theme } = s.payload;
    const fg = theme === 'white' ? '#fff' : '#000';
    const shadow = theme === 'white' ? '0 1px 5px rgba(0,0,0,0.38)' : '0 1px 3px rgba(255,255,255,0.55)';
    return (
      <div style={{
        padding: '2px 4px', background: 'transparent',
        textAlign:'center', userSelect:'none', pointerEvents:'none'
      }}>
        <div style={{ fontSize:28, fontWeight:800, color: fg, lineHeight:1,
          textShadow: shadow, fontFamily:'"Plus Jakarta Sans", system-ui' }}>{time}</div>
        {caption ? (
          <div style={{ fontSize:12, fontWeight:600, color: fg, opacity: 0.7, marginTop:4, lineHeight:1.2,
            textShadow: shadow, fontFamily:'Pretendard, system-ui' }}>{caption}</div>
        ) : null}
      </div>
    );
  }
  return null;
}

function getStickerHitboxSize(sticker) {
  if (!sticker) return 64;
  if (sticker.kind === 'upload') return 120;
  if (sticker.kind === 'text') return Math.max(48, Math.min(180, sticker.payload?.size || 64));
  if (sticker.kind === 'setlog') return 140;
  return 72; // preset fallback
}

// ─────────────────────────────────────────────────────────────
function StickerCanvas({ stickers, setStickers, selectedId, setSelectedId, width, height, children, T, hideVisuals = false }) {
  const canvasRef = useRR(null);
  const [dragState, setDragState] = useSE(null);
  const [snapMode, setSnapMode] = useSE(false);
  const [slotClips, setSlotClips] = useSE({}); // slotIndex -> {top,right,bottom,left} in % of canvas

  const measureSlots = useCB(() => {
    if (!canvasRef.current) return;
    const cRect = canvasRef.current.getBoundingClientRect();
    const clips = {};
    canvasRef.current.querySelectorAll('[data-frame-slot]').forEach(el => {
      const i = parseInt(el.dataset.frameSlot);
      const r = el.getBoundingClientRect();
      clips[i] = {
        top:    (r.top    - cRect.top)    / cRect.height * 100,
        left:   (r.left   - cRect.left)   / cRect.width  * 100,
        right:  (cRect.right  - r.right)  / cRect.width  * 100,
        bottom: (cRect.bottom - r.bottom) / cRect.height * 100,
        // usable area bounds (0-100% of canvas)
        minX: (r.left   - cRect.left)   / cRect.width  * 100,
        maxX: (r.right  - cRect.left)   / cRect.width  * 100,
        minY: (r.top    - cRect.top)    / cRect.height * 100,
        maxY: (r.bottom - cRect.top)    / cRect.height * 100,
      };
    });
    setSlotClips(clips);
  }, []);

  useEE(() => {
    measureSlots();
    const ro = new ResizeObserver(measureSlots);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [measureSlots]);

  const snapToSlot = (slotEl, slotIndex) => {
    if (!canvasRef.current) return;
    measureSlots();
    const cRect = canvasRef.current.getBoundingClientRect();
    const sRect = slotEl.getBoundingClientRect();
    const cx = ((sRect.left - cRect.left) + sRect.width / 2) / cRect.width * 100;
    const cy = ((sRect.top - cRect.top) + sRect.height / 2) / cRect.height * 100;
    setStickers(prev => prev.map(s => s.id === selectedId ? { ...s, x: cx, y: cy, frameSlot: slotIndex, slotX: 50, slotY: 50 } : s));
    setSnapMode(false);
  };

  const unSnap = (id) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, frameSlot: undefined } : s));
  };

  const getSlotOverlays = () => {
    if (!canvasRef.current) return [];
    return Array.from(canvasRef.current.querySelectorAll('[data-frame-slot]'));
  };

  const onPointerDown = (e, s, mode='move') => {
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedId(s.id);
    const startX = e.clientX, startY = e.clientY;
    setDragState({
      id: s.id, mode, startX, startY,
      initX: s.x, initY: s.y, initScale: s.scale, initRot: s.rotation,
      rectW: rect.width, rectH: rect.height,
      centerX: rect.left + rect.width * (s.x/100),
      centerY: rect.top + rect.height * (s.y/100),
      slotBounds: s.frameSlot != null ? slotClips[s.frameSlot] : null,
    });
  };

  useEE(() => {
    if (!dragState) return;
    const onMove = (e) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setStickers(prev => prev.map(s => {
        if (s.id !== dragState.id) return s;
        if (dragState.mode === 'move') {
          let nx = dragState.initX + (dx/dragState.rectW)*100;
          let ny = dragState.initY + (dy/dragState.rectH)*100;
          let extra = {};
          if (s.frameSlot != null && dragState.slotBounds) {
            const b = dragState.slotBounds;
            nx = Math.max(b.minX, Math.min(b.maxX, nx));
            ny = Math.max(b.minY, Math.min(b.maxY, ny));
            extra.slotX = (nx - b.minX) / (b.maxX - b.minX) * 100;
            extra.slotY = (ny - b.minY) / (b.maxY - b.minY) * 100;
          }
          return { ...s, x: nx, y: ny, ...extra };
        }
        if (dragState.mode === 'scale-rotate') {
          // distance from center controls scale; angle controls rotation
          const cx = dragState.centerX, cy = dragState.centerY;
          const initVx = dragState.startX - cx, initVy = dragState.startY - cy;
          const curVx = e.clientX - cx, curVy = e.clientY - cy;
          const initDist = Math.hypot(initVx, initVy) || 1;
          const curDist = Math.hypot(curVx, curVy) || 1;
          const initAng = Math.atan2(initVy, initVx);
          const curAng = Math.atan2(curVy, curVx);
          const newScale = Math.max(0.25, Math.min(4, dragState.initScale * (curDist/initDist)));
          const newRot = dragState.initRot + (curAng - initAng) * 180 / Math.PI;
          return { ...s, scale: newScale, rotation: newRot };
        }
        return s;
      }));
    };
    const onUp = () => setDragState(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, setStickers]);

  const sortedStickers = [...stickers].sort((a,b) => (a.z||0) - (b.z||0));
  const slottedMap = {};
  sortedStickers.filter(s => s.frameSlot != null).forEach(s => {
    if (!slottedMap[s.frameSlot]) slottedMap[s.frameSlot] = [];
    slottedMap[s.frameSlot].push(s);
  });

  const renderStickerControls = (s, isSel) => {
    if (!isSel) return null;
    const invScale = 1 / (s.scale || 1);
    const tr = `scale(${invScale})`;
    return (
      <>
        {/* scale+rotate handle (top-right) */}
        <div onPointerDown={(e)=>onPointerDown(e, s, 'scale-rotate')}
          style={{ position:'absolute', top:-12, right:-12, width:28, height:28,
            background:'#fff', borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'nwse-resize', zIndex:200,
            transform: tr, transformOrigin: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 12 12"><path d="M3 3v2M3 3h2M9 9v-2M9 9h-2M3 9h6V3" stroke="#1A1A1F" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
        </div>
        {/* snap-to-frame handle (bottom-center) */}
        <div onPointerDown={(e)=>{ e.stopPropagation(); if(s.frameSlot!=null){ unSnap(s.id); setSnapMode(false); } else { setSnapMode(v=>!v); } }}
          title={s.frameSlot!=null ? '틀에서 꺼내기' : '틀 안에 넣기'}
          style={{ position:'absolute', bottom:-12, left:'50%', zIndex:200,
            width:28, height:28, background: s.frameSlot!=null ? '#1A1A1F' : snapMode ? '#D98893' : '#fff',
            borderRadius:999, boxShadow:'0 2px 8px rgba(0,0,0,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            transform: `translateX(-50%) ${tr}`, transformOrigin: 'center' }}>
          {s.frameSlot!=null ? (
            <svg width="14" height="14" viewBox="0 0 12 12">
              <rect x="1" y="1" width="4" height="3" rx="0.5" stroke="#fff" strokeWidth="1.2" fill="none"/>
              <rect x="7" y="1" width="4" height="3" rx="0.5" stroke="#fff" strokeWidth="1.2" fill="none"/>
              <path d="M5 9.5l2-2M7 9.5l-2-2" stroke="#D98893" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12">
              <rect x="1" y="1" width="4" height="3" rx="0.5" stroke={snapMode?'#fff':'#1A1A1F'} strokeWidth="1.2" fill="none"/>
              <rect x="7" y="1" width="4" height="3" rx="0.5" stroke={snapMode?'#fff':'#1A1A1F'} strokeWidth="1.2" fill="none"/>
              <rect x="1" y="8" width="4" height="3" rx="0.5" stroke={snapMode?'#fff':'#1A1A1F'} strokeWidth="1.2" fill="none"/>
              <rect x="7" y="8" width="4" height="3" rx="0.5" stroke={snapMode?'#fff':'#1A1A1F'} strokeWidth="1.2" fill="none"/>
            </svg>
          )}
        </div>
        {/* delete (top-left) */}
        <div onPointerDown={(e)=>{ e.stopPropagation(); setStickers(prev => prev.filter(x => x.id !== s.id)); setSelectedId(null); }}
          style={{ position:'absolute', top:-12, left:-12, width:28, height:28, zIndex:200,
            background:'#1A1A1F', borderRadius:999, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            boxShadow:'0 2px 8px rgba(0,0,0,0.2)', transform: tr, transformOrigin: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </>
    );
  };

  return (
    <SlottedStickersCtx.Provider value={slottedMap}>
      <div ref={canvasRef}
        onPointerDown={() => { setSelectedId(null); setSnapMode(false); }}
        style={{ position:'relative', width, height, touchAction:'none', userSelect:'none' }}>
        {children}
        {/* Snap-to-frame slot overlay */}
        {snapMode && (() => {
          const slots = getSlotOverlays();
          const cRect = canvasRef.current?.getBoundingClientRect();
          if (!cRect) return null;
          const cssScale = cRect.width / (canvasRef.current.offsetWidth || 1);
          return slots.map((el, i) => {
            const sRect = el.getBoundingClientRect();
            const left = (sRect.left - cRect.left) / cssScale;
            const top  = (sRect.top  - cRect.top)  / cssScale;
            const w    = sRect.width  / cssScale;
            const h    = sRect.height / cssScale;
            return (
              <div key={i}
                onPointerDown={(e) => { e.stopPropagation(); snapToSlot(el, i); }}
                style={{ position:'absolute', left, top, width:w, height:h,
                  background:'rgba(0,0,0,0.35)', border:'1.5px solid rgba(255,255,255,0.7)',
                  borderRadius:3, zIndex:100,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', backdropFilter:'blur(2px)' }}>
                <div style={{ width:26, height:26, borderRadius:999,
                  background:'rgba(255,255,255,0.92)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.25)' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 2v9M2 6.5h9" stroke="#1A1A1F" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            );
          });
        })()}
        {/* Free stickers: full visual render */}
        {sortedStickers.filter(s => s.frameSlot == null).map(s => {
          const isSel = s.id === selectedId;
          return (
            <div key={s.id} onPointerDown={(e)=>onPointerDown(e, s, 'move')} onClick={(e)=>e.stopPropagation()}
              style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                transform:`translate(-50%,-50%) rotate(${s.rotation||0}deg) scale(${s.scale||1})`,
                transformOrigin:'center', cursor: dragState?.id===s.id?'grabbing':'grab',
                zIndex:(s.z||0)+1, willChange:'transform',
                transition: dragState?.id===s.id?'none':'box-shadow 0.2s' }}>
              <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                width: hideVisuals ? getStickerHitboxSize(s) : 'auto',
                height: hideVisuals ? getStickerHitboxSize(s) : 'auto',
                outline: isSel?`1.5px dashed ${T?.pinkDeep||'#D98893'}`:'none',
                outlineOffset: isSel?2:0, padding: 0 }}>
                <div style={{ opacity: hideVisuals ? 0 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {renderStickerInstance(s)}
                </div>
                {renderStickerControls(s, isSel)}
              </div>
            </div>
          );
        })}
        {/* Slotted stickers: transparent hit area, controls rendered separately when selected */}
        {sortedStickers.filter(s => s.frameSlot != null).map(s => {
          const isSel = s.id === selectedId;
          return (
            <React.Fragment key={s.id}>
              {/* Invisible hit area for drag */}
              <div onPointerDown={(e)=>onPointerDown(e, s, 'move')} onClick={(e)=>e.stopPropagation()}
                style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                  transform:`translate(-50%,-50%) rotate(${s.rotation||0}deg) scale(${s.scale||1})`,
                  transformOrigin:'center', cursor: dragState?.id===s.id?'grabbing':'grab',
                  zIndex:(s.z||0)+50, willChange:'transform', opacity:0 }}>
                <div style={{ position:'relative', display:'inline-block' }}>
                  {renderStickerInstance(s)}
                </div>
              </div>
              {/* Controls shown separately (not under opacity:0) */}
              {isSel && (
                <div style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                  transform:`translate(-50%,-50%) rotate(${s.rotation||0}deg) scale(${s.scale||1})`,
                  transformOrigin:'center', zIndex:(s.z||0)+51, pointerEvents:'none' }}>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                    width: hideVisuals ? getStickerHitboxSize(s) : 'auto',
                    height: hideVisuals ? getStickerHitboxSize(s) : 'auto',
                    outline:`1.5px dashed ${T?.pinkDeep||'#D98893'}`, outlineOffset:2, padding:0,
                    pointerEvents:'auto' }}>
                    <div style={{ opacity:0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderStickerInstance(s)}
                    </div>
                    {renderStickerControls(s, true)}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </SlottedStickersCtx.Provider>
  );
}

// Helpers for creating stickers
function makeSticker(kind, payload, opts={}) {
  return {
    id: 'st_' + Math.random().toString(36).slice(2,9),
    kind, payload,
    x: opts.x ?? (40 + Math.random()*20),
    y: opts.y ?? (30 + Math.random()*30),
    scale: opts.scale ?? 1,
    rotation: opts.rotation ?? (Math.random()*20 - 10),
    z: opts.z ?? Date.now(),
  };
}

function bringForward(stickers, id) {
  const maxZ = Math.max(0, ...stickers.map(s => s.z || 0));
  return stickers.map(s => s.id === id ? { ...s, z: maxZ + 1 } : s);
}
function sendBackward(stickers, id) {
  const minZ = Math.min(0, ...stickers.map(s => s.z || 0));
  return stickers.map(s => s.id === id ? { ...s, z: minZ - 1 } : s);
}

// Canvas renderer for preset catalog stickers
function drawCatalogSticker(ctx, item, scalePx = 1) {
  if (!item) return;
  ctx.save();
  if (item.type === 'burst' || item.type === 'cloud') {
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
    // basic text fallback for mini stickers
    const charMap = { 'heart': '♥', 'star': '★', 'sparkle': '✦', 'dot': '●' };
    ctx.fillText(charMap[item.kind] || '●', 0, 0);
  } else if (item.type === 'text') {
    ctx.fillStyle = item.color || '#111';
    ctx.font = `600 ${(item.size || 32) * scalePx}px ${item.font || 'Pretendard'}, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || '', 0, 0);
  } else {
    // Unknown preset type fallback
    ctx.fillStyle = item.color || item.tc || item.fill || '#111';
    ctx.font = `700 ${28 * scalePx}px Pretendard, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || item.label || item.id || '♡', 0, 0);
  }
  ctx.restore();
}

Object.assign(window, { STICKER_CATALOG, getStickerByLibId, renderLibSticker, renderStickerInstance, StickerCanvas, SlottedStickersCtx, makeSticker, bringForward, sendBackward, drawCatalogSticker });
