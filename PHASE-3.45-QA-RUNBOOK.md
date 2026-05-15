# Phase 3.45 — Runtime Consistency & Session Race Audit Runbook

## Overview
This phase verifies that Phase 3.41-3.44 session isolation work actually functions at runtime, not just syntactically. This document provides the test procedures.

**Current Status**: Code structural review ✅ | Runtime QA validation ⏳ (pending)

---

## 1. Enable Debug Tracing

```javascript
// In browser console:
window.IMMM_DEBUG_SESSION = true;
location.reload();
```

This enables:
- `window.SessionTracer.trace()` calls at critical points
- `window.__IMMM_SESSION_TRACE__` array storing all events
- Colored console logs for each session event

---

## 2. Test Flow: Landing → Setup → Capture → Deco → Result → New Session

### Procedure:

1. **Open DevTools** → Console tab
2. **Enable tracing**: `window.IMMM_DEBUG_SESSION = true; location.reload();`
3. **Perform flow**:
   - Click "START" on landing
   - Go through setup (change frame/filter if desired)
   - Click "NEXT" or "CONTINUE" → starts capture
   - Capture 4+ photos
   - Click "SELECT" → select some photos
   - Click "DECORATE" → go to deco
   - Click "RESULT" → view result
   - Go back and start new session (should see different activeSessionId)

4. **Inspect trace**:
   ```javascript
   // In console:
   const trace = IMMMSessionTracer.getTrace();
   console.table(trace);
   
   // Or validate:
   IMMMSessionTracer.validateFlow();
   IMMMSessionTracer.validateConsistency();
   ```

### Expected Output:

Each step should show:
- `SESSION_START:activeSessionId` — Initial session creation
- `SCREEN_CHANGE:navigation` — Each screen transition with state snapshot
- `EXPORT_KEY:generated` — Export key created with activeSessionId in first segment
- `BLOB_CLEAR:sessionChanged` — ResultV2 cleanup when new session starts
- `SESSION_RESET:sessionId` — New activeSessionId generated

---

## 3. Specific QA Checks

### ✅ Check 1: activeSessionId Changes on New Session

```javascript
const trace = IMMMSessionTracer.getTrace();
const resets = trace.filter(e => e.label === 'SESSION_RESET:sessionId');

// Should see 2+ resets if you started new session
resets.forEach(r => {
  console.log(`Previous: ${r.previousSessionId}`);
  console.log(`New: ${r.newSessionId}`);
  console.log(`Are they different? ${r.previousSessionId !== r.newSessionId}`);
});
```

**Expected**: Each SESSION_RESET has different previousSessionId and newSessionId.

---

### ✅ Check 2: Export Key Contains activeSessionId

```javascript
const trace = IMMMSessionTracer.getTrace();
const exportEvents = trace.filter(e => e.label === 'EXPORT_KEY:generated');

exportEvents.forEach(e => {
  const parts = e.exportKey.split('::');
  const sessionIdPart = parts[0]; // Should be activeSessionId
  console.log(`Session ID from key: ${sessionIdPart}`);
  console.log(`Matches activeSessionId? ${sessionIdPart === e.activeSessionId}`);
});
```

**Expected**: First segment of export key always matches activeSessionId.

---

### ✅ Check 3: Selected Cleared After Session Reset

```javascript
const trace = IMMMSessionTracer.getTrace();

for (let i = 0; i < trace.length - 1; i++) {
  const current = trace[i];
  const next = trace[i + 1];
  
  if (current.label === 'SESSION_RESET:sessionId' && 
      next.label === 'SCREEN_CHANGE:navigation') {
    if (next.selectedLength > 0) {
      console.error(`⚠️ Selected NOT cleared! Length: ${next.selectedLength}`);
    } else {
      console.log(`✅ Selected cleared after reset`);
    }
  }
}
```

**Expected**: After SESSION_RESET, next navigation event shows selectedLength = 0.

---

### ✅ Check 4: ResultV2 Cleanup Fires

```javascript
const trace = IMMMSessionTracer.getTrace();
const cleanups = trace.filter(e => e.label === 'BLOB_CLEAR:sessionChanged');

console.log(`Total cleanup events: ${cleanups.length}`);
cleanups.forEach(c => {
  console.log(`  Preview URL cleared: ${c.previewUrlCleared}`);
  console.log(`  Save sheet cleared: ${c.saveSheetUrlCleared}`);
});
```

**Expected**: At least one BLOB_CLEAR event when transitioning to new session.

---

## 4. Stale Frame Detection Test

**Objective**: Verify old result preview doesn't flash when starting new session.

