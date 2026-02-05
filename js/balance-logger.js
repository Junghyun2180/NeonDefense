// Neon Defense - 밸런스 분석 로거
// 게임 클리어/실패 시 상세 정보를 수집하여 밸런스 조정에 활용

const BalanceLogger = {
  // 로그 저장 키
  LOGS_KEY: 'neonDefense_balanceLogs_v1',
  MAX_LOGS: 50, // 최대 50개 로그 저장

  // 현재 세션 데이터
  sessionData: {
    startTime: null,
    highestStage: 1,
  },

  // 세션 시작
  startSession() {
    this.sessionData = {
      startTime: Date.now(),
      highestStage: 1,
    };
    console.log('[BalanceLogger] 세션 시작');
  },

  // 진행도 업데이트
  updateProgress(stage) {
    if (stage > this.sessionData.highestStage) {
      this.sessionData.highestStage = stage;
    }
  },

  // 타워 정보 분석
  analyzeTowers(towers) {
    const analysis = {
      total: towers.length,
      byTier: { 1: 0, 2: 0, 3: 0, 4: 0 },
      byElement: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byRole: {},
      totalValue: 0,
    };

    towers.forEach(tower => {
      analysis.byTier[tower.tier] = (analysis.byTier[tower.tier] || 0) + 1;
      analysis.byElement[tower.colorIndex] = (analysis.byElement[tower.colorIndex] || 0) + 1;

      if (tower.tier === 4 && tower.role) {
        analysis.byRole[tower.role] = (analysis.byRole[tower.role] || 0) + 1;
      }

      const baseValues = { 1: 20, 2: 60, 3: 180, 4: 540 };
      analysis.totalValue += baseValues[tower.tier] || 0;
    });

    return analysis;
  },

  // 서포트 타워 정보 분석
  analyzeSupportTowers(supportTowers) {
    const analysis = {
      total: supportTowers.length,
      byTier: { 1: 0, 2: 0, 3: 0 },
      byType: { 0: 0, 1: 0, 2: 0, 3: 0 },
      totalValue: 0,
    };

    supportTowers.forEach(support => {
      analysis.byTier[support.tier] = (analysis.byTier[support.tier] || 0) + 1;
      analysis.byType[support.supportType] = (analysis.byType[support.supportType] || 0) + 1;

      const baseValues = { 1: 40, 2: 120, 3: 360 };
      analysis.totalValue += baseValues[support.tier] || 0;
    });

    return analysis;
  },

  // 영구 버프 정보 수집
  analyzePermanentBuffs(permanentBuffs) {
    const active = [];
    for (const [key, value] of Object.entries(permanentBuffs || {})) {
      if (value > 0) {
        active.push({ id: key, stacks: value });
      }
    }
    return active;
  },

  // 게임 종료 로그 생성 (클리어 or 게임오버)
  logGameEnd(result, gameState) {
    try {
      const {
        towers = [],
        supportTowers = [],
        gold = 0,
        lives = 0,
        stage = 1,
        wave = 1,
        gameStats = {},
        permanentBuffs = {},
      } = gameState;

      const endTime = Date.now();
      const playTime = this.sessionData.startTime
        ? Math.floor((endTime - this.sessionData.startTime) / 1000)
        : 0;

      const log = {
        // 메타 정보
        timestamp: endTime,
        date: new Date(endTime).toLocaleString('ko-KR'),
        result: result,
        playTime: playTime,
        playTimeFormatted: this.formatTime(playTime),

        // 진행도
        finalStage: stage,
        finalWave: wave,
        highestStage: this.sessionData.highestStage,

        // 자원
        remainingGold: gold,
        remainingLives: lives,

        // 타워 분석
        towers: this.analyzeTowers(towers),
        supportTowers: this.analyzeSupportTowers(supportTowers),

        // 통계
        stats: {
          totalKills: gameStats.totalKills || 0,
          bossKills: gameStats.bossKills || 0,
          eliteKills: gameStats.eliteKills || 0,
          healerKills: gameStats.healerKills || 0,
          splitterKills: gameStats.splitterKills || 0,
          totalGoldEarned: gameStats.totalGoldEarned || 0,
          totalGoldSpent: gameStats.totalGoldSpent || 0,
          towersDrawn: gameStats.towersDrawn || 0,
          towersPlaced: gameStats.towersPlaced || 0,
          towersCombined: gameStats.towersCombined || 0,
          t4TowersCreated: gameStats.t4TowersCreated || 0,
          perfectWaves: gameStats.perfectWaves || 0,
          wavesCleared: gameStats.wavesCleared || 0,
          livesLost: gameStats.livesLost || 0,
        },

        // 영구 버프
        permanentBuffs: this.analyzePermanentBuffs(permanentBuffs),

        // 효율성 지표
        efficiency: {
          goldPerMinute: playTime > 0 ? Math.round((gameStats.totalGoldEarned || 0) / (playTime / 60)) : 0,
          killsPerMinute: playTime > 0 ? Math.round((gameStats.totalKills || 0) / (playTime / 60)) : 0,
          goldEfficiency: (gameStats.totalGoldEarned || 0) > 0
            ? Math.round((gameStats.totalGoldSpent || 0) / (gameStats.totalGoldEarned || 0) * 100)
            : 0,
          survivalRate: (gameStats.wavesCleared || 0) > 0
            ? Math.round((gameStats.perfectWaves || 0) / (gameStats.wavesCleared || 0) * 100)
            : 0,
        },

        // 밸런스 체크포인트
        warnings: this.generateWarnings(gold, lives, towers, stage, gameStats),
      };

      // 로그 저장
      this.saveLog(log);

      // 콘솔 출력
      this.printLog(log);

      return log;
    } catch (error) {
      console.error('[BalanceLogger] 로그 생성 실패:', error);
      return null;
    }
  },

  // 밸런스 경고 생성
  generateWarnings(gold, lives, towers, stage, stats) {
    const warnings = [];

    if (gold > 3000) {
      warnings.push({ type: 'gold', message: `남은 골드 과다 (${gold}G) - 경제 너무 여유로움` });
    }
    if (gold < 100 && stage < 8) {
      warnings.push({ type: 'gold', message: `골드 부족 (${gold}G) - 경제 너무 타이트` });
    }

    if (lives > 15) {
      warnings.push({ type: 'lives', message: `남은 목숨 과다 (${lives}) - 난이도 너무 쉬움` });
    }
    if (lives < 3 && stage >= 6) {
      warnings.push({ type: 'lives', message: `목숨 부족 (${lives}) - 난이도 너무 어려움` });
    }

    const t4Count = towers.filter(t => t.tier === 4).length;
    if (t4Count < 3 && stage >= 6) {
      warnings.push({ type: 'towers', message: `T4 타워 부족 (${t4Count}개) - 조합 어려움` });
    }
    if (t4Count > 12) {
      warnings.push({ type: 'towers', message: `T4 타워 과다 (${t4Count}개) - 난이도 너무 쉬움` });
    }

    const survivalRate = (stats?.perfectWaves || 0) / Math.max(1, stats?.wavesCleared || 1);
    if (survivalRate > 0.9) {
      warnings.push({ type: 'difficulty', message: `퍼펙트 비율 ${Math.round(survivalRate * 100)}% - 난이도 하향 필요` });
    }

    return warnings;
  },

  // 시간 포맷팅
  formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}분 ${sec}초`;
  },

  // 로그 저장
  saveLog(log) {
    try {
      const logs = this.getLogs();
      logs.push(log);

      if (logs.length > this.MAX_LOGS) {
        logs.shift();
      }

      localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
      console.log('[BalanceLogger] 로그 저장 완료');
    } catch (e) {
      console.error('[BalanceLogger] 로그 저장 실패:', e);
    }
  },

  // 저장된 로그 불러오기
  getLogs() {
    try {
      const data = localStorage.getItem(this.LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[BalanceLogger] 로그 불러오기 실패:', e);
      return [];
    }
  },

  // 로그 콘솔 출력
  printLog(log) {
    console.group(`🎮 밸런스 로그 - ${log.result === 'clear' ? '✅ 클리어' : '❌ 게임오버'}`);
    console.log(`📅 ${log.date}`);
    console.log(`⏱️ ${log.playTimeFormatted}`);
    console.log(`🏰 Stage ${log.finalStage}-${log.finalWave}`);
    console.log(`💰 남은 골드: ${log.remainingGold}G | 목숨: ${log.remainingLives}`);
    console.log(`🏰 타워: ${log.towers.total}개 (T4: ${log.towers.byTier[4]})`);
    console.log(`🛡️ 서포트: ${log.supportTowers.total}개`);
    console.log(`👾 총 킬: ${log.stats.totalKills}`);

    if (log.warnings.length > 0) {
      console.group('⚠️ 밸런스 경고');
      log.warnings.forEach(w => console.warn(`[${w.type}] ${w.message}`));
      console.groupEnd();
    }

    console.groupEnd();
  },

  // 로그 분석 리포트
  generateReport() {
    const logs = this.getLogs();
    if (logs.length === 0) {
      console.log('📊 밸런스 리포트: 저장된 로그가 없습니다.');
      return;
    }

    const clearLogs = logs.filter(l => l.result === 'clear');
    const gameoverLogs = logs.filter(l => l.result === 'gameover');

    console.group(`📊 밸런스 분석 리포트 (총 ${logs.length}게임)`);
    console.log(`✅ 클리어: ${clearLogs.length}회 (${Math.round(clearLogs.length / logs.length * 100)}%)`);
    console.log(`❌ 게임오버: ${gameoverLogs.length}회`);

    if (clearLogs.length > 0) {
      console.group('✅ 클리어 게임 평균');
      console.log(`플레이 타임: ${this.formatTime(Math.round(clearLogs.reduce((sum, l) => sum + l.playTime, 0) / clearLogs.length))}`);
      console.log(`남은 골드: ${Math.round(clearLogs.reduce((sum, l) => sum + l.remainingGold, 0) / clearLogs.length)}G`);
      console.log(`남은 목숨: ${Math.round(clearLogs.reduce((sum, l) => sum + l.remainingLives, 0) / clearLogs.length)}`);
      console.log(`T4 타워: ${Math.round(clearLogs.reduce((sum, l) => sum + l.towers.byTier[4], 0) / clearLogs.length)}개`);
      console.groupEnd();
    }

    if (gameoverLogs.length > 0) {
      console.group('❌ 게임오버 평균');
      console.log(`도달 스테이지: ${Math.round(gameoverLogs.reduce((sum, l) => sum + l.finalStage, 0) / gameoverLogs.length)}`);
      console.groupEnd();
    }

    console.groupEnd();
  },

  // 로그 내보내기
  exportLogs() {
    const logs = this.getLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neonDefense_balanceLogs_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('[BalanceLogger] 로그 내보내기 완료');
  },

  // 로그 삭제
  clearLogs() {
    localStorage.removeItem(this.LOGS_KEY);
    console.log('[BalanceLogger] 모든 로그 삭제 완료');
  },
};

// 전역 노출
window.BalanceLogger = BalanceLogger;
