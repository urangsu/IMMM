// screens-v2.jsx — Redesigned screens per v2 brief

var {
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
  unlockFramePackForDev,
  unlockedFramePackIds = [],
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
  }, [allPacks, favoriteFramePresetIds, frameApi, savedFrames, storeFilter, storePresetSource, storeSearch, storeSort, storeTab]);
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
    return items;
  }, [allPacks, favoriteFramePresetIds, storeSearch, storeTab]);
  var activePackBlocked = Boolean(selectedPack?.locked && !(frameApi?.isFramePackUnlocked?.(selectedPack.id) ?? unlockedFramePackIds.includes(selectedPack?.id)));
  var devUnlockVisible = typeof window !== 'undefined' && (window.IMMM_FIELD_TEST === true || window.IMMM_DEBUG_BUILD === true || new URLSearchParams(location.search).get('fieldTest') === '1');
  var formatFrameDate = value => {
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
    key: `${frameColor}-${selectedFramePreset?.id || 'base'}`,
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
    framePreset: selectedFramePreset
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
    var layoutPreset = selectedFramePreset?.layout === o.id ? selectedFramePreset : allStorePresets.find(preset => preset.layout === o.id) || null;
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
  }, selectedFramePreset ? `${selectedFramePreset.name} · ${selectedFramePreset.layout} · ${selectedFramePreset.photoSlots?.length || 0}컷` : 'Pick, save, rename, and reuse frame presets.')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openDesigner && openDesigner({
      mode: 'new',
      preset: selectedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null
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
        marginTop: 10,
        display: 'grid',
        placeItems: 'center',
        minHeight: 128
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
      framePreset: coverPreset
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
    }, "Unlock coming soon"), devUnlockVisible && pack.locked && !packUnlocked && /*#__PURE__*/React.createElement("button", {
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
  }, "Unlock for Dev")))), /*#__PURE__*/React.createElement("div", {
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
      preset: selectedFramePreset || selectedPackCoverPreset || framePreset || allStorePresets[0] || null
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
  }, selectedFramePreset?.name || 'Selected preset'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10.5,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, selectedFramePreset ? `${selectedFramePreset.layout} · ${selectedFramePreset.photoSlots?.length || 0}컷 · ${selectedFramePreset.category}` : 'No preset selected')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, selectedFramePreset && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, selectedFramePreset.source === 'custom' ? 'My Frame' : 'Preset'), selectedFramePresetId && selectedFramePresetId === selectedFramePreset?.id && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T
  }, "Active"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      minHeight: 170,
      background: 'rgba(26,26,31,0.02)',
      borderRadius: 16
    }
  }, WFrameThumb ? /*#__PURE__*/React.createElement(WFrameThumb, {
    key: `${selectedFramePreset?.id || layout}-${selectedFramePreset?.updatedAt || 'selected'}`,
    layout: selectedFramePreset?.layout || layout,
    shots: shotsPreview,
    selected: [0, 1, 2, 3],
    T: T,
    logo: false,
    dateText: false,
    accent: accent,
    scale: mobile ? 0.96 : 1.08,
    orientation: "portrait",
    frameColor: frameColor,
    framePreset: selectedFramePreset
  }) : /*#__PURE__*/React.createElement(FramePickerFallback, {
    layout: selectedFramePreset?.layout || layout,
    T: T,
    size: "lg"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => selectedFramePreset && applyFramePreset && applyFramePreset(selectedFramePreset),
    disabled: !selectedFramePreset,
    style: {
      border: 'none',
      borderRadius: 999,
      padding: '10px 14px',
      minHeight: 44,
      background: selectedFramePreset ? T.ink : 'rgba(26,26,31,0.06)',
      color: selectedFramePreset ? T.bg : T.inkSoft,
      cursor: selectedFramePreset ? 'pointer' : 'default',
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
        marginTop: 8,
        display: 'grid',
        placeItems: 'center',
        minHeight: 126
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
      framePreset: preset
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
      var suggested = selectedFramePreset?.name ? `${selectedFramePreset.name} Copy` : 'My Frame';
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
  }, "No saved frames yet. Save a decorated setup or deco state to build your library."), /*#__PURE__*/React.createElement("div", {
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
        display: 'grid',
        placeItems: 'center'
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
      framePreset: preset
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
    }, preset.author?.name || 'IMMM Studio', " \xB7 ", preset.license || 'internal')), /*#__PURE__*/React.createElement("div", {
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
    }, "Imported"), /*#__PURE__*/React.createElement("span", {
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
    }, favoriteFramePresetIds.includes(preset.id) ? 'Favorited' : 'Favorite'), isCustom && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
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
    var _loop = async function () {
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
      if (await _loop()) break;
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
  setSelectedFramePresetId
}) {
  var frameApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  var WFrameThumb = typeof window !== 'undefined' && typeof window.FrameThumb === 'function' ? window.FrameThumb : null;
  var previewRef = uR(null);
  var dragRef = uR(null);
  var [activeTab, setActiveTab] = uS('layout');
  var [selectedSlotIndex, setSelectedSlotIndex] = uS(0);
  var [selectedDecorationIndex, setSelectedDecorationIndex] = uS(0);
  var [statusMessage, setStatusMessage] = uS('');
  var [validationError, setValidationError] = uS('');
  var [exportPackName, setExportPackName] = uS(draftFrame?.name || 'Designer Pack Draft');
  var [exportPackDescription, setExportPackDescription] = uS('Designer pack draft.');
  var [exportPackTags, setExportPackTags] = uS((draftFrame?.tags || []).join(', '));
  var [exportPackAuthor, setExportPackAuthor] = uS(draftFrame?.author?.name || 'IMMM Studio');
  var [exportPackLicense, setExportPackLicense] = uS(draftFrame?.license || 'internal');
  var [importPackJson, setImportPackJson] = uS('');
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
  var tabs = [{
    id: 'layout',
    label: 'Layout'
  }, {
    id: 'background',
    label: 'Background'
  }, {
    id: 'slots',
    label: 'Slots'
  }, {
    id: 'decorations',
    label: 'Decorations'
  }, {
    id: 'text',
    label: 'Text'
  }, {
    id: 'save',
    label: 'Save'
  }];
  var currentLayoutSlots = normalizedDraft?.photoSlots || [];
  var currentDecorations = normalizedDraft?.decorations || [];
  var selectedSlot = currentLayoutSlots[selectedSlotIndex] || currentLayoutSlots[0] || null;
  var selectedDecoration = currentDecorations[selectedDecorationIndex] || currentDecorations[0] || null;
  var slotCount = currentLayoutSlots.length;
  var previewCanvas = normalizedDraft?.canvasSize || frameApi?.getCanvasSizeForLayout?.(normalizedDraft?.layout || layout) || {
    width: 560,
    height: 1808
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
      next[index] = frameApi?.clampRectToCanvas?.({
        ...next[index],
        ...patch
      }, prev.canvasSize, 24, 24) || {
        ...next[index],
        ...patch
      };
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
      next[index] = frameApi?.normalizeDesignerDraft?.({
        ...prev,
        decorations: next.map((deco, i) => i === index ? {
          ...deco,
          ...patch
        } : deco)
      })?.decorations?.[index] || {
        ...next[index],
        ...patch
      };
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
  var startDrag = (kind, index, mode = 'move') => event => {
    if (!previewRef.current || !normalizedDraft) return;
    event.preventDefault();
    event.stopPropagation();
    var rect = previewRef.current.getBoundingClientRect();
    dragRef.current = {
      kind,
      index,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      snapshot: frameApi?.normalizeDesignerDraft?.(normalizedDraft) || normalizedDraft
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
  }, [currentDecorations.length, currentLayoutSlots.length, normalizedDraft]);
  React.useEffect(() => {
    var onMove = event => {
      var drag = dragRef.current;
      if (!drag || !drag.snapshot) return;
      var scaleX = (drag.snapshot.canvasSize?.width || 1) / Math.max(1, drag.rect.width);
      var scaleY = (drag.snapshot.canvasSize?.height || 1) / Math.max(1, drag.rect.height);
      var dx = (event.clientX - drag.startX) * scaleX;
      var dy = (event.clientY - drag.startY) * scaleY;
      event.preventDefault();
      normalizeNextDraft(prev => {
        var base = frameApi?.normalizeDesignerDraft?.(prev || drag.snapshot) || prev || drag.snapshot;
        if (drag.kind === 'slot') {
          var nextSlots = [...(base.photoSlots || [])];
          var source = nextSlots[drag.index];
          if (!source) return base;
          var patch = drag.mode === 'resize' ? {
            width: source.width + dx,
            height: source.height + dy
          } : {
            x: source.x + dx,
            y: source.y + dy
          };
          nextSlots[drag.index] = frameApi?.clampRectToCanvas?.({
            ...source,
            ...patch
          }, base.canvasSize, 24, 24) || {
            ...source,
            ...patch
          };
          return {
            ...base,
            photoSlots: nextSlots
          };
        }
        if (drag.kind === 'decor') {
          var nextDecos = [...(base.decorations || [])];
          var _source = nextDecos[drag.index];
          if (!_source) return base;
          var _patch = drag.mode === 'resize' ? {
            width: _source.width + dx,
            height: _source.height + dy
          } : {
            x: _source.x + dx,
            y: _source.y + dy
          };
          nextDecos[drag.index] = frameApi?.normalizeDesignerDraft?.({
            ...base,
            decorations: nextDecos.map((item, i) => i === drag.index ? {
              ...item,
              ..._patch
            } : item)
          })?.decorations?.[drag.index] || {
            ..._source,
            ..._patch
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
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [frameApi, normalizedDraft]);
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
    go('setup');
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
    go('setup');
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
    go('setup');
  };
  var handleDiscard = () => {
    if (isDirty && !window.confirm('Discard designer changes?')) return;
    setDraftFrame(normalizedInitial || normalizedDraft);
    setDesignerMode('edit');
    go('setup');
  };
  if (!normalizedDraft) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        padding: 24,
        background: T.bg,
        color: T.ink,
        fontFamily: '"Plus Jakarta Sans", Pretendard, system-ui'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800
      }
    }, "Designer draft loading..."));
  }
  var previewWidth = 540;
  var previewHeight = Math.round(previewWidth * (previewCanvas.height / previewCanvas.width));
  var editorShell = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? '1fr' : 'minmax(0, 1.15fr) minmax(300px, 0.85fr)',
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
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('setup'),
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
  }, "Save Frame"))), /*#__PURE__*/React.createElement("div", {
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
  }, tab.label))), /*#__PURE__*/React.createElement("div", {
    ref: previewRef,
    style: {
      position: 'relative',
      width: '100%',
      maxWidth: '100%',
      aspectRatio: `${previewCanvas.width} / ${previewCanvas.height}`,
      borderRadius: 18,
      overflow: 'hidden',
      border: `1px solid ${T.line}`,
      background: '#F8F8F5',
      touchAction: 'none'
    }
  }, WFrameThumb ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(WFrameThumb, {
    key: `${normalizedDraft.id}-${normalizedDraft.updatedAt || 'draft'}`,
    layout: normalizedDraft.layout,
    shots: previewShots,
    selected: previewShots.map((_, i) => i),
    T: T,
    logo: false,
    dateText: false,
    accent: T.pinkDeep,
    scale: 1,
    orientation: "portrait",
    frameColor: normalizedDraft.frameColor,
    framePreset: normalizedDraft
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      placeItems: 'center',
      height: '100%'
    }
  }, "Preview unavailable"), currentLayoutSlots.map((slot, index) => {
    var active = selectedSlotIndex === index;
    return /*#__PURE__*/React.createElement("div", {
      key: `slot-${index}`,
      onPointerDown: startDrag('slot', index, 'move'),
      style: {
        position: 'absolute',
        left: `${slot.x / previewCanvas.width * 100}%`,
        top: `${slot.y / previewCanvas.height * 100}%`,
        width: `${slot.width / previewCanvas.width * 100}%`,
        height: `${slot.height / previewCanvas.height * 100}%`,
        borderRadius: Math.max(8, slot.radius / Math.max(1, slot.width) * 100 * 0.5),
        boxSizing: 'border-box',
        border: `2px solid ${active ? T.ink : 'rgba(26,26,31,0.28)'}`,
        background: active ? 'rgba(26,26,31,0.04)' : 'rgba(255,255,255,0.04)',
        cursor: 'move'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 4,
        left: 4,
        padding: '2px 5px',
        borderRadius: 999,
        background: active ? T.ink : 'rgba(26,26,31,0.65)',
        color: active ? T.bg : '#fff',
        fontSize: 9,
        fontWeight: 800
      }
    }, index + 1), /*#__PURE__*/React.createElement("div", {
      onPointerDown: startDrag('slot', index, 'resize'),
      style: {
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 14,
        height: 14,
        borderRadius: 4,
        background: T.ink,
        cursor: 'nwse-resize'
      }
    }));
  }), currentDecorations.map((deco, index) => {
    var active = selectedDecorationIndex === index;
    var x = deco.x || 0;
    var y = deco.y || 0;
    var w = deco.width || 80;
    var h = deco.height || 80;
    return /*#__PURE__*/React.createElement("div", {
      key: deco.id || index,
      onPointerDown: startDrag('decor', index, 'move'),
      style: {
        position: 'absolute',
        left: `${x / previewCanvas.width * 100}%`,
        top: `${y / previewCanvas.height * 100}%`,
        width: `${w / previewCanvas.width * 100}%`,
        height: `${h / previewCanvas.height * 100}%`,
        border: `2px solid ${active ? T.ink : 'rgba(26,26,31,0.18)'}`,
        background: deco.type === 'text' ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,31,0.04)',
        borderRadius: deco.shape === 'circle' ? 999 : 10,
        display: 'grid',
        placeItems: 'center',
        cursor: 'move',
        boxSizing: 'border-box',
        opacity: deco.opacity ?? 1,
        transform: `rotate(${deco.rotation || 0}deg)`
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: deco.type === 'text' ? 12 : 10,
        fontWeight: 800,
        color: deco.fill || T.ink,
        textAlign: 'center',
        padding: 4
      }
    }, deco.type === 'text' ? deco.text || 'TEXT' : deco.shape || 'shape'), /*#__PURE__*/React.createElement("div", {
      onPointerDown: startDrag('decor', index, 'resize'),
      style: {
        position: 'absolute',
        right: -3,
        bottom: -3,
        width: 14,
        height: 14,
        borderRadius: 4,
        background: T.ink,
        cursor: 'nwse-resize'
      }
    }));
  })))), /*#__PURE__*/React.createElement("div", {
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
  }, "Status"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, isDirty ? 'Unsaved' : 'Saved'), designerBasePresetId && /*#__PURE__*/React.createElement(StoreBadge, {
    T: T,
    tone: "light"
  }, designerBasePresetId))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft
    }
  }, validation.ok ? 'Draft is valid.' : validation.error), statusMessage && /*#__PURE__*/React.createElement("div", {
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
  }, "Layout"), /*#__PURE__*/React.createElement("input", {
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
    placeholder: "Frame name"
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
  }, nextLayout))), /*#__PURE__*/React.createElement("button", {
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
  }, "Background"), /*#__PURE__*/React.createElement("div", {
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
    value: String(normalizedDraft.background?.value || '#ffffff'),
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
  }, "Opacity"), /*#__PURE__*/React.createElement("input", {
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
      });else setBackgroundPatch({
        type: 'solid',
        value: normalizedDraft.background?.value || '#FFFFFF'
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
  }, "Solid"), /*#__PURE__*/React.createElement("option", {
    value: "gradient"
  }, "Gradient"), /*#__PURE__*/React.createElement("option", {
    value: "pattern"
  }, "Pattern")), normalizedDraft.background?.type === 'gradient' && /*#__PURE__*/React.createElement("div", {
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
  }, "Bubbles")))), activeTab === 'slots' && /*#__PURE__*/React.createElement("div", {
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
  }, label)))), activeTab === 'decorations' && /*#__PURE__*/React.createElement("div", {
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
  }, "Decorations"), /*#__PURE__*/React.createElement("div", {
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
  }, "Delete")))), activeTab === 'text' && /*#__PURE__*/React.createElement("div", {
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
  }, "Text / Watermark"), /*#__PURE__*/React.createElement("button", {
    onClick: () => addDecoration('TEXT', 'text'),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      background: '#fff',
      fontSize: 11,
      fontWeight: 800,
      textTransform: 'uppercase'
    }
  }, "Add text"), selectedDecoration?.type === 'text' && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, "Text", /*#__PURE__*/React.createElement("input", {
    value: selectedDecoration.text || '',
    onChange: e => setDecorationPatch(selectedDecorationIndex, {
      text: e.target.value
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
  }, "Font weight", /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: Number(selectedDecoration.fontWeight || 800),
    onChange: e => setDecorationPatch(selectedDecorationIndex, {
      fontWeight: Number(e.target.value)
    }),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  }))), /*#__PURE__*/React.createElement("div", {
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
  }, "Watermark"), /*#__PURE__*/React.createElement("input", {
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
    placeholder: "IMMM"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8
    }
  }, ['x', 'y', 'opacity'].map(key => /*#__PURE__*/React.createElement("label", {
    key: key,
    style: {
      display: 'grid',
      gap: 4,
      fontSize: 11,
      color: T.inkSoft
    }
  }, key.toUpperCase(), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: key === 'opacity' ? '0.01' : '0.01',
    value: Number(normalizedDraft.watermark?.[key] ?? (key === 'opacity' ? 0.48 : 0.5)),
    onChange: e => normalizeNextDraft(prev => ({
      ...prev,
      watermark: {
        ...(prev.watermark || {}),
        [key]: Number(e.target.value)
      }
    })),
    style: {
      minHeight: 44,
      borderRadius: 12,
      border: `1px solid ${T.line}`,
      padding: '0 10px',
      fontSize: 12
    }
  })))))), activeTab === 'save' && /*#__PURE__*/React.createElement("div", {
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
  }, "Save / Pack Export"), /*#__PURE__*/React.createElement("input", {
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
  }, "Save as Pack Draft"), /*#__PURE__*/React.createElement("div", {
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