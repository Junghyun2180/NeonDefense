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
  },
  [ELEMENT_TYPES.WATER]: {
    name: '빙결', icon: '❄️', desc: '이동속도 감소',
    slowPercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
    slowDuration: { 1: 1500, 2: 2000, 3: 2500, 4: 3000 },
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
  },
  [ELEMENT_TYPES.VOID]: {
    name: '공허', icon: '🌀', desc: '균형잡힌 공격',
  },
  [ELEMENT_TYPES.LIGHT]: {
    name: '광휘', icon: '💎', desc: '균형잡힌 공격',
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
    goldReward: 4, livesLost: 1,
    color: 'bg-purple-600', shadow: '0 0 8px #9333ea', size: 'w-6 h-6',
    icon: null, explosionColor: '#9333ea',
  },
  fast: {
    healthMult: 0.7, speedRange: [0.9, 1.3], speedWaveBonus: 0.02,
    goldReward: 3, livesLost: 1,
    color: 'bg-cyan-400', shadow: '0 0 8px #00ffff', size: 'w-5 h-5',
    icon: null, explosionColor: '#00ffff',
  },
  elite: {
    healthMult: 3.5, speedRange: [0.45, 0.55], speedWaveBonus: 0.02,
    goldReward: 10, livesLost: 2,
    color: 'bg-orange-500', shadow: '0 0 12px #ff6600', size: 'w-7 h-7',
    icon: '⭐', explosionColor: '#ff6600',
  },
  boss: {
    healthMult: null, speedRange: null, speedWaveBonus: 0,
    goldReward: null, livesLost: 10,
    color: 'bg-red-600', shadow: '0 0 20px #ff0000, 0 0 30px #ff0000', size: 'w-8 h-8',
    icon: '👑', explosionColor: '#ff0000',
  },
  jammer: {
    healthMult: 2.2, speedRange: [0.4, 0.5], speedWaveBonus: 0.01,
    goldReward: 12, livesLost: 1,
    color: 'bg-violet-500', shadow: '0 0 15px #8b5cf6, 0 0 30px #8b5cf6', size: 'w-7 h-7',
    icon: '📡', explosionColor: '#8b5cf6',
    debuffType: 'speed', debuffFactor: 0.4, debuffRange: 100,
  },
  suppressor: {
    healthMult: 2.5, speedRange: [0.35, 0.45], speedWaveBonus: 0.01,
    goldReward: 14, livesLost: 1,
    color: 'bg-pink-500', shadow: '0 0 15px #ec4899, 0 0 30px #ec4899', size: 'w-7 h-7',
    icon: '🛡️', explosionColor: '#ec4899',
    debuffType: 'damage', debuffFactor: 0.5, debuffRange: 100,
  },
  // 새로운 적 타입: 힐러 - 주변 적 회복
  healer: {
    healthMult: 1.5, speedRange: [0.35, 0.45], speedWaveBonus: 0,
    goldReward: 15, livesLost: 1,
    color: 'bg-green-500', shadow: '0 0 15px #22c55e, 0 0 30px #22c55e', size: 'w-7 h-7',
    icon: '💚', explosionColor: '#22c55e',
    healRange: 80, healAmount: 0.05, healInterval: 1000,
  },
  // 새로운 적 타입: 분열체 - 죽으면 작은 적 2마리로 분열
  splitter: {
    healthMult: 2.0, speedRange: [0.4, 0.5], speedWaveBonus: 0,
    goldReward: 8, livesLost: 1,
    color: 'bg-lime-500', shadow: '0 0 12px #84cc16, 0 0 25px #84cc16', size: 'w-7 h-7',
    icon: '💠', explosionColor: '#84cc16',
    splitCount: 2, splitHealthMult: 0.4, splitSpeedMult: 1.3,
  },
};

// ===== 스폰 규칙 (우선순위 순 — 첫 매칭 타입 사용) =====
const SPAWN_RULES = [
  { type: 'boss',       condition: (idx, total) => idx === total - 1 },
  { type: 'healer',     condition: (idx, total, wave, stage) => stage >= 2 && wave >= 3, chanceBase: 0.08, chancePerStage: 0.03 },
  { type: 'splitter',   condition: (idx, total, wave, stage) => stage >= 2, chanceBase: 0.1, chancePerStage: 0.03 },
  { type: 'elite',      condition: (idx, total, wave, stage, progress) => wave >= 2 && progress > 0.5, chanceBase: 0.15, chancePerWave: 0.08 },
  { type: 'jammer',     condition: (idx, total, wave, stage) => wave >= 2, chanceBase: 0.12, chancePerStage: 0.03 },
  { type: 'suppressor', condition: (idx, total, wave, stage) => wave >= 3, chanceBase: 0.10, chancePerStage: 0.03 },
  { type: 'fast',       condition: () => true, chanceBase: 0.25, chancePerWave: 0.06 },
  { type: 'normal',     condition: () => true, chance: 1.0 },
];

// ===== 체력 스케일링 =====
const HEALTH_SCALING = {
  base: 40,
  stageGrowth: 0.65,
  waveGrowth: 0.35,
  lateWaveThreshold: 4,
  lateWaveBonus: 1.5,
  bossFormula: (stage) => 12 + stage * 1.5,
};

// ===== 경제 설정 =====
const ECONOMY = {
  startGold: 100,
  startLives: 20,
  drawCost: 20,
  maxInventory: 30, // 5행 x 6열
  sellRefundRate: 0.5,
  towerBaseValues: { 1: 20, 2: 60, 3: 180, 4: 540 },
  waveReward: (wave) => 20 + wave * 5 + (wave === 5 ? 20 : 0),
  stageClearBonus: (stage) => 50 + stage * 10,
  bossGoldReward: (stage, wave) => 30 + stage * 10 + wave * 5,
  // 서포트 타워 경제
  supportDrawCost: 40,
  maxSupportInventory: 15, // 3열 x 5행
  supportBaseValues: { 1: 40, 2: 120, 3: 360 },
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
};

// ===== 스폰 설정 =====
const SPAWN = {
  enemiesPerWave: (stage, wave) => Math.floor(15 + wave * 4 + stage * 3),
  spawnDelay: (stage, wave) => Math.max(250, 500 - wave * 30 - stage * 20),
  wavesPerStage: 5,
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
