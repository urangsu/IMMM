// screens-v2-deco.jsx — Deco Studio + Result

// MARK: - Debug Runtime Asset Registry (Phase 3.63)

function publishDebugResultAssetRecord(input) {
  if (!window.IMMM_DEBUG_SESSION) return null;
  var Store = window.IMMMResultAssetStore;
  if (!Store) return null;
  try {
    var current = window.__IMMM_RESULT_ASSET_STORE__ || Store.createResultAssetStoreState();
    var record = Store.createResultAssetRecord({
      sessionId: input.sessionId || 'debug_session',
      kind: 'image',
      status: input.remoteUrl ? 'cloud-ready' : 'local-ready',
      objectUrl: input.objectUrl || null,
      blobId: input.blobId || null,
      remoteUrl: input.remoteUrl || null,
      width: input.width || 0,
      height: input.height || 0,
      mimeType: input.mimeType || 'image/png',
      metadata: {
        source: 'result-debug',
        label: input.label || 'final-result'
      }
    });
    var next = Store.addResultAssetRecord(current, record);
    window.__IMMM_RESULT_ASSET_STORE__ = next;
    console.debug('[IMMM result asset]', record);
    return record;
  } catch (error) {
    console.debug('[IMMM result asset failed]', error);
    return null;
  }
}
var ZoomMinusIcon = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 18 18",
  "aria-hidden": "true",
  focusable: "false"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 9H14",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round"
}));
var ZoomPlusIcon = () => /*#__PURE__*/React.createElement("svg", {
  width: "18",
  height: "18",
  viewBox: "0 0 18 18",
  "aria-hidden": "true",
  focusable: "false"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 9H14M9 4V14",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round"
}));

/**
 * Safety helper to revoke blob URLs without touching remote or non-blob URLs
 */
function revokeBlobUrl(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
}
var zoomBtnStyle = {
  width: 56,
  height: 56,
  borderRadius: 999,
  border: 'none',
  padding: 0,
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  boxShadow: '0 8px 24px rgba(0,0,0,0.16)'
};
var getDecoFitMaxScale = (layout, mobile) => {
  if (!mobile) return 1.5;
  if (layout === 'strip') return 0.55;
  if (layout === 'trip') return 0.68;
  if (layout === 'grid') return 0.92;
  if (layout === 'polaroid') return 0.92;
  return 0.9;
};

