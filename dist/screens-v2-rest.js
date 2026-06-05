// screens-v2-rest.jsx — Capture, Select, Deco, Result

// ═══════════════════════════════════════════════════════════════
// CAPTURE — 6 shots
// ═══════════════════════════════════════════════════════════════

function SoftLightGlyph() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
    focusable: "false",
    style: {
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "2.2",
    fill: "currentColor",
    opacity: "0.95"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 1.8V4M8 12v2.2M14.2 8H12M4 8H1.8M12.4 3.6L10.9 5.1M5.1 10.9L3.6 12.4M12.4 12.4L10.9 10.9M5.1 5.1L3.6 3.6",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    opacity: "0.92"
  }));
}
function CaptureV2({
  T,
  go,
  mobile,
  shots,
  setShots,
  filter,
  layout,
  preStickers,
  logo,
  dateText,
  accent,
  frameColor,
  muted,
  onRequestCamera,
  videoRef,
  canvasRef,
  engineRef,
  webglOk,
  firstFrame,
  camOk,
  facingMode,
  setFacingMode,
  onCameraFrameChange,
  faceDataRef,
  cameraZoom = 1,
  cameraCapabilities = null,
  cameraSettings = null,
  applyCameraZoom,
  switchCameraDevice,
  cameraDevices = [],
  frontWideCandidates = [],
  rearWideCandidates = [],
  activeCameraDeviceId,
  normalCameraDeviceId,
  wideCameraActive,
  toggleWideCamera,
  cameraZoomHistory = [],
  cameraToggleBusy = false,
  onDebugSwitchCameraDevice = null,
  lastWideToggleReason = '',
  lastWideTogglePath = '',
  cameraZoomOptions = [],
  cameraZoomSupported = false,
  torchSupported = false,
  torchActive = false,
  torchUnavailableReason = '',
  screenFlashOverlay = false,
  screenLightSupported = false,
  screenLightActive = false,
  setCameraZoom,
  setCameraTorch,
  setScreenLightActive,
  runScreenFlash,
  framePreset,
  setPhotoEditMode,
  activeSessionId
}) {
  // ── Quality Policy Documentation ──────────────────────────────────────────
  // 1. Camera input quality: Requested ideal 1080p with 3-step fallback in main.jsx.
  // 2. Preview render quality: WebGL canvas uses devicePixelRatio (capped at 2.0).
  // 3. Capture still quality: High-res 2560px (desktop) or 1920px (mobile) long-edge.
  // 4. Frame export quality: scale 3.0 (mobile) or 4.0 (desktop) based on memory safety.
  // ──────────────────────────────────────────────────────────────────────────

  var shotCount = layout === 'polaroid' ? 3 : layout === 'trip' ? 5 : 6;
  var getCaptureLongEdges = () => mobile ? [1920, 1280] : [2560, 1920, 1280];
  var resolveFrameTemplate = layout => {
    if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
      return window.getFrameTemplateSafe(layout);
    }
    if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
      return window.getFrameTemplate(layout);
    }
    console.error('[IMMM] frame-system not ready: getFrameTemplate missing');
    return null;
  };
  var frameTemplate = resolveFrameTemplate(layout);
  var firstSlot = frameTemplate?.photoSlots?.[0];
  var cameraAspect = firstSlot ? firstSlot.width / firstSlot.height : 4 / 3;
  var viewfinderAspect = mobile ? 3 / 4 : cameraAspect;
  var [idx, setIdx] = React.useState(0);
  var [countdown, setCountdown] = React.useState(0);
  var [timerLen, setTimerLen] = React.useState(3);
  var [flashing, setFlashing] = React.useState(false);
  var [auto, setAuto] = React.useState(false);
  var [overlayBox, setOverlayBox] = React.useState(null);
  var [zoomToggleError, setZoomToggleError] = React.useState('');
  var [toggleBusy, setToggleBusy] = React.useState(false);
  var [showDemoFallback, setShowDemoFallback] = React.useState(false);
  var [captureError, setCaptureError] = React.useState(false);
  var touchStartY = React.useRef(null);
  var cameraFrameRef = React.useRef(null);
  var isCapturingRef = React.useRef(false); // Debounce rapid-click shutter

  // Only show stickers assigned to the current frame slot during live capture preview.
  // Extra candidate shots (idx >= slotCount) get no stickers to prevent duplication.
  React.useEffect(() => {
    if (window.IMMM_DEBUG_CAMERA && videoRef.current && cameraSettings) {
      var v = videoRef.current;
      var vw = v.videoWidth;
      var vh = v.videoHeight;
      if (vw && vh) {
        var aspect = vw / vh;
        console.info('[IMMM camera] Aspect ratio check:', {
          videoResolution: `${vw}x${vh}`,
          videoAspect: aspect.toFixed(4),
          viewfinderAspect: viewfinderAspect.toFixed(4),
          isCropped: Math.abs(aspect - viewfinderAspect) > 0.01 ? 'YES' : 'NO'
        });
      }
    }
  }, [cameraSettings, viewfinderAspect, videoRef]);
  var visibleCaptureStickers = typeof getStickersForCapturePreview === 'function' ? getStickersForCapturePreview(preStickers, idx, layout) : [];
  var canvasActive = webglOk && firstFrame;
  React.useEffect(() => {
    if (!onCameraFrameChange || !cameraFrameRef.current) return;
    var update = () => {
      if (!cameraFrameRef.current) return;
      var r = cameraFrameRef.current.getBoundingClientRect();
      onCameraFrameChange({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
      setOverlayBox({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
    };
    update();
    var ro = new ResizeObserver(update);
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
  var toggleCamera = () => {
    if (toggleBusy || cameraToggleBusy || countdown > 0 || isCapturingRef.current) return;
    setToggleBusy(true);
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => {
      setToggleBusy(false);
    }, 500);
  };
  var captureFromVideo = React.useCallback(async (v, cssFilter, mirrorX, edge) => {
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    var rect = cameraFrameRef.current?.getBoundingClientRect();
    var aspect = rect?.width && rect?.height ? rect.width / rect.height : 1;
    try {
      var c = document.createElement('canvas');
      var capW = edge;
      var capH = Math.max(1, Math.round(edge / aspect));
      c.width = capW;
      c.height = capH;
      var ctx = c.getContext('2d');
      ctx.save();
      if (mirrorX) {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      }
      if (cssFilter && cssFilter !== 'none') ctx.filter = cssFilter;
      var vw = v.videoWidth,
        vh = v.videoHeight;
      var srcAspect = vw / vh;
      var sx = 0,
        sy = 0,
        sw = vw,
        sh = vh;
      if (srcAspect > aspect) {
        sw = vh * aspect;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / aspect;
        sy = (vh - sh) / 2;
      }
      if (typeof window !== 'undefined' && window.IMMM_DEBUG_CAMERA) {
        console.info('[IMMM capture crop]', {
          facingMode,
          viewfinderAspect: aspect,
          videoWidth: vw,
          videoHeight: vh,
          videoAspect: srcAspect,
          sx,
          sy,
          sw,
          sh,
          cropRatioW: sw / vw,
          cropRatioH: sh / vh
        });
      }
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
      ctx.restore();

      // Step 1 slot stickers are NOT baked into individual raw shots.
      // They are rendered once in the final frame composite via frameSlot.
      // Baking them per-shot would cause each original photo to carry the sticker,
      // resulting in duplicate rendering in the final frame output.
      var dataUrl = c.toDataURL('image/jpeg', 0.95);
      if (dataUrl && dataUrl.length > 5000) {
        return {
          dataUrl,
          edge,
          sourceW: vw,
          sourceH: vh
        };
      }
    } catch (e) {
      console.warn(`[IMMM] Fallback capture failed at ${edge}px:`, e);
    }
    return null;
  }, [preStickers]);
  var applyCapturedFilterLook = (ctx, w, h, filterKey) => {
    ctx.save();
    // ── Skin-retouching base (for all skin-enhancing filters) ─────────────────
    var isSkinFilter = ['smooth', 'porcelain', 'blush', 'purikura'].includes(filterKey);
    if (isSkinFilter) {
      // EMERGENCY FACE SHAPE SAFETY:
      // applyFaceZoneSoftening and applyBeautyGeometry are permanently disabled
      // to prevent face/cheek/boundary distortion on Galaxy/Samsung Internet.

      // Step 1: Soft warm lift — raises skin into warmer/brighter range
      // Using 'screen' to brighten without blowing out highlights
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,240,228,0.14)';
      ctx.fillRect(0, 0, w, h);

      // Step 2: Shadow lift — target dark areas (spots/acne tend to be darker)
      // Use a gradient from image center outward to avoid over-brightening already bright areas
      ctx.globalCompositeOperation = 'screen';
      var lift = ctx.createRadialGradient(w * 0.5, h * 0.38, 0, w * 0.5, h * 0.38, w * 0.55);
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
      // EMERGENCY: Global warm tint instead of landmark-ish radial gradients
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,200,210,0.12)'; // Subtle warm pink lift
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    } else if (filterKey === 'purikura') {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,244,250,0.22)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      var vignette = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.12, w * 0.5, h * 0.42, w * 0.62);
      vignette.addColorStop(0, 'rgba(255,255,255,0)');
      vignette.addColorStop(1, 'rgba(255,255,255,0.22)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    } else if (filterKey === 'grain') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = 'rgba(244,226,205,0.10)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      for (var i = 0; i < 260; i++) {
        var x = i * 97 % w;
        var y = i * 53 % h;
        ctx.globalAlpha = 0.08 + i % 5 * 0.015;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // mapFacePoint: was used only by applyBeautyGeometry (now disabled). Keep stub.
  var mapFacePoint = (p, mirrorX) => {
    if (!Array.isArray(p)) return [0.5, 0.5];
    return [mirrorX ? 1 - p[0] : p[0], p[1]];
  };

  // EMERGENCY FACE SHAPE SAFETY:
  // Do not re-enable geometry, radial face blur, or landmark-based deformation.
  // Galaxy Samsung Internet showed face distortion at face/background boundary.
  // All face-shape-changing code must remain disabled.
  var applyBeautyGeometry = () => {
    return;
  };
  // The radial-gradient-masked blur caused face/background boundary distortion
  // ("cheek denting") visible in porcelain/smooth/blush capture results.
  // Kept as a no-op so references in applyCapturedFilterLook do not throw.
  // If a future PR re-introduces softening, use a very small strength (<0.08)
  // and validate on both light and dark backgrounds before re-enabling.
  var applyFaceZoneSoftening = () => {
    return;
  };
  var bakePreStickers = React.useCallback(async dataUrl => {
    // Step 1 slot stickers must NOT be baked into raw shot data.
    // They are composited once in the final frame render (frame-system.jsx drawStickerToCtx),
    // placed per frameSlot. Baking here would duplicate them in every original photo
    // and cause double-rendering in the exported frame.
    return dataUrl;
  }, []);
  var enhanceCapturedDataUrl = React.useCallback(async (dataUrl, filterKey, mirrorX) => {
    // EMERGENCY FACE SHAPE SAFETY:
    // WebGL filter is already fully applied in takeSnapshot.
    // Do not re-apply any landmark-based logic here.
    return dataUrl;
  }, []);
  var takeShot = React.useCallback(() => {
    if (isCapturingRef.current) return; // Prevent rapid-click overlap
    isCapturingRef.current = true;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 140);
    var doCapture = async () => {
      // Screen flash logic for front camera
      if (facingMode === 'user' && screenLightActive) {
        await runScreenFlash();
      }
      var dataUrl = null;
      var captureMode = null;
      var captureMeta = {
        edge: 0,
        sourceW: 0,
        sourceH: 0
      };
      var rect = cameraFrameRef.current?.getBoundingClientRect();
      var aspect = rect?.width && rect?.height ? rect.width / rect.height : 1;
      var candidates = getCaptureLongEdges();

      // 1. WebGL Path
      if (canvasActive && engineRef.current) {
        var {
          mirrorX
        } = engineRef.current._getSize();
        var {
          pipeline,
          faceUniforms
        } = engineRef.current._getParams();
        for (var edge of candidates) {
          try {
            var capW = edge;
            var capH = Math.max(1, Math.round(edge / aspect));
            var raw = engineRef.current.takeSnapshot(capW, capH, mirrorX, pipeline, faceUniforms);
            if (raw && raw.length > 5000) {
              dataUrl = await bakePreStickers(raw);
              captureMeta = {
                edge,
                sourceW: videoRef.current?.videoWidth || 0,
                sourceH: videoRef.current?.videoHeight || 0
              };
              captureMode = 'webgl';
              break;
            }
          } catch (e) {
            console.warn(`[IMMM] WebGL capture failed at ${edge}px:`, e);
          }
        }
      }

      // 2. Fallback Path
      if (!dataUrl) {
        var _v = videoRef.current;
        if (_v && _v.readyState >= 2 && _v.videoWidth > 0) {
          var cssFilter = FILTERS[filter]?.css || 'none';
          for (var _edge of candidates) {
            var result = await captureFromVideo(_v, cssFilter, facingMode === 'user', _edge);
            if (result) {
              dataUrl = result.dataUrl;
              captureMeta = {
                edge: result.edge,
                sourceW: result.sourceW,
                sourceH: result.sourceH
              };
              captureMode = 'canvas2d-css';
              break;
            }
          }
        }
      }
      if (!dataUrl) {
        console.error('[IMMM] All capture paths failed. dataUrl is null.');
        setCaptureError(true);
        isCapturingRef.current = false;
        setCountdown(0);
        return;
      }
      setShots(prev => {
        var copy = [...prev];
        while (copy.length < shotCount) copy.push(null);
        var timestamp = Date.now();
        copy[idx] = {
          assetId: `${activeSessionId || 'session'}_${idx}_${timestamp}`,
          dataUrl,
          filter,
          capturedFilter: filter,
          renderMode: captureMode,
          captureLongEdge: captureMeta.edge,
          sourceVideoWidth: captureMeta.sourceW,
          sourceVideoHeight: captureMeta.sourceH,
          facingMode,
          mirrored: facingMode === 'user',
          width: rect?.width ? Math.round(rect.width) : 720,
          height: rect?.height ? Math.round(rect.height) : 720,
          ts: timestamp
        };
        return copy;
      });
      setIdx(i => Math.min(i + 1, shotCount));
      isCapturingRef.current = false; // Allow next capture
    };

    // Wait for video ready if needed
    var v = videoRef.current;
    if (v && v.readyState < 2) {
      var onReady = () => {
        v.removeEventListener('canplay', onReady);
        doCapture();
      };
      v.addEventListener('canplay', onReady);
      setTimeout(() => {
        v.removeEventListener('canplay', onReady);
        doCapture();
      }, 800);
    } else {
      doCapture();
    }
  }, [idx, filter, setShots, canvasActive, captureFromVideo, facingMode, shotCount, bakePreStickers, enhanceCapturedDataUrl, activeSessionId, screenLightActive]);
  React.useEffect(() => {
    if (countdown <= 0) return;
    var t = setTimeout(() => {
      if (countdown === 1) {
        takeShot();
        setCountdown(0);
        if (auto && idx < shotCount - 1) setTimeout(() => setCountdown(3), 700);
      } else setCountdown(c => c - 1);
    }, 900);
    return () => clearTimeout(t);
  }, [countdown, auto, idx, takeShot, shotCount]);
  React.useEffect(() => {
    if (idx >= shotCount) setTimeout(() => go('select'), 600);
  }, [idx, go, shotCount]);
  var startCountdown = () => {
    if (countdown === 0 && idx < shotCount) setCountdown(timerLen);
  };
  var toggleAuto = () => {
    setAuto(a => !a);
    if (!auto && idx < shotCount && countdown === 0) setCountdown(timerLen);
  };
  var thumbs = Array.from({
    length: shotCount
  }, (_, i) => shots[i]);
  var cameraOverlay = overlayBox && (countdown > 0 || flashing || screenFlashOverlay || visibleCaptureStickers.length > 0) ? ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: overlayBox.top,
      left: overlayBox.left,
      width: overlayBox.width,
      height: overlayBox.height,
      borderRadius: 24,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 99999
    }
  }, visibleCaptureStickers.map(s => {
    var metrics = window.resolveStickerFidelityMetrics ? window.resolveStickerFidelityMetrics(s, null, overlayBox.width, overlayBox.height) : {
      xPercent: s.slotX !== undefined ? s.slotX : 50,
      yPercent: s.slotY !== undefined ? s.slotY : 50,
      widthPx: 64,
      heightPx: 64
    };
    var raw = window.getStickerVisualBounds ? window.getStickerVisualBounds(s) : {
      w: 64,
      h: 64
    };
    var visualScale = metrics.widthPx / raw.w;
    var style = {
      position: 'absolute',
      left: `${metrics.xPercent}%`,
      top: `${metrics.yPercent}%`,
      transform: `translate(-50%,-50%) rotate(${s.rotation || 0}deg)`,
      opacity: 0.88
    };
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: style
    }, window.renderStickerVisualElement ? window.renderStickerVisualElement(s, visualScale) : renderStickerInstance(s));
  }), countdown > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle, rgba(0,0,0,0.2), rgba(0,0,0,0.55))'
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: countdown,
    style: {
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 220,
      fontWeight: 300,
      color: '#fff',
      letterSpacing: -8,
      textShadow: '0 20px 60px rgba(0,0,0,0.4)',
      animation: 'countPop 0.9s cubic-bezier(0.16,1,0.3,1)'
    }
  }, countdown)), flashing && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: '#fff',
      animation: 'flash 0.14s ease-out'
    }
  }), screenFlashOverlay && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: '#fff',
      opacity: 1
    }
  })), document.body) : null;
  var shotsRail = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: mobile ? 'row' : 'column',
      padding: mobile ? '0 16px' : '0',
      gap: mobile ? 6 : 8,
      minWidth: mobile ? 'auto' : 96
    }
  }, !mobile && /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Roll \xB7 \uD544\uB984"), thumbs.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: mobile ? 1 : 'none',
      width: mobile ? 'auto' : 96,
      aspectRatio: '1',
      borderRadius: 10,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: idx === i ? `0 0 0 2px ${T.pinkDeep}` : '0 0 0 1px rgba(0,0,0,0.08)',
      background: s ? '#000' : T.card,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'box-shadow 0.3s'
    }
  }, s && s.dataUrl ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: s.dataUrl,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })) : s ? /*#__PURE__*/React.createElement(PlaceholderPortrait, {
    seed: i,
    filter: s.filter
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontWeight: 500
    }
  }, i + 1))));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: T.bg,
      display: 'flex',
      flexDirection: mobile ? 'column' : 'row'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      padding: mobile ? '50px 16px 0' : '24px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    step: 1,
    back: () => go('setup'),
    T: T,
    mobile: mobile,
    title: mobile ? 'Capture' : 'Step 2 · Shoot your 6',
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, (FILTERS[filter] || FILTERS.smooth).name)
  }), /*#__PURE__*/React.createElement("div", {
    ref: cameraFrameRef,
    onDoubleClick: toggleCamera,
    style: {
      flex: mobile ? '1 1 auto' : 1,
      width: '100%',
      aspectRatio: `${viewfinderAspect}`,
      maxHeight: mobile ? 'min(68vh, 620px)' : 'none',
      minHeight: mobile ? 340 : 0,
      position: 'relative',
      borderRadius: 24,
      background: '#10233A',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 14px 34px rgba(0,0,0,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, camOk === false && !showDemoFallback && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(20, 20, 25, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      color: '#fff',
      zIndex: 100,
      textAlign: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 999,
      background: 'rgba(255, 75, 75, 0.15)',
      color: '#FF4B4B',
      display: 'grid',
      placeItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "1",
    y1: "1",
    x2: "23",
    y2: "23"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 900,
      marginBottom: 8
    }
  }, "\uCE74\uBA54\uB77C\uB97C \uC2DC\uC791\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      lineHeight: 1.5,
      marginBottom: 24,
      maxWidth: 280
    }
  }, "\uBE0C\uB77C\uC6B0\uC800\uC758 \uCE74\uBA54\uB77C \uAD8C\uD55C \uC124\uC815\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uBAA8\uBC14\uC77C \uBE0C\uB77C\uC6B0\uC800\uC778 \uACBD\uC6B0 \uD0C0 \uC571\uC758 \uCE74\uBA54\uB77C \uC810\uC720\uB97C \uD574\uC81C\uD574\uC57C \uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gap: 8,
      width: '100%',
      maxWidth: 220
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (typeof onRequestCamera === 'function') {
        onRequestCamera();
      } else {
        location.reload();
      }
    },
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: 'none',
      background: '#fff',
      color: '#000',
      fontSize: 12,
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "\uAD8C\uD55C \uB2E4\uC2DC \uC694\uCCAD"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setPhotoEditMode?.(true);
      go('setup');
    },
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.2)',
      background: 'transparent',
      color: '#fff',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "\uC0AC\uC9C4 \uC5C5\uB85C\uB4DC\uB85C \uB9CC\uB4E4\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowDemoFallback(true),
    style: {
      minHeight: 40,
      borderRadius: 10,
      border: 'none',
      background: 'rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, "\uCCB4\uD5D8 \uBAA8\uB4DC\uB85C \uBCF4\uAE30"))), camOk === false && showDemoFallback && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 24,
      overflow: 'hidden',
      zIndex: 90
    }
  }, /*#__PURE__*/React.createElement(PlaceholderPortrait, {
    seed: idx,
    filter: filter
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      padding: '6px 10px',
      background: 'rgba(0,0,0,0.55)',
      color: '#fff',
      borderRadius: 999,
      fontSize: 10,
      letterSpacing: 1.5,
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "DEMO MODE")), captureError && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(20, 20, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 24,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      color: '#fff',
      zIndex: 110,
      textAlign: 'center',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 999,
      background: 'rgba(255, 75, 75, 0.15)',
      color: '#FF4B4B',
      display: 'grid',
      placeItems: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "28",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 900,
      marginBottom: 8
    }
  }, "\uC0AC\uC9C4 \uCD2C\uC601 \uC2E4\uD328"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      lineHeight: 1.5,
      marginBottom: 24,
      maxWidth: 280
    }
  }, "\uCE74\uBA54\uB77C \uC2A4\uD2B8\uB9BC\uC73C\uB85C\uBD80\uD130 \uC774\uBBF8\uC9C0\uB97C \uCEA1\uCC98\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uCD2C\uC601\uD574 \uC8FC\uC138\uC694."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCaptureError(false);
      isCapturingRef.current = false;
    },
    style: {
      minHeight: 40,
      padding: '0 24px',
      borderRadius: 10,
      border: 'none',
      background: '#fff',
      color: '#000',
      fontSize: 12,
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "\uB2E4\uC2DC \uCD2C\uC601\uD558\uAE30")), (() => {
    var safeFrameColor = frameColor || frameTemplate?.theme?.frameFill || '#fff';
    return /*#__PURE__*/React.createElement(CaptureOverlay, {
      template: frameTemplate,
      layout: layout,
      logo: logo,
      dateText: dateText,
      accent: accent,
      frameColor: safeFrameColor,
      viewfinderAspect: viewfinderAspect,
      framePreset: framePreset
    });
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      right: 14,
      padding: '8px 14px',
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      color: '#fff',
      borderRadius: 999,
      fontSize: 11,
      letterSpacing: 1.5,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontWeight: 600,
      zIndex: 15
    }
  }, String(Math.min(idx + 1, shotCount)).padStart(2, '0'), " / ", String(shotCount).padStart(2, '0'))), cameraZoomSupported && cameraZoomOptions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 12
    }
  }, cameraZoomOptions.map(opt => {
    var isZoomNear = Math.abs((cameraZoom || 1) - opt.value) < 0.08;
    var isActive = opt.value === 0.6 ? wideCameraActive || isZoomNear : !wideCameraActive && isZoomNear;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.label,
      title: window.IMMM_DEBUG_CAMERA ? `reason: ${opt.reason || 'none'}, type: ${opt.type}` : undefined,
      onClick: () => setCameraZoom(opt.value),
      disabled: cameraToggleBusy || !opt.enabled || countdown > 0 || isCapturingRef.current,
      style: {
        background: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.3)',
        color: isActive ? '#000' : '#fff',
        border: isActive ? `1.5px solid ${T.pink}` : 'none',
        borderRadius: 999,
        padding: '6px 12px',
        fontSize: 10,
        fontWeight: 700,
        cursor: opt.enabled ? 'pointer' : 'not-allowed',
        opacity: cameraToggleBusy || countdown > 0 || isCapturingRef.current ? 0.4 : opt.enabled ? 1 : 0.25,
        transition: 'all 0.2s',
        fontFamily: '"Plus Jakarta Sans", system-ui'
      }
    }, cameraToggleBusy && cameraZoom === opt.value ? '...' : opt.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      height: 82,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginTop: mobile ? 8 : 0
    }
  }, (() => {
    var debugCamera = typeof window !== 'undefined' && window.IMMM_DEBUG_CAMERA;
    var leftBtnStyle = {
      padding: '8px 11px',
      borderRadius: 999,
      border: 'none',
      background: 'rgba(26,26,31,0.06)',
      color: T.ink,
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      transition: 'all 0.2s'
    };

    // Light support: screen light for front camera, torch for rear
    var lightSupported = facingMode === 'user' ? screenLightSupported : torchSupported;
    var isLightOn = facingMode === 'user' ? screenLightActive : torchActive;
    var onLightToggle = () => {
      if (facingMode === 'user') {
        setScreenLightActive(!screenLightActive);
      } else {
        setCameraTorch(!torchActive);
      }
    };
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: mobile ? 'wrap' : 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'none'
      },
      onClick: toggleWideCamera
    }), /*#__PURE__*/React.createElement("button", {
      onClick: onLightToggle,
      disabled: !lightSupported || cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current,
      "aria-label": facingMode === 'user' ? screenLightActive ? 'Turn off selfie light' : 'Turn on selfie light' : torchActive ? 'Turn off light' : 'Turn on light',
      title: facingMode === 'user' ? 'Selfie screen light' : 'Camera light',
      style: {
        ...leftBtnStyle,
        background: isLightOn ? T.ink : 'rgba(26,26,31,0.06)',
        color: isLightOn ? T.bg : T.ink,
        opacity: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current ? 0.4 : lightSupported ? 1 : 0.4
      }
    }, /*#__PURE__*/React.createElement(SoftLightGlyph, null), cameraToggleBusy ? '...' : facingMode === 'user' ? mobile ? 'Light' : 'Selfie Light' : 'Light'), /*#__PURE__*/React.createElement("button", {
      onClick: toggleAuto,
      disabled: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current,
      style: {
        ...leftBtnStyle,
        background: auto ? T.ink : 'rgba(26,26,31,0.06)',
        color: auto ? T.bg : T.ink,
        opacity: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: auto ? T.pinkDeep : T.inkSoft,
        transition: 'background 0.2s'
      }
    }), "Auto")), /*#__PURE__*/React.createElement("button", {
      onClick: startCountdown,
      disabled: idx >= shotCount || toggleBusy || cameraToggleBusy || isCapturingRef.current || captureError || camOk === false && !showDemoFallback,
      style: {
        width: 72,
        height: 72,
        borderRadius: 999,
        border: 'none',
        background: countdown > 0 ? T.pinkDeep : T.ink,
        cursor: idx >= shotCount || isCapturingRef.current || captureError ? 'default' : 'pointer',
        padding: 6,
        boxShadow: '0 10px 30px rgba(217,136,147,0.35)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s',
        transform: countdown > 0 ? 'scale(0.92)' : 'scale(1)',
        opacity: idx >= shotCount || toggleBusy || cameraToggleBusy || isCapturingRef.current || captureError || camOk === false && !showDemoFallback ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 52,
        height: 52,
        borderRadius: 999,
        background: countdown > 0 ? T.pinkDeep : T.ink,
        transition: 'background 0.2s'
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: 0,
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: mobile ? 'wrap' : 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '8px 11px',
        borderRadius: 999,
        background: 'rgba(26,26,31,0.06)',
        fontSize: 11,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, Math.max(0, shotCount - idx), " left"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setTimerLen(t => t === 3 ? 5 : 3),
      disabled: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current,
      style: {
        padding: '8px 11px',
        borderRadius: 999,
        border: 'none',
        background: 'rgba(26,26,31,0.06)',
        color: T.ink,
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        transition: 'all 0.2s',
        opacity: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: "12 6 12 12 16 14"
    })), timerLen, "s"), /*#__PURE__*/React.createElement("button", {
      onClick: toggleCamera,
      disabled: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current,
      "aria-label": facingMode === 'user' ? 'Switch to rear camera' : 'Switch to front camera',
      title: facingMode === 'user' ? 'Rear camera' : 'Front camera',
      style: {
        ...leftBtnStyle,
        opacity: cameraToggleBusy || toggleBusy || countdown > 0 || isCapturingRef.current ? 0.4 : 1
      },
      "data-wide-toggle-marker": "true"
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "13",
      r: "4"
    })), cameraToggleBusy || toggleBusy ? '...' : 'Switch')));
  })()), mobile && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      justifyContent: 'center',
      paddingBottom: 4
    }
  }, (() => {
    var debugCamera = typeof window !== 'undefined' && window.IMMM_DEBUG_CAMERA === true;
    var hasWideCandidates = frontWideCandidates.length > 0 || rearWideCandidates.length > 0;
    var showWidePicker = debugCamera;
    var onSwitchWide = async candidate => {
      if (!candidate?.deviceId) return;
      try {
        var ok = await switchCameraDevice(candidate.deviceId);
        if (!ok && window.IMMM_DEBUG_CAMERA) {
          console.warn('[IMMM camera] wide switch failed', candidate);
        }
      } catch (e) {
        console.warn('[IMMM camera] wide switch error', e);
      }
    };
    var WideCameraDebugPill = () => /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.12)',
        fontSize: 10,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui',
        gap: 4,
        overflowX: 'auto'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, facingMode), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, cameraSettings?.zoom != null ? `${cameraSettings.zoom.toFixed(2)}×` : 'default'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : '0x0'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, cameraCapabilities?.zoom ? `range ${cameraCapabilities.zoom.min}~${cameraCapabilities.zoom.max}` : 'zoom unsupported'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "wide: ", String(wideCameraActive)), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "activeDev: ", String(activeCameraDeviceId).slice(-4)), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "normalDev: ", String(normalCameraDeviceId).slice(-4)), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        color: lastWideToggleReason ? '#ff4444' : T.inkSoft
      }
    }, "reason: ", lastWideToggleReason || 'none'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, "path: ", lastWideTogglePath || 'none'), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "fWide: ", frontWideCandidates.length), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "rWide: ", rearWideCandidates.length));
    var DebugWideDevicePicker = () => /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6,
        marginTop: 6,
        flexWrap: 'wrap',
        maxHeight: 150,
        overflowY: 'auto',
        padding: 8,
        background: 'rgba(0,0,0,0.08)',
        borderRadius: 12
      }
    }, cameraDevices.map((d, i) => {
      var isActive = activeCameraDeviceId === d.deviceId;
      var isWide = [...frontWideCandidates, ...rearWideCandidates].some(w => w.deviceId === d.deviceId);
      var label = d.label || 'Unnamed Camera';
      return /*#__PURE__*/React.createElement("button", {
        key: d.deviceId || i,
        disabled: cameraToggleBusy,
        onClick: () => onDebugSwitchCameraDevice?.(d.deviceId),
        style: {
          padding: '8px 12px',
          borderRadius: 10,
          border: isActive ? `2px solid ${T.ink}` : '1px solid #ccc',
          background: isActive ? T.ink : '#fff',
          color: isActive ? T.bg : '#111',
          fontSize: 10,
          fontWeight: 700,
          cursor: cameraToggleBusy ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 100,
          flex: '1 0 100px',
          opacity: cameraToggleBusy && !isActive ? 0.5 : 1,
          transition: 'all 0.2s'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          opacity: 0.7,
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }, "#", i, " ", label), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 4,
          marginTop: 2
        }
      }, /*#__PURE__*/React.createElement("span", null, "dev:", String(d.deviceId).slice(-4)), d.groupId && /*#__PURE__*/React.createElement("span", null, "grp:", String(d.groupId).slice(-4)), isWide && /*#__PURE__*/React.createElement("span", {
        style: {
          color: isActive ? T.bg : '#007AFF'
        }
      }, "[WIDE]")));
    }));
    var ZoomHistoryPanel = () => {
      if (cameraZoomHistory.length === 0) return null;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginTop: 6,
          padding: 8,
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 10,
          fontSize: 9,
          fontFamily: 'monospace',
          border: '1px solid rgba(0,0,0,0.05)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 800,
          marginBottom: 4,
          color: T.ink
        }
      }, "ZOOM HISTORY (PROXY FOV)"), cameraZoomHistory.slice(0, 5).map((h, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          marginBottom: 6,
          borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.03)' : 'none',
          paddingBottom: 2
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 700,
          color: h.reason?.includes('success') ? '#007AFF' : '#ff4444'
        }
      }, h.path, " - ", h.reason || '...'), h.snapBefore && h.snapAfter && /*#__PURE__*/React.createElement("div", {
        style: {
          opacity: 0.7
        }
      }, h.snapBefore.deviceId?.slice(-4), "@", h.snapBefore.zoom?.toFixed(2), " \u2192 ", h.snapAfter.deviceId?.slice(-4), "@", h.snapAfter.zoom?.toFixed(2), /*#__PURE__*/React.createElement("br", null), h.snapBefore.width, "x", h.snapBefore.height, " \u2192 ", h.snapAfter.width, "x", h.snapAfter.height))));
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
        marginTop: 8
      }
    }, debugCamera && /*#__PURE__*/React.createElement(WideCameraDebugPill, null), showWidePicker && /*#__PURE__*/React.createElement(DebugWideDevicePicker, null), debugCamera && /*#__PURE__*/React.createElement(ZoomHistoryPanel, null));
  })()), mobile && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      display: 'flex',
      gap: 5,
      paddingBottom: 8,
      maxHeight: 48
    }
  }, thumbs.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      aspectRatio: '1',
      maxHeight: 42,
      borderRadius: 7,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: idx === i ? `0 0 0 2px ${T.pinkDeep}` : '0 0 0 1px rgba(0,0,0,0.08)',
      background: s ? '#000' : T.card,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'box-shadow 0.3s'
    }
  }, s && s.dataUrl ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: s.dataUrl,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })) : s ? /*#__PURE__*/React.createElement(PlaceholderPortrait, {
    seed: i,
    filter: s.filter
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontWeight: 500
    }
  }, i + 1))))), !mobile && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 20px',
      background: T.bgAlt,
      borderLeft: '1px solid rgba(0,0,0,0.04)'
    }
  }, shotsRail)), cameraOverlay);
}

