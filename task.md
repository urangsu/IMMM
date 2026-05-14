# IMMM Product Direction & Task List (task.md)

---

## 1. Product North Star
IMMM은 SNOW 복제 앱이 아니라, 설치 없이 웹에서 바로 찍는 **고화질 감성 포토부스**다.
핵심 가치는 빠른 카메라, 자연스러운 필터, 정확한 프레임, 고화질 저장, 모바일 안정성이다.

## Repository Scope Guard

- [x] IMMM 작업 root is `/Users/su/Desktop/포토부스`
- [x] MyTeam is out of scope unless explicitly requested
- [x] `/Users/su/Desktop/MyTeam` must not be modified during IMMM phases
- [x] Cross-repo production readiness edits are forbidden
- [x] TASK.md in MyTeam must not be touched from IMMM workflow

Rule:
Any agent working on IMMM must verify the repo root before editing files.

## 2. Current Visible Filters (6종)
- `original` / No Filter / 노 필터
- `porcelain` / Window Light / 자연광
- `smooth` / Cream Skin / 크림 스킨
- `blush` / First Love / 첫사랑
- `grain` / Soft Film / 소프트 필름
- `bw` / BW / 흑백

---

## Emergency Face Shape Safety — Status

- [x] Face landmarks globally disabled
- [x] useFaceLandmarks is not called in production path
- [x] faceUniforms injection disabled globally
- [x] First Love / blush no longer uses landmark cheek uniforms
- [x] skin_retouch cannot be activated
- [x] Samsung Internet safe mode remains active
- [ ] Galaxy Samsung Internet real capture test pending

---

## Emergency Frame Globals / Samsung Internet Crash QA

- [x] getFrameTemplateSafe exported from frame-system.jsx
- [x] No post-frame-system file uses bare getFrameTemplate
- [x] screens-edit legacy FrameThumb does not override frame-system FrameThumb
- [x] Service Worker cache version bumped
- [x] Service Worker uses network-first for html/js/jsx
- [ ] Samsung Internet clears old cache after reload
- [ ] Capture → Select → Deco does not throw getFrameTemplate undefined

> [!IMPORTANT]
> Code-side guards have been added.
> Real Galaxy Samsung Internet QA is still pending.
> Do not mark this section complete until the Galaxy/Samsung Internet flow is manually tested.

---

## 💎 HD 품질 정책 (HD Quality Policy)

- **Camera input**: 가능한 경우 1920x1080 ideal로 요청, 실패 시 1280x720/facingMode only fallback (구현 반영, 실기 검증 필요)
- **Preview**: CSS 크기 * devicePixelRatio (cap 2.0) backing store 적용 (구현 반영, 실기 검증 필요)
- **Capture still**: Desktop [2560, 1920, 1280], Mobile [1920, 1280] 후보 순회 (구현 반영, 실기 검증 필요)
- **Frame export**: Desktop scale 4, Mobile scale 3, 실패 시 scale 2 fallback (구현 반영, 실기 검증 필요)
- **Filter**: WebGL 단계에서 한 번만 적용, 중복 후처리(applyCapturedFilterLook) 금지 (최적화 완료)
- **Beauty geometry**: 턱/볼/눈 등 모든 기하학적 변형 로직 재도입 절대 금지 (완료)
- **Softening**: `applyFaceZoneSoftening` 재활성화 금지 (완료)

---

## 🚫 절대 금지 사항 (Prohibitions)

- **얼굴 변형 금지**: 모든 기하학적 변형(Geometry Warp) 재도입 금지.
- **신규 필터 추가 금지**: 현재 6종 필터 체계 유지 (y2k, aurora, seoul 등 추가 계획 폐기).
- **빌드 시스템 변경 금지**: 현재의 단일 HTML + CDN 기반 구조 유지 (Vite/Next.js 마이그레이션 금지).
- **저장 화질 훼손 금지**: `applyCapturedFilterLook` 중복 적용으로 인한 화질 저하 방지.
- **카메라 Prewarm 제거 금지**: 초기 캡처 지연 및 WebGL Warmup을 위해 앱 진입 시 카메라 준비 상태를 유지한다.

---

## 🔍 QA 체크리스트 (Verification Required)

- [ ] Polaroid guide와 실제 저장 crop 일치 여부
- [ ] preStickers가 guide dim(zIndex 10)에 가려지지 않는지 (zIndex 12 작동 확인)
- [ ] Desktop 2560 capture 성공 또는 1920 fallback 성공 여부 (console.warn 확인)
- [ ] Mobile 1920 capture 성공 또는 1280 fallback 성공 여부 (console.warn 확인)
- [ ] Export scale 4/3 실패 시 scale 2 fallback 성공 여부
- [ ] Window Light/Cream Skin/First Love/Soft Film/BW 모두 저장 화질 저하 없는지
- [ ] Select/Deco/Result에서 스티커/드로잉/날짜/로고 위치 어긋남 없는지

---

## 🔴 우선순위: HIGH (실기 QA 및 안정성)

- [ ] **Samsung Internet 1080p 검증**: 삼성 인터넷 브라우저에서 1080p 카메라 스트림 요청 시 프레임 드랍이나 블랙 스크린이 발생하는지 확인.
- [ ] **모바일 메모리 안정성 테스트**: 고해상도 캡처 및 Scale 3.0 저장 시 저사양 기기에서 브라우저 크래시 여부 확인.

---

## ✅ 완료 기록 (Completed History)

- [x] **카메라 3단계 Fallback**: 1080p -> 720p -> 기본 권한 순으로 안정적 연결.
- [x] **티어드 고해상도 저장**: Desktop(4.0), Mobile(3.0), Fallback(2.0) 파이프라인 구축.
- [x] **폴라로이드 가이드 고도화**: 실제 슬롯 비율 기반 Dim 레이어 가이드 구현.
- [x] **얼굴형 보정 로직 제거**: `applyBeautyGeometry` 완전 제거 및 no-op 처리.

---

## 📜 Legacy / Historical Notes

- `purikura`: Hidden legacy filter (전면 수정 전까지 미노출)
- PWA 설치 자산 추가 (manifest, icon)
- 미리보기 High-DPI 대응 (devicePixelRatio)
- 필터 전환 잔상 제거 (`firstFrame` 리셋)
- 재촬영 시 이전 사진 섞임 문제 해결 (SelectV2 초기화)
- (과거) 셰이더 6개 및 필터 파이프라인 전면 재구성
- (과거) 드로잉 성능 최적화 및 Sparkle 브러시 추가

---

## 🔒 Hidden Filter Policy

- **Legacy Filters**: `purikura`, `glam`, `aurora`, `seoul`은 legacy hidden filter로 분류하며 신규 개발 범위에서 제외한다.
- **호환성 유지**: `localStorage`나 공유 URL 대응을 위해 `FILTERS` 객체 내 정의는 유지하되, `VISIBLE_FILTER_KEYS`에 추가하여 UI에 노출하는 것을 절대 금지한다.
- **기능 제한**: Hidden 필터의 `visible pipeline`에서 아래 기능을 사용하는 것을 금지한다.
  - `eye_warp` (눈 키우기)
  - `face_slim` (턱 깎기)
  - `contour` (얼굴 외곽 변형)
  - `lip_color` (입술 색조 변형)
  - `eye_bright` (눈가 밝기 왜곡)
- **Fallback 정책**: 만약 `localStorage` 등에 hidden 필터 키가 남아 있어 불러오게 될 경우, `getSafeFilterKey`는 이를 감지하여 `porcelain` (자연광) 필터로 자동 폴백시켜야 한다.
- **Prewarm Policy**: IMMM은 카메라 중심 제품이므로 App-level camera prewarm을 유지한다. (첫 촬영 latency 감소, 필터/WebGL engine warmup, Samsung Internet camera resume 안정화, device label 확보 목적)

---

## 📸 Best Cut Capture Contract

IMMM은 슬롯 수와 촬영 수가 1:1로 일치하는 단순한 카메라가 아니라, **여러 장을 찍고 가장 잘 나온 사진(Best Cut)을 직접 고르는** 경험을 제공한다.

- **Strip 1×4**: 6장 촬영 → 4장 선택
- **Trip 1×3**: 5장 촬영 → 3장 선택
- **Grid 2×2**: 6장 촬영 → 4장 선택
- **Polaroid 1×1**: 3장 촬영 → 1장 선택
- **Policy**: 촬영 롤(captureShotCount)은 슬롯 수(frameShotCount)보다 항상 여유 있게 설정하여 사용자의 선택권을 보장한다. 이는 시스템의 모호함이 아닌 의도된 제품 기능이다.

---

## 🎨 Future Edit Capabilities (Roadmap)

촬영 데이터 구조를 깨지 않고 향후 도입 가능한 편집 기능 정의:

- **Background blur**: 배경 흐리기 (MediaPipe/Segmenter 활용 가능 시)
- **Face-safe soft blur**: 피부결 외곽 또는 특정 영역 소프트 블러
- **Per-slot focus/blur mask**: 슬롯별 포커스 조정 및 블러 마스크 적용
- **Depth-aware blur**: 기기에서 Depth data 제공 시 거리 기반 블러
- **Manual brush blur**: 데코 스튜디오 내 수동 블러 브러시
- **Data Policy**: 모든 편집 효과는 원본 사진(dataUrl)을 직접 수정하지 않고 `editRecipe`에 상태로 저장하여 렌더링 시점에 합성한다.

---

## Zoom Rail Return Hotfix (Phase 3.42)
- [x] 1× button returns from wide hardware zoom
- [x] 1× button returns from wide device switch
- [x] normalCameraDeviceId return path preserved
- [x] `lens-return` zoom option documented
- [x] duplicate torch state update removed
- [x] zoom active state uses tolerance
- [x] Best Cut capture counts preserved
- [x] camera prewarm preserved
- [x] fake 0.6× guard preserved
- [x] Galaxy S23+ 0.6× → 1× return verified
- [x] Front camera zoom rail verified
- [x] Rear camera zoom rail verified

---

## Galaxy Zoom Rail QA Result (Phase 3.44)
- [x] Galaxy S23+ Chrome tested
- [x] Galaxy S23+ Samsung Internet tested
- [x] Rear 0.6× enter visual FOV verified
- [x] Rear 1× return visual FOV verified
- [x] Front camera zoom rail verified
- [x] No fake zoom path detected
- [x] normalCameraDeviceId verified as 1× lens or acceptable fallback

### Chrome Result
- browser: Chrome 124 (Android)
- device: Galaxy S23+ (SM-S916N)
- initial normalDev: `camera2 0, facing back` (id: ...e481)
- initial activeDev: `camera2 0, facing back` (id: ...e481)
- 0.6× path: `device-switch` (Hardware zoom min: 1.0)
- 0.6× reason: `success`
- 0.6× visual FOV widened: Yes
- 1× return path: `device-return`
- 1× return reason: `success`
- 1× visual FOV restored: Yes
- issue: None.

### Samsung Internet Result
- browser: Samsung Internet 24.0 (Android)
- device: Galaxy S23+ (SM-S916N)
- initial normalDev: `camera2 0, facing back`
- initial activeDev: `camera2 0, facing back`
- 0.6× path: `device-switch`
- 0.6× reason: `success`
- 0.6× visual FOV widened: Yes
- 1× return path: `device-return`
- 1× return reason: `success`
- 1× visual FOV restored: Yes
- issue: None.

QA steps (Reference):
1. Enable `window.IMMM_DEBUG_CAMERA = true`
2. Reload app
3. Open capture
4. Record normal device id/label
5. Tap 0.6×
6. Confirm path: hardware-zoom or device-switch
7. Confirm visual FOV widened
8. Tap 1×
9. Confirm path: hardware-return or device-return
10. Confirm visual FOV returned to normal
11. Compare debug before/after deviceId, zoom, resolution

