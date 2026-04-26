# IMMM Web Photobooth - 개발 일지 (Devlog)

---

## 2026-04-27 (v2.1) — Background Engine 예열 & WebGL 안정성 강화

### 기술적 변화: Before vs. After

| 항목 | 기존 방식 (v2.0) | 개선 방식 (v2.1) | 효과 |
|------|-----------------|-----------------|------|
| **엔진 생명주기** | `CaptureV2` 진입 시 생성/파괴 | **App 레벨 상시 가동** (Pre-warming) | 촬영 진입 시 딜레이/깜빡임 0ms |
| **카메라 스트림** | 화면 전환 시마다 stream 재연결 | **App 레벨 persistent stream** | 카메라 초기화 지연 및 블랙 플래시 제거 |
| **셰이더 실패 대응** | 실패 시 검은색(0,0,0) 출력 | **성공한 마지막 텍스처 유지** (Fallback) | 필터 오류 시에도 화면이 검게 변하지 않음 |
| **FBO 파이프라인** | 핑퐁 버퍼 인덱스 충돌 (Feedback loop) | **FBO[2] 활용 독립 쓰기 경로** | halation 계열 필터의 검은 화면 원천 차단 |
| **코드 호환성** | 주석 등 비-ASCII 문자 포함 | **순수 ASCII 셰이더/엔진 코드** | 삼성 GPU 드라이버/GLES 컴파일러 충돌 방지 |

### 상세 구현 내용

#### 1. Background Engine Pre-warming (`main.jsx`)
- `useFilterEngine`을 `App` 루트 컴포넌트로 이동하여 웹 접속 즉시 셰이더 컴파일 및 렌더 루프 시작.
- `<video>`, `<canvas>` 엘리먼트를 `App` 레벨에서 영구 보존. `CaptureV2`는 이를 투명하게 비춰주는 역할만 수행.

#### 2. Shader Fail-safe 로직 (`webgl-engine.jsx`)
- `_pass()` 함수가 성공 여부(`boolean`)를 반환하도록 변경.
- 파이프라인 연산 중 특정 단계(예: `halation_v`)가 실패할 경우, 해당 단계를 건너뛰고 **이전 단계의 결과물(`curTex`)을 그대로 다음으로 전달**하도록 로직 수정.

#### 3. FBO Feedback Loop 해결
- `halation_comp` 단계에서 읽기 버퍼와 쓰기 버퍼가 동일해지는 `idx` 계산 오류 수정. 이제 연산 결과는 항상 독립적인 `FBO[2]`에 기록된 후 다음 패스로 전달됨.

---

## 2026-04-26 (v2) — Samsung 블랙 스크린 근본 원인 수정

### Root Cause 확정 및 수정

#### Root Cause A — CSS `filter`를 `<video>` 엘리먼트에 직접 적용 (`screens-v2-rest.jsx`)
Samsung Internet GPU 컴포지터는 `<video>`에 CSS `filter` 속성이 붙으면 GPU 하드웨어 디코딩 경로에서 빠져나와 CPU 소프트웨어 컴포지팅 경로로 전환한다. 이 경로에서는 WebGL `texImage2D(video)`가 비디오 픽셀을 읽지 못하고 검은 픽셀(0,0,0)을 반환 → WebGL이 90프레임 내내 검은 텍스처를 렌더링.

**수정**: CSS `filter`를 video 엘리먼트에서 완전 제거. wrapper `<div>`로 이동하되, `webglOk === false` (WebGL 완전 실패) 상태에서만 적용.
```jsx
// 이전 (Samsung 블랙 스크린 원인)
<video style={{ filter: canvasActive ? 'none' : filterCss }} />

// 이후 (WebGL 워밍업 중에는 filter 없음, 실패 시에만 적용)
<div style={{ filter: !webglOk ? filterCss : 'none' }}>
  <video style={{ /* filter 속성 없음 */ }} />
</div>
```

#### Root Cause B — Hard timeout이 `firstFrame` 강제 발동 (`webgl-engine.jsx`)
240프레임(4초) 후 `shouldSwitch = true` 강제 발동 → 검은 WebGL canvas가 정상 비디오를 덮음.

