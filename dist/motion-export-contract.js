// motion-export-contract.jsx — Video Export & Motion Metadata Contract

var IMMMMotionExportContract = {
  version: '1.0.0',
  // Check if browser supports video export (MediaRecorder + Canvas Stream)
  isSupported: () => {
    return typeof HTMLCanvasElement.prototype.captureStream === 'function' && typeof window.MediaRecorder === 'function';
  },
  // Get supported mime types
  getSupportedMimeTypes: () => {
    if (typeof window === 'undefined') return [];
    if (typeof window.MediaRecorder === 'undefined') return [];
    if (typeof window.MediaRecorder.isTypeSupported !== 'function') return [];
    var types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    return types.filter(t => {
      try {
        return MediaRecorder.isTypeSupported(t);
      } catch (e) {
        return false;
      }
    });
  },
  /**
   * Record a canvas for a specified duration
   */
  recordCanvas: async (canvas, durationMs = 3000) => {
    if (!canvas || typeof canvas.captureStream !== 'function') {
      var e = new Error('Canvas captureStream not supported');
      e.reason = 'unsupported-canvas-stream';
      throw e;
    }
    if (typeof window.MediaRecorder !== 'function') {
      var _e = new Error('MediaRecorder not supported');
      _e.reason = 'unsupported-mediarecorder';
      throw _e;
    }
    return new Promise((resolve, reject) => {
      var stream = null;
      var recorder = null;
      var stopped = false;
      try {
        stream = canvas.captureStream(30); // 30 FPS
        var supported = IMMMMotionExportContract.getSupportedMimeTypes();
        if (supported.length === 0) {
          var _e2 = new Error('No supported mime types');
          _e2.reason = 'unsupported-mime';
          throw _e2;
        }
        var mimeType = supported[0];
        recorder = new MediaRecorder(stream, {
          mimeType
        });
        var chunks = [];
        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        var cleanup = () => {
          if (stopped) return;
          stopped = true;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
        recorder.onstop = () => {
          cleanup();
          if (chunks.length === 0) {
            var _e3 = new Error('Recorded blob is empty');
            _e3.reason = 'recorder-empty-blob';
            reject(_e3);
            return;
          }
          var blob = new Blob(chunks, {
            type: mimeType
          });
          resolve(blob);
        };
        recorder.onerror = e => {
          cleanup();
          reject(e);
        };
        recorder.start();
        setTimeout(() => {
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
        }, durationMs);
      } catch (e) {
        if (!e.reason) e.reason = 'recorder-start-failed';
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        reject(e);
      }
    });
  },
  runMotionExportContractSelfTest: () => {
    var errors = [];
    if (!IMMMMotionExportContract.version) errors.push('Missing version');
    if (typeof IMMMMotionExportContract.isSupported !== 'function') errors.push('Missing isSupported');
    if (typeof IMMMMotionExportContract.getSupportedMimeTypes !== 'function') errors.push('Missing getSupportedMimeTypes');
    return {
      ok: errors.length === 0,
      errors
    };
  }
};
Object.assign(window, {
  IMMMMotionExportContract
});