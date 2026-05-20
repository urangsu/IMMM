// main.jsx — IMMM Photobooth real app entry (no prototype chrome) - Refresh trigger

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
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
    const snap = (window.IMMM_DIAGNOSTICS && typeof window.IMMM_DIAGNOSTICS.getSnapshot === 'function')
      ? window.IMMM_DIAGNOSTICS.getSnapshot()
      : { error: 'IMMM_DIAGNOSTICS not available', timestamp: new Date().toISOString() };
    const text = JSON.stringify(snap, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => alert('진단 정보 복사됨')).catch(() => prompt('진단 정보:', text));
    } else {
      prompt('진단 정보:', text);
    }
  }

  render() {
    if (this.state.error) {
      const version = window.IMMM_APP_VERSION || 'unknown';
      const buildLabel = window.IMMM_BUILD_LABEL || '';
      return (
        <div style={{ minHeight:'100vh', padding:24, background:'#fff', color:'#111', fontFamily:'Pretendard,system-ui' }}>
          <h1 style={{ margin:'0 0 8px', fontSize:20 }}>앱을 불러오지 못했어요.</h1>
          <p style={{ margin:'0 0 4px', color:'#666', lineHeight:1.5 }}>브라우저 호환성 또는 스크립트 오류가 발생했습니다.</p>
          <p style={{ margin:'0 0 16px', color:'#999', fontSize:11 }}>버전: {version}{buildLabel ? ` · ${buildLabel}` : ''} · 런타임: precompiled</p>
          <pre style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', background:'#f4f4f4', padding:12, borderRadius:8, fontSize:12, marginBottom:16 }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => this.handleReload()} style={{ padding:'10px 20px', background:'#007AFF', color:'#fff', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>
              앱 재시작
            </button>
            <button onClick={() => this.handleCopyDiagnostics()} style={{ padding:'10px 20px', background:'#555', color:'#fff', border:'none', borderRadius:8, fontSize:14, cursor:'pointer' }}>
              진단 복사
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// EMERGENCY BOOT GUARD:
// Check if critical frame system globals are available before rendering.
// This prevents silent failures and "ReferenceError: getFrameTemplate is not defined" crashes on Samsung Internet.
(() => {
  const missingFrameGlobals = [];
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
  const options = [
    { label: '0.6×', value: 0.6, type: 'unavailable', enabled: false, reason: 'not-detected' },
    { label: '1×', value: 1, type: 'hardware', enabled: true, reason: 'default' },
    { label: '2×', value: 2, type: 'unavailable', enabled: false, reason: 'not-supported' },
  ];

  const zoomCap = cameraCapabilities?.zoom;
  const candidates = facingMode === 'user' ? frontWideCandidates : rearWideCandidates;

  if (zoomCap && zoomCap.min <= 0.6) {
    options[0] = { ...options[0], type: 'hardware', enabled: true, reason: 'hardware-zoom' };
  } else if (candidates?.[0]?.deviceId) {
    options[0] = { ...options[0], type: 'lens', enabled: true, reason: 'wide-device', deviceId: candidates[0].deviceId };
  }

  if (zoomCap && zoomCap.max >= 2) {
    options[2] = { ...options[2], type: 'hardware', enabled: true, reason: 'hardware-zoom' };
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
  const getShotCount = window.getShotCountForFrameSafe || window.getShotCountForFrame || (typeof getShotCountForFrame === 'function' ? getShotCountForFrame : null);
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
  const RuntimeSnapshot = window.IMMMSessionRuntimeSnapshot;
  if (!RuntimeSnapshot || typeof RuntimeSnapshot.createDebugSessionSnapshot !== 'function') {
    return null;
  }

  const result = RuntimeSnapshot.createDebugSessionSnapshot(payload);
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

function publishDebugShareReadiness({ shareState, resultAsset }) {
  if (!isSessionDebugEnabled()) return null;
  const Share = window.IMMMShareContract;
  if (!Share) return null;

  const report = Share.createShareReadinessReport({
    shareState,
    resultAsset
  });

  window.__IMMM_LAST_SHARE_READINESS__ = report;
  console.debug('[IMMM share readiness]', report);
  return report;
}

function publishDebugMotionReadiness({ layout, selected, renderRecipe }) {
  if (!isSessionDebugEnabled()) return null;
  const Motion = window.IMMMMotionExportContract;
  if (!Motion) return null;

  const report = Motion.createMotionReadinessReport({
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
  const Edit = window.IMMMEditRecipeContract;
  if (!Edit) return null;

  try {
    const recipe = Edit.createCompositeEditRecipe({
      edits: [
        Edit.createBlurRecipe({
          blurType: 'background',
          strength: (appState?.blur || 0) / 100
        }),
        Edit.createFilterRecipe({
          filterId: appState?.filterId || appState?.filter || 'original',
          intensity: appState?.intensity ?? 1
        })
      ]
    });

    const validation = Edit.validateEditRecipe(recipe);
    window.__IMMM_LAST_EDIT_RECIPE__ = { recipe, validation };
    console.debug('[IMMM edit recipe]', { recipe, validation });

    return { recipe, validation };
  } catch (error) {
    console.debug('[IMMM edit recipe error]', error);
    return null;
  }
}

function App() {
  const [tweaks, setTweaks] = React.useState({
    variant: 'A',
    layout: 'strip',
    orientation: 'portrait',
    filter: 'smooth',
    sound: true,
    logo: true,
    dateText: true,
    frameColor: '#ffffff',
    useWebgl: window.innerWidth >= 640, // Default off on mobile for stability
  });

  const [screen, setScreen] = React.useState(
    () => location.hash.startsWith('#/s/') ? 'share' : (localStorage.getItem('immm.v2.screen') || 'landing')
  );

  // Session tracking for state isolation
  const [activeSessionId, setActiveSessionId] = React.useState(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SESSION_START:activeSessionId', { activeSessionId: id });
    }
    return id;
  });

  const [shots, setShots] = React.useState(() => Array(6).fill(null));
  const [selected, setSelected] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('immm.v2.sel') || '[]'); }
    catch (e) { return []; }
  });
  const [preStickers, setPreStickers] = React.useState([]);
  const [stickers, setStickers] = React.useState([]);
  const [drawStrokes, setDrawStrokes] = React.useState([]);
  const [photoEditMode, setPhotoEditMode] = React.useState(false);
  const [lang, setLang] = React.useState('ko');
  const [customFrames, setCustomFrames] = React.useState(() => {
    try {
      const api = window.IMMMFramePresets;
      if (api && typeof api.loadCustomFramePresets === 'function') {
        return api.loadCustomFramePresets();
      }
      return JSON.parse(localStorage.getItem('immm.v2.customFrames') || '[]');
    } catch (e) {
      console.warn('[IMMM] custom frame load failed:', e);
      return [];
    }
  });
  const [selectedFramePresetId, setSelectedFramePresetId] = React.useState(() => {
    try {
      return localStorage.getItem('immm.v2.selectedFramePresetId') || '';
    } catch (e) {
      return '';
    }
  });
  const [unlockedFramePackIds, setUnlockedFramePackIds] = React.useState(() => {
    try {
      const api = window.IMMMFramePresets;
      if (api && typeof api.getUnlockedFramePackIds === 'function') {
        return api.getUnlockedFramePackIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.unlockedFramePacks') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [favoriteFramePresetIds, setFavoriteFramePresetIds] = React.useState(() => {
    try {
      const api = window.IMMMFramePresets;
      if (api && typeof api.loadFavoriteFramePresetIds === 'function') {
        return api.loadFavoriteFramePresetIds();
      }
      return JSON.parse(localStorage.getItem('immm.v2.favoriteFramePresets') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Responsive mobile detection
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 640);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const safeFilter = typeof getSafeFilterKey === 'function' ? getSafeFilterKey(tweaks.filter) : tweaks.filter;
  const framePresetApi = typeof window !== 'undefined' ? window.IMMMFramePresets : null;
  const framePresetList = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.listFramePresets === 'function') {
      return framePresetApi.listFramePresets(customFrames);
    }
    return customFrames;
  }, [framePresetApi, customFrames]);
  const framePackList = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getFramePacks === 'function') {
      return framePresetApi.getFramePacks(customFrames);
    }
    return [];
  }, [framePresetApi, customFrames]);
  const activeFramePreset = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getFramePresetById === 'function') {
      return framePresetApi.getFramePresetById(selectedFramePresetId, customFrames);
    }
    return framePresetList.find((preset) => preset.id === selectedFramePresetId) || null;
  }, [framePresetApi, selectedFramePresetId, customFrames, framePresetList]);
  const defaultFramePresetId = React.useMemo(() => {
    if (framePresetApi && typeof framePresetApi.getDefaultFramePresetIdForLayout === 'function') {
      return framePresetApi.getDefaultFramePresetIdForLayout(tweaks.layout, customFrames);
    }
    const first = framePresetList.find((preset) => preset.layout === tweaks.layout);
    return first ? first.id : '';
  }, [framePresetApi, tweaks.layout, customFrames, framePresetList]);
  const normalizePresetLayout = React.useCallback((layout) => {
    if (framePresetApi && typeof framePresetApi.normalizePresetLayout === 'function') {
      return framePresetApi.normalizePresetLayout(layout);
    }
    if (layout === '1x4' || layout === 'strip') return 'strip';
    if (layout === '2x2' || layout === 'grid') return 'grid';
    if (layout === '1x3' || layout === 'trip') return 'trip';
    if (layout === '1x1' || layout === 'polaroid') return 'polaroid';
    return 'strip';
  }, [framePresetApi]);
  const getLayoutTemplate = React.useCallback((layout) => {
    const normalized = normalizePresetLayout(layout);
    if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
      return window.getFrameTemplateSafe(normalized);
    }
    if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
      return window.getFrameTemplate(normalized);
    }
    return null;
  }, [normalizePresetLayout]);
  const getLayoutSlotCount = React.useCallback((layout) => {
    const template = getLayoutTemplate(layout);
    if (template?.photoSlots?.length) return template.photoSlots.length;
    const normalized = normalizePresetLayout(layout);
    if (normalized === 'polaroid') return 1;
    if (normalized === 'trip') return 3;
    return 4;
  }, [getLayoutTemplate, normalizePresetLayout]);
  const getLayoutCaptureCount = React.useCallback((layout) => {
    const normalized = normalizePresetLayout(layout);
    return getCaptureShotCountForLayout(normalized);
  }, [normalizePresetLayout]);

  // EMERGENCY FACE SHAPE SAFETY:
  // Disabling ALL face-tracked filters and geometry warp to prevent distortion on Galaxy/Samsung Internet.
  const faceTrackedFilters = [];

  const isSamsungInternet = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /SamsungBrowser/i.test(ua);
  };
  const forceSafeCameraMode = isSamsungInternet();

  // shouldUseWebgl: forced OFF on Samsung Internet for emergency safety.
  const shouldUseWebgl = !forceSafeCameraMode && tweaks.useWebgl;
  const [cameraBox, setCameraBox] = React.useState(null);
  const [debugBuildVisible, setDebugBuildVisible] = React.useState(false);

  React.useEffect(() => {
    console.info('[IMMM build]', {
      version: window.IMMM_APP_VERSION,
      label: window.IMMM_BUILD_LABEL,
      rcBaseline: window.IMMM_RC_BASELINE,
      stableBaseline: window.IMMM_STABLE_BASELINE,
      cacheName: 'immm-cache-v6-2026-05-10-rc2.2'
    });

    const tick = () => {
      setDebugBuildVisible(
        window.IMMM_DEBUG_CAMERA === true || window.IMMM_DEBUG_BUILD === true
      );
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const BuildPill = () => {
    if (!debugBuildVisible) return null;
    return (
      <div style={{
        position: 'fixed', right: 10, bottom: 'calc(var(--sab) + 10px)', zIndex: 9000,
        padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.45)',
        color: '#fff', fontSize: 10, fontWeight: 600, pointerEvents: 'none',
        fontFamily: 'monospace', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
      }}>
        IMMM {window.IMMM_APP_VERSION} · {window.IMMM_RC_BASELINE}
        <div style={{ fontSize: 8, opacity: 0.8, marginTop: 2 }}>{window.IMMM_BUILD_LABEL}</div>
      </div>
    );
  };

  // IMMM_DIAGNOSTICS — functional API, updated on key state changes
  React.useEffect(() => {
    const getSnapshot = () => ({
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
    const copySnapshot = async () => {
      const snap = getSnapshot();
      const text = JSON.stringify(snap, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    };
    window.IMMM_DIAGNOSTICS = { getSnapshot, copySnapshot };
  }, [screen, activeSessionId, shots, selected, stickers, drawStrokes, tweaks.layout, tweaks.frameColor, facingMode, cameraZoomSupported, cameraZoom, torchSupported, torchActive, screenLightActive]);

  // PWA update one-shot reload guard
  React.useEffect(() => {
    if (!navigator.serviceWorker) return;
    let reloadScheduled = false;
    const onControllerChange = () => {
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
  const [showFieldTest, setShowFieldTest] = React.useState(false);
  const [fieldTestOpen, setFieldTestOpen] = React.useState(false);
  React.useEffect(() => {
    if (window.IMMM_FIELD_TEST === true || new URLSearchParams(location.search).get('fieldTest') === '1') {
      setShowFieldTest(true);
    }
  }, []);
  const FieldTestPanel = () => {
    if (!showFieldTest) return null;
    const lsSize = (() => { try { return localStorage.length; } catch(e) { return 'n/a'; } })();
    return (
      <div style={{ position:'fixed', bottom:10, left:10, zIndex:9990 }}>
        <button
          onClick={() => setFieldTestOpen(o => !o)}
          style={{ padding:'4px 10px', background:'rgba(0,80,0,0.85)', color:'#0f0', border:'none', borderRadius:6, fontSize:11, fontFamily:'monospace', cursor:'pointer' }}
        >
          FT
        </button>
        {fieldTestOpen && (
          <div style={{ position:'absolute', bottom:28, left:0, background:'rgba(0,0,0,0.88)', color:'#0f0', fontSize:11, fontFamily:'monospace', padding:10, borderRadius:8, minWidth:240, maxHeight:260, overflow:'auto' }}>
            <div style={{ marginBottom:4, fontWeight:'bold' }}>Field Test Panel</div>
            <div>screen: {screen}</div>
            <div>session: …{activeSessionId ? activeSessionId.slice(-8) : 'none'}</div>
            <div>shots: {shots.filter(s => s?.dataUrl).length} / {shots.length}</div>
            <div>selected: {selected.length}</div>
            <div>stickers: {stickers.length}</div>
            <div>camera: {facingMode} zoom:{cameraZoom}</div>
            <div>torch: {torchActive ? 'on' : 'off'} | screenLight: {screenLightActive ? 'on' : 'off'}</div>
            <div>SW: {(navigator.serviceWorker && navigator.serviceWorker.controller) ? 'active' : 'none'}</div>
            <div>LS keys: {lsSize}</div>
            <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
              <button onClick={async () => { if (window.IMMM_DIAGNOSTICS) { const r = await window.IMMM_DIAGNOSTICS.copySnapshot(); alert(r.ok ? 'Copied' : r.error); } }} style={{ padding:'3px 8px', background:'#003300', color:'#0f0', border:'1px solid #0f0', borderRadius:4, fontSize:10, cursor:'pointer' }}>Copy Diag</button>
              <button onClick={() => location.reload()} style={{ padding:'3px 8px', background:'#003300', color:'#0f0', border:'1px solid #0f0', borderRadius:4, fontSize:10, cursor:'pointer' }}>Reload</button>
              <button onClick={() => setFieldTestOpen(false)} style={{ padding:'3px 8px', background:'#003300', color:'#0f0', border:'1px solid #0f0', borderRadius:4, fontSize:10, cursor:'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // Persistent Background Engine (Pre-warming)
  const videoRef  = React.useRef(null);
  const canvasRef = React.useRef(null);

  // EMERGENCY FACE SHAPE SAFETY:
  // Face landmarks are globally disabled until Galaxy/Samsung Internet distortion is fully resolved.
  // Do not call useFaceLandmarks in production path.
  const FACE_LANDMARKS_DISABLED = true;

  const faceDataRef = React.useRef({
    detected: false,
    faces: []
  });
  const [facingMode, setFacingMode] = React.useState('user');
  const [camOk, setCamOk] = React.useState(null);
  const streamRef = React.useRef(null);
  const [cameraZoom, setCameraZoomState] = React.useState(1);
  const [cameraCapabilities, setCameraCapabilities] = React.useState(null);
  const [cameraSettings, setCameraSettings] = React.useState(null);
  const [frontWideCandidates, setFrontWideCandidates] = React.useState([]);
  const [rearWideCandidates, setRearWideCandidates] = React.useState([]);
  const [cameraDevices, setCameraDevices] = React.useState([]);

  const [activeCameraDeviceId, setActiveCameraDeviceId] = React.useState(null);
  const [normalCameraDeviceId, setNormalCameraDeviceId] = React.useState(null);
  const [wideCameraActive, setWideCameraActive] = React.useState(false);
  const [lastWideToggleReason, setLastWideToggleReason] = React.useState('');
  const [lastWideTogglePath, setLastWideTogglePath] = React.useState('');
  const [cameraToggleBusy, setCameraToggleBusy] = React.useState(false);
  // Zoom capability detection
  const [cameraZoomSupported, setCameraZoomSupported] = React.useState(false);
  const [cameraZoomMin, setCameraZoomMin] = React.useState(1);
  const [cameraZoomMax, setCameraZoomMax] = React.useState(1);
  const [cameraZoomStep, setCameraZoomStep] = React.useState(0.1);
  const [cameraZoomUnavailableReason, setCameraZoomUnavailableReason] = React.useState(null);

  // Torch capability detection
  const [torchSupported, setTorchSupported] = React.useState(false);
  const [torchActive, setTorchActive] = React.useState(false);
  const [torchUnavailableReason, setTorchUnavailableReason] = React.useState(null);

  // Screen light for front camera (selfie flash)
  const [screenLightSupported, setScreenLightSupported] = React.useState(true);
  const [screenLightActive, setScreenLightActive] = React.useState(false);   // user toggle: selfie flash mode on/off
  const [screenFlashOverlay, setScreenFlashOverlay] = React.useState(false); // white overlay currently rendering
  const [cameraZoomHistory, setCameraZoomHistory] = React.useState([]);

  const pushCameraZoomHistory = React.useCallback((entry) => {
    if (!window.IMMM_DEBUG_CAMERA) return;
    setCameraZoomHistory(prev => [
      {
        ts: Date.now(),
        ...entry
      },
      ...prev
    ].slice(0, 10));
  }, []);

  // Session reset helper: clears main app state without wiping persisted storage wholesale
  const resetSessionState = React.useCallback((reason = 'new-session', shotCount = 6) => {
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
    const nextSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setActiveSessionId(nextSessionId);

    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SESSION_RESET:sessionId', {
        reason,
        previousSessionId: activeSessionId,
        newSessionId: nextSessionId,
        shotCount,
      });
    }
  }, [activeSessionId]);

  // Explicit new capture session start (called from New Session button, not from go)
  const startNewCaptureSession = React.useCallback(() => {
    const newShotCount = getCaptureShotCountForLayout(tweaks.layout);
    resetSessionState('start-new-capture', newShotCount);
    setScreen('capture');
  }, [tweaks.layout, resetSessionState]);

  const cameraZoomOptions = React.useMemo(
    () => deriveCameraZoomOptions({
      cameraCapabilities,
      facingMode,
      frontWideCandidates,
      rearWideCandidates,
      wideCameraActive,
      normalCameraDeviceId
    }),
    [cameraCapabilities, facingMode, frontWideCandidates, rearWideCandidates, wideCameraActive, normalCameraDeviceId]
  );

  const getCameraDebugSnapshot = React.useCallback((label, extra = {}) => {
    const track = streamRef.current?.getVideoTracks?.()[0] || null;
    const settings = track?.getSettings?.() || {};
    const capabilities = typeof track?.getCapabilities === 'function' ? track.getCapabilities() : {};
    const constraints = typeof track?.getConstraints === 'function' ? track.getConstraints() : {};

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
      zoomCap: capabilities.zoom
        ? {
            min: capabilities.zoom.min,
            max: capabilities.zoom.max,
            step: capabilities.zoom.step,
          }
        : null,
      constraintZoom: constraints.zoom,
      activeCameraDeviceId,
      normalCameraDeviceId,
      wideCameraActive,
      ...extra,
    };
  }, [activeCameraDeviceId, normalCameraDeviceId, wideCameraActive]);

  const refreshCameraDevices = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vidInputs = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(vidInputs);

      const wideKeywords = ['ultra', 'wide', '0.5', '0.6', '광각', '초광각'];
      const frontKeywords = ['front', 'user', 'face', 'selfie', '전면', '셀카'];
      const rearKeywords = ['back', 'rear', 'environment', '후면'];
      const hasAny = (label, words) => words.some(kw => (label || '').toLowerCase().includes(kw));

      const frontWide = vidInputs.filter(d => {
        const label = (d.label || '').toLowerCase();
        const score = (label.includes('ultra') ? 2 : 0) +
                      (label.includes('wide') ? 1 : 0) +
                      (label.includes('0.5') ? 2 : 0) +
                      (label.includes('0.6') ? 2 : 0) +
                      (label.includes('초광각') ? 2 : 0) +
                      (label.includes('광각') ? 1 : 0);
        return score >= 1 && hasAny(label, frontKeywords);
      });
      const rearWide = vidInputs.filter(d => {
        const label = (d.label || '').toLowerCase();
        const score = (label.includes('ultra') ? 2 : 0) +
                      (label.includes('wide') ? 1 : 0) +
                      (label.includes('0.5') ? 2 : 0) +
                      (label.includes('0.6') ? 2 : 0) +
                      (label.includes('초광각') ? 2 : 0) +
                      (label.includes('광각') ? 1 : 0);
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
  const { engineRef, webglOk, firstFrame, webglFailed } = (typeof useFilterEngine === 'function')
    ? useFilterEngine(canvasRef, videoRef, safeFilter, faceDataRef, !shouldUseWebgl, facingMode === 'user', mobile)
    : { engineRef: null, webglOk: false, firstFrame: false, webglFailed: false };

  // Shared Camera Stream
  React.useEffect(() => {
    let active = true;
    const stopStream = (stream) => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
    (async () => {
      try {
        stopStream(streamRef.current);
        streamRef.current = null;
        let s = null;
        try {
          s = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } },
            audio: false,
          });
        } catch (e1) {
          try {
            s = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 60 } },
              audio: false,
            });
          } catch (e2) {
            s = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode } },
              audio: false,
            });
          }
        }
        
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        setCamOk(true);
        
        const track = s.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings ? track.getSettings() : {};
          const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
          const constraints = track.getConstraints ? track.getConstraints() : {};
          setCameraSettings(settings);
          setCameraCapabilities(capabilities);
          setCameraZoomState(settings.zoom ?? 1);

          setActiveCameraDeviceId(settings.deviceId || null);
          if (!wideCameraActive && !normalCameraDeviceId) {
            setNormalCameraDeviceId(settings.deviceId || null);
          }

          if (window.IMMM_DEBUG_CAMERA) {
            const snap = {
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

  const applyCameraZoom = React.useCallback(async (zoom) => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    const snapBefore = getCameraDebugSnapshot('zoom-start');
    
    if (!track) {
      return { ok: false, path: 'hardware-zoom', reason: 'no-track', snapBefore };
    }
    
    const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
    if (!caps.zoom) {
      return { ok: false, path: 'hardware-zoom', reason: 'no-zoom-capability', snapBefore };
    }
    
    const min = caps.zoom.min ?? 1;
    const max = caps.zoom.max ?? 1;
    const step = caps.zoom.step ?? 0.01;
    
    if (zoom < min || zoom > max) {
      return { ok: false, path: 'hardware-zoom', reason: `zoom-out-of-range(${zoom.toFixed(2)} not in ${min}-${max})`, snapBefore };
    }

    try {
      await track.applyConstraints({ advanced: [{ zoom }] });
      
      // Verification
      await new Promise(r => requestAnimationFrame(r));
      const afterSettings = track.getSettings?.() || {};
      const afterZoom = afterSettings.zoom;
      const snapAfter = getCameraDebugSnapshot('zoom-end');
      
      if (afterZoom === undefined) {
        pushCameraZoomHistory({ requestedZoom: zoom, path: 'hardware-zoom', reason: 'zoom-settings-unavailable', snapBefore, snapAfter });
        return { ok: false, path: 'hardware-zoom', reason: 'zoom-settings-unavailable', snapBefore, snapAfter };
      }

      const diff = Math.abs(afterZoom - zoom);
      if (diff <= (step * 2 + 0.05)) {
        setCameraZoomState(afterZoom);
        setCameraSettings(afterSettings);
        pushCameraZoomHistory({ requestedZoom: zoom, path: 'hardware-zoom', reason: 'success', snapBefore, snapAfter });
        return { ok: true, path: 'hardware-zoom', reason: 'success', beforeZoom: snapBefore.zoom, afterZoom, snapBefore, snapAfter };
      } else {
        pushCameraZoomHistory({ requestedZoom: zoom, path: 'hardware-zoom', reason: `zoom-unchanged(${afterZoom})`, snapBefore, snapAfter });
        return { ok: false, path: 'hardware-zoom', reason: `zoom-unchanged(requested ${zoom.toFixed(2)}, got ${afterZoom.toFixed(2)})`, snapBefore, snapAfter };
      }
    } catch (e) {
      console.warn('[IMMM camera] zoom apply failed:', e);
      pushCameraZoomHistory({ requestedZoom: zoom, path: 'hardware-zoom', reason: `zoom-error(${e.name})`, snapBefore });
      return { ok: false, path: 'hardware-zoom', reason: `zoom-error(${e.name})`, snapBefore };
    }
  }, [getCameraDebugSnapshot]);

  const switchCameraDevice = React.useCallback(async (deviceId) => {
    if (!deviceId) return { ok: false, path: 'device-switch', reason: 'no-target-device' };
    const snapBefore = getCameraDebugSnapshot('switch-start', { targetDeviceId: deviceId });
    const beforeDeviceId = cameraSettings?.deviceId;
    
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = next;
      if (videoRef.current) {
        videoRef.current.srcObject = next;
        await videoRef.current.play().catch(() => {});
      }
      
      const track = next.getVideoTracks()[0];
      const settings = track.getSettings?.() || {};
      const capabilities = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
      
      setCameraSettings(settings);
      setCameraCapabilities(capabilities);
      setCameraZoomState(settings.zoom ?? 1);
      setActiveCameraDeviceId(settings.deviceId || deviceId);
      
      const isWide = [...frontWideCandidates, ...rearWideCandidates].some(d => d.deviceId === (settings.deviceId || deviceId));
      setWideCameraActive(isWide);
      
      const snapAfter = getCameraDebugSnapshot('switch-end');
      
      const deviceIdMatches = settings.deviceId === deviceId || (beforeDeviceId && settings.deviceId !== beforeDeviceId);
      if (deviceIdMatches) {
        await refreshCameraDevices();
        pushCameraZoomHistory({ requestedDeviceId: deviceId, path: 'device-switch', reason: 'success', snapBefore, snapAfter });
        return { ok: true, path: 'device-switch', reason: 'success', snapBefore, snapAfter };
      } else {
        const labelChanged = snapAfter.trackLabel && snapAfter.trackLabel !== snapBefore.trackLabel;
        const resolutionChanged = snapAfter.width !== snapBefore.width || snapAfter.height !== snapBefore.height;
        
        if (labelChanged || resolutionChanged) {
           await refreshCameraDevices();
           pushCameraZoomHistory({ requestedDeviceId: deviceId, path: 'device-switch', reason: 'unverified-success', snapBefore, snapAfter });
           return { ok: true, path: 'device-switch', reason: 'unverified-device-switch', snapBefore, snapAfter };
        }
        pushCameraZoomHistory({ requestedDeviceId: deviceId, path: 'device-switch', reason: 'device-not-switched', snapBefore, snapAfter });
        return { ok: false, path: 'device-switch', reason: 'device-not-switched', snapBefore, snapAfter };
      }
    } catch (e) {
      console.warn('[IMMM camera] switchCameraDevice failed:', e);
      pushCameraZoomHistory({ requestedDeviceId: deviceId, path: 'device-switch', reason: `switch-failed(${e.name})`, snapBefore });
      return { ok: false, path: 'device-switch', reason: `switch-failed(${e.name})`, snapBefore };
    }
  }, [refreshCameraDevices, frontWideCandidates, rearWideCandidates, cameraSettings?.deviceId, getCameraDebugSnapshot]);

  const setCameraTorch = React.useCallback(async (enabled) => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track || !torchSupported) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: enabled }] });
      setTorchActive(enabled);
      return true;
    } catch (e) {
      console.warn('[IMMM camera] torch failed:', e);
      return false;
    }
  }, [torchSupported]);

  const runScreenFlash = React.useCallback(async () => {
    if (!screenLightActive || facingMode !== 'user') return;
    setScreenFlashOverlay(true);
    await new Promise(r => setTimeout(r, 450));
    setScreenFlashOverlay(false);
  }, [screenLightActive, facingMode]);

  const setCameraZoom = React.useCallback(async (val) => {
    if (cameraToggleBusy) return false;
    setCameraToggleBusy(true);
    let result = { ok: false, path: 'zoom', reason: 'unknown' };

    try {
      if (val === 1 && wideCameraActive) {
        pushCameraZoomHistory({ requestedZoom: 1, path: 'lens-return-start', wideCameraActive });
        const hwRes = await applyCameraZoom(1);
        if (hwRes.ok) {
          setWideCameraActive(false);
          result = { ...hwRes, path: 'hardware-return' };
          pushCameraZoomHistory({ requestedZoom: 1, path: 'hardware-return', reason: 'success' });
          return true;
        }

        if (normalCameraDeviceId) {
          const devRes = await switchCameraDevice(normalCameraDeviceId);
          if (devRes.ok) {
            setWideCameraActive(false);
            result = { ...devRes, path: 'device-return' };
            pushCameraZoomHistory({ requestedZoom: 1, path: 'device-return', reason: 'success' });
            return true;
          }
          result = { ok: false, path: 'failed-return', reason: `hw:${hwRes.reason};dev:${devRes.reason}` };
        } else {
          result = { ok: false, path: 'failed-return', reason: `hw:${hwRes.reason};no-normal-dev` };
        }
        pushCameraZoomHistory({ requestedZoom: 1, path: 'failed-return', reason: result.reason });
        return false;
      }

      const opt = cameraZoomOptions.find(o => o.value === val);
      if (!opt || !opt.enabled) return false;

      pushCameraZoomHistory({ requestedZoom: val, path: 'zoom-opt-start', optType: opt.type });

      if (opt.type === 'hardware') {
        const res = await applyCameraZoom(val);
        if (res.ok) {
          setWideCameraActive(val <= 0.75);
          result = res;
          return true;
        }
      } else if ((opt.type === 'lens' || opt.type === 'lens-return') && opt.deviceId) {
        const res = await switchCameraDevice(opt.deviceId);
        if (res.ok) {
          setWideCameraActive(opt.type === 'lens');
          result = res;
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

  const onDebugSwitchCameraDevice = React.useCallback(async (deviceId) => {
    if (cameraToggleBusy) return { ok: false, path: 'manual-device-switch', reason: 'busy' };
    setCameraToggleBusy(true);
    let result = { ok: false, path: 'manual-device-switch', reason: 'unknown' };

    try {
      const res = await switchCameraDevice(deviceId);
      result = { ...res, path: res.ok ? 'manual-device-switch' : 'manual-device-switch-failed' };
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

  const toggleWideCamera = React.useCallback(async () => {
    if (cameraToggleBusy) return false;
    setCameraToggleBusy(true);
    
    let result = { ok: false, path: 'init', reason: 'starting' };
    const isCurrentlyWide = wideCameraActive || (cameraSettings?.zoom != null && cameraSettings.zoom <= 0.75);

    try {
      // Path 1: Return to 1x
      if (isCurrentlyWide) {
        const hwRes = await applyCameraZoom(1);
        if (hwRes.ok) {
          setWideCameraActive(false);
          result = { ...hwRes, path: 'hardware-return' };
        } else if (normalCameraDeviceId) {
          const devRes = await switchCameraDevice(normalCameraDeviceId);
          if (devRes.ok) {
            setWideCameraActive(false);
            result = { ...devRes, path: 'device-return' };
          } else {
            result = { ok: false, path: 'failed-return', reason: `hardware:${hwRes.reason};device:${devRes.reason}` };
          }
        } else {
          result = { ok: false, path: 'failed-return', reason: `hardware:${hwRes.reason};device:no-normal-dev` };
        }
      } else {
        // Path 2: Go to 0.6x (Hardware first)
        const hwRes = await applyCameraZoom(0.6);
        if (hwRes.ok) {
          setWideCameraActive(true);
          result = { ...hwRes, path: 'hardware-zoom' };
        } else {
          // Path 3: Go to 0.6x (Device switch fallback)
          const candidates = facingMode === 'user' ? frontWideCandidates : rearWideCandidates;
          const candidate = candidates?.[0];
          if (candidate?.deviceId) {
            const devRes = await switchCameraDevice(candidate.deviceId);
            if (devRes.ok) {
              setWideCameraActive(true);
              result = { ...devRes, path: 'device-switch' };
            } else {
              result = { ok: false, path: 'failed-wide', reason: `hardware:${hwRes.reason};device:${devRes.reason}` };
            }
          } else {
            result = { ok: false, path: 'failed-wide', reason: `hardware:${hwRes.reason};device:no-candidates` };
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
  }, [
    cameraSettings, wideCameraActive, normalCameraDeviceId,
    facingMode, frontWideCandidates, rearWideCandidates, applyCameraZoom, switchCameraDevice, cameraToggleBusy
  ]);

  React.useEffect(() => {
    const onHash = () => {
      if (location.hash.startsWith('#/s/')) setScreen('share');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  React.useEffect(() => {
    if (screen !== 'share') localStorage.setItem('immm.v2.screen', screen);
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
    if (!defaultFramePresetId) return;
    const hasSelected = selectedFramePresetId && framePresetList.some((preset) => preset.id === selectedFramePresetId);
    if (!hasSelected) {
      setSelectedFramePresetId(defaultFramePresetId);
    }
  }, [defaultFramePresetId, framePresetList, selectedFramePresetId]);
  React.useEffect(() => {
    if (!activeFramePreset?.layout) return;
    const nextLayout = normalizePresetLayout(activeFramePreset.layout);
    if (tweaks.layout !== nextLayout) {
      const slotCount = getLayoutSlotCount(nextLayout);
      const captureCount = getLayoutCaptureCount(nextLayout);
      const nextSelected = Array.isArray(selected)
        ? selected.filter((index) => Number.isInteger(index) && index >= 0 && index < slotCount).slice(0, slotCount)
        : [];
      const safeSelected = nextSelected.length > 0 ? nextSelected : Array.from({ length: slotCount }, (_, i) => i);
      const nextShots = Array.isArray(shots) ? shots.slice(0, captureCount) : [];
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
        selected: selected.slice(),
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
    const protectedScreens = ['select', 'deco', 'result'];
    if (!protectedScreens.includes(screen)) return;

    const hasPhotosInCurrentSession = shots.some(s => s?.dataUrl);
    if (!hasPhotosInCurrentSession) {
      setScreen('setup');
      try {
        localStorage.setItem('immm.v2.screen', 'setup');
      } catch (e) {
        console.warn('[IMMM] localStorage update failed:', e);
      }
    }
  }, [screen, shots]);

  const go = (s) => {
    if (s === 'deco' && stickers.length === 0 && preStickers.length > 0) {
      setStickers([...preStickers]);
    }
    if (window.SessionTracer && window.IMMM_DEBUG_SESSION) {
      window.SessionTracer.trace('SCREEN_CHANGE:navigation', {
        from: screen,
        to: s,
        activeSessionId,
        shotsLength: shots.filter(s => s).length,
        selectedLength: selected.length,
      });
    }
    // go() performs simple screen navigation only.
    // Do NOT reset session state here — use startNewCaptureSession() for explicit new session.
    setScreen(s);
  };
  const updateTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));
  const persistCustomFrames = React.useCallback((frames) => {
    const nextFrames = Array.isArray(frames) ? frames : [];
    if (typeof framePresetApi?.saveCustomFramePresets === 'function') {
      const saved = framePresetApi.saveCustomFramePresets(nextFrames);
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
  const applyFramePreset = React.useCallback((presetOrId, options = {}) => {
    const preset = typeof presetOrId === 'string'
      ? (framePresetApi?.getFramePresetById?.(presetOrId, customFrames) || framePresetList.find((p) => p.id === presetOrId) || null)
      : presetOrId;
    if (!preset) return null;

    const pack = preset.packId ? framePresetApi?.getFramePackById?.(preset.packId, customFrames) : null;
    const packLocked = Boolean(pack?.locked && !(framePresetApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)));
    if (packLocked) {
      if (typeof options.onBlocked === 'function') {
        options.onBlocked({ preset, pack });
      }
      return null;
    }

    const normalizedLayout = normalizePresetLayout(preset.layout || tweaks.layout);
    const slotCount = getLayoutSlotCount(normalizedLayout);
    const captureCount = getLayoutCaptureCount(normalizedLayout);
    const nextSelected = Array.isArray(selected)
      ? selected.filter((index) => Number.isInteger(index) && index >= 0 && index < slotCount).slice(0, slotCount)
      : [];
    const safeSelected = nextSelected.length > 0 ? nextSelected : Array.from({ length: slotCount }, (_, i) => i);
    const nextShots = Array.isArray(shots) ? shots.slice(0, captureCount) : [];
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
    return preset;
  }, [customFrames, framePresetApi, framePresetList, getLayoutCaptureCount, getLayoutSlotCount, normalizePresetLayout, selected, shots, tweaks.layout, tweaks.orientation, unlockedFramePackIds]);
  const saveCustomFrame = React.useCallback((input = {}) => {
    if (!framePresetApi || typeof framePresetApi.createCustomFramePresetFromAppState !== 'function') return null;
    const preset = framePresetApi.createCustomFramePresetFromAppState({
      name: input.name || 'My Frame',
      layout: input.layout || tweaks.layout,
      frameColor: input.frameColor || tweaks.frameColor,
      background: input.background || (activeFramePreset?.background || { type: 'solid', value: input.frameColor || tweaks.frameColor || '#FFFFFF' }),
      decorations: input.decorations || activeFramePreset?.decorations || [],
      stickers: input.stickers || [],
      drawStrokes: input.drawStrokes || [],
      photoSlots: input.photoSlots || activeFramePreset?.photoSlots,
      watermark: input.watermark || activeFramePreset?.watermark,
      canvasSize: input.canvasSize || activeFramePreset?.canvasSize,
    });
    const next = [...customFrames.filter((item) => item.id !== preset.id), preset];
    persistCustomFrames(next);
    applyFramePreset(preset, { syncFrameColor: true });
    return preset;
  }, [activeFramePreset, applyFramePreset, customFrames, framePresetApi, persistCustomFrames, tweaks.frameColor, tweaks.layout]);
  const exportCustomFramesAsJson = React.useCallback((options = {}) => {
    if (framePresetApi && typeof framePresetApi.exportCustomFramePackJson === 'function') {
      return framePresetApi.exportCustomFramePackJson(customFrames, {
        name: options.name || 'My Frames Export',
        description: options.description || 'Exported custom frames pack.',
        author: options.author || { name: 'You', handle: '', url: '' },
        license: options.license || 'personal',
        tags: Array.isArray(options.tags) ? options.tags : ['my-frames'],
      });
    }
    return JSON.stringify({ schemaVersion: '1.0.0', kind: 'frame-pack', exportedAt: new Date().toISOString(), pack: {}, presets: [] }, null, 2);
  }, [customFrames, framePresetApi]);
  const importFramePackFromJson = React.useCallback((raw) => {
    if (!raw || !String(raw).trim()) {
      return { ok: false, error: 'Empty frame pack JSON' };
    }
    if (!framePresetApi || typeof framePresetApi.importFramePackJson !== 'function') {
      return { ok: false, error: 'Frame pack import is unavailable' };
    }
    const result = framePresetApi.importFramePackJson(String(raw));
    if (!result?.ok) return result;
    const importedFrames = Array.isArray(result.presets) ? result.presets : [];
    const next = [
      ...customFrames.filter((frame) => !importedFrames.some((incoming) => incoming.id === frame.id)),
      ...importedFrames,
    ];
    persistCustomFrames(next);
    return result;
  }, [customFrames, framePresetApi, persistCustomFrames]);
  const renameCustomFrame = React.useCallback((frameId, nextName) => {
    const name = String(nextName || '').trim();
    if (!frameId || !name) return null;
    const now = new Date().toISOString();
    const next = customFrames.map((frame) => frame.id === frameId ? { ...frame, name, updatedAt: now } : frame);
    persistCustomFrames(next);
    return next.find((frame) => frame.id === frameId) || null;
  }, [customFrames, persistCustomFrames]);
  const duplicateCustomFrame = React.useCallback((frameId) => {
    const source = customFrames.find((frame) => frame.id === frameId);
    if (!source) return null;
    const now = new Date().toISOString();
    const copyId = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const copy = {
      ...source,
      id: copyId,
      name: `${source.name || 'My Frame'} Copy`,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      source: 'custom',
    };
    const next = [...customFrames, copy];
    persistCustomFrames(next);
    setSelectedFramePresetId(copy.id);
    return copy;
  }, [customFrames, persistCustomFrames]);
  const softDeleteCustomFrame = React.useCallback((frameId) => {
    if (!frameId) return null;
    const now = new Date().toISOString();
    const next = customFrames.map((frame) => frame.id === frameId ? { ...frame, deletedAt: now, updatedAt: now } : frame);
    persistCustomFrames(next);
    if (selectedFramePresetId === frameId) {
      const fallbackId = framePresetApi?.getDefaultFramePresetIdForLayout?.(tweaks.layout, next) || '';
      setSelectedFramePresetId(fallbackId);
    }
    return next.find((frame) => frame.id === frameId) || null;
  }, [customFrames, framePresetApi, persistCustomFrames, selectedFramePresetId, tweaks.layout]);
  const unlockFramePackForDev = React.useCallback((packId) => {
    if (!packId) return [];
    const next = framePresetApi?.unlockFramePackForDev?.(packId) || Array.from(new Set([...unlockedFramePackIds, packId]));
    setUnlockedFramePackIds(next);
    return next;
  }, [framePresetApi, unlockedFramePackIds]);
  const toggleFavoriteFramePreset = React.useCallback((presetId) => {
    if (!presetId) return [];
    const next = framePresetApi?.toggleFavoriteFramePresetId?.(presetId, favoriteFramePresetIds)
      || (favoriteFramePresetIds.includes(presetId)
        ? favoriteFramePresetIds.filter((id) => id !== presetId)
        : [...favoriteFramePresetIds, presetId]);
    setFavoriteFramePresetIds(next);
    return next;
  }, [favoriteFramePresetIds, framePresetApi]);
  const setLayoutAndPreset = React.useCallback((layoutId) => {
    const normalizedLayout = normalizePresetLayout(layoutId);
    const nextPresetId = framePresetApi?.getDefaultFramePresetIdForLayout?.(normalizedLayout, customFrames)
      || framePresetList.find((preset) => preset.layout === normalizedLayout)?.id
      || '';
    if (nextPresetId) {
      const preset = framePresetApi?.getFramePresetById?.(nextPresetId, customFrames) || framePresetList.find((framePreset) => framePreset.id === nextPresetId) || null;
      const pack = preset?.packId ? framePresetApi?.getFramePackById?.(preset.packId, customFrames) : null;
      const packLocked = Boolean(pack?.locked && !(framePresetApi?.isFramePackUnlocked?.(pack.id) ?? unlockedFramePackIds.includes(pack.id)));
      if (preset && !packLocked) {
        applyFramePreset({ ...preset, layout: normalizedLayout }, { syncFrameColor: true });
        return;
      }
    }
    updateTweak('layout', normalizedLayout);
    updateTweak('orientation', 'portrait');
    setSelectedFramePresetId('');
    const slotCount = getLayoutSlotCount(normalizedLayout);
    const captureCount = getLayoutCaptureCount(normalizedLayout);
    const nextSelected = Array.from({ length: slotCount }, (_, i) => i);
    const nextShots = Array.from({ length: captureCount }, (_, i) => shots[i] || null);
    setSelected(nextSelected);
    setShots(nextShots);
    try {
      if (nextPresetId) {
        localStorage.removeItem('immm.v2.selectedFramePresetId');
      } else {
        localStorage.removeItem('immm.v2.selectedFramePresetId');
      }
      localStorage.setItem('immm.v2.sel', JSON.stringify(nextSelected));
    } catch (e) {
      console.warn('[IMMM] layout preset sync failed:', e);
    }
  }, [applyFramePreset, customFrames, framePresetApi, framePresetList, getLayoutCaptureCount, getLayoutSlotCount, normalizePresetLayout, shots, unlockedFramePackIds]);

  const frameShotCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(tweaks.layout)
    : (tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4);
  const captureShotCount = getCaptureShotCountForLayout(tweaks.layout);

  // Dummy-fill shots only when debug flag allows (prevents deep-link bypass)
  // Protected routes (select/deco/result) should NOT render with dummy shots in production.
  // Effect guard will redirect to setup if no real photos.
  const allowDummyFill = typeof window !== 'undefined' && window.IMMM_ALLOW_DEEP_LINK_DUMMY === true;
  const needsDummy = allowDummyFill && ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
  const effShots = needsDummy
    ? Array.from({ length: captureShotCount }, () => ({ dataUrl: null, filter: safeFilter }))
    : shots;
  const selectionCount = frameShotCount;
  const defaultSelected = Array.from({ length: selectionCount }, (_, i) => i);
  const effSelected = selected.length === selectionCount ? selected : defaultSelected;

  const variant = tweaks.variant;
  const T = TOKENS[variant];
  const accent = T.pinkDeep;

  const commonProps = {
    T, go, mobile, variant,
    filter: safeFilter,
    layout: tweaks.layout,
    orientation: tweaks.orientation,
    logo: tweaks.logo,
    dateText: tweaks.dateText,
    frameColor: tweaks.frameColor,
    accent,
    tweaks,
    lang, setLang,
    activeSessionId,
    resetSessionState,
    selectedFramePresetId,
    setSelectedFramePresetId,
    framePresetList,
    framePackList,
    customFrames,
    setCustomFrames,
    activeFramePreset,
    applyFramePreset,
    saveCustomFrame,
    exportCustomFramesAsJson,
    importFramePackFromJson,
    renameCustomFrame,
    duplicateCustomFrame,
    deleteCustomFrame: softDeleteCustomFrame,
    unlockedFramePackIds,
    setUnlockedFramePackIds,
    favoriteFramePresetIds,
    setFavoriteFramePresetIds,
    unlockFramePackForDev,
    toggleFavoriteFramePreset,
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
    setScreenLightActive,
  };

  const renderScreen = () => {
    const p = { ...commonProps };
    switch (screen) {
      case 'landing':
        return <LandingV2 {...p}
          onStart={() => { setPhotoEditMode(false); go('setup'); }}
          onEdit={() => { setPhotoEditMode(true); go('setup'); }}
          onGallery={() => go('gallery')}
        />;
      case 'gallery':
        return <GalleryV2 {...p} />;
      case 'share':
        return <SharedPhotoV2 {...p} />;
      case 'setup':
        return <SetupScreen {...p}
          setLayout={setLayoutAndPreset}
          setFilter={v => updateTweak('filter', v)}
          setLogo={v => updateTweak('logo', v)}
          setDateText={v => updateTweak('dateText', v)}
          setOrientation={v => updateTweak('orientation', v)}
          setFrameColor={v => updateTweak('frameColor', v)}
          setUseWebgl={v => updateTweak('useWebgl', v)}
          preStickers={preStickers} setPreStickers={setPreStickers}
          framePreset={activeFramePreset}
          framePresets={framePresetList}
          customFrames={customFrames}
          applyFramePreset={applyFramePreset}
          saveCustomFrame={saveCustomFrame}
          exportCustomFramesAsJson={exportCustomFramesAsJson}
          importFramePackFromJson={importFramePackFromJson}
          editMode={photoEditMode}
          shots={shots} setShots={setShots} setSelected={setSelected}
          startNewCaptureSession={startNewCaptureSession}
        />;
      case 'capture':
        return <CaptureV2 {...p}
          shots={shots} setShots={setShots}
          preStickers={preStickers} muted={!tweaks.sound}
          videoRef={videoRef} canvasRef={canvasRef}
          engineRef={engineRef} webglOk={webglOk} firstFrame={firstFrame}
          camOk={camOk} facingMode={facingMode} setFacingMode={setFacingMode}
          onCameraFrameChange={setCameraBox}
          faceDataRef={faceDataRef}
          cameraZoom={cameraZoom}
          cameraCapabilities={cameraCapabilities}
          cameraSettings={cameraSettings}
          cameraZoomOptions={cameraZoomOptions}
          cameraToggleBusy={cameraToggleBusy}
          torchSupported={torchSupported}
          torchActive={torchActive}
          screenFlashOverlay={screenFlashOverlay}
          setCameraZoom={setCameraZoom}
          setCameraTorch={setCameraTorch}
          runScreenFlash={runScreenFlash}
          applyCameraZoom={applyCameraZoom}
          switchCameraDevice={switchCameraDevice}
          cameraDevices={cameraDevices}
          frontWideCandidates={frontWideCandidates}
          rearWideCandidates={rearWideCandidates}
          activeCameraDeviceId={activeCameraDeviceId}
          normalCameraDeviceId={normalCameraDeviceId}
          wideCameraActive={wideCameraActive}
          toggleWideCamera={toggleWideCamera}
          lastWideToggleReason={lastWideToggleReason}
          lastWideTogglePath={lastWideTogglePath}
          cameraZoomHistory={cameraZoomHistory}
          onDebugSwitchCameraDevice={onDebugSwitchCameraDevice}
          framePreset={activeFramePreset}
        />;
      case 'select':
        return <SelectV2 {...p}
          shots={effShots} selected={selected.slice(0, selectionCount)} setSelected={setSelected}
        />;
      case 'deco':
        // Guard moved to effect — screen should be 'setup' if no photos in current session
        return <DecoV2 {...p}
          shots={effShots} selected={effSelected}
          stickers={stickers} setStickers={setStickers}
          drawStrokes={drawStrokes} setDrawStrokes={setDrawStrokes}
          setDateText={v => updateTweak('dateText', v)}
          framePreset={activeFramePreset}
          saveCustomFrame={saveCustomFrame}
        />;
      case 'result':
        // Guard moved to effect — screen should be 'setup' if no photos in current session
        return <ResultV2 {...p}
          shots={effShots} selected={effSelected}
          stickers={stickers} drawStrokes={drawStrokes}
          framePreset={activeFramePreset}
        />;
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: T.bg, overflow: 'hidden' }}>
      
      {/* PERSISTENT CAMERA/ENGINE SURFACE (Pre-warmed) */}
      <div id="global-camera-box" style={{
        position: 'absolute',
        top: cameraBox ? cameraBox.top : (mobile ? 100 : 88),
        left: cameraBox ? cameraBox.left : (mobile ? 16 : 24),
        width: cameraBox ? cameraBox.width : 'auto',
        height: cameraBox ? cameraBox.height : 'auto',
        right: cameraBox ? 'auto' : (mobile ? 16 : 120),
        bottom: cameraBox ? 'auto' : (mobile ? 180 : 112),
        zIndex: screen === 'capture' ? 5 : -1,
        opacity: screen === 'capture' ? 1 : 0,
        pointerEvents: 'none',
        borderRadius: 24,
        background: '#10233A',
        clipPath: 'inset(0 round 24px)',
        transform: 'translateZ(0)',
        // No filter here — applied per-layer below so CSS always shows
        transition: 'opacity 0.3s ease',
      }}>
        {/* Video layer: always carries CSS fallback filter.
            Hidden behind WebGL canvas once firstFrame is ready. */}
        <video ref={videoRef} playsInline muted autoPlay style={{
          position:'absolute', inset:-1, width:'calc(100% + 2px)', height:'calc(100% + 2px)', objectFit:'cover',
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          borderRadius: 25,
        // CSS filter is always on the video so there's no unfiltered flash
        filter: FILTERS[safeFilter]?.css || 'none',
        // Fade out once WebGL canvas has its first frame rendered
        opacity: (shouldUseWebgl && webglOk && firstFrame) ? 0 : 1,
        transition: 'opacity 0.08s',
      }}/>
      {/* WebGL canvas: fades in over the CSS-filtered video once ready */}
      <canvas ref={canvasRef} style={{
        display:'block', position:'absolute', inset:-1,
        width:'calc(100% + 2px)', height:'calc(100% + 2px)', borderRadius:25,
        opacity: (shouldUseWebgl && webglOk && firstFrame) ? 1 : 0,
        transition: 'opacity 0.08s',
      }}/>
    </div>

      <ScreenTransition id={screen}>
        {renderScreen()}
      </ScreenTransition>
      <BuildPill />
      <FieldTestPanel />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
