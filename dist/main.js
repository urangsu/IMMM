function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// main.jsx — IMMM Photobooth real app entry (no prototype chrome) - Refresh trigger

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    console.error('[IMMM] React render failed:', error, info);
    if (window.__showBootError) {
      window.__showBootError(error?.message || String(error), null, null, null, error);
    }
  }
  handleReload() {
    location.reload();
  }
  handleCopyDiagnostics() {
    var snap = window.IMMM_DIAGNOSTICS && typeof window.IMMM_DIAGNOSTICS.getSnapshot === 'function' ? window.IMMM_DIAGNOSTICS.getSnapshot() : {
      error: 'IMMM_DIAGNOSTICS not available',
      timestamp: new Date().toISOString()
    };
    var text = JSON.stringify(snap, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('진단 정보 복사됨')).catch(() => prompt('진단 정보:', text));
    } else {
      prompt('진단 정보:', text);
    }
  }
  render() {
    if (this.state.error) {
      var version = window.IMMM_APP_VERSION || 'unknown';
      var buildLabel = window.IMMM_BUILD_LABEL || '';
      return /*#__PURE__*/React.createElement("div", {
        style: {
          minHeight: '100vh',
          padding: 24,
          background: '#fff',
          color: '#111',
          fontFamily: 'Pretendard,system-ui'
        }
      }, /*#__PURE__*/React.createElement("h1", {
        style: {
          margin: '0 0 8px',
          fontSize: 20
        }
      }, "\uC571\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694."), /*#__PURE__*/React.createElement("p", {
        style: {
          margin: '0 0 4px',
          color: '#666',
          lineHeight: 1.5
        }
      }, "\uBE0C\uB77C\uC6B0\uC800 \uD638\uD658\uC131 \uB610\uB294 \uC2A4\uD06C\uB9BD\uD2B8 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("p", {
        style: {
          margin: '0 0 16px',
          color: '#999',
          fontSize: 11
        }
      }, "\uBC84\uC804: ", version, buildLabel ? ` · ${buildLabel}` : '', " \xB7 \uB7F0\uD0C0\uC784: precompiled"), /*#__PURE__*/React.createElement("pre", {
        style: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#f4f4f4',
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          marginBottom: 16
        }
      }, this.state.error?.stack || this.state.error?.message || String(this.state.error)), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => this.handleReload(),
        style: {
          padding: '10px 20px',
          background: '#007AFF',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer'
        }
      }, "\uC571 \uC7AC\uC2DC\uC791"), /*#__PURE__*/React.createElement("button", {
        onClick: () => this.handleCopyDiagnostics(),
        style: {
          padding: '10px 20px',
          background: '#555',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer'
        }
      }, "\uC9C4\uB2E8 \uBCF5\uC0AC")));
    }
    return this.props.children;
  }
}

// EMERGENCY BOOT GUARD:
// Check if critical frame system globals are available before rendering.
// This prevents silent failures and "ReferenceError: getFrameTemplate is not defined" crashes on Samsung Internet.
(() => {
  var missingFrameGlobals = [];
  if (typeof window.getFrameTemplateSafe !== 'function' && typeof window.getFrameTemplate !== 'function') missingFrameGlobals.push('getFrameTemplate');
  if (typeof window.renderComposition !== 'function') missingFrameGlobals.push('renderComposition');
  if (!window.FrameRenderEngine) missingFrameGlobals.push('FrameRenderEngine');
  if (missingFrameGlobals.length) {
    console.error('[IMMM boot] missing frame globals:', missingFrameGlobals);
    // We don't crash here to allow some basic UI to show, but log loudly.
  }
})();

// MARK: - Camera Model Helpers

function deriveCameraZoomOptions({
  cameraCapabilities,
  facingMode,
  frontWideCandidates,
  rearWideCandidates,
  wideCameraActive,
  normalCameraDeviceId
}) {
  var options = [{
    label: '0.6×',
    value: 0.6,
    type: 'unavailable',
    enabled: false,
    reason: 'not-detected'
  }, {
    label: '1×',
    value: 1,
    type: 'hardware',
    enabled: true,
    reason: 'default'
  }, {
    label: '2×',
    value: 2,
    type: 'unavailable',
    enabled: false,
    reason: 'not-supported'
  }];
  var zoomCap = cameraCapabilities?.zoom;
  var candidates = facingMode === 'user' ? frontWideCandidates : rearWideCandidates;
  if (zoomCap && zoomCap.min <= 0.6) {
    options[0] = {
      ...options[0],
      type: 'hardware',
      enabled: true,
      reason: 'hardware-zoom'
    };
  } else if (candidates?.[0]?.deviceId) {
    options[0] = {
      ...options[0],
      type: 'lens',
      enabled: true,
      reason: 'wide-device',
      deviceId: candidates[0].deviceId
    };
  }
  if (zoomCap && zoomCap.max >= 2) {
    options[2] = {
      ...options[2],
      type: 'hardware',
      enabled: true,
      reason: 'hardware-zoom'
    };
  }
  if (wideCameraActive && normalCameraDeviceId) {
    options[1] = {
      ...options[1],
      type: 'lens-return',
      enabled: true,
      reason: 'normal-device',
      deviceId: normalCameraDeviceId
    };
  }
  return options;
}
function getCaptureShotCountForLayout(layout) {
  // Align with frame system shot counts via getShotCountForLayout
  var getShotCount = window.getShotCountForFrameSafe || window.getShotCountForFrame || (typeof getShotCountForFrame === 'function' ? getShotCountForFrame : null);
  if (getShotCount) return getShotCount(layout);
  if (layout === 'polaroid') return 3;
  if (layout === 'trip') return 5;
  return 6;
}

// MARK: - Debug Runtime Session Bridge Helpers (Phase 3.63)

