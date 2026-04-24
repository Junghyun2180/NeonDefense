// Neon Defense - 스테이지 별점 시스템
// 클리어 시 라이프 손실량 기준으로 1~3별 평가. 최고 별점만 유지 (재도전 시 갱신).
//
// 평가 규칙 (max는 스테이지 시작 시점 lives):
//   ★    : 클리어 (라이프 손실 무관)
//   ★★   : 라이프 손실 ≤ max * 0.3 (70% 이상 유지)
//   ★★★  : 라이프 손실 == 0 (퍼펙트)
//
// 저장: localStorage 'neonDefense_starRating_v1'
//   { stars: { 1: 3, 2: 2, ... }, perfectClears: N, allThreeStar: ts }

const StarRating = {
  STORAGE_KEY: 'neonDefense_starRating_v1',

  // 평가 — 숫자 반환
  evaluate({ cleared, maxLives, livesLost }) {
    if (!cleared) return 0;
    if (livesLost === 0) return 3;
    const lossRatio = livesLost / Math.max(1, maxLives);
    if (lossRatio <= 0.30) return 2;
    return 1;
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return { stars: {}, perfectClears: 0, allThreeStar: null };
      const parsed = JSON.parse(raw);
      return {
        stars: parsed.stars || {},
        perfectClears: parsed.perfectClears || 0,
        allThreeStar: parsed.allThreeStar || null,
      };
    } catch {
      return { stars: {}, perfectClears: 0, allThreeStar: null };
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable */ }
  },

  // 스테이지 별점 기록 (이전보다 높을 때만 갱신 → newBest 반환)
  recordStage(stage, stars) {
    const state = this.load();
    const prev = state.stars[stage] || 0;
    let newBest = false;
    if (stars > prev) {
      state.stars[stage] = stars;
      newBest = true;
    }
    if (stars === 3) state.perfectClears = (state.perfectClears || 0) + 1;
    this.save(state);
    return { newBest, prevStars: prev, curStars: state.stars[stage] };
  },

  getStars(stage) {
    const state = this.load();
    return state.stars[stage] || 0;
  },

  // 전체 스테이지 3별 달성 확인
  checkAllThreeStar(maxStage) {
    const state = this.load();
    for (let s = 1; s <= maxStage; s++) {
      if ((state.stars[s] || 0) < 3) return false;
    }
    if (!state.allThreeStar) {
      state.allThreeStar = Date.now();
      this.save(state);
      return { firstTime: true };
    }
    return { firstTime: false };
  },

  // 전체 별 획득 합 (최대 maxStage * 3)
  totalStars() {
    const state = this.load();
    return Object.values(state.stars).reduce((a, b) => a + b, 0);
  },

  reset() {
    this.save({ stars: {}, perfectClears: 0, allThreeStar: null });
  },
};

window.StarRating = StarRating;
