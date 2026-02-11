// Neon Defense - 런 모드 전용 상수
// 캠페인 constants.js와 동일 패턴, 런 모드에 최적화된 밸런스

// ===== 런 모드 스폰 설정 (ㅁ 맵 + 타이머 기반) =====
const RUN_SPAWN = {
  wavesPerStage: 5,              // 5 웨이브 per 스테이지
  maxStage: 5,
  enemiesPerWave: (stage, wave) => {
    // 고정 20마리 (웨이브/스테이지별 약간의 변동)
    return 20;
  },
  spawnDelay: (stage, wave) => {
    // 20초 동안 20마리 → 1초 간격
    return 1000;
  },
  waveDurationMs: 60000,         // 웨이브 지속시간: 1분
  waveAutoStart: true,           // 자동 웨이브 시작
  defeatThreshold: 70,           // 맵 위 적 70마리 이상 = 패배
  bossPhaseDurationMs: 60000,    // 보스 페이즈 제한시간: 1분
};

// ===== 보스 러시 스폰 설정 =====
const BOSS_RUSH_SPAWN = {
  wavesPerStage: 999,            // 사실상 무한 (죽을 때까지)
  maxStage: 1,                   // 단일 스테이지
  enemiesPerWave: (stage, wave) => 1, // 보스 1마리
  spawnDelay: (stage, wave) => 1000,  // 즉시 스폰
  waveAutoStart: false,          // 수동 시작
};

// ===== 런 모드 경제 설정 =====
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
  waveReward: (wave) => 18 + wave * 6 + (wave === 5 ? 20 : 0),
  stageClearBonus: (stage) => 50 + stage * 12,
  bossGoldReward: (stage, wave) => 25 + stage * 8 + wave * 4,
};

// ===== 보스 러시 경제 설정 =====
const BOSS_RUSH_ECONOMY = {
  startGold: 200,                // 넉넉한 시작 자원
  startLives: 5,                 // 제한된 목숨
  drawCost: 20,
  supportDrawCost: 40,
  maxInventory: 30,
  maxSupportInventory: 15,
  sellRefundRate: 0.5,
  towerBaseValues: { 1: 20, 2: 60, 3: 180, 4: 540 },
  supportBaseValues: { 1: 40, 2: 120, 3: 360 },
  waveReward: (wave) => 0,       // 웨이브 보상 없음
  stageClearBonus: (stage) => 0,
  bossGoldReward: (stage, wave) => 0, // 골드 대신 타워 뽑기
  bossKillDrawCount: 1,          // 보스 처치 시 무료 뽑기 1회
};

// ===== 런 모드 체력 스케일링 =====
const RUN_HEALTH_SCALING = {
  base: 30,
  stageGrowth: 0.5,             // ㅁ맵 순환이라 좀 더 여유
  waveGrowth: 0.3,
  lateWaveThreshold: 4,
  lateWaveBonus: 1.4,
  bossFormula: (stage) => 15 + stage * 3,
};

// ===== 보스 러시 체력 스케일링 =====
const BOSS_RUSH_HEALTH_SCALING = {
  base: 200,
  stageGrowth: 0.0,             // 스테이지 개념 없음
  waveGrowth: 1.5,              // 웨이브(=보스 차수)마다 크게 증가
  lateWaveThreshold: 99,
  lateWaveBonus: 1.0,
  bossFormula: (stage) => 50 + stage * 15,
};

// ===== 런 모드 캐리오버 설정 =====
const RUN_CARRYOVER = {
  maxTowers: 3,          // 기본 (메타 업그레이드로 추가)
  maxSupports: 2,
  minTowerTier: 2,
  minSupportTier: 2,
};

// ===== 보스 러시 캐리오버 설정 =====
const BOSS_RUSH_CARRYOVER = {
  maxTowers: 0,          // 캐리오버 없음
  maxSupports: 0,
  minTowerTier: 99,
  minSupportTier: 99,
};

// ===== 크리스탈 보상 테이블 =====
const CRYSTAL_REWARDS = {
  // 런 모드
  standardClear: 50,       // Standard Run 클리어
  dailyClear: 100,         // Daily Challenge 클리어
  perfectBonus: 30,        // 목숨 손실 없이 클리어
  speedBonus: 20,          // 15분 이내 클리어
  perStageBonus: 10,       // 스테이지당 보상 (실패 시)
  gradeBonus: { S: 30, A: 20, B: 10, C: 5, D: 0 },

  // 보스 러시
  bossRushPerBoss: 15,     // 보스당 크리스탈
  bossRushEfficiencyBonus: { S: 40, A: 25, B: 15, C: 5, D: 0 },

  // 캠페인 모드
  campaignClear: 80,            // 캠페인 전체 클리어
  campaignPerStage: 5,          // 캠페인 스테이지당 보상
  campaignPerfectBonus: 50,     // 캠페인 퍼펙트 클리어 (목숨 손실 0)
  campaignSpeedBonus: 30,       // 캠페인 30분 이내 클리어
  campaignGradeBonus: { S: 40, A: 25, B: 15, C: 8, D: 0 },
  campaignFirstClearBonus: 100, // 최초 클리어 보너스
};

