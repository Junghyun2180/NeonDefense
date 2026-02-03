// Neon Defense - 메인 React 컴포넌트
// 순수 UI + 상태 관리만 담당. 게임 로직은 GameEngine/TowerSystem/EnemySystem에 위임.
const { useState, useEffect, useMemo } = React;

const NeonDefense = () => {
  // ===== 게임 상태 훅 =====
  const gameState = useGameState();

  // ===== 인벤토리 훅 =====
  const inventoryState = useInventory(gameState);

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

  // 경로 꺾임 지점에 방향 화살표 사전 계산
  const pathArrows = useMemo(() => {
    const arrows = {};
    for (const path of gameState.pathData.paths) {
      const tiles = path.tiles;
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
        if (!arrows[key]) arrows[key] = { arrow, color: path.color };
      }
    }
    return arrows;
  }, [gameState.pathData]);

  const getElementInfo = (element) => ELEMENT_EFFECTS[element] || ELEMENT_EFFECTS[ELEMENT_TYPES.VOID];

  // 통합 리셋 (인벤토리 + 드래그 상태 포함)
  const handleResetGame = () => {
    gameState.resetGame();
    inventoryState.resetInventory();
    dragState.resetDragState();
  };

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4 overflow-x-hidden select-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
      {/* 상단 정보 바 */}
      <GameHeader
        stage={gameState.stage}
        wave={gameState.wave}
        gold={gameState.gold}
        lives={gameState.lives}
        pathCount={gameState.pathData.paths.length}
        isPlaying={gameState.isPlaying}
        killedCount={gameState.killedCount}
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
          handleDragStart={dragState.handleDragStart}
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
        />
      </div>

      {/* 드래그 프리뷰 */}
      <DragPreview
        draggingNeon={dragState.draggingNeon}
        isDragging={dragState.isDragging}
        dragPosition={dragState.dragPosition}
        getElementInfo={getElementInfo}
      />

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
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<NeonDefense />);
