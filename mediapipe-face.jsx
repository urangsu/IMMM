// mediapipe-face.jsx — FaceLandmarker hook (MediaPipe Tasks Vision 0.10+)
// Exposes useFaceLandmarks(videoRef) → ref with face data updated ~30fps
// Falls back gracefully when MediaPipe is unavailable or no face detected.

const DEFAULT_FACE = {
  detected:       false,
  faces:          [],
  leftEyeCenter:  [0.35, 0.40],
  rightEyeCenter: [0.65, 0.40],
  eyeRadius:      0.08,
  leftCheek:      [0.28, 0.52],
  rightCheek:     [0.72, 0.52],
  cheekRadius:    0.14,
  lipCenter:      [0.50, 0.68],
  lipRadius:      0.09,
  noseTop:        [0.50, 0.50],
  noseTip:        [0.50, 0.60],
  foreheadTop:    [0.50, 0.18],
  leftJaw:        [0.20, 0.70],
  rightJaw:       [0.80, 0.70],
  chin:           [0.50, 0.88],
};

// Wait for MediaPipe classes exposed by the <script type="module"> tag
function waitForMediaPipe(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (window.MediaPipeFaceLandmarker) { resolve(); return; }
    const t = setTimeout(() => reject(new Error('MediaPipe load timeout')), timeoutMs);
    const handler = () => { clearTimeout(t); resolve(); };
    window.addEventListener('mediapipe-ready', handler, { once: true });
  });
}

function useFaceLandmarks(videoRef) {
  const dataRef      = React.useRef({ ...DEFAULT_FACE });
  const landmarkerRef = React.useRef(null);
  const readyRef     = React.useRef(false);

  // ── Init FaceLandmarker ────────────────────────────
  React.useEffect(() => {
    let destroyed = false;
    (async () => {
      try {
        await waitForMediaPipe();
        if (destroyed) return;

        const vision = await window.MediaPipeFilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        if (destroyed) return;

        const lm = await window.MediaPipeFaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 4,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        if (!destroyed) { landmarkerRef.current = lm; readyRef.current = true; }
      } catch(e) {
        console.warn('[MediaPipe] FaceLandmarker init failed:', e.message);
      }
    })();
    return () => { destroyed = true; };
  }, []);

  // ── Detection loop (~30fps via frame-skip) ─────────
  React.useEffect(() => {
    let frameCount = 0;
    let raf;

    const detect = () => {
      raf = requestAnimationFrame(detect);
      frameCount++;
      if (frameCount % 2 !== 0) return; // ~30fps

      const video     = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || !readyRef.current) return;
      if (video.readyState < 2 || video.videoWidth === 0) return;

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const faceLandmarks = (result?.faceLandmarks || []).filter(lm => lm && lm.length >= 478);
        if (!faceLandmarks.length) {
          dataRef.current = { ...dataRef.current, detected: false, faces: [] };
          return;
        }

        const faces = faceLandmarks.slice(0, 4).map((lmArr) => {
          // ── Eye centres (iris: 468=left, 473=right) ──
          const li = lmArr[468] || lmArr[159]; // left iris / fallback
          const ri = lmArr[473] || lmArr[386]; // right iris / fallback

          // ── Eye width for radius (outer to inner corner) ──
          const lo = lmArr[33], li2 = lmArr[133]; // left eye corners
          const eyeW = Math.hypot(
            (lo?.x ?? 0.30) - (li2?.x ?? 0.38),
            (lo?.y ?? 0.40) - (li2?.y ?? 0.40)
          );

          // ── Cheek landmarks ──
          const lc = lmArr[205] || lmArr[50];  // left cheek
          const rc = lmArr[425] || lmArr[280]; // right cheek

          // ── Lip landmarks — LEGACY: only used by hidden 'glam' filter (lip_color shader) ──
          const lipTop    = lmArr[13]  || lmArr[0];   // upper lip center
          const lipBot    = lmArr[14]  || lmArr[17];  // lower lip center
          const lipLeft   = lmArr[61]  || lmArr[78];  // lip left corner
          const lipRight  = lmArr[291] || lmArr[308]; // lip right corner
          const lipCenterX = ((lipTop?.x ?? 0.50) + (lipBot?.x ?? 0.50)) / 2;
          const lipCenterY = ((lipTop?.y ?? 0.68) + (lipBot?.y ?? 0.70)) / 2;
          const lipW = Math.hypot(
            (lipLeft?.x ?? 0.42) - (lipRight?.x ?? 0.58),
            (lipLeft?.y ?? 0.68) - (lipRight?.y ?? 0.68)
          );

          // ── Nose & face contour — LEGACY: only used by hidden 'glam'/'aurora' filters ──
          // (face_slim uses leftJaw/rightJaw/chin; contour uses noseTip/noseTop)
          // Not used by any currently-visible filter.
          const noseTip    = lmArr[4]   || lmArr[1];  // nose tip
          const noseTop    = lmArr[168] || lmArr[6];  // nose bridge
          const lJaw       = lmArr[234] || lmArr[93]; // left jaw
          const rJaw       = lmArr[454] || lmArr[323];// right jaw
          const chin       = lmArr[152] || lmArr[175];// chin
          const forehead   = lmArr[10]  || lmArr[151];// forehead

          return {
            leftEyeCenter:  [li?.x ?? 0.35, li?.y ?? 0.40],
            rightEyeCenter: [ri?.x ?? 0.65, ri?.y ?? 0.40],
            eyeRadius:      Math.max(0.035, eyeW * 1.3),
            leftCheek:      [lc?.x ?? 0.28, lc?.y ?? 0.55],
            rightCheek:     [rc?.x ?? 0.72, rc?.y ?? 0.55],
            cheekRadius:    Math.max(0.07, eyeW * 1.65),
            lipCenter:      [lipCenterX, lipCenterY],
            lipRadius:      Math.max(0.045, lipW * 0.65),
            noseTip:        [noseTip?.x ?? 0.50, noseTip?.y ?? 0.60],
            noseTop:        [noseTop?.x ?? 0.50, noseTop?.y ?? 0.48],
            foreheadTop:    [forehead?.x ?? 0.50, forehead?.y ?? 0.18],
            leftJaw:        [lJaw?.x ?? 0.20, lJaw?.y ?? 0.70],
            rightJaw:       [rJaw?.x ?? 0.80, rJaw?.y ?? 0.70],
            chin:           [chin?.x ?? 0.50, chin?.y ?? 0.88],
          };
        });

        const primary = faces[0];
        dataRef.current = {
          detected:       true,
          faces,
          leftEyeCenter:  primary.leftEyeCenter,
          rightEyeCenter: primary.rightEyeCenter,
          eyeRadius:      primary.eyeRadius,
          leftCheek:      primary.leftCheek,
          rightCheek:     primary.rightCheek,
          cheekRadius:    primary.cheekRadius,
          lipCenter:      primary.lipCenter,
          lipRadius:      primary.lipRadius,
          noseTip:        primary.noseTip,
          noseTop:        primary.noseTop,
          foreheadTop:    primary.foreheadTop,
          leftJaw:        primary.leftJaw,
          rightJaw:       primary.rightJaw,
          chin:           primary.chin,
        };
      } catch(_) {}
    };

    raf = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  return dataRef;
}

Object.assign(window, { useFaceLandmarks });
