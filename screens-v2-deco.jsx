// screens-v2-deco.jsx — Deco Studio + Result

const ZoomMinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path d="M4 9H14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const ZoomPlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path d="M4 9H14M9 4V14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const zoomBtnStyle = {
  width: 56,
  height: 56,
  borderRadius: 999,
  border: 'none',
  padding: 0,
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
};

// ═══════════════════════════════════════════════════════════════
// DECO STUDIO — final edit (filter+frame locked)
// ═══════════════════════════════════════════════════════════════
function getStickerPickerPacks() {
  return typeof getVisibleStickerPacks === 'function'
    ? getVisibleStickerPacks()
    : Object.entries(STICKER_CATALOG).filter(([k, pack]) => !pack.hidden);
}

function DecoV2({ T, go, mobile, variant, shots, selected, filter, layout, orientation,
  stickers, setStickers, drawStrokes, setDrawStrokes, logo, dateText, setDateText, accent, frameColor }) {
  const [tab, setTab] = React.useState('stickers'); // stickers | draw | text
  const [selStId, setSelStId] = React.useState(null);
  const [drawColor, setDrawColor] = React.useState('#D98893');
  const [drawMode, setDrawMode] = React.useState(false);
  const drawModeRef = React.useRef(false);
  const [drawWidth, setDrawWidth] = React.useState(3);
  const [drawBrush, setDrawBrush] = React.useState('pen'); // pen | sparkle
  const [textInput, setTextInput] = React.useState('');
  const fileRef = React.useRef(null);

  const curStrokeRef = React.useRef(null);
  const curPathElRef = React.useRef(null);
  const curPathDRef  = React.useRef('');
  const [drawVersion, setDrawVersion] = React.useState(0);
  const drawRafRef = React.useRef(null);

  // One-time font readiness gate — keeps preview/export text rendering consistent
  const [fontsReady, setFontsReady] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (alive) setFontsReady(true); });
    } else {
      setFontsReady(true);
    }
    return () => { alive = false; };
  }, []);

  // Cleanup drawRafRef on unmount to prevent RAF leak
  React.useEffect(() => {
    return () => {
      if (drawRafRef.current) {
        cancelAnimationFrame(drawRafRef.current);
        drawRafRef.current = null;
      }
    };
  }, []);

  const requestDrawRefresh = React.useCallback(() => {
    if (drawRafRef.current) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      setDrawVersion(v => v + 1);
    });
  }, []);

  const getDecoInitialPresetScale = (item) => {
    if (!item) return 1;
    if (item.type === 'mini') return 1.25;
    if (item.type === 'immm-logo') return 1.0;
    if (item.type === 'text') return 1.12;
    if (item.type === 'burst' || item.type === 'cloud') return 1.0;
    return 1;
  };
  const addPreset = (libId) => {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    const sizeNorm = typeof getDefaultStickerSizeNorm === 'function'
      ? getDefaultStickerSizeNorm(item)
      : undefined;
    setStickers((p) => [...p, makeSticker('preset', { libId }, { sizeNorm, scale: 1 })]);
  };
  const addUpload = (dataUrl) => setStickers((p) => [...p, makeSticker('upload', { dataUrl }, { scale: 0.6 })]);
  const addText = () => {
    if (!textInput.trim()) return;
    const rect = frameNativeRef.current?.getBoundingClientRect();
    const sizeNorm = rect?.width ? 32 / rect.width : null;
    setStickers((p) => [...p, makeSticker('text', { text: textInput, font: 'Caveat', size: 32, color: drawColor }, { sizeNorm })]);
    setTextInput('');
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];if (!f) return;
    const rd = new FileReader();rd.onload = () => addUpload(rd.result);rd.readAsDataURL(f);
  };

  const shotsForFrame = shots;

  // Draw handlers
  const toggleDrawMode = () => {
    const next = !drawModeRef.current;
    drawModeRef.current = next;
    setDrawMode(next);
    if (next) setSelStId(null); // deselect stickers when entering draw mode
  };

  const onDrawStart = React.useCallback((e) => {
    if (!drawModeRef.current || !frameNativeRef.current) return;
    e.stopPropagation(); e.preventDefault();
    // Pointer capture: keeps move/up events even if pointer leaves element
    if (e.pointerId != null && e.currentTarget?.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const rect = frameNativeRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    // Store normalized width so export renders at same visual size regardless of canvas scale
    const widthNorm = rect.width > 0 ? drawWidth / rect.width : null;
    // High-entropy seed: avoids collision even when multiple strokes start same ms
    const seed = Math.floor(performance.now() * 1000) ^ Math.floor(Math.random() * 1e9);
    curStrokeRef.current = {
      color: drawColor,
      width: drawWidth,    // legacy fallback
      widthNorm,           // normalized: 0~1 of frame display width
      brush: drawBrush,
      points: [[x, y]],
      seed,
    };
    curPathDRef.current = `M${x} ${y}`;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', curPathDRef.current);
      curPathElRef.current.setAttribute('stroke', drawColor);
      curPathElRef.current.setAttribute('stroke-width', drawWidth);
    }
  }, [drawColor, drawWidth, drawBrush]);

  const onDrawMove = React.useCallback((e) => {
    if (!drawModeRef.current || !frameNativeRef.current || !curStrokeRef.current) return;
    e.preventDefault();
    const rect = frameNativeRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    curStrokeRef.current.points.push([x, y]);
    curPathDRef.current += ` L${x} ${y}`;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', curPathDRef.current);
    }
    requestDrawRefresh();
  }, [requestDrawRefresh]);

  const onDrawEnd = React.useCallback((e) => {
    if (e?.pointerId != null && e.currentTarget?.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    if (curStrokeRef.current && curStrokeRef.current.points.length > 1) {
      const stroke = curStrokeRef.current;
      setDrawStrokes((p) => [...p.filter(Boolean), stroke]);
    }
    curStrokeRef.current = null;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', '');
    }
  }, [setDrawStrokes]);
  const undoStroke = () => setDrawStrokes((p) => p.slice(0, -1));
  const clearDraw = () => setDrawStrokes([]);


  const previewContainerRef = React.useRef(null);
  const frameNativeRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(mobile ? 1.0 : 1.4);

  React.useEffect(() => {
    const fit = () => {
      if (!previewContainerRef.current || !frameNativeRef.current) return;
      const cW = previewContainerRef.current.clientWidth - 40;
      const cH = previewContainerRef.current.clientHeight - 40;
      const fW = frameNativeRef.current.offsetWidth;
      const fH = frameNativeRef.current.offsetHeight;
      if (!fW || !fH) return;
      const maxS = mobile ? 1.05 : 1.5;
      const s = Math.min(maxS, cW / fW, cH / fH);
      setZoom(Math.max(0.2, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (previewContainerRef.current) ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [layout, mobile]);

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.2, +(z - 0.15).toFixed(2)));

  const resolveFrameTemplate = (layout) => {
    if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
      return window.getFrameTemplateSafe(layout);
    }
    if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
      return window.getFrameTemplate(layout);
    }
    console.error('[IMMM] frame-system not ready: getFrameTemplate missing');
    return null;
  };

  const zoomControls =
  <div style={{
    position: 'absolute',
    bottom: 18,
    right: 18,
    display: 'flex',
    gap: 10,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <button onClick={zoomOut} style={zoomBtnStyle} aria-label="Zoom out">
      <ZoomMinusIcon />
    </button>
    <button onClick={zoomIn} style={zoomBtnStyle} aria-label="Zoom in">
      <ZoomPlusIcon />
    </button>
  </div>;


  const compositionCanvasRef = React.useRef(null);
  const renderSeqRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      if (cancelled || !compositionCanvasRef.current || !fontsReady) return;
      const cvs = compositionCanvasRef.current;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;
      const seq = ++renderSeqRef.current;
      const template = resolveFrameTemplate(layout);
      if (!template) {
        console.warn('[IMMM] skip draw: frame template unavailable', layout);
        return;
      }
      const baseW = template.canvasSize.width;
      const baseH = template.canvasSize.height;

      const data = {
        layout, shots, selected, filter, frameColor,
        stickers, drawStrokes: [...drawStrokes, curStrokeRef.current],
        logo, dateText, accent, orientation
      };

      // Render to offscreen canvas to prevent tearing/flickering
      const off = document.createElement('canvas');
      off.width = baseW;
      off.height = baseH;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;

      const renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (renderComp) {
        await renderComp(offCtx, data, { scale: 1 });
      } else {
        console.warn('[IMMM] skip render: renderComposition missing');
      }

      if (cancelled || seq !== renderSeqRef.current) return;

      cvs.width = baseW;
      cvs.height = baseH;
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.drawImage(off, 0, 0);
    };
    // RAF-only: avoids double render per dependency change
    const raf = requestAnimationFrame(draw);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [fontsReady, layout, shots, selected, filter, frameColor, stickers, drawStrokes, drawVersion, logo, dateText, accent, orientation, drawMode]);

  const frameW = layout === 'strip' || layout === 'trip' ? 180 : 220;

  // Compute ratio of CSS displayed size to native canvas size.
  // composition canvas renders at native baseW×baseH, but CSS displays at frameW wide.
  // hitbox bounds (in CSS px) = native bounds × (cssSize / nativeSize).
  // Do NOT use getBoundingClientRect here — it reflects zoom transform.
  const decoScale = React.useMemo(() => {
    const resolveFrameTemplate = (l) => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') return window.getFrameTemplateSafe(l);
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') return window.getFrameTemplate(l);
      return null;
    };
    const tmpl = resolveFrameTemplate(layout);
    const baseW = tmpl?.canvasSize?.width || 880;
    const baseH = tmpl?.canvasSize?.height || 1070;
    const cssW = frameW;
    const cssH = frameW * (baseH / baseW);
    return { x: cssW / baseW, y: cssH / baseH };
  }, [layout, frameW]);

  const preview =
  <div ref={previewContainerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div ref={frameNativeRef} style={{ width: frameW, transform: `scale(${zoom})`, transformOrigin: 'center', position: 'relative', flexShrink: 0, touchAction: drawMode ? 'none' : 'auto' }}
        onPointerDown={onDrawStart}
        onPointerMove={onDrawMove}
        onPointerUp={onDrawEnd}
        onPointerCancel={onDrawEnd}>
        
        <canvas ref={compositionCanvasRef} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', borderRadius: 4 }} />

        <StickerCanvas T={T} stickers={stickers} setStickers={setStickers} selectedId={selStId} setSelectedId={setSelStId}
          mode="deco-overlay" hideVisuals={true} decoScale={decoScale} width="100%" height="100%" canvasW={frameW} style={{ position: 'absolute', inset: 0 }}>
        </StickerCanvas>
      </div>
      {zoomControls}
    </div>;


  // Sticker layer controls (only when one is selected)
  const selSticker = stickers.find((s) => s.id === selStId);
  const layerBar = selSticker &&
  <div style={{ display: 'flex', gap: 6, padding: 8, background: 'rgba(26,26,31,0.05)', borderRadius: 14, marginBottom: 12 }}>
      <button onClick={() => setStickers((p) => bringForward(p, selStId))} style={chipBtn(T)}>Forward ↑</button>
      <button onClick={() => setStickers((p) => sendBackward(p, selStId))} style={chipBtn(T)}>Back ↓</button>
      <button onClick={() => setStickers((p) => p.map((s) => s.id === selStId ? { ...s, rotation: (s.rotation || 0) - 15 } : s))} style={chipBtn(T)}>⟲</button>
      <button onClick={() => setStickers((p) => p.map((s) => s.id === selStId ? { ...s, rotation: (s.rotation || 0) + 15 } : s))} style={chipBtn(T)}>⟳</button>
      <button onClick={() => setStickers((p) => p.filter((s) => s.id !== selStId))} style={{ ...chipBtn(T), background: T.pinkDeep, color: '#fff' }}>Remove</button>
    </div>;


  const [setlogTime, setSetlogTime] = React.useState(() => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [setlogCaption, setSetlogCaption] = React.useState('');
  const [setlogTheme, setSetlogTheme] = React.useState('white'); // white | black
  const [expandedPacks, setExpandedPacks] = React.useState({});


  const addSetlog = () => {
    setStickers((p) => [...p, makeSticker('setlog', { time: setlogTime, caption: setlogCaption, theme: setlogTheme }, { rotation: 0 })]);
  };

  const stickerTab =
  <div>
      {/* 셋로그 스티커 */}
      <Kick T={T}>TIME · 시간 기록</Kick>
      <div style={{ marginTop: 8, background: 'rgba(26,26,31,0.04)', borderRadius: 16, padding: '10px 12px' }}>
        {/* Row 1: Theme & Preview */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 7 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.inkSoft, textTransform: 'uppercase', letterSpacing: 0.3 }}>Theme</div>
          <button onClick={() => setSetlogTheme('white')} style={{ width: 18, height: 18, borderRadius: 5, background: '#fff', border: setlogTheme === 'white' ? `2px solid ${T.ink}` : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }} />
          <button onClick={() => setSetlogTheme('black')} style={{ width: 18, height: 18, borderRadius: 5, background: '#000', border: setlogTheme === 'black' ? `2px solid ${T.ink}` : '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }} />
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 15, fontWeight: 800, color: T.ink, fontFamily: '"Plus Jakarta Sans",system-ui' }}>{setlogTime}</div>
        </div>
        {/* Row 2: Inputs & Add */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input type="time" value={setlogTime} onChange={(e) => setSetlogTime(e.target.value)}
            style={{ width: mobile ? 70 : 82, padding: '6px 3px', borderRadius: 9, border: 'none',
              background: 'rgba(26,26,31,0.07)', fontSize: 11, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui',
              color: '#1A1A1F', outline: 'none' }} />
          <input value={setlogCaption} onChange={(e) => setSetlogCaption(e.target.value)}
            placeholder="멘트..." maxLength={14}
            style={{ flex: 1, minWidth: 0, padding: '6px 7px', borderRadius: 9, border: 'none',
              background: 'rgba(26,26,31,0.07)', fontSize: 11.5, fontFamily: 'Pretendard,system-ui',
              color: '#1A1A1F', outline: 'none' }} />
          <button onClick={addSetlog} style={{ padding: mobile ? '6px 9px' : '7px 14px', background: T.ink, color: T.bg, border: 'none',
            borderRadius: 9, fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans",system-ui',
            flexShrink: 0 }}>Add</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <Kick T={T}>Stickers · 스티커</Kick>
        <button onClick={() => fileRef.current?.click()} style={{
        padding: '6px 10px', background: T.ink, color: T.bg, border: 'none', borderRadius: 999,
        fontSize: 11, cursor: 'pointer', fontWeight: 600
      }}>+ Upload</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </div>
      {layerBar}
      {getStickerPickerPacks().map(([k, pack]) =>
    <div key={k} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 6 }}>
            {pack.name} · {pack.ko}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
            {(expandedPacks[k] ? pack.items : pack.items.slice(0, 5)).map((it) =>
              <button key={it.id} onClick={() => addPreset(it.id)} style={{
                padding: 10, background: T.card, border: 'none', borderRadius: 12,
                boxShadow: '0 0 0 1px rgba(26,26,31,0.06)', cursor: 'pointer',
                minHeight: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>
                <div style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', writingMode: 'horizontal-tb', whiteSpace: 'nowrap' }}>
                  {renderLibSticker(it, 0.62)}
                </div>
              </button>
            )}
            {!expandedPacks[k] && pack.items.length > 5 && (
              <button onClick={() => setExpandedPacks(p => ({ ...p, [k]: true }))} style={{
                padding: 10, background: 'rgba(26,26,31,0.04)', border: 'none', borderRadius: 12,
                color: T.inkSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                minHeight: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
              }}>+{pack.items.length - 5}</button>
            )}
          </div>
        </div>
    )}
    </div>;


  const drawTab =
  <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Kick T={T}>Draw · 낙서</Kick>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={undoStroke} style={chipBtn(T)}>Undo</button>
          <button onClick={clearDraw} style={chipBtn(T)}>Clear</button>
        </div>
      </div>
      <button onClick={toggleDrawMode} style={{
      marginTop: 10, width: '100%', padding: '12px', borderRadius: 14, border: 'none',
      background: drawMode ? T.ink : 'rgba(26,26,31,0.06)',
      color: drawMode ? T.bg : T.ink, fontWeight: 600, fontSize: 13, cursor: 'pointer'
    }}>{drawMode ? 'Drawing ON · 그리는 중' : 'Start drawing · 그리기'}</button>
      <div style={{ marginTop: 14, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 8 }}>Brush · 브러시</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setDrawBrush('pen')} style={{
        flex: 1, padding: '10px', borderRadius: 12, border: 'none',
        background: drawBrush === 'pen' ? T.ink : 'rgba(26,26,31,0.06)',
        color: drawBrush === 'pen' ? T.bg : T.ink, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
      }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 14l4-4 8-8-2-2-8 8-4 4 2 2z" fill="currentColor" /></svg>
          Pen
        </button>
        <button onClick={() => setDrawBrush('sparkle')} style={{
        flex: 1, padding: '10px', borderRadius: 12, border: 'none',
        background: drawBrush === 'sparkle' ? T.ink : 'rgba(26,26,31,0.06)',
        color: drawBrush === 'sparkle' ? T.bg : T.ink, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
      }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 0v5M8 11v5M0 8h5M11 8h5M2 2l3 3M11 11l3 3M2 14l3-3M11 5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Sparkle
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 8 }}>Width · 굵기</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="range" min="1" max="8" step="0.5" value={drawWidth} onChange={(e) => setDrawWidth(parseFloat(e.target.value))}
      style={{ flex: 1, accentColor: T.pinkDeep }} />
        <div style={{ fontSize: 12, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{drawWidth}px</div>
      </div>
      
      <div style={{ marginTop: 14, fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 8 }}>Color · 색상</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['#D98893', '#FF5577', '#1A1A1F', '#FFFFFF', '#FFD94A', '#5CC2FF', '#69D66B', '#B684E8'].map((c) =>
      <button key={c} onClick={() => setDrawColor(c)} style={{
        width: 30, height: 30, borderRadius: 999, background: c, border: 'none', cursor: 'pointer',
        boxShadow: drawColor === c ? '0 0 0 2px ' + T.ink + ', 0 0 0 3px ' + T.bg : '0 0 0 1px rgba(0,0,0,0.1)'
      }} />
      )}
      </div>
    </div>;


  const textTab =
  <div>
      <Kick T={T}>Add text · 텍스트</Kick>
      <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type something..."
    style={{ marginTop: 10, width: '100%', padding: '12px 14px', borderRadius: 14, border: 'none',
      background: 'rgba(26,26,31,0.05)', fontSize: 14, fontFamily: 'Pretendard,system-ui' }} />
      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['#D98893', '#FF5577', '#1A1A1F', '#FFD94A'].map((c) =>
      <button key={c} onClick={() => setDrawColor(c)} style={{
        width: 26, height: 26, borderRadius: 999, background: c, border: 'none', cursor: 'pointer',
        boxShadow: drawColor === c ? '0 0 0 2px ' + T.ink : '0 0 0 1px rgba(0,0,0,0.1)'
      }} />
      )}
      </div>
      <button onClick={addText} style={{
      marginTop: 12, width: '100%', padding: 12, borderRadius: 14, border: 'none',
      background: T.ink, color: T.bg, fontWeight: 600, fontSize: 13, cursor: 'pointer'
    }}>Add to frame</button>
    </div>;


  const tabContent = tab === 'stickers' ? stickerTab : tab === 'draw' ? drawTab : textTab;

  const tabBar =
  <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.line}`, marginBottom: 16 }}>
      {[['stickers', 'Stickers'], ['draw', 'Draw'], ['text', 'Text']].map(([k, en]) =>
    <button key={k} onClick={() => setTab(k)} style={{
      flex: 1, padding: '14px 8px', border: 'none', borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
      background: 'transparent', color: tab === k ? T.ink : T.inkSoft,
      fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 1.5, textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui', marginBottom: -1
    }}>{en}</button>
    )}
    </div>;


  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column' }}>
        {/* Sticky top bar */}
        <div style={{ flexShrink: 0, background: T.bg, paddingTop: 'calc(var(--sat) + 12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <button onClick={() => go('select')} style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              color: T.ink, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
              fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 2L4 8l6 6"/></svg>
              Back
            </button>
            <StepDots step={3} T={T} />
            <BtnPrimary T={T} size="sm" onClick={() => go('result')}>Done</BtnPrimary>
          </div>
        </div>

        {/* Scrollable body: frame preview (sticky) + tools */}
        <div style={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          {/* Frame preview — sticky so it stays visible while scrolling tools */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: T.bgAlt,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '12px 16px', height: 280 }}>
            {preview}
          </div>

          {/* Tools panel */}
          <div style={{ background: T.bg, padding: '0 16px 60px' }}>
            <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.1)', margin: '10px auto 0' }} />
            {tabBar}
            {tabContent}
          </div>
        </div>
      </div>);
  }
  return (
    <div style={{ height: '100%', background: T.bg, display: 'grid', gridTemplateColumns: '1fr 380px' }}>
      <div style={{ padding: '24px 48px', display: 'flex', flexDirection: 'column' }}>
        <TopBar step={3} back={() => go('select')} T={T} title="Step 4 · Deco Studio"
        right={<BtnPrimary T={T} size="md" onClick={() => go('result')}>Finish · 완료  {I.arrowR(14, T.bg)}</BtnPrimary>} />
        <div style={{ flex: 1, background: T.bgAlt, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {preview}
          <div style={{ position: 'absolute', top: 16, left: 18, display: 'flex', gap: 6 }}>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Frame: {layout} · locked</div>
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Filter: {(FILTERS[filter] || FILTERS.smooth).name} · locked</div>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(0,0,0,0.07)', padding: '24px 22px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tabBar}
        <div style={{ flex: 1 }}>{tabContent}</div>
      </div>
    </div>
  );
}

function chipBtn(T) {return {
    padding: '6px 10px', fontSize: 11, borderRadius: 999,
    background: 'rgba(26,26,31,0.06)', color: T.ink, border: 'none', cursor: 'pointer', fontWeight: 600
  };}

// ═══════════════════════════════════════════════════════════════
// RESULT
// ═══════════════════════════════════════════════════════════════
function ResultV2({ T, go, mobile, variant, shots, selected, filter, layout, orientation, stickers, drawStrokes, logo, dateText, accent, frameColor }) {
  const shotCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(layout)
    : (layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4);
  const shotsForFrame = shots;
  const freeStickers = stickers.filter((s) => s.frameSlot == null);
  const slottedMap = {};
  stickers.filter((s) => s.frameSlot != null).forEach((s) => {
    if (!slottedMap[s.frameSlot]) slottedMap[s.frameSlot] = [];
    slottedMap[s.frameSlot].push(s);
  });


  const compositionCanvasRef = React.useRef(null);

  React.useEffect(() => {
    const resolveFrameTemplate = (layout) => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
        return window.getFrameTemplateSafe(layout);
      }
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
        return window.getFrameTemplate(layout);
      }
      console.error('[IMMM] frame-system not ready: getFrameTemplate missing');
      return null;
    };
    const draw = async () => {
      if (!compositionCanvasRef.current) return;
      const cvs = compositionCanvasRef.current;
      const ctx = cvs.getContext('2d');
      const template = resolveFrameTemplate(layout);
      if (!template) {
        console.warn('[IMMM] skip draw: frame template unavailable', layout);
        return;
      }
      cvs.width = template.canvasSize.width;
      cvs.height = template.canvasSize.height;

      const data = {
        layout, shots, selected, filter, frameColor,
        stickers, drawStrokes, logo, dateText, accent, orientation
      };
      const renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (renderComp) await renderComp(ctx, data, { scale: 1 });
    };
    draw();
  }, [layout, shots, selected, filter, frameColor, stickers, drawStrokes, logo, dateText, accent, orientation]);

  const resultFrame = (scale) => (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', position: 'relative' }}>
      <div ref={captureRef} style={{ position: 'relative', display: 'inline-block' }}>
        <canvas ref={compositionCanvasRef} style={{ width: 180 * (layout==='strip'||layout==='trip'?1:1.2), height: 'auto', display: 'block', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', borderRadius: 4 }} />
      </div>
    </div>
  );

  const containerRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const captureRef = React.useRef(null);
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const autoSavedRef = React.useRef(false);

  const addToast = (msg, duration = 2500) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  };

  const getFormattedFilename = () => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png`;
  };
  const exportBlobRef = React.useRef({ key: null, blob: null });

  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const saveResultToGallery = async (blob, source = 'local', shareInfo = null) => {
    if (!blob || typeof LocalGalleryStore === 'undefined') return;
    try {
      const stableId = [
        'immm',
        layout,
        selected.map((i) => shots[i]?.ts || i).join('-'),
        stickers.length,
        drawStrokes.length,
      ].join('_');
      await LocalGalleryStore.putPhoto({
        id: stableId,
        createdAt: Date.now(),
        source,
        blob,
        layout,
        frameType: (() => {
          const getTpl = window.getFrameTemplateSafe || window.getFrameTemplate || (typeof getFrameTemplate === 'function' ? getFrameTemplate : null);
          return getTpl ? getTpl(layout).type : layout;
        })(),
        filter,
        shareInfo,
        metadata: { selected, stickerCount: stickers.length, drawCount: drawStrokes.length },
      });
    } catch (e) {
      console.warn('[IMMM] Local gallery save failed:', e);
    }
  };

  const getExportKey = () => [
    layout,
    frameColor,
    logo ? 'logo' : 'nologo',
    dateText ? 'date' : 'nodate',
    selected.map((i) => shots[i]?.ts || shots[i]?.dataUrl?.slice(0, 32) || i).join('-'),
    stickers.map((s) => `${s.id}:${s.x}:${s.y}:${s.scale}:${s.rotation}:${s.frameSlot ?? 'free'}`).join('|'),
    drawStrokes.length,
  ].join('::');

  const drawCover = (ctx, img, x, y, w, h) => {
    const ar = img.width / img.height;
    const dar = w / h;
    let sx, sy, sw, sh;
    if (ar > dar) { sh = img.height; sw = sh * dar; sx = (img.width - sw) / 2; sy = 0; }
    else           { sw = img.width;  sh = sw / dar; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const drawStickerToCanvas = async (ctx, s, baseW, baseH, S) => {
    ctx.save();
    const cx = (s.x / 100) * baseW;
    const cy = (s.y / 100) * baseH;
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation || 0) * Math.PI / 180);
    ctx.scale(s.scale || 1, s.scale || 1);

    if (s.kind === 'preset') {
      const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(s.payload.libId) : null;
      if (item) {
        if (item.type === 'burst') {
          const w = (item.w || 90) * S, h = (item.h || 70) * S;
          const fs = (item.fs || 11) * S;
          const rO = Math.min(w, h) / 2 - 2 * S, rI = rO * 0.74;
          const N = 14;
          ctx.beginPath();
          for (let i = 0; i < N * 2; i++) {
            const r = i % 2 === 0 ? rO : rI;
            const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = item.tc;
          ctx.font = `900 ${fs}px Pretendard, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, fs * 0.1);
        } else if (item.type === 'cloud') {
          const w = (item.w || 100) * S, h = (item.h || 60) * S;
          const fs = (item.fs || 11) * S;
          ctx.beginPath();
          // Simplified cloud path for canvas
          ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = item.tc;
          ctx.font = `800 ${fs}px Pretendard, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, 0);
        } else if (item.type === 'mini') {
          const sz = 44 * S;
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
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
            ctx.closePath();
            ctx.fill(); ctx.stroke();
          } else if (item.kind === 'dot') {
            ctx.beginPath(); ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2); ctx.fill();
          } else if (item.kind === 'sparkle') {
            ctx.beginPath();
            ctx.moveTo(0, -sz / 2); ctx.lineTo(0, sz / 2);
            ctx.moveTo(-sz / 2, 0); ctx.lineTo(sz / 2, 0);
            ctx.stroke();
          }
        } else if (item.type === 'text') {
          const fs = item.size * S;
          ctx.fillStyle = item.color;
          ctx.font = `${fs}px Caveat, cursive`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, 0);
        }
      }
    } else if (s.kind === 'upload') {
      const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = s.payload.dataUrl; });
      if (img) {
        const w = 120 * S;
        ctx.drawImage(img, -w / 2, -(w / (img.width / img.height)) / 2, w, w / (img.width / img.height));
      }
    } else if (s.kind === 'text') {
      const fs = s.payload.size * S;
      ctx.fillStyle = s.payload.color;
      ctx.font = `600 ${fs}px Pretendard, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.payload.text, 0, 0);
    } else if (s.kind === 'setlog') {
      const { time, caption, theme } = s.payload;
      const fg = theme === 'white' ? '#fff' : '#000';
      const shadow = theme === 'white' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
      ctx.shadowColor = shadow; ctx.shadowBlur = 4 * S;
      ctx.fillStyle = fg;
      ctx.font = `800 ${28 * S}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(time, 0, 0);
      if (caption) {
        ctx.font = `600 ${12 * S}px Pretendard, sans-serif`;
        ctx.globalAlpha = 0.8;
        ctx.fillText(caption, 0, 32 * S);
      }
    }
    ctx.restore();
  };

  const captureFrameAsBlob = async () => {
    // ── Frame Export Quality Policy ──────────────────────────────────────────
    // Desktop: scale 4.0 (Very High Quality)
    // Mobile: scale 3.0 (High Quality)
    // Memory Fallback: scale 2.0 (Standard Quality)
    // ──────────────────────────────────────────────────────────────────────────
    const targetScale = mobile ? 3 : 4;
    
    const runExport = async (s) => {
      const engine = window.FrameRenderEngine || (typeof FrameRenderEngine !== 'undefined' ? FrameRenderEngine : null);
      if (!engine) return null;
      if (document.fonts) await document.fonts.ready;
      return engine.renderToBlob({
        layout, shots, selected, stickers, drawStrokes,
        logo, dateText, accent, frameColor,
        scale: s
      });
    };

    try {
      const blob = await runExport(targetScale);
      if (blob) return blob;
      throw new Error('Null blob');
    } catch (e) {
      console.warn(`[IMMM] Export at scale ${targetScale} failed, falling back to 2.0`, e);
      return runExport(2);
    }
  };

  const getExportBlob = async () => {
    const key = getExportKey();
    if (exportBlobRef.current.key === key && exportBlobRef.current.blob) {
      return exportBlobRef.current.blob;
    }
    const blob = await captureFrameAsBlob();
    if (!blob) throw new Error('Export failed');
    exportBlobRef.current = { key, blob };
    return blob;
  };

  React.useEffect(() => {
    if (autoSavedRef.current) return;
    autoSavedRef.current = true;
    const selectedShots = selected.map((i) => shots[i]?.ts || shots[i]?.dataUrl?.slice(0, 28) || i).join('|');
    const key = `immm.gallery.autosaved.${layout}.${selectedShots}.${stickers.length}.${drawStrokes.length}`;
    if (localStorage.getItem(key)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await getExportBlob();
        if (!cancelled && blob) {
          await saveResultToGallery(blob, 'local');
          localStorage.setItem(key, '1');
        }
      } catch (e) {
        console.warn('[IMMM] Auto gallery save failed:', e);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await getExportBlob();
      const fname = getFormattedFilename();
      const file = new File([blob], fname, { type: 'image/png' });
      await saveResultToGallery(blob, 'local');
      
      const url = URL.createObjectURL(blob);
      if (isIOS()) {
        if (saveSheetUrl) URL.revokeObjectURL(saveSheetUrl);
        setSaveSheetUrl(url);
        addToast('이미지를 길게 눌러 저장하세요');
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = fname;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        addToast('저장 완료');
        if (typeof confetti !== 'undefined') confetti({ particleCount:90, spread:65, origin:{y:0.55}, colors:['#D98893','#F4C4C8','#FDE8EA','#fff','#FAD4D8'] });
      }
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch(e) { console.error(e); }
    setDownloading(false);
  };

  const handleShare = async () => {
    try {
      const blob = await getExportBlob();
      const fname = getFormattedFilename();
      const file = new File([blob], fname, { type: 'image/png' });
      await saveResultToGallery(blob, 'local');
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        addToast('공유 준비 완료');
        await navigator.share({
          files: [file],
          title: 'IMMM · Photobooth',
          text: '한 장에 담는 순간들. 나만의 포토부스 IMMM.',
        });
      } else {
        addToast('공유 미지원 → 저장으로 대체');
        handleDownload();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed:', e);
    }
  };

  const handleQrShare = async () => {
    alert('QR 공유는 현재 미구현입니다. Supabase 연결 후 공개 링크/만료 정책까지 붙여서 열겠습니다.');
  };

  // ── video download — current frame shots, flash transitions, 24fps film feel ──
  const [videoRecording, setVideoRecording] = React.useState(false);
  const videoSupported = typeof MediaRecorder !== 'undefined' &&
    (typeof HTMLCanvasElement.prototype.captureStream !== 'undefined' ||
     typeof HTMLCanvasElement.prototype.mozCaptureStream !== 'undefined');

  const handleVideoDownload = async () => {
    if (videoRecording) return;
    if (!videoSupported) {
      alert('이 브라우저에서는 영상 저장이 지원되지 않아요. (Chrome 권장)');
      return;
    }
    const selectedShots = selected.map((shotIndex) => shots[shotIndex]).filter(s => s?.dataUrl);
    if (!selectedShots.length) { alert('먼저 사진을 촬영해주세요'); return; }
    setVideoRecording(true);

    const resolveFrameTemplate = (layout) => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
        return window.getFrameTemplateSafe(layout);
      }
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
        return window.getFrameTemplate(layout);
      }
      console.error('[IMMM] frame-system not ready: getFrameTemplate missing');
      return null;
    };
    const template = resolveFrameTemplate(layout);
    if (!template) {
      console.warn('[IMMM] skip draw: frame template unavailable', layout);
      return;
    }
    const baseW = template?.canvasSize?.width || 720;
    const baseH = template?.canvasSize?.height || 960;
    const W = 720;
    const H = Math.round(W * (baseH / baseW));
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');

    const mimeTypes = ['video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const stream = cvs.captureStream(24);
    const rec = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = async () => {
      if (!chunks.length) { setVideoRecording(false); return; }
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const fname = `IMMM_${Date.now()}.${ext}`;
      // Mobile: try Web Share API first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fname, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'IMMM Video' });
            setVideoRecording(false); return;
          } catch(e2) {
            if (e2.name === 'AbortError') { setVideoRecording(false); return; }
          }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setVideoRecording(false);
    };

    const drawCanvasCover = (source) => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      const scale = Math.min(W / source.width, H / source.height);
      const dw = source.width * scale;
      const dh = source.height * scale;
      ctx.drawImage(source, (W - dw) / 2, (H - dh) / 2, dw, dh);
    };

    const renderProgressFrame = async (count) => {
      const engine = window.FrameRenderEngine || (typeof FrameRenderEngine !== 'undefined' ? FrameRenderEngine : null);
      if (engine) {
        const progressiveShots = shots.map((shot, index) => {
          const order = selected.indexOf(index);
          return order >= 0 && order < count ? shot : null;
        });
        return engine.renderToCanvas({
          layout,
          shots: progressiveShots,
          selected,
          stickers: count >= selected.length ? stickers : [],
          drawStrokes: count >= selected.length ? drawStrokes : [],
          logo,
          dateText,
          accent,
          frameColor,
          scale: 1.5,
        });
      }
      const fallback = document.createElement('canvas');
      fallback.width = W;
      fallback.height = H;
      const fctx = fallback.getContext('2d');
      fctx.fillStyle = frameColor || '#fff';
      fctx.fillRect(0, 0, W, H);
      return fallback;
    };

    const paintWait = async ms => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        ctx.fillStyle = `rgba(0,0,0,0.001)`;
        ctx.fillRect(0,0,1,1); // Force repaint
        const track = stream.getVideoTracks()[0];
        if (track && track.requestFrame) track.requestFrame();
        await new Promise(r => requestAnimationFrame(r));
      }
    };

    rec.start(200); // 200ms timeslice — collect chunks progressively

    for (let i = 0; i < selected.length; i++) {
      // white flash in
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      await paintWait(60);

      const frameCanvas = await renderProgressFrame(i + 1);
      drawCanvasCover(frameCanvas);

      // shot number badge
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.font = '700 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${String(i+1).padStart(2,'0')} / ${String(selected.length).padStart(2,'0')}`, 18, 18);

      await paintWait(1200);

      // brief white flash out before next
      if (i < selected.length - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(0, 0, W, H);
        await paintWait(50);
      }
    }

    const finalFrame = await renderProgressFrame(selected.length);
    drawCanvasCover(finalFrame);
    await paintWait(800);

    rec.stop();
  };

  React.useEffect(() => {
    const compute = () => {
      if (!containerRef.current || !frameRef.current) return;
      const cW = containerRef.current.clientWidth - 32;
      const cH = containerRef.current.clientHeight - 32;
      const fW = frameRef.current.scrollWidth;
      const fH = frameRef.current.scrollHeight;
      if (!fW || !fH) return;
      const maxS = mobile ? 1.0 : 1.3;
      const s = Math.min(maxS, cW / fW, cH / fH);
      setAutoScale(Math.max(0.2, s));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [layout, mobile]);

  const resultOverlays = (
    <>
      {saveSheetUrl && (
        <div onClick={() => { URL.revokeObjectURL(saveSheetUrl); setSaveSheetUrl(null); }}
          style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(10,10,10,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width:'min(92vw,420px)', background:'#fff', borderRadius:20, padding:18, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
            <img src={saveSheetUrl} style={{ width:'100%', maxHeight:'60vh', objectFit:'contain', borderRadius:12, background:'#f4f4f4' }} />
            <div style={{ marginTop:14, fontSize:15, fontWeight:800, color:'#111', fontFamily:'Pretendard,system-ui' }}>이미지를 길게 눌러 저장하세요</div>
            <div style={{ marginTop:5, fontSize:12, color:'#777', lineHeight:1.4, fontFamily:'Pretendard,system-ui' }}>iPhone Safari/PWA에서는 다운로드 버튼보다 공유 또는 길게 눌러 저장이 안정적입니다.</div>
            <button onClick={() => { URL.revokeObjectURL(saveSheetUrl); setSaveSheetUrl(null); }} style={{ marginTop:14, width:'100%', padding:'13px 16px', borderRadius:12, border:'none', background:'#111', color:'#fff', fontWeight:800, cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}
      {qrShare && (
        <div onClick={() => setQrShare(null)}
          style={{ position:'fixed', inset:0, zIndex:99998, background:'rgba(10,10,10,0.78)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width:'min(90vw,360px)', background:'#fff', borderRadius:20, padding:20, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
            {qrShare.qrDataUrl ? <img src={qrShare.qrDataUrl} style={{ width:220, height:220, imageRendering:'pixelated' }} /> :
              <div style={{ width:220, height:220, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f3f3', borderRadius:12, fontSize:12, color:'#777', wordBreak:'break-all', padding:14 }}>{qrShare.qrUrl || qrShare.url}</div>}
            <div style={{ marginTop:10, fontSize:15, fontWeight:900, color:'#111', fontFamily:'Pretendard,system-ui' }}>QR 공유 준비 완료</div>
            <div style={{ marginTop:5, fontSize:12, color:'#777', lineHeight:1.45, fontFamily:'Pretendard,system-ui' }}>
              {qrShare.mode === 'local-preview' ? 'Supabase 설정 전이라 이 기기에서만 열리는 미리보기 링크입니다.' : '7일 동안 열 수 있는 공유 링크입니다.'}
            </div>
            <button onClick={async () => {
              const text = qrShare.qrUrl || qrShare.url;
              try { await navigator.clipboard.writeText(text); } catch (_) {}
            }} style={{ marginTop:14, width:'100%', padding:'13px 16px', borderRadius:12, border:'none', background:'#111', color:'#fff', fontWeight:800, cursor:'pointer' }}>Copy Link</button>
            <button onClick={() => setQrShare(null)} style={{ marginTop:8, width:'100%', padding:'12px 16px', borderRadius:12, border:'none', background:'#f1f1f1', color:'#111', fontWeight:800, cursor:'pointer' }}>Close</button>
          </div>
        </div>
      )}
      {/* Toast Overlay */}
      <div style={{ position: 'fixed', bottom: mobile ? 'calc(var(--sab) + 120px)' : 100, left: '50%', transform: 'translateX(-50%)', zIndex: 100000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ 
            padding: '10px 20px', borderRadius: 999, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 13, fontWeight: 600, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' 
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  );

  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column' }}>
        {resultOverlays}
        {/* Top bar */}
        <div style={{ flexShrink: 0, paddingTop: 'calc(var(--sat) + 12px)', background: T.bg, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px' }}>
            <button onClick={() => go('deco')} style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              color: T.ink, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase',
              fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 2L4 8l6 6"/></svg>
              Back
            </button>
            <StepDots step={4} T={T} />
            <button onClick={() => { localStorage.clear(); go('landing'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkSoft, fontSize: 11, fontFamily: 'Pretendard,system-ui', letterSpacing: 0.5 }}>New</button>
          </div>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ padding: '20px 18px 6px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 28, fontWeight: 500, letterSpacing: -1 }}>
              Your <span style={{ fontFamily: 'Caveat,cursive', color: T.pinkDeep, fontSize: 36 }}>moment</span> is ready.
            </h1>
            <div style={{ marginTop: 4, color: T.inkSoft, fontSize: 13, fontFamily: 'Pretendard,system-ui' }}>Download it, share it, make it Mine.</div>
          </div>
          {/* Frame centered */}
          <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 18px' }}>
            <div ref={frameRef} style={{ display: 'inline-block', animation: 'polaroidReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }}>
              {resultFrame(1)}
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ padding: '0 18px', paddingBottom: 'calc(var(--sab) + 24px)' }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
              <BtnPrimary T={T} size="lg" onClick={handleDownload} style={{ flex: 1, height: 52 }}>
                {downloading ? 'Exporting...' : 'Save · 저장'}
              </BtnPrimary>
              <button onClick={handleShare} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {I.share(20, T.ink)}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => go('deco')} style={{ flex: 1, height: 48, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Redecorate</button>
              <button onClick={() => { localStorage.clear(); go('landing'); }} style={{ flex: 1, height: 48, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.inkSoft, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Retake</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column',
      padding: '24px 56px 24px' }}>
      {resultOverlays}
      <TopBar step={4} back={() => go('deco')} T={T} mobile={false} title="Step 5 · Your strip"
      right={<button onClick={() => {localStorage.clear();go('landing');}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkSoft, fontSize: 12, fontFamily: 'Pretendard,system-ui' }}>New session</button>} />
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 52, fontWeight: 500, letterSpacing: -1.5 }}>
          Your <span style={{ fontFamily: 'Caveat,cursive', color: T.pinkDeep, fontSize: 68 }}>moment</span> is ready.
        </h1>
        <div style={{ marginTop: 4, color: T.inkSoft, fontSize: 15, fontFamily: 'Pretendard,system-ui' }}>Download it, share it, make it Mine.</div>
      </div>

      <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        padding: '12px 0' }}>
        <div ref={frameRef} style={{ display: 'inline-block', animation: 'popIn 0.55s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {resultFrame(autoScale)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <BtnPrimary T={T} size="lg" onClick={handleDownload} style={{ width: 220, height: 56 }}>
          {downloading ? 'Exporting...' : 'Save image · 저장'}
        </BtnPrimary>
        <button onClick={handleShare} style={{ width: 56, height: 56, borderRadius: 16, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {I.share(24, T.ink)}
        </button>
        <div style={{ width: 1, height: 56, background: T.line, margin: '0 8px' }} />
        <button onClick={() => go('deco')} style={{ padding: '0 24px', height: 56, borderRadius: 16, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Redecorate</button>
        <button onClick={() => { localStorage.clear(); go('landing'); }} style={{ padding: '0 24px', height: 56, borderRadius: 16, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.inkSoft, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Retake</button>
      </div>
    </div>);

}

Object.assign(window, { DecoV2, ResultV2 });
