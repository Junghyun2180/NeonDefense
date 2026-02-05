# 저장/불러오기 시스템 통합 가이드

## 개요
PLAN 2 (로컬 저장 + 밸런스 조정) 구현을 위한 App.jsx 통합 가이드입니다.

---

## ✅ 완료된 작업

### 1. 밸런스 조정 (`constants.js`)
```javascript
// ✅ 완료
- 체력 스케일링: stageGrowth 0.45 → 0.38
- 경제: 시작 골드 120G, 웨이브 보상 +25%
- 적 물량: 80% 수준으로 감소
- 스테이지 수: 10 → 8
- Fast 적 확률: 0.8 → 0.6
```

### 2. 저장 시스템 (`js/save-system.js`)
```javascript
// ✅ 완료
- SaveSystem.save(gameState)
- SaveSystem.load()
- SaveSystem.restoreGameState(saveData, gameState)
- 자동 저장 (30초 간격)
```

### 3. UI 컴포넌트
```javascript
// ✅ 완료
- SaveLoadModal.jsx (시작 모달 + 스테이지 클리어 옵션)
- useSaveLoad.jsx (저장/불러오기 훅)
```

---

## 🔧 App.jsx 통합 단계

### Step 1: useSaveLoad 훅 추가

App.jsx `NeonDefense` 컴포넌트 시작 부분에 추가:

```jsx
const NeonDefense = () => {
  // ===== 게임 상태 훅 =====
  const gameState = useGameState();

  // ===== 저장/불러오기 훅 (추가) =====
  const saveLoadState = useSaveLoad(gameState);
  const { gameStarted, loadedData } = saveLoadState;

  // ... 나머지 코드
};
```

### Step 2: 불러온 데이터 적용

`gameState` 훅 호출 후, 불러온 데이터가 있으면 적용:

```jsx
// useGameState 호출 후
const gameState = useGameState();
const {
  stage, setStage,
  wave, setWave,
  gold, setGold,
  lives, setLives,
  towers, setTowers,
  supportTowers, setSupportTowers,
  inventory, setInventory,
  supportInventory, setSupportInventory,
  permanentBuffs, setPermanentBuffs,
  gameStats, setGameStats,
  // ... 기타 필요한 상태들
} = gameState;

// 저장/불러오기 훅
const saveLoadState = useSaveLoad({
  stage, wave, gold, lives,
  towers, supportTowers,
  inventory, supportInventory,
  permanentBuffs, stats: gameStats,
  // ... 기타 상태
});

const { gameStarted, loadedData } = saveLoadState;

// 불러온 데이터 적용
useEffect(() => {
  if (!loadedData) return;

  console.log('[App] 저장 데이터 적용 중...');

  // 타워 복원
  const restoredTowers = loadedData.towers.map(tData => {
    const tower = TowerSystem.create(tData.tier, tData.colorIndex);
    tower.id = tData.id;
    tower.x = tData.x;
    tower.y = tData.y;
    tower.abilityType = tData.abilityType;
    tower.role = tData.role;
    tower.lastShot = Date.now();
    return tower;
  });

  // 서포트 타워 복원
  const restoredSupports = loadedData.supportTowers.map(sData => {
    const support = TowerSystem.createSupport(sData.tier, sData.supportType);
    support.id = sData.id;
    support.x = sData.x;
    support.y = sData.y;
    support.abilityType = sData.abilityType;
    return support;
  });

  // 상태 업데이트
  setStage(loadedData.stage);
  setWave(loadedData.wave);
  setGold(loadedData.gold);
  setLives(loadedData.lives);
  setTowers(restoredTowers);
  setSupportTowers(restoredSupports);
  setInventory(loadedData.inventory);
  setSupportInventory(loadedData.supportInventory);
  setPermanentBuffs(loadedData.permanentBuffs);
  setGameStats(loadedData.stats);

  console.log('[App] 저장 데이터 적용 완료');
}, [loadedData]);
```

### Step 3: 모달 렌더링

`return` 부분에 모달 추가:

```jsx
return (
  <div className="...">
    {/* 저장/불러오기 모달 (추가) */}
    <SaveLoadModal
      show={saveLoadState.showSaveLoadModal}
      mode={saveLoadState.saveLoadMode}
      onNewGame={saveLoadState.handleNewGame}
      onLoadGame={saveLoadState.handleLoadGame}
      onSaveAndQuit={saveLoadState.handleSaveAndQuit}
      onContinue={saveLoadState.handleContinue}
      saveInfo={saveLoadState.saveInfo}
    />

    {/* 기존 UI - gameStarted가 true일 때만 표시 */}
    {saveLoadState.gameStarted && (
      <>
        <GameHeader ... />
        <GameMap ... />
        {/* ... 나머지 컴포넌트 */}
      </>
    )}
  </div>
);
```

### Step 4: 스테이지 클리어 시 저장 옵션

`CarryoverModal` 완료 후 또는 스테이지 전환 시 저장 옵션 표시:

