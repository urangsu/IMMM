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

  // ═══════════════════════════════════════════════════════════════
  // Persistent Background Engine (Pre-warming)
  // ═══════════════════════════════════════════════════════════════
  const videoRef  = React.useRef(null);
  const canvasRef = React.useRef(null);
  // EMERGENCY: Disable face landmarks entirely on Samsung Internet or if GEOMETRY_DISABLED is true.
  const faceDataRef = (!forceSafeCameraMode && typeof useFaceLandmarks === 'function')
    ? useFaceLandmarks(videoRef)
    : React.useRef({ detected: false, faces: [] });
  const [facingMode, setFacingMode] = React.useState('user');
  const [camOk, setCamOk] = React.useState(null);
  const streamRef = React.useRef(null);
  const [cameraZoom, setCameraZoom] = React.useState(1);
  const [cameraCapabilities, setCameraCapabilities] = React.useState(null);
  const [cameraSettings, setCameraSettings] = React.useState(null);

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
          setCameraZoom(1);
          console.info('[IMMM camera] actual settings:', settings);
          if (window.IMMM_DEBUG_CAMERA) {
            console.info('[IMMM camera] capabilities:', capabilities);
            console.info('[IMMM camera] constraints:', constraints);
          }
          // Ultrawide device candidate enumeration (debug only)
          if (window.IMMM_DEBUG_CAMERA && navigator.mediaDevices?.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
              const vidInputs = devices.filter(d => d.kind === 'videoinput');
              const uwKeywords = ['ultra', 'wide', 'back', 'rear', '0.5', '0.6', '광각', '초광각'];
              const candidates = vidInputs.filter(d =>
                uwKeywords.some(kw => d.label.toLowerCase().includes(kw))
              );
              if (candidates.length) console.info('[IMMM camera] ultrawide candidates:', candidates);
            }).catch(() => {});
          }
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
    if (!track || typeof track.applyConstraints !== 'function') return false;
    const caps = track.getCapabilities?.() || {};
    if (!caps.zoom) return false;
    const min = caps.zoom.min ?? 1;
    const max = caps.zoom.max ?? 1;
    const clamped = Math.max(min, Math.min(max, zoom));
    try {
      await track.applyConstraints({ advanced: [{ zoom: clamped }] });
      setCameraZoom(clamped);
      setCameraSettings(track.getSettings?.() || {});
      return true;
    } catch (e) {
      console.warn('[IMMM camera] zoom apply failed:', e);
      return false;
    }
  }, []);

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
      const newShotCount = tweaks.layout === 'polaroid' ? 1 : 6;
      setShots(Array(newShotCount).fill(null));
      setSelected([]);
    }
    setScreen(s);
  };
  const updateTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  const frameShotCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(tweaks.layout)
    : (tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4);
  const captureShotCount = tweaks.layout === 'polaroid' ? 1 : 6;

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
          applyCameraZoom={applyCameraZoom}
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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
