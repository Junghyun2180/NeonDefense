// Neon Defense - 메인 React 컴포넌트
// 순수 UI + 상태 관리만 담당. 게임 로직은 GameEngine/TowerSystem/EnemySystem에 위임.
const { useState, useEffect, useCallback, useRef, useMemo } = React;

const NeonDefense = () => {
  // ===== 게임 상태 =====
  const [gold, setGold] = useState(ECONOMY.startGold);
  const [lives, setLives] = useState(ECONOMY.startLives);
  const [stage, setStage] = useState(1);
  const [wave, setWave] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [towers, setTowers] = useState([]);
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [selectedTowers, setSelectedTowers] = useState([]);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [killedCount, setKilledCount] = useState(0);
  const [effects, setEffects] = useState([]);
  const [chainLightnings, setChainLightnings] = useState([]);

  // ===== 서포트 타워 상태 =====
  const [supportInventory, setSupportInventory] = useState([]);
  const [selectedSupportInventory, setSelectedSupportInventory] = useState([]);
  const [supportTowers, setSupportTowers] = useState([]);
  const [selectedSupportTowers, setSelectedSupportTowers] = useState([]);

  // 다중 경로 시스템
  const [pathData, setPathData] = useState(() => generateMultiplePaths(Date.now(), 1));
  const currentPath = pathData.paths[0]?.tiles || [];

  // 경로 꺾임 지점에 방향 화살표 사전 계산
  const pathArrows = useMemo(() => {
    const arrows = {};
    for (const path of pathData.paths) {
      const tiles = path.tiles;
      for (let i = 1; i < tiles.length - 1; i++) {
        const prev = tiles[i - 1];
        const curr = tiles[i];
        const next = tiles[i + 1];
        // 이전 방향과 다음 방향이 다르면 꺾임 지점
        const prevDx = curr.x - prev.x;
        const prevDy = curr.y - prev.y;
        const nextDx = next.x - curr.x;
        const nextDy = next.y - curr.y;
        if (prevDx === nextDx && prevDy === nextDy) continue; // 직선 구간 스킵
        // 꺾인 후 진행 방향 화살표 표시
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
  }, [pathData]);

  const [showStageTransition, setShowStageTransition] = useState(false);
  const [draggingNeon, setDraggingNeon] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropPreview, setDropPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // 모바일 배치 시스템 상태
  const [placementMode, setPlacementMode] = useState(null);

  // 도움말 모달 상태
  const [showHelp, setShowHelp] = useState(false);

  // 게임 속도 (1x, 2x, 3x)
  const [gameSpeed, setGameSpeed] = useState(1);
  const gameSpeedRef = useRef(1);
  useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);

  // 사운드 상태
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const toggleBgm = () => setBgmEnabled(soundManager.toggleBGM());
  const toggleSfx = () => setSfxEnabled(soundManager.toggleSFX());

  // Refs
  const dragStartPos = useRef({ x: 0, y: 0 });
  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const mapRef = useRef(null);
  const enemiesRef = useRef([]);
  const towersRef = useRef([]);
  const projectilesRef = useRef([]);
  const pathDataRef = useRef(pathData);

  const supportTowersRef = useRef([]);

  useEffect(() => { pathDataRef.current = pathData; }, [pathData]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { towersRef.current = towers; }, [towers]);
  useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
  useEffect(() => { supportTowersRef.current = supportTowers; }, [supportTowers]);

  // ===== 인벤토리 헬퍼 =====
  const getInventoryByElement = useCallback((element) => {
    const byTier = {};
    inventory.forEach(n => {
      if (n.element !== element) return;
      if (!byTier[n.tier]) byTier[n.tier] = [];
      byTier[n.tier].push(n);
    });
    return byTier;
  }, [inventory]);

  const getAvailableElements = useCallback(() => {
    const available = {};
    for (let i = 0; i < 6; i++) {
      available[i] = inventory.some(n => n.element === i);
    }
    return available;
  }, [inventory]);

  // ===== 모바일 배치 핸들러 =====
  const handleTileClick = useCallback((gridX, gridY) => {
    const isPath = pathData.paths.some(p => p.tiles.some(t => t.x === gridX && t.y === gridY));
    const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
    const hasSupportTower = supportTowers.some(t => t.gridX === gridX && t.gridY === gridY);
    if (isPath || hasTower || hasSupportTower) { setPlacementMode(null); return; }
    setPlacementMode({ gridX, gridY, step: 'element', element: null });
    setSelectedInventory([]);
    setSelectedTowers([]);
    setSelectedSupportInventory([]);
    setSelectedSupportTowers([]);
  }, [pathData, towers, supportTowers]);

  const handleElementSelect = useCallback((element) => {
    if (!placementMode) return;
    const byTier = getInventoryByElement(element);
    if (Object.keys(byTier).length === 0) return;
    setPlacementMode(prev => ({ ...prev, step: 'tier', element }));
  }, [placementMode, getInventoryByElement]);

  const handleTierSelect = useCallback((tier) => {
    if (!placementMode || placementMode.step !== 'tier') return;
    const towersOfTier = inventory.filter(n => n.element === placementMode.element && n.tier === tier);
    if (towersOfTier.length === 0) return;
    const neonToPlace = towersOfTier[0];
    const newTower = TowerSystem.placeOnGrid(neonToPlace, placementMode.gridX, placementMode.gridY);
    setTowers(prev => [...prev, newTower]);
    setInventory(prev => prev.filter(n => n.id !== neonToPlace.id));
    setPlacementMode(null);
  }, [placementMode, inventory]);

  // ===== 공용 선택 토글 (DRY: 인벤토리/타워 공용 패턴) =====
  const toggleSelect = useCallback((item, setSelected, setOther, maxCount = 3) => {
    setOther([]);
    setSelected(prev => {
      const isSelected = prev.some(n => n.id === item.id);
      if (isSelected) return prev.filter(n => n.id !== item.id);
      if (prev.length >= maxCount) return prev;
      if (prev.length > 0 && (prev[0].tier !== item.tier || prev[0].colorIndex !== item.colorIndex)) return prev;
      return [...prev, item];
    });
  }, []);

  const toggleInventorySelect = useCallback((neon) => {
    setSelectedSupportInventory([]);
    setSelectedSupportTowers([]);
    toggleSelect(neon, setSelectedInventory, setSelectedTowers);
  }, [toggleSelect]);

  const toggleTowerSelect = useCallback((tower) => {
    setSelectedSupportInventory([]);
    setSelectedSupportTowers([]);
    toggleSelect(tower, setSelectedTowers, setSelectedInventory);
  }, [toggleSelect]);

  // 서포트 타워 선택 토글
  const toggleSupportInventorySelect = useCallback((support) => {
    setSelectedInventory([]);
    setSelectedTowers([]);
    setSelectedSupportTowers([]);
    setSelectedSupportInventory(prev => {
      const isSelected = prev.some(s => s.id === support.id);
      if (isSelected) return prev.filter(s => s.id !== support.id);
      if (prev.length >= 3) return prev;
      if (prev.length > 0 && (prev[0].tier !== support.tier || prev[0].supportType !== support.supportType)) return prev;
      return [...prev, support];
    });
  }, []);

  const toggleSupportTowerSelect = useCallback((support) => {
    setSelectedInventory([]);
    setSelectedTowers([]);
    setSelectedSupportInventory([]);
    setSelectedSupportTowers(prev => {
      const isSelected = prev.some(s => s.id === support.id);
      if (isSelected) return prev.filter(s => s.id !== support.id);
      if (prev.length >= 3) return prev;
      if (prev.length > 0 && (prev[0].tier !== support.tier || prev[0].supportType !== support.supportType)) return prev;
      return [...prev, support];
    });
  }, []);

  // ===== 뽑기 (TowerSystem.create 사용) =====
  const isInventoryFull = inventory.length >= ECONOMY.maxInventory;
  const isSupportInventoryFull = supportInventory.length >= ECONOMY.maxSupportInventory;

  const drawRandomNeon = useCallback(() => {
    if (gold < ECONOMY.drawCost || inventory.length >= ECONOMY.maxInventory) return;
    const colorIndex = Math.floor(Math.random() * 6);
    const newNeon = TowerSystem.create(1, colorIndex);
    setInventory(prev => [...prev, newNeon]);
    setGold(prev => prev - ECONOMY.drawCost);
    soundManager.playDraw();
  }, [gold, inventory.length]);

  // 서포트 타워 뽑기
  const drawRandomSupport = useCallback(() => {
    if (gold < ECONOMY.supportDrawCost || supportInventory.length >= ECONOMY.maxSupportInventory) return;
    const supportType = Math.floor(Math.random() * 4);
    const newSupport = TowerSystem.createSupport(1, supportType);
    setSupportInventory(prev => [...prev, newSupport]);
    setGold(prev => prev - ECONOMY.supportDrawCost);
    soundManager.playDraw();
  }, [gold, supportInventory.length]);

  // ===== 조합 (TowerSystem 위임) =====
  const combineNeons = useCallback(() => {
    if (selectedInventory.length !== 3) return;
    const result = TowerSystem.combine(selectedInventory);
    if (!result) return;
    const idsToRemove = selectedInventory.map(n => n.id);
    setInventory(prev => [...prev.filter(n => !idsToRemove.includes(n.id)), result]);
    setSelectedInventory([]);
    soundManager.playCombine();
  }, [selectedInventory]);

  const combineAllNeons = useCallback(() => {
    setInventory(prev => TowerSystem.combineAll(prev));
    setSelectedInventory([]);
    soundManager.playCombine();
  }, []);

  const combineTowers = useCallback(() => {
    if (selectedTowers.length !== 3) return;
    const result = TowerSystem.combine(selectedTowers);
    if (!result) return;
    const firstTower = selectedTowers[0];
    const placedTower = TowerSystem.placeOnGrid(result, firstTower.gridX, firstTower.gridY);
    const idsToRemove = selectedTowers.map(t => t.id);
    setTowers(prev => [...prev.filter(t => !idsToRemove.includes(t.id)), placedTower]);
    setSelectedTowers([]);
    setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: result.color }]);
    soundManager.playCombine();
  }, [selectedTowers]);

  const sellSelectedTowers = useCallback(() => {
    if (selectedTowers.length === 0) return;
    const totalRefund = selectedTowers.reduce((sum, t) => sum + getTowerSellPrice(t.tier), 0);
    const idsToRemove = selectedTowers.map(t => t.id);
    setTowers(prev => prev.filter(t => !idsToRemove.includes(t.id)));
    setGold(prev => prev + totalRefund);
    setSelectedTowers([]);
  }, [selectedTowers]);

  const totalSellPrice = selectedTowers.reduce((sum, t) => sum + getTowerSellPrice(t.tier), 0);
  const canCombineTowers = selectedTowers.length === 3 && selectedTowers[0]?.tier < 4;

  // ===== 서포트 타워 조합/판매 =====
  const combineSupports = useCallback(() => {
    if (selectedSupportInventory.length !== 3) return;
    const result = TowerSystem.combineSupport(selectedSupportInventory);
    if (!result) return;
    const idsToRemove = selectedSupportInventory.map(s => s.id);
    setSupportInventory(prev => [...prev.filter(s => !idsToRemove.includes(s.id)), result]);
    setSelectedSupportInventory([]);
    soundManager.playCombine();
  }, [selectedSupportInventory]);

  const combineAllSupports = useCallback(() => {
    setSupportInventory(prev => TowerSystem.combineAllSupport(prev));
    setSelectedSupportInventory([]);
    soundManager.playCombine();
  }, []);

  const combineSupportTowers = useCallback(() => {
    if (selectedSupportTowers.length !== 3) return;
    const result = TowerSystem.combineSupport(selectedSupportTowers);
    if (!result) return;
    const firstTower = selectedSupportTowers[0];
    const placedTower = TowerSystem.placeSupportOnGrid(result, firstTower.gridX, firstTower.gridY);
    const idsToRemove = selectedSupportTowers.map(t => t.id);
    setSupportTowers(prev => [...prev.filter(t => !idsToRemove.includes(t.id)), placedTower]);
    setSelectedSupportTowers([]);
    setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: result.color }]);
    soundManager.playCombine();
  }, [selectedSupportTowers]);

  const sellSelectedSupportTowers = useCallback(() => {
    if (selectedSupportTowers.length === 0) return;
    const totalRefund = selectedSupportTowers.reduce((sum, t) => sum + TowerSystem.getSupportSellPrice(t.tier), 0);
    const idsToRemove = selectedSupportTowers.map(t => t.id);
    setSupportTowers(prev => prev.filter(t => !idsToRemove.includes(t.id)));
    setGold(prev => prev + totalRefund);
    setSelectedSupportTowers([]);
  }, [selectedSupportTowers]);

  const totalSupportSellPrice = selectedSupportTowers.reduce((sum, t) => sum + TowerSystem.getSupportSellPrice(t.tier), 0);
  const canCombineSupportTowers = selectedSupportTowers.length === 3 && selectedSupportTowers[0]?.tier < 3;

  // ===== 드래그 앤 드롭 =====
  const handleDragStart = (e, neon) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartPos.current = { x: clientX, y: clientY };
    setDraggingNeon(neon);
    setDragPosition({ x: clientX, y: clientY });
    setIsDragging(false);
  };

  const handleDragMove = useCallback((e) => {
    if (!draggingNeon) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const distance = calcDistance(clientX, clientY, dragStartPos.current.x, dragStartPos.current.y);
    if (distance > 10) { setIsDragging(true); setSelectedInventory([]); setSelectedTowers([]); setSelectedSupportInventory([]); setSelectedSupportTowers([]); }
    setDragPosition({ x: clientX, y: clientY });
    if (mapRef.current && isDragging) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = clientX - rect.left, y = clientY - rect.top;
      const gridX = Math.floor(x / TILE_SIZE), gridY = Math.floor(y / TILE_SIZE);
      if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
        const isPath = pathData.paths.some(p => p.tiles.some(t => t.x === gridX && t.y === gridY));
        const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
        const hasSupportTower = supportTowers.some(t => t.gridX === gridX && t.gridY === gridY);
        setDropPreview({ gridX, gridY, valid: !isPath && !hasTower && !hasSupportTower });
      } else { setDropPreview(null); }
    }
  }, [draggingNeon, towers, supportTowers, pathData, isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!draggingNeon) return;
    if (!isDragging) {
      const neon = draggingNeon;
      setDraggingNeon(null); setDropPreview(null);
      // 서포트 타워인지 일반 타워인지 구분
      if (neon.isSupport) {
        toggleSupportInventorySelect(neon);
      } else {
        toggleInventorySelect(neon);
      }
      return;
    }
    if (dropPreview && dropPreview.valid) {
      // 서포트 타워인지 일반 타워인지 구분
      if (draggingNeon.isSupport) {
        const newTower = TowerSystem.placeSupportOnGrid(draggingNeon, dropPreview.gridX, dropPreview.gridY);
        setSupportTowers(prev => [...prev, newTower]);
        setSupportInventory(prev => prev.filter(n => n.id !== draggingNeon.id));
      } else {
        const newTower = TowerSystem.placeOnGrid(draggingNeon, dropPreview.gridX, dropPreview.gridY);
        setTowers(prev => [...prev, newTower]);
        setInventory(prev => prev.filter(n => n.id !== draggingNeon.id));
      }
    }
    setDraggingNeon(null); setDropPreview(null); setIsDragging(false);
  }, [draggingNeon, dropPreview, isDragging, toggleInventorySelect, toggleSupportInventorySelect]);

  useEffect(() => {
    if (!draggingNeon) return;
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove);
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [draggingNeon, handleDragMove, handleDragEnd]);

  // ===== 웨이브 시작 =====
  const startWave = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true); setSpawnedCount(0); setKilledCount(0);
    soundManager.playWaveStart();
    soundManager.playBGM();
  }, [isPlaying]);

  // ===== 메인 게임 루프 (GameEngine.gameTick 위임) =====
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    let localSpawnedCount = 0;
    const totalEnemies = SPAWN.enemiesPerWave(stage, wave);
    const baseSpawnDelay = SPAWN.spawnDelay(stage, wave);

    // 적 스폰 인터벌
    spawnIntervalRef.current = setInterval(() => {
      if (localSpawnedCount >= totalEnemies) return;
      const paths = pathDataRef.current.paths;
      const selectedPath = paths[Math.floor(Math.random() * paths.length)];
      const newEnemy = EnemySystem.create(stage, wave, localSpawnedCount, totalEnemies, selectedPath.tiles, selectedPath.id);
      setEnemies(prev => [...prev, newEnemy]);
      localSpawnedCount++;
      setSpawnedCount(localSpawnedCount);
    }, baseSpawnDelay);

    // 게임 틱 루프
    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const speed = gameSpeedRef.current;

      const result = GameEngine.gameTick({
        enemies: enemiesRef.current,
        towers: towersRef.current,
        supportTowers: supportTowersRef.current,
        projectiles: projectilesRef.current,
        gameSpeed: speed,
      }, now);

      // 상태 업데이트
      setEnemies(result.enemies);
      setTowers(result.towers);
      setProjectiles(result.projectiles);

      if (result.killedCount > 0) setKilledCount(prev => prev + result.killedCount);
      if (result.goldEarned > 0) setGold(prev => prev + result.goldEarned);
      if (result.newEffects.length > 0) setEffects(prev => [...prev, ...result.newEffects]);

      // 체인 라이트닝 표시 후 자동 제거
      if (result.newChainLightnings.length > 0) {
        setChainLightnings(prev => [...prev, ...result.newChainLightnings]);
        const chainIds = result.newChainLightnings.map(c => c.id);
        setTimeout(() => {
          setChainLightnings(prev => prev.filter(c => !chainIds.includes(c.id)));
        }, COMBAT.chainLightningDisplayTime);
      }

      // 사운드 이벤트 실행
      result.soundEvents.forEach(evt => {
        if (soundManager[evt.method]) soundManager[evt.method](...evt.args);
      });

      // 목숨 손실 처리
      if (result.livesLost > 0) {
        setLives(l => {
          const newLives = l - result.livesLost;
          if (newLives <= 0) { setGameOver(true); soundManager.playGameOver(); soundManager.stopBGM(); }
          return Math.max(0, newLives);
        });
      }

      // 이펙트 클린업
      setEffects(prev => GameEngine.cleanExpiredEffects(prev, now));
    }, COMBAT.gameLoopInterval);

    return () => { clearInterval(gameLoopRef.current); clearInterval(spawnIntervalRef.current); };
  }, [isPlaying, gameOver, wave, stage]);

  // ===== 웨이브 클리어 판정 =====
  useEffect(() => {
    const totalEnemies = SPAWN.enemiesPerWave(stage, wave);
    if (spawnedCount < totalEnemies || enemies.length > 0 || !isPlaying || gameOver) return;

    setIsPlaying(false);
    setGold(prev => prev + ECONOMY.waveReward(wave));

    if (wave >= SPAWN.wavesPerStage) {
      setShowStageTransition(true);
      const nextStage = stage + 1;
      setTimeout(() => {
        setStage(nextStage); setWave(1);
        setPathData(generateMultiplePaths(Date.now(), nextStage));
        setTowers([]); setSupportTowers([]);
        setGold(prev => prev + ECONOMY.stageClearBonus(stage));
        setShowStageTransition(false);
      }, 2000);
    } else {
      setWave(prev => prev + 1);
    }
  }, [spawnedCount, enemies.length, isPlaying, gameOver, wave, stage]);

  // ===== 리셋 =====
  const resetGame = () => {
    setGold(ECONOMY.startGold); setLives(ECONOMY.startLives); setStage(1); setWave(1);
    setIsPlaying(false); setGameOver(false);
    setTowers([]); setEnemies([]); setProjectiles([]);
    setInventory([]); setSelectedInventory([]); setSelectedTowers([]);
    setSupportTowers([]); setSupportInventory([]); setSelectedSupportInventory([]); setSelectedSupportTowers([]);
    setSpawnedCount(0); setKilledCount(0);
    setDraggingNeon(null); setDropPreview(null);
    setPathData(generateMultiplePaths(Date.now(), 1)); setShowStageTransition(false);
    setChainLightnings([]); setPlacementMode(null);
    setGameSpeed(1);
    soundManager.stopBGM();
  };

  const getElementInfo = (element) => ELEMENT_EFFECTS[element] || ELEMENT_EFFECTS[ELEMENT_TYPES.VOID];

  // ===== 치트 콘솔 (테스트용) =====
  const [cheatOpen, setCheatOpen] = useState(false);
  const [cheatInput, setCheatInput] = useState('');
  const [cheatLog, setCheatLog] = useState([]);
  const cheatInputRef = useRef(null);

  const executeCheat = useCallback((cmd) => {
    const parts = cmd.trim().toLowerCase().split(/\s+/);
    const command = parts[0];
    const arg = parts[1] ? parseInt(parts[1]) : null;

    switch (command) {
      case 'nextstage':
      case 'ns':
        setIsPlaying(false); setEnemies([]); setProjectiles([]);
        setSpawnedCount(0); setKilledCount(0);
        clearInterval(gameLoopRef.current);
        clearInterval(spawnIntervalRef.current);
        const ns = stage + 1;
        setStage(ns); setWave(1);
        setPathData(generateMultiplePaths(Date.now(), ns));
        setTowers([]);
        setGold(prev => prev + ECONOMY.stageClearBonus(stage));
        return '▶ Stage ' + ns + '로 이동';
      case 'stage':
        if (!arg || arg < 1) return '❌ 사용법: stage [번호]';
        setIsPlaying(false); setEnemies([]); setProjectiles([]);
        setSpawnedCount(0); setKilledCount(0);
        clearInterval(gameLoopRef.current);
        clearInterval(spawnIntervalRef.current);
        setStage(arg); setWave(1);
        setPathData(generateMultiplePaths(Date.now(), arg));
        setTowers([]);
        return '▶ Stage ' + arg + '로 이동';
      case 'clearwave':
      case 'cw':
        setEnemies([]);
        return '▶ 웨이브 클리어';
      case 'gold':
        const goldAmt = arg || 500;
        setGold(prev => prev + goldAmt);
        return '▶ 골드 +' + goldAmt;
      case 'lives':
        const livesAmt = arg || 10;
        setLives(prev => prev + livesAmt);
        return '▶ 목숨 +' + livesAmt;
      case 'tower':
        const tier = Math.min(4, Math.max(1, arg || 4));
        const elem = Math.floor(Math.random() * 6);
        setInventory(prev => [...prev, TowerSystem.create(tier, elem)]);
        return '▶ T' + tier + ' 타워 획득';
      case 'support':
        const sTier = Math.min(3, Math.max(1, arg || 3));
        const sType = Math.floor(Math.random() * 4);
        setSupportInventory(prev => [...prev, TowerSystem.createSupport(sTier, sType)]);
        return '▶ S' + sTier + ' ' + SUPPORT_UI[sType].name + ' 서포트 획득';
      case 'help':
        return [
          '── 명령어 목록 ──',
          'nextstage (ns)  다음 스테이지',
          'stage [n]       n 스테이지로 이동',
          'clearwave (cw)  웨이브 즉시 클리어',
          'gold [n]        골드 추가 (기본 500)',
          'lives [n]       목숨 추가 (기본 10)',
          'tower [tier]    타워 획득 (기본 T4)',
          'support [tier]  서포트 획득 (기본 S3)',
          'help            명령어 목록',
        ].join('\n');
      default:
        return '❌ 알 수 없는 명령어. help 입력';
    }
  }, [stage]);

  const handleCheatSubmit = useCallback((e) => {
    e.preventDefault();
    if (!cheatInput.trim()) return;
    const result = executeCheat(cheatInput);
    setCheatLog(prev => [...prev.slice(-20), '> ' + cheatInput, result]);
    setCheatInput('');
  }, [cheatInput, executeCheat]);

  // 백틱(`)으로 콘솔 토글
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '`') {
        e.preventDefault();
        setCheatOpen(prev => {
          if (!prev) setTimeout(() => cheatInputRef.current?.focus(), 50);
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ===== 렌더링 =====
  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4 overflow-x-hidden select-none" style={{fontFamily: "'Orbitron', sans-serif"}}>
      {/* 상단 정보 바 */}
      <div className="max-w-4xl mx-auto mb-4">
        <h1 className="text-2xl sm:text-4xl font-black text-center mb-4 tracking-wider" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1, #dda0dd, #ffd93d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 30px rgba(78, 205, 196, 0.5)' }}>
          ⚡ NEON DEFENSE ⚡
        </h1>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 text-sm sm:text-base">
          <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-emerald-500/50 flex items-center gap-2"><span className="text-emerald-400">🏰</span><span className="font-bold text-emerald-300">Stage {stage}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-cyan-500/50 flex items-center gap-2"><span className="text-cyan-400">🌊</span><span className="font-bold text-cyan-300">Wave {wave}/{SPAWN.wavesPerStage}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center gap-2"><span className="text-yellow-400">💰</span><span className="font-bold text-yellow-300">{gold}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-red-500/50 flex items-center gap-2"><span className="text-red-400">❤️</span><span className="font-bold text-red-300">{lives}</span></div>
          <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-2"><span className="text-orange-400">🛤️</span><span className="font-bold text-orange-300">{pathData.paths.length}경로</span></div>
          {isPlaying && <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-purple-500/50 flex items-center gap-2"><span className="text-purple-400">👾</span><span className="font-bold text-purple-300">{killedCount}/{SPAWN.enemiesPerWave(stage, wave)}</span></div>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4">
        {/* 게임 맵 */}
        <div className="relative">
          <div className="flex justify-between items-center mb-2 px-1">
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => setGameSpeed(s)} className={'px-3 py-1 rounded text-sm font-bold transition-all ' + (gameSpeed === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')} style={gameSpeed === s ? {boxShadow: '0 0 10px rgba(0,255,255,0.5)'} : {}}>{s}x</button>
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={toggleBgm} className={'px-2 py-1 rounded text-sm transition-all ' + (bgmEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="BGM 토글">🎵</button>
              <button onClick={toggleSfx} className={'px-2 py-1 rounded text-sm transition-all ' + (sfxEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="효과음 토글">🔊</button>
            </div>
            <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-gray-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-gray-700 hover:border-cyan-400 transition-all" style={{boxShadow: '0 0 10px rgba(0,255,255,0.3)'}}><span className="text-sm font-bold">?</span></button>
          </div>

          <div ref={mapRef} className="relative mx-auto" style={{width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE}}>
            <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-cyan-500/30" style={{boxShadow: '0 0 30px rgba(78, 205, 196, 0.2), inset 0 0 30px rgba(0,0,0,0.5)'}}>
            {Array.from({length: GRID_HEIGHT}, (_, y) => (
              Array.from({length: GRID_WIDTH}, (_, x) => {
                let pathInfo = null;
                for (const path of pathData.paths) {
                  if (path.tiles.some(p => p.x === x && p.y === y)) { pathInfo = path; break; }
                }
                const isPath = pathInfo !== null;
                const hasTower = towers.some(t => t.gridX === x && t.gridY === y);
                const startPoint = pathData.startPoints.find(sp => sp.x === x && sp.y === y);
                const endPoint = pathData.endPoints.find(ep => ep.x === x && ep.y === y);
                const isDropPreview = dropPreview && dropPreview.gridX === x && dropPreview.gridY === y;
                const isSelectedTile = placementMode && placementMode.gridX === x && placementMode.gridY === y;
                const canPlace = !isPath && !hasTower;
                let extraClass = '';
                if (isDropPreview) extraClass = dropPreview.valid ? 'drop-preview-valid' : 'drop-preview-invalid';
                if (isSelectedTile) extraClass = 'ring-2 ring-white ring-opacity-80';
                const pathStyle = isPath && pathInfo ? { backgroundColor: pathInfo.color + '40', borderColor: pathInfo.color + '60' } : {};

                // 출발점/도착점의 경로 색상 찾기
                const startPath = startPoint && pathData.paths.find(p => p.startPoint.id === startPoint.id);
                const endPaths = endPoint && pathData.paths.filter(p => p.endPoint.id === endPoint.id);

                return (
                  <div key={x + '-' + y} className={'absolute ' + (isPath ? 'path-tile' : 'grass-tile') + ' ' + extraClass + (canPlace && !isSelectedTile ? ' cursor-pointer hover:brightness-125' : '')} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, ...pathStyle }} onClick={() => canPlace && handleTileClick(x, y)}>
                    {startPoint && startPath && (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, ' + startPath.color + '60 0%, transparent 70%)' }}>
                        <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px ' + startPath.color + ')' }}>▶</span>
                      </div>
                    )}
                    {endPoint && endPaths && endPaths.length > 0 && (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, ' + endPaths[0].color + '60 0%, transparent 70%)' }}>
                        <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px ' + endPaths[0].color + ')' }}>🏠</span>
                      </div>
                    )}
                    {!startPoint && !endPoint && pathArrows[`${x},${y}`] && (
                      <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ opacity: 0.8 }}>
                        <span style={{ color: pathArrows[`${x},${y}`].color, fontSize: '16px', lineHeight: 1, filter: 'drop-shadow(0 0 4px ' + pathArrows[`${x},${y}`].color + ')' }}>
                          {pathArrows[`${x},${y}`].arrow}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ))}

            {/* 체인 라이트닝 SVG */}
            <svg className="absolute inset-0 pointer-events-none" style={{width: '100%', height: '100%'}}>
              {chainLightnings.map(chain => (<line key={chain.id} x1={chain.x1} y1={chain.y1} x2={chain.x2} y2={chain.y2} stroke="#FFD93D" strokeWidth="3" className="chain-lightning" style={{filter: 'drop-shadow(0 0 5px #FFD93D)'}} />))}
            </svg>

            {/* 타워 렌더링 */}
            {towers.map(tower => {
              const isSelected = selectedTowers.some(t => t.id === tower.id);
              const elementInfo = getElementInfo(tower.element);
              const displayRange = tower.effectiveRange || tower.range;
              return (
                <div key={tower.id} onClick={() => toggleTowerSelect(tower)} style={{cursor: 'pointer'}}>
                  <div className="absolute rounded-full tower-range pointer-events-none" style={{ left: tower.x - displayRange, top: tower.y - displayRange, width: displayRange * 2, height: displayRange * 2, border: '2px solid ' + (isSelected ? '#ffffff' : tower.color) + '40', background: 'radial-gradient(circle, ' + tower.color + '10 0%, transparent 70%)' }} />
                  <div className={'absolute neon-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: tower.x - 15, top: tower.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + tower.color + ' 0%, ' + tower.color + '80 50%, transparent 70%)', borderRadius: '50%', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + tower.color : undefined, color: tower.color, opacity: tower.isDebuffed ? 0.6 : 1 }}>
                    <span className="text-xs font-black text-white drop-shadow-lg">{elementInfo.icon}</span>
                  </div>
                  <div className="absolute text-xs font-bold text-white" style={{ left: tower.x - 8, top: tower.y + 12, textShadow: '0 0 3px black' }}>T{tower.tier}</div>
                  {tower.isDebuffed && <div className="absolute text-xs" style={{ left: tower.x + 8, top: tower.y - 15 }}>⬇️</div>}
                  {tower.isBuffed && <div className="absolute text-xs" style={{ left: tower.x + 8, top: tower.y - 15 }}>⬆️</div>}
                </div>
              );
            })}

            {/* 서포트 타워 렌더링 (육각형) */}
            {supportTowers.map(support => {
              const isSelected = selectedSupportTowers.some(t => t.id === support.id);
              const supportInfo = SUPPORT_UI[support.supportType];
              return (
                <div key={support.id} onClick={() => toggleSupportTowerSelect(support)} style={{cursor: 'pointer'}}>
                  {/* 버프 범위 (점선 원) */}
                  <div className="absolute rounded-full support-range pointer-events-none" style={{ left: support.x - support.range, top: support.y - support.range, width: support.range * 2, height: support.range * 2, border: '2px dashed ' + (isSelected ? '#ffffff' : support.color) + '60', background: 'radial-gradient(circle, ' + support.color + '15 0%, transparent 70%)' }} />
                  {/* 육각형 서포트 타워 */}
                  <div className={'absolute support-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: support.x - 15, top: support.y - 15, width: 30, height: 30, background: 'linear-gradient(135deg, ' + support.color + ' 0%, ' + support.color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + support.color : '0 0 10px ' + support.color }}>
                    <span className="text-sm">{supportInfo.icon}</span>
                  </div>
                  <div className="absolute text-xs font-bold text-white" style={{ left: support.x - 6, top: support.y + 12, textShadow: '0 0 3px black' }}>S{support.tier}</div>
                </div>
              );
            })}

            {/* 적 렌더링 (ENEMY_CONFIG 데이터 주도) */}
            {enemies.map(enemy => {
              const config = ENEMY_CONFIG[enemy.type];
              const isBurning = enemy.burnEndTime > Date.now();
              const isSlowed = enemy.slowEndTime > Date.now();

              return (
                <div key={enemy.id} className="absolute" style={{left: enemy.x - 12, top: enemy.y - 12}}>
                  {EnemySystem.isDebuffer(enemy) && (<div className="absolute rounded-full opacity-20 pointer-events-none" style={{ left: 12 - (enemy.debuffRange || 80), top: 12 - (enemy.debuffRange || 80), width: (enemy.debuffRange || 80) * 2, height: (enemy.debuffRange || 80) * 2, background: enemy.type === 'jammer' ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' : 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />)}
                  <div className={config.size + ' ' + config.color + ' rounded-sm transform rotate-45'} style={{ boxShadow: config.shadow }} />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded"><div className="h-full bg-green-500 rounded enemy-health-bar" style={{width: (enemy.health / enemy.maxHealth * 100) + '%'}} /></div>
                  {isBurning && <div className="absolute -top-4 left-0 text-xs burning-effect">🔥</div>}
                  {isSlowed && <div className="absolute -top-4 right-0 text-xs slowed-effect">❄️</div>}
                  {config.icon && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">{config.icon}</div>}
                </div>
              );
            })}

            {/* 투사체 */}
            {projectiles.map(proj => <div key={proj.id} className="absolute w-3 h-3 rounded-full" style={{ left: proj.x - 6, top: proj.y - 6, background: proj.color, boxShadow: '0 0 10px ' + proj.color + ', 0 0 20px ' + proj.color }} />)}

            {/* 이펙트 */}
            {effects.map(effect => {
              let effectClass = effect.type === 'explosion' ? 'explosion' : 'hit';
              if (effect.type === 'burn') effectClass = 'burning-effect';
              if (effect.type === 'slow') effectClass = 'slowed-effect';
              if (effect.type === 'knockback') effectClass = 'knockback-effect';
              return <div key={effect.id} className={'absolute rounded-full ' + effectClass} style={{ left: effect.x - 15, top: effect.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + effect.color + ' 0%, transparent 70%)' }} />;
            })}
          </div>
          </div>
        </div>

        {/* 사이드 패널 */}
        <div className="flex-1 min-w-[280px] space-y-3">
          {/* 뽑기 버튼들 */}
          <div className="flex gap-2">
            <button type="button" onClick={drawRandomNeon} disabled={gold < ECONOMY.drawCost || isInventoryFull} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-pink-400/30 text-sm">{isInventoryFull ? '📦 가득 참' : '🎲 뽑기 (' + ECONOMY.drawCost + 'G)'}</button>
            <button type="button" onClick={drawRandomSupport} disabled={gold < ECONOMY.supportDrawCost || isSupportInventoryFull} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-orange-400/30 text-sm">{isSupportInventoryFull ? '📦 가득 참' : '🛡️ 서포트 (' + ECONOMY.supportDrawCost + 'G)'}</button>
            <button type="button" onClick={startWave} disabled={isPlaying} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30 text-sm">{isPlaying ? '전투 중...' : '▶ 시작'}</button>
          </div>
          {/* 일반 타워 조합 */}
          <div className="flex gap-2">
            <button type="button" onClick={combineNeons} disabled={selectedInventory.length !== 3 || selectedInventory[0]?.tier >= 4} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm">⚡ 선택 조합</button>
            <button type="button" onClick={combineAllNeons} disabled={TowerSystem.getCombinableCount(inventory) === 0} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30 text-sm">🔄 전체 조합 ({TowerSystem.getCombinableCount(inventory)})</button>
          </div>
          {/* 맵 타워 조합/판매 */}
          <div className="flex gap-2">
            <button type="button" onClick={combineTowers} disabled={!canCombineTowers} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30 text-sm">🔮 타워 조합 ({selectedTowers.length}/3)</button>
            <button type="button" onClick={sellSelectedTowers} disabled={selectedTowers.length === 0} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30 text-sm">💰 판매 (+{totalSellPrice}G)</button>
          </div>

          {/* 인벤토리 (5열 x 6행 고정) */}
          <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
            <h3 className="text-sm font-bold mb-2 text-gray-400">📦 인벤토리 ({inventory.length}/{ECONOMY.maxInventory}) - 클릭: 선택 / 드래그: 배치</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({length: ECONOMY.maxInventory}, (_, i) => {
                const neon = inventory[i];
                if (neon) {
                  const isSelected = selectedInventory.some(n => n.id === neon.id);
                  const elementInfo = getElementInfo(neon.element);
                  return (
                    <div key={neon.id} onMouseDown={(e) => handleDragStart(e, neon)} onTouchStart={(e) => handleDragStart(e, neon)} className={'inventory-item w-10 h-10 rounded-lg flex flex-col items-center justify-center border-2 cursor-pointer ' + (isSelected ? 'border-white selected' : 'border-transparent hover:border-gray-500')} style={{ background: 'radial-gradient(circle, ' + neon.color + '80 0%, ' + neon.color + '40 70%)', color: neon.color, boxShadow: isSelected ? '0 0 15px ' + neon.color : 'none' }} title={neon.name + '\nTier ' + neon.tier + '\n' + elementInfo.icon + ' ' + elementInfo.name + ': ' + elementInfo.desc}>
                      <span className="text-sm">{elementInfo.icon}</span>
                      <span className="text-xs font-black text-white drop-shadow">T{neon.tier}</span>
                    </div>
                  );
                }
                return <div key={'empty-' + i} className="w-10 h-10 rounded-lg border border-gray-700/50 bg-gray-800/30" />;
              })}
            </div>
          </div>

          {/* 서포트 인벤토리 (3열 x 5행 = 15칸) */}
          <div className="bg-gray-900/80 rounded-lg p-3 border border-orange-500/30">
            <h3 className="text-sm font-bold mb-2 text-orange-400">🛡️ 서포트 ({supportInventory.length}/{ECONOMY.maxSupportInventory})</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({length: ECONOMY.maxSupportInventory}, (_, i) => {
                const support = supportInventory[i];
                if (support) {
                  const isSelected = selectedSupportInventory.some(s => s.id === support.id);
                  const supportInfo = SUPPORT_UI[support.supportType];
                  return (
                    <div key={support.id} onMouseDown={(e) => handleDragStart(e, support)} onTouchStart={(e) => handleDragStart(e, support)} className={'inventory-item w-10 h-10 flex flex-col items-center justify-center border-2 cursor-pointer ' + (isSelected ? 'border-white selected' : 'border-transparent hover:border-gray-500')} style={{ background: 'linear-gradient(135deg, ' + support.color + '80 0%, ' + support.color + '40 100%)', color: support.color, boxShadow: isSelected ? '0 0 15px ' + support.color : 'none', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} title={support.name + '\nS' + support.tier + '\n' + supportInfo.icon + ' ' + supportInfo.name}>
                      <span className="text-sm">{supportInfo.icon}</span>
                      <span className="text-xs font-black text-white drop-shadow">S{support.tier}</span>
                    </div>
                  );
                }
                return <div key={'support-empty-' + i} className="w-10 h-10 border border-gray-700/50 bg-gray-800/30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />;
              })}
            </div>
            {/* 서포트 조합 버튼 */}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={combineSupports} disabled={selectedSupportInventory.length !== 3 || selectedSupportInventory[0]?.tier >= 3} className="flex-1 btn-neon px-2 py-1 bg-gradient-to-r from-orange-600 to-amber-600 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-orange-400/30 text-xs">⚡ 조합</button>
              <button type="button" onClick={combineAllSupports} disabled={TowerSystem.getSupportCombinableCount(supportInventory) === 0} className="flex-1 btn-neon px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30 text-xs">🔄 전체 ({TowerSystem.getSupportCombinableCount(supportInventory)})</button>
            </div>
          </div>

          {/* 맵 서포트 타워 조합/판매 */}
          {selectedSupportTowers.length > 0 && (
            <div className="flex gap-2">
              <button type="button" onClick={combineSupportTowers} disabled={!canCombineSupportTowers} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-orange-400/30 text-sm">🔮 서포트 조합 ({selectedSupportTowers.length}/3)</button>
              <button type="button" onClick={sellSelectedSupportTowers} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30 text-sm">💰 판매 (+{totalSupportSellPrice}G)</button>
            </div>
          )}

          {/* 선택된 타워 정보 */}
          {selectedTowers.length > 0 && (
            <div className="bg-gray-900/80 rounded-lg p-3 border border-emerald-500/50">
              <h3 className="text-sm font-bold mb-2 text-emerald-400">🏗️ 선택된 타워 ({selectedTowers.length}개)</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, ' + selectedTowers[0].color + ' 0%, ' + selectedTowers[0].color + '80 50%, transparent 70%)' }}>
                  <span className="text-xs">{getElementInfo(selectedTowers[0].element).icon}</span>
                </div>
                <span className="text-gray-300">{selectedTowers[0].name}</span>
                <span className="text-gray-500">T{selectedTowers[0].tier}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{getElementInfo(selectedTowers[0].element).icon} {getElementInfo(selectedTowers[0].element).name}: {getElementInfo(selectedTowers[0].element).desc}</p>
              <p className="text-xs text-gray-500 mt-1">판매 시 {totalSellPrice}G 환급</p>
            </div>
          )}

          {/* 선택된 서포트 타워 정보 */}
          {selectedSupportTowers.length > 0 && (
            <div className="bg-gray-900/80 rounded-lg p-3 border border-orange-500/50">
              <h3 className="text-sm font-bold mb-2 text-orange-400">🛡️ 선택된 서포트 ({selectedSupportTowers.length}개)</h3>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, ' + selectedSupportTowers[0].color + ' 0%, ' + selectedSupportTowers[0].color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  <span className="text-xs">{SUPPORT_UI[selectedSupportTowers[0].supportType].icon}</span>
                </div>
                <span className="text-gray-300">{selectedSupportTowers[0].name}</span>
                <span className="text-gray-500">S{selectedSupportTowers[0].tier}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{SUPPORT_UI[selectedSupportTowers[0].supportType].icon} {SUPPORT_UI[selectedSupportTowers[0].supportType].name} 버프 +{Math.round(selectedSupportTowers[0].buffValue * 100)}%</p>
              <p className="text-xs text-gray-500 mt-1">판매 시 {totalSupportSellPrice}G 환급</p>
            </div>
          )}
        </div>
      </div>

      {/* 드래그 프리뷰 */}
      {draggingNeon && isDragging && (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPosition.x - 20, top: dragPosition.y - 20, width: 40, height: 40 }}>
          {draggingNeon.isSupport ? (
            <div className="w-full h-full flex items-center justify-center support-glow" style={{ background: 'linear-gradient(135deg, ' + draggingNeon.color + ' 0%, ' + draggingNeon.color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <span className="text-sm">{SUPPORT_UI[draggingNeon.supportType].icon}</span>
            </div>
          ) : (
            <div className="w-full h-full rounded-lg flex items-center justify-center neon-glow" style={{ background: 'radial-gradient(circle, ' + draggingNeon.color + ' 0%, ' + draggingNeon.color + '80 50%, transparent 70%)', color: draggingNeon.color }}>
              <span className="text-sm font-black text-white drop-shadow-lg">{getElementInfo(draggingNeon.element).icon}</span>
            </div>
          )}
        </div>
      )}

      {/* 모바일 배치 UI (ELEMENT_UI 데이터 주도) */}
      {placementMode && (
        <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) setPlacementMode(null); }}>
          {(() => {
            const mapRect = mapRef.current?.getBoundingClientRect();
            if (!mapRect) return null;
            const centerX = mapRect.left + placementMode.gridX * TILE_SIZE + TILE_SIZE / 2;
            const centerY = mapRect.top + placementMode.gridY * TILE_SIZE + TILE_SIZE / 2;

            if (placementMode.step === 'element') {
              const availableElements = getAvailableElements();
              return (
                <div className="absolute" style={{ left: centerX, top: centerY }}>
                  <div className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all" style={{ left: -24, top: -24 }} onClick={() => setPlacementMode(null)}><span className="text-xl">✕</span></div>
                  {ELEMENT_UI.map((elem, index) => {
                    const angle = (index * 60 - 90) * (Math.PI / 180);
                    const radius = 65;
                    const x = Math.cos(angle) * radius - 22;
                    const y = Math.sin(angle) * radius - 22;
                    const hasElement = availableElements[elem.id];
                    return (
                      <div key={elem.id} className={'absolute w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all ' + (hasElement ? 'hover:scale-110' : 'opacity-30 cursor-not-allowed')} style={{ left: x, top: y, background: hasElement ? `radial-gradient(circle, ${elem.color} 0%, ${elem.color}80 70%)` : '#333', boxShadow: hasElement ? `0 0 15px ${elem.color}80` : 'none', border: `2px solid ${hasElement ? elem.color : '#555'}` }} onClick={() => hasElement && handleElementSelect(elem.id)}>
                        <span className="text-lg">{elem.icon}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }

            if (placementMode.step === 'tier') {
              const byTier = getInventoryByElement(placementMode.element);
              const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
              const elementInfo = getElementInfo(placementMode.element);
              const elemColor = NEON_TYPES[1].colors[placementMode.element];
              return (
                <div className="absolute" style={{ left: centerX, top: centerY }}>
                  <div className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all" style={{ left: -24, top: -24, borderColor: elemColor }} onClick={() => setPlacementMode(prev => ({ ...prev, step: 'element', element: null }))}><span className="text-xl">{elementInfo.icon}</span></div>
                  {tiers.map((tier, index) => {
                    const count = byTier[tier].length;
                    const angle = (index * (360 / tiers.length) - 90) * (Math.PI / 180);
                    const radius = 65;
                    const x = Math.cos(angle) * radius - 22;
                    const y = Math.sin(angle) * radius - 22;
                    const tierColor = NEON_TYPES[tier].colors[placementMode.element];
                    return (
                      <div key={tier} className="absolute w-11 h-11 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all" style={{ left: x, top: y, background: `radial-gradient(circle, ${tierColor} 0%, ${tierColor}80 70%)`, boxShadow: `0 0 15px ${tierColor}80`, border: `2px solid ${tierColor}` }} onClick={() => handleTierSelect(tier)}>
                        <span className="text-xs font-black text-white drop-shadow">T{tier}</span>
                        <span className="text-xs text-white/80">x{count}</span>
                      </div>
                    );
                  })}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* 게임 오버 모달 */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl text-center border border-red-500/50" style={{boxShadow: '0 0 50px rgba(255, 0, 0, 0.3)'}}>
            <h2 className="text-4xl font-black text-red-500 mb-4">GAME OVER</h2>
            <p className="text-xl text-gray-300 mb-2">Stage {stage} - Wave {wave}까지 도달!</p>
            <p className="text-gray-500 mb-6">처치한 적: {killedCount + ((stage - 1) * SPAWN.wavesPerStage + wave - 1) * 50}</p>
            <button type="button" onClick={resetGame} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all">🔄 다시 시작</button>
          </div>
        </div>
      )}

      {/* 스테이지 전환 모달 */}
      {showStageTransition && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'neonPulse 1s ease-in-out infinite' }}>🎉 STAGE {stage} CLEAR! 🎉</h2>
              <p className="text-2xl text-cyan-300 mb-2">Stage {stage + 1} 준비 중...</p>
              <p className="text-yellow-400 mb-2">⚠️ 새로운 경로가 랜덤 생성됩니다</p>
              <p className="text-gray-500">타워가 초기화됩니다</p>
            </div>
          </div>
      )}

      {/* 도움말 모달 (ELEMENT_UI + ENEMY_CONFIG 데이터 주도) */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}>
          <div className="bg-gray-900 rounded-2xl border border-cyan-500/50 max-w-md w-full max-h-[80vh] overflow-y-auto" style={{boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)'}}>
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-black text-cyan-400">📖 게임 도움말</h2>
              <button onClick={() => setShowHelp(false)} className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-all">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h3 className="text-sm font-bold mb-2 text-pink-400">🎮 기본 조작</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>• <span className="text-pink-400">뽑기 ({ECONOMY.drawCost}G)</span>: 랜덤 Tier 1 네온 획득</p>
                  <p>• <span className="text-yellow-400">선택 조합</span>: 인벤토리에서 같은 타입 3개 선택 후 조합</p>
                  <p>• <span className="text-amber-400">전체 조합</span>: 조합 가능한 모든 타워 자동 조합</p>
                  <p>• <span className="text-cyan-400">배치 (PC)</span>: 인벤토리에서 드래그하여 맵에 배치</p>
                  <p>• <span className="text-green-400">배치 (모바일)</span>: 빈 타일 탭 → 속성 선택 → 티어 선택</p>
                  <p>• <span className="text-emerald-400">타워 조합</span>: 맵에서 같은 타워 3개 선택 후 조합</p>
                  <p>• <span className="text-red-400">판매</span>: 맵의 타워 선택 후 판매 ({Math.floor(ECONOMY.sellRefundRate * 100)}% 환급)</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h3 className="text-sm font-bold mb-2 text-purple-400">🔮 속성 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ELEMENT_UI.map(elem => {
                    const info = getElementInfo(elem.id);
                    return (
                      <div key={elem.id} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                        <span className="text-lg">{elem.icon}</span>
                        <div><p className="font-bold" style={{color: elem.color}}>{elem.name}</p><p className="text-gray-500">{info.desc}</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h3 className="text-sm font-bold mb-2 text-red-400">👾 적 타입</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(ENEMY_CONFIG).map(([type, cfg]) => {
                    const labels = { normal: '일반', fast: '빠름', elite: '엘리트', boss: '보스', jammer: '방해자', suppressor: '억제자' };
                    const descs = { normal: '기본 적', fast: '60% HP, 고속', elite: '250% HP', boss: '800%+ HP', jammer: '타워 공속⬇️', suppressor: '타워 공격력⬇️' };
                    return (
                      <div key={type} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                        {cfg.icon ? <span className="text-lg">{cfg.icon}</span> : <span className={'w-4 h-4 rounded-sm rotate-45 ' + cfg.color}></span>}
                        <div><p className="font-bold" style={{color: cfg.explosionColor}}>{labels[type]}</p><p className="text-gray-500">{descs[type]}</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <h3 className="text-sm font-bold mb-2 text-yellow-400">💡 팁</h3>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>• 스테이지가 올라갈수록 출발점/도착점이 늘어나요!</p>
                  <p>• 🚪A, 🚪B, 🚪C... 여러 경로를 모두 방어하세요</p>
                  <p>• ❄️ 슬로우로 적을 늦추고 🔥 화상으로 지속 데미지!</p>
                  <p>• ⚡ 전격은 다수의 적에게 효과적</p>
                  <p>• 🌪️ 질풍은 보스에게 강력한 데미지</p>
                  <p>• 전체 조합으로 빠르게 고티어 타워를 만드세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 치트 콘솔 (` 키로 토글) */}
      {cheatOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{fontFamily: 'monospace'}}>
          <div className="bg-black/95 border-t border-green-500/50 max-h-60 flex flex-col">
            <div className="flex justify-between items-center px-3 py-1 border-b border-green-500/30">
              <span className="text-green-400 text-xs font-bold">CHEAT CONSOLE</span>
              <button onClick={() => setCheatOpen(false)} className="text-gray-500 hover:text-white text-xs">ESC / `</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1 text-xs">
              {cheatLog.map((line, i) => (
                <div key={i} className={line.startsWith('>') ? 'text-cyan-400' : line.startsWith('❌') ? 'text-red-400' : 'text-green-300'} style={{whiteSpace: 'pre-wrap'}}>{line}</div>
              ))}
            </div>
            <form onSubmit={handleCheatSubmit} className="flex border-t border-green-500/30">
              <span className="text-green-400 px-2 py-2 text-sm">{'>'}</span>
              <input ref={cheatInputRef} value={cheatInput} onChange={(e) => setCheatInput(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setCheatOpen(false)} className="flex-1 bg-transparent text-green-300 text-sm py-2 outline-none" placeholder="help 입력으로 명령어 확인" autoFocus />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<NeonDefense />);
