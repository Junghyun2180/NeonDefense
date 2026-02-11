// useRunMode - 런 모드 상태 관리 훅
// 메타 진행, 런 세션, 크리스탈, 업그레이드 구매, 리롤 관리

const useRunMode = () => {
  const { useState, useCallback, useMemo, useRef } = React;

  // ===== 메타 진행 (영구, localStorage) =====
  const [metaProgress, setMetaProgress] = useState(() => {
    return RunSaveSystem.loadMeta() || RunSaveSystem.getDefaultMeta();
  });

  // ===== 런 세션 상태 =====
  const [runMode, setRunMode] = useState(null);       // 'standard' | 'daily' | 'endless' | null
  const [runActive, setRunActive] = useState(false);
  const [runResult, setRunResult] = useState(null);    // 런 종료 결과
  const [runSeed, setRunSeed] = useState(0);
  const [runModifiers, setRunModifiers] = useState([]); // Daily Challenge 모디파이어
  const [rerollsRemaining, setRerollsRemaining] = useState(0);
  const [rerollsUsed, setRerollsUsed] = useState(0);
  const runStartTime = useRef(null);

  // 메타 업그레이드가 적용된 스냅샷 (런 시작 시 고정)
  const [metaSnapshot, setMetaSnapshot] = useState(null);

  // ===== 런 설정 (메타 업그레이드 적용) =====
  const runConfig = useMemo(() => {
    if (!runActive || !metaSnapshot) return null;

    if (runMode === 'bossRush') {
      return RunMode.buildBossRushConfig(metaSnapshot);
    }
    if (runMode === 'endless') {
      return RunMode.buildEndlessConfig(metaSnapshot);
    }
    if (runMode === 'daily' && runModifiers.length > 0) {
      return RunMode.buildDailyConfig(metaSnapshot, runModifiers);
    }
    return RunMode.buildRunConfig(metaSnapshot);
  }, [runActive, runMode, metaSnapshot, runModifiers]);

  // ===== 런 시작 =====
  const startRun = useCallback((mode, modifiers = []) => {
    const snapshot = { ...metaProgress.upgrades };
    const seed = mode === 'daily'
      ? (typeof DailyChallenge !== 'undefined' ? DailyChallenge.getTodaySeed() : Date.now())
      : Date.now();

    setRunMode(mode);
    setRunActive(true);
    setRunResult(null);
    setRunSeed(seed);
    setRunModifiers(modifiers);
    setMetaSnapshot(snapshot);
    setRerollsUsed(0);

    // 리롤 횟수 설정 (메타 업그레이드 기반)
    const rerolls = META_UPGRADES.rerollCount.effect(metaProgress.upgrades.rerollCount || 0);
    setRerollsRemaining(rerolls);
    runStartTime.current = Date.now();

    // 진행 중 런 저장 삭제 (새로 시작하므로)
    RunSaveSystem.deleteRun();

    console.log(`[RunMode] 런 시작: ${mode}, seed: ${seed}, rerolls: ${rerolls}`);
  }, [metaProgress]);

  // ===== 런 종료 (승리/패배) =====
  const endRun = useCallback((cleared, gameStats, currentLives) => {
    const playTimeMs = runStartTime.current ? Date.now() - runStartTime.current : 0;
    const grade = RunMode.calculateRunGrade(gameStats, runMode);
    const isPerfect = (gameStats.livesLost || 0) === 0;
    const isSpeedRun = playTimeMs < 15 * 60 * 1000; // 15분 이내

    const result = {
      cleared,
      mode: runMode,
      grade,
      isPerfect,
      isSpeedRun,
      playTimeMs,
      stagesCleared: gameStats.stagesCleared || 0,
      totalKills: gameStats.totalKills || 0,
      perfectWaves: gameStats.perfectWaves || 0,
      wavesCleared: gameStats.wavesCleared || 0,
      t4TowersCreated: gameStats.t4TowersCreated || 0,
      bossKills: gameStats.bossKills || 0,
      livesLost: gameStats.livesLost || 0,
      livesRemaining: currentLives || 0,
    };

    // 크리스탈 보상 계산
    const crystalsEarned = RunMode.calculateCrystals(result);
    result.crystalsEarned = crystalsEarned;

    // 메타 진행 업데이트
    setMetaProgress(prev => {
      let updated = {
        ...prev,
        crystals: prev.crystals + crystalsEarned,
      };
      updated = RunSaveSystem.updateMetaStats(updated, result);
      RunSaveSystem.saveMeta(updated);
      return updated;
    });

    // 리더보드 업데이트
    const rank = Leaderboard.addEntry(runMode, {
      score: result.stagesCleared,
      stage: result.stagesCleared,
      time: playTimeMs,
      grade,
      date: Date.now(),
    });
    result.leaderboardRank = rank;

    // 업적 체크
    AchievementSystem.updateFromRun(result);
    AchievementSystem.updateFromMeta(metaProgress);
    AchievementSystem.checkAll(AchievementSystem.getStats());

    // 런 진행 데이터 삭제
    RunSaveSystem.deleteRun();

    // Daily Challenge 기록
    if (runMode === 'daily') {
      RunSaveSystem.saveDailyAttempt(result);
    }

    setRunResult(result);
    setRunActive(false);

    console.log(`[RunMode] 런 종료: ${cleared ? '클리어' : '실패'}, 등급: ${grade}, 크리스탈: ${crystalsEarned}`);
  }, [runMode, metaProgress]);

  // ===== 런 결과 닫기 =====
  const closeRunResult = useCallback(() => {
    setRunResult(null);
    setRunMode(null);
    setMetaSnapshot(null);
  }, []);

  // ===== 메타 업그레이드 구매 =====
  const purchaseUpgrade = useCallback((upgradeId) => {
    const result = RunMode.purchaseUpgrade(metaProgress, upgradeId);
    if (!result) return false;

    setMetaProgress(result);
    RunSaveSystem.saveMeta(result);
    console.log(`[RunMode] 업그레이드 구매: ${upgradeId}, 잔액: ${result.crystals}`);
    return true;
  }, [metaProgress]);

  // ===== 버프 리롤 =====
  const rerollBuffChoices = useCallback((currentBuffs, setBuffChoices) => {
    if (rerollsRemaining <= 0) return false;

    const newChoices = PermanentBuffManager.getRandomBuffChoices(currentBuffs, 3);
    setBuffChoices(newChoices);
    setRerollsRemaining(prev => prev - 1);
    setRerollsUsed(prev => prev + 1);

    console.log(`[RunMode] 버프 리롤 사용 (남은 횟수: ${rerollsRemaining - 1})`);
    return true;
  }, [rerollsRemaining]);

  // ===== 런 진행 저장 (자동/수동) =====
  const saveRunProgress = useCallback((gameState, inventoryState) => {
    if (!runActive) return false;

    return RunSaveSystem.saveRun({
      runMode,
      seed: runSeed,
      stage: gameState.stage,
      wave: gameState.wave,
      gold: gameState.gold,
      lives: gameState.lives,
      towers: gameState.towers,
      supportTowers: gameState.supportTowers,
      inventory: inventoryState?.inventory || [],
      supportInventory: inventoryState?.supportInventory || [],
      permanentBuffs: gameState.permanentBuffs,
      stats: gameState.gameStats,
      metaUpgradesSnapshot: metaSnapshot,
      modifiers: runModifiers,
      rerollsUsed,
    });
  }, [runActive, runMode, runSeed, metaSnapshot, runModifiers, rerollsUsed]);

  // ===== 런 진행 불러오기 =====
  const loadRunProgress = useCallback(() => {
    const data = RunSaveSystem.loadRun();
    if (!data) return null;

    // 런 상태 복원
    setRunMode(data.runMode);
    setRunActive(true);
    setRunResult(null);
    setRunSeed(data.seed);
    setRunModifiers(data.modifiers || []);
    setMetaSnapshot(data.metaUpgradesSnapshot || {});
    setRerollsUsed(data.rerollsUsed || 0);

    const rerolls = META_UPGRADES.rerollCount.effect(
      (data.metaUpgradesSnapshot || {}).rerollCount || 0
    );
    setRerollsRemaining(Math.max(0, rerolls - (data.rerollsUsed || 0)));
    runStartTime.current = Date.now() - (data.playTimeMs || 0);

    console.log(`[RunMode] 런 불러오기: ${data.runMode}, stage ${data.stage}-${data.wave}`);
    return data;
  }, []);

  // ===== 런 활성 여부 확인 =====
  const hasActiveRun = useCallback(() => {
    return RunSaveSystem.hasActiveRun();
  }, []);

  // ===== 활성 런 정보 미리보기 =====
  const getActiveRunInfo = useCallback(() => {
    return RunSaveSystem.getRunInfo();
  }, []);

  return {
    // 메타 진행
    metaProgress,
    setMetaProgress,
    neonCrystals: metaProgress.crystals,

    // 런 세션
    runMode,
    runActive,
    runResult,
    runConfig,
    runSeed,
    runModifiers,

    // 액션
    startRun,
    endRun,
    closeRunResult,
    purchaseUpgrade,

    // 리롤
    rerollsRemaining,
    rerollBuffChoices,

    // 저장/불러오기
    saveRunProgress,
    loadRunProgress,
    hasActiveRun,
    getActiveRunInfo,
  };
};

// 전역 등록
window.useRunMode = useRunMode;
