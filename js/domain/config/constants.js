// Neon Defense - 게임 상수 및 설정 테이블
// 모든 매직 넘버를 구조화된 설정으로 관리

// ===== 그리드 설정 =====
const TILE_SIZE = 40;
const GRID_WIDTH = 16;
const GRID_HEIGHT = 12;

// ===== 속성 타입 정의 =====
const ELEMENT_TYPES = {
  FIRE: 0,      // 빨간색 - 화상 (지속 데미지)
  WATER: 1,     // 파란색 - 빙결 (이동속도 감소)
  ELECTRIC: 2,  // 노란색 - 전기 (체인 라이트닝)
  WIND: 3,      // 초록색 - 바람 (고데미지 + 넉백)
  VOID: 4,      // 보라색 - 공허 (일반 공격)
  LIGHT: 5,     // 은색 - 빛 (일반 공격)
};

// ===== 속성별 특수 효과 설정 =====
const ELEMENT_EFFECTS = {
  [ELEMENT_TYPES.FIRE]: {
    name: '화상', icon: '🔥', desc: '지속 데미지',
    burnDuration: { 1: 2000, 2: 2500, 3: 3000, 4: 4000 },
    burnDamagePercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
    burnTicks: 4,
    // T4 전용 수치
    t4SpreadRadius: 60,         // 확산 연소형: 화상 전파 반경 (px)
    t4SpreadDamageRatio: 0.5,   // 확산 연소형: 전파 화상 데미지 배율
    t4SpreadDurationRatio: 0.7, // 확산 연소형: 전파 화상 지속시간 배율
    fastEnemyThreshold: 0.6,    // 빠른 적 판정 기준 속도
  },
  [ELEMENT_TYPES.WATER]: {
    name: '빙결', icon: '❄️', desc: '이동속도 감소',
    slowPercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
    slowDuration: { 1: 1500, 2: 2000, 3: 2500, 4: 3000 },
    // T4 전용 수치
    t4FreezeChance: 0.25,       // 빙결 제어형: 빙결 발동 확률
    t4FreezeDuration: 1500,     // 빙결 제어형: 빙결 지속 시간 (ms)
    t4AoeRadius: 80,            // 광역 감속형: 광역 반경 (px)
    t4AoeSlowRatio: 0.6,        // 광역 감속형: 광역 슬로우 배율
    t4AoeDurationRatio: 0.5,    // 광역 감속형: 광역 지속시간 배율
    t4KnockbackDistance: 25,    // 파동 차단형: 넉백 거리 (px)
  },
  [ELEMENT_TYPES.ELECTRIC]: {
    name: '전격', icon: '⚡', desc: '체인 라이트닝',
    chainCount: { 1: 2, 2: 3, 3: 4, 4: 6 },
    chainDamageDecay: 0.7,
    chainRange: 80,
  },
  [ELEMENT_TYPES.WIND]: {
    name: '질풍', icon: '🌪️', desc: '고데미지 + 넉백',
    damageMultiplier: { 1: 1.5, 2: 1.8, 3: 2.2, 4: 3.0 },
    knockbackDistance: { 1: 15, 2: 20, 3: 25, 4: 35 },
    // T4 전용 수치
    t4AoeDamageRatio: 0.5,   // 광역 분쇄형: 광역 피해 배율
    t4PullRange: 100,        // 흡인 제어형: 끌어당김 탐색 반경 (px)
    t4PullMinRange: 20,      // 흡인 제어형: 끌어당김 최소 거리 (px, 너무 가까우면 제외)
  },
  [ELEMENT_TYPES.VOID]: {
    name: '공허', icon: '🌀', desc: '관통 공격',
    pierceCount: { 1: 1, 2: 2, 3: 2, 4: 3 },        // 관통 대상 수
    pierceDamageDecay: { 1: 0.5, 2: 0.6, 3: 0.7, 4: 0.8 }, // 관통 데미지 감쇠
    pierceRange: { 1: 80, 2: 80, 3: 80, 4: 100 },   // 관통 탐색 반경 (px)
  },
  [ELEMENT_TYPES.LIGHT]: {
    name: '광휘', icon: '💎', desc: '정밀 타격',
    executeThreshold: { 1: 0.2, 2: 0.25, 3: 0.3, 4: 0.35 }, // 처형 HP 임계값
    executeBonus: { 1: 1.5, 2: 1.8, 3: 2.0, 4: 2.5 },       // 처형 보너스 배율
    // T4 전용 수치
    t4KnockbackSlowDuration: 2000, // 넉백 제어형: 슬로우 지속 시간 (ms)
  },
};

