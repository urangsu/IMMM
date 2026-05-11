// screens-v2.jsx — Redesigned screens per v2 brief

const {
  useState: uS,
  useEffect: uE,
  useRef: uR,
  useMemo: uM
} = React;

// ═══════════════════════════════════════════════════════════════
// Shared primitives
// ═══════════════════════════════════════════════════════════════
function BtnPrimary({
  children,
  onClick,
  T,
  block = false,
  size = 'md',
  disabled
}) {
  const pads = {
    sm: '10px 20px',
    md: '14px 28px',
    lg: '18px 36px'
  };
  const fss = {
    sm: 12,
    md: 13,
    lg: 14
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    disabled: disabled,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: pads[size],
      borderRadius: 4,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: disabled ? 'rgba(10,10,10,0.15)' : T.ink,
      color: T.bg,
      fontSize: fss[size],
      fontWeight: 600,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      width: block ? '100%' : 'auto',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
      transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s'
    },
    onPointerDown: e => !disabled && (e.currentTarget.style.transform = 'scale(0.97)'),
    onPointerUp: e => e.currentTarget.style.transform = 'scale(1)',
    onPointerLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, children);
}
function BtnGhost({
  children,
  onClick,
  T,
  size = 'md'
}) {
  const pads = {
    sm: '8px 16px',
    md: '12px 24px',
    lg: '16px 28px'
  };
  const fss = {
    sm: 11,
    md: 13,
    lg: 14
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: pads[size],
      borderRadius: 4,
      border: `1px solid ${T.ink}`,
      background: 'transparent',
      color: T.ink,
      fontSize: fss[size],
      fontWeight: 500,
      cursor: 'pointer',
      letterSpacing: 1,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
      transition: 'background 0.2s'
    }
  }, children);
}
function Kick({
  children,
  T
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: T.inkSoft
    }
  }, children);
}
function StoreBadge({
  children,
  T,
  tone = 'dark'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      padding: '3px 6px',
      borderRadius: 999,
      background: tone === 'dark' ? T.ink : 'rgba(26,26,31,0.08)',
      color: tone === 'dark' ? T.bg : T.ink,
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: 0.7,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "10",
    height: "8",
    viewBox: "0 0 20 14",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 4l5 3 4-6 4 6 5-3-2 9H3L1 4z"
  })), children);
}

// StepDots — animated progress indicator
function StepDots({
  step,
  total = 5,
  T
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center'
    }
  }, Array.from({
    length: total
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: i === step ? 20 : 4,
      height: 3,
      borderRadius: 2,
      background: i < step ? T.ink : i === step ? T.ink : 'rgba(10,10,10,0.15)',
      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)'
    }
  })));
}
function FramePickerFallback({
  layout,
  T,
  size = 'sm'
}) {
  const isGrid = layout === 'grid';
  const isPolaroid = layout === 'polaroid';
  const isTrip = layout === 'trip';
  const slots = isPolaroid ? 1 : isGrid ? 4 : isTrip ? 3 : 4;
  const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const w = size === 'lg' ? layout === 'polaroid' || layout === 'grid' ? 180 : 120 : layout === 'polaroid' || layout === 'grid' ? mobile ? 56 : 60 : mobile ? 40 : 42;
  const h = size === 'lg' ? layout === 'polaroid' ? 210 : layout === 'grid' ? 180 : 260 : layout === 'polaroid' ? mobile ? 68 : 72 : layout === 'grid' ? mobile ? 56 : 60 : mobile ? 80 : 84;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      background: '#FFFFFF',
      borderRadius: size === 'lg' ? 8 : 4,
      boxShadow: size === 'lg' ? '0 8px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
      padding: size === 'lg' ? 12 : 5,
      display: 'grid',
      gap: size === 'lg' ? 6 : 3,
      gridTemplateColumns: isGrid ? '1fr 1fr' : '1fr',
      gridTemplateRows: isGrid ? '1fr 1fr' : `repeat(${slots}, 1fr)`,
      boxSizing: 'border-box',
      border: `1px solid ${T.line}`
    }
  }, Array.from({
    length: slots
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderRadius: size === 'lg' ? 4 : 2,
      background: T.placeholderFill || '#EFEDEA' // #EFEDEA placeholderFill
    }
  })));
}

// Fade-slide transition wrapper
function ScreenTransition({
  id,
  children
}) {
  const [show, setShow] = uS(false);
  uE(() => {
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [id]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)'
    }
  }, children);
}