**수정**: Hard timeout 완전 제거. 대신 `onWebglFail` 콜백 패턴 도입.
- `readPixels` 정상 작동 + 90프레임 검은 픽셀 → WebGL 텍스처 업로드 실패 확정 → `onWebglFail()` 호출
- `readPixels` 자체가 throw (보안 정책) → 렌더링 실패 아님 → 45프레임 후 `firstFrame` 정상 발동
- `onWebglFail` 발동 시: engine 파괴, `webglOk = false` → 영구 CSS 모드

#### 추가: `webkit-playsinline` attribute
Samsung Internet / iOS WebView에서 인라인 재생을 보장하기 위해 `videoRef.current.setAttribute('webkit-playsinline', '')` 추가.

### 동작 시나리오 (수정 후)
| 상황 | 결과 |
|------|------|
| WebGL 성공, 카메라 워밍업 중 (0~1.5s) | video 표시 (filter 없음, 허용) |
| WebGL 성공, firstFrame 발동 | WebGL canvas 표시, 필터 적용 ✅ |
| Samsung Root Cause A 제거 후에도 texImage2D 실패 시 | 90프레임 → onWebglFail → CSS 모드 ✅ (블랙 없음) |
| WebGL 완전 실패 확정 | video + CSS filter div 표시 ✅ |

---

## 2026-04-26 — 필터 완전 재구현 + 인스타그래머블 업그레이드 + 버그 3개 수정

### 구현 완료 항목

#### 1. webgl-engine.jsx — 새 GLSL 셰이더 6개 추가

| 셰이더 | 역할 |
|--------|------|
| `halation` | 14-tap 크로스 커널로 밝은 영역에서 붉은 빛이 번지는 코닥 필름 효과. `readPixels` 기반 밝기 샘플링 → screen blend |
| `split_tone` | 루미넌스 기반으로 그림자는 쿨톤, 하이라이트는 웜톤 분리. `smoothstep` 보간 |
| `film_grain_v2` | `floor(u_time * 24.0)` 로 24fps 타이밍 변환. 미드톤 마스킹(shadows/highlights 약하게). 프레임마다 다른 진짜 그레인 |
| `vignette` | `pow(1 - dot(uv,uv) * strength, 1.8)` 독립 비네트. 모든 필터에 선택적으로 붙임 |
| `chromatic_ab` | RGB 채널을 가장자리 방향으로 각각 오프셋. `normalize(center + 0.0001)` 0벡터 방지 |
| `y2k` (재작성) | CRT 모니터 + 디지털카메라 2002 시뮬. 사이언-블루 캐스트 + 하이라이트 날림 + 인라인 색수차 + 스캔라인 + 블랙 리프트 |

- 기존 3줄짜리 y2k 셰이더 완전 폐기 및 재작성
- 모든 새 셰이더 GLSL ES 1.0 호환 (`precision mediump float`, 상수 루프 경계, WebGL 1.0 only)

#### 2. webgl-engine.jsx — FILTER_PIPELINES 전면 재구성

- `grain` (코닥): `classic_neg` → `halation` → `film_grain_v2` → `vignette`
- `vintage` (엄마 앨범): `kodak_portra` → `halation` → `split_tone` → `film_grain_v2` → `vignette`
- `bw` (한강 새벽): `ilford_hp5` → `film_grain_v2` → `vignette`
- `dream` (새벽 두 시): bilateral 2-pass → `dream` → `split_tone` → `chromatic_ab` → `vignette`
- `y2k` (2002): `y2k` → `chromatic_ab` → `film_grain_v2`
- `golden` (골든아워): `kodak_portra` → `split_tone` → `halation` → `color_adjust` → `vignette`
- `lomo` (로모): `classic_neg` → `chromatic_ab` → `split_tone` → `film_grain_v2` → `vignette`
- `glitter` (반짝): `color_adjust` → `glitter` → `halation`
- `u_time` 주입 범위 확장: `glitter` 외 `film_grain_v2`도 매 프레임 u_time 자동 주입

#### 3. filters.jsx — 필터 전면 개편

- 필터명 한국어 감성 이름으로 전면 교체: `자연광`, `크림 스킨`, `첫사랑`, `하라주쿠`, `코닥`, `엄마 앨범`, `골든아워`, `2002`, `새벽 두 시`, `한강 새벽`, `반짝`, `로모`
- `dream` 키가 FILTERS 객체에 누락되어 필터 UI에 안 뜨던 버그 수정 (FILTER_PIPELINES에는 있었음)
- 신규 필터 2개 추가: `golden` (골든아워), `lomo` (로모)
- CSS fallback `oklch()` → `hsl()` / `hsla()` 전체 교체 (Samsung Internet 15 이하 호환)