// ═══════════════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════════════
function SelectV2({
  T,
  go,
  mobile,
  shots,
  selected,
  setSelected,
  layout
}) {
  var maxSel = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(layout) : layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
  var availableShots = shots.map((shot, index) => ({
    shot,
    index
  })).filter(({
    shot
  }) => shot?.dataUrl);
  var [previewIdx, setPreviewIdx] = React.useState(null);
  var pressTimerRef = React.useRef(null);
  var longPressRef = React.useRef(false);
  var toggle = i => {
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
    var validIndices = availableShots.map(s => s.index);
    var hasValid = selected.some(idx => validIndices.includes(idx));
    if (!hasValid) {
      if (maxSel === 1) {
        setSelected([availableShots[0].index]);
      } else {
        setSelected(availableShots.slice(0, maxSel).map(s => s.index));
      }
    }
  }, [availableShots.map(s => s.index).join(','), maxSel]);
  var clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  var beginPress = i => {
    clearPressTimer();
    longPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressRef.current = true;
      setPreviewIdx(i);
    }, 420);
  };
  var endPress = () => clearPressTimer();
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: mobile ? '50px 18px 18px' : '24px 56px 24px'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    step: 2,
    back: () => go('capture'),
    T: T,
    mobile: mobile,
    title: mobile ? 'Select' : `Step 3 · Pick your ${maxSel}`,
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: T.inkSoft,
        fontFamily: 'Pretendard,system-ui'
      }
    }, selected.length, "/", maxSel)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: mobile ? 12 : 20,
      textAlign: mobile ? 'left' : 'center'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: mobile ? 26 : 40,
      fontWeight: 500,
      letterSpacing: -1
    }
  }, "Pick your best ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Caveat,cursive',
      color: T.pinkDeep,
      fontSize: mobile ? 32 : 52
    }
  }, maxSel === 1 ? 'one' : maxSel === 3 ? 'three' : 'four', ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      color: T.inkSoft,
      fontSize: mobile ? 13 : 14.5,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Tap in order \u2014 we'll place them in the frame the same way.")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
      gap: mobile ? 8 : 14,
      minHeight: 0
    }
  }, availableShots.map(({
    shot: s,
    index: i
  }) => {
    var sel = selected.indexOf(i);
    var isSel = sel >= 0;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      onPointerDown: () => beginPress(i),
      onPointerUp: endPress,
      onPointerLeave: endPress,
      onPointerCancel: endPress,
      onClick: () => {
        if (longPressRef.current) {
          longPressRef.current = false;
          return;
        }
        toggle(i);
      },
      style: {
        position: 'relative',
        aspectRatio: '1',
        borderRadius: mobile ? 14 : 18,
        overflow: 'hidden',
        padding: 0,
        background: '#000',
        cursor: 'pointer',
        border: 'none',
        maxWidth: '100%',
        maxHeight: '100%',
        placeSelf: 'center',
        width: '100%',
        boxShadow: isSel ? `0 14px 30px rgba(0,0,0,0.15), 0 0 0 3px ${T.ink}` : '0 1px 3px rgba(0,0,0,0.06)',
        transform: isSel ? 'scale(0.96)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)'
      }
    }, s && s.dataUrl ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
      src: s.dataUrl,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    })) : s ? /*#__PURE__*/React.createElement(PlaceholderPortrait, {
      seed: i,
      filter: s.filter || 'porcelain'
    }) : null, isSel && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 32,
        height: 32,
        borderRadius: 999,
        background: T.ink,
        color: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        animation: 'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)'
      }
    }, sel + 1), !isSel && selected.length >= maxSel && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(250,247,245,0.55)',
        backdropFilter: 'blur(2px)'
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelected([]),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: T.inkSoft,
      fontSize: 13,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Clear"), /*#__PURE__*/React.createElement(BtnPrimary, {
    T: T,
    onClick: () => {
      if (selected.length !== maxSel) return;
      var checkLayout = layout || 'strip';
      var mappedSelected = selected.map((shotIdx, targetSlotIndex) => {
        var asset = shots[shotIdx];
        return {
          assetId: asset?.assetId || null,
          sourceShotIndex: shotIdx,
          targetSlotIndex
        };
      });
      var validation = window.IMMMSessionModel?.validateFrameReadiness ? window.IMMMSessionModel.validateFrameReadiness({
        layout: checkLayout,
        shots: shots,
        selected: mappedSelected
      }) : {
        ok: true
      };
      if (!validation.ok) {
        console.error('[IMMM] validateFrameReadiness failed at SelectV2:', validation.errors);
        alert('선택된 사진 데이터의 무결성 검증에 실패했습니다. 다시 선택해주세요.');
        return;
      }
      go('deco');
    },
    size: mobile ? 'md' : 'lg',
    disabled: selected.length !== maxSel
  }, selected.length === maxSel ? /*#__PURE__*/React.createElement(React.Fragment, null, "Deco studio \xB7 \uAFB8\uBBF8\uAE30  ", I.arrowR(16, T.bg)) : `Pick ${maxSel - selected.length} more`)), previewIdx != null && shots[previewIdx]?.dataUrl && /*#__PURE__*/React.createElement("div", {
    onClick: () => setPreviewIdx(null),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(10,10,10,0.82)',
      backdropFilter: 'blur(18px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 'min(92vw, 520px)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: shots[previewIdx].dataUrl,
    style: {
      width: '100%',
      height: 'auto',
      display: 'block',
      borderRadius: 20,
      boxShadow: '0 24px 80px rgba(0,0,0,0.45)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreviewIdx(null),
    style: {
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
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
    }
  }, "\xD7"))));
}
function GalleryV2({
  T,
  go,
  mobile
}) {
  var [items, setItems] = React.useState([]);
  var [busy, setBusy] = React.useState(true);
  var [preview, setPreview] = React.useState(null);
  var [qrPreview, setQrPreview] = React.useState(null);
  var load = React.useCallback(async () => {
    setBusy(true);
    try {
      var rows = typeof LocalGalleryStore !== 'undefined' ? await LocalGalleryStore.listPhotos() : [];
      var filteredRows = rows.filter(row => row.source !== 'qr');
      var mapped = filteredRows.map(row => ({
        ...row,
        url: URL.createObjectURL(row.blob)
      }));
      setItems(prev => {
        prev.forEach(item => item.url && URL.revokeObjectURL(item.url));
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
    return () => setItems(prev => {
      prev.forEach(item => item.url && URL.revokeObjectURL(item.url));
      return [];
    });
  }, [load]);
  var remove = async item => {
    if (typeof LocalGalleryStore === 'undefined') return;
    await LocalGalleryStore.deletePhoto(item.id);
    await load();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: T.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: mobile ? 'calc(var(--sat) + 20px) 20px calc(var(--sab) + 22px)' : '36px 56px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      flexShrink: 0,
      paddingBottom: 18,
      borderBottom: `1px solid ${T.line}`
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('landing'),
    style: {
      border: 'none',
      background: 'transparent',
      color: T.inkSoft,
      cursor: 'pointer',
      fontWeight: 700,
      fontSize: 11,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 1.8,
      textTransform: 'uppercase',
      padding: '4px 0'
    }
  }, "Back"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: T.inkSoft,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      letterSpacing: 2.4,
      textTransform: 'uppercase'
    }
  }, "Private Archive"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: mobile ? 28 : 44,
      lineHeight: 0.95,
      fontWeight: 700,
      letterSpacing: -1.4,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Gallery"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 12,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uD504\uB808\uC784\uC5D0 \uB123\uC5B4 \uD655\uC815\uD55C \uC0AC\uC9C4\uB9CC \uC774 \uAE30\uAE30\uC5D0 \uB0A8\uC2B5\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto',
      marginTop: 24,
      paddingRight: mobile ? 0 : 6
    }
  }, busy ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: T.inkSoft,
      fontWeight: 800
    }
  }, "\uBD88\uB7EC\uC624\uB294 \uC911...") : items.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      minHeight: 360,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: T.inkSoft
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "No Saved Frames"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 24,
      lineHeight: 1.05,
      fontWeight: 700,
      letterSpacing: -0.8,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "\uC544\uC9C1 \uD655\uC815\uB41C \uC0AC\uC9C4\uC774 \uC5C6\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 13,
      lineHeight: 1.6,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uCD2C\uC601\uC744 \uB9C8\uCE58\uACE0 \uACB0\uACFC \uD654\uBA74\uC5D0 \uB3C4\uCC29\uD55C \uC0AC\uC9C4\uB9CC \uC5EC\uAE30\uC5D0 \uC815\uB9AC\uB429\uB2C8\uB2E4.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, minmax(0, 1fr))',
      gap: 16
    }
  }, items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    style: {
      borderRadius: 24,
      background: T.card,
      boxShadow: '0 0 0 1px rgba(26,26,31,0.06), 0 16px 42px rgba(0,0,0,0.045)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreview(item),
    style: {
      width: '100%',
      aspectRatio: '3 / 4',
      border: 'none',
      padding: 0,
      background: '#f5f5f5',
      cursor: 'zoom-in',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: item.url,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '13px 13px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      color: T.inkSoft,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, item.frameType || item.layout), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: T.ink,
      fontWeight: 600,
      fontFamily: 'Pretendard,system-ui'
    }
  }, new Date(item.createdAt).toLocaleDateString('ko-KR'))), /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(item),
    style: {
      border: 'none',
      background: 'transparent',
      color: T.inkSoft,
      borderRadius: 999,
      padding: '7px 0',
      cursor: 'pointer',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, "Delete")))))), preview && /*#__PURE__*/React.createElement("div", {
    onClick: () => setPreview(null),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(10,10,10,0.82)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 'min(92vw,460px)',
      maxHeight: '88vh',
      background: '#fff',
      borderRadius: 24,
      padding: 16,
      textAlign: 'center',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: preview.url,
    style: {
      width: '100%',
      maxHeight: '68vh',
      objectFit: 'contain',
      borderRadius: 16,
      background: '#f4f4f4'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gridTemplateColumns: preview.shareInfo?.qrDataUrl ? '1fr 1fr' : '1fr',
      gap: 10
    }
  }, preview.shareInfo?.qrDataUrl && /*#__PURE__*/React.createElement("button", {
    onClick: () => setQrPreview(preview.shareInfo),
    style: {
      padding: '13px 16px',
      borderRadius: 14,
      border: '1px solid rgba(17,17,17,0.1)',
      background: '#fff',
      color: '#111',
      fontWeight: 900,
      cursor: 'pointer'
    }
  }, "QR \uBCF4\uAE30"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPreview(null),
    style: {
      padding: '13px 16px',
      borderRadius: 14,
      border: 'none',
      background: '#111',
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer'
    }
  }, "\uB2EB\uAE30")))), qrPreview && /*#__PURE__*/React.createElement("div", {
    onClick: () => setQrPreview(null),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      background: 'rgba(10,10,10,0.82)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 'min(90vw,360px)',
      background: '#fff',
      borderRadius: 22,
      padding: 20,
      textAlign: 'center',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: qrPreview.qrDataUrl,
    style: {
      width: 220,
      height: 220,
      imageRendering: 'pixelated'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 13,
      color: T.inkSoft,
      lineHeight: 1.5,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uC774 \uACB0\uACFC\uBB3C\uC5D0 \uC5F0\uACB0\uB41C QR \uACF5\uC720\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("button", {
    onClick: () => setQrPreview(null),
    style: {
      marginTop: 12,
      width: '100%',
      padding: '13px 16px',
      borderRadius: 14,
      border: 'none',
      background: '#111',
      color: '#fff',
      fontWeight: 900,
      cursor: 'pointer'
    }
  }, "\uB2EB\uAE30"))));
}
function SharedPhotoV2({
  T,
  go,
  mobile
}) {
  var [state, setState] = React.useState(() => {
    var raw = location.hash || '';
    var query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
    var params = new URLSearchParams(query);
    var url = params.get('u');
    var expiresAt = Number(params.get('e') || 0);
    return {
      url,
      expiresAt
    };
  });
  var expired = state.expiresAt && Date.now() > state.expiresAt;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: mobile ? 'calc(var(--sat) + 18px) 18px calc(var(--sab) + 18px)' : 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 'min(92vw,460px)',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 4,
      color: T.inkSoft,
      textTransform: 'uppercase'
    }
  }, "IMMM Shared Moment"), state.url && !expired ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: state.url,
    style: {
      width: '100%',
      marginTop: 20,
      borderRadius: 26,
      background: '#f4f4f4',
      boxShadow: '0 28px 80px rgba(0,0,0,0.12)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      fontSize: 13,
      color: T.inkSoft,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uACF5\uC720 \uC774\uBBF8\uC9C0\uB294 7\uC77C \uB3D9\uC548 \uBCF4\uAD00\uB429\uB2C8\uB2E4.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: '42px 22px',
      borderRadius: 26,
      background: 'rgba(26,26,31,0.05)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 42,
      marginBottom: 14
    }
  }, "\uD83D\uDD12"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 900,
      color: T.ink,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uACF5\uC720 \uB9C1\uD06C\uAC00 \uB9CC\uB8CC\uB410\uC5B4\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 14,
      color: T.inkSoft,
      lineHeight: 1.5,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "QR \uACF5\uC720 \uC774\uBBF8\uC9C0\uB294 7\uC77C \uBCF4\uAD00 \uC815\uCC45\uC744 \uB530\uB985\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      location.hash = '';
      go('landing');
    },
    style: {
      marginTop: 18,
      padding: '14px 22px',
      borderRadius: 999,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontWeight: 900,
      cursor: 'pointer'
    }
  }, "IMMM \uC5F4\uAE30")));
}
function CaptureOverlay({
  template,
  layout,
  logo,
  dateText,
  accent,
  frameColor,
  viewfinderAspect
}) {
  var canvasRef = React.useRef(null);
  var draw = React.useCallback(() => {
    var cvs = canvasRef.current;
    if (!cvs || !template) return;
    var rect = cvs.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    if (!w || !h) return;
    var ctx = cvs.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    ctx.scale(dpr, dpr);

    // 1. Compute photo slot aspect — use photoRects (normalized) for accuracy
    var pr = template.photoRects?.[0];
    var ps = template.photoSlots?.[0];
    var slotAspect = pr ? pr.w / pr.h : ps ? ps.width / ps.height : viewfinderAspect || 3 / 4;
    var containerAspect = viewfinderAspect || slotAspect;

    // Photo area inside the viewfinder (letter-box / pillar-box)
    var gW, gH;
    if (containerAspect > slotAspect) {
      gH = h;
      gW = h * slotAspect;
    } else {
      gW = w;
      gH = w / slotAspect;
    }
    var l = (w - gW) / 2;
    var t = (h - gH) / 2;
    ctx.clearRect(0, 0, w, h);

    // Dim outside photo area
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    if (t > 0) {
      ctx.fillRect(0, 0, w, t);
      ctx.fillRect(0, h - t, w, t);
    }
    if (l > 0) {
      ctx.fillRect(0, t, l, gH);
      ctx.fillRect(w - l, t, l, gH);
    }

    // Photo area border
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.5;
    // 2. Map template space → viewfinder space and call renderFrameOverlay
    var resolveFrameTemplate = layout => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') {
        return window.getFrameTemplateSafe(layout);
      }
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') {
        return window.getFrameTemplate(layout);
      }
      console.error('[IMMM] frame-system not ready: getFrameTemplate missing');
      return null;
    };
    var resolvedTemplate = resolveFrameTemplate(layout); // Use different name to avoid shadowing prop
    if (!resolvedTemplate) {
      console.warn('[IMMM] skip overlay draw: template unavailable', layout);
      return;
    }
    var renderOverlay = window.renderFrameOverlay || (typeof renderFrameOverlay === 'function' ? renderFrameOverlay : null);
    if (pr && renderOverlay) {
      // Scale factor: the photo rect occupies gW px in the overlay
      var s = gW / (pr.w * resolvedTemplate.canvasSize.width);
      var fullW = resolvedTemplate.canvasSize.width * s;
      var fullH = resolvedTemplate.canvasSize.height * s;
      var offsetX = l - pr.x * resolvedTemplate.canvasSize.width * s;
      var offsetY = t - pr.y * resolvedTemplate.canvasSize.height * s;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      var getTheme = window.getFrameTheme || (typeof getFrameTheme === 'function' ? getFrameTheme : null);
      var theme = getTheme ? getTheme(resolvedTemplate, {
        frameColor
      }) : null;
      renderOverlay(ctx, resolvedTemplate, fullW, fullH, {
        frameColor,
        logo,
        dateText,
        accent,
        // Force light colors if explicitly dark frame, but prioritize overlay visibility
        textColor: theme?.dateColor || 'rgba(255,255,255,0.88)',
        logoColor: theme?.markColor || 'rgba(255,255,255,0.95)',
        dotColor: theme?.dotColor || 'rgba(255,255,255,0.88)'
      });
      ctx.restore();
    }

    // "저장 영역" label badge
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(l + 8, t + 8, 56, 20, 4);else ctx.rect(l + 8, t + 8, 56, 20);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 10px Pretendard, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('저장 영역', l + 36, t + 19);
  }, [template, layout, logo, dateText, accent, frameColor, viewfinderAspect]);
  React.useEffect(() => {
    draw();
    var cvs = canvasRef.current;
    if (!cvs) return;
    var ro = new ResizeObserver(() => draw());
    ro.observe(cvs);
    return () => ro.disconnect();
  }, [draw]);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 10,
      pointerEvents: 'none'
    }
  });
}
Object.assign(window, {
  CaptureV2,
  SelectV2,
  GalleryV2,
  SharedPhotoV2,
  CaptureOverlay
});