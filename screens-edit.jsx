// screens-edit.jsx — Editor (filters + stickers) and Frame picker and Result

// ════════════════════════════════════════════════════════════
// EDITOR (filter + stickers + frame layout)
// ════════════════════════════════════════════════════════════
function FrameThumb({ layout, shots, selected, T, logo = true, dateText = true, accent, stickers = [], scale = 1, orientation = 'portrait', frameColor = '#ffffff' }) {
  // Renders a photo strip. layout: 'strip'|'trip'|'grid'|'layered'|'polaroid', orientation: 'portrait'|'landscape'
  const isDark = frameColor.toLowerCase() === '#111' || frameColor.toLowerCase() === '#111111' || frameColor.toLowerCase() === '#000000';
  const inkColor = isDark ? '#ffffff' : '#111111';
  const getShot = (slot) => shots[selected[slot]];
  const slottedMap = React.useContext(SlottedStickersCtx);

  const renderSlotStickers = (slotIdx) => {
    const list = slottedMap[slotIdx];
    if (!list || !list.length) return null;
    return list.map((s) =>
    <div key={s.id} style={{
      position: 'absolute', left: `${s.slotX ?? 50}%`, top: `${s.slotY ?? 50}%`,
      transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg) scale(${s.scale || 1})`,
      transformOrigin: 'center', pointerEvents: 'none', zIndex: 5
    }}>
        {renderStickerInstance(s)}
      </div>
    );
  };
  const border = `${Math.max(2, 8 * scale)}px`;
  const cardPad = Math.max(4, 10 * scale);
  const gap = Math.max(2, 6 * scale);
  const tileStyle = { position: 'relative', overflow: 'hidden', background: '#e8e8e8' };
  const EmptySlot = () => <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #efefef 0%, #e0e0e0 100%)' }} />;
  const renderShotStickers = (s) => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {(s?.preStickers || []).map((st) =>
        <div key={st.id} style={{ position:'absolute', left:`${st.x}%`, top:`${st.y}%`,
          transform:`translate(-50%,-50%) rotate(${st.rotation||0}deg) scale(${st.scale||1})`, opacity:0.88 }}>
          {renderStickerInstance(st)}
        </div>
      )}
    </div>
  );
  const isLandscape = orientation === 'landscape';

  let tiles;
  if (layout === 'polaroid') {
    // ── Polaroid: single square photo + big bottom margin ──
    const s = getShot(0);
    const photoW = 180 * scale;
    return (
      <div style={{ width: photoW + cardPad * 2, background: frameColor, boxShadow: '0 12px 30px rgba(0,0,0,0.1)', borderRadius: 3, position: 'relative', color: inkColor, padding: cardPad }}>
        {logo &&
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cardPad / 2, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: Math.max(6, 8 * scale), letterSpacing: 2, fontWeight: 700 }}>
            <span style={{ letterSpacing: 3 }}>IMMM</span><span style={{ color: accent }}>●</span>
          </div>
        }
        <div data-frame-slot={0} style={{ ...tileStyle, aspectRatio: '1', width: '100%' }}>
          {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
          {renderSlotStickers(0)}
        </div>
        {/* Polaroid bottom — always sized, text visibility toggled */}
        <div style={{ height: 46 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'Caveat,cursive', fontSize: Math.max(9, 14 * scale), color: isDark ? 'rgba(255,255,255,0.7)' : '#555', visibility: dateText ? 'visible' : 'hidden' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {stickers.map((st, i) =>
          <div key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, transform: `translate(-50%,-50%) rotate(${st.rot || 0}deg) scale(${(st.scale || 1) * scale})`, transformOrigin: 'center' }}>
              {renderSticker(st.data, 0.7)}
            </div>
          )}
        </div>
      </div>);

  }

  if (isLandscape && (layout === 'strip' || layout === 'trip')) {
    // ── Horizontal strip ──
    const count = layout === 'trip' ? 3 : 4;
    tiles =
    <div style={{ display: 'flex', flexDirection: 'row', gap }}>
        {Array.from({ length: count }, (_, i) => {
        const s = getShot(i);
        return (
          <div key={i} data-frame-slot={i} style={{ ...tileStyle, flex: 1, aspectRatio: '3/4' }}>
              {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
              {renderSlotStickers(i)}
            </div>);

      })}
      </div>;

  } else if (layout === 'strip') {
    tiles =
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {[0, 1, 2, 3].map((i) => {
        const s = getShot(i);
        return <div key={i} data-frame-slot={i} style={{ ...tileStyle, aspectRatio: '4/3' }}>
            {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
            {renderSlotStickers(i)}
          </div>;
      })}
      </div>;

  } else if (layout === 'grid') {
    tiles =
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>
        {[0, 1, 2, 3].map((i) => {
        const s = getShot(i);
        return <div key={i} data-frame-slot={i} style={{ ...tileStyle, aspectRatio: '1' }}>
            {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
            {renderSlotStickers(i)}
          </div>;
      })}
      </div>;

  } else if (layout === 'trip') {
    tiles =
    <div style={{ display: 'flex', flexDirection: isLandscape ? 'row' : 'column', gap }}>
        {[0, 1, 2].map((i) => {
        const s = getShot(i);
        return <div key={i} data-frame-slot={i} style={{ ...tileStyle, aspectRatio: isLandscape ? '3/4' : '4/3', flex: isLandscape ? 1 : 'none' }}>
            {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
            {renderSlotStickers(i)}
          </div>;
      })}
      </div>;

  } else {// layered
    tiles =
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1.3fr 1fr', gap }}>
        {[0, 1, 2, 3].map((i) => {
        const s = getShot(i);
        return <div key={i} data-frame-slot={i} style={{ ...tileStyle }}>
            {s?.dataUrl ? <><img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />{renderShotStickers(s)}</> : <EmptySlot />}
            {renderSlotStickers(i)}
          </div>;
      })}
      </div>;

  }

  const landscapeW = { strip: 360, trip: 280, grid: 220, layered: 220 };
  const portraitW = { strip: 160, trip: 160, grid: 220, layered: 220 };
  const w = isLandscape ?
  (landscapeW[layout] || 220) * scale :
  (portraitW[layout] || 160) * scale;
  const h = 'auto';
  return (
    <div style={{ width: w, padding: cardPad, background: frameColor, boxShadow: '0 12px 30px rgba(0,0,0,0.1)', borderRadius: 3, position: 'relative', color: inkColor }}>
      {logo &&
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cardPad / 2, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: Math.max(6, 8 * scale), letterSpacing: 2, fontWeight: 700, overflow: 'hidden' }}>
          <span style={{ letterSpacing: 3 }}>IMMM</span><span style={{ color: accent, flexShrink: 0 }}>●</span>
        </div>
      }
      {tiles}
      <div style={{ marginTop: cardPad, textAlign: 'center', fontFamily: 'Caveat,cursive', fontSize: Math.max(9, 13 * scale), color: inkColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', visibility: dateText ? 'visible' : 'hidden' }}>
        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
      </div>
      {/* Stickers overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {stickers.map((st, i) =>
        <div key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, transform: `translate(-50%,-50%) rotate(${st.rot || 0}deg) scale(${(st.scale || 1) * scale})`, transformOrigin: 'center' }}>
            {renderSticker(st.data, 0.7)}
          </div>
        )}
      </div>
    </div>);

}

function EditScreen({ T, go, shots, selected, mobile, variant,
  filter, setFilter, layout, setLayout, stickers, setStickers, logo, dateText, accent }) {
  const [sheet, setSheet] = React.useState('filters'); // mobile sheet tab
  const [activeSticker, setActiveSticker] = React.useState(null);

  const lib = variant === 'B' ? RETRO_STICKERS : MINIMAL_STICKERS;
  const lib2 = variant === 'B' ? MINIMAL_STICKERS : RETRO_STICKERS;

  const applyFilter = (k) => {
    setFilter(k);
    // apply to all selected shots
  };

  const addSticker = (s) => {
    setStickers((prev) => [...prev, {
      data: s,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 60,
      rot: Math.random() * 24 - 12,
      scale: 0.7 + Math.random() * 0.4,
      id: Math.random().toString(36).slice(2)
    }]);
  };

  const removeSticker = (id) => setStickers((prev) => prev.filter((s) => s.id !== id));

  const shotsWithFilter = shots.map((s) => s ? { ...s, filter } : null);

  // Preview
  const preview =
  <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
      <div style={{ transform: mobile ? 'scale(1.1)' : 'scale(1.5)', transformOrigin: 'center top' }}>
        <FrameThumb layout={layout} shots={shotsWithFilter} selected={selected} T={T}
      logo={logo} dateText={dateText} accent={accent} stickers={stickers} scale={1} />
      </div>
    </div>;


  // Tabs content
  const filterPanel =
  <div>
      <Kicker T={T}>Filters · 필터</Kicker>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
        {(typeof getVisibleFilters === 'function' ? getVisibleFilters() : Object.entries(FILTERS).filter(([, v]) => !v.hidden)).map(([k, v]) =>
      <button key={k} onClick={() => applyFilter(k)} style={{
        padding: 0, border: filter === k ? `2px solid ${T.ink}` : `1px solid ${T.line}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: T.card, textAlign: 'left'
      }}>
            <div style={{ aspectRatio: '1', position: 'relative' }}>
              <PlaceholderPortrait seed={0} filter={k} />
            </div>
            <div style={{ padding: '8px 10px', fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
              {v.name}<span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4, fontFamily: 'Pretendard,system-ui' }}>{v.ko}</span>
            </div>
          </button>
      )}
      </div>
    </div>;


  const stickerPanel =
  <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: '6px 12px', borderRadius: 999, background: T.ink, color: T.bg, fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600, letterSpacing: 0.5 }}>
          {variant === 'B' ? 'K-VARIETY RETRO' : 'MINIMAL'}
        </div>
        <div style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${T.line}`, color: T.inkSoft, fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
          {variant === 'B' ? 'MINIMAL' : 'RETRO'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {lib.map((s) =>
      <button key={s.id} onClick={() => addSticker(s)} style={{
        padding: 12, border: `1px solid ${T.line}`, borderRadius: 12, background: T.card,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        minHeight: 70
      }}>{renderSticker(s, 0.7)}</button>
      )}
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
        Tap a sticker to drop it on your strip. Long-press to remove.
      </div>
    </div>;


  const framePanel =
  <div>
      <Kicker T={T}>Layout · 프레임</Kicker>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
        {[
      { id: 'strip', label: '1×4 Strip', ko: '클래식' },
      { id: 'grid', label: '2×2 Grid', ko: '그리드' },
      { id: 'layered', label: 'Layered', ko: '레이어' }].
      map((opt) =>
      <button key={opt.id} onClick={() => setLayout(opt.id)} style={{
        padding: '16px 10px 12px', border: layout === opt.id ? `2px solid ${T.ink}` : `1px solid ${T.line}`,
        borderRadius: 14, background: T.card, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
      }}>
            <div style={{ transform: 'scale(0.45)', transformOrigin: 'center', height: 100, display: 'flex', alignItems: 'center' }}>
              <FrameThumb layout={opt.id} shots={shotsWithFilter} selected={selected} T={T}
          logo={false} dateText={false} accent={accent} scale={1} />
            </div>
            <div style={{ fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
              {opt.label}
              <span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4, fontFamily: 'Pretendard,system-ui' }}>{opt.ko}</span>
            </div>
          </button>
      )}
      </div>
    </div>;


  const activePanel = sheet === 'filters' ? filterPanel : sheet === 'stickers' ? stickerPanel : framePanel;

  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column', padding: '50px 16px 0' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <button onClick={() => go('select')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            {I.arrowL(14, T.ink)} Back
          </button>
          <Kicker T={T}>Step 03 · Edit</Kicker>
          <PrimaryBtn T={T} size="sm" onClick={() => go('result')}>Done</PrimaryBtn>
        </div>
        {preview}
        {/* bottom sheet */}
        <div style={{ marginTop: 'auto', background: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '16px 18px 24px', boxShadow: '0 -8px 30px rgba(0,0,0,0.08)' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: T.line, margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[
            ['filters', 'Filters', '필터', I.filter],
            ['stickers', 'Stickers', '스티커', I.stickerIcon],
            ['frame', 'Frame', '프레임', I.strip]].
            map(([k, en, ko, ic]) =>
            <button key={k} onClick={() => setSheet(k)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 12,
              background: sheet === k ? T.bgAlt : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
            }}>
                {ic(16, sheet === k ? T.ink : T.inkSoft)}
                <div style={{ fontSize: 10, fontWeight: 600, color: sheet === k ? T.ink : T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui' }}>{en}</div>
              </button>
            )}
          </div>
          <div style={{ maxHeight: 240, overflow: 'auto' }}>{activePanel}</div>
        </div>
      </div>);

  }

  // Desktop split view
  return (
    <div style={{ height: '100%', background: T.bg, display: 'grid', gridTemplateColumns: '1fr 380px' }}>
      {/* main */}
      <div style={{ padding: '28px 48px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => go('select')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            {I.arrowL(14, T.ink)} Back
          </button>
          <Kicker T={T}>Step 03 of 04 · Edit</Kicker>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn T={T} onClick={() => setStickers([])}>Clear stickers</GhostBtn>
            <PrimaryBtn T={T} onClick={() => go('result')}>Finish · 완료  {I.arrowR(14, T.bg)}</PrimaryBtn>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bgAlt, borderRadius: 24, marginTop: 20, position: 'relative' }}>
          <div style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
            <FrameThumb layout={layout} shots={shotsWithFilter} selected={selected} T={T}
            logo={logo} dateText={dateText} accent={accent} stickers={stickers} scale={1} />
          </div>
          <div style={{ position: 'absolute', bottom: 18, left: 18, fontSize: 11, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1 }}>
            LIVE PREVIEW · 실시간 미리보기
          </div>
        </div>
      </div>

      {/* right sidebar */}
      <div style={{ borderLeft: `1px solid ${T.line}`, background: T.card, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.line}` }}>
          {[
          ['filters', 'Filters', '필터'],
          ['stickers', 'Stickers', '스티커'],
          ['frame', 'Frame', '프레임']].
          map(([k, en, ko]) =>
          <button key={k} onClick={() => setSheet(k)} style={{
            flex: 1, padding: '18px 10px', border: 'none', cursor: 'pointer',
            background: sheet === k ? T.bg : 'transparent',
            borderBottom: sheet === k ? `2px solid ${T.ink}` : '2px solid transparent',
            fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 12, fontWeight: 600,
            color: sheet === k ? T.ink : T.inkSoft, letterSpacing: 0.5
          }}>
              {en}<span style={{ marginLeft: 4, fontFamily: 'Pretendard,system-ui', fontWeight: 400 }}>{ko}</span>
            </button>
          )}
        </div>
        <div style={{ flex: 1, padding: '20px 22px', overflow: 'auto' }}>
          {activePanel}
        </div>
      </div>
    </div>);

}

