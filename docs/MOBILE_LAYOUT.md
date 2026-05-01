# PC/Mobile UI 분리 가이드

> 인-게임 레이아웃을 데스크톱과 모바일 가로(landscape)에서 **별도 컴포넌트 + 별도 인라인 토큰 + 클래스 스코프 한정 CSS** 로 분리한 구조.
> 작성일: 2026-05-01 / 관련 커밋: [bec0b51](../../../commit/bec0b51), [5984d8a](../../../commit/5984d8a), [f146cf0](../../../commit/f146cf0), [fdb17b2](../../../commit/fdb17b2), [6e80a33](../../../commit/6e80a33), [c17e798](../../../commit/c17e798)

---

## 1. 핵심 원칙 (요약)

| 원칙 | 설명 |
|---|---|
| **단일 마운트 (single ternary)** | `App.jsx` 에서 `isMobileLandscape ? <MobileGameLayout/> : <DesktopGrid/>` 형태로 한쪽만 마운트. 두 레이아웃 동시 마운트 금지 (mapContainerRef ResizeObserver 경쟁 방지). |
| **슬롯 패턴** | element 인스턴스를 prop 으로 주입 → React reconciliation 으로 데스크톱/모바일 전환 시 컴포넌트 상태 유지. |
| **CSS 클래스 스코프 한정** | 모바일용 CSS 는 `.nd-mobile-grid` 안에서만 적용 (`holo-tokens.css §13`). 데스크톱에 영향 없음. |
| **`!important` 사용 금지** | 인라인 스타일은 §13 CSS 로 못 이김. 컴포넌트에 `compact` prop 추가해서 인라인 토큰 자체를 바꿀 것. |
| **비율 기반 좌표** | 좌표 변환은 `mapScale` 나눗셈이 아니라 `rect.width/height` 비율로. anisotropic stretch 에서도 정확. |

---

## 2. 파일 인벤토리

| 역할 | 경로 | 비고 |
|---|---|---|
| 모바일 감지 | [js/hooks/useMobileLayout.jsx](../js/hooks/useMobileLayout.jsx) | `isMobileLandscape` boolean 반환 |
| 모바일 전용 레이아웃 | [js/components/mobile/MobileGameLayout.jsx](../js/components/mobile/MobileGameLayout.jsx) | 슬롯 패턴 + col 1 sub-grid (waveSide \| mapCell) + uniform scale |
| 모바일 CSS | [css/holo-tokens.css §13](../css/holo-tokens.css) | `.nd-mobile-grid` 스코프 한정 |
| 좌표 변환 | [js/hooks/useDragAndDrop.jsx](../js/hooks/useDragAndDrop.jsx) | `handleClickPlacementMouseMove` — 비율 기반 |
| 마운트 분기 | [js/App.jsx](../js/App.jsx) | `isMobileLandscape ? ... : ...` 단일 삼항 |
| `compact` prop 컴포넌트 | [CommandBar.jsx](../js/components/CommandBar.jsx), [WaveInfoBar.jsx](../js/components/WaveInfoBar.jsx) | 인라인 스타일을 compact 모드로 전환 |
| `narrow` prop 컴포넌트 | [WaveInfoBar.jsx](../js/components/WaveInfoBar.jsx) | 좁은 세로 패널용 (좌측 letterbox 자리) — flex column, 줄바꿈, 적 chip 2-col grid |
| `showUnit/showBuffs/showSkills` 분기 | [ControlPanel.jsx](../js/components/ControlPanel.jsx) | 모바일에서 섹션을 좌/우로 분리 마운트 (default = all true: 데스크톱 호환) |
| 데스크톱 그리드 fallback | App.jsx 내부 (mapContainerRef + map 슬롯 포함 div) | `isMobileLandscape === false` 일 때 |

---

## 3. 레이아웃 구조 (모바일 가로)

```
nd-mobile-grid
  gridTemplateColumns: minmax(0, 1fr) | 200px
  gridTemplateRows:    auto | minmax(0, 1fr)
  padding: 4, gap: 6, height: 100vh

  ┌─ ROW1 col1 header(GameHeader) ─────────┬─ col2 commandBar(compact) ─┐
  │                                         │                            │
  │ ROW2 col1 sub-grid:                    │  col2 right rail (action)  │
  │   [leftSide 180px | mapCell 1fr]       │   ControlPanel             │
  │   leftSide stack (info):               │     · SELECTED UNIT only   │
  │     ├ WaveInfoBar (narrow)             │   + InventoryPanel         │
  │     ├ ActiveBuffs (left-aux)           │                            │
  │     └ CommanderSkills (left-aux)       │                            │
  │   mapCell: uniform scale, flex center  │                            │
  └─────────────────────────────────────────┴────────────────────────────┘
```