// ===== 네온 타워 티어 정의 =====
const NEON_TYPES = {
  1: {
    tier: 1,
    colors: ['#FF6B6B', '#45B7D1', '#FFD93D', '#96E6A1', '#DDA0DD', '#C0C0C0'],
    names: ['레드 스파크', '블루 웨이브', '옐로 버스트', '그린 플래시', '퍼플 글로우', '실버 샤인'],
    damage: 10, range: 80, speed: 1000,
  },
  2: {
    tier: 2,
    colors: ['#FF4444', '#1E90FF', '#FFD700', '#32CD32', '#BA55D3', '#D8D8D8'],
    names: ['크림슨 블레이즈', '오션 포스', '골든 플레어', '네이처 빔', '아메시스트 레이', '스틸 글로우'],
    damage: 30, range: 100, speed: 800,
  },
  3: {
    tier: 3,
    colors: ['#FF0000', '#0066FF', '#FFAA00', '#00FF00', '#9400D3', '#E8E8E8'],
    names: ['인페르노', '딥 시', '솔라 프리즘', '포레스트 가디언', '보이드 워커', '미스릴 코어'],
    damage: 100, range: 120, speed: 600,
  },
  4: {
    tier: 4,
    colors: ['#FF0066', '#0044FF', '#FF6600', '#00FF88', '#7B00FF', '#F5F5F5'],
    names: ['피닉스 라이즈', '애비스 로드', '노바 버스트', '월드 트리', '다크 매터', '플래티넘 스타'],
    damage: 350, range: 150, speed: 400,
  },
};

// ===== 경로 색상 =====
const PATH_COLORS = ['#4ECDC4', '#45B7D1', '#96E6A1'];
const END_COLORS = ['#FF6B6B', '#FFD93D'];

