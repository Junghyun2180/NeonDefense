# 메인 메뉴 통합 가이드

## 개요
게임 시작 전 메인 메뉴 화면을 App.jsx에 통합하는 가이드입니다.

---

## ✅ 완료된 작업

### 1. MainMenu 컴포넌트 (`js/components/MainMenu.jsx`)
```jsx
<MainMenu
  saveInfo={saveInfo}
  onNewGame={handleNewGame}
  onLoadGame={handleLoadGame}
  onSelectMode={(mode) => console.log(mode)}
/>
```

**기능**:
- ✅ 새 게임 시작 카드
- ✅ 이어하기 카드 (저장 데이터 있을 때)
- ✅ 저장 정보 미리보기 (Stage, Gold, Lives, 타워 수)
- ✅ 진행률 표시
- ✅ 게임 모드 선택 (캠페인 / 런 모드 - 추후)
- ✅ 게임 정보 표시
- ✅ 네온 테마 애니메이션

### 2. useSaveLoad 훅 업데이트
```javascript
// 추가된 반환 값
{
  showMainMenu,  // 메인 메뉴 표시 여부
  // ... 기존 값들
}
```

---

## 🔧 App.jsx 통합 방법

### Step 1: useSaveLoad 훅 사용

App.jsx `NeonDefense` 컴포넌트 시작 부분:

```jsx
const NeonDefense = () => {
  // ===== 게임 상태 훅 =====
  const gameState = useGameState();

  // ===== 저장/불러오기 훅 =====
  const saveLoadState = useSaveLoad(gameState);
  const {
    showMainMenu,
    gameStarted,
    loadedData,
    saveInfo,
    handleNewGame,
    handleLoadGame,
  } = saveLoadState;

  // ... 나머지 코드
};
```

### Step 2: 불러온 데이터 적용 (기존과 동일)

