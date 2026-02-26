// Neon Defense - 리더보드 시스템
// localStorage 기반 모드별 Top 10 기록 관리

const Leaderboard = {
  STORAGE_KEY: 'neonDefense_leaderboard_v1',
  MAX_ENTRIES: 10,

  // 전체 리더보드 로드
  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { standard: [], daily: [], endless: [], campaign: [] };
    } catch (e) {
      return { standard: [], daily: [], endless: [], campaign: [] };
    }
  },

  // 저장
  _save(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[Leaderboard] 저장 실패:', e);
    }
  },

  // 특정 모드 기록 조회
  getEntries(mode) {
    const data = this._load();
    return data[mode] || [];
  },

  // 기록 추가 및 정렬
  addEntry(mode, entry) {
    const data = this._load();
    if (!data[mode]) data[mode] = [];

    const newEntry = {
      ...entry,
      date: entry.date || Date.now(),
    };

    data[mode].push(newEntry);

    // 정렬: 모드별 다른 기준
    if (mode === 'endless') {
      // Endless: 스테이지 높은 순 → 시간 짧은 순
      data[mode].sort((a, b) => {
        if (b.stage !== a.stage) return b.stage - a.stage;
        return (a.time || Infinity) - (b.time || Infinity);
      });
    } else if (mode === 'campaign') {
      // 캠페인: 등급 높은 순 → 시간 짧은 순
      const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      data[mode].sort((a, b) => {
        const ga = gradeOrder[a.grade] || 0;
        const gb = gradeOrder[b.grade] || 0;
        if (gb !== ga) return gb - ga;
        return (a.time || Infinity) - (b.time || Infinity);
      });
    } else {
      // Standard/Daily: 등급 높은 순 → 스테이지 → 시간 짧은 순
      const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      data[mode].sort((a, b) => {
        const ga = gradeOrder[a.grade] || 0;
        const gb = gradeOrder[b.grade] || 0;
        if (gb !== ga) return gb - ga;
        if (b.stage !== a.stage) return b.stage - a.stage;
        return (a.time || Infinity) - (b.time || Infinity);
      });
    }

    // Top N만 유지
    data[mode] = data[mode].slice(0, this.MAX_ENTRIES);

    this._save(data);
    console.log(`[Leaderboard] ${mode} 기록 추가: Stage ${entry.stage}, Grade ${entry.grade}`);

    // 새 기록의 순위 반환 (0-indexed, 없으면 -1)
    return data[mode].findIndex(e => e.date === newEntry.date);
  },

  // 전체 초기화
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[Leaderboard] 전체 초기화');
  },
};

// 전역 등록
window.Leaderboard = Leaderboard;
