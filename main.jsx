// main.jsx — IMMM Photobooth real app entry (no prototype chrome) - Refresh trigger

function App() {
  const [tweaks, setTweaks] = React.useState({
    variant: 'A',
    layout: 'trip',
    orientation: 'portrait',
    filter: 'glitter',
    sound: true,
    logo: true,
    dateText: true,
    frameColor: '#ffffff',
  });

  const [screen, setScreen] = React.useState(
    () => localStorage.getItem('immm.v2.screen') || 'landing'
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
  const faceTrackedFilters = ['blush', 'purikura'];
  const shouldUseWebgl = !mobile || faceTrackedFilters.includes(tweaks.filter);
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
    ? useFilterEngine(canvasRef, videoRef, tweaks.filter, faceDataRef, !shouldUseWebgl, facingMode === 'user')
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

  React.useEffect(() => { localStorage.setItem('immm.v2.screen', screen); }, [screen]);
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

  // Dummy-fill shots when jumping deep without capturing
  const needsDummy = ['select', 'deco', 'result'].includes(screen) && shots.every(s => !s);
  const effShots = needsDummy
    ? Array.from({ length: 6 }, () => ({ dataUrl: null, filter: tweaks.filter }))
    : shots;
  const selectionCount = tweaks.layout === 'trip' ? 3 : 4;
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
    lang, setLang,
  };

  const renderScreen = () => {
    const p = { ...commonProps };
    switch (screen) {
      case 'landing':
        return <LandingV2 {...p}
          onStart={() => { setPhotoEditMode(false); go('setup'); }}
          onEdit={() => { setPhotoEditMode(true); go('setup'); }}
        />;
      case 'setup':
        return <SetupScreen {...p}
          setLayout={v => updateTweak('layout', v)}
          setFilter={v => updateTweak('filter', v)}
          setLogo={v => updateTweak('logo', v)}
          setDateText={v => updateTweak('dateText', v)}
          setOrientation={v => updateTweak('orientation', v)}
          setFrameColor={v => updateTweak('frameColor', v)}
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
