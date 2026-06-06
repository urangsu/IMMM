// screens-v2.jsx — Redesigned screens per v2 brief

var {
  useState: uS,
  useEffect: uE,
  useRef: uR,
  useMemo: uM
} = React;
function getCreatorMode() {
  if (typeof window === 'undefined') return false;
  var params = new URLSearchParams(window.location.search);
  var isCreatorParam = params.get('creator') === '1' || params.get('creatorMode') === '1';
  var isCreatorStorage = window.localStorage.getItem('immm_creator_mode') === 'true';
  if (isCreatorParam) {
    window.localStorage.setItem('immm_creator_mode', 'true');
    return true;
  }
  if (params.get('creator') === '0' || params.get('creatorMode') === '0') {
    window.localStorage.removeItem('immm_creator_mode');
    return false;
  }
  return isCreatorStorage;
}

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
  var pads = {
    sm: '10px 20px',
    md: '14px 28px',
    lg: '18px 36px'
  };
  var fss = {
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
  var pads = {
    sm: '8px 16px',
    md: '12px 24px',
    lg: '16px 28px'
  };
  var fss = {
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
  var isGrid = layout === 'grid';
  var isPolaroid = layout === 'polaroid';
  var isTrip = layout === 'trip';
  var slots = isPolaroid ? 1 : isGrid ? 4 : isTrip ? 3 : 4;
  var mobile = typeof window !== 'undefined' && window.innerWidth < 768;
  var w = size === 'lg' ? layout === 'polaroid' || layout === 'grid' ? 180 : 120 : layout === 'polaroid' || layout === 'grid' ? mobile ? 56 : 60 : mobile ? 40 : 42;
  var h = size === 'lg' ? layout === 'polaroid' ? 210 : layout === 'grid' ? 180 : 260 : layout === 'polaroid' ? mobile ? 68 : 72 : layout === 'grid' ? mobile ? 56 : 60 : mobile ? 80 : 84;
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
  var [show, setShow] = uS(false);
  uE(() => {
    var t = setTimeout(() => setShow(true), 10);
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
var I18N = {
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
  onFrames,
  onGallery,
  lang = 'ko',
  setLang
}) {
  var WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  var t = I18N[lang] || I18N.ko;
  var toggleLang = () => setLang(l => l === 'ko' ? 'en' : l === 'en' ? 'jp' : 'ko');
  var logoMark = (size = 48) => /*#__PURE__*/React.createElement("svg", {
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
  }, "Gallery"), /*#__PURE__*/React.createElement("button", {
    onClick: onFrames,
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
  }, "Frames"), /*#__PURE__*/React.createElement("button", {
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
var ZoomMinusIcon = () => /*#__PURE__*/React.createElement("svg", {
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
var ZoomPlusIcon = () => /*#__PURE__*/React.createElement("svg", {
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
var zoomBtnStyle = {
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
function formatFrameDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch (_) {
    return String(value);
  }
}
function getCleanSetupSlotCount(layout) {
  if (typeof window !== 'undefined' && typeof window.getLayoutSlotCount === 'function') {
    return window.getLayoutSlotCount(layout);
  }
  return layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
}
function getCleanSetupCaptureCount(layout) {
  if (typeof getShotCountForLayout === 'function') {
    return getShotCountForLayout(layout);
  }
  return getCleanSetupSlotCount(layout);
}
function CleanFrameMiniPreview({
  layout,
  T
}) {
  var isGrid = layout === 'grid';
  var isPolaroid = layout === 'polaroid';
  var isTrip = layout === 'trip';
  var slots = isPolaroid ? 1 : isGrid ? 4 : isTrip ? 3 : 4;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: isGrid || isPolaroid ? 78 : 54,
      height: isPolaroid ? 88 : isGrid ? 78 : 100,
      background: '#fff',
      borderRadius: isPolaroid ? 6 : 4,
      border: `1px solid ${T.line}`,
      boxSizing: 'border-box',
      padding: isPolaroid ? '8px 7px 18px' : isGrid ? 8 : '8px 7px',
      display: 'grid',
      gridTemplateColumns: isGrid ? '1fr 1fr' : '1fr',
      gridTemplateRows: isGrid ? '1fr 1fr' : `repeat(${slots}, 1fr)`,
      gap: isGrid ? 5 : 6,
      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
      position: 'relative'
    }
  }, Array.from({
    length: slots
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderRadius: 2,
      background: T.placeholderFill || '#EFEDEA'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 5,
      height: 5,
      borderRadius: 999,
      background: T.ink
    }
  }));
}
function SetupScreen({
  T,
  go,
  mobile,
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
  tweaks,
  startNewCaptureSession,
  framePreset,
  selectedFramePresetId,
  setSetupStoreTabFocus,
  resetAppliedFramePreset
}) {
  var isCreator = getCreatorMode();
  var WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  var [tab, setTab] = uS(editMode ? 'photos' : 'frame');
  var [selStId, setSelStId] = uS(null);
  var [setupZoom, setSetupZoom] = uS(mobile ? 0.92 : 1.12);
  var fileRef = uR(null);
  var photoFileRefs = [uR(null), uR(null), uR(null), uR(null), uR(null), uR(null)];
  var setupFrameRef = uR(null);
  var setupContainerRef = uR(null);
  var slotCount = getCleanSetupSlotCount(layout);
  var captureCount = getCleanSetupCaptureCount(layout);
  var selectedPresetLayout = framePreset?.layout;
  var setupPreviewPreset = framePreset && selectedFramePresetId && selectedPresetLayout === layout ? framePreset : null;
  var shotsPreview = Array.from({
    length: Math.max(1, slotCount)
  }, () => ({
    filter: filter || 'original',
    dataUrl: null
  }));
  var selectedPreview = Array.from({
    length: Math.max(1, slotCount)
  }, (_, i) => i);
  uE(() => {
    if (!isCreator && tab !== 'frame' && tab !== 'photos') {
      setTab('frame');
    }
  }, [isCreator, tab]);
  uE(() => {
    var fit = () => {
      if (!setupContainerRef.current || !setupFrameRef.current) return;
      var cW = setupContainerRef.current.clientWidth - 32;
      var cH = setupContainerRef.current.clientHeight - 32;
      var fW = setupFrameRef.current.offsetWidth;
      var fH = setupFrameRef.current.offsetHeight;
      if (!fW || !fH) return;
      setSetupZoom(Math.max(0.18, Math.min(mobile ? 0.98 : 1.28, cW / fW, cH / fH)));
    };
    var tid = setTimeout(fit, 40);
    fit();
    var ro = new ResizeObserver(fit);
    if (setupContainerRef.current) ro.observe(setupContainerRef.current);
    if (setupFrameRef.current) ro.observe(setupFrameRef.current);
    return () => {
      clearTimeout(tid);
      ro.disconnect();
    };
  }, [layout, mobile, orientation, selectedFramePresetId]);
  var addPresetSticker = libId => {
    var item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    var sizeNorm = typeof getDefaultStickerSizeNorm === 'function' ? getDefaultStickerSizeNorm(item) : undefined;
    setPreStickers(prev => [...prev, makeSticker('preset', {
      libId
    }, {
      sizeNorm
    })]);
  };
  var addUploadSticker = dataUrl => {
    var img = new Image();
    img.onload = () => {
      setPreStickers(prev => [...prev, makeSticker('upload', {
        dataUrl,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      }, {
        scale: 0.6
      })]);
    };
    img.onerror = () => setPreStickers(prev => [...prev, makeSticker('upload', {
      dataUrl
    }, {
      scale: 0.6
    })]);
    img.src = dataUrl;
  };
  var onStickerFile = e => {
    var f = e.target.files?.[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = () => addUploadSticker(rd.result);
    rd.readAsDataURL(f);
  };
  var onPhotoUpload = async (idx, e) => {
    var files = Array.from(e.target.files || []);
    var _loop = async function () {
      var targetIdx = idx + i;
      if (targetIdx >= captureCount) return 1; // break
      var f = files[i];
      var dataUrl = await new Promise(res => {
        var rd = new FileReader();
        rd.onload = () => res(rd.result);
        rd.readAsDataURL(f);
      });
      setShots(prev => {
        var n = [...prev];
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
    };
    for (var i = 0; i < files.length; i++) {
      if (await _loop()) break;
    }
  };
  var selectBaseLayout = layoutId => {
    setLayout(layoutId, {
      baseOnly: true
    });
    var count = getCleanSetupSlotCount(layoutId);
    setSelected(Array.from({
      length: count
    }, (_, i) => i));
  };
  var goFrames = tabId => {
    if (typeof setSetupStoreTabFocus === 'function') setSetupStoreTabFocus(tabId || 'featured');
    go('frames');
  };
  var zoomIn = () => setSetupZoom(z => Math.min(3, +(z + 0.15).toFixed(2)));
  var zoomOut = () => setSetupZoom(z => Math.max(0.18, +(z - 0.15).toFixed(2)));
  var frameW = layout === 'polaroid' ? 220 : layout === 'grid' ? 240 : layout === 'trip' ? 172 : 160;
  var uploadedCount = editMode ? Array.from({
    length: captureCount
  }, (_, i) => shots?.[i]).filter(s => s?.dataUrl).length : 0;
  var preview = /*#__PURE__*/React.createElement("div", {
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
    height: "auto",
    layout: layout
  }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
    key: `${layout}-${frameColor}-${setupPreviewPreset?.id || 'base'}`,
    layout: layout,
    shots: shotsPreview,
    selected: selectedPreview,
    T: T,
    logo: logo,
    dateText: dateText,
    accent: accent,
    scale: 1,
    orientation: orientation,
    frameColor: frameColor,
    framePreset: setupPreviewPreset
  }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
    layout: layout,
    T: T,
    size: "lg"
  }))));
  var frameTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Choose your frame \xB7 \uD504\uB808\uC784 \uC120\uD0DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 8
    }
  }, [{
    id: 'strip',
    label: '1×4 Strip',
    ko: '스트립'
  }, {
    id: 'trip',
    label: '1×3 Trip',
    ko: '트리플'
  }, {
    id: 'grid',
    label: '2×2 Grid',
    ko: '그리드'
  }, {
    id: 'polaroid',
    label: '1×1 Polaroid',
    ko: '폴라로이드'
  }].map(o => {
    var count = getCleanSetupSlotCount(o.id);
    var selected = layout === o.id && !selectedFramePresetId;
    return /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => selectBaseLayout(o.id),
      style: {
        padding: '14px 8px 10px',
        minHeight: 148,
        background: selected ? T.card : '#FFFFFF',
        border: 'none',
        borderRadius: 16,
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 2px ${T.ink} inset` : `0 0 0 1px ${T.line} inset`,
        display: 'grid',
        gap: 8,
        justifyItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: 106,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none'
      }
    }, /*#__PURE__*/React.createElement(CleanFrameMiniPreview, {
      layout: o.id,
      T: T
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontWeight: 700,
        textAlign: 'center'
      }
    }, o.label, /*#__PURE__*/React.createElement("span", {
      style: {
        color: T.inkSoft,
        fontWeight: 400,
        marginLeft: 4,
        fontFamily: 'Pretendard,system-ui'
      }
    }, o.ko)));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'grid',
      gap: 8
    }
  }, isCreator ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => goFrames('featured'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: 'uppercase'
    }
  }, "\uCD94\uCC9C \uD504\uB808\uC784"), /*#__PURE__*/React.createElement("button", {
    onClick: () => goFrames('my-frames'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: 'uppercase'
    }
  }, "\uB0B4 \uD504\uB808\uC784"), /*#__PURE__*/React.createElement("button", {
    onClick: () => goFrames('featured'),
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 1.2,
      textTransform: 'uppercase'
    }
  }, "\uD504\uB808\uC784 \uC2A4\uD1A0\uC5B4 \uAC00\uAE30")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => goFrames('featured'),
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 1.2,
      textTransform: 'uppercase'
    }
  }, "\uD504\uB808\uC784 \uACE0\uB974\uAE30")), !isCreator && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: T.ink,
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD544\uD130 \uD1A4 \uC120\uD0DD"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 400,
      color: T.inkSoft
    }
  }, "(\uAE30\uBCF8\uAC12: \uD06C\uB9BC \uC2A4\uD0A8)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8
    }
  }, [{
    id: 'porcelain',
    name: '자연광',
    desc: 'Window Light'
  }, {
    id: 'smooth',
    name: '크림 스킨',
    desc: 'Cream Skin'
  }, {
    id: 'bw',
    name: '흑백',
    desc: 'B&W'
  }].map(item => {
    var active = filter === item.id;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => setFilter(item.id),
      style: {
        padding: '8px 4px',
        borderRadius: 12,
        border: 'none',
        background: active ? T.ink : T.card,
        color: active ? T.bg : T.ink,
        cursor: 'pointer',
        boxShadow: active ? `0 0 0 1px ${T.ink}` : `0 0 0 1px ${T.line} inset`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: 52,
        transition: 'all 0.15s ease'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700
      }
    }, item.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 8,
        opacity: active ? 0.8 : 0.6,
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, item.desc));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 10,
      color: T.inkSoft,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("div", null, "\u2022 \uCD2C\uC601 \uACB0\uACFC\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", null, "\u2022 \uC800\uC7A5 \uC804 \uB2E4\uC2DC \uBC14\uAFC0 \uC218 \uC788\uC5B4\uC694."))), setupPreviewPreset && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 12,
      borderRadius: 14,
      background: 'rgba(26,26,31,0.04)',
      color: T.inkSoft,
      fontSize: 11,
      lineHeight: 1.45,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, "\uC801\uC6A9 \uC911: ", setupPreviewPreset.name, ". \uAE30\uBCF8 \uCE74\uB4DC \uC120\uD0DD \uC2DC \uAE30\uBCF8 \uD504\uB808\uC784\uC73C\uB85C \uB3CC\uC544\uAC11\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("button", {
    onClick: () => resetAppliedFramePreset(),
    style: {
      minHeight: 32,
      padding: '0 12px',
      borderRadius: 8,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 10,
      fontWeight: 700,
      alignSelf: 'start',
      cursor: 'pointer'
    }
  }, "\uAE30\uBCF8 \uD504\uB808\uC784\uC73C\uB85C \uCD08\uAE30\uD654")));
  var filterTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Choose a filter \xB7 \uD544\uD130 \uC120\uD0DD"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
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
      boxShadow: filter === k ? `0 0 0 2px ${T.ink}` : '0 0 0 1px rgba(26,26,31,0.08)'
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
  }, v.name)))));
  var stickersTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Stickers \xB7 \uC2A4\uD2F0\uCEE4"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileRef.current?.click(),
    style: {
      padding: '8px 10px',
      minHeight: 44,
      background: T.ink,
      color: T.bg,
      border: 'none',
      borderRadius: 999,
      fontSize: 11,
      cursor: 'pointer',
      fontWeight: 800
    }
  }, "Upload"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: onStickerFile
  })), getStickerPickerPacks().map(([k, pack]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 700,
      textTransform: 'uppercase',
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      marginBottom: 6
    }
  }, pack.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
      gap: 8
    }
  }, pack.items.slice(0, 10).map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => addPresetSticker(it.id),
    style: {
      padding: 10,
      background: T.card,
      border: 'none',
      borderRadius: 12,
      minHeight: 58,
      cursor: 'pointer',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 42,
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden'
    }
  }, renderLibSticker(it, 0.65))))))));
  var photosTab = editMode ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "\uC0AC\uC9C4 \uBD88\uB7EC\uC624\uAE30 \xB7 Upload Photos"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, Array.from({
    length: captureCount
  }, (_, i) => {
    var s = shots?.[i];
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
        display: 'grid',
        placeItems: 'center'
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
        color: T.inkSoft,
        fontSize: 11
      }
    }, "\uCEF7 ", i + 1), /*#__PURE__*/React.createElement("input", {
      ref: photoFileRefs[i],
      type: "file",
      accept: "image/*",
      style: {
        display: 'none'
      },
      onChange: e => onPhotoUpload(i, e)
    }));
  }))) : null;
  var optionsTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Frame options \xB7 \uD504\uB808\uC784 \uC635\uC158"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOrientation && setOrientation(orientation === 'portrait' ? 'landscape' : 'portrait'),
    disabled: layout === 'grid' || layout === 'polaroid',
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: T.softSurface,
      color: T.ink,
      opacity: layout === 'grid' || layout === 'polaroid' ? 0.45 : 1,
      cursor: layout === 'grid' || layout === 'polaroid' ? 'default' : 'pointer'
    }
  }, "\uBC29\uD5A5 \xB7 ", orientation === 'portrait' ? '세로' : '가로'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDateText && setDateText(!dateText),
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: T.softSurface,
      color: T.ink,
      cursor: 'pointer'
    }
  }, "\uB0A0\uC9DC \uD45C\uC2DC \xB7 ", dateText ? 'On' : 'Off'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLogo && setLogo(!logo),
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: T.softSurface,
      color: T.ink,
      cursor: 'pointer'
    }
  }, "\uB85C\uACE0 \uD45C\uC2DC \xB7 ", logo ? 'On' : 'Off'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, ['#ffffff', '#111111', '#F1C0C5', '#A6C8DE', '#E6C8BE', '#A2352B'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setFrameColor && setFrameColor(c),
    style: {
      width: 34,
      height: 34,
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      background: c,
      boxShadow: frameColor === c ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${T.ink}` : 'inset 0 0 0 1px rgba(0,0,0,0.1)'
    }
  })))));
  var tabContent = tab === 'photos' ? photosTab : tab === 'frame' ? frameTab : tab === 'filter' ? filterTab : tab === 'stickers' ? stickersTab : optionsTab;
  var tabs = isCreator ? [...(editMode ? [['photos', '사진']] : []), ['frame', '프레임'], ['filter', '필터'], ['stickers', '스티커'], ['options', '옵션']] : [...(editMode ? [['photos', '사진']] : []), ['frame', '프레임']];
  var tabBar = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      borderBottom: `1px solid ${T.line}`,
      marginBottom: 18
    }
  }, tabs.map(([k, ko]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      flex: 1,
      padding: '14px 6px',
      border: 'none',
      borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
      background: 'transparent',
      color: tab === k ? T.ink : T.inkSoft,
      fontSize: 11,
      fontWeight: 800,
      cursor: 'pointer',
      letterSpacing: 1,
      textTransform: 'uppercase'
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
        onClick: () => editMode ? go('deco') : startNewCaptureSession(),
        disabled: editMode && uploadedCount < captureCount
      }, editMode ? '편집 시작' : isCreator ? 'Next' : '이 프레임으로 촬영하기')
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: '1 1 0',
        minHeight: 0,
        position: 'relative'
      }
    }, preview, isCreator && /*#__PURE__*/React.createElement("div", {
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
        padding: '20px 20px 28px',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        maxHeight: '58%',
        overflow: 'auto'
      }
    }, tabBar, tabContent));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: 'transparent',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 380px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 48px',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    step: 0,
    back: () => go('landing'),
    T: T,
    title: editMode ? '편집하기 · Upload & Edit' : 'Step 1 · Setup the booth',
    right: /*#__PURE__*/React.createElement(BtnPrimary, {
      T: T,
      size: "md",
      onClick: () => editMode ? go('deco') : startNewCaptureSession(),
      disabled: editMode && uploadedCount < captureCount
    }, editMode ? '편집 시작' : isCreator ? 'Continue · 다음' : '이 프레임으로 촬영하기', " ", !editMode && isCreator && I.arrowR(14, T.bg))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      background: T.bgAlt,
      borderRadius: 28,
      display: 'grid',
      placeItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      border: `1px solid ${T.line}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
    }
  }, preview, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      left: 18,
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 1.5
    }
  }, "LIVE PREVIEW"), isCreator && /*#__PURE__*/React.createElement("div", {
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
      background: 'rgba(255,255,255,0.74)',
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
function FrameStoreScreen({
  T,
  go,
  mobile,
  layout,
  frameColor,
  accent,
  framePreset,
  framePresets = [],
  framePackList = [],
  customFrames = [],
  selectedFramePresetId,
  applyFramePreset,
  openDesigner,
  exportCustomFramesAsJson,
  importFramePackFromJson,
  renameCustomFrame,
  duplicateCustomFrame,
  deleteCustomFrame,
  favoriteFramePresetIds = [],
  toggleFavoriteFramePreset,
  favoriteFramePackIds = [],
  toggleFavoriteFramePack,
  unlockedFramePackIds = [],
  unlockFramePackForDev,
  frameLikeIds = [],
  toggleFrameLike,
  recordFrameUse,
  creatorProfiles = [],
  storeTabFocus = ''
}) {
  var isCreator = getCreatorMode();
  var devUnlockVisible = typeof window !== 'undefined' && (window.IMMM_FIELD_TEST === true || window.IMMM_DEBUG_BUILD === true || new URLSearchParams(location.search).get('fieldTest') === '1');
  var frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  var WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  var [storeTab, setStoreTab] = uS(storeTabFocus || 'featured');
  var [storeSearch, setStoreSearch] = uS('');
  var [storeSort, setStoreSort] = uS('recommended');
  var [importJsonText, setImportJsonText] = uS('');
  var [toastMessage, setToastMessage] = uS('');
  var [showImportExportModal, setShowImportExportModal] = uS(false);
  var [selectedPresetId, setSelectedPresetId] = uS(selectedFramePresetId || '');
  var savedFrames = uM(() => (Array.isArray(customFrames) ? customFrames : []).filter(preset => !preset.deletedAt), [customFrames]);
  uE(() => {
    if (!isCreator && storeTab !== 'featured' && storeTab !== 'my-frames') {
      setStoreTab('featured');
    }
  }, [isCreator, storeTab]);
  var allPresets = uM(() => {
    var byId = new Map();
    [...(Array.isArray(framePresets) ? framePresets : []), ...savedFrames].forEach(preset => {
      if (preset?.id && !byId.has(preset.id)) byId.set(preset.id, preset);
    });
    return Array.from(byId.values());
  }, [framePresets, savedFrames]);
  var allPacks = Array.isArray(framePackList) ? framePackList : [];
  var selectedPreset = allPresets.find(preset => preset.id === selectedPresetId) || allPresets.find(preset => preset.id === selectedFramePresetId) || framePreset || allPresets[0] || null;
  var shotsPreview = preset => Array.from({
    length: Math.max(1, preset?.photoSlots?.length || getCleanSetupSlotCount(preset?.layout || layout))
  }, () => ({
    filter: 'original',
    dataUrl: null
  }));
  var previewAspect = preset => {
    var geom = typeof window !== 'undefined' && typeof window.getFrameGeometry === 'function' ? window.getFrameGeometry(preset?.layout || layout) : null;
    var size = preset?.canvasSize || (geom ? {
      width: geom.width,
      height: geom.height
    } : null) || frameApi?.getCanvasSizeForLayout?.(preset?.layout || layout) || {
      width: 560,
      height: 1808
    };
    return `${Math.max(1, Number(size.width) || 560)} / ${Math.max(1, Number(size.height) || 1808)}`;
  };
  var packById = id => frameApi?.getFramePackById?.(id, savedFrames) || allPacks.find(pack => pack.id === id) || null;
  var packUnlocked = pack => Boolean(!pack?.locked || frameApi?.isFramePackUnlocked?.(pack.id) || unlockedFramePackIds.includes(pack.id));
  var visiblePresets = uM(() => {
    var q = storeSearch.trim().toLowerCase();
    var items = allPresets.filter(Boolean);
    if (storeTab === 'free') items = items.filter(preset => (preset.packPriceType || packById(preset.packId)?.priceType || 'free') === 'free');
    if (storeTab === 'premium') items = items.filter(preset => (preset.packPriceType || packById(preset.packId)?.priceType || 'free') === 'premium');
    if (storeTab === 'my-frames') items = items.filter(preset => preset.source === 'custom' || preset.source === 'imported');
    if (storeTab === 'favorites') items = items.filter(preset => favoriteFramePresetIds.includes(preset.id));
    if (storeTab === 'imported') items = items.filter(preset => preset.source === 'imported');
    if (storeTab === 'featured') {
      var featured = new Set(allPacks.filter(pack => pack.featured).flatMap(pack => pack.presetIds || []));
      items = items.filter(preset => featured.has(preset.id) || preset.category === 'basic' || preset.category === 'character');
    }
    if (q) {
      items = items.filter(preset => [preset.name, preset.category, preset.layout, preset.author?.name, preset.packName, ...(preset.packTags || [])].join(' ').toLowerCase().includes(q));
    }
    if (storeSort === 'newest') items = [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    if (storeSort === 'az') items = [...items].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    return items;
  }, [allPacks, allPresets, favoriteFramePresetIds, storeSearch, storeSort, storeTab]);
  var visiblePacks = uM(() => {
    var items = [...allPacks];
    if (storeTab === 'free') items = items.filter(pack => (pack.priceType || 'free') === 'free');
    if (storeTab === 'premium') items = items.filter(pack => (pack.priceType || 'free') === 'premium');
    if (storeTab === 'favorites') items = items.filter(pack => favoriteFramePackIds.includes(pack.id) || (pack.presetIds || []).some(id => favoriteFramePresetIds.includes(id)));
    if (storeTab === 'my-frames' || storeTab === 'imported') items = [];
    if (storeTab === 'featured') items = items.filter(pack => pack.featured).slice(0, 6);
    return items;
  }, [allPacks, favoriteFramePackIds, favoriteFramePresetIds, storeTab]);
  uE(() => {
    if (storeTabFocus) setStoreTab(storeTabFocus);
  }, [storeTabFocus]);
  var applyToBooth = preset => {
    if (!preset) return;
    var pack = preset.packId ? packById(preset.packId) : null;
    if (pack?.locked && !packUnlocked(pack)) {
      setToastMessage('이 프레임 팩은 체험용입니다! 오프라인 부스 전용 테마로, 곧 정식 업데이트를 통해 만나보실 수 있습니다.');
      return;
    }
    var applied = applyFramePreset?.(preset, {
      syncFrameColor: true
    });
    if (applied) {
      recordFrameUse?.(preset.id);
      go('setup');
    }
  };
  uE(() => {
    if (toastMessage) {
      var t = setTimeout(() => setToastMessage(''), 2500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);
  var renderThumb = (preset, height = 150) => /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      aspectRatio: previewAspect(preset),
      maxWidth: '100%',
      margin: '0 auto',
      display: 'grid',
      placeItems: 'center',
      overflow: 'hidden',
      borderRadius: 12,
      background: 'rgba(26,26,31,0.03)'
    }
  }, WFrameThumb && preset ? /*#__PURE__*/React.createElement(WFrameThumb, {
    layout: preset.layout,
    shots: shotsPreview(preset),
    selected: shotsPreview(preset).map((_, i) => i),
    T: T,
    logo: false,
    dateText: false,
    accent: accent || T.pinkDeep,
    scale: 1,
    orientation: "portrait",
    frameColor: frameColor,
    framePreset: preset,
    fill: true
  }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
    layout: preset?.layout || 'strip',
    T: T,
    size: "sm"
  }));
  var tabs = isCreator ? [['featured', '추천'], ['free', '기본'], ['my-frames', '내 프레임'], ['premium', '유료 예정']] : [['featured', '추천'], ['my-frames', '내 프레임']];
  var cardStyle = {
    border: `1px solid ${T.line}`,
    borderRadius: 18,
    background: '#fff',
    padding: 14,
    minWidth: 0,
    display: 'grid',
    gap: 10,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflow: 'auto',
      background: T.bg,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        .frame-store-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .frame-store-card:hover {
          transform: scale(1.015);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastFadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: mobile ? 16 : 28,
      display: 'grid',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      background: T.bg,
      paddingBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('landing'),
    style: {
      minHeight: 44,
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      padding: '0 14px',
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 1,
      textTransform: 'uppercase'
    }
  }, "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.inkSoft,
      letterSpacing: 3,
      fontWeight: 900,
      textTransform: 'uppercase'
    }
  }, "Frame Store"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: mobile ? 22 : 30,
      fontWeight: 900
    }
  }, "Choose or create a frame")), isCreator && /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner?.({
      mode: 'new',
      preset: selectedPreset
    }),
    style: {
      minHeight: 48,
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      padding: '0 18px',
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 1.2,
      textTransform: 'uppercase'
    }
  }, "Create Frame")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1fr) minmax(300px, 380px)',
      gap: 18,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 14,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle,
      position: 'sticky',
      top: mobile ? 72 : 82,
      zIndex: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, tabs.map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => setStoreTab(id),
    style: {
      flex: '0 0 auto',
      minHeight: 44,
      borderRadius: 999,
      border: 'none',
      background: storeTab === id ? T.ink : 'rgba(26,26,31,0.06)',
      color: storeTab === id ? T.bg : T.inkSoft,
      padding: '0 13px',
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: 'uppercase'
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1fr) 150px',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: storeSearch,
    onChange: e => setStoreSearch(e.target.value),
    placeholder: "Search frames, packs, tags",
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: storeSort,
    onChange: e => setStoreSort(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12,
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "recommended"
  }, "Recommended"), /*#__PURE__*/React.createElement("option", {
    value: "newest"
  }, "Newest"), /*#__PURE__*/React.createElement("option", {
    value: "az"
  }, "A-Z")))), /*#__PURE__*/React.createElement("div", {
    key: storeTab,
    style: {
      display: 'grid',
      gap: 14,
      animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }
  }, visiblePacks.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, storeTab === 'premium' ? 'Premium Packs' : storeTab === 'free' ? 'Free Packs' : 'Featured Packs'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 12
    }
  }, visiblePacks.map(pack => {
    var cover = allPresets.find(preset => preset.id === pack.coverPresetId) || allPresets.find(preset => (pack.presetIds || []).includes(preset.id));
    var unlocked = packUnlocked(pack);
    return /*#__PURE__*/React.createElement("div", {
      key: pack.id,
      className: "frame-store-card",
      style: cardStyle
    }, renderThumb(cover, 130), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 900
      }
    }, pack.name), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 11,
        color: T.inkSoft,
        lineHeight: 1.4
      }
    }, pack.description)), /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, unlocked ? pack.priceLabel : 'Locked')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => cover && setSelectedPresetId(cover.id),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.ink,
        padding: '0 14px',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, "Preview"), /*#__PURE__*/React.createElement("button", {
      onClick: () => applyToBooth(cover),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: 'none',
        background: unlocked ? T.ink : 'rgba(26,26,31,0.08)',
        color: unlocked ? T.bg : T.ink,
        padding: '0 14px',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, unlocked ? '이 프레임으로 촬영' : 'Preview only')));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, storeTab === 'my-frames' ? '내 프레임' : '전체 프레임'), !isCreator && storeTab === 'my-frames' && /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner?.({
      mode: 'new',
      preset: selectedPreset
    }),
    style: {
      minHeight: 32,
      borderRadius: 8,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      padding: '0 12px',
      fontSize: 10,
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "\uC0C8 \uD504\uB808\uC784 \uB9CC\uB4E4\uAE30")), visiblePresets.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "frame-store-card",
    style: cardStyle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 900
    }
  }, "\uC800\uC7A5\uB41C \uD504\uB808\uC784\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: T.inkSoft
    }
  }, "\uB098\uB9CC\uC758 \uD504\uB808\uC784\uC744 \uC9C1\uC811 \uB9CC\uB4E4\uACE0 \uC800\uC7A5\uD574 \uBCF4\uC138\uC694."), /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner?.({
      mode: 'new',
      preset: selectedPreset
    }),
    style: {
      minHeight: 44,
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      padding: '0 14px',
      fontSize: 11,
      fontWeight: 900,
      justifySelf: 'start'
    }
  }, "\uC0C8 \uD504\uB808\uC784 \uB9CC\uB4E4\uAE30")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 12
    }
  }, visiblePresets.map(preset => {
    var active = selectedFramePresetId === preset.id;
    var custom = preset.source === 'custom' || preset.source === 'imported';
    return /*#__PURE__*/React.createElement("div", {
      key: preset.id,
      className: "frame-store-card",
      style: {
        ...cardStyle,
        boxShadow: active ? `0 0 0 2px ${T.ink} inset, 0 4px 16px rgba(0,0,0,0.02)` : '0 4px 16px rgba(0,0,0,0.02)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedPresetId(preset.id),
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        width: '100%'
      }
    }, renderThumb(preset, 150)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 900
      }
    }, preset.name), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 11,
        color: T.inkSoft
      }
    }, preset.layout, " \xB7 ", preset.photoSlots?.length || getCleanSetupSlotCount(preset.layout), "\uCEF7"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10,
        color: T.inkSoft
      }
    }, preset.author?.name || 'IMMM Studio', " \xB7 ", preset.license || 'personal')), active && /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, "Active")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        marginTop: 10
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedPresetId(preset.id),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.ink,
        padding: '0 14px',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, "Preview"), /*#__PURE__*/React.createElement("button", {
      onClick: () => applyToBooth(preset),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: 'none',
        background: T.ink,
        color: T.bg,
        padding: '0 14px',
        fontSize: 11,
        fontWeight: 800,
        cursor: 'pointer'
      }
    }, "\uC774 \uD504\uB808\uC784\uC73C\uB85C \uCD2C\uC601"), custom && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 4,
        width: '100%',
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openDesigner?.({
        mode: 'edit',
        preset
      }),
      style: {
        flex: 1,
        minHeight: 32,
        borderRadius: 8,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.ink,
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer'
      }
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      onClick: () => duplicateCustomFrame?.(preset.id),
      style: {
        flex: 1,
        minHeight: 32,
        borderRadius: 8,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.ink,
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer'
      }
    }, "Duplicate"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteCustomFrame?.(preset.id),
      style: {
        flex: 1,
        minHeight: 32,
        borderRadius: 8,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: 'red',
        fontSize: 10,
        fontWeight: 700,
        cursor: 'pointer'
      }
    }, "Delete"))));
  }))), isCreator && (storeTab === 'my-frames' || storeTab === 'imported') && /*#__PURE__*/React.createElement("div", {
    className: "frame-store-card",
    style: {
      ...cardStyle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      background: 'rgba(26,26,31,0.02)',
      border: `1.5px dashed ${T.line}`,
      cursor: 'pointer'
    },
    onClick: () => setShowImportExportModal(true)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      color: T.inkSoft
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "17 8 12 3 7 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 900,
      color: T.ink
    }
  }, "Import / Export Backups"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      marginTop: 4
    }
  }, "\uB0B4 \uD504\uB808\uC784 \uBC31\uC5C5 \uCF54\uB4DC\uB97C \uAC00\uC838\uC624\uAC70\uB098 \uB2E4\uB978 \uACF3\uC73C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("button", {
    style: {
      minHeight: 38,
      padding: '0 18px',
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 0.5,
      cursor: 'pointer'
    }
  }, "\uC5F4\uAE30")))), /*#__PURE__*/React.createElement("aside", {
    className: "frame-store-card",
    style: {
      ...cardStyle,
      position: mobile ? 'static' : 'sticky',
      top: 100
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Preview"), renderThumb(selectedPreset, mobile ? 260 : 360), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 900
    }
  }, selectedPreset?.name || 'Select a frame'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 12,
      color: T.inkSoft,
      lineHeight: 1.5
    }
  }, selectedPreset ? `${selectedPreset.layout} · ${selectedPreset.photoSlots?.length || getCleanSetupSlotCount(selectedPreset.layout)} slots · ${selectedPreset.category || 'frame'}` : 'Pick a frame card to preview.')), /*#__PURE__*/React.createElement("button", {
    disabled: !selectedPreset,
    onClick: () => applyToBooth(selectedPreset),
    style: {
      minHeight: 48,
      borderRadius: 999,
      border: 'none',
      background: selectedPreset ? T.ink : 'rgba(26,26,31,0.08)',
      color: selectedPreset ? T.bg : T.inkSoft,
      padding: '0 16px',
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      cursor: selectedPreset ? 'pointer' : 'default'
    }
  }, "Apply to Booth"), (isCreator || selectedPreset?.source === 'custom' || selectedPreset?.source === 'imported') && /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner?.({
      mode: 'duplicate',
      preset: selectedPreset
    }),
    disabled: !selectedPreset,
    style: {
      minHeight: 44,
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      padding: '0 14px',
      fontSize: 11,
      fontWeight: 900,
      cursor: selectedPreset ? 'pointer' : 'default'
    }
  }, "Duplicate & Edit")))), showImportExportModal && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 10, 12, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 1000,
      padding: 20,
      animation: 'modalFadeIn 0.25s ease forwards'
    },
    onClick: () => setShowImportExportModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 540,
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.15)',
      display: 'grid',
      gap: 16,
      boxSizing: 'border-box',
      animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 900,
      color: T.ink
    }
  }, "Import / Export My Frames"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      marginTop: 4
    }
  }, "\uBC31\uC5C5 \uB370\uC774\uD130\uB97C \uAC00\uC838\uC624\uAC70\uB098 \uD30C\uC77C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowImportExportModal(false),
    style: {
      width: 32,
      height: 32,
      borderRadius: 999,
      border: 'none',
      background: 'rgba(0,0,0,0.05)',
      color: T.ink,
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })))), /*#__PURE__*/React.createElement("textarea", {
    value: importJsonText,
    onChange: e => setImportJsonText(e.target.value),
    placeholder: "\uC5EC\uAE30\uC5D0 \uD504\uB808\uC784 \uBC31\uC5C5 JSON \uCF54\uB4DC\uB97C \uBD99\uC5EC\uB123\uC73C\uC138\uC694...",
    style: {
      width: '100%',
      minHeight: 180,
      resize: 'vertical',
      borderRadius: 14,
      border: `1px solid ${T.line}`,
      padding: 14,
      fontSize: 12,
      fontFamily: 'monospace',
      boxSizing: 'border-box',
      background: 'rgba(255, 255, 255, 0.6)',
      outline: 'none',
      transition: 'border-color 0.2s'
    },
    onFocus: e => e.target.style.borderColor = T.ink,
    onBlur: e => e.target.style.borderColor = T.line
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var raw = exportCustomFramesAsJson?.() || '';
      if (raw) {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(raw).then(() => setToastMessage('내 프레임 JSON 복사 완료!')).catch(() => setToastMessage('복사에 실패했습니다. 직접 복사하세요.'));
        } else {
          setToastMessage('클립보드 API가 지원되지 않습니다.');
        }
        setImportJsonText(raw);
      } else {
        setToastMessage('내보낼 프레임이 없습니다.');
      }
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 900,
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    onMouseEnter: e => e.target.style.opacity = 0.9,
    onMouseLeave: e => e.target.style.opacity = 1
  }, "\uB0B4 \uD504\uB808\uC784 \uBCF5\uC0AC\uD558\uAE30 (Export)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!importJsonText.trim()) {
        setToastMessage('가져올 JSON 데이터가 비어있습니다.');
        return;
      }
      var result = importFramePackFromJson?.(importJsonText) || {
        ok: false,
        error: '가져오기 실패'
      };
      if (result.ok) {
        setToastMessage(`성공적으로 ${result.presets?.length || 0}개의 프레임을 가져왔습니다!`);
        setStoreTab('imported');
        setShowImportExportModal(false);
      } else {
        setToastMessage(result.error || '잘못된 형식의 데이터입니다.');
      }
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 900,
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    onMouseEnter: e => e.target.style.background = 'rgba(0,0,0,0.02)',
    onMouseLeave: e => e.target.style.background = '#fff'
  }, "\uD504\uB808\uC784 \uB4F1\uB85D\uD558\uAE30 (Import)")))), toastMessage && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 30,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(20, 20, 25, 0.9)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      zIndex: 9999,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      animation: 'toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      color: '#007AFF'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "12",
    x2: "8",
    y2: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "4",
    x2: "8.01",
    y2: "4"
  })), toastMessage));
}
function DeprecatedSetupWithEmbeddedStore({
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
  tweaks,
  startNewCaptureSession,
  framePreset,
  framePresets = [],
  framePackList = [],
  customFrames = [],
  selectedFramePresetId,
  applyFramePreset,
  saveCustomFrame,
  exportCustomFramesAsJson,
  importFramePackFromJson,
  openDesigner,
  renameCustomFrame,
  duplicateCustomFrame,
  deleteCustomFrame,
  favoriteFramePresetIds = [],
  toggleFavoriteFramePreset,
  favoriteFramePackIds = [],
  toggleFavoriteFramePack,
  unlockFramePackForDev,
  unlockedFramePackIds = [],
  frameLikeIds = [],
  toggleFrameLike,
  frameUseCounts = {},
  recordFrameUse,
  creatorProfiles = [],
  setCreatorProfiles,
  exportPresetId = 'hd',
  setExportPresetId,
  generateFrameIdea,
  designerDraftRecovery = null,
  clearDesignerDraftRecovery,
  storeTabFocus = ''
}) {
  var WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  var [tab, setTab] = uS(() => editMode ? 'photos' : 'frame'); // photos | frame | filter | companions
  var [frameStoreOpen, setFrameStoreOpen] = uS(true);
  var [frameStoreMode, setFrameStoreMode] = uS('sheet');
  var [storeTab, setStoreTab] = uS('featured');
  var [frameCategory, setFrameCategory] = uS('basic');
  var [activePackId, setActivePackId] = uS(framePackList?.[0]?.id || 'basic-clean-pack');
  var [storeFilter, setStoreFilter] = uS('all');
  var [storeSort, setStoreSort] = uS('recommended');
  var [storeSearch, setStoreSearch] = uS('');
  var [importJsonText, setImportJsonText] = uS('');
  var [storeUpsellPack, setStoreUpsellPack] = uS(null);
  var [importMessage, setImportMessage] = uS('');
  var [selectedCreatorId, setSelectedCreatorId] = uS('');
  var [selStId, setSelStId] = uS(null);
  var [expandedPacks, setExpandedPacks] = uS({});
  var fileRef = uR(null);
  var frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  var savedFrames = uM(() => (Array.isArray(customFrames) ? customFrames : []).filter(preset => !preset.deletedAt), [customFrames]);
  var allStorePresets = uM(() => Array.isArray(framePresets) ? framePresets : [], [framePresets]);
  var allPacks = uM(() => Array.isArray(framePackList) ? framePackList : [], [framePackList]);
  var categoryTabs = uM(() => {
    if (frameApi && typeof frameApi.getFramePresetCategories === 'function') {
      return frameApi.getFramePresetCategories(savedFrames);
    }
    return [{
      id: 'basic',
      label: 'Basic'
    }, {
      id: 'character',
      label: 'Character'
    }, {
      id: 'travel',
      label: 'Travel'
    }, {
      id: 'birthday',
      label: 'Birthday'
    }, {
      id: 'couple',
      label: 'Couple'
    }, {
      id: 'my-frames',
      label: 'My Frames',
      count: savedFrames.length
    }];
  }, [frameApi, savedFrames]);
  var selectedFramePreset = uM(() => {
    if (!selectedFramePresetId) return framePreset || null;
    return allStorePresets.find(preset => preset.id === selectedFramePresetId) || framePreset || null;
  }, [allStorePresets, framePreset, selectedFramePresetId]);
  var layoutMatchedFramePreset = uM(() => {
    var currentLayout = frameApi?.normalizePresetLayout?.(layout) || layout;
    var selectedLayout = selectedFramePreset?.layout ? frameApi?.normalizePresetLayout?.(selectedFramePreset.layout) || selectedFramePreset.layout : '';
    if (selectedFramePreset && selectedLayout === currentLayout) {
      return selectedFramePreset;
    }
    var layoutPreset = allStorePresets.find(preset => {
      var presetLayout = frameApi?.normalizePresetLayout?.(preset.layout) || preset.layout;
      return presetLayout === currentLayout;
    }) || null;
    return layoutPreset || framePreset || selectedFramePreset || null;
  }, [allStorePresets, frameApi, framePreset, layout, selectedFramePreset]);
  var selectedPack = uM(() => allPacks.find(pack => pack.id === activePackId) || allPacks[0] || null, [activePackId, allPacks]);
  var packPresets = uM(() => {
    if (!selectedPack) return [];
    if (frameApi && typeof frameApi.getFramePresetsByPack === 'function') {
      return frameApi.getFramePresetsByPack(selectedPack.id, savedFrames);
    }
    return allStorePresets.filter(preset => preset.packId === selectedPack.id || preset.id === selectedPack.coverPresetId);
  }, [allStorePresets, frameApi, savedFrames, selectedPack]);
  var storePresetSource = uM(() => {
    var collection = [...allStorePresets, ...savedFrames];
    var byId = new Map();
    collection.forEach(preset => {
      if (preset?.id && !byId.has(preset.id)) byId.set(preset.id, preset);
    });
    return Array.from(byId.values());
  }, [allStorePresets, savedFrames]);
  var creatorLookup = uM(() => {
    var map = new Map();
    (Array.isArray(creatorProfiles) ? creatorProfiles : []).forEach(profile => {
      if (profile?.id) map.set(profile.id, profile);
    });
    return map;
  }, [creatorProfiles]);
  var selectedCreatorProfile = uM(() => {
    if (!selectedCreatorId) return null;
    return creatorLookup.get(selectedCreatorId) || null;
  }, [creatorLookup, selectedCreatorId]);
  var getPresetUseCount = uM(() => {
    var counts = frameApi?.getFrameUseCounts?.() || {};
    return preset => Number(counts?.[preset?.id]) || 0;
  }, [frameApi]);
  var getPresetLikeCount = uM(() => {
    var likes = new Set(favoriteFramePresetIds || []);
    return preset => likes.has(preset?.id) ? 1 : 0;
  }, [favoriteFramePresetIds]);
  var getPackTrendingScore = uM(() => {
    return pack => {
      var presets = (pack?.presetIds || []).map(id => storePresetSource.find(preset => preset.id === id) || null).filter(Boolean);
      var likes = presets.reduce((sum, preset) => sum + getPresetLikeCount(preset), 0);
      var uses = presets.reduce((sum, preset) => sum + getPresetUseCount(preset), 0);
      return likes * 3 + uses * 2 + (pack?.featured ? 12 : 0);
    };
  }, [getPresetLikeCount, getPresetUseCount, storePresetSource]);
  var visibleStorePresets = uM(() => {
    var q = storeSearch.trim().toLowerCase();
    var items = storePresetSource.filter(preset => {
      if (!preset) return false;
      if (storeFilter === 'free') return (preset.packPriceType || 'free') === 'free';
      if (storeFilter === 'premium') return (preset.packPriceType || 'free') === 'premium';
      if (storeFilter === 'mine') return preset.source === 'custom';
      if (storeFilter === 'imported') return preset.source === 'imported';
      return true;
    });
    if (storeTab === 'favorites') {
      items = items.filter(preset => favoriteFramePresetIds.includes(preset.id));
    } else if (storeTab === 'my-frames') {
      items = items.filter(preset => preset.source === 'custom' || preset.source === 'imported');
    } else if (storeTab === 'all') {
      items = items.filter(Boolean);
    } else if (storeTab === 'featured') {
      var featuredPackIds = allPacks.filter(pack => pack.featured).map(pack => pack.id);
      items = items.filter(preset => featuredPackIds.includes(preset.packId) || featuredPackIds.includes(frameApi?.getFramePackById?.(preset.packId, savedFrames)?.id));
    }
    if (q) {
      items = items.filter(preset => {
        var pack = preset.packId ? frameApi?.getFramePackById?.(preset.packId, savedFrames) || allPacks.find(item => item.id === preset.packId) || null : null;
        var hay = [preset.name, preset.category, preset.layout, preset.source, preset.author?.name, preset.packName, pack?.name, ...(Array.isArray(preset.packTags) ? preset.packTags : []), ...(Array.isArray(pack?.tags) ? pack.tags : [])].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }
    var sorted = [...items];
    if (storeSort === 'newest') {
      sorted.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    } else if (storeSort === 'az') {
      sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (storeSort === 'most-used') {
      sorted.sort((a, b) => getPresetUseCount(b) - getPresetUseCount(a));
    } else if (storeSort === 'trending') {
      sorted.sort((a, b) => {
        var aScore = (a.trendingScore || 0) + getPresetLikeCount(a) * 2 + getPresetUseCount(a);
        var bScore = (b.trendingScore || 0) + getPresetLikeCount(b) * 2 + getPresetUseCount(b);
        return bScore - aScore;
      });
    } else {
      sorted.sort((a, b) => {
        var aPack = a.packId ? allPacks.find(pack => pack.id === a.packId) : null;
        var bPack = b.packId ? allPacks.find(pack => pack.id === b.packId) : null;
        var aFav = favoriteFramePresetIds.includes(a.id) ? 1 : 0;
        var bFav = favoriteFramePresetIds.includes(b.id) ? 1 : 0;
        var aScore = (aPack?.featured ? 10 : 0) + (aPack?.locked ? 1 : 0) + aFav;
        var bScore = (bPack?.featured ? 10 : 0) + (bPack?.locked ? 1 : 0) + bFav;
        return bScore - aScore;
      });
    }
    return sorted;
  }, [allPacks, favoriteFramePresetIds, frameApi, getPresetLikeCount, getPresetUseCount, savedFrames, storeFilter, storePresetSource, storeSearch, storeSort, storeTab]);
  var visiblePacks = uM(() => {
    var packs = [...allPacks];
    var q = storeSearch.trim().toLowerCase();
    var items = packs;
    if (storeTab === 'featured') {
      items = packs.filter(pack => pack.featured);
    } else if (storeTab === 'favorites') {
      items = packs.filter(pack => pack.presetIds.some(id => favoriteFramePresetIds.includes(id)));
    } else if (storeTab === 'my-frames') {
      items = [];
    } else if (storeTab === 'free') {
      items = packs.filter(pack => (pack.priceType || 'free') === 'free');
    } else if (storeTab === 'premium') {
      items = packs.filter(pack => (pack.priceType || 'free') === 'premium');
    } else if (storeTab === 'imported') {
      items = packs.filter(pack => pack.source === 'imported');
    }
    if (q) {
      items = items.filter(pack => {
        var hay = [pack.name, pack.description, ...(pack.tags || []), pack.category, pack.priceLabel].join(' ').toLowerCase();
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
  var activePackBlocked = Boolean(selectedPack?.locked && !(frameApi?.isFramePackUnlocked?.(selectedPack.id) ?? unlockedFramePackIds.includes(selectedPack?.id)));
  var devUnlockVisible = typeof window !== 'undefined' && (window.IMMM_FIELD_TEST === true || window.IMMM_DEBUG_BUILD === true || new URLSearchParams(location.search).get('fieldTest') === '1');
  var getFramePreviewAspect = (preset, fallbackLayout = layout) => {
    var geom = typeof window !== 'undefined' && typeof window.getFrameGeometry === 'function' ? window.getFrameGeometry(fallbackLayout) : null;
    var size = preset?.canvasSize || (geom ? {
      width: geom.width,
      height: geom.height
    } : null) || frameApi?.getCanvasSizeForLayout?.(fallbackLayout) || {
      width: 560,
      height: 1808
    };
    return `${Math.max(1, Number(size.width) || 560)} / ${Math.max(1, Number(size.height) || 1808)}`;
  };
  var visibleFramePresets = uM(() => {
    if (frameCategory === 'my-frames') return savedFrames;
    return allStorePresets.filter(preset => preset.category === frameCategory && preset.source !== 'custom');
  }, [allStorePresets, frameCategory, savedFrames]);
  var recommendedFramePresets = uM(() => allStorePresets.filter(preset => preset.category === 'basic' || preset.category === 'character').slice(0, 6), [allStorePresets]);
  var selectedPackCoverPreset = selectedPack ? packPresets.find(preset => preset.id === selectedPack.coverPresetId) || packPresets[0] || allStorePresets.find(preset => preset.id === selectedPack.coverPresetId) || null : null;
  var selectedPackIsUnlocked = selectedPack ? Boolean((frameApi?.isFramePackUnlocked?.(selectedPack.id) ?? unlockedFramePackIds.includes(selectedPack.id)) || !selectedPack.locked) : false;
  var packTabs = [{
    id: 'featured',
    label: 'Featured'
  }, {
    id: 'free',
    label: 'Free'
  }, {
    id: 'premium',
    label: 'Premium'
  }, {
    id: 'my-frames',
    label: 'My Frames'
  }, {
    id: 'favorites',
    label: 'Favorites'
  }, {
    id: 'imported',
    label: 'Imported'
  }, {
    id: 'all',
    label: 'All Presets'
  }];
  React.useEffect(() => {
    if (!selectedPack && allPacks.length > 0) {
      setActivePackId(allPacks[0].id);
    }
  }, [allPacks, selectedPack]);
  React.useEffect(() => {
    if (selectedFramePreset?.packId && allPacks.some(pack => pack.id === selectedFramePreset.packId)) {
      setActivePackId(selectedFramePreset.packId);
    }
  }, [allPacks, selectedFramePreset?.packId]);
  React.useEffect(() => {
    if (storeTabFocus && storeTabFocus !== storeTab) {
      setStoreTab(storeTabFocus);
    }
  }, [storeTab, storeTabFocus]);
  var addPreset = libId => {
    var item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    var sizeNorm = typeof getDefaultStickerSizeNorm === 'function' ? getDefaultStickerSizeNorm(item) : undefined;
    setPreStickers(prev => [...prev, makeSticker('preset', {
      libId
    }, {
      sizeNorm
    })]);
  };
  var addUpload = dataUrl => {
    var img = new Image();
    img.onload = () => {
      setPreStickers(prev => [...prev, makeSticker('upload', {
        dataUrl,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      }, {
        scale: 0.6
      })]);
    };
    img.onerror = () => setPreStickers(prev => [...prev, makeSticker('upload', {
      dataUrl
    }, {
      scale: 0.6
    })]);
    img.src = dataUrl;
  };
  var onFile = e => {
    var f = e.target.files?.[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = () => addUpload(rd.result);
    rd.readAsDataURL(f);
  };
  var shotsPreview = Array.from({
    length: 4
  }, () => ({
    filter: 'original',
    dataUrl: null
  }));
  var setupContainerRef = React.useRef(null);
  var setupFrameRef = React.useRef(null);
  var [setupZoom, setSetupZoom] = React.useState(mobile ? 1 : 1.4);
  React.useEffect(() => {
    var fit = () => {
      if (!setupContainerRef.current || !setupFrameRef.current) return;
      var cW = setupContainerRef.current.clientWidth - 32;
      var cH = setupContainerRef.current.clientHeight - 32;
      var fW = setupFrameRef.current.offsetWidth;
      var fH = setupFrameRef.current.offsetHeight;
      if (!fW || !fH) return;
      var maxS = mobile ? 0.92 : 1.4;
      setSetupZoom(Math.max(0.15, Math.min(maxS, cW / fW, cH / fH)));
    };
    // small delay so FrameThumb finishes re-rendering after orientation change
    var tid = setTimeout(fit, 40);
    fit();
    var ro = new ResizeObserver(fit);
    if (setupContainerRef.current) ro.observe(setupContainerRef.current);
    if (setupFrameRef.current) ro.observe(setupFrameRef.current);
    return () => {
      clearTimeout(tid);
      ro.disconnect();
    };
  }, [layout, mobile, orientation]);

  // Preview surface (interactive, shows frame + companion stickers)
  var zoomIn = () => setSetupZoom(z => Math.min(3, +(z + 0.15).toFixed(2)));
  var zoomOut = () => setSetupZoom(z => Math.max(0.15, +(z - 0.15).toFixed(2)));
  var frameW = layout === 'polaroid' ? 200 : orientation === 'landscape' && layout === 'strip' ? 360 : orientation === 'landscape' && layout === 'trip' ? 280 : layout === 'grid' ? 220 : 160;
  var preview = /*#__PURE__*/React.createElement("div", {
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
    height: "auto",
    layout: layout
  }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
    key: `${frameColor}-${layoutMatchedFramePreset?.id || selectedFramePreset?.id || 'base'}`,
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
    frameColor: frameColor,
    framePreset: layoutMatchedFramePreset
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
  var frameTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
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
    var resolveFrameTemplate = layoutId => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
        return window.getFrameTemplateSafe(layoutId);
      }
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
        return window.getFrameTemplate(layoutId);
      }
      return null;
    };
    var tpl = resolveFrameTemplate(o.id);
    var canRenderRealThumb = Boolean(WFrameThumb && tpl);
    var pickerThumbScale = mobile ? 0.235 : 0.28;
    var layoutPreset = layoutMatchedFramePreset?.layout === o.id ? layoutMatchedFramePreset : allStorePresets.find(preset => preset.layout === o.id) || null;
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
      key: `${frameColor}-${o.id}`,
      layout: o.id,
      shots: shotsPreview,
      selected: [0, 1, 2, 3],
      T: T,
      logo: false,
      dateText: false,
      accent: accent,
      scale: 1,
      orientation: "portrait",
      frameColor: frameColor,
      framePreset: layoutPreset
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
      background: frameStoreMode === 'full' ? 'rgba(252,252,250,0.96)' : T.softSurface,
      border: `1px solid ${T.line}`,
      boxShadow: frameStoreMode === 'full' ? '0 24px 80px rgba(0,0,0,0.18)' : 'none',
      position: frameStoreMode === 'full' ? 'fixed' : 'relative',
      inset: frameStoreMode === 'full' ? mobile ? 12 : 18 : 'auto',
      zIndex: frameStoreMode === 'full' ? 40 : 'auto',
      overflowY: 'auto',
      maxHeight: frameStoreMode === 'full' ? 'calc(100vh - 24px)' : mobile ? '72vh' : '76vh'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      position: frameStoreMode === 'full' ? 'sticky' : 'relative',
      top: frameStoreMode === 'full' ? 0 : 'auto',
      zIndex: 2,
      background: frameStoreMode === 'full' ? 'rgba(252,252,250,0.96)' : 'transparent',
      paddingBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Frame Store"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, layoutMatchedFramePreset ? `${layoutMatchedFramePreset.name} · ${layoutMatchedFramePreset.layout} · ${layoutMatchedFramePreset.photoSlots?.length || 0}컷` : 'Pick, save, rename, and reuse frame presets.')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner && openDesigner({
      mode: 'new',
      preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null
    }),
    style: {
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
    }
  }, "Create Frame"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFrameStoreMode(v => v === 'full' ? 'sheet' : 'full'),
    style: {
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
    }
  }, frameStoreMode === 'full' ? 'Shrink' : 'Expand'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFrameStoreOpen(v => !v),
    style: {
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
    }
  }, frameStoreOpen ? 'Close' : 'Open'))), frameStoreOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 14,
      borderRadius: 18,
      background: '#FFFFFF',
      border: `1px solid ${T.line}`,
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: mobile ? 'column' : 'row',
      gap: 10,
      alignItems: mobile ? 'stretch' : 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Frame Store"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Packs, presets, favorites, and imports in one place.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, allPacks.length, " packs"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, savedFrames.length, " my frames"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, favoriteFramePresetIds.length, " favorites"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.1fr) minmax(260px, 0.9fr)',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: 'rgba(26,26,31,0.015)',
      padding: 12,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, packTabs.map(tabItem => /*#__PURE__*/React.createElement("button", {
    key: tabItem.id,
    onClick: () => setStoreTab(tabItem.id),
    style: {
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
      flex: '0 0 auto'
    }
  }, tabItem.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 120px',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: storeSearch,
    onChange: e => setStoreSearch(e.target.value),
    placeholder: "Search packs, presets, tags",
    style: {
      minHeight: 44,
      padding: '0 12px',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      color: T.ink,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: storeFilter,
    onChange: e => setStoreFilter(e.target.value),
    style: {
      minHeight: 44,
      padding: '0 12px',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      color: T.ink,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All"), /*#__PURE__*/React.createElement("option", {
    value: "free"
  }, "Free"), /*#__PURE__*/React.createElement("option", {
    value: "premium"
  }, "Premium"), /*#__PURE__*/React.createElement("option", {
    value: "mine"
  }, "Mine"), /*#__PURE__*/React.createElement("option", {
    value: "imported"
  }, "Imported")), /*#__PURE__*/React.createElement("select", {
    value: storeSort,
    onChange: e => setStoreSort(e.target.value),
    style: {
      minHeight: 44,
      padding: '0 12px',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      color: T.ink,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "recommended"
  }, "Recommended"), /*#__PURE__*/React.createElement("option", {
    value: "trending"
  }, "Trending"), /*#__PURE__*/React.createElement("option", {
    value: "most-used"
  }, "Most Used"), /*#__PURE__*/React.createElement("option", {
    value: "newest"
  }, "Newest"), /*#__PURE__*/React.createElement("option", {
    value: "az"
  }, "A-Z"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Featured Packs"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, visiblePacks.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
      gap: 8
    }
  }, visiblePacks.slice(0, 4).map(pack => {
    var packUnlocked = Boolean((frameApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)) || !pack.locked);
    var coverPreset = allStorePresets.find(preset => preset.id === pack.coverPresetId) || packPresets[0] || null;
    return /*#__PURE__*/React.createElement("div", {
      key: pack.id,
      style: {
        borderRadius: 16,
        border: `1px solid ${pack.id === selectedPack?.id ? T.ink : T.line}`,
        background: pack.id === selectedPack?.id ? T.card : '#FFFFFF',
        padding: 12,
        display: 'grid',
        gap: 10,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setActivePackId(pack.id);
        setStoreTab(pack.priceType === 'premium' ? 'premium' : 'featured');
        setFrameStoreMode('full');
      },
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 900,
        color: T.ink,
        fontFamily: 'Pretendard,system-ui'
      }
    }, pack.name), /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, pack.priceLabel)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10.5,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, pack.description), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, pack.presetIds.length, " presets \xB7 ", pack.category), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, pack.author?.name || 'IMMM Studio', " \xB7 ", pack.license || 'internal', " \xB7 Trend ", Math.round(getPackTrendingScore(pack))), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '10px auto 0',
        height: 128,
        aspectRatio: getFramePreviewAspect(coverPreset, coverPreset?.layout || 'strip'),
        maxWidth: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden'
      }
    }, WFrameThumb && coverPreset ? /*#__PURE__*/React.createElement(WFrameThumb, {
      key: `${pack.id}-${coverPreset.id}`,
      layout: coverPreset.layout,
      shots: shotsPreview,
      selected: [0, 1, 2, 3],
      T: T,
      logo: false,
      dateText: false,
      accent: accent,
      scale: 0.82,
      orientation: "portrait",
      frameColor: frameColor,
      framePreset: coverPreset,
      fill: true
    }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
      layout: coverPreset?.layout || 'strip',
      T: T,
      size: "sm"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setActivePackId(pack.id);
        if (!packUnlocked && pack.locked) {
          setStoreUpsellPack(pack);
          return;
        }
        if (coverPreset) {
          applyFramePreset && applyFramePreset(coverPreset);
        }
      },
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, packUnlocked ? 'View Pack' : 'Preview only'), !packUnlocked && /*#__PURE__*/React.createElement("button", {
      onClick: () => setStoreUpsellPack(pack),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Unlock coming soon"), /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleFavoriteFramePack && toggleFavoriteFramePack(pack.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, favoriteFramePackIds.includes(pack.id) ? 'Pack Fav' : 'Fav Pack'), devUnlockVisible && pack.locked && !packUnlocked && /*#__PURE__*/React.createElement("button", {
      onClick: () => unlockFramePackForDev && unlockFramePackForDev(pack.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Unlock for Dev")));
  }))), selectedPack && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      borderRadius: 16,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      padding: 12,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, selectedPack.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, selectedPack.description)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedPack.priceLabel), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedPack.presetIds.length, " presets"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedPackIsUnlocked ? 'Unlocked' : 'Locked'))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Author: ", selectedPack.author?.name || 'IMMM Studio', " \xB7 License: ", selectedPack.license || 'internal'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (!selectedPackCoverPreset) return;
      if (!selectedPackIsUnlocked && selectedPack.locked) {
        setStoreUpsellPack(selectedPack);
        return;
      }
      applyFramePreset && applyFramePreset(selectedPackCoverPreset);
    },
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, selectedPackIsUnlocked ? 'Apply pack preset' : 'Preview only'), !selectedPackIsUnlocked && /*#__PURE__*/React.createElement("button", {
    onClick: () => setStoreUpsellPack(selectedPack),
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Unlock coming soon")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(4, minmax(0, 1fr))',
      gap: 8
    }
  }, packPresets.map(preset => /*#__PURE__*/React.createElement("button", {
    key: preset.id,
    onClick: () => applyFramePreset && applyFramePreset(preset),
    style: {
      border: `1px solid ${selectedFramePresetId === preset.id ? T.ink : T.line}`,
      borderRadius: 14,
      background: selectedFramePresetId === preset.id ? T.card : '#FFFFFF',
      padding: 10,
      minHeight: 44,
      cursor: 'pointer',
      display: 'grid',
      gap: 8,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, preset.name), favoriteFramePresetIds.includes(preset.id) && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, "Fav")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, preset.layout, " \xB7 ", preset.photoSlots.length, "\uCEF7"))))), storeUpsellPack && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 16,
      border: `1px solid ${T.line}`,
      background: 'rgba(26,26,31,0.02)',
      padding: 12,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "This frame pack is premium"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Unlock coming soon. You can preview the pack, but applying is blocked until it is unlocked."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStoreUpsellPack(null),
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Preview only"), devUnlockVisible && storeUpsellPack.locked && /*#__PURE__*/React.createElement("button", {
    onClick: () => unlockFramePackForDev && unlockFramePackForDev(storeUpsellPack.id),
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Unlock for Dev"))), selectedCreatorProfile && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 16,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      padding: 12,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, selectedCreatorProfile.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, selectedCreatorProfile.handle || '@immm', " \xB7 ", selectedCreatorProfile.bio || 'Creator profile')), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedCreatorId(''),
    style: {
      minHeight: 38,
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      padding: '0 10px',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Close")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedCreatorProfile.verified ? 'Verified' : 'Creator'), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedCreatorProfile.packsCreated || 0, " packs"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedCreatorProfile.likes || 0, " likes")))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#FFFFFF',
      padding: 12,
      display: 'grid',
      gap: 10,
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "My Frames"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Save, rename, duplicate, soft delete, export, and import.")), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, savedFrames.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: importJsonText,
    onChange: e => setImportJsonText(e.target.value),
    placeholder: "Paste frame pack JSON here",
    style: {
      width: '100%',
      minHeight: 120,
      resize: 'vertical',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: 12,
      fontSize: 12,
      fontFamily: 'monospace',
      color: T.ink,
      background: '#FFFFFF'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var raw = exportCustomFramesAsJson ? exportCustomFramesAsJson() : '';
      if (!raw) return;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(raw).catch(() => {});
      }
      setImportMessage('Exported current frames as JSON.');
    },
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Export My Frames as JSON"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var result = importFramePackFromJson ? importFramePackFromJson(importJsonText) : {
        ok: false,
        error: 'Import unavailable'
      };
      if (result?.ok) setStoreTab('imported');
      setImportMessage(result.ok ? `Imported ${result.presets?.length || 0} frames.` : result.error || 'Import failed');
    },
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Import Frame Pack JSON")), importMessage && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, importMessage)), savedFrames.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 14,
      background: 'rgba(26,26,31,0.04)',
      border: `1px dashed ${T.line}`,
      color: T.inkSoft,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "No saved frames yet. Save a decorated setup or deco state to build your library.", openDesigner && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner({
      mode: 'new',
      preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null
    }),
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Create your first frame")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(220px, 0.9fr) minmax(0, 1.1fr)',
      gap: 12,
      alignItems: 'stretch',
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 18,
      background: '#FFFFFF',
      border: `1px solid ${T.line}`,
      padding: 14,
      minHeight: 250,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, layoutMatchedFramePreset?.name || selectedFramePreset?.name || 'Selected preset'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, layoutMatchedFramePreset ? `${layoutMatchedFramePreset.layout} · ${layoutMatchedFramePreset.photoSlots?.length || 0}컷 · ${layoutMatchedFramePreset.category}` : 'No preset selected')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, layoutMatchedFramePreset && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, layoutMatchedFramePreset.source === 'custom' ? 'My Frame' : 'Preset'), selectedFramePresetId && selectedFramePresetId === selectedFramePreset?.id && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T
  }, "Active"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      height: 220,
      aspectRatio: getFramePreviewAspect(layoutMatchedFramePreset, layoutMatchedFramePreset?.layout || layout),
      maxWidth: '100%',
      margin: '0 auto',
      background: 'rgba(26,26,31,0.02)',
      borderRadius: 16,
      overflow: 'hidden'
    }
  }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
    key: `${layoutMatchedFramePreset?.id || selectedFramePreset?.id || layout}-${layoutMatchedFramePreset?.updatedAt || selectedFramePreset?.updatedAt || 'selected'}`,
    layout: layoutMatchedFramePreset?.layout || layout,
    shots: shotsPreview,
    selected: [0, 1, 2, 3],
    T: T,
    logo: false,
    dateText: false,
    accent: accent,
    scale: mobile ? 0.96 : 1.08,
    orientation: "portrait",
    frameColor: frameColor,
    framePreset: layoutMatchedFramePreset,
    fill: true
  }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
    layout: layoutMatchedFramePreset?.layout || layout,
    T: T,
    size: "lg"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => layoutMatchedFramePreset && applyFramePreset && applyFramePreset(layoutMatchedFramePreset),
    disabled: !layoutMatchedFramePreset,
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Apply preset"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10,
      alignContent: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      paddingBottom: 2
    }
  }, categoryTabs.map(tabItem => /*#__PURE__*/React.createElement("button", {
    key: tabItem.id,
    onClick: () => setFrameCategory(tabItem.id),
    style: {
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
      flex: '0 0 auto'
    }
  }, tabItem.label, typeof tabItem.count === 'number' ? ` ${tabItem.count}` : ''))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      background: '#FFFFFF',
      border: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Recommended"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Built-in frames for quick starts.")), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, recommendedFramePresets.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
      gap: 8
    }
  }, recommendedFramePresets.map(preset => {
    var isSelected = selectedFramePresetId === preset.id;
    return /*#__PURE__*/React.createElement("div", {
      key: preset.id,
      style: {
        borderRadius: 16,
        border: `1px solid ${isSelected ? T.ink : T.line}`,
        background: isSelected ? T.card : '#FFFFFF',
        boxShadow: isSelected ? `0 0 0 2px ${T.ink} inset` : 'none',
        padding: 12,
        display: 'grid',
        gap: 10,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => applyFramePreset && applyFramePreset(preset),
      style: {
        border: 'none',
        background: 'transparent',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 900,
        color: T.ink,
        fontFamily: 'Pretendard,system-ui'
      }
    }, preset.name), isSelected && /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, "Active")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10.5,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, preset.layout, " \xB7 ", preset.photoSlots.length, "\uCEF7"), /*#__PURE__*/React.createElement("div", {
      style: {
        margin: '8px auto 0',
        height: 126,
        aspectRatio: getFramePreviewAspect(preset, preset.layout),
        maxWidth: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden'
      }
    }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
      key: `${preset.id}-${preset.updatedAt || 'builtin'}`,
      layout: preset.layout,
      shots: shotsPreview,
      selected: [0, 1, 2, 3],
      T: T,
      logo: false,
      dateText: false,
      accent: accent,
      scale: 0.84,
      orientation: "portrait",
      frameColor: frameColor,
      framePreset: preset,
      fill: true
    }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
      layout: preset.layout,
      T: T,
      size: "sm"
    }))), /*#__PURE__*/React.createElement("button", {
      onClick: () => applyFramePreset && applyFramePreset(preset),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Apply"));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      background: '#FFFFFF',
      border: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "My Frames"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Saved setups, renamed, duplicated, and soft-deleted.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, savedFrames.length), saveCustomFrame && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var suggested = layoutMatchedFramePreset?.name ? `${layoutMatchedFramePreset.name} Copy` : selectedFramePreset?.name ? `${selectedFramePreset.name} Copy` : 'My Frame';
      var name = window.prompt('Save frame as', suggested);
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
        canvasSize: framePreset?.canvasSize
      });
      setFrameCategory('my-frames');
      setStoreTab('my-frames');
      setFrameStoreOpen(true);
      setFrameStoreMode('full');
    },
    style: {
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
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Save current setup"))), frameCategory === 'my-frames' && savedFrames.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      background: 'rgba(26,26,31,0.04)',
      border: `1px dashed ${T.line}`,
      color: T.inkSoft,
      fontSize: 12,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "No saved frames yet. Save a decorated setup or deco state to build your library.", openDesigner && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner({
      mode: 'new',
      preset: layoutMatchedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: 1,
      textTransform: 'uppercase'
    }
  }, "Create your first frame"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      display: 'grid',
      gap: 10
    }
  }, visibleFramePresets.map(preset => {
    var isSelected = selectedFramePresetId === preset.id;
    var isCustom = preset.source === 'custom';
    return /*#__PURE__*/React.createElement("div", {
      key: preset.id,
      style: {
        border: `1px solid ${isSelected ? T.ink : T.line}`,
        borderRadius: 16,
        background: isSelected ? T.card : '#FFFFFF',
        boxShadow: isSelected ? `0 0 0 2px ${T.ink} inset` : 'none',
        padding: 12,
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr' : 'minmax(96px, 120px) 1fr',
        gap: 12,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => applyFramePreset && applyFramePreset(preset),
      style: {
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
        overflow: 'hidden'
      }
    }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
      key: `${preset.id}-${preset.updatedAt || 'thumb'}`,
      layout: preset.layout,
      shots: shotsPreview,
      selected: [0, 1, 2, 3],
      T: T,
      logo: false,
      dateText: false,
      accent: accent,
      scale: 0.7,
      orientation: "portrait",
      frameColor: frameColor,
      framePreset: preset,
      fill: true
    }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
      layout: preset.layout,
      T: T,
      size: "sm"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        display: 'grid',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 900,
        color: T.ink,
        fontFamily: 'Pretendard,system-ui'
      }
    }, preset.name), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 10.5,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, preset.layout, " \xB7 ", preset.photoSlots.length, "\uCEF7 \xB7 ", preset.category), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 10,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, preset.author?.name || preset.creator?.name || 'IMMM Studio', " \xB7 ", preset.license || 'internal')), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-end'
      }
    }, isSelected && /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, "Active"), preset.source === 'imported' && /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, "Imported"), /*#__PURE__*/React.createElement(StoreBadge, {
      T: T,
      tone: "light"
    }, "Trend ", Math.round((preset.trendingScore || 0) + getPresetLikeCount(preset) * 2 + getPresetUseCount(preset))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, isCustom ? `Saved ${formatFrameDate(preset.createdAt || preset.updatedAt)}` : 'Built-in'))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => applyFramePreset && applyFramePreset(preset),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Apply"), /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleFavoriteFramePreset && toggleFavoriteFramePreset(preset.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, favoriteFramePresetIds.includes(preset.id) ? 'Favorited' : 'Favorite'), /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleFrameLike && toggleFrameLike(preset.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, frameLikeIds.includes(preset.id) ? 'Liked' : 'Like'), /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedCreatorId(preset.creatorId || preset.author?.id || ''),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "View Creator"), isCustom && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      onClick: () => openDesigner && openDesigner({
        mode: 'edit',
        preset
      }),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      onClick: () => openDesigner && openDesigner({
        mode: 'duplicate',
        preset
      }),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Duplicate & Edit"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        var next = window.prompt('Rename frame', preset.name || 'My Frame');
        if (!next || !next.trim()) return;
        renameCustomFrame && renameCustomFrame(preset.id, next.trim());
      },
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Rename"), /*#__PURE__*/React.createElement("button", {
      onClick: () => duplicateCustomFrame && duplicateCustomFrame(preset.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Duplicate"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteCustomFrame && deleteCustomFrame(preset.id),
      style: {
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
        fontFamily: '"Plus Jakarta Sans",system-ui'
      }
    }, "Delete")))));
  }))))))), /*#__PURE__*/React.createElement("div", {
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
  var filterTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
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
  var companionsTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  var photoFileRefs = [uR(null), uR(null), uR(null), uR(null)];
  var maxUploadCount = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(layout) : layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
  var onPhotoUpload = async (idx, e) => {
    var files = Array.from(e.target.files || []);
    if (!files.length) return;
    var _loop2 = async function () {
      var targetIdx = idx + i;
      if (targetIdx >= maxUploadCount) return 1; // break
      var f = files[i];
      var dataUrl = await new Promise(res => {
        var rd = new FileReader();
        rd.onload = () => res(rd.result);
        rd.readAsDataURL(f);
      });
      setShots(prev => {
        var n = [...prev];
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
    };
    for (var i = 0; i < files.length; i++) {
      if (await _loop2()) break;
    }
  };
  var photosTab = editMode ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "\uC0AC\uC9C4 \uBD88\uB7EC\uC624\uAE30 \xB7 Upload Photos"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 8
    }
  }, [0, 1, 2, 3].map(i => {
    var s = shots?.[i];
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
  var uploadedCount = editMode ? [0, 1, 2, 3].filter(i => shots?.[i]?.dataUrl).length : 0;
  var tabContent = tab === 'photos' ? photosTab : tab === 'frame' ? frameTab : tab === 'filter' ? filterTab : companionsTab;
  var tabBar = /*#__PURE__*/React.createElement("div", {
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
        onClick: () => editMode ? go('deco') : startNewCaptureSession(),
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
      onClick: () => editMode ? go('deco') : startNewCaptureSession(),
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
function getDesignerPreviewMetrics(containerRect, canvasSize) {
  var canvasW = Number(canvasSize?.width) || 560;
  var canvasH = Number(canvasSize?.height) || 1808;
  var maxW = Math.max(1, Number(containerRect?.width) || 1);
  var maxH = Math.max(1, Number(containerRect?.height) || 1);
  var scale = Math.max(0.001, Math.min(maxW / canvasW, maxH / canvasH));
  var width = Math.round(canvasW * scale);
  var height = Math.round(canvasH * scale);
  return {
    canvasW,
    canvasH,
    scale,
    width,
    height,
    offsetX: Math.round((maxW - width) / 2),
    offsetY: Math.round((maxH - height) / 2)
  };
}
function canvasRectToPreviewRect(rect, metrics) {
  return {
    left: metrics.offsetX + Number(rect?.x || 0) * metrics.scale,
    top: metrics.offsetY + Number(rect?.y || 0) * metrics.scale,
    width: Number(rect?.width || 0) * metrics.scale,
    height: Number(rect?.height || 0) * metrics.scale
  };
}
function clientPointToCanvasPoint(event, previewEl, metrics) {
  if (!previewEl || !metrics) return {
    x: 0,
    y: 0
  };
  var point = event && typeof event.clientX === 'number' ? {
    clientX: event.clientX,
    clientY: event.clientY
  } : (() => {
    var touch = event?.touches?.[0] || event?.changedTouches?.[0];
    return touch ? {
      clientX: touch.clientX,
      clientY: touch.clientY
    } : {
      clientX: 0,
      clientY: 0
    };
  })();
  var box = previewEl.getBoundingClientRect();
  return {
    x: (point.clientX - box.left - metrics.offsetX) / metrics.scale,
    y: (point.clientY - box.top - metrics.offsetY) / metrics.scale
  };
}
function DesignerPreviewCanvas({
  draft,
  T,
  previewShots,
  selectedSlotIndex,
  selectedDecorationIndex,
  startDrag,
  activeGuides,
  showGuides,
  gridEnabled,
  useTouchFallback
}) {
  var viewportRef = uR(null);
  var canvasRef = uR(null);
  var [metrics, setMetrics] = uS(null);
  var canvasSize = draft?.canvasSize || {
    width: 560,
    height: 1808
  };
  uE(() => {
    var update = () => {
      if (!viewportRef.current || !canvasSize) return;
      setMetrics(getDesignerPreviewMetrics(viewportRef.current.getBoundingClientRect(), canvasSize));
    };
    update();
    var ro = new ResizeObserver(update);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [canvasSize.width, canvasSize.height]);
  uE(() => {
    var cancelled = false;
    var draw = async () => {
      if (!canvasRef.current || !draft || !metrics) return;
      var canvas = canvasRef.current;
      canvas.width = Math.max(1, Math.round(canvasSize.width));
      canvas.height = Math.max(1, Math.round(canvasSize.height));
      var ctx = canvas.getContext('2d');
      var renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (!renderComp || !ctx) return;
      await renderComp(ctx, {
        layout: draft.layout,
        shots: previewShots,
        selected: previewShots.map((_, i) => i),
        frameColor: draft.frameColor,
        logo: false,
        dateText: false,
        accent: T.pinkDeep,
        framePreset: draft
      }, {
        scale: 1,
        skipAssetValidation: true
      });
      if (cancelled) return;
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, [draft, previewShots, metrics, canvasSize.width, canvasSize.height, T.pinkDeep]);
  var shellStyle = metrics ? {
    position: 'absolute',
    left: metrics.offsetX,
    top: metrics.offsetY,
    width: metrics.width,
    height: metrics.height
  } : {};
  var shellMetrics = metrics ? {
    ...metrics,
    offsetX: 0,
    offsetY: 0
  } : null;
  return /*#__PURE__*/React.createElement("div", {
    ref: viewportRef,
    style: {
      position: 'relative',
      width: '100%',
      height: 'min(72vh, 760px)',
      minHeight: 420,
      borderRadius: 18,
      overflow: 'hidden',
      border: `1px solid ${T.line}`,
      background: '#F8F8F5',
      touchAction: 'none'
    }
  }, metrics && /*#__PURE__*/React.createElement("div", {
    style: shellStyle
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      width: '100%',
      height: '100%',
      display: 'block'
    }
  }), gridEnabled && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage: 'linear-gradient(rgba(130,92,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(130,92,255,0.08) 1px, transparent 1px)',
      backgroundSize: '20% 20%',
      zIndex: 1
    }
  }), (draft.photoSlots || []).map((slot, index) => {
    var active = selectedSlotIndex === index;
    var r = canvasRectToPreviewRect(slot, shellMetrics);
    return /*#__PURE__*/React.createElement("div", {
      key: `slot-${index}`,
      onPointerDown: useTouchFallback ? undefined : startDrag('slot', index, 'move', metrics, viewportRef),
      onTouchStart: useTouchFallback ? startDrag('slot', index, 'move', metrics, viewportRef) : undefined,
      style: {
        position: 'absolute',
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        borderRadius: Math.max(4, Number(slot.radius || 0) * metrics.scale),
        boxSizing: 'border-box',
        border: active ? `1.5px solid #007AFF` : `1px dashed rgba(26,26,31,0.25)`,
        background: 'transparent',
        cursor: 'move',
        touchAction: 'none',
        zIndex: 4,
        boxShadow: active ? '0 0 0 3px rgba(0, 122, 255, 0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 6,
        left: 6,
        padding: '2px 6px',
        borderRadius: 999,
        background: active ? '#007AFF' : 'rgba(26,26,31,0.45)',
        color: '#fff',
        fontSize: 8,
        fontWeight: 800,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        pointerEvents: 'none'
      }
    }, index + 1), active && /*#__PURE__*/React.createElement("div", {
      onPointerDown: useTouchFallback ? undefined : startDrag('slot', index, 'resize', metrics, viewportRef),
      onTouchStart: useTouchFallback ? startDrag('slot', index, 'resize', metrics, viewportRef) : undefined,
      style: {
        position: 'absolute',
        right: -6,
        bottom: -6,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#fff',
        border: '1.5px solid #007AFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        cursor: 'nwse-resize',
        touchAction: 'none',
        zIndex: 10
      }
    }));
  }), (draft.decorations || []).map((deco, index) => {
    var active = selectedDecorationIndex === index;
    var rect = {
      x: deco.x || 0,
      y: deco.y || 0,
      width: deco.width || 80,
      height: deco.height || 80
    };
    var r = canvasRectToPreviewRect(rect, shellMetrics);
    return /*#__PURE__*/React.createElement("div", {
      key: deco.id || index,
      onPointerDown: useTouchFallback ? undefined : startDrag('decor', index, 'move', metrics, viewportRef),
      onTouchStart: useTouchFallback ? startDrag('decor', index, 'move', metrics, viewportRef) : undefined,
      style: {
        position: 'absolute',
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        border: active ? `1.5px solid #825CFF` : `1px dashed rgba(26,26,31,0.18)`,
        background: 'transparent',
        borderRadius: deco.shape === 'circle' ? 999 : 10,
        display: 'grid',
        placeItems: 'center',
        cursor: 'move',
        boxSizing: 'border-box',
        opacity: deco.opacity ?? 1,
        transform: `rotate(${deco.rotation || 0}deg)`,
        touchAction: 'none',
        zIndex: 5,
        boxShadow: active ? '0 0 0 3px rgba(130, 92, 255, 0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: deco.type === 'text' ? 12 : 10,
        fontWeight: 800,
        color: deco.fill || T.ink,
        textAlign: 'center',
        padding: 4
      }
    }, deco.type === 'text' ? deco.text || 'TEXT' : deco.shape || 'shape'), active && /*#__PURE__*/React.createElement("div", {
      onPointerDown: useTouchFallback ? undefined : startDrag('decor', index, 'resize', metrics, viewportRef),
      onTouchStart: useTouchFallback ? startDrag('decor', index, 'resize', metrics, viewportRef) : undefined,
      style: {
        position: 'absolute',
        right: -6,
        bottom: -6,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#fff',
        border: '1.5px solid #825CFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
        cursor: 'nwse-resize',
        touchAction: 'none',
        zIndex: 10
      }
    }));
  }), showGuides && (activeGuides || []).map((guide, index) => /*#__PURE__*/React.createElement("div", {
    key: `${guide.axis}-${guide.kind}-${index}`,
    style: {
      position: 'absolute',
      pointerEvents: 'none',
      background: 'rgba(130, 92, 255, 0.8)',
      zIndex: 7,
      ...(guide.axis === 'v' ? {
        top: 0,
        bottom: 0,
        left: guide.value * metrics.scale,
        width: 2,
        transform: 'translateX(-1px)'
      } : {
        left: 0,
        right: 0,
        top: guide.value * metrics.scale,
        height: 2,
        transform: 'translateY(-1px)'
      })
    }
  }))));
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
  setExportPresetId
}) {
  var isCreator = getCreatorMode();
  var frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  var useTouchFallback = typeof window !== 'undefined' && (!('PointerEvent' in window) || typeof navigator !== 'undefined' && /SamsungBrowser/i.test(navigator.userAgent || ''));
  var previewRef = uR(null);
  var dragRef = uR(null);
  var [activeTab, setActiveTab] = uS('layout');
  var [selectedSlotIndex, setSelectedSlotIndex] = uS(0);
  var [selectedDecorationIndex, setSelectedDecorationIndex] = uS(0);
  var [activeGuides, setActiveGuides] = uS([]);
  var [statusMessage, setStatusMessage] = uS('');
  var [validationError, setValidationError] = uS('');
  var [exportPackName, setExportPackName] = uS(draftFrame?.name || 'Designer Pack Draft');
  var [exportPackDescription, setExportPackDescription] = uS('Designer pack draft.');
  var [exportPackTags, setExportPackTags] = uS((draftFrame?.tags || []).join(', '));
  var [exportPackAuthor, setExportPackAuthor] = uS(draftFrame?.author?.name || 'IMMM Studio');
  var [exportPackLicense, setExportPackLicense] = uS(draftFrame?.license || 'internal');
  var [importPackJson, setImportPackJson] = uS('');
  var [showGuides, setShowGuides] = uS(true);
  var [snapEnabled, setSnapEnabled] = uS(true);
  var [gridEnabled, setGridEnabled] = uS(false);
  var [activeLayerIndex, setActiveLayerIndex] = uS(0);
  var [activeMotionPreview, setActiveMotionPreview] = uS(false);
  var [showAdvancedLayers, setShowAdvancedLayers] = uS(false);
  var applySlotGeometryPreset = presetType => {
    if (!draftFrame || !frameApi) return;
    var backup = JSON.parse(JSON.stringify(draftFrame));
    var nextFrame = JSON.parse(JSON.stringify(draftFrame));
    var slots = nextFrame.photoSlots || [];
    if (presetType === 'default') {
      var defaultSlots = frameApi.getPhotoSlotsForLayout?.(nextFrame.layout) || [];
      nextFrame.photoSlots = slots.map((slot, i) => ({
        ...slot,
        borderRadius: 0,
        width: defaultSlots[i]?.width || slot.width,
        height: defaultSlots[i]?.height || slot.height,
        x: defaultSlots[i]?.x || slot.x,
        y: defaultSlots[i]?.y || slot.y
      }));
    } else if (presetType === 'round') {
      slots.forEach(slot => {
        slot.borderRadius = 24;
      });
    } else if (presetType === 'wide-margin') {
      slots.forEach(slot => {
        var shrinkW = Math.round(slot.width * 0.1);
        var shrinkH = Math.round(slot.height * 0.1);
        slot.width -= shrinkW;
        slot.height -= shrinkH;
        slot.x += Math.round(shrinkW / 2);
        slot.y += Math.round(shrinkH / 2);
        slot.borderRadius = 8;
      });
    } else if (presetType === 'tight') {
      slots.forEach(slot => {
        var expandW = Math.round(slot.width * 0.05);
        var expandH = Math.round(slot.height * 0.05);
        slot.width += expandW;
        slot.height += expandH;
        slot.x -= Math.round(expandW / 2);
        slot.y -= Math.round(expandH / 2);
        slot.borderRadius = 0;
      });
    } else if (presetType === 'center') {
      var canvasW = nextFrame.canvasSize?.width || 560;
      slots.forEach(slot => {
        slot.x = Math.round((canvasW - slot.width) / 2);
      });
    }
    var val = frameApi.validateDesignerDraft?.(nextFrame) || {
      ok: true
    };
    if (val.ok) {
      setDraftFrame(nextFrame);
      setStatusMessage('레이아웃 프리셋이 적용되었습니다.');
    } else {
      setDraftFrame(backup);
      setStatusMessage(`적용 실패(롤백됨): ${val.error || '유효하지 않은 레이아웃'}`);
    }
  };
  var handleBgImageUpload = e => {
    var file = e.target.files?.[0];
    if (!file) return;
    var MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setStatusMessage('이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
      e.target.value = '';
      return;
    }
    var reader = new FileReader();
    reader.onload = () => {
      var originalResult = reader.result;
      var img = new Image();
      img.onload = () => {
        var longEdgeLimit = 2048;
        var width = img.naturalWidth;
        var height = img.naturalHeight;
        var needsResize = false;
        if (width > longEdgeLimit || height > longEdgeLimit) {
          needsResize = true;
          if (width > height) {
            height = Math.round(height * longEdgeLimit / width);
            width = longEdgeLimit;
          } else {
            width = Math.round(width * longEdgeLimit / height);
            height = longEdgeLimit;
          }
        }
        var finalResult = originalResult;
        if (needsResize) {
          try {
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            finalResult = canvas.toDataURL(file.type || 'image/png');
          } catch (err) {
            console.error('[IMMM] Resize background image failed:', err);
            setStatusMessage('배경 이미지를 불러오지 못했습니다.');
            e.target.value = '';
            return;
          }
        }
        if (typeof window !== 'undefined') {
          if (!window.__IMMM_BACKGROUND_IMAGE_CACHE__) {
            window.__IMMM_BACKGROUND_IMAGE_CACHE__ = new Map();
          }
          if (needsResize) {
            var resizedImg = new Image();
            resizedImg.onload = () => {
              window.__IMMM_BACKGROUND_IMAGE_CACHE__.set(finalResult, resizedImg);
              setBackgroundPatch({
                type: 'image',
                value: finalResult
              });
            };
            resizedImg.onerror = () => {
              setStatusMessage('배경 이미지를 불러오지 못했습니다.');
            };
            resizedImg.src = finalResult;
          } else {
            window.__IMMM_BACKGROUND_IMAGE_CACHE__.set(finalResult, img);
            setBackgroundPatch({
              type: 'image',
              value: finalResult
            });
          }
        } else {
          setBackgroundPatch({
            type: 'image',
            value: finalResult
          });
        }
      };
      img.onerror = () => {
        setStatusMessage('배경 이미지를 불러오지 못했습니다.');
      };
      img.src = originalResult;
    };
    reader.onerror = () => {
      setStatusMessage('배경 이미지를 불러오지 못했습니다.');
    };
    reader.readAsDataURL(file);
  };
  var normalizedDraft = uM(() => frameApi?.normalizeDesignerDraft?.(draftFrame) || draftFrame || null, [draftFrame, frameApi]);
  var normalizedInitial = uM(() => frameApi?.normalizeDesignerDraft?.(initialDraftFrame) || initialDraftFrame || null, [initialDraftFrame, frameApi]);
  var slotDefaults = uM(() => normalizedDraft ? frameApi?.getPhotoSlotsForLayout?.(normalizedDraft.layout) || normalizedDraft.photoSlots || [] : [], [frameApi, normalizedDraft]);
  var previewShots = uM(() => Array.from({
    length: Math.max(1, normalizedDraft?.photoSlots?.length || slotDefaults.length || 4)
  }, () => ({
    filter: 'original',
    dataUrl: null
  })), [normalizedDraft, slotDefaults.length]);
  var isDirty = uM(() => {
    if (!normalizedDraft || !normalizedInitial) return Boolean(normalizedDraft);
    return JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedInitial);
  }, [normalizedDraft, normalizedInitial]);
  var validation = uM(() => normalizedDraft ? frameApi?.validateDesignerDraft?.(normalizedDraft) || {
    ok: false,
    error: 'Designer validation unavailable'
  } : {
    ok: false,
    error: 'Draft missing'
  }, [frameApi, normalizedDraft]);
  React.useEffect(() => {
    if (!isCreator && !['layout', 'background', 'decorations', 'save'].includes(activeTab)) {
      setActiveTab('layout');
    }
  }, [isCreator, activeTab]);
  var tabs = isCreator ? [{
    id: 'layout',
    label: 'Layout'
  }, {
    id: 'background',
    label: 'Background'
  }, {
    id: 'slots',
    label: 'Slots'
  }, ...(showAdvancedLayers ? [{
    id: 'layers',
    label: 'Layers'
  }] : []), {
    id: 'decorations',
    label: 'Decorations'
  }, {
    id: 'text',
    label: 'Text'
  }, {
    id: 'save',
    label: 'Save'
  }] : [{
    id: 'layout',
    label: '모양'
  }, {
    id: 'background',
    label: '배경'
  }, {
    id: 'decorations',
    label: '꾸미기'
  }, {
    id: 'save',
    label: '저장'
  }];
  var currentLayoutSlots = normalizedDraft?.photoSlots || [];
  var currentDecorations = normalizedDraft?.decorations || [];
  var currentLayers = normalizedDraft?.layers || [];
  var currentMotionLayers = normalizedDraft?.motionLayers || [];
  var isSystemLayer = layer => ['background', 'photo-slots', 'watermark'].includes(layer?.type);
  var selectedSlot = currentLayoutSlots[selectedSlotIndex] || currentLayoutSlots[0] || null;
  var selectedDecoration = currentDecorations[selectedDecorationIndex] || currentDecorations[0] || null;
  var selectedLayer = currentLayers[activeLayerIndex] || currentLayers[0] || null;
  var slotCount = currentLayoutSlots.length;
  var previewCanvas = normalizedDraft?.canvasSize || frameApi?.getCanvasSizeForLayout?.(normalizedDraft?.layout || layout) || {
    width: 560,
    height: 1808
  };
  var clampRectToCanvasFallback = (rect, canvasSize, minWidth = 24, minHeight = 24) => {
    var width = canvasSize?.width || 1;
    var height = canvasSize?.height || 1;
    var nextWidth = Math.max(minWidth, Math.min(width, Number(rect?.width) || minWidth));
    var nextHeight = Math.max(minHeight, Math.min(height, Number(rect?.height) || minHeight));
    var nextX = Math.max(0, Math.min(Number(rect?.x) ?? 0, Math.max(0, width - nextWidth)));
    var nextY = Math.max(0, Math.min(Number(rect?.y) ?? 0, Math.max(0, height - nextHeight)));
    return {
      x: nextX,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      ...(typeof rect?.rotation === 'number' && {
        rotation: rect.rotation
      }),
      ...(typeof rect?.opacity === 'number' && {
        opacity: rect.opacity
      })
    };
  };
  var getDragPoint = event => {
    if (!event) return null;
    if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
      return {
        clientX: event.clientX,
        clientY: event.clientY
      };
    }
    var touch = event.touches?.[0] || event.changedTouches?.[0];
    if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
      return {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
    }
    return null;
  };
  var snapRectToGuides = (rect, canvasSize, peers = []) => {
    var next = {
      ...rect
    };
    var guides = [];
    var width = canvasSize?.width || 1;
    var height = canvasSize?.height || 1;
    var threshold = 14;
    var centerX = width / 2;
    var centerY = height / 2;
    var rectCenterX = next.x + next.width / 2;
    var rectCenterY = next.y + next.height / 2;
    var snapAxis = (value, target, axis, kind) => {
      if (Math.abs(value - target) <= threshold) {
        guides.push({
          axis,
          value: target,
          kind
        });
        return target;
      }
      return value;
    };
    var snappedCenterX = snapAxis(rectCenterX, centerX, 'v', 'center');
    var snappedCenterY = snapAxis(rectCenterY, centerY, 'h', 'center');
    next.x += snappedCenterX - rectCenterX;
    next.y += snappedCenterY - rectCenterY;
    var edgeCandidates = [{
      axis: 'v',
      value: 0,
      kind: 'edge-left'
    }, {
      axis: 'v',
      value: width,
      kind: 'edge-right'
    }, {
      axis: 'h',
      value: 0,
      kind: 'edge-top'
    }, {
      axis: 'h',
      value: height,
      kind: 'edge-bottom'
    }];
    edgeCandidates.forEach(candidate => {
      if (candidate.axis === 'v') {
        var left = next.x;
        var right = next.x + next.width;
        if (Math.abs(left - candidate.value) <= threshold) {
          guides.push(candidate);
          next.x += candidate.value - left;
        } else if (Math.abs(right - candidate.value) <= threshold) {
          guides.push(candidate);
          next.x += candidate.value - right;
        }
      } else {
        var top = next.y;
        var bottom = next.y + next.height;
        if (Math.abs(top - candidate.value) <= threshold) {
          guides.push(candidate);
          next.y += candidate.value - top;
        } else if (Math.abs(bottom - candidate.value) <= threshold) {
          guides.push(candidate);
          next.y += candidate.value - bottom;
        }
      }
    });
    peers.forEach(peer => {
      if (!peer) return;
      var peerCenterX = peer.x + peer.width / 2;
      var peerCenterY = peer.y + peer.height / 2;
      if (Math.abs(next.x + next.width / 2 - peerCenterX) <= threshold) {
        guides.push({
          axis: 'v',
          value: peerCenterX,
          kind: 'peer-center'
        });
        next.x += peerCenterX - (next.x + next.width / 2);
      }
      if (Math.abs(next.y + next.height / 2 - peerCenterY) <= threshold) {
        guides.push({
          axis: 'h',
          value: peerCenterY,
          kind: 'peer-center'
        });
        next.y += peerCenterY - (next.y + next.height / 2);
      }
    });
    var clamped = frameApi?.clampRectToCanvas?.(next, canvasSize, 24, 24) || next;
    return {
      rect: clamped,
      guides
    };
  };
  var normalizeNextDraft = updater => {
    setDraftFrame(prev => {
      var base = frameApi?.normalizeDesignerDraft?.(prev || normalizedDraft || initialDraftFrame) || prev || normalizedDraft || initialDraftFrame;
      var next = typeof updater === 'function' ? updater(base) : {
        ...base,
        ...updater
      };
      return frameApi?.normalizeDesignerDraft?.(next) || next;
    });
  };
  var setDraftLayout = nextLayout => {
    var normalizedLayout = frameApi?.normalizePresetLayout?.(nextLayout) || nextLayout || 'strip';
    var defaultSlots = frameApi?.getPhotoSlotsForLayout?.(normalizedLayout) || [];
    normalizeNextDraft(prev => ({
      ...prev,
      layout: normalizedLayout,
      canvasSize: frameApi?.getCanvasSizeForLayout?.(normalizedLayout) || prev.canvasSize,
      photoSlots: defaultSlots
    }));
    setSelectedSlotIndex(0);
    setActiveTab('slots');
  };
  var setBackgroundPatch = patch => {
    normalizeNextDraft(prev => ({
      ...prev,
      background: {
        ...(prev.background || {
          type: 'solid',
          value: '#FFFFFF',
          opacity: 1
        }),
        ...patch
      }
    }));
  };
  var setSlotPatch = (index, patch) => {
    normalizeNextDraft(prev => {
      var next = [...(prev.photoSlots || [])];
      if (!next[index]) return prev;
      var merged = {
        ...next[index],
        ...patch
      };
      var clamped = frameApi?.clampRectToCanvas?.(merged, prev.canvasSize, 24, 24) || clampRectToCanvasFallback(merged, prev.canvasSize, 24, 24);
      next[index] = clamped;
      return {
        ...prev,
        photoSlots: next
      };
    });
  };
  var restoreLayoutSlots = () => {
    if (!normalizedDraft) return;
    normalizeNextDraft(prev => ({
      ...prev,
      photoSlots: frameApi?.getPhotoSlotsForLayout?.(prev.layout) || prev.photoSlots
    }));
  };
  var addDecoration = (shape, type = 'shape') => {
    if (!normalizedDraft) return;
    var w = Math.max(80, Math.round((normalizedDraft.canvasSize?.width || 560) * 0.18));
    var h = Math.max(60, Math.round((normalizedDraft.canvasSize?.height || 1808) * 0.08));
    var cx = Math.round(((normalizedDraft.canvasSize?.width || 560) - w) / 2);
    var cy = Math.round(((normalizedDraft.canvasSize?.height || 1808) - h) / 2);
    var id = `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    var deco = type === 'text' ? {
      id,
      type: 'text',
      text: 'TEXT',
      x: cx,
      y: cy,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      fill: '#111111',
      fontWeight: 800,
      layer: 'front'
    } : {
      id,
      type: 'shape',
      shape,
      x: cx,
      y: cy,
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      fill: '#111111',
      layer: 'front'
    };
    normalizeNextDraft(prev => ({
      ...prev,
      decorations: [...(prev.decorations || []), deco]
    }));
    setSelectedDecorationIndex(prev => Math.max(0, normalizedDraft?.decorations?.length || 0));
    setActiveTab('decorations');
  };
  var setDecorationPatch = (index, patch) => {
    normalizeNextDraft(prev => {
      var next = [...(prev.decorations || [])];
      if (!next[index]) return prev;
      var canvasSize = prev.canvasSize || previewCanvas;
      var merged = {
        ...next[index],
        ...patch
      };

      // Validate position and size if being changed
      if (patch.hasOwnProperty('x') || patch.hasOwnProperty('y') || patch.hasOwnProperty('width') || patch.hasOwnProperty('height')) {
        var clamped = clampRectToCanvasFallback(merged, canvasSize, 24, 24);
        next[index] = frameApi?.normalizeDesignerDraft?.({
          ...prev,
          decorations: next.map((deco, i) => i === index ? clamped : deco)
        })?.decorations?.[index] || clamped;
      } else {
        next[index] = frameApi?.normalizeDesignerDraft?.({
          ...prev,
          decorations: next.map((deco, i) => i === index ? merged : deco)
        })?.decorations?.[index] || merged;
      }
      return {
        ...prev,
        decorations: next
      };
    });
  };
  var duplicateDecoration = index => {
    normalizeNextDraft(prev => {
      var source = (prev.decorations || [])[index];
      if (!source) return prev;
      var copy = {
        ...source,
        id: `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        x: (source.x || 0) + 24,
        y: (source.y || 0) + 24
      };
      return {
        ...prev,
        decorations: [...(prev.decorations || []), copy]
      };
    });
  };
  var deleteDecoration = index => {
    normalizeNextDraft(prev => ({
      ...prev,
      decorations: (prev.decorations || []).filter((_, i) => i !== index)
    }));
    setSelectedDecorationIndex(0);
  };
  var setLayerPatch = (index, patch) => {
    normalizeNextDraft(prev => {
      var next = [...(prev.layers || [])];
      if (!next[index]) return prev;
      next[index] = {
        ...next[index],
        ...patch
      };
      return {
        ...prev,
        layers: next
      };
    });
  };
  var moveLayer = (index, delta) => {
    normalizeNextDraft(prev => {
      var next = [...(prev.layers || [])];
      var target = index + delta;
      if (!next[index] || target < 0 || target >= next.length) return prev;
      var [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return {
        ...prev,
        layers: next.map((layer, i) => ({
          ...layer,
          zIndex: i
        }))
      };
    });
    setActiveLayerIndex(prev => Math.max(0, prev + delta));
  };
  var duplicateLayer = index => {
    normalizeNextDraft(prev => {
      var source = (prev.layers || [])[index];
      if (!source) return prev;
      var copy = {
        ...source,
        id: `${source.id || 'layer'}_${Date.now().toString(36)}`,
        zIndex: (source.zIndex || 0) + 1
      };
      var next = [...(prev.layers || [])];
      next.splice(index + 1, 0, copy);
      return {
        ...prev,
        layers: next.map((layer, i) => ({
          ...layer,
          zIndex: i
        }))
      };
    });
  };
  var deleteLayer = index => {
    normalizeNextDraft(prev => ({
      ...prev,
      layers: (prev.layers || []).filter((_, i) => i !== index)
    }));
    setActiveLayerIndex(0);
  };
  var startDrag = (kind, index, mode = 'move', metrics = null, viewportRefArg = null) => event => {
    var viewportEl = viewportRefArg?.current || previewRef.current;
    if (!viewportEl || !normalizedDraft) return;
    var point = getDragPoint(event);
    if (!point) return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget?.setPointerCapture && event.pointerId != null) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {}
    }
    var snapshot = frameApi?.normalizeDesignerDraft?.(normalizedDraft) || normalizedDraft;
    var originalRect = kind === 'slot' ? {
      ...((snapshot.photoSlots || [])[index] || {})
    } : {
      ...((snapshot.decorations || [])[index] || {})
    };
    dragRef.current = {
      kind,
      index,
      mode,
      startX: point.clientX,
      startY: point.clientY,
      rect: viewportEl.getBoundingClientRect(),
      viewportEl,
      metrics,
      startPoint: metrics ? clientPointToCanvasPoint(event, viewportEl, metrics) : null,
      originalRect,
      snapshot
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
    setSelectedSlotIndex(prev => Math.min(prev, Math.max(0, currentLayoutSlots.length - 1)));
    setSelectedDecorationIndex(prev => Math.min(prev, Math.max(0, currentDecorations.length - 1)));
    setActiveLayerIndex(prev => Math.min(prev, Math.max(0, currentLayers.length - 1)));
  }, [currentDecorations.length, currentLayoutSlots.length, normalizedDraft]);
  React.useEffect(() => {
    var onMove = event => {
      var drag = dragRef.current;
      if (!drag || !drag.snapshot) return;
      var point = getDragPoint(event);
      if (!point) return;
      var currentCanvasPoint = drag.metrics && drag.viewportEl ? clientPointToCanvasPoint(event, drag.viewportEl, drag.metrics) : null;
      var dx = currentCanvasPoint && drag.startPoint ? currentCanvasPoint.x - drag.startPoint.x : (point.clientX - drag.startX) * ((drag.snapshot.canvasSize?.width || 1) / Math.max(1, drag.rect.width));
      var dy = currentCanvasPoint && drag.startPoint ? currentCanvasPoint.y - drag.startPoint.y : (point.clientY - drag.startY) * ((drag.snapshot.canvasSize?.height || 1) / Math.max(1, drag.rect.height));
      if (event.cancelable) event.preventDefault();
      normalizeNextDraft(prev => {
        var base = frameApi?.normalizeDesignerDraft?.(prev || drag.snapshot) || prev || drag.snapshot;
        if (drag.kind === 'slot') {
          var nextSlots = [...(base.photoSlots || [])];
          var source = drag.originalRect || (drag.snapshot.photoSlots || [])[drag.index] || nextSlots[drag.index];
          if (!source) return base;
          var patch = drag.mode === 'resize' ? {
            width: source.width + dx,
            height: source.height + dy
          } : {
            x: source.x + dx,
            y: source.y + dy
          };
          var peers = nextSlots.filter((_, i) => i !== drag.index);
          var nextRect = {
            ...source,
            ...patch
          };
          var clampedRect = frameApi?.clampRectToCanvas?.(nextRect, base.canvasSize, 24, 24) || clampRectToCanvasFallback(nextRect, base.canvasSize, 24, 24);
          var snapped = snapEnabled ? snapRectToGuides(clampedRect, base.canvasSize, peers) : {
            rect: clampedRect,
            guides: []
          };
          setActiveGuides(snapped.guides);
          nextSlots[drag.index] = snapped.rect;
          return {
            ...base,
            photoSlots: nextSlots
          };
        }
        if (drag.kind === 'decor') {
          var nextDecos = [...(base.decorations || [])];
          var _source = drag.originalRect || (drag.snapshot.decorations || [])[drag.index] || nextDecos[drag.index];
          if (!_source) return base;
          var _patch = drag.mode === 'resize' ? {
            width: _source.width + dx,
            height: _source.height + dy
          } : {
            x: _source.x + dx,
            y: _source.y + dy
          };
          var _peers = nextDecos.filter((_, i) => i !== drag.index).map(item => ({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height
          }));
          var _nextRect = {
            ..._source,
            ..._patch
          };
          var _clampedRect = frameApi?.clampRectToCanvas?.(_nextRect, base.canvasSize, 24, 24) || clampRectToCanvasFallback(_nextRect, base.canvasSize, 24, 24);
          var _snapped = snapEnabled ? snapRectToGuides(_clampedRect, base.canvasSize, _peers) : {
            rect: _clampedRect,
            guides: []
          };
          setActiveGuides(_snapped.guides);
          nextDecos[drag.index] = frameApi?.normalizeDesignerDraft?.({
            ...base,
            decorations: nextDecos.map((item, i) => i === drag.index ? {
              ...item,
              ..._snapped.rect
            } : item)
          })?.decorations?.[drag.index] || {
            ..._source,
            ..._snapped.rect
          };
          return {
            ...base,
            decorations: nextDecos
          };
        }
        return base;
      });
    };
    var onUp = () => {
      dragRef.current = null;
      setActiveGuides([]);
    };
    window.addEventListener('pointermove', onMove, {
      passive: false
    });
    window.addEventListener('pointerup', onUp, {
      passive: true
    });
    window.addEventListener('pointercancel', onUp, {
      passive: true
    });
    if (useTouchFallback) {
      window.addEventListener('touchmove', onMove, {
        passive: false
      });
      window.addEventListener('touchend', onUp, {
        passive: true
      });
      window.addEventListener('touchcancel', onUp, {
        passive: true
      });
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
  var handleSaveFrame = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    var result = saveDesignerFrame ? saveDesignerFrame(normalizedDraft) : {
      ok: false,
      error: 'Save unavailable'
    };
    if (!result?.ok) {
      setValidationError(result?.error || 'Save failed');
      return;
    }
    setValidationError('');
    setStatusMessage('Saved to My Frames');
    if (typeof setSetupStoreTabFocus === 'function') setSetupStoreTabFocus('my-frames');
    go('frames');
  };
  var handleSaveAsNew = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    var clone = frameApi?.duplicateFramePresetAsDraft?.(normalizedDraft) || normalizedDraft;
    if (!clone) return;
    setDraftFrame(clone);
    var result = saveDesignerFrame ? saveDesignerFrame(clone) : {
      ok: false,
      error: 'Save unavailable'
    };
    if (!result?.ok) {
      setValidationError(result?.error || 'Save failed');
      return;
    }
    setStatusMessage('Saved as a new frame');
    setValidationError('');
    if (typeof setSetupStoreTabFocus === 'function') setSetupStoreTabFocus('my-frames');
    go('frames');
  };
  var handlePackExport = () => {
    if (!validation.ok) {
      setValidationError(validation.error || 'Validation failed');
      return;
    }
    var result = saveDesignerPackDraft ? saveDesignerPackDraft(normalizedDraft, {
      name: exportPackName,
      description: exportPackDescription,
      author: {
        name: exportPackAuthor,
        handle: '@immm',
        url: ''
      },
      license: exportPackLicense,
      tags: exportPackTags.split(',').map(tag => tag.trim()).filter(Boolean)
    }) : {
      ok: false,
      error: 'Pack export unavailable'
    };
    if (!result?.ok) {
      setValidationError(result?.error || 'Export failed');
      return;
    }
    setValidationError('');
    setStatusMessage('Pack draft copied to clipboard');
  };
  var handlePackImport = () => {
    if (!importPackJson.trim()) {
      setValidationError('Paste a frame pack JSON blob first');
      return;
    }
    var result = importFramePackFromJson ? importFramePackFromJson(importPackJson) : {
      ok: false,
      error: 'Import unavailable'
    };
    if (!result?.ok) {
      setValidationError(result?.error || 'Import failed');
      return;
    }
    setImportPackJson('');
    setValidationError('');
    setStatusMessage(`Imported ${result.presets?.length || 0} frames`);
    setDesignerMode('edit');
    if (typeof setSetupStoreTabFocus === 'function') setSetupStoreTabFocus('imported');
    go('frames');
  };
  var handleDiscard = () => {
    if (isDirty && !window.confirm('Discard designer changes?')) return;
    setDraftFrame(normalizedInitial || normalizedDraft);
    setDesignerMode('edit');
    clearDesignerDraftRecovery && clearDesignerDraftRecovery();
    setStatusMessage('Draft discarded');
    go('frames');
  };
  if (!normalizedDraft) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        padding: 24,
        background: T.bg,
        color: T.ink,
        fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui',
        display: 'grid',
        placeItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 'min(100%, 420px)',
        border: `1px solid ${T.line}`,
        borderRadius: 18,
        background: '#fff',
        padding: 18,
        display: 'grid',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800
      }
    }, !isCreator ? '프레임을 불러올 수 없습니다' : 'Designer draft unavailable'), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        lineHeight: 1.5,
        color: T.inkSoft
      }
    }, !isCreator ? '이전 디자이너 경로에 복구 가능한 프레임 초안이 포함되어 있지 않습니다.' : 'The previous designer route did not include a recoverable frame draft.'), /*#__PURE__*/React.createElement("button", {
      onClick: () => go('frames'),
      style: {
        minHeight: 44,
        borderRadius: 12,
        border: 'none',
        background: T.ink,
        color: T.bg,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase'
      }
    }, !isCreator ? '프레임 목록으로' : 'Back to Frame Store'), openDesigner && /*#__PURE__*/React.createElement("button", {
      onClick: () => openDesigner({
        mode: 'new'
      }),
      style: {
        minHeight: 44,
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.ink,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase'
      }
    }, !isCreator ? '기본 프레임 생성' : 'Create Default Frame')));
  }
  var previewWidth = 540;
  var previewHeight = Math.round(previewWidth * (previewCanvas.height / previewCanvas.width));
  var editorShell = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(520px, 1.35fr) minmax(360px, 0.65fr)',
      gap: 14,
      minHeight: '100%',
      background: T.bg,
      color: T.ink,
      padding: mobile ? '12px 12px 18px' : '20px',
      fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 4,
      background: T.bg,
      paddingBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: T.inkSoft
    }
  }, "Frame Designer Studio"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: 900
    }
  }, normalizedDraft.name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 11,
      color: T.inkSoft
    }
  }, normalizedDraft.layout, " \xB7 ", normalizedDraft.photoSlots.length, " slots \xB7 ", designerMode)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, isCreator ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('frames'),
    style: {
      minHeight: 44,
      padding: '0 12px',
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Back to Store"), /*#__PURE__*/React.createElement("button", {
    onClick: handleDiscard,
    style: {
      minHeight: 44,
      padding: '0 12px',
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Discard"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveAsNew,
    style: {
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 999,
      border: 'none',
      background: 'rgba(26,26,31,0.08)',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Save as New"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveFrame,
    style: {
      minHeight: 44,
      padding: '0 14px',
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Save Frame")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (isDirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 정말로 닫으시겠습니까?')) return;
      go('frames');
    },
    style: {
      minHeight: 44,
      padding: '0 18px',
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 12,
      fontWeight: 800
    }
  }, "\uB2EB\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveFrame,
    style: {
      minHeight: 44,
      padding: '0 18px',
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 12,
      fontWeight: 800
    }
  }, "\uC800\uC7A5")))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px solid ${T.line}`,
      borderRadius: 18,
      background: '#fff',
      padding: 12,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.id,
    onClick: () => setActiveTab(tab.id),
    style: {
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
      cursor: 'pointer'
    }
  }, tab.label))), isCreator && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var next = !showAdvancedLayers;
      setShowAdvancedLayers(next);
      if (!next && activeTab === 'layers') {
        setActiveTab('layout');
      }
    },
    style: {
      minHeight: 36,
      padding: '0 12px',
      borderRadius: 999,
      border: `1px solid ${T.line}`,
      background: showAdvancedLayers ? T.ink : '#fff',
      color: showAdvancedLayers ? T.bg : T.ink,
      fontSize: 10,
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "\uACE0\uAE09 \uB808\uC774\uC5B4 ", showAdvancedLayers ? 'ON' : 'OFF')), /*#__PURE__*/React.createElement(DesignerPreviewCanvas, {
    draft: normalizedDraft,
    T: T,
    previewShots: previewShots,
    selectedSlotIndex: selectedSlotIndex,
    selectedDecorationIndex: selectedDecorationIndex,
    startDrag: startDrag,
    activeGuides: activeGuides,
    showGuides: showGuides,
    gridEnabled: gridEnabled,
    useTouchFallback: useTouchFallback
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 12,
      alignContent: 'start',
      position: mobile ? 'static' : 'sticky',
      top: mobile ? 'auto' : 12,
      alignSelf: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, !isCreator ? '상태' : 'Status'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, !isCreator ? isDirty ? '저장되지 않음' : '저장됨' : isDirty ? 'Unsaved' : 'Saved'), designerBasePresetId && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, designerBasePresetId))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft
    }
  }, !isCreator ? validation.ok ? '저장할 수 있어요' : validation.error === 'Designer draft unavailable' ? '프레임을 불러올 수 없습니다' : validation.error : validation.ok ? 'Draft is valid.' : validation.error), statusMessage && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.ink
    }
  }, statusMessage), validationError && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#B64B4B'
    }
  }, validationError)), activeTab === 'layout' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, isCreator ? 'Layout' : '프레임 이름 및 형태'), /*#__PURE__*/React.createElement("input", {
    value: normalizedDraft.name,
    onChange: e => normalizeNextDraft({
      name: e.target.value
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    },
    placeholder: "\uD504\uB808\uC784 \uC774\uB984"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)',
      gap: 8
    }
  }, ['strip', 'grid', 'trip', 'polaroid'].map(nextLayout => /*#__PURE__*/React.createElement("button", {
    key: nextLayout,
    onClick: () => setDraftLayout(nextLayout),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: normalizedDraft.layout === nextLayout ? T.ink : '#fff',
      color: normalizedDraft.layout === nextLayout ? T.bg : T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, nextLayout))), !isCreator ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: T.inkSoft
    }
  }, "\uC0AC\uC9C4\uCE78 \uBAA8\uC591 \uD504\uB9AC\uC14B"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => applySlotGeometryPreset('default'),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uAE30\uBCF8"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applySlotGeometryPreset('round'),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uB465\uAE00\uAC8C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applySlotGeometryPreset('wide-margin'),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uC5EC\uBC31 \uB113\uAC8C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applySlotGeometryPreset('tight'),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uAF49 \uCC28\uAC8C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applySlotGeometryPreset('center'),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700,
      gridColumn: 'span 2'
    }
  }, "\uC911\uC559 \uC815\uB82C"))) : /*#__PURE__*/React.createElement("button", {
    onClick: restoreLayoutSlots,
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Restore layout defaults")), activeTab === 'background' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, "\uBC30\uACBD \uC124\uC815"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8
    }
  }, ['#ffffff', '#111111', '#f5e8f0', '#e5f2ff', '#f8ead7', '#dbeee1'].map(swatch => /*#__PURE__*/React.createElement("button", {
    key: swatch,
    onClick: () => setBackgroundPatch({
      type: 'solid',
      value: swatch
    }),
    style: {
      height: 36,
      borderRadius: 999,
      border: 'none',
      background: swatch,
      boxShadow: normalizedDraft.background?.value === swatch ? `0 0 0 2px ${T.ink}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)'
    }
  }))), /*#__PURE__*/React.createElement("input", {
    value: typeof normalizedDraft.background?.value === 'string' && !normalizedDraft.background.value.startsWith('data:') ? normalizedDraft.background.value : '#ffffff',
    onChange: e => setBackgroundPatch({
      type: 'solid',
      value: e.target.value
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    },
    placeholder: "#ffffff"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      color: T.inkSoft
    }
  }, "\uBD88\uD22C\uBA85\uB3C4 (Opacity)"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "1",
    step: "0.01",
    value: Number(normalizedDraft.background?.opacity ?? 1),
    onChange: e => setBackgroundPatch({
      opacity: Number(e.target.value)
    })
  }), /*#__PURE__*/React.createElement("select", {
    value: normalizedDraft.background?.type || 'solid',
    onChange: e => {
      var type = e.target.value;
      if (type === 'gradient') setBackgroundPatch({
        type,
        value: {
          type: 'linear',
          angle: 0,
          stops: ['#FFFFFF', '#F5F5F5']
        }
      });else if (type === 'pattern') setBackgroundPatch({
        type,
        value: {
          pattern: 'dots',
          color: '#FFFFFF',
          dotColor: 'rgba(17,17,17,0.05)'
        }
      });else if (type === 'image') setBackgroundPatch({
        type,
        value: ''
      });else setBackgroundPatch({
        type: 'solid',
        value: '#FFFFFF'
      });
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "solid"
  }, "Solid (\uB2E8\uC0C9)"), /*#__PURE__*/React.createElement("option", {
    value: "gradient"
  }, "Gradient (\uADF8\uB77C\uB370\uC774\uC158)"), /*#__PURE__*/React.createElement("option", {
    value: "pattern"
  }, "Pattern (\uD328\uD134)"), /*#__PURE__*/React.createElement("option", {
    value: "image"
  }, "Image (\uC774\uBBF8\uC9C0)")), normalizedDraft.background?.type === 'gradient' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, [['#FFFFFF', '#F4F4F4'], ['#FFF1F7', '#F4D7FF'], ['#E8F3FF', '#DCEEFF']].map((stops, idx) => /*#__PURE__*/React.createElement("button", {
    key: idx,
    onClick: () => setBackgroundPatch({
      type: 'gradient',
      value: {
        type: 'linear',
        angle: idx * 35,
        stops
      }
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: `linear-gradient(90deg, ${stops[0]}, ${stops[1]})`
    }
  }))), normalizedDraft.background?.type === 'pattern' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: normalizedDraft.background?.value?.pattern || 'dots',
    onChange: e => setBackgroundPatch({
      type: 'pattern',
      value: {
        ...(normalizedDraft.background.value || {}),
        pattern: e.target.value
      }
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "dots"
  }, "Dots"), /*#__PURE__*/React.createElement("option", {
    value: "confetti"
  }, "Confetti"), /*#__PURE__*/React.createElement("option", {
    value: "bubbles"
  }, "Bubbles"))), normalizedDraft.background?.type === 'image' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    onChange: handleBgImageUpload,
    style: {
      display: 'none'
    },
    id: "bg-image-upload-input"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => document.getElementById('bg-image-upload-input')?.click(),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800
    }
  }, "\uBC30\uACBD \uC774\uBBF8\uC9C0 \uC5C5\uB85C\uB4DC"), normalizedDraft.background?.value && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    }
  }, "\uB4F1\uB85D\uB428: ", normalizedDraft.background.value.slice(0, 40), "..."))), activeTab === 'slots' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, "Slots"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, currentLayoutSlots.map((slot, index) => /*#__PURE__*/React.createElement("button", {
    key: index,
    onClick: () => setSelectedSlotIndex(index),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${selectedSlotIndex === index ? T.ink : T.line}`,
      background: selectedSlotIndex === index ? T.card : '#fff',
      padding: '8px 12px',
      textAlign: 'left'
    }
  }, "Slot ", index + 1))), selectedSlot && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, ['x', 'y', 'width', 'height', 'radius'].map(key => /*#__PURE__*/React.createElement("label", {
    key: key,
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, key.toUpperCase(), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: Math.round(selectedSlot[key] || 0),
    onChange: e => setSlotPatch(selectedSlotIndex, {
      [key]: Number(e.target.value)
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8
    }
  }, [['◀', -12, 0], ['▶', 12, 0], ['▲', 0, -12], ['▼', 0, 12]].map(([label, dx, dy]) => /*#__PURE__*/React.createElement("button", {
    key: label,
    onClick: () => selectedSlot && setSlotPatch(selectedSlotIndex, {
      x: selectedSlot.x + dx,
      y: selectedSlot.y + dy
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 14,
      fontWeight: 800
    }
  }, label)))), activeTab === 'layers' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, "Layers"), /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, currentLayers.length)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, currentLayers.map((layer, index) => {
    var active = activeLayerIndex === index;
    var readOnly = isSystemLayer(layer);
    return /*#__PURE__*/React.createElement("div", {
      key: layer.id || index,
      style: {
        border: `1px solid ${active ? T.ink : T.line}`,
        borderRadius: 12,
        background: active ? T.card : '#fff',
        padding: 10,
        display: 'grid',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setActiveLayerIndex(index),
      style: {
        minHeight: 44,
        borderRadius: 10,
        border: 'none',
        background: 'transparent',
        padding: 0,
        textAlign: 'left',
        fontSize: 11,
        fontWeight: 800,
        color: T.ink
      }
    }, index + 1, ". ", layer.type), readOnly && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10.5,
        lineHeight: 1.45,
        color: T.inkSoft
      }
    }, "System layer. Background, photo slots, and watermark stay fixed so the preview/export pipeline does not break."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      disabled: readOnly,
      onClick: () => setLayerPatch(index, {
        visible: !layer.visible
      }),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: !readOnly && layer.visible ? T.ink : '#fff',
        color: !readOnly && layer.visible ? T.bg : T.ink,
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, layer.visible ? 'Visible' : 'Hidden'), /*#__PURE__*/React.createElement("button", {
      disabled: readOnly,
      onClick: () => setLayerPatch(index, {
        locked: !layer.locked
      }),
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: !readOnly && layer.locked ? T.ink : '#fff',
        color: !readOnly && layer.locked ? T.bg : T.ink,
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, layer.locked ? 'Locked' : 'Unlocked'), /*#__PURE__*/React.createElement("button", {
      onClick: () => moveLayer(index, -1),
      disabled: readOnly || index === 0,
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, "Up"), /*#__PURE__*/React.createElement("button", {
      onClick: () => moveLayer(index, 1),
      disabled: readOnly || index === currentLayers.length - 1,
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, "Down"), /*#__PURE__*/React.createElement("button", {
      onClick: () => duplicateLayer(index),
      disabled: readOnly,
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, "Duplicate"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteLayer(index),
      disabled: readOnly,
      style: {
        minHeight: 38,
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: '#fff',
        padding: '0 10px',
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        opacity: readOnly ? 0.45 : 1
      }
    }, "Delete")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'grid',
        gap: 4,
        fontSize: 10,
        color: T.inkSoft
      }
    }, "Opacity", /*#__PURE__*/React.createElement("input", {
      disabled: readOnly,
      type: "number",
      min: "0",
      max: "1",
      step: "0.05",
      value: Number(layer.opacity ?? 1),
      onChange: e => setLayerPatch(index, {
        opacity: Number(e.target.value)
      }),
      style: {
        minHeight: 38,
        borderRadius: 10,
        border: `1px solid ${T.line}`,
        padding: '0 10px',
        opacity: readOnly ? 0.55 : 1
      }
    })), /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'grid',
        gap: 4,
        fontSize: 10,
        color: T.inkSoft
      }
    }, "Blend", /*#__PURE__*/React.createElement("select", {
      disabled: readOnly,
      value: layer.blendMode || 'normal',
      onChange: e => setLayerPatch(index, {
        blendMode: e.target.value
      }),
      style: {
        minHeight: 38,
        borderRadius: 10,
        border: `1px solid ${T.line}`,
        padding: '0 10px',
        opacity: readOnly ? 0.55 : 1
      }
    }, ['normal', 'multiply', 'screen', 'overlay', 'soft-light'].map(mode => /*#__PURE__*/React.createElement("option", {
      key: mode,
      value: mode
    }, mode)))), /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'grid',
        gap: 4,
        fontSize: 10,
        color: T.inkSoft
      }
    }, "zIndex", /*#__PURE__*/React.createElement("input", {
      disabled: readOnly,
      type: "number",
      value: Number(layer.zIndex ?? index),
      onChange: e => setLayerPatch(index, {
        zIndex: Number(e.target.value)
      }),
      style: {
        minHeight: 38,
        borderRadius: 10,
        border: `1px solid ${T.line}`,
        padding: '0 10px',
        opacity: readOnly ? 0.55 : 1
      }
    }))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      lineHeight: 1.45,
      color: T.inkSoft
    }
  }, "Layers control render groups only. Use Decorations and Text tabs to move actual objects on canvas."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowGuides(v => !v),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: showGuides ? T.ink : '#fff',
      color: showGuides ? T.bg : T.ink,
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, showGuides ? 'Guides On' : 'Guides Off'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSnapEnabled(v => !v),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: snapEnabled ? T.ink : '#fff',
      color: snapEnabled ? T.bg : T.ink,
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, snapEnabled ? 'Snap On' : 'Snap Off'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setGridEnabled(v => !v),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: gridEnabled ? T.ink : '#fff',
      color: gridEnabled ? T.bg : T.ink,
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, gridEnabled ? 'Grid On' : 'Grid Off'))), activeTab === 'decorations' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, "\uC2A4\uD2F0\uCEE4 \uBC0F \uAFB8\uBBF8\uAE30"), !isCreator ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: T.inkSoft
    }
  }, "\uC774\uBAA8\uC9C0 \uC2A4\uD2F0\uCEE4 \uCD94\uAC00"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 8
    }
  }, ['🍒', '⭐', '🎈', '💖', '🍀', '🐾', '🎀', '🧸', '👻', '🎉'].map(emoji => /*#__PURE__*/React.createElement("button", {
    key: emoji,
    onClick: () => {
      if (!normalizedDraft) return;
      var w = 60,
        h = 60;
      var canvasW = normalizedDraft.canvasSize?.width || 560;
      var canvasH = normalizedDraft.canvasSize?.height || 1808;
      var cx = Math.round((canvasW - w) / 2);
      var cy = Math.round((canvasH - h) / 2);
      var id = `deco_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      var deco = {
        id,
        type: 'text',
        text: emoji,
        x: cx,
        y: cy,
        width: w,
        height: h,
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        fill: '#111111',
        fontWeight: 800,
        layer: 'front'
      };
      normalizeNextDraft(prev => ({
        ...prev,
        decorations: [...(prev.decorations || []), deco]
      }));
      setSelectedDecorationIndex(normalizedDraft.decorations?.length || 0);
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 18
    }
  }, emoji))), selectedDecoration && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8,
      marginTop: 10,
      padding: 10,
      background: 'rgba(26,26,31,0.03)',
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800
    }
  }, "\uC120\uD0DD\uB41C \uC2A4\uD2F0\uCEE4: ", selectedDecoration.type === 'text' ? selectedDecoration.text : selectedDecoration.shape), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => duplicateDecoration(selectedDecorationIndex),
    style: {
      flex: 1,
      minHeight: 36,
      borderRadius: 8,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uBCF5\uC0AC"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteDecoration(selectedDecorationIndex),
    style: {
      flex: 1,
      minHeight: 36,
      borderRadius: 8,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: 'red',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\uC0AD\uC81C")))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, ['circle', 'roundedRect', 'heart', 'star', 'line', 'ribbon', 'speech', 'ticket', 'stamp'].map(shape => /*#__PURE__*/React.createElement("button", {
    key: shape,
    onClick: () => addDecoration(shape, 'shape'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, shape)), /*#__PURE__*/React.createElement("button", {
    onClick: () => addDecoration('text', 'text'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Text")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, currentDecorations.map((deco, index) => /*#__PURE__*/React.createElement("button", {
    key: deco.id || index,
    onClick: () => setSelectedDecorationIndex(index),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${selectedDecorationIndex === index ? T.ink : T.line}`,
      background: selectedDecorationIndex === index ? T.card : '#fff',
      padding: '8px 12px',
      textAlign: 'left'
    }
  }, deco.type === 'text' ? `Text: ${deco.text || 'TEXT'}` : `${deco.shape || 'shape'} · ${index + 1}`))), selectedDecoration && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, ['x', 'y', 'width', 'height', 'rotation', 'opacity'].map(key => /*#__PURE__*/React.createElement("label", {
    key: key,
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, key.toUpperCase(), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: key === 'opacity' ? '0.01' : '1',
    value: Number(selectedDecoration[key] || 0),
    onChange: e => setDecorationPatch(selectedDecorationIndex, {
      [key]: Number(e.target.value)
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  })))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, "Fill", /*#__PURE__*/React.createElement("input", {
    value: selectedDecoration.fill || '#111111',
    onChange: e => setDecorationPatch(selectedDecorationIndex, {
      fill: e.target.value
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, "Layer", /*#__PURE__*/React.createElement("select", {
    value: selectedDecoration.layer || (Number(selectedDecoration.zIndex) < 0 ? 'back' : 'front'),
    onChange: e => setDecorationPatch(selectedDecorationIndex, {
      layer: e.target.value,
      zIndex: e.target.value === 'back' ? -1 : 10
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "back"
  }, "Back"), /*#__PURE__*/React.createElement("option", {
    value: "front"
  }, "Front"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => duplicateDecoration(selectedDecorationIndex),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800
    }
  }, "Duplicate"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteDecoration(selectedDecorationIndex),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      padding: '0 12px',
      fontSize: 11,
      fontWeight: 800
    }
  }, "Delete"))))), activeTab === 'text' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, "\uD14D\uC2A4\uD2B8 / \uC6CC\uD130\uB9C8\uD06C"), /*#__PURE__*/React.createElement("button", {
    onClick: () => addDecoration('TEXT', 'text'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 800
    }
  }, "\uD14D\uC2A4\uD2B8 \uCD94\uAC00"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${T.line}`,
      paddingTop: 10,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: T.ink
    }
  }, "\uC6CC\uD130\uB9C8\uD06C"), /*#__PURE__*/React.createElement("input", {
    value: normalizedDraft.watermark?.text || '',
    onChange: e => normalizeNextDraft(prev => ({
      ...prev,
      watermark: {
        ...(prev.watermark || {}),
        text: e.target.value
      }
    })),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    },
    placeholder: "\uC6CC\uD130\uB9C8\uD06C \uD14D\uC2A4\uD2B8"
  }))), activeTab === 'save' && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 18,
      border: `1px solid ${T.line}`,
      background: '#fff',
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 900
    }
  }, isCreator ? 'Save / Pack Export' : '프레임 저장'), isCreator ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, "Export preset", /*#__PURE__*/React.createElement("select", {
    value: exportPresetId,
    onChange: e => setExportPresetId && setExportPresetId(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  }, (frameApi?.getExportPresets?.() || [{
    id: 'hd',
    name: 'HD'
  }, {
    id: 'instagram-story',
    name: 'Instagram Story'
  }, {
    id: 'instagram-post',
    name: 'Instagram Post'
  }, {
    id: 'wallpaper',
    name: 'Wallpaper'
  }]).map(preset => /*#__PURE__*/React.createElement("option", {
    key: preset.id,
    value: preset.id
  }, preset.name)))), /*#__PURE__*/React.createElement("input", {
    value: exportPackName,
    onChange: e => setExportPackName(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    },
    placeholder: "Pack name"
  }), /*#__PURE__*/React.createElement("input", {
    value: exportPackDescription,
    onChange: e => setExportPackDescription(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    },
    placeholder: "Pack description"
  }), /*#__PURE__*/React.createElement("input", {
    value: exportPackAuthor,
    onChange: e => setExportPackAuthor(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    },
    placeholder: "Author name"
  }), /*#__PURE__*/React.createElement("select", {
    value: exportPackLicense,
    onChange: e => setExportPackLicense(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "personal"
  }, "personal"), /*#__PURE__*/React.createElement("option", {
    value: "commercial"
  }, "commercial"), /*#__PURE__*/React.createElement("option", {
    value: "brand-collab"
  }, "brand-collab"), /*#__PURE__*/React.createElement("option", {
    value: "internal"
  }, "internal")), /*#__PURE__*/React.createElement("input", {
    value: exportPackTags,
    onChange: e => setExportPackTags(e.target.value),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    },
    placeholder: "tags, comma, separated"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveFrame,
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Update Existing"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveAsNew,
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Duplicate & Save"), /*#__PURE__*/React.createElement("button", {
    onClick: handlePackExport,
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Save as Pack Draft")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, "\uD504\uB808\uC784 \uC774\uB984", /*#__PURE__*/React.createElement("input", {
    value: normalizedDraft.name,
    onChange: e => normalizeNextDraft({
      name: e.target.value
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 12px',
      fontSize: 12
    },
    placeholder: "\uB098\uB9CC\uC758 \uD504\uB808\uC784 \uC774\uB984"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: handleSaveFrame,
    style: {
      minHeight: 48,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 12,
      fontWeight: 800
    }
  }, "\uB0B4 \uD504\uB808\uC784\uC5D0 \uC800\uC7A5")), isCreator && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var prompt = window.prompt('Describe an idea', 'kawaii pink y2k');
      if (!prompt) return;
      var idea = generateFrameIdea ? generateFrameIdea(prompt) : null;
      if (!idea) return;
      normalizeNextDraft(prev => ({
        ...prev,
        background: idea.background || prev.background,
        decorations: [...(idea.decorations || []), ...(prev.decorations || [])],
        watermark: idea.watermark ? {
          ...(prev.watermark || {}),
          ...idea.watermark
        } : prev.watermark,
        layout: idea.recommendedLayout || prev.layout
      }));
      setActiveTab('background');
      setStatusMessage(`Idea generated for ${prompt}`);
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Generate Ideas"), designerDraftRecovery && /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: 12,
      background: 'rgba(26,26,31,0.03)',
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: T.ink
    }
  }, "Recovery available"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: T.inkSoft
    }
  }, "Saved ", formatFrameDate(designerDraftRecovery.savedAt), " \xB7 ", designerDraftRecovery.draft?.name || 'Untitled'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (designerDraftRecovery?.draft) {
        setDraftFrame(designerDraftRecovery.draft);
        setStatusMessage('Recovered previous draft');
      }
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      padding: '0 12px'
    }
  }, "Restore"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      clearDesignerDraftRecovery && clearDesignerDraftRecovery();
      setStatusMessage('Recovery discarded');
    },
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase',
      padding: '0 12px'
    }
  }, "Discard Recovery"))), isCreator && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${T.line}`,
      paddingTop: 10,
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 900,
      color: T.ink
    }
  }, "Import Pack JSON"), /*#__PURE__*/React.createElement("textarea", {
    value: importPackJson,
    onChange: e => setImportPackJson(e.target.value),
    placeholder: "Paste frame pack JSON here",
    rows: 5,
    style: {
      minHeight: 120,
      resize: 'vertical',
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '10px 12px',
      fontSize: 12,
      lineHeight: 1.45
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: handlePackImport,
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      color: T.ink,
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Import Pack JSON")))));
  return mobile ? /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: T.bg
    }
  }, editorShell) : editorShell;
}
var Kicker = Kick;
var PrimaryBtn = BtnPrimary;
var GhostBtn = BtnGhost;
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