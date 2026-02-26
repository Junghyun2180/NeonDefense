// Neon Defense - 게임 통계 시스템
// 게임 진행 중 다양한 통계를 추적하고 클리어 시 요약 제공

const GameStats = {
  // 통계 초기화
  createEmpty() {
    return {
      // 시간 관련
      startTime: Date.now(),
      endTime: null,

      // 경제 관련
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      goldFromKills: 0,
      goldFromWaves: 0,
      goldFromStages: 0,
      goldFromInterest: 0,

      // 타워 관련
      towersDrawn: 0,
      towersPlaced: 0,
      towersCombined: 0,
      towersSold: 0,
      t4TowersCreated: 0,
      supportTowersDrawn: 0,
      supportTowersPlaced: 0,

      // 전투 관련
      totalKills: 0,
      bossKills: 0,
      eliteKills: 0,
      healerKills: 0,
      splitterKills: 0,
      totalDamageDealt: 0,
      criticalHits: 0,

      // 상태이상 관련
      burnDamageDealt: 0,
      freezeCount: 0,
      chainLightningHits: 0,

      // 생존 관련
      livesLost: 0,
      livesRecovered: 0,
      closeCallWaves: 0,  // 목숨 1개로 버틴 웨이브

      // 버프 관련
      buffsSelected: [],

      // 웨이브/스테이지
      wavesCleared: 0,
      stagesCleared: 0,
      perfectWaves: 0,  // 목숨 손실 없이 클리어한 웨이브
    };
  },

  // 통계 업데이트 헬퍼 함수들
  trackGoldEarned(stats, amount, source) {
    stats.totalGoldEarned += amount;
    switch (source) {
      case 'kill': stats.goldFromKills += amount; break;
      case 'wave': stats.goldFromWaves += amount; break;
      case 'stage': stats.goldFromStages += amount; break;
      case 'interest': stats.goldFromInterest += amount; break;
    }
    return stats;
  },

  trackGoldSpent(stats, amount) {
    stats.totalGoldSpent += amount;
    return stats;
  },

  trackTowerDraw(stats, isSupport = false) {
    if (isSupport) {
      stats.supportTowersDrawn++;
    } else {
      stats.towersDrawn++;
    }
    return stats;
  },

  trackTowerPlace(stats, tower) {
    stats.towersPlaced++;
    if (tower.tier === 4) {
      stats.t4TowersCreated++;
    }
    return stats;
  },

  trackKill(stats, enemy) {
    stats.totalKills++;
    switch (enemy.type) {
      case 'boss': stats.bossKills++; break;
      case 'elite': stats.eliteKills++; break;
      case 'healer': stats.healerKills++; break;
      case 'splitter': stats.splitterKills++; break;
    }
    return stats;
  },

  trackWaveClear(stats, livesLostThisWave, currentLives) {
    stats.wavesCleared++;
    if (livesLostThisWave === 0) {
      stats.perfectWaves++;
    }
    if (currentLives === 1) {
      stats.closeCallWaves++;
    }
    return stats;
  },

  trackStageClear(stats) {
    stats.stagesCleared++;
    return stats;
  },

  trackBuffSelected(stats, buffId) {
    stats.buffsSelected.push(buffId);
    return stats;
  },

  trackLivesLost(stats, amount) {
    stats.livesLost += amount;
    return stats;
  },

  // 게임 완료 처리
  finalize(stats) {
    stats.endTime = Date.now();
    return stats;
  },

  // 플레이 시간 계산 (초)
  getPlayTime(stats) {
    const end = stats.endTime || Date.now();
    return Math.floor((end - stats.startTime) / 1000);
  },

  // 플레이 시간 포맷팅
  formatPlayTime(stats) {
    const totalSeconds = this.getPlayTime(stats);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}분 ${seconds}초`;
  },

  // 등급 계산
  calculateGrade(stats) {
    let score = 0;

    // 클리어 여부 (기본 점수)
    if (stats.stagesCleared >= 10) score += 50;

    // 퍼펙트 웨이브 보너스
    score += stats.perfectWaves * 2;

    // T4 타워 보너스
    score += stats.t4TowersCreated * 3;

    // 보스 킬 보너스
    score += stats.bossKills * 2;

    // 남은 목숨 보너스 (lives는 외부에서 전달)
    // score += remainingLives * 5;

    // 시간 보너스 (30분 이내 클리어)
    const playTimeMin = this.getPlayTime(stats) / 60;
    if (playTimeMin <= 20) score += 20;
    else if (playTimeMin <= 30) score += 10;

    // 등급 결정
    if (score >= 100) return { grade: 'S', color: '#FFD700', description: '전설적인 수호자!' };
    if (score >= 80) return { grade: 'A', color: '#C0C0C0', description: '뛰어난 전략가!' };
    if (score >= 60) return { grade: 'B', color: '#CD7F32', description: '숙련된 방어자!' };
    if (score >= 40) return { grade: 'C', color: '#45B7D1', description: '성장하는 수호자' };
    return { grade: 'D', color: '#96E6A1', description: '초보 수호자' };
  },

  // 런 모드 등급 계산 (짧은 게임에 맞춘 가중치)
  calculateRunGrade(stats, runMode = 'standard') {
    let score = 0;

    // 클리어 보너스
    if (stats.stagesCleared >= 5) score += 40;

    // 퍼펙트 웨이브
    score += (stats.perfectWaves || 0) * 3;

    // T4 타워 생성
    score += (stats.t4TowersCreated || 0) * 5;

    // 보스 킬
    score += (stats.bossKills || 0) * 3;

    // 시간 보너스
    const playTimeMin = this.getPlayTime(stats) / 60;
    if (playTimeMin <= 10) score += 25;
    else if (playTimeMin <= 15) score += 15;
    else if (playTimeMin <= 20) score += 5;

    // 킬 수
    score += Math.min(20, Math.floor((stats.totalKills || 0) / 10));

    // Endless 보너스
    if (runMode === 'endless') {
      score = Math.min(100, (stats.stagesCleared || 0) * 8);
    }

    // 등급 결정
    if (score >= 100) return { grade: 'S', color: '#FFD700', description: '전설적인 수호자!' };
    if (score >= 80) return { grade: 'A', color: '#C0C0C0', description: '뛰어난 전략가!' };
    if (score >= 60) return { grade: 'B', color: '#CD7F32', description: '숙련된 방어자!' };
    if (score >= 40) return { grade: 'C', color: '#45B7D1', description: '성장하는 수호자' };
    return { grade: 'D', color: '#96E6A1', description: '초보 수호자' };
  },

  // 통계 요약 생성 (UI 표시용)
  getSummary(stats, remainingLives = 0, remainingGold = 0) {
    const playTime = this.formatPlayTime(stats);
    const grade = this.calculateGrade(stats);

    return {
      grade,
      playTime,

      // 주요 통계
      highlights: [
        { label: '클리어 시간', value: playTime, icon: '⏱️' },
        { label: '처치한 적', value: stats.totalKills.toLocaleString(), icon: '👾' },
        { label: '보스 처치', value: stats.bossKills, icon: '👹' },
        { label: '남은 목숨', value: remainingLives, icon: '❤️' },
      ],

      // 타워 통계
      towers: [
        { label: '뽑은 타워', value: stats.towersDrawn, icon: '🎲' },
        { label: '배치한 타워', value: stats.towersPlaced, icon: '🏰' },
        { label: 'T4 타워', value: stats.t4TowersCreated, icon: '⭐' },
        { label: '서포트 타워', value: stats.supportTowersDrawn, icon: '🛡️' },
      ],

      // 경제 통계
      economy: [
        { label: '총 획득 골드', value: stats.totalGoldEarned.toLocaleString(), icon: '💰' },
        { label: '총 사용 골드', value: stats.totalGoldSpent.toLocaleString(), icon: '💸' },
        { label: '남은 골드', value: remainingGold.toLocaleString(), icon: '🪙' },
        { label: '이자 수익', value: stats.goldFromInterest.toLocaleString(), icon: '🏦' },
      ],

      // 전투 통계
      combat: [
        { label: '퍼펙트 웨이브', value: `${stats.perfectWaves}/${stats.wavesCleared}`, icon: '✨' },
        { label: '엘리트 처치', value: stats.eliteKills, icon: '💪' },
        { label: '힐러 처치', value: stats.healerKills, icon: '💚' },
        { label: '잃은 목숨', value: stats.livesLost, icon: '💔' },
      ],

      // 선택한 버프
      buffs: stats.buffsSelected,
    };
  },
};

// 전역 노출
window.GameStats = GameStats;