```jsx
// gameState에서 필요한 setter 함수들 추출
const {
  setStage, setWave, setGold, setLives,
  setTowers, setSupportTowers,
  setInventory, setSupportInventory,
  setPermanentBuffs, setGameStats,
} = gameState;

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

### Step 3: 메인 메뉴 렌더링

`return` 부분 수정:

```jsx
return (
  <div className="relative w-full h-screen overflow-hidden bg-gray-900">
    {/* 메인 메뉴 (게임 시작 전) */}
    {showMainMenu && (
      <MainMenu
        saveInfo={saveInfo}
        onNewGame={handleNewGame}
        onLoadGame={handleLoadGame}
        onSelectMode={(mode) => {
          console.log('[App] 게임 모드 선택:', mode);
          // 미래: 런 모드 지원 시 사용
        }}
      />
    )}

    {/* 기존 게임 UI (게임 시작 후) */}
    {gameStarted && !showMainMenu && (
      <>
        <GameHeader {...gameHeaderProps} />
        <GameMap {...gameMapProps} />
        <ControlPanel {...controlPanelProps} />
        {/* ... 나머지 컴포넌트 */}
      </>
    )}

    {/* 스테이지 클리어 저장 모달 (선택사항) */}
    <SaveLoadModal
      show={saveLoadState.showSaveLoadModal}
      mode={saveLoadState.saveLoadMode}
      onSaveAndQuit={saveLoadState.handleSaveAndQuit}
      onContinue={saveLoadState.handleContinue}
      saveInfo={saveInfo}
    />
  </div>
);
```

---

## 📋 통합 체크리스트

### 필수 작업
- [ ] App.jsx에 `useSaveLoad` 훅 추가
- [ ] `showMainMenu` 상태로 메인 메뉴 조건부 렌더링
- [ ] `gameStarted` 상태로 게임 UI 조건부 렌더링
- [ ] `loadedData` useEffect로 저장 데이터 복원
- [ ] `MainMenu` 컴포넌트 렌더링

### 선택 작업
- [ ] 스테이지 클리어 시 저장 옵션 표시
- [ ] 치트 콘솔에 저장/불러오기 명령어 추가
- [ ] 헤더에 수동 저장 버튼 추가

---

## 🎨 메인 메뉴 UI 특징

### 새 게임 카드
```
┌────────────────────────┐
│      [NEW 배지]         │
│        🆕              │
│    새 게임 시작         │
│                        │
│  📊 총 스테이지: 8개    │
│  ⏱️ 예상 시간: 50~70분  │
│  💾 자동 저장: 30초마다  │
│                        │
│  💡 언제든지 저장 가능   │
└────────────────────────┘
```

### 이어하기 카드 (저장 데이터 있을 때)
```
┌────────────────────────┐
│    [SAVED 배지]         │
│        💾              │
│      이어하기           │
│                        │
│  Stage 3 - Wave 2      │
│  2024/02/05 14:30      │
│                        │
│  💰 450G  ❤️ 18        │
│  🗼 8개   🛡️ 3개       │
│                        │
│  [진행률 바: 37%]       │
│                        │
│  💡 저장된 위치부터     │
└────────────────────────┘
```

### 애니메이션 효과
- ✅ 배경 그라디언트 펄스 애니메이션
- ✅ 카드 호버 시 스케일 + 그림자 효과
- ✅ 배지 바운스 애니메이션
- ✅ 진행률 바 트랜지션

---

## 🧪 테스트 시나리오

### 시나리오 1: 첫 실행
```
1. 브라우저 오픈
2. 메인 메뉴 표시 확인
3. "새 게임 시작" 클릭
4. 게임 화면 전환 확인
5. 게임 정상 시작 확인
```

### 시나리오 2: 저장 데이터 있을 때
```
1. 게임 플레이 (자동 저장 대기)
2. 페이지 새로고침
3. 메인 메뉴에서 "이어하기" 카드 확인
4. 저장 정보 정확한지 확인
5. "이어하기" 클릭
6. 저장된 상태로 복원 확인
```

### 시나리오 3: 새 게임 (저장 데이터 삭제)
```
1. 저장 데이터 있는 상태
2. "새 게임 시작" 클릭
3. 기존 저장 삭제 확인
4. 초기 상태로 시작 확인
```

### 시나리오 4: 타워 복원 검증
```
1. 타워 5개 배치 후 자동 저장
2. 페이지 새로고침
3. "이어하기" 클릭
4. 타워 위치/티어/속성 정확히 복원되는지 확인
```

---

## 💡 추가 개선 아이디어

### 단기
- [ ] 메인 메뉴 BGM 추가
- [ ] 저장 슬롯 여러 개 지원
- [ ] 최근 플레이 통계 표시

### 중기
- [ ] 런 모드 활성화
- [ ] 업적 시스템 연동
- [ ] 튜토리얼 진입점 추가

### 장기
- [ ] 멀티플레이 모드
- [ ] 리더보드 통합
- [ ] 클라우드 저장

---

## 🐛 알려진 이슈 및 해결

### Issue #1: 저장 데이터 복원 시 경로 불일치
**문제**: 불러온 스테이지의 경로가 재생성되지 않음
**해결**: `setPathData(generateMultiplePaths(Date.now(), loadedData.stage))`

### Issue #2: 인벤토리 참조 문제
**문제**: 불러온 인벤토리가 useInventory와 동기화 안됨
**해결**: useEffect에서 `setInventory` 호출

### Issue #3: 메인 메뉴 표시 타이밍
**문제**: 게임 중 새로고침 시 메인 메뉴가 깜빡임
**해결**: `gameStarted` 상태 우선순위 조정

---

## 📸 스크린샷 (예상)

### 메인 메뉴 (저장 데이터 없음)
```
┌─────────────────────────────────────┐
│   ⚡ NEON DEFENSE ⚡               │
│   Random Tower Defense × Roguelike  │
├─────────────────┬───────────────────┤
│  [새 게임]      │  [이어하기]       │
│  🆕 [NEW]       │  💾 (비활성)      │
│  활성화          │  비활성화          │
└─────────────────┴───────────────────┘
```

### 메인 메뉴 (저장 데이터 있음)
```
┌─────────────────────────────────────┐
│   ⚡ NEON DEFENSE ⚡               │
│   Random Tower Defense × Roguelike  │
├─────────────────┬───────────────────┤
│  [새 게임]      │  [이어하기]       │
│  🆕 [NEW]       │  💾 [SAVED]       │
│  활성화          │  Stage 3-2        │
│                 │  450G / 18 Lives  │
└─────────────────┴───────────────────┘
```

---

## 🚀 배포 전 체크리스트

### 코드
- [ ] MainMenu.jsx 문법 오류 없음
- [ ] useSaveLoad.jsx 업데이트 완료
- [ ] index.html에 컴포넌트 추가됨
- [ ] App.jsx 통합 완료

### 기능
- [ ] 메인 메뉴 정상 표시
- [ ] 새 게임 시작 동작
- [ ] 이어하기 동작
- [ ] 저장 데이터 복원 정확
- [ ] 자동 저장 동작

### UI/UX
- [ ] 반응형 디자인 (모바일 대응)
- [ ] 애니메이션 부드러움
- [ ] 네온 테마 일관성
- [ ] 로딩 시간 1초 이하

---

**작성일**: 2026-02-05
**버전**: 1.0
**상태**: 구현 완료, App.jsx 통합 대기
