// screens-v2.jsx — Redesigned screens per v2 brief

const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

// ═══════════════════════════════════════════════════════════════
// Shared primitives
// ═══════════════════════════════════════════════════════════════
function BtnPrimary({ children, onClick, T, block = false, size = 'md', disabled }) {
  const pads = { sm: '10px 20px', md: '14px 28px', lg: '18px 36px' };
  const fss = { sm: 12, md: 13, lg: 14 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: pads[size], borderRadius: 4, border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? 'rgba(10,10,10,0.15)' : T.ink,
      color: T.bg, fontSize: fss[size], fontWeight: 600,
      letterSpacing: 1.5, textTransform: 'uppercase',
      width: block ? '100%' : 'auto',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s'
    }}
    onPointerDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
    onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onPointerLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
      {children}</button>);

}
function BtnGhost({ children, onClick, T, size = 'md' }) {
  const pads = { sm: '8px 16px', md: '12px 24px', lg: '16px 28px' };
  const fss = { sm: 11, md: 13, lg: 14 };
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: pads[size], borderRadius: 4,
      border: `1px solid ${T.ink}`, background: 'transparent', color: T.ink,
      fontSize: fss[size], fontWeight: 500, cursor: 'pointer',
      letterSpacing: 1, textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
      transition: 'background 0.2s'
    }}>{children}</button>);

}
function Kick({ children, T }) {
  return <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: T.inkSoft }}>{children}</div>;
}

// StepDots — animated progress indicator
function StepDots({ step, total = 5, T }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) =>
      <div key={i} style={{
        width: i === step ? 20 : 4, height: 3, borderRadius: 2,
        background: i < step ? T.ink : i === step ? T.ink : 'rgba(10,10,10,0.15)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)'
      }} />
      )}
    </div>);

}

// Fade-slide transition wrapper
function ScreenTransition({ id, children }) {
  const [show, setShow] = uS(false);
  uE(() => {const t = setTimeout(() => setShow(true), 10);return () => clearTimeout(t);}, [id]);
  return (
    <div style={{
      width: '100%', height: '100%',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)'
    }}>{children}</div>);

}

