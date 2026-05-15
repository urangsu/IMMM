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

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', padding:24, background:'#fff', color:'#111', fontFamily:'Pretendard,system-ui' }}>
          <h1 style={{ margin:'0 0 8px', fontSize:20 }}>앱을 불러오지 못했어요.</h1>
          <p style={{ margin:'0 0 16px', color:'#666', lineHeight:1.5 }}>브라우저 호환성 또는 스크립트 오류가 발생했습니다.</p>
          <pre style={{ whiteSpace:'pre-wrap', wordBreak:'break-word', background:'#f4f4f4', padding:12, borderRadius:8, fontSize:12 }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
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
  const [activeSessionId, setActiveSessionId] = React.useState(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

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

  // Responsive mobile detection
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 640);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const safeFilter = typeof getSafeFilterKey === 'function' ? getSafeFilterKey(tweaks.filter) : tweaks.filter;

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
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  const [torchUnavailableReason, setTorchUnavailableReason] = React.useState(null);

  // Screen light fallback for front camera
  const [screenLightSupported, setScreenLightSupported] = React.useState(true);
  const [screenLightActive, setScreenLightActive] = React.useState(false);
  const [screenLightIntensity, setScreenLightIntensity] = React.useState(0.5);

  const [screenFlashEnabled, setScreenFlashEnabled] = React.useState(false);
  const [screenFlashActive, setScreenFlashActive] = React.useState(false);
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

  // Session reset helper: clears main app state without using localStorage.clear()
  const resetSessionState = React.useCallback((reason = 'new-session') => {
    console.debug(`[IMMM] Resetting session (${reason})`);

    // Clear capture state
    setShots(Array(6).fill(null));
    setSelected([]);

    // Clear deco state
    setStickers([]);
    setDrawStrokes([]);
    setPreStickers([]);

    // Clear photo edit state
    setPhotoEditMode(false);

    // Generate new session ID for state isolation
    const nextSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setActiveSessionId(nextSessionId);
  }, []);

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
            setTorchEnabled(settings.torch || false);
          } else {
            setTorchSupported(false);
            setTorchUnavailableReason(facingMode === 'user' ? 'front-camera-no-torch' : 'hardware-no-torch');
            setTorchEnabled(false);
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
      setTorchEnabled(enabled);
      return true;
    } catch (e) {
      console.warn('[IMMM camera] torch failed:', e);
      return false;
    }
  }, [torchSupported]);

  const runScreenFlash = React.useCallback(async () => {
    if (!screenFlashEnabled || facingMode !== 'user') return;
    setScreenFlashActive(true);
    await new Promise(r => setTimeout(r, 450));
    setScreenFlashActive(false);
  }, [screenFlashEnabled, facingMode]);

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
  React.useEffect(() => { localStorage.setItem('immm.v2.sel', JSON.stringify(selected)); }, [selected]);

  // Samsung Internet suspends background video (opacity:0, zIndex:-1 screens).
  // Force-resume when user enters capture so the camera feed is guaranteed live.
  React.useEffect(() => {
    if (screen === 'capture' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [screen]);

  const go = (s) => {
    if (s === 'deco' && stickers.length === 0 && preStickers.length > 0) {
      setStickers([...preStickers]);
    }
    // Reset shots + selected when starting a fresh capture session.
    // This prevents previous roll's shots leaking into SelectV2 on re-capture.
    if (s === 'capture') {
      const newShotCount = getCaptureShotCountForLayout(tweaks.layout);
      setShots(Array(newShotCount).fill(null));
      setSelected([]);
    }
    setScreen(s);
  };
  const updateTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  const frameShotCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(tweaks.layout)
    : (tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4);
  const captureShotCount = getCaptureShotCountForLayout(tweaks.layout);

  // Dummy-fill shots when jumping deep without capturing
  const needsDummy = ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
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
    screenLightIntensity,
    setScreenLightIntensity,
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
          setLayout={v => updateTweak('layout', v)}
          setFilter={v => updateTweak('filter', v)}
          setLogo={v => updateTweak('logo', v)}
          setDateText={v => updateTweak('dateText', v)}
          setOrientation={v => updateTweak('orientation', v)}
          setFrameColor={v => updateTweak('frameColor', v)}
          setUseWebgl={v => updateTweak('useWebgl', v)}
          preStickers={preStickers} setPreStickers={setPreStickers}
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
          torchEnabled={torchEnabled}
          screenFlashEnabled={screenFlashEnabled}
          screenFlashActive={screenFlashActive}
          setCameraZoom={setCameraZoom}
          setCameraTorch={setCameraTorch}
          setScreenFlashEnabled={setScreenFlashEnabled}
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
        />;
      case 'select':
        return <SelectV2 {...p}
          shots={effShots} selected={selected.slice(0, selectionCount)} setSelected={setSelected}
        />;
      case 'deco':
        return <DecoV2 {...p}
          shots={effShots} selected={effSelected}
          stickers={stickers} setStickers={setStickers}
          drawStrokes={drawStrokes} setDrawStrokes={setDrawStrokes}
          setDateText={v => updateTweak('dateText', v)}
        />;
      case 'result':
        return <ResultV2 {...p}
          shots={effShots} selected={effSelected}
          stickers={stickers} drawStrokes={drawStrokes}
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
