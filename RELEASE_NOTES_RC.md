# IMMM RC2.4 Release Notes

## Release Candidate Status
- **Version**: 2026-05-16-rc2.4
- **Runtime**: Precompiled (no @babel/standalone)
- **Branch**: claude/session-adapter-hardening-03que
- **RC Base Commit**: 8caef463b9e4613549037c351c0bda253b61e1e7 (Phase 3.69-3.75 RC Finalization Mega Sprint)
- **Cache**: v17

---

## Included Features

### Core Functionality
- ✅ Precompiled runtime (dist/ only, @babel/standalone removed)
- ✅ Session isolation via activeSessionId
- ✅ Best-Cut frame system (polaroid=3, trip=5, strip=6 shots)
- ✅ Protected route guards (effect-only, no double-render)
- ✅ localStorage.sel race prevention

### QR & Sharing
- ✅ QR Share (cloud-only, blob URL prohibited)
- ✅ Share Viewer (?url= remote image support)
- ✅ QR failure reason standardization (9 enum values)
- ✅ Failure UX (Copy Link, Retry, Close)

### Result & Gallery
- ✅ Result Gallery with blob lifecycle guard
- ✅ Preview URL revocation on session change
- ✅ Save Sheet blob management
- ✅ activeSessionId cleanup effect

### Video Export
- ✅ Save Video capability-gated (MediaRecorder detected)
- ✅ Canvas stream guard (captureStream exists check)
- ✅ Failure reason standardization (7 enum values)
- ✅ Unsupported browser graceful fallback (no crash)

### PWA & Updates
- ✅ Service Worker update guard (one-shot reload)
- ✅ SKIP_WAITING message handler (explicit skipWaiting)
- ✅ controllerchange one-shot guard (__IMMM_RELOADING_FOR_UPDATE)
- ✅ Cache versioning aligned (v17)

### Field Tools
- ✅ Field Test Panel (?fieldTest=1 or window.IMMM_FIELD_TEST)
- ✅ Diagnostics snapshot (getSnapshot/copySnapshot API)
- ✅ Privacy hardened (no dataUrl, no blob URL, no localStorage dump)
- ✅ localStorage count display (not stringify)

### Error Handling
- ✅ AppErrorBoundary with Reload + Copy Diagnostics
- ✅ Version/runtime info in error UI
- ✅ Safe error stack display

---

## Known Pending Field QA (Blocking Production)

### 🔴 Must Test Before Release
1. **QR second-device scan** — Cross-device QR code opening — **NOT TESTED**
2. **Samsung Internet camera/video** — Specific browser capture flow — **NOT TESTED**
3. **iPhone Safari video fallback** — Video export on unsupported Safari — **NOT TESTED**
4. **PWA update flow** — Full update & reload cycle with real SW — **NOT TESTED**

### Impact
- Do not declare production-ready until all 4 pass
- Field QA may reveal:
  - Camera permission issues on specific devices
  - Video codec compatibility issues
  - PWA caching edge cases
  - QR URL accessibility issues

### Test Evidence Required
All 4 field QA items must be executed on actual physical devices:
- QR test requires 2+ devices with QR app/camera
- Samsung Internet test requires Samsung Galaxy device with Samsung Internet browser
- iPhone Safari test requires iPhone with Safari browser
- PWA update test requires live Service Worker deployment with controlled update cycle

---

## NOT Included (Deferred)

- ❌ Save Video on unsupported browsers (graceful fallback only)
- ❌ Local blob QR cross-device sharing (cloud-only policy)
- ❌ Cloud sync gallery (backend not ready)
- ❌ Real-time collaboration features
- ❌ Advanced photo editing (beyond retouch filters)

---

## Migration Notes

### For Users Coming From Previous Beta
- Service Worker will update to v17 cache
- Old SW install-wait flow removed
- Explicit Reload button required for updates
- Field Test mode available via ?fieldTest=1

### For Developers
- precompile runtime mandatory (index.precompiled.html)
- No ESM imports/exports (CommonJS only)
- localStorage.clear() prohibited (use resetSessionState)
- URL.revokeObjectURL only in revokeBlobUrl wrapper

---

## Smoke Tests
Run before deployment:
```bash
npm run build:precompile
node scripts/sanity-check.mjs
node scripts/rc-smoke.mjs
```

All 10 smoke tests must pass:
1. release-manifest.json valid JSON
2. dist/release-manifest.json valid JSON
3. Cache version alignment (manifest ↔ sw.js)
4. No @babel/standalone in index.html
5. dist main files exist
6. No fake immm.io URLs
7. No localStorage.clear() calls
8. No pgpt stray files
9. dist/main.js syntax valid
10. dist/screens-v2-deco.js syntax valid

---

## Support & Feedback

### Reporting Issues
- Use Field Test Panel (?fieldTest=1) to capture diagnostics
- Copy Diagnostics button preserves non-sensitive state
- Include session ID tail, screen, device info

### Known Workarounds
- Samsung Internet: Disable hardware acceleration if camera hangs
- iOS Safari: Use Share instead of Save Video on unsupported iOS versions
- PWA: Clear cache manually if update fails (?cache=clear param)

---

## Changelog (Phase 3.46–3.75)

### Phase 3.46
- Torch/Screen Light naming unification
- Async orphan guard in ResultV2

### Phase 3.64–3.68
- AppErrorBoundary + Diagnostics
- Field Test Panel
- QR/Video failure reasons
- PWA update guard

### Phase 3.69–3.75 (RC Finalization)
- Cache metadata alignment (sw.js ↔ manifest)
- Privacy hardening (localStorage.length, no stringify)
- QR Share contract finalization
- Video Export capability hardening
- Blob lifecycle finalization
- PWA update UX hardening
- RC smoke automation
- Release manifest commit hash lock

---

**Status**: Ready for field QA. Production declaration pending 4-point field test.
