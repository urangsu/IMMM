# IMMM Photobooth Development Task List (task.md)

---

## ⚡ 현재 개발 상태 (Current Status)

- **노출 필터 (6종)**: `No Filter`, `Porcelain` (자연광), `Smooth` (크림 스킨), `Blush` (첫사랑), `Purikura` (하라주쿠), `Grain` (필름)
- **주요 수정 완료**: 폴라로이드 크롭 가이드라인 정확화, 필터 전환 잔상 제거, 얼굴 주변 왜곡(jaw warp) 완전 제거.

---

## 💎 HD 품질 정책 (HD Quality Policy)

- **Camera input**: 가능한 경우 1920x1080 ideal로 요청, 실패 시 1280x720/facingMode only fallback (main.jsx 적용 완료)
- **Preview**: CSS 크기 * devicePixelRatio (cap 2.0) backing store 적용 (webgl-engine.jsx 적용 완료)
- **Capture still**: 기본 long edge 2560 (Desktop) / 1920 (Mobile) 적용 (screens-v2-rest.jsx 적용 완료)
- **Frame export**: Desktop scale 4, Mobile scale 3, 실패 시 scale 2 fallback (screens-v2-deco.jsx 적용 완료)
- **Filter**: WebGL 단계에서 한 번만 적용, 중복 후처리(applyCapturedFilterLook) 금지 (최적화 완료)
- **Beauty geometry**: 턱/볼/눈 등 모든 기하학적 변형 로직 재도입 절대 금지
- **Softening**: `applyFaceZoneSoftening` 재활성화 금지 (피부 뭉개짐 방지)

---

## 🚫 절대 금지 사항 (Prohibitions)

- **얼굴 변형 금지**: 모든 기하학적 변형(Geometry Warp) 재도입 금지.
- **신규 필터 추가 금지**: 현재 6종 필터 체계 유지 (y2k, aurora, seoul 등 추가 계획 폐기).
- **빌드 시스템 변경 금지**: 현재의 단일 HTML + CDN 기반 구조 유지 (Vite/Next.js 마이그레이션 금지).
- **저장 화질 훼손 금지**: `applyCapturedFilterLook` 중복 적용으로 인한 화질 저하 방지.

---

## 🔴 우선순위: HIGH (실기 QA 및 안정성)

- [ ] **Samsung Internet 1080p 검증**: 삼성 인터넷 브라우저에서 1080p 카메라 스트림 요청 시 프레임 드랍이나 블랙 스크린이 발생하는지 확인.
- [ ] **모바일 메모리 안정성 테스트**: 2560px 캡처 및 Scale 3.0 저장 시 저사양 기기(iPhone 12 이하, 보급형 Android)에서 브라우저 크래시 여부 확인.
- [ ] **Export Fallback 작동 확인**: 고해상도 저장 실패 시 자동으로 Scale 2.0으로 전환되어 저장이 성공하는지 검증.
- [ ] **폴라로이드 가이드 일치성**: 뷰파인더 가이드 영역과 실제 저장된 1:1 사진 영역의 픽셀 단위 일치 최종 확인.

---

## 🟠 우선순위: MEDIUM (UI/UX 폴리싱)

- [ ] **필터 전환 애니메이션**: 0.08s 트랜지션의 기기별 매끄러움 확인.
- [ ] **스티커 레이어 안정화**: Deco 화면 스티커 조작 감도 및 Z-index 점검.
- [ ] **카메라 권한 거부 대응**: 사용자 가이드 UI 추가.

---

## ✅ 완료 기록 (Completed History)

- [x] **카메라 3단계 Fallback**: 1080p -> 720p -> 기본 권한 순으로 안정적 연결.
- [x] **티어드 고해상도 저장**: Desktop(4.0), Mobile(3.0), Fallback(2.0) 파이프라인 구축.
- [x] **폴라로이드 가이드 고도화**: 실제 슬롯 비율 기반 Dim 레이어 가이드 구현.
- [x] **얼굴형 보정 로직 제거**: `applyBeautyGeometry` 완전 제거 및 no-op 처리.

---

## 📜 Legacy / Historical Notes

- PWA 설치 자산 추가 (manifest, icon)
- 미리보기 High-DPI 대응 (devicePixelRatio)
- 필터 전환 잔상 제거 (`firstFrame` 리셋)
- 재촬영 시 이전 사진 섞임 문제 해결 (SelectV2 초기화)
- (과거) 셰이더 6개 및 필터 파이프라인 전면 재구성
- (과거) 드로잉 성능 최적화 및 Sparkle 브러시 추가
