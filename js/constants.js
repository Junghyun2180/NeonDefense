// Neon Defense - Constants

const TILE_SIZE = 40;
const GRID_WIDTH = 16;
const GRID_HEIGHT = 12;

// 속성 타입 정의
const ELEMENT_TYPES = {
  FIRE: 0,      // 빨간색 - 화상 (지속 데미지)
  WATER: 1,     // 파란색 - 빙결 (이동속도 감소)  
  ELECTRIC: 2,  // 노란색 - 전기 (체인 라이트닝)
  WIND: 3,      // 초록색 - 바람 (고데미지 + 넉백)
  VOID: 4,      // 보라색 - 공허 (일반 공격)
  LIGHT: 5,     // 은색 - 빛 (일반 공격)
};

// 속성별 특수 효과 설정
const ELEMENT_EFFECTS = {
  [ELEMENT_TYPES.FIRE]: {
    name: '화상',
    icon: '🔥',
    desc: '지속 데미지',
    burnDuration: { 1: 2000, 2: 2500, 3: 3000, 4: 4000 },
    burnDamagePercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
    burnTicks: 4,
  },
  [ELEMENT_TYPES.WATER]: {
    name: '빙결',
    icon: '❄️',
    desc: '이동속도 감소',
    slowPercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
    slowDuration: { 1: 1500, 2: 2000, 3: 2500, 4: 3000 },
  },
  [ELEMENT_TYPES.ELECTRIC]: {
    name: '전격',
    icon: '⚡',
    desc: '체인 라이트닝',
    chainCount: { 1: 2, 2: 3, 3: 4, 4: 6 },
    chainDamageDecay: 0.7,
    chainRange: 80,
  },
  [ELEMENT_TYPES.WIND]: {
    name: '질풍',
    icon: '🌪️',
    desc: '고데미지 + 넉백',
    damageMultiplier: { 1: 1.5, 2: 1.8, 3: 2.2, 4: 3.0 },
    knockbackDistance: { 1: 15, 2: 20, 3: 25, 4: 35 },
  },
  [ELEMENT_TYPES.VOID]: {
    name: '공허',
    icon: '🌀',
    desc: '균형잡힌 공격',
  },
  [ELEMENT_TYPES.LIGHT]: {
    name: '광휘',
    icon: '💎',
    desc: '균형잡힌 공격',
  },
};

// 네온 타워 타입 정의
const NEON_TYPES = {
  1: { 
    tier: 1, 
    colors: ['#FF6B6B', '#45B7D1', '#FFD93D', '#96E6A1', '#DDA0DD', '#C0C0C0'], 
    names: ['레드 스파크', '블루 웨이브', '옐로 버스트', '그린 플래시', '퍼플 글로우', '실버 샤인'], 
    damage: 10, range: 80, speed: 1000 
  },
  2: { 
    tier: 2, 
    colors: ['#FF4444', '#1E90FF', '#FFD700', '#32CD32', '#BA55D3', '#D8D8D8'], 
    names: ['크림슨 블레이즈', '오션 포스', '골든 플레어', '네이처 빔', '아메시스트 레이', '스틸 글로우'], 
    damage: 30, range: 100, speed: 800 
  },
  3: { 
    tier: 3, 
    colors: ['#FF0000', '#0066FF', '#FFAA00', '#00FF00', '#9400D3', '#E8E8E8'], 
    names: ['인페르노', '딥 시', '솔라 프리즘', '포레스트 가디언', '보이드 워커', '미스릴 코어'], 
    damage: 100, range: 120, speed: 600 
  },
  4: { 
    tier: 4, 
    colors: ['#FF0066', '#0044FF', '#FF6600', '#00FF88', '#7B00FF', '#F5F5F5'], 
    names: ['피닉스 라이즈', '애비스 로드', '노바 버스트', '월드 트리', '다크 매터', '플래티넘 스타'], 
    damage: 350, range: 150, speed: 400 
  }
};

// 경로 색상
const PATH_COLORS = ['#4ECDC4', '#45B7D1', '#96E6A1']; // 시안, 파랑, 초록
const END_COLORS = ['#FF6B6B', '#FFD93D']; // 빨강, 노랑
