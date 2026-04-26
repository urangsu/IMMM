// screens-v2-rest.jsx — Capture, Select, Deco, Result

// ═══════════════════════════════════════════════════════════════
// CAPTURE — 6 shots
// ═══════════════════════════════════════════════════════════════
function CaptureV2({ T, go, mobile, shots, setShots, filter, layout, preStickers, logo, dateText, accent, muted, onRequestCamera }) {
  const videoRef  = React.useRef(null);
  const canvasRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [idx, setIdx]           = React.useState(0);
  const [countdown, setCountdown] = React.useState(0);
  const [timerLen, setTimerLen]   = React.useState(3);
  const [flashing, setFlashing]   = React.useState(false);
  const [auto, setAuto]           = React.useState(false);
  const [camOk, setCamOk]         = React.useState(null);

  // WebGL engine + MediaPipe face detection
  const faceDataRef = (typeof useFaceLandmarks === 'function')
    ? useFaceLandmarks(videoRef)
    : React.useRef({ detected: false });
  const { engineRef, webglOk, firstFrame } = (typeof useFilterEngine === 'function')
    ? useFilterEngine(canvasRef, videoRef, filter, faceDataRef)
    : { engineRef: null, webglOk: false, firstFrame: false };

  const canvasActive = webglOk && firstFrame;

  // Camera init — ideal constraints first, bare fallback for stricter mobile browsers
  React.useEffect(()=> {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) { s.getTracks().forEach(t=>t.stop()); return; }
        streamRef.current = s;
        setCamOk(true);
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(()=>{}); }
      } catch(e) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (!active) { s.getTracks().forEach(t=>t.stop()); return; }
          streamRef.current = s;
          setCamOk(true);
          if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(()=>{}); }
        } catch(_) { setCamOk(false); }
      }
    })();
    return () => { active=false; streamRef.current?.getTracks().forEach(t=>t.stop()); };
  }, []);

  const captureFromVideo = React.useCallback((v) => {
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    try {
      const c = document.createElement('canvas');
      c.width = 720; c.height = 720;
      const ctx = c.getContext('2d');
      ctx.save();
      ctx.translate(c.width, 0); ctx.scale(-1, 1);
      const vw = v.videoWidth, vh = v.videoHeight;
      const size = Math.min(vw, vh);
      const sx = (vw - size) / 2, sy = (vh - size) / 2;
      ctx.drawImage(v, sx, sy, size, size, 0, 0, c.width, c.height);
      ctx.restore();
      return c.toDataURL('image/jpeg', 0.88);
    } catch(e) { return null; }
  }, []);

  const takeShot = React.useCallback(() => {
    setFlashing(true);
    setTimeout(()=>setFlashing(false), 140);

    const doCapture = () => {
      let dataUrl = null;
      // WebGL canvas — only if actively rendering (blank check: real JPEG > 5KB)
      const canvas = canvasRef.current;
      if (canvas && canvasActive) {
        try {
          const raw = canvas.toDataURL('image/jpeg', 0.88);
          if (raw && raw.length > 5000) dataUrl = raw;
        } catch(e) {}
      }
      // Fallback: draw directly from video element (mirrored, 720px)
      if (!dataUrl) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0) dataUrl = captureFromVideo(v);
      }
      setShots(prev => {
        const copy = [...prev];
        while (copy.length < 6) copy.push(null);
        copy[idx] = { dataUrl, filter, ts: Date.now() };
        return copy;
      });
      setIdx(i => Math.min(i+1, 6));
    };

    // Wait for video ready if needed
    const v = videoRef.current;
    if (v && v.readyState < 2) {
      const onReady = () => { v.removeEventListener('canplay', onReady); doCapture(); };
      v.addEventListener('canplay', onReady);
      setTimeout(() => { v.removeEventListener('canplay', onReady); doCapture(); }, 800);
    } else {
      doCapture();
    }
  }, [idx, filter, setShots, canvasActive, captureFromVideo]);

  React.useEffect(()=> {
    if (countdown <= 0) return;
    const t = setTimeout(()=> {
      if (countdown === 1) {
        takeShot();
        setCountdown(0);
        if (auto && idx < 5) setTimeout(()=>setCountdown(3), 700);
      } else setCountdown(c=>c-1);
    }, 900);
    return ()=>clearTimeout(t);
  }, [countdown, auto, idx, takeShot]);

  React.useEffect(()=> {
    if (idx >= 6) setTimeout(()=>go('select'), 600);
  }, [idx, go]);

  const startCountdown = () => { if (countdown===0 && idx<6) setCountdown(timerLen); };
  const toggleAuto = () => { setAuto(a=>!a); if (!auto && idx<6 && countdown===0) setCountdown(timerLen); };
  const thumbs = Array.from({length:6}, (_,i)=> shots[i]);

  const shotsRail = (
    <div style={{ display:'flex', flexDirection: mobile?'row':'column',
      padding: mobile?'0 16px':'0', gap: mobile?6:8,
      minWidth: mobile?'auto':96 }}>
      {!mobile && <Kick T={T}>Roll · 필름</Kick>}
      {thumbs.map((s,i)=> (
        <div key={i} style={{
          flex: mobile?1:'none', width: mobile?'auto':96, aspectRatio:'1',
          borderRadius:10, position:'relative', overflow:'hidden',
          boxShadow: idx===i? `0 0 0 2px ${T.pinkDeep}`: '0 0 0 1px rgba(0,0,0,0.08)',
          background: s? '#000' : T.card,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'box-shadow 0.3s',
        }}>
          {s && s.dataUrl ? (
            <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          ) : s ? (
            <PlaceholderPortrait seed={i} filter={s.filter}/>
          ) : (
            <div style={{ fontSize:17, color:T.inkSoft, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:500 }}>{i+1}</div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection: mobile?'column':'row' }}>
      <div style={{ flex:1, minHeight:0, padding: mobile?'50px 16px 0':'24px', display:'flex', flexDirection:'column' }}>
        <TopBar step={1} back={()=>go('setup')} T={T} mobile={mobile} title={mobile?'Capture':'Step 2 · Shoot your 6'}
          right={<div style={{fontSize:11, color:T.inkSoft, fontFamily:'Pretendard,system-ui'}}>{FILTERS[filter].name}</div>}/>
        {/* Camera fills all remaining flex space */}
        <div style={{ flex:1, minHeight:0, position:'relative', borderRadius:24, overflow:'hidden', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {camOk === false ? (
            <div style={{ position:'absolute', inset:0 }}>
              <PlaceholderPortrait seed={idx} filter={filter}/>
              <div style={{ position:'absolute', top:12, left:12, padding:'6px 10px', background:'rgba(0,0,0,0.55)', color:'#fff', borderRadius:999, fontSize:10, letterSpacing:1.5, fontFamily:'"Plus Jakarta Sans",system-ui' }}>DEMO MODE</div>
            </div>
          ) : (
            <>
              {/* Video: always opacity>0 — iOS Safari stops painting frames at opacity:0,
                  breaking WebGL texImage2D reads. Canvas overlays it when active. */}
              <video ref={videoRef} playsInline muted autoPlay style={{
                position:'absolute', inset:0, width:'100%', height:'100%',
                objectFit:'cover', transform:'scaleX(-1)',
                filter: canvasActive ? 'none' : (FILTERS[filter]?.css || 'none'),
                opacity: canvasActive ? 0.001 : 1,
                pointerEvents:'none',
              }}/>
              {/* WebGL canvas: fades in over video once a non-black frame is confirmed */}
              <canvas ref={canvasRef} style={{
                display:'block', position:'absolute',
                top:'50%', left:'50%',
                transform:'translate(-50%,-50%)',
                minWidth:'100%', minHeight:'100%',
                opacity: canvasActive ? 1 : 0,
                transition: canvasActive ? 'opacity 0.25s' : 'none',
                pointerEvents:'none',
              }}/>
            </>
          )}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
            {preStickers.map(s => (
              <div key={s.id} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
                transform:`translate(-50%,-50%) rotate(${s.rotation||0}deg) scale(${s.scale||1})`, opacity:0.88 }}>
                {renderStickerInstance(s)}
              </div>
            ))}
          </div>
          {countdown>0 && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
              background:'radial-gradient(circle, rgba(0,0,0,0.2), rgba(0,0,0,0.55))' }}>
              <div key={countdown} style={{
                fontFamily:'"Plus Jakarta Sans",system-ui', fontSize:220, fontWeight:300, color:'#fff',
                letterSpacing:-8, textShadow:'0 20px 60px rgba(0,0,0,0.4)',
                animation:'countPop 0.9s cubic-bezier(0.16,1,0.3,1)',
              }}>{countdown}</div>
            </div>
          )}
          {flashing && <div style={{ position:'absolute', inset:0, background:'#fff', animation:'flash 0.14s ease-out' }}/>}
          <div style={{ position:'absolute', top:14, right:14, padding:'8px 14px',
            background:'rgba(0,0,0,0.3)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            color:'#fff', borderRadius:999, fontSize:11, letterSpacing:1.5, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:600 }}>
            {String(Math.min(idx+1,6)).padStart(2,'0')} / 06
          </div>
          {canvasActive && (
            <div style={{ position:'absolute', top:14, left:14, padding:'5px 9px',
              background:'rgba(0,0,0,0.28)', backdropFilter:'blur(10px)',
              color:'rgba(255,255,255,0.75)', borderRadius:999, fontSize:9, letterSpacing:1.5, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:600 }}>
              GL · {filter.toUpperCase()}
            </div>
          )}
        </div>
        {/* Shutter row - fixed height, centered */}
        <div style={{ flexShrink:0, height:88, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <div style={{ position:'absolute', left:0, display:'flex', gap:6 }}>
            <button onClick={toggleAuto} style={{
              padding:'10px 14px', borderRadius:999, border:'none',
              background: auto? T.ink : 'rgba(26,26,31,0.06)',
              color: auto? T.bg : T.ink, fontSize:12, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontFamily:'"Plus Jakarta Sans",system-ui',
              transition:'all 0.2s',
            }}>
              <div style={{ width:6, height:6, borderRadius:999, background: auto? T.pinkDeep : T.inkSoft, transition:'background 0.2s' }}/>
              Auto
            </button>
            <button onClick={() => setTimerLen(t => t === 3 ? 5 : 3)} style={{
              padding:'10px 14px', borderRadius:999, border:'none',
              background: 'rgba(26,26,31,0.06)',
              color: T.ink, fontSize:12, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:4, fontFamily:'"Plus Jakarta Sans",system-ui',
              transition:'all 0.2s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {timerLen}s
            </button>
          </div>
          <button onClick={startCountdown} disabled={idx>=6} style={{
            width:76, height:76, borderRadius:999,
            border:'none', background: countdown>0? T.pinkDeep : T.ink,
            cursor: idx>=6? 'default':'pointer', padding:6,
            boxShadow:'0 10px 30px rgba(217,136,147,0.35)',
            transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s',
            transform: countdown>0? 'scale(0.92)':'scale(1)',
          }}>
            <div style={{ width:'100%', height:'100%', borderRadius:999, background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:54, height:54, borderRadius:999, background: countdown>0? T.pinkDeep : T.ink, transition:'background 0.2s' }}/>
            </div>
          </button>
          <div style={{ position:'absolute', right:0, padding:'10px 14px', borderRadius:999, background:'rgba(26,26,31,0.06)', fontSize:12, color:T.inkSoft, fontFamily:'Pretendard,system-ui' }}>
            {Math.max(0, 6-idx)} left
          </div>
        </div>
        {/* Thumbnail strip - mobile only */}
        {mobile && (
          <div style={{ flexShrink:0, display:'flex', gap:5, paddingBottom:14 }}>
            {thumbs.map((s,i)=>(
              <div key={i} style={{
                flex:1, aspectRatio:'1', borderRadius:8, position:'relative', overflow:'hidden',
                boxShadow: idx===i? `0 0 0 2px ${T.pinkDeep}`: '0 0 0 1px rgba(0,0,0,0.08)',
                background: s? '#000' : T.card, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'box-shadow 0.3s',
              }}>
                {s && s.dataUrl ? <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : s ? <PlaceholderPortrait seed={i} filter={s.filter}/>
                : <div style={{ fontSize:14, color:T.inkSoft, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:500 }}>{i+1}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {!mobile && <div style={{ padding:'24px 20px', background:T.bgAlt, borderLeft:'1px solid rgba(0,0,0,0.04)' }}>{shotsRail}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════
function SelectV2({ T, go, mobile, shots, selected, setSelected }) {
  const toggle = (i) => {
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x=>x!==i);
      if (prev.length >= 4) return prev;
      return [...prev, i];
    });
  };
  return (
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection:'column',
      padding: mobile?'50px 18px 18px':'24px 56px 24px' }}>
      <TopBar step={2} back={()=>go('capture')} T={T} mobile={mobile} title={mobile?'Select':'Step 3 · Pick your 4'}
        right={<div style={{fontSize:12, color:T.inkSoft, fontFamily:'Pretendard,system-ui'}}>{selected.length}/4</div>}/>
      <div style={{ marginBottom: mobile?12:20, textAlign: mobile? 'left':'center' }}>
        <h2 style={{ margin:0, fontFamily:'"Plus Jakarta Sans",system-ui', fontSize: mobile?26:40, fontWeight:500, letterSpacing:-1 }}>
          Pick your best <span style={{ fontFamily:'Caveat,cursive', color: T.pinkDeep, fontSize: mobile?32:52 }}>four.</span>
        </h2>
        <div style={{ marginTop:4, color:T.inkSoft, fontSize: mobile?13:14.5, fontFamily:'Pretendard,system-ui' }}>
          Tap in order — we'll place them in the frame the same way.
        </div>
      </div>
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gridTemplateRows:'repeat(2, minmax(0, 1fr))', gap: mobile?8:14, minHeight: 0 }}>
        {shots.map((s,i)=>{
          const sel = selected.indexOf(i);
          const isSel = sel>=0;
          return (
            <button key={i} onClick={()=>toggle(i)} style={{
              position:'relative', aspectRatio:'1', borderRadius: mobile?14:18, overflow:'hidden',
              padding:0, background:'#000', cursor:'pointer', border:'none',
              maxWidth: '100%', maxHeight: '100%', placeSelf: 'center', width: '100%',
              boxShadow: isSel ? `0 14px 30px rgba(0,0,0,0.15), 0 0 0 3px ${T.ink}` : '0 1px 3px rgba(0,0,0,0.06)',
              transform: isSel? 'scale(0.96)':'scale(1)',
              transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              {s && s.dataUrl ? (
                <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              ) : s ? <PlaceholderPortrait seed={i} filter={s.filter||'porcelain'}/> : null}
              {isSel && (
                <div style={{ position:'absolute', top:10, left:10, width:32, height:32, borderRadius:999, background:T.ink, color:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, fontFamily:'"Plus Jakarta Sans",system-ui',
                  animation:'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  {sel+1}
                </div>
              )}
              {!isSel && selected.length>=4 && <div style={{ position:'absolute', inset:0, background:'rgba(250,247,245,0.55)', backdropFilter:'blur(2px)' }}/>}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: mobile?16:24, display:'flex', gap:12, justifyContent:'flex-end', alignItems:'center' }}>
        <button onClick={()=>setSelected([])} style={{ background:'transparent', border:'none', cursor:'pointer', color:T.inkSoft, fontSize:13, fontFamily:'Pretendard,system-ui' }}>Clear</button>
        <BtnPrimary T={T} onClick={()=>selected.length===4 && go('deco')} size={mobile?'md':'lg'} disabled={selected.length!==4}>
          {selected.length===4 ? <>Deco studio · 꾸미기  {I.arrowR(16, T.bg)}</> : `Pick ${4-selected.length} more`}
        </BtnPrimary>
      </div>
    </div>
  );
}

Object.assign(window, { CaptureV2, SelectV2 });
