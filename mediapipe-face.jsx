// mediapipe-face.jsx — FaceLandmarker hook (MediaPipe Tasks Vision 0.10+)
// Exposes useFaceLandmarks(videoRef) → ref with face data updated ~30fps
// Falls back gracefully when MediaPipe is unavailable or no face detected.

const DEFAULT_FACE = {
  detected:       false,
  leftEyeCenter:  [0.35, 0.40],
  rightEyeCenter: [0.65, 0.40],
  eyeRadius:      0.08,
  leftCheek:      [0.28, 0.52],
  rightCheek:     [0.72, 0.52],
  cheekRadius:    0.14,
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
          numFaces: 1,
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
        const lmArr  = result?.faceLandmarks?.[0];
        if (!lmArr || lmArr.length < 478) {
          dataRef.current = { ...dataRef.current, detected: false };
          return;
        }

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

        dataRef.current = {
          detected:       true,
          leftEyeCenter:  [li?.x ?? 0.35, li?.y ?? 0.40],
          rightEyeCenter: [ri?.x ?? 0.65, ri?.y ?? 0.40],
          eyeRadius:      Math.max(0.035, eyeW * 1.3),
          leftCheek:      [lc?.x ?? 0.28, lc?.y ?? 0.55],
          rightCheek:     [rc?.x ?? 0.72, rc?.y ?? 0.55],
          cheekRadius:    Math.max(0.10, eyeW * 1.8),
        };
      } catch(_) {}
    };

    raf = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  return dataRef;
}

Object.assign(window, { useFaceLandmarks });
