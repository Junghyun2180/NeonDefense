// Neon Defense - 업적 시스템
// localStorage 기반 업적 추적 및 해금

// ===== 업적 정의 =====
const ACHIEVEMENTS = {
  // 캠페인 업적
  firstClear: {
    id: 'firstClear',
    name: '첫 번째 수호자',
    icon: '🏆',
    desc: '캠페인 모드 최초 클리어',
    category: 'campaign',
    check: (ctx) => ctx.campaignClears >= 1,
  },
  perfectCampaign: {
    id: 'perfectCampaign',
    name: '흠집 하나 없이',
    icon: '💎',
    desc: '캠페인 목숨 손실 없이 클리어',
    category: 'campaign',
    check: (ctx) => ctx.campaignPerfectClears >= 1,
  },
  speedDemon: {
    id: 'speedDemon',
    name: '속도의 마왕',
    icon: '⚡',
    desc: '캠페인 30분 이내 클리어',
    category: 'campaign',
    check: (ctx) => ctx.fastestCampaignClear && ctx.fastestCampaignClear < 30 * 60 * 1000,
  },

  // 런 모드 업적
  firstRun: {
    id: 'firstRun',
    name: '런 입문자',
    icon: '🎮',
    desc: 'Standard Run 최초 클리어',
    category: 'run',
    check: (ctx) => ctx.totalClears >= 1,
  },
  gradeS: {
    id: 'gradeS',
    name: '전설의 수호자',
    icon: '🌟',
    desc: 'S등급 획득',
    category: 'run',
    check: (ctx) => ctx.bestGrade === 'S',
  },
  endlessStage10: {
    id: 'endlessStage10',
    name: '끝없는 도전',
    icon: '♾️',
    desc: 'Endless Mode Stage 10 도달',
    category: 'run',
    check: (ctx) => ctx.highestEndlessStage >= 10,
  },
  run10: {
    id: 'run10',
    name: '반복의 미학',
    icon: '🔁',
    desc: '런 모드 10회 플레이',
    category: 'run',
    check: (ctx) => ctx.totalRuns >= 10,
  },
  run50: {
    id: 'run50',
    name: '중독자',
    icon: '🎰',
    desc: '런 모드 50회 플레이',
    category: 'run',
    check: (ctx) => ctx.totalRuns >= 50,
  },

  // 전투 업적
  bossSlayer: {
    id: 'bossSlayer',
    name: '보스 학살자',
    icon: '👑',
    desc: '보스를 총 50마리 처치',
    category: 'combat',
    check: (ctx) => ctx.totalBossKills >= 50,
  },
  massKiller: {
    id: 'massKiller',
    name: '대량 학살',
    icon: '💀',
    desc: '적을 총 5,000마리 처치',
    category: 'combat',
    check: (ctx) => ctx.totalKills >= 5000,
  },
  t4Collector: {
    id: 't4Collector',
    name: 'T4 수집가',
    icon: '⭐',
    desc: 'T4 타워 총 20개 제작',
    category: 'combat',
    check: (ctx) => ctx.totalT4Created >= 20,
  },

  // 경제 업적
  crystalHoarder: {
    id: 'crystalHoarder',
    name: '크리스탈 부자',
    icon: '💎',
    desc: '크리스탈 총 1,000개 획득',
    category: 'economy',
    check: (ctx) => ctx.totalCrystalsEarned >= 1000,
  },
  fullUpgrade: {
    id: 'fullUpgrade',
    name: '만렙 달성',
    icon: '🔧',
    desc: '메타 업그레이드 1종 최대 레벨',
    category: 'economy',
    check: (ctx) => ctx.hasMaxUpgrade,
  },
  allUpgradesMax: {
    id: 'allUpgradesMax',
    name: '완전체',
    icon: '🏅',
    desc: '모든 메타 업그레이드 최대 레벨',
    category: 'economy',
    check: (ctx) => ctx.allUpgradesMaxed,
  },
};