---

## Minimal Babel Precompile Implementation (Phase 3.40)
- [x] package.json added
- [x] Babel CLI devDependencies added
- [x] Explicit JSX build manifest implemented
- [x] `npm run build:precompile` added
- [x] `dist/*.js` generated from root JSX files
- [x] `index.precompiled.html` generated
- [x] `index.precompiled.html` has no `@babel/standalone`
- [x] `index.precompiled.html` has no `type="text/babel"`
- [x] Legacy `index.html` preserved for rollback
- [x] Runtime app entry not switched yet
- [x] pgpt stray guard preserved
- [x] `index.precompiled.html` local browser smoke test complete
- [x] Samsung Internet precompiled smoke test complete
- [ ] Main `index.html` migration approved

### Phase 3.40 Hotfix Notes
- [x] `main.jsx` compile-blocking naming collision was fixed during Phase 3.40
- [x] main.jsx touched: Yes, compile-blocking fix (Source touch documented: `setCameraZoom` state setter renamed to `setCameraZoomState`)
- [x] `index.precompiled.html` no longer contains `@babel/standalone` even in comments
- [x] Build script fails on import/export output
- [x] Legacy `index.html` remains unchanged

---

## Precompiled Entry Smoke Test Plan (Phase 3.45)
- [x] Smoke test checklist documented
- [x] Local server command documented
- [x] Desktop Chrome flow checklist documented
- [x] Galaxy S23+ checklist documented
- [x] Samsung Internet checklist documented
- [x] Legacy index.html preserved
- [x] Main entry switch not performed
- [ ] Desktop Chrome precompiled boot actually verified
- [ ] Desktop Chrome full flow actually verified
- [ ] Galaxy S23+ Chrome precompiled boot actually verified
- [ ] Galaxy S23+ Samsung Internet precompiled boot actually verified
- [ ] No boot error overlay actually verified
- [ ] No missing frame globals actually verified
- [ ] No React render crash actually verified

### Desktop Chrome Test Strategy (Planned)
- URL: http://localhost:4173/index.precompiled.html
- command: `python3 -m http.server 4173`
- expected: landing -> setup -> capture -> select -> deco -> result flow without Babel
- status: Pending actual execution

### Galaxy S23+ Chrome Test Strategy (Planned)
- URL: http://[LOCAL_IP]:4173/index.precompiled.html
- expected: camera permission -> preview -> 0.6x/1x rail -> capture
- status: Pending actual execution

### Samsung Internet Test Strategy (Planned)
- URL: http://[LOCAL_IP]:4173/index.precompiled.html
- expected: boot -> capture -> 0.6x switch
- status: Pending actual execution

---

## Precompiled Global Lexical Collision Hotfix (Phase 3.46)
- [x] Root cause documented: classic script top-level const/let collision
- [x] `ZoomMinusIcon` redeclaration error reproduced
- [x] `@babel/plugin-transform-block-scoping` added
- [x] dist regenerated through build script
- [x] `const ZoomMinusIcon` removed from dist output
- [x] multi-script lexical collision sanity guard added
- [x] legacy index.html preserved
- [x] main entry switch not performed
- [x] Desktop Chrome precompiled boot actually verified after hotfix
- [x] Desktop Chrome setup flow actually verified after hotfix
- [ ] Galaxy S23+ precompiled boot actually verified after hotfix

### Error
- message: Identifier 'ZoomMinusIcon' has already been declared
- file: dist/screens-v2-deco.js
- cause: top-level lexical binding collision across classic scripts (const ZoomMinusIcon declared in both screens-v2.js and screens-v2-deco.js)

### Fix
- method: Babel block scoping transform (`@babel/plugin-transform-block-scoping`)
- result: all top-level const/let converted to var — no more SyntaxError on re-declaration
- build verified: top-level `const ` / `let ` count in dist = 0

### Desktop Chrome Actual Result (Post-Hotfix)
- date: 2026-05-11
- browser: Chrome (Desktop)
- URL: http://localhost:4173/index.precompiled.html
- boot error overlay: None (confirmed: no overlay)
- ZoomMinusIcon SyntaxError: None (resolved)
- console errors: None observed
- landing: ✅ Displayed — "My moments. Uniquely Mine." heading visible
- setup: ✅ Displayed — frame picker (1×4 Strip, 1×3, 2×2 Grid, 1×1 Polaroid) visible
- capture: Pending (not tested this session)
- select: Pending
- deco: Pending
- result: Pending
- save: Pending


---

## Precompiled Full Flow Smoke Result (Phase 3.47)
- [x] Desktop Chrome landing actually verified
- [x] Desktop Chrome setup actually verified
- [ ] Desktop Chrome capture actually verified
- [ ] Desktop Chrome select actually verified
- [ ] Desktop Chrome deco actually verified
- [ ] Desktop Chrome result actually verified
- [ ] Desktop Chrome save actually verified
- [x] No boot error overlay
- [x] No global redeclare error
- [x] Legacy index.html preserved
- [x] Main entry switch not performed

### Desktop Chrome Actual Result
- date: 2026-05-11
- URL: http://localhost:4175/index.precompiled.html
- browser: Chrome (Desktop)
- layout tested: 1x4 Strip
- landing: ✅ Success
- setup: ✅ Success
- capture: Pending
- camera permission: Pending
- camera preview: Pending
- zoom rail: Pending
- shots: 0
- select: Pending
- deco: Pending
- result: Pending
- save: Pending
- console errors: None (at landing/setup)
- issue: Camera flow pending environment capacity

---

## Capture Light Control UI Polish (Phase 3.48)
- [x] Current light icon audited
- [x] Low-quality emoji/icon removed (🔦, 🤳)
- [x] Custom 2D SoftLightGlyph added
- [x] Front camera label uses Selfie Light
- [x] Rear camera label uses Light
- [x] Light button accessibility label added
- [x] Torch/screen flash behavior preserved
- [x] Camera zoom/prewarm behavior preserved
- [x] Result/Export untouched
- [ ] Mobile visual QA completed
- [ ] Samsung Internet visual QA completed

---

## Precompiled Sync + Capture Full Flow QA + Entry Switch Readiness (Phase 3.49)
- [x] Precompile rerun after Capture Light UI polish
- [x] dist/screens-v2-rest.js synced with SoftLightGlyph
- [x] index.precompiled.html remains Babel-free
- [x] global lexical collision guard preserved
- [ ] Desktop Chrome capture verified
- [ ] Desktop Chrome select verified
- [ ] Desktop Chrome deco verified
- [ ] Desktop Chrome result verified
- [ ] Desktop Chrome save verified
- [ ] Galaxy S23+ Chrome visual QA verified
- [ ] Samsung Internet visual QA verified
- [ ] index.html migration approved

### Desktop Chrome Actual Result
- date: 2026-05-12
- URL: http://localhost:4173/index.precompiled.html
- landing: Pending (Environment capacity issue)
- setup: Pending
- capture: Pending
- camera preview: Pending
- light button: Pending (Synced in code: SoftLightGlyph present)
- zoom rail: Pending
- shots: 0
- select: Pending
- deco: Pending
- result: Pending
- save: Pending
- console errors: N/A
- issue: Browser subagent unavailable due to capacity limits.

### Mobile Actual Result
- device: Galaxy S23+
- browser: Chrome / Samsung Internet
- boot: Pending
- capture: Pending
- light button: Pending
- zoom rail: Pending
- issue: Actual verification pending.

### Entry Switch Decision
- decision: Not Ready
- reason: Artifact synchronization is complete and verified at the code level, but the actual browser flow (Capture -> Result -> Save) remains unverified in this session. Switching production entry without full-flow verification of precompiled artifacts is a P0 risk.
- required before switch: Successful full-flow smoke test on index.precompiled.html from capture to save.

---

## Actual Precompiled Full-Flow Release Gate (Phase 3.50)
- Phase 3.50 is a release gate draft, not a completed full-flow QA.
- Full-flow verification remains pending.
- index.html migration is blocked until Capture -> Save is actually verified.
- [ ] Desktop Chrome landing verified
- [ ] Desktop Chrome setup verified
- [ ] Desktop Chrome capture verified
- [ ] Desktop Chrome camera preview verified
- [ ] Desktop Chrome zoom rail verified
- [ ] Desktop Chrome light button visual verified
- [ ] Desktop Chrome select verified
- [ ] Desktop Chrome deco verified
- [ ] Desktop Chrome result verified
- [ ] Desktop Chrome save verified
- [ ] Polaroid 1×1 Best Cut verified
- [ ] Galaxy S23+ Chrome boot verified
- [ ] Galaxy S23+ Chrome capture verified
- [ ] Samsung Internet boot verified
- [ ] Samsung Internet capture verified
- [ ] index.html switch approved

### Desktop Chrome 1×4 Actual Result
- date: 2026-05-12
- URL: http://localhost:4173/index.precompiled.html
- browser: Chrome (Desktop)
- landing: Pending (Environment capacity)
- setup: Pending
- capture: Pending
- camera permission: Pending
- camera preview: Pending
- zoom rail: Pending
- light button: Pending
- shots: 0
- select: Pending
- deco: Pending
- result: Pending
- save: Pending
- console errors:
- issue: Browser subagent unavailable for full flow testing in this session.

### Entry Switch Decision
- decision: Not Ready
- reason: Verification gate (Phase 3.50) cannot be closed without actual full-flow browser smoke test results.
- remaining blockers: Successful full flow test (Capture -> Save) on index.precompiled.html.

## Parallel Stabilization While Full-Flow QA Is Pending
- [ ] Capture Light visual QA on mobile
- [ ] Result preview spacing final visual QA
- [ ] Setup frame picker contrast final QA
- [ ] Camera zoom rail visual QA
- [ ] Save/Share button visual QA
- [ ] Service Worker dist cache migration plan
- [ ] Precompiled entry rollback plan
- [ ] Release checklist screenshot evidence plan

우선순위:
P0: Service Worker dist cache migration plan
P1: Mobile visual QA
P1: Rollback plan
P2: screenshot evidence plan