// ===== 적 타입 설정 (데이터 주도 렌더링 + 밸런스) =====
const ENEMY_CONFIG = {
  normal: {
    healthMult: 1.2, speedRange: [0.5, 0.7], speedWaveBonus: 0.04,
    goldReward: 1, livesLost: 1, // 4 -> 1 (P0-A 경제 긴축)
    color: 'bg-purple-600', shadow: '0 0 8px #9333ea', size: 'w-6 h-6',
    icon: null, explosionColor: '#9333ea',
  },
  fast: {
    healthMult: 0.7, speedRange: [0.9, 1.3], speedWaveBonus: 0.02,
    goldReward: 1, livesLost: 1, // 3 -> 1 (P0-A 경제 긴축)
    color: 'bg-cyan-400', shadow: '0 0 8px #00ffff', size: 'w-5 h-5',
    icon: null, explosionColor: '#00ffff',
  },
  elite: {
    healthMult: 3.5, speedRange: [0.45, 0.55], speedWaveBonus: 0.02,
    goldReward: 3, livesLost: 2, // 10 -> 3 (P0-A 경제 긴축)
    color: 'bg-orange-500', shadow: '0 0 12px #ff6600', size: 'w-7 h-7',
    icon: '⭐', explosionColor: '#ff6600',
  },
  boss: {
    healthMult: null, speedRange: null, speedWaveBonus: 0,
    goldReward: null, livesLost: 10,
    color: 'bg-red-600', shadow: '0 0 20px #ff0000, 0 0 30px #ff0000', size: 'w-8 h-8',
    icon: '👑', explosionColor: '#ff0000',
    speedBase: 0.25, speedGrowth: 0.02, // 속도 공식: speedBase + stage * speedGrowth
  },
  jammer: {
    healthMult: 2.2, speedRange: [0.4, 0.5], speedWaveBonus: 0.01,
    goldReward: 4, livesLost: 1, // 12 -> 4 (P0-A 경제 긴축)
    color: 'bg-violet-500', shadow: '0 0 15px #8b5cf6, 0 0 30px #8b5cf6', size: 'w-7 h-7',
    icon: '📡', explosionColor: '#8b5cf6',
    debuffType: 'speed', debuffFactor: 0.4, debuffRange: 100,
  },
  suppressor: {
    healthMult: 2.5, speedRange: [0.35, 0.45], speedWaveBonus: 0.01,
    goldReward: 5, livesLost: 1, // 14 -> 5 (P0-A 경제 긴축)
    color: 'bg-pink-500', shadow: '0 0 15px #ec4899, 0 0 30px #ec4899', size: 'w-7 h-7',
    icon: '🛡️', explosionColor: '#ec4899',
    debuffType: 'damage', debuffFactor: 0.5, debuffRange: 100,
  },
  // 새로운 적 타입: 힐러 - 주변 적 회복
  healer: {
    healthMult: 1.5, speedRange: [0.35, 0.45], speedWaveBonus: 0,
    goldReward: 5, livesLost: 1, // 15 -> 5 (P0-A 경제 긴축)
    color: 'bg-green-500', shadow: '0 0 15px #22c55e, 0 0 30px #22c55e', size: 'w-7 h-7',
    icon: '💚', explosionColor: '#22c55e',
    healRange: 80, healAmount: 0.05, healInterval: 1000,
    regenHealPercent: 0.025, // 재생 버프: 틱당 회복 비율 (2.5%)
    regenDuration: 2000,     // 재생 버프: 지속 시간 (ms)
  },
  // 새로운 적 타입: 분열체 - 죽으면 작은 적 2마리로 분열
  splitter: {
    healthMult: 2.0, speedRange: [0.4, 0.5], speedWaveBonus: 0,
    goldReward: 3, livesLost: 1, // 8 -> 3 (P0-A 경제 긴축)
    color: 'bg-lime-500', shadow: '0 0 12px #84cc16, 0 0 25px #84cc16', size: 'w-7 h-7',
    icon: '💠', explosionColor: '#84cc16',
    splitCount: 2, splitHealthMult: 0.4, splitSpeedMult: 1.3,
  },
};

// ===== 스테이지별 등장 몬스터 풀 (점진적 해금) =====
const STAGE_ENEMY_POOL = {
  1: ['normal', 'fast'],                                                          // 2종
  2: ['normal', 'fast', 'elite', 'splitter'],                                     // 4종
  3: ['normal', 'fast', 'elite', 'splitter', 'healer', 'jammer'],                 // 6종
  4: ['normal', 'fast', 'elite', 'splitter', 'healer', 'jammer', 'suppressor'],   // 7종
  // 5+ : 전체 8종
};
// stage >= 5 또는 정의 안 된 스테이지 → 전체 타입
const ALL_ENEMY_TYPES = ['normal', 'fast', 'elite', 'splitter', 'healer', 'jammer', 'suppressor'];

// 특수 몬스터 등장 확률 (웨이브가 오를수록 특수 몬스터 비율 증가)
const SPECIAL_ENEMY_CHANCE = {
  elite:      { base: 0.08, perWave: 0.03 },
  splitter:   { base: 0.06, perWave: 0.02 },
  healer:     { base: 0.05, perWave: 0.02 },
  jammer:     { base: 0.05, perWave: 0.02 },
  suppressor: { base: 0.04, perWave: 0.02 },
  fast:       { base: 0.25, perWave: 0.03 },
  // normal은 나머지 확률로 등장 (fallback)
};

// ===== 스폰 규칙 (스테이지 풀 기반) =====
const SPAWN_RULES = [
  // 보스: 마지막 웨이브의 마지막 적
  { type: 'boss', condition: (idx, total, wave) => wave === 5 && idx === total - 1, chance: 1.0 },

  // 나머지: STAGE_ENEMY_POOL + SPECIAL_ENEMY_CHANCE로 EnemySystem에서 처리
  // (아래는 fallback 전용)
  { type: 'normal', condition: () => true, chance: 1.0 },
];


