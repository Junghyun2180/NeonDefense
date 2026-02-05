// Neon Defense - 밸런스 분석 로거
// 게임 클리어/실패 시 상세 정보를 수집하여 밸런스 조정에 활용

const BalanceLogger = {
  // 로그 저장 키
  LOGS_KEY: 'neonDefense_balanceLogs_v1',
  MAX_LOGS: 50, // 최대 50개 로그 저장

  // 현재 세션 데이터
  sessionData: {
    startTime: null,
    stage: null,
    wave: null,
    goldSpent: 0,
    towersDrawn: 0,
    highestStage: 1,
  },

  // 세션 시작
  startSession() {
    this.sessionData = {
      startTime: Date.now(),
      stage: 1,
      wave: 1,
      goldSpent: 0,
      towersDrawn: 0,
      highestStage: 1,
    };
  },

  // 스테이지/웨이브 업데이트
  updateProgress(stage, wave) {
    this.sessionData.stage = stage;
    this.sessionData.wave = wave;
    if (stage > this.sessionData.highestStage) {
      this.sessionData.highestStage = stage;
    }
  },

  // 타워 정보 분석
  analyzeTowers(towers) {
    const analysis = {
      total: towers.length,
      byTier: { 1: 0, 2: 0, 3: 0, 4: 0 },
      byElement: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, // 화염, 냉기, 전격, 질풍, 공허, 광휘
      byRole: {},
      avgDamage: 0,
      avgRange: 0,
      totalValue: 0, // 타워 총 가치 (골드 환산)
    };

    let totalDamage = 0;
    let totalRange = 0;

    towers.forEach(tower => {
      // 티어별
      analysis.byTier[tower.tier] = (analysis.byTier[tower.tier] || 0) + 1;

      // 속성별
      analysis.byElement[tower.colorIndex] = (analysis.byElement[tower.colorIndex] || 0) + 1;

      // 역할별 (T4만)
      if (tower.tier === 4 && tower.role) {
        analysis.byRole[tower.role] = (analysis.byRole[tower.role] || 0) + 1;
      }

      // 평균 스탯
      totalDamage += tower.damage || 0;
      totalRange += tower.range || 0;

      // 가치 계산 (ECONOMY.towerBaseValues)
      const baseValues = { 1: 20, 2: 60, 3: 180, 4: 540 };
      analysis.totalValue += baseValues[tower.tier] || 0;
    });

    if (towers.length > 0) {
      analysis.avgDamage = Math.round(totalDamage / towers.length);
      analysis.avgRange = Math.round(totalRange / towers.length);
    }

    return analysis;
  },

  // 서포트 타워 정보 분석
  analyzeSupportTowers(supportTowers) {
    const analysis = {
      total: supportTowers.length,
      byTier: { 1: 0, 2: 0, 3: 0 },
      byType: { 0: 0, 1: 0, 2: 0, 3: 0 }, // 공격력, 공속, 방감, 사거리
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
    const {
      towers,
      supportTowers,
      gold,
      lives,
      stage,
      wave,
      gameStats,
      permanentBuffs,
    } = gameState;

    const endTime = Date.now();
    const playTime = this.sessionData.startTime
      ? Math.floor((endTime - this.sessionData.startTime) / 1000)
      : 0;

    const log = {
      // 메타 정보
      timestamp: endTime,
      date: new Date(endTime).toLocaleString('ko-KR'),
      result: result, // 'clear' or 'gameover'
      playTime: playTime, // 초
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
        totalKills: gameStats?.totalKills || 0,
        bossKills: gameStats?.bossKills || 0,
        eliteKills: gameStats?.eliteKills || 0,
        healerKills: gameStats?.healerKills || 0,
        splitterKills: gameStats?.splitterKills || 0,
        totalGoldEarned: gameStats?.totalGoldEarned || 0,
        totalGoldSpent: gameStats?.totalGoldSpent || 0,
        towersDrawn: gameStats?.towersDrawn || 0,
        towersPlaced: gameStats?.towersPlaced || 0,
        towersCombined: gameStats?.towersCombined || 0,
        t4TowersCreated: gameStats?.t4TowersCreated || 0,
        supportTowersDrawn: gameStats?.supportTowersDrawn || 0,
        perfectWaves: gameStats?.perfectWaves || 0,
        wavesCleared: gameStats?.wavesCleared || 0,
        livesLost: gameStats?.livesLost || 0,
      },

      // 영구 버프
      permanentBuffs: this.analyzePermanentBuffs(permanentBuffs),

      // 효율성 지표
      efficiency: {
        goldPerMinute: playTime > 0 ? Math.round((gameStats?.totalGoldEarned || 0) / (playTime / 60)) : 0,
        killsPerMinute: playTime > 0 ? Math.round((gameStats?.totalKills || 0) / (playTime / 60)) : 0,
        goldEfficiency: (gameStats?.totalGoldEarned || 0) > 0
          ? Math.round((gameStats?.totalGoldSpent || 0) / (gameStats?.totalGoldEarned || 0) * 100)
          : 0, // 사용률 %
        survivalRate: (gameStats?.wavesCleared || 0) > 0
          ? Math.round((gameStats?.perfectWaves || 0) / (gameStats?.wavesCleared || 0) * 100)
          : 0, // 퍼펙트 비율 %
      },

      // 밸런스 체크포인트 (경고)
      warnings: this.generateWarnings(gold, lives, towers, stage, gameStats),
    };

    // 로그 저장
    this.saveLog(log);

    // 콘솔 출력
    this.printLog(log);

    return log;
  },

  // 밸런스 경고 생성
  generateWarnings(gold, lives, towers, stage, stats) {
    const warnings = [];

    // 골드 관련
    if (gold > 3000) {
      warnings.push({ type: 'gold', message: `남은 골드 과다 (${gold}G) - 경제 너무 여유로움` });
    }
    if (gold < 100 && stage < 8) {
      warnings.push({ type: 'gold', message: `골드 부족 (${gold}G) - 경제 너무 타이트` });
    }

    // 목숨 관련
    if (lives > 15) {
      warnings.push({ type: 'lives', message: `남은 목숨 과다 (${lives}) - 난이도 너무 쉬움` });
    }
    if (lives < 3 && stage >= 6) {
      warnings.push({ type: 'lives', message: `목숨 부족 (${lives}) - 난이도 너무 어려움` });
    }

    // 타워 관련
    const t4Count = towers.filter(t => t.tier === 4).length;
    if (t4Count < 3 && stage >= 6) {
      warnings.push({ type: 'towers', message: `T4 타워 부족 (${t4Count}개) - 조합 어려움` });
    }
    if (t4Count > 12) {
      warnings.push({ type: 'towers', message: `T4 타워 과다 (${t4Count}개) - 난이도 너무 쉬움` });
    }

    // 통계 관련
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

  // 로그 저장 (localStorage)
  saveLog(log) {
    try {
      const logs = this.getLogs();
      logs.push(log);

      // 최대 개수 제한
      if (logs.length > this.MAX_LOGS) {
        logs.shift(); // 가장 오래된 로그 제거
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

  // 로그 콘솔 출력 (보기 좋게)
  printLog(log) {
    console.group(`🎮 밸런스 로그 - ${log.result === 'clear' ? '✅ 클리어' : '❌ 게임오버'}`);

    console.log(`📅 날짜: ${log.date}`);
    console.log(`⏱️ 플레이 타임: ${log.playTimeFormatted}`);
    console.log(`🏰 진행도: Stage ${log.finalStage}-${log.finalWave} (최고 ${log.highestStage})`);

    console.group('💰 자원');
    console.log(`남은 골드: ${log.remainingGold}G`);
    console.log(`남은 목숨: ${log.remainingLives}`);
    console.log(`총 획득 골드: ${log.stats.totalGoldEarned}G`);
    console.log(`총 사용 골드: ${log.stats.totalGoldSpent}G`);
    console.log(`골드 사용률: ${log.efficiency.goldEfficiency}%`);
    console.groupEnd();

    console.group('🏰 타워');
    console.log(`총 배치: ${log.towers.total}개 (T1: ${log.towers.byTier[1]}, T2: ${log.towers.byTier[2]}, T3: ${log.towers.byTier[3]}, T4: ${log.towers.byTier[4]})`);
    console.log(`타워 가치: ${log.towers.totalValue}G`);
    console.log(`T4 생성: ${log.stats.t4TowersCreated}개`);
    if (Object.keys(log.towers.byRole).length > 0) {
      console.log('T4 역할:', log.towers.byRole);
    }
    console.log(`서포트: ${log.supportTowers.total}개 (S1: ${log.supportTowers.byTier[1]}, S2: ${log.supportTowers.byTier[2]}, S3: ${log.supportTowers.byTier[3]})`);
    console.groupEnd();

    console.group('👾 전투');
    console.log(`총 킬: ${log.stats.totalKills}`);
    console.log(`보스: ${log.stats.bossKills}, 엘리트: ${log.stats.eliteKills}, 힐러: ${log.stats.healerKills}, 분열: ${log.stats.splitterKills}`);
    console.log(`퍼펙트 웨이브: ${log.stats.perfectWaves}/${log.stats.wavesCleared} (${log.efficiency.survivalRate}%)`);
    console.log(`잃은 목숨: ${log.stats.livesLost}`);
    console.groupEnd();

    if (log.permanentBuffs.length > 0) {
      console.group('⭐ 영구 버프');
      log.permanentBuffs.forEach(buff => {
        console.log(`${buff.id}: ${buff.stacks}스택`);
      });
      console.groupEnd();
    }

    if (log.warnings.length > 0) {
      console.group('⚠️ 밸런스 경고');
      log.warnings.forEach(w => {
        console.warn(`[${w.type}] ${w.message}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  },

  // 로그 분석 리포트 생성
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
      console.log(`서포트 타워: ${Math.round(clearLogs.reduce((sum, l) => sum + l.supportTowers.total, 0) / clearLogs.length)}개`);
      console.groupEnd();
    }

    if (gameoverLogs.length > 0) {
      console.group('❌ 게임오버 평균');
      console.log(`도달 스테이지: ${Math.round(gameoverLogs.reduce((sum, l) => sum + l.finalStage, 0) / gameoverLogs.length)}`);
      console.log(`T4 타워: ${Math.round(gameoverLogs.reduce((sum, l) => sum + l.towers.byTier[4], 0) / gameoverLogs.length)}개`);
      console.groupEnd();
    }

    // 경고 통계
    const allWarnings = logs.flatMap(l => l.warnings);
    if (allWarnings.length > 0) {
      console.group('⚠️ 주요 밸런스 이슈');
      const warningCounts = {};
      allWarnings.forEach(w => {
        warningCounts[w.type] = (warningCounts[w.type] || 0) + 1;
      });
      for (const [type, count] of Object.entries(warningCounts)) {
        console.log(`${type}: ${count}회`);
      }
      console.groupEnd();
    }

    console.groupEnd();
  },

  // 로그 내보내기 (JSON)
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
