// Neon Defense - 런 모드 저장 시스템
// 메타 진행 / 런 진행 / 일일 챌린지 각각 별도 localStorage 키 사용

const RunSaveSystem = {
  META_KEY: 'neonDefense_runMeta_v1',
  RUN_KEY: 'neonDefense_runSave_v1',
  DAILY_KEY: 'neonDefense_dailyAttempt_v1',

  // ===== 기본 메타 데이터 =====
  getDefaultMeta() {
    return {
      version: 1,
      crystals: 0,
      upgrades: {
        startingGold: 0,
        startingLives: 0,
        baseDamage: 0,
        baseAttackSpeed: 0,
        goldMultiplier: 0,
        drawDiscount: 0,
        rerollCount: 0,
        carryoverSlots: 0,
      },
      stats: {
        totalRuns: 0,
        totalClears: 0,
        totalCrystalsEarned: 0,
        bestGrade: null,
        fastestClear: null,
        highestEndlessStage: 0,
      },
    };
  },

  // ===== 메타 진행 저장/불러오기 =====
  saveMeta(data) {
    try {
      const saveData = { ...data, version: 1, lastSaved: Date.now() };
      localStorage.setItem(this.META_KEY, JSON.stringify(saveData));
      console.log('[RunSave] 메타 진행 저장 완료');
      return true;
    } catch (e) {
      console.error('[RunSave] 메타 저장 실패:', e);
      return false;
    }
  },

  loadMeta() {
    try {
      const raw = localStorage.getItem(this.META_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!this.validateMetaData(data)) {
        console.warn('[RunSave] 메타 데이터 유효하지 않음, 기본값 사용');
        return null;
      }
      return data;
    } catch (e) {
      console.error('[RunSave] 메타 불러오기 실패:', e);
      return null;
    }
  },

  deleteMeta() {
    localStorage.removeItem(this.META_KEY);
    console.log('[RunSave] 메타 데이터 삭제');
  },

  // ===== 런 진행 저장/불러오기 =====
  saveRun(runState) {
    try {
      const saveData = {
        version: 1,
        timestamp: Date.now(),
        runMode: runState.runMode,
        seed: runState.seed || 0,
        // 게임 상태
        stage: runState.stage,
        wave: runState.wave,
        gold: runState.gold,
        lives: runState.lives,
        towers: (runState.towers || []).map(t => ({
          id: t.id, x: t.x, y: t.y,
          tier: t.tier, colorIndex: t.colorIndex,
          abilityType: t.abilityType, role: t.role || null,
        })),
        supportTowers: (runState.supportTowers || []).map(s => ({
          id: s.id, x: s.x, y: s.y,
          tier: s.tier, supportType: s.supportType,
          abilityType: s.abilityType,
        })),
        inventory: runState.inventory || [],
        supportInventory: runState.supportInventory || [],
        permanentBuffs: runState.permanentBuffs || {},
        stats: runState.stats || {},
        // 런 전용
        metaUpgradesSnapshot: runState.metaUpgradesSnapshot || {},
        modifiers: runState.modifiers || [],
        rerollsUsed: runState.rerollsUsed || 0,
      };
      localStorage.setItem(this.RUN_KEY, JSON.stringify(saveData));
      console.log('[RunSave] 런 진행 저장 완료');
      return true;
    } catch (e) {
      console.error('[RunSave] 런 저장 실패:', e);
      return false;
    }
  },

  loadRun() {
    try {
      const raw = localStorage.getItem(this.RUN_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!this.validateRunData(data)) {
        console.warn('[RunSave] 런 데이터 유효하지 않음');
        return null;
      }
      return data;
    } catch (e) {
      console.error('[RunSave] 런 불러오기 실패:', e);
      return null;
    }
  },

  deleteRun() {
    localStorage.removeItem(this.RUN_KEY);
    console.log('[RunSave] 런 진행 데이터 삭제');
  },

  hasActiveRun() {
    return !!localStorage.getItem(this.RUN_KEY);
  },

  getRunInfo() {
    try {
      const raw = localStorage.getItem(this.RUN_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        runMode: data.runMode,
        stage: data.stage,
        wave: data.wave,
        gold: data.gold,
        lives: data.lives,
        timestamp: data.timestamp,
        towerCount: (data.towers || []).length,
        supportCount: (data.supportTowers || []).length,
      };
    } catch (e) {
      return null;
    }
  },

  // ===== 일일 챌린지 기록 =====
  getDailyAttempt() {
    try {
      const raw = localStorage.getItem(this.DAILY_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  saveDailyAttempt(result) {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const data = {
        date: today,
        completed: result.cleared || false,
        bestTime: result.playTimeMs || null,
        crystalsEarned: result.crystalsEarned || 0,
      };
      localStorage.setItem(this.DAILY_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  hasAttemptedToday() {
    const attempt = this.getDailyAttempt();
    if (!attempt) return false;
    const today = new Date().toISOString().slice(0, 10);
    return attempt.date === today;
  },

  // ===== 유효성 검증 =====
  validateMetaData(data) {
    if (!data || data.version !== 1) return false;
    if (typeof data.crystals !== 'number') return false;
    if (!data.upgrades || typeof data.upgrades !== 'object') return false;
    if (!data.stats || typeof data.stats !== 'object') return false;
    return true;
  },

  validateRunData(data) {
    if (!data || data.version !== 1) return false;
    if (!data.runMode) return false;
    if (typeof data.stage !== 'number' || typeof data.wave !== 'number') return false;
    if (typeof data.gold !== 'number' || typeof data.lives !== 'number') return false;
    return true;
  },

  // ===== 메타 통계 업데이트 =====
  updateMetaStats(metaData, runResult) {
    const stats = { ...metaData.stats };
    stats.totalRuns = (stats.totalRuns || 0) + 1;

    if (runResult.cleared) {
      stats.totalClears = (stats.totalClears || 0) + 1;

      // 최고 등급
      const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
      if (!stats.bestGrade || (gradeOrder[runResult.grade] || 0) > (gradeOrder[stats.bestGrade] || 0)) {
        stats.bestGrade = runResult.grade;
      }

      // 최단 시간
      if (runResult.playTimeMs && (!stats.fastestClear || runResult.playTimeMs < stats.fastestClear)) {
        stats.fastestClear = runResult.playTimeMs;
      }
    }

    // Endless 최고 기록
    if (runResult.mode === 'endless') {
      const stagesCleared = runResult.stagesCleared || 0;
      if (stagesCleared > (stats.highestEndlessStage || 0)) {
        stats.highestEndlessStage = stagesCleared;
      }
    }

    stats.totalCrystalsEarned = (stats.totalCrystalsEarned || 0) + (runResult.crystalsEarned || 0);

    return { ...metaData, stats };
  },
};

// 전역 등록
window.RunSaveSystem = RunSaveSystem;
