# IMMM Product Direction & Task List (task.md)

---

## 1. Product North Star
IMMM은 SNOW 복제 앱이 아니라, 설치 없이 웹에서 바로 찍는 **고화질 감성 포토부스**다.
핵심 가치는 빠른 카메라, 자연스러운 필터, 정확한 프레임, 고화질 저장, 모바일 안정성이다.

## 2. Current Visible Filters (6종)
- `original` / No Filter / 노 필터
- `porcelain` / Window Light / 자연광
- `smooth` / Cream Skin / 크림 스킨
- `blush` / First Love / 첫사랑
- `grain` / Soft Film / 소프트 필름
- `bw` / BW / 흑백
- **주요 수정 완료**: 
  - [x] 폴라로이드 크롭 가이드라인 정확화
  - [x] 필터 전환 잔상 제거
  - [x] 얼굴 주변 왜곡(jaw warp) 완전 제거
  - [x] HD capture fallback 하드닝 (tiered resolution)

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
