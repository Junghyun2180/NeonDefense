// Neon Defense - 일일 챌린지 시스템
// 날짜 기반 시드 생성 및 모디파이어 결정

const DailyChallenge = {
  // 오늘의 시드 생성 (날짜 기반 결정론적)
  getTodaySeed() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const char = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // 32bit 정수 변환
    }
    return Math.abs(hash);
  },

  // 시드 기반 의사난수 생성기
  _seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
      return (s >>> 0) / 0xFFFFFFFF;
    };
  },

  // 시드로부터 모디파이어 2개 선택
  getModifiers(seed) {
    const random = this._seededRandom(seed);
    const modifierIds = Object.keys(DAILY_MODIFIERS);
    const shuffled = [...modifierIds].sort(() => random() - 0.5);
    return shuffled.slice(0, 2);
  },

  // 오늘의 챌린지 정보
  getTodayChallenge() {
    const seed = this.getTodaySeed();
    const modifiers = this.getModifiers(seed);
    return {
      seed,
      modifiers,
      modifierDetails: modifiers.map(id => DAILY_MODIFIERS[id]).filter(Boolean),
    };
  },
};

// 전역 등록
window.DailyChallenge = DailyChallenge;
