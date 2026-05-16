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
  render() {
    if (this.state.error) {
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
          margin: '0 0 16px',
          color: '#666',
          lineHeight: 1.5
        }
      }, "\uBE0C\uB77C\uC6B0\uC800 \uD638\uD658\uC131 \uB610\uB294 \uC2A4\uD06C\uB9BD\uD2B8 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("pre", {
        style: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: '#f4f4f4',
          padding: 12,
          borderRadius: 8,
          fontSize: 12
        }
      }, this.state.error?.stack || this.state.error?.message || String(this.state.error)));
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
  if (layout === 'polaroid') return 3;
  if (layout === 'trip') return 5;
  return 6;
}
function trackImmmEvent(name, payload = {}) {
  try {
    var safePayload = {
      ...payload
    };
    delete safePayload.dataUrl;
    delete safePayload.blob;
    delete safePayload.image;
    delete safePayload.photo;
    window.dataLayer?.push({
      event: name,
      ...safePayload
    });
    window.gtag?.('event', name, safePayload);
    window.plausible?.(name, {
      props: safePayload
    });
    if (window.IMMM_DEBUG_ANALYTICS) {
      console.info('[IMMM analytics]', name, safePayload);
    }
  } catch (e) {}
}
window.trackImmmEvent = trackImmmEvent;
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
  var [screen, setScreen] = React.useState(() => location.hash.startsWith('#/s/') ? 'share' : localStorage.getItem('immm.v2.screen') || 'landing');
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

  // --- SESSION INFRASTRUCTURE (Phase 3.48 Enforcement) ---
  var SESSION_RESET = 'SESSION_RESET';
  var EXPORT_KEY = 'immm.v2.export';
  var BLOB_CLEAR = 'BLOB_CLEAR';
  window.IMMMSessionTracer = {
    trace: (event, data) => console.log(`[IMMMSession] ${event}:`, data),
    reset: () => window.dispatchEvent(new CustomEvent(SESSION_RESET))
  };
  var [activeSessionId, setActiveSessionId] = React.useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  var resetSessionState = (isEdit = false) => {
    var newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setActiveSessionId(newId);
    setPhotoEditMode(isEdit);

    // Clear all capture/edit data
    var shotCount = typeof getLayoutSlotCount === 'function' ? getLayoutSlotCount(tweaks.layout) : 4;
    setShots(Array(shotCount).fill(null));
    setSelected([]);
    setStickers([]);
    setDrawStrokes([]);
    setPreStickers([]);

    // Clear local storage and blobs
    localStorage.removeItem('immm.v2.sel');
    localStorage.removeItem(EXPORT_KEY);
    window.dispatchEvent(new CustomEvent(BLOB_CLEAR));
    window.IMMMSessionTracer.trace(SESSION_RESET, {
      newId,
      isEdit
    });
  };
  var startNewCaptureSession = () => {
    resetSessionState(false);
    go('setup');
  };

  // Responsive mobile detection
  var [mobile, setMobile] = React.useState(() => window.innerWidth < 640);
  React.useEffect(() => {
    var handler = () => setMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  var safeFilter = typeof getSafeFilterKey === 'function' ? getSafeFilterKey(tweaks.filter) : tweaks.filter;

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
    if (window.trackImmmEvent) {
      window.trackImmmEvent('app_boot', {
        version: window.IMMM_APP_VERSION,
        buildLabel: window.IMMM_BUILD_LABEL
      });
    }
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
  var [torchSupported, setTorchSupported] = React.useState(false);
  var [torchEnabled, setTorchEnabled] = React.useState(false);
  var [screenFlashEnabled, setScreenFlashEnabled] = React.useState(false);
  var [screenFlashActive, setScreenFlashActive] = React.useState(false);
  var [cameraZoomHistory, setCameraZoomHistory] = React.useState([]);
  var pushCameraZoomHistory = React.useCallback(entry => {
    if (!window.IMMM_DEBUG_CAMERA) return;
    setCameraZoomHistory(prev => [{
      ts: Date.now(),
      ...entry
    }, ...prev].slice(0, 10));
  }, []);
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
          // torch support
          setTorchSupported(!!capabilities.torch);
          setTorchEnabled(settings.torch || false);

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
      setTorchEnabled(enabled);
      return true;
    } catch (e) {
      console.warn('[IMMM camera] torch failed:', e);
      return false;
    }
  }, [torchSupported]);
  var runScreenFlash = React.useCallback(async () => {
    if (!screenFlashEnabled || facingMode !== 'user') return;
    setScreenFlashActive(true);
    await new Promise(r => setTimeout(r, 450));
    setScreenFlashActive(false);
  }, [screenFlashEnabled, facingMode]);
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
    if (screen !== 'share') localStorage.setItem('immm.v2.screen', screen);
  }, [screen]);
  React.useEffect(() => {
    localStorage.setItem('immm.v2.sel', JSON.stringify(selected));
  }, [selected]);

  // Samsung Internet suspends background video (opacity:0, zIndex:-1 screens).
  // Force-resume when user enters capture so the camera feed is guaranteed live.
  React.useEffect(() => {
    if (screen === 'capture' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [screen]);
  var go = s => {
    if (s === 'deco' && stickers.length === 0 && preStickers.length > 0) {
      setStickers([...preStickers]);
    }
    if (s === 'capture') {
      var currentShotsNotEmpty = shots.some(s => s?.dataUrl);
      if (currentShotsNotEmpty) {
        var newShotCount = getCaptureShotCountForLayout(tweaks.layout);
        setShots(Array(newShotCount).fill(null));
        setSelected([]);
      }
    }
    setScreen(s);
  };
  var updateTweak = (k, v) => setTweaks(prev => ({
    ...prev,
    [k]: v
  }));
  var frameShotCount = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(tweaks.layout) : tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4;
  var captureShotCount = getCaptureShotCountForLayout(tweaks.layout);

  // Dummy-fill shots when jumping deep without capturing
  var needsDummy = ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
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
    startNewCaptureSession
  };
  var renderScreen = () => {
    var p = {
      ...commonProps
    };
    switch (screen) {
      case 'landing':
        return /*#__PURE__*/React.createElement(LandingV2, _extends({}, p, {
          onStart: startNewCaptureSession,
          onEdit: () => {
            resetSessionState(true);
            go('setup');
          },
          onGallery: () => go('gallery')
        }));
      case 'gallery':
        return /*#__PURE__*/React.createElement(GalleryV2, p);
      case 'share':
        return /*#__PURE__*/React.createElement(SharedPhotoV2, p);
      case 'setup':
        return /*#__PURE__*/React.createElement(SetupScreen, _extends({}, p, {
          setLayout: v => updateTweak('layout', v),
          setFilter: v => updateTweak('filter', v),
          setLogo: v => updateTweak('logo', v),
          setDateText: v => updateTweak('dateText', v),
          setOrientation: v => updateTweak('orientation', v),
          setFrameColor: v => updateTweak('frameColor', v),
          setUseWebgl: v => updateTweak('useWebgl', v),
          preStickers: preStickers,
          setPreStickers: setPreStickers,
          editMode: photoEditMode,
          shots: shots,
          setShots: setShots,
          setSelected: setSelected
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
          torchEnabled: torchEnabled,
          screenFlashEnabled: screenFlashEnabled,
          screenFlashActive: screenFlashActive,
          setCameraZoom: setCameraZoom,
          setCameraTorch: setCameraTorch,
          setScreenFlashEnabled: setScreenFlashEnabled,
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
          onDebugSwitchCameraDevice: onDebugSwitchCameraDevice
        }));
      case 'select':
        return /*#__PURE__*/React.createElement(SelectV2, _extends({}, p, {
          shots: effShots,
          selected: selected.slice(0, selectionCount),
          setSelected: setSelected
        }));
      case 'deco':
        return /*#__PURE__*/React.createElement(DecoV2, _extends({}, p, {
          shots: effShots,
          selected: effSelected,
          stickers: stickers,
          setStickers: setStickers,
          drawStrokes: drawStrokes,
          setDrawStrokes: setDrawStrokes,
          setDateText: v => updateTweak('dateText', v)
        }));
      case 'result':
        return /*#__PURE__*/React.createElement(ResultV2, _extends({}, p, {
          shots: effShots,
          selected: effSelected,
          stickers: stickers,
          drawStrokes: drawStrokes
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
  }, renderScreen()), /*#__PURE__*/React.createElement(BuildPill, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(AppErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));