```jsx
// useEffect에서 스테이지 클리어 감지
useEffect(() => {
  // 스테이지 클리어 조건
  if (/* 스테이지 클리어 조건 */) {
    // 버프 선택 후 저장 옵션 표시
    // (선택사항: 매 스테이지마다 또는 특정 조건)

    // saveLoadState.showStageClearSaveOption();
  }
}, [stage, wave]);
```

---

## 📝 추가 통합 옵션

### 치트 콘솔에 저장 명령어 추가

`useCheatConsole.jsx`에 추가:

```javascript
case 'save':
  saveLoadState.manualSave();
  return '게임 저장 완료';
```

### 헤더에 저장 버튼 추가 (선택사항)

`GameHeader.jsx`에 버튼 추가:

```jsx
<button
  onClick={() => saveLoadState.manualSave()}
  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded"
  title="수동 저장"
>
  💾
</button>
```

---

## 🧪 테스트 체크리스트

### 기본 동작
- [ ] 첫 실행 시 "새 게임 시작" 모달 표시
- [ ] 새 게임 시작 시 초기 상태로 시작
- [ ] 게임 중 자동 저장 (30초)
- [ ] 페이지 새로고침 후 "이어하기" 옵션 표시
- [ ] 이어하기 시 저장된 상태 정확히 복원

### 상태 복원 검증
- [ ] 스테이지/웨이브 정확히 복원
- [ ] 골드/목숨 정확히 복원
- [ ] 타워 위치/티어/속성 정확히 복원
- [ ] 서포트 타워 위치/티어 정확히 복원
- [ ] 인벤토리 아이템 정확히 복원
- [ ] 영구 버프 정확히 복원
- [ ] 통계 정확히 복원

### 에지 케이스
- [ ] localStorage 용량 초과 시 처리
- [ ] 손상된 저장 데이터 감지 및 처리
- [ ] 버전 불일치 저장 데이터 처리
- [ ] 여러 탭에서 동시 플레이 (마지막 저장 우선)

---

## 🚀 간단한 통합 방법 (최소 수정)

복잡한 통합이 부담스럽다면 간단한 방법:

### 1단계: 게임 시작 시 불러오기만 추가

```jsx
// App.jsx 시작 부분
useEffect(() => {
  const saveInfo = SaveSystem.getSaveInfo();

  if (saveInfo && confirm(`저장된 게임이 있습니다 (Stage ${saveInfo.stage}). 이어하시겠습니까?`)) {
    const saveData = SaveSystem.load();
    // 상태 복원 로직 (위 Step 2 참고)
  }
}, []);
```

### 2단계: 치트 콘솔에 저장/불러오기 명령어만 추가

```javascript
// useCheatConsole.jsx
case 'save':
  SaveSystem.save(gameState);
  return '저장 완료';

case 'load':
  const data = SaveSystem.load();
  // 복원 로직
  return '불러오기 완료';
```

이 방법은 UI 없이 치트 콘솔로만 저장/불러오기 가능합니다.

---

## 💡 개선 아이디어 (추후)

### 멀티 슬롯 저장
```javascript
SaveSystem.save(gameState, slotIndex); // 슬롯 1~3
SaveSystem.load(slotIndex);
```

### 클라우드 저장 (Firebase)
```javascript
await CloudSave.upload(gameState, userId);
await CloudSave.download(userId);
```

### 자동 백업
```javascript
SaveSystem.createBackup(); // 이전 버전 복구용
SaveSystem.restoreBackup(timestamp);
```

---

## 🐛 알려진 이슈

### Issue #1: Ability 재생성
- **문제**: 불러오기 시 Ability 객체가 재생성되어야 함
- **해결**: `TowerSystem.create()` 사용 (자동으로 Ability 할당됨)
- **상태**: ✅ 해결 (save-system.js에 구현됨)

### Issue #2: 시간 정보 초기화
- **문제**: `lastShot` 같은 시간 정보는 저장하지 않음
- **해결**: 불러올 때 `Date.now()`로 초기화
- **상태**: ✅ 해결

### Issue #3: 경로 데이터 복원
- **문제**: `pathData`는 시드 기반이라 저장 불필요
- **해결**: 스테이지 번호만 저장, 불러올 때 재생성
- **상태**: ⚠️ 추가 구현 필요 (선택사항)

---

## 📊 저장 데이터 크기

```
예상 크기 (JSON):
- 타워 10개: ~2KB
- 인벤토리 30개: ~1.5KB
- 기타 상태: ~0.5KB
---
총합: ~4KB (localStorage 5MB 제한 대비 0.08%)
```

100회 저장해도 400KB로 충분히 여유로움.

---

## 🔄 마이그레이션 전략

버전 업데이트 시:

```javascript
// save-system.js에서 버전 처리
if (saveData.version === 1) {
  // v1 데이터 마이그레이션
  saveData = migrateV1toV2(saveData);
}
```

---

**작성일**: 2026-02-05
**버전**: 1.0
**상태**: 구현 완료, 통합 대기