// ════════════════════════════════════════════════════════════
// RESULT
// ════════════════════════════════════════════════════════════
function ResultScreen({ T, go, shots, selected, layout, stickers, logo, dateText, accent, variant, mobile, filter }) {
  const shotsWithFilter = shots.map((s) => s ? { ...s, filter } : null);
  return (
    <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column', padding: mobile ? '50px 16px 20px' : '28px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => go('edit')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          {I.arrowL(14, T.ink)} Edit
        </button>
        <Kicker T={T}>Step 04 · Done</Kicker>
        <button onClick={() => go('landing')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkSoft, fontSize: 13, fontFamily: 'Pretendard,system-ui' }}>
          New session
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: mobile ? 16 : 30 }}>
        <h1 style={{ margin: 0, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: mobile ? 32 : 56, fontWeight: 500, letterSpacing: -2 }}>
          Your <span style={{ fontFamily: 'Caveat,cursive', color: T.pinkDeep, fontSize: mobile ? 40 : 72 }}>strip</span> is ready.
        </h1>
        <div style={{ marginTop: 6, color: T.inkSoft, fontSize: mobile ? 13 : 15, fontFamily: 'Pretendard,system-ui' }}>
          네 장을 골랐어요. 저장하거나 공유해 보세요.
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ transform: mobile ? 'scale(1.2)' : 'scale(1.8)', transformOrigin: 'center' }}>
          <FrameThumb layout={layout} shots={shotsWithFilter} selected={selected} T={T}
          logo={logo} dateText={dateText} accent={accent} stickers={stickers} scale={1} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: mobile ? 16 : 10 }}>
        <PrimaryBtn T={T} size={mobile ? 'md' : 'lg'}>{I.download(16, T.bg)} Download PNG</PrimaryBtn>
        <GhostBtn T={T}>{I.share(16, T.ink)} Share link</GhostBtn>
        <GhostBtn T={T}>Animated GIF</GhostBtn>
        {!mobile && <GhostBtn T={T}>Print · 인쇄</GhostBtn>}
      </div>
    </div>);

}

Object.assign(window, { EditScreen, FrameThumb, ResultScreen });