#### 4. index.html — CDN + 애니메이션

- canvas-confetti 1.9.3 CDN 추가
- `@keyframes polaroidReveal` 추가 (흔들리며 나타나는 폴라로이드 효과)

#### 5. screens-v2-deco.jsx — ResultV2 폴라로이드 + confetti

- 결과 화면 프레임 진입 애니메이션 `popIn` → `polaroidReveal` 교체 (모바일/데스크톱 양쪽)
- `handleDownload` Web Share API 성공 경로 + anchor 폴백 경로 양쪽에 confetti 추가 (`#D98893` 핑크 테마)

---

### 버그 수정

#### 버그 1 — Samsung Mobile Web 블랙 스크린 재발 (`webgl-engine.jsx`)

**원인 확정:** `readPixels`가 Samsung 보안 정책으로 예외를 던지면 → `catch` 블록에서 즉시(`renderedFrames >= 5`, ~83ms) `shouldSwitch = true` → 카메라 워밍업 전에 검은 WebGL 캔버스가 비디오 위를 덮음.

**수정:**
- `catch` 블록: `renderedFrames > 45` (≈0.75s) 이후에만 switch
- 하드 타임아웃: 90프레임 → **240프레임(≈4s)** 으로 연장 (실제 어두운 장면 오탐 방지)

#### 버그 2 — 드로잉 튕김 (`screens-v2-deco.jsx`)

**원인 확정:** `onDrawMove`에서 매 포인터 이벤트마다 `curPathElRef.current.getAttribute('d')`로 전체 SVG path 문자열을 DOM에서 읽기. 획이 길어질수록 O(n) 읽기+쓰기 반복 → 모바일에서 progressive jank.

**수정:**
- `curPathDRef = React.useRef('')` 추가 → path 문자열을 메모리에 직접 누적, `getAttribute` 완전 제거
- `e.preventDefault()` 추가 (드로잉 중 스크롤 인터셉트 방지)
- `e.touches ? e.touches[0] : e` — Touch/Pointer 이벤트 통합 처리
- `onTouchStart / onTouchMove / onTouchEnd` 핸들러 추가 (Samsung 구형 PointerEvent 미지원 대비)

#### 버그 3 — 영상 저장 안 됨 (`screens-v2-deco.jsx`)

**원인 확정:**
1. `rec.start()` timeslice 없음 → 일부 브라우저에서 `ondataavailable` 미발화
2. `URL.revokeObjectURL(a.href)` 를 `a.click()` 직후 즉시 호출 → 다운로드 시작 전 URL 만료
3. 모바일에서 비동기 `onstop` 콜백 내 `a.click()` = 팝업 차단

**수정:**
- `rec.start(200)` — 200ms timeslice 청크 점진적 수집
- `onstop`에서 `navigator.share` 먼저 시도 (모바일 네이티브 공유시트)
- `revokeObjectURL` → `setTimeout(..., 30000)` 30초 후 해제
- `mozCaptureStream` 지원 추가 (Firefox 호환)

---

## 이전 업데이트 사항

### 🐛 버그 수정 및 코드 통합 (Desktop 폴더 기준 최신화)
`/Users/su/Desktop/photobooth` 경로에 있던 최신 기능 및 버그 수정 사항을 현재 작업 중인 코드(`포토부스` 폴더)로 성공적으로 병합했습니다.

* **모바일 검은 화면(Black Screen) 버그 해결**: 
  * **원인**: 모바일에서 카메라 스트림(`getUserMedia`)을 불러오는 데 시간이 걸리는데, WebGL 컨텍스트가 생성되자마자 너무 일찍 비디오를 숨기고 빈 캔버스를 띄우는 것이 문제였습니다.
  * **해결 (가져온 파일: `webgl-engine.jsx`, `screens-v2-rest.jsx`)**: `webgl-engine.jsx`의 `useFilterEngine` 훅에 `firstFrame` 상태를 추가하여, **실제로 첫 프레임이 렌더링된 이후에만** `canvasActive` 상태를 활성화하도록 수정했습니다. 이제 카메라가 완전히 준비될 때까지 화면이 까맣게 나오지 않습니다.
