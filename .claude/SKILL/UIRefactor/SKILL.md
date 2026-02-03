# UIRefactor - UI 모듈화 스킬

## 개요
App.jsx의 코드를 모듈화하여 가독성과 유지보수성을 높이고, Claude의 토큰 사용량을 최적화하는 워크플로우.

## 적용 시점
- App.jsx가 **500줄 초과** 시 검토
- 현재: ~850줄 → 분리 필요

---

## 모듈화 원칙

### 1. CDN 환경 제약
- import/export 사용 불가
- 모든 모듈은 **글로벌 스코프**에 정의
- `index.html`에서 스크립트 로드 순서 관리

### 2. 분리 기준
| 기준 | 분리 대상 |
|------|----------|
| **80줄 이상** | 독립 파일로 분리 |
| **재사용 가능** | 커스텀 훅으로 추출 |
| **독립적 렌더링** | 별도 컴포넌트로 분리 |

### 3. 파일 명명 규칙
- 커스텀 훅: `use{Feature}.js` (예: `useDragAndDrop.js`)
- 렌더 컴포넌트: `{Name}Renderer.jsx` (예: `TowerRenderer.jsx`)
- 패널/섹션: `{Name}Panel.jsx` (예: `InventoryPanel.jsx`)

---

## 분리 후보 분석 (현재 App.jsx)

### 커스텀 훅 (로직 분리)

#### 1. useDragAndDrop.js (~80줄)
```javascript
// 분리 대상 함수
- handleDragStart()
- handleDragMove()
- handleDragEnd()
- 관련 상태: draggingNeon, dragPosition, isDragging, dropPreview

// 글로벌 정의
const useDragAndDrop = (dependencies) => {
  // 훅 로직
  return { handlers, state };
};
```

#### 2. useCheatConsole.js (~60줄)
```javascript
// 분리 대상 함수
- executeCheatCommand()
- handleCheatSubmit()
- 관련 상태: showCheat, cheatInput, cheatHistory

const useCheatConsole = (gameSetters) => {
  return { state, handlers };
};
```

#### 3. useSupportTower.js (~100줄)
```javascript
// 분리 대상 함수
- toggleSupportInventorySelect()
- toggleSupportTowerSelect()
- drawRandomSupport()
- combineSupports()
- combineAllSupports()
- combineSupportTowers()
- sellSelectedSupportTowers()
- 관련 상태: supportInventory, selectedSupportInventory, supportTowers, selectedSupportTowers

const useSupportTower = (gold, setGold) => {
  return { state, handlers, computed };
};
```

### 렌더 컴포넌트 (UI 분리)

#### 4. TowerRenderer.jsx (~50줄)
```jsx
// 타워 렌더링 로직
const TowerRenderer = ({ towers, selectedTowers, onSelect }) => {
  return towers.map(tower => (
    // 타워 + 범위 + 상태 아이콘 렌더링
  ));
};
```

#### 5. SupportTowerRenderer.jsx (~40줄)
```jsx
// 서포트 타워 렌더링 (육각형)
const SupportTowerRenderer = ({ supportTowers, selectedSupportTowers, onSelect }) => {
  return supportTowers.map(support => (
    // 육각형 + 점선 범위 렌더링
  ));
};
```

#### 6. EnemyRenderer.jsx (~40줄)
```jsx
// 적 렌더링 로직
const EnemyRenderer = ({ enemies }) => {
  return enemies.map(enemy => (
    // 적 + 체력바 + 상태이상 아이콘 렌더링
  ));
};
```

#### 7. InventoryPanel.jsx (~80줄)
```jsx
// 인벤토리 + 서포트 인벤토리 패널
const InventoryPanel = ({ inventory, supportInventory, ... }) => {
  return (
    // 그리드 + 아이템 렌더링
  );
};
```

---

## 구현 워크플로우

### Phase 1: 준비
1. 분리할 코드 블록 식별
2. 의존성 분석 (어떤 상태/함수 필요한지)
3. 인터페이스 설계 (파라미터, 반환값)

### Phase 2: 추출
```javascript
// 1. 새 파일 생성 (예: js/hooks/useDragAndDrop.js)
const useDragAndDrop = (mapRef, pathData, towers, supportTowers, callbacks) => {
  const [draggingNeon, setDraggingNeon] = useState(null);
  // ... 로직 이동

  return {
    draggingNeon,
    dragPosition,
    isDragging,
    dropPreview,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  };
};

// 2. index.html에 스크립트 추가
<script src="js/hooks/useDragAndDrop.js"></script>

// 3. App.jsx에서 사용
const dragDrop = useDragAndDrop(mapRef, pathData, towers, supportTowers, {
  setTowers, setInventory, setSupportTowers, setSupportInventory,
  toggleInventorySelect, toggleSupportInventorySelect
});
```

### Phase 3: 검증
- 기존 기능 정상 동작 확인
- 콘솔 에러 없음 확인
- 스크립트 로드 순서 확인

---

## 스크립트 로드 순서

```html
<!-- index.html -->
<!-- 1. 의존성 없는 유틸리티 -->
<script src="js/utils.js"></script>
<script src="js/constants.js"></script>

<!-- 2. 시스템 모듈 -->
<script src="js/sound.js"></script>
<script src="js/enemy.js"></script>
<script src="js/tower.js"></script>
<script src="js/game-engine.js"></script>

<!-- 3. 커스텀 훅 (선택적) -->
<script src="js/hooks/useDragAndDrop.js"></script>
<script src="js/hooks/useCheatConsole.js"></script>
<script src="js/hooks/useSupportTower.js"></script>

<!-- 4. 렌더 컴포넌트 (선택적) -->
<script type="text/babel" src="js/components/TowerRenderer.jsx"></script>
<script type="text/babel" src="js/components/EnemyRenderer.jsx"></script>

<!-- 5. 메인 앱 (마지막) -->
<script type="text/babel" src="js/App.jsx"></script>
```

---

## 토큰 최적화 효과

### 분리 전
- App.jsx 전체 읽기: ~850줄 = 많은 토큰 소비

### 분리 후
| 파일 | 라인 수 | 읽기 빈도 |
|------|--------|----------|
| App.jsx (코어) | ~400줄 | 높음 |
| useDragAndDrop.js | ~80줄 | 낮음 |
| useCheatConsole.js | ~60줄 | 낮음 |
| useSupportTower.js | ~100줄 | 중간 |
| TowerRenderer.jsx | ~50줄 | 낮음 |
| EnemyRenderer.jsx | ~40줄 | 낮음 |

**장점**:
- 필요한 파일만 선택적으로 읽기 가능
- Grep으로 함수 위치 빠르게 파악
- 변경 범위 최소화

---

## 체크리스트

### 모듈 분리 시
- [ ] 의존성 분석 완료
- [ ] 글로벌 스코프에 정의
- [ ] index.html에 스크립트 추가 (순서 확인)
- [ ] App.jsx에서 기존 코드 제거
- [ ] 새 모듈 import/사용
- [ ] 기존 기능 테스트
- [ ] CLAUDE.md 파일 구조 업데이트