// ===== 메타 업그레이드 정의 =====
// 리텐션 강화: 레벨당 효과 낮추고, 최대 레벨 높이고, 비용 점진 증가
const META_UPGRADES = {
  startingGold: {
    id: 'startingGold',
    name: '초기 자금 강화',
    icon: '💰',
    desc: '런 시작 시 추가 골드',
    maxLevel: 15,
    cost: (level) => 20 + level * 12 + Math.floor(level / 5) * 15,
    effect: (level) => level * 5,          // +5G per level (was +10G)
    formatEffect: (level) => `+${level * 5}G`,
  },
  startingLives: {
    id: 'startingLives',
    name: '방어선 강화',
    icon: '❤️',
    desc: '런 시작 시 추가 목숨',
    maxLevel: 8,
    cost: (level) => 30 + level * 20 + Math.floor(level / 3) * 15,
    effect: (level) => level,              // +1 life per level (was +2)
    formatEffect: (level) => `+${level}`,
  },
  baseDamage: {
    id: 'baseDamage',
    name: '기본 화력',
    icon: '⚔️',
    desc: '모든 타워 공격력 증가',
    maxLevel: 30,
    cost: (level) => 15 + level * 10 + Math.floor(level / 5) * 10,
    effect: (level) => level * 0.01,       // +1% per level (was +2%)
    formatEffect: (level) => `+${level}%`,
  },
  baseAttackSpeed: {
    id: 'baseAttackSpeed',
    name: '기본 공속',
    icon: '⏱️',
    desc: '모든 타워 공격속도 증가',
    maxLevel: 20,
    cost: (level) => 20 + level * 12 + Math.floor(level / 5) * 10,
    effect: (level) => level * 0.01,       // +1% per level (was +1.5%)
    formatEffect: (level) => `+${level}%`,
  },
  goldMultiplier: {
    id: 'goldMultiplier',
    name: '골드 배율',
    icon: '🪙',
    desc: '킬 골드 보상 증가',
    maxLevel: 15,
    cost: (level) => 25 + level * 18 + Math.floor(level / 5) * 15,
    effect: (level) => level * 0.03,       // +3% per level (was +5%)
    formatEffect: (level) => `+${(level * 3)}%`,
  },
  drawDiscount: {
    id: 'drawDiscount',
    name: '뽑기 할인',
    icon: '🏷️',
    desc: '타워 뽑기 비용 감소',
    maxLevel: 5,
    cost: (level) => 50 + level * 35,
    effect: (level) => level * 1,          // -1G per level (unchanged)
    formatEffect: (level) => `-${level}G`,
  },
  rerollCount: {
    id: 'rerollCount',
    name: '버프 리롤',
    icon: '🔄',
    desc: '런당 버프 선택 리롤 횟수',
    maxLevel: 5,
    cost: (level) => 50 + level * 35,
    effect: (level) => level,              // +1 reroll per level
    formatEffect: (level) => `${level}회`,
  },
  carryoverSlots: {
    id: 'carryoverSlots',
    name: '캐리오버 슬롯',
    icon: '📦',
    desc: '다음 스테이지로 가져갈 추가 타워 수',
    maxLevel: 5,
    cost: (level) => 40 + level * 30,
    effect: (level) => level,              // +1 slot per level
    formatEffect: (level) => `+${level}개`,
  },
};

// ===== 일일 챌린지 모디파이어 정의 =====
const DAILY_MODIFIERS = {
  speedRush: {
    id: 'speedRush',
    name: '속도전',
    icon: '⚡',
    desc: '적 이동속도 +50%',
    color: '#FFD93D',
  },
  bossWave: {
    id: 'bossWave',
    name: '보스 웨이브',
    icon: '👑',
    desc: '매 웨이브 마지막에 보스 등장',
    color: '#FF6B6B',
  },
  lowEconomy: {
    id: 'lowEconomy',
    name: '긴축 경제',
    icon: '💸',
    desc: '골드 보상 -40%',
    color: '#96E6A1',
  },
  noSupport: {
    id: 'noSupport',
    name: '서포트 금지',
    icon: '🚫',
    desc: '서포트 타워 뽑기 불가',
    color: '#DDA0DD',
  },
  oneElement: {
    id: 'oneElement',
    name: '단일 속성',
    icon: '🎯',
    desc: '랜덤 1속성만 등장',
    color: '#45B7D1',
  },
};

// 전역 등록
window.RUN_SPAWN = RUN_SPAWN;
window.BOSS_RUSH_SPAWN = BOSS_RUSH_SPAWN;
window.RUN_ECONOMY = RUN_ECONOMY;
window.BOSS_RUSH_ECONOMY = BOSS_RUSH_ECONOMY;
window.RUN_HEALTH_SCALING = RUN_HEALTH_SCALING;
window.BOSS_RUSH_HEALTH_SCALING = BOSS_RUSH_HEALTH_SCALING;
window.RUN_CARRYOVER = RUN_CARRYOVER;
window.BOSS_RUSH_CARRYOVER = BOSS_RUSH_CARRYOVER;
window.CRYSTAL_REWARDS = CRYSTAL_REWARDS;
window.META_UPGRADES = META_UPGRADES;
window.DAILY_MODIFIERS = DAILY_MODIFIERS;