// ===== 체력 스케일링 (T2×3 기준 밸런스) =====
// Stage 1 W1 normal: 30*1.0*1.0*1.0 = 30 HP → T1×3 DPS(30) 1초 컷
// Stage 1 W5 normal: 30*1.0*1.6*1.2 = 58 HP → T2×3 DPS(112) 0.5초 컷, 15마리 적절
// Stage 2 W5 normal: 30*1.4*1.6*1.2 = 81 HP → T3+T2 DPS(240) 필요
// Stage 5 W5 normal: 30*2.6*1.6*1.2 = 150 HP → T4+T3 조합 필요
const HEALTH_SCALING = {
  base: 30,
  stageGrowth: 0.4,
  waveGrowth: 0.15,
  lateWaveThreshold: 4,
  lateWaveBonus: 1.2,
  bossFormula: (stage) => 10 + stage * 1.5,
};

// ===== 경제 설정 =====
const ECONOMY = {
  startGold: 100,
  startLives: 20,
  drawCost: 20,
  maxInventory: 30, // 5행 x 6열
  sellRefundRate: 0.5,
  towerBaseValues: { 1: 20, 2: 60, 3: 180, 4: 540 },
  waveReward: (wave) => 15 + wave * 4 + (wave === 5 ? 15 : 0), // P0-A: 20+5x+20 -> 15+4x+15 (-25%)
  stageClearBonus: (stage) => 40 + stage * 8, // P0-A: 50+10x -> 40+8x (-20%)
  bossGoldReward: (stage, wave) => 20 + stage * 7 + wave * 3, // P0-A: 30+10x+5y -> 20+7x+3y (-35%)
  // 서포트 타워 경제
  supportDrawCost: 40,
  maxSupportInventory: 15, // 3열 x 5행
  supportBaseValues: { 1: 40, 2: 120, 3: 360 },
};

// ===== 캐리오버 설정 =====
const CARRYOVER = {
  maxTowers: 5,        // 다음 스테이지로 가져갈 수 있는 최대 공격 타워 수
  maxSupports: 3,      // 다음 스테이지로 가져갈 수 있는 최대 서포트 타워 수
  minTowerTier: 2,     // 캐리오버 후보 최소 타워 티어 (T2 이상)
  minSupportTier: 2,   // 캐리오버 후보 최소 서포트 티어 (S2 이상)
};

// ===== 전투 설정 =====
const COMBAT = {
  projectileBaseSpeed: 10,
  collisionRadius: 15,
  effectDuration: 300,
  gameLoopInterval: 16,
  burnTickInterval: 500,
  debuffMinFactor: 0.3,
  chainLightningDisplayTime: 300,
  shootSoundChance: 0.3,
  maxSlowPercent: 0.9,          // 슬로우 최대 감속률 (90%)
  fastEnemySpeedThreshold: 0.6, // 빠른 적 판정 기준 속도 (공통)
};

// ===== 스폰 설정 (점진적 증가) =====
const SPAWN = {
  enemiesPerWave: (stage, wave) => {
    // 기본: 8 + 웨이브당 2 + 스테이지당 3
    // S1W1: 10, S1W5: 18, S2W1: 13, S5W1: 22, S10W5: 40
    const base = 8 + wave * 2 + (stage - 1) * 3;
    return Math.min(base, 50); // 최대 50마리 캡
  },
  spawnDelay: (stage, wave) => {
    // 넉넉하게 시작 → 점진적 빨라짐
    const base = 800 - (stage * 40) - (wave * 15);
    return Math.max(200, base); // 최소 200ms
  },
  wavesPerStage: 5,
  maxStage: 10,
};

// ===== 모바일 배치 UI 속성 데이터 =====
const ELEMENT_UI = [
  { id: 0, icon: '🔥', color: '#FF6B6B', name: '화염' },
  { id: 1, icon: '❄️', color: '#45B7D1', name: '냉기' },
  { id: 2, icon: '⚡', color: '#FFD93D', name: '전격' },
  { id: 3, icon: '🌪️', color: '#96E6A1', name: '질풍' },
  { id: 4, icon: '🌀', color: '#DDA0DD', name: '공허' },
  { id: 5, icon: '💎', color: '#C0C0C0', name: '광휘' },
];

// ===== 서포트 타워 타입 정의 =====
const SUPPORT_TYPES = {
  ATTACK: 0,   // 공격력 버프
  SPEED: 1,    // 공속 버프
  DEFENSE: 2,  // 적 방어력 감소
  RANGE: 3,    // 사거리 버프
};

