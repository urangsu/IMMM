// screens-v2-rest.jsx — Capture, Select, Deco, Result

// ═══════════════════════════════════════════════════════════════
// CAPTURE — 6 shots
// ═══════════════════════════════════════════════════════════════
function CaptureV2({ T, go, mobile, shots, setShots, filter, layout, preStickers, logo, dateText, accent, muted, onRequestCamera,
  videoRef, canvasRef, engineRef, webglOk, firstFrame, camOk, facingMode, setFacingMode, onCameraFrameChange
}) {
  const [idx, setIdx]           = React.useState(0);
  const [countdown, setCountdown] = React.useState(0);
  const [timerLen, setTimerLen]   = React.useState(3);
  const [flashing, setFlashing]   = React.useState(false);
  const [auto, setAuto]           = React.useState(false);
  const [overlayBox, setOverlayBox] = React.useState(null);
  const touchStartY = React.useRef(null);
  const cameraFrameRef = React.useRef(null);

  const canvasActive = webglOk && firstFrame;

  React.useEffect(() => {
    if (!onCameraFrameChange || !cameraFrameRef.current) return;
    const update = () => {
      if (!cameraFrameRef.current) return;
      const r = cameraFrameRef.current.getBoundingClientRect();
      onCameraFrameChange({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
      setOverlayBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(cameraFrameRef.current);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      setOverlayBox(null);
      onCameraFrameChange(null);
    };
  }, [onCameraFrameChange, mobile]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    // Swipe up (diff > 50px)
    if (diff > 50) toggleCamera();
    touchStartY.current = null;
  };

  const captureFromVideo = React.useCallback((v, filterKey, cssFilter, mirrorX) => {
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    try {
      const c = document.createElement('canvas');
      const rect = cameraFrameRef.current?.getBoundingClientRect();
      const aspect = rect?.width && rect?.height ? rect.width / rect.height : 1;
      c.width = 720;
      c.height = Math.max(1, Math.round(720 / aspect));
      const ctx = c.getContext('2d');
      ctx.save();
      if (mirrorX) {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      }
      // Apply CSS filter so fallback captures match what the preview showed
      if (cssFilter && cssFilter !== 'none') ctx.filter = cssFilter;
      const vw = v.videoWidth, vh = v.videoHeight;
      const srcAspect = vw / vh;
      let sx = 0, sy = 0, sw = vw, sh = vh;
      if (srcAspect > aspect) {
        sw = vh * aspect;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / aspect;
        sy = (vh - sh) / 2;
      }
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
      ctx.restore();
      applyCapturedFilterLook(ctx, c.width, c.height, filterKey);
      return c.toDataURL('image/jpeg', 0.88);
    } catch(e) { return null; }
  }, []);

  const applyCapturedFilterLook = (ctx, w, h, filterKey) => {
    ctx.save();
    if (filterKey === 'porcelain') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,244,236,0.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'smooth') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,238,230,0.16)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'blush') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,238,232,0.14)';
      ctx.fillRect(0, 0, w, h);
      const blush = ctx.createRadialGradient(w * 0.30, h * 0.52, 0, w * 0.30, h * 0.52, w * 0.16);
      blush.addColorStop(0, 'rgba(255,108,124,0.30)');
      blush.addColorStop(1, 'rgba(255,108,124,0)');
      ctx.fillStyle = blush;
      ctx.fillRect(0, 0, w, h);
      const blush2 = ctx.createRadialGradient(w * 0.70, h * 0.52, 0, w * 0.70, h * 0.52, w * 0.16);
      blush2.addColorStop(0, 'rgba(255,108,124,0.30)');
      blush2.addColorStop(1, 'rgba(255,108,124,0)');
      ctx.fillStyle = blush2;
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'purikura') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,244,250,0.20)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.12, w * 0.5, h * 0.42, w * 0.62);
      vignette.addColorStop(0, 'rgba(255,255,255,0)');
      vignette.addColorStop(1, 'rgba(255,255,255,0.20)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'grain') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(244,226,205,0.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 260; i++) {
        const x = (i * 97) % w;
        const y = (i * 53) % h;
        ctx.globalAlpha = 0.08 + (i % 5) * 0.015;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  const takeShot = React.useCallback(() => {
    setFlashing(true);
    setTimeout(()=>setFlashing(false), 140);

    const doCapture = () => {
      let dataUrl = null;
      // WebGL canvas — only if actively rendering (blank check: real JPEG > 5KB)
      const canvas = canvasRef.current;
      // WebGL canvas capture - use the engine directly if available for reliable filtered result
      if (canvasActive && engineRef.current) {
        try {
          const { w, h, mirrorX } = engineRef.current._getSize();
          const { pipeline, faceUniforms } = engineRef.current._getParams();
          const raw = engineRef.current.takeSnapshot(w, h, mirrorX, pipeline, faceUniforms);
          if (raw && raw.length > 5000) dataUrl = raw;
        } catch(e) { console.error('WebGL Capture Error:', e); }
      }
      
      // Fallback: draw from video with CSS filter (important for mobile/Safari)
      if (!dataUrl) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0) {
          // If WebGL is supported but capture failed, we MUST still apply the CSS filter for the shot
          const cssFilter = FILTERS[filter]?.css || 'none';
          dataUrl = captureFromVideo(v, filter, cssFilter, facingMode === 'user');
        }
      }
      const rect = cameraFrameRef.current?.getBoundingClientRect();
      setShots(prev => {
        const copy = [...prev];
        while (copy.length < 6) copy.push(null);
        copy[idx] = {
          dataUrl,
          filter,
          capturedFilter: filter,
          renderMode: dataUrl && canvasActive ? 'webgl' : 'canvas2d-css',
          preStickers: preStickers.map(s => ({ ...s })),
          facingMode,
          mirrored: facingMode === 'user',
          width: rect?.width ? Math.round(rect.width) : 720,
          height: rect?.height ? Math.round(rect.height) : 720,
          ts: Date.now(),
        };
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
  }, [idx, filter, setShots, canvasActive, captureFromVideo, facingMode]);

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
  const renderShotStickers = (s) => (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {(s?.preStickers || []).map(st => (
        <div key={st.id} style={{ position:'absolute', left:`${st.x}%`, top:`${st.y}%`,
          transform:`translate(-50%,-50%) rotate(${st.rotation||0}deg) scale(${st.scale||1})`, opacity:0.88 }}>
          {renderStickerInstance(st)}
        </div>
      ))}
    </div>
  );

  const cameraOverlay = overlayBox && (countdown > 0 || flashing || preStickers.length > 0)
    ? ReactDOM.createPortal(
        <div style={{
          position:'fixed', top:overlayBox.top, left:overlayBox.left,
          width:overlayBox.width, height:overlayBox.height,
          borderRadius:24, overflow:'hidden', pointerEvents:'none', zIndex:99999,
        }}>
          {preStickers.map(s => (
            <div key={s.id} style={{ position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
              transform:`translate(-50%,-50%) rotate(${s.rotation||0}deg) scale(${s.scale||1})`, opacity:0.88 }}>
              {renderStickerInstance(s)}
            </div>
          ))}
          {countdown > 0 && (
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
        </div>,
        document.body
      )
    : null;

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
            <>
              <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              {renderShotStickers(s)}
            </>
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
    <>
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection: mobile?'column':'row' }}>
      <div style={{ flex:1, minHeight:0, padding: mobile?'50px 16px 0':'24px', display:'flex', flexDirection:'column' }}>
        <TopBar step={1} back={()=>go('setup')} T={T} mobile={mobile} title={mobile?'Capture':'Step 2 · Shoot your 6'}
          right={<div style={{fontSize:11, color:T.inkSoft, fontFamily:'Pretendard,system-ui'}}>{(FILTERS[filter] || FILTERS.smooth).name}</div>}/>
        {/* Camera fills all remaining flex space.
            NO overflow:hidden here — Samsung Internet (Chromium) does not render
            hardware-accelerated video inside overflow:hidden+borderRadius containers.
            borderRadius is applied directly on video/canvas instead. */}
        <div 
          ref={cameraFrameRef}
          onDoubleClick={toggleCamera}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ flex:1, minHeight:0, position:'relative', borderRadius:24, background:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {camOk === false && (
            <div style={{ position:'absolute', inset:0, borderRadius:24, overflow:'hidden' }}>
              <PlaceholderPortrait seed={idx} filter={filter}/>
              <div style={{ position:'absolute', top:12, left:12, padding:'6px 10px', background:'rgba(0,0,0,0.55)', color:'#fff', borderRadius:999, fontSize:10, letterSpacing:1.5, fontFamily:'"Plus Jakarta Sans",system-ui' }}>DEMO MODE</div>
            </div>
          )}
          
          {/* Transparent hole for global camera box */}
          
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
              background:'radial-gradient(circle, rgba(0,0,0,0.2), rgba(0,0,0,0.55))', zIndex:20 }}>
              <div key={countdown} style={{
                fontFamily:'"Plus Jakarta Sans",system-ui', fontSize:220, fontWeight:300, color:'#fff',
                letterSpacing:-8, textShadow:'0 20px 60px rgba(0,0,0,0.4)',
                animation:'countPop 0.9s cubic-bezier(0.16,1,0.3,1)',
              }}>{countdown}</div>
            </div>
          )}
          {flashing && <div style={{ position:'absolute', inset:0, background:'#fff', animation:'flash 0.14s ease-out', zIndex:30 }}/>}
          <div style={{ position:'absolute', top:14, right:14, padding:'8px 14px',
            background:'rgba(0,0,0,0.3)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            color:'#fff', borderRadius:999, fontSize:11, letterSpacing:1.5, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:600, zIndex:15 }}>
            {String(Math.min(idx+1,6)).padStart(2,'0')} / 06
          </div>
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
                {s && s.dataUrl ? <>
                  <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {renderShotStickers(s)}
                </>
                : s ? <PlaceholderPortrait seed={i} filter={s.filter}/>
                : <div style={{ fontSize:14, color:T.inkSoft, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:500 }}>{i+1}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {!mobile && <div style={{ padding:'24px 20px', background:T.bgAlt, borderLeft:'1px solid rgba(0,0,0,0.04)' }}>{shotsRail}</div>}
    </div>
    {cameraOverlay}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════
function SelectV2({ T, go, mobile, shots, selected, setSelected, layout }) {
  const maxSel = layout === 'trip' ? 3 : 4;
  const renderShotStickers = (s) => (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {(s?.preStickers || []).map(st => (
        <div key={st.id} style={{ position:'absolute', left:`${st.x}%`, top:`${st.y}%`,
          transform:`translate(-50%,-50%) rotate(${st.rotation||0}deg) scale(${st.scale||1})`, opacity:0.88 }}>
          {renderStickerInstance(st)}
        </div>
      ))}
    </div>
  );
  const toggle = (i) => {
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x=>x!==i);
      if (prev.length >= maxSel) return prev;
      return [...prev, i];
    });
  };
  return (
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection:'column',
      padding: mobile?'50px 18px 18px':'24px 56px 24px' }}>
      <TopBar step={2} back={()=>go('capture')} T={T} mobile={mobile} title={mobile?'Select':`Step 3 · Pick your ${maxSel}`}
        right={<div style={{fontSize:12, color:T.inkSoft, fontFamily:'Pretendard,system-ui'}}>{selected.length}/{maxSel}</div>}/>
      <div style={{ marginBottom: mobile?12:20, textAlign: mobile? 'left':'center' }}>
        <h2 style={{ margin:0, fontFamily:'"Plus Jakarta Sans",system-ui', fontSize: mobile?26:40, fontWeight:500, letterSpacing:-1 }}>
          Pick your best <span style={{ fontFamily:'Caveat,cursive', color: T.pinkDeep, fontSize: mobile?32:52 }}>{maxSel === 3 ? 'three' : 'four'}.</span>
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
                <>
                  <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {renderShotStickers(s)}
                </>
              ) : s ? <PlaceholderPortrait seed={i} filter={s.filter||'porcelain'}/> : null}
              {isSel && (
                <div style={{ position:'absolute', top:10, left:10, width:32, height:32, borderRadius:999, background:T.ink, color:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, fontFamily:'"Plus Jakarta Sans",system-ui',
                  animation:'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  {sel+1}
                </div>
              )}
              {!isSel && selected.length>=maxSel && <div style={{ position:'absolute', inset:0, background:'rgba(250,247,245,0.55)', backdropFilter:'blur(2px)' }}/>}
            </button>
          );
        })}
      </div>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end', alignItems:'center' }}>
          <button onClick={()=>setSelected([])} style={{ background:'transparent', border:'none', cursor:'pointer', color:T.inkSoft, fontSize:13, fontFamily:'Pretendard,system-ui' }}>Clear</button>
          <BtnPrimary T={T} onClick={()=>selected.length===maxSel && go('deco')} size={mobile?'md':'lg'} disabled={selected.length!==maxSel}>
            {selected.length===maxSel ? <>Deco studio · 꾸미기  {I.arrowR(16, T.bg)}</> : `Pick ${maxSel-selected.length} more`}
          </BtnPrimary>
        </div>
    </div>
  );
}

Object.assign(window, { CaptureV2, SelectV2 });