// ===== 업적 시스템 관리자 =====
const AchievementSystem = {
  STORAGE_KEY: 'neonDefense_achievements_v1',
  STATS_KEY: 'neonDefense_achievementStats_v1',

  // 해금된 업적 로드
  getUnlocked() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  // 해금 저장
  saveUnlocked(unlocked) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(unlocked));
    } catch (e) {
      console.error('[Achievement] 저장 실패:', e);
    }
  },

  // 누적 통계 로드
  getStats() {
    try {
      const raw = localStorage.getItem(this.STATS_KEY);
      return raw ? JSON.parse(raw) : this.getDefaultStats();
    } catch (e) {
      return this.getDefaultStats();
    }
  },

  getDefaultStats() {
    return {
      // 캠페인
      campaignClears: 0,
      campaignPerfectClears: 0,
      fastestCampaignClear: null,
      // 런
      totalRuns: 0,
      totalClears: 0,
      bestGrade: null,
      highestEndlessStage: 0,
      // 전투 (누적)
      totalBossKills: 0,
      totalKills: 0,
      totalT4Created: 0,
      // 경제
      totalCrystalsEarned: 0,
      hasMaxUpgrade: false,
      allUpgradesMaxed: false,
    };
  },

  saveStats(stats) {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('[Achievement] 통계 저장 실패:', e);
    }
  },

  // 캠페인 결과로 통계 업데이트
  updateFromCampaign(gameStats, cleared, lives, playTimeMs) {
    const stats = this.getStats();

    stats.totalKills += gameStats.totalKills || 0;
    stats.totalBossKills += gameStats.bossKills || 0;
    stats.totalT4Created += gameStats.t4TowersCreated || 0;

    if (cleared) {
      stats.campaignClears += 1;
      if ((gameStats.livesLost || 0) === 0) {
        stats.campaignPerfectClears += 1;
      }
      if (playTimeMs && (!stats.fastestCampaignClear || playTimeMs < stats.fastestCampaignClear)) {
        stats.fastestCampaignClear = playTimeMs;
      }
    }

    this.saveStats(stats);
    return stats;
  },

  // 런 결과로 통계 업데이트
  updateFromRun(runResult) {
    const stats = this.getStats();

    stats.totalRuns += 1;
    stats.totalKills += runResult.totalKills || 0;
    stats.totalBossKills += runResult.bossKills || 0;
    stats.totalT4Created += runResult.t4TowersCreated || 0;
    stats.totalCrystalsEarned += runResult.crystalsEarned || 0;

    if (runResult.cleared) {
      stats.totalClears += 1;
    }

    // 등급 비교
    const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    if (!stats.bestGrade || (gradeOrder[runResult.grade] || 0) > (gradeOrder[stats.bestGrade] || 0)) {
      stats.bestGrade = runResult.grade;
    }

    // Endless
    if (runResult.mode === 'endless') {
      const stagesCleared = runResult.stagesCleared || 0;
      if (stagesCleared > stats.highestEndlessStage) {
        stats.highestEndlessStage = stagesCleared;
      }
    }

    this.saveStats(stats);
    return stats;
  },

  // 메타 업그레이드 상태로 통계 업데이트
  updateFromMeta(metaProgress) {
    const stats = this.getStats();

    // 크리스탈 총 획득 (meta에서 동기화)
    stats.totalCrystalsEarned = Math.max(
      stats.totalCrystalsEarned,
      metaProgress.stats?.totalCrystalsEarned || 0
    );

    // 최대 업그레이드 체크
    let hasMax = false;
    let allMax = true;
    const upgrades = metaProgress.upgrades || {};
    for (const [id, level] of Object.entries(upgrades)) {
      const def = META_UPGRADES[id];
      if (def && level >= def.maxLevel) {
        hasMax = true;
      } else if (def) {
        allMax = false;
      }
    }
    // 아직 구매하지 않은 업그레이드도 체크
    for (const id of Object.keys(META_UPGRADES)) {
      if (!(id in upgrades) || upgrades[id] === 0) {
        allMax = false;
      }
    }

    stats.hasMaxUpgrade = hasMax;
    stats.allUpgradesMaxed = allMax;

    this.saveStats(stats);
    return stats;
  },

  // 모든 업적 체크 후 새로 해금된 것 반환
  checkAll(context) {
    const unlocked = this.getUnlocked();
    const stats = this.getStats();
    const ctx = { ...stats, ...context };
    const newlyUnlocked = [];

    for (const [id, ach] of Object.entries(ACHIEVEMENTS)) {
      if (unlocked[id]) continue; // 이미 해금됨
      try {
        if (ach.check(ctx)) {
          unlocked[id] = { unlockedAt: Date.now() };
          newlyUnlocked.push(ach);
          console.log(`[Achievement] 해금: ${ach.name} (${ach.icon})`);
        }
      } catch (e) {
        // 체크 실패는 무시
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveUnlocked(unlocked);
    }

    return newlyUnlocked;
  },

  // 총 업적 수 / 해금 수
  getProgress() {
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = Object.keys(this.getUnlocked()).length;
    return { total, unlocked, percentage: Math.round((unlocked / total) * 100) };
  },
};

// 전역 등록
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.AchievementSystem = AchievementSystem;
