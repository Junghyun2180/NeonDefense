// useInventory - 인벤토리 및 조합 관리 훅
// settings: { autoCombine, autoSupportCombine, t4RolePresets } — useSettings 훅 결과
const useInventory = (gameState, settings = {}) => {
    const { useState, useCallback, useMemo } = React;

    const { gold, setGold, towers, setTowers, supportTowers, setSupportTowers, setEffects, permanentBuffs = {}, gameStats, setGameStats } = gameState;
    const { autoCombine = false, autoSupportCombine = false, t4RolePresets = {} } = settings;

    // 통계 업데이트 헬퍼
    const updateStats = useCallback((updater) => {
        if (setGameStats) setGameStats(updater);
    }, [setGameStats]);

    // 일반 타워 인벤토리
    const [inventory, setInventory] = useState([]);
    const [selectedInventory, setSelectedInventory] = useState([]);
    const [selectedTowers, setSelectedTowers] = useState([]);

    // 서포트 타워 인벤토리
    const [supportInventory, setSupportInventory] = useState([]);
    const [selectedSupportInventory, setSelectedSupportInventory] = useState([]);
    const [selectedSupportTowers, setSelectedSupportTowers] = useState([]);

    // T4 역할 선택 대기 상태
    const [pendingT4Choice, setPendingT4Choice] = useState(null);

    // 10연뽑 결과 오버레이 (자동조합 ON에도 원본 결과 표시)
    // shape: { kind: 'tower'|'support', items: [...], pityApplied: bool, autoCombineActive: bool }
    const [lastDrawResult, setLastDrawResult] = useState(null);
    const clearLastDrawResult = useCallback(() => setLastDrawResult(null), []);

    const isInventoryFull = inventory.length >= ECONOMY.maxInventory;
    const isSupportInventoryFull = supportInventory.length >= ECONOMY.maxSupportInventory;

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

    // ===== 공용 선택 토글 (통합) =====
    // matchKey: 같은 타입 검증용 키 ('colorIndex' | 'supportType')
    const toggleSelect = useCallback((item, setSelected, clearOthers, matchKey = 'colorIndex', maxCount = 3) => {
        clearOthers.forEach(setter => setter([]));
        setSelected(prev => {
            const isSelected = prev.some(n => n.id === item.id);
            if (isSelected) return prev.filter(n => n.id !== item.id);
            if (prev.length >= maxCount) return prev;
            // 같은 티어, 같은 타입(속성 or 서포트 종류)만 선택 가능
            if (prev.length > 0 && (prev[0].tier !== item.tier || prev[0][matchKey] !== item[matchKey])) return prev;
            return [...prev, item];
        });
    }, []);

    const clearAllSelections = useCallback(() => {
        setSelectedInventory([]);
        setSelectedTowers([]);
        setSelectedSupportInventory([]);
        setSelectedSupportTowers([]);
    }, []);

    // 일반 타워 선택 (인벤토리)
    const toggleInventorySelect = useCallback((neon) => {
        toggleSelect(neon, setSelectedInventory, [setSelectedTowers, setSelectedSupportInventory, setSelectedSupportTowers], 'colorIndex');
    }, [toggleSelect]);

    // 일반 타워 선택 (맵) - 인벤토리 자동 선택 기능 추가
    const toggleTowerSelect = useCallback((tower) => {
        // 다른 타입 선택 초기화
        setSelectedSupportInventory([]);
        setSelectedSupportTowers([]);

        setSelectedTowers(prev => {
            const isDeselecting = prev.some(t => t.id === tower.id);

            if (isDeselecting) {
                // 선택 해제
                setSelectedInventory([]);
                return prev.filter(t => t.id !== tower.id);
            }

            // 새로 선택하는 경우
            if (prev.length >= 3) return prev; // 최대 3개

            // 같은 티어, 같은 속성만 선택 가능
            if (prev.length > 0 && (prev[0].tier !== tower.tier || prev[0].colorIndex !== tower.colorIndex)) {
                return prev;
            }

            const newSelected = [...prev, tower];
            const needCount = 3 - newSelected.length; // 조합에 필요한 타워 수

            if (needCount > 0) {
                // 인벤토리에서 같은 티어/속성 타워 자동 선택
                const matchingInventory = inventory.filter(
                    n => n.tier === tower.tier && n.colorIndex === tower.colorIndex
                );

                // 필요한 만큼만 선택
                const toSelect = matchingInventory.slice(0, needCount);
                setSelectedInventory(toSelect);
            }

            return newSelected;
        });
    }, [inventory]);

    // 서포트 타워 선택 (인벤토리)
    const toggleSupportInventorySelect = useCallback((support) => {
        toggleSelect(support, setSelectedSupportInventory, [setSelectedInventory, setSelectedTowers, setSelectedSupportTowers], 'supportType');
    }, [toggleSelect]);

    // 서포트 타워 선택 (맵) - 인벤토리 자동 선택 기능 추가
    const toggleSupportTowerSelect = useCallback((support) => {
        // 다른 타입 선택 초기화
        setSelectedInventory([]);
        setSelectedTowers([]);

        setSelectedSupportTowers(prev => {
            const isDeselecting = prev.some(t => t.id === support.id);

            if (isDeselecting) {
                // 선택 해제
                setSelectedSupportInventory([]);
                return prev.filter(t => t.id !== support.id);
            }

            // 새로 선택하는 경우
            if (prev.length >= 3) return prev; // 최대 3개

            // 같은 티어, 같은 타입만 선택 가능
            if (prev.length > 0 && (prev[0].tier !== support.tier || prev[0].supportType !== support.supportType)) {
                return prev;
            }

            const newSelected = [...prev, support];
            const needCount = 3 - newSelected.length; // 조합에 필요한 타워 수

            if (needCount > 0) {
                // 인벤토리에서 같은 티어/타입 서포트 타워 자동 선택
                const matchingInventory = supportInventory.filter(
                    s => s.tier === support.tier && s.supportType === support.supportType
                );

                // 필요한 만큼만 선택
                const toSelect = matchingInventory.slice(0, needCount);
                setSelectedSupportInventory(toSelect);
            }

            return newSelected;
        });
    }, [supportInventory]);

    // ===== 뽑기 =====
    // 영구 버프 할인 적용 (BuffHelper 사용)
    const drawDiscount = BuffHelper.getDrawDiscount(permanentBuffs);
    const effectiveDrawCost = Math.max(1, ECONOMY.drawCost - drawDiscount);

    // Prism 확률 및 Pity 시스템
    // - 기본 확률 0.5%
    // - 200연뽑 도달 시 다음 뽑기 확정 Prism
    // - Prism 획득 시 카운터 리셋
    const PRISM_BASE_CHANCE = 0.005;
    const PRISM_PITY_THRESHOLD = 200;

    const rollPrism = (forcedPrism) => {
        if (forcedPrism) return true;
        return Math.random() < PRISM_BASE_CHANCE;
    };

    const drawOne = () => {
        const colorIndex = Math.floor(Math.random() * 6);
        // Pity 카운터 읽기
        let pityNow = typeof CollectionSystem !== 'undefined' ? CollectionSystem.getPityCounter() : 0;
        const forcedPrism = pityNow + 1 >= PRISM_PITY_THRESHOLD;
        const isPrism = rollPrism(forcedPrism);
        const n = TowerSystem.create(1, colorIndex, { isPrism });
        if (typeof CollectionSystem !== 'undefined') {
            if (isPrism) {
                CollectionSystem.resetPity();
                CollectionSystem.recordPrismAcquired();
            } else {
                CollectionSystem.incrementPity(1);
            }
        }
        return { tower: n, isPrism };
    };

    // 10연뽑 Pity: 10회 전부 T1이면 마지막을 T2로 승급
    const applyTenPullPity = (neons) => {
        if (neons.length < 10) return neons;
        const hasT2Plus = neons.some(n => n.tier >= 2);
        if (hasT2Plus) return neons;
        // 마지막 T1을 T2로 변경 (isPrism 계승)
        const last = neons[neons.length - 1];
        const upgraded = TowerSystem.create(2, last.colorIndex, { isPrism: last.isPrism });
        upgraded.id = last.id;
        neons[neons.length - 1] = upgraded;
        return neons;
    };

    const drawRandomNeon = useCallback(() => {
        const cost = Math.max(1, ECONOMY.drawCost - BuffHelper.getDrawDiscount(permanentBuffs));
        if (gold < cost || inventory.length >= ECONOMY.maxInventory) return;
        const { tower: newNeon, isPrism } = drawOne();
        setInventory(prev => {
            const next = [...prev, newNeon];
            return autoCombine ? TowerSystem.combineAll(next) : next;
        });
        setGold(prev => prev - cost);
        updateStats(prev => ({
            ...prev,
            towersDrawn: prev.towersDrawn + 1,
            totalGoldSpent: prev.totalGoldSpent + cost,
        }));
        soundManager.playDraw();
        if (isPrism && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('neon-prism-drop', { detail: { tower: newNeon } }));
        }
    }, [gold, inventory.length, setGold, permanentBuffs, updateStats, autoCombine]);

    // 10연뽑 (한 번에 최대 10회, Pity 포함)
    const drawRandomNeon10 = useCallback(() => {
        const cost = Math.max(1, ECONOMY.drawCost - BuffHelper.getDrawDiscount(permanentBuffs));
        const remainingSlots = ECONOMY.maxInventory - inventory.length;
        const maxByGold = Math.floor(gold / cost);
        const count = Math.min(10, remainingSlots, maxByGold);
        if (count <= 0) return;

        const baseId = Date.now();
        let newNeons = [];
        let prismCount = 0;
        for (let i = 0; i < count; i++) {
            const { tower, isPrism } = drawOne();
            tower.id = baseId + i + Math.random();
            newNeons.push(tower);
            if (isPrism) prismCount++;
        }
        // 10회 전부 T1이면 마지막 T2 승급 (소규모 Pity)
        const beforePity = newNeons.map(n => n.tier);
        if (count === 10) newNeons = applyTenPullPity(newNeons);
        const pityApplied = count === 10 && beforePity.every(t => t === 1) && newNeons[newNeons.length - 1].tier === 2;

        // 결과 오버레이용 스냅샷 (autoCombine 적용 전)
        setLastDrawResult({
            kind: 'tower',
            items: newNeons.map(n => ({
                id: n.id, tier: n.tier, element: n.element ?? n.colorIndex,
                colorIndex: n.colorIndex, color: n.color, name: n.name, isPrism: n.isPrism,
            })),
            pityApplied,
            autoCombineActive: !!autoCombine,
            count,
        });

        setInventory(prev => {
            const next = [...prev, ...newNeons];
            return autoCombine ? TowerSystem.combineAll(next) : next;
        });
        setGold(prev => prev - cost * count);
        updateStats(prev => ({
            ...prev,
            towersDrawn: prev.towersDrawn + count,
            totalGoldSpent: prev.totalGoldSpent + cost * count,
        }));
        soundManager.playDraw();
        if (prismCount > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('neon-prism-drop', { detail: { count: prismCount } }));
        }
    }, [gold, inventory.length, setGold, permanentBuffs, updateStats, autoCombine]);

    const drawRandomSupport = useCallback(() => {
        if (gold < ECONOMY.supportDrawCost || supportInventory.length >= ECONOMY.maxSupportInventory) return;
        const supportType = Math.floor(Math.random() * 4);
        const newSupport = TowerSystem.createSupport(1, supportType);
        setSupportInventory(prev => {
            const next = [...prev, newSupport];
            return autoSupportCombine ? TowerSystem.combineAllSupport(next) : next;
        });
        setGold(prev => prev - ECONOMY.supportDrawCost);
        updateStats(prev => ({
            ...prev,
            supportTowersDrawn: prev.supportTowersDrawn + 1,
            totalGoldSpent: prev.totalGoldSpent + ECONOMY.supportDrawCost,
        }));
        soundManager.playDraw();
    }, [gold, supportInventory.length, setGold, updateStats, autoSupportCombine]);

    // 서포트 10연뽑
    const drawRandomSupport10 = useCallback(() => {
        const cost = ECONOMY.supportDrawCost;
        const remainingSlots = ECONOMY.maxSupportInventory - supportInventory.length;
        const maxByGold = Math.floor(gold / cost);
        const count = Math.min(10, remainingSlots, maxByGold);
        if (count <= 0) return;

        const baseId = Date.now();
        const newSupports = [];
        for (let i = 0; i < count; i++) {
            const supportType = Math.floor(Math.random() * 4);
            const s = TowerSystem.createSupport(1, supportType);
            s.id = baseId + i + Math.random();
            newSupports.push(s);
        }

        // 결과 오버레이용 스냅샷 (autoSupportCombine 적용 전)
        setLastDrawResult({
            kind: 'support',
            items: newSupports.map(s => ({
                id: s.id, tier: s.tier, supportType: s.supportType, color: s.color, name: s.name,
            })),
            pityApplied: false,
            autoCombineActive: !!autoSupportCombine,
            count,
        });

        setSupportInventory(prev => {
            const next = [...prev, ...newSupports];
            return autoSupportCombine ? TowerSystem.combineAllSupport(next) : next;
        });
        setGold(prev => prev - cost * count);
        updateStats(prev => ({
            ...prev,
            supportTowersDrawn: prev.supportTowersDrawn + count,
            totalGoldSpent: prev.totalGoldSpent + cost * count,
        }));
        soundManager.playDraw();
    }, [gold, supportInventory.length, setGold, updateStats, autoSupportCombine]);

    // ===== 조합 =====
    const combineNeons = useCallback(() => {
        if (selectedInventory.length !== 3) return;
        const result = TowerSystem.combine(selectedInventory);
        if (!result) return;

        // T3 → T4 조합 시 역할 선택 모달 표시 (프리셋 있으면 자동 처리)
        if (result.pending) {
            const presetRole = t4RolePresets[result.element];
            if (presetRole) {
                const t4Tower = TowerSystem.createT4WithRole(result.element, presetRole);
                if (t4Tower) {
                    const idsToRemove = selectedInventory.map(n => n.id);
                    setInventory(prev => [...prev.filter(n => !idsToRemove.includes(n.id)), t4Tower]);
                    setSelectedInventory([]);
                    soundManager.playCombine();
                    return;
                }
            }
            setPendingT4Choice({
                ...result,
                source: 'inventory',
                itemIds: selectedInventory.map(n => n.id),
            });
            return;
        }

        const idsToRemove = selectedInventory.map(n => n.id);
        setInventory(prev => [...prev.filter(n => !idsToRemove.includes(n.id)), result]);
        setSelectedInventory([]);
        soundManager.playCombine();
    }, [selectedInventory, t4RolePresets]);

    const combineAllNeons = useCallback(() => {
        setInventory(prev => TowerSystem.combineAll(prev));
        setSelectedInventory([]);
        soundManager.playCombine();
    }, []);

    const combineTowers = useCallback(() => {
        const totalSelected = selectedTowers.length + selectedInventory.length;
        if (totalSelected !== 3 || selectedTowers.length === 0) return;

        // 맵 타워 + 인벤토리 타워 합치기
        const allItems = [...selectedTowers, ...selectedInventory];
        const result = TowerSystem.combine(allItems);
        if (!result) return;

        // T3 → T4 조합 시 역할 선택 모달 표시 (프리셋 있으면 자동 처리)
        if (result.pending) {
            const firstTower = selectedTowers[0];
            const presetRole = t4RolePresets[result.element];
            if (presetRole) {
                const t4Tower = TowerSystem.createT4WithRole(result.element, presetRole);
                if (t4Tower) {
                    const placedTower = TowerSystem.placeOnGrid(t4Tower, firstTower.gridX, firstTower.gridY);
                    const mapIds = selectedTowers.map(t => t.id);
                    const invIds = selectedInventory.map(t => t.id);
                    setTowers(prev => [...prev.filter(t => !mapIds.includes(t.id)), placedTower]);
                    setInventory(prev => prev.filter(t => !invIds.includes(t.id)));
                    setSelectedTowers([]);
                    setSelectedInventory([]);
                    setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: t4Tower.color }]);
                    soundManager.playCombine();
                    return;
                }
            }
            setPendingT4Choice({
                ...result,
                source: 'map',
                itemIds: allItems.map(t => t.id),
                gridX: firstTower.gridX,
                gridY: firstTower.gridY,
            });
            return;
        }

        const firstTower = selectedTowers[0];
        const placedTower = TowerSystem.placeOnGrid(result, firstTower.gridX, firstTower.gridY);

        // 맵 타워 제거
        const towerIdsToRemove = selectedTowers.map(t => t.id);
        setTowers(prev => prev.filter(t => !towerIdsToRemove.includes(t.id)));

        // 인벤토리 타워 제거
        const inventoryIdsToRemove = selectedInventory.map(t => t.id);
        setInventory(prev => prev.filter(t => !inventoryIdsToRemove.includes(t.id)));

        // 새 타워 추가
        setTowers(prev => [...prev, placedTower]);

        setSelectedTowers([]);
        setSelectedInventory([]);
        setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: result.color }]);
        soundManager.playCombine();
    }, [selectedTowers, selectedInventory, setTowers, setInventory, setEffects, t4RolePresets]);

    // T4 역할 선택 완료 핸들러
    // rememberChoice=true 시 settings.setT4RolePreset 호출 (App.jsx에서 주입)
    const confirmT4Role = useCallback((roleId, rememberChoice = false) => {
        if (!pendingT4Choice) return;

        if (rememberChoice && typeof settings.setT4RolePreset === 'function') {
            settings.setT4RolePreset(pendingT4Choice.element, roleId);
        }

        const t4Tower = TowerSystem.createT4WithRole(pendingT4Choice.element, roleId);
        if (!t4Tower) {
            setPendingT4Choice(null);
            return;
        }

        if (pendingT4Choice.source === 'inventory') {
            setInventory(prev => [...prev.filter(n => !pendingT4Choice.itemIds.includes(n.id)), t4Tower]);
            setSelectedInventory([]);
        } else if (pendingT4Choice.source === 'map') {
            const placedTower = TowerSystem.placeOnGrid(t4Tower, pendingT4Choice.gridX, pendingT4Choice.gridY);
            // 맵 타워와 인벤토리 타워 모두 제거
            setTowers(prev => prev.filter(t => !pendingT4Choice.itemIds.includes(t.id)));
            setInventory(prev => prev.filter(n => !pendingT4Choice.itemIds.includes(n.id)));
            // 새 타워 배치
            setTowers(prev => [...prev, placedTower]);
            setSelectedTowers([]);
            setSelectedInventory([]);
            setEffects(prev => [...prev, {
                id: Date.now(),
                x: pendingT4Choice.gridX * TILE_SIZE + TILE_SIZE / 2,
                y: pendingT4Choice.gridY * TILE_SIZE + TILE_SIZE / 2,
                type: 'explosion',
                color: t4Tower.color
            }]);
        }

        setPendingT4Choice(null);
        soundManager.playCombine();
    }, [pendingT4Choice, setTowers, setEffects]);

    // T4 역할 선택 취소 핸들러
    const cancelT4Choice = useCallback(() => {
        setPendingT4Choice(null);
    }, []);

    const sellSelectedTowers = useCallback(() => {
        if (selectedTowers.length === 0) return;
        const totalRefund = selectedTowers.reduce((sum, t) => sum + getTowerSellPrice(t.tier), 0);
        const idsToRemove = selectedTowers.map(t => t.id);
        setTowers(prev => prev.filter(t => !idsToRemove.includes(t.id)));
        setGold(prev => prev + totalRefund);
        setSelectedTowers([]);
    }, [selectedTowers, setTowers, setGold]);

    // ===== 서포트 조합/판매 =====
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
    }, [selectedSupportTowers, setSupportTowers, setEffects]);

    const sellSelectedSupportTowers = useCallback(() => {
        if (selectedSupportTowers.length === 0) return;
        const totalRefund = selectedSupportTowers.reduce((sum, t) => sum + TowerSystem.getSupportSellPrice(t.tier), 0);
        const idsToRemove = selectedSupportTowers.map(t => t.id);
        setSupportTowers(prev => prev.filter(t => !idsToRemove.includes(t.id)));
        setGold(prev => prev + totalRefund);
        setSelectedSupportTowers([]);
    }, [selectedSupportTowers, setSupportTowers, setGold]);

    // ===== 계산된 값 =====
    const totalSellPrice = useMemo(() =>
        selectedTowers.reduce((sum, t) => sum + getTowerSellPrice(t.tier), 0),
        [selectedTowers]
    );

    const canCombineTowers = useMemo(() => {
        const totalSelected = selectedTowers.length + selectedInventory.length;
        return totalSelected === 3 && selectedTowers.length > 0 && selectedTowers[0]?.tier < 4;
    }, [selectedTowers, selectedInventory]);

    const totalSupportSellPrice = useMemo(() =>
        selectedSupportTowers.reduce((sum, t) => sum + TowerSystem.getSupportSellPrice(t.tier), 0),
        [selectedSupportTowers]
    );

    const canCombineSupportTowers = selectedSupportTowers.length === 3 && selectedSupportTowers[0]?.tier < 3;

    // 치트용 직접 추가
    const addTowerToInventory = useCallback((tier, element) => {
        setInventory(prev => [...prev, TowerSystem.create(tier, element)]);
    }, []);

    const addSupportToInventory = useCallback((tier, supportType) => {
        setSupportInventory(prev => [...prev, TowerSystem.createSupport(tier, supportType)]);
    }, []);

    // resetGame 시 인벤토리 초기화
    const resetInventory = useCallback(() => {
        setInventory([]);
        setSelectedInventory([]);
        setSelectedTowers([]);
        setSupportInventory([]);
        setSelectedSupportInventory([]);
        setSelectedSupportTowers([]);
        setPendingT4Choice(null);
    }, []);

    // ===== 캐리오버 관련 =====

    // 캐리오버 타워를 인벤토리에 추가
    const addCarryoverTowers = useCallback((carriedTowers, carriedSupports) => {
        if (carriedTowers && carriedTowers.length > 0) {
            setInventory(carriedTowers);
        }
        if (carriedSupports && carriedSupports.length > 0) {
            setSupportInventory(carriedSupports);
        }
    }, []);

    // 새 스테이지용 인벤토리 클리어 (캐리오버 타워 제외, addCarryoverTowers에서 이미 처리)
    const clearInventoryForNewStage = useCallback(() => {
        // 캐리오버 타워는 이미 addCarryoverTowers에서 설정됨
        // 선택 상태만 초기화
        setSelectedInventory([]);
        setSelectedTowers([]);
        setSelectedSupportInventory([]);
        setSelectedSupportTowers([]);
        setPendingT4Choice(null);
    }, []);

    return {
        // 일반 타워
        inventory, setInventory,
        selectedInventory, setSelectedInventory,
        selectedTowers, setSelectedTowers,
        isInventoryFull,
        // 서포트 타워
        supportInventory, setSupportInventory,
        selectedSupportInventory, setSelectedSupportInventory,
        selectedSupportTowers, setSelectedSupportTowers,
        isSupportInventoryFull,
        // 헬퍼
        getInventoryByElement,
        getAvailableElements,
        clearAllSelections,
        // 선택 토글
        toggleInventorySelect,
        toggleTowerSelect,
        toggleSupportInventorySelect,
        toggleSupportTowerSelect,
        // 뽑기
        drawRandomNeon,
        drawRandomNeon10,
        drawRandomSupport,
        drawRandomSupport10,
        // 조합
        combineNeons,
        combineAllNeons,
        combineTowers,
        sellSelectedTowers,
        combineSupports,
        combineAllSupports,
        combineSupportTowers,
        sellSelectedSupportTowers,
        // 계산된 값
        totalSellPrice,
        canCombineTowers,
        totalSupportSellPrice,
        canCombineSupportTowers,
        // T4 역할 선택
        pendingT4Choice,
        confirmT4Role,
        cancelT4Choice,
        // 치트용
        addTowerToInventory,
        addSupportToInventory,
        resetInventory,
        // 캐리오버
        addCarryoverTowers,
        clearInventoryForNewStage,
        // 영구 버프 적용 비용
        effectiveDrawCost,
        // 10연뽑 결과 오버레이
        lastDrawResult,
        clearLastDrawResult,
    };
};

window.useInventory = useInventory;