// Header chrome
function TopBar({
  step,
  back,
  T,
  mobile,
  title,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: mobile ? '12px 20px' : '14px 20px',
      marginBottom: mobile ? 14 : 20,
      background: 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(20px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.02)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: back,
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: T.ink,
      padding: '6px 8px',
      marginLeft: -8,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontWeight: 600
    }
  }, back && /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L4 8l6 6"
  })), back ? 'Back' : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(StepDots, {
    step: step,
    T: T
  }), title && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 10,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: 700
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 60,
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, right));
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
function LandingV2({
  T,
  variant,
  go,
  mobile,
  onStart,
  onEdit,
  onGallery,
  lang = 'ko',
  setLang
}) {
  const WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  const t = I18N[lang] || I18N.ko;
  const toggleLang = () => setLang(l => l === 'ko' ? 'en' : l === 'en' ? 'jp' : 'ko');
  const logoMark = (size = 48) => /*#__PURE__*/React.createElement("svg", {
    width: size * 1.4,
    height: size,
    viewBox: "0 0 70 50"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M42 8 C52 6 64 12 66 24 C68 36 58 46 46 44 C36 42 28 34 22 28 C16 22 10 16 16 10 C22 4 34 10 42 8Z",
    fill: T.ink
  }));
  if (mobile) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 32px 40px',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: toggleLang,
      style: {
        background: 'rgba(26,26,31,0.05)',
        borderRadius: 999,
        border: 'none',
        color: T.ink,
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        padding: '6px 12px',
        letterSpacing: 1,
        textTransform: 'uppercase',
        transition: 'all 0.2s'
      }
    }, lang)), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
      }
    }, logoMark(42), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 8,
        color: T.ink,
        lineHeight: 1.3
      }
    }, "I M M M"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'Pretendard,system-ui',
        fontSize: 11,
        letterSpacing: 1.5,
        color: T.inkSoft,
        marginTop: 4
      }
    }, t.mobileSub))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: onStart,
      style: {
        width: '100%',
        padding: '18px',
        background: T.ink,
        color: T.bg,
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, t.start), /*#__PURE__*/React.createElement("button", {
      onClick: onEdit,
      style: {
        width: '100%',
        padding: '17px',
        background: 'transparent',
        color: T.ink,
        border: `1px solid ${T.ink}`,
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, t.edit), /*#__PURE__*/React.createElement("button", {
      onClick: onGallery,
      style: {
        width: '100%',
        padding: '12px 16px',
        background: 'transparent',
        color: T.inkSoft,
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.7,
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Gallery")));
  }

  // Desktop
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'transparent',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 56px',
      display: 'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 6,
      color: T.ink
    }
  }, "I M M M"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 28,
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onGallery,
    style: {
      background: 'transparent',
      border: 'none',
      color: T.inkSoft,
      cursor: 'pointer',
      font: 'inherit',
      letterSpacing: 'inherit',
      textTransform: 'inherit',
      padding: 0
    }
  }, "Gallery"), /*#__PURE__*/React.createElement("span", null, "Frames"), /*#__PURE__*/React.createElement("button", {
    onClick: toggleLang,
    style: {
      background: 'rgba(26,26,31,0.05)',
      borderRadius: 999,
      border: 'none',
      color: T.ink,
      cursor: 'pointer',
      fontSize: 10,
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      padding: '4px 10px',
      letterSpacing: 1,
      textTransform: 'uppercase',
      transition: 'all 0.2s'
    }
  }, lang))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: T.inkSoft,
      marginBottom: 24
    }
  }, "Web Photobooth"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 72,
      lineHeight: 0.95,
      fontWeight: 700,
      letterSpacing: -2,
      color: T.ink
    }
  }, "My", /*#__PURE__*/React.createElement("br", null), "moments.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Caveat,cursive',
      fontWeight: 400,
      fontSize: 88,
      letterSpacing: -1
    }
  }, "Uniquely Mine.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      fontSize: 14,
      lineHeight: 1.6,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      maxWidth: 380
    }
  }, t.desc1, /*#__PURE__*/React.createElement("br", null), t.desc2), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onStart,
    style: {
      padding: '16px 36px',
      background: T.ink,
      color: T.bg,
      border: 'none',
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, t.start), /*#__PURE__*/React.createElement("button", {
    onClick: onEdit,
    style: {
      padding: '16px 28px',
      background: 'transparent',
      color: T.ink,
      border: `1px solid ${T.ink}`,
      borderRadius: 4,
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, t.edit))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 10,
      color: T.inkSoft,
      letterSpacing: 1.5,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9\xA0DALGRACSTUDIO"), /*#__PURE__*/React.createElement("span", null, "All processing on-device"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'transparent',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "asset/main.jpg",
    style: {
      width: '120%',
      height: 'auto',
      maxWidth: 'none',
      transform: 'translateX(10%)',
      // Shift right to show the collage better
      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.05))',
      userSelect: 'none',
      pointerEvents: 'none'
    }
  })));
}

