// screens-v2-deco.jsx — Deco Studio + Result

// ═══════════════════════════════════════════════════════════════
// DECO STUDIO — final edit (filter+frame locked)
// ═══════════════════════════════════════════════════════════════
function DecoV2({ T, go, mobile, variant, shots, selected, filter, layout, orientation,
  stickers, setStickers, drawStrokes, setDrawStrokes, logo, dateText, setDateText, accent }) {
  const [tab, setTab] = React.useState('stickers'); // stickers | draw | text
  const [selStId, setSelStId] = React.useState(null);
  const [drawColor, setDrawColor] = React.useState('#D98893');
  const [drawMode, setDrawMode] = React.useState(false);
  const drawModeRef = React.useRef(false);
  const [drawWidth, setDrawWidth] = React.useState(3);
  const [drawBrush, setDrawBrush] = React.useState('pen'); // pen | sparkle
  const [textInput, setTextInput] = React.useState('');
  const fileRef = React.useRef(null);

  const [curStroke, setCurStroke] = React.useState(null);

  const addPreset = (libId) => setStickers((p) => [...p, makeSticker('preset', { libId })]);
  const addUpload = (dataUrl) => setStickers((p) => [...p, makeSticker('upload', { dataUrl }, { scale: 0.6 })]);
  const addText = () => {
    if (!textInput.trim()) return;
    setStickers((p) => [...p, makeSticker('text', { text: textInput, font: 'Caveat', size: 32, color: drawColor })]);
    setTextInput('');
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];if (!f) return;
    const rd = new FileReader();rd.onload = () => addUpload(rd.result);rd.readAsDataURL(f);
  };

  const shotsWithFilter = shots.map((s) => s ? { ...s, filter } : null);

  // Draw handlers
  const toggleDrawMode = () => {
    const next = !drawModeRef.current;
    drawModeRef.current = next;
    setDrawMode(next);
    if (next) setSelStId(null); // deselect stickers when entering draw mode
  };

  const onDrawStart = React.useCallback((e) => {
    if (!drawModeRef.current || !frameNativeRef.current) return;
    e.stopPropagation();
    const rect = frameNativeRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setCurStroke({ color: drawColor, width: drawWidth, brush: drawBrush, points: [[x, y]] });
  }, [drawColor, drawWidth, drawBrush]);

  const onDrawMove = React.useCallback((e) => {
    if (!drawModeRef.current || !curStroke || !frameNativeRef.current) return;
    const rect = frameNativeRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setCurStroke((s) => ({ ...s, points: [...s.points, [x, y]] }));
  }, []);

  const onDrawEnd = React.useCallback(() => {
    setCurStroke((s) => {
      if (s && s.points.length > 1) {
        setDrawStrokes((p) => [...p, s]);
      }
      return null;
    });
  }, [setDrawStrokes]);
  const undoStroke = () => setDrawStrokes((p) => p.slice(0, -1));
  const clearDraw = () => setDrawStrokes([]);

  const pathFor = (stroke) => stroke.points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');

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

  const zoomControls =
  <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6, zIndex: 20 }}>
      <button onClick={zoomOut} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 18, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>−</button>
      <button onClick={zoomIn} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 18, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>+</button>
    </div>;


  const preview =
  <div ref={previewContainerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div ref={frameNativeRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'center', position: 'relative', flexShrink: 0, touchAction: drawMode ? 'none' : 'auto' }}
    onPointerDown={onDrawStart}
    onPointerMove={onDrawMove}
    onPointerUp={onDrawEnd}
    onPointerLeave={onDrawEnd}>
        <StickerCanvas T={T} stickers={stickers} setStickers={setStickers} selectedId={selStId} setSelectedId={setSelStId}
      width={layout === 'strip' || layout === 'trip' ? 180 : 220} height="auto">
          <FrameThumb layout={layout} shots={shotsWithFilter} selected={selected} T={T}
        logo={logo} dateText={dateText} accent={accent} scale={1} orientation={orientation||'portrait'} />
          {/* Draw layer */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {drawStrokes.map((s, i) => renderStroke(s, i))}
            {curStroke && renderStroke(curStroke, 'cur')}
          </svg>
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

  const addSetlog = () => {
    setStickers((p) => [...p, makeSticker('setlog', { time: setlogTime, caption: setlogCaption }, { rotation: 0 })]);
  };

  const stickerTab =
  <div>
      {/* 셋로그 스티커 */}
      <Kick T={T}>TIME · 시간 기록</Kick>
      <div style={{ marginTop: 8, background: 'rgba(26,26,31,0.04)', borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input type="time" value={setlogTime} onChange={(e) => setSetlogTime(e.target.value)}
        style={{ flex: '0 0 auto', padding: '8px 10px', borderRadius: 10, border: 'none',
          background: 'rgba(26,26,31,0.07)', fontSize: 13, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui',
          color: '#1A1A1F', outline: 'none' }} />
          <input value={setlogCaption} onChange={(e) => setSetlogCaption(e.target.value)}
        placeholder="멘트 입력..." maxLength={30}
        style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: 'none',
          background: 'rgba(26,26,31,0.07)', fontSize: 13, fontFamily: 'Pretendard,system-ui',
          color: '#1A1A1F', outline: 'none' }} />
        </div>
        {/* preview */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, background: 'rgba(26,26,31,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1F', lineHeight: 1, fontFamily: '"Plus Jakarta Sans",system-ui' }}>{setlogTime || '00:00'}</div>
            {setlogCaption && <div style={{ fontSize: 11, color: 'rgba(26,26,31,0.7)', marginTop: 2, fontFamily: 'Pretendard,system-ui' }}>{setlogCaption}</div>}
          </div>
          <button onClick={addSetlog} style={{ padding: '10px 16px', background: T.ink, color: T.bg, border: 'none',
          borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans",system-ui',
          letterSpacing: 0.5, flexShrink: 0 }}>추가</button>
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
      {Object.entries(STICKER_CATALOG).map(([k, pack]) =>
    <div key={k} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 6 }}>
            {pack.name} · {pack.ko}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {pack.items.map((it) =>
        <button key={it.id} onClick={() => addPreset(it.id)} style={{
          padding: 10, background: T.card, border: 'none', borderRadius: 12,
          boxShadow: '0 0 0 1px rgba(26,26,31,0.06)', cursor: 'pointer',
          minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{renderLibSticker(it, 0.62)}</button>
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
            <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>Filter: {FILTERS[filter].name} · locked</div>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(0,0,0,0.07)', padding: '24px 22px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tabBar}
        <div style={{ flex: 1 }}>{tabContent}</div>
      </div>
    </div>);

}

function chipBtn(T) {return {
    padding: '6px 10px', fontSize: 11, borderRadius: 999,
    background: 'rgba(26,26,31,0.06)', color: T.ink, border: 'none', cursor: 'pointer', fontWeight: 600
  };}

// ═══════════════════════════════════════════════════════════════
// RESULT
// ═══════════════════════════════════════════════════════════════
function ResultV2({ T, go, mobile, variant, shots, selected, filter, layout, orientation, stickers, drawStrokes, logo, dateText, accent }) {
  const shotsWithFilter = shots.map((s) => s ? { ...s, filter } : null);
  const pathFor = (stroke) => stroke.points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1]).join(' ');

  const renderStroke = (stroke, key) => {
    if (stroke.brush === 'sparkle') {
      const step = 8;
      const sparkles = [];
      for (let i = 0; i < stroke.points.length; i += step) {
        const [x, y] = stroke.points[i];
        const s = (stroke.width || 3) * 1.5;
        sparkles.push(
          <g key={i} transform={`translate(${x},${y})`}>
            <path d={`M0,-${s} L${s * 0.25},-${s * 0.25} L${s},0 L${s * 0.25},${s * 0.25} L0,${s} L-${s * 0.25},${s * 0.25} L-${s},0 L-${s * 0.25},-${s * 0.25} Z`}
            fill={stroke.color} opacity="0.8" />
          </g>
        );
      }
      return <g key={key}>{sparkles}</g>;
    }
    return <path key={key} d={pathFor(stroke)} stroke={stroke.color} strokeWidth={stroke.width} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />;
  };

  const resultFrame = (scale) =>
  <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', position: 'relative' }}>
      <div ref={captureRef} style={{ position: 'relative', display: 'inline-block' }}>
        <FrameThumb layout={layout} shots={shotsWithFilter} selected={selected} T={T}
      logo={logo} dateText={dateText} accent={accent} scale={1} stickers={[]} orientation={orientation||'portrait'} />
        {/* Place stickers as static overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {stickers.map((s) =>
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg) scale(${s.scale || 1})`, zIndex: (s.z || 0) + 1 }}>
              {renderStickerInstance(s)}
            </div>
        )}
        </div>
        {drawStrokes.length > 0 &&
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {drawStrokes.map((s, i) => renderStroke(s, i))}
          </svg>
      }
      </div>
    </div>;


  const containerRef = React.useRef(null);
  const frameRef = React.useRef(null);
  const captureRef = React.useRef(null);
  const [autoScale, setAutoScale] = React.useState(mobile ? 1.0 : 1.3);
  const [downloading, setDownloading] = React.useState(false);

  // ── canvas cover helper ──
  const drawCover = (ctx, img, x, y, w, h) => {
    const ar = img.width / img.height;
    const dar = w / h;
    let sx, sy, sw, sh;
    if (ar > dar) { sh = img.height; sw = sh * dar; sx = (img.width - sw) / 2; sy = 0; }
    else           { sw = img.width;  sh = sw / dar; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  // ── image download — pure canvas, no html2canvas ──
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const S = 4;
      const isNarrow = layout === 'strip' || layout === 'trip';
      const FRAME_W = (isNarrow ? 160 : 220) * S;
      const PAD = 10 * S, GAP = 6 * S;
      const photoW = FRAME_W - PAD * 2;
      const numSlots = layout === 'trip' ? 3 : 4;
      const cols = (layout === 'grid' || layout === 'layered') ? 2 : 1;
      const colW = cols === 2 ? (photoW - GAP) / 2 : photoW;
      const photoAr = cols === 2 ? 1 : 4/3;
      const photoH = colW / photoAr;
      const rows = Math.ceil(numSlots / cols);
      const logoH = logo ? PAD * 2.5 : 0;
      const dateH = dateText ? PAD * 2.5 : 0;
      const contentH = rows * photoH + (rows - 1) * GAP;
      const FRAME_H = PAD + logoH + contentH + dateH + PAD;

      const cvs = document.createElement('canvas');
      cvs.width = FRAME_W; cvs.height = FRAME_H;
      const ctx = cvs.getContext('2d');

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);

      let curY = PAD;

      if (logo) {
        ctx.fillStyle = '#1A1A1F';
        ctx.font = `700 ${8*S}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText('IMMM', PAD, curY + 2*S);
        ctx.fillStyle = accent || '#D98893';
        ctx.beginPath();
        ctx.arc(FRAME_W - PAD - 4*S, curY + 6*S, 4*S, 0, Math.PI*2);
        ctx.fill();
        curY += logoH;
      }

      // load images
      const slotIndices = Array.from({length: numSlots}, (_,i) => selected[i]);
      const imgs = await Promise.all(slotIndices.map(idx => {
        const s = shots[idx];
        if (!s?.dataUrl) return Promise.resolve(null);
        return new Promise(res => { const img = new Image(); img.onload = ()=>res(img); img.onerror=()=>res(null); img.src = s.dataUrl; });
      }));

      // draw tiles
      for (let i = 0; i < numSlots; i++) {
        const row = Math.floor(i / cols), col = i % cols;
        const x = PAD + col * (colW + GAP);
        const y = curY + row * (photoH + GAP);
        ctx.fillStyle = '#ddd';
        ctx.fillRect(x, y, colW, photoH);
        if (imgs[i]) {
          ctx.filter = FILTERS[filter]?.css || 'none';
          drawCover(ctx, imgs[i], x, y, colW, photoH);
          ctx.filter = 'none';
        }
      }

      curY += contentH;

      if (dateText) {
        ctx.fillStyle = '#333';
        ctx.font = `${13*S}px Caveat, cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}), FRAME_W/2, curY + 6*S);
      }

      const blob = await new Promise(res => cvs.toBlob(res, 'image/png'));
      if (!blob) throw new Error('toBlob failed');

      // iOS 15+ / Android Chrome: Web Share API with file — shows native share sheet
      const fname = `IMMM_${Date.now()}_${layout}.png`;
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fname, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'IMMM Photo' });
            setDownloading(false); return;
          } catch(e) {
            if (e.name === 'AbortError') { setDownloading(false); return; }
          }
        }
      }

      // Fallback: anchor click
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      // iOS Safari fallback: open blob in new tab so user can long-press → Save Image
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) setTimeout(() => window.open(url, '_blank'), 150);
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch(e) { console.error(e); }
    setDownloading(false);
  };

  // ── video download — ALL 6 shots, flash transitions, 24fps film feel ──
  const [videoRecording, setVideoRecording] = React.useState(false);
  const videoSupported = typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream !== 'undefined';

  const handleVideoDownload = async () => {
    if (videoRecording) return;
    if (!videoSupported) {
      alert('이 브라우저에서는 영상 저장이 지원되지 않아요. (Chrome 권장)');
      return;
    }
    // Use ALL shots in capture order (not just selected 4)
    const allShots = shots.filter(s => s?.dataUrl);
    if (!allShots.length) { alert('먼저 사진을 촬영해주세요'); return; }
    setVideoRecording(true);

    const W = 720, H = 960;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');

    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const stream = cvs.captureStream(24);
    const rec = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `IMMM_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(a.href);
      setVideoRecording(false);
    };

    // pre-load images
    const imgs = await Promise.all(allShots.map(s => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = s.dataUrl;
    })));

    const drawFrame = (img, filterCss) => {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);
      if (img) {
        ctx.filter = filterCss || 'none';
        drawCover(ctx, img, 0, 0, W, H);
        ctx.filter = 'none';
      }
      // IMMM watermark
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '700 22px sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'right';
      ctx.fillText('IMMM', W - 20, H - 16);
    };

    const wait = ms => new Promise(res => setTimeout(res, ms));

    rec.start(100); // collect data every 100ms

    for (let i = 0; i < imgs.length; i++) {
      const s = allShots[i];
      const filterCss = FILTERS[s.filter]?.css || 'none';

      // white flash in
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      await wait(60);

      // draw photo
      drawFrame(imgs[i], filterCss);

      // shot number badge
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '700 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${String(i+1).padStart(2,'0')} / ${String(imgs.length).padStart(2,'0')}`, 18, 18);

      await wait(1200);

      // brief white flash out before next
      if (i < imgs.length - 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(0, 0, W, H);
        await wait(50);
      }
    }

    // end card — dark bg with IMMM branding
    ctx.fillStyle = '#1A1A1F';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '700 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMMM', W/2, H/2 - 20);
    ctx.font = '300 18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('My moments, uniquely mine.', W/2, H/2 + 24);
    await wait(800);

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

  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column' }}>
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
            <div ref={frameRef} style={{ display: 'inline-block', animation: 'popIn 0.55s cubic-bezier(0.34,1.56,0.64,1)' }}>
              {resultFrame(1)}
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '0 18px', paddingBottom: 'calc(var(--sab) + 24px)' }}>
            <button title="이미지 저장" onClick={handleDownload} style={{ width: 52, height: 52, borderRadius: 14, border: 'none', background: T.ink, color: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: downloading ? 0.6 : 1 }}>
              {downloading ? <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke={T.bg} strokeWidth="2" fill="none" strokeDasharray="22 22" style={{ animation: 'spin 0.8s linear infinite' }} /></svg> : I.download(20, T.bg)}
            </button>
            {videoSupported && (
            <button title="촬영 영상 저장" onClick={handleVideoDownload} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${videoRecording ? T.pinkDeep : T.line}`, background: videoRecording ? 'rgba(217,136,147,0.1)' : 'transparent', color: videoRecording ? T.pinkDeep : T.ink, cursor: videoRecording ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {videoRecording ? <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="22 22" style={{animation:'spin 0.9s linear infinite'}}/></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M16 10l5-3v10l-5-3V10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>}
              {videoRecording && <div style={{position:'absolute',top:-6,right:-6,background:T.pinkDeep,borderRadius:999,width:10,height:10,animation:'pulse 0.8s ease-in-out infinite'}}/>}
            </button>
            )}
            <button title="Instagram" style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
            </button>
            <button title="공유" onClick={() => { if (navigator.share) navigator.share({ title: 'IMMM', url: location.href }); }} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {I.share(20, T.ink)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column',
      padding: '24px 56px 24px' }}>
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

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: mobile ? 12 : 16 }}>
        {/* Download image */}
        <button title="이미지 저장" onClick={handleDownload} style={{ width: 52, height: 52, borderRadius: 14, border: 'none', background: T.ink, color: T.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: downloading ? 0.6 : 1 }}>
          {downloading ?
          <svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7" stroke={T.bg} strokeWidth="2" fill="none" strokeDasharray="22 22" style={{ animation: 'spin 0.8s linear infinite' }} /></svg> :
          I.download(20, T.bg)}
        </button>
        {/* Video download — only show when browser supports it */}
        {videoSupported && (
        <button title="촬영 영상 저장 (.webm)" onClick={handleVideoDownload} style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${videoRecording ? T.pinkDeep : T.line}`, background: videoRecording ? 'rgba(217,136,147,0.1)' : 'transparent', color: videoRecording ? T.pinkDeep : T.ink, cursor: videoRecording ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position:'relative' }}>
          {videoRecording
            ? <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="22 22" style={{animation:'spin 0.9s linear infinite'}}/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M16 10l5-3v10l-5-3V10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
          }
          {videoRecording && <div style={{position:'absolute',top:-6,right:-6,background:T.pinkDeep,borderRadius:999,width:10,height:10,animation:'pulse 0.8s ease-in-out infinite'}}/>}
        </button>
        )}
        {/* Instagram */}
        <button title="Instagram" style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" /></svg>
        </button>
        {/* KakaoTalk */}
        <button title="KakaoTalk" style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.7 1.7 5.1 4.3 6.5L5 22l4.6-2.4c.8.1 1.6.2 2.4.2 5.5 0 10-3.6 10-8s-4.5-8-10-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </button>
        {/* More */}
        <button title="More" style={{ width: 52, height: 52, borderRadius: 14, border: `1.5px solid ${T.line}`, background: 'transparent', color: T.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {I.share(20, T.ink)}
        </button>
      </div>
    </div>);

}

Object.assign(window, { DecoV2, ResultV2 });