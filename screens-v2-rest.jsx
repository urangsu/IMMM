// screens-v2-rest.jsx — Capture, Select, Deco, Result

// ═══════════════════════════════════════════════════════════════
// CAPTURE — 6 shots
// ═══════════════════════════════════════════════════════════════
function CaptureV2({ T, go, mobile, shots, setShots, filter, layout, preStickers, logo, dateText, accent, muted, onRequestCamera,
  videoRef, canvasRef, engineRef, webglOk, firstFrame, camOk, facingMode, setFacingMode, onCameraFrameChange, faceDataRef
}) {
  const shotCount = layout === 'polaroid' ? 1 : 6;
  const frameTemplate = typeof getFrameTemplate === 'function' ? getFrameTemplate(layout) : null;
  const firstSlot = frameTemplate?.photoSlots?.[0];
  const cameraAspect = firstSlot ? firstSlot.width / firstSlot.height : 4 / 3;
  const viewfinderAspect = mobile ? 3 / 4 : cameraAspect;
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

  const captureFromVideo = React.useCallback(async (v, filterKey, cssFilter, mirrorX) => {
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    try {
      const c = document.createElement('canvas');
      const rect = cameraFrameRef.current?.getBoundingClientRect();
      const aspect = rect?.width && rect?.height ? rect.width / rect.height : 1;
      c.width = 1920;
      c.height = Math.max(1, Math.round(1920 / aspect));
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
      // applyBeautyGeometry DISABLED — jaw/cheek warp caused visible distortion at face/bg boundary.
      // WebGL bilateral+skin_lift already handles skin quality for WebGL path.
      // CSS fallback path: no geometry warp, color-only compositing below.
      applyCapturedFilterLook(ctx, c.width, c.height, filterKey);
      if (typeof FrameRenderEngine !== 'undefined' && preStickers.length > 0) {
        for (const sticker of preStickers) {
          await FrameRenderEngine.drawStickerToCanvas(ctx, sticker, c.width, c.height, Math.max(1, c.width / 720));
        }
      }
      return c.toDataURL('image/jpeg', 0.95);
    } catch(e) { return null; }
  }, [preStickers, faceDataRef]);

  const applyCapturedFilterLook = (ctx, w, h, filterKey) => {
    ctx.save();
    // ── Skin-retouching base (for all skin-enhancing filters) ─────────────────
    const isSkinFilter = ['smooth','porcelain','blush','purikura'].includes(filterKey);
    if (isSkinFilter) {
      const strength = filterKey === 'smooth' ? 0.32 : filterKey === 'blush' ? 0.24 : 0.18;
      applyFaceZoneSoftening(ctx, w, h, strength);

      // Step 1: Soft warm lift — raises skin into warmer/brighter range
      // Using 'screen' to brighten without blowing out highlights
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,240,228,0.14)';
      ctx.fillRect(0, 0, w, h);

      // Step 2: Shadow lift — target dark areas (spots/acne tend to be darker)
      // Use a gradient from image center outward to avoid over-brightening already bright areas
      ctx.globalCompositeOperation = 'screen';
      const lift = ctx.createRadialGradient(w*0.5, h*0.38, 0, w*0.5, h*0.38, w*0.55);
      lift.addColorStop(0, 'rgba(255,235,215,0.18)');
      lift.addColorStop(0.6, 'rgba(255,230,210,0.09)');
      lift.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lift;
      ctx.fillRect(0, 0, w, h);

      // Step 3: Color smoothness — slight desaturation to make blemishes less visible
      // (acne is often more saturated red — reducing saturation hides it)
      ctx.globalCompositeOperation = 'luminosity';
      ctx.fillStyle = 'rgba(200,185,175,0.06)';
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'source-over';
    }

    // ── Per-filter additional look ─────────────────────────────────────────────
    if (filterKey === 'porcelain') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,248,240,0.13)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'smooth') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,242,232,0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'blush') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,238,232,0.14)';
      ctx.fillRect(0, 0, w, h);
      const blush = ctx.createRadialGradient(w * 0.30, h * 0.52, 0, w * 0.30, h * 0.52, w * 0.17);
      blush.addColorStop(0, 'rgba(255,100,120,0.34)');
      blush.addColorStop(1, 'rgba(255,108,124,0)');
      ctx.fillStyle = blush;
      ctx.fillRect(0, 0, w, h);
      const blush2 = ctx.createRadialGradient(w * 0.70, h * 0.52, 0, w * 0.70, h * 0.52, w * 0.17);
      blush2.addColorStop(0, 'rgba(255,100,120,0.34)');
      blush2.addColorStop(1, 'rgba(255,108,124,0)');
      ctx.fillStyle = blush2;
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'purikura') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,244,250,0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.12, w * 0.5, h * 0.42, w * 0.62);
      vignette.addColorStop(0, 'rgba(255,255,255,0)');
      vignette.addColorStop(1, 'rgba(255,255,255,0.22)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'grain') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(244,226,205,0.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 260; i++) {
        const x = (i * 97) % w;
        const y = (i * 53) % h;
        ctx.globalAlpha = 0.08 + (i % 5) * 0.015;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // mapFacePoint: was used only by applyBeautyGeometry (now disabled). Keep stub.
  const mapFacePoint = (p, mirrorX) => {
    if (!Array.isArray(p)) return [0.5, 0.5];
    return [mirrorX ? 1 - p[0] : p[0], p[1]];
  };

  // LEGACY — applyBeautyGeometry: scanline jaw/cheek warp using face landmarks.
  // DISABLED: caused visible distortion at face/background boundary.
  // Kept as no-op stub so any stale reference does not throw a runtime error.
  const applyBeautyGeometry = () => { return; };


  // applyFaceZoneSoftening — DISABLED.
  // The radial-gradient-masked blur caused face/background boundary distortion
  // ("cheek denting") visible in porcelain/smooth/blush capture results.
  // Kept as a no-op so references in applyCapturedFilterLook do not throw.
  // If a future PR re-introduces softening, use a very small strength (<0.08)
  // and validate on both light and dark backgrounds before re-enabling.
  const applyFaceZoneSoftening = () => { return; };


  const bakePreStickers = React.useCallback(async (dataUrl) => {
    if (!dataUrl || !preStickers.length || typeof FrameRenderEngine === 'undefined') return dataUrl;
    const img = await new Promise((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = dataUrl;
    });
    if (!img) return dataUrl;
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    for (const sticker of preStickers) {
      await FrameRenderEngine.drawStickerToCanvas(ctx, sticker, c.width, c.height, Math.max(1, c.width / 720));
    }
    return c.toDataURL('image/jpeg', 0.95);
  }, [preStickers]);

  const enhanceCapturedDataUrl = React.useCallback(async (dataUrl, filterKey, mirrorX) => {
    if (!dataUrl || !['smooth', 'porcelain', 'blush'].includes(filterKey)) return dataUrl;
    const img = await new Promise((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = dataUrl;
    });
    if (!img) return dataUrl;
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    // applyBeautyGeometry DISABLED — see note above applyBeautyGeometry declaration.
    applyCapturedFilterLook(ctx, c.width, c.height, filterKey);
    return c.toDataURL('image/jpeg', 0.95);
  }, [faceDataRef]);

  const takeShot = React.useCallback(() => {
    setFlashing(true);
    setTimeout(()=>setFlashing(false), 140);

    const doCapture = async () => {
      let dataUrl = null;
      // WebGL canvas — only if actively rendering (blank check: real JPEG > 5KB)
      const canvas = canvasRef.current;
      // WebGL canvas capture - use the engine directly if available for reliable filtered result
      if (canvasActive && engineRef.current) {
        try {
          const { mirrorX } = engineRef.current._getSize();
          const { pipeline, faceUniforms } = engineRef.current._getParams();
          const rect = cameraFrameRef.current?.getBoundingClientRect();
          const aspect = rect?.width && rect?.height ? rect.width / rect.height : 1;
          const capW = 1920;
          const capH = Math.max(1, Math.round(1920 / aspect));
          const raw = engineRef.current.takeSnapshot(capW, capH, mirrorX, pipeline, faceUniforms);
          if (raw && raw.length > 5000) dataUrl = await bakePreStickers(await enhanceCapturedDataUrl(raw, filter, mirrorX));
        } catch(e) { console.error('WebGL Capture Error:', e); }
      }
      
      // Fallback: draw from video with CSS filter (important for mobile/Safari)
      if (!dataUrl) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth > 0) {
          // If WebGL is supported but capture failed, we MUST still apply the CSS filter for the shot
          const cssFilter = FILTERS[filter]?.css || 'none';
          dataUrl = await captureFromVideo(v, filter, cssFilter, facingMode === 'user');
        }
      }
      const rect = cameraFrameRef.current?.getBoundingClientRect();
      setShots(prev => {
        const copy = [...prev];
        while (copy.length < shotCount) copy.push(null);
        copy[idx] = {
          dataUrl,
          filter,
          capturedFilter: filter,
          renderMode: dataUrl && canvasActive ? 'webgl' : 'canvas2d-css',
          preStickers: [],
          bakedPreStickers: preStickers.map(s => ({ ...s })),
          facingMode,
          mirrored: facingMode === 'user',
          width: rect?.width ? Math.round(rect.width) : 720,
          height: rect?.height ? Math.round(rect.height) : 720,
          ts: Date.now(),
        };
        return copy;
      });
        setIdx(i => Math.min(i+1, shotCount));
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
  }, [idx, filter, setShots, canvasActive, captureFromVideo, facingMode, shotCount, bakePreStickers, enhanceCapturedDataUrl]);

  React.useEffect(()=> {
    if (countdown <= 0) return;
    const t = setTimeout(()=> {
        if (countdown === 1) {
          takeShot();
          setCountdown(0);
          if (auto && idx < shotCount - 1) setTimeout(()=>setCountdown(3), 700);
        } else setCountdown(c=>c-1);
    }, 900);
    return ()=>clearTimeout(t);
  }, [countdown, auto, idx, takeShot, shotCount]);

  React.useEffect(()=> {
    if (idx >= shotCount) setTimeout(()=>go('select'), 600);
  }, [idx, go, shotCount]);

  const startCountdown = () => { if (countdown===0 && idx<shotCount) setCountdown(timerLen); };
  const toggleAuto = () => { setAuto(a=>!a); if (!auto && idx<shotCount && countdown===0) setCountdown(timerLen); };
  const thumbs = Array.from({length:shotCount}, (_,i)=> shots[i]);
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
          style={{
            flex: mobile ? '1 1 auto' : 1,
            width: '100%',
            aspectRatio: `${viewfinderAspect}`,
            maxHeight: mobile ? 'min(62vh, 560px)' : 'none',
            minHeight: mobile ? 320 : 0,
            position:'relative',
            borderRadius:24,
            background:'#10233A',
            boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.12), 0 14px 34px rgba(0,0,0,0.10)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}>
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
            {String(Math.min(idx+1,shotCount)).padStart(2,'0')} / {String(shotCount).padStart(2,'0')}
          </div>
        </div>
        {/* Shutter row - fixed height, centered */}
        <div style={{ flexShrink:0, height:78, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <div style={{ position:'absolute', left:0, display:'flex', gap:6 }}>
            <button onClick={toggleAuto} style={{
              padding:'8px 11px', borderRadius:999, border:'none',
              background: auto? T.ink : 'rgba(26,26,31,0.06)',
              color: auto? T.bg : T.ink, fontSize:11, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, fontFamily:'"Plus Jakarta Sans",system-ui',
              transition:'all 0.2s',
            }}>
              <div style={{ width:6, height:6, borderRadius:999, background: auto? T.pinkDeep : T.inkSoft, transition:'background 0.2s' }}/>
              Auto
            </button>
            <button onClick={() => setTimerLen(t => t === 3 ? 5 : 3)} style={{
              padding:'8px 11px', borderRadius:999, border:'none',
              background: 'rgba(26,26,31,0.06)',
              color: T.ink, fontSize:11, fontWeight:600, cursor:'pointer',
              display:'flex', alignItems:'center', gap:4, fontFamily:'"Plus Jakarta Sans",system-ui',
              transition:'all 0.2s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              {timerLen}s
            </button>
          </div>
          <button onClick={startCountdown} disabled={idx>=shotCount} style={{
            width:68, height:68, borderRadius:999,
            border:'none', background: countdown>0? T.pinkDeep : T.ink,
            cursor: idx>=shotCount? 'default':'pointer', padding:6,
            boxShadow:'0 10px 30px rgba(217,136,147,0.35)',
            transition:'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s',
            transform: countdown>0? 'scale(0.92)':'scale(1)',
          }}>
            <div style={{ width:'100%', height:'100%', borderRadius:999, background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:48, height:48, borderRadius:999, background: countdown>0? T.pinkDeep : T.ink, transition:'background 0.2s' }}/>
            </div>
          </button>
          <div style={{ position:'absolute', right:0, padding:'8px 11px', borderRadius:999, background:'rgba(26,26,31,0.06)', fontSize:11, color:T.inkSoft, fontFamily:'Pretendard,system-ui' }}>
            {Math.max(0, shotCount-idx)} left
          </div>
        </div>
        {/* Thumbnail strip - mobile only */}
        {mobile && (
          <div style={{ flexShrink:0, display:'flex', gap:5, paddingBottom:8, maxHeight:48 }}>
            {thumbs.map((s,i)=>(
              <div key={i} style={{
                flex:1, aspectRatio:'1', maxHeight:42, borderRadius:7, position:'relative', overflow:'hidden',
                boxShadow: idx===i? `0 0 0 2px ${T.pinkDeep}`: '0 0 0 1px rgba(0,0,0,0.08)',
                background: s? '#000' : T.card, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'box-shadow 0.3s',
              }}>
                {s && s.dataUrl ? <>
                  <img src={s.dataUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  {renderShotStickers(s)}
                </>
                : s ? <PlaceholderPortrait seed={i} filter={s.filter}/>
                : <div style={{ fontSize:11, color:T.inkSoft, fontFamily:'"Plus Jakarta Sans",system-ui', fontWeight:500 }}>{i+1}</div>}
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
  const maxSel = typeof getShotCountForLayout === 'function'
    ? getShotCountForLayout(layout)
    : (layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4);
  const availableShots = shots
    .map((shot, index) => ({ shot, index }))
    .filter(({ shot }) => shot?.dataUrl);
  const [previewIdx, setPreviewIdx] = React.useState(null);
  const pressTimerRef = React.useRef(null);
  const longPressRef = React.useRef(false);
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
    if (maxSel === 1) {
      // Polaroid / single-select: never deselect, just switch to the new index.
      if (!selected.includes(i)) setSelected([i]);
      return;
    }
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= maxSel) return prev;
      return [...prev, i];
    });
  };

  // Auto-correct: if none of the selected indices exist in the current availableShots
  // (e.g. after a re-capture that reset shots), pin to the first available shot.
  React.useEffect(() => {
    if (availableShots.length === 0) return;
    const validIndices = availableShots.map(s => s.index);
    const hasValid = selected.some(idx => validIndices.includes(idx));
    if (!hasValid) {
      if (maxSel === 1) {
        setSelected([availableShots[0].index]);
      } else {
        setSelected(availableShots.slice(0, maxSel).map(s => s.index));
      }
    }
  }, [availableShots.map(s => s.index).join(','), maxSel]);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  const beginPress = (i) => {
    clearPressTimer();
    longPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressRef.current = true;
      setPreviewIdx(i);
    }, 420);
  };
  const endPress = () => clearPressTimer();
  return (
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection:'column',
      padding: mobile?'50px 18px 18px':'24px 56px 24px' }}>
      <TopBar step={2} back={()=>go('capture')} T={T} mobile={mobile} title={mobile?'Select':`Step 3 · Pick your ${maxSel}`}
        right={<div style={{fontSize:12, color:T.inkSoft, fontFamily:'Pretendard,system-ui'}}>{selected.length}/{maxSel}</div>}/>
      <div style={{ marginBottom: mobile?12:20, textAlign: mobile? 'left':'center' }}>
        <h2 style={{ margin:0, fontFamily:'"Plus Jakarta Sans",system-ui', fontSize: mobile?26:40, fontWeight:500, letterSpacing:-1 }}>
          Pick your best <span style={{ fontFamily:'Caveat,cursive', color: T.pinkDeep, fontSize: mobile?32:52 }}>{maxSel === 1 ? 'one' : maxSel === 3 ? 'three' : 'four'}.</span>
        </h2>
        <div style={{ marginTop:4, color:T.inkSoft, fontSize: mobile?13:14.5, fontFamily:'Pretendard,system-ui' }}>
          Tap in order — we'll place them in the frame the same way.
        </div>
      </div>
      <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gridTemplateRows:'repeat(2, minmax(0, 1fr))', gap: mobile?8:14, minHeight: 0 }}>
        {availableShots.map(({ shot: s, index: i })=>{
          const sel = selected.indexOf(i);
          const isSel = sel>=0;
          return (
            <button key={i}
              onPointerDown={() => beginPress(i)}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onPointerCancel={endPress}
              onClick={() => {
                if (longPressRef.current) {
                  longPressRef.current = false;
                  return;
                }
                toggle(i);
              }}
              style={{
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
      {previewIdx != null && shots[previewIdx]?.dataUrl && (
        <div
          onClick={() => setPreviewIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(10,10,10,0.82)',
            backdropFilter: 'blur(18px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
        >
          <div style={{ position: 'relative', width: 'min(92vw, 520px)' }}>
            <img
              src={shots[previewIdx].dataUrl}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: 20,
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              }}
            />
            {shots[previewIdx].preStickers?.length > 0 && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {renderShotStickers(shots[previewIdx])}
              </div>
            )}
            <button
              onClick={() => setPreviewIdx(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 36,
                height: 36,
                borderRadius: 999,
                border: 'none',
                background: '#fff',
                color: T.ink,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryV2({ T, go, mobile }) {
  const [items, setItems] = React.useState([]);
  const [busy, setBusy] = React.useState(true);
  const [preview, setPreview] = React.useState(null);
  const [qrPreview, setQrPreview] = React.useState(null);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const rows = typeof LocalGalleryStore !== 'undefined' ? await LocalGalleryStore.listPhotos() : [];
      const filteredRows = rows.filter((row) => row.source !== 'qr');
      const mapped = filteredRows.map((row) => ({ ...row, url: URL.createObjectURL(row.blob) }));
      setItems((prev) => {
        prev.forEach((item) => item.url && URL.revokeObjectURL(item.url));
        return mapped;
      });
    } catch (e) {
      console.warn('[IMMM] Gallery load failed:', e);
      setItems([]);
    }
    setBusy(false);
  }, []);

  React.useEffect(() => {
    load();
    return () => setItems((prev) => {
      prev.forEach((item) => item.url && URL.revokeObjectURL(item.url));
      return [];
    });
  }, [load]);

  const remove = async (item) => {
    if (typeof LocalGalleryStore === 'undefined') return;
    await LocalGalleryStore.deletePhoto(item.id);
    await load();
  };

  return (
    <div style={{ height:'100%', background:T.bg, display:'flex', flexDirection:'column', padding: mobile ? 'calc(var(--sat) + 20px) 20px calc(var(--sab) + 22px)' : '36px 56px 32px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexShrink:0, paddingBottom: 18, borderBottom:`1px solid ${T.line}` }}>
        <button onClick={() => go('landing')} style={{ border:'none', background:'transparent', color:T.inkSoft, cursor:'pointer', fontWeight:700, fontSize:11, fontFamily:'"Plus Jakarta Sans",system-ui', letterSpacing:1.8, textTransform:'uppercase', padding:'4px 0' }}>Back</button>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:T.inkSoft, fontFamily:'"Plus Jakarta Sans",system-ui', letterSpacing:2.4, textTransform:'uppercase' }}>Private Archive</div>
          <div style={{ marginTop:6, fontSize: mobile ? 28 : 44, lineHeight: 0.95, fontWeight:700, letterSpacing:-1.4, color:T.ink, fontFamily:'"Plus Jakarta Sans",system-ui' }}>Gallery</div>
          <div style={{ marginTop:8, fontSize:12, color:T.inkSoft, fontFamily:'Pretendard,system-ui' }}>프레임에 넣어 확정한 사진만 이 기기에 남습니다.</div>
        </div>
      </div>

      <div style={{ flex:1, overflow:'auto', marginTop:24, paddingRight: mobile ? 0 : 6 }}>
        {busy ? (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkSoft, fontWeight:800 }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ height:'100%', minHeight:360, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', color:T.inkSoft }}>
            <div style={{ fontSize:10, letterSpacing:2.2, textTransform:'uppercase', fontFamily:'"Plus Jakarta Sans",system-ui' }}>No Saved Frames</div>
            <div style={{ marginTop:12, fontSize:24, lineHeight:1.05, fontWeight:700, letterSpacing:-0.8, color:T.ink, fontFamily:'"Plus Jakarta Sans",system-ui' }}>아직 확정된 사진이 없어요.</div>
            <div style={{ marginTop:10, fontSize:13, lineHeight:1.6, fontFamily:'Pretendard,system-ui' }}>촬영을 마치고 결과 화면에 도착한 사진만 여기에 정리됩니다.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))', gap:16 }}>
            {items.map((item) => (
              <div key={item.id} style={{ borderRadius:24, background:T.card, boxShadow:'0 0 0 1px rgba(26,26,31,0.06), 0 16px 42px rgba(0,0,0,0.045)', overflow:'hidden' }}>
                <button onClick={() => setPreview(item)} style={{ width:'100%', aspectRatio:'3 / 4', border:'none', padding:0, background:'#f5f5f5', cursor:'zoom-in', overflow:'hidden' }}>
                  <img src={item.url} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </button>
                <div style={{ padding:'13px 13px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:800, color:T.inkSoft, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'"Plus Jakarta Sans",system-ui' }}>{item.frameType || item.layout}</div>
                    <div style={{ marginTop:4, fontSize:11, color:T.ink, fontWeight:600, fontFamily:'Pretendard,system-ui' }}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</div>
                  </div>
                  <button onClick={() => remove(item)} style={{ border:'none', background:'transparent', color:T.inkSoft, borderRadius:999, padding:'7px 0', cursor:'pointer', fontSize:10, fontWeight:700, letterSpacing:1.4, textTransform:'uppercase', fontFamily:'"Plus Jakarta Sans",system-ui' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(10,10,10,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width:'min(92vw,460px)', maxHeight:'88vh', background:'#fff', borderRadius:24, padding:16, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
            <img src={preview.url} style={{ width:'100%', maxHeight:'68vh', objectFit:'contain', borderRadius:16, background:'#f4f4f4' }} />
            <div style={{ marginTop:14, display:'grid', gridTemplateColumns: preview.shareInfo?.qrDataUrl ? '1fr 1fr' : '1fr', gap:10 }}>
              {preview.shareInfo?.qrDataUrl && <button onClick={() => setQrPreview(preview.shareInfo)} style={{ padding:'13px 16px', borderRadius:14, border:'1px solid rgba(17,17,17,0.1)', background:'#fff', color:'#111', fontWeight:900, cursor:'pointer' }}>QR 보기</button>}
              <button onClick={() => setPreview(null)} style={{ padding:'13px 16px', borderRadius:14, border:'none', background:'#111', color:'#fff', fontWeight:900, cursor:'pointer' }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {qrPreview && (
        <div onClick={() => setQrPreview(null)} style={{ position:'fixed', inset:0, zIndex:100000, background:'rgba(10,10,10,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width:'min(90vw,360px)', background:'#fff', borderRadius:22, padding:20, textAlign:'center', boxShadow:'0 24px 80px rgba(0,0,0,0.35)' }}>
            <img src={qrPreview.qrDataUrl} style={{ width:220, height:220, imageRendering:'pixelated' }} />
            <div style={{ marginTop:10, fontSize:13, color:T.inkSoft, lineHeight:1.5, fontFamily:'Pretendard,system-ui' }}>이 결과물에 연결된 QR 공유입니다.</div>
            <button onClick={() => setQrPreview(null)} style={{ marginTop:12, width:'100%', padding:'13px 16px', borderRadius:14, border:'none', background:'#111', color:'#fff', fontWeight:900, cursor:'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SharedPhotoV2({ T, go, mobile }) {
  const [state, setState] = React.useState(() => {
    const raw = location.hash || '';
    const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
    const params = new URLSearchParams(query);
    const url = params.get('u');
    const expiresAt = Number(params.get('e') || 0);
    return { url, expiresAt };
  });
  const expired = state.expiresAt && Date.now() > state.expiresAt;

  return (
    <div style={{ minHeight:'100%', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding: mobile ? 'calc(var(--sat) + 18px) 18px calc(var(--sab) + 18px)' : 40 }}>
      <div style={{ width:'min(92vw,460px)', textAlign:'center' }}>
        <div style={{ fontFamily:'"Plus Jakarta Sans",system-ui', fontSize:12, fontWeight:900, letterSpacing:4, color:T.inkSoft, textTransform:'uppercase' }}>IMMM Shared Moment</div>
        {state.url && !expired ? (
          <>
            <img src={state.url} style={{ width:'100%', marginTop:20, borderRadius:26, background:'#f4f4f4', boxShadow:'0 28px 80px rgba(0,0,0,0.12)' }} />
            <div style={{ marginTop:18, fontSize:13, color:T.inkSoft, fontFamily:'Pretendard,system-ui' }}>공유 이미지는 7일 동안 보관됩니다.</div>
          </>
        ) : (
          <div style={{ marginTop:24, padding:'42px 22px', borderRadius:26, background:'rgba(26,26,31,0.05)' }}>
            <div style={{ fontSize:42, marginBottom:14 }}>🔒</div>
            <div style={{ fontSize:22, fontWeight:900, color:T.ink, fontFamily:'Pretendard,system-ui' }}>공유 링크가 만료됐어요</div>
            <div style={{ marginTop:8, fontSize:14, color:T.inkSoft, lineHeight:1.5, fontFamily:'Pretendard,system-ui' }}>QR 공유 이미지는 7일 보관 정책을 따릅니다.</div>
          </div>
        )}
        <button onClick={() => { location.hash = ''; go('landing'); }} style={{ marginTop:18, padding:'14px 22px', borderRadius:999, border:'none', background:T.ink, color:T.bg, fontWeight:900, cursor:'pointer' }}>IMMM 열기</button>
      </div>
    </div>
  );
}

Object.assign(window, { CaptureV2, SelectV2, GalleryV2, SharedPhotoV2 });
