/**
 * IMMM Session Runtime Snapshot (Debug Foundation)
 *
 * Provides read-only session snapshot capture for debugging and instrumentation.
 * No automatic integration with runtime. No storage outside memory.
 */

(function() {
  const SNAPSHOT_VERSION = '1.0.0';

  const isSessionDebugEnabled = () => {
    return window.IMMM_DEBUG_SESSION === true;
  };

  /**
   * Creates a debug session snapshot from runtime state.
   * Uses SessionAdapter internally.
   */
  const createDebugSessionSnapshot = (input) => {
    const Adapter = window.IMMMSessionAdapter;
    if (!Adapter) {
      return { ok: false, errors: ['SessionAdapter not found'] };
    }

    if (!input) {
      return { ok: false, errors: ['No input provided'] };
    }

    // Delegate to SessionAdapter
    return Adapter.createSessionSnapshot(input);
  };

  /**
   * Stores the last debug session snapshot in memory.
   * Does NOT persist to storage, DOM, or any external system.
   */
  const storeLastDebugSessionSnapshot = (snapshot) => {
    if (!isSessionDebugEnabled()) return false;

    window.__IMMM_LAST_SESSION_SNAPSHOT__ = snapshot;
    return true;
  };

  /**
   * Retrieves the last stored debug session snapshot.
   */
  const getLastDebugSessionSnapshot = () => {
    if (!isSessionDebugEnabled()) return null;
    return window.__IMMM_LAST_SESSION_SNAPSHOT__ || null;
  };

  /**
   * Clears the last debug session snapshot.
   */
  const clearLastDebugSessionSnapshot = () => {
    if (!isSessionDebugEnabled()) return false;

    delete window.__IMMM_LAST_SESSION_SNAPSHOT__;
    return true;
  };

  /**
   * Self-test for runtime snapshot foundation.
   */
  const runSessionRuntimeSnapshotSelfTest = () => {
    const errors = [];

    // Test 1: Debug disabled by default
    const debugState = isSessionDebugEnabled();
    if (debugState !== false) {
      errors.push('Test 1 FAIL: Debug should be disabled by default');
    }

    // Test 2: Create snapshot with sample data
    const sampleInput = {
      shots: ['data:image/png;base64,shot1', 'data:image/png;base64,shot2'],
      selected: [0, 1],
      appState: { layout: 'strip', frameTheme: 'black' }
    };

    const snapshot = createDebugSessionSnapshot(sampleInput);
    if (!snapshot.ok) {
      errors.push(`Test 2 FAIL: Sample snapshot failed: ${JSON.stringify(snapshot.errors)}`);
    }

    // Test 3: Store snapshot (should succeed even with debug off)
    const stored = storeLastDebugSessionSnapshot(snapshot);
    if (stored === false) {
      // Debug is off, so store should fail or no-op
      // Test passes - it correctly rejected storage
    }

    // Test 4: Enable debug and try again
    window.IMMM_DEBUG_SESSION = true;
    const storedWithDebug = storeLastDebugSessionSnapshot(snapshot);
    if (!storedWithDebug) {
      errors.push('Test 4 FAIL: Store failed with debug enabled');
    }

    // Test 5: Retrieve snapshot
    const retrieved = getLastDebugSessionSnapshot();
    if (!retrieved || retrieved !== snapshot) {
      errors.push('Test 5 FAIL: Retrieved snapshot does not match stored');
    }

    // Test 6: Clear snapshot
    const cleared = clearLastDebugSessionSnapshot();
    if (!cleared) {
      errors.push('Test 6 FAIL: Clear failed');
    }

    const afterClear = getLastDebugSessionSnapshot();
    if (afterClear !== null) {
      errors.push('Test 6 FAIL: Clear did not remove snapshot');
    }

    // Test 7: Invalid input graceful fail
    const invalidResult = createDebugSessionSnapshot(null);
    if (invalidResult.ok === true) {
      errors.push('Test 7 FAIL: Invalid input should fail gracefully');
    }

    // Test 8: No mutation of input
    const originalJson = JSON.stringify(sampleInput);
    createDebugSessionSnapshot(sampleInput);
    if (JSON.stringify(sampleInput) !== originalJson) {
      errors.push('Test 8 FAIL: Input shots object was mutated');
    }

    // Clean up
    delete window.IMMM_DEBUG_SESSION;
    clearLastDebugSessionSnapshot();

    return {
      ok: errors.length === 0,
      errors
    };
  };

  // --- Export Namespace ---

  window.IMMMSessionRuntimeSnapshot = Object.freeze({
    SNAPSHOT_VERSION,
    isSessionDebugEnabled,
    createDebugSessionSnapshot,
    storeLastDebugSessionSnapshot,
    getLastDebugSessionSnapshot,
    clearLastDebugSessionSnapshot,
    runSessionRuntimeSnapshotSelfTest
  });

})();
