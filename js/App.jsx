// Neon Defense - 메인 React 컴포넌트
// 순수 UI + 상태 관리만 담당. 게임 로직은 GameEngine/TowerSystem/EnemySystem에 위임.
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const NeonDefense = () => {
  // ===== 런 모드 훅 =====
  const runModeState = useRunMode();
  const [showRunMenu, setShowRunMenu] = useState(false);

  // ===== 게임 상태 훅 =====
  // 런 모드: runConfig / 캠페인: campaignConfig (메타 업그레이드 적용)
  const activeConfig = runModeState.runActive
    ? runModeState.runConfig
    : runModeState.campaignConfig;
  const gameState = useGameState(activeConfig);

  // ===== 사용자 설정 훅 (속도감 개선 — 자동조합, T4 역할 프리셋) =====
  const settings = useSettings();

  // ===== 인벤토리 훅 =====
  const inventoryState = useInventory(gameState, settings);

  // ===== 저장/불러오기 훅 =====
  const saveLoadState = useSaveLoad({
    stage: gameState.stage,
    wave: gameState.wave,
    gold: gameState.gold,
    lives: gameState.lives,
    towers: gameState.towers,
    supportTowers: gameState.supportTowers,
    inventory: inventoryState.inventory,
    supportInventory: inventoryState.supportInventory,
    permanentBuffs: gameState.permanentBuffs,
    stats: gameState.gameStats,
    enemies: gameState.enemies,
    projectiles: gameState.projectiles,
    effects: gameState.effects,
    chainLightnings: gameState.chainLightnings,
    spawnedCount: gameState.spawnedCount,
    killedCount: gameState.killedCount,
    isPlaying: gameState.isPlaying,
    gameOver: gameState.gameOver,
  });

  // ===== 맵 스케일 (모바일 반응형) =====
  const [mapScale, setMapScale] = useState(1);
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const updateScale = () => {
      if (!mapContainerRef.current) return;
      const containerWidth = mapContainerRef.current.offsetWidth;
      const MAP_WIDTH = GRID_WIDTH * TILE_SIZE; // 640
      const scale = Math.min(1, containerWidth / MAP_WIDTH);
      setMapScale(scale);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // ===== 드래그 앤 드롭 훅 =====
  const dragState = useDragAndDrop(gameState, inventoryState, mapScale);

  // ===== 치트 콘솔 훅 =====
  const cheatState = useCheatConsole(gameState, inventoryState, runModeState);

  // 도움말 모달 상태
  const [showHelp, setShowHelp] = useState(false);

  // 첫 접속 시 도움말 자동 표시 (튜토리얼 대체)
  useEffect(() => {
    if (!settings.tutorialSeen) {
      setShowHelp(true);
    }
  }, []);

  // 도움말 닫힐 때 tutorialSeen 저장
  useEffect(() => {
    if (!showHelp && !settings.tutorialSeen) {
      settings.setTutorialSeen(true);
    }
  }, [showHelp]);

  // T4 역할 선택 모달: "이 역할 기억" 체크박스 상태
  const [rememberT4Role, setRememberT4Role] = useState(false);

  // ===== 튜토리얼 단계 (Stage 0 경량) =====
  // step: 'none' | 'draw' | 'combine' | 'place' | 'start' | 'done' | 'done-closed'
  const [tutorialStep, setTutorialStep] = useState('none');

  // 튜토리얼 시작 조건: 게임 시작 + tutorialDone=false + 런모드 아님 (첫 캠페인만)
  useEffect(() => {
    if (saveLoadState.gameStarted && !saveLoadState.showMainMenu
        && !settings.tutorialDone && !runModeState.runActive
        && tutorialStep === 'none') {
      setTutorialStep('draw');
    }
  }, [saveLoadState.gameStarted, saveLoadState.showMainMenu, settings.tutorialDone, runModeState.runActive]);

  // 튜토리얼 자동 진행: 인벤토리/타워/isPlaying 감지
  // draw: 뽑기 1회 완료 시 → combine (수동 "다음" 대기)
  // place: 맵 타워 1개 이상 → start
  // start: isPlaying=true → done
  useEffect(() => {
    if (tutorialStep === 'draw' && inventoryState.inventory.length > 0) {
      setTutorialStep('combine');
    }
  }, [inventoryState.inventory.length, tutorialStep]);

  useEffect(() => {
    if (tutorialStep === 'place' && gameState.towers.length > 0) {
      setTutorialStep('start');
    }
  }, [gameState.towers.length, tutorialStep]);

  useEffect(() => {
    if (tutorialStep === 'start' && gameState.isPlaying) {
      setTutorialStep('done');
    }
  }, [gameState.isPlaying, tutorialStep]);

  // 사용자가 중간에 타워 배치하면 combine → place 건너뛰고 start로
  useEffect(() => {
    if (tutorialStep === 'combine' && gameState.towers.length > 0) {
      setTutorialStep('start');
    }
  }, [gameState.towers.length, tutorialStep]);

  const handleTutorialNext = () => {
    const order = ['draw', 'combine', 'place', 'start', 'done'];
    const idx = order.indexOf(tutorialStep);
    if (idx >= 0 && idx < order.length - 1) setTutorialStep(order[idx + 1]);
  };
  const handleTutorialSkip = () => {
    setTutorialStep('done-closed');
    settings.setTutorialDone(true);
  };
  const handleTutorialClose = () => {
    setTutorialStep('done-closed');
    settings.setTutorialDone(true);
  };

  // 사운드 상태
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const toggleBgm = () => setBgmEnabled(soundManager.toggleBGM());
  const toggleSfx = () => setSfxEnabled(soundManager.toggleSFX());

  // ===== 밸런스 로거 - 진행도 추적 =====
  useEffect(() => {
    if (typeof BalanceLogger !== 'undefined') {
      BalanceLogger.updateProgress(gameState.stage);
    }
  }, [gameState.stage]);

  // ===== 최대 배속이 줄어들 때 현재 배속 클램프 =====
  useEffect(() => {
    if (gameState.gameSpeed > settings.maxGameSpeed) {
      gameState.setGameSpeed(settings.maxGameSpeed);
    }
  }, [settings.maxGameSpeed, gameState.gameSpeed]);

  // ===== 자동 다음 웨이브 (수동 웨이브 모드 전용) =====
  // 설정이 켜져 있고, 웨이브 간이며, 어떤 모달도 떠 있지 않을 때 자동 시작
  useEffect(() => {
    if (!settings.autoNextWave) return;
    if (gameState.isPlaying || gameState.gameOver || gameState.gameCleared) return;
    if (gameState.showStageTransition) return;
    if (gameState.showBuffSelection || gameState.showCarryoverSelection) return;
    if (gameState.wave <= 1) return; // 새 스테이지 첫 웨이브는 수동 시작

    // 자동 웨이브 모드(런 모드)는 타이머가 처리하므로 스킵
    const ability = activeConfig?.modeAbility
      ? (typeof ModeAbilityHelper !== 'undefined' ? ModeAbilityHelper.getAbility(activeConfig.modeAbility) : null)
      : null;
    if (ability && ability.waveAutoStart) return;

    const timer = setTimeout(() => {
      gameState.startWave();
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    settings.autoNextWave,
    gameState.isPlaying, gameState.wave, gameState.stage,
    gameState.gameOver, gameState.gameCleared,
    gameState.showStageTransition,
    gameState.showBuffSelection, gameState.showCarryoverSelection,
    activeConfig,
  ]);

  // ===== 밸런스 로거 - 게임 클리어 시 로그 기록 =====
  useEffect(() => {
    if (gameState.gameCleared && typeof BalanceLogger !== 'undefined') {
      // 로그 기록
      BalanceLogger.logGameEnd('clear', {
        towers: gameState.towers,
        supportTowers: gameState.supportTowers,
        gold: gameState.gold,
        lives: gameState.lives,
        stage: gameState.stage,
        wave: gameState.wave,
        gameStats: gameState.gameStats,
        permanentBuffs: gameState.permanentBuffs,
      });
    }
  }, [gameState.gameCleared]);

  // ===== 밸런스 로거 - 게임오버 시 로그 기록 =====
  useEffect(() => {
    if (gameState.gameOver && typeof BalanceLogger !== 'undefined') {
      // 로그 기록
      BalanceLogger.logGameEnd('gameover', {
        towers: gameState.towers,
        supportTowers: gameState.supportTowers,
        gold: gameState.gold,
        lives: gameState.lives,
        stage: gameState.stage,
        wave: gameState.wave,
        gameStats: gameState.gameStats,
        permanentBuffs: gameState.permanentBuffs,
      });
    }
  }, [gameState.gameOver]);

  // ===== 캠페인 클리어/게임오버 크리스탈 보상 =====
  const [campaignCrystalResult, setCampaignCrystalResult] = useState(null);
  const [campaignRank, setCampaignRank] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);

  // 캠페인 클리어 시 크리스탈 보상 처리
  useEffect(() => {
    if (gameState.gameCleared && !runModeState.runMode) {
      const playTimeMs = gameState.gameStats.endTime
        ? gameState.gameStats.endTime - gameState.gameStats.startTime
        : Date.now() - gameState.gameStats.startTime;

      const grade = GameStats.calculateGrade(gameState.gameStats);
      const isFirstClear = !(runModeState.metaProgress.stats.campaignClears > 0);
      const isPerfect = (gameState.gameStats.livesLost || 0) === 0;

      const result = {
        cleared: true,
        stagesCleared: gameState.gameStats.stagesCleared,
        grade: grade.grade,
        isPerfect,
        playTimeMs,
        isFirstClear,
      };

      const { crystals, breakdown } = RunMode.calculateCampaignCrystals(result);
      setCampaignCrystalResult({ crystals, breakdown });

      // 메타 진행에 크리스탈 추가
      runModeState.setMetaProgress(prev => {
        const updated = {
          ...prev,
          crystals: prev.crystals + crystals,
          stats: {
            ...prev.stats,
            campaignClears: (prev.stats.campaignClears || 0) + 1,
            totalCrystalsEarned: (prev.stats.totalCrystalsEarned || 0) + crystals,
          },
        };
        RunSaveSystem.saveMeta(updated);
        return updated;
      });

      // 리더보드 추가
      const rank = Leaderboard.addEntry('campaign', {
        stage: gameState.gameStats.stagesCleared,
        time: playTimeMs,
        grade: grade.grade,
        lives: gameState.lives,
      });
      setCampaignRank(rank);

      // 업적 체크
      const stats = AchievementSystem.updateFromCampaign(
        gameState.gameStats, true, gameState.lives, playTimeMs
      );
      AchievementSystem.updateFromMeta(runModeState.metaProgress);
      const newAchs = AchievementSystem.checkAll(stats);
      if (newAchs.length > 0) {
        setNewAchievements(newAchs);
      }

      console.log(`[Campaign] 클리어 보상: 💎${crystals}`);
    }
  }, [gameState.gameCleared]);

  // 캠페인 게임오버 시 크리스탈 보상 처리
  useEffect(() => {
    if (gameState.gameOver && !runModeState.runMode) {
      const playTimeMs = Date.now() - gameState.gameStats.startTime;
      const grade = GameStats.calculateGrade(gameState.gameStats);

      const result = {
        cleared: false,
        stagesCleared: gameState.gameStats.stagesCleared,
        grade: grade.grade,
        isPerfect: false,
        playTimeMs,
        isFirstClear: false,
      };

      const { crystals, breakdown } = RunMode.calculateCampaignCrystals(result);
      if (crystals > 0) {
        setCampaignCrystalResult({ crystals, breakdown });

        runModeState.setMetaProgress(prev => {
          const updated = {
            ...prev,
            crystals: prev.crystals + crystals,
            stats: {
              ...prev.stats,
              totalCrystalsEarned: (prev.stats.totalCrystalsEarned || 0) + crystals,
            },
          };
          RunSaveSystem.saveMeta(updated);
          return updated;
        });
      }

      // 업적 체크
      const stats = AchievementSystem.updateFromCampaign(
        gameState.gameStats, false, gameState.lives, playTimeMs
      );
      AchievementSystem.checkAll(stats);

      console.log(`[Campaign] 게임오버 보상: 💎${crystals}`);
    }
  }, [gameState.gameOver]);

  // ===== 런 모드: 게임 클리어/오버 감지 =====
  useEffect(() => {
    if (runModeState.runActive && gameState.gameCleared) {
      runModeState.endRun(true, gameState.gameStats, gameState.lives);
    }
  }, [gameState.gameCleared]);

  useEffect(() => {
    if (runModeState.runActive && gameState.gameOver) {
      runModeState.endRun(false, gameState.gameStats, gameState.lives);
    }
  }, [gameState.gameOver]);

  // ===== 런 모드: 런 시작 시 게임 리셋 =====
  const prevRunActive = useRef(false);
  const isLoadingRun = useRef(false);
  useEffect(() => {
    if (runModeState.runActive && !prevRunActive.current && !isLoadingRun.current) {
      gameState.resetGame();
      inventoryState.resetInventory();
      dragState.resetDragState();
    }
    prevRunActive.current = runModeState.runActive;
    isLoadingRun.current = false;
  }, [runModeState.runActive]);

  // ===== 런 모드 핸들러 =====
  const handleSelectMode = useCallback((mode) => {
    if (mode === 'run') {
      setShowRunMenu(true);
    }
  }, []);

  const handleStartRun = useCallback((mode, modifiers = []) => {
    runModeState.startRun(mode, modifiers);
    setShowRunMenu(false);
    saveLoadState.setShowMainMenu(false);
    saveLoadState.setGameStarted(true);
  }, [runModeState, saveLoadState]);

  const handleCampaignMainMenu = useCallback(() => {
    // runMode를 먼저 정리하여 resetGame이 캠페인 config로 동작하게 함
    if (runModeState.runActive || runModeState.runMode) {
      runModeState.closeRunResult();
    }
    // cfg 갱신 후 resetGame 실행되도록 setTimeout 사용
    setTimeout(() => {
      gameState.resetGame();
      inventoryState.resetInventory();
      saveLoadState.setGameStarted(false);
      saveLoadState.setShowMainMenu(true);
    }, 0);
  }, [gameState, inventoryState, saveLoadState, runModeState]);

  const handleRunMenuBack = useCallback(() => {
    setShowRunMenu(false);
    saveLoadState.setShowMainMenu(true);
  }, [saveLoadState]);

  const handleRunResultMainMenu = useCallback(() => {
    // closeRunResult를 먼저 호출하여 runMode=null로 설정
    // → cfg가 캠페인 기본값으로 갱신된 후 resetGame 실행
    runModeState.closeRunResult();
    // resetGame은 다음 렌더 사이클에서 cfg 갱신 후 실행되도록 setTimeout 사용
    setTimeout(() => {
      gameState.resetGame();
      inventoryState.resetInventory();
      saveLoadState.setGameStarted(false);
      saveLoadState.setShowMainMenu(true);
    }, 0);
  }, [runModeState, gameState, inventoryState, saveLoadState]);

  const handleRunResultRestart = useCallback(() => {
    const mode = runModeState.runResult?.mode || 'standard';
    runModeState.closeRunResult();
    runModeState.startRun(mode);
    saveLoadState.setShowMainMenu(false);
    saveLoadState.setGameStarted(true);
  }, [runModeState, saveLoadState]);

  const handleRunResultUpgrades = useCallback(() => {
    runModeState.closeRunResult();
    gameState.resetGame();
    inventoryState.resetInventory();
    saveLoadState.setGameStarted(false);
    setShowRunMenu(true);
  }, [runModeState, gameState, inventoryState, saveLoadState]);

  const handleLoadRun = useCallback(() => {
    isLoadingRun.current = true;
    const data = runModeState.loadRunProgress();
    if (!data) return;
    setShowRunMenu(false);
    saveLoadState.setShowMainMenu(false);
    saveLoadState.setGameStarted(true);

    // 게임 상태 복원
    const restoredTowers = (data.towers || []).map(tData => {
      let tower;
      if (tData.tier === 4 && tData.role) {
        tower = TowerSystem.createT4WithRole(tData.colorIndex, tData.role);
      } else {
        tower = TowerSystem.create(tData.tier, tData.colorIndex);
      }
      tower.id = tData.id;
      tower.x = tData.x;
      tower.y = tData.y;
      tower.lastShot = Date.now();
      return tower;
    });

    const restoredSupports = (data.supportTowers || []).map(sData => {
      const support = TowerSystem.createSupport(sData.tier, sData.supportType);
      support.id = sData.id;
      support.x = sData.x;
      support.y = sData.y;
      support.abilityType = sData.abilityType;
      return support;
    });

    gameState.setStage(data.stage);
    gameState.setWave(data.wave);
    gameState.setGold(data.gold);
    gameState.setLives(data.lives);
    gameState.setTowers(restoredTowers);
    gameState.setSupportTowers(restoredSupports);
    gameState.setPermanentBuffs(data.permanentBuffs || {});
    gameState.setGameStats(data.stats || GameStats.createEmpty());
    inventoryState.setInventory(data.inventory || []);
    inventoryState.setSupportInventory(data.supportInventory || []);
    gameState.setPathData(generateMultiplePaths(data.seed || Date.now(), data.stage));
  }, [runModeState, gameState, inventoryState, saveLoadState]);

  // 경로 꺾임 지점에 방향 화살표 사전 계산 (여러 경로 겹침 지원)
  const pathArrows = useMemo(() => {
    const arrows = {};
    for (const path of gameState.pathData.paths) {
      const tiles = path.tiles;
      // 첫 번째 경로(A)는 노란색, 나머지는 경로 색상
      const arrowColor = path.id === 'A' ? '#FFD700' : path.color;
      for (let i = 1; i < tiles.length - 1; i++) {
        const prev = tiles[i - 1];
        const curr = tiles[i];
        const next = tiles[i + 1];
        const prevDx = curr.x - prev.x;
        const prevDy = curr.y - prev.y;
        const nextDx = next.x - curr.x;
        const nextDy = next.y - curr.y;
        if (prevDx === nextDx && prevDy === nextDy) continue;
        let arrow;
        if (nextDx > 0) arrow = '→';
        else if (nextDx < 0) arrow = '←';
        else if (nextDy > 0) arrow = '↓';
        else arrow = '↑';
        const key = `${curr.x},${curr.y}`;
        // 배열로 저장하여 여러 경로 화살표 지원
        if (!arrows[key]) arrows[key] = [];
        // 같은 화살표가 이미 있으면 추가하지 않음
        if (!arrows[key].some(a => a.arrow === arrow && a.color === arrowColor)) {
          arrows[key].push({ arrow, color: arrowColor });
        }
      }
    }
    return arrows;
  }, [gameState.pathData]);

  const getElementInfo = (element) => ELEMENT_EFFECTS[element] || ELEMENT_EFFECTS[ELEMENT_TYPES.VOID];

  // ===== 저장 데이터 복원 =====
  useEffect(() => {
    if (!saveLoadState.loadedData) return;

    console.log('[App] 저장 데이터 적용 중...');
    const data = saveLoadState.loadedData;

    // 타워 복원
    const restoredTowers = data.towers.map(tData => {
      // T4 타워이고 role이 있으면 createT4WithRole 사용, 아니면 일반 create
      let tower;
      if (tData.tier === 4 && tData.role) {
        tower = TowerSystem.createT4WithRole(tData.colorIndex, tData.role);
      } else {
        tower = TowerSystem.create(tData.tier, tData.colorIndex);
      }
      tower.id = tData.id;
      tower.x = tData.x;
      tower.y = tData.y;
      tower.lastShot = Date.now();
      return tower;
    });

    // 서포트 타워 복원
    const restoredSupports = data.supportTowers.map(sData => {
      const support = TowerSystem.createSupport(sData.tier, sData.supportType);
      support.id = sData.id;
      support.x = sData.x;
      support.y = sData.y;
      support.abilityType = sData.abilityType;
      return support;
    });

    // 상태 업데이트
    gameState.setStage(data.stage);
    gameState.setWave(data.wave);
    gameState.setGold(data.gold);
    gameState.setLives(data.lives);
    gameState.setTowers(restoredTowers);
    gameState.setSupportTowers(restoredSupports);
    gameState.setPermanentBuffs(data.permanentBuffs);
    gameState.setGameStats(data.stats || GameStats.createEmpty());

    // 인벤토리 복원
    inventoryState.setInventory(data.inventory || []);
    inventoryState.setSupportInventory(data.supportInventory || []);

    // 경로 재생성
    gameState.setPathData(generateMultiplePaths(Date.now(), data.stage));

    console.log('[App] 저장 데이터 적용 완료');
  }, [saveLoadState.loadedData]);

  // 캐리오버용 인벤토리 참조 업데이트
  useEffect(() => {
    gameState.updateInventoryRefs(inventoryState.inventory, inventoryState.supportInventory);
  }, [inventoryState.inventory, inventoryState.supportInventory]);

  // 버프 선택 래퍼 (캐리오버 타워 인벤토리 추가)
  const handleSelectBuff = (buffId) => {
    const carryover = gameState.selectBuff(buffId);
    if (carryover) {
      // 캐리오버 타워를 인벤토리에 추가
      inventoryState.addCarryoverTowers(carryover.towers, carryover.supports);
    }
    // 기존 인벤토리 비우기 (캐리오버 제외)
    inventoryState.clearInventoryForNewStage();
  };

  // 통합 리셋 (인벤토리 + 드래그 상태 포함)
  const handleResetGame = () => {
    gameState.resetGame();
    inventoryState.resetInventory();
    dragState.resetDragState();
    setCampaignCrystalResult(null);
    setNewAchievements([]);

    // 밸런스 로거 세션 시작
    if (typeof BalanceLogger !== 'undefined') {
      BalanceLogger.startSession();
    }
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden select-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* 메인 메뉴 (게임 시작 전) */}
      {saveLoadState.showMainMenu && !showRunMenu && (
        <MainMenu
          saveInfo={saveLoadState.saveInfo}
          onNewGame={() => {
            saveLoadState.handleNewGame();
            gameState.resetGame();
            inventoryState.resetInventory();
            dragState.resetDragState();
          }}
          onLoadGame={saveLoadState.handleLoadGame}
          onSelectMode={handleSelectMode}
          metaProgress={runModeState.metaProgress}
          neonCrystals={runModeState.neonCrystals}
          onPurchaseUpgrade={runModeState.purchaseUpgrade}
        />
      )}

      {/* 런 모드 메뉴 */}
      {showRunMenu && !runModeState.runActive && (
        <RunModeMenu
          metaProgress={runModeState.metaProgress}
          neonCrystals={runModeState.neonCrystals}
          onStartRun={handleStartRun}
          onPurchaseUpgrade={runModeState.purchaseUpgrade}
          onBack={handleRunMenuBack}
          activeRunInfo={runModeState.getActiveRunInfo()}
          onLoadRun={handleLoadRun}
        />
      )}

      {/* 게임 화면 (게임 시작 후) */}
      {saveLoadState.gameStarted && !saveLoadState.showMainMenu && (
        <div className="p-2 sm:p-4">
          {/* 상단 정보 바 */}
          <GameHeader
            stage={gameState.stage}
            wave={gameState.wave}
            gold={gameState.gold}
            lives={gameState.lives}
            pathCount={gameState.pathData.paths.length}
            isPlaying={gameState.isPlaying}
            killedCount={gameState.killedCount}
            permanentBuffs={gameState.permanentBuffs}
            gameMode={runModeState.runMode}
            spawnConfig={gameState.activeConfig?.SPAWN}
            onMainMenu={handleCampaignMainMenu}
          />

          {/* 맵 + 선택 정보 사이드패널 (맵 가운데 정렬) */}
          <div ref={mapContainerRef} className="flex justify-center gap-3">
            {/* 게임 맵 */}
            <GameMap
              mapRef={dragState.mapRef}
              mapScale={mapScale}
              pathData={gameState.pathData}
              pathArrows={pathArrows}
              towers={gameState.towers}
              supportTowers={gameState.supportTowers}
              enemies={gameState.enemies}
              projectiles={gameState.projectiles}
              effects={gameState.effects}
              chainLightnings={gameState.chainLightnings}
              dropPreview={dragState.dropPreview}
              placementMode={dragState.placementMode}
              selectedTowerForPlacement={dragState.selectedTowerForPlacement}
              cancelPlacementMode={dragState.cancelPlacementMode}
              selectedTowers={inventoryState.selectedTowers}
              selectedSupportTowers={inventoryState.selectedSupportTowers}
              gameSpeed={gameState.gameSpeed}
              setGameSpeed={gameState.setGameSpeed}
              maxGameSpeed={settings.maxGameSpeed}
              bgmEnabled={bgmEnabled}
              sfxEnabled={sfxEnabled}
              toggleBgm={toggleBgm}
              toggleSfx={toggleSfx}
              setShowHelp={setShowHelp}
              toggleTowerSelect={inventoryState.toggleTowerSelect}
              toggleSupportTowerSelect={inventoryState.toggleSupportTowerSelect}
              handleTileClick={dragState.handleTileClick}
              getElementInfo={getElementInfo}
            />

            {/* 사이드 패널: 선택된 타워/서포트 정보만 */}
            <ControlPanel
              inventory={inventoryState.inventory}
              selectedInventory={inventoryState.selectedInventory}
              getElementInfo={getElementInfo}
              selectedTowers={inventoryState.selectedTowers}
              totalSellPrice={inventoryState.totalSellPrice}
              selectedSupportInventory={inventoryState.selectedSupportInventory}
              selectedSupportTowers={inventoryState.selectedSupportTowers}
              totalSupportSellPrice={inventoryState.totalSupportSellPrice}
            />
          </div>

          {/* 하단: 버튼 행 + 인벤토리 패널 */}
          <InventoryPanel
            gold={gameState.gold}
            isPlaying={gameState.isPlaying}
            startWave={gameState.startWave}
            isInventoryFull={inventoryState.isInventoryFull}
            isSupportInventoryFull={inventoryState.isSupportInventoryFull}
            drawRandomNeon={inventoryState.drawRandomNeon}
            drawRandomNeon10={inventoryState.drawRandomNeon10}
            drawRandomSupport={inventoryState.drawRandomSupport}
            drawRandomSupport10={inventoryState.drawRandomSupport10}
            effectiveDrawCost={inventoryState.effectiveDrawCost}
            autoCombine={settings.autoCombine}
            setAutoCombine={settings.setAutoCombine}
            autoSupportCombine={settings.autoSupportCombine}
            setAutoSupportCombine={settings.setAutoSupportCombine}
            clearAllT4RolePresets={settings.clearAllT4RolePresets}
            t4RolePresets={settings.t4RolePresets}
            autoNextWave={settings.autoNextWave}
            setAutoNextWave={settings.setAutoNextWave}
            maxGameSpeed={settings.maxGameSpeed}
            setMaxGameSpeed={settings.setMaxGameSpeed}
            inventory={inventoryState.inventory}
            selectedInventory={inventoryState.selectedInventory}
            selectedTowerForPlacement={dragState.selectedTowerForPlacement}
            handleInventoryClick={dragState.handleInventoryClick}
            getElementInfo={getElementInfo}
            combineNeons={inventoryState.combineNeons}
            combineAllNeons={inventoryState.combineAllNeons}
            combineTowers={inventoryState.combineTowers}
            sellSelectedTowers={inventoryState.sellSelectedTowers}
            selectedTowers={inventoryState.selectedTowers}
            totalSellPrice={inventoryState.totalSellPrice}
            canCombineTowers={inventoryState.canCombineTowers}
            supportInventory={inventoryState.supportInventory}
            selectedSupportInventory={inventoryState.selectedSupportInventory}
            combineSupports={inventoryState.combineSupports}
            combineAllSupports={inventoryState.combineAllSupports}
            combineSupportTowers={inventoryState.combineSupportTowers}
            sellSelectedSupportTowers={inventoryState.sellSelectedSupportTowers}
            selectedSupportTowers={inventoryState.selectedSupportTowers}
            totalSupportSellPrice={inventoryState.totalSupportSellPrice}
            canCombineSupportTowers={inventoryState.canCombineSupportTowers}
          />

          {/* 모바일 배치 UI */}
          <PlacementUI
            placementMode={dragState.placementMode}
            setPlacementMode={dragState.setPlacementMode}
            mapRef={dragState.mapRef}
            mapScale={mapScale}
            getAvailableElements={inventoryState.getAvailableElements}
            getInventoryByElement={inventoryState.getInventoryByElement}
            handleElementSelect={dragState.handleElementSelect}
            handleTierSelect={dragState.handleTierSelect}
            getElementInfo={getElementInfo}
          />

          {/* 모달들 (런 모드에서는 게임오버 모달 숨김) */}
          <GameModals
            gameOver={gameState.gameOver && !runModeState.runMode}
            resetGame={handleResetGame}
            onMainMenu={handleCampaignMainMenu}
            stage={gameState.stage}
            wave={gameState.wave}
            killedCount={gameState.killedCount}
            showStageTransition={gameState.showStageTransition}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
            getElementInfo={getElementInfo}
            crystalResult={campaignCrystalResult}
          />

          {/* T4 역할 선택 모달 */}
          <RoleSelectionModal
            pendingT4Choice={inventoryState.pendingT4Choice}
            onSelectRole={(roleId, remember) => { inventoryState.confirmT4Role(roleId, remember); setRememberT4Role(false); }}
            onCancel={() => { inventoryState.cancelT4Choice(); setRememberT4Role(false); }}
            getElementInfo={getElementInfo}
            rememberChoice={rememberT4Role}
            setRememberChoice={setRememberT4Role}
          />

          {/* 치트 콘솔 */}
          <CheatConsole
            cheatOpen={cheatState.cheatOpen}
            setCheatOpen={cheatState.setCheatOpen}
            cheatInput={cheatState.cheatInput}
            setCheatInput={cheatState.setCheatInput}
            cheatLog={cheatState.cheatLog}
            cheatInputRef={cheatState.cheatInputRef}
            handleCheatSubmit={cheatState.handleCheatSubmit}
            handleKeyDown={cheatState.handleKeyDown}
          />

          {/* 타워 캐리오버 선택 모달 */}
          <CarryoverModal
            isOpen={gameState.showCarryoverSelection}
            candidates={gameState.carryoverCandidates}
            selectedIds={gameState.selectedCarryover}
            onToggleTower={gameState.toggleCarryoverTower}
            onToggleSupport={gameState.toggleCarryoverSupport}
            onConfirm={gameState.confirmCarryover}
            allTowers={{
              towers: gameState.towers,
              supports: gameState.supportTowers,
              inventory: inventoryState.inventory,
              supportInventory: inventoryState.supportInventory,
            }}
          />

          {/* 영구 버프 선택 모달 */}
          <BuffSelectionModal
            isOpen={gameState.showBuffSelection}
            buffChoices={gameState.buffChoices}
            currentBuffs={gameState.permanentBuffs}
            onSelectBuff={handleSelectBuff}
            rerollsRemaining={runModeState.runActive ? runModeState.rerollsRemaining : 0}
            onReroll={runModeState.runActive ? () => runModeState.rerollBuffChoices(gameState.permanentBuffs, gameState.setBuffChoices) : null}
          />

          {/* 게임 클리어 모달 (캠페인 전용) */}
          <GameClearModal
            isOpen={gameState.gameCleared && !runModeState.runMode}
            stats={gameState.gameStats}
            lives={gameState.lives}
            gold={gameState.gold}
            permanentBuffs={gameState.permanentBuffs}
            onRestart={handleResetGame}
            onMainMenu={handleCampaignMainMenu}
            crystalResult={campaignCrystalResult}
            newAchievements={newAchievements}
            leaderboardRank={campaignRank}
          />

          {/* 런 결과 모달 */}
          <RunResultModal
            isOpen={!!runModeState.runResult}
            runResult={runModeState.runResult}
            gameStats={gameState.gameStats}
            lives={gameState.lives}
            gold={gameState.gold}
            permanentBuffs={gameState.permanentBuffs}
            onRestart={handleRunResultRestart}
            onMainMenu={handleRunResultMainMenu}
            onUpgrades={handleRunResultUpgrades}
          />

          {/* 스테이지 클리어 저장 옵션 모달 (선택사항) */}
          <SaveLoadModal
            show={saveLoadState.showSaveLoadModal}
            mode={saveLoadState.saveLoadMode}
            onSaveAndQuit={saveLoadState.handleSaveAndQuit}
            onContinue={saveLoadState.handleContinue}
            saveInfo={saveLoadState.saveInfo}
          />
        </div>
      )}

      {/* 도움말 모달 (어디서든 접근 가능, 메인메뉴/게임화면/런모드 공용, 최상단 z-index) */}
      <HelpModal
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        getElementInfo={getElementInfo}
      />

      {/* 튜토리얼 오버레이 (첫 게임 진입 시) */}
      {saveLoadState.gameStarted && !saveLoadState.showMainMenu && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
          onClose={handleTutorialClose}
        />
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<NeonDefense />);