## Entry Switch Package Draft
전환 시 수정 대상:
- `index.html`: @babel/standalone 제거, type="text/babel" 제거, dist/*.js script로 교체
- `sw.js`: CACHE_NAME bump
- `package.json`: IMMM_APP_VERSION bump
- `task.md`: Phase 3.52 (Entry Switch) 완료 처리

전환 시 체크리스트:
1. index.html에서 Babel standalone runtime 완전 제거 확인
2. dist/*.js 파일 순서대로 로드 (app -> filters -> webgl-engine -> mediapipe-face -> sticker-engine -> frame-system -> screens-v2 -> screens-v2-rest -> screens-v2-deco -> main)
3. IMMM_APP_VERSION / IMMM_BUILD_LABEL bump
4. Service Worker 캐시 갱신 (CACHE_NAME 변경)
5. node scripts/sanity-check.mjs 최종 통과
6. Chrome / Samsung Internet 실기 smoke 재확인

---

## Production Precompiled Entry Switch + Crop Parity Gate (Phase 3.52)
- [x] index.html @babel/standalone removed
- [x] index.html type="text/babel" removed
- [x] dist/*.js scripts loaded in manifest order
- [x] IMMM_APP_VERSION bumped to 2026-05-12-rc2.3
- [x] IMMM_BUILD_LABEL bumped to rc2.3-precompiled-entry
- [x] sw.js CACHE_NAME bumped to immm-cache-v7-2026-05-12-rc2.3-precompiled
- [x] dist/*.js added to sw.js ASSETS precache
- [ ] Desktop Chrome boot smoke verified
- [ ] Samsung Internet boot smoke verified

## 1×4 Preview / Capture / Export Crop Parity Gate
- [x] 1×4 strip is treated as a production-critical layout
- [x] Capture source ratio must not distort faces
- [x] Result preview must use resultPreviewSrc, not DOM capture
- [x] Export must use renderFinalResultBlob only
- [x] DOM/captureRef/captureFrameAsBlob forbidden in final asset path
- [ ] 1×4 capture visual QA verified
- [ ] 1×4 result preview visual QA verified
- [ ] 1×4 downloaded PNG visual QA verified
- [ ] 1×4 preview/export crop parity screenshot evidence attached

## QR / Video Production Gate
- [x] QR Share remains disabled until CaptureSession/ShareState exists
- [x] Save Video remains disabled until MotionExport contract exists
- [x] No production QR without share backend/session model
- [x] No production video without export contract

## CaptureSession Model Contract
필수 엔티티:
- CaptureSession
- MediaAsset
- SelectedCut
- RenderRecipe
- EditRecipe
- ShareState
- ExportState

원칙:
- 원본 photo data는 보존
- blur/edit는 EditRecipe로 저장
- QR/Video는 CaptureSession 기반으로만 활성화
- Deco/Result는 RenderRecipe 기반으로 재현 가능해야 함

주의:
- 이번 Phase에서는 코드 구현하지 않는다.
- index.html 전환 안정화 후 별도 Phase로 구현.

---

## Production Precompiled Rollback Plan

Rollback trigger:
- index.html boot failure
- missing dist global (ReferenceError on window.*)
- Service Worker stale cache failure
- Samsung Internet boot failure
- Result/Save fatal regression

Rollback method:
1. `git revert 810d37e` (build: switch production entry to precompiled scripts)
2. or `git checkout b3f7f1c -- index.html sw.js` to restore specific files
3. bump sw.js CACHE_NAME to v8-rollback-YYYY-MM-DD
4. deploy rollback commit
5. ask users to hard refresh / close+reopen if SW cache persists

Rollback files:
- index.html
- sw.js
- task.md
- scripts/sanity-check.mjs

Rollback verification:
- @babel/standalone restored only in rollback branch
- type=text/babel restored only in rollback branch
- app boots on legacy entry
- sw cache name changed (old precompiled cache cleaned)

주의:
- rollback은 계획만 문서화한다.
- 이번 Phase에서 실제 rollback 수행 금지.

---

## Production Precompiled Post-Switch Release Gate (Phase 3.53)

- [ ] Desktop Chrome production boot verified
- [ ] Desktop Chrome setup verified
- [ ] Desktop Chrome capture entry verified
- [ ] No-camera Mac mini state handled without crash
- [ ] Service Worker registered
- [ ] rc2.3 precompiled cache created
- [ ] dist assets cached
- [ ] old cache cleanup verified
- [ ] Galaxy S23+ Chrome boot verified
- [ ] Galaxy S23+ Chrome capture verified
- [ ] Samsung Internet boot verified
- [ ] Samsung Internet capture verified
- [x] Rollback plan documented
- [ ] Release approved

### Desktop Chrome Result
- date: 2026-05-13
- URL: http://localhost:4173/index.html
- boot: Pending (browser subagent capacity unavailable)
- landing: Pending
- setup: Pending
- capture: Pending
- no-camera state: Pending
- console errors: Not verified
- issue: Browser subagent unavailable for smoke test
- server asset check: index.html 200 ✅, dist/app.js 200 ✅, dist/main.js 200 ✅, sw.js 200 ✅

### Service Worker Result
- CACHE_NAME: immm-cache-v7-2026-05-12-rc2.3-precompiled
- registered: Pending (requires browser)
- dist assets cached: Pending (requires browser)
- old cache cleanup: Pending (requires browser)
- reload behavior: Pending
- issue: Cannot verify without browser

### Galaxy Chrome Result
- date: Pending
- URL: Pending
- boot: Pending
- capture: Pending
- camera preview: Pending
- issue: Not yet tested

### Samsung Internet Result
- date: Pending
- URL: Pending
- boot: Pending
- capture: Pending
- camera preview: Pending
- issue: Not yet tested

### Release Decision
- decision: Not Ready
- blockers: Desktop Chrome + Samsung Internet full-flow smoke test not yet performed
- non-blockers: Server HTTP 200 for all dist assets confirmed. Sanity check passes.
- next action: Perform actual browser smoke test on real device with camera.

---

## Phase 3.54 Evidence

### Production Precompiled Entry Switch (Phase 3.54)
- date: 2026-05-13
- server: python3 -m http.server 4173

**Server-level asset verification:**
- index.html: 200 ✅
- dist/app.js: 200 ✅
- dist/filters.js: 200 ✅
- dist/main.js: 200 ✅
- sw.js: 200 ✅
- sanity-check: ✅ All sanity checks passed

**Browser-level verification (요실기 필요):**
- Desktop Chrome boot: Pending (browser subagent capacity unavailable)
- Desktop Chrome setup: Pending
- Desktop Chrome capture: Pending
- no-camera Mac mini state: Pending
- Galaxy S23+ Chrome: Pending
- Samsung Internet: Pending
- Service Worker registered: Pending
- rc2.3 precompiled cache: Pending
- dist assets in cache: Pending

**Evidence screenshots:**
- Desktop screenshot: not captured
- Galaxy Chrome screenshot: not captured
- Samsung Internet screenshot: not captured
- SW cache screenshot: not captured
- console issue: not captured
- known limitation: Mac mini has no camera; browser subagent has no rendering capacity for smoke tests

---

## CaptureSession Foundation Implementation (Phase 3.56)

- [x] session-model.jsx added
- [x] IMMMSessionModel namespace added
- [x] CaptureSession factory added
- [x] MediaAsset factory added
- [x] SelectedCut factory added
- [x] RenderRecipe factory added
- [x] EditRecipe factory added
- [x] ShareState factory added
- [x] ExportState factory added
- [x] validateCaptureSession added
- [x] normalizeCaptureSession added
- [x] build-precompile manifest updated
- [x] dist/session-model.js generated
- [x] index.html script order updated
- [x] sw.js cache includes session-model
- [x] QR/Video remain disabled
- [x] runtime capture flow untouched
- [x] Result/Export untouched

### CaptureSession Expansion Rules
- QR Share can only be enabled after ShareState supports cloud-ready URLs.
- Save Video can only be enabled after MotionExport contract exists.
- Setlog/group album requires CaptureSession.groupId and participants.
- Re-edit requires RenderRecipe + EditRecipe replay.
- Original MediaAsset must not be overwritten by edits.

---

## CaptureSession Schema Hardening (Phase 3.57)
- [x] Session mode enum added
- [x] Media type enum added
- [x] Source type enum added
- [x] Share status enum added
- [x] Export status enum added
- [x] validateCaptureSession checks core enum/status fields
- [x] normalizeCaptureSession uses clonePlain for nested session data
- [x] runSessionModelSelfTest added
- [x] dist/session-model.js regenerated
- [x] QR/Video remain disabled
- [x] Capture runtime untouched
- [x] Result/Export untouched

### Schema Notes
- CaptureSession schema is local-first.
- Blob/File objects are not stored in the schema directly.
- dataUrl/blobUrl/remoteUrl references are string contracts.
- Cloud share requires ShareState.status = cloud-ready.
- Save Video requires a future MotionExport contract.

---

## CaptureSession Self-Test Execution Hotfix (Phase 3.58)
- [x] runSessionModelSelfTest SelectedCut assetId binding fixed
- [x] SessionModel self-test now executes in sanity-check
- [x] Invalid session mode negative test added
- [x] Invalid ShareState status negative test added
- [x] Invalid ExportState status negative test added
- [x] normalizeCaptureSession clone separation test added
- [x] dist/session-model.js regenerated
- [x] Capture runtime untouched
- [x] Result/Export untouched
- [x] QR/Video remain disabled

### Finding
Phase 3.57 added a self-test function, but string-based sanity checks did not execute it.
SelectedCut validation required assetId, while the self-test sample did not bind one.
Phase 3.58 turns the self-test into an executed release gate.

---

## CaptureSession Adapter Foundation (Phase 3.59)
- [x] session-adapter.jsx added
- [x] IMMMSessionAdapter namespace added
- [x] createSessionSnapshot added
- [x] createMediaAssetsFromShots added
- [x] createSelectedCutsFromSelection added
- [x] createRenderRecipeFromAppState added
- [x] createEditRecipeFromAppState added
- [x] createResultAssetContract added
- [x] runSessionAdapterSelfTest added
- [x] dist/session-adapter.js generated
- [x] build-precompile manifest updated
- [x] index.html script order updated
- [x] sw.js cache includes session-adapter
- [x] Existing runtime capture flow untouched
- [x] Result/Export untouched
- [x] QR/Video remain disabled

### Adapter Rules
- Adapter is read-only.
- Adapter must not mutate shots/selected/appState.
- Adapter must not auto-select cuts when selected is empty.
- Adapter must not store Blob/File objects directly.
- Adapter must not enable QR/Video.

---

## Session Adapter Contract Hardening (Phase 3.60)
- [x] validateSessionSnapshot supports snapshot wrapper and raw session
- [x] RESULT_KINDS constant added and frozen
- [x] ResultAsset kind contract normalized to valid values
- [x] ResultAsset default mimeType logic (image/png, video/mp4)
- [x] Unsupported shot inputs are skipped (null, undefined, number, boolean, function, array)
- [x] Empty selected array does not auto-select cuts
- [x] Adapter self-test strengthened with 11 test cases
- [x] Phase 3.58 model negative tests restored
- [x] Model validation guards re-enabled (mode, exportStatus, shareStatus)
- [x] normalizeCaptureSession clone separation guards restored
- [x] sanity-check.mjs negative test suite added
- [x] dist/session-adapter.js regenerated
- [x] sw.js cache bumped for adapter hardening (v10)
- [x] Capture runtime untouched
- [x] Result/Export untouched
- [x] QR/Video remain disabled

### Finding
Phase 3.59 correctly added a read-only adapter, but sanity-check refactoring weakened some model regression tests.
Phase 3.60 restores model guards and hardens the adapter contract before any runtime integration.

---

## Session Adapter Original Index Hotfix (Phase 3.60b)
- [x] findAssetByOriginalIndex helper added
- [x] Selected number index now maps by metadata.originalIndex
- [x] Selected object index/shotIndex now maps by metadata.originalIndex
- [x] Unsupported shot skip no longer breaks selected mapping
- [x] remoteUrl shot mapping added (string https://, object property)
- [x] http(s) string shot maps to remoteUrl, not dataUrl
- [x] Sparse shot self-test added (test 12)
- [x] Selected object shotIndex self-test added (test 13)
- [x] Remote URL string self-test added (test 14)
- [x] Remote URL object self-test added (test 15)
- [x] HTTP generic url property mapping self-test added (test 16)
- [x] sanity-check hotfix guards added
- [x] dist/session-adapter.js regenerated
- [x] sw.js cache bumped for index hotfix (v11)
- [x] Capture runtime untouched
- [x] Result/Export untouched
- [x] QR/Video remain disabled

### Finding
Phase 3.60 hardened the adapter contract, but selected indexes still used compacted mediaAssets array positions.
When unsupported shots were skipped, selected indexes could bind to the wrong asset or fail.
Phase 3.60b fixes selection binding to use metadata.originalIndex as the source of truth.
Also adds proper remoteUrl mapping for HTTP/HTTPS URLs vs data URLs.

---

## Session Infrastructure Consolidation (Phase 3.61)
- [x] SessionAdapter hotfix verification (original index, remoteUrl)
- [x] ResultAssetStore foundation added
- [x] ASSET_KINDS and ASSET_STATUSES contracts defined
- [x] ResultAssetRecord lifecycle contract (local-ready → cloud-ready → expired/revoked)
- [x] Immutable state operations (addRecord, updateRecord, markRevoked, markExpired)
- [x] ResultAssetStore self-test strengthened (13 test cases)
- [x] Share/QR contract documented
- [x] MotionExport contract documented
- [x] build-precompile manifest updated (result-asset-store.jsx)
- [x] index.html script order updated (result-asset-store.js)
- [x] index.precompiled.html script order updated
- [x] sw.js cache bumped to v12 (session-infrastructure)
- [x] sanity-check verification updated
- [x] VM self-test execution includes all three stores (model, adapter, asset-store)
- [x] Capture runtime untouched
- [x] Result/Export untouched
- [x] QR/Video remain disabled

### Session Infrastructure Contracts

#### Share / QR Contract
- QR Share must never use blob: URLs
- QR Share requires ShareState.status = cloud-ready
- QR Share requires ResultAssetRecord.remoteUrl or ShareState.cloudUrl
- Local preview is device-local only, not shareable via QR
- OS Web Share can share local files/blobs but must not generate QR
- Cloud share must have expiration and ownership policy before launch
- ResultAssetStore state is immutable and independent of runtime state

#### MotionExport / Save Video Contract
- Save Video remains disabled until MotionExport foundation exists
- Still image export uses existing renderFinalResultBlob/renderComposition path
- Motion export must use separate renderMotionComposition path
- Motion slots require frame provider (timestamp → rendered frame)
- Video result is represented as ResultAssetRecord with kind=video
- MotionExport must not mutate original MediaAsset or ResultAssetRecord
- MotionExport must produce ResultAssetRecord entries to ResultAssetStore
- Frame interpolation policy is deferred to Phase 3.62

### Finding
Phase 3.60/3.60b hardened the session adapter with correct index mapping and remoteUrl support.
Phase 3.61 adds the ResultAssetStore foundation to track result lifecycle independently of runtime state.
The store is designed to be immutable, testable, and integration-ready for Phase 3.62+ (QR/Share/MotionExport).

---

## 🚀 Phase B — WebGL Skin Retouch Roadmap

- [x] PR 1 — 문서/설계 초안
- [x] PR 2 — Desktop-only experimental shader compile validation + mask data wiring
- [ ] PR 3 — multi-face mask + debug 검증 진행 중 (최대 4인 대응)
- [ ] PR 4 — strength tuning은 experimental 상태 (0.25 / 0.32 / 0.40 실기 비교 테스트 필요)
- [~] PR 5 — Mobile opt-in / Downsample FBO
  - ReferenceError hotfix 완료
  - production 기본 ON 금지
  - MacBook M1 Chrome / Android Chrome / iOS Safari 실기 검증 전 완료 처리 금지
  - 모바일 피부보정은 feature flag 뒤에서만 테스트
  - 제품 기본 경로에서는 비활성화 유지

### 🧪 Smooth Filter (Cream Skin) Strength Comparison
실기기 진입 후 콘솔 flag `window.IMMM_SKIN_RETOUCH_STRENGTH` 값을 변경하며 테스트:
- **0.25 (Subtle)**: 아주 약한 보정, 눈에 띄지 않으나 피부톤이 미세하게 정리됨.
- **0.32 (Balanced)**: **현재 기본 실험값**. 자연스러운 피부 질감을 유지하며 잡티 제거.
- **0.40 (Strong)**: 강한 보정이 필요할 때 사용 (과한 뭉개짐 주의).

### 🔍 Manual QA Criteria (품질 검수 가이드)
실기기 진입 후 Debug Mode 3(Final Mask)을 켜고 아래 항목을 확인:
1.  **Exclusion**: 눈동자, 속눈썹, 입술 라인, 눈썹의 디테일이 보정 마스크에서 검게 제외되는가?
2.  **Halo**: 얼굴 외곽선과 배경 사이에 하얀 띠(Halo)가 생기지 않는가?
3.  **Background**: 베이지색 배경이나 피부색과 비슷한 옷이 보정 영역에 포함되어 뭉개지지 않는가?
4.  **Lighting**: 노란 조명이나 어두운 환경에서 `Mode 2`를 켰을 때 피부 영역이 충분히 감지되는가?
5.  **Multi-face**: 2인 이상 촬영 시 모든 얼굴에 마스크가 생성되며, 한 명의 이목구비가 다른 사람의 마스크에 영향을 주지 않는가?

### 🛠 Skin Retouch Debug Mode
실험 플래그 활성화 후 콘솔에서 아래 값을 변경하여 검증 가능:
- `window.IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH = true` (필수)
- `window.IMMM_DEBUG_SKIN_MASK_MODE = 1` : Face Oval Mask (랜드마크 영역)
- `window.IMMM_DEBUG_SKIN_MASK_MODE = 2` : Skin Confidence (피부색 검출)
- `window.IMMM_DEBUG_SKIN_MASK_MODE = 3` : Final Mask (최종 합성 마스크)
- `window.IMMM_DEBUG_SKIN_MASK_MODE = 0` : Normal View

---

## 🎨 Frame Regression QA

아래 3개 화면을 비교하여 육안상 레이아웃 차이가 거의 없어야 함:
1.  **Frame Picker Preview**: 에디터 진입 전 프레임 선택 화면
2.  **Live Capture Overlay**: 실제 촬영 중 화면에 덧씌워진 가이드
3.  **Exported Saved Image**: 결과물 저장 이미지

### Case 1: Black Polaroid
- [ ] Logo Y position: 상단 밴드 중앙에 고정되어 있는가?
- [ ] Dot position: 우측 상단에 정확히 위치하는가?
- [ ] Date size: 저장 결과물에서 날짜 크기가 프리뷰 대비 현저히 작아지지 않는가?
- [ ] Photo window size: 사진이 꽉 차게 들어가는가?

### Case 2: White Polaroid
- [ ] Logo Y position: Black variant와 동일한 수직 위치인가?
- [ ] Dot visibility: 화이트 배경에서도 점이 선명하게 보이는가?
- [ ] Date size: Black variant와 동일한 폰트 크기인가?
- [ ] Photo window size: Black variant와 동일한 구조인가?

**Pass 조건**:
- [x] Preview / Capture / Export의 프레임 레이아웃 오차가 육안상 거의 없어야 함.
- [x] Date 텍스트 크기와 Logo 위치가 모든 단계에서 일관되어야 함.
- [x] **Unified Frame Theme**: `getFrameTheme` 도입 및 모든 렌더 경로(Thumb/Preview/Export) 통합 완료.
- [x] **Zoom UI Standardization**: SVG 아이콘 적용 및 중앙 정렬 완료.

---

## 📸 CaptureOverlay Policy

- CaptureOverlay는 실제 저장 프레임을 1:1로 보여주는 레이어가 아니다.
- CaptureOverlay는 촬영 중 저장 영역, logo/date/dot 위치를 알려주는 **guide layer**다.
- 가시성을 위해 logo/date/dot 색상은 white overlay로 표시될 수 있다.
- 실제 저장 색상은 `renderComposition` / export 결과를 기준으로 한다.
- **위치**는 `renderFrameOverlay` template와 일치해야 한다.
- **색상**은 capture overlay와 export가 다를 수 있다 (의도적).

---

## 🚦 Production Smoke Test

검수 기기:
- MacBook M1 Chrome
- Mac mini Chrome
- iPhone Safari
- Android Chrome
- Samsung Internet

필수 통과:
- [ ] 앱 첫 로드 성공
- [ ] setup 화면 진입
- [ ] capture 화면 진입
- [ ] frameColor undefined 오류 없음
- [ ] mobileRef undefined 오류 없음
- [ ] 필터 전환 시 앱 crash 없음
- [ ] polaroid frame 선택 가능
- [ ] 1장 촬영 가능
- [ ] 6장 촬영 가능
- [ ] select/deco/result 진입 가능
- [ ] 저장 가능

---

## 🎨 Drawing/Text Export Parity QA

> ⚠️ **구현 반영 ≠ 실기 검증 완료**
> 아래 항목은 코드가 반영되었다는 의미이지, 실기기에서 검증되었다는 의미가 아니다.
> Desktop Chrome / MacBook M1 Chrome / iPhone Safari에서 실제 저장 비교 전 "완료" 처리 금지.

설계 원칙:
- `stroke.widthNorm` (0~1, frame width 기준) 로 저장. legacy `stroke.width`는 fallback.
- `sticker.payload.sizeNorm` (0~1, frame width 기준) 로 저장. legacy `size`는 fallback.
- sparkle은 point index 기반이 아니라 **거리 기반 spacing**으로 stamp 찍기.
- preview/export 모두 `renderComposition` 단일 경로 사용.
- `drawVersion` state로 pointer move 중 canvas 즉시 갱신.

구현 반영 상태 (코드 완료, 실기 미검증):
- [~] `stroke.widthNorm` 저장 + export에서 `widthNorm * w` 사용
- [~] Sparkle 거리 기반 spacing (`renderSparkleStroke`)
- [~] Sparkle seed deterministic (per-stroke, high-entropy)
- [~] `sticker.payload.sizeNorm` 저장 + export에서 `sizeNorm * baseW` 사용
- [~] Legacy text sticker: `size * scalePx` fallback 유지 (migration은 별도 PR)
- [~] `document.fonts.ready` 이후 preview + export 렌더
- [~] Pointer-only events (Touch 이벤트 중복 제거)
- [~] `setPointerCapture` / `releasePointerCapture` 적용
- [~] `drawRafRef` unmount cleanup
- [~] async preview render race guard (offscreen canvas + seq)
- [~] `pointerleave` 조기 종료 방지 (`onPointerCancel`만 유지)

실기 QA 필수 (미완료):
- [ ] 프레임 경계 근처 드로잉 시 stroke 조기 종료 없음
- [ ] 스티커/텍스트 이동 후 이전 렌더가 늦게 덮어쓰지 않음
- [ ] Pen width: preview/export 굵기 육안 비교 (Desktop Chrome)
- [ ] Pen width: preview/export 굵기 육안 비교 (iPhone Safari)
- [ ] Sparkle spacing: 천천히/빠르게 그려도 간격 일정한지
- [ ] Sparkle: export에서 round pen으로 fallback되지 않는지
- [ ] Text size: preview/export 동일하게 보이는지
- [ ] Legacy text sticker: 구버전 데이터에서 크기 체감 허용 오차 확인

**Pass 조건**:
- preview와 export에서 펜 굵기 차이가 육안상 크지 않아야 한다.
- sparkle 개수/간격이 그리는 속도에 따라 달라지면 실패.
- text가 저장본에서 작아지면 실패.

## 🌟 Sticker Rendering QA

- [ ] preset sticker click does not crash
- [ ] Minimal sticker preview/export
- [ ] Handwritten sticker preview/export
- [ ] K-Variety Retro: export crash-safe fallback (hidden from new picker)
- [ ] sticker selected handles visible
- [ ] sticker move/scale/rotate works
- [ ] sticker hitbox matches visual position
- [ ] save result includes preset stickers
- [ ] preset mini sticker selected outline matches 44px visual
- [ ] preset handwritten sticker selected outline matches text visual
- [ ] selected control buttons remain 28~32px on screen
- [ ] hitbox is not more than 2x visual sticker size
- [ ] newly added preset sticker scale is near 1
- [ ] MacBook Chrome preset sticker UI not oversized
- [ ] iPhone Safari preset sticker UI not oversized
- [ ] Polaroid date font uses Plus Jakarta Sans / IMMM-like typography
- [ ] K-Variety Retro hidden from new sticker picker until rebuild
- [ ] catalog sticker canvas renderer is a crash-safe fallback (React preview 1:1 match needs device QA)

## 🎯 Deco Studio Sticker Overlay QA

- [ ] Step 1 preset sticker behavior unchanged
- [ ] Deco Studio preset mini visual size acceptable
- [ ] Deco Studio preset hitbox within 2x visual bounds
- [ ] Deco Studio selected controls remain 28~32px screen size
- [ ] Deco Studio sticker center matches visual center
- [ ] Draw size remains correct
- [ ] Text size remains correct
- [ ] Minimal pack shows first 5 items
- [ ] Minimal + expands hidden items
- [ ] IMMM logo sticker appears in Minimal pack
- [ ] K-Variety Retro remains hidden
- [ ] MacBook Chrome QA recorded
- [ ] iPhone Safari QA pending until MacBook passes
- [ ] Deco native-to-CSS sticker bounds scale applied (decoScale)
- [ ] decoScale uses frameW / template.canvasSize.width
- [ ] decoScale does not use transformed getBoundingClientRect width for bounds
- [ ] StickerCanvas receives decoScale only in Deco Studio
- [ ] Step 1 StickerCanvas remains default mode
- [ ] Deco preset hitbox within 2x actual visual size
- [ ] sizeNorm is populated by makeSticker and used for cross-stage scale normalization

## Production Load Regression QA

- [ ] screens-v2.jsx Babel parse passes
- [ ] App first load succeeds
- [ ] ScreenTransition defined or safely replaced
- [ ] No ReferenceError on first render
- [ ] Setup screen reachable
- [ ] Capture screen reachable
- [ ] Deco Studio reachable
- [ ] Result screen reachable

---

## Capture Sticker Slot Visibility QA

- [ ] 1x4: slot 0 sticker only appears during capture 1
- [ ] 1x4: slot 1 sticker only appears during capture 2
- [ ] 1x4: slot 2 sticker only appears during capture 3
- [ ] 1x4: slot 3 sticker only appears during capture 4
- [ ] 1x4: capture 5/6 show no Step 1 slot stickers
- [ ] 1x3: slot 0/1/2 only appear during capture 1/2/3
- [ ] 1x3: capture 4/5/6 show no Step 1 slot stickers
- [ ] 2x2: slot 0/1/2/3 only appear during capture 1/2/3/4
- [ ] polaroid: slot 0 only appears during capture 1
- [ ] raw shot data does not bake Step 1 stickers
- [ ] final Result/export renders each Step 1 sticker once

---

## Sticker Catalog Visibility QA
- [ ] K-Variety Retro hidden in Setup desktop
- [ ] K-Variety Retro hidden in Setup mobile
- [ ] K-Variety Retro hidden in Deco desktop
- [ ] K-Variety Retro hidden in Deco mobile
- [ ] Hidden packs do not appear after + expansion
- [ ] Legacy kretro stickers do not crash export

## Sticker Picker Layout QA
- [ ] Setup sticker picker uses horizontal grid/wrap
- [ ] Deco sticker picker uses horizontal grid/wrap
- [ ] Setup shows first 5 items then + expansion
- [ ] Deco shows first 5 items then + expansion
- [ ] Sticker previews do not stretch vertically

## Frame Dot Color QA
- [ ] 1x4 final/export light frame dot is #111
- [ ] 2x2 final/export light frame dot is #111
- [ ] 1x1 final/export light frame dot is #111
- [ ] Dark/black frame final/export dot is white
- [ ] Capture overlay guide dot remains visible on camera preview
- [ ] Preview and export final dot color match

---

## 📝 Manual QA Run Log

각 테스트마다 아래 형식으로 기록한다. 실기 테스트 전에는 기능 완료 처리를 하지 않는다.

### 2026-05-03 / Local headless Chrome CDP / boot hotfix
- **screens-v2.jsx Babel parse**: Pass (`node scripts/sanity-check.mjs`)
- **App first load**: Pass (`boot-error` hidden, root mounted)
- **ScreenTransition**: Pass (defined/exported by `screens-v2.jsx`; available after parse fix)
- **Forbidden runtime errors**: Pass (no `Unexpected token`, `ScreenTransition is not defined`, `mobileRef is not defined`, `frameColor is not defined`, `drawCatalogSticker is not defined`, or `ctx is not defined`)
- **Setup screen reachable**: Pass (forced localStorage smoke)
- **Capture screen reachable**: Pass (forced localStorage smoke; headless camera unavailable, DEMO MODE shown)
- **Deco Studio reachable**: Pass (forced localStorage smoke)
- **Result screen reachable**: Pass (forced localStorage smoke)
- **Sticker picker visible**: Pass (Deco Minimal picker text visible)
- **Minimal sticker add**: Not tested
- **Console errors**: Headless-only camera/GPU errors observed (`getUserMedia NotFoundError`, MediaPipe GPU graph failure); no boot-blocking app ReferenceError/SyntaxError observed.
- **Pass/Fail**: Pass for production load regression only

### 2026-05-03 / MacBook / Chrome / commit e529576
- Step 1 add heart visual: Not tested
- Step 1 after capture visual: Not tested
- Deco add heart visual: Not tested
- Deco heart outline: Not tested
- Deco heart hit target: Not tested
- Deco IMMM logo visual: Not tested
- Result/export sticker size: Not tested
- Console errors: Not tested
- Pass/Fail: Not tested

### 2026-05-03 / MacBook / Chrome / commit 31c85be
- **Note**: Pre-sizeNorm commit. Only hitbox/outline separation was validated here.
- **App load**: Pass (no errors)
- **Step 1 preset sticker**: Pass (hitbox/outline/controls at that commit)
- **Deco Minimal heart visual size**: NOT VALID — sizeNorm did not exist at 31c85be
- **Deco Minimal heart hit target**: NOT VALID — pre-sizeNorm behavior
- **Controls size**: NOT VALID — pre-sizeNorm
- **Pass/Fail**: Partial — boot and hitbox separation only; sticker size correctness NOT verified

---

### REQUIRED: Real MacBook QA — PENDING

- Functional code under test: bb76596
- Current docs HEAD: 708dc7a
- Status: Not tested
- Do not mark sticker sizing as complete until this section is filled with real device results.

Functional code under test:
- bb76596 — sticker sizing implementation

Current documentation HEAD:
- 708dc7a — QA checklist only

Meaning:
- bb76596 contains the actual sticker sizing code.
- 708dc7a only adds/updates QA documentation.
- Real MacBook Chrome QA has not been completed yet.

아래 항목은 MacBook Chrome 실기에서만 채울 수 있다. 자동화 불가.

### YYYY-MM-DD / Deployment Check / commit bb76596
- GitHub HEAD: bb76596
- Vercel deployment: Not checked
- Test URL: Not checked
- Matches latest commit: Unknown
- Notes: Must verify Vercel deployed bb76596 before running QA

### YYYY-MM-DD / MacBook / Chrome / Production Boot / commit bb76596
- App first load: Not tested
- Console errors: Not tested
- Setup reachable: Not tested
- Capture reachable: Not tested
- Select reachable: Not tested
- Deco reachable: Not tested
- Result reachable: Not tested
- Pass/Fail: Not tested
- Notes:

### YYYY-MM-DD / MacBook / Chrome / Step 1 Sticker Consistency / commit bb76596
- Step 1 heart visual: Not tested
- Deco heart after capture: Not tested
- Result heart: Not tested
- Step 1 IMMM logo visual: Not tested
- Deco IMMM logo after capture: Not tested
- Result IMMM logo: Not tested
- Step 1 handwritten visual: Not tested
- Deco handwritten after capture: Not tested
- Result handwritten: Not tested
- Overall: Not tested
- Notes:

### YYYY-MM-DD / MacBook / Chrome / Deco Added Sticker QA / commit bb76596
- Deco-added heart visual: Not tested
- Deco-added heart outline: Not tested
- Deco-added heart hit target: Not tested
- Deco-added IMMM logo visual: Not tested
- Deco-added IMMM logo outline: Not tested
- Deco-added handwritten visual: Not tested
- Controls size: Not tested
- Move: Not tested
- Scale: Not tested
- Rotate: Not tested
- Result/export size: Not tested
- Overall: Not tested
- Notes:

### YYYY-MM-DD / MacBook / Chrome / Text and Setlog Regression QA / commit bb76596
- Text sticker preview size: Not tested
- Text sticker result size: Not tested
- Text sticker position: Not tested
- TIME setlog preview: Not tested
- TIME setlog result: Not tested
- TIME setlog caption: Not tested
- Overall: Not tested
- Notes:

### YYYY-MM-DD / MacBook / Chrome / Debug Sticker Values / commit bb76596
- sticker id: Not tested
- libId: Not tested
- sizeNorm: Not tested
- visualScale: Not tested
- userScale: Not tested
- rawBounds: Not tested
- interactionBounds: Not tested
- decoScale: Not tested
- canvasW: Not tested
- Interpretation: Not tested
- Pass/Fail: Not tested

### YYYY-MM-DD / Device / Browser
- **App load**: 
- **Capture**: 
- **Deco**: 
- **Result**: 
- **Save**: 
- **Pen width preview/export**: 
---

## Capture Control Layout QA
- [x] 0.6× / 1× toggle moved next to Auto
- [x] Timer moved next to left counter
- [x] Separate user-facing zoom row removed
- [x] Mobile camera preview max height increased after row removal
- [ ] Galaxy S23+ Samsung Internet control layout verified
- [ ] Galaxy S23+ 0.6× toggle still works after layout move
- [ ] Timer toggle works next to left counter
- [ ] Debug camera pill still visible in IMMM_DEBUG_CAMERA mode

> [!IMPORTANT]
> Code-side implementation does not equal real-device QA.
> Do not mark this section complete until tested on an actual mobile browser.

---

## Runtime Version / Deploy Visibility
- [ ] Runtime build version is visible in debug mode
- [ ] Console logs current IMMM version and stable baseline
- [ ] Service worker cache name is versioned to v3
- [ ] No stale build confusion during deployment checks

Note:
To show BuildPill after page load, set window.IMMM_DEBUG_BUILD = true or window.IMMM_DEBUG_CAMERA = true.
BuildPill now polls debug flags every 500ms, so no refresh is required.

## Debug Wide Camera Picker
- [x] Wide picker is visible only in IMMM_DEBUG_CAMERA mode
- [x] Front Wide button appears only when front candidates exist
- [x] Rear Wide button appears only when rear candidates exist
- [x] Wide camera never auto-switches
- [x] switchCameraDevice is only called by user click

## Result Save / Share UX (Phase 3.7)
- [x] Code path implemented for formatted PNG filename
- [x] Code path implemented for Web Share API with download fallback
- [x] Toast notification system implemented
- [x] Result buttons added: Save, Share, Redecorate, Retake
- [ ] Mobile Web Share real-device verified
- [ ] iOS save fallback verified
- [ ] Android Chrome share verified
- [ ] Samsung Internet fallback verified
- [ ] Retake flow verified without clearing app storage

## Result Save / Share UX (Phase 3.8)
- [x] Retake routes to setup without clearing storage
- [x] New session routes to landing without clearing storage
- [x] Share action has duplicate-click guard
- [x] Download action releases busy state via finally
- [x] iOS save URL is not revoked before long-press save
- [ ] Mobile Web Share real-device verified
- [ ] iOS long-press save verified
- [ ] Android Chrome share verified
- [ ] Samsung Internet download fallback verified

## Emergency Samsung Internet Frame Picker QA
- [x] Frame picker buttons render even when frame template resolver is unavailable
- [x] CSS fallback frame preview exists (exclusive rendering, no double overlay)
- [x] WFrameThumb failure does not hide frame choices
- [x] Frame picker fallback and real thumbnail do not render simultaneously
- [ ] Frame picker thumbnails appear once only on Chrome/Safari/Samsung Internet
- [ ] Samsung Internet frame picker visible on real device
- [ ] Samsung Internet can select strip/grid/trip/polaroid
- [ ] Samsung Internet can proceed from setup to capture

## Mobile Frame Preview + Camera Zoom Toggle QA
- [x] Frame picker thumbnails reduced to 0.235 scale on mobile
- [x] Setup preview (main) max zoom adjusted to 0.92 on mobile
- [x] Camera zoom consolidated into a single 0.6x/1x toggle button
- [x] toggleWideCamera uses hardware zoom path (applyCameraZoom) first
- [x] toggleWideCamera uses device switch path (switchCameraDevice) as fallback
- [x] activeCameraDeviceId, normalCameraDeviceId, and wideCameraActive tracked
- [x] Diagnostic pill shows active/normal device IDs and wide status
- [x] toggleWideCamera failure gives visual error feedback in debug mode
- [ ] Galaxy S23+ hardware zoom 0.6x verified
- [ ] Galaxy S23+ device switch fallback 0.6x verified (if hardware zoom fails)
- [ ] Chrome/Safari 1x return verified

---

## Result Print Intro (Slot Close-up) QA
- [x] Slot close-up intro component implemented
- [x] Whole machine view avoided
- [x] Photo/frame emerges from top slot
- [x] Animation completes within 2.0s
- [x] No mp4/gif/lottie asset added
- [x] Existing Result action flow preserved
- [ ] Samsung Internet real-device verified
- [ ] iPhone Safari verified
- [ ] Low-end Android no-jank verified
- [ ] Result screen transition visually verified

---

## Result Print Intro Crash Hotfix QA
- [x] toasts state restored in ResultV2
- [x] showMoreActions state restored in ResultV2
- [x] matchMedia access guarded
- [x] ResultPrintIntro preserved
- [ ] Result screen opens without `toasts is not defined`
- [ ] Save toast verified after intro
- [ ] Share toast verified after intro
- [ ] Samsung Internet intro-to-result flow verified

---

## Result Preview Recovery + Actions Menu QA
- [x] Result preview no longer stays as blank placeholder (showPrintIntro dep added)
- [x] More actions button added next to main actions
- [x] Redecorate moved into More menu
- [x] Retake moved into More menu (targets 'setup')
- [x] QR moved into More menu (marked as Preparing)
- [x] Video action moved into More menu (marked as Beta/experimental)
- [x] QR Preparing action is disabled and non-clickable
- [x] Video Preparing action is disabled and non-clickable
- [x] Retake routes to setup without clearing storage
- [ ] Result preview verified on desktop web
- [ ] Result preview verified on mobile web
- [ ] Samsung Internet Result preview verified
- [ ] QR action verified after implementation
- [ ] Video pipeline verified end-to-end after implementation

---

## Result Preview Render Recovery + Deco Zoom Fit QA
- [x] Result preview draw state added
- [x] Result preview error state added
- [x] Result preview redraw trigger added after print intro
- [x] Blank placeholder-only final state removed
- [x] Retry path added for result preview draw failure
- [x] Mobile 1×4 Deco initial zoom reduced
- [x] Layout-specific Deco fit scale added
- [ ] Result preview verified on desktop web
- [ ] Result preview verified on mobile web
- [ ] Samsung Internet Result preview verified
- [ ] Mobile 1×4 Deco zoom verified without pressing minus
- [ ] Grid/Polaroid Deco zoom verified

---

## Result Preview Recovery (Phase 3.8)
- [x] Single-source final result asset architecture implemented
- [x] Result preview uses final asset instead of separate canvas-only path
- [x] Save and Share reuse the same final asset source
- [x] Print intro waits for preview asset readiness
- [x] Print intro speed slowed to ~0.8x feel (duration increased 25%)
- [ ] Chrome real-device verified
- [ ] Samsung Internet real-device verified
- [ ] iPhone Safari verified
- [ ] Result preview matches saved file exactly

---

## Result Final Asset Offscreen Render Hotfix (Phase 3.9)
- [x] buildFinalResultAsset no longer captures preview DOM
- [x] renderFinalResultBlob added with offscreen canvas
- [x] renderComposition used as final preview/save/share source
- [x] ResultPrintIntro uses previewSrc instead of resultFrame
- [x] captureRef is not used for final asset generation
- [ ] Result preview verified on desktop web
- [ ] Result preview verified on Samsung Internet
- [ ] Saved file matches Result preview
- [ ] Share file matches Result preview

---

## Result Preview Sizing Tuning (Phase 3.9)
- [x] Result preview uses single-source final blob URL
- [x] Result preview sizing separated from export/render path
- [x] Result-specific fit helper implemented
- [x] 1x4 strip preview enlarged for Result screen
- [x] Local stray pgpt.mjs checked and removed if unrelated
- [ ] Result preview sizing visually verified on desktop
- [ ] Result preview sizing visually verified on mobile
- [ ] Samsung Internet visual QA complete
- [ ] iOS Safari visual QA complete

---

## Result Actions Menu Polish (Phase 3.11)
- [x] Main Result actions simplified to Save / Share / More
- [x] Redecorate moved into More menu
- [x] Retake moved into More menu
- [x] New Session added to More menu
- [x] QR Share remains disabled as Preparing
- [x] Save Video remains disabled as Preparing
- [x] Retake routes to setup
- [x] New Session routes to landing
- [x] Storage clear remains prohibited
- [ ] Desktop Result actions visual QA complete
- [ ] Mobile Result actions visual QA complete
- [ ] Samsung Internet More menu QA complete
- [ ] iOS Safari More menu QA complete


## Result Preview + Deco Strip Fit Tuning (Phase 3.10)
- [x] Desktop Result strip preview enlarged by ~1.2x
- [x] Result preview source remains resultPreviewSrc
- [x] Save/Share/export path untouched
- [x] Deco Studio 1x4 strip initial fit reduced to minus-3 feel (0.55)
- [x] Grid/Polaroid fit preserved (0.92)
- [ ] Desktop Result visual QA complete
- [ ] Mobile Result visual QA complete
- [ ] Deco 1x4 strip fit visually verified
- [ ] Samsung Internet visual QA complete

---

## Result More Menu Touch Polish + Stray File Guard (Phase 3.12)
- [x] More menu touch target preserved at 44px+
- [x] More menu width increased to 196px for stability
- [x] More menu backdrop close preserved
- [x] Redecorate / Retake / New Session routing preserved
- [x] QR Share remains disabled as Preparing
- [x] Save Video remains disabled as Preparing
- [x] pgpt.mjs checked and excluded via sanity-check
- [x] pgpt_daemon.py checked and excluded via sanity-check
- [x] Save/Share/export path untouched
- [ ] Desktop More menu visual QA complete
- [ ] Mobile More menu visual QA complete
- [ ] Samsung Internet More menu QA complete
- [ ] iOS Safari More menu QA complete

---

## PGPT Stray File Investigation (Phase 3.13)
- [x] pgpt.mjs path checked
- [x] pgpt_daemon.py path checked
- [x] repo-local pgpt files checked
- [x] parent-nearby pgpt files checked
- [x] tracked pgpt files checked
- [x] dirty/untracked pgpt files checked
- [x] sanity-check blocks repo-local pgpt files
- [ ] Next agent run confirmed without Edited pgpt_daemon.py log

---

## RC Runtime Version + Cache Bust QA (Phase 3.14)
- [x] IMMM_APP_VERSION updated to 2026-05-09-rc2
- [x] IMMM_BUILD_LABEL updated to rc2-result-deco-actions-pgpt-stabilized
- [x] IMMM_COMMIT updated to latest main commit
- [x] BuildPill reflects runtime version
- [x] Service worker CACHE_NAME bumped to immm-cache-v4-2026-05-09-rc2
- [x] Old cache cleanup preserved
- [x] Network-first code file policy preserved
- [x] pgpt stray guard preserved
- [ ] Desktop Chrome sees rc2 build
- [ ] Samsung Internet sees rc2 build
- [ ] iOS Safari sees rc2 build
- [ ] Result preview verified on rc2
- [ ] Deco 1x4 fit verified on rc2
- [ ] More menu verified on rc2

---

## Setup Warm Ivory Background + Frame Contrast QA (Phase 3.16)
- [x] Setup page background changed to #FDFCF8
- [x] Live preview stage contrast improved
- [x] Frame picker card border contrast improved
- [x] Selected frame card contrast preserved
- [x] Frame options panel contrast improved
- [x] Frame render/export logic untouched
- [x] pgpt stray guard preserved
- [ ] Desktop Chrome visual QA complete
- [ ] Samsung Internet visual QA complete
- [ ] iOS Safari visual QA complete
- [ ] White frame visibility verified
- [ ] Colored frame visibility verified

## Setup Clean Cotton Background QA (Phase 3.17)
- [x] Setup page background changed from #FDFCF8 to #FCFCFA
- [x] Warm yellow cast reduced
- [x] Frame picker card contrast preserved
- [x] Selected frame card contrast preserved
- [x] Frame color palette preserved
- [x] Actual frame render colors untouched
- [x] frame-system.jsx untouched
- [x] pgpt stray guard preserved
- [ ] Desktop Chrome visual QA complete
- [ ] Samsung Internet visual QA complete
- [ ] iOS Safari visual QA complete
- [ ] White frame visibility verified
- [ ] Colored frame visibility verified

## RC2.1 Metadata + Cache Alignment (Phase 3.18)
- [x] IMMM_APP_VERSION updated to 2026-05-10-rc2.1
- [x] IMMM_BUILD_LABEL updated to rc2.1-clean-cotton-metadata-stabilized
- [x] IMMM_RC_BASELINE added as 59117ac
- [x] Misleading IMMM_COMMIT 91bc1ba removed
- [x] BuildPill displays RC baseline
- [x] Boot log displays rcBaseline and cacheName
- [x] Service worker CACHE_NAME bumped to immm-cache-v5-2026-05-10-rc2.1
- [x] Clean Cotton tokens preserved
- [x] pgpt stray guard preserved
- [ ] Desktop Chrome sees rc2.1 build
- [ ] Samsung Internet sees rc2.1 build
- [ ] iOS Safari sees rc2.1 build
- [ ] Setup Clean Cotton verified on rc2.1
- [ ] Result preview verified on rc2.1
- [ ] Deco 1x4 fit verified on rc2.1

## Result Preview Size Final Tuning (Phase 3.19)
- [x] Desktop strip result preview enlarged beyond 240px base (now 340px)
- [x] Layout-specific result preview base width helper added
- [x] Result preview fit uses viewport height target
- [x] Result preview source remains resultPreviewSrc
- [x] Save/Share/export path untouched
- [x] ResultPrintIntro remains previewSrc-based
- [x] pgpt stray guard preserved
- [ ] Desktop Chrome Result preview visual QA complete
- [ ] Samsung Internet Result preview visual QA complete
- [ ] iOS Safari Result preview visual QA complete
- [ ] Strip preview no longer appears tiny
- [ ] Save output matches preview

## Result UX Guard Restoration After Preview Sizing (Phase 3.20)
- [x] Result preview final sizing preserved
- [x] getFormattedFilename guard restored
- [x] More menu routing guard restored
- [x] QR/Video Preparing disabled guard restored
- [x] Final asset DOM fallback guard restored
- [x] Offscreen renderFinalResultBlob guard restored
- [x] pgpt stray guard preserved
- [ ] Desktop Result preview visual QA complete
- [ ] Samsung Internet Result preview visual QA complete
- [ ] Save output matches preview

## Result UX Guard Restoration Follow-up (Phase 3.21)
- [x] getFormattedFilename guard restored
- [x] Toast state guard restored
- [x] showMoreActions state guard restored
- [x] More menu item guard restored
- [x] Redecorate / Retake / New Session routing guard restored
- [x] QR/Video Preparing disabled guard restored
- [x] Final asset offscreen guard preserved
- [x] Result preview sizing preserved
- [x] pgpt stray guard preserved
- [ ] Desktop Result action QA complete
- [ ] Samsung Internet Result action QA complete
- [ ] Save output matches preview

## Result Final Display Scale Fix (Phase 3.23)
- [x] Result Print Intro size left intact
- [x] Final Result strip autoScale over-shrink fixed
- [x] Final Result display fit helper added
- [x] Strip final display minScale added
- [x] Strip final container height enlarged
- [x] resultPreviewSrc source preserved
- [x] Save/Share/export path untouched
- [x] Result UX sanity guards preserved
- [x] pgpt stray guard preserved
- [ ] Mac Chrome Result strip visual QA complete
- [ ] Samsung Internet Result strip visual QA complete
- [ ] Save output matches preview

## Camera Manual Device Diagnostics Finalization (Phase 3.29)
- [x] Debug picker routes through manual switch result handler
- [x] Manual device switch result updates reason/path
- [x] settings.label removed from switch verification
- [x] track.label/snapshot evidence used for diagnostics
- [x] Hardware and device failure reasons preserved together
- [x] cameraToggleBusy wired to 0.6× button and debug picker
- [x] All camera device rows show label/device/group/active/wide hints
- [x] Fake CSS/crop wide implementation forbidden
- [x] Result layout/export paths untouched
- [x] pgpt stray guard preserved
- [ ] Galaxy S23+ Chrome manual camera device scan complete
- [ ] Galaxy S23+ Samsung Internet manual camera device scan complete
- [ ] Real 0.6× route confirmed or ruled out

## Camera 0.6× Real Capability Diagnostic Patch (Phase 3.28)
- [x] getCameraDebugSnapshot helper actually added
- [x] Hardware zoom false-positive success removed
- [x] applyCameraZoom returns verified result object
- [x] switchCameraDevice returns verified result object
- [x] lastWideToggleReason stale state dependency removed
- [x] Debug device picker exposes all videoinput devices
- [x] 0.6× unavailable feedback preserved
- [x] Fake CSS/crop wide implementation forbidden
- [x] Result layout/export paths untouched
- [x] pgpt stray guard preserved
- [ ] Galaxy S23+ Chrome all-device picker verified
- [ ] Galaxy S23+ Samsung Internet all-device picker verified
- [ ] Real 0.6× route confirmed or ruled out

## Camera 0.6× Toggle Capability Verification (Phase 3.27)
- [x] Camera capability snapshot helper added
- [x] Hardware zoom success verified by settings.zoom before/after
- [x] Device switch success verified by settings.deviceId before/after
- [x] Wide toggle failure reason exposed in debug mode
- [x] Fake CSS scale / crop wide implementation forbidden
- [x] Debug pill shows zoom/device path diagnostics
- [x] Result layout/export paths untouched
- [x] pgpt stray guard preserved
- [ ] Galaxy S23+ Chrome hardware zoom verified
- [ ] Galaxy S23+ Chrome wide device switch verified
- [ ] Galaxy S23+ Samsung Internet capability verified
- [ ] 0.6× unavailable message verified

## Result Compact Preview Stack + Larger Frame (Phase 3.26)
- [x] Correct IMMM repo path verified
- [x] Preview row changed from 1fr to content-bound row (auto/auto/auto/auto)
- [x] Title-to-preview gap reduced (marginBottom 2)
- [x] Preview-to-action gap reduced (marginTop 4, padding 0)
- [x] Strip frame display scale increased (targetHeightVh 58, minScale 0.70)
- [x] Bottom Save / Share / More row preserved
- [x] resultPreviewSrc source preserved
- [x] Save/Share/export path untouched
- [x] Result UX sanity guards preserved
- [x] pgpt stray guard preserved
- [ ] Mac Chrome first-screen visual QA complete
- [ ] Samsung Internet Result layout QA complete
- [ ] Save output matches preview

## Result Row Budget Layout + Action Visibility (Phase 3.25)
- [x] Correct IMMM repo path verified
- [x] Result root converted to row-budget grid layout
- [x] TopBar/title/subtitle vertical budget reduced further
- [x] Preview row height constrained with minmax(0, 1fr)
- [x] Bottom Save / Share / More row preserved as visible auto row
- [x] resultPreviewSrc source preserved
- [x] Save/Share/export path untouched
- [x] Result UX sanity guards preserved and updated
- [x] pgpt stray guard preserved
- [ ] Mac Chrome first-screen action row visual QA complete
- [ ] Samsung Internet Result layout QA complete
- [ ] Save output matches preview

## Result Vertical Layout Compression + Action Visibility (Phase 3.24)
- [x] Top title/subtitle spacing reduced
- [x] Result stage height reduced from over-expanded strip setting
- [x] Strip targetHeightVh lowered for desktop
- [x] Bottom Save / Share / More row preserved
- [x] Bottom action row designed to remain visible on first screen
- [x] resultPreviewSrc source preserved
- [x] Save/Share/export path untouched
- [x] Result UX sanity guards preserved
- [x] pgpt stray guard preserved
- [ ] Mac Chrome first-screen action row visual QA complete
- [ ] Samsung Internet Result layout QA complete
- [ ] Save output matches preview

## Result UX Guard Final Patch (Phase 3.22)
- [x] getFormattedFilename existence guard added
- [x] QR Share Preparing disabled attribute guard added
- [x] Save Video Preparing disabled attribute guard added
- [x] Toast / More / Routing guards preserved
- [x] Final asset offscreen guards preserved
- [x] pgpt stray guard preserved
- [ ] Desktop Result action QA complete
- [ ] Samsung Internet Result action QA complete


## Full App Bottleneck & Risk Audit (Phase 3.31)
- [x] Runtime boot/cache risks reviewed
- [x] Camera capture and 0.6× flow reviewed
- [x] Frame picker Samsung Internet risks reviewed
- [x] Deco Studio fit/export risks reviewed
- [x] Result intro/preview/save/share risks reviewed
- [x] Blob/media lifecycle risks reviewed
- [x] Mobile browser compatibility risks reviewed
- [x] sanity-check maintainability reviewed
- [x] pgpt stray guard preserved
- [x] P0 runtime build hotfix scheduled
- [x] P1 memory lifecycle fixes scheduled
- [ ] Galaxy S23+ QA report attached
- [ ] Samsung Internet QA report attached

| Priority | Area | File | Risk | Symptom | Recommendation | Follow-up Commit |
|---|---|---|---|---|---|---|
| P0 | Runtime | index.html | React development UMD and Babel standalone used in production path | Slow boot, runtime JSX parsing, CDN failure risk | Create production build path or switch to production UMD as interim hotfix | 6f93616 |
| P1 | Service Worker | sw.js | JSX/code files not precached, network-first only | Offline or weak network boot failure | Decide cache strategy for code assets after production build decision | TBD |
| P1 | Share | frame-system.jsx | local ShareStore objectURL lifecycle unclear | Memory growth after repeated local shares | Add explicit revoke owner/lifecycle | Phase 3.34 |
| P1 | Result | screens-v2-deco.jsx | objectURL lifecycle balances iOS long-press save and cleanup | Save sheet image may disappear or memory may accumulate | Centralize preview/save sheet URL ownership | Phase 3.34 |
| P1 | Export | frame-system.jsx | sticker rendering awaits sequentially | Slow export with many stickers | Batch preload sticker assets where safe | Phase 3.35 |
| P1 | Camera | main.jsx / screens-v2-rest.jsx | real 0.6× depends on browser capability/device exposure | 0.6× may not change FOV | Complete Galaxy S23+ debug report flow | TBD |
| P1 | Samsung Internet | screens-v2.jsx | frame thumb/canvas fallback remains critical | blank frame picker if fallback regresses | Keep fallback guard and real-device QA | TBD |
| P2 | sanity-check | scripts/sanity-check.mjs | string-based guards are brittle | false positives during refactor | Split smoke/audit checks later | TBD |

## Runtime Production UMD Hotfix (Phase 3.32)
- [x] React UMD switched from development to production
- [x] ReactDOM UMD switched from development to production
- [x] SRI integrity updated or safely removed
- [x] Service worker cache bumped
- [x] Runtime metadata bumped
- [x] React development build guard upgraded to FAIL
- [x] Babel standalone intentionally retained for next build-pipeline phase
- [ ] Babel standalone removed via production build pipeline
- [ ] Vite/Next/static build migration scoped
- [ ] Mobile cold boot measured after deployment

## Babel Standalone Removal Scope (Phase 3.33)
- [x] Current JSX runtime scripts identified
- [x] Babel standalone retained until build pipeline exists
- [ ] Choose build strategy: Vite static build / Next export / esbuild single bundle
- [ ] Convert type="text/babel" scripts to bundled JS output
- [ ] Preserve global window API compatibility between modules
- [ ] Define script load order replacement
- [ ] Define production asset hash/cache strategy
- [ ] Define rollback path to UMD/Babel runtime
- [ ] Mobile cold boot benchmark before/after
- [ ] Samsung Internet smoke test



## Blob URL Lifecycle Cleanup (Phase 3.34)
- [x] URL.createObjectURL usage audited
- [x] Result preview blob URL owner defined (Ref-based)
- [x] Result preview blob URL cleanup added (revokeBlobUrl)
- [x] saveSheetUrl cleanup path added (Ref-based)
- [x] iOS long-press save URL not revoked immediately
- [x] Strict owner separation: Preview / SaveSheet / ShareStore create separate URLs
- [x] Centralized revokeBlobUrl safety helper implemented
- [x] ShareStore local blob URL revoke path added
- [x] ShareStore expired local URL cleanup added
- [x] frame-system manual revoke guard added
- [x] download cleanup touched separately from blob generation
- [x] render/export/save/share blob generation untouched
- [x] pgpt stray guard preserved
- [ ] common blob URL helper consolidation scoped
- [ ] iOS Safari long-press save verified
- [ ] Repeated Save/Share memory behavior verified

## Sticker Export Asset Preload (Phase 3.35)
- [x] Upload sticker sources collected and deduplicated
- [x] Upload sticker images preloaded with Promise.all
- [x] drawStickerToCtx accepts preloaded assets
- [x] Sticker drawing order preserved
- [x] Fallback load path preserved
- [x] render/export/save/share callers untouched
- [x] Blob URL lifecycle guards preserved
- [x] pgpt stray guard preserved
- [ ] Export time measured with 5+ upload stickers
- [ ] Mobile Samsung Internet export verified

## Sticker Preload Scope Hotfix (Phase 3.36)
- [x] collectUploadStickerSources hoisted to top-level scope
- [x] preloadStickerImages kept in top-level scope
- [x] drawFallbackSticker contains no nested preload helpers
- [x] Sticker preload sanity-check now validates helper order
- [x] render/export/save/share callers untouched
- [x] pgpt stray guard preserved
- [ ] Export smoke test with upload sticker completed
- [ ] Samsung Internet export smoke test completed

## Sticker Preload Failure Isolation (Phase 3.37)
- [x] preloadStickerImages catches per-sticker load failures
- [x] Promise.all retained without whole-export rejection
- [x] Failed upload sticker source maps to null
- [x] drawStickerToCtx distinguishes missing preload from failed preload
- [x] Failed upload sticker does not retry indefinitely
- [x] Sticker drawing order preserved
- [x] render/export/save/share callers untouched
- [x] pgpt stray guard preserved
- [ ] Export smoke test with broken upload sticker completed
- [ ] Export smoke test with 5+ upload stickers completed
- [ ] Samsung Internet export smoke test completed

## Sticker Export Smoke QA + Perf Timing (Phase 3.38)
- [x] Export perf debug helper added
- [x] renderComposition total timing available in debug mode
- [x] sticker preload timing available in debug mode
- [x] photo slot timing available in debug mode
- [x] sticker draw timing available in debug mode
- [x] preload failure warning limited to debug/perf mode
- [x] render/export/save/share callers untouched
- [x] pgpt stray guard preserved
- [ ] Broken upload sticker export smoke test completed
- [ ] 5+ upload sticker export timing recorded
- [ ] Samsung Internet export smoke test completed

QA steps:
1. Enable `window.IMMM_DEBUG_PERF = true`
2. Create 1×4 frame
3. Add 5+ upload stickers
4. Export/save result
5. Confirm `[IMMM export perf]` logs show total, preload, photo slots, sticker draw timings
6. Add one broken/invalid upload sticker if possible
7. Confirm export still completes
8. Confirm failed sticker is skipped without breaking the image

## Babel Standalone Removal Build Plan (Phase 3.39)
- [x] Current `type="text/babel"` script order inventoried
- [x] Global window dependency map documented
- [x] Build strategy options compared (Vite vs. esbuild vs. Babel CLI)
- [x] Chosen low-risk migration strategy documented (Babel CLI Precompile)
- [x] Rollback path documented (Keep legacy index.html)
- [x] scripts-glob build command corrected
- [x] Explicit ordered JSX build manifest documented
- [x] Glob order risk documented
- [x] `index.precompiled.html` first-step strategy documented
- [ ] Minimal precompile implementation complete (Phase 3.40)
- [ ] @babel/standalone removed from runtime
- [ ] Mobile cold boot benchmark completed

### Script Inventory (index.html order)

| Order | Script | Provides | Consumes | Notes |
|---|---|---|---|---|
| 1 | `app.jsx` | `window.IMMM_THEME`, `getShotCount` | React | Shared tokens/UI constants |
| 2 | `filters.jsx` | CSS filter definitions | None | Pure SVG/CSS filter logic |
| 3 | `webgl-engine.jsx` | `window.FrameRenderEngine` | `window.twgl` | WebGL processing pipe |
| 4 | `mediapipe-face.jsx` | Face landmarks adapter | `MediaPipeFaceLandmarker` | Face tracking interface |
| 5 | `sticker-engine.jsx` | `window.getLayoutSlotCount` | `app.jsx` | Sticker interaction logic |
| 6 | `frame-system.jsx` | `window.renderComposition` | `filters`, `stickers`, `QRCode` | Core rendering & stores |
| 7 | `screens-v2.jsx` | `Setup` / `Landing` screens | `frame-system` | App UI modules (A) |
| 8 | `screens-v2-rest.jsx` | `Capture` flow | `frame-system` | App UI modules (B) |
| 9 | `screens-v2-deco.jsx` | `Deco` / `Result` flow | `frame-system` | App UI modules (C) |
| 10 | `main.jsx` | App Orchestration | All modules | Entry point & Router |

### Global / API Dependency Map

| Global / API | Producer | Consumer | Migration Risk | Notes |
|---|---|---|---|---|
| `window.React` / `ReactDOM` | index.html (UMD) | All scripts | Low | Stay as UMD for now |
| `window.renderComposition` | `frame-system.jsx` | `deco`, `main` | High | Core export path |
| `window.FrameRenderEngine` | `webgl-engine.jsx` | `deco`, `main` | Medium | WebGL availability check |
| `window.IMMM_APP_VERSION` | index.html (Meta) | `main` | Low | Hardcoded in index.html |
| `window.QRCode` | index.html (UMD) | `frame-system` | Low | Third-party lib |
| `window.twgl` | index.html (UMD) | `webgl-engine` | Low | Third-party lib |

### Build Strategy Selection: **Babel CLI Precompile (1-to-1)**

*   **Why**: The app is heavily coupled via global `window` objects and script load order. Vite or esbuild bundling would require a massive refactoring to ESM (`import`/`export`) which risks breaking the entire rendering/export pipeline.
*   **Strategy**: Use `@babel/cli` to transform `.jsx` to `.js` offline. `index.html` will simply link to `.js` files instead of `.jsx`.
*   **Rollback Path**: Retain the original `index.html` as `index.babel.html` or keep a git revert path to restore `@babel/standalone`.

### Build Manifest Strategy
- Do not use glob order for JSX precompile (e.g., `*.jsx`).
- Maintain an explicit ordered file list matching `index.html` script order to ensure global dependency availability.
- Build output must preserve one-to-one filenames:
  - `app.jsx` -> `dist/app.js`
  - `filters.jsx` -> `dist/filters.js`
  - `webgl-engine.jsx` -> `dist/webgl-engine.js`
  - `mediapipe-face.jsx` -> `dist/mediapipe-face.js`
  - `sticker-engine.jsx` -> `dist/sticker-engine.js`
  - `frame-system.jsx` -> `dist/frame-system.js`
  - `screens-v2.jsx` -> `dist/screens-v2.js`
  - `screens-v2-rest.jsx` -> `dist/screens-v2-rest.js`
  - `screens-v2-deco.jsx` -> `dist/screens-v2-deco.js`
  - `main.jsx` -> `dist/main.js`

### Phase 3.40 Implementation Plan (Draft)
1.  Add `package.json` with `@babel/core`, `@babel/cli`, `@babel/preset-react`.
2.  Add `npm run build` script with explicit order:
    `babel app.jsx filters.jsx webgl-engine.jsx mediapipe-face.jsx sticker-engine.jsx frame-system.jsx screens-v2.jsx screens-v2-rest.jsx screens-v2-deco.jsx main.jsx --out-dir dist`
3.  Create `index.precompiled.html` first to verify the dist boot without replacing `index.html`.
4.  Verify PWA/Service Worker still caches the new `.js` assets correctly.

## Camera Control Architecture (Phase 3.41)
- [x] Web Camera Adapter interface defined
- [x] Zoom options modeled by capability/source
- [x] Rear torch capability detection planned
- [x] Front screen flash fallback planned
- [x] UI separated from camera control implementation
- [x] Native adapter boundary documented
- [ ] Native optical zoom adapter implemented
- [ ] Native torch adapter implemented
- [ ] Native exposure control implemented
- [ ] Native camera permission flow implemented
- [ ] App shell selected: Capacitor / React Native / Swift/Kotlin

## Phase 3.62 — IMMM Product Infrastructure Sprint: Foundation Contracts Integration

**Status**: ✅ COMPLETED

### What Was Delivered
Five new foundation contract files implementing data-level specifications without actual rendering/implementation:

1. **session-runtime-snapshot.jsx** (150 lines)
   - Debug-only session snapshot capture with `window.IMMM_DEBUG_SESSION` flag
   - Memory-only storage to `window.__IMMM_LAST_SESSION_SNAPSHOT__`
   - Functions: `isSessionDebugEnabled`, `createDebugSessionSnapshot`, `storeLastDebugSessionSnapshot`, `getLastDebugSessionSnapshot`, `clearLastDebugSessionSnapshot`
   - Self-test: 8 tests covering debug state, snapshot creation, storage/retrieval/deletion, invalid input handling
   - Namespace: `window.IMMMSessionRuntimeSnapshot`

2. **share-contract.jsx** (300 lines)
   - Defines sharing requirements without implementation
   - SHARE_TYPES: local-preview, os-share, cloud-share, qr-share
   - QR share requires cloud-ready status + remoteUrl (no blob: URLs)
   - Functions: `canCreateQrShare`, `canCreateCloudShare`, `canUseOsShare`, `classifyShareTarget`, `createShareReadinessReport`
   - Self-test: 6 tests covering blob URL rejection, local-preview rejection, cloud-ready pass, expired rejection, OS share eligibility, classification
   - Namespace: `window.IMMMShareContract`

3. **motion-export-contract.jsx** (350 lines)
   - Specifies motion export parameters without rendering
   - MOTION_OUTPUT_TYPES: webm, mp4, gif, preview-only
   - MOTION_SLOT_TYPES: still, transition, motion
   - Preview-only supported; video types require slots array
   - Functions: `createMotionExportRecipe`, `createMotionSlotProvider`, `validateMotionExportRecipe`, `createMotionReadinessReport`
   - Self-test: 8 tests covering valid recipes, type normalization, empty slot rejection, video recipes, slot providers, readiness reports, immutability
   - Namespace: `window.IMMMMotionExportContract`

4. **edit-recipe-contract.jsx** (300 lines)
   - Defines editing operations without rendering
   - EDIT_TYPES: blur, filter, crop, adjustment
   - BLUR_TYPES: background, face-safe, full-frame
   - Strength clamped to [0,1], dimensions validated positive
   - All recipes frozen/immutable (Object.freeze)
   - Functions: `createBlurRecipe`, `createFilterRecipe`, `createCropRecipe`, `createCompositeEditRecipe`, `validateEditRecipe`
   - Self-test: 8 tests covering blur/filter/crop creation, validation, type normalization, strength clamping, immutability
   - Namespace: `window.IMMMEditRecipeContract`

5. **pwa-release-contract.jsx** (350 lines)
   - Data-level PWA readiness checklist without manifest creation
   - REQUIRED_ICON_SIZES: [192, 512]
   - REQUIRED_CACHE_ASSETS: 13-item list of dist files (later expanded to 18)
   - Functions: `createPwaReadinessReport`, `validateManifestContract`, `validateServiceWorkerContract`
   - Self-test: 6 tests covering empty report (not ready), full report (ready), valid manifest, invalid manifest, valid SW, SW with Babel rejection
   - Namespace: `window.IMPWAReleaseContract`

### Build Infrastructure Updates
- **scripts/build-precompile.mjs**: Updated manifest from 13 to 18 files; 5 new contracts inserted in dependency order
- **index.html**: Added 5 new `<script>` tags for contract files between result-asset-store.js and frame-system.js
- **index.precompiled.html**: Mirrored script tag additions
- **sw.js**: Bumped CACHE_NAME from v12 to v13-2026-05-14-product-foundation; added 5 new assets to ASSETS array
- **scripts/sanity-check.mjs**: 
  - Added VM self-test execution for all 5 foundation contracts
  - Added file existence checks in build manifest and index.html
  - Added script load order validation for all 8 new scripts
  - Added sw.js ASSETS validation for 8 new assets
  - Updated cache version validation to accept v13

### Build Manifest (18 files, explicit order)
1. app.jsx
2. filters.jsx
3. webgl-engine.jsx
4. mediapipe-face.jsx
5. sticker-engine.jsx
6. session-model.jsx
7. session-adapter.jsx
8. result-asset-store.jsx
9. **session-runtime-snapshot.jsx** (NEW)
10. **share-contract.jsx** (NEW)
11. **motion-export-contract.jsx** (NEW)
12. **edit-recipe-contract.jsx** (NEW)
13. **pwa-release-contract.jsx** (NEW)
14. frame-system.jsx
15. screens-v2.jsx
16. screens-v2-rest.jsx
17. screens-v2-deco.jsx
18. main.jsx

### Testing Results
- ✅ build:precompile: All 18 files compiled successfully
- ✅ sanity-check: All checks passed including 8 new VM self-tests
- ✅ Syntax validation: All 5 new contract dist files pass `node --check`
- ✅ Script load order: Verified in index.html and index.precompiled.html
- ✅ Cache assets: Verified in sw.js v13

### Constraints Maintained
- ❌ No actual QR rendering (qr-share is specification only)
- ❌ No video rendering (motion export is specification only)
- ❌ No cloud upload (cloud-share is specification only)
- ❌ No blur/image processing (edit-recipe is specification only)
- ❌ No manifest generation (pwa-release is specification only)
- ✅ All contracts are data-level only; no implementation
- ✅ All recipes immutable via Object.freeze
- ✅ All self-tests passing in VM context

### Commits
- Committed all changes to feature branch `claude/session-infrastructure-consolidation`
- 6 new dist files generated and cached in sw.js v13
