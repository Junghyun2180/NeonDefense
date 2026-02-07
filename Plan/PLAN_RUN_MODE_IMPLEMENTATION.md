# Run Mode (로그라이크 런 모드) 구현 계획서

## Context
기존 캠페인 모드(10스테이지 x 5웨이브)에 더해, 짧은 런(5스테이지 x 3웨이브, 15~20분) 기반 로그라이크 모드를 추가한다. 메타 화폐(네온 크리스탈)로 영구 업그레이드를 구매하고, 일일 챌린지/무한 모드/업적/리더보드로 리플레이성을 높인다.

## 범위: Phase 1 + Phase 2
- **Phase 1**: Standard Run + 메타 화폐/업그레이드 + 런 결과 화면 + 메인 메뉴 통합
- **Phase 2**: Daily Challenge + Endless Mode + 업적 시스템 + 로컬 리더보드

## 저장 방식: 별도 localStorage 키
- 캠페인: `neonDefense_save_v1` (기존 유지)
- 런 메타: `neonDefense_runMeta_v1` (신규)
- 런 진행: `neonDefense_runSave_v1` (신규)
- 업적: `neonDefense_achievements_v1` (신규)
- 리더보드: `neonDefense_leaderboard_v1` (신규)

---

## 핵심 리팩토링: Config Injection

### 문제
`useGameState`와 `useGameLoop`가 `SPAWN`, `ECONOMY`, `CARRYOVER` 전역 상수를 직접 참조하므로, 런 모드에서 다른 값(3웨이브, 5스테이지 등)을 사용할 수 없다.

### 해결: configOverride 파라미터
`configOverride = null`이면 기존 캠페인과 동일하게 동작 (100% 역호환).

### useGameState.jsx 변경
```javascript
const useGameState = (configOverride = null) => {
  const cfg = {
    SPAWN: configOverride?.SPAWN || SPAWN,
    ECONOMY: configOverride?.ECONOMY || ECONOMY,
    CARRYOVER: configOverride?.CARRYOVER || CARRYOVER,
  };
  // 이후 모든 SPAWN → cfg.SPAWN, ECONOMY → cfg.ECONOMY 등으로 교체
};
```

**변경 대상 라인 (useGameState.jsx):**
- L6: `ECONOMY.startGold` → `cfg.ECONOMY.startGold`
- L7: `ECONOMY.startLives` → `cfg.ECONOMY.startLives`
- L43: `livesAtWaveStart.current = ECONOMY.startLives` → `cfg.ECONOMY.startLives`
- L117: `SPAWN.enemiesPerWave(stage, wave)` → `cfg.SPAWN.enemiesPerWave(stage, wave)`
- L132: `ECONOMY.waveReward(wave)` → `cfg.ECONOMY.waveReward(wave)`
- L155: `SPAWN.wavesPerStage` → `cfg.SPAWN.wavesPerStage`
- L160: `SPAWN.maxStage` → `cfg.SPAWN.maxStage`
- L176: `SPAWN.wavesPerStage` → `cfg.SPAWN.wavesPerStage`
- L231: `ECONOMY.startGold` → `cfg.ECONOMY.startGold`
- L232: `ECONOMY.startLives` → `cfg.ECONOMY.startLives`
- L295: `CARRYOVER.maxTowers` → `cfg.CARRYOVER.maxTowers`
- L308: `CARRYOVER.maxSupports` → `cfg.CARRYOVER.maxSupports`
- L378: `ECONOMY.stageClearBonus(stage)` → `cfg.ECONOMY.stageClearBonus(stage)`
- L388: `ECONOMY.startLives` → `cfg.ECONOMY.startLives`

### useGameLoop.jsx 변경
```javascript
const useGameLoop = (config) => {
  const { spawnConfig, ...rest } = config;
  const activeSPAWN = spawnConfig || SPAWN;
  // L45: SPAWN.enemiesPerWave → activeSPAWN.enemiesPerWave
  // L46: SPAWN.spawnDelay → activeSPAWN.spawnDelay
};
```