// ═══════════════════════════════════════════════════════════════
// 2. SETUP — Frame + Filter + Pre-stickers
// ═══════════════════════════════════════════════════════════════
const ZoomMinusIcon = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 18 18",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 9H14",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round"
}));
const ZoomPlusIcon = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 18 18",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 9H14M9 4V14",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round"
}));
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
  boxShadow: '0 8px 24px rgba(0,0,0,0.16)'
};
function getStickerPickerPacks() {
  return typeof getVisibleStickerPacks === 'function' ? getVisibleStickerPacks() : Object.entries(STICKER_CATALOG).filter(([k, pack]) => !pack.hidden);
}
function SetupScreen({
  T,
  go,
  mobile,
  variant,
  layout,
  setLayout,
  filter,
  setFilter,
  preStickers,
  setPreStickers,
  logo,
  setLogo,
  dateText,
  setDateText,
  orientation,
  setOrientation,
  frameColor,
  setFrameColor,
  accent,
  editMode,
  shots,
  setShots,
  setSelected,
  setUseWebgl,
  tweaks
}) {
  const WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  const [tab, setTab] = uS(() => editMode ? 'photos' : 'frame'); // photos | frame | filter | companions
  const [selStId, setSelStId] = uS(null);
  const [expandedPacks, setExpandedPacks] = uS({});
  const fileRef = uR(null);
  const addPreset = libId => {
    const item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    const sizeNorm = typeof getDefaultStickerSizeNorm === 'function' ? getDefaultStickerSizeNorm(item) : undefined;
    setPreStickers(prev => [...prev, makeSticker('preset', {
      libId
    }, {
      sizeNorm
    })]);
  };
  const addUpload = dataUrl => {
    setPreStickers(prev => [...prev, makeSticker('upload', {
      dataUrl
    }, {
      scale: 0.6
    })]);
  };
  const onFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => addUpload(rd.result);
    rd.readAsDataURL(f);
  };
  const shotsPreview = Array.from({
    length: 4
  }, () => ({
    filter: 'original',
    dataUrl: null
  }));
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
    return () => {
      clearTimeout(tid);
      ro.disconnect();
    };
  }, [layout, mobile, orientation]);

  // Preview surface (interactive, shows frame + companion stickers)
  const zoomIn = () => setSetupZoom(z => Math.min(3, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setSetupZoom(z => Math.max(0.15, +(z - 0.15).toFixed(2)));
  const frameW = layout === 'polaroid' ? 200 : orientation === 'landscape' && layout === 'strip' ? 360 : orientation === 'landscape' && layout === 'trip' ? 280 : layout === 'grid' ? 220 : 160;
  const preview = /*#__PURE__*/React.createElement("div", {
    ref: setupContainerRef,
    style: {
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: setupFrameRef,
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) scale(${setupZoom})`,
      transformOrigin: 'center'
    }
  }, /*#__PURE__*/React.createElement(StickerCanvas, {
    T: T,
    stickers: preStickers,
    setStickers: setPreStickers,
    selectedId: selStId,
    setSelectedId: setSelStId,
    width: frameW,
    canvasW: frameW,
    height: "auto"
  }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
    key: frameColor,
    layout: layout,
    shots: [{
      filter
    }, {
      filter
    }, {
      filter
    }, {
      filter
    }],
    selected: [0, 1, 2, 3],
    T: T,
    logo: logo,
    dateText: dateText,
    accent: accent,
    scale: 1,
    orientation: orientation,
    frameColor: frameColor
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(FramePickerFallback, {
    layout: layout,
    T: T,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -30,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 11,
      color: T.inkSoft,
      whiteSpace: 'nowrap'
    }
  }, "Preview loading...")))));
  const frameTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Choose your frame \xB7 \uD504\uB808\uC784 \uC120\uD0DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8,
      width: '100%'
    }
  }, [{
    id: 'strip',
    en: '1×4 Strip',
    ko: '스트립'
  }, {
    id: 'trip',
    en: '1×3',
    ko: '트리플'
  }, {
    id: 'grid',
    en: '2×2 Grid',
    ko: '그리드'
  }, {
    id: 'polaroid',
    en: '1×1',
    ko: '폴라로이드'
  }].map(o => {
    const resolveFrameTemplate = layout => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
        return window.getFrameTemplateSafe(layout);
      }
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
        return window.getFrameTemplate(layout);
      }
      return null;
    };
    const tpl = resolveFrameTemplate(o.id);
    const canRenderRealThumb = Boolean(WFrameThumb && tpl);
    const pickerThumbScale = mobile ? 0.235 : 0.28;
    if (typeof window !== 'undefined' && window.IMMM_DEBUG_BUILD) {
      console.warn('[IMMM frame picker]', {
        hasFrameThumb: typeof window.FrameThumb === 'function',
        hasGetFrameTemplateSafe: typeof window.getFrameTemplateSafe === 'function',
        layout: o.id,
        canRenderRealThumb
      });
    }
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => setLayout(o.id),
      style: {
        padding: '14px 8px 10px',
        background: layout === o.id ? T.card : '#FFFFFF',
        border: 'none',
        borderRadius: 16,
        cursor: 'pointer',
        boxShadow: layout === o.id ? `0 1px 4px rgba(0,0,0,0.06), 0 0 0 2px ${T.ink} inset` : `0 0 0 1px ${T.line} inset`,
        // #E5E2DA frameCardBorder
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.25s'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        width: '100%',
        height: 84,
        overflow: 'hidden',
        pointerEvents: 'none',
        display: 'grid',
        placeItems: 'center'
      }
    }, canRenderRealThumb ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${pickerThumbScale})`,
        zIndex: 2
      }
    }, /*#__PURE__*/React.createElement(WFrameThumb, {
      key: frameColor,
      layout: o.id,
      shots: shotsPreview,
      selected: [0, 1, 2, 3],
      T: T,
      logo: false,
      dateText: false,
      accent: accent,
      scale: 1,
      orientation: "portrait",
      frameColor: frameColor
    })) : /*#__PURE__*/React.createElement(FramePickerFallback, {
      layout: o.id,
      T: T,
      size: "sm"
    }), tpl?.recommended && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 4,
        left: 5,
        zIndex: 5
      }
    }, /*#__PURE__*/React.createElement(StoreBadge, {
      T: T
    }, "Pick"))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontWeight: 600
      }
    }, o.en, /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.inkSoft,
        fontWeight: 400,
        marginLeft: 4,
        fontFamily: 'Pretendard,system-ui'
      }
    }, o.ko)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 14,
      borderRadius: 18,
      background: T.softSurface,
      border: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Frame Store \xB7 \uCD94\uCC9C \uD504\uB808\uC784"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, "Soon")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, Object.values(typeof FRAME_TEMPLATES !== 'undefined' ? FRAME_TEMPLATES : {}).filter(t => t.recommended).slice(0, 2).map(tpl => /*#__PURE__*/React.createElement("button", {
    key: tpl.id,
    onClick: () => setLayout({
      '1x4': 'strip',
      '2x2': 'grid',
      '1x3': 'trip',
      '1x1': 'polaroid'
    }[tpl.type] || 'strip'),
    style: {
      border: 'none',
      borderRadius: 14,
      padding: 10,
      background: T.card,
      cursor: 'pointer',
      boxShadow: `0 0 0 1px ${T.line}, 0 12px 28px rgba(0,0,0,0.04)`,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, tpl.ko), tpl.recommended && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, "Pick")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, tpl.canvasSize.width, "\xD7", tpl.canvasSize.height, " \xB7 ", tpl.photoSlots.length, "\uCEF7"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      borderTop: `1px solid ${T.line}`,
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Frame options \xB7 \uD504\uB808\uC784 \uC635\uC158"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOrientation && setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait'),
    disabled: layout === 'grid' || layout === 'polaroid',
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      cursor: layout === 'grid' || layout === 'polaroid' ? 'default' : 'pointer',
      background: T.softSurface,
      width: '100%',
      textAlign: 'left',
      opacity: layout === 'grid' || layout === 'polaroid' ? 0.4 : 1
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      color: T.ink
    }
  }, "\uBC29\uD5A5 \xB7 Orientation"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      marginTop: 1
    }
  }, layout === 'grid' || layout === 'polaroid' ? '이 프레임은 방향 전환 불가' : orientation === 'portrait' ? '세로형 → 가로형으로 전환' : '가로형 → 세로형으로 전환')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, ['portrait', 'landscape'].map(o => /*#__PURE__*/React.createElement("div", {
    key: o,
    style: {
      padding: '5px 10px',
      borderRadius: 999,
      fontSize: 10.5,
      fontWeight: 700,
      background: orientation === o ? T.ink : 'rgba(26,26,31,0.06)',
      color: orientation === o ? T.bg : T.inkSoft,
      letterSpacing: 0.5,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      transition: 'all 0.2s'
    }
  }, o === 'portrait' ? '세로' : '가로')))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDateText && setDateText(!dateText),
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      cursor: 'pointer',
      background: T.softSurface,
      width: '100%',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      color: T.ink
    }
  }, "\uB0A0\uC9DC \uD45C\uC2DC"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      marginTop: 1
    }
  }, "\uD504\uB808\uC784 \uD558\uB2E8\uC5D0 \uCD2C\uC601 \uB0A0\uC9DC")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 20,
      borderRadius: 999,
      background: dateText ? T.ink : 'rgba(26,26,31,0.15)',
      position: 'relative',
      flexShrink: 0,
      transition: '0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 999,
      background: '#fff',
      position: 'absolute',
      top: 3,
      left: dateText ? 19 : 3,
      transition: '0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      color: T.ink,
      marginBottom: 8
    }
  }, "\uBC30\uACBD \uC0C9\uC0C1 \xB7 Frame Color"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, [{
    id: '#ffffff',
    name: 'White'
  }, {
    id: '#111111',
    name: 'Black'
  }, {
    id: '#F1C0C5',
    name: 'Pink'
  }, {
    id: '#A6C8DE',
    name: 'Sky Blue'
  }, {
    id: '#E6C8BE',
    name: 'Beige'
  }, {
    id: '#A2352B',
    name: 'Red'
  }].map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => setFrameColor && setFrameColor(c.id),
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: c.id,
      boxShadow: frameColor === c.id ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${T.ink}` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
      transition: '0.2s',
      position: 'relative'
    }
  }, frameColor === c.id && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 38,
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 9,
      fontWeight: 700,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      whiteSpace: 'nowrap'
    }
  }, c.name))))))));
  const filterTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Choose a filter \xB7 \uD544\uD130 \uC120\uD0DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      marginBottom: 12,
      padding: '12px 14px',
      borderRadius: 16,
      background: 'rgba(26,26,31,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      border: tweaks.useWebgl ? `1.5px solid ${T.ink}` : '1.5px solid transparent',
      transition: '0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      marginRight: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, "AR Filters ", tweaks.useWebgl && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      background: T.ink,
      color: T.bg,
      padding: '1px 5px',
      borderRadius: 4,
      letterSpacing: 0.5
    }
  }, "ACTIVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      marginTop: 2,
      lineHeight: 1.3
    }
  }, "\uC5BC\uAD74 \uBCF4\uC815 \uBC0F AR \uD2B9\uC218\uD6A8\uACFC (\uC77C\uBD80 \uAE30\uAE30\uC5D0\uC11C \uB290\uB9B4 \uC218 \uC788\uC74C)")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setUseWebgl(!tweaks.useWebgl),
    style: {
      width: 42,
      height: 22,
      borderRadius: 999,
      background: tweaks.useWebgl ? T.ink : 'rgba(26,26,31,0.12)',
      position: 'relative',
      border: 'none',
      cursor: 'pointer',
      transition: '0.3s cubic-bezier(0.34,1.56,0.64,1)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 16,
      height: 16,
      borderRadius: 999,
      background: '#fff',
      position: 'absolute',
      top: 3,
      left: tweaks.useWebgl ? 23 : 3,
      transition: '0.3s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8
    }
  }, (typeof getVisibleFilters === 'function' ? getVisibleFilters() : Object.entries(FILTERS).filter(([, v]) => !v.hidden)).map(([k, v]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setFilter(k),
    style: {
      padding: 0,
      border: 'none',
      cursor: 'pointer',
      background: T.card,
      borderRadius: 14,
      overflow: 'hidden',
      textAlign: 'left',
      boxShadow: filter === k ? '0 0 0 2px ' + T.ink : '0 0 0 1px rgba(26,26,31,0.08)',
      transition: 'all 0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "asset/filter-sample.jpg",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: v.css
    }
  }), /*#__PURE__*/React.createElement(FilterOverlay, {
    filter: k
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px',
      fontSize: 11,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, v.name, /*#__PURE__*/React.createElement("span", {
    style: {
      color: T.inkSoft,
      fontWeight: 400,
      marginLeft: 4
    }
  }, v.ko)), v.premium && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, "Pro")))))));
  const companionsTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Stickers \xB7 \uC2A4\uD2F0\uCEE4"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileRef.current?.click(),
    style: {
      padding: '6px 10px',
      background: T.ink,
      color: T.bg,
      border: 'none',
      borderRadius: 999,
      fontSize: 11,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 2v8M2 6h8",
    stroke: "#fff",
    strokeWidth: "1.8",
    strokeLinecap: "round"
  })), "Upload PNG"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: onFile
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      lineHeight: 1.45
    }
  }, "\uC2A4\uD2F0\uCEE4\uB97C \uD504\uB808\uC784\uC5D0 \uB4DC\uB798\uADF8\uD558\uC5EC \uBC30\uCE58\uD558\uC138\uC694. \uD06C\uAE30 \uC870\uC808, \uD68C\uC804 \uAC00\uB2A5."), getStickerPickerPacks().map(([k, pack]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, pack.name, " \xB7 ", pack.ko), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5
    }
  }, pack.recommended && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, "Pick"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
      gap: 8
    }
  }, (expandedPacks[k] ? pack.items : pack.items.slice(0, 5)).map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => addPreset(it.id),
    style: {
      padding: 10,
      background: T.card,
      border: 'none',
      borderRadius: 12,
      boxShadow: '0 0 0 1px rgba(26,26,31,0.06)',
      cursor: 'pointer',
      minHeight: 58,
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'transform 0.2s'
    },
    onPointerDown: e => e.currentTarget.style.transform = 'scale(0.94)',
    onPointerUp: e => e.currentTarget.style.transform = 'scale(1)',
    onPointerLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 42,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      writingMode: 'horizontal-tb',
      whiteSpace: 'nowrap'
    }
  }, renderLibSticker(it, 0.65)))), !expandedPacks[k] && pack.items.length > 5 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedPacks(p => ({
      ...p,
      [k]: true
    })),
    style: {
      padding: 10,
      background: 'rgba(26,26,31,0.04)',
      border: 'none',
      borderRadius: 12,
      color: T.inkSoft,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      minHeight: 58,
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, "+", pack.items.length - 5)))));
  const photoFileRefs = [uR(null), uR(null), uR(null), uR(null)];
  const maxUploadCount = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(layout) : layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
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
      setShots(prev => {
        const n = [...prev];
        while (n.length <= targetIdx) n.push(null);
        n[targetIdx] = {
          dataUrl,
          filter,
          renderMode: 'upload',
          capturedFilter: filter,
          ts: Date.now()
        };
        return n;
      });
    }
  };
  const photosTab = editMode ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "\uC0AC\uC9C4 \uBD88\uB7EC\uC624\uAE30 \xB7 Upload Photos"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [0, 1, 2, 3].map(i => {
    const s = shots?.[i];
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => photoFileRefs[i].current?.click(),
      style: {
        aspectRatio: '4/3',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: s?.dataUrl ? 'transparent' : 'rgba(26,26,31,0.05)',
        border: s?.dataUrl ? 'none' : `1.5px dashed rgba(26,26,31,0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, s?.dataUrl ? /*#__PURE__*/React.createElement("img", {
      src: s.dataUrl,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    }) : /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        color: T.inkSoft
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "22",
      height: "22",
      viewBox: "0 0 22 22",
      fill: "none"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M11 4v14M4 11h14",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        marginTop: 4,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        letterSpacing: 1
      }
    }, "\uCEF7 ", i + 1)), s?.dataUrl && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "10",
      height: "10",
      viewBox: "0 0 10 10"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M2 2l6 6M8 2L2 8",
      stroke: "#fff",
      strokeWidth: "1.5",
      strokeLinecap: "round"
    }))), /*#__PURE__*/React.createElement("input", {
      ref: photoFileRefs[i],
      type: "file",
      accept: "image/*",
      style: {
        display: 'none'
      },
      onChange: e => onPhotoUpload(i, e)
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui',
      textAlign: 'center'
    }
  }, "4\uCEF7\uC744 \uBAA8\uB450 \uC5C5\uB85C\uB4DC\uD558\uBA74 \uD3B8\uC9D1\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4")) : null;
  const uploadedCount = editMode ? [0, 1, 2, 3].filter(i => shots?.[i]?.dataUrl).length : 0;
  const tabContent = tab === 'photos' ? photosTab : tab === 'frame' ? frameTab : tab === 'filter' ? filterTab : companionsTab;
  const tabBar = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      borderBottom: `1px solid ${T.line}`,
      marginBottom: 18
    }
  }, [...(editMode ? [['photos', '사진']] : []), ['frame', '프레임'], ['filter', '필터'], ['companions', '스티커']].map(([k, ko]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      flex: 1,
      padding: '14px 8px',
      border: 'none',
      borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
      background: 'transparent',
      color: tab === k ? T.ink : T.inkSoft,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      transition: 'all 0.2s',
      marginBottom: -1
    }
  }, ko)));
  if (mobile) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: T.bg,
        padding: '50px 0 0',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement(TopBar, {
      step: 0,
      back: () => go('landing'),
      T: T,
      mobile: true,
      title: editMode ? '편집하기' : 'Setup · 세팅',
      right: /*#__PURE__*/React.createElement(BtnPrimary, {
        T: T,
        size: "sm",
        onClick: () => go(editMode ? 'deco' : 'capture'),
        disabled: editMode && uploadedCount < 4
      }, editMode ? '편집 시작' : 'Next')
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 0',
        minHeight: 0,
        position: 'relative'
      }
    }, preview, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        display: 'flex',
        gap: 10,
        zIndex: 20
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: zoomOut,
      style: zoomBtnStyle,
      "aria-label": "Zoom out"
    }, /*#__PURE__*/React.createElement(ZoomMinusIcon, null)), /*#__PURE__*/React.createElement("button", {
      onClick: zoomIn,
      style: zoomBtnStyle,
      "aria-label": "Zoom in"
    }, /*#__PURE__*/React.createElement(ZoomPlusIcon, null)))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 'auto',
        background: 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        padding: '20px 20px 28px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        maxHeight: '58%',
        overflow: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 4,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.1)',
        margin: '0 auto 14px'
      }
    }), tabBar, tabContent));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'transparent',
      display: 'grid',
      gridTemplateColumns: '1fr 380px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 48px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    step: 0,
    back: () => go('landing'),
    T: T,
    title: editMode ? '편집하기 · Upload & Edit' : 'Step 1 · Setup the booth',
    right: /*#__PURE__*/React.createElement(BtnPrimary, {
      T: T,
      size: "md",
      onClick: () => go(editMode ? 'deco' : 'capture'),
      disabled: editMode && uploadedCount < 4
    }, editMode ? '편집 시작' : 'Continue · 다음', " ", !editMode && I.arrowR(14, T.bg))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: T.bgAlt,
      borderRadius: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${T.line}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
    }
  }, " ", preview, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      left: 18,
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 1.5
    }
  }, "LIVE PREVIEW \xB7 drag companions to place them"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 18,
      right: 18,
      display: 'flex',
      gap: 10,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: zoomOut,
    style: zoomBtnStyle,
    "aria-label": "Zoom out"
  }, /*#__PURE__*/React.createElement(ZoomMinusIcon, null)), /*#__PURE__*/React.createElement("button", {
    onClick: zoomIn,
    style: zoomBtnStyle,
    "aria-label": "Zoom in"
  }, /*#__PURE__*/React.createElement(ZoomPlusIcon, null))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      borderLeft: '1px solid rgba(255,255,255,0.5)',
      padding: '24px 22px',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }
  }, tabBar, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, tabContent)));
}
const Kicker = Kick;
const PrimaryBtn = BtnPrimary;
const GhostBtn = BtnGhost;
Object.assign(window, {
  LandingV2,
  SetupScreen,
  BtnPrimary,
  BtnGhost,
  Kick,
  StepDots,
  ScreenTransition,
  TopBar,
  Kicker,
  PrimaryBtn,
  GhostBtn
});