좌측 = 정보 영역 (waves + buffs + skills) / 우측 = 액션 영역 (selection + inventory) / 가운데 = 맵.

### 맵 uniform scale 원리
1. `App.jsx` `mapContainerRef` 가 mapCell 의 cw 측정 → `mapScale = min(1, cw / MAP_WIDTH)` (isotropic).
2. `GameMap` 은 mapScale 적용해 `MAP_W × mapScale × MAP_H × mapScale` 자연 크기로 렌더.
3. `MobileGameLayout` 내부에서 자체 `ResizeObserver` 로 mapCell cw/ch 측정.
4. `stretchX = cw/naturalW`, `stretchY = ch/naturalH` 계산 후 `uniformScale = Math.min(...)` 채택.
5. wrapper 에 `transform: scale(uniform)` + flex 센터링 → 종횡비 보존, 남는 영역은 양쪽 (혹은 위/아래) 균등 분배.

### 좌측 leftSide 패널 — 정보 모음
180px 고정 폭 flex column 으로 3개 패널 stack:
- **WaveInfoBar (narrow)** — `narrow=true` prop. flex-direction: column, stage·wave 2줄 라벨, 적 chip 은 **2-column grid** (세로 overflow 방지), AUTO 토글은 하단 stretch.
- **ActiveBuffs** — `<ControlPanel showUnit={false} showBuffs showSkills={false} />`
- **CommanderSkills** — 같은 `<ControlPanel ...>` 인스턴스의 SKILLS 섹션.

좌측 패널 마운트는 `slots.waveInfo` + `slots.leftAuxPanel` 두 슬롯으로 주입 (App.jsx 가 두 ControlPanel 인스턴스 분리 생성).

### 우측 레일 — 액션 모음
- 폭 200px (이전 240px 에서 축소; deploy 버튼/SELECTED UNIT 자동 축소).
- ControlPanel: `showBuffs={false} showSkills={false}` (SELECTED UNIT 만).
- InventoryPanel: 기존 그대로.

---

## 4. `compact` prop 패턴

**문제**: `CommandBar`, `WaveInfoBar` 같은 컴포넌트는 인라인 `style={{...}}` 로 padding/font-size 를 박아둠. 인라인 스타일은 `!important` 없이는 CSS 가 못 덮음.

**해결**: 컴포넌트에 `compact` prop 추가하고, `z` 토큰 객체로 모든 인라인 값을 한곳에서 분기.

```jsx
const z = {
    panelPadding: compact ? '4px 8px' : '10px 14px',
    deployPad:    compact ? '5px 8px' : '14px',
    deployFont:   compact ? 10 : 14,
    // ...
};
```

App.jsx:
```jsx
<CommandBar compact={isMobileLandscape} ... />
<WaveInfoBar compact ... />  // 모바일 슬롯에만 마운트
```

### 새 컴포넌트가 모바일에서도 쓰이면
1. 인라인 스타일이 있는지 확인.
2. 인라인 스타일이 있으면 → `compact` prop 추가하고 `z` 토큰으로 분기.
3. 클래스 기반이면 → `holo-tokens.css §13` 에 `.nd-mobile-grid .my-class { ... }` 로 추가.

---

## 5. 좌표 변환 (드롭 프리뷰 / 클릭 배치)

### 잘못된 방식 (깨짐)
```js
// mapScale 나눗셈 — anisotropic stretch 에서 부정확
const x = (e.clientX - rect.left) / mapScale;
const gridX = Math.floor(x / TILE_SIZE);
```

### 올바른 방식 (anisotropic OK)
```js
// 비율 × MAP 논리 크기 — desktop/mobile 모두 정확
if (rect.width <= 0 || rect.height <= 0) return;
const xLogical = ((e.clientX - rect.left) / rect.width)  * GRID_WIDTH  * TILE_SIZE;
const yLogical = ((e.clientY - rect.top)  / rect.height) * GRID_HEIGHT * TILE_SIZE;
const gridX = Math.floor(xLogical / TILE_SIZE);
```

