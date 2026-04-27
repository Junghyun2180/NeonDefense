// Neon Defense - 웨이브 테마 (Wave Theme) 시스템
// 핵심 정체성: "스테이지마다 메타가 다르게" — 매 스테이지 안에서 웨이브 묶음별로
// 적 구성 풀이 완전히 달라져, 동일한 빌드로는 모든 웨이브를 같은 효율로 깨지 못한다.
//
// MVP 적용 범위 (밸런스 담당 권장):
//   Stage 1: 테마 OFF (기본 메카닉 학습)
//   Stage 2: 약하게 ON (2개 테마 윈도)
//   Stage 3: 풀 강도 ON (3개 테마 윈도)
//
// 안전망: 테마가 boost 하려는 적 타입이 STAGE_ENEMY_POOL 에 없으면, 가용한 boost 타입만
// 적용되고 나머지 보정은 무시 — pool 해금 규칙을 깨지 않는다.

const WAVE_THEMES = {
  fast_swarm: {
    id: 'fast_swarm',
    name: '고속 군단',
    icon: '💨',
    color: '#06b6d4',
    hint: '빠른 적이 쏟아진다 — 단일 강타격보다 슬로우/광역이 효과적',
    boost: { fast: 0.50, splitter: 0.25 },
    nonBoostMultiplier: 0.4, // 부스트되지 않는 특수 타입 등장률 ×0.4
  },
  elite_assault: {
    id: 'elite_assault',
    name: '엘리트 강습',
    icon: '⭐',
    color: '#f59e0b',
    hint: '고체력 엘리트 비율 급증 — 공허/광휘 같은 단일 화력 타워가 답',
    boost: { elite: 0.40, aegis: 0.25 },
    nonBoostMultiplier: 0.4,
  },
  disruption: {
    id: 'disruption',
    name: '교란 부대',
    icon: '📡',
    color: '#a855f7',
    hint: '재머·억제자가 타워를 약화시킨다 — 우선 타격 + 처형 추천',
    boost: { jammer: 0.40, suppressor: 0.25 },
    nonBoostMultiplier: 0.4,
  },
  armored: {
    id: 'armored',
    name: '중장갑',
    icon: '🛡',
    color: '#0ea5e9',
    hint: '실드·방어 적이 압도 — 공허 관통 또는 누적 화상',
    boost: { aegis: 0.50, elite: 0.25 },
    nonBoostMultiplier: 0.4,
  },
};

// 스테이지별 테마 활성 윈도우. 각 슬롯은 [startWave..endWave] 범위에 themeId 적용.
// W5(미니보스), W10(스테이지보스) 같은 이벤트 웨이브는 피해서 배치.
const STAGE_WAVE_THEMES = {
  1: [], // 학습 단계 — 테마 OFF
  2: [
    { startWave: 3, endWave: 4, themeId: 'fast_swarm' },
    { startWave: 7, endWave: 9, themeId: 'elite_assault' },
  ],
  3: [
    { startWave: 2, endWave: 4, themeId: 'fast_swarm' },
    { startWave: 6, endWave: 7, themeId: 'disruption' },
    { startWave: 8, endWave: 9, themeId: 'armored' },
  ],
};

const WaveThemeSystem = {
  // 현재 (stage, wave) 에 활성 테마. 없으면 null.
  getTheme(stage, wave) {
    const slots = STAGE_WAVE_THEMES[stage];
    if (!slots || slots.length === 0) return null;
    for (const slot of slots) {
      if (wave >= slot.startWave && wave <= slot.endWave) {
        return WAVE_THEMES[slot.themeId] || null;
      }
    }
    return null;
  },

  // 이번 wave 에서 새로 시작되는 테마 (배너 트리거용). 없으면 null.
  getThemeStartingAt(stage, wave) {
    const slots = STAGE_WAVE_THEMES[stage];
    if (!slots || slots.length === 0) return null;
    for (const slot of slots) {
      if (slot.startWave === wave) return WAVE_THEMES[slot.themeId] || null;
    }
    return null;
  },

  // 테마 + 스테이지 풀을 결합해 "적용 가능한 boost" 만 추출
  // pool 에 없는 타입은 자동 제외 — STAGE_ENEMY_POOL 해금 규칙 보장
  resolveBoost(theme, pool) {
    if (!theme) return null;
    const result = {};
    for (const [type, chance] of Object.entries(theme.boost)) {
      if (pool.includes(type)) result[type] = chance;
    }
    return Object.keys(result).length > 0 ? result : null;
  },
};

window.WAVE_THEMES = WAVE_THEMES;
window.STAGE_WAVE_THEMES = STAGE_WAVE_THEMES;
window.WaveThemeSystem = WaveThemeSystem;