**Procedure**:

1. Complete a full session (capture → result)
2. Observe result preview image displayed
3. Go back and click "Start" → Setup → Capture
4. Watch carefully for preview image flash (old preview before being cleared)

**Expected**: No flash. Preview should be blank when entering new result screen.

**If flash occurs**: 
- ResultV2 cleanup effect not firing on activeSessionId change
- Check: `trace.filter(e => e.label === 'BLOB_CLEAR:sessionChanged').length === 0`

---

## 5. Rapid Session Switching Stress Test

**Objective**: Verify no memory/blob leaks during repeated session cycles.

**Procedure**:

```javascript
// In console, run this script:
async function stressTest() {
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    console.log(`Cycle ${i + 1}/10...`);
    
    // Navigate: capture
    document.querySelectorAll('button')[0].click(); // "Start"
    await new Promise(r => setTimeout(r, 500));
    
    // Quick setup → capture
    document.querySelectorAll('button').forEach(b => {
      if (b.textContent.includes('NEXT') || b.textContent.includes('Continue')) {
        b.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Go back
    window.go?.('setup');
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('Stress test complete. Check for memory growth in DevTools Memory tab.');
}

stressTest();
```

**Monitor**:
- Open DevTools → Memory tab
- Take heap snapshot before and after
- Check for retained objects with "activeSessionId" or "blob"

**Expected**: Memory usage stable, no growing references to old sessions.

---

## 6. Build Integrity Verification

**Procedure**:

```bash
# In terminal:
npm run build:precompile

# Verify all dist files were regenerated:
ls -lt dist/*.js | head -5

# Check for critical code paths in dist:
grep -l "startNewCaptureSession\|activeSessionId" dist/*.js | wc -l
```

**Expected**:
- All dist files have recent timestamps (within last few seconds)
- Both main.js and screens-v2-deco.js contain session isolation code

---

## 7. localStorage Race Condition Test

**Objective**: Verify removeItem doesn't cause persistence race.

**Procedure**:

```javascript
// In console:
window.IMMM_DEBUG_SESSION = true;

// Complete one session
// Then examine trace for race patterns:

const trace = IMMMSessionTracer.getTrace();
const resetEvents = trace.filter(e => e.label === 'SESSION_RESET:sessionId');

// Check localStorage directly
console.log('Current localStorage immm.v2.sel:', localStorage.getItem('immm.v2.sel'));

// Expected: null after reset
```

**Expected**: `localStorage.getItem('immm.v2.sel')` returns `null` after SESSION_RESET.

---

## 8. Manual Verification Checklist

- [ ] Tracing enabled without errors
- [ ] First session has unique activeSessionId
- [ ] Second session has different activeSessionId  
- [ ] Export key first segment matches activeSessionId
- [ ] Selected array cleared after reset (length = 0)
- [ ] ResultV2 cleanup fires on session change
- [ ] No stale frame flash when entering new result
- [ ] Stress test (10 cycles) completes without memory growth
- [ ] All dist files have recent timestamps
- [ ] localStorage('immm.v2.sel') is null after reset

---

## 9. Known Limitations (Pre-QA)

⚠️ These items require actual browser testing, NOT code review:

- **Stale frame detection**: Requires 60fps slow-mo video recording
- **Memory leak verification**: Requires DevTools heap snapshot comparison
- **Stress test**: Needs actual DOM manipulation and timing verification
- **P1 Naming consistency**: screenFlash vs screenLight inconsistency (logged but not blocking)

---

## 10. Next Steps After QA

If all checks pass ✅:
- Production-ready declaration
- Deploy to staging for real-device testing

If any check fails ❌:
- Log specific trace event that failed
- Identify code path discrepancy
- Return to Phase 3.46 hotfix

---

## Debug Commands Reference

```javascript
// Enable tracing
window.IMMM_DEBUG_SESSION = true;

// Get full trace
IMMMSessionTracer.getTrace();

// Validate flow
IMMMSessionTracer.validateFlow();

// Validate consistency
IMMMSessionTracer.validateConsistency();

// Filter specific event type
IMMMSessionTracer.getTrace().filter(e => e.label.startsWith('SESSION_RESET'));

// Export as JSON
JSON.stringify(IMMMSessionTracer.getTrace(), null, 2);
```

---

## Contact & Notes

- Phase: 3.45 (Runtime Consistency Audit)
- Status: Awaiting manual QA validation
- Current Verdict: "구조상 방향은 맞음" (Structurally correct) ✅
- Production-Ready: Blocked until runtime QA complete ⏳
