// Neon Defense - 도움말 데이터
// 도움말 내용을 구조화하여 관리

const HELP_DATA = {
  // 페이지 정의
  pages: [
    {
      id: 'basics',
      title: '기본 조작',
      icon: '🎮',
      color: 'text-pink-400',
    },
    {
      id: 'towers',
      title: '타워 정보',
      icon: '🗼',
      color: 'text-purple-400',
    },
    {
      id: 'enemies',
      title: '적 정보',
      icon: '👾',
      color: 'text-red-400',
    },
    {
      id: 'support',
      title: '서포트 타워',
      icon: '🛡️',
      color: 'text-blue-400',
    },
    {
      id: 'tips',
      title: '전략 팁',
      icon: '💡',
      color: 'text-yellow-400',
    },
  ],

  // 페이지별 섹션 내용
  sections: {
    // 페이지 1: 기본 조작
    basics: [
      {
        title: '뽑기 & 조합',
        icon: '🎲',
        color: 'text-pink-400',
        items: [
          { label: '뽑기', desc: '랜덤 Tier 1 네온 획득', color: 'text-pink-400', costKey: 'drawCost' },
          { label: '선택 조합', desc: '인벤토리에서 같은 타입 3개 선택 후 조합', color: 'text-yellow-400' },
          { label: '전체 조합', desc: '조합 가능한 모든 타워 자동 조합', color: 'text-amber-400' },
        ],
      },
      {
        title: '배치 & 판매',
        icon: '📍',
        color: 'text-cyan-400',
        items: [
          { label: '배치 (PC)', desc: '인벤토리에서 드래그하여 맵에 배치', color: 'text-cyan-400' },
          { label: '배치 (모바일)', desc: '빈 타일 탭 → 속성 선택 → 티어 선택', color: 'text-green-400' },
          { label: '타워 조합', desc: '맵에서 같은 타워 3개 선택 후 조합', color: 'text-emerald-400' },
          { label: '판매', desc: '맵의 타워 선택 후 판매', color: 'text-red-400', refundKey: 'sellRefundRate' },
        ],
      },
      {
        title: '게임 진행',
        icon: '▶️',
        color: 'text-green-400',
        items: [
          { label: '웨이브 시작', desc: 'START 버튼 또는 자동으로 시작', color: 'text-green-400' },
          { label: '게임 속도', desc: '1x / 2x / 3x 속도 조절 가능', color: 'text-blue-400' },
          { label: '스테이지 클리어', desc: '5 웨이브 완료 시 다음 스테이지', color: 'text-purple-400' },
        ],
      },
    ],

    // 페이지 2: 타워 정보
    towers: [
      {
        title: '속성 시스템',
        icon: '🔮',
        color: 'text-purple-400',
        type: 'elements', // 특수 타입: ELEMENT_UI 데이터 사용
      },
      {
        title: '티어 시스템',
        icon: '⬆️',
        color: 'text-cyan-400',
        items: [
          { label: 'T1 (Tier 1)', desc: '기본 타워, 뽑기로 획득', color: 'text-gray-400' },
          { label: 'T2 (Tier 2)', desc: 'T1 × 3 조합', color: 'text-green-400' },
          { label: 'T3 (Tier 3)', desc: 'T2 × 3 조합', color: 'text-blue-400' },
          { label: 'T4 (Tier 4)', desc: 'T3 × 3 조합, 역할 선택 가능', color: 'text-purple-400' },
        ],
      },
      {
        title: 'T4 역할 시스템',
        icon: '⚔️',
        color: 'text-yellow-400',
        items: [
          { label: 'A 역할', desc: '강화된 기본 효과 (스택, 광역 등)', color: 'text-red-400' },
          { label: 'B 역할', desc: '새로운 CC 효과 (빙결, 스턴 등)', color: 'text-blue-400' },
          { label: 'C 역할', desc: '특수 상황 보너스 (빠른 적, 돌진 등)', color: 'text-green-400' },
        ],
      },
    ],

    // 페이지 3: 적 정보
    enemies: [
      {
        title: '기본 적',
        icon: '👹',
        color: 'text-gray-400',
        type: 'enemies_basic', // 특수 타입: normal, fast
      },
      {
        title: '강력한 적',
        icon: '⭐',
        color: 'text-yellow-400',
        type: 'enemies_strong', // 특수 타입: elite, boss
      },
      {
        title: '특수 적',
        icon: '🔧',
        color: 'text-purple-400',
        type: 'enemies_special', // 특수 타입: jammer, suppressor, healer, splitter
      },
    ],

    // 페이지 4: 서포트 타워
    support: [
      {
        title: '서포트 타워란?',
        icon: '❓',
        color: 'text-blue-400',
        items: [
          { label: '역할', desc: '공격하지 않고 주변 타워/적에 버프/디버프', color: 'text-blue-400' },
          { label: '뽑기 비용', desc: '40G로 랜덤 서포트 획득', color: 'text-yellow-400' },
          { label: '조합', desc: '같은 타입 S1 × 3 = S2, S2 × 3 = S3', color: 'text-green-400' },
        ],
      },
      {
        title: '서포트 타입',
        icon: '🛡️',
        color: 'text-purple-400',
        type: 'support_types', // 특수 타입: SUPPORT_UI 데이터 사용
      },
      {
        title: '버프 규칙',
        icon: '📊',
        color: 'text-cyan-400',
        items: [
          { label: '중첩', desc: '같은 타입 버프는 가산됨', color: 'text-green-400' },
          { label: '상한선', desc: '공격력/공속/사거리 +100%, 방감 +50%', color: 'text-red-400' },
          { label: '범위', desc: 'S1: 100px, S2: 120px, S3: 150px', color: 'text-blue-400' },
        ],
      },
    ],

    // 페이지 5: 전략 팁
    tips: [
      {
        title: '초반 전략',
        icon: '🌱',
        color: 'text-green-400',
        items: [
          { label: '뽑기 우선', desc: '초반에는 T1 타워를 많이 뽑아 조합 재료 확보', color: 'text-green-400' },
          { label: '경로 확인', desc: '적의 이동 경로를 파악하고 교차점에 배치', color: 'text-cyan-400' },
          { label: '속성 분산', desc: '다양한 속성을 뽑아 상황 대응력 확보', color: 'text-purple-400' },
        ],
      },
      {
        title: '속성별 활용',
        icon: '🔥',
        color: 'text-orange-400',
        items: [
          { label: '🔥 화염', desc: '지속 데미지로 고체력 적에 효과적', color: 'text-red-400' },
          { label: '❄️ 냉기', desc: '슬로우로 적을 늦춰 다른 타워 DPS 증가', color: 'text-blue-400' },
          { label: '⚡ 전격', desc: '체인으로 다수의 적 처리에 탁월', color: 'text-yellow-400' },
          { label: '🌪️ 질풍', desc: '높은 데미지 + 넉백으로 보스 킬러', color: 'text-teal-400' },
          { label: '🌀 공허', desc: '관통으로 일렬로 오는 적 처리', color: 'text-violet-400' },
          { label: '💎 광휘', desc: '처형으로 저체력 적 마무리', color: 'text-amber-400' },
        ],
      },
      {
        title: '고급 팁',
        icon: '🎯',
        color: 'text-yellow-400',
        items: [
          { label: '서포트 배치', desc: '여러 타워가 버프 범위 안에 들어오도록 배치', color: 'text-blue-400' },
          { label: '힐러 우선', desc: '💚 힐러는 먼저 처치해야 웨이브 클리어 쉬움', color: 'text-green-400' },
          { label: '분열체 주의', desc: '💠 분열체는 체인 라이트닝으로 한번에 처리', color: 'text-purple-400' },
          { label: '디버퍼 대응', desc: '📡🛡️ 디버퍼는 사거리 밖에서 공격하거나 서포트로 보완', color: 'text-red-400' },
        ],
      },
      {
        title: '스테이지별 주의점',
        icon: '⚠️',
        color: 'text-red-400',
        items: [
          { label: 'Stage 1-2', desc: '기본 적 위주, 조합에 집중', color: 'text-gray-400' },
          { label: 'Stage 3-5', desc: '디버퍼 등장, 사거리와 배치 중요', color: 'text-yellow-400' },
          { label: 'Stage 6+', desc: '힐러/분열체 증가, 광역 딜러 필수', color: 'text-red-400' },
          { label: 'Wave 5', desc: '항상 보스 출현! 고데미지 타워 준비', color: 'text-purple-400' },
        ],
      },
    ],
  },

  // 적 타입 상세 정보
  enemyDetails: {
    basic: ['normal', 'fast'],
    strong: ['elite', 'boss'],
    special: ['jammer', 'suppressor', 'healer', 'splitter'],
    labels: {
      normal: '일반',
      fast: '빠름',
      elite: '엘리트',
      boss: '보스',
      jammer: '방해자',
      suppressor: '억제자',
      healer: '힐러',
      splitter: '분열체',
    },
    descriptions: {
      normal: '기본 적, 특수 능력 없음',
      fast: '체력 60%, 이동속도 2배',
      elite: '체력 250%, 높은 골드 보상',
      boss: '체력 800%+, 웨이브 5에 등장',
      jammer: '주변 타워 공속 60% 감소',
      suppressor: '주변 타워 공격력 50% 감소',
      healer: '주변 적 체력 5% 회복',
      splitter: '사망 시 2마리로 분열',
    },
    counters: {
      normal: '모든 타워 효과적',
      fast: '슬로우, 광역 공격',
      elite: '화상, 고DPS 타워',
      boss: '질풍, 서포트 버프',
      jammer: '사거리 밖 배치, 먼저 처치',
      suppressor: '서포트로 데미지 보완',
      healer: '우선 처치, 광역 딜',
      splitter: '체인 라이트닝, 고데미지',
    },
  },
};

window.HELP_DATA = HELP_DATA;
