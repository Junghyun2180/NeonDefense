// Neon Defense - 일일 출석 보상 시스템
// 7일 사이클 (day 1~7), 매일 새로운 보상. 연속 끊기면 day 1부터.
//
// 보상 스케줄:
//   Day 1: 크리스탈 +10
//   Day 2: 무료 뽑기권 1
//   Day 3: 크리스탈 +20
//   Day 4: 무료 뽑기권 2
//   Day 5: 크리스탈 +30
//   Day 6: 크리스탈 +50 + 뽑기권 1
//   Day 7: 크리스탈 +100 + Prism 확률 부스터 24h (단순화: +크리스탈 보너스)
//
// 저장: localStorage 'neonDefense_dailyLogin_v1'
//   { currentDay: 1~7, lastClaimDate: 'YYYY-MM-DD', streak: N }

const DailyLogin = {
  STORAGE_KEY: 'neonDefense_dailyLogin_v1',

  REWARDS: [
    { day: 1, crystals: 10, tickets: 0, icon: '💎', label: '크리스탈 +10' },
    { day: 2, crystals: 0, tickets: 1, icon: '🎲', label: '뽑기권 1장' },
    { day: 3, crystals: 20, tickets: 0, icon: '💎', label: '크리스탈 +20' },
    { day: 4, crystals: 0, tickets: 2, icon: '🎲', label: '뽑기권 2장' },
    { day: 5, crystals: 30, tickets: 0, icon: '💎', label: '크리스탈 +30' },
    { day: 6, crystals: 50, tickets: 1, icon: '💎', label: '크리스탈 +50 + 뽑기권 1' },
    { day: 7, crystals: 100, tickets: 0, icon: '🌟', label: '크리스탈 +100 (7일 완주!)' },
  ],

  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _daysBetween(a, b) {
    const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
    return Math.floor((parse(b) - parse(a)) / (1000 * 60 * 60 * 24));
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return { currentDay: 0, lastClaimDate: null, streak: 0 };
      const parsed = JSON.parse(raw);
      return { currentDay: parsed.currentDay || 0, lastClaimDate: parsed.lastClaimDate || null, streak: parsed.streak || 0 };
    } catch {
      return { currentDay: 0, lastClaimDate: null, streak: 0 };
    }
  },

  save(state) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state)); } catch { /* no-op */ }
  },

  // 오늘 수령 가능 여부
  getStatus() {
    const state = this.load();
    const today = this._today();
    if (!state.lastClaimDate) {
      return { canClaim: true, nextDay: 1, reward: this.REWARDS[0], state };
    }
    const diff = this._daysBetween(state.lastClaimDate, today);
    if (diff === 0) {
      return { canClaim: false, nextDay: state.currentDay, reward: this.REWARDS[state.currentDay - 1], state, reason: '오늘 이미 수령함' };
    }
    let nextDay;
    if (diff === 1) {
      // 연속 출석
      nextDay = state.currentDay >= 7 ? 1 : state.currentDay + 1;
    } else {
      // 끊어짐 — day 1부터 재시작
      nextDay = 1;
    }
    return { canClaim: true, nextDay, reward: this.REWARDS[nextDay - 1], state, streakBroken: diff > 1 };
  },

  // 오늘 보상 수령 (runModeState에서 crystals/tickets 지급 콜백 주입)
  claim({ onCrystals, onTickets } = {}) {
    const status = this.getStatus();
    if (!status.canClaim) return { claimed: false, reason: status.reason };
    const { nextDay, reward, streakBroken } = status;
    if (reward.crystals > 0 && typeof onCrystals === 'function') onCrystals(reward.crystals);
    if (reward.tickets > 0 && typeof onTickets === 'function') onTickets(reward.tickets);
    const streak = streakBroken ? 1 : (status.state.streak || 0) + 1;
    this.save({ currentDay: nextDay, lastClaimDate: this._today(), streak });
    return { claimed: true, day: nextDay, reward, streak };
  },

  reset() {
    this.save({ currentDay: 0, lastClaimDate: null, streak: 0 });
  },
};

window.DailyLogin = DailyLogin;
