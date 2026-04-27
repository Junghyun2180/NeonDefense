// Neon Defense - 적-속성 상성 시스템 (Affinity)
//
// 핵심 정체성 보강: "적 테마가 변하면 같은 빌드의 효율도 변한다"
// 추천 시스템은 일부러 두지 않는다. 유저가 데미지 체감으로 직접 발견하도록.
//
// 매트릭스 설계 의도:
//   fast       → 냉기 약점 (slow 가 천적)
//   elite      → 공허 약점 (방어 관통)
//   aegis      → 공허 약점 (실드 관통), 냉기/전격 저항 (실드가 흡수)
//   splitter   → 화염/전격 약점 (광역으로 분열체까지)
//   healer     → 광휘 약점 (처형으로 즉시 제거), 질풍 약점 (격리)
//   jammer     → 광휘 약점 (처형), 전격 약점 (단일 강타)
//   suppressor → 공허/광휘 약점 (방어를 뚫거나 한 방에)
//   boss       → 공허 약점, 냉기 저항 (보스는 슬로우 효과 둔화)
//   normal     → 중립
//
// 약점: 1.3 ~ 1.5 (체감 명확)
// 저항: 0.85 ~ 0.9 (좌절감 안 주도록 보수적)
// 명시 안 된 조합은 1.0 (중립)
//
// 곱셈 위치: AbilitySystem.resolveAllHits — 본 hit / aoe / pierce / chain 데미지 모두 적용

const AFFINITY = {
  fast:       { [ELEMENT_TYPES.WATER]: 1.4 },
  elite:      { [ELEMENT_TYPES.VOID]:  1.4 },
  aegis: {
    [ELEMENT_TYPES.VOID]:     1.5,
    [ELEMENT_TYPES.WATER]:    0.85,
    [ELEMENT_TYPES.ELECTRIC]: 0.85,
  },
  splitter: {
    [ELEMENT_TYPES.FIRE]:     1.3,
    [ELEMENT_TYPES.ELECTRIC]: 1.3,
  },
  healer: {
    [ELEMENT_TYPES.LIGHT]: 1.4,
    [ELEMENT_TYPES.WIND]:  1.3,
  },
  jammer: {
    [ELEMENT_TYPES.LIGHT]:    1.4,
    [ELEMENT_TYPES.ELECTRIC]: 1.3,
  },
  suppressor: {
    [ELEMENT_TYPES.VOID]:  1.3,
    [ELEMENT_TYPES.LIGHT]: 1.3,
  },
  boss: {
    [ELEMENT_TYPES.VOID]:  1.3,
    [ELEMENT_TYPES.WATER]: 0.9,
  },
  normal: {},
};

const AffinitySystem = {
  // 데미지 배율 조회. 미정의 조합은 1.0
  getMultiplier(element, enemyType) {
    if (element == null || !enemyType) return 1.0;
    const row = AFFINITY[enemyType];
    if (!row) return 1.0;
    const m = row[element];
    return m == null ? 1.0 : m;
  },

  // 분류 헬퍼 — 시각 피드백 / KPI 로깅용
  // returns 'weak' (1.2+) | 'resist' (<1.0) | 'neutral'
  classify(multiplier) {
    if (multiplier >= 1.2) return 'weak';
    if (multiplier < 1.0) return 'resist';
    return 'neutral';
  },
};

window.AFFINITY = AFFINITY;
window.AffinitySystem = AffinitySystem;