이유: `rect.width` 는 transform 적용 후 실제 보이는 크기라서, `mapScale` 단일 비율보다 일반적이다 (anisotropic 도 자동으로 처리됨).

---

## 6. CSS 스코프 룰

`holo-tokens.css §13` 안의 모든 룰은 `.nd-mobile-grid` 로 시작:

```css
.nd-mobile-grid .nd-topbar-panel { padding: 2px 6px; gap: 4px; }
.nd-mobile-grid .nd-vital__lbl { font-size: 7px; line-height: 1; }
```

### 금지
- `!important` — 인라인 스타일을 덮으려고 시도 금지. 대신 `compact` prop 추가.
- 전역 셀렉터 (`.nd-vital__lbl { ... }`) — 데스크톱에 영향감.

### 허용
- 클래스 스코프 한정 (`.nd-mobile-grid X { ... }`).
- 미디어 쿼리 무관 (마운트 분기로 이미 모바일만 적용됨).

---

## 7. 흔한 함정 (Don'ts)

| 함정 | 결과 | 올바른 대응 |
|---|---|---|
| 두 레이아웃 동시 마운트 (`{isMobile && <Mobile/>}{!isMobile && <Desktop/>}`) | mapContainerRef 가 두 곳에서 attach/detach 반복 → ResizeObserver 경쟁 | 단일 삼항: `isMobile ? <Mobile/> : <Desktop/>` |
| 좌표 계산에 `mapScale` 나눗셈 | anisotropic stretch 에서 클릭 위치 어긋남 | `rect.width/height` 비율 기반 |
| 인라인 스타일을 §13 CSS 로 덮기 시도 | 인라인이 우선순위 더 높음 → 안 먹음 | 컴포넌트에 `compact` prop 추가 |
| `!important` 사용 | 디자인 토큰 시스템 일관성 깨짐 | 클래스 스코프 또는 `compact` prop |
| 모바일 전용 컴포넌트를 `js/components/` 루트에 직접 둠 | 데스크톱/모바일 경계 흐려짐 | `js/components/mobile/` 하위에 |

---

## 8. 새 인-게임 UI 추가할 때 체크리스트

1. [ ] 데스크톱과 모바일에 모두 보일 컴포넌트인가?
2. [ ] (예) 인라인 스타일이 있으면 `compact` prop + `z` 토큰 패턴으로.
3. [ ] (예) 클래스 기반이면 `holo-tokens.css §13` 에 `.nd-mobile-grid X` 룰 추가.
4. [ ] App.jsx 에서 데스크톱/모바일 양쪽 슬롯에 같은 element 인스턴스 (또는 동일한 props 의 새 인스턴스) 주입.
5. [ ] 모바일 가로 (1170×540 등) 에서 헤더/푸터 height, 클릭 좌표 검증.
6. [ ] `!important` 안 썼는지 확인.

---

## 9. 측정 기준값 (1170×540 viewport)

(2026-05-01 기준, 변경 시 갱신 필요)

| 영역 | 측정값 |
|---|---:|
| nd-mobile-grid 전체 | 540px |
| 헤더 (row 1) | 60px |
| col 1 row 2 sub-grid 전체 | 956 × 466 |
| leftSide (Wave + Buffs + Skills) | 180 × 466 |
| 맵 cell (sub-grid 우측) | 772 × 466 |
| 맵 visible (uniform scale 0.805) | 621 × 466 |
| 우측 레일 (col 2 row 2) | 200 × 466 |

회귀 감지 룰
- row 1 height >80px → **CommandBar deploy 의 compact 모드 진입 실패** 의심. App.jsx 의 `compact={isMobileLandscape}` 점검.
- 맵 stretch 가 anisotropic (X≠Y 양쪽 모두 1 미만 등) → **MobileGameLayout 의 `mapScale` prop 누락** 의심. App.jsx 의 `<MobileGameLayout mapScale={mapScale} />` 점검.
- fillRatio.y < 0.95 또는 fillRatio.x = 1 인데 visible 폭이 cell 폭과 같음 → uniform scale 이 아니라 stretch(X=1, Y<1) 로 돌아감. `Math.min(stretchX, stretchY)` 로직 깨졌는지 점검.
