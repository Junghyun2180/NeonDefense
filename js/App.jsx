// Neon Defense - 메인 React 컴포넌트
// 순수 UI + 상태 관리만 담당. 게임 로직은 GameEngine/TowerSystem/EnemySystem에 위임.
const { useState, useEffect, useMemo } = React;

const NeonDefense = () => {
  // ===== 게임 상태 훅 =====
  const gameState = useGameState();

  // ===== 인벤토리 훅 =====
  const inventoryState = useInventory(gameState);

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

  // ===== 드래그 앤 드롭 훅 =====
  const dragState = useDragAndDrop(gameState, inventoryState);

  // ===== 치트 콘솔 훅 =====
  const cheatState = useCheatConsole(gameState, inventoryState);

  // 도움말 모달 상태
  const [showHelp, setShowHelp] = useState(false);

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

    // 밸런스 로거 세션 시작
    if (typeof BalanceLogger !== 'undefined') {
      BalanceLogger.startSession();
    }
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden select-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* 메인 메뉴 (게임 시작 전) */}
      {saveLoadState.showMainMenu && (
        <MainMenu
          saveInfo={saveLoadState.saveInfo}
          onNewGame={saveLoadState.handleNewGame}
          onLoadGame={saveLoadState.handleLoadGame}
          onSelectMode={(mode) => console.log('[App] 모드 선택:', mode)}
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
      />

      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* 게임 맵 */}
        <GameMap
          mapRef={dragState.mapRef}
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

        {/* 사이드 패널 */}
        <ControlPanel
          gold={gameState.gold}
          isPlaying={gameState.isPlaying}
          drawRandomNeon={inventoryState.drawRandomNeon}
          drawRandomSupport={inventoryState.drawRandomSupport}
          startWave={gameState.startWave}
          isInventoryFull={inventoryState.isInventoryFull}
          isSupportInventoryFull={inventoryState.isSupportInventoryFull}
          inventory={inventoryState.inventory}
          selectedInventory={inventoryState.selectedInventory}
          selectedTowerForPlacement={dragState.selectedTowerForPlacement}
          handleInventoryClick={dragState.handleInventoryClick}
          toggleInventorySelect={inventoryState.toggleInventorySelect}
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
          toggleSupportInventorySelect={inventoryState.toggleSupportInventorySelect}
          combineSupports={inventoryState.combineSupports}
          combineAllSupports={inventoryState.combineAllSupports}
          combineSupportTowers={inventoryState.combineSupportTowers}
          sellSelectedSupportTowers={inventoryState.sellSelectedSupportTowers}
          selectedSupportTowers={inventoryState.selectedSupportTowers}
          totalSupportSellPrice={inventoryState.totalSupportSellPrice}
          canCombineSupportTowers={inventoryState.canCombineSupportTowers}
          effectiveDrawCost={inventoryState.effectiveDrawCost}
        />
      </div>

      {/* 모바일 배치 UI */}
      <PlacementUI
        placementMode={dragState.placementMode}
        setPlacementMode={dragState.setPlacementMode}
        mapRef={dragState.mapRef}
        getAvailableElements={inventoryState.getAvailableElements}
        getInventoryByElement={inventoryState.getInventoryByElement}
        handleElementSelect={dragState.handleElementSelect}
        handleTierSelect={dragState.handleTierSelect}
        getElementInfo={getElementInfo}
      />

      {/* 모달들 */}
      <GameModals
        gameOver={gameState.gameOver}
        resetGame={handleResetGame}
        stage={gameState.stage}
        wave={gameState.wave}
        killedCount={gameState.killedCount}
        showStageTransition={gameState.showStageTransition}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        getElementInfo={getElementInfo}
      />

      {/* T4 역할 선택 모달 */}
      <RoleSelectionModal
        pendingT4Choice={inventoryState.pendingT4Choice}
        onSelectRole={inventoryState.confirmT4Role}
        onCancel={inventoryState.cancelT4Choice}
        getElementInfo={getElementInfo}
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
      />

      {/* 게임 클리어 모달 */}
      <GameClearModal
        isOpen={gameState.gameCleared}
        stats={gameState.gameStats}
        lives={gameState.lives}
        gold={gameState.gold}
        permanentBuffs={gameState.permanentBuffs}
        onRestart={handleResetGame}
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
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<NeonDefense />);