* **랜딩 페이지 프레임 잔상(Ghost Box) 제거**:
  * **원인**: 랜딩 페이지의 프레임 이미지에 `transform: scale()`을 적용하면서 겉싸개 div의 그림자(box-shadow) 크기가 줄어들지 않아 겹쳐 보이던 현상입니다.
  * **해결**: CSS transform 대신 컴포넌트 자체의 `scale` 속성을 사용하도록 수정하여 그림자와 여백이 정확한 비율로 축소되도록 고쳤습니다.
* **삼성 인터넷(Samsung Internet) 브라우저 호환성 개선**:
  1. **비디오 렌더링 버그**: `overflow:hidden`과 `borderRadius`가 적용된 컨테이너 내부에서 비디오가 나오지 않는 문제를 해결하기 위해 부모의 제약 조건을 제거하고 비디오 엘리먼트에 직접 스타일을 적용했습니다.
  2. **WebGL 레이어 간섭**: 일부 모바일 브라우저에서 WebGL 캔버스가 비디오를 덮어 검은 화면이 나오는 문제를 방지하기 위해 모바일 환경에서는 WebGL 대신 CSS filter와 Canvas 2D 기반의 안정적인 렌더링 방식을 사용합니다.
  3. **카메라 권한 및 제약 조건 최적화**: `width`, `height`의 `ideal` 값이 삼성 인터넷에서 오류를 일으키는 현상을 발견하여 `facingMode: { ideal: 'user' }` 위주로 제약 조건을 단순화하여 연결 안정성을 높였습니다.
* **비디오 캡처 저장 기능 도입**:
  * **해결 (가져온 파일: `screens-v2-deco.jsx`)**: Desktop 버전에 추가되어 있던 Result 화면의 레이아웃 개선 사항과 함께 **.webm 동영상 다운로드 기능**을 그대로 도입했습니다.

### 🎨 디자인 및 UI (Graphify 업데이트)
* **유리 질감(Glassmorphism) 적용**: 사이드바, 상단 바, 프리뷰 영역 등에 `backdrop-filter: blur`를 적용하여 투명하고 고급스러운 Apple 스타일의 UI로 전면 개편했습니다.
* **메시 그라데이션 배경**: 단순한 흰색 배경을 없애고 `index.html`에 4-point 형태의 은은한 메시 그라데이션을 적용하여 화면의 깊이감을 더했습니다.
* **화면 전체 레이아웃 (Full-Screen) 수정**: 브라우저 창 하단이 비어 보이는 고질적인 버그를 해결했습니다. `html, body { height: 100%; overflow: hidden; }` 속성을 부여하여 뷰포트 전체를 사용하도록 수정했습니다.
* **랜딩 페이지 프레임 동기화**: 랜딩 페이지에서 보이는 프레임 샘플들을 하드코딩된 CSS 대신 실제 코어 앱에서 사용하는 `<FrameThumb>` 컴포넌트로 렌더링하여 디자인 일관성을 100% 맞췄습니다.

### 📸 핵심 기능 및 UX 개선
* **촬영 타이머 설정 기능**: 캡처 화면 하단에 `3초 / 5초` 타이머 토글 버튼을 추가하여 촬영 속도를 자유롭게 조절할 수 있습니다.
* **고화질 필터 미리보기**: 필터 탭의 썸네일을 단순한 그래픽이 아닌 실제 인물 사진(고화질 샘플)으로 교체하여, 각 필터가 피부톤에 어떻게 적용되는지 직관적으로 확인할 수 있게 되었습니다.
* **'원본(Original)' 필터 화사하게 보정**: 원본 필터에 미세한 보정값(`brightness(1.04)`, `contrast(0.96)`)을 추가하여 아무 필터를 씌우지 않아도 피부가 자연스럽고 화사하게 보이도록 개선했습니다.
* **모바일 촬영화면 최적화**: 모바일에서 촬영 시 카메라 뷰가 빈 공간 없이 세로로 꽉 차게 보이도록 `flex: 1` 설정을 개선했습니다.
* **2x2 프레임 선택 화면 복구**: 레이아웃 높이 문제가 해결됨에 따라 넓은 공간을 활용할 수 있게 되어, 한눈에 보기 편한 2x2 그리드 배열로 프레임 선택창을 롤백했습니다.