// ═══════════════════════════════════════════════════════════════
// DECO STUDIO — final edit (filter+frame locked)
// ═══════════════════════════════════════════════════════════════
function getStickerPickerPacks() {
  return typeof getVisibleStickerPacks === 'function' ? getVisibleStickerPacks() : Object.entries(STICKER_CATALOG).filter(([k, pack]) => !pack.hidden);
}
function DecoV2({
  T,
  go,
  mobile,
  variant,
  shots,
  selected,
  filter,
  layout,
  orientation,
  stickers,
  setStickers,
  drawStrokes,
  setDrawStrokes,
  logo,
  dateText,
  setDateText,
  accent,
  frameColor
}) {
  var [tab, setTab] = React.useState('stickers'); // stickers | draw | text
  var [selStId, setSelStId] = React.useState(null);
  var [drawColor, setDrawColor] = React.useState('#D98893');
  var [drawMode, setDrawMode] = React.useState(false);
  var drawModeRef = React.useRef(false);
  var [drawWidth, setDrawWidth] = React.useState(3);
  var [drawBrush, setDrawBrush] = React.useState('pen'); // pen | sparkle
  var [textInput, setTextInput] = React.useState('');
  var fileRef = React.useRef(null);
  var curStrokeRef = React.useRef(null);
  var curPathElRef = React.useRef(null);
  var curPathDRef = React.useRef('');
  var [drawVersion, setDrawVersion] = React.useState(0);
  var drawRafRef = React.useRef(null);

  // One-time font readiness gate — keeps preview/export text rendering consistent
  var [fontsReady, setFontsReady] = React.useState(false);
  React.useEffect(() => {
    var alive = true;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontsReady(true);
      });
    } else {
      setFontsReady(true);
    }
    return () => {
      alive = false;
    };
  }, []);

  // Cleanup drawRafRef on unmount to prevent RAF leak
  React.useEffect(() => {
    return () => {
      if (drawRafRef.current) {
        cancelAnimationFrame(drawRafRef.current);
        drawRafRef.current = null;
      }
    };
  }, []);
  var requestDrawRefresh = React.useCallback(() => {
    if (drawRafRef.current) return;
    drawRafRef.current = requestAnimationFrame(() => {
      drawRafRef.current = null;
      setDrawVersion(v => v + 1);
    });
  }, []);
  var getDecoInitialPresetScale = item => {
    if (!item) return 1;
    if (item.type === 'mini') return 1.25;
    if (item.type === 'immm-logo') return 1.0;
    if (item.type === 'text') return 1.12;
    if (item.type === 'burst' || item.type === 'cloud') return 1.0;
    return 1;
  };
  var addPreset = libId => {
    var item = typeof getStickerByLibId === 'function' ? getStickerByLibId(libId) : null;
    var sizeNorm = typeof getDefaultStickerSizeNorm === 'function' ? getDefaultStickerSizeNorm(item) : undefined;
    setStickers(p => [...p, makeSticker('preset', {
      libId
    }, {
      sizeNorm,
      scale: 1
    })]);
  };
  var addUpload = dataUrl => setStickers(p => [...p, makeSticker('upload', {
    dataUrl
  }, {
    scale: 0.6
  })]);
  var addText = () => {
    if (!textInput.trim()) return;
    var rect = frameNativeRef.current?.getBoundingClientRect();
    var sizeNorm = rect?.width ? 32 / rect.width : null;
    setStickers(p => [...p, makeSticker('text', {
      text: textInput,
      font: 'Caveat',
      size: 32,
      color: drawColor
    }, {
      sizeNorm
    })]);
    setTextInput('');
  };
  var onFile = e => {
    var f = e.target.files?.[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = () => addUpload(rd.result);
    rd.readAsDataURL(f);
  };
  var shotsForFrame = shots;

  // Draw handlers
  var toggleDrawMode = () => {
    var next = !drawModeRef.current;
    drawModeRef.current = next;
    setDrawMode(next);
    if (next) setSelStId(null); // deselect stickers when entering draw mode
  };
  var onDrawStart = React.useCallback(e => {
    if (!drawModeRef.current || !frameNativeRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    // Pointer capture: keeps move/up events even if pointer leaves element
    if (e.pointerId != null && e.currentTarget?.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    var rect = frameNativeRef.current.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width * 100;
    var y = (e.clientY - rect.top) / rect.height * 100;
    // Store normalized width so export renders at same visual size regardless of canvas scale
    var widthNorm = rect.width > 0 ? drawWidth / rect.width : null;
    // High-entropy seed: avoids collision even when multiple strokes start same ms
    var seed = Math.floor(performance.now() * 1000) ^ Math.floor(Math.random() * 1e9);
    curStrokeRef.current = {
      color: drawColor,
      width: drawWidth,
      // legacy fallback
      widthNorm,
      // normalized: 0~1 of frame display width
      brush: drawBrush,
      points: [[x, y]],
      seed
    };
    curPathDRef.current = `M${x} ${y}`;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', curPathDRef.current);
      curPathElRef.current.setAttribute('stroke', drawColor);
      curPathElRef.current.setAttribute('stroke-width', drawWidth);
    }
  }, [drawColor, drawWidth, drawBrush]);
  var onDrawMove = React.useCallback(e => {
    if (!drawModeRef.current || !frameNativeRef.current || !curStrokeRef.current) return;
    e.preventDefault();
    var rect = frameNativeRef.current.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width * 100;
    var y = (e.clientY - rect.top) / rect.height * 100;
    curStrokeRef.current.points.push([x, y]);
    curPathDRef.current += ` L${x} ${y}`;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', curPathDRef.current);
    }
    requestDrawRefresh();
  }, [requestDrawRefresh]);
  var onDrawEnd = React.useCallback(e => {
    if (e?.pointerId != null && e.currentTarget?.releasePointerCapture) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    if (curStrokeRef.current && curStrokeRef.current.points.length > 1) {
      var stroke = curStrokeRef.current;
      setDrawStrokes(p => [...p.filter(Boolean), stroke]);
    }
    curStrokeRef.current = null;
    if (curPathElRef.current) {
      curPathElRef.current.setAttribute('d', '');
    }
  }, [setDrawStrokes]);
  var undoStroke = () => setDrawStrokes(p => p.slice(0, -1));
  var clearDraw = () => setDrawStrokes([]);
  var previewContainerRef = React.useRef(null);
  var frameNativeRef = React.useRef(null);
  var [zoom, setZoom] = React.useState(() => getDecoFitMaxScale(layout, mobile));
  React.useEffect(() => {
    var fit = () => {
      if (!previewContainerRef.current || !frameNativeRef.current) return;
      var cW = previewContainerRef.current.clientWidth - 40;
      var cH = previewContainerRef.current.clientHeight - 40;
      var fW = frameNativeRef.current.offsetWidth;
      var fH = frameNativeRef.current.offsetHeight;
      if (!fW || !fH) return;
      var maxS = getDecoFitMaxScale(layout, mobile);
      var s = Math.min(maxS, cW / fW, cH / fH);
      setZoom(Math.max(0.2, s));
    };
    fit();
    var ro = new ResizeObserver(fit);
    if (previewContainerRef.current) ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [layout, mobile]);
  var zoomIn = () => setZoom(z => Math.min(3, +(z + 0.15).toFixed(2)));
  var zoomOut = () => setZoom(z => Math.max(0.2, +(z - 0.15).toFixed(2)));
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
  var zoomControls = /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 18,
      right: 18,
      display: 'flex',
      gap: 10,
      zIndex: 20,
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: zoomOut,
    style: zoomBtnStyle,
    "aria-label": "Zoom out"
  }, /*#__PURE__*/React.createElement(ZoomMinusIcon, null)), /*#__PURE__*/React.createElement("button", {
    onClick: zoomIn,
    style: zoomBtnStyle,
    "aria-label": "Zoom in"
  }, /*#__PURE__*/React.createElement(ZoomPlusIcon, null)));
  var compositionCanvasRef = React.useRef(null);
  var renderSeqRef = React.useRef(0);
  React.useEffect(() => {
    var cancelled = false;
    var draw = async () => {
      if (cancelled || !compositionCanvasRef.current || !fontsReady) return;
      var cvs = compositionCanvasRef.current;
      var ctx = cvs.getContext('2d');
      if (!ctx) return;
      var seq = ++renderSeqRef.current;
      var template = resolveFrameTemplate(layout);
      if (!template) {
        console.warn('[IMMM] skip draw: frame template unavailable', layout);
        return;
      }
      var baseW = template.canvasSize.width;
      var baseH = template.canvasSize.height;
      var data = {
        layout,
        shots,
        selected,
        filter,
        frameColor,
        stickers,
        drawStrokes: [...drawStrokes, curStrokeRef.current],
        logo,
        dateText,
        accent,
        orientation
      };

      // Render to offscreen canvas to prevent tearing/flickering
      var off = document.createElement('canvas');
      off.width = baseW;
      off.height = baseH;
      var offCtx = off.getContext('2d');
      if (!offCtx) return;
      var renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
      if (renderComp) {
        await renderComp(offCtx, data, {
          scale: 1
        });
      } else {
        console.warn('[IMMM] skip render: renderComposition missing');
      }
      if (cancelled || seq !== renderSeqRef.current) return;
      cvs.width = baseW;
      cvs.height = baseH;
      ctx.clearRect(0, 0, baseW, baseH);
      ctx.drawImage(off, 0, 0);
    };
    // RAF-only: avoids double render per dependency change
    var raf = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [fontsReady, layout, shots, selected, filter, frameColor, stickers, drawStrokes, drawVersion, logo, dateText, accent, orientation, drawMode]);
  var frameW = layout === 'strip' || layout === 'trip' ? 180 : 220;

  // Compute ratio of CSS displayed size to native canvas size.
  // composition canvas renders at native baseW×baseH, but CSS displays at frameW wide.
  // hitbox bounds (in CSS px) = native bounds × (cssSize / nativeSize).
  // Do NOT use getBoundingClientRect here — it reflects zoom transform.
  var decoScale = React.useMemo(() => {
    var resolveFrameTemplate = l => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') return window.getFrameTemplateSafe(l);
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') return window.getFrameTemplate(l);
      return null;
    };
    var tmpl = resolveFrameTemplate(layout);
    var baseW = tmpl?.canvasSize?.width || 880;
    var baseH = tmpl?.canvasSize?.height || 1070;
    var cssW = frameW;
    var cssH = frameW * (baseH / baseW);
    return {
      x: cssW / baseW,
      y: cssH / baseH
    };
  }, [layout, frameW]);
  var preview = /*#__PURE__*/React.createElement("div", {
    ref: previewContainerRef,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: frameNativeRef,
    style: {
      width: frameW,
      transform: `scale(${zoom})`,
      transformOrigin: 'center',
      position: 'relative',
      flexShrink: 0,
      touchAction: drawMode ? 'none' : 'auto'
    },
    onPointerDown: onDrawStart,
    onPointerMove: onDrawMove,
    onPointerUp: onDrawEnd,
    onPointerCancel: onDrawEnd
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: compositionCanvasRef,
    style: {
      width: '100%',
      height: 'auto',
      display: 'block',
      pointerEvents: 'none',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      borderRadius: 4
    }
  }), /*#__PURE__*/React.createElement(StickerCanvas, {
    T: T,
    stickers: stickers,
    setStickers: setStickers,
    selectedId: selStId,
    setSelectedId: setSelStId,
    mode: "deco-overlay",
    hideVisuals: true,
    decoScale: decoScale,
    width: "100%",
    height: "100%",
    canvasW: frameW,
    style: {
      position: 'absolute',
      inset: 0
    }
  })), zoomControls);

  // Sticker layer controls (only when one is selected)
  var selSticker = stickers.find(s => s.id === selStId);
  var layerBar = selSticker && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      padding: 8,
      background: 'rgba(26,26,31,0.05)',
      borderRadius: 14,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStickers(p => bringForward(p, selStId)),
    style: chipBtn(T)
  }, "Forward \u2191"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStickers(p => sendBackward(p, selStId)),
    style: chipBtn(T)
  }, "Back \u2193"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStickers(p => p.map(s => s.id === selStId ? {
      ...s,
      rotation: (s.rotation || 0) - 15
    } : s)),
    style: chipBtn(T)
  }, "\u27F2"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStickers(p => p.map(s => s.id === selStId ? {
      ...s,
      rotation: (s.rotation || 0) + 15
    } : s)),
    style: chipBtn(T)
  }, "\u27F3"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStickers(p => p.filter(s => s.id !== selStId)),
    style: {
      ...chipBtn(T),
      background: T.pinkDeep,
      color: '#fff'
    }
  }, "Remove"));
  var [setlogTime, setSetlogTime] = React.useState(() => {
    var now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  var [setlogCaption, setSetlogCaption] = React.useState('');
  var [setlogTheme, setSetlogTheme] = React.useState('white'); // white | black
  var [expandedPacks, setExpandedPacks] = React.useState({});
  var addSetlog = () => {
    setStickers(p => [...p, makeSticker('setlog', {
      time: setlogTime,
      caption: setlogCaption,
      theme: setlogTheme
    }, {
      rotation: 0
    })]);
  };
  var stickerTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "TIME \xB7 \uC2DC\uAC04 \uAE30\uB85D"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      background: 'rgba(26,26,31,0.04)',
      borderRadius: 16,
      padding: '10px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center',
      marginBottom: 8,
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      paddingBottom: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      fontWeight: 600,
      color: T.inkSoft,
      textTransform: 'uppercase',
      letterSpacing: 0.3
    }
  }, "Theme"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSetlogTheme('white'),
    style: {
      width: 18,
      height: 18,
      borderRadius: 5,
      background: '#fff',
      border: setlogTheme === 'white' ? `2px solid ${T.ink}` : '1px solid rgba(0,0,0,0.1)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSetlogTheme('black'),
    style: {
      width: 18,
      height: 18,
      borderRadius: 5,
      background: '#000',
      border: setlogTheme === 'black' ? `2px solid ${T.ink}` : '1px solid rgba(0,0,0,0.1)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: T.ink,
      fontFamily: '"Plus Jakarta Sans",system-ui'
    }
  }, setlogTime)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: setlogTime,
    onChange: e => setSetlogTime(e.target.value),
    style: {
      width: mobile ? 70 : 82,
      padding: '6px 3px',
      borderRadius: 9,
      border: 'none',
      background: 'rgba(26,26,31,0.07)',
      fontSize: 11,
      fontWeight: 700,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      color: '#1A1A1F',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: setlogCaption,
    onChange: e => setSetlogCaption(e.target.value),
    placeholder: "\uBA58\uD2B8...",
    maxLength: 14,
    style: {
      flex: 1,
      minWidth: 0,
      padding: '6px 7px',
      borderRadius: 9,
      border: 'none',
      background: 'rgba(26,26,31,0.07)',
      fontSize: 11.5,
      fontFamily: 'Pretendard,system-ui',
      color: '#1A1A1F',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addSetlog,
    style: {
      padding: mobile ? '6px 9px' : '7px 14px',
      background: T.ink,
      color: T.bg,
      border: 'none',
      borderRadius: 9,
      fontWeight: 700,
      fontSize: 11.5,
      cursor: 'pointer',
      fontFamily: '"Plus Jakarta Sans",system-ui',
      flexShrink: 0
    }
  }, "Add"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Stickers \xB7 \uC2A4\uD2F0\uCEE4"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileRef.current?.click(),
    style: {
      padding: '6px 10px',
      background: T.ink,
      color: T.bg,
      border: 'none',
      borderRadius: 999,
      fontSize: 11,
      cursor: 'pointer',
      fontWeight: 600
    }
  }, "+ Upload"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: onFile
  })), layerBar, getStickerPickerPacks().map(([k, pack]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: T.inkSoft,
      marginBottom: 6
    }
  }, pack.name, " \xB7 ", pack.ko), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
      gap: 8
    }
  }, (expandedPacks[k] ? pack.items : pack.items.slice(0, 5)).map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    onClick: () => addPreset(it.id),
    style: {
      padding: 10,
      background: T.card,
      border: 'none',
      borderRadius: 12,
      boxShadow: '0 0 0 1px rgba(26,26,31,0.06)',
      cursor: 'pointer',
      minHeight: 58,
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: 42,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      writingMode: 'horizontal-tb',
      whiteSpace: 'nowrap'
    }
  }, renderLibSticker(it, 0.62)))), !expandedPacks[k] && pack.items.length > 5 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedPacks(p => ({
      ...p,
      [k]: true
    })),
    style: {
      padding: 10,
      background: 'rgba(26,26,31,0.04)',
      border: 'none',
      borderRadius: 12,
      color: T.inkSoft,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      minHeight: 58,
      height: 58,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, "+", pack.items.length - 5)))));
  var drawTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Draw \xB7 \uB099\uC11C"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: undoStroke,
    style: chipBtn(T)
  }, "Undo"), /*#__PURE__*/React.createElement("button", {
    onClick: clearDraw,
    style: chipBtn(T)
  }, "Clear"))), /*#__PURE__*/React.createElement("button", {
    onClick: toggleDrawMode,
    style: {
      marginTop: 10,
      width: '100%',
      padding: '12px',
      borderRadius: 14,
      border: 'none',
      background: drawMode ? T.ink : 'rgba(26,26,31,0.06)',
      color: drawMode ? T.bg : T.ink,
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, drawMode ? 'Drawing ON · 그리는 중' : 'Start drawing · 그리기'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: T.inkSoft,
      marginBottom: 8
    }
  }, "Brush \xB7 \uBE0C\uB7EC\uC2DC"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDrawBrush('pen'),
    style: {
      flex: 1,
      padding: '10px',
      borderRadius: 12,
      border: 'none',
      background: drawBrush === 'pen' ? T.ink : 'rgba(26,26,31,0.06)',
      color: drawBrush === 'pen' ? T.bg : T.ink,
      fontWeight: 600,
      fontSize: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 14l4-4 8-8-2-2-8 8-4 4 2 2z",
    fill: "currentColor"
  })), "Pen"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDrawBrush('sparkle'),
    style: {
      flex: 1,
      padding: '10px',
      borderRadius: 12,
      border: 'none',
      background: drawBrush === 'sparkle' ? T.ink : 'rgba(26,26,31,0.06)',
      color: drawBrush === 'sparkle' ? T.bg : T.ink,
      fontWeight: 600,
      fontSize: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 0v5M8 11v5M0 8h5M11 8h5M2 2l3 3M11 11l3 3M2 14l3-3M11 5l3-3",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round"
  })), "Sparkle")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: T.inkSoft,
      marginBottom: 8
    }
  }, "Width \xB7 \uAD75\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "1",
    max: "8",
    step: "0.5",
    value: drawWidth,
    onChange: e => setDrawWidth(parseFloat(e.target.value)),
    style: {
      flex: 1,
      accentColor: T.pinkDeep
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      minWidth: 28,
      textAlign: 'right'
    }
  }, drawWidth, "px")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 10,
      letterSpacing: 1.5,
      fontWeight: 600,
      textTransform: 'uppercase',
      color: T.inkSoft,
      marginBottom: 8
    }
  }, "Color \xB7 \uC0C9\uC0C1"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, ['#D98893', '#FF5577', '#1A1A1F', '#FFFFFF', '#FFD94A', '#5CC2FF', '#69D66B', '#B684E8'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setDrawColor(c),
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      background: c,
      border: 'none',
      cursor: 'pointer',
      boxShadow: drawColor === c ? '0 0 0 2px ' + T.ink + ', 0 0 0 3px ' + T.bg : '0 0 0 1px rgba(0,0,0,0.1)'
    }
  }))));
  var textTab = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Kick, {
    T: T
  }, "Add text \xB7 \uD14D\uC2A4\uD2B8"), /*#__PURE__*/React.createElement("input", {
    value: textInput,
    onChange: e => setTextInput(e.target.value),
    placeholder: "Type something...",
    style: {
      marginTop: 10,
      width: '100%',
      padding: '12px 14px',
      borderRadius: 14,
      border: 'none',
      background: 'rgba(26,26,31,0.05)',
      fontSize: 14,
      fontFamily: 'Pretendard,system-ui'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, ['#D98893', '#FF5577', '#1A1A1F', '#FFD94A'].map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    onClick: () => setDrawColor(c),
    style: {
      width: 26,
      height: 26,
      borderRadius: 999,
      background: c,
      border: 'none',
      cursor: 'pointer',
      boxShadow: drawColor === c ? '0 0 0 2px ' + T.ink : '0 0 0 1px rgba(0,0,0,0.1)'
    }
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: addText,
    style: {
      marginTop: 12,
      width: '100%',
      padding: 12,
      borderRadius: 14,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, "Add to frame"));
  var tabContent = tab === 'stickers' ? stickerTab : tab === 'draw' ? drawTab : textTab;
  var tabBar = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 0,
      borderBottom: `1px solid ${T.line}`,
      marginBottom: 16
    }
  }, [['stickers', 'Stickers'], ['draw', 'Draw'], ['text', 'Text']].map(([k, en]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      flex: 1,
      padding: '14px 8px',
      border: 'none',
      borderBottom: tab === k ? `2px solid ${T.ink}` : '2px solid transparent',
      background: 'transparent',
      color: tab === k ? T.ink : T.inkSoft,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontFamily: '"Plus Jakarta Sans",system-ui',
      marginBottom: -1
    }
  }, en)));
  if (mobile) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        background: T.bg,
        paddingTop: 'calc(var(--sat) + 12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 12px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => go('select'),
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: T.ink,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M10 2L4 8l6 6"
    })), "Back"), /*#__PURE__*/React.createElement(StepDots, {
      step: 3,
      T: T
    }), /*#__PURE__*/React.createElement(BtnPrimary, {
      T: T,
      size: "sm",
      onClick: () => go('result')
    }, "Done"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: T.bgAlt,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 16px',
        height: 280
      }
    }, preview), /*#__PURE__*/React.createElement("div", {
      style: {
        background: T.bg,
        padding: '0 16px 60px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 4,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.1)',
        margin: '10px auto 0'
      }
    }), tabBar, tabContent)));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      background: T.bg,
      display: 'grid',
      gridTemplateColumns: '1fr 380px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 48px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    step: 3,
    back: () => go('select'),
    T: T,
    title: "Step 4 \xB7 Deco Studio",
    right: /*#__PURE__*/React.createElement(BtnPrimary, {
      T: T,
      size: "md",
      onClick: () => go('result')
    }, "Finish \xB7 \uC644\uB8CC  ", I.arrowR(14, T.bg))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: T.bgAlt,
      borderRadius: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }
  }, preview, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 16,
      left: 18,
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px',
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Frame: ", layout, " \xB7 locked"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px',
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600
    }
  }, "Filter: ", (FILTERS[filter] || FILTERS.smooth).name, " \xB7 locked")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderLeft: '1px solid rgba(0,0,0,0.07)',
      padding: '24px 22px',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }
  }, tabBar, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, tabContent)));
}
function chipBtn(T) {
  return {
    padding: '6px 10px',
    fontSize: 11,
    borderRadius: 999,
    background: 'rgba(26,26,31,0.06)',
    color: T.ink,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600
  };
}