---

## 신규 파일 (11개)

### Phase 1 (7개)

#### 1. `js/run-mode-constants.js` (~120줄)
런 모드 전용 상수. 기존 constants.js와 동일한 패턴.

```javascript
const RUN_SPAWN = {
  wavesPerStage: 3,
  maxStage: 5,
  enemiesPerWave: (stage, wave) => Math.floor(12 + wave * 3 + stage * 6),
  spawnDelay: (stage, wave) => Math.max(100, 550 - stage * 60 - wave * 25),
};

const RUN_ECONOMY = {
  startGold: 80,
  startLives: 15,
  drawCost: 20,
  supportDrawCost: 40,
  maxInventory: 30,
  maxSupportInventory: 15,
  sellRefundRate: 0.5,
  towerBaseValues: { 1: 20, 2: 60, 3: 180, 4: 540 },
  supportBaseValues: { 1: 40, 2: 120, 3: 360 },
  waveReward: (wave) => 18 + wave * 5 + (wave === 3 ? 20 : 0),
  stageClearBonus: (stage) => 50 + stage * 12,
  bossGoldReward: (stage, wave) => 25 + stage * 8 + wave * 4,
};

const RUN_HEALTH_SCALING = {
  base: 35,
  stageGrowth: 0.65,
  waveGrowth: 0.45,
  lateWaveThreshold: 3,
  lateWaveBonus: 1.6,
  bossFormula: (stage) => 12 + stage * 2.5,
};

const RUN_CARRYOVER = {
  maxTowers: 3,
  maxSupports: 2,
  minTowerTier: 2,
  minSupportTier: 2,
};

const CRYSTAL_REWARDS = {
  standardClear: 50,
  dailyClear: 100,
  perfectBonus: 30,
  speedBonus: 20,
  perStageBonus: 10,
  gradeBonus: { S: 30, A: 20, B: 10, C: 5, D: 0 },
};

const META_UPGRADES = {
  startingGold:    { id: 'startingGold',    name: '초기 자금 강화',  icon: '💰', maxLevel: 10, baseCost: 20,  costPerLevel: 20,  effect: (lv) => lv * 10 },
  startingLives:   { id: 'startingLives',   name: '방어선 강화',     icon: '❤️', maxLevel: 5,  baseCost: 30,  costPerLevel: 30,  effect: (lv) => lv * 2 },
  baseDamage:      { id: 'baseDamage',      name: '기본 화력',       icon: '⚔️', maxLevel: 20, baseCost: 15,  costPerLevel: 15,  effect: (lv) => lv * 0.02 },
  baseAttackSpeed: { id: 'baseAttackSpeed', name: '기본 공속',       icon: '⏱️', maxLevel: 15, baseCost: 20,  costPerLevel: 20,  effect: (lv) => lv * 0.015 },
  goldMultiplier:  { id: 'goldMultiplier',  name: '골드 배율',       icon: '🪙', maxLevel: 10, baseCost: 25,  costPerLevel: 25,  effect: (lv) => lv * 0.05 },
  drawDiscount:    { id: 'drawDiscount',    name: '뽑기 할인',       icon: '🏷️', maxLevel: 5,  baseCost: 40,  costPerLevel: 40,  effect: (lv) => lv * 1 },
  rerollCount:     { id: 'rerollCount',     name: '버프 리롤',       icon: '🔄', maxLevel: 3,  baseCost: 50,  costPerLevel: 50,  effect: (lv) => lv },
  carryoverSlots:  { id: 'carryoverSlots',  name: '캐리오버 슬롯',   icon: '📦', maxLevel: 5,  baseCost: 35,  costPerLevel: 35,  effect: (lv) => lv },
};

const DAILY_MODIFIERS = {
  speedRush:    { id: 'speedRush',    name: '속도전',     icon: '⚡', desc: '적 이동속도 +50%' },
  bossWave:     { id: 'bossWave',     name: '보스 웨이브', icon: '👑', desc: '매 웨이브 보스 등장' },
  lowEconomy:   { id: 'lowEconomy',   name: '긴축 경제',   icon: '💸', desc: '골드 보상 -40%' },
  supportOnly:  { id: 'supportOnly',  name: '서포트 한정', icon: '🛡️', desc: '서포트 타워만 뽑기 가능' },
  oneElement:   { id: 'oneElement',   name: '단일 속성',   icon: '🎯', desc: '랜덤 1속성만 등장' },
};

// 전역 등록
window.RUN_SPAWN = RUN_SPAWN;
window.RUN_ECONOMY = RUN_ECONOMY;
window.RUN_HEALTH_SCALING = RUN_HEALTH_SCALING;
window.RUN_CARRYOVER = RUN_CARRYOVER;
window.CRYSTAL_REWARDS = CRYSTAL_REWARDS;
window.META_UPGRADES = META_UPGRADES;
window.DAILY_MODIFIERS = DAILY_MODIFIERS;
```

