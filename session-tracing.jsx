// session-tracing.jsx — Runtime validation for Phase 3.44 session isolation
// Enable with: window.IMMM_DEBUG_SESSION = true

function createSessionTracer() {
  const isEnabled = () => typeof window !== 'undefined' && window.IMMM_DEBUG_SESSION === true;

  const trace = (label, payload) => {
    if (!isEnabled()) return;
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      label,
      ...payload,
    };

    // Store in window for inspection
    if (!window.__IMMM_SESSION_TRACE__) {
      window.__IMMM_SESSION_TRACE__ = [];
    }
    window.__IMMM_SESSION_TRACE__.push(entry);

    // Log to console with color coding
    const colors = {
      'SESSION_START': '#FF6B6B',
      'SESSION_RESET': '#FFA500',
      'SCREEN_CHANGE': '#4ECDC4',
      'STATE_UPDATE': '#95E1D3',
      'EXPORT_KEY': '#FFD93D',
      'BLOB_CLEAR': '#FF6B9D',
    };
    const color = colors[label.split(':')[0]] || '#999';
    console.log(
      `%c[IMMM SESSION TRACE] ${timestamp}`,
      `color: ${color}; font-weight: bold;`,
      label,
      payload
    );
  };

  const getTrace = () => window.__IMMM_SESSION_TRACE__ || [];

  const validateFlow = () => {
    if (!isEnabled()) return { ok: false, reason: 'tracing-disabled' };

    const trace = getTrace();
    if (trace.length === 0) return { ok: false, reason: 'no-sessions-traced' };

    // Find session boundaries
    const sessionStarts = trace.filter(e => e.label === 'SESSION_START:activeSessionId');
    const screenChanges = trace.filter(e => e.label.startsWith('SCREEN_CHANGE:'));

    return {
      ok: sessionStarts.length > 0,
      sessionCount: sessionStarts.length,
      screenTransitions: screenChanges.length,
      firstSessionId: sessionStarts[0]?.activeSessionId,
      lastSessionId: sessionStarts[sessionStarts.length - 1]?.activeSessionId,
    };
  };

  const validateConsistency = () => {
    const trace = getTrace();
    const issues = [];

    // Check for stale selected persistence
    for (let i = 0; i < trace.length - 1; i++) {
      const current = trace[i];
      const next = trace[i + 1];

      if (current.label === 'SESSION_RESET:sessionId' &&
          next.label === 'STATE_UPDATE:selected' &&
          next.selectedLength > 0) {
        issues.push(`Selected not cleared after session reset at index ${i}`);
      }
    }

    // Check for export key changes with activeSessionId
    const exportKeys = trace.filter(e => e.label === 'EXPORT_KEY:generated');
    for (const key of exportKeys) {
      if (!key.exportKey || !key.exportKey.includes(key.activeSessionId)) {
        issues.push(`Export key missing activeSessionId: ${key.exportKey}`);
      }
    }

    return {
      ok: issues.length === 0,
      issues,
    };
  };

  return {
    trace,
    getTrace,
    validateFlow,
    validateConsistency,
  };
}

const SessionTracer = createSessionTracer();

if (typeof window !== 'undefined') {
  window.IMMMSessionTracer = SessionTracer;
  if (window.IMMM_DEBUG_SESSION) {
    console.log('%c[IMMM] Session tracing enabled. Use IMMMSessionTracer.getTrace() to inspect.',
      'color: #FF6B6B; font-weight: bold;');
  }
}

Object.assign(window, { SessionTracer, createSessionTracer });