// ═══════════════════════════════════════════════════════════════
// RESULT PRINT INTRO
// ═══════════════════════════════════════════════════════════════
function ResultPrintIntro({
  T,
  mobile,
  layout,
  previewSrc
}) {
  var prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var duration = prefersReducedMotion ? 500 : 2000;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 200000,
      background: '#F1F1F3',
      // Soft ivory/light gray
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @keyframes immmSlotPhotoEmerge {
          0% { transform: translateY(-88%); opacity: 0.9; }
          10% { opacity: 1; }
          85% { transform: translateY(0); }
          92% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        @keyframes immmSlotFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      animation: 'immmSlotFadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280,
      height: 28,
      background: '#FFFFFF',
      borderRadius: '10px 10px 2px 2px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 -1px 1px rgba(0,0,0,0.04)',
      position: 'relative',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 5,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 230,
      height: 6,
      background: '#1A1A1F',
      borderRadius: 3,
      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.6)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: mobile ? 260 : 320,
      height: 480,
      overflow: 'hidden',
      position: 'relative',
      marginTop: -8,
      zIndex: 5,
      maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)',
      WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      animation: prefersReducedMotion ? 'none' : `immmSlotPhotoEmerge ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
      transform: prefersReducedMotion ? 'none' : 'translateY(-88%)',
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: previewSrc,
    style: {
      transform: 'scale(0.85)',
      transformOrigin: 'top center',
      width: (mobile ? 200 : 240) * (layout === 'strip' || layout === 'trip' ? 1.35 : 1.2),
      height: 'auto',
      display: 'block',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      borderRadius: 4
    },
    alt: "Printing..."
  })))));
}

// ═══════════════════════════════════════════════════════════════
// RESULT
// ═══════════════════════════════════════════════════════════════
function ResultV2({
  T,
  go,
  mobile,
  variant,
  shots,
  selected,
  filter,
  layout,
  orientation,
  stickers,
  drawStrokes,
  logo,
  dateText,
  accent,
  frameColor,
  activeSessionId
}) {
  var shotCount = typeof getShotCountForLayout === 'function' ? getShotCountForLayout(layout) : layout === 'polaroid' ? 1 : layout === 'trip' ? 3 : 4;
  var getResultPreviewBaseWidth = (layoutId, isMobile) => {
    if (isMobile) {
      if (layoutId === 'strip') return 230;
      if (layoutId === 'trip') return 240;
      return 280;
    }
    if (layoutId === 'strip') return 340;
    if (layoutId === 'trip') return 360;
    if (layoutId === 'grid') return 420;
    if (layoutId === 'polaroid') return 360;
    return 360;
  };
  var getResultPreviewFit = (layoutId, isMobile) => {
    var rules = {
      strip: {
        maxScale: isMobile ? 1.6 : 2.8,
        targetHeightVh: isMobile ? 50 : 58,
        maxHeightPx: isMobile ? 600 : 700,
        padding: isMobile ? 12 : 24
      },
      trip: {
        maxScale: isMobile ? 1.5 : 2.4,
        targetHeightVh: isMobile ? 48 : 56,
        maxHeightPx: isMobile ? 580 : 680,
        padding: isMobile ? 12 : 24
      },
      grid: {
        maxScale: isMobile ? 1.1 : 1.55,
        targetHeightVh: isMobile ? 38 : 44,
        maxHeightPx: isMobile ? 420 : 500,
        padding: isMobile ? 14 : 28
      },
      polaroid: {
        maxScale: isMobile ? 1.05 : 1.45,
        targetHeightVh: isMobile ? 36 : 42,
        maxHeightPx: isMobile ? 400 : 480,
        padding: isMobile ? 14 : 28
      }
    };
    return rules[layoutId] || rules.grid;
  };
  var getResultDisplayFit = (layoutId, isMobile) => {
    if (layoutId === 'strip') {
      return {
        minScale: isMobile ? 0.76 : 0.70,
        maxScale: isMobile ? 1.35 : 1.45,
        targetHeightVh: isMobile ? 52 : 58,
        maxHeightPx: isMobile ? 620 : 700,
        minHeightPx: isMobile ? 420 : 520
      };
    }
    if (layoutId === 'trip') {
      return {
        minScale: isMobile ? 0.82 : 0.72,
        maxScale: isMobile ? 1.25 : 1.35,
        targetHeightVh: isMobile ? 48 : 56,
        maxHeightPx: isMobile ? 600 : 680,
        minHeightPx: isMobile ? 400 : 480
      };
    }
    return {
      minScale: isMobile ? 0.8 : 0.8,
      maxScale: isMobile ? 1.1 : 1.2,
      targetHeightVh: isMobile ? 44 : 52,
      maxHeightPx: isMobile ? 520 : 620,
      minHeightPx: isMobile ? 360 : 440
    };
  };
  var resultStageHeight = (() => {
    if (layout === 'strip') {
      return mobile ? 'clamp(420px, 52vh, 600px)' : 'clamp(520px, 58vh, 700px)';
    }
    if (layout === 'trip') {
      return mobile ? 'clamp(400px, 48vh, 560px)' : 'clamp(500px, 54vh, 660px)';
    }
    return mobile ? 'clamp(360px, 44vh, 500px)' : 'clamp(440px, 48vh, 600px)';
  })();
  var shotsForFrame = shots;
  var freeStickers = stickers.filter(s => s.frameSlot == null);
  var slottedMap = {};
  stickers.filter(s => s.frameSlot != null).forEach(s => {
    if (!slottedMap[s.frameSlot]) slottedMap[s.frameSlot] = [];
    slottedMap[s.frameSlot].push(s);
  });
  var compositionCanvasRef = React.useRef(null);
  var [resultPreviewSrc, setResultPreviewSrc] = React.useState(null);
  var [resultPreviewStatus, setResultPreviewStatus] = React.useState('idle'); // idle | building | ready | error
  var [resultPreviewError, setResultPreviewError] = React.useState('');
  var [qrShareOpen, setQrShareOpen] = React.useState(false);
  var [qrShareUrl, setQrShareUrl] = React.useState(null);
  var [qrShareError, setQrShareError] = React.useState(null);
  var [qrDataUrl, setQrDataUrl] = React.useState(null);
  var qrCanvasRef = React.useRef(null);
  var [qrBusy, setQrBusy] = React.useState(false);
  async function renderFinalResultBlob() {
    var resolveTpl = l => {
      if (typeof window !== 'undefined' && typeof window.getFrameTemplateSafe === 'function') return window.getFrameTemplateSafe(l);
      if (typeof window !== 'undefined' && typeof window.getFrameTemplate === 'function') return window.getFrameTemplate(l);
      return null;
    };
    var template = resolveTpl(layout);
    if (!template) throw new Error('Frame template unavailable');
    var renderComp = window.renderComposition || (typeof renderComposition === 'function' ? renderComposition : null);
    if (!renderComp) throw new Error('renderComposition function missing');
    if (!shots || shots.length === 0) throw new Error('No shots available');
    var canvas = document.createElement('canvas');
    canvas.width = template.canvasSize.width;
    canvas.height = template.canvasSize.height;
    var ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get context');
    var data = {
      layout,
      shots,
      selected,
      filter,
      frameColor,
      stickers,
      drawStrokes,
      logo,
      dateText,
      accent,
      orientation
    };
    await renderComp(ctx, data, {
      scale: 1
    });
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);else reject(new Error('Canvas toBlob failed'));
      }, 'image/png', 1);
    });
  }
  var buildFinalResultAsset = async () => {
    if (resultPreviewStatus === 'building') return;
    setResultPreviewStatus('building');
    setResultPreviewError('');
    try {
      // 1. Generate high-quality blob using direct offscreen render
      var blob = await renderFinalResultBlob();
      if (!blob) throw new Error('결과물을 생성하지 못했습니다');

      // 2. Create local URL for preview <img>
      var url = URL.createObjectURL(blob);

      // Explicit Owner Cleanup: Revoke previous preview URL before setting new one
      revokeBlobUrl(resultPreviewUrlRef.current);
      resultPreviewUrlRef.current = url;
      setResultPreviewSrc(url);
      setResultPreviewStatus('ready');

      // 3. Cache it for save/share to ensure 100% consistency
      exportBlobRef.current = {
        key: getExportKey(),
        blob
      };

      // 4. Register with ResultAssetStore (Phase 3.64)
      try {
        var Store = window.IMMMResultAssetStore;
        if (Store) {
          var current = window.__IMMM_RESULT_ASSET_STORE__ || Store.createResultAssetStoreState();
          var record = Store.createResultAssetRecord({
            sessionId: window.__IMMM_SESSION_ID__ || 'session_result',
            kind: 'image',
            status: 'local-ready',
            objectUrl: url,
            blobId: null,
            remoteUrl: null,
            width: 0,
            height: 0,
            mimeType: 'image/png',
            metadata: {
              source: 'result-generation',
              label: 'final-result',
              layout,
              frameColor,
              filter
            }
          });
          var next = Store.addResultAssetRecord(current, record);
          window.__IMMM_RESULT_ASSET_STORE__ = next;
          setResultAssetRecord(record);
        }
      } catch (e) {
        console.debug('[IMMM] ResultAssetStore registration failed:', e);
      }

      // 5. Start intro only after asset is ready
      setShowPrintIntro(true);
    } catch (err) {
      console.error('[IMMM] buildFinalResultAsset error:', err);
      setResultPreviewStatus('error');
      setResultPreviewError(err.message || '이미지를 준비하지 못했습니다');
    }
  };
  React.useEffect(() => {
    buildFinalResultAsset();
  }, [layout, shots, selected, filter, frameColor, stickers, drawStrokes, logo, dateText, accent, orientation]);

  // Consolidated Cleanup: ResultV2 unmount cleanup for preview and save sheet
  var cleanupResultRuntime = React.useCallback(() => {
    revokeBlobUrl(resultPreviewUrlRef.current);
    revokeBlobUrl(saveSheetUrlRef.current);
    resultPreviewUrlRef.current = null;
    saveSheetUrlRef.current = null;
    exportBlobRef.current = {
      key: null,
      blob: null
    };
    setResultPreviewSrc(null);
    setResultPreviewStatus('idle');
    setResultPreviewError('');
    setSaveSheetUrl(null);
    setLocalSaveState(null);
    setShowMoreActions(false);
    setToasts([]);
    setShowPrintIntro(false);
    setResultAssetRecord(null);
    setQrShareOpen(false);
    setQrShareUrl(null);
    setQrShareError(null);
    setQrDataUrl(null);
    setQrBusy(false);
    setRecordingVideo(false);

    // Deep cleanup for session isolation
    if (window.IMMMResultAssetStore) {
      window.IMMMResultAssetStore.clearTemporaryBlobs?.();
    }
  }, [activeSessionId]);
  React.useEffect(() => {
    cleanupResultRuntime();
    return cleanupResultRuntime;
  }, [activeSessionId]);

  // Debug Runtime Readiness Publishing (Phase 3.63)
  React.useEffect(() => {
    if (!window.IMMM_DEBUG_SESSION) return;
    try {
      // Publish share readiness status
      var publishShare = window.publishDebugShareReadiness;
      if (typeof publishShare === 'function') {
        publishShare({
          shareState: {
            status: 'local-ready'
          },
          resultAsset: {
            status: 'local-ready',
            objectUrl: resultPreviewUrlRef.current || null,
            remoteUrl: null
          }
        });
      }

      // Publish motion readiness status
      var publishMotion = window.publishDebugMotionReadiness;
      if (typeof publishMotion === 'function') {
        publishMotion({
          layout,
          selected,
          renderRecipe: null
        });
      }

      // Publish edit recipe snapshot
      var createEditRecipe = window.createDebugEditRecipeSnapshot;
      if (typeof createEditRecipe === 'function') {
        createEditRecipe({
          blur: 0,
          filterId: filter,
          intensity: 1
        });
      }
    } catch (e) {
      console.debug('[IMMM] Debug readiness publishing error:', e);
    }
  }, [layout, selected, filter]);

  // Debug Result Entry Snapshot (Phase 3.63)
  React.useEffect(() => {
    if (!window.IMMM_DEBUG_SESSION) return;
    var publishSnapshot = window.publishDebugSessionSnapshot;
    if (typeof publishSnapshot !== 'function') return;
    try {
      publishSnapshot('result-entry', {
        shots,
        selected,
        appState: {
          layout,
          frameTheme: 'default',
          frameTemplateId: `frame_${layout}`,
          stickers,
          drawings: drawStrokes,
          textLayers: [],
          filterId: filter,
          filter,
          intensity: 1,
          blur: 0,
          crop: null
        },
        metadata: {
          route: 'result',
          source: 'runtime-debug'
        }
      });
    } catch (e) {
      console.debug('[IMMM] Result entry snapshot error:', e);
    }
  }, []); // Run once on mount

  var resultFrame = scale => /*#__PURE__*/React.createElement("div", {
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      position: 'relative',
      transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: captureRef,
    style: {
      position: 'relative',
      display: 'inline-block'
    }
  }, resultPreviewSrc ? /*#__PURE__*/React.createElement("img", {
    src: resultPreviewSrc,
    style: {
      width: getResultPreviewBaseWidth(layout, mobile),
      height: 'auto',
      display: 'block',
      boxShadow: '0 30px 70px rgba(0,0,0,0.2)',
      borderRadius: 4
    },
    alt: "Result Preview"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: getResultPreviewBaseWidth(layout, mobile),
      aspectRatio: layout === 'strip' || layout === 'trip' ? '1/4' : '4/5',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: 4
    }
  }), resultPreviewStatus === 'building' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 12,
      color: '#777',
      borderRadius: 4,
      zIndex: 10
    }
  }, "Preparing your strip..."), resultPreviewStatus === 'error' && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: 4,
      textAlign: 'center',
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: T.pinkDeep,
      marginBottom: 8
    }
  }, resultPreviewError), /*#__PURE__*/React.createElement("button", {
    onClick: buildFinalResultAsset,
    style: {
      padding: '6px 12px',
      borderRadius: 8,
      border: 'none',
      background: T.ink,
      color: T.bg,
      fontSize: 11,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Retry"))));
  var containerRef = React.useRef(null);
  var frameRef = React.useRef(null);
  var captureRef = React.useRef(null);
  var [autoScale, setAutoScale] = React.useState(mobile ? 1.0 : 1.3);
  var [downloading, setDownloading] = React.useState(false);
  var [sharing, setSharing] = React.useState(false);
  var [saveSheetUrl, setSaveSheetUrl] = React.useState(null);
  var resultPreviewUrlRef = React.useRef(null);
  var saveSheetUrlRef = React.useRef(null);
  var [showMoreActions, setShowMoreActions] = React.useState(false);
  var [toasts, setToasts] = React.useState([]);
  var [showPrintIntro, setShowPrintIntro] = React.useState(false);
  var autoSavedRef = React.useRef(false);
  var [resultAssetRecord, setResultAssetRecord] = React.useState(null);
  var [localSaveState, setLocalSaveState] = React.useState(null);
  var revokeSaveSheetUrl = () => {
    revokeBlobUrl(saveSheetUrlRef.current);
    saveSheetUrlRef.current = null;
    setSaveSheetUrl(null);
  };
  React.useEffect(() => {
    if (!showPrintIntro) return;
    var prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duration = prefersReducedMotion ? 750 : 2300;
    var timer = setTimeout(() => setShowPrintIntro(false), duration);
    return () => clearTimeout(timer);
  }, [showPrintIntro]);
  var addToast = (msg, duration = 2500) => {
    var id = Date.now();
    setToasts(p => [...p, {
      id,
      msg
    }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  };
  var getFormattedFilename = () => {
    var now = new Date();
    var YYYY = now.getFullYear();
    var MM = String(now.getMonth() + 1).padStart(2, '0');
    var DD = String(now.getDate()).padStart(2, '0');
    var HH = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    return `IMMM_${YYYY}-${MM}-${DD}_${HH}${mm}.png`;
  };
  var exportBlobRef = React.useRef({
    key: null,
    blob: null
  });
  var isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  var saveResultToGallery = async (blob, source = 'local', shareInfo = null) => {
    if (!blob || typeof LocalGalleryStore === 'undefined') return;
    try {
      var stableId = ['immm', layout, selected.map(i => shots[i]?.ts || i).join('-'), stickers.length, drawStrokes.length].join('_');
      await LocalGalleryStore.putPhoto({
        id: stableId,
        createdAt: Date.now(),
        source,
        blob,
        layout,
        frameType: (() => {
          var getTpl = window.getFrameTemplateSafe || window.getFrameTemplate || (typeof getFrameTemplate === 'function' ? getFrameTemplate : null);
          return getTpl ? getTpl(layout).type : layout;
        })(),
        filter,
        shareInfo,
        metadata: {
          selected,
          stickerCount: stickers.length,
          drawCount: drawStrokes.length
        }
      });
    } catch (e) {
      console.warn('[IMMM] Local gallery save failed:', e);
    }
  };
  var getExportKey = () => [activeSessionId, layout, frameColor, logo ? 'logo' : 'nologo', dateText ? 'date' : 'nodate', selected.map(i => shots[i]?.ts || shots[i]?.dataUrl?.slice(0, 32) || i).join('-'), stickers.map(s => `${s.id}:${s.x}:${s.y}:${s.scale}:${s.rotation}:${s.frameSlot ?? 'free'}`).join('|'), drawStrokes.length].join('::');
  var drawCover = (ctx, img, x, y, w, h) => {
    var ar = img.width / img.height;
    var dar = w / h;
    var sx, sy, sw, sh;
    if (ar > dar) {
      sh = img.height;
      sw = sh * dar;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / dar;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };
  var drawStickerToCanvas = async (ctx, s, baseW, baseH, S) => {
    ctx.save();
    var cx = s.x / 100 * baseW;
    var cy = s.y / 100 * baseH;
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation || 0) * Math.PI / 180);
    ctx.scale(s.scale || 1, s.scale || 1);
    if (s.kind === 'preset') {
      var item = typeof getStickerByLibId === 'function' ? getStickerByLibId(s.payload.libId) : null;
      if (item) {
        if (item.type === 'burst') {
          var w = (item.w || 90) * S,
            h = (item.h || 70) * S;
          var fs = (item.fs || 11) * S;
          var rO = Math.min(w, h) / 2 - 2 * S,
            rI = rO * 0.74;
          var N = 14;
          ctx.beginPath();
          for (var i = 0; i < N * 2; i++) {
            var r = i % 2 === 0 ? rO : rI;
            var a = i / (N * 2) * Math.PI * 2 - Math.PI / 2;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = item.tc;
          ctx.font = `900 ${fs}px Pretendard, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, fs * 0.1);
        } else if (item.type === 'cloud') {
          var _w = (item.w || 100) * S,
            _h = (item.h || 60) * S;
          var _fs = (item.fs || 11) * S;
          ctx.beginPath();
          // Simplified cloud path for canvas
          ctx.ellipse(0, 0, _w / 2, _h / 2, 0, 0, Math.PI * 2);
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = item.tc;
          ctx.font = `800 ${_fs}px Pretendard, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, 0);
        } else if (item.type === 'mini') {
          var sz = 44 * S;
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 2 * S;
          if (item.kind === 'heart') {
            ctx.beginPath();
            ctx.moveTo(0, sz * 0.3);
            ctx.bezierCurveTo(-sz * 0.4, -sz * 0.2, -sz * 0.4, -sz * 0.7, 0, -sz * 0.4);
            ctx.bezierCurveTo(sz * 0.4, -sz * 0.7, sz * 0.4, -sz * 0.2, 0, sz * 0.3);
            ctx.fill();
            ctx.stroke();
          } else if (item.kind === 'star') {
            ctx.beginPath();
            for (var _i = 0; _i < 10; _i++) {
              var _r = _i % 2 === 0 ? sz * 0.5 : sz * 0.25;
              var _a = _i / 10 * Math.PI * 2 - Math.PI / 2;
              ctx.lineTo(Math.cos(_a) * _r, Math.sin(_a) * _r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (item.kind === 'dot') {
            ctx.beginPath();
            ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2);
            ctx.fill();
          } else if (item.kind === 'sparkle') {
            ctx.beginPath();
            ctx.moveTo(0, -sz / 2);
            ctx.lineTo(0, sz / 2);
            ctx.moveTo(-sz / 2, 0);
            ctx.lineTo(sz / 2, 0);
            ctx.stroke();
          }
        } else if (item.type === 'text') {
          var _fs2 = item.size * S;
          ctx.fillStyle = item.color;
          ctx.font = `${_fs2}px Caveat, cursive`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, 0, 0);
        }
      }
    } else if (s.kind === 'upload') {
      var img = await new Promise(res => {
        var i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = s.payload.dataUrl;
      });
      if (img) {
        var _w2 = 120 * S;
        ctx.drawImage(img, -_w2 / 2, -(_w2 / (img.width / img.height)) / 2, _w2, _w2 / (img.width / img.height));
      }
    } else if (s.kind === 'text') {
      var _fs3 = s.payload.size * S;
      ctx.fillStyle = s.payload.color;
      ctx.font = `600 ${_fs3}px Pretendard, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.payload.text, 0, 0);
    } else if (s.kind === 'setlog') {
      var {
        time,
        caption,
        theme
      } = s.payload;
      var fg = theme === 'white' ? '#fff' : '#000';
      var shadow = theme === 'white' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
      ctx.shadowColor = shadow;
      ctx.shadowBlur = 4 * S;
      ctx.fillStyle = fg;
      ctx.font = `800 ${28 * S}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(time, 0, 0);
      if (caption) {
        ctx.font = `600 ${12 * S}px Pretendard, sans-serif`;
        ctx.globalAlpha = 0.8;
        ctx.fillText(caption, 0, 32 * S);
      }
    }
    ctx.restore();
  };
  var getFinalResultBlob = async () => {
    var key = getExportKey();
    if (exportBlobRef.current?.key === key && exportBlobRef.current?.blob) {
      return exportBlobRef.current.blob;
    }
    var blob = await renderFinalResultBlob();
    exportBlobRef.current = {
      key,
      blob
    };
    return blob;
  };
  var persistResultAssetLocally = async (assetRecord, blob) => {
    if (!assetRecord || !blob) return;
    var Store = window.IMMMResultAssetStore;
    if (!Store || typeof Store.saveResultAssetRecordToDb !== 'function') {
      console.warn('[IMMM] ResultAssetStore persistence not available');
      return;
    }
    try {
      setLocalSaveState({
        status: 'saving',
        message: '로컬 저장 중...'
      });
      var blobId = `blob-${assetRecord.assetRecordId}`;
      await Store.saveResultAssetRecordToDb(assetRecord);
      await Store.saveResultAssetBlobToDb(blobId, blob);
      setLocalSaveState({
        status: 'saved',
        message: '로컬 저장 완료',
        assetRecordId: assetRecord.assetRecordId
      });
      setResultAssetRecord({
        ...assetRecord,
        blobId,
        localSaved: true,
        localSavedAt: new Date().toISOString()
      });
      addToast('사진이 갤러리에 저장되었어요');
    } catch (e) {
      console.error('[IMMM] Local persistence failed:', e);
      setLocalSaveState({
        status: 'error',
        message: '저장 실패',
        error: e.message
      });
      addToast('로컬 저장에 실패했어요');
    }
  };
  React.useEffect(() => {
    if (autoSavedRef.current) return;
    autoSavedRef.current = true;
    var selectedShots = selected.map(i => shots[i]?.ts || shots[i]?.dataUrl?.slice(0, 28) || i).join('|');
    var key = `immm.gallery.autosaved.${layout}.${selectedShots}.${stickers.length}.${drawStrokes.length}`;
    if (localStorage.getItem(key)) return;
    var cancelled = false;
    var timer = setTimeout(async () => {
      try {
        var blob = await getFinalResultBlob();
        if (!cancelled && blob) {
          await saveResultToGallery(blob, 'local');
          localStorage.setItem(key, '1');
        }
      } catch (e) {
        console.warn('[IMMM] Auto gallery save failed:', e);
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  var triggerDownload = (blob, fname) => {
    var url = URL.createObjectURL(blob);
    if (isIOS()) {
      // Explicit Owner Cleanup for iOS save sheet
      revokeBlobUrl(saveSheetUrlRef.current);
      saveSheetUrlRef.current = url;
      setSaveSheetUrl(url);
      addToast('이미지를 길게 눌러 저장하세요');
      return;
    }
    var a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast('저장 완료');
    if (typeof confetti !== 'undefined') confetti({
      particleCount: 90,
      spread: 65,
      origin: {
        y: 0.55
      },
      colors: ['#D98893', '#F4C4C8', '#FDE8EA', '#fff', '#FAD4D8']
    });
    setTimeout(() => {
      revokeBlobUrl(url);
    }, 15000);
  };
  var handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      var blob = await getFinalResultBlob();
      var fname = getFormattedFilename();
      await saveResultToGallery(blob, 'local');
      triggerDownload(blob, fname);
    } catch (e) {
      console.error(e);
      addToast('저장에 실패했어요');
    } finally {
      setDownloading(false);
    }
  };
  var handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      var blob = await getFinalResultBlob();
      var fname = getFormattedFilename();
      var file = new File([blob], fname, {
        type: 'image/png'
      });
      await saveResultToGallery(blob, 'local');
      if (navigator.share && navigator.canShare && navigator.canShare({
        files: [file]
      })) {
        addToast('공유 준비 완료');
        await navigator.share({
          files: [file],
          title: 'IMMM · Photobooth',
          text: '한 장에 담는 순간들. 나만의 포토부스 IMMM.'
        });
      } else {
        addToast('공유 미지원 → 저장으로 대체');
        triggerDownload(blob, fname);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error('Share failed:', e);
        addToast('공유에 실패했어요');
      }
    } finally {
      setSharing(false);
    }
  };
  var getQrShareState = () => {
    var Adapter = window.IMMMCloudShareAdapter;
    if (!Adapter) return {
      ready: false,
      reason: 'adapter-missing',
      label: 'Cloud setup required'
    };
    var config = Adapter.getRuntimeCloudShareConfig();
    if (!config?.enabled) return {
      ready: false,
      reason: 'config-disabled',
      label: 'Cloud setup required'
    };
    var readiness = Adapter.createCloudShareReadiness(config);
    if (!readiness.ok) return {
      ready: false,
      reason: 'config-incomplete',
      label: 'Cloud setup required'
    };
    if (qrBusy) return {
      ready: false,
      reason: 'busy',
      label: 'Creating QR...'
    };
    if (qrShareUrl) return {
      ready: true,
      reason: 'ready',
      label: 'QR Ready'
    };
    return {
      ready: true,
      reason: 'idle',
      label: 'Create QR'
    };
  };
  var handleCreateQrShare = async () => {
    var state = getQrShareState();
    if (!state.ready) return;
    if (qrBusy) return;
    setQrBusy(true);
    setQrShareError(null);
    try {
      var blob = await getFinalResultBlob();
      if (!blob) throw Object.assign(new Error('No blob available'), {
        reason: 'qr-render-failed'
      });
      var Adapter = window.IMMMCloudShareAdapter;
      if (!Adapter) throw Object.assign(new Error('CloudShareAdapter not available'), {
        reason: 'cloud-config-missing'
      });
      var cloudShareResult = await Adapter.uploadResultAsset({
        blob,
        filename: getFormattedFilename(),
        sessionId: activeSessionId || window.__IMMM_SESSION_ID__ || 'session_result',
        assetRecordId: resultAssetRecord?.id || null,
        metadata: {
          layout,
          filter,
          frameColor,
          source: 'qr-share-v1'
        }
      });
      if (!cloudShareResult.ok) {
        throw Object.assign(new Error(cloudShareResult.error || 'Upload failed'), {
          reason: 'upload-failed'
        });
      }
      var QRCode = typeof window !== 'undefined' ? window.QRCode : null;
      if (!QRCode && cloudShareResult.remoteUrl) {
        throw Object.assign(new Error('QRCode library missing'), {
          reason: 'qr-library-missing'
        });
      }
      var dataUrl = null;
      if (QRCode && cloudShareResult.remoteUrl) {
        try {
          dataUrl = await QRCode.toDataURL(cloudShareResult.remoteUrl, {
            width: 512,
            margin: 1,
            color: {
              dark: '#111111',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
          });
        } catch (e) {
          throw Object.assign(e, {
            reason: 'qr-render-failed'
          });
        }
      }
      setQrDataUrl(dataUrl);
      setQrShareUrl(cloudShareResult.remoteUrl);
      setQrShareOpen(true);
      addToast('QR 링크가 생성되었습니다');
    } catch (e) {
      console.error('QR Share failed:', e);
      var reason = e.reason || 'network-failed';
      setQrShareError({
        message: e.message || 'QR 생성에 실패했습니다',
        reason
      });
      var isFieldTest = window.IMMM_FIELD_TEST === true || new URLSearchParams(window.location.search).has('fieldTest');
      addToast(`QR 공유에 실패했습니다${isFieldTest ? ` [${reason}]` : ''}`);
    } finally {
      setQrBusy(false);
    }
  };
  var [recordingVideo, setRecordingVideo] = React.useState(false);
  var handleSaveVideo = async () => {
    if (recordingVideo) return;
    var Motion = window.IMMMMotionExportContract;
    if (!Motion || !Motion.isSupported()) {
      addToast('이 브라우저에서는 비디오 저장을 지원하지 않습니다');
      return;
    }
    setRecordingVideo(true);
    addToast('비디오를 제작하는 중...');
    try {
      var canvas = document.createElement('canvas');
      var template = window.getFrameTemplateSafe(layout);
      canvas.width = template.canvasSize.width / 2;
      canvas.height = template.canvasSize.height / 2;
      var ctx = canvas.getContext('2d');
      var renderComp = window.renderComposition;
      var data = {
        layout,
        shots,
        selected,
        filter,
        frameColor,
        stickers,
        drawStrokes,
        logo,
        dateText,
        accent,
        orientation
      };
      var stopped = false;
      var start = Date.now();
      var anim = async () => {
        if (stopped) return;
        var p = Math.min(1, (Date.now() - start) / 3000);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await renderComp(ctx, data, {
          scale: 0.5,
          motionProgress: p
        });
        requestAnimationFrame(anim);
      };
      anim();
      var blob = await Motion.recordCanvas(canvas, 3000);
      stopped = true;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = getFormattedFilename().replace('.png', '.webm');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => revokeBlobUrl(url), 10000);
      addToast('비디오 저장 완료');
    } catch (e) {
      console.error('Video Export failed:', e);
      var reason = e.reason || 'render-failed';
      var isFieldTest = window.IMMM_FIELD_TEST === true || new URLSearchParams(window.location.search).has('fieldTest');
      addToast(`Video export failed. Image save is still available.${isFieldTest ? ` [${reason}]` : ''}`);
    } finally {
      setRecordingVideo(false);
    }
  };
  var videoSupported = window.IMMMMotionExportContract?.isSupported() || false;
  React.useEffect(() => {
    var compute = () => {
      if (!containerRef.current || !frameRef.current) return;
      var fit = getResultPreviewFit(layout, mobile);
      var cW = containerRef.current.clientWidth - fit.padding;
      var cH = containerRef.current.clientHeight - fit.padding;
      var fW = frameRef.current.scrollWidth;
      var fH = frameRef.current.scrollHeight;
      if (!fW || !fH) return;

      // Consider target height if available
      var vhTarget = window.innerHeight * (fit.targetHeightVh || 40) / 100;
      var targetScale = fit.maxHeightPx ? Math.min(fit.maxScale, fit.maxHeightPx / fH) : fit.maxScale;
      var rawScale = Math.min(targetScale, cW / fW, cH / fH, vhTarget / fH);
      var fitRule = getResultDisplayFit(layout, mobile);
      var nextScale = rawScale;
      if (layout === 'strip' || layout === 'trip') {
        var safeMaxByWidth = cW / fW;
        var safeMaxByHeight = cH / fH;
        var safeMax = Math.min(fitRule.maxScale, safeMaxByWidth, safeMaxByHeight);
        nextScale = Math.max(rawScale, Math.min(fitRule.minScale, safeMax));
      }
      setAutoScale(Math.max(0.1, nextScale));
    };
    compute();
    var ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [layout, mobile]);

  // Local persistence: automatically persist result asset after build completes
  React.useEffect(() => {
    if (!resultAssetRecord || resultAssetRecord.localSaved) return;
    var persistAsync = async () => {
      try {
        var blob = await getFinalResultBlob();
        if (blob) {
          await persistResultAssetLocally(resultAssetRecord, blob);
        }
      } catch (e) {
        console.debug('[IMMM] Automatic local persistence skipped:', e);
      }
    };
    var timer = setTimeout(persistAsync, 500);
    return () => clearTimeout(timer);
  }, [resultAssetRecord?.assetRecordId]);
  var resultOverlays = /*#__PURE__*/React.createElement(React.Fragment, null, saveSheetUrl && /*#__PURE__*/React.createElement("div", {
    onClick: revokeSaveSheetUrl,
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
      width: 'min(92vw,420px)',
      background: '#fff',
      borderRadius: 20,
      padding: 18,
      textAlign: 'center',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: saveSheetUrl,
    style: {
      width: '100%',
      maxHeight: '60vh',
      objectFit: 'contain',
      borderRadius: 12,
      background: '#f4f4f4'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 15,
      fontWeight: 800,
      color: '#111',
      fontFamily: 'Pretendard,system-ui'
    }
  }, "\uC774\uBBF8\uC9C0\uB97C \uAE38\uAC8C \uB20C\uB7EC \uC800\uC7A5\uD558\uC138\uC694"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 12,
      color: '#777',
      lineHeight: 1.4,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "iPhone Safari/PWA\uC5D0\uC11C\uB294 \uB2E4\uC6B4\uB85C\uB4DC \uBC84\uD2BC\uBCF4\uB2E4 \uACF5\uC720 \uB610\uB294 \uAE38\uAC8C \uB20C\uB7EC \uC800\uC7A5\uC774 \uC548\uC815\uC801\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("button", {
    onClick: revokeSaveSheetUrl,
    style: {
      marginTop: 14,
      width: '100%',
      padding: '13px 16px',
      borderRadius: 12,
      border: 'none',
      background: '#111',
      color: '#fff',
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "Close"))), qrShareOpen && /*#__PURE__*/React.createElement("div", {
    onClick: () => setQrShareOpen(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 99998,
      background: 'rgba(10,10,10,0.78)',
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
      borderRadius: 20,
      padding: 20,
      textAlign: 'center',
      boxShadow: '0 24px 80px rgba(0,0,0,0.35)'
    }
  }, qrDataUrl ? /*#__PURE__*/React.createElement("img", {
    src: qrDataUrl,
    style: {
      width: 220,
      height: 220,
      imageRendering: 'auto'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220,
      height: 220,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f3f3',
      borderRadius: 12,
      fontSize: 12,
      color: '#777',
      wordBreak: 'break-all',
      padding: 14
    }
  }, qrShareUrl), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: 900,
      color: '#111',
      fontFamily: 'Pretendard,system-ui'
    }
  }, "QR \uACF5\uC720 \uC900\uBE44 \uC644\uB8CC"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 12,
      color: '#777',
      lineHeight: 1.45,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "7\uC77C \uB3D9\uC548 \uC5F4 \uC218 \uC788\uB294 \uACF5\uC720 \uB9C1\uD06C\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        await navigator.clipboard.writeText(qrShareUrl);
        addToast('Link copied!');
      } catch (_) {}
    },
    style: {
      marginTop: 14,
      width: '100%',
      padding: '13px 16px',
      borderRadius: 12,
      border: 'none',
      background: '#111',
      color: '#fff',
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "Copy Link"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setQrShareOpen(false),
    style: {
      marginTop: 8,
      width: '100%',
      padding: '12px 16px',
      borderRadius: 12,
      border: 'none',
      background: '#f1f1f1',
      color: '#111',
      fontWeight: 800,
      cursor: 'pointer'
    }
  }, "Close"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: mobile ? 'calc(var(--sab) + 120px)' : 100,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100000,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none'
    }
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    style: {
      padding: '10px 20px',
      borderRadius: 999,
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
    }
  }, t.msg))));
  if (showPrintIntro) {
    return /*#__PURE__*/React.createElement(ResultPrintIntro, {
      T: T,
      mobile: mobile,
      layout: layout,
      previewSrc: resultPreviewSrc
    });
  }
  if (mobile) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column'
      }
    }, resultOverlays, /*#__PURE__*/React.createElement("div", {
      style: {
        flexShrink: 0,
        paddingTop: 'calc(var(--sat) + 12px)',
        background: T.bg,
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px 12px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => go('deco'),
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: T.ink,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 0'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M10 2L4 8l6 6"
    })), "Back"), /*#__PURE__*/React.createElement(StepDots, {
      step: 4,
      T: T
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => go('landing'),
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: T.inkSoft,
        fontSize: 11,
        fontFamily: 'Pretendard,system-ui',
        letterSpacing: 0.5
      }
    }, "New"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '20px 18px 6px',
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("h1", {
      style: {
        margin: 0,
        fontFamily: '"Plus Jakarta Sans",system-ui',
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: -1
      }
    }, "Your ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'Caveat,cursive',
        color: T.pinkDeep,
        fontSize: 36
      }
    }, "moment"), " is ready."), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 4,
        color: T.inkSoft,
        fontSize: 13,
        fontFamily: 'Pretendard,system-ui'
      }
    }, "Download it, share it, make it Mine.")), /*#__PURE__*/React.createElement("div", {
      ref: containerRef,
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 18px',
        minHeight: resultStageMinHeight
      }
    }, /*#__PURE__*/React.createElement("div", {
      ref: frameRef,
      style: {
        display: 'inline-block',
        animation: 'polaroidReveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both'
      }
    }, resultFrame(1))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 18px',
        paddingBottom: 'calc(var(--sab) + 24px)',
        position: 'relative'
      }
    }, localSaveState && /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12,
        padding: '10px 12px',
        borderRadius: 12,
        background: localSaveState.status === 'error' ? '#FDE8EA' : '#f0f0f0',
        fontSize: 12,
        color: localSaveState.status === 'error' ? T.pinkDeep : '#666',
        textAlign: 'center',
        fontWeight: 500
      }
    }, localSaveState.message), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement(BtnPrimary, {
      T: T,
      size: "lg",
      onClick: handleDownload,
      style: {
        flex: 1,
        height: 52,
        opacity: downloading ? 0.6 : 1
      }
    }, downloading ? 'Saving...' : 'Save · 저장'), /*#__PURE__*/React.createElement("button", {
      onClick: handleShare,
      style: {
        width: 52,
        height: 52,
        borderRadius: 14,
        border: `1.5px solid ${T.line}`,
        background: 'transparent',
        color: T.ink,
        cursor: sharing ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: sharing ? 0.6 : 1
      }
    }, sharing ? /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 18 18"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "9",
      r: "7",
      stroke: "currentColor",
      strokeWidth: "2",
      fill: "none",
      strokeDasharray: "22 22",
      style: {
        animation: 'spin 0.8s linear infinite'
      }
    })) : I.share(20, T.ink)), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setShowMoreActions(!showMoreActions),
      style: {
        width: 52,
        height: 52,
        borderRadius: 14,
        border: `1.5px solid ${T.line}`,
        background: showMoreActions ? T.line : 'transparent',
        color: T.ink,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.2",
      strokeLinecap: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 12h.01M12 5h.01M12 19h.01"
    }))), showMoreActions && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onClick: () => setShowMoreActions(false),
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'transparent'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        right: 0,
        width: 196,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        padding: '8px',
        zIndex: 10000,
        animation: 'popIn 0.2s ease-out'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowMoreActions(false);
        go('deco');
      },
      style: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        color: T.ink,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, "Redecorate"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowMoreActions(false);
        go('setup');
      },
      style: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        color: T.ink,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, "Retake"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowMoreActions(false);
        resetSessionState?.('new-session');
        go('landing');
      },
      style: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        color: T.ink,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer'
      }
    }, "New Session"), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 1,
        background: T.line,
        margin: '6px 12px'
      }
    }), (() => {
      var qrState = getQrShareState();
      return /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          setShowMoreActions(false);
          if (qrState.ready) handleCreateQrShare();
        },
        disabled: !qrState.ready,
        style: {
          width: '100%',
          padding: '14px 16px',
          borderRadius: 14,
          border: 'none',
          background: 'transparent',
          textAlign: 'left',
          color: qrState.ready ? T.ink : T.inkSoft,
          fontSize: 14,
          fontWeight: qrState.ready ? 600 : 500,
          cursor: qrState.ready ? 'pointer' : 'not-allowed',
          opacity: qrState.ready ? 1 : 0.6
        }
      }, "QR Share ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          opacity: 0.6
        }
      }, "(", qrState.label, ")"));
    })(), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowMoreActions(false);
        handleSaveVideo();
      },
      disabled: !videoSupported || recordingVideo,
      style: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        color: videoSupported ? T.ink : T.inkSoft,
        fontSize: 14,
        fontWeight: 600,
        cursor: videoSupported ? 'pointer' : 'not-allowed',
        opacity: videoSupported ? 1 : 0.6
      }
    }, "Save Video ", !videoSupported && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        opacity: 0.6
      }
    }, "(Unsupported)")))))))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      minHeight: '100dvh',
      background: T.bg,
      display: 'grid',
      gridTemplateRows: 'auto auto auto auto',
      alignContent: 'start',
      rowGap: 0,
      padding: '8px 56px 6px'
    }
  }, resultOverlays, /*#__PURE__*/React.createElement(TopBar, {
    step: 4,
    back: () => go('deco'),
    T: T,
    mobile: false,
    title: "Step 5 \xB7 Your strip",
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => go('landing'),
      style: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: T.inkSoft,
        fontSize: 12,
        fontFamily: 'Pretendard,system-ui'
      }
    }, "New session")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 2
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: '"Plus Jakarta Sans",system-ui',
      fontSize: 40,
      fontWeight: 500,
      letterSpacing: -1.1
    }
  }, "Your ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'Caveat,cursive',
      color: T.pinkDeep,
      fontSize: 50
    }
  }, "moment"), " is ready."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 0,
      color: T.inkSoft,
      fontSize: 13,
      fontFamily: 'Pretendard,system-ui'
    }
  }, "Download it, share it, make it Mine.")), /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: 0,
      height: resultStageHeight
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: frameRef,
    style: {
      display: 'inline-block',
      animation: 'popIn 0.55s cubic-bezier(0.34,1.56,0.64,1)'
    }
  }, resultFrame(autoScale))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'center',
      marginTop: 4,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(BtnPrimary, {
    T: T,
    size: "lg",
    onClick: handleDownload,
    style: {
      width: 220,
      height: 56,
      opacity: downloading ? 0.6 : 1
    }
  }, downloading ? 'Saving image...' : 'Save image · 저장'), /*#__PURE__*/React.createElement("button", {
    onClick: handleShare,
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      border: `1.5px solid ${T.line}`,
      background: 'transparent',
      color: T.ink,
      cursor: sharing ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: sharing ? 0.6 : 1
    }
  }, sharing ? /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 18 18"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "7",
    stroke: "currentColor",
    strokeWidth: "2",
    fill: "none",
    strokeDasharray: "22 22",
    style: {
      animation: 'spin 0.8s linear infinite'
    }
  })) : I.share(24, T.ink)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowMoreActions(!showMoreActions),
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      border: `1.5px solid ${T.line}`,
      background: showMoreActions ? T.line : 'transparent',
      color: T.ink,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 12h.01M12 5h.01M12 19h.01"
  }))), showMoreActions && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: () => setShowMoreActions(false),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 'calc(100% + 12px)',
      right: 0,
      width: 200,
      background: '#fff',
      borderRadius: 20,
      boxShadow: '0 15px 50px rgba(0,0,0,0.2)',
      padding: '8px',
      zIndex: 10000,
      animation: 'popIn 0.2s ease-out'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowMoreActions(false);
      go('deco');
    },
    style: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: 14,
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      color: T.ink,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Redecorate"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowMoreActions(false);
      go('setup');
    },
    style: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: 14,
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      color: T.ink,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "Retake"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowMoreActions(false);
      resetSessionState?.('new-session');
      go('landing');
    },
    style: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: 14,
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      color: T.ink,
      fontSize: 14,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, "New Session"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: T.line,
      margin: '6px 10px'
    }
  }), (() => {
    var qrState = getQrShareState();
    return /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShowMoreActions(false);
        if (qrState.ready) handleCreateQrShare();
      },
      disabled: !qrState.ready,
      style: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        color: qrState.ready ? T.ink : T.inkSoft,
        fontSize: 14,
        fontWeight: qrState.ready ? 700 : 600,
        cursor: qrState.ready ? 'pointer' : 'not-allowed',
        opacity: qrState.ready ? 1 : 0.6
      }
    }, "QR Share ", /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        opacity: 0.6
      }
    }, "(", qrState.label, ")"));
  })(), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setShowMoreActions(false);
      handleSaveVideo();
    },
    disabled: !videoSupported || recordingVideo,
    style: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: 14,
      border: 'none',
      background: 'transparent',
      textAlign: 'left',
      color: videoSupported ? T.ink : T.inkSoft,
      fontSize: 14,
      fontWeight: 700,
      cursor: videoSupported ? 'pointer' : 'not-allowed',
      opacity: videoSupported ? 1 : 0.6
    }
  }, "Save Video ", !videoSupported && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: 0.6
    }
  }, "(Unsupported)")))))), window.IMMM_DEBUG_SESSION && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.04)',
      borderRadius: 8,
      fontSize: 10,
      color: T.inkSoft,
      fontFamily: 'Pretendard,monospace',
      textAlign: 'left',
      lineHeight: 1.4,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }
  }, "Session: ", window.__IMMM_LAST_SESSION_SNAPSHOT__ ? 'ok' : 'pending', "AssetStore: ", window.__IMMM_RESULT_ASSET_STORE__ ? `${window.__IMMM_RESULT_ASSET_STORE__.records?.length || 0}` : '0', "QR: ", window.__IMMM_LAST_SHARE_READINESS__?.qrShareReady?.ok ? 'ready' : 'not-ready', "Motion: ", window.__IMMM_LAST_MOTION_READINESS__?.isValid ? 'ready' : 'not-ready'));
}
Object.assign(window, {
  DecoV2,
  ResultV2
});