#### 2. `js/run-mode.js` (~200줄)
RunMode 글로벌 시스템.

```javascript
const RunMode = {
  // 메타 업그레이드가 적용된 런 설정 생성
  buildRunConfig(metaUpgrades) {
    return {
      SPAWN: { ...RUN_SPAWN },
      ECONOMY: {
        ...RUN_ECONOMY,
        startGold: RUN_ECONOMY.startGold + META_UPGRADES.startingGold.effect(metaUpgrades.startingGold || 0),
        startLives: RUN_ECONOMY.startLives + META_UPGRADES.startingLives.effect(metaUpgrades.startingLives || 0),
      },
      CARRYOVER: {
        ...RUN_CARRYOVER,
        maxTowers: RUN_CARRYOVER.maxTowers + (metaUpgrades.carryoverSlots || 0),
      },
    };
  },

  // 크리스탈 보상 계산
  calculateCrystals(result) {
    let crystals = 0;
    if (result.cleared) {
      crystals += result.mode === 'daily' ? CRYSTAL_REWARDS.dailyClear : CRYSTAL_REWARDS.standardClear;
      if (result.isPerfect) crystals += CRYSTAL_REWARDS.perfectBonus;
      if (result.isSpeedRun) crystals += CRYSTAL_REWARDS.speedBonus;
    } else {
      crystals += (result.stagesCleared || 0) * CRYSTAL_REWARDS.perStageBonus;
    }
    crystals += CRYSTAL_REWARDS.gradeBonus[result.grade] || 0;
    return crystals;
  },

  // 업그레이드 비용
  getUpgradeCost(upgradeId, currentLevel) {
    const upgrade = META_UPGRADES[upgradeId];
    if (!upgrade || currentLevel >= upgrade.maxLevel) return Infinity;
    return upgrade.baseCost + upgrade.costPerLevel * currentLevel;
  },

  // 업그레이드 구매
  purchaseUpgrade(metaData, upgradeId) {
    const cost = this.getUpgradeCost(upgradeId, metaData.upgrades[upgradeId] || 0);
    if (metaData.crystals < cost) return null;
    return {
      ...metaData,
      crystals: metaData.crystals - cost,
      upgrades: { ...metaData.upgrades, [upgradeId]: (metaData.upgrades[upgradeId] || 0) + 1 },
    };
  },

  // 메타 버프 배율 계산 (게임 틱에서 사용)
  getMetaBuffs(metaUpgrades) {
    return {
      damageMultiplier: 1 + META_UPGRADES.baseDamage.effect(metaUpgrades.baseDamage || 0),
      attackSpeedMultiplier: 1 + META_UPGRADES.baseAttackSpeed.effect(metaUpgrades.baseAttackSpeed || 0),
      goldMultiplier: 1 + META_UPGRADES.goldMultiplier.effect(metaUpgrades.goldMultiplier || 0),
      drawDiscount: META_UPGRADES.drawDiscount.effect(metaUpgrades.drawDiscount || 0),
      rerollCount: META_UPGRADES.rerollCount.effect(metaUpgrades.rerollCount || 0),
    };
  },

  // Endless 모드 스케일링
  getEndlessScaling(stageNumber) {
    const mult = Math.pow(1.1, stageNumber - 1); // 스테이지당 10% 증가
    return {
      healthMultiplier: mult,
      enemyCountBonus: stageNumber * 2,
      spawnDelayReduction: Math.min(stageNumber * 10, 400),
    };
  },
};

window.RunMode = RunMode;
```

