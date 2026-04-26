// main.jsx — IMMM Photobooth real app entry (no prototype chrome)

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

  React.useEffect(() => { localStorage.setItem('immm.v2.screen', screen); }, [screen]);
  React.useEffect(() => { localStorage.setItem('immm.v2.sel', JSON.stringify(selected)); }, [selected]);

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
  const effSelected = selected.length === 4 ? selected : [0, 1, 2, 3];

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
        />;
      case 'select':
        return <SelectV2 {...p}
          shots={effShots} selected={selected.slice(0, 4)} setSelected={setSelected}
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', overflow: 'hidden' }}>
      <ScreenTransition id={screen}>
        {renderScreen()}
      </ScreenTransition>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