// ===== 서포트 타워 티어별 설정 =====
const SUPPORT_CONFIG = {
  1: {
    tier: 1,
    colors: ['#FFB347', '#87CEEB', '#FF6B9D', '#98FB98'],
    names: ['어택 앰프 I', '헤이스트 필드 I', '아머 브레이커 I', '사이트 익스텐더 I'],
    range: 100,
    values: [0.15, 0.10, 0.10, 0.10], // 공격력, 공속, 방감, 사거리
  },
  2: {
    tier: 2,
    colors: ['#FF8C00', '#4169E1', '#FF1493', '#32CD32'],
    names: ['어택 앰프 II', '헤이스트 필드 II', '아머 브레이커 II', '사이트 익스텐더 II'],
    range: 120,
    values: [0.25, 0.18, 0.18, 0.18],
  },
  3: {
    tier: 3,
    colors: ['#FF4500', '#0000FF', '#FF0066', '#00FF00'],
    names: ['어택 앰프 MAX', '헤이스트 필드 MAX', '아머 브레이커 MAX', '사이트 익스텐더 MAX'],
    range: 150,
    values: [0.40, 0.30, 0.30, 0.30],
  },
};

// ===== 서포트 타워 UI 데이터 =====
const SUPPORT_UI = [
  { id: 0, icon: '⚔️', color: '#FFB347', name: '공격력' },
  { id: 1, icon: '⏱️', color: '#87CEEB', name: '공속' },
  { id: 2, icon: '💔', color: '#FF6B9D', name: '방감' },
  { id: 3, icon: '🎯', color: '#98FB98', name: '사거리' },
];

// ===== 서포트 버프 상한선 =====
const SUPPORT_CAPS = {
  attack: 1.0,   // +100% 공격력
  speed: 1.0,    // +100% 공속
  defense: 0.5,  // +50% 추가 피해
  range: 1.0,    // +100% 사거리
};