#### 3. `js/run-save-system.js` (~180줄)
런 모드 전용 저장 시스템.

```javascript
const RunSaveSystem = {
  META_KEY: 'neonDefense_runMeta_v1',
  RUN_KEY: 'neonDefense_runSave_v1',

  getDefaultMeta() {
    return {
      version: 1,
      crystals: 0,
      upgrades: { startingGold: 0, startingLives: 0, baseDamage: 0, baseAttackSpeed: 0, goldMultiplier: 0, drawDiscount: 0, rerollCount: 0, carryoverSlots: 0 },
      stats: { totalRuns: 0, totalClears: 0, totalCrystalsEarned: 0, bestGrade: null, fastestClear: null, highestEndlessStage: 0 },
    };
  },

  saveMeta(data) { /* localStorage.setItem(META_KEY, JSON.stringify(data)) */ },
  loadMeta() { /* localStorage.getItem(META_KEY) → parse → validate */ },

  saveRun(runState) { /* localStorage.setItem(RUN_KEY, JSON.stringify(runState)) */ },
  loadRun() { /* localStorage.getItem(RUN_KEY) → parse → validate */ },
  deleteRun() { /* localStorage.removeItem(RUN_KEY) */ },
  hasActiveRun() { /* return !!loadRun() */ },
  getRunInfo() { /* loadRun() → extract preview info */ },

  validateMetaData(data) { /* version/field check */ },
  validateRunData(data) { /* version/field check */ },
};

window.RunSaveSystem = RunSaveSystem;
```

#### 4. `js/hooks/useRunMode.jsx` (~300줄)
런 모드 상태 관리 훅.

```javascript
const useRunMode = () => {
  // 메타 진행 (영구)
  const [metaProgress, setMetaProgress] = useState(() => RunSaveSystem.loadMeta() || RunSaveSystem.getDefaultMeta());

  // 런 세션 상태
  const [runMode, setRunMode] = useState(null); // 'standard' | 'daily' | 'endless' | null
  const [runActive, setRunActive] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [rerollsRemaining, setRerollsRemaining] = useState(0);

  // 런 설정 (메타 업그레이드 적용)
  const runConfig = useMemo(() => runActive ? RunMode.buildRunConfig(metaProgress.upgrades) : null, [runActive, metaProgress.upgrades]);

  // 런 시작
  const startRun = useCallback((mode, modifiers = []) => { ... }, []);

  // 런 종료 (승리/패배)
  const endRun = useCallback((cleared, gameStats, lives) => {
    const result = { cleared, mode: runMode, stagesCleared: gameStats.stagesCleared, ... };
    const crystals = RunMode.calculateCrystals(result);
    // 메타 진행 업데이트
    // 리더보드 추가
    // 업적 체크
    setRunResult({ ...result, crystalsEarned: crystals });
    setRunActive(false);
  }, []);

  // 메타 업그레이드 구매
  const purchaseUpgrade = useCallback((upgradeId) => { ... }, []);

  // 버프 리롤
  const rerollBuffChoices = useCallback(() => { ... }, []);

  return { metaProgress, runMode, runActive, runResult, runConfig, startRun, endRun, purchaseUpgrade, rerollsRemaining, rerollBuffChoices, neonCrystals: metaProgress.crystals };
};

window.useRunMode = useRunMode;
```