// Header chrome
function TopBar({ step, back, T, mobile, title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: mobile ? '0 20px' : '0 8px', marginBottom: mobile ? 14 : 20 }}>
      <button onClick={back} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, padding: '6px 8px', marginLeft: -8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
        {back && <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 2L4 8l6 6" /></svg>}
        {back ? 'Back' : ''}
      </button>
      <div style={{ textAlign: 'center' }}>
        <StepDots step={step} T={T} />
        {title && <div style={{ marginTop: 5, fontSize: 10, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>}
      </div>
      <div style={{ minWidth: 60, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>);

}

// ═══════════════════════════════════════════════════════════════
// 1. LANDING — Life Plus aesthetic
// ═══════════════════════════════════════════════════════════════
const I18N = {
  ko: {
    mobileSub: '나의 그리고 우리의 순간',
    desc1: '나의 그리고 우리의 순간.',
    desc2: '내 손안의 포토부스.',
    start: '촬영하기',
    edit: '편집하기',
    noSignup: 'No signup required · 가입 불필요'
  },
  en: {
    mobileSub: 'My moments, our memories',
    desc1: 'My moments, our memories.',
    desc2: 'A photobooth in the palm of your hand.',
    start: 'Capture',
    edit: 'Edit',
    noSignup: 'No signup required'
  },
  jp: {
    mobileSub: '私と私たちの瞬間',
    desc1: '私と私たちの瞬間。',
    desc2: '私の手の中のフォトブース。',
    start: '撮影する',
    edit: '編集する',
    noSignup: 'No signup required · 登録不要'
  }
};

function LandingV2({ T, variant, go, mobile, onStart, onEdit, lang = 'ko', setLang }) {
  const t = I18N[lang] || I18N.ko;
  const toggleLang = () => setLang(l => l === 'ko' ? 'en' : l === 'en' ? 'jp' : 'ko');
  const sampleImg = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const dummyShots = Array.from({length: 4}, () => ({ filter: 'porcelain', dataUrl: sampleImg }));

  const logoMark = (size = 48) =>
  <svg width={size * 1.4} height={size} viewBox="0 0 70 50">
      <path d="M42 8 C52 6 64 12 66 24 C68 36 58 46 46 44 C36 42 28 34 22 28 C16 22 10 16 16 10 C22 4 34 10 42 8Z" fill={T.ink} />
    </svg>;


  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 32px 40px', position: 'relative' }}>
        <button onClick={toggleLang} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(26,26,31,0.05)', borderRadius: 999, border: 'none', color: T.ink, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', padding: '6px 12px', letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.2s' }}>
          {lang}
        </button>
        {/* Logo block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {logoMark(42)}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 22, fontWeight: 700, letterSpacing: 8, color: T.ink, lineHeight: 1.3 }}>
              I M M M
            </div>
            <div style={{ fontFamily: 'Pretendard,system-ui', fontSize: 11, letterSpacing: 1.5, color: T.inkSoft, marginTop: 4 }}>
              {t.mobileSub}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onStart} style={{
            width: '100%', padding: '18px', background: T.ink, color: T.bg, border: 'none',
            borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui'
          }}>{t.start}</button>
          <button onClick={onEdit} style={{
            width: '100%', padding: '17px', background: 'transparent', color: T.ink,
            border: `1px solid ${T.ink}`, borderRadius: 4, cursor: 'pointer',
            fontSize: 13, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase',
            fontFamily: '"Plus Jakarta Sans",system-ui'
          }}>{t.edit}</button>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', letterSpacing: 0.5 }}>
            {t.noSignup}
          </div>
        </div>
      </div>);

  }

  // Desktop
  return (
    <div style={{ height: '100%', background: T.bg, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left */}
      <div style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 11, fontWeight: 700, letterSpacing: 6, color: T.ink }}>I M M M</div>
          <div style={{ display: 'flex', gap: 28, fontSize: 11, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1.5, textTransform: 'uppercase', alignItems: 'center' }}>
            <span>Gallery</span><span>Frames</span>
            <button onClick={toggleLang} style={{ background: 'rgba(26,26,31,0.05)', borderRadius: 999, border: 'none', color: T.ink, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', padding: '4px 10px', letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.2s' }}>
              {lang}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 24 }}>
            Web Photobooth
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: '"Plus Jakarta Sans",system-ui',
            fontSize: 72, lineHeight: 0.95,
            fontWeight: 700, letterSpacing: -2, color: T.ink
          }}>
            My<br />moments.<br />
            <span style={{ fontFamily: 'Caveat,cursive', fontWeight: 400, fontSize: 88, letterSpacing: -1 }}>Uniquely Mine.</span>
          </h1>
          <div style={{ marginTop: 28, fontSize: 14, lineHeight: 1.6, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', maxWidth: 380 }}>
            {t.desc1}<br />
            {t.desc2}
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
            <button onClick={onStart} style={{
              padding: '16px 36px', background: T.ink, color: T.bg, border: 'none',
              borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              letterSpacing: 2.5, textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui'
            }}>{t.start}</button>
            <button onClick={onEdit} style={{
              padding: '16px 28px', background: 'transparent', color: T.ink,
              border: `1px solid ${T.ink}`, borderRadius: 4, cursor: 'pointer',
              fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: '"Plus Jakarta Sans",system-ui'
            }}>{t.edit}</button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.inkSoft, letterSpacing: 1.5, fontFamily: '"Plus Jakarta Sans",system-ui', textTransform: 'uppercase' }}>
          <span>© DALGRACSTUDIO</span><span>All processing on-device</span>
        </div>
      </div>

      {/* Right — photo stack */}
      <div style={{ background: T.bgAlt, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 260, height: 380 }}>
          {/* grid — behind, bigger, color */}
          <div style={{ position: 'absolute', right: -10, bottom: -10, transform: 'rotate(4deg)', padding: 8, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 1, width: "200px", height: "230px" }}>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117%' }}>
              <FrameThumb layout="grid" shots={dummyShots} selected={[0,1,2,3]} T={T} logo={false} dateText={false} scale={1} />
            </div>
            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, fontFamily: 'Caveat,cursive', fontSize: 13, textAlign: 'center', color: T.ink }}>best day ♡</div>
          </div>
          {/* strip 1 — in front */}
          <div style={{ position: 'absolute', left: 0, top: 20, transform: 'rotate(-5deg)', width: 120, padding: 8, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 2 }}>
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '153%' }}>
              <FrameThumb layout="strip" shots={dummyShots} selected={[0,1,2,3]} T={T} logo={false} dateText={false} scale={1} />
            </div>
            <div style={{ marginTop: 8, fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 7, letterSpacing: 2, textAlign: 'center', color: T.inkSoft, textTransform: 'uppercase' }}>I M M M · 2026</div>
          </div>
        </div>
        {/* Logo overlay */}
        <div style={{ position: 'absolute', top: 24, right: 24, opacity: 0.08 }}>
          {logoMark(60)}
        </div>
      </div>
    </div>);

}

