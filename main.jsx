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
    layout: 'trip',
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
  const faceTrackedFilters = ['blush', 'purikura', 'glam', 'aurora'];
  const shouldUseWebgl = tweaks.useWebgl && faceTrackedFilters.includes(tweaks.filter);
  const [cameraBox, setCameraBox] = React.useState(null);

  // ═══════════════════════════════════════════════════════════════
  // Persistent Background Engine (Pre-warming)
  // ═══════════════════════════════════════════════════════════════
  const videoRef  = React.useRef(null);
  const canvasRef = React.useRef(null);
  const faceDataRef = (typeof useFaceLandmarks === 'function')
    ? useFaceLandmarks(videoRef)
    : React.useRef({ detected: false });
  const [facingMode, setFacingMode] = React.useState('user');
  const [camOk, setCamOk] = React.useState(null);
  const streamRef = React.useRef(null);

  // useFilterEngine stays active from the start, warming up shaders
  const { engineRef, webglOk, firstFrame, webglFailed } = (typeof useFilterEngine === 'function')
    ? useFilterEngine(canvasRef, videoRef, tweaks.filter, faceDataRef, !shouldUseWebgl, facingMode === 'user', mobile)
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
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        setCamOk(true);
        if (videoRef.current) {
          // webkit-playsinline must be set BEFORE srcObject+play on Samsung Internet
          videoRef.current.setAttribute('webkit-playsinline', '');
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } catch (e) {
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
    setScreen(s);
  };
  const updateTweak = (k, v) => setTweaks(prev => ({ ...prev, [k]: v }));

  const shotCount = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(tweaks.layout)
    : (tweaks.layout === 'polaroid' ? 1 : tweaks.layout === 'trip' ? 3 : 4);

  // Dummy-fill shots when jumping deep without capturing
  const needsDummy = ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
  const effShots = needsDummy
    ? Array.from({ length: shotCount }, () => ({ dataUrl: null, filter: tweaks.filter }))
    : shots;
  const selectionCount = shotCount;
  const defaultSelected = Array.from({ length: selectionCount }, (_, i) => i);
  const effSelected = selected.length === selectionCount ? selected : defaultSelected;

  const variant = tweaks.variant;
  const T = TOKENS[variant];
  const accent = T.pinkDeep;

  const commonProps = {
    T, go, mobile, variant,
    filter: tweaks.filter,
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
        background: '#000',
        filter: (!shouldUseWebgl || webglFailed) ? (FILTERS[tweaks.filter]?.css || 'none') : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <video ref={videoRef} playsInline muted autoPlay style={{
          width:'100%', height:'100%', objectFit:'cover',
          transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
          borderRadius: 24,
        }}/>
        <canvas ref={canvasRef} style={{
          display:'block', position:'absolute', inset:0,
          width:'100%', height:'100%', borderRadius:24,
          opacity: (shouldUseWebgl && webglOk && firstFrame) ? 1 : 0,
          transition: 'opacity 0.2s',
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