#### 5. `js/components/RunModeMenu.jsx` (~300줄)
런 모드 메뉴 (모드 선택 / 업그레이드 / 리더보드 탭).

구성:
- 상단: 크리스탈 잔액, 뒤로가기 버튼
- 탭: 모드 선택 | 메타 업그레이드 | 리더보드 | 업적
- 모드 선택: Standard Run, Daily Challenge, Endless Mode 카드
- 진행 중 런 있으면 이어하기 옵션

#### 6. `js/components/RunResultModal.jsx` (~200줄)
런 종료 화면.

구성:
- 등급 (S/A/B/C/D)
- 통계 요약 (스테이지, 웨이브, 킬, 시간)
- 크리스탈 보상 내역 (기본 + 퍼펙트 + 스피드 + 등급)
- 버튼: 새 런 / 업그레이드 / 메인 메뉴

#### 7. `js/components/MetaUpgradePanel.jsx` (~180줄)
8종 메타 업그레이드 카드 그리드.

카드별: 아이콘, 이름, 현재/최대 레벨, 비용, 효과 미리보기, 구매 버튼

### Phase 2 (4개)

#### 8. `js/daily-challenge.js` (~150줄)
```javascript
const DailyChallenge = {
  DAILY_KEY: 'neonDefense_dailyAttempt_v1',
  getTodaySeed() { /* YYYYMMDD → number */ },
  getModifiers(seed) { /* seededRandom으로 5개 중 2개 선택 */ },
  hasAttemptedToday() { /* localStorage 확인 */ },
  markAttempted() { /* localStorage 기록 */ },
  applyModifiers(baseConfig, modifiers) { /* config 변환 */ },
};
```

#### 9. `js/achievement-system.js` (~250줄)
20개 업적 정의 및 추적.

```javascript
const ACHIEVEMENTS = {
  firstClear:     { name: '첫 승리',       icon: '🏆', desc: '런 모드 첫 클리어' },
  speedRunner:    { name: '스피드 러너',    icon: '⚡', desc: '15분 이내 클리어' },
  perfectRun:     { name: '무결점 수호자',  icon: '✨', desc: '목숨 손실 없이 클리어' },
  crystal100:     { name: '크리스탈 수집가', icon: '💎', desc: '크리스탈 100개 모으기' },
  // ... 총 20개
};
```

#### 10. `js/leaderboard.js` (~120줄)
```javascript
const Leaderboard = {
  SAVE_KEY: 'neonDefense_leaderboard_v1',
  MAX_ENTRIES: 20,
  addEntry(mode, entry) { ... },
  getEntries(mode, sortBy) { ... },
};
```

#### 11. `js/components/AchievementModal.jsx` (~180줄)
업적 그리드 UI + 새 업적 잠금 해제 시 토스트 알림.

---

## 기존 파일 수정 (9개)

### 1. `js/hooks/useGameState.jsx`
- `configOverride` 파라미터 추가
- 모든 `SPAWN`, `ECONOMY`, `CARRYOVER` 참조를 `cfg.*`로 교체
- 위의 "핵심 리팩토링" 섹션 참조

### 2. `js/hooks/useGameLoop.jsx`
- config 객체에 `spawnConfig` 필드 추가
- L45: `SPAWN.enemiesPerWave(stage, wave)` → `activeSPAWN.enemiesPerWave(stage, wave)`
- L46: `SPAWN.spawnDelay(stage, wave)` → `activeSPAWN.spawnDelay(stage, wave)`

### 3. `js/App.jsx`
```javascript
// 추가: 런 모드 훅
const runModeState = useRunMode();
const [gameMode, setGameMode] = useState('campaign'); // 'campaign' | 'run'

// useGameState에 런 설정 전달
const gameState = useGameState(runModeState.runConfig);

// useGameLoop config에 spawnConfig 추가 (useGameState 내부에서 처리)

// 조건부 렌더링 추가:
// - gameMode === 'run' && !runActive → RunModeMenu
// - runResult !== null → RunResultModal
// - 런 모드 게임 클리어/오버 시 endRun 호출

// MainMenu onSelectMode 연결
```

