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

---

## 🚀 Phase B — WebGL Skin Retouch Roadmap

- [x] PR 1 — 문서/설계 초안
- [ ] PR 2 — Desktop-only experimental skin_retouch shader compile validation
- [ ] PR 3 — 실제 face mask 또는 안정적인 procedural mask 검증
- [ ] PR 4 — 필터별 strength 연결
- [ ] PR 5 — Mobile opt-in 실기 QA

- 현재 skin_retouch (procedural color-threshold retouch experiment)는 experimental flag (`window.IMMM_ENABLE_EXPERIMENTAL_SKIN_RETOUCH = true`)가 있어야만 켜지며, 기본 제품 경로에서는 비활성화한다.
