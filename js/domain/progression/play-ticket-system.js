// Neon Defense - 플레이 티켓 시스템 (스태미나)
// 사양: Plan/TICKET_AND_ADS_DESIGN.md
//
// 핵심 룰
//   - 최대 5장 (자연 충전 캡)
//   - 10분당 1장 자연 충전 (5캡 도달 시 멈춤)
//   - 광고 시청 → +2장 (캡 무시, 일일 제한 없음)
//   - 게임 1판 = -1장 (전 모드)
//   - 매일 00:00 로컬 자정 → 5 미만이면 5로 보충
//   - 시계 어뷰징(과거로 변경) 감지 시 abuseFlag, 자연 충전 중단

const PlayTicketSystem = {
  STORAGE_KEY: 'neonDefense_playTickets_v1',

  // 상수 (외부에서 참조 가능)
  MAX_BASE: 5,
  CHARGE_INTERVAL_MS: 10 * 60 * 1000,
  AD_REFILL_AMOUNT: 2,
  GAME_COST: 1,
  DAILY_FLOOR: 5,
  IAP_PACKAGE_AMOUNT: 50,

  _listeners: new Set(),

  // ===== 내부 헬퍼 =====
  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _defaultState() {
    const now = Date.now();
    return {
      current: this.MAX_BASE,
      lastChargeAt: now,
      lastDailyResetDate: this._today(),
      totalGamesPlayed: 0,
      totalAdRefills: 0,
      totalIAPPurchases: 0,
      abuseFlag: false,
      schemaVersion: 1,
    };
  },

  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this._defaultState();
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== 1) return this._defaultState();
      return Object.assign(this._defaultState(), parsed);
    } catch {
      return this._defaultState();
    }
  },

  _save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 무시 (저장 실패는 메모리 상에서만 유지)
    }
  },

  _emit() {
    this._listeners.forEach(fn => {
      try { fn(); } catch { /* no-op */ }
    });
  },

  // ===== 충전 로직 (멱등) =====
  _applyDecay(state) {
    const now = Date.now();

    // 1) 일일 리셋
    const today = this._today();
    if (state.lastDailyResetDate !== today) {
      if (state.current < this.DAILY_FLOOR) {
        state.current = this.DAILY_FLOOR;
      }
      state.lastDailyResetDate = today;
      state.lastChargeAt = now;
      return state;
    }

    // 2) 시계 어뷰징 감지 (과거로 변경)
    if (state.lastChargeAt > now) {
      state.abuseFlag = true;
      state.lastChargeAt = now;
      return state;
    }

    // 3) 자연 충전
    if (state.current < this.MAX_BASE) {
      const elapsed = now - state.lastChargeAt;
      const chargeCount = Math.floor(elapsed / this.CHARGE_INTERVAL_MS);
      if (chargeCount > 0) {
        const gained = Math.min(chargeCount, this.MAX_BASE - state.current);
        state.current += gained;
        // lastChargeAt 을 정확히 충전된 분만큼만 진행 (남은 시간 보존)
        state.lastChargeAt += gained * this.CHARGE_INTERVAL_MS;
        // 캡에 도달했다면 lastChargeAt 을 now 로 (자연 충전 정지 의도)
        if (state.current >= this.MAX_BASE) {
          state.lastChargeAt = now;
        }
      }
    } else {
      // 캡 이상 — 자연 충전 멈춤. lastChargeAt 을 now 로 밀어 다음 소비 후 새 카운트.
      state.lastChargeAt = now;
    }
    return state;
  },

  // ===== Public API =====

  // 현재 상태 조회 (decay 적용 후 반환, 저장도 함)
  getStatus() {
    const state = this._applyDecay(this._load());
    this._save(state);

    let msUntilNextCharge = 0;
    if (state.current < this.MAX_BASE) {
      const elapsed = Date.now() - state.lastChargeAt;
      msUntilNextCharge = Math.max(0, this.CHARGE_INTERVAL_MS - elapsed);
    }

    return {
      current: state.current,
      max: this.MAX_BASE,
      canPlay: state.current >= this.GAME_COST,
      msUntilNextCharge,
      abuseFlag: state.abuseFlag,
    };
  },

  // 게임 시작 시 차감. 성공 true / 실패(부족) false.
  consume() {
    const state = this._applyDecay(this._load());
    if (state.current < this.GAME_COST) {
      this._save(state);
      return false;
    }
    state.current -= this.GAME_COST;
    state.totalGamesPlayed += 1;
    // 캡 미만으로 떨어진 직후이면 lastChargeAt 을 now 로 시작
    if (state.current < this.MAX_BASE) {
      state.lastChargeAt = Date.now();
    }
    this._save(state);
    this._emit();
    return true;
  },

  // 광고 시청 완료 콜백 (+2)
  refillByAd() {
    const state = this._applyDecay(this._load());
    state.current += this.AD_REFILL_AMOUNT;
    state.totalAdRefills += 1;
    this._save(state);
    this._emit();
    return { gained: this.AD_REFILL_AMOUNT, current: state.current };
  },

  // IAP 구매 콜백 (50티켓 패키지)
  refillByPurchase(amount = this.IAP_PACKAGE_AMOUNT) {
    const state = this._applyDecay(this._load());
    state.current += amount;
    state.totalIAPPurchases += 1;
    this._save(state);
    this._emit();
    return { gained: amount, current: state.current };
  },

  // 주기적 호출 (10초 간격 권장). 자연 충전/일일 리셋 멱등 적용.
  tick() {
    const before = this._load();
    const after = this._applyDecay({ ...before });
    if (after.current !== before.current
        || after.lastDailyResetDate !== before.lastDailyResetDate
        || after.abuseFlag !== before.abuseFlag) {
      this._save(after);
      this._emit();
    }
  },

  // 변경 알림 구독 (UI 위젯에서 사용)
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },

  // ===== 디버그 / 치트 =====
  setCurrent(n) {
    const state = this._load();
    state.current = Math.max(0, Math.floor(n));
    state.lastChargeAt = Date.now();
    this._save(state);
    this._emit();
  },

  reset() {
    this._save(this._defaultState());
    this._emit();
  },

  // 풀 상태 (디버깅용)
  _dumpState() {
    return this._load();
  },
};

window.PlayTicketSystem = PlayTicketSystem;