function isSessionDebugEnabled() {
  return Boolean(window.IMMM_DEBUG_SESSION);
}
function publishDebugSessionSnapshot(label, payload) {
  if (!isSessionDebugEnabled()) return null;
  var RuntimeSnapshot = window.IMMMSessionRuntimeSnapshot;
  if (!RuntimeSnapshot || typeof RuntimeSnapshot.createDebugSessionSnapshot !== 'function') {
    return null;
  }
  var result = RuntimeSnapshot.createDebugSessionSnapshot(payload);
  if (result && result.ok) {
    RuntimeSnapshot.storeLastDebugSessionSnapshot({
      label,
      createdAt: new Date().toISOString(),
      result
    });
    console.debug('[IMMM session snapshot]', label, result);
  } else {
    console.debug('[IMMM session snapshot failed]', label, result);
  }
  return result;
}
function publishDebugShareReadiness({
  shareState,
  resultAsset
}) {
  if (!isSessionDebugEnabled()) return null;
  var Share = window.IMMMShareContract;
  if (!Share) return null;
  var report = Share.createShareReadinessReport({
    shareState,
    resultAsset
  });
  window.__IMMM_LAST_SHARE_READINESS__ = report;
  console.debug('[IMMM share readiness]', report);
  return report;
}
function publishDebugMotionReadiness({
  layout,
  selected,
  renderRecipe
}) {
  if (!isSessionDebugEnabled()) return null;
  var Motion = window.IMMMMotionExportContract;
  if (!Motion) return null;
  var report = Motion.createMotionReadinessReport({
    layout,
    selectedCount: Array.isArray(selected) ? selected.length : 0,
    renderRecipe
  });
  window.__IMMM_LAST_MOTION_READINESS__ = report;
  console.debug('[IMMM motion readiness]', report);
  return report;
}
function createDebugEditRecipeSnapshot(appState) {
  if (!isSessionDebugEnabled()) return null;
  var Edit = window.IMMMEditRecipeContract;
  if (!Edit) return null;
  try {
    var recipe = Edit.createCompositeEditRecipe({
      edits: [Edit.createBlurRecipe({
        blurType: 'background',
        strength: (appState?.blur || 0) / 100
      }), Edit.createFilterRecipe({
        filterId: appState?.filterId || appState?.filter || 'original',
        intensity: appState?.intensity ?? 1
      })]
    });
    var validation = Edit.validateEditRecipe(recipe);
    window.__IMMM_LAST_EDIT_RECIPE__ = {
      recipe,
      validation
    };
    console.debug('[IMMM edit recipe]', {
      recipe,
      validation
    });
    return {
      recipe,
      validation
    };
  } catch (error) {
    console.debug('[IMMM edit recipe error]', error);
    return null;
  }
}
function App() {
  var [tweaks, setTweaks] = React.useState({
    variant: 'A',
    layout: 'strip',
    orientation: 'portrait',
    filter: 'smooth',
    sound: true,
    logo: true,
    dateText: true,
    frameColor: '#ffffff',
    useWebgl: window.innerWidth >= 640 // Default off on mobile for stability
  });
  var [screen, setScreen] = React.useState(() => {
    if (location.hash.startsWith('#/s/')) return 'share';
    var stored = 'landing';
    try {
      stored = localStorage.getItem('immm.v2.screen') || 'landing';
    } catch (_) {}
    // Designer is draft-backed and cannot be restored safely from screen state alone.
    if (stored === 'designer') return 'setup';
    return stored;
  });

  // Session tracking for state isolation
  var [activeSessionId, setActiveSessionId] = React.useState(() => {
    var id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SESSION_START:activeSessionId', {
        activeSessionId: id
      });
    }
    return id;
  });
  var [shots, setShots] = React.useState(() => Array(6).fill(null));
  var [selected, setSelected] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('immm.v2.sel') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [preStickers, setPreStickers] = React.useState([]);
  var [stickers, setStickers] = React.useState([]);
  var [drawStrokes, setDrawStrokes] = React.useState([]);
  var [photoEditMode, setPhotoEditMode] = React.useState(false);
  var [lang, setLang] = React.useState('ko');
  var [customFrames, setCustomFrames] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.loadCustomFramePresets === 'function') {
        return api.loadCustomFramePresets();
      }
      return JSON.parse(localStorage.getItem('immm.v2.customFrames') || '[]');
    } catch (e) {
      console.warn('[IMMM] custom frame load failed:', e);
      return [];
    }
  });
  var [selectedFramePresetId, setSelectedFramePresetId] = React.useState(() => {
    try {
      return localStorage.getItem('immm.v2.selectedFramePresetId') || '';
    } catch (e) {
      return '';
    }
  });
  var [unlockedFramePackIds, setUnlockedFramePackIds] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.getUnlockedFramePackIds === 'function') {
        return api.getUnlockedFramePackIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.unlockedFramePacks') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [favoriteFramePresetIds, setFavoriteFramePresetIds] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.loadFavoriteFramePresetIds === 'function') {
        return api.loadFavoriteFramePresetIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.favoriteFramePresets') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [favoriteFramePackIds, setFavoriteFramePackIds] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.loadFavoriteFramePackIds === 'function') {
        return api.loadFavoriteFramePackIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.favoriteFramePacks') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [frameLikeIds, setFrameLikeIds] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.getFrameLikeIds === 'function') {
        return api.getFrameLikeIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.frameLikes') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [frameUseCounts, setFrameUseCounts] = React.useState(() => {
    try {
      var api = window.IMMMFramePresets;
      if (api && typeof api.getFrameUseCounts === 'function') {
        return api.getFrameUseCounts();
      }
      return JSON.parse(localStorage.getItem('immm.v2.frameUses') || '{}');
    } catch (e) {
      return {};
    }
  });
  var [creatorProfiles, setCreatorProfiles] = React.useState(() => {
    try {
      var api = window.IMMMCreatorProfiles;
      if (api && typeof api.loadCreatorProfiles === 'function') {
        return api.loadCreatorProfiles();
      }
      return JSON.parse(localStorage.getItem('immm.v2.creatorProfiles') || '[]');
    } catch (e) {
      return [];
    }
  });
  var [exportPresetId, setExportPresetId] = React.useState(() => {
    try {
      return localStorage.getItem('immm.v2.exportPresetId') || 'hd';
    } catch (e) {
      return 'hd';
    }
  });
  var [designerDraftFrame, setDesignerDraftFrame] = React.useState(null);
  var [designerInitialDraftFrame, setDesignerInitialDraftFrame] = React.useState(null);
  var [designerBasePresetId, setDesignerBasePresetId] = React.useState('');
  var [designerMode, setDesignerMode] = React.useState('new');
  var [designerDraftRecovery, setDesignerDraftRecovery] = React.useState(null);
  var [setupStoreTabFocus, setSetupStoreTabFocus] = React.useState('');

  // Responsive mobile detection
  var [mobile, setMobile] = React.useState(() => window.innerWidth < 640);
  React.useEffect(() => {
    var handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  var safeFilter = typeof getSafeFilterKey === 'function' ? getSafeFilterKey(tweaks.filter) : tweaks.filter;
  var framePresetApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  var creatorApi = typeof window !== 'undefined' ? window.IMMMCreatorProfiles : null;
  var framePresetList = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.listFramePresets === 'function') {
      return framePresetApi.listFramePresets(customFrames);
    }
    return customFrames;
  }, [framePresetApi, customFrames]);
  var framePackList = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getFramePacks === 'function') {
      return framePresetApi.getFramePacks(customFrames);
    }
    return [];
  }, [framePresetApi, customFrames]);
  var activeFramePreset = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getFramePresetById === 'function') {
      return framePresetApi.getFramePresetById(selectedFramePresetId, customFrames);
    }
    return framePresetList.find(preset => preset.id === selectedFramePresetId) || null;
  }, [framePresetApi, selectedFramePresetId, customFrames, framePresetList]);
  var defaultFramePresetId = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getDefaultFramePresetIdForLayout === 'function') {
      return framePresetApi.getDefaultFramePresetIdForLayout(tweaks.layout, customFrames);
    }
    var first = framePresetList.find(preset => preset.layout === tweaks.layout);
    return first ? first.id : '';
  }, [framePresetApi, tweaks.layout, customFrames, framePresetList]);
  var normalizePresetLayout = React.useCallback(layout => {
    if (framePresetApi && typeof framePresetApi.normalizePresetLayout === 'function') {
      return framePresetApi.normalizePresetLayout(layout);
    }
    if (layout === '1x4' || layout === 'strip') return 'strip';
    if (layout === '2x2' || layout === 'grid') return 'grid';
    if (layout === '1x3' || layout === 'trip') return 'trip';
    if (layout === '1x1' || layout === 'polaroid') return 'polaroid';
    return 'strip';
  }, [framePresetApi]);
  var getLayoutTemplate = React.useCallback(layout => {
    var normalized = normalizePresetLayout(layout);
    if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
      return window.getFrameTemplateSafe(normalized);
    }
    if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
      return window.getFrameTemplate(normalized);
    }
    return null;
  }, [normalizePresetLayout]);
  var getLayoutSlotCount = React.useCallback(layout => {
    var template = getLayoutTemplate(layout);
    if (template?.photoSlots?.length) return template.photoSlots.length;
    var normalized = normalizePresetLayout(layout);
    if (normalized === 'polaroid') return 1;
    if (normalized === 'trip') return 3;
    return 4;
  }, [getLayoutTemplate, normalizePresetLayout]);
  var getLayoutCaptureCount = React.useCallback(layout => {
    var normalized = normalizePresetLayout(layout);
    return getCaptureShotCountForLayout(normalized);
  }, [normalizePresetLayout]);

  // EMERGENCY FACE SHAPE SAFETY:
  // Disabling ALL face-tracked filters and geometry warp to prevent distortion on Galaxy/Samsung Internet.
  var faceTrackedFilters = [];
  var isSamsungInternet = () => {
    if (typeof navigator === 'undefined') return false;
    var ua = navigator.userAgent || '';
    return /SamsungBrowser/i.test(ua);
  };
  var forceSafeCameraMode = isSamsungInternet();

  // shouldUseWebgl: forced OFF on Samsung Internet for emergency safety.
  var shouldUseWebgl = !forceSafeCameraMode && tweaks.useWebgl;
  var [cameraBox, setCameraBox] = React.useState(null);
  var [debugBuildVisible, setDebugBuildVisible] = React.useState(false);
  React.useEffect(() => {
    console.info('[IMMM build]', {
      version: window.IMMM_APP_VERSION,
      label: window.IMMM_BUILD_LABEL,
      rcBaseline: window.IMMM_RC_BASELINE,
      stableBaseline: window.IMMM_STABLE_BASELINE,
      cacheName: 'immm-cache-v6-2026-05-10-rc2.2'
    });
    var tick = () => {
      setDebugBuildVisible(window.IMMM_DEBUG_CAMERA === true || window.IMMM_DEBUG_BUILD === true);
    };
    tick();
    var id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);
  var BuildPill = () => {
    if (!debugBuildVisible) return null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        right: 10,
        bottom: 'calc(var(--sab) + 10px)',
        zIndex: 9000,
        padding: '4px 8px',
        borderRadius: 6,
        background: 'rgba(0,0,0,0.45)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 600,
        pointerEvents: 'none',
        fontFamily: 'monospace',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }
    }, "IMMM ", window.IMMM_APP_VERSION, " \xB7 ", window.IMMM_RC_BASELINE, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 8,
        opacity: 0.8,
        marginTop: 2
      }
    }, window.IMMM_BUILD_LABEL));
  };

  // IMMM_DIAGNOSTICS — functional API, updated on key state changes
  React.useEffect(() => {
    var getSnapshot = () => ({
      appVersion: window.IMMM_APP_VERSION || 'unknown',
      buildLabel: window.IMMM_BUILD_LABEL || 'unknown',
      runtime: 'precompiled',
      screen: screen,
      sessionIdTail: activeSessionId ? activeSessionId.slice(-8) : 'none',
      shotsCount: shots.filter(s => s?.dataUrl).length,
      selectedCount: selected.length,
      stickersCount: stickers.length,
      drawStrokesCount: drawStrokes.length,
      layout: tweaks.layout,
      frameColor: tweaks.frameColor,
      facingMode: facingMode,
      cameraZoomSupported: cameraZoomSupported,
      cameraZoomCurrent: cameraZoom,
      torchSupported: torchSupported,
      torchActive: torchActive,
      screenLightActive: screenLightActive,
      serviceWorkerControlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    var copySnapshot = async () => {
      var snap = getSnapshot();
      var text = JSON.stringify(snap, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        return {
          ok: true
        };
      } catch (e) {
        return {
          ok: false,
          error: e.message
        };
      }
    };
    window.IMMM_DIAGNOSTICS = {
      getSnapshot,
      copySnapshot
    };
  }, [screen, activeSessionId, shots, selected, stickers, drawStrokes, tweaks.layout, tweaks.frameColor, facingMode, cameraZoomSupported, cameraZoom, torchSupported, torchActive, screenLightActive]);

  // PWA update one-shot reload guard
  React.useEffect(() => {
    if (!navigator.serviceWorker) return;
    var reloadScheduled = false;
    var onControllerChange = () => {
      if (!reloadScheduled && !window.__IMMM_RELOADING_FOR_UPDATE) {
        reloadScheduled = true;
        window.__IMMM_RELOADING_FOR_UPDATE = true;
        setTimeout(() => location.reload(), 500);
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  // Field Test Panel — visible when window.IMMM_FIELD_TEST or ?fieldTest=1
  var [showFieldTest, setShowFieldTest] = React.useState(false);
  var [fieldTestOpen, setFieldTestOpen] = React.useState(false);
  React.useEffect(() => {
    if (window.IMMM_FIELD_TEST === true || new URLSearchParams(location.search).get('fieldTest') === '1') {
      setShowFieldTest(true);
    }
  }, []);
  var FieldTestPanel = () => {
    if (!showFieldTest) return null;
    var lsSize = (() => {
      try {
        return localStorage.length;
      } catch (e) {
        return 'n/a';
      }
    })();
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'fixed',
        bottom: 10,
        left: 10,
        zIndex: 9990
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setFieldTestOpen(o => !o),
      style: {
        padding: '4px 10px',
        background: 'rgba(0,80,0,0.85)',
        color: '#0f0',
        border: 'none',
        borderRadius: 6,
        fontSize: 11,
        fontFamily: 'monospace',
        cursor: 'pointer'
      }
    }, "FT"), fieldTestOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 28,
        left: 0,
        background: 'rgba(0,0,0,0.88)',
        color: '#0f0',
        fontSize: 11,
        fontFamily: 'monospace',
        padding: 10,
        borderRadius: 8,
        minWidth: 240,
        maxHeight: 260,
        overflow: 'auto'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 4,
        fontWeight: 'bold'
      }
    }, "Field Test Panel"), /*#__PURE__*/React.createElement("div", null, "screen: ", screen), /*#__PURE__*/React.createElement("div", null, "session: \u2026", activeSessionId ? activeSessionId.slice(-8) : 'none'), /*#__PURE__*/React.createElement("div", null, "shots: ", shots.filter(s => s?.dataUrl).length, " / ", shots.length), /*#__PURE__*/React.createElement("div", null, "selected: ", selected.length), /*#__PURE__*/React.createElement("div", null, "stickers: ", stickers.length), /*#__PURE__*/React.createElement("div", null, "camera: ", facingMode, " zoom:", cameraZoom), /*#__PURE__*/React.createElement("div", null, "torch: ", torchActive ? 'on' : 'off', " | screenLight: ", screenLightActive ? 'on' : 'off'), /*#__PURE__*/React.createElement("div", null, "SW: ", navigator.serviceWorker && navigator.serviceWorker.controller ? 'active' : 'none'), /*#__PURE__*/React.createElement("div", null, "LS keys: ", lsSize), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: async () => {
        if (window.IMMM_DIAGNOSTICS) {
          var r = await window.IMMM_DIAGNOSTICS.copySnapshot();
          alert(r.ok ? 'Copied' : r.error);
        }
      },
      style: {
        padding: '3px 8px',
        background: '#003300',
        color: '#0f0',
        border: '1px solid #0f0',
        borderRadius: 4,
        fontSize: 10,
        cursor: 'pointer'
      }
    }, "Copy Diag"), /*#__PURE__*/React.createElement("button", {
      onClick: () => location.reload(),
      style: {
        padding: '3px 8px',
        background: '#003300',
        color: '#0f0',
        border: '1px solid #0f0',
        borderRadius: 4,
        fontSize: 10,
        cursor: 'pointer'
      }
    }, "Reload"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setFieldTestOpen(false),
      style: {
        padding: '3px 8px',
        background: '#003300',
        color: '#0f0',
        border: '1px solid #0f0',
        borderRadius: 4,
        fontSize: 10,
        cursor: 'pointer'
      }
    }, "Close"))));
  };

  // ═══════════════════════════════════════════════════════════════
  // Persistent Background Engine (Pre-warming)
  var videoRef = React.useRef(null);
  var canvasRef = React.useRef(null);

  // EMERGENCY FACE SHAPE SAFETY:
  // Face landmarks are globally disabled until Galaxy/Samsung Internet distortion is fully resolved.
  // Do not call useFaceLandmarks in production path.
  var FACE_LANDMARKS_DISABLED = true;
  var faceDataRef = React.useRef({
    detected: false,
    faces: []
  });
  var [facingMode, setFacingMode] = React.useState('user');
  var [camOk, setCamOk] = React.useState(null);
  var streamRef = React.useRef(null);
  var [cameraZoom, setCameraZoomState] = React.useState(1);
  var [cameraCapabilities, setCameraCapabilities] = React.useState(null);
  var [cameraSettings, setCameraSettings] = React.useState(null);
  var [frontWideCandidates, setFrontWideCandidates] = React.useState([]);
  var [rearWideCandidates, setRearWideCandidates] = React.useState([]);
  var [cameraDevices, setCameraDevices] = React.useState([]);
  var [activeCameraDeviceId, setActiveCameraDeviceId] = React.useState(null);
  var [normalCameraDeviceId, setNormalCameraDeviceId] = React.useState(null);
  var [wideCameraActive, setWideCameraActive] = React.useState(false);
  var [lastWideToggleReason, setLastWideToggleReason] = React.useState('');
  var [lastWideTogglePath, setLastWideTogglePath] = React.useState('');
  var [cameraToggleBusy, setCameraToggleBusy] = React.useState(false);
  // Zoom capability detection
  var [cameraZoomSupported, setCameraZoomSupported] = React.useState(false);
  var [cameraZoomMin, setCameraZoomMin] = React.useState(1);
  var [cameraZoomMax, setCameraZoomMax] = React.useState(1);
  var [cameraZoomStep, setCameraZoomStep] = React.useState(0.1);
  var [cameraZoomUnavailableReason, setCameraZoomUnavailableReason] = React.useState(null);

  // Torch capability detection
  var [torchSupported, setTorchSupported] = React.useState(false);
  var [torchActive, setTorchActive] = React.useState(false);
  var [torchUnavailableReason, setTorchUnavailableReason] = React.useState(null);

  // Screen light for front camera (selfie flash)
  var [screenLightSupported, setScreenLightSupported] = React.useState(true);
  var [screenLightActive, setScreenLightActive] = React.useState(false); // user toggle: selfie flash mode on/off
  var [screenFlashOverlay, setScreenFlashOverlay] = React.useState(false); // white overlay currently rendering
  var [cameraZoomHistory, setCameraZoomHistory] = React.useState([]);
  var pushCameraZoomHistory = React.useCallback(entry => {
    if (!window.IMMM_DEBUG_CAMERA) return;
    setCameraZoomHistory(prev => [{
      ts: Date.now(),
      ...entry
    }, ...prev].slice(0, 10));
  }, []);

  // Session reset helper: clears main app state without wiping persisted storage wholesale
  var resetSessionState = React.useCallback((reason = 'new-session', shotCount = 6) => {
    console.debug(`[IMMM] Resetting session (${reason}, shotCount=${shotCount})`);

    // Clear capture state
    setShots(Array(shotCount).fill(null));
    setSelected([]);
    try {
      localStorage.removeItem('immm.v2.sel');
    } catch (e) {
      console.warn('[IMMM] localStorage removeItem failed:', e);
    }

    // Clear deco state
    setStickers([]);
    setDrawStrokes([]);
    setPreStickers([]);

    // Clear photo edit state
    setPhotoEditMode(false);

    // Generate new session ID for state isolation
    var nextSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setActiveSessionId(nextSessionId);
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SESSION_RESET:sessionId', {
        reason,
        previousSessionId: activeSessionId,
        newSessionId: nextSessionId,
        shotCount
      });
    }
  }, [activeSessionId]);

  // Explicit new capture session start (called from New Session button, not from go)
  var startNewCaptureSession = React.useCallback(() => {
    var newShotCount = getCaptureShotCountForLayout(tweaks.layout);
    resetSessionState('start-new-capture', newShotCount);
    setScreen('capture');
  }, [tweaks.layout, resetSessionState]);
  var cameraZoomOptions = React.useMemo(() => deriveCameraZoomOptions({
    cameraCapabilities,
    facingMode,
    frontWideCandidates,
    rearWideCandidates,
    wideCameraActive,
    normalCameraDeviceId
  }), [cameraCapabilities, facingMode, frontWideCandidates, rearWideCandidates, wideCameraActive, normalCameraDeviceId]);
  var getCameraDebugSnapshot = React.useCallback((label, extra = {}) => {
    var track = streamRef.current?.getVideoTracks?.()[0] || null;
    var settings = track?.getSettings?.() || {};
    var capabilities = typeof track?.getCapabilities === 'function' ? track.getCapabilities() : {};
    var constraints = typeof track?.getConstraints === 'function' ? track.getConstraints() : {};
    return {
      label,
      trackLabel: track?.label || '',
      readyState: track?.readyState || 'none',
      deviceId: settings.deviceId || '',
      facingMode: settings.facingMode || '',
      width: settings.width || null,
      height: settings.height || null,
      aspectRatio: settings.aspectRatio || null,
      zoom: settings.zoom,
      zoomCap: capabilities.zoom ? {
        min: capabilities.zoom.min,
        max: capabilities.zoom.max,
        step: capabilities.zoom.step
      } : null,
      constraintZoom: constraints.zoom,
      activeCameraDeviceId,
      normalCameraDeviceId,
      wideCameraActive,
      ...extra
    };
  }, [activeCameraDeviceId, normalCameraDeviceId, wideCameraActive]);
  var refreshCameraDevices = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      var devices = await navigator.mediaDevices.enumerateDevices();
      var vidInputs = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(vidInputs);
      var wideKeywords = ['ultra', 'wide', '0.5', '0.6', '광각', '초광각'];
      var frontKeywords = ['front', 'user', 'face', 'selfie', '전면', '셀카'];
      var rearKeywords = ['back', 'rear', 'environment', '후면'];
      var hasAny = (label, words) => words.some(kw => (label || '').toLowerCase().includes(kw));
      var frontWide = vidInputs.filter(d => {
        var label = (d.label || '').toLowerCase();
        var score = (label.includes('ultra') ? 2 : 0) + (label.includes('wide') ? 1 : 0) + (label.includes('0.5') ? 2 : 0) + (label.includes('0.6') ? 2 : 0) + (label.includes('초광각') ? 2 : 0) + (label.includes('광각') ? 1 : 0);
        return score >= 1 && hasAny(label, frontKeywords);
      });
      var rearWide = vidInputs.filter(d => {
        var label = (d.label || '').toLowerCase();
        var score = (label.includes('ultra') ? 2 : 0) + (label.includes('wide') ? 1 : 0) + (label.includes('0.5') ? 2 : 0) + (label.includes('0.6') ? 2 : 0) + (label.includes('초광각') ? 2 : 0) + (label.includes('광각') ? 1 : 0);
        return score >= 1 && hasAny(label, rearKeywords);
      });
      setFrontWideCandidates(frontWide);
      setRearWideCandidates(rearWide);
      if (window.IMMM_DEBUG_CAMERA) {
        console.info('[IMMM camera] devices:', vidInputs);
        console.info('[IMMM camera] front wide candidates:', frontWide);
        console.info('[IMMM camera] rear wide candidates:', rearWide);
      }
    } catch (e) {
      if (window.IMMM_DEBUG_CAMERA) {
        console.warn('[IMMM camera] enumerateDevices failed:', e);
      }
    }
  }, []);

  // useFilterEngine stays active from the start, warming up shaders
  var {
    engineRef,
    webglOk,
    firstFrame,
    webglFailed
  } = typeof useFilterEngine === 'function' ? useFilterEngine(canvasRef, videoRef, safeFilter, faceDataRef, !shouldUseWebgl, facingMode === 'user', mobile) : {
    engineRef: null,
    webglOk: false,
    firstFrame: false,
    webglFailed: false
  };

  // Shared Camera Stream
  React.useEffect(() => {
    var active = true;
    var stopStream = stream => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    (async () => {
      try {
        stopStream(streamRef.current);
        streamRef.current = null;
        var s = null;
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: facingMode
              },
              width: {
                ideal: 1920
              },
              height: {
                ideal: 1080
              },
              frameRate: {
                ideal: 30,
                max: 60
              }
            },
            audio: false
          });
        } catch (e1) {
          try {
            s = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: {
                  ideal: facingMode
                },
                width: {
                  ideal: 1280
                },
                height: {
                  ideal: 720
                },
                frameRate: {
                  ideal: 30,
                  max: 60
                }
              },
              audio: false
            });
          } catch (e2) {
            s = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: {
                  ideal: facingMode
                }
              },
              audio: false
            });
          }
        }
        if (!active) {
          s.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = s;
        setCamOk(true);
        var track = s.getVideoTracks()[0];
        if (track) {
          var settings = track.getSettings ? track.getSettings() : {};
          var capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
          var constraints = track.getConstraints ? track.getConstraints() : {};
          setCameraSettings(settings);
          setCameraCapabilities(capabilities);
          setCameraZoomState(settings.zoom ?? 1);
          setActiveCameraDeviceId(settings.deviceId || null);
          if (!wideCameraActive && !normalCameraDeviceId) {
            setNormalCameraDeviceId(settings.deviceId || null);
          }
          if (window.IMMM_DEBUG_CAMERA) {
            var snap = {
              label: track.label,
              readyState: track.readyState,
              deviceId: settings.deviceId,
              facingMode: settings.facingMode,
              res: `${settings.width}x${settings.height}`,
              zoom: settings.zoom,
              caps: capabilities.zoom ? `${capabilities.zoom.min}-${capabilities.zoom.max}` : 'none'
            };
            console.info('[IMMM camera] capability snapshot:', snap);
          }
          // Zoom capability detection
          if (capabilities.zoom) {
            setCameraZoomSupported(true);
            setCameraZoomMin(capabilities.zoom.min ?? 1);
            setCameraZoomMax(capabilities.zoom.max ?? 1);
            setCameraZoomStep(capabilities.zoom.step ?? 0.1);
            setCameraZoomUnavailableReason(null);
          } else {
            setCameraZoomSupported(false);
            setCameraZoomMin(1);
            setCameraZoomMax(1);
            setCameraZoomUnavailableReason(facingMode === 'user' ? 'front-camera-no-zoom' : 'hardware-no-zoom');
          }

          // Torch capability detection
          if (capabilities.torch) {
            setTorchSupported(true);
            setTorchUnavailableReason(null);
            setTorchActive(settings.torch || false);
          } else {
            setTorchSupported(false);
            setTorchUnavailableReason(facingMode === 'user' ? 'front-camera-no-torch' : 'hardware-no-torch');
            setTorchActive(false);
          }

          // enumerateDevices after permission granted to get labels for wide candidates
          await refreshCameraDevices();
        }
        if (videoRef.current) {
          // webkit-playsinline must be set BEFORE srcObject+play on Samsung Internet
          videoRef.current.setAttribute('webkit-playsinline', '');
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error('[IMMM camera] getUserMedia total failure:', e);
        setCamOk(false);
      }
    })();
    return () => {
      active = false;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [facingMode]);
  var applyCameraZoom = React.useCallback(async zoom => {
    var track = streamRef.current?.getVideoTracks?.()[0];
    var snapBefore = getCameraDebugSnapshot('zoom-start');
    if (!track) {
      return {
        ok: false,
        path: 'hardware-zoom',
        reason: 'no-track',
        snapBefore
      };
    }
    var caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
    if (!caps.zoom) {
      return {
        ok: false,
        path: 'hardware-zoom',
        reason: 'no-zoom-capability',
        snapBefore
      };
    }
    var min = caps.zoom.min ?? 1;
    var max = caps.zoom.max ?? 1;
    var step = caps.zoom.step ?? 0.01;
    if (zoom < min || zoom > max) {
      return {
        ok: false,
        path: 'hardware-zoom',
        reason: `zoom-out-of-range(${zoom.toFixed(2)} not in ${min}-${max})`,
        snapBefore
      };
    }
    try {
      await track.applyConstraints({
        advanced: [{
          zoom
        }]
      });

      // Verification
      await new Promise(r => requestAnimationFrame(r));
      var afterSettings = track.getSettings?.() || {};
      var afterZoom = afterSettings.zoom;
      var snapAfter = getCameraDebugSnapshot('zoom-end');
      if (afterZoom === undefined) {
        pushCameraZoomHistory({
          requestedZoom: zoom,
          path: 'hardware-zoom',
          reason: 'zoom-settings-unavailable',
          snapBefore,
          snapAfter
        });
        return {
          ok: false,
          path: 'hardware-zoom',
          reason: 'zoom-settings-unavailable',
          snapBefore,
          snapAfter
        };
      }
      var diff = Math.abs(afterZoom - zoom);
      if (diff <= step * 2 + 0.05) {
        setCameraZoomState(afterZoom);
        setCameraSettings(afterSettings);
        pushCameraZoomHistory({
          requestedZoom: zoom,
          path: 'hardware-zoom',
          reason: 'success',
          snapBefore,
          snapAfter
        });
        return {
          ok: true,
          path: 'hardware-zoom',
          reason: 'success',
          beforeZoom: snapBefore.zoom,
          afterZoom,
          snapBefore,
          snapAfter
        };
      } else {
        pushCameraZoomHistory({
          requestedZoom: zoom,
          path: 'hardware-zoom',
          reason: `zoom-unchanged(${afterZoom})`,
          snapBefore,
          snapAfter
        });
        return {
          ok: false,
          path: 'hardware-zoom',
          reason: `zoom-unchanged(requested ${zoom.toFixed(2)}, got ${afterZoom.toFixed(2)})`,
          snapBefore,
          snapAfter
        };
      }
    } catch (e) {
      console.warn('[IMMM camera] zoom apply failed:', e);
      pushCameraZoomHistory({
        requestedZoom: zoom,
        path: 'hardware-zoom',
        reason: `zoom-error(${e.name})`,
        snapBefore
      });
      return {
        ok: false,
        path: 'hardware-zoom',
        reason: `zoom-error(${e.name})`,
        snapBefore
      };
    }
  }, [getCameraDebugSnapshot]);
  var switchCameraDevice = React.useCallback(async deviceId => {
    if (!deviceId) return {
      ok: false,
      path: 'device-switch',
      reason: 'no-target-device'
    };
    var snapBefore = getCameraDebugSnapshot('switch-start', {
      targetDeviceId: deviceId
    });
    var beforeDeviceId = cameraSettings?.deviceId;
    try {
      var next = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: {
            exact: deviceId
          },
          width: {
            ideal: 1920
          },
          height: {
            ideal: 1080
          }
        },
        audio: false
      });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = next;
      if (videoRef.current) {
        videoRef.current.srcObject = next;
        await videoRef.current.play().catch(() => {});
      }
      var track = next.getVideoTracks()[0];
      var settings = track.getSettings?.() || {};
      var capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
      setCameraSettings(settings);
      setCameraCapabilities(capabilities);
      setCameraZoomState(settings.zoom ?? 1);
      setActiveCameraDeviceId(settings.deviceId || deviceId);
      var isWide = [...frontWideCandidates, ...rearWideCandidates].some(d => d.deviceId === (settings.deviceId || deviceId));
      setWideCameraActive(isWide);
      var snapAfter = getCameraDebugSnapshot('switch-end');
      var deviceIdMatches = settings.deviceId === deviceId || beforeDeviceId && settings.deviceId !== beforeDeviceId;
      if (deviceIdMatches) {
        await refreshCameraDevices();
        pushCameraZoomHistory({
          requestedDeviceId: deviceId,
          path: 'device-switch',
          reason: 'success',
          snapBefore,
          snapAfter
        });
        return {
          ok: true,
          path: 'device-switch',
          reason: 'success',
          snapBefore,
          snapAfter
        };
      } else {
        var labelChanged = snapAfter.trackLabel && snapAfter.trackLabel !== snapBefore.trackLabel;
        var resolutionChanged = snapAfter.width !== snapBefore.width || snapAfter.height !== snapBefore.height;
        if (labelChanged || resolutionChanged) {
          await refreshCameraDevices();
          pushCameraZoomHistory({
            requestedDeviceId: deviceId,
            path: 'device-switch',
            reason: 'unverified-success',
            snapBefore,
            snapAfter
          });
          return {
            ok: true,
            path: 'device-switch',
            reason: 'unverified-device-switch',
            snapBefore,
            snapAfter
          };
        }
        pushCameraZoomHistory({
          requestedDeviceId: deviceId,
          path: 'device-switch',
          reason: 'device-not-switched',
          snapBefore,
          snapAfter
        });
        return {
          ok: false,
          path: 'device-switch',
          reason: 'device-not-switched',
          snapBefore,
          snapAfter
        };
      }
    } catch (e) {
      console.warn('[IMMM camera] switchCameraDevice failed:', e);
      pushCameraZoomHistory({
        requestedDeviceId: deviceId,
        path: 'device-switch',
        reason: `switch-failed(${e.name})`,
        snapBefore
      });
      return {
        ok: false,
        path: 'device-switch',
        reason: `switch-failed(${e.name})`,
        snapBefore
      };
    }
  }, [refreshCameraDevices, frontWideCandidates, rearWideCandidates, cameraSettings?.deviceId, getCameraDebugSnapshot]);
  var setCameraTorch = React.useCallback(async enabled => {
    var track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return false;
    try {
      await track.applyConstraints({
        advanced: [{
          torch: enabled
        }]
      });
      setTorchActive(enabled);
      return true;
    } catch (e) {
      console.warn('[IMMM camera] torch failed:', e);
      return false;
    }
  }, [torchSupported]);
  var runScreenFlash = React.useCallback(async () => {
    if (!screenLightActive || facingMode !== 'user') return;
    setScreenFlashOverlay(true);
    await new Promise(r => setTimeout(r, 450));
    setScreenFlashOverlay(false);
  }, [screenLightActive, facingMode]);
  var setCameraZoom = React.useCallback(async val => {
    if (cameraToggleBusy) return false;
    setCameraToggleBusy(true);
    var result = {
      ok: false,
      path: 'zoom',
      reason: 'unknown'
    };
    try {
      if (val === 1 && wideCameraActive) {
        pushCameraZoomHistory({
          requestedZoom: 1,
          path: 'lens-return-start',
          wideCameraActive
        });
        var hwRes = await applyCameraZoom(1);
        if (hwRes.ok) {
          setWideCameraActive(false);
          result = {
            ...hwRes,
            path: 'hardware-return'
          };
          pushCameraZoomHistory({
            requestedZoom: 1,
            path: 'hardware-return',
            reason: 'success'
          });
          return true;
        }
        if (normalCameraDeviceId) {
          var devRes = await switchCameraDevice(normalCameraDeviceId);
          if (devRes.ok) {
            setWideCameraActive(false);
            result = {
              ...devRes,
              path: 'device-return'
            };
            pushCameraZoomHistory({
              requestedZoom: 1,
              path: 'device-return',
              reason: 'success'
            });
            return true;
          }
          result = {
            ok: false,
            path: 'failed-return',
            reason: `hw:${hwRes.reason};dev:${devRes.reason}`
          };
        } else {
          result = {
            ok: false,
            path: 'failed-return',
            reason: `hw:${hwRes.reason};no-normal-dev`
          };
        }
        pushCameraZoomHistory({
          requestedZoom: 1,
          path: 'failed-return',
          reason: result.reason
        });
        return false;
      }
      var opt = cameraZoomOptions.find(o => o.value === val);
      if (!opt || !opt.enabled) return false;
      pushCameraZoomHistory({
        requestedZoom: val,
        path: 'zoom-opt-start',
        optType: opt.type
      });
      if (opt.type === 'hardware') {
        var res = await applyCameraZoom(val);
        if (res.ok) {
          setWideCameraActive(val <= 0.75);
          result = res;
          return true;
        }
      } else if ((opt.type === 'lens' || opt.type === 'lens-return') && opt.deviceId) {
        var _res = await switchCameraDevice(opt.deviceId);
        if (_res.ok) {
          setWideCameraActive(opt.type === 'lens');
          result = _res;
          return true;
        }
      }
      return false;
    } finally {
      setLastWideToggleReason(result.reason || 'unknown');
      setLastWideTogglePath(result.path || 'none');
      setCameraToggleBusy(false);
    }
  }, [cameraToggleBusy, cameraZoomOptions, applyCameraZoom, switchCameraDevice, wideCameraActive, normalCameraDeviceId]);
  var onDebugSwitchCameraDevice = React.useCallback(async deviceId => {
    if (cameraToggleBusy) return {
      ok: false,
      path: 'manual-device-switch',
      reason: 'busy'
    };
    setCameraToggleBusy(true);
    var result = {
      ok: false,
      path: 'manual-device-switch',
      reason: 'unknown'
    };
    try {
      var res = await switchCameraDevice(deviceId);
      result = {
        ...res,
        path: res.ok ? 'manual-device-switch' : 'manual-device-switch-failed'
      };
      return result;
    } finally {
      setLastWideToggleReason(result.reason || 'unknown');
      setLastWideTogglePath(result.path || 'manual-device-switch');
      setCameraToggleBusy(false);
      if (window.IMMM_DEBUG_CAMERA) {
        console.info('[IMMM camera] manual device switch result:', result);
      }
    }
  }, [cameraToggleBusy, switchCameraDevice]);
  var toggleWideCamera = React.useCallback(async () => {
    if (cameraToggleBusy) return false;
    setCameraToggleBusy(true);
    var result = {
      ok: false,
      path: 'init',
      reason: 'starting'
    };
    var isCurrentlyWide = wideCameraActive || cameraSettings?.zoom != null && cameraSettings.zoom <= 0.75;
    try {
      // Path 1: Return to 1x
      if (isCurrentlyWide) {
        var hwRes = await applyCameraZoom(1);
        if (hwRes.ok) {
          setWideCameraActive(false);
          result = {
            ...hwRes,
            path: 'hardware-return'
          };
        } else if (normalCameraDeviceId) {
          var devRes = await switchCameraDevice(normalCameraDeviceId);
          if (devRes.ok) {
            setWideCameraActive(false);
            result = {
              ...devRes,
              path: 'device-return'
            };
          } else {
            result = {
              ok: false,
              path: 'failed-return',
              reason: `hardware:${hwRes.reason};device:${devRes.reason}`
            };
          }
        } else {
          result = {
            ok: false,
            path: 'failed-return',
            reason: `hardware:${hwRes.reason};device:no-normal-dev`
          };
        }
      } else {
        // Path 2: Go to 0.6x (Hardware first)
        var _hwRes = await applyCameraZoom(0.6);
        if (_hwRes.ok) {
          setWideCameraActive(true);
          result = {
            ..._hwRes,
            path: 'hardware-zoom'
          };
        } else {
          // Path 3: Go to 0.6x (Device switch fallback)
          var candidates = facingMode === 'user' ? frontWideCandidates : rearWideCandidates;
          var candidate = candidates?.[0];
          if (candidate?.deviceId) {
            var _devRes = await switchCameraDevice(candidate.deviceId);
            if (_devRes.ok) {
              setWideCameraActive(true);
              result = {
                ..._devRes,
                path: 'device-switch'
              };
            } else {
              result = {
                ok: false,
                path: 'failed-wide',
                reason: `hardware:${_hwRes.reason};device:${_devRes.reason}`
              };
            }
          } else {
            result = {
              ok: false,
              path: 'failed-wide',
              reason: `hardware:${_hwRes.reason};device:no-candidates`
            };
          }
        }
      }
    } finally {
      setLastWideToggleReason(result.reason || 'unknown');
      setLastWideTogglePath(result.path || 'none');
      setCameraToggleBusy(false);
      if (window.IMMM_DEBUG_CAMERA) {
        console.info('[IMMM camera] toggleWideCamera result:', result);
      }
    }
    return result.ok;
  }, [cameraSettings, wideCameraActive, normalCameraDeviceId, facingMode, frontWideCandidates, rearWideCandidates, applyCameraZoom, switchCameraDevice, cameraToggleBusy]);
  React.useEffect(() => {
    var onHash = () => {
      if (location.hash.startsWith('#/s/')) setScreen('share');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => {
    if (screen === 'share') return;
    var persistedScreen = screen === 'designer' ? 'setup' : screen;
    localStorage.setItem('immm.v2.screen', persistedScreen);
  }, [screen]);
  React.useEffect(() => {
    try {
      if (customFrames.length > 0) {
        localStorage.setItem('immm.v2.customFrames', JSON.stringify(customFrames));
      } else {
        localStorage.removeItem('immm.v2.customFrames');
      }
    } catch (e) {
      console.warn('[IMMM] custom frame sync failed:', e);
    }
  }, [customFrames]);
  React.useEffect(() => {
    try {
      if (selectedFramePresetId) {
        localStorage.setItem('immm.v2.selectedFramePresetId', selectedFramePresetId);
      } else {
        localStorage.removeItem('immm.v2.selectedFramePresetId');
      }
    } catch (e) {
      console.warn('[IMMM] selected frame sync failed:', e);
    }
  }, [selectedFramePresetId]);
  React.useEffect(() => {
    try {
      if (unlockedFramePackIds.length > 0) {
        localStorage.setItem('immm.v2.unlockedFramePacks', JSON.stringify(Array.from(new Set(unlockedFramePackIds))));
      } else {
        localStorage.removeItem('immm.v2.unlockedFramePacks');
      }
    } catch (e) {
      console.warn('[IMMM] unlocked frame pack sync failed:', e);
    }
  }, [unlockedFramePackIds]);
  React.useEffect(() => {
    try {
      if (favoriteFramePresetIds.length > 0) {
        localStorage.setItem('immm.v2.favoriteFramePresets', JSON.stringify(Array.from(new Set(favoriteFramePresetIds))));
      } else {
        localStorage.removeItem('immm.v2.favoriteFramePresets');
      }
    } catch (e) {
      console.warn('[IMMM] favorite frame sync failed:', e);
    }
  }, [favoriteFramePresetIds]);
  React.useEffect(() => {
    try {
      if (favoriteFramePackIds.length > 0) {
        localStorage.setItem('immm.v2.favoriteFramePacks', JSON.stringify(Array.from(new Set(favoriteFramePackIds))));
      } else {
        localStorage.removeItem('immm.v2.favoriteFramePacks');
      }
    } catch (e) {
      console.warn('[IMMM] favorite pack sync failed:', e);
    }
  }, [favoriteFramePackIds]);
  React.useEffect(() => {
    try {
      localStorage.setItem('immm.v2.frameLikes', JSON.stringify(Array.from(new Set(frameLikeIds))));
    } catch (e) {
      console.warn('[IMMM] frame likes sync failed:', e);
    }
  }, [frameLikeIds]);
  React.useEffect(() => {
    try {
      localStorage.setItem('immm.v2.frameUses', JSON.stringify(frameUseCounts || {}));
    } catch (e) {
      console.warn('[IMMM] frame uses sync failed:', e);
    }
  }, [frameUseCounts]);
  React.useEffect(() => {
    try {
      if (creatorProfiles.length > 0) {
        localStorage.setItem('immm.v2.creatorProfiles', JSON.stringify(creatorProfiles));
      } else {
        localStorage.removeItem('immm.v2.creatorProfiles');
      }
    } catch (e) {
      console.warn('[IMMM] creator profile sync failed:', e);
    }
  }, [creatorProfiles]);
  React.useEffect(() => {
    try {
      localStorage.setItem('immm.v2.exportPresetId', exportPresetId || 'hd');
    } catch (e) {
      console.warn('[IMMM] export preset sync failed:', e);
    }
  }, [exportPresetId]);
  React.useEffect(() => {
    var recovered = framePresetApi?.loadDesignerDraftRecovery?.() || null;
    setDesignerDraftRecovery(recovered);
  }, [framePresetApi]);
  React.useEffect(() => {
    if (!designerDraftFrame) return;
    var payload = framePresetApi?.saveDesignerDraftRecovery?.(designerDraftFrame);
    if (payload) setDesignerDraftRecovery(payload);
  }, [designerDraftFrame, framePresetApi]);
  React.useEffect(() => {
    if (!defaultFramePresetId) return;
    var hasSelected = selectedFramePresetId && framePresetList.some(preset => preset.id === selectedFramePresetId);
    if (!hasSelected) {
      setSelectedFramePresetId(defaultFramePresetId);
    }
  }, [defaultFramePresetId, framePresetList, selectedFramePresetId]);
  React.useEffect(() => {
    if (!activeFramePreset?.layout) return;
    var nextLayout = normalizePresetLayout(activeFramePreset.layout);
    if (tweaks.layout !== nextLayout) {
      var slotCount = getLayoutSlotCount(nextLayout);
      var captureCount = getLayoutCaptureCount(nextLayout);
      var nextSelected = Array.isArray(selected) ? selected.filter(index => Number.isInteger(index) && index >= 0 && index < slotCount).slice(0, slotCount) : [];
      var safeSelected = nextSelected.length > 0 ? nextSelected : Array.from({
        length: slotCount
      }, (_, i) => i);
      var nextShots = Array.isArray(shots) ? shots.slice(0, captureCount) : [];
      while (nextShots.length < captureCount) nextShots.push(null);
      setSelectedFramePresetId(activeFramePreset.id || '');
      setSelected(safeSelected);
      setShots(nextShots);
      updateTweak('layout', nextLayout);
      updateTweak('orientation', 'portrait');
      if (activeFramePreset.frameColor && activeFramePreset.background?.type === 'solid') {
        updateTweak('frameColor', activeFramePreset.frameColor);
      }
      try {
        localStorage.setItem('immm.v2.selectedFramePresetId', activeFramePreset.id || '');
        if (safeSelected.length > 0) {
          localStorage.setItem('immm.v2.sel', JSON.stringify(safeSelected));
        } else {
          localStorage.removeItem('immm.v2.sel');
        }
      } catch (e) {
        console.warn('[IMMM] frame preset sync failed:', e);
      }
    }
  }, [activeFramePreset?.background?.type, activeFramePreset?.frameColor, activeFramePreset?.id, activeFramePreset?.layout, getLayoutCaptureCount, getLayoutSlotCount, normalizePresetLayout, selected, shots, setSelected, setSelectedFramePresetId, setShots, tweaks.layout]);
  React.useEffect(() => {
    try {
      if (selected.length > 0) {
        localStorage.setItem('immm.v2.sel', JSON.stringify(selected));
      } else {
        localStorage.removeItem('immm.v2.sel');
      }
    } catch (e) {
      console.warn('[IMMM] localStorage selected sync failed:', e);
    }
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('STATE_UPDATE:selected', {
        activeSessionId,
        selectedLength: selected.length,
        selected: selected.slice()
      });
    }
  }, [selected, activeSessionId]);

  // Samsung Internet suspends background video (opacity:0, zIndex:-1 screens).
  // Force-resume when user enters capture so the camera feed is guaranteed live.
  React.useEffect(() => {
    if (screen === 'capture' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [screen]);

  // Protected route guard: redirect to setup if protected screen has no photos in current session
  React.useEffect(() => {
    var protectedScreens = ['select', 'deco', 'result'];
    if (!protectedScreens.includes(screen)) return;
    var hasPhotosInCurrentSession = shots.some(s => s?.dataUrl);
    if (!hasPhotosInCurrentSession) {
      setScreen('setup');
      try {
        localStorage.setItem('immm.v2.screen', 'setup');
      } catch (e) {
        console.warn('[IMMM] localStorage update failed:', e);
      }
    }
  }, [screen, shots]);
  var go = s => {
    if (s === 'deco' && stickers.length === 0 && preStickers.length > 0) {
      setStickers([...preStickers]);
    }
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SCREEN_CHANGE:navigation', {
        from: screen,
        to: s,
        activeSessionId,
        shotsLength: shots.filter(s => s).length,
        selectedLength: selected.length
      });
    }
    // go() performs simple screen navigation only.
    // Do NOT reset session state here — use startNewCaptureSession() for explicit new session.
    setScreen(s);
  };
  var updateTweak = (k, v) => setTweaks(prev => ({
    ...prev,
    [k]: v
  }));
  var persistCustomFrames = React.useCallback(frames => {
    var nextFrames = Array.isArray(frames) ? frames : [];
    if (typeof framePresetApi?.saveCustomFramePresets === 'function') {
      var saved = framePresetApi.saveCustomFramePresets(nextFrames);
      setCustomFrames(saved);
      return saved;
    }
    try {
      localStorage.setItem('immm.v2.customFrames', JSON.stringify(nextFrames));
    } catch (e) {
      console.warn('[IMMM] custom frame persist failed:', e);
    }
    setCustomFrames(nextFrames);
    return nextFrames;
  }, [framePresetApi]);
  var applyFramePreset = React.useCallback((presetOrId, options = {}) => {
    var preset = typeof presetOrId === 'string' ? framePresetApi?.getFramePresetById?.(presetOrId, customFrames) || framePresetList.find(p => p.id === presetOrId) || null : presetOrId;
    if (!preset) return null;
    var pack = preset.packId ? framePresetApi?.getFramePackById?.(preset.packId, customFrames) : null;
    var packLocked = Boolean(pack?.locked && !(framePresetApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)));
    if (packLocked) {
      if (typeof options.onBlocked === 'function') {
        options.onBlocked({
          preset,
          pack
        });
      }
      return null;
    }
    var normalizedLayout = normalizePresetLayout(preset.layout || tweaks.layout);
    var slotCount = getLayoutSlotCount(normalizedLayout);
    var captureCount = getLayoutCaptureCount(normalizedLayout);
    var nextSelected = Array.isArray(selected) ? selected.filter(index => Number.isInteger(index) && index >= 0 && index < slotCount).slice(0, slotCount) : [];
    var safeSelected = nextSelected.length > 0 ? nextSelected : Array.from({
      length: slotCount
    }, (_, i) => i);
    var nextShots = Array.isArray(shots) ? shots.slice(0, captureCount) : [];
    while (nextShots.length < captureCount) nextShots.push(null);
    setSelectedFramePresetId(preset.id);
    setSelected(safeSelected);
    setShots(nextShots);
    if (tweaks.layout !== normalizedLayout) {
      updateTweak('layout', normalizedLayout);
    }
    if (tweaks.orientation !== 'portrait') {
      updateTweak('orientation', 'portrait');
    }
    if (options.syncFrameColor !== false && preset.frameColor && preset.background?.type === 'solid') {
      updateTweak('frameColor', preset.frameColor);
    }
    try {
      localStorage.setItem('immm.v2.selectedFramePresetId', preset.id);
      if (safeSelected.length > 0) {
        localStorage.setItem('immm.v2.sel', JSON.stringify(safeSelected));
      } else {
        localStorage.removeItem('immm.v2.sel');
      }
    } catch (e) {
      console.warn('[IMMM] selected frame sync failed:', e);
    }
    if (typeof options.onApply === 'function') {
      options.onApply(preset);
    }
    recordFrameUse(preset.id);
    return preset;
  }, [customFrames, framePresetApi, framePresetList, getLayoutCaptureCount, getLayoutSlotCount, normalizePresetLayout, recordFrameUse, selected, shots, tweaks.layout, tweaks.orientation, unlockedFramePackIds]);
  var saveCustomFrame = React.useCallback((input = {}) => {
    if (!framePresetApi || typeof framePresetApi.createCustomFramePresetFromAppState !== 'function') return null;
    var preset = framePresetApi.createCustomFramePresetFromAppState({
      name: input.name || 'My Frame',
      layout: input.layout || tweaks.layout,
      frameColor: input.frameColor || tweaks.frameColor,
      background: input.background || activeFramePreset?.background || {
        type: 'solid',
        value: input.frameColor || tweaks.frameColor || '#FFFFFF'
      },
      decorations: input.decorations || activeFramePreset?.decorations || [],
      stickers: input.stickers || [],
      drawStrokes: input.drawStrokes || [],
      photoSlots: input.photoSlots || activeFramePreset?.photoSlots,
      watermark: input.watermark || activeFramePreset?.watermark,
      canvasSize: input.canvasSize || activeFramePreset?.canvasSize
    });
    var next = [...customFrames.filter(item => item.id !== preset.id), preset];
    persistCustomFrames(next);
    applyFramePreset(preset, {
      syncFrameColor: true
    });
    return preset;
  }, [activeFramePreset, applyFramePreset, customFrames, framePresetApi, persistCustomFrames, tweaks.frameColor, tweaks.layout]);
  var exportCustomFramesAsJson = React.useCallback((options = {}) => {
    if (framePresetApi && typeof framePresetApi.exportCustomFramePackJson === 'function') {
      return framePresetApi.exportCustomFramePackJson(customFrames, {
        name: options.name || 'My Frames Export',
        description: options.description || 'Exported custom frames pack.',
        author: options.author || {
          name: 'You',
          handle: '',
          url: ''
        },
        license: options.license || 'personal',
        tags: Array.isArray(options.tags) ? options.tags : ['my-frames']
      });
    }
    return JSON.stringify({
      schemaVersion: '1.0.0',
      kind: 'frame-pack',
      exportedAt: new Date().toISOString(),
      pack: {},
      presets: []
    }, null, 2);
  }, [customFrames, framePresetApi]);
  var importFramePackFromJson = React.useCallback(raw => {
    if (!raw || !String(raw).trim()) {
      return {
        ok: false,
        error: 'Empty frame pack JSON'
      };
    }
    if (!framePresetApi || typeof framePresetApi.importFramePackJson !== 'function') {
      return {
        ok: false,
        error: 'Frame pack import is unavailable'
      };
    }
    var result = framePresetApi.importFramePackJson(String(raw));
    if (!result?.ok) return result;
    var importedFrames = Array.isArray(result.presets) ? result.presets : [];
    var next = [...customFrames.filter(frame => !importedFrames.some(incoming => incoming.id === frame.id)), ...importedFrames];
    persistCustomFrames(next);
    return result;
  }, [customFrames, framePresetApi, persistCustomFrames]);
  var renameCustomFrame = React.useCallback((frameId, nextName) => {
    var name = String(nextName || '').trim();
    if (!frameId || !name) return null;
    var now = new Date().toISOString();
    var next = customFrames.map(frame => frame.id === frameId ? {
      ...frame,
      name,
      updatedAt: now
    } : frame);
    persistCustomFrames(next);
    return next.find(frame => frame.id === frameId) || null;
  }, [customFrames, persistCustomFrames]);
  var duplicateCustomFrame = React.useCallback(frameId => {
    var source = customFrames.find(frame => frame.id === frameId);
    if (!source) return null;
    var now = new Date().toISOString();
    var copyId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    var copy = {
      ...source,
      id: copyId,
      name: `${source.name || 'My Frame'} Copy`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      source: 'custom'
    };
    var next = [...customFrames, copy];
    persistCustomFrames(next);
    setSelectedFramePresetId(copy.id);
    return copy;
  }, [customFrames, persistCustomFrames]);
  var softDeleteCustomFrame = React.useCallback(frameId => {
    if (!frameId) return null;
    var now = new Date().toISOString();
    var next = customFrames.map(frame => frame.id === frameId ? {
      ...frame,
      deletedAt: now,
      updatedAt: now
    } : frame);
    persistCustomFrames(next);
    if (selectedFramePresetId === frameId) {
      var fallbackId = framePresetApi?.getDefaultFramePresetIdForLayout?.(tweaks.layout, next) || '';
      setSelectedFramePresetId(fallbackId);
    }
    return next.find(frame => frame.id === frameId) || null;
  }, [customFrames, framePresetApi, persistCustomFrames, selectedFramePresetId, tweaks.layout]);
  var openDesigner = React.useCallback((input = {}) => {
    var mode = input.mode || 'new';
    var basePreset = input.preset || (input.presetId ? framePresetApi?.getFramePresetById?.(input.presetId, customFrames) : null) || activeFramePreset || framePresetList.find(preset => preset.source !== 'custom') || framePresetList[0] || null;
    var shouldDuplicate = mode === 'duplicate' || mode === 'new' && basePreset && basePreset.source !== 'custom';
    var created = shouldDuplicate ? framePresetApi?.duplicateFramePresetAsDraft?.(basePreset) : framePresetApi?.createFrameDesignerDraft?.(basePreset);
    if (!created) return null;
    var nextDraft = framePresetApi?.normalizeDesignerDraft?.(created) || created;
    if (mode === 'edit' && basePreset?.id) {
      nextDraft.id = basePreset.id;
    }
    setDesignerMode(mode);
    setDesignerBasePresetId(basePreset?.id || '');
    setDesignerDraftFrame(nextDraft);
    setDesignerInitialDraftFrame(nextDraft);
    setSetupStoreTabFocus(mode === 'edit' || mode === 'duplicate' || basePreset?.source === 'custom' ? 'my-frames' : 'featured');
    setScreen('designer');
    return nextDraft;
  }, [activeFramePreset, customFrames, framePresetApi, framePresetList]);
  React.useEffect(() => {
    if (screen !== 'designer' || designerDraftFrame || !framePresetApi) return;
    var recovered = framePresetApi.loadDesignerDraftRecovery?.();
    var recoveredDraft = recovered?.draft ? framePresetApi.normalizeDesignerDraft?.(recovered.draft) : null;
    var fallbackPreset = activeFramePreset || framePresetList.find(preset => preset.id === defaultFramePresetId) || framePresetList.find(preset => preset.source !== 'custom') || framePresetList[0] || null;
    var fallbackDraft = recoveredDraft || framePresetApi.createFrameDesignerDraft?.(fallbackPreset);
    var nextDraft = framePresetApi.normalizeDesignerDraft?.(fallbackDraft) || fallbackDraft;
    if (!nextDraft) {
      setScreen('setup');
      return;
    }
    setDesignerMode(recoveredDraft ? 'edit' : 'new');
    setDesignerBasePresetId(fallbackPreset?.id || '');
    setDesignerDraftFrame(nextDraft);
    setDesignerInitialDraftFrame(nextDraft);
  }, [activeFramePreset, defaultFramePresetId, designerDraftFrame, framePresetApi, framePresetList, screen]);
  var saveDesignerFrame = React.useCallback((inputDraft = null, options = {}) => {
    var targetDraft = inputDraft || designerDraftFrame;
    if (!targetDraft) {
      return {
        ok: false,
        error: 'Designer draft missing'
      };
    }
    var validation = framePresetApi?.validateDesignerDraft?.(targetDraft);
    if (!validation?.ok) {
      return validation || {
        ok: false,
        error: 'Designer draft invalid'
      };
    }
    var preset = framePresetApi?.draftToCustomFramePreset?.(validation.draft);
    if (!preset) {
      return {
        ok: false,
        error: 'Unable to save designer frame'
      };
    }
    var next = [...customFrames.filter(item => item.id !== preset.id), preset];
    persistCustomFrames(next);
    setSelectedFramePresetId(preset.id);
    setDesignerDraftFrame(validation.draft);
    setDesignerInitialDraftFrame(validation.draft);
    setDesignerMode('edit');
    framePresetApi?.clearDesignerDraftRecovery?.();
    setDesignerDraftRecovery(null);
    applyFramePreset(preset, {
      syncFrameColor: true
    });
    setSetupStoreTabFocus('my-frames');
    recordFrameUse(preset.id);
    if (options.stayOnDesigner) {
      return {
        ok: true,
        preset
      };
    }
    setScreen('setup');
    return {
      ok: true,
      preset
    };
  }, [applyFramePreset, customFrames, designerDraftFrame, framePresetApi, persistCustomFrames, recordFrameUse]);
  var saveDesignerPackDraft = React.useCallback((inputDraft = null, options = {}) => {
    var targetDraft = inputDraft || designerDraftFrame;
    if (!targetDraft) {
      return {
        ok: false,
        error: 'Designer draft missing'
      };
    }
    var validation = framePresetApi?.validateDesignerDraft?.(targetDraft);
    if (!validation?.ok) {
      return validation || {
        ok: false,
        error: 'Designer draft invalid'
      };
    }
    var preset = framePresetApi?.draftToCustomFramePreset?.(validation.draft);
    if (!preset) {
      return {
        ok: false,
        error: 'Unable to export pack draft'
      };
    }
    var json = framePresetApi?.exportCustomFramePackJson?.([preset], {
      id: options.id || preset.packId || preset.id,
      name: options.name || preset.name || 'Pack Draft',
      description: options.description || 'Designer pack draft.',
      author: options.author || preset.author,
      license: options.license || preset.license,
      tags: options.tags || preset.packTags || [],
      coverPresetId: preset.id
    });
    if (!json) {
      return {
        ok: false,
        error: 'Pack export unavailable'
      };
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
    framePresetApi?.clearDesignerDraftRecovery?.();
    setDesignerDraftRecovery(null);
    return {
      ok: true,
      json
    };
  }, [designerDraftFrame, framePresetApi]);
  var unlockFramePackForDev = React.useCallback(packId => {
    if (!packId) return [];
    var next = framePresetApi?.unlockFramePackForDev?.(packId) || Array.from(new Set([...unlockedFramePackIds, packId]));
    setUnlockedFramePackIds(next);
    return next;
  }, [framePresetApi, unlockedFramePackIds]);
  var toggleFavoriteFramePack = React.useCallback(packId => {
    if (!packId) return [];
    var next = framePresetApi?.toggleFavoriteFramePackId?.(packId, favoriteFramePackIds) || (favoriteFramePackIds.includes(packId) ? favoriteFramePackIds.filter(id => id !== packId) : [...favoriteFramePackIds, packId]);
    setFavoriteFramePackIds(next);
    return next;
  }, [favoriteFramePackIds, framePresetApi]);
  var toggleFavoriteFramePreset = React.useCallback(presetId => {
    if (!presetId) return [];
    var next = framePresetApi?.toggleFavoriteFramePresetId?.(presetId, favoriteFramePresetIds) || (favoriteFramePresetIds.includes(presetId) ? favoriteFramePresetIds.filter(id => id !== presetId) : [...favoriteFramePresetIds, presetId]);
    setFavoriteFramePresetIds(next);
    return next;
  }, [favoriteFramePresetIds, framePresetApi]);
  var toggleFrameLike = React.useCallback(frameId => {
    if (!frameId) return [];
    var next = framePresetApi?.toggleFrameLikeId?.(frameId, frameLikeIds) || (frameLikeIds.includes(frameId) ? frameLikeIds.filter(id => id !== frameId) : [...frameLikeIds, frameId]);
    setFrameLikeIds(next);
    return next;
  }, [frameLikeIds, framePresetApi]);
  var recordFrameUse = React.useCallback(frameId => {
    if (!frameId) return 0;
    var nextCount = framePresetApi?.incrementFrameUseCount?.(frameId) ?? (Number(frameUseCounts?.[frameId]) || 0) + 1;
    var next = {
      ...(frameUseCounts || {}),
      [frameId]: nextCount
    };
    setFrameUseCounts(next);
    return nextCount;
  }, [framePresetApi, frameUseCounts]);
  var setLayoutAndPreset = React.useCallback(layoutId => {
    var normalizedLayout = normalizePresetLayout(layoutId);
    var nextPresetId = framePresetApi?.getDefaultFramePresetIdForLayout?.(normalizedLayout, customFrames) || framePresetList.find(preset => preset.layout === normalizedLayout)?.id || '';
    if (nextPresetId) {
      var preset = framePresetApi?.getFramePresetById?.(nextPresetId, customFrames) || framePresetList.find(framePreset => framePreset.id === nextPresetId) || null;
      var pack = preset?.packId ? framePresetApi?.getFramePackById?.(preset.packId, customFrames) : null;
      var packLocked = Boolean(pack?.locked && !(framePresetApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)));
      if (preset && !packLocked) {
        applyFramePreset({
          ...preset,
          layout: normalizedLayout
        }, {
          syncFrameColor: true
        });
        return;
      }
    }
    updateTweak('layout', normalizedLayout);
    updateTweak('orientation', 'portrait');
    setSelectedFramePresetId('');
    var slotCount = getLayoutSlotCount(normalizedLayout);
    var captureCount = getLayoutCaptureCount(normalizedLayout);
    var nextSelected = Array.from({
      length: slotCount
    }, (_, i) => i);
    var nextShots = Array.from({
      length: captureCount
    }, (_, i) => shots[i] || null);
    setSelected(nextSelected);
    setShots(nextShots);
    try {
      if (nextPresetId) {
        localStorage.setItem('immm.v2.selectedFramePresetId', nextPresetId);
      } else {
        localStorage.removeItem('immm.v2.selectedFramePresetId');
      }
      localStorage.setItem('immm.v2.sel', JSON.stringify(nextSelected));
    } catch (e) {
      console.warn('[IMMM] layout preset sync failed:', e);
    }
  }, [applyFramePreset, customFrames, framePresetApi, framePresetList, getLayoutCaptureCount, getLayoutSlotCount, normalizePresetLayout, shots, unlockedFramePackIds]);
  var frameShotCount = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(tweaks.layout) : tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4;
  var captureShotCount = getCaptureShotCountForLayout(tweaks.layout);

  // Dummy-fill shots only when debug flag allows (prevents deep-link bypass)
  // Protected routes (select/deco/result) should NOT render with dummy shots in production.
  // Effect guard will redirect to setup if no real photos.
  var allowDummyFill = typeof window !== 'undefined' && window.IMMM_ALLOW_DEEP_LINK_DUMMY === true;
  var needsDummy = allowDummyFill && ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
  var effShots = needsDummy ? Array.from({
    length: captureShotCount
  }, () => ({
    dataUrl: null,
    filter: safeFilter
  })) : shots;
  var selectionCount = frameShotCount;
  var defaultSelected = Array.from({
    length: selectionCount
  }, (_, i) => i);
  var effSelected = selected.length === selectionCount ? selected : defaultSelected;
  var variant = tweaks.variant;
  var T = TOKENS[variant];
  var accent = T.pinkDeep;
  var commonProps = {
    T,
    go,
    mobile,
    variant,
    filter: safeFilter,
    layout: tweaks.layout,
    orientation: tweaks.orientation,
    logo: tweaks.logo,
    dateText: tweaks.dateText,
    frameColor: tweaks.frameColor,
    accent,
    tweaks,
    lang,
    setLang,
    activeSessionId,
    resetSessionState,
    selectedFramePresetId,
    setSelectedFramePresetId,
    framePresetList,
    framePackList,
    customFrames,
    setCustomFrames,
    designerDraftFrame,
    setDesignerDraftFrame,
    designerInitialDraftFrame,
    setDesignerInitialDraftFrame,
    designerBasePresetId,
    setDesignerBasePresetId,
    designerMode,
    setDesignerMode,
    setupStoreTabFocus,
    setSetupStoreTabFocus,
    activeFramePreset,
    applyFramePreset,
    saveCustomFrame,
    exportCustomFramesAsJson,
    importFramePackFromJson,
    openDesigner,
    saveDesignerFrame,
    saveDesignerPackDraft,
    renameCustomFrame,
    duplicateCustomFrame,
    deleteCustomFrame: softDeleteCustomFrame,
    unlockedFramePackIds,
    setUnlockedFramePackIds,
    favoriteFramePackIds,
    setFavoriteFramePackIds,
    favoriteFramePresetIds,
    setFavoriteFramePresetIds,
    unlockFramePackForDev,
    toggleFavoriteFramePack,
    toggleFavoriteFramePreset,
    toggleFrameLike,
    frameLikeIds,
    frameUseCounts,
    recordFrameUse,
    creatorProfiles,
    setCreatorProfiles,
    exportPresetId,
    setExportPresetId,
    getExportPresetById: framePresetApi?.getExportPresetById,
    getExportPresets: framePresetApi?.getExportPresets,
    getDefaultExportPresetId: framePresetApi?.getDefaultExportPresetId,
    generateFrameIdea: framePresetApi?.generateFrameIdea,
    loadDesignerDraftRecovery: framePresetApi?.loadDesignerDraftRecovery,
    saveDesignerDraftRecovery: framePresetApi?.saveDesignerDraftRecovery,
    clearDesignerDraftRecovery: framePresetApi?.clearDesignerDraftRecovery,
    designerDraftRecovery,
    setDesignerDraftRecovery,
    setLayoutAndPreset,
    cameraZoomSupported,
    cameraZoomMin,
    cameraZoomMax,
    cameraZoomStep,
    cameraZoomUnavailableReason,
    torchSupported,
    torchUnavailableReason,
    screenLightSupported,
    screenLightActive,
    setScreenLightActive
  };
  var renderScreen = () => {
    var p = {
      ...commonProps
    };
    switch (screen) {
      case 'landing':
        return /*#__PURE__*/React.createElement(LandingV2, _extends({}, p, {
          onStart: () => {
            setPhotoEditMode(false);
            go('setup');
          },
          onEdit: () => {
            setPhotoEditMode(true);
            go('setup');
          },
          onFrames: () => {
            setPhotoEditMode(false);
            go('setup');
          },
          onGallery: () => go('gallery')
        }));
      case 'gallery':
        return /*#__PURE__*/React.createElement(GalleryV2, p);
      case 'share':
        return /*#__PURE__*/React.createElement(SharedPhotoV2, p);
      case 'designer':
        return /*#__PURE__*/React.createElement(DesignerScreen, _extends({}, p, {
          draftFrame: designerDraftFrame,
          setDraftFrame: setDesignerDraftFrame,
          initialDraftFrame: designerInitialDraftFrame,
          designerBasePresetId: designerBasePresetId,
          designerMode: designerMode,
          setDesignerMode: setDesignerMode,
          saveDesignerFrame: saveDesignerFrame,
          saveDesignerPackDraft: saveDesignerPackDraft,
          openDesigner: openDesigner
        }));
      case 'setup':
        return /*#__PURE__*/React.createElement(SetupScreen, _extends({}, p, {
          setLayout: setLayoutAndPreset,
          setFilter: v => updateTweak('filter', v),
          setLogo: v => updateTweak('logo', v),
          setDateText: v => updateTweak('dateText', v),
          setOrientation: v => updateTweak('orientation', v),
          setFrameColor: v => updateTweak('frameColor', v),
          setUseWebgl: v => updateTweak('useWebgl', v),
          preStickers: preStickers,
          setPreStickers: setPreStickers,
          framePreset: activeFramePreset,
          framePresets: framePresetList,
          customFrames: customFrames,
          applyFramePreset: applyFramePreset,
          saveCustomFrame: saveCustomFrame,
          exportCustomFramesAsJson: exportCustomFramesAsJson,
          importFramePackFromJson: importFramePackFromJson,
          openDesigner: openDesigner,
          editMode: photoEditMode,
          shots: shots,
          setShots: setShots,
          setSelected: setSelected,
          startNewCaptureSession: startNewCaptureSession,
          storeTabFocus: setupStoreTabFocus
        }));
      case 'capture':
        return /*#__PURE__*/React.createElement(CaptureV2, _extends({}, p, {
          shots: shots,
          setShots: setShots,
          preStickers: preStickers,
          muted: !tweaks.sound,
          videoRef: videoRef,
          canvasRef: canvasRef,
          engineRef: engineRef,
          webglOk: webglOk,
          firstFrame: firstFrame,
          camOk: camOk,
          facingMode: facingMode,
          setFacingMode: setFacingMode,
          onCameraFrameChange: setCameraBox,
          faceDataRef: faceDataRef,
          cameraZoom: cameraZoom,
          cameraCapabilities: cameraCapabilities,
          cameraSettings: cameraSettings,
          cameraZoomOptions: cameraZoomOptions,
          cameraToggleBusy: cameraToggleBusy,
          torchSupported: torchSupported,
          torchActive: torchActive,
          screenFlashOverlay: screenFlashOverlay,
          setCameraZoom: setCameraZoom,
          setCameraTorch: setCameraTorch,
          runScreenFlash: runScreenFlash,
          applyCameraZoom: applyCameraZoom,
          switchCameraDevice: switchCameraDevice,
          cameraDevices: cameraDevices,
          frontWideCandidates: frontWideCandidates,
          rearWideCandidates: rearWideCandidates,
          activeCameraDeviceId: activeCameraDeviceId,
          normalCameraDeviceId: normalCameraDeviceId,
          wideCameraActive: wideCameraActive,
          toggleWideCamera: toggleWideCamera,
          lastWideToggleReason: lastWideToggleReason,
          lastWideTogglePath: lastWideTogglePath,
          cameraZoomHistory: cameraZoomHistory,
          onDebugSwitchCameraDevice: onDebugSwitchCameraDevice,
          framePreset: activeFramePreset
        }));
      case 'select':
        return /*#__PURE__*/React.createElement(SelectV2, _extends({}, p, {
          shots: effShots,
          selected: selected.slice(0, selectionCount),
          setSelected: setSelected
        }));
      case 'deco':
        // Guard moved to effect — screen should be 'setup' if no photos in current session
        return /*#__PURE__*/React.createElement(DecoV2, _extends({}, p, {
          shots: effShots,
          selected: effSelected,
          stickers: stickers,
          setStickers: setStickers,
          drawStrokes: drawStrokes,
          setDrawStrokes: setDrawStrokes,
          setDateText: v => updateTweak('dateText', v),
          framePreset: activeFramePreset,
          saveCustomFrame: saveCustomFrame
        }));
      case 'result':
        // Guard moved to effect — screen should be 'setup' if no photos in current session
        return /*#__PURE__*/React.createElement(ResultV2, _extends({}, p, {
          shots: effShots,
          selected: effSelected,
          stickers: stickers,
          drawStrokes: drawStrokes,
          framePreset: activeFramePreset
        }));
      default:
        return null;
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: T.bg,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    id: "global-camera-box",
    style: {
      position: 'absolute',
      top: cameraBox ? cameraBox.top : mobile ? 100 : 88,
      left: cameraBox ? cameraBox.left : mobile ? 16 : 24,
      width: cameraBox ? cameraBox.width : 'auto',
      height: cameraBox ? cameraBox.height : 'auto',
      right: cameraBox ? 'auto' : mobile ? 16 : 120,
      bottom: cameraBox ? 'auto' : mobile ? 180 : 112,
      zIndex: screen === 'capture' ? 5 : -1,
      opacity: screen === 'capture' ? 1 : 0,
      pointerEvents: 'none',
      borderRadius: 24,
      background: '#10233A',
      clipPath: 'inset(0 round 24px)',
      transform: 'translateZ(0)',
      // No filter here — applied per-layer below so CSS always shows
      transition: 'opacity 0.3s ease'
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    playsInline: true,
    muted: true,
    autoPlay: true,
    style: {
      position: 'absolute',
      inset: -1,
      width: 'calc(100% + 2px)',
      height: 'calc(100% + 2px)',
      objectFit: 'cover',
      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
      borderRadius: 25,
      // CSS filter is always on the video so there's no unfiltered flash
      filter: FILTERS[safeFilter]?.css || 'none',
      // Fade out once WebGL canvas has its first frame rendered
      opacity: shouldUseWebgl && webglOk && firstFrame ? 0 : 1,
      transition: 'opacity 0.08s'
    }
  }), /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      display: 'block',
      position: 'absolute',
      inset: -1,
      width: 'calc(100% + 2px)',
      height: 'calc(100% + 2px)',
      borderRadius: 25,
      opacity: shouldUseWebgl && webglOk && firstFrame ? 1 : 0,
      transition: 'opacity 0.08s'
    }
  })), /*#__PURE__*/React.createElement(ScreenTransition, {
    id: screen
  }, renderScreen()), /*#__PURE__*/React.createElement(BuildPill, null), /*#__PURE__*/React.createElement(FieldTestPanel, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(AppErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));