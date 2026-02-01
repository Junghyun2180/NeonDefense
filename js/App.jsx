// Neon Defense - Main App Component
const { useState, useEffect, useCallback, useRef } = React;

const NeonDefense = () => {
  const [gold, setGold] = useState(100);
    const [lives, setLives] = useState(20);
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
    
    // 다중 경로 시스템
    const [pathData, setPathData] = useState(() => generateMultiplePaths(1, 1));
    const currentPath = pathData.paths[0]?.tiles || []; // 기존 호환성
    
    const [showStageTransition, setShowStageTransition] = useState(false);
    const [draggingNeon, setDraggingNeon] = useState(null);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [dropPreview, setDropPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // 모바일 배치 시스템 상태
    const [placementMode, setPlacementMode] = useState(null); // { gridX, gridY, step: 'element' | 'tier', element: number }
    
    // 도움말 모달 상태
    const [showHelp, setShowHelp] = useState(false);
    
    // 게임 속도 (1x, 2x, 3x)
    const [gameSpeed, setGameSpeed] = useState(1);
    const gameSpeedRef = useRef(1);
    useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);
    
    // 사운드 상태
    const [bgmEnabled, setBgmEnabled] = useState(true);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    
    const toggleBgm = () => {
      const enabled = soundManager.toggleBGM();
      setBgmEnabled(enabled);
    };
    
    const toggleSfx = () => {
      const enabled = soundManager.toggleSFX();
      setSfxEnabled(enabled);
    };
    
    const dragStartPos = useRef({ x: 0, y: 0 });
    const gameLoopRef = useRef(null);
    const spawnIntervalRef = useRef(null);
    const mapRef = useRef(null);
    const enemiesRef = useRef([]);
    const towersRef = useRef([]);
    const pathDataRef = useRef(pathData);
    
    useEffect(() => { pathDataRef.current = pathData; }, [pathData]);
    useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
    useEffect(() => { towersRef.current = towers; }, [towers]);

    // 인벤토리에서 특정 속성의 타워들을 티어별로 그룹화
    const getInventoryByElement = useCallback((element) => {
      const filtered = inventory.filter(n => n.element === element);
      const byTier = {};
      filtered.forEach(n => {
        if (!byTier[n.tier]) byTier[n.tier] = [];
        byTier[n.tier].push(n);
      });
      return byTier;
    }, [inventory]);

    // 각 속성별 보유 여부 확인
    const getAvailableElements = useCallback(() => {
      const available = {};
      for (let i = 0; i < 6; i++) {
        available[i] = inventory.some(n => n.element === i);
      }
      return available;
    }, [inventory]);

    // 타일 클릭 핸들러 (모바일 배치 시스템)
    const handleTileClick = useCallback((gridX, gridY) => {
      const isPath = currentPath.some(p => p.x === gridX && p.y === gridY);
      const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
      
      if (isPath || hasTower) {
        setPlacementMode(null);
        return;
      }
      
      // 빈 타일 클릭 시 배치 모드 시작
      setPlacementMode({ gridX, gridY, step: 'element', element: null });
      setSelectedInventory([]);
      setSelectedTowers([]);
    }, [currentPath, towers]);

    // 속성 선택 핸들러
    const handleElementSelect = useCallback((element) => {
      if (!placementMode) return;
      const byTier = getInventoryByElement(element);
      if (Object.keys(byTier).length === 0) return; // 해당 속성 타워 없음
      
      setPlacementMode(prev => ({ ...prev, step: 'tier', element }));
    }, [placementMode, getInventoryByElement]);

    // 티어 선택 핸들러 (배치 완료)
    const handleTierSelect = useCallback((tier) => {
      if (!placementMode || placementMode.step !== 'tier') return;
      
      const element = placementMode.element;
      const towersOfTier = inventory.filter(n => n.element === element && n.tier === tier);
      if (towersOfTier.length === 0) return;
      
      const neonToPlace = towersOfTier[0];
      const newTower = {
        ...neonToPlace,
        id: Date.now(),
        gridX: placementMode.gridX,
        gridY: placementMode.gridY,
        x: placementMode.gridX * TILE_SIZE + TILE_SIZE / 2,
        y: placementMode.gridY * TILE_SIZE + TILE_SIZE / 2,
        lastShot: 0,
      };
      
      setTowers(prev => [...prev, newTower]);
      setInventory(prev => prev.filter(n => n.id !== neonToPlace.id));
      setPlacementMode(null);
    }, [placementMode, inventory]);

    // 배치 모드 취소
    const cancelPlacementMode = useCallback(() => {
      setPlacementMode(null);
    }, []);

    const drawRandomNeon = useCallback(() => {
      if (gold < 20) return;
      const tier = 1;
      const colorIndex = Math.floor(Math.random() * 6);
      const neonData = NEON_TYPES[tier];
      const newNeon = {
        id: Date.now() + Math.random(), tier, colorIndex,
        color: neonData.colors[colorIndex], name: neonData.names[colorIndex],
        damage: neonData.damage, range: neonData.range, speed: neonData.speed,
        element: colorIndex, // 색상 인덱스가 곧 속성
      };
      setInventory(prev => [...prev, newNeon]);
      setGold(prev => prev - 20);
      soundManager.playDraw();
    }, [gold]);

    const toggleInventorySelect = useCallback((neon) => {
      setSelectedTowers([]);
      setSelectedInventory(prev => {
        const isSelected = prev.some(n => n.id === neon.id);
        if (isSelected) return prev.filter(n => n.id !== neon.id);
        if (prev.length >= 3) return prev;
        if (prev.length > 0 && (prev[0].tier !== neon.tier || prev[0].colorIndex !== neon.colorIndex)) return prev;
        return [...prev, neon];
      });
    }, []);

    const toggleTowerSelect = useCallback((tower) => {
      setSelectedInventory([]);
      setSelectedTowers(prev => {
        const isSelected = prev.some(t => t.id === tower.id);
        if (isSelected) return prev.filter(t => t.id !== tower.id);
        if (prev.length >= 3) return prev;
        if (prev.length > 0 && (prev[0].tier !== tower.tier || prev[0].colorIndex !== tower.colorIndex)) return prev;
        return [...prev, tower];
      });
    }, []);

    const combineNeons = useCallback(() => {
      if (selectedInventory.length !== 3) return;
      const baseTier = selectedInventory[0].tier;
      const baseColorIndex = selectedInventory[0].colorIndex;
      if (baseTier >= 4) return;
      const nextTier = baseTier + 1;
      const neonData = NEON_TYPES[nextTier];
      const newNeon = {
        id: Date.now() + Math.random(), tier: nextTier, colorIndex: baseColorIndex,
        color: neonData.colors[baseColorIndex], name: neonData.names[baseColorIndex],
        damage: neonData.damage, range: neonData.range, speed: neonData.speed,
        element: baseColorIndex,
      };
      setInventory(prev => {
        const idsToRemove = selectedInventory.map(n => n.id);
        return [...prev.filter(n => !idsToRemove.includes(n.id)), newNeon];
      });
      setSelectedInventory([]);
      soundManager.playCombine();
    }, [selectedInventory]);

    // 전체 자동 조합: 같은 속성/티어 3개씩 모두 조합
    const combineAllNeons = useCallback(() => {
      setInventory(prev => {
        let currentInventory = [...prev];
        let combined = true;
        let totalCombines = 0;
        
        // 더 이상 조합할 수 없을 때까지 반복
        while (combined) {
          combined = false;
          
          // 티어 1부터 3까지 순회 (티어 4는 조합 불가)
          for (let tier = 1; tier <= 3; tier++) {
            // 각 속성(0~5) 순회
            for (let element = 0; element < 6; element++) {
              // 해당 티어/속성의 타워들 찾기
              const matching = currentInventory.filter(n => n.tier === tier && n.colorIndex === element);
              
              // 3개 이상이면 조합
              while (matching.length >= 3) {
                const toRemove = matching.splice(0, 3);
                const idsToRemove = toRemove.map(n => n.id);
                
                // 다음 티어 타워 생성
                const nextTier = tier + 1;
                const neonData = NEON_TYPES[nextTier];
                const newNeon = {
                  id: Date.now() + Math.random() + totalCombines,
                  tier: nextTier,
                  colorIndex: element,
                  color: neonData.colors[element],
                  name: neonData.names[element],
                  damage: neonData.damage,
                  range: neonData.range,
                  speed: neonData.speed,
                  element: element,
                };
                
                // 인벤토리 업데이트
                currentInventory = currentInventory.filter(n => !idsToRemove.includes(n.id));
                currentInventory.push(newNeon);
                
                combined = true;
                totalCombines++;
              }
            }
          }
        }
        
        return currentInventory;
      });
      setSelectedInventory([]);
      soundManager.playCombine();
    }, []);

    // 조합 가능한 세트 수 계산
    const getCombinableCount = useCallback(() => {
      let count = 0;
      for (let tier = 1; tier <= 3; tier++) {
        for (let element = 0; element < 6; element++) {
          const matching = inventory.filter(n => n.tier === tier && n.colorIndex === element);
          count += Math.floor(matching.length / 3);
        }
      }
      return count;
    }, [inventory]);

    const combineTowers = useCallback(() => {
      if (selectedTowers.length !== 3) return;
      const baseTier = selectedTowers[0].tier;
      const baseColorIndex = selectedTowers[0].colorIndex;
      if (baseTier >= 4) return;
      const nextTier = baseTier + 1;
      const neonData = NEON_TYPES[nextTier];
      const firstTower = selectedTowers[0];
      const newTower = {
        id: Date.now() + Math.random(), tier: nextTier, colorIndex: baseColorIndex,
        color: neonData.colors[baseColorIndex], name: neonData.names[baseColorIndex],
        damage: neonData.damage, range: neonData.range, speed: neonData.speed,
        element: baseColorIndex,
        gridX: firstTower.gridX, gridY: firstTower.gridY, x: firstTower.x, y: firstTower.y, lastShot: 0,
      };
      const idsToRemove = selectedTowers.map(t => t.id);
      setTowers(prev => [...prev.filter(t => !idsToRemove.includes(t.id)), newTower]);
      setSelectedTowers([]);
      setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: neonData.colors[baseColorIndex] }]);
      soundManager.playCombine();
    }, [selectedTowers]);

    const sellSelectedTowers = useCallback(() => {
      if (selectedTowers.length === 0) return;
      const totalRefund = selectedTowers.reduce((sum, tower) => sum + getTowerSellPrice(tower.tier), 0);
      const idsToRemove = selectedTowers.map(t => t.id);
      setTowers(prev => prev.filter(t => !idsToRemove.includes(t.id)));
      setGold(prev => prev + totalRefund);
      setSelectedTowers([]);
    }, [selectedTowers]);

    const totalSellPrice = selectedTowers.reduce((sum, tower) => sum + getTowerSellPrice(tower.tier), 0);

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
      const distance = Math.sqrt(Math.pow(clientX - dragStartPos.current.x, 2) + Math.pow(clientY - dragStartPos.current.y, 2));
      if (distance > 10) { setIsDragging(true); setSelectedInventory([]); setSelectedTowers([]); }
      setDragPosition({ x: clientX, y: clientY });
      if (mapRef.current && isDragging) {
        const rect = mapRef.current.getBoundingClientRect();
        const x = clientX - rect.left, y = clientY - rect.top;
        const gridX = Math.floor(x / TILE_SIZE), gridY = Math.floor(y / TILE_SIZE);
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
          const isPath = currentPath.some(p => p.x === gridX && p.y === gridY);
          const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
          setDropPreview({ gridX, gridY, valid: !isPath && !hasTower });
        } else { setDropPreview(null); }
      }
    }, [draggingNeon, towers, currentPath, isDragging]);

    const handleDragEnd = useCallback((e) => {
      if (!draggingNeon) return;
      if (!isDragging) {
        const neon = draggingNeon;
        setDraggingNeon(null); setDropPreview(null);
        setSelectedTowers([]);
        setSelectedInventory(prev => {
          const isSelected = prev.some(n => n.id === neon.id);
          if (isSelected) return prev.filter(n => n.id !== neon.id);
          if (prev.length >= 3) return prev;
          if (prev.length > 0 && (prev[0].tier !== neon.tier || prev[0].colorIndex !== neon.colorIndex)) return prev;
          return [...prev, neon];
        });
        return;
      }
      if (dropPreview && dropPreview.valid) {
        const newTower = {
          ...draggingNeon, id: Date.now(), gridX: dropPreview.gridX, gridY: dropPreview.gridY,
          x: dropPreview.gridX * TILE_SIZE + TILE_SIZE / 2, y: dropPreview.gridY * TILE_SIZE + TILE_SIZE / 2, lastShot: 0,
          element: draggingNeon.colorIndex,
        };
        setTowers(prev => [...prev, newTower]);
        setInventory(prev => prev.filter(n => n.id !== draggingNeon.id));
      }
      setDraggingNeon(null); setDropPreview(null); setIsDragging(false);
    }, [draggingNeon, dropPreview, isDragging]);

    useEffect(() => {
      if (draggingNeon) {
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
      }
    }, [draggingNeon, handleDragMove, handleDragEnd]);

    const startWave = useCallback(() => {
      if (isPlaying) return;
      setIsPlaying(true); setSpawnedCount(0); setKilledCount(0);
      soundManager.playWaveStart();
      soundManager.playBGM();
    }, [isPlaying]);

    // 체인 라이트닝 처리
    const processChainLightning = useCallback((startX, startY, firstTargetId, damage, tier, currentEnemies) => {
      const chainCount = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC].chainCount[tier] || 2;
      const chainRange = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC].chainRange;
      const decay = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC].chainDamageDecay;
      
      const hitEnemies = new Set([firstTargetId]);
      const chains = [];
      let currentDamage = damage;
      let lastX = startX, lastY = startY;
      let lastTarget = currentEnemies.find(e => e.id === firstTargetId);
      
      if (lastTarget) {
        chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
        lastX = lastTarget.x;
        lastY = lastTarget.y;
      }
      
      const chainDamages = new Map();
      
      for (let i = 1; i < chainCount; i++) {
        currentDamage *= decay;
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        currentEnemies.forEach(enemy => {
          if (hitEnemies.has(enemy.id)) return;
          const dx = enemy.x - lastX;
          const dy = enemy.y - lastY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= chainRange && dist < nearestDist) {
            nearestDist = dist;
            nearestEnemy = enemy;
          }
        });
        
        if (nearestEnemy) {
          hitEnemies.add(nearestEnemy.id);
          chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
          chains.push({ x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y, id: Date.now() + Math.random() + i });
          lastX = nearestEnemy.x;
          lastY = nearestEnemy.y;
        } else {
          break;
        }
      }
      
      if (chains.length > 0) {
        setChainLightnings(prev => [...prev, ...chains]);
        setTimeout(() => {
          setChainLightnings(prev => prev.filter(c => !chains.some(nc => nc.id === c.id)));
        }, 300);
      }
      
      return chainDamages;
    }, []);

    useEffect(() => {
      if (!isPlaying || gameOver) return;
      let localSpawnedCount = 0;
      
      // 웨이브당 적 수: 초반 적게, 후반 많이 (Bloons TD 스타일)
      const enemiesPerWave = Math.floor(15 + wave * 4 + stage * 3);
      
      // 스폰 간격: 스테이지/웨이브가 올라갈수록 빨라짐
      const baseSpawnDelay = Math.max(250, 500 - wave * 30 - stage * 20);
      
      spawnIntervalRef.current = setInterval(() => {
        if (localSpawnedCount < enemiesPerWave) {
          const currentPathData = pathDataRef.current;
          const paths = currentPathData.paths;
          const progress = localSpawnedCount / enemiesPerWave;
          
          // 랜덤 경로 선택
          const selectedPathIndex = Math.floor(Math.random() * paths.length);
          const selectedPath = paths[selectedPathIndex];
          const pathTiles = selectedPath.tiles;
          
          // 적 타입 결정 (웨이브 후반에 강한 적 등장)
          const isBoss = localSpawnedCount === enemiesPerWave - 1;
          const isElite = !isBoss && wave >= 3 && progress > 0.7 && Math.random() < 0.3; // 웨이브 3부터 엘리트
          const isFast = !isBoss && !isElite && Math.random() < 0.2 + wave * 0.05; // 빠른 적
          
          // 디버프 적 타입 (특수 적)
          const isJammer = !isBoss && !isElite && !isFast && wave >= 2 && Math.random() < 0.1 + stage * 0.02; // 방해자: 공속 감소
          const isSuppressor = !isBoss && !isElite && !isFast && !isJammer && wave >= 4 && Math.random() < 0.08 + stage * 0.02; // 억제자: 공격력 감소
          
          // 체력 계산 (Kingdom Rush 스타일 스케일링)
          // 기본 체력 + 스테이지 보정 + 웨이브 보정 + 후반 웨이브 추가 보정
          const stageMultiplier = 1 + (stage - 1) * 0.5; // 스테이지당 50% 증가
          const waveMultiplier = 1 + (wave - 1) * 0.25; // 웨이브당 25% 증가
          const lateWaveBonus = wave >= 4 ? 1.3 : 1; // 웨이브 4,5는 30% 추가
          
          let baseHealth = Math.floor(30 * stageMultiplier * waveMultiplier * lateWaveBonus);
          
          // 적 타입별 체력/속도 조정
          let health, speed, goldReward;
          if (isBoss) {
            health = Math.floor(baseHealth * (8 + stage)); // 보스: 8~12배 체력 (스테이지에 따라 증가)
            speed = 0.25 + stage * 0.02; // 보스도 점점 빨라짐
            goldReward = 30 + stage * 10 + wave * 5;
          } else if (isElite) {
            health = Math.floor(baseHealth * 2.5); // 엘리트: 2.5배 체력
            speed = 0.4 + Math.random() * 0.1;
            goldReward = 8;
          } else if (isJammer) {
            health = Math.floor(baseHealth * 1.8); // 방해자: 1.8배 체력
            speed = 0.35 + Math.random() * 0.1; // 느림
            goldReward = 10;
          } else if (isSuppressor) {
            health = Math.floor(baseHealth * 2.0); // 억제자: 2배 체력
            speed = 0.3 + Math.random() * 0.1; // 더 느림
            goldReward = 12;
          } else if (isFast) {
            health = Math.floor(baseHealth * 0.6); // 빠른 적: 60% 체력
            speed = 0.8 + Math.random() * 0.3; // 빠름
            goldReward = 3;
          } else {
            health = baseHealth;
            speed = 0.45 + Math.random() * 0.15 + wave * 0.03; // 기본 속도도 웨이브마다 증가
            goldReward = 4;
          }
          
          const newEnemy = {
            id: Date.now() + Math.random(),
            health,
            maxHealth: health,
            pathIndex: 0,
            pathId: selectedPath.id, // 어떤 경로를 따라가는지
            pathTiles: pathTiles, // 해당 경로 타일들
            baseSpeed: speed,
            speed: speed, 
            isBoss,
            isElite,
            isFast,
            isJammer, // 방해자: 주변 타워 공속 감소
            isSuppressor, // 억제자: 주변 타워 공격력 감소
            debuffRange: 80, // 디버프 범위
            goldReward,
            x: pathTiles[0].x * TILE_SIZE + TILE_SIZE / 2, 
            y: pathTiles[0].y * TILE_SIZE + TILE_SIZE / 2,
            // 상태이상
            burnDamage: 0,
            burnEndTime: 0,
            burnTickTime: 0,
            slowEndTime: 0,
            slowPercent: 0,
          };
          setEnemies(prev => [...prev, newEnemy]);
          localSpawnedCount++;
          setSpawnedCount(localSpawnedCount);
        }
      }, baseSpawnDelay);
      
      gameLoopRef.current = setInterval(() => {
        const now = Date.now();
        const speed = gameSpeedRef.current;
        
        // 적 이동 및 상태이상 처리
        setEnemies(prevEnemies => {
          let livesLost = 0;
          const burnDamages = new Map();
          
          const movedEnemies = prevEnemies.map(enemy => {
            // 각 적은 자신의 경로를 따라 이동
            const path = enemy.pathTiles;
            if (!path || enemy.pathIndex >= path.length - 1) { 
              livesLost += enemy.isBoss ? 5 : 1; 
              return null; 
            }
            
            let updatedEnemy = { ...enemy };
            
            // 화상 데미지 처리
            if (enemy.burnEndTime > now && now >= enemy.burnTickTime) {
              burnDamages.set(enemy.id, enemy.burnDamage);
              updatedEnemy.burnTickTime = now + 500 / speed; // 배속 적용
            }
            
            // 슬로우 처리
            if (enemy.slowEndTime > now) {
              updatedEnemy.speed = enemy.baseSpeed * (1 - enemy.slowPercent);
            } else {
              updatedEnemy.speed = enemy.baseSpeed;
            }
            
            // 배속 적용된 이동
            const moveSpeed = updatedEnemy.speed * speed;
            
            const nextTile = path[enemy.pathIndex + 1];
            const targetX = nextTile.x * TILE_SIZE + TILE_SIZE / 2;
            const targetY = nextTile.y * TILE_SIZE + TILE_SIZE / 2;
            const dx = targetX - enemy.x, dy = targetY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < moveSpeed * 2) {
              return { ...updatedEnemy, x: targetX, y: targetY, pathIndex: enemy.pathIndex + 1 };
            }
            return { ...updatedEnemy, x: enemy.x + (dx / dist) * moveSpeed * 2, y: enemy.y + (dy / dist) * moveSpeed * 2 };
          }).filter(Boolean);
          
          // 화상 데미지 적용
          if (burnDamages.size > 0) {
            const afterBurn = movedEnemies.map(enemy => {
              const damage = burnDamages.get(enemy.id);
              if (damage) {
                const newHealth = enemy.health - damage;
                if (newHealth <= 0) {
                  setKilledCount(prev => prev + 1);
                  setGold(prev => prev + (enemy.goldReward || 4));
                  setEffects(prev => [...prev, { id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'explosion', color: '#FF6B6B' }]);
                  return null;
                }
                return { ...enemy, health: newHealth };
              }
              return enemy;
            }).filter(Boolean);
            
            if (livesLost > 0) {
              setLives(l => { 
                const newLives = l - livesLost; 
                if (newLives <= 0) {
                  setGameOver(true);
                  soundManager.playGameOver();
                  soundManager.stopBGM();
                } else {
                  soundManager.playLifeLost();
                }
                return Math.max(0, newLives); 
              });
            }
            return afterBurn;
          }
          
          if (livesLost > 0) {
            setLives(l => { 
              const newLives = l - livesLost; 
              if (newLives <= 0) {
                setGameOver(true);
                soundManager.playGameOver();
                soundManager.stopBGM();
              } else {
                soundManager.playLifeLost();
              }
              return Math.max(0, newLives); 
            });
          }
          return movedEnemies;
        });
        
        // 타워 공격 (디버프 적 효과 적용)
        setTowers(prevTowers => {
          const currentEnemies = enemiesRef.current;
          const newProjectiles = [];
          
          // 디버프 적들 찾기
          const jammerEnemies = currentEnemies.filter(e => e.isJammer);
          const suppressorEnemies = currentEnemies.filter(e => e.isSuppressor);
          
          const updatedTowers = prevTowers.map(tower => {
            // 디버프 계산
            let speedDebuff = 1; // 공속 배율 (1 = 100%)
            let damageDebuff = 1; // 공격력 배율 (1 = 100%)
            
            // 방해자 (Jammer) 효과: 공격속도 -50%
            jammerEnemies.forEach(jammer => {
              const dx = jammer.x - tower.x, dy = jammer.y - tower.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= (jammer.debuffRange || 80)) {
                speedDebuff = Math.max(speedDebuff * 0.5, 0.3); // 최대 70% 감소까지
              }
            });
            
            // 억제자 (Suppressor) 효과: 공격력 -40%
            suppressorEnemies.forEach(suppressor => {
              const dx = suppressor.x - tower.x, dy = suppressor.y - tower.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= (suppressor.debuffRange || 80)) {
                damageDebuff = Math.max(damageDebuff * 0.6, 0.3); // 최대 70% 감소까지
              }
            });
            
            // 배속 적용된 공격 쿨다운 (디버프 적용)
            const effectiveSpeed = tower.speed / speedDebuff; // 디버프로 쿨다운 증가
            if (now - tower.lastShot < effectiveSpeed / speed) return tower;
            
            let nearestEnemy = null;
            let nearestDist = Infinity;
            
            currentEnemies.forEach(enemy => {
              const dx = enemy.x - tower.x, dy = enemy.y - tower.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist <= tower.range && dist < nearestDist) { 
                nearestDist = dist; 
                nearestEnemy = enemy; 
              }
            });
            
            if (nearestEnemy) {
              // 디버프 적용된 데미지
              const effectiveDamage = Math.floor(tower.damage * damageDebuff);
              
              newProjectiles.push({ 
                id: Date.now() + Math.random(), 
                x: tower.x, y: tower.y, 
                targetId: nearestEnemy.id, 
                damage: effectiveDamage, 
                color: tower.color, 
                speed: 10 * speed, // 배속 적용
                element: tower.element,
                tier: tower.tier,
                towerX: tower.x,
                towerY: tower.y,
                isDebuffed: damageDebuff < 1, // 디버프 상태 표시용
              });
              // 공격 사운드 (너무 많이 재생되지 않도록 확률로)
              if (Math.random() < 0.3) soundManager.playShoot(tower.element);
              return { ...tower, lastShot: now, isDebuffed: speedDebuff < 1 || damageDebuff < 1 };
            }
            return { ...tower, isDebuffed: speedDebuff < 1 || damageDebuff < 1 };
          });
          
          if (newProjectiles.length > 0) setProjectiles(prev => [...prev, ...newProjectiles]);
          return updatedTowers;
        });
        
        // 투사체 처리
        setProjectiles(prevProjectiles => {
          const currentEnemies = enemiesRef.current;
          const damageMap = new Map();
          const statusEffects = []; // { enemyId, type, ... }
          const newEffects = [];
          const chainDamagesAll = new Map();
          
          const updatedProjectiles = prevProjectiles.map(proj => {
            let targetEnemy = currentEnemies.find(e => e.id === proj.targetId);
            if (!targetEnemy) {
              let nearestDist = Infinity;
              currentEnemies.forEach(enemy => {
                const dx = enemy.x - proj.x, dy = enemy.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) { nearestDist = dist; targetEnemy = enemy; }
              });
            }
            if (!targetEnemy) return null;
            
            const dx = targetEnemy.x - proj.x, dy = targetEnemy.y - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 충돌 감지: 프로젝타일 속도를 고려하여 overshoot 방지
            if (dist < 15 + proj.speed) {
              let finalDamage = proj.damage;
              
              // 속성별 처리
              switch (proj.element) {
                case ELEMENT_TYPES.FIRE: // 화상
                  const fireEffect = ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE];
                  statusEffects.push({
                    enemyId: targetEnemy.id,
                    type: 'burn',
                    damage: Math.floor(proj.damage * fireEffect.burnDamagePercent[proj.tier]),
                    duration: fireEffect.burnDuration[proj.tier],
                  });
                  newEffects.push({ id: Date.now() + Math.random(), x: targetEnemy.x, y: targetEnemy.y, type: 'burn', color: '#FF6B6B' });
                  break;
                  
                case ELEMENT_TYPES.WATER: // 슬로우
                  const waterEffect = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
                  statusEffects.push({
                    enemyId: targetEnemy.id,
                    type: 'slow',
                    percent: waterEffect.slowPercent[proj.tier],
                    duration: waterEffect.slowDuration[proj.tier],
                  });
                  newEffects.push({ id: Date.now() + Math.random(), x: targetEnemy.x, y: targetEnemy.y, type: 'slow', color: '#45B7D1' });
                  break;
                  
                case ELEMENT_TYPES.ELECTRIC: // 체인 라이트닝
                  const chainDamages = processChainLightning(proj.towerX, proj.towerY, targetEnemy.id, proj.damage, proj.tier, currentEnemies);
                  chainDamages.forEach((dmg, id) => {
                    chainDamagesAll.set(id, (chainDamagesAll.get(id) || 0) + dmg);
                  });
                  break;
                  
                case ELEMENT_TYPES.WIND: // 고데미지 + 넉백
                  const windEffect = ELEMENT_EFFECTS[ELEMENT_TYPES.WIND];
                  finalDamage = Math.floor(proj.damage * windEffect.damageMultiplier[proj.tier]);
                  statusEffects.push({
                    enemyId: targetEnemy.id,
                    type: 'knockback',
                    distance: windEffect.knockbackDistance[proj.tier],
                    fromX: proj.x,
                    fromY: proj.y,
                  });
                  newEffects.push({ id: Date.now() + Math.random(), x: targetEnemy.x, y: targetEnemy.y, type: 'knockback', color: '#96E6A1' });
                  break;
              }
              
              damageMap.set(targetEnemy.id, (damageMap.get(targetEnemy.id) || 0) + finalDamage);
              newEffects.push({ id: Date.now() + Math.random(), x: proj.x, y: proj.y, type: 'hit', color: proj.color });
              return null;
            }
            
            // 이동 거리가 남은 거리보다 크면 적 위치로 스냅 (overshoot 방지)
            const moveStep = Math.min(proj.speed, dist);
            return { ...proj, x: proj.x + (dx / dist) * moveStep, y: proj.y + (dy / dist) * moveStep };
          }).filter(Boolean);
          
          // 체인 라이트닝 데미지 합산
          chainDamagesAll.forEach((dmg, id) => {
            damageMap.set(id, (damageMap.get(id) || 0) + dmg);
          });
          
          // 데미지 및 상태이상 적용
          if (damageMap.size > 0 || statusEffects.length > 0) {
            setEnemies(prevEnemies => {
              let newKills = 0, goldEarned = 0;
              const path = pathRef.current;
              
              const damagedEnemies = prevEnemies.map(enemy => {
                let updatedEnemy = { ...enemy };
                
                // 상태이상 적용
                statusEffects.filter(e => e.enemyId === enemy.id).forEach(effect => {
                  switch (effect.type) {
                    case 'burn':
                      updatedEnemy.burnDamage = effect.damage;
                      updatedEnemy.burnEndTime = now + effect.duration;
                      updatedEnemy.burnTickTime = now + 500;
                      break;
                    case 'slow':
                      if (effect.percent > updatedEnemy.slowPercent || now > updatedEnemy.slowEndTime) {
                        updatedEnemy.slowPercent = effect.percent;
                        updatedEnemy.slowEndTime = now + effect.duration;
                      }
                      break;
                    case 'knockback':
                      // 넉백: 현재 pathIndex를 뒤로
                      const knockbackTiles = Math.floor(effect.distance / TILE_SIZE);
                      const newPathIndex = Math.max(0, enemy.pathIndex - knockbackTiles);
                      if (newPathIndex < enemy.pathIndex) {
                        const newTile = path[newPathIndex];
                        updatedEnemy.pathIndex = newPathIndex;
                        updatedEnemy.x = newTile.x * TILE_SIZE + TILE_SIZE / 2;
                        updatedEnemy.y = newTile.y * TILE_SIZE + TILE_SIZE / 2;
                      }
                      break;
                  }
                });
                
                // 데미지 적용
                const damage = damageMap.get(enemy.id);
                if (damage) {
                  const newHealth = updatedEnemy.health - damage;
                  if (newHealth <= 0) {
                    newKills++;
                    goldEarned += enemy.goldReward || 4;
                    // 적 타입별 폭발 색상
                    const explosionColor = enemy.isBoss ? '#ff0000' : enemy.isElite ? '#ff6600' : enemy.isJammer ? '#8b5cf6' : enemy.isSuppressor ? '#ec4899' : enemy.isFast ? '#00ffff' : '#9333ea';
                    newEffects.push({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'explosion', color: explosionColor });
                    // 사운드
                    soundManager.playKill(enemy.isBoss);
                    return null;
                  }
                  // 피격 사운드
                  soundManager.playHit();
                  return { ...updatedEnemy, health: newHealth };
                }
                return updatedEnemy;
              }).filter(Boolean);
              
              if (newKills > 0) { 
                setKilledCount(prev => prev + newKills); 
                setGold(prev => prev + goldEarned); 
              }
              return damagedEnemies;
            });
          }
          
          if (newEffects.length > 0) setEffects(prev => [...prev, ...newEffects]);
          return updatedProjectiles;
        });
        
        setEffects(prev => prev.filter(e => Date.now() - e.id < 300));
      }, 16);
      
      return () => { clearInterval(gameLoopRef.current); clearInterval(spawnIntervalRef.current); };
    }, [isPlaying, gameOver, wave, processChainLightning, stage]);

    useEffect(() => {
      const enemiesPerWave = Math.floor(15 + wave * 4 + stage * 3);
      if (spawnedCount >= enemiesPerWave && enemies.length === 0 && isPlaying && !gameOver) {
        setIsPlaying(false);
        // 웨이브 클리어 보상: 기본값 낮추고 웨이브별 차등
        const waveReward = 20 + wave * 5 + (wave === 5 ? 20 : 0);
        setGold(prev => prev + waveReward);
        if (wave >= 5) {
          setShowStageTransition(true);
          const nextStage = stage + 1;
          setTimeout(() => {
            setStage(nextStage); setWave(1);
            setPathData(generateMultiplePaths(Date.now(), nextStage));
            setTowers([]); 
            // 스테이지 클리어 보너스: 50골드 + 스테이지당 추가 보너스
            setGold(prev => prev + 50 + stage * 10);
            setShowStageTransition(false);
          }, 2000);
        } else { setWave(prev => prev + 1); }
      }
    }, [spawnedCount, enemies.length, isPlaying, gameOver, wave, stage]);

    const resetGame = () => {
      const newPathData = generateMultiplePaths(Date.now(), 1);
      setGold(100); setLives(20); setStage(1); setWave(1);
      setIsPlaying(false); setGameOver(false);
      setTowers([]); setEnemies([]); setProjectiles([]);
      setInventory([]); setSelectedInventory([]); setSelectedTowers([]);
      setSpawnedCount(0); setKilledCount(0);
      setDraggingNeon(null); setDropPreview(null);
      setPathData(newPathData); setShowStageTransition(false);
      setChainLightnings([]); setPlacementMode(null);
      setGameSpeed(1);
      soundManager.stopBGM();
    };

    const canCombineTowers = selectedTowers.length === 3 && selectedTowers[0]?.tier < 4;

    // 속성 정보 가져오기
    const getElementInfo = (element) => ELEMENT_EFFECTS[element] || ELEMENT_EFFECTS[ELEMENT_TYPES.VOID];

    return (
      <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4 overflow-x-hidden select-none" style={{fontFamily: "'Orbitron', sans-serif"}}>
        <div className="max-w-4xl mx-auto mb-4">
          <h1 className="text-2xl sm:text-4xl font-black text-center mb-4 tracking-wider" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1, #dda0dd, #ffd93d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 30px rgba(78, 205, 196, 0.5)' }}>
            ⚡ NEON DEFENSE ⚡
          </h1>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 text-sm sm:text-base">
            <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-emerald-500/50 flex items-center gap-2"><span className="text-emerald-400">🏰</span><span className="font-bold text-emerald-300">Stage {stage}</span></div>
            <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-cyan-500/50 flex items-center gap-2"><span className="text-cyan-400">🌊</span><span className="font-bold text-cyan-300">Wave {wave}/5</span></div>
            <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center gap-2"><span className="text-yellow-400">💰</span><span className="font-bold text-yellow-300">{gold}</span></div>
            <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-red-500/50 flex items-center gap-2"><span className="text-red-400">❤️</span><span className="font-bold text-red-300">{lives}</span></div>
            <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-2"><span className="text-orange-400">🚪</span><span className="font-bold text-orange-300">{pathData.paths.length}→{pathData.endPoints.length}</span></div>
            {isPlaying && <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-purple-500/50 flex items-center gap-2"><span className="text-purple-400">👾</span><span className="font-bold text-purple-300">{killedCount}/{Math.floor(15 + wave * 4 + stage * 3)}</span></div>}
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-4">
          {/* 맵 컨테이너 */}
          <div className="relative">
            {/* 맵 위 컨트롤 바: 배속 + 도움말 */}
            <div className="flex justify-between items-center mb-2 px-1">
              {/* 배속 버튼 */}
              <div className="flex gap-1">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => setGameSpeed(s)}
                    className={'px-3 py-1 rounded text-sm font-bold transition-all ' + (gameSpeed === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
                    style={gameSpeed === s ? {boxShadow: '0 0 10px rgba(0,255,255,0.5)'} : {}}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              
              {/* 사운드 버튼 */}
              <div className="flex gap-1">
                <button
                  onClick={toggleBgm}
                  className={'px-2 py-1 rounded text-sm transition-all ' + (bgmEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')}
                  title="BGM 토글"
                >
                  🎵
                </button>
                <button
                  onClick={toggleSfx}
                  className={'px-2 py-1 rounded text-sm transition-all ' + (sfxEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')}
                  title="효과음 토글"
                >
                  🔊
                </button>
              </div>
              
              {/* 도움말 버튼 */}
              <button 
                onClick={() => setShowHelp(true)}
                className="w-8 h-8 rounded-full bg-gray-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-gray-700 hover:border-cyan-400 transition-all"
                style={{boxShadow: '0 0 10px rgba(0,255,255,0.3)'}}
              >
                <span className="text-sm font-bold">?</span>
              </button>
            </div>
            
            <div ref={mapRef} className="relative mx-auto" style={{width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE}}>
              <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-cyan-500/30" style={{boxShadow: '0 0 30px rgba(78, 205, 196, 0.2), inset 0 0 30px rgba(0,0,0,0.5)'}}>
              {Array.from({length: GRID_HEIGHT}, (_, y) => (
                Array.from({length: GRID_WIDTH}, (_, x) => {
                  // 다중 경로 체크 - 어떤 경로에 속하는지 확인
                  let pathInfo = null;
                  for (const path of pathData.paths) {
                    if (path.tiles.some(p => p.x === x && p.y === y)) {
                      pathInfo = path;
                      break;
                    }
                  }
                  const isPath = pathInfo !== null;
                  const hasTower = towers.some(t => t.gridX === x && t.gridY === y);
                  
                  // 시작점/끝점 체크
                  const startPoint = pathData.startPoints.find(sp => sp.x === x && sp.y === y);
                  const endPoint = pathData.endPoints.find(ep => ep.x === x && ep.y === y);
                  
                  const isDropPreview = dropPreview && dropPreview.gridX === x && dropPreview.gridY === y;
                  const isSelectedTile = placementMode && placementMode.gridX === x && placementMode.gridY === y;
                  const canPlace = !isPath && !hasTower;
                  let extraClass = '';
                  if (isDropPreview) extraClass = dropPreview.valid ? 'drop-preview-valid' : 'drop-preview-invalid';
                  if (isSelectedTile) extraClass = 'ring-2 ring-white ring-opacity-80';
                  
                  // 경로별 색상 적용
                  const pathStyle = isPath && pathInfo ? {
                    backgroundColor: pathInfo.color + '40',
                    borderColor: pathInfo.color + '60',
                  } : {};
                  
                  return (
                    <div 
                      key={x + '-' + y} 
                      className={'absolute ' + (isPath ? 'path-tile' : 'grass-tile') + ' ' + extraClass + (canPlace && !isSelectedTile ? ' cursor-pointer hover:brightness-125' : '')} 
                      style={{ 
                        left: x * TILE_SIZE, 
                        top: y * TILE_SIZE, 
                        width: TILE_SIZE, 
                        height: TILE_SIZE,
                        ...pathStyle
                      }}
                      onClick={() => canPlace && handleTileClick(x, y)}
                    >
                      {startPoint && (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{textShadow: '0 0 10px #00ff00', color: '#00ff00'}}>
                          🚪{startPoint.id}
                        </div>
                      )}
                      {endPoint && (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold" style={{textShadow: '0 0 10px #ff0000', color: '#ff0000'}}>
                          🏠{endPoint.id}
                        </div>
                      )}
                    </div>
                  );
                })
              ))}
              
              {/* 체인 라이트닝 시각화 */}
              <svg className="absolute inset-0 pointer-events-none" style={{width: '100%', height: '100%'}}>
                {chainLightnings.map(chain => (
                  <line key={chain.id} x1={chain.x1} y1={chain.y1} x2={chain.x2} y2={chain.y2} stroke="#FFD93D" strokeWidth="3" className="chain-lightning" style={{filter: 'drop-shadow(0 0 5px #FFD93D)'}} />
                ))}
              </svg>
              
              {towers.map(tower => {
                const isSelected = selectedTowers.some(t => t.id === tower.id);
                const elementInfo = getElementInfo(tower.element);
                return (
                  <div key={tower.id} onClick={() => toggleTowerSelect(tower)} style={{cursor: 'pointer'}}>
                    <div className="absolute rounded-full tower-range pointer-events-none" style={{ left: tower.x - tower.range, top: tower.y - tower.range, width: tower.range * 2, height: tower.range * 2, border: '2px solid ' + (isSelected ? '#ffffff' : tower.color) + '40', background: 'radial-gradient(circle, ' + tower.color + '10 0%, transparent 70%)' }} />
                    <div className={'absolute neon-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: tower.x - 15, top: tower.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + tower.color + ' 0%, ' + tower.color + '80 50%, transparent 70%)', borderRadius: '50%', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + tower.color : undefined, color: tower.color, opacity: tower.isDebuffed ? 0.6 : 1 }}>
                      <span className="text-xs font-black text-white drop-shadow-lg">{elementInfo.icon}</span>
                    </div>
                    <div className="absolute text-xs font-bold text-white" style={{ left: tower.x - 8, top: tower.y + 12, textShadow: '0 0 3px black' }}>T{tower.tier}</div>
                    {/* 디버프 표시 */}
                    {tower.isDebuffed && <div className="absolute text-xs" style={{ left: tower.x + 8, top: tower.y - 15 }}>⬇️</div>}
                  </div>
                );
              })}
              
              {enemies.map(enemy => {
                const isBurning = enemy.burnEndTime > Date.now();
                const isSlowed = enemy.slowEndTime > Date.now();
                
                // 적 타입별 스타일
                let enemyColor, enemySize, enemyShadow;
                if (enemy.isBoss) {
                  enemyColor = 'bg-red-600';
                  enemySize = 'w-8 h-8';
                  enemyShadow = '0 0 20px #ff0000, 0 0 30px #ff0000';
                } else if (enemy.isElite) {
                  enemyColor = 'bg-orange-500';
                  enemySize = 'w-7 h-7';
                  enemyShadow = '0 0 12px #ff6600';
                } else if (enemy.isJammer) {
                  enemyColor = 'bg-violet-500';
                  enemySize = 'w-7 h-7';
                  enemyShadow = '0 0 15px #8b5cf6, 0 0 30px #8b5cf6';
                } else if (enemy.isSuppressor) {
                  enemyColor = 'bg-pink-500';
                  enemySize = 'w-7 h-7';
                  enemyShadow = '0 0 15px #ec4899, 0 0 30px #ec4899';
                } else if (enemy.isFast) {
                  enemyColor = 'bg-cyan-400';
                  enemySize = 'w-5 h-5';
                  enemyShadow = '0 0 8px #00ffff';
                } else {
                  enemyColor = 'bg-purple-600';
                  enemySize = 'w-6 h-6';
                  enemyShadow = '0 0 8px #9333ea';
                }
                
                return (
                  <div key={enemy.id} className="absolute" style={{left: enemy.x - 12, top: enemy.y - 12}}>
                    {/* 디버프 범위 표시 (Jammer/Suppressor) */}
                    {(enemy.isJammer || enemy.isSuppressor) && (
                      <div 
                        className="absolute rounded-full opacity-20 pointer-events-none" 
                        style={{
                          left: 12 - (enemy.debuffRange || 80),
                          top: 12 - (enemy.debuffRange || 80),
                          width: (enemy.debuffRange || 80) * 2,
                          height: (enemy.debuffRange || 80) * 2,
                          background: enemy.isJammer ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' : 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
                        }}
                      />
                    )}
                    <div className={enemySize + ' ' + enemyColor + ' rounded-sm transform rotate-45'} style={{ boxShadow: enemyShadow }} />
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded"><div className="h-full bg-green-500 rounded enemy-health-bar" style={{width: (enemy.health / enemy.maxHealth * 100) + '%'}} /></div>
                    {/* 상태이상 표시 */}
                    {isBurning && <div className="absolute -top-4 left-0 text-xs burning-effect">🔥</div>}
                    {isSlowed && <div className="absolute -top-4 right-0 text-xs slowed-effect">❄️</div>}
                    {/* 적 타입 표시 */}
                    {enemy.isBoss && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">👑</div>}
                    {enemy.isElite && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">⭐</div>}
                    {enemy.isJammer && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">📡</div>}
                    {enemy.isSuppressor && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">🛡️</div>}
                  </div>
                );
              })}
              
              {projectiles.map(proj => <div key={proj.id} className="absolute w-3 h-3 rounded-full" style={{ left: proj.x - 6, top: proj.y - 6, background: proj.color, boxShadow: '0 0 10px ' + proj.color + ', 0 0 20px ' + proj.color }} />)}
              
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
          
          <div className="flex-1 min-w-[280px] space-y-3">
            <div className="flex gap-2">
              <button type="button" onClick={drawRandomNeon} disabled={gold < 20} className="flex-1 btn-neon px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-pink-400/30">🎲 뽑기 (20G)</button>
              <button type="button" onClick={startWave} disabled={isPlaying} className="flex-1 btn-neon px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30">{isPlaying ? '전투 중...' : '▶ 시작'}</button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={combineNeons} disabled={selectedInventory.length !== 3 || selectedInventory[0]?.tier >= 4} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm">⚡ 선택 조합</button>
              <button type="button" onClick={combineAllNeons} disabled={getCombinableCount() === 0} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30 text-sm">🔄 전체 조합 ({getCombinableCount()})</button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={combineTowers} disabled={!canCombineTowers} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30 text-sm">🔮 타워 조합 ({selectedTowers.length}/3)</button>
              <button type="button" onClick={sellSelectedTowers} disabled={selectedTowers.length === 0} className="flex-1 btn-neon px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30 text-sm">💰 판매 (+{totalSellPrice}G)</button>
            </div>
            
            <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
              <h3 className="text-sm font-bold mb-2 text-gray-400">📦 인벤토리 ({inventory.length}) - 클릭: 선택 / 드래그: 배치</h3>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {inventory.map(neon => {
                  const isSelected = selectedInventory.some(n => n.id === neon.id);
                  const elementInfo = getElementInfo(neon.element);
                  return (
                    <div key={neon.id} onMouseDown={(e) => handleDragStart(e, neon)} onTouchStart={(e) => handleDragStart(e, neon)} className={'inventory-item w-10 h-10 rounded-lg flex flex-col items-center justify-center border-2 ' + (isSelected ? 'border-white selected' : 'border-transparent')} style={{ background: 'radial-gradient(circle, ' + neon.color + '80 0%, ' + neon.color + '40 70%)', color: neon.color, boxShadow: isSelected ? '0 0 15px ' + neon.color : 'none' }} title={neon.name + '\nTier ' + neon.tier + '\n' + elementInfo.icon + ' ' + elementInfo.name + ': ' + elementInfo.desc}>
                      <span className="text-sm">{elementInfo.icon}</span>
                      <span className="text-xs font-black text-white drop-shadow">T{neon.tier}</span>
                    </div>
                  );
                })}
              </div>
              {inventory.length === 0 && <p className="text-gray-500 text-center text-sm py-4">뽑기로 네온을 획득하세요!</p>}
            </div>
            
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
          </div>
        </div>
        
        {draggingNeon && isDragging && (
          <div className="fixed pointer-events-none z-50" style={{ left: dragPosition.x - 20, top: dragPosition.y - 20, width: 40, height: 40 }}>
            <div className="w-full h-full rounded-lg flex items-center justify-center neon-glow" style={{ background: 'radial-gradient(circle, ' + draggingNeon.color + ' 0%, ' + draggingNeon.color + '80 50%, transparent 70%)', color: draggingNeon.color }}>
              <span className="text-sm font-black text-white drop-shadow-lg">{getElementInfo(draggingNeon.element).icon}</span>
            </div>
          </div>
        )}
        
        {/* 모바일 배치 메뉴 */}
        {placementMode && (
          <div 
            className="fixed inset-0 z-40"
            onClick={(e) => {
              if (e.target === e.currentTarget) cancelPlacementMode();
            }}
          >
            {/* 선택된 타일 위치에 메뉴 표시 */}
            {(() => {
              const mapRect = mapRef.current?.getBoundingClientRect();
              if (!mapRect) return null;
              
              const centerX = mapRect.left + placementMode.gridX * TILE_SIZE + TILE_SIZE / 2;
              const centerY = mapRect.top + placementMode.gridY * TILE_SIZE + TILE_SIZE / 2;
              const availableElements = getAvailableElements();
              
              // Step 1: 속성 선택
              if (placementMode.step === 'element') {
                const elements = [
                  { id: 0, icon: '🔥', color: '#FF6B6B', name: '화염' },
                  { id: 1, icon: '❄️', color: '#45B7D1', name: '냉기' },
                  { id: 2, icon: '⚡', color: '#FFD93D', name: '전격' },
                  { id: 3, icon: '🌪️', color: '#96E6A1', name: '질풍' },
                  { id: 4, icon: '🌀', color: '#DDA0DD', name: '공허' },
                  { id: 5, icon: '💎', color: '#C0C0C0', name: '광휘' },
                ];
                
                return (
                  <div className="absolute" style={{ left: centerX, top: centerY }}>
                    {/* 중앙 취소 버튼 */}
                    <div 
                      className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all"
                      style={{ left: -24, top: -24 }}
                      onClick={cancelPlacementMode}
                    >
                      <span className="text-xl">✕</span>
                    </div>
                    
                    {/* 6개 속성 원형 배치 */}
                    {elements.map((elem, index) => {
                      const angle = (index * 60 - 90) * (Math.PI / 180);
                      const radius = 65;
                      const x = Math.cos(angle) * radius - 22;
                      const y = Math.sin(angle) * radius - 22;
                      const hasElement = availableElements[elem.id];
                      
                      return (
                        <div
                          key={elem.id}
                          className={'absolute w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all ' + (hasElement ? 'hover:scale-110' : 'opacity-30 cursor-not-allowed')}
                          style={{
                            left: x,
                            top: y,
                            background: hasElement ? `radial-gradient(circle, ${elem.color} 0%, ${elem.color}80 70%)` : '#333',
                            boxShadow: hasElement ? `0 0 15px ${elem.color}80` : 'none',
                            border: `2px solid ${hasElement ? elem.color : '#555'}`,
                          }}
                          onClick={() => hasElement && handleElementSelect(elem.id)}
                        >
                          <span className="text-lg">{elem.icon}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              // Step 2: 티어 선택
              if (placementMode.step === 'tier') {
                const byTier = getInventoryByElement(placementMode.element);
                const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
                const elementInfo = getElementInfo(placementMode.element);
                const neonData = NEON_TYPES[1];
                const elemColor = neonData.colors[placementMode.element];
                
                return (
                  <div className="absolute" style={{ left: centerX, top: centerY }}>
                    {/* 중앙 뒤로가기 버튼 */}
                    <div 
                      className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all"
                      style={{ left: -24, top: -24, borderColor: elemColor }}
                      onClick={() => setPlacementMode(prev => ({ ...prev, step: 'element', element: null }))}
                    >
                      <span className="text-xl">{elementInfo.icon}</span>
                    </div>
                    
                    {/* 보유한 티어 원형 배치 */}
                    {tiers.map((tier, index) => {
                      const count = byTier[tier].length;
                      const angle = (index * (360 / tiers.length) - 90) * (Math.PI / 180);
                      const radius = 65;
                      const x = Math.cos(angle) * radius - 22;
                      const y = Math.sin(angle) * radius - 22;
                      const tierColor = NEON_TYPES[tier].colors[placementMode.element];
                      
                      return (
                        <div
                          key={tier}
                          className="absolute w-11 h-11 rounded-full flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-all"
                          style={{
                            left: x,
                            top: y,
                            background: `radial-gradient(circle, ${tierColor} 0%, ${tierColor}80 70%)`,
                            boxShadow: `0 0 15px ${tierColor}80`,
                            border: `2px solid ${tierColor}`,
                          }}
                          onClick={() => handleTierSelect(tier)}
                        >
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
        
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-8 rounded-2xl text-center border border-red-500/50" style={{boxShadow: '0 0 50px rgba(255, 0, 0, 0.3)'}}>
              <h2 className="text-4xl font-black text-red-500 mb-4">GAME OVER</h2>
              <p className="text-xl text-gray-300 mb-2">Stage {stage} - Wave {wave}까지 도달!</p>
              <p className="text-gray-500 mb-6">처치한 적: {killedCount + ((stage - 1) * 5 + wave - 1) * 50}</p>
              <button type="button" onClick={resetGame} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all">🔄 다시 시작</button>
            </div>
          </div>
        )}
        
        {showStageTransition && (() => {
          const nextConfig = getPathConfig(stage + 1);
          return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <div className="text-center">
                <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'neonPulse 1s ease-in-out infinite' }}>🎉 STAGE {stage} CLEAR! 🎉</h2>
                <p className="text-2xl text-cyan-300 mb-2">Stage {stage + 1} 준비 중...</p>
                <p className="text-yellow-400 mb-2">⚠️ 경로: 🚪 {nextConfig.starts}개 → 🏠 {nextConfig.ends}개</p>
                <p className="text-gray-500">타워가 초기화됩니다</p>
              </div>
            </div>
          );
        })()}
        
        {/* 도움말 모달 */}
        {showHelp && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}
          >
            <div className="bg-gray-900 rounded-2xl border border-cyan-500/50 max-w-md w-full max-h-[80vh] overflow-y-auto" style={{boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)'}}>
              <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-black text-cyan-400">📖 게임 도움말</h2>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-all"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* 기본 조작 */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h3 className="text-sm font-bold mb-2 text-pink-400">🎮 기본 조작</h3>
                  <div className="text-xs text-gray-300 space-y-1">
                    <p>• <span className="text-pink-400">뽑기 (20G)</span>: 랜덤 Tier 1 네온 획득</p>
                    <p>• <span className="text-yellow-400">선택 조합</span>: 인벤토리에서 같은 타입 3개 선택 후 조합</p>
                    <p>• <span className="text-amber-400">전체 조합</span>: 조합 가능한 모든 타워 자동 조합</p>
                    <p>• <span className="text-cyan-400">배치 (PC)</span>: 인벤토리에서 드래그하여 맵에 배치</p>
                    <p>• <span className="text-green-400">배치 (모바일)</span>: 빈 타일 탭 → 속성 선택 → 티어 선택</p>
                    <p>• <span className="text-emerald-400">타워 조합</span>: 맵에서 같은 타워 3개 선택 후 조합</p>
                    <p>• <span className="text-red-400">판매</span>: 맵의 타워 선택 후 판매 (50% 환급)</p>
                  </div>
                </div>
                
                {/* 속성 정보 */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h3 className="text-sm font-bold mb-2 text-purple-400">🔮 속성 정보</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">🔥</span>
                      <div>
                        <p className="text-red-400 font-bold">화염</p>
                        <p className="text-gray-500">지속 데미지</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">❄️</span>
                      <div>
                        <p className="text-blue-400 font-bold">냉기</p>
                        <p className="text-gray-500">이동속도 감소</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">⚡</span>
                      <div>
                        <p className="text-yellow-400 font-bold">전격</p>
                        <p className="text-gray-500">체인 라이트닝</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">🌪️</span>
                      <div>
                        <p className="text-green-400 font-bold">질풍</p>
                        <p className="text-gray-500">고데미지 + 넉백</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">🌀</span>
                      <div>
                        <p className="text-purple-400 font-bold">공허</p>
                        <p className="text-gray-500">균형 공격</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">💎</span>
                      <div>
                        <p className="text-gray-300 font-bold">광휘</p>
                        <p className="text-gray-500">균형 공격</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 적 타입 */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <h3 className="text-sm font-bold mb-2 text-red-400">👾 적 타입</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="w-4 h-4 bg-purple-600 rounded-sm rotate-45"></span>
                      <div>
                        <p className="text-purple-400 font-bold">일반</p>
                        <p className="text-gray-500">기본 적</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="w-4 h-4 bg-cyan-400 rounded-sm rotate-45"></span>
                      <div>
                        <p className="text-cyan-400 font-bold">빠름</p>
                        <p className="text-gray-500">60% HP, 고속</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">⭐</span>
                      <div>
                        <p className="text-orange-400 font-bold">엘리트</p>
                        <p className="text-gray-500">250% HP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">👑</span>
                      <div>
                        <p className="text-red-400 font-bold">보스</p>
                        <p className="text-gray-500">800%+ HP</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">📡</span>
                      <div>
                        <p className="text-violet-400 font-bold">방해자</p>
                        <p className="text-gray-500">타워 공속⬇️</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                      <span className="text-lg">🛡️</span>
                      <div>
                        <p className="text-pink-400 font-bold">억제자</p>
                        <p className="text-gray-500">타워 공격력⬇️</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 팁 */}
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
      </div>
    );
  };

  ReactDOM.createRoot(document.getElementById('root')).render(<NeonDefense />);
