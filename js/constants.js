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
    healthMult: 1.0, speedRange: [0.45, 0.6], speedWaveBonus: 0.03,
    goldReward: 4, livesLost: 1,
    color: 'bg-purple-600', shadow: '0 0 8px #9333ea', size: 'w-6 h-6',
    icon: null, explosionColor: '#9333ea',
  },
  fast: {
    healthMult: 0.6, speedRange: [0.8, 1.1], speedWaveBonus: 0,
    goldReward: 3, livesLost: 1,
    color: 'bg-cyan-400', shadow: '0 0 8px #00ffff', size: 'w-5 h-5',
    icon: null, explosionColor: '#00ffff',
  },
  elite: {
    healthMult: 2.5, speedRange: [0.4, 0.5], speedWaveBonus: 0,
    goldReward: 8, livesLost: 1,
    color: 'bg-orange-500', shadow: '0 0 12px #ff6600', size: 'w-7 h-7',
    icon: '⭐', explosionColor: '#ff6600',
  },
  boss: {
    healthMult: null, speedRange: null, speedWaveBonus: 0,
    goldReward: null, livesLost: 5,
    color: 'bg-red-600', shadow: '0 0 20px #ff0000, 0 0 30px #ff0000', size: 'w-8 h-8',
    icon: '👑', explosionColor: '#ff0000',
  },
  jammer: {
    healthMult: 1.8, speedRange: [0.35, 0.45], speedWaveBonus: 0,
    goldReward: 10, livesLost: 1,
    color: 'bg-violet-500', shadow: '0 0 15px #8b5cf6, 0 0 30px #8b5cf6', size: 'w-7 h-7',
    icon: '📡', explosionColor: '#8b5cf6',
    debuffType: 'speed', debuffFactor: 0.5, debuffRange: 80,
  },
  suppressor: {
    healthMult: 2.0, speedRange: [0.3, 0.4], speedWaveBonus: 0,
    goldReward: 12, livesLost: 1,
    color: 'bg-pink-500', shadow: '0 0 15px #ec4899, 0 0 30px #ec4899', size: 'w-7 h-7',
    icon: '🛡️', explosionColor: '#ec4899',
    debuffType: 'damage', debuffFactor: 0.6, debuffRange: 80,
  },
};

// ===== 스폰 규칙 (우선순위 순 — 첫 매칭 타입 사용) =====
const SPAWN_RULES = [
  { type: 'boss',       condition: (idx, total) => idx === total - 1 },
  { type: 'elite',      condition: (idx, total, wave, stage, progress) => wave >= 3 && progress > 0.7, chance: 0.3 },
  { type: 'jammer',     condition: (idx, total, wave, stage) => wave >= 2, chanceBase: 0.1, chancePerStage: 0.02 },
  { type: 'suppressor', condition: (idx, total, wave, stage) => wave >= 4, chanceBase: 0.08, chancePerStage: 0.02 },
  { type: 'fast',       condition: () => true, chanceBase: 0.2, chancePerWave: 0.05 },
  { type: 'normal',     condition: () => true, chance: 1.0 },
];

// ===== 체력 스케일링 =====
const HEALTH_SCALING = {
  base: 30,
  stageGrowth: 0.5,
  waveGrowth: 0.25,
  lateWaveThreshold: 4,
  lateWaveBonus: 1.3,
  bossFormula: (stage) => 8 + stage,
};

// ===== 경제 설정 =====
const ECONOMY = {
  startGold: 100,
  startLives: 20,
  drawCost: 20,
  sellRefundRate: 0.5,
  towerBaseValues: { 1: 20, 2: 60, 3: 180, 4: 540 },
  waveReward: (wave) => 20 + wave * 5 + (wave === 5 ? 20 : 0),
  stageClearBonus: (stage) => 50 + stage * 10,
  bossGoldReward: (stage, wave) => 30 + stage * 10 + wave * 5,
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