### 4. `js/components/MainMenu.jsx`
- L211-222: 런 모드 버튼 활성화 (disabled 제거, SOON 배지 제거)
- onClick → `onSelectMode('run')` 호출
- 메타 진행이 있으면 크리스탈 잔액 표시

### 5. `js/components/GameHeader.jsx`
- `gameMode` prop 추가
- 런 모드일 때 "RUN" 배지 표시
- 스테이지/웨이브 표시에 런 설정 값 사용

### 6. `js/components/BuffSelectionModal.jsx`
- `rerollsRemaining`, `onReroll` prop 추가
- 리롤 가능 시 "리롤" 버튼 표시 (남은 횟수 표시)

### 7. `js/game-stats.js`
- `calculateRunGrade(stats)` 메서드 추가
- 런 모드 전용 점수 계산 (짧은 게임에 맞춘 가중치)

### 8. `js/hooks/useCheatConsole.jsx`
- `crystal [n]` / `cr [n]`: 크리스탈 추가
- `runwin`: 런 즉시 클리어

### 9. `index.html`
```html
<!-- save-system.js 이후, balance-logger.js 이전 -->
<script src="js/run-mode-constants.js"></script>
<script src="js/run-mode.js"></script>
<script src="js/run-save-system.js"></script>
<script src="js/daily-challenge.js"></script>
<script src="js/achievement-system.js"></script>
<script src="js/leaderboard.js"></script>

<!-- 기존 훅 이후 -->
<script type="text/babel" src="js/hooks/useRunMode.jsx"></script>

<!-- 기존 컴포넌트 이후 -->
<script type="text/babel" src="js/components/RunModeMenu.jsx"></script>
<script type="text/babel" src="js/components/RunResultModal.jsx"></script>
<script type="text/babel" src="js/components/MetaUpgradePanel.jsx"></script>
<script type="text/babel" src="js/components/AchievementModal.jsx"></script>
```

---

## 데이터 구조

### 메타 진행 (`neonDefense_runMeta_v1`)
```javascript
{
  version: 1,
  crystals: 0,
  upgrades: {
    startingGold: 0,     // Level 0-10
    startingLives: 0,    // Level 0-5
    baseDamage: 0,       // Level 0-20
    baseAttackSpeed: 0,  // Level 0-15
    goldMultiplier: 0,   // Level 0-10
    drawDiscount: 0,     // Level 0-5
    rerollCount: 0,      // Level 0-3
    carryoverSlots: 0,   // Level 0-5
  },
  stats: {
    totalRuns: 0,
    totalClears: 0,
    totalCrystalsEarned: 0,
    bestGrade: null,      // 'S'|'A'|'B'|'C'|'D'
    fastestClear: null,   // milliseconds
    highestEndlessStage: 0,
  },
}
```

### 런 진행 (`neonDefense_runSave_v1`)
```javascript
{
  version: 1,
  timestamp: Date.now(),
  runMode: 'standard',   // 'standard' | 'daily' | 'endless'
  seed: 12345,

  // 게임 상태 (캠페인 저장과 동일 형식)
  stage, wave, gold, lives,
  towers, supportTowers, inventory, supportInventory,
  permanentBuffs, stats,

  // 런 전용
  metaUpgradesSnapshot: { ... }, // 런 시작 시 스냅샷
  modifiers: [],                  // Daily Challenge 모디파이어
  rerollsUsed: 0,
}
```

### 업적 (`neonDefense_achievements_v1`)
```javascript
{
  version: 1,
  unlocked: { achievementId: { unlockedAt: timestamp }, ... },
  progress: { totalKills: 0, totalRuns: 0, ... },
}
```