// ===== T4 타워 역할 선택 시스템 =====
// T3 → T4 조합 시 3가지 역할 중 선택
const T4_ROLES = {
  // 🔥 화염 계열
  [ELEMENT_TYPES.FIRE]: [
    {
      id: 'A', name: '연소 누적형', icon: '🎯',
      desc: '보스/브루저 특화\n화상 중첩 가능, 범위 감소',
      statMod: { damage: 1.2, range: 0.8, speed: 1.0 },
      special: { burnStacks: true, maxStacks: 5 },
    },
    {
      id: 'B', name: '확산 연소형', icon: '🌊',
      desc: '다수 적 대응\n화상 전파, 단일 DPS 감소',
      statMod: { damage: 0.7, range: 1.3, speed: 1.0 },
      special: { burnSpread: true, spreadCount: 2 },
    },
    {
      id: 'C', name: '고열 압축형', icon: '⚡',
      desc: '러시 적 특화\n빠른 틱, 빠른 적 추가 피해',
      statMod: { damage: 1.0, range: 0.9, speed: 0.7 },
      special: { fastEnemyBonus: 0.5 },
    },
  ],
  // ❄️ 냉기 계열
  [ELEMENT_TYPES.WATER]: [
    {
      id: 'A', name: '빙결 제어형', icon: '🧊',
      desc: '스턴 확률 부여\n슬로우 누적 시 빙결',
      statMod: { damage: 0.8, range: 1.0, speed: 1.0 },
      special: { freezeChance: 0.15, freezeDuration: 1500 },
    },
    {
      id: 'B', name: '광역 감속형', icon: '❄️',
      desc: '넓은 범위 감속\n개별 제어력 감소',
      statMod: { damage: 0.9, range: 1.4, speed: 1.1 },
      special: { aoeSlowBonus: 0.2 },
    },
    {
      id: 'C', name: '파동 차단형', icon: '🌊',
      desc: '넉백 강화\n단일 적 제어 특화',
      statMod: { damage: 1.1, range: 0.9, speed: 1.0 },
      special: { knockbackBonus: 20 },
    },
  ],
  // ⚡ 전격 계열
  [ELEMENT_TYPES.ELECTRIC]: [
    {
      id: 'A', name: '체인 집중형', icon: '🔗',
      desc: '체인 횟수 대폭 증가\n단일 피해 감소',
      statMod: { damage: 0.7, range: 1.0, speed: 1.0 },
      special: { chainBonus: 4, chainExplosion: false },
    },
    {
      id: 'B', name: '과부하 제어형', icon: '💥',
      desc: '체인 적중 시 스턴\nDPS 감소',
      statMod: { damage: 0.8, range: 1.0, speed: 1.2 },
      special: { chainStunChance: 0.2, chainStunDuration: 800 },
    },
    {
      id: 'C', name: '번개 러너형', icon: '⚡',
      desc: '첫 타격 극대화\n체인 수 감소',
      statMod: { damage: 1.8, range: 1.0, speed: 1.0 },
      special: { firstHitBonus: 0.5, chainPenalty: -2 },
    },
  ],
  // 🌪️ 질풍 계열
  [ELEMENT_TYPES.WIND]: [
    {
      id: 'A', name: '광역 분쇄형', icon: '💨',
      desc: '범위 피해 증가\n단일 DPS 감소',
      statMod: { damage: 0.9, range: 1.3, speed: 1.1 },
      special: { aoeDamage: true, aoeRadius: 50 },
    },
    {
      id: 'B', name: '흡인 제어형', icon: '🌀',
      desc: '적 끌어당김\n피해 감소',
      statMod: { damage: 0.7, range: 1.1, speed: 1.0 },
      special: { pullEnemies: true, pullDistance: 30 },
    },
    {
      id: 'C', name: '돌풍 타격형', icon: '🌪️',
      desc: '넉백 강화, 고데미지\n범위 감소',
      statMod: { damage: 1.4, range: 0.85, speed: 1.0 },
      special: { knockbackBonus: 25, bossBonus: 0.3 },
    },
  ],
  // 🌀 공허 계열
  [ELEMENT_TYPES.VOID]: [
    {
      id: 'A', name: '시너지 촉매형', icon: '🔮',
      desc: '주변 타워 버프\n개인 DPS 감소',
      statMod: { damage: 0.7, range: 1.2, speed: 1.0 },
      special: { synergyBuff: true, buffRadius: 100, buffAmount: 0.15 },
    },
    {
      id: 'B', name: '균형 딜러형', icon: '⚖️',
      desc: '공격/범위 균형\n전반적 수치 증가',
      statMod: { damage: 1.15, range: 1.15, speed: 0.95 },
      special: {},
    },
    {
      id: 'C', name: '차원 파열형', icon: '🕳️',
      desc: '관통 공격\n피해 감소',
      statMod: { damage: 0.85, range: 1.0, speed: 1.0 },
      special: { piercing: true, pierceCount: 3 },
    },
  ],
  // 💎 광휘 계열
  [ELEMENT_TYPES.LIGHT]: [
    {
      id: 'A', name: '파쇄 타격형', icon: '💎',
      desc: '단일 고데미지\n공격 속도 감소',
      statMod: { damage: 1.6, range: 1.0, speed: 1.4 },
      special: { critChance: 0.2, critDamage: 2.0 },
    },
    {
      id: 'B', name: '넉백 제어형', icon: '🛡️',
      desc: '넉백 거리 증가\n피해 감소',
      statMod: { damage: 0.9, range: 1.1, speed: 1.0 },
      special: { knockbackBonus: 30, knockbackSlow: 0.3 },
    },
    {
      id: 'C', name: '러시 차단형', icon: '🚫',
      desc: '빠른 적 추가 피해\n범위 감소',
      statMod: { damage: 1.1, range: 0.9, speed: 0.9 },
      special: { fastEnemyBonus: 0.6, killBonus: 5 },
    },
  ],
};

// ===== 루프 상한 상수 (매직 넘버 제거용) =====
const ARRAY_LENGTHS = {
  elementTypes: Object.keys(ELEMENT_TYPES).length, // 속성 타입 수 (6)
  supportTypes: Object.keys(SUPPORT_TYPES).length, // 서포트 타입 수 (4)
  maxAutoCombinetier: 2,  // 자동 조합 최대 티어 (T2→T3, T3→T4는 수동)
};
