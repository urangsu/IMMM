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

function StoreBadge({ children, T, tone = 'dark' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '3px 6px', borderRadius: 999,
      background: tone === 'dark' ? T.ink : 'rgba(26,26,31,0.08)',
      color: tone === 'dark' ? T.bg : T.ink,
      fontSize: 8, fontWeight: 800, letterSpacing: 0.7,
      fontFamily: '"Plus Jakarta Sans",system-ui', textTransform: 'uppercase',
    }}>
      <svg width="10" height="8" viewBox="0 0 20 14" fill="currentColor"><path d="M1 4l5 3 4-6 4 6 5-3-2 9H3L1 4z"/></svg>
      {children}
    </span>
  );
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

function FramePickerFallback({ layout, T, size = 'sm' }) {
  const isGrid = layout === 'grid';
  const isPolaroid = layout === 'polaroid';
  const isTrip = layout === 'trip';
  const slots = isPolaroid ? 1 : isGrid ? 4 : isTrip ? 3 : 4;

  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const w = size === 'lg' ? (layout === 'polaroid' || layout === 'grid' ? 180 : 120) : (layout === 'polaroid' || layout === 'grid' ? (mobile ? 56 : 60) : (mobile ? 40 : 42));
  const h = size === 'lg' ? (layout === 'polaroid' ? 210 : layout === 'grid' ? 180 : 260) : (layout === 'polaroid' ? (mobile ? 68 : 72) : layout === 'grid' ? (mobile ? 56 : 60) : (mobile ? 80 : 84));

  return (
    <div style={{
      width: w, height: h, background: '#FFFFFF', borderRadius: size === 'lg' ? 8 : 4,
      boxShadow: size === 'lg' ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      padding: size === 'lg' ? 12 : 5, display: 'grid', gap: size === 'lg' ? 6 : 3,
      gridTemplateColumns: isGrid ? '1fr 1fr' : '1fr',
      gridTemplateRows: isGrid ? '1fr 1fr' : `repeat(${slots}, 1fr)`,
      boxSizing: 'border-box',
      border: `1px solid ${T.line}`
    }}>
      {Array.from({ length: slots }).map((_, i) => (
        <div key={i} style={{
          borderRadius: size === 'lg' ? 4 : 2,
          background: T.placeholderFill || '#EFEDEA' // #EFEDEA placeholderFill
        }} />
      ))}
    </div>
  );
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
      padding: mobile ? '12px 20px' : '14px 20px', marginBottom: mobile ? 14 : 20,
      background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
      <button onClick={back} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.ink, padding: '6px 8px', marginLeft: -8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
        {back && <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 2L4 8l6 6" /></svg>}
        {back ? 'Back' : ''}
      </button>
      <div style={{ textAlign: 'center' }}>
        <StepDots step={step} T={T} />
        {title && <div style={{ marginTop: 5, fontSize: 10, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>}
      </div>
      <div style={{ minWidth: 60, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. LANDING — Life Plus aesthetic
// ═══════════════════════════════════════════════════════════════
const I18N = {
  ko: {
    mobileSub: '나만의 포토부스 IMMM',
    desc1: '한 장에 담는 순간들.',
    desc2: '나만의 포토부스 IMMM.',
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

function LandingV2({ T, variant, go, mobile, onStart, onEdit, onFrames, onGallery, lang = 'ko', setLang }) {
  const WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function'
    ? window.FrameThumb
    : null;

  const t = I18N[lang] || I18N.ko;
  const toggleLang = () => setLang(l => l === 'ko' ? 'en' : l === 'en' ? 'jp' : 'ko');

  const logoMark = (size = 48) =>
  <svg width={size * 1.4} height={size} viewBox="0 0 70 50">
      <path d="M42 8 C52 6 64 12 66 24 C68 36 58 46 46 44 C36 42 28 34 22 28 C16 22 10 16 16 10 C22 4 34 10 42 8Z" fill={T.ink} />
    </svg>;


  if (mobile) {
    return (
      <div style={{ height: '100%', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '60px 32px 40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button onClick={toggleLang} style={{ background: 'rgba(26,26,31,0.05)', borderRadius: 999, border: 'none', color: T.ink, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', padding: '6px 12px', letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.2s' }}>
            {lang}
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
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
          <button onClick={onGallery} style={{
            width: '100%', padding: '12px 16px', background: 'transparent', color: T.inkSoft,
            border: 'none', borderRadius: 0, cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.7, textTransform: 'uppercase',
            fontFamily: '"Plus Jakarta Sans",system-ui'
          }}>Gallery</button>
        </div>
      </div>);

  }

  // Desktop
  return (
    <div style={{ height: '100%', background: 'transparent', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Left */}
      <div style={{ padding: '48px 56px', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Plus Jakarta Sans",system-ui', fontSize: 11, fontWeight: 700, letterSpacing: 6, color: T.ink }}>I M M M</div>
          <div style={{ display: 'flex', gap: 28, fontSize: 11, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1.5, textTransform: 'uppercase', alignItems: 'center' }}>
            <button onClick={onGallery} style={{ background:'transparent', border:'none', color:T.inkSoft, cursor:'pointer', font: 'inherit', letterSpacing:'inherit', textTransform:'inherit', padding:0 }}>Gallery</button>
            <button onClick={onFrames} style={{ background:'transparent', border:'none', color:T.inkSoft, cursor:'pointer', font: 'inherit', letterSpacing:'inherit', textTransform:'inherit', padding:0 }}>Frames</button>
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

      {/* Right — Gallery Image */}
      <div style={{ background: 'transparent', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <img src="asset/main.jpg" style={{ 
          width: '120%', height: 'auto', maxWidth: 'none', 
          transform: 'translateX(10%)', // Shift right to show the collage better
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.05))',
          userSelect: 'none', pointerEvents: 'none'
        }} />
      </div>
    </div>);

}

// ═══════════════════════════════════════════════════════════════
// 2. SETUP — Frame + Filter + Pre-stickers
// ═══════════════════════════════════════════════════════════════
const ZoomMinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M4 9H14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

const ZoomPlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
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

function getStickerPickerPacks() {
  return typeof getVisibleStickerPacks === 'function'
    ? getVisibleStickerPacks()
    : Object.entries(STICKER_CATALOG).filter(([k, pack]) => !pack.hidden);
}

function formatFrameDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (_) {
    return String(value);
  }
}

function SetupScreen({ T, go, mobile, variant, layout, setLayout, filter, setFilter, preStickers, setPreStickers, logo, setLogo, dateText, setDateText, orientation, setOrientation, frameColor, setFrameColor, accent, editMode, shots, setShots, setSelected, setUseWebgl, tweaks, startNewCaptureSession, framePreset, framePresets = [], framePackList = [], customFrames = [], selectedFramePresetId, applyFramePreset, saveCustomFrame, exportCustomFramesAsJson, importFramePackFromJson, openDesigner, renameCustomFrame, duplicateCustomFrame, deleteCustomFrame, favoriteFramePresetIds = [], toggleFavoriteFramePreset, favoriteFramePackIds = [], toggleFavoriteFramePack, unlockFramePackForDev, unlockedFramePackIds = [], frameLikeIds = [], toggleFrameLike, frameUseCounts = {}, recordFrameUse, creatorProfiles = [], setCreatorProfiles, exportPresetId = 'hd', setExportPresetId, generateFrameIdea, designerDraftRecovery = null, clearDesignerDraftRecovery, storeTabFocus = '' }) {
  const WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function'
    ? window.FrameThumb
    : null;

  const [tab, setTab] = uS(() => editMode ? 'photos' : 'frame'); // photos | frame | filter | companions
  const [frameStoreOpen, setFrameStoreOpen] = uS(true);
  const [frameStoreMode, setFrameStoreMode] = uS('sheet');
  const [storeTab, setStoreTab] = uS('featured');
  const [frameCategory, setFrameCategory] = uS('basic');
  const [activePackId, setActivePackId] = uS(framePackList?.[0]?.id || 'basic-clean-pack');
  const [storeFilter, setStoreFilter] = uS('all');
  const [storeSort, setStoreSort] = uS('recommended');
  const [storeSearch, setStoreSearch] = uS('');
  const [importJsonText, setImportJsonText] = uS('');
  const [storeUpsellPack, setStoreUpsellPack] = uS(null);
  const [importMessage, setImportMessage] = uS('');
  const [selectedCreatorId, setSelectedCreatorId] = uS('');
  const [selStId, setSelStId] = uS(null);
  const [expandedPacks, setExpandedPacks] = uS({});
  const fileRef = uR(null);
  const frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  const savedFrames = uM(() => (Array.isArray(customFrames) ? customFrames : []).filter((preset) => !preset.deletedAt), [customFrames]);
  const allStorePresets = uM(() => Array.isArray(framePresets) ? framePresets : [], [framePresets]);
  const allPacks = uM(() => Array.isArray(framePackList) ? framePackList : [], [framePackList]);
  const categoryTabs = uM(() => {
    if (frameApi && typeof frameApi.getFramePresetCategories === 'function') {
      return frameApi.getFramePresetCategories(savedFrames);
    }
    return [
      { id: 'basic', label: 'Basic' },
      { id: 'character', label: 'Character' },
      { id: 'travel', label: 'Travel' },
      { id: 'birthday', label: 'Birthday' },
      { id: 'couple', label: 'Couple' },
      { id: 'my-frames', label: 'My Frames', count: savedFrames.length },
    ];
  }, [frameApi, savedFrames]);
  const selectedFramePreset = uM(() => {
    if (!selectedFramePresetId) return framePreset || null;
    return allStorePresets.find((preset) => preset.id === selectedFramePresetId) || framePreset || null;
  }, [allStorePresets, framePreset, selectedFramePresetId]);
  const layoutMatchedFramePreset = uM(() => {
    const currentLayout = frameApi?.normalizePresetLayout?.(layout) || layout;
    const selectedLayout = selectedFramePreset?.layout
      ? (frameApi?.normalizePresetLayout?.(selectedFramePreset.layout) || selectedFramePreset.layout)
      : '';
    if (selectedFramePreset && selectedLayout === currentLayout) {
      return selectedFramePreset;
    }
    const layoutPreset = allStorePresets.find((preset) => {
      const presetLayout = frameApi?.normalizePresetLayout?.(preset.layout) || preset.layout;
      return presetLayout === currentLayout;
    }) || null;
    return layoutPreset || framePreset || selectedFramePreset || null;
  }, [allStorePresets, frameApi, framePreset, layout, selectedFramePreset]);
  const selectedPack = uM(() => allPacks.find((pack) => pack.id === activePackId) || allPacks[0] || null, [activePackId, allPacks]);
  const packPresets = uM(() => {
    if (!selectedPack) return [];
    if (frameApi && typeof frameApi.getFramePresetsByPack === 'function') {
      return frameApi.getFramePresetsByPack(selectedPack.id, savedFrames);
    }
    return allStorePresets.filter((preset) => preset.packId === selectedPack.id || preset.id === selectedPack.coverPresetId);
  }, [allStorePresets, frameApi, savedFrames, selectedPack]);
  const storePresetSource = uM(() => {
    const collection = [...allStorePresets, ...savedFrames];
    const byId = new Map();
    collection.forEach((preset) => {
      if (preset?.id && !byId.has(preset.id)) byId.set(preset.id, preset);
    });
    return Array.from(byId.values());
  }, [allStorePresets, savedFrames]);
  const creatorLookup = uM(() => {
    const map = new Map();
    (Array.isArray(creatorProfiles) ? creatorProfiles : []).forEach((profile) => {
      if (profile?.id) map.set(profile.id, profile);
    });
    return map;
  }, [creatorProfiles]);
  const selectedCreatorProfile = uM(() => {
    if (!selectedCreatorId) return null;
    return creatorLookup.get(selectedCreatorId) || null;
  }, [creatorLookup, selectedCreatorId]);
  const getPresetUseCount = uM(() => {
    const counts = frameApi?.getFrameUseCounts?.() || {};
    return (preset) => Number(counts?.[preset?.id]) || 0;
  }, [frameApi]);
  const getPresetLikeCount = uM(() => {
    const likes = new Set(favoriteFramePresetIds || []);
    return (preset) => (likes.has(preset?.id) ? 1 : 0);
  }, [favoriteFramePresetIds]);
  const getPackTrendingScore = uM(() => {
    return (pack) => {
      const presets = (pack?.presetIds || [])
        .map((id) => storePresetSource.find((preset) => preset.id === id) || null)
        .filter(Boolean);
      const likes = presets.reduce((sum, preset) => sum + getPresetLikeCount(preset), 0);
      const uses = presets.reduce((sum, preset) => sum + getPresetUseCount(preset), 0);
      return likes * 3 + uses * 2 + (pack?.featured ? 12 : 0);
    };
  }, [getPresetLikeCount, getPresetUseCount, storePresetSource]);
  const visibleStorePresets = uM(() => {
    const q = storeSearch.trim().toLowerCase();
    let items = storePresetSource.filter((preset) => {
      if (!preset) return false;
      if (storeFilter === 'free') return (preset.packPriceType || 'free') === 'free';
      if (storeFilter === 'premium') return (preset.packPriceType || 'free') === 'premium';
      if (storeFilter === 'mine') return preset.source === 'custom';
      if (storeFilter === 'imported') return preset.source === 'imported';
      return true;
    });
    if (storeTab === 'favorites') {
      items = items.filter((preset) => favoriteFramePresetIds.includes(preset.id));
    } else if (storeTab === 'my-frames') {
      items = items.filter((preset) => preset.source === 'custom' || preset.source === 'imported');
    } else if (storeTab === 'all') {
      items = items.filter(Boolean);
    } else if (storeTab === 'featured') {
      const featuredPackIds = allPacks.filter((pack) => pack.featured).map((pack) => pack.id);
      items = items.filter((preset) => featuredPackIds.includes(preset.packId) || featuredPackIds.includes(frameApi?.getFramePackById?.(preset.packId, savedFrames)?.id));
    }
    if (q) {
      items = items.filter((preset) => {
        const pack = preset.packId ? (frameApi?.getFramePackById?.(preset.packId, savedFrames) || allPacks.find((item) => item.id === preset.packId) || null) : null;
        const hay = [
          preset.name,
          preset.category,
          preset.layout,
          preset.source,
          preset.author?.name,
          preset.packName,
          pack?.name,
          ...(Array.isArray(preset.packTags) ? preset.packTags : []),
          ...(Array.isArray(pack?.tags) ? pack.tags : []),
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...items];
    if (storeSort === 'newest') {
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } else if (storeSort === 'az') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (storeSort === 'most-used') {
      sorted.sort((a, b) => getPresetUseCount(b) - getPresetUseCount(a));
    } else if (storeSort === 'trending') {
      sorted.sort((a, b) => {
        const aScore = (a.trendingScore || 0) + getPresetLikeCount(a) * 2 + getPresetUseCount(a);
        const bScore = (b.trendingScore || 0) + getPresetLikeCount(b) * 2 + getPresetUseCount(b);
        return bScore - aScore;
      });
    } else {
      sorted.sort((a, b) => {
        const aPack = a.packId ? allPacks.find((pack) => pack.id === a.packId) : null;
        const bPack = b.packId ? allPacks.find((pack) => pack.id === b.packId) : null;
        const aFav = favoriteFramePresetIds.includes(a.id) ? 1 : 0;
        const bFav = favoriteFramePresetIds.includes(b.id) ? 1 : 0;
        const aScore = (aPack?.featured ? 10 : 0) + (aPack?.locked ? 1 : 0) + aFav;
        const bScore = (bPack?.featured ? 10 : 0) + (bPack?.locked ? 1 : 0) + bFav;
        return bScore - aScore;
      });
    }
    return sorted;
  }, [allPacks, favoriteFramePresetIds, frameApi, getPresetLikeCount, getPresetUseCount, savedFrames, storeFilter, storePresetSource, storeSearch, storeSort, storeTab]);
  const visiblePacks = uM(() => {
    const packs = [...allPacks];
    const q = storeSearch.trim().toLowerCase();
    let items = packs;
    if (storeTab === 'featured') {
      items = packs.filter((pack) => pack.featured);
    } else if (storeTab === 'favorites') {
      items = packs.filter((pack) => pack.presetIds.some((id) => favoriteFramePresetIds.includes(id)));
    } else if (storeTab === 'my-frames') {
      items = [];
    } else if (storeTab === 'free') {
      items = packs.filter((pack) => (pack.priceType || 'free') === 'free');
    } else if (storeTab === 'premium') {
      items = packs.filter((pack) => (pack.priceType || 'free') === 'premium');
    } else if (storeTab === 'imported') {
      items = packs.filter((pack) => pack.source === 'imported');
    }
    if (q) {
      items = items.filter((pack) => {
        const hay = [pack.name, pack.description, ...(pack.tags || []), pack.category, pack.priceLabel].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    if (storeSort === 'newest') {
      items = [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } else if (storeSort === 'az') {
      items = [...items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (storeSort === 'most-used') {
      items = [...items].sort((a, b) => getPackTrendingScore(b) - getPackTrendingScore(a));
    } else if (storeSort === 'trending') {
      items = [...items].sort((a, b) => getPackTrendingScore(b) - getPackTrendingScore(a));
    }
    return items;
  }, [allPacks, favoriteFramePresetIds, getPackTrendingScore, storeSearch, storeSort, storeTab]);
  const activePackBlocked = Boolean(selectedPack?.locked && !(frameApi?.isFramePackUnlocked?.(selectedPack.id) ?? unlockedFramePackIds.includes(selectedPack?.id)));
  const devUnlockVisible = typeof window !== 'undefined' && (
    window.IMMM_FIELD_TEST === true ||
    window.IMMM_DEBUG_BUILD === true ||
    new URLSearchParams(location.search).get('fieldTest') === '1'
  );
  const getFramePreviewAspect = (preset, fallbackLayout = layout) => {
    const size = preset?.canvasSize || frameApi?.getCanvasSizeForLayout?.(fallbackLayout) || { width: 560, height: 1808 };
    return `${Math.max(1, Number(size.width) || 560)} / ${Math.max(1, Number(size.height) || 1808)}`;
  };
  const visibleFramePresets = uM(() => {
    if (frameCategory === 'my-frames') return savedFrames;
    return allStorePresets.filter((preset) => preset.category === frameCategory && preset.source !== 'custom');
  }, [allStorePresets, frameCategory, savedFrames]);
  const recommendedFramePresets = uM(() => allStorePresets.filter((preset) => preset.category === 'basic' || preset.category === 'character').slice(0, 6), [allStorePresets]);
  const selectedPackCoverPreset = selectedPack
    ? (packPresets.find((preset) => preset.id === selectedPack.coverPresetId) || packPresets[0] || allStorePresets.find((preset) => preset.id === selectedPack.coverPresetId) || null)
    : null;
  const selectedPackIsUnlocked = selectedPack
    ? Boolean((frameApi?.isFramePackUnlocked?.(selectedPack.id) ?? unlockedFramePackIds.includes(selectedPack.id)) || !selectedPack.locked)
    : false;
  const packTabs = [
    { id: 'featured', label: 'Featured' },
    { id: 'free', label: 'Free' },
    { id: 'premium', label: 'Premium' },
    { id: 'my-frames', label: 'My Frames' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'imported', label: 'Imported' },
    { id: 'all', label: 'All Presets' },
  ];

  React.useEffect(() => {
    if (!selectedPack && allPacks.length > 0) {
      setActivePackId(allPacks[0].id);
    }
  }, [allPacks, selectedPack]);
  React.useEffect(() => {
    if (selectedFramePreset?.packId && allPacks.some((pack) => pack.id === selectedFramePreset.packId)) {
      setActivePackId(selectedFramePreset.packId);
    }
  }, [allPacks, selectedFramePreset?.packId]);
  React.useEffect(() => {
    if (storeTabFocus && storeTabFocus !== storeTab) {
      setStoreTab(storeTabFocus);
    }
  }, [storeTab, storeTabFocus]);

  const addPreset = (libId) => {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    const sizeNorm = typeof getDefaultStickerSizeNorm === 'function'
      ? getDefaultStickerSizeNorm(item)
      : undefined;
    setPreStickers((prev) => [...prev, makeSticker('preset', { libId }, { sizeNorm })]);
  };
  const addUpload = (dataUrl) => {
    const img = new Image();
    img.onload = () => {
      setPreStickers((prev) => [...prev, makeSticker('upload', {
        dataUrl,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      }, { scale: 0.6 })]);
    };
    img.onerror = () => setPreStickers((prev) => [...prev, makeSticker('upload', { dataUrl }, { scale: 0.6 })]);
    img.src = dataUrl;
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
      const maxS = mobile ? 0.92 : 1.4;
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

  const frameW = layout === 'polaroid' ? 200 :
        (orientation === 'landscape' && layout === 'strip') ? 360 :
        (orientation === 'landscape' && layout === 'trip')  ? 280 :
        layout === 'grid' ? 220 : 160;

  const preview =
  <div ref={setupContainerRef} style={{ overflow: 'hidden', width: '100%', height: '100%', position: 'relative' }}>
      <div ref={setupFrameRef} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${setupZoom})`, transformOrigin: 'center' }}>
        <StickerCanvas
          T={T}
          stickers={preStickers}
          setStickers={setPreStickers}
          selectedId={selStId}
          setSelectedId={setSelStId}
          width={frameW}
          canvasW={frameW}
          height="auto"
          layout={layout}
        >
          {WFrameThumb ? (
            <WFrameThumb key={`${frameColor}-${layoutMatchedFramePreset?.id || selectedFramePreset?.id || 'base'}`} layout={layout} shots={[{ filter }, { filter }, { filter }, { filter }]} selected={[0, 1, 2, 3]} T={T}
              logo={logo} dateText={dateText} accent={accent} scale={1} orientation={orientation} frameColor={frameColor} framePreset={layoutMatchedFramePreset} />
          ) : (
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
              <FramePickerFallback layout={layout} T={T} size="lg" />
              <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: T.inkSoft, whiteSpace: 'nowrap' }}>
                Preview loading...
              </div>
            </div>
          )}
        </StickerCanvas>
      </div>
    </div>;


  const frameTab =
  <div>
      <Kick T={T}>Choose your frame · 프레임 선택</Kick>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, width: '100%' }}>
        {[
          { id: 'strip',    en: '1×4 Strip', ko: '스트립' },
          { id: 'trip',     en: '1×3',       ko: '트리플' },
          { id: 'grid',     en: '2×2 Grid',  ko: '그리드' },
          { id: 'polaroid', en: '1×1',       ko: '폴라로이드' },
        ].map((o) => {
          const resolveFrameTemplate = (layoutId) => {
            if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
              return window.getFrameTemplateSafe(layoutId);
            }
            if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
              return window.getFrameTemplate(layoutId);
            }
            return null;
          };

          const tpl = resolveFrameTemplate(o.id);
          const canRenderRealThumb = Boolean(WFrameThumb && tpl);
          const pickerThumbScale = mobile ? 0.235 : 0.28;
          const layoutPreset = layoutMatchedFramePreset?.layout === o.id
            ? layoutMatchedFramePreset
            : allStorePresets.find((preset) => preset.layout === o.id) || null;

          if (typeof window !== 'undefined' && window.IMMM_DEBUG_BUILD) {
            console.warn('[IMMM frame picker]', {
              hasFrameThumb: typeof window.FrameThumb === 'function',
              hasGetFrameTemplateSafe: typeof window.getFrameTemplateSafe === 'function',
              layout: o.id,
              canRenderRealThumb,
            });
          }

          return (
            <button key={o.id} onClick={() => setLayout(o.id)}
              style={{
                padding: '14px 8px 10px', background: layout === o.id ? T.card : '#FFFFFF',
                border: 'none', borderRadius: 16, cursor: 'pointer',
                boxShadow: layout === o.id ? `0 1px 4px rgba(0,0,0,0.06), 0 0 0 2px ${T.ink} inset` : `0 0 0 1px ${T.line} inset`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.25s',
              }}>
              <div style={{ position: 'relative', width: '100%', height: 84, overflow: 'hidden', pointerEvents: 'none', display: 'grid', placeItems: 'center' }}>
                {canRenderRealThumb ? (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${pickerThumbScale})`, zIndex: 2 }}>
                    <WFrameThumb key={`${frameColor}-${o.id}`} layout={o.id} shots={shotsPreview} selected={[0, 1, 2, 3]} T={T}
                      logo={false} dateText={false} accent={accent} scale={1}
                      orientation="portrait" frameColor={frameColor} framePreset={layoutPreset} />
                  </div>
                ) : (
                  <FramePickerFallback layout={o.id} T={T} size="sm" />
                )}
                {tpl?.recommended && <div style={{ position: 'absolute', top: 4, left: 5, zIndex: 5 }}><StoreBadge T={T}>Pick</StoreBadge></div>}
              </div>
              <div style={{ fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
                {o.en}<span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4, fontFamily: 'Pretendard,system-ui' }}>{o.ko}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 18,
        background: frameStoreMode === 'full' ? 'rgba(252,252,250,0.96)' : T.softSurface,
        border: `1px solid ${T.line}`,
        boxShadow: frameStoreMode === 'full' ? '0 24px 80px rgba(0,0,0,0.18)' : 'none',
        position: frameStoreMode === 'full' ? 'fixed' : 'relative',
        inset: frameStoreMode === 'full' ? (mobile ? 12 : 18) : 'auto',
        zIndex: frameStoreMode === 'full' ? 40 : 'auto',
        overflowY: 'auto',
        maxHeight: frameStoreMode === 'full' ? 'calc(100vh - 24px)' : (mobile ? '72vh' : '76vh'),
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, position: frameStoreMode === 'full' ? 'sticky' : 'relative', top: frameStoreMode === 'full' ? 0 : 'auto', zIndex: 2, background: frameStoreMode === 'full' ? 'rgba(252,252,250,0.96)' : 'transparent', paddingBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <Kick T={T}>Frame Store</Kick>
            <div style={{ marginTop: 4, fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
              {layoutMatchedFramePreset ? `${layoutMatchedFramePreset.name} · ${layoutMatchedFramePreset.layout} · ${layoutMatchedFramePreset.photoSlots?.length || 0}컷` : 'Pick, save, rename, and reuse frame presets.'}
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button
              onClick={() => openDesigner && openDesigner({ mode: 'new', preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null })}
              style={{
                border: 'none',
                background: T.ink,
                color: T.bg,
                borderRadius: 999,
                padding: '8px 12px',
                minHeight: 44,
                minWidth: 44,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: '"Plus Jakarta Sans",system-ui'
              }}
            >
              Create Frame
            </button>
            <button
              onClick={() => setFrameStoreMode((v) => v === 'full' ? 'sheet' : 'full')}
              style={{
                border: 'none',
                background: frameStoreMode === 'full' ? T.ink : 'rgba(26,26,31,0.06)',
                color: frameStoreMode === 'full' ? T.bg : T.ink,
                borderRadius: 999,
                padding: '8px 12px',
                minHeight: 44,
                minWidth: 44,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: '"Plus Jakarta Sans",system-ui'
              }}
            >
              {frameStoreMode === 'full' ? 'Shrink' : 'Expand'}
            </button>
            <button
              onClick={() => setFrameStoreOpen((v) => !v)}
              style={{
                border: 'none',
                background: frameStoreOpen ? T.ink : 'rgba(26,26,31,0.06)',
                color: frameStoreOpen ? T.bg : T.ink,
                borderRadius: 999,
                padding: '8px 12px',
                minHeight: 44,
                minWidth: 44,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
                letterSpacing: 1,
                textTransform: 'uppercase',
                fontFamily: '"Plus Jakarta Sans",system-ui'
              }}
            >
              {frameStoreOpen ? 'Close' : 'Open'}
            </button>
          </div>
        </div>

        {frameStoreOpen && (
          <>
            <div style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 18,
              background: '#FFFFFF',
              border: `1px solid ${T.line}`,
              display: 'grid',
              gap: 12,
            }}>
              <div style={{
                display: 'flex',
                flexDirection: mobile ? 'column' : 'row',
                gap: 10,
                alignItems: mobile ? 'stretch' : 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>Frame Store</div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                    Packs, presets, favorites, and imports in one place.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <StoreBadge T={T} tone="light">{allPacks.length} packs</StoreBadge>
                  <StoreBadge T={T} tone="light">{savedFrames.length} my frames</StoreBadge>
                  <StoreBadge T={T} tone="light">{favoriteFramePresetIds.length} favorites</StoreBadge>
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.1fr) minmax(260px, 0.9fr)',
                gap: 12,
              }}>
                <div style={{
                  borderRadius: 18,
                  border: `1px solid ${T.line}`,
                  background: 'rgba(26,26,31,0.015)',
                  padding: 12,
                  display: 'grid',
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {packTabs.map((tabItem) => (
                      <button
                        key={tabItem.id}
                        onClick={() => setStoreTab(tabItem.id)}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '10px 12px',
                          minHeight: 44,
                          background: storeTab === tabItem.id ? T.ink : 'rgba(26,26,31,0.06)',
                          color: storeTab === tabItem.id ? T.bg : T.inkSoft,
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: 'pointer',
                          letterSpacing: 0.8,
                          fontFamily: '"Plus Jakarta Sans",system-ui',
                          textTransform: 'uppercase',
                          flex: '0 0 auto',
                        }}
                      >
                        {tabItem.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 120px', gap: 8 }}>
                    <input
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      placeholder="Search packs, presets, tags"
                      style={{
                        minHeight: 44,
                        padding: '0 12px',
                        borderRadius: 12,
                        border: `1px solid ${T.line}`,
                        background: '#FFFFFF',
                        color: T.ink,
                        fontSize: 12,
                        fontFamily: 'Pretendard,system-ui',
                      }}
                    />
                    <select
                      value={storeFilter}
                      onChange={(e) => setStoreFilter(e.target.value)}
                      style={{
                        minHeight: 44,
                        padding: '0 12px',
                        borderRadius: 12,
                        border: `1px solid ${T.line}`,
                        background: '#FFFFFF',
                        color: T.ink,
                        fontSize: 12,
                        fontFamily: 'Pretendard,system-ui',
                      }}
                    >
                      <option value="all">All</option>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="mine">Mine</option>
                      <option value="imported">Imported</option>
                    </select>
                    <select
                      value={storeSort}
                      onChange={(e) => setStoreSort(e.target.value)}
                      style={{
                        minHeight: 44,
                        padding: '0 12px',
                        borderRadius: 12,
                        border: `1px solid ${T.line}`,
                        background: '#FFFFFF',
                        color: T.ink,
                        fontSize: 12,
                        fontFamily: 'Pretendard,system-ui',
                      }}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="trending">Trending</option>
                      <option value="most-used">Most Used</option>
                      <option value="newest">Newest</option>
                      <option value="az">A-Z</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>
                        Featured Packs
                      </div>
                      <StoreBadge T={T} tone="light">{visiblePacks.length}</StoreBadge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                      {visiblePacks.slice(0, 4).map((pack) => {
                        const packUnlocked = Boolean((frameApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)) || !pack.locked);
                        const coverPreset = allStorePresets.find((preset) => preset.id === pack.coverPresetId) || packPresets[0] || null;
                        return (
                          <div
                            key={pack.id}
                            style={{
                              borderRadius: 16,
                              border: `1px solid ${pack.id === selectedPack?.id ? T.ink : T.line}`,
                              background: pack.id === selectedPack?.id ? T.card : '#FFFFFF',
                              padding: 12,
                              display: 'grid',
                              gap: 10,
                              minWidth: 0,
                            }}
                          >
                            <button
                              onClick={() => {
                                setActivePackId(pack.id);
                                setStoreTab(pack.priceType === 'premium' ? 'premium' : 'featured');
                                setFrameStoreMode('full');
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                cursor: 'pointer',
                                textAlign: 'left',
                                minWidth: 0,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>{pack.name}</div>
                                <StoreBadge T={T} tone="light">{pack.priceLabel}</StoreBadge>
                              </div>
                              <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                {pack.description}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                {pack.presetIds.length} presets · {pack.category}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                {pack.author?.name || 'IMMM Studio'} · {pack.license || 'internal'} · Trend {Math.round(getPackTrendingScore(pack))}
                              </div>
                              <div style={{ margin: '10px auto 0', height: 128, aspectRatio: getFramePreviewAspect(coverPreset, coverPreset?.layout || 'strip'), maxWidth: '100%', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                                {WFrameThumb && coverPreset ? (
                                  <WFrameThumb
                                    key={`${pack.id}-${coverPreset.id}`}
                                    layout={coverPreset.layout}
                                    shots={shotsPreview}
                                    selected={[0, 1, 2, 3]}
                                    T={T}
                                    logo={false}
                                    dateText={false}
                                    accent={accent}
                                    scale={0.82}
                                    orientation="portrait"
                                    frameColor={frameColor}
                                    framePreset={coverPreset}
                                    fill
                                  />
                                ) : (
                                  <FramePickerFallback layout={coverPreset?.layout || 'strip'} T={T} size="sm" />
                                )}
                              </div>
                            </button>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  setActivePackId(pack.id);
                                  if (!packUnlocked && pack.locked) {
                                    setStoreUpsellPack(pack);
                                    return;
                                  }
                                  if (coverPreset) {
                                    applyFramePreset && applyFramePreset(coverPreset);
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: packUnlocked ? T.ink : 'rgba(26,26,31,0.08)',
                                  color: packUnlocked ? T.bg : T.ink,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                {packUnlocked ? 'View Pack' : 'Preview only'}
                              </button>
                              {!packUnlocked && (
                                <button
                                  onClick={() => setStoreUpsellPack(pack)}
                                  style={{
                                    border: '1px solid rgba(26,26,31,0.12)',
                                    borderRadius: 999,
                                    padding: '10px 12px',
                                    minHeight: 44,
                                    background: '#FFFFFF',
                                    color: T.ink,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: 1,
                                    textTransform: 'uppercase',
                                    fontFamily: '"Plus Jakarta Sans",system-ui',
                                  }}
                                >
                                  Unlock coming soon
                                </button>
                              )}
                              <button
                                onClick={() => toggleFavoriteFramePack && toggleFavoriteFramePack(pack.id)}
                                style={{
                                  border: `1px solid ${T.line}`,
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: favoriteFramePackIds.includes(pack.id) ? T.ink : '#FFFFFF',
                                  color: favoriteFramePackIds.includes(pack.id) ? T.bg : T.ink,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                {favoriteFramePackIds.includes(pack.id) ? 'Pack Fav' : 'Fav Pack'}
                              </button>
                              {devUnlockVisible && pack.locked && !packUnlocked && (
                                <button
                                  onClick={() => unlockFramePackForDev && unlockFramePackForDev(pack.id)}
                                  style={{
                                    border: 'none',
                                    borderRadius: 999,
                                    padding: '10px 12px',
                                    minHeight: 44,
                                    background: 'rgba(17,17,17,0.08)',
                                    color: T.ink,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: 1,
                                    textTransform: 'uppercase',
                                    fontFamily: '"Plus Jakarta Sans",system-ui',
                                  }}
                                >
                                  Unlock for Dev
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedPack && (
                    <div style={{
                      marginTop: 4,
                      borderRadius: 16,
                      border: `1px solid ${T.line}`,
                      background: '#FFFFFF',
                      padding: 12,
                      display: 'grid',
                      gap: 10,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>{selectedPack.name}</div>
                          <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                            {selectedPack.description}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <StoreBadge T={T} tone="light">{selectedPack.priceLabel}</StoreBadge>
                          <StoreBadge T={T} tone="light">{selectedPack.presetIds.length} presets</StoreBadge>
                          <StoreBadge T={T} tone="light">{selectedPackIsUnlocked ? 'Unlocked' : 'Locked'}</StoreBadge>
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        Author: {selectedPack.author?.name || 'IMMM Studio'} · License: {selectedPack.license || 'internal'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            if (!selectedPackCoverPreset) return;
                            if (!selectedPackIsUnlocked && selectedPack.locked) {
                              setStoreUpsellPack(selectedPack);
                              return;
                            }
                            applyFramePreset && applyFramePreset(selectedPackCoverPreset);
                          }}
                          style={{
                            border: 'none',
                            borderRadius: 999,
                            padding: '10px 12px',
                            minHeight: 44,
                            background: selectedPackIsUnlocked ? T.ink : 'rgba(26,26,31,0.08)',
                            color: selectedPackIsUnlocked ? T.bg : T.ink,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            fontFamily: '"Plus Jakarta Sans",system-ui',
                          }}
                        >
                          {selectedPackIsUnlocked ? 'Apply pack preset' : 'Preview only'}
                        </button>
                        {!selectedPackIsUnlocked && (
                          <button
                            onClick={() => setStoreUpsellPack(selectedPack)}
                            style={{
                              border: '1px solid rgba(26,26,31,0.12)',
                              borderRadius: 999,
                              padding: '10px 12px',
                              minHeight: 44,
                              background: '#FFFFFF',
                              color: T.ink,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              fontFamily: '"Plus Jakarta Sans",system-ui',
                            }}
                          >
                            Unlock coming soon
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                        {packPresets.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => applyFramePreset && applyFramePreset(preset)}
                            style={{
                              border: `1px solid ${selectedFramePresetId === preset.id ? T.ink : T.line}`,
                              borderRadius: 14,
                              background: selectedFramePresetId === preset.id ? T.card : '#FFFFFF',
                              padding: 10,
                              minHeight: 44,
                              cursor: 'pointer',
                              display: 'grid',
                              gap: 8,
                              textAlign: 'left',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>{preset.name}</span>
                              {favoriteFramePresetIds.includes(preset.id) && <StoreBadge T={T} tone="light">Fav</StoreBadge>}
                            </div>
                            <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                              {preset.layout} · {preset.photoSlots.length}컷
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {storeUpsellPack && (
                    <div style={{
                      borderRadius: 16,
                      border: `1px solid ${T.line}`,
                      background: 'rgba(26,26,31,0.02)',
                      padding: 12,
                      display: 'grid',
                      gap: 8,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>
                        This frame pack is premium
                      </div>
                      <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        Unlock coming soon. You can preview the pack, but applying is blocked until it is unlocked.
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setStoreUpsellPack(null)}
                          style={{
                            border: 'none',
                            borderRadius: 999,
                            padding: '10px 12px',
                            minHeight: 44,
                            background: T.ink,
                            color: T.bg,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            fontFamily: '"Plus Jakarta Sans",system-ui',
                          }}
                        >
                          Preview only
                        </button>
                        {devUnlockVisible && storeUpsellPack.locked && (
                          <button
                            onClick={() => unlockFramePackForDev && unlockFramePackForDev(storeUpsellPack.id)}
                            style={{
                              border: 'none',
                              borderRadius: 999,
                              padding: '10px 12px',
                              minHeight: 44,
                              background: 'rgba(17,17,17,0.08)',
                              color: T.ink,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              fontFamily: '"Plus Jakarta Sans",system-ui',
                            }}
                          >
                            Unlock for Dev
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedCreatorProfile && (
                    <div style={{
                      borderRadius: 16,
                      border: `1px solid ${T.line}`,
                      background: '#FFFFFF',
                      padding: 12,
                      display: 'grid',
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>
                            {selectedCreatorProfile.name}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                            {selectedCreatorProfile.handle || '@immm'} · {selectedCreatorProfile.bio || 'Creator profile'}
                          </div>
                        </div>
                        <button onClick={() => setSelectedCreatorId('')} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                          Close
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <StoreBadge T={T} tone="light">{selectedCreatorProfile.verified ? 'Verified' : 'Creator'}</StoreBadge>
                        <StoreBadge T={T} tone="light">{selectedCreatorProfile.packsCreated || 0} packs</StoreBadge>
                        <StoreBadge T={T} tone="light">{selectedCreatorProfile.likes || 0} likes</StoreBadge>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{
                  borderRadius: 18,
                  border: `1px solid ${T.line}`,
                  background: '#FFFFFF',
                  padding: 12,
                  display: 'grid',
                  gap: 10,
                  alignContent: 'start',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>My Frames</div>
                      <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        Save, rename, duplicate, soft delete, export, and import.
                      </div>
                    </div>
                    <StoreBadge T={T} tone="light">{savedFrames.length}</StoreBadge>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    <textarea
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder="Paste frame pack JSON here"
                      style={{
                        width: '100%',
                        minHeight: 120,
                        resize: 'vertical',
                        borderRadius: 12,
                        border: `1px solid ${T.line}`,
                        padding: 12,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: T.ink,
                        background: '#FFFFFF',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          const raw = exportCustomFramesAsJson ? exportCustomFramesAsJson() : '';
                          if (!raw) return;
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(raw).catch(() => {});
                          }
                          setImportMessage('Exported current frames as JSON.');
                        }}
                        style={{
                          border: 'none',
                          borderRadius: 999,
                          padding: '10px 12px',
                          minHeight: 44,
                          background: T.ink,
                          color: T.bg,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          fontFamily: '"Plus Jakarta Sans",system-ui',
                        }}
                      >
                        Export My Frames as JSON
                      </button>
                      <button
                        onClick={() => {
                          const result = importFramePackFromJson ? importFramePackFromJson(importJsonText) : { ok: false, error: 'Import unavailable' };
                          if (result?.ok) setStoreTab('imported');
                          setImportMessage(result.ok ? `Imported ${result.presets?.length || 0} frames.` : result.error || 'Import failed');
                        }}
                        style={{
                          border: `1px solid ${T.line}`,
                          borderRadius: 999,
                          padding: '10px 12px',
                          minHeight: 44,
                          background: '#FFFFFF',
                          color: T.ink,
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          fontFamily: '"Plus Jakarta Sans",system-ui',
                        }}
                      >
                        Import Frame Pack JSON
                      </button>
                    </div>
                    {importMessage && (
                      <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        {importMessage}
                      </div>
                    )}
                  </div>
                  {savedFrames.length === 0 && (
                    <div style={{
                      padding: 14,
                      borderRadius: 14,
                      background: 'rgba(26,26,31,0.04)',
                      border: `1px dashed ${T.line}`,
                      color: T.inkSoft,
                      fontSize: 12,
                      fontFamily: 'Pretendard,system-ui',
                    }}>
                      No saved frames yet. Save a decorated setup or deco state to build your library.
                      {openDesigner && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            onClick={() => openDesigner({ mode: 'new', preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null })}
                            style={{
                              border: 'none',
                              borderRadius: 999,
                              padding: '10px 12px',
                              minHeight: 44,
                              background: T.ink,
                              color: T.bg,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              fontFamily: '"Plus Jakarta Sans",system-ui',
                            }}
                          >
                            Create your first frame
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr' : 'minmax(220px, 0.9fr) minmax(0, 1.1fr)',
              gap: 12,
              alignItems: 'stretch',
              marginTop: 10,
            }}>
              <div style={{
                borderRadius: 18,
                background: '#FFFFFF',
                border: `1px solid ${T.line}`,
                padding: 14,
                minHeight: 250,
                display: 'grid',
                gap: 10,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>
                      {layoutMatchedFramePreset?.name || selectedFramePreset?.name || 'Selected preset'}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                      {layoutMatchedFramePreset ? `${layoutMatchedFramePreset.layout} · ${layoutMatchedFramePreset.photoSlots?.length || 0}컷 · ${layoutMatchedFramePreset.category}` : 'No preset selected'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {layoutMatchedFramePreset && (
                      <StoreBadge T={T} tone="light">{layoutMatchedFramePreset.source === 'custom' ? 'My Frame' : 'Preset'}</StoreBadge>
                    )}
                    {selectedFramePresetId && selectedFramePresetId === selectedFramePreset?.id && (
                      <StoreBadge T={T}>Active</StoreBadge>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', placeItems: 'center', height: 220, aspectRatio: getFramePreviewAspect(layoutMatchedFramePreset, layoutMatchedFramePreset?.layout || layout), maxWidth: '100%', margin: '0 auto', background: 'rgba(26,26,31,0.02)', borderRadius: 16, overflow: 'hidden' }}>
                  {WFrameThumb ? (
                    <WFrameThumb
                      key={`${layoutMatchedFramePreset?.id || selectedFramePreset?.id || layout}-${layoutMatchedFramePreset?.updatedAt || selectedFramePreset?.updatedAt || 'selected'}`}
                      layout={layoutMatchedFramePreset?.layout || layout}
                      shots={shotsPreview}
                      selected={[0, 1, 2, 3]}
                      T={T}
                      logo={false}
                      dateText={false}
                      accent={accent}
                      scale={mobile ? 0.96 : 1.08}
                      orientation="portrait"
                      frameColor={frameColor}
                      framePreset={layoutMatchedFramePreset}
                      fill
                    />
                  ) : (
                    <FramePickerFallback layout={layoutMatchedFramePreset?.layout || layout} T={T} size="lg" />
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button
                    onClick={() => layoutMatchedFramePreset && applyFramePreset && applyFramePreset(layoutMatchedFramePreset)}
                    disabled={!layoutMatchedFramePreset}
                    style={{
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 14px',
                      minHeight: 44,
                      background: layoutMatchedFramePreset ? T.ink : 'rgba(26,26,31,0.06)',
                      color: layoutMatchedFramePreset ? T.bg : T.inkSoft,
                      cursor: layoutMatchedFramePreset ? 'pointer' : 'default',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      fontFamily: '"Plus Jakarta Sans",system-ui',
                    }}
                    >
                    Apply preset
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  {categoryTabs.map((tabItem) => (
                    <button
                      key={tabItem.id}
                      onClick={() => setFrameCategory(tabItem.id)}
                      style={{
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 12px',
                        minHeight: 44,
                        background: frameCategory === tabItem.id ? T.ink : 'rgba(26,26,31,0.06)',
                        color: frameCategory === tabItem.id ? T.bg : T.inkSoft,
                        fontSize: 10,
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: 0.8,
                        fontFamily: '"Plus Jakarta Sans",system-ui',
                        textTransform: 'uppercase',
                        flex: '0 0 auto',
                      }}
                    >
                      {tabItem.label}
                      {typeof tabItem.count === 'number' ? ` ${tabItem.count}` : ''}
                    </button>
                  ))}
                </div>

                <div style={{
                  padding: 14,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: `1px solid ${T.line}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>Recommended</div>
                      <div style={{ marginTop: 3, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        Built-in frames for quick starts.
                      </div>
                    </div>
                    <StoreBadge T={T} tone="light">{recommendedFramePresets.length}</StoreBadge>
                  </div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                    {recommendedFramePresets.map((preset) => {
                      const isSelected = selectedFramePresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          style={{
                            borderRadius: 16,
                            border: `1px solid ${isSelected ? T.ink : T.line}`,
                            background: isSelected ? T.card : '#FFFFFF',
                            boxShadow: isSelected ? `0 0 0 2px ${T.ink} inset` : 'none',
                            padding: 12,
                            display: 'grid',
                            gap: 10,
                            minWidth: 0,
                          }}
                        >
                          <button
                            onClick={() => applyFramePreset && applyFramePreset(preset)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: 0,
                              cursor: 'pointer',
                              textAlign: 'left',
                              minWidth: 0,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>{preset.name}</div>
                              {isSelected && <StoreBadge T={T} tone="light">Active</StoreBadge>}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                              {preset.layout} · {preset.photoSlots.length}컷
                            </div>
                            <div style={{ margin: '8px auto 0', height: 126, aspectRatio: getFramePreviewAspect(preset, preset.layout), maxWidth: '100%', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                              {WFrameThumb ? (
                                <WFrameThumb
                                  key={`${preset.id}-${preset.updatedAt || 'builtin'}`}
                                  layout={preset.layout}
                                  shots={shotsPreview}
                                  selected={[0, 1, 2, 3]}
                                  T={T}
                                  logo={false}
                                  dateText={false}
                                  accent={accent}
                                  scale={0.84}
                                  orientation="portrait"
                                  frameColor={frameColor}
                                  framePreset={preset}
                                  fill
                                />
                              ) : (
                                <FramePickerFallback layout={preset.layout} T={T} size="sm" />
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => applyFramePreset && applyFramePreset(preset)}
                            style={{
                              border: 'none',
                              borderRadius: 999,
                              padding: '10px 12px',
                              minHeight: 44,
                              background: T.ink,
                              color: T.bg,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                              fontFamily: '"Plus Jakarta Sans",system-ui',
                            }}
                          >
                            Apply
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  padding: 14,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: `1px solid ${T.line}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>My Frames</div>
                      <div style={{ marginTop: 3, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                        Saved setups, renamed, duplicated, and soft-deleted.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <StoreBadge T={T} tone="light">{savedFrames.length}</StoreBadge>
                      {saveCustomFrame && (
                        <button
                          onClick={() => {
                            const suggested = layoutMatchedFramePreset?.name ? `${layoutMatchedFramePreset.name} Copy` : selectedFramePreset?.name ? `${selectedFramePreset.name} Copy` : 'My Frame';
                            const name = window.prompt('Save frame as', suggested);
                            if (!name || !name.trim()) return;
                            saveCustomFrame({
                              name: name.trim(),
                              layout,
                              frameColor,
                              stickers: preStickers,
                              decorations: framePreset?.decorations || [],
                              drawStrokes: [],
                              background: framePreset?.background,
                              photoSlots: framePreset?.photoSlots,
                              watermark: framePreset?.watermark,
                              canvasSize: framePreset?.canvasSize,
                            });
                            setFrameCategory('my-frames');
                            setStoreTab('my-frames');
                            setFrameStoreOpen(true);
                            setFrameStoreMode('full');
                          }}
                          style={{
                            border: 'none',
                            borderRadius: 999,
                            padding: '10px 14px',
                            minHeight: 44,
                            background: T.ink,
                            color: T.bg,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            fontFamily: '"Plus Jakarta Sans",system-ui',
                          }}
                        >
                          Save current setup
                        </button>
                      )}
                    </div>
                  </div>
                  {frameCategory === 'my-frames' && savedFrames.length === 0 && (
                    <div style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 14,
                      background: 'rgba(26,26,31,0.04)',
                      border: `1px dashed ${T.line}`,
                      color: T.inkSoft,
                      fontSize: 12,
                      fontFamily: 'Pretendard,system-ui',
                    }}>
                      No saved frames yet. Save a decorated setup or deco state to build your library.
                      {openDesigner && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            onClick={() => openDesigner({ mode: 'new', preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null })}
                            style={{
                              minHeight: 44,
                              borderRadius: 12,
                              border: 'none',
                              background: T.ink,
                              color: T.bg,
                              padding: '0 12px',
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: 1,
                              textTransform: 'uppercase',
                            }}
                          >
                            Create your first frame
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                    {visibleFramePresets.map((preset) => {
                      const isSelected = selectedFramePresetId === preset.id;
                      const isCustom = preset.source === 'custom';
                      return (
                        <div
                          key={preset.id}
                          style={{
                            border: `1px solid ${isSelected ? T.ink : T.line}`,
                            borderRadius: 16,
                            background: isSelected ? T.card : '#FFFFFF',
                            boxShadow: isSelected ? `0 0 0 2px ${T.ink} inset` : 'none',
                            padding: 12,
                            display: 'grid',
                            gridTemplateColumns: mobile ? '1fr' : 'minmax(96px, 120px) 1fr',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => applyFramePreset && applyFramePreset(preset)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: 0,
                              cursor: 'pointer',
                              minWidth: 0,
                              height: 96,
                              aspectRatio: getFramePreviewAspect(preset, preset.layout),
                              maxWidth: '100%',
                              display: 'grid',
                              placeItems: 'center',
                              overflow: 'hidden',
                            }}
                          >
                            {WFrameThumb ? (
                              <WFrameThumb
                                key={`${preset.id}-${preset.updatedAt || 'thumb'}`}
                                layout={preset.layout}
                                shots={shotsPreview}
                                selected={[0, 1, 2, 3]}
                                T={T}
                                logo={false}
                                dateText={false}
                                accent={accent}
                                scale={0.7}
                                orientation="portrait"
                                frameColor={frameColor}
                                framePreset={preset}
                                fill
                              />
                            ) : (
                              <FramePickerFallback layout={preset.layout} T={T} size="sm" />
                            )}
                          </button>
                          <div style={{ minWidth: 0, display: 'grid', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: T.ink, fontFamily: 'Pretendard,system-ui' }}>{preset.name}</div>
                                <div style={{ marginTop: 4, fontSize: 10.5, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                  {preset.layout} · {preset.photoSlots.length}컷 · {preset.category}
                                </div>
                                <div style={{ marginTop: 3, fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                  {preset.author?.name || preset.creator?.name || 'IMMM Studio'} · {preset.license || 'internal'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                {isSelected && <StoreBadge T={T} tone="light">Active</StoreBadge>}
                                {preset.source === 'imported' && <StoreBadge T={T} tone="light">Imported</StoreBadge>}
                                <StoreBadge T={T} tone="light">Trend {Math.round((preset.trendingScore || 0) + getPresetLikeCount(preset) * 2 + getPresetUseCount(preset))}</StoreBadge>
                                <span style={{ fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui' }}>
                                  {isCustom ? `Saved ${formatFrameDate(preset.createdAt || preset.updatedAt)}` : 'Built-in'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              <button
                                onClick={() => applyFramePreset && applyFramePreset(preset)}
                                style={{
                                  border: 'none',
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: T.ink,
                                  color: T.bg,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => toggleFavoriteFramePreset && toggleFavoriteFramePreset(preset.id)}
                                style={{
                                  border: `1px solid ${T.line}`,
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: favoriteFramePresetIds.includes(preset.id) ? T.ink : '#FFFFFF',
                                  color: favoriteFramePresetIds.includes(preset.id) ? T.bg : T.ink,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                {favoriteFramePresetIds.includes(preset.id) ? 'Favorited' : 'Favorite'}
                              </button>
                              <button
                                onClick={() => toggleFrameLike && toggleFrameLike(preset.id)}
                                style={{
                                  border: `1px solid ${T.line}`,
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: frameLikeIds.includes(preset.id) ? T.ink : '#FFFFFF',
                                  color: frameLikeIds.includes(preset.id) ? T.bg : T.ink,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                {frameLikeIds.includes(preset.id) ? 'Liked' : 'Like'}
                              </button>
                              <button
                                onClick={() => setSelectedCreatorId(preset.creatorId || preset.author?.id || '')}
                                style={{
                                  border: `1px solid ${T.line}`,
                                  borderRadius: 999,
                                  padding: '10px 12px',
                                  minHeight: 44,
                                  background: '#FFFFFF',
                                  color: T.ink,
                                  cursor: 'pointer',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: 1,
                                  textTransform: 'uppercase',
                                  fontFamily: '"Plus Jakarta Sans",system-ui',
                                }}
                              >
                                View Creator
                              </button>
                              {isCustom && (
                                <>
                                  <button
                                    onClick={() => openDesigner && openDesigner({ mode: 'edit', preset })}
                                    style={{
                                      border: `1px solid ${T.line}`,
                                      borderRadius: 999,
                                      padding: '10px 12px',
                                      minHeight: 44,
                                      background: '#FFFFFF',
                                      color: T.ink,
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: 1,
                                      textTransform: 'uppercase',
                                      fontFamily: '"Plus Jakarta Sans",system-ui',
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDesigner && openDesigner({ mode: 'duplicate', preset })}
                                    style={{
                                      border: `1px solid ${T.line}`,
                                      borderRadius: 999,
                                      padding: '10px 12px',
                                      minHeight: 44,
                                      background: '#FFFFFF',
                                      color: T.ink,
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: 1,
                                      textTransform: 'uppercase',
                                      fontFamily: '"Plus Jakarta Sans",system-ui',
                                    }}
                                  >
                                    Duplicate & Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      const next = window.prompt('Rename frame', preset.name || 'My Frame');
                                      if (!next || !next.trim()) return;
                                      renameCustomFrame && renameCustomFrame(preset.id, next.trim());
                                    }}
                                    style={{
                                      border: `1px solid ${T.line}`,
                                      borderRadius: 999,
                                      padding: '10px 12px',
                                      minHeight: 44,
                                      background: '#FFFFFF',
                                      color: T.ink,
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: 1,
                                      textTransform: 'uppercase',
                                      fontFamily: '"Plus Jakarta Sans",system-ui',
                                    }}
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => duplicateCustomFrame && duplicateCustomFrame(preset.id)}
                                    style={{
                                      border: `1px solid ${T.line}`,
                                      borderRadius: 999,
                                      padding: '10px 12px',
                                      minHeight: 44,
                                      background: '#FFFFFF',
                                      color: T.ink,
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: 1,
                                      textTransform: 'uppercase',
                                      fontFamily: '"Plus Jakarta Sans",system-ui',
                                    }}
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={() => deleteCustomFrame && deleteCustomFrame(preset.id)}
                                    style={{
                                      border: 'none',
                                      borderRadius: 999,
                                      padding: '10px 12px',
                                      minHeight: 44,
                                      background: 'rgba(17,17,17,0.08)',
                                      color: T.ink,
                                      cursor: 'pointer',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      letterSpacing: 1,
                                      textTransform: 'uppercase',
                                      fontFamily: '"Plus Jakarta Sans",system-ui',
                                    }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
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
              padding: '12px 14px', borderRadius: 12, border: `1px solid ${T.line}`, cursor: (layout === 'grid' || layout === 'polaroid') ? 'default' : 'pointer',
              background: T.softSurface, width: '100%', textAlign: 'left',
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
            padding: '12px 14px', borderRadius: 12, border: `1px solid ${T.line}`, cursor: 'pointer',
            background: T.softSurface, width: '100%', textAlign: 'left',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', color: T.ink }}>날짜 표시</div>
              <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', marginTop: 1 }}>프레임 하단에 촬영 날짜</div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 999, background: dateText ? T.ink : 'rgba(26,26,31,0.15)', position: 'relative', flexShrink: 0, transition: '0.2s' }}>
              <div style={{ width: 14, height: 14, borderRadius: 999, background: '#fff', position: 'absolute', top: 3, left: dateText ? 19 : 3, transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
          </button>

          {/* Frame Color */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: '"Plus Jakarta Sans",system-ui', color: T.ink, marginBottom: 8 }}>배경 색상 · Frame Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: '#ffffff', name: 'White' },
                { id: '#111111', name: 'Black' },
                { id: '#F1C0C5', name: 'Pink' },
                { id: '#A6C8DE', name: 'Sky Blue' },
                { id: '#E6C8BE', name: 'Beige' },
                { id: '#A2352B', name: 'Red' },
              ].map(c => (
                <button key={c.id} onClick={() => setFrameColor && setFrameColor(c.id)} style={{
                  width: 32, height: 32, borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: c.id,
                  boxShadow: frameColor === c.id ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${T.ink}` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                  transition: '0.2s',
                  position: 'relative'
                }}>
                  {frameColor === c.id && <div style={{ position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: T.ink, fontFamily: '"Plus Jakarta Sans",system-ui', whiteSpace: 'nowrap' }}>{c.name}</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>;


  const filterTab =
  <div>
      <Kick T={T}>Choose a filter · 필터 선택</Kick>
      <div style={{ marginTop: 10, marginBottom: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(26,26,31,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: tweaks.useWebgl ? `1.5px solid ${T.ink}` : '1.5px solid transparent', transition: '0.2s' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: '"Plus Jakarta Sans",system-ui', display: 'flex', alignItems: 'center', gap: 6 }}>
            AR Filters {tweaks.useWebgl && <span style={{ fontSize: 9, background: T.ink, color: T.bg, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5 }}>ACTIVE</span>}
          </div>
          <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: 'Pretendard,system-ui', marginTop: 2, lineHeight: 1.3 }}>얼굴 보정 및 AR 특수효과 (일부 기기에서 느릴 수 있음)</div>
        </div>
        <button onClick={() => setUseWebgl(!tweaks.useWebgl)} style={{
          width: 42, height: 22, borderRadius: 999, background: tweaks.useWebgl ? T.ink : 'rgba(26,26,31,0.12)',
          position: 'relative', border: 'none', cursor: 'pointer', transition: '0.3s cubic-bezier(0.34,1.56,0.64,1)', flexShrink: 0
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: '#fff', position: 'absolute', top: 3, left: tweaks.useWebgl ? 23 : 3, transition: '0.3s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {(typeof getVisibleFilters === 'function' ? getVisibleFilters() : Object.entries(FILTERS).filter(([, v]) => !v.hidden)).map(([k, v]) =>
      <button key={k} onClick={() => setFilter(k)} style={{
        padding: 0, border: 'none', cursor: 'pointer', background: T.card,
        borderRadius: 14, overflow: 'hidden', textAlign: 'left',
        boxShadow: filter === k ? '0 0 0 2px ' + T.ink : '0 0 0 1px rgba(26,26,31,0.08)',
        transition: 'all 0.2s'
      }}>
            <div style={{ aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
              <img src="asset/filter-sample.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: v.css }} />
              <FilterOverlay filter={k} />
            </div>
            <div style={{ padding: '6px 10px', fontSize: 11, fontFamily: '"Plus Jakarta Sans",system-ui', fontWeight: 600 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                <span>{v.name}<span style={{ color: T.inkSoft, fontWeight: 400, marginLeft: 4 }}>{v.ko}</span></span>
                {v.premium && <StoreBadge T={T} tone="light">Pro</StoreBadge>}
              </div>
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
      {getStickerPickerPacks().map(([k, pack]) =>
    <div key={k} style={{ marginTop: 14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom: 6 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 600, textTransform: 'uppercase', color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui' }}>
              {pack.name} · {pack.ko}
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {pack.recommended && <StoreBadge T={T} tone="light">Pick</StoreBadge>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
            {(expandedPacks[k] ? pack.items : pack.items.slice(0, 5)).map((it) =>
              <button key={it.id} onClick={() => addPreset(it.id)} style={{
                padding: 10, background: T.card, border: 'none', borderRadius: 12,
                boxShadow: '0 0 0 1px rgba(26,26,31,0.06)', cursor: 'pointer',
                minHeight: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                transition: 'transform 0.2s'
              }}
              onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
              onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onPointerLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ width: '100%', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', writingMode: 'horizontal-tb', whiteSpace: 'nowrap' }}>
                  {renderLibSticker(it, 0.65)}
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


  const photoFileRefs = [uR(null), uR(null), uR(null), uR(null)];
  const maxUploadCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(layout)
    : (layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4);

  const onPhotoUpload = async (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    for (let i = 0; i < files.length; i++) {
      const targetIdx = idx + i;
      if (targetIdx >= maxUploadCount) break;
      const f = files[i];
      const dataUrl = await new Promise(res => {
        const rd = new FileReader();
        rd.onload = () => res(rd.result);
        rd.readAsDataURL(f);
      });
      setShots((prev) => {
        const n = [...prev];
        while (n.length <= targetIdx) n.push(null);
        n[targetIdx] = { dataUrl, filter, renderMode: 'upload', capturedFilter: filter, ts: Date.now() };
        return n;
      });
    }
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
        right={<BtnPrimary T={T} size="sm" onClick={() => editMode ? go('deco') : startNewCaptureSession()} disabled={editMode && uploadedCount < 4}>{editMode ? '편집 시작' : 'Next'}</BtnPrimary>} />
        <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
          {preview}
          <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 10, zIndex: 20 }}>
            <button onClick={zoomOut} style={zoomBtnStyle} aria-label="Zoom out">
              <ZoomMinusIcon />
            </button>
            <button onClick={zoomIn} style={zoomBtnStyle} aria-label="Zoom in">
              <ZoomPlusIcon />
            </button>
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
    <div style={{ height: '100%', background: 'transparent', display: 'grid', gridTemplateColumns: '1fr 380px' }}>
      <div style={{ padding: '24px 48px', display: 'flex', flexDirection: 'column' }}>
        <TopBar step={0} back={() => go('landing')} T={T} title={editMode ? '편집하기 · Upload & Edit' : 'Step 1 · Setup the booth'}
        right={<BtnPrimary T={T} size="md" onClick={() => editMode ? go('deco') : startNewCaptureSession()} disabled={editMode && uploadedCount < 4}>{editMode ? '편집 시작' : 'Continue · 다음'} {!editMode && I.arrowR(14, T.bg)}</BtnPrimary>} />
        <div style={{ flex: 1, background: T.bgAlt, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: `1px solid ${T.line}`, boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}> {/* #F8F8F5 stageBackground, #E5E2DA frameCardBorder */}
          {preview}
          <div style={{ position: 'absolute', bottom: 16, left: 18, fontSize: 11, color: T.inkSoft, fontFamily: '"Plus Jakarta Sans",system-ui', letterSpacing: 1.5 }}>
            LIVE PREVIEW · drag companions to place them
          </div>
          <div style={{ position: 'absolute', bottom: 18, right: 18, display: 'flex', gap: 10, zIndex: 20 }}>
            <button onClick={zoomOut} style={zoomBtnStyle} aria-label="Zoom out">
              <ZoomMinusIcon />
            </button>
            <button onClick={zoomIn} style={zoomBtnStyle} aria-label="Zoom in">
              <ZoomPlusIcon />
            </button>
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', borderLeft: '1px solid rgba(255,255,255,0.5)', padding: '24px 22px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {tabBar}
        <div style={{ flex: 1 }}>{tabContent}</div>
      </div>
    </div>
  );
}

function DesignerScreen({
  T,
  go,
  mobile,
  layout,
  frameColor,
  framePresetList = [],
  customFrames = [],
  draftFrame,
  setDraftFrame,
  initialDraftFrame,
  designerBasePresetId = '',
  designerMode = 'new',
  setDesignerMode,
  saveDesignerFrame,
  saveDesignerPackDraft,
  importFramePackFromJson,
  setSetupStoreTabFocus,
  selectedFramePresetId,
  setSelectedFramePresetId,
  creatorProfiles = [],
  designerDraftRecovery = null,
  clearDesignerDraftRecovery,
  generateFrameIdea,
  exportPresetId = 'hd',
  setExportPresetId,
}) {
  const frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  const WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function'
    ? window.FrameThumb
    : null;
  const useTouchFallback = typeof window !== 'undefined'
    && (!('PointerEvent' in window) || (typeof navigator !== 'undefined' && /SamsungBrowser/i.test(navigator.userAgent || '')));
  const previewRef = uR(null);
  const dragRef = uR(null);
  const [activeTab, setActiveTab] = uS('layout');
  const [selectedSlotIndex, setSelectedSlotIndex] = uS(0);
  const [selectedDecorationIndex, setSelectedDecorationIndex] = uS(0);
  const [activeGuides, setActiveGuides] = uS([]);
  const [statusMessage, setStatusMessage] = uS('');
  const [validationError, setValidationError] = uS('');
  const [exportPackName, setExportPackName] = uS(draftFrame?.name || 'Designer Pack Draft');
  const [exportPackDescription, setExportPackDescription] = uS('Designer pack draft.');
  const [exportPackTags, setExportPackTags] = uS((draftFrame?.tags || []).join(', '));
  const [exportPackAuthor, setExportPackAuthor] = uS(draftFrame?.author?.name || 'IMMM Studio');
  const [exportPackLicense, setExportPackLicense] = uS(draftFrame?.license || 'internal');
  const [importPackJson, setImportPackJson] = uS('');
  const [showGuides, setShowGuides] = uS(true);
  const [snapEnabled, setSnapEnabled] = uS(true);
  const [gridEnabled, setGridEnabled] = uS(false);
  const [activeLayerIndex, setActiveLayerIndex] = uS(0);
  const [activeMotionPreview, setActiveMotionPreview] = uS(false);

  const normalizedDraft = uM(() => frameApi?.normalizeDesignerDraft?.(draftFrame) || draftFrame || null, [draftFrame, frameApi]);
  const normalizedInitial = uM(() => frameApi?.normalizeDesignerDraft?.(initialDraftFrame) || initialDraftFrame || null, [initialDraftFrame, frameApi]);
  const slotDefaults = uM(() => normalizedDraft ? (frameApi?.getPhotoSlotsForLayout?.(normalizedDraft.layout) || normalizedDraft.photoSlots || []) : [], [frameApi, normalizedDraft]);
  const previewShots = uM(() => Array.from({ length: Math.max(1, normalizedDraft?.photoSlots?.length || slotDefaults.length || 4) }, () => ({ filter: 'original', dataUrl: null })), [normalizedDraft, slotDefaults.length]);
  const isDirty = uM(() => {
    if (!normalizedDraft || !normalizedInitial) return Boolean(normalizedDraft);
    return JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedInitial);
  }, [normalizedDraft, normalizedInitial]);
  const validation = uM(() => normalizedDraft ? (frameApi?.validateDesignerDraft?.(normalizedDraft) || { ok: false, error: 'Designer validation unavailable' }) : { ok: false, error: 'Draft missing' }, [frameApi, normalizedDraft]);
  const tabs = [
    { id: 'layout', label: 'Layout' },
    { id: 'background', label: 'Background' },
    { id: 'slots', label: 'Slots' },
    { id: 'layers', label: 'Layers' },
    { id: 'decorations', label: 'Decorations' },
    { id: 'text', label: 'Text' },
    { id: 'save', label: 'Save' },
  ];
  const currentLayoutSlots = normalizedDraft?.photoSlots || [];
  const currentDecorations = normalizedDraft?.decorations || [];
  const currentLayers = normalizedDraft?.layers || [];
  const currentMotionLayers = normalizedDraft?.motionLayers || [];
  const selectedSlot = currentLayoutSlots[selectedSlotIndex] || currentLayoutSlots[0] || null;
  const selectedDecoration = currentDecorations[selectedDecorationIndex] || currentDecorations[0] || null;
  const selectedLayer = currentLayers[activeLayerIndex] || currentLayers[0] || null;
  const slotCount = currentLayoutSlots.length;
  const previewCanvas = normalizedDraft?.canvasSize || frameApi?.getCanvasSizeForLayout?.(normalizedDraft?.layout || layout) || { width: 560, height: 1808 };
  const getDragPoint = (event) => {
    if (!event) return null;
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return { clientX: event.clientX, clientY: event.clientY };
    }
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
    return null;
  };
  const snapRectToGuides = (rect, canvasSize, peers = []) => {
    const next = { ...rect };
    const guides = [];
    const width = canvasSize?.width || 1;
    const height = canvasSize?.height || 1;
    const threshold = 14;
    const centerX = width / 2;
    const centerY = height / 2;
    const rectCenterX = next.x + next.width / 2;
    const rectCenterY = next.y + next.height / 2;

    const snapAxis = (value, target, axis, kind) => {
      if (Math.abs(value - target) <= threshold) {
        guides.push({ axis, value: target, kind });
        return target;
      }
      return value;
    };

    const snappedCenterX = snapAxis(rectCenterX, centerX, 'v', 'center');
    const snappedCenterY = snapAxis(rectCenterY, centerY, 'h', 'center');
    next.x += snappedCenterX - rectCenterX;
    next.y += snappedCenterY - rectCenterY;

    const edgeCandidates = [
      { axis: 'v', value: 0, kind: 'edge-left' },
      { axis: 'v', value: width, kind: 'edge-right' },
      { axis: 'h', value: 0, kind: 'edge-top' },
      { axis: 'h', value: height, kind: 'edge-bottom' },
    ];
    edgeCandidates.forEach((candidate) => {
      if (candidate.axis === 'v') {
        const left = next.x;
        const right = next.x + next.width;
        if (Math.abs(left - candidate.value) <= threshold) {
          guides.push(candidate);
          next.x += candidate.value - left;
        } else if (Math.abs(right - candidate.value) <= threshold) {
          guides.push(candidate);
          next.x += candidate.value - right;
        }
      } else {
        const top = next.y;
        const bottom = next.y + next.height;
        if (Math.abs(top - candidate.value) <= threshold) {
          guides.push(candidate);
          next.y += candidate.value - top;
        } else if (Math.abs(bottom - candidate.value) <= threshold) {
          guides.push(candidate);
          next.y += candidate.value - bottom;
        }
      }
    });

    peers.forEach((peer) => {
      if (!peer) return;
      const peerCenterX = peer.x + peer.width / 2;
      const peerCenterY = peer.y + peer.height / 2;
      if (Math.abs((next.x + next.width / 2) - peerCenterX) <= threshold) {
        guides.push({ axis: 'v', value: peerCenterX, kind: 'peer-center' });
        next.x += peerCenterX - (next.x + next.width / 2);
      }
      if (Math.abs((next.y + next.height / 2) - peerCenterY) <= threshold) {
        guides.push({ axis: 'h', value: peerCenterY, kind: 'peer-center' });
        next.y += peerCenterY - (next.y + next.height / 2);
      }
    });

    const clamped = frameApi?.clampRectToCanvas?.(next, canvasSize, 24, 24) || next;
    return { rect: clamped, guides };
  };

  const normalizeNextDraft = (updater) => {
    setDraftFrame((prev) => {
      const base = frameApi?.normalizeDesignerDraft?.(prev || normalizedDraft || initialDraftFrame) || prev || normalizedDraft || initialDraftFrame;
      const next = typeof updater === 'function' ? updater(base) : { ...base, ...updater };
      return frameApi?.normalizeDesignerDraft?.(next) || next;
    });
  };

  const setDraftLayout = (nextLayout) => {
    const normalizedLayout = frameApi?.normalizePresetLayout?.(nextLayout) || nextLayout || 'strip';
    const defaultSlots = frameApi?.getPhotoSlotsForLayout?.(normalizedLayout) || [];
    normalizeNextDraft((prev) => ({
      ...prev,
      layout: normalizedLayout,
      canvasSize: frameApi?.getCanvasSizeForLayout?.(normalizedLayout) || prev.canvasSize,
      photoSlots: defaultSlots,
    }));
    setSelectedSlotIndex(0);
    setActiveTab('slots');
  };

  const setBackgroundPatch = (patch) => {
    normalizeNextDraft((prev) => ({
      ...prev,
      background: {
        ...(prev.background || { type: 'solid', value: '#FFFFFF', opacity: 1 }),
        ...patch,
      },
    }));
  };

  const setSlotPatch = (index, patch) => {
    normalizeNextDraft((prev) => {
      const next = [...(prev.photoSlots || [])];
      if (!next[index]) return prev;
      next[index] = frameApi?.clampRectToCanvas?.({ ...next[index], ...patch }, prev.canvasSize, 24, 24) || { ...next[index], ...patch };
      return { ...prev, photoSlots: next };
    });
  };

  const restoreLayoutSlots = () => {
    if (!normalizedDraft) return;
    normalizeNextDraft((prev) => ({
      ...prev,
      photoSlots: frameApi?.getPhotoSlotsForLayout?.(prev.layout) || prev.photoSlots,
    }));
  };

  const addDecoration = (shape, type = 'shape') => {
    if (!normalizedDraft) return;
    const w = Math.max(80, Math.round((normalizedDraft.canvasSize?.width || 560) * 0.18));
    const h = Math.max(60, Math.round((normalizedDraft.canvasSize?.height || 1808) * 0.08));
    const cx = Math.round(((normalizedDraft.canvasSize?.width || 560) - w) / 2);
    const cy = Math.round(((normalizedDraft.canvasSize?.height || 1808) - h) / 2);
    const id = `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const deco = type === 'text'
      ? { id, type: 'text', text: 'TEXT', x: cx, y: cy, width: w, height: h, rotation: 0, opacity: 1, zIndex: 10, fill: '#111111', fontWeight: 800, layer: 'front' }
      : { id, type: 'shape', shape, x: cx, y: cy, width: w, height: h, rotation: 0, opacity: 1, zIndex: 10, fill: '#111111', layer: 'front' };
    normalizeNextDraft((prev) => ({ ...prev, decorations: [...(prev.decorations || []), deco] }));
    setSelectedDecorationIndex((prev) => Math.max(0, (normalizedDraft?.decorations?.length || 0)));
    setActiveTab('decorations');
  };

  const setDecorationPatch = (index, patch) => {
    normalizeNextDraft((prev) => {
      const next = [...(prev.decorations || [])];
      if (!next[index]) return prev;
      next[index] = frameApi?.normalizeDesignerDraft?.({ ...prev, decorations: next.map((deco, i) => i === index ? { ...deco, ...patch } : deco) })?.decorations?.[index] || { ...next[index], ...patch };
      return { ...prev, decorations: next };
    });
  };

  const duplicateDecoration = (index) => {
    normalizeNextDraft((prev) => {
      const source = (prev.decorations || [])[index];
      if (!source) return prev;
      const copy = {
        ...source,
        id: `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        x: (source.x || 0) + 24,
        y: (source.y || 0) + 24,
      };
      return { ...prev, decorations: [...(prev.decorations || []), copy] };
    });
  };

  const deleteDecoration = (index) => {
    normalizeNextDraft((prev) => ({ ...prev, decorations: (prev.decorations || []).filter((_, i) => i !== index) }));
    setSelectedDecorationIndex(0);
  };

  const setLayerPatch = (index, patch) => {
    normalizeNextDraft((prev) => {
      const next = [...(prev.layers || [])];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return { ...prev, layers: next };
    });
  };

  const moveLayer = (index, delta) => {
    normalizeNextDraft((prev) => {
      const next = [...(prev.layers || [])];
      const target = index + delta;
      if (!next[index] || target < 0 || target >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...prev, layers: next.map((layer, i) => ({ ...layer, zIndex: i })) };
    });
    setActiveLayerIndex((prev) => Math.max(0, prev + delta));
  };

  const duplicateLayer = (index) => {
    normalizeNextDraft((prev) => {
      const source = (prev.layers || [])[index];
      if (!source) return prev;
      const copy = { ...source, id: `${source.id || 'layer'}_${Date.now().toString(36)}`, zIndex: (source.zIndex || 0) + 1 };
      const next = [...(prev.layers || [])];
      next.splice(index + 1, 0, copy);
      return { ...prev, layers: next.map((layer, i) => ({ ...layer, zIndex: i })) };
    });
  };

  const deleteLayer = (index) => {
    normalizeNextDraft((prev) => ({ ...prev, layers: (prev.layers || []).filter((_, i) => i !== index) }));
    setActiveLayerIndex(0);
  };

  const startDrag = (kind, index, mode = 'move') => (event) => {
    if (!previewRef.current || !normalizedDraft) return;
    const point = getDragPoint(event);
    if (!point) return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget?.setPointerCapture && event.pointerId != null) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}
    }
    const rect = previewRef.current.getBoundingClientRect();
    dragRef.current = {
      kind,
      index,
      mode,
      startX: point.clientX,
      startY: point.clientY,
      rect,
      snapshot: frameApi?.normalizeDesignerDraft?.(normalizedDraft) || normalizedDraft,
    };
    if (kind === 'slot') {
      setSelectedSlotIndex(index);
      setActiveTab('slots');
    } else {
      setSelectedDecorationIndex(index);
      setActiveTab('decorations');
    }
  };

  React.useEffect(() => {
    if (!normalizedDraft) return;
    setSelectedSlotIndex((prev) => Math.min(prev, Math.max(0, currentLayoutSlots.length - 1)));
    setSelectedDecorationIndex((prev) => Math.min(prev, Math.max(0, currentDecorations.length - 1)));
    setActiveLayerIndex((prev) => Math.min(prev, Math.max(0, currentLayers.length - 1)));
  }, [currentDecorations.length, currentLayoutSlots.length, normalizedDraft]);

  React.useEffect(() => {
    const onMove = (event) => {
      const drag = dragRef.current;
      if (!drag || !drag.snapshot) return;
      const point = getDragPoint(event);
      if (!point) return;
      const scaleX = (drag.snapshot.canvasSize?.width || 1) / Math.max(1, drag.rect.width);
      const scaleY = (drag.snapshot.canvasSize?.height || 1) / Math.max(1, drag.rect.height);
      const dx = (point.clientX - drag.startX) * scaleX;
      const dy = (point.clientY - drag.startY) * scaleY;
      if (event.cancelable) event.preventDefault();
      normalizeNextDraft((prev) => {
        const base = frameApi?.normalizeDesignerDraft?.(prev || drag.snapshot) || prev || drag.snapshot;
        if (drag.kind === 'slot') {
          const nextSlots = [...(base.photoSlots || [])];
          const source = (drag.snapshot.photoSlots || [])[drag.index] || nextSlots[drag.index];
          if (!source) return base;
          const patch = drag.mode === 'resize'
            ? { width: source.width + dx, height: source.height + dy }
            : { x: source.x + dx, y: source.y + dy };
          const peers = nextSlots.filter((_, i) => i !== drag.index);
          const snapped = snapEnabled ? snapRectToGuides({ ...source, ...patch }, base.canvasSize, peers) : { rect: frameApi?.clampRectToCanvas?.({ ...source, ...patch }, base.canvasSize, 24, 24) || { ...source, ...patch }, guides: [] };
          setActiveGuides(snapped.guides);
          nextSlots[drag.index] = snapped.rect;
          return { ...base, photoSlots: nextSlots };
        }
        if (drag.kind === 'decor') {
          const nextDecos = [...(base.decorations || [])];
          const source = (drag.snapshot.decorations || [])[drag.index] || nextDecos[drag.index];
          if (!source) return base;
          const patch = drag.mode === 'resize'
            ? { width: source.width + dx, height: source.height + dy }
            : { x: source.x + dx, y: source.y + dy };
          const peers = nextDecos.filter((_, i) => i !== drag.index).map((item) => ({ x: item.x, y: item.y, width: item.width, height: item.height }));
          const snapped = snapEnabled ? snapRectToGuides({ ...source, ...patch }, base.canvasSize, peers) : { rect: frameApi?.clampRectToCanvas?.({ ...source, ...patch }, base.canvasSize, 24, 24) || { ...source, ...patch }, guides: [] };
          setActiveGuides(snapped.guides);
          nextDecos[drag.index] = frameApi?.normalizeDesignerDraft?.({ ...base, decorations: nextDecos.map((item, i) => i === drag.index ? { ...item, ...snapped.rect } : item) })?.decorations?.[drag.index] || { ...source, ...snapped.rect };
          return { ...base, decorations: nextDecos };
        }
        return base;
      });
    };
    const onUp = () => { dragRef.current = null; setActiveGuides([]); };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    if (useTouchFallback) {
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp, { passive: true });
      window.addEventListener('touchcancel', onUp, { passive: true });
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (useTouchFallback) {
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
        window.removeEventListener('touchcancel', onUp);
      }
    };
  }, [frameApi, normalizedDraft, useTouchFallback]);

  React.useEffect(() => {
    setExportPackName(normalizedDraft?.name || 'Designer Pack Draft');
    setExportPackDescription(`Designer draft for ${normalizedDraft?.name || 'IMMM'}.`);
    setExportPackTags((normalizedDraft?.tags || []).join(', '));
    setExportPackAuthor(normalizedDraft?.author?.name || 'IMMM Studio');
    setExportPackLicense(normalizedDraft?.license || 'internal');
  }, [normalizedDraft?.id]);

  const handleSaveFrame = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    const result = saveDesignerFrame ? saveDesignerFrame(normalizedDraft) : { ok: false, error: 'Save unavailable' };
    if (!result?.ok) {
      setValidationError(result?.error || 'Save failed');
      return;
    }
    setValidationError('');
    setStatusMessage('Saved to My Frames');
    go('setup');
  };

  const handleSaveAsNew = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    const clone = frameApi?.duplicateFramePresetAsDraft?.(normalizedDraft) || normalizedDraft;
    if (!clone) return;
    setDraftFrame(clone);
    const result = saveDesignerFrame ? saveDesignerFrame(clone) : { ok: false, error: 'Save unavailable' };
    if (!result?.ok) {
      setValidationError(result?.error || 'Save failed');
      return;
    }
    setStatusMessage('Saved as a new frame');
    setValidationError('');
    go('setup');
  };

  const handlePackExport = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    const result = saveDesignerPackDraft ? saveDesignerPackDraft(normalizedDraft, {
      name: exportPackName,
      description: exportPackDescription,
      author: { name: exportPackAuthor, handle: '@immm', url: '' },
      license: exportPackLicense,
      tags: exportPackTags.split(',').map((tag) => tag.trim()).filter(Boolean),
    }) : { ok: false, error: 'Pack export unavailable' };
    if (!result?.ok) {
      setValidationError(result?.error || 'Export failed');
      return;
    }
    setValidationError('');
    setStatusMessage('Pack draft copied to clipboard');
  };

  const handlePackImport = () => {
    if (!importPackJson.trim()) {
      setValidationError('Paste a frame pack JSON blob first');
      return;
    }
    const result = importFramePackFromJson ? importFramePackFromJson(importPackJson) : { ok: false, error: 'Import unavailable' };
    if (!result?.ok) {
      setValidationError(result?.error || 'Import failed');
      return;
    }
    setImportPackJson('');
    setValidationError('');
    setStatusMessage(`Imported ${result.presets?.length || 0} frames`);
    setDesignerMode('edit');
    if (typeof setSetupStoreTabFocus === 'function') setSetupStoreTabFocus('imported');
    go('setup');
  };

  const handleDiscard = () => {
    if (isDirty && !window.confirm('Discard designer changes?')) return;
    setDraftFrame(normalizedInitial || normalizedDraft);
    setDesignerMode('edit');
    clearDesignerDraftRecovery && clearDesignerDraftRecovery();
    setStatusMessage('Draft discarded');
    go('setup');
  };

  if (!normalizedDraft) {
    return (
      <div style={{ minHeight: '100%', padding: 24, background: T.bg, color: T.ink, fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui' }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Designer draft loading...</div>
      </div>
    );
  }

  const previewWidth = 540;
  const previewHeight = Math.round(previewWidth * (previewCanvas.height / previewCanvas.width));

  const editorShell = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.15fr) minmax(300px, 0.85fr)',
      gap: 14,
      minHeight: '100%',
      background: T.bg,
      color: T.ink,
      padding: mobile ? '12px 12px 18px' : '20px',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
    }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 4,
          background: T.bg,
          paddingBottom: 8,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: T.inkSoft }}>Frame Designer Studio</div>
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 900 }}>{normalizedDraft.name}</div>
            <div style={{ marginTop: 3, fontSize: 11, color: T.inkSoft }}>
              {normalizedDraft.layout} · {normalizedDraft.photoSlots.length} slots · {designerMode}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => go('setup')} style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Back to Store</button>
            <button onClick={handleDiscard} style={{ minHeight: 44, padding: '0 12px', borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Discard</button>
            <button onClick={handleSaveAsNew} style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, border: 'none', background: 'rgba(26,26,31,0.08)', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Save as New</button>
            <button onClick={handleSaveFrame} style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, border: 'none', background: T.ink, color: T.bg, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Save Frame</button>
          </div>
        </div>

        <div style={{
          border: `1px solid ${T.line}`,
          borderRadius: 18,
          background: '#fff',
          padding: 12,
          display: 'grid',
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                minHeight: 44,
                padding: '0 12px',
                borderRadius: 999,
                border: 'none',
                background: activeTab === tab.id ? T.ink : 'rgba(26,26,31,0.06)',
                color: activeTab === tab.id ? T.bg : T.inkSoft,
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1,
                cursor: 'pointer',
              }}>{tab.label}</button>
            ))}
          </div>

          <div
            ref={previewRef}
            style={{
              position: 'relative',
              height: mobile ? 'min(54vh, 520px)' : 'min(68vh, 680px)',
              maxHeight: mobile ? 520 : 680,
              width: 'auto',
              maxWidth: '100%',
              justifySelf: 'center',
              aspectRatio: `${previewCanvas.width} / ${previewCanvas.height}`,
              borderRadius: 18,
              overflow: 'hidden',
              border: `1px solid ${T.line}`,
              background: '#F8F8F5',
              touchAction: 'none',
            }}
          >
            {WFrameThumb ? (
              <div style={{ position: 'absolute', inset: 0 }}>
                <WFrameThumb
                  key={`${normalizedDraft.id}-${normalizedDraft.updatedAt || 'draft'}`}
                  layout={normalizedDraft.layout}
                  shots={previewShots}
                  selected={previewShots.map((_, i) => i)}
                  T={T}
                  logo={false}
                  dateText={false}
                  accent={T.pinkDeep}
                  scale={1}
                  orientation="portrait"
                  frameColor={normalizedDraft.frameColor}
                  framePreset={normalizedDraft}
                  fill
                />
              </div>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>Preview unavailable</div>
            )}

            {currentLayoutSlots.map((slot, index) => {
              const active = selectedSlotIndex === index;
              return (
                <div
                  key={`slot-${index}`}
                  onPointerDown={useTouchFallback ? undefined : startDrag('slot', index, 'move')}
                  onTouchStart={useTouchFallback ? startDrag('slot', index, 'move') : undefined}
                  style={{
                    position: 'absolute',
                    left: `${(slot.x / previewCanvas.width) * 100}%`,
                    top: `${(slot.y / previewCanvas.height) * 100}%`,
                    width: `${(slot.width / previewCanvas.width) * 100}%`,
                    height: `${(slot.height / previewCanvas.height) * 100}%`,
                    borderRadius: Math.max(8, (slot.radius / Math.max(1, slot.width)) * 100 * 0.5),
                    boxSizing: 'border-box',
                    border: `2px solid ${active ? T.ink : 'rgba(26,26,31,0.28)'}`,
                    background: active ? 'rgba(26,26,31,0.04)' : 'rgba(255,255,255,0.04)',
                    cursor: 'move',
                    touchAction: 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    padding: '2px 5px',
                    borderRadius: 999,
                    background: active ? T.ink : 'rgba(26,26,31,0.65)',
                    color: active ? T.bg : '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                  }}>
                    {index + 1}
                  </div>
                  <div
                    onPointerDown={useTouchFallback ? undefined : startDrag('slot', index, 'resize')}
                    onTouchStart={useTouchFallback ? startDrag('slot', index, 'resize') : undefined}
                    style={{
                      position: 'absolute',
                      right: -3,
                      bottom: -3,
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: T.ink,
                      cursor: 'nwse-resize',
                      touchAction: 'none',
                    }}
                  />
                </div>
              );
            })}

            {currentDecorations.map((deco, index) => {
              const active = selectedDecorationIndex === index;
              const x = deco.x || 0;
              const y = deco.y || 0;
              const w = deco.width || 80;
              const h = deco.height || 80;
              return (
                <div
                  key={deco.id || index}
                  onPointerDown={useTouchFallback ? undefined : startDrag('decor', index, 'move')}
                  onTouchStart={useTouchFallback ? startDrag('decor', index, 'move') : undefined}
                  style={{
                    position: 'absolute',
                    left: `${(x / previewCanvas.width) * 100}%`,
                    top: `${(y / previewCanvas.height) * 100}%`,
                    width: `${(w / previewCanvas.width) * 100}%`,
                    height: `${(h / previewCanvas.height) * 100}%`,
                    border: `2px solid ${active ? T.ink : 'rgba(26,26,31,0.18)'}`,
                    background: deco.type === 'text' ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,31,0.04)',
                    borderRadius: deco.shape === 'circle' ? 999 : 10,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'move',
                    boxSizing: 'border-box',
                    opacity: deco.opacity ?? 1,
                    transform: `rotate(${deco.rotation || 0}deg)`,
                    touchAction: 'none',
                  }}
                >
                  <div style={{ fontSize: deco.type === 'text' ? 12 : 10, fontWeight: 800, color: deco.fill || T.ink, textAlign: 'center', padding: 4 }}>
                    {deco.type === 'text' ? (deco.text || 'TEXT') : (deco.shape || 'shape')}
                  </div>
                  <div
                    onPointerDown={useTouchFallback ? undefined : startDrag('decor', index, 'resize')}
                    onTouchStart={useTouchFallback ? startDrag('decor', index, 'resize') : undefined}
                    style={{
                      position: 'absolute',
                      right: -3,
                      bottom: -3,
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: T.ink,
                      cursor: 'nwse-resize',
                      touchAction: 'none',
                    }}
                  />
                </div>
              );
            })}
            {showGuides && activeGuides.map((guide, index) => (
              <div
                key={`${guide.axis}-${guide.kind}-${index}`}
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  background: 'rgba(130, 92, 255, 0.8)',
                  zIndex: 6,
                  ...(guide.axis === 'v'
                    ? { top: 0, bottom: 0, left: `${(guide.value / previewCanvas.width) * 100}%`, width: 2, transform: 'translateX(-1px)' }
                    : { left: 0, right: 0, top: `${(guide.value / previewCanvas.height) * 100}%`, height: 2, transform: 'translateY(-1px)' }),
                }}
              />
            ))}
            {gridEnabled && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(130,92,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(130,92,255,0.08) 1px, transparent 1px)', backgroundSize: '20% 20%', zIndex: 1 }} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gap: 12,
        alignContent: 'start',
        position: mobile ? 'static' : 'sticky',
        top: mobile ? 'auto' : 12,
        alignSelf: 'start',
      }}>
        <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Status</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <StoreBadge T={T} tone="light">{isDirty ? 'Unsaved' : 'Saved'}</StoreBadge>
              {designerBasePresetId && <StoreBadge T={T} tone="light">{designerBasePresetId}</StoreBadge>}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.inkSoft }}>{validation.ok ? 'Draft is valid.' : validation.error}</div>
          {statusMessage && <div style={{ fontSize: 11, color: T.ink }}>{statusMessage}</div>}
          {validationError && <div style={{ fontSize: 11, color: '#B64B4B' }}>{validationError}</div>}
        </div>

        {activeTab === 'layout' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Layout</div>
            <input value={normalizedDraft.name} onChange={(e) => normalizeNextDraft({ name: e.target.value })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 12px', fontSize: 12 }} placeholder="Frame name" />
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
              {['strip', 'grid', 'trip', 'polaroid'].map((nextLayout) => (
                <button key={nextLayout} onClick={() => setDraftLayout(nextLayout)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: normalizedDraft.layout === nextLayout ? T.ink : '#fff', color: normalizedDraft.layout === nextLayout ? T.bg : T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                  {nextLayout}
                </button>
              ))}
            </div>
            <button onClick={restoreLayoutSlots} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              Restore layout defaults
            </button>
          </div>
        )}

        {activeTab === 'background' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Background</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['#ffffff', '#111111', '#f5e8f0', '#e5f2ff', '#f8ead7', '#dbeee1'].map((swatch) => (
                <button key={swatch} onClick={() => setBackgroundPatch({ type: 'solid', value: swatch })} style={{ height: 36, borderRadius: 999, border: 'none', background: swatch, boxShadow: normalizedDraft.background?.value === swatch ? `0 0 0 2px ${T.ink}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
              ))}
            </div>
            <input value={String(normalizedDraft.background?.value || '#ffffff')} onChange={(e) => setBackgroundPatch({ type: 'solid', value: e.target.value })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 12px', fontSize: 12 }} placeholder="#ffffff" />
            <label style={{ fontSize: 11, color: T.inkSoft }}>Opacity</label>
            <input type="range" min="0" max="1" step="0.01" value={Number(normalizedDraft.background?.opacity ?? 1)} onChange={(e) => setBackgroundPatch({ opacity: Number(e.target.value) })} />
            <select value={normalizedDraft.background?.type || 'solid'} onChange={(e) => {
              const type = e.target.value;
              if (type === 'gradient') setBackgroundPatch({ type, value: { type: 'linear', angle: 0, stops: ['#FFFFFF', '#F5F5F5'] } });
              else if (type === 'pattern') setBackgroundPatch({ type, value: { pattern: 'dots', color: '#FFFFFF', dotColor: 'rgba(17,17,17,0.05)' } });
              else setBackgroundPatch({ type: 'solid', value: normalizedDraft.background?.value || '#FFFFFF' });
            }} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 12px', fontSize: 12 }}>
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
              <option value="pattern">Pattern</option>
            </select>
            {normalizedDraft.background?.type === 'gradient' && (
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['#FFFFFF', '#F4F4F4'],
                  ['#FFF1F7', '#F4D7FF'],
                  ['#E8F3FF', '#DCEEFF'],
                ].map((stops, idx) => (
                  <button key={idx} onClick={() => setBackgroundPatch({ type: 'gradient', value: { type: 'linear', angle: idx * 35, stops } })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: `linear-gradient(90deg, ${stops[0]}, ${stops[1]})` }} />
                ))}
              </div>
            )}
            {normalizedDraft.background?.type === 'pattern' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <select value={normalizedDraft.background?.value?.pattern || 'dots'} onChange={(e) => setBackgroundPatch({ type: 'pattern', value: { ...(normalizedDraft.background.value || {}), pattern: e.target.value } })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 12px', fontSize: 12 }}>
                  <option value="dots">Dots</option>
                  <option value="confetti">Confetti</option>
                  <option value="bubbles">Bubbles</option>
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'slots' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Slots</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {currentLayoutSlots.map((slot, index) => (
                <button key={index} onClick={() => setSelectedSlotIndex(index)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${selectedSlotIndex === index ? T.ink : T.line}`, background: selectedSlotIndex === index ? T.card : '#fff', padding: '8px 12px', textAlign: 'left' }}>
                  Slot {index + 1}
                </button>
              ))}
            </div>
            {selectedSlot && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {['x', 'y', 'width', 'height', 'radius'].map((key) => (
                  <label key={key} style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                    {key.toUpperCase()}
                    <input type="number" value={Math.round(selectedSlot[key] || 0)} onChange={(e) => setSlotPatch(selectedSlotIndex, { [key]: Number(e.target.value) })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                ['◀', -12, 0],
                ['▶', 12, 0],
                ['▲', 0, -12],
                ['▼', 0, 12],
              ].map(([label, dx, dy]) => (
                <button key={label} onClick={() => selectedSlot && setSlotPatch(selectedSlotIndex, { x: selectedSlot.x + dx, y: selectedSlot.y + dy })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', fontSize: 14, fontWeight: 800 }}>{label}</button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>Layers</div>
              <StoreBadge T={T} tone="light">{currentLayers.length}</StoreBadge>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {currentLayers.map((layer, index) => {
                const active = activeLayerIndex === index;
                return (
                  <div key={layer.id || index} style={{ border: `1px solid ${active ? T.ink : T.line}`, borderRadius: 12, background: active ? T.card : '#fff', padding: 10, display: 'grid', gap: 8 }}>
                    <button onClick={() => setActiveLayerIndex(index)} style={{ minHeight: 44, borderRadius: 10, border: 'none', background: 'transparent', padding: 0, textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.ink }}>
                      {index + 1}. {layer.type}
                    </button>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setLayerPatch(index, { visible: !layer.visible })} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: layer.visible ? T.ink : '#fff', color: layer.visible ? T.bg : T.ink, padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                        {layer.visible ? 'Visible' : 'Hidden'}
                      </button>
                      <button onClick={() => setLayerPatch(index, { locked: !layer.locked })} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: layer.locked ? T.ink : '#fff', color: layer.locked ? T.bg : T.ink, padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                        {layer.locked ? 'Locked' : 'Unlocked'}
                      </button>
                      <button onClick={() => moveLayer(index, -1)} disabled={index === 0} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Up</button>
                      <button onClick={() => moveLayer(index, 1)} disabled={index === currentLayers.length - 1} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Down</button>
                      <button onClick={() => duplicateLayer(index)} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Duplicate</button>
                      <button onClick={() => deleteLayer(index)} style={{ minHeight: 38, borderRadius: 999, border: `1px solid ${T.line}`, background: '#fff', padding: '0 10px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Delete</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <label style={{ display: 'grid', gap: 4, fontSize: 10, color: T.inkSoft }}>
                        Opacity
                        <input type="number" min="0" max="1" step="0.05" value={Number(layer.opacity ?? 1)} onChange={(e) => setLayerPatch(index, { opacity: Number(e.target.value) })} style={{ minHeight: 38, borderRadius: 10, border: `1px solid ${T.line}`, padding: '0 10px' }} />
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 10, color: T.inkSoft }}>
                        Blend
                        <select value={layer.blendMode || 'normal'} onChange={(e) => setLayerPatch(index, { blendMode: e.target.value })} style={{ minHeight: 38, borderRadius: 10, border: `1px solid ${T.line}`, padding: '0 10px' }}>
                          {['normal', 'multiply', 'screen', 'overlay', 'soft-light'].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: 4, fontSize: 10, color: T.inkSoft }}>
                        zIndex
                        <input type="number" value={Number(layer.zIndex ?? index)} onChange={(e) => setLayerPatch(index, { zIndex: Number(e.target.value) })} style={{ minHeight: 38, borderRadius: 10, border: `1px solid ${T.line}`, padding: '0 10px' }} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setShowGuides((v) => !v)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: showGuides ? T.ink : '#fff', color: showGuides ? T.bg : T.ink, padding: '0 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{showGuides ? 'Guides On' : 'Guides Off'}</button>
              <button onClick={() => setSnapEnabled((v) => !v)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: snapEnabled ? T.ink : '#fff', color: snapEnabled ? T.bg : T.ink, padding: '0 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{snapEnabled ? 'Snap On' : 'Snap Off'}</button>
              <button onClick={() => setGridEnabled((v) => !v)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: gridEnabled ? T.ink : '#fff', color: gridEnabled ? T.bg : T.ink, padding: '0 12px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{gridEnabled ? 'Grid On' : 'Grid Off'}</button>
            </div>
          </div>
        )}

        {activeTab === 'decorations' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Decorations</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['circle', 'roundedRect', 'heart', 'star', 'line', 'ribbon', 'speech', 'ticket', 'stamp'].map((shape) => (
                <button key={shape} onClick={() => addDecoration(shape, 'shape')} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{shape}</button>
              ))}
              <button onClick={() => addDecoration('text', 'text')} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Text</button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {currentDecorations.map((deco, index) => (
                <button key={deco.id || index} onClick={() => setSelectedDecorationIndex(index)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${selectedDecorationIndex === index ? T.ink : T.line}`, background: selectedDecorationIndex === index ? T.card : '#fff', padding: '8px 12px', textAlign: 'left' }}>
                  {deco.type === 'text' ? `Text: ${deco.text || 'TEXT'}` : `${deco.shape || 'shape'} · ${index + 1}`}
                </button>
              ))}
            </div>
            {selectedDecoration && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {['x', 'y', 'width', 'height', 'rotation', 'opacity'].map((key) => (
                    <label key={key} style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                      {key.toUpperCase()}
                      <input type="number" step={key === 'opacity' ? '0.01' : '1'} value={Number(selectedDecoration[key] || 0)} onChange={(e) => setDecorationPatch(selectedDecorationIndex, { [key]: Number(e.target.value) })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                    </label>
                  ))}
                </div>
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                  Fill
                  <input value={selectedDecoration.fill || '#111111'} onChange={(e) => setDecorationPatch(selectedDecorationIndex, { fill: e.target.value })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                  Layer
                  <select value={selectedDecoration.layer || (Number(selectedDecoration.zIndex) < 0 ? 'back' : 'front')} onChange={(e) => setDecorationPatch(selectedDecorationIndex, { layer: e.target.value, zIndex: e.target.value === 'back' ? -1 : 10 })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }}>
                    <option value="back">Back</option>
                    <option value="front">Front</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => duplicateDecoration(selectedDecorationIndex)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', padding: '0 12px', fontSize: 11, fontWeight: 800 }}>Duplicate</button>
                  <button onClick={() => deleteDecoration(selectedDecorationIndex)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', padding: '0 12px', fontSize: 11, fontWeight: 800 }}>Delete</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Text / Watermark</div>
            <button onClick={() => addDecoration('TEXT', 'text')} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Add text</button>
            {selectedDecoration?.type === 'text' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                  Text
                  <input value={selectedDecoration.text || ''} onChange={(e) => setDecorationPatch(selectedDecorationIndex, { text: e.target.value })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                </label>
                <label style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                  Font weight
                  <input type="number" value={Number(selectedDecoration.fontWeight || 800)} onChange={(e) => setDecorationPatch(selectedDecorationIndex, { fontWeight: Number(e.target.value) })} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                </label>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 10, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.ink }}>Watermark</div>
              <input value={normalizedDraft.watermark?.text || ''} onChange={(e) => normalizeNextDraft((prev) => ({ ...prev, watermark: { ...(prev.watermark || {}), text: e.target.value } }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} placeholder="IMMM" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {['x', 'y', 'opacity'].map((key) => (
                  <label key={key} style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
                    {key.toUpperCase()}
                    <input type="number" step={key === 'opacity' ? '0.01' : '0.01'} value={Number(normalizedDraft.watermark?.[key] ?? (key === 'opacity' ? 0.48 : 0.5))} onChange={(e) => normalizeNextDraft((prev) => ({ ...prev, watermark: { ...(prev.watermark || {}), [key]: Number(e.target.value) } }))} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'save' && (
          <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${T.line}`, background: '#fff', display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 900 }}>Save / Pack Export</div>
            <label style={{ display: 'grid', gap: 4, fontSize: 11, color: T.inkSoft }}>
              Export preset
              <select value={exportPresetId} onChange={(e) => setExportPresetId && setExportPresetId(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }}>
                {(frameApi?.getExportPresets?.() || [
                  { id: 'hd', name: 'HD' },
                  { id: 'instagram-story', name: 'Instagram Story' },
                  { id: 'instagram-post', name: 'Instagram Post' },
                  { id: 'wallpaper', name: 'Wallpaper' },
                ]).map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
            </label>
            <input value={exportPackName} onChange={(e) => setExportPackName(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} placeholder="Pack name" />
            <input value={exportPackDescription} onChange={(e) => setExportPackDescription(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} placeholder="Pack description" />
            <input value={exportPackAuthor} onChange={(e) => setExportPackAuthor(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} placeholder="Author name" />
            <select value={exportPackLicense} onChange={(e) => setExportPackLicense(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }}>
              <option value="personal">personal</option>
              <option value="commercial">commercial</option>
              <option value="brand-collab">brand-collab</option>
              <option value="internal">internal</option>
            </select>
            <input value={exportPackTags} onChange={(e) => setExportPackTags(e.target.value)} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, padding: '0 10px', fontSize: 12 }} placeholder="tags, comma, separated" />
            <button onClick={handleSaveFrame} style={{ minHeight: 44, borderRadius: 12, border: 'none', background: T.ink, color: T.bg, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Update Existing</button>
            <button onClick={handleSaveAsNew} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Duplicate & Save</button>
            <button onClick={handlePackExport} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Save as Pack Draft</button>
            <button onClick={() => {
              const prompt = window.prompt('Describe an idea', 'kawaii pink y2k');
              if (!prompt) return;
              const idea = generateFrameIdea ? generateFrameIdea(prompt) : null;
              if (!idea) return;
              normalizeNextDraft((prev) => ({
                ...prev,
                background: idea.background || prev.background,
                decorations: [...(idea.decorations || []), ...(prev.decorations || [])],
                watermark: idea.watermark ? { ...(prev.watermark || {}), ...idea.watermark } : prev.watermark,
                layout: idea.recommendedLayout || prev.layout,
              }));
              setActiveTab('background');
              setStatusMessage(`Idea generated for ${prompt}`);
            }} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              Generate Ideas
            </button>
            {designerDraftRecovery && (
              <div style={{ borderRadius: 12, border: `1px solid ${T.line}`, padding: 12, background: 'rgba(26,26,31,0.03)', display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: T.ink }}>Recovery available</div>
                <div style={{ fontSize: 10.5, color: T.inkSoft }}>
                  Saved {formatFrameDate(designerDraftRecovery.savedAt)} · {designerDraftRecovery.draft?.name || 'Untitled'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => {
                    if (designerDraftRecovery?.draft) {
                      setDraftFrame(designerDraftRecovery.draft);
                      setStatusMessage('Recovered previous draft');
                    }
                  }} style={{ minHeight: 44, borderRadius: 12, border: 'none', background: T.ink, color: T.bg, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '0 12px' }}>
                    Restore
                  </button>
                  <button onClick={() => {
                    clearDesignerDraftRecovery && clearDesignerDraftRecovery();
                    setStatusMessage('Recovery discarded');
                  }} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '0 12px' }}>
                    Discard Recovery
                  </button>
                </div>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 10, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: T.ink }}>Import Pack JSON</div>
              <textarea
                value={importPackJson}
                onChange={(e) => setImportPackJson(e.target.value)}
                placeholder="Paste frame pack JSON here"
                rows={5}
                style={{ minHeight: 120, resize: 'vertical', borderRadius: 12, border: `1px solid ${T.line}`, padding: '10px 12px', fontSize: 12, lineHeight: 1.45 }}
              />
              <button onClick={handlePackImport} style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${T.line}`, background: '#fff', color: T.ink, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>Import Pack JSON</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return mobile ? (
    <div style={{ minHeight: '100%', background: T.bg }}>
      {editorShell}
    </div>
  ) : editorShell;
}

const Kicker = Kick;
const PrimaryBtn = BtnPrimary;
const GhostBtn = BtnGhost;

Object.assign(window, { LandingV2, SetupScreen, BtnPrimary, BtnGhost, Kick, StepDots, ScreenTransition, TopBar, Kicker, PrimaryBtn, GhostBtn });