### 리더보드 (`neonDefense_leaderboard_v1`)
```javascript
{
  version: 1,
  standard: [{ score, stage, time, grade, date }],  // max 20
  daily: [...],
  endless: [{ score, stage, time, date }],
}
```

---

## 게임 플로우

### Standard Run
```
메인 메뉴 → "런 모드" → RunModeMenu → "Standard Run"
  → 메타 업그레이드 적용 → 게임 리셋 (RUN_ECONOMY.startGold/startLives)
  → Stage 1: Wave 1, 2, 3 → 캐리오버 → 버프 선택
  → Stage 2~4: 동일 패턴
  → Stage 5: Wave 3 클리어 → RunResultModal (크리스탈 보상)
  → 또는 Lives = 0 → Game Over → RunResultModal (부분 보상)
```

### Daily Challenge
```
RunModeMenu → "Daily Challenge" 탭 → 오늘 시드/모디파이어 확인
  → 시작 (하루 1회) → 모디파이어 적용된 Standard Run
  → 결과: 100 크리스탈 (클리어 시)
```

### Endless Mode
```
RunModeMenu → "Endless" 탭 → 시작
  → 매 스테이지 난이도 10% 증가 (무한)
  → 사망 시 → RunResultModal + 리더보드
  → 크리스탈: 스테이지수 × perStageBonus
```

### Campaign (기존, 변경 없음)
```
메인 메뉴 → "캠페인" → 새 게임/이어하기
  → Stage 1~10 × Wave 1~5
  → 동일한 useGameState (configOverride = null)
```

---

## 구현 순서

### Step 1: 기반 시스템 (UI 변경 없음)
1. `js/run-mode-constants.js` 생성
2. `js/run-mode.js` 생성
3. `js/run-save-system.js` 생성

### Step 2: Config Injection (역호환 리팩토링)
4. `js/hooks/useGameState.jsx` - configOverride 파라미터 추가
5. `js/hooks/useGameLoop.jsx` - spawnConfig 파라미터 추가
6. **캠페인 모드 회귀 테스트**

### Step 3: 런 모드 훅 & 저장
7. `js/hooks/useRunMode.jsx` 생성
8. `js/game-stats.js` - calculateRunGrade 추가

### Step 4: UI 컴포넌트
9. `js/components/MetaUpgradePanel.jsx` 생성
10. `js/components/RunModeMenu.jsx` 생성
11. `js/components/RunResultModal.jsx` 생성

### Step 5: 통합
12. `js/components/MainMenu.jsx` - 런 모드 버튼 활성화
13. `js/App.jsx` - 전체 통합
14. `js/components/GameHeader.jsx` - 런 모드 표시
15. `js/components/BuffSelectionModal.jsx` - 리롤 버튼
16. `js/hooks/useCheatConsole.jsx` - 치트 추가
17. `index.html` - 스크립트 태그 추가

### Step 6: Phase 2 콘텐츠
18. `js/daily-challenge.js` + RunModeMenu 일일 챌린지 UI
19. useRunMode Endless 로직 + RunModeMenu Endless UI
20. `js/achievement-system.js` + `js/components/AchievementModal.jsx`
21. `js/leaderboard.js` + RunModeMenu 리더보드 탭

---

## 검증 방법
1. **캠페인 회귀**: 새 게임 → 웨이브 클리어 → 스테이지 전환 → 저장/불러오기 정상
2. **Standard Run 전체 플로우**: 메뉴 → 런 시작 → 5x3 진행 → 클리어/사망 → 보상 → 업그레이드
3. **메타 업그레이드**: 구매 → 다음 런에 적용 → 새로고침 후 유지
4. **Daily Challenge**: 동일 날짜 = 동일 시드, 1일 1회 제한
5. **Endless**: 무한 진행, 난이도 상승, 기록 저장
6. **업적/리더보드**: 조건 달성 알림, 기록 저장/표시
7. 실행: `npx serve .` → `http://localhost:3000`

---

**작성일**: 2026-02-07
**상태**: 계획 완료, 구현 대기