// ═══════════════════════════════════════════════════════════════
// 2. SETUP — Frame + Filter + Pre-stickers
// ═══════════════════════════════════════════════════════════════
function SetupScreen({ T, go, mobile, variant, layout, setLayout, filter, setFilter, preStickers, setPreStickers, logo, setLogo, dateText, setDateText, orientation, setOrientation, accent, editMode, shots, setShots, setSelected }) {
  const [tab, setTab] = uS(() => editMode ? 'photos' : 'frame'); // photos | frame | filter | companions
  const [selStId, setSelStId] = uS(null);
  const fileRef = uR(null);

  const addPreset = (libId) => {
    setPreStickers((prev) => [...prev, makeSticker('preset', { libId })]);
  };
  const addUpload = (dataUrl) => {
    setPreStickers((prev) => [...prev, makeSticker('upload', { dataUrl }, { scale: 0.6 })]);
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => addUpload(rd.result);
    rd.readAsDataURL(f);
  };

  const shotsPreview = Array.from({ length: 4 }, () => ({ filter: 'original', dataUrl: null }));
  const setupContainerRef = React.useRef(null);
  const setupFrameRef = React.useRef(null);
  const [setupZoom, setSetupZoom] = React.useState(mobile ? 1 : 1.4);

  React.useEffect(() => {
    const fit = () => {
      if (!setupContainerRef.current || !setupFrameRef.current) return;
      const cW = setupContainerRef.current.clientWidth - 32;
      const cH = setupContainerRef.current.clientHeight - 32;
      const fW = setupFrameRef.current.offsetWidth;
      const fH = setupFrameRef.current.offsetHeight;
      if (!fW || !fH) return;
      const maxS = mobile ? 1 : 1.4;
      setSetupZoom(Math.max(0.15, Math.min(maxS, cW / fW, cH / fH)));
    };
    // small delay so FrameThumb finishes re-rendering after orientation change
    const tid = setTimeout(fit, 40);
    fit();
    const ro = new ResizeObserver(fit);
    if (setupContainerRef.current) ro.observe(setupContainerRef.current);
    if (setupFrameRef.current) ro.observe(setupFrameRef.current);
    return () => { clearTimeout(tid); ro.disconnect(); };
  }, [layout, mobile, orientation]);

  // Preview surface (interactive, shows frame + companion stickers)
  const zoomIn  = () => setSetupZoom(z => Math.min(3, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setSetupZoom(z => Math.max(0.15, +(z - 0.15).toFixed(2)));

  const preview =
  <div ref={setupContainerRef} style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'relative' }}>
      <div ref={setupFrameRef} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${setupZoom})`, transformOrigin: 'center' }}>
        <StickerCanvas T={T} stickers={preStickers} setStickers={setPreStickers} selectedId={selStId} setSelectedId={setSelStId}
      width={
        layout === 'polaroid' ? 200 :
        (orientation === 'landscape' && layout === 'strip') ? 360 :
        (orientation === 'landscape' && layout === 'trip')  ? 280 :
        layout === 'grid' ? 220 : 160
      } height={'auto'}>
          <FrameThumb layout={layout} shots={[{ filter }, { filter }, { filter }, { filter }]} selected={[0, 1, 2, 3]} T={T}
        logo={logo} dateText={dateText} accent={accent} scale={1} orientation={orientation} />
        </StickerCanvas>
      </div>
    </div>;


  const frameTab =
  <div>
      <Kick T={T}>Choose your frame · 프레임 선택</Kick>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[
          { id: 'strip',    en: '1×4 Strip', ko: '스트립' },
          { id: 'trip',     en: '1×3',       ko: '트리플' },
          { id: 'grid',     en: '2×2 Grid',  ko: '그리드' },
          { id: 'polaroid', en: 'Polaroid',  ko: '폴라로이드' },
        ].map((o) =>
      <button key={o.id} onClick={() => setLayout(o.id)}
      style={{
        padding: '14px 8px 10px', background: layout === o.id ? T.card : 'transparent',
        border: 'none', borderRadius: 16, cursor: 'pointer',
        boxShadow: layout === o.id ? '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1.5px rgba(26,26,31,0.9) inset' : '0 0 0 1px rgba(26,26,31,0.08) inset',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.25s',
      }}>
            <div style={{ width: '100%', height: 84, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ transform: 'scale(0.38)', transformOrigin: 'center center', display: 'flex', alignItems: 'center' }}>
                <FrameThumb layout={o.id} shots={shotsPreview} selected={[0, 1, 2, 3]} T={T}
                  logo={false} dateText={false} accent={accent} scale={1}
                  orientation="portrait" />
              </div>
            </div>
            <div style={{ fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
              {o.en}<span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4, fontFamily: 'Pretendard,system-ui' }}>{o.ko}</span>
            </div>
          </button>
      )}
      </div>

      {/* Frame options */}
      <div style={{ marginTop: 18, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
        <Kick T={T}>Frame options · 프레임 옵션</Kick>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Orientation toggle — always visible */}
          <button onClick={() => setOrientation && setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait')}
            disabled={layout === 'grid' || layout === 'polaroid'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12, border: 'none', cursor: (layout === 'grid' || layout === 'polaroid') ? 'default' : 'pointer',
              background: 'rgba(26,26,31,0.04)', width: '100%', textAlign: 'left',
              opacity: (layout === 'grid' || layout === 'polaroid') ? 0.4 : 1,
            }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', color: T.ink }}>방향 · Orientation</div>
              <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', marginTop: 1 }}>
                {layout === 'grid' || layout === 'polaroid' ? '이 프레임은 방향 전환 불가' : orientation === 'portrait' ? '세로형 → 가로형으로 전환' : '가로형 → 세로형으로 전환'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['portrait', 'landscape'].map(o => (
                <div key={o} style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                  background: orientation === o ? T.ink : 'rgba(26,26,31,0.06)',
                  color: orientation === o ? T.bg : T.inkSoft,
                  letterSpacing: 0.5, fontFamily: '"Plus Jakarta Sans",system-ui',
                  transition: 'all 0.2s',
                }}>{o === 'portrait' ? '세로' : '가로'}</div>
              ))}
            </div>
          </button>

          {/* Date toggle */}
          <button onClick={() => setDateText && setDateText(!dateText)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'rgba(26,26,31,0.04)', width: '100%', textAlign: 'left',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', color: T.ink }}>날짜 표시</div>
              <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', marginTop: 1 }}>프레임 하단에 촬영 날짜</div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 999, background: dateText ? T.ink : 'rgba(26,26,31,0.15)', position: 'relative', flexShrink: 0, transition: '0.2s' }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, background: '#fff', position: 'absolute', top: 3, left: dateText ? 19 : 3, transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
          </button>
        </div>
      </div>
    </div>;


  const filterTab =
  <div>
      <Kick T={T}>Choose a filter · 필터 선택</Kick>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(FILTERS).map(([k, v]) =>
      <button key={k} onClick={() => setFilter(k)} style={{
        padding: 0, border: 'none', cursor: 'pointer', background: T.card,
        borderRadius: 14, overflow: 'hidden', textAlign: 'left',
        boxShadow: filter === k ? '0 0 0 2px ' + T.ink : '0 0 0 1px rgba(26,26,31,0.08)',
        transition: 'all 0.2s'
      }}>
            <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: v.css }} />
            </div>
            <div style={{ padding: '6px 10px', fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
              {v.name}<span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4 }}>{v.ko}</span>
            </div>
          </button>
      )}
      </div>
    </div>;


  const companionsTab =
  <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Kick T={T}>Stickers · 스티커</Kick>
        <button onClick={() => fileRef.current?.click()} style={{
        padding: '6px 10px', background: T.ink, color: T.bg, border: 'none', borderRadius: 999,
        fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
      }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2v8M2 6h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
          Upload PNG
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', lineHeight: 1.45 }}>
        스티커를 프레임에 드래그하여 배치하세요. 크기 조절, 회전 가능.
      </div>
      {Object.entries(STICKER_CATALOG).map(([k, pack]) =>
    <div key={k} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, marginBottom: 6, fontFamily: '"Plus Jakarta Sans",system-ui' }}>
            {pack.name} · {pack.ko}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {pack.items.map((it) =>
        <button key={it.id} onClick={() => addPreset(it.id)} style={{
          padding: 10, background: T.card, border: 'none', borderRadius: 12,
          boxShadow: '0 0 0 1px rgba(26,26,31,0.06)', cursor: 'pointer',
          minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
        onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onPointerLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
          
                {renderLibSticker(it, 0.65)}
              </button>
        )}
          </div>
        </div>
    )}
    </div>;


  const photoFileRefs = [uR(null), uR(null), uR(null), uR(null)];
  const onPhotoUpload = (idx, e) => {
    const f = e.target.files?.[0];if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      setShots((prev) => {const n = [...prev];n[idx] = { dataUrl: rd.result, filter };return n;});
      setSelected((prev) => {const n = [...prev];if (!n.includes(idx)) n[idx] = idx;return [0, 1, 2, 3];});
    };
    rd.readAsDataURL(f);
  };

  const photosTab = editMode ?
  <div>
      <Kick T={T}>사진 불러오기 · Upload Photos</Kick>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[0, 1, 2, 3].map((i) => {
        const s = shots?.[i];
        return (
          <div key={i} onClick={() => photoFileRefs[i].current?.click()}
          style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative',
            background: s?.dataUrl ? 'transparent' : 'rgba(26,26,31,0.05)',
            border: s?.dataUrl ? 'none' : `1.5px dashed rgba(26,26,31,0.15)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s?.dataUrl ?
            <img src={s.dataUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
            <div style={{ textAlign: 'center', color: T.inkSoft }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <div style={{ fontSize: 10, marginTop: 4, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1 }}>컷 {i + 1}</div>
                  </div>
            }
              {s?.dataUrl &&
            <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 999,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2L2 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
            }
              <input ref={photoFileRefs[i]} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => onPhotoUpload(i, e)} />
            </div>);

      })}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', textAlign: 'center' }}>
        4컷을 모두 업로드하면 편집으로 이동합니다
      </div>
    </div> :
  null;

  const uploadedCount = editMode ? [0, 1, 2, 3].filter((i) => shots?.[i]?.dataUrl).length : 0;

  const tabContent = tab === 'photos' ? photosTab : tab === 'frame' ? frameTab : tab === 'filter' ? filterTab : companionsTab;

  const tabBar =
  <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.line}`, marginBottom: 18 }}>
      {[...(editMode ? [['photos', '사진']] : []), ['frame', '프레임'], ['filter', '필터'], ['companions', '스티커']].map(([k, ko]) =>
    <button key={k} onClick={() => setTab(k)} style={{
      flex: 1, padding: '14px 8px', border: 'none', borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
      background: 'transparent',
      color: tab === k ? T.ink : T.inkSoft, fontSize: 11, fontWeight: 700, cursor: 'pointer',
      fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1.5, textTransform: 'uppercase',
      transition: 'all 0.2s', marginBottom: -1
    }}>{ko}</button>
    )}
    </div>;


  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, padding: '50px 0 0', display: 'flex', flexDirection: 'column' }}>
        <TopBar step={0} back={() => go('landing')} T={T} mobile title={editMode ? '편집하기' : 'Setup · 세팅'}
        right={<BtnPrimary T={T} size="sm" onClick={() => go(editMode ? 'deco' : 'capture')} disabled={editMode && uploadedCount < 4}>{editMode ? '편집 시작' : 'Next'}</BtnPrimary>} />
        <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
          {preview}
          <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 5, zIndex: 20 }}>
            <button onClick={zoomOut} style={{ width: 28, height: 28, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>−</button>
            <button onClick={zoomIn}  style={{ width: 28, height: 28, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 16, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>+</button>
          </div>
        </div>
        <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
          borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: '20px 20px 28px',
          borderTop: '1px solid rgba(0,0,0,0.08)', maxHeight: '58%', overflow: 'auto' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.1)', margin: '0 auto 14px' }} />
          {tabBar}
          {tabContent}
        </div>
      </div>);

  }
  return (
    <div style={{ height: '100%', background: T.bg, display: 'grid', gridTemplateColumns: '1fr 380px' }}>
      <div style={{ padding: '24px 48px', display: 'flex', flexDirection: 'column' }}>
        <TopBar step={0} back={() => go('landing')} T={T} title={editMode ? '편집하기 · Upload & Edit' : 'Step 1 · Setup the booth'}
        right={<BtnPrimary T={T} size="md" onClick={() => go(editMode ? 'deco' : 'capture')} disabled={editMode && uploadedCount < 4}>{editMode ? '편집 시작' : 'Continue · 다음'} {!editMode && I.arrowR(14, T.bg)}</BtnPrimary>} />
        <div style={{ flex: 1, background: T.bgAlt, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {preview}
          <div style={{ position: 'absolute', bottom: 16, left: 18, fontSize: 11, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1.5 }}>
            LIVE PREVIEW · drag companions to place them
          </div>
          {/* Zoom controls */}
          <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6, zIndex: 20 }}>
            <button onClick={zoomOut} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 18, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>−</button>
            <button onClick={zoomIn}  style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', fontSize: 18, fontWeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>+</button>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(0,0,0,0.07)', padding: '24px 22px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tabBar}
        <div style={{ flex: 1 }}>{tabContent}</div>
      </div>
    </div>);

}

Object.assign(window, { LandingV2, SetupScreen, BtnPrimary, BtnGhost, Kick, StepDots, ScreenTransition, TopBar });