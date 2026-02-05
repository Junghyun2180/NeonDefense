// useInventory - 인벤토리 및 조합 관리 훅
const useInventory = (gameState) => {
    const { useState, useCallback, useMemo } = React;

    const { gold, setGold, towers, setTowers, supportTowers, setSupportTowers, setEffects, permanentBuffs = {}, gameStats, setGameStats } = gameState;

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

    // 일반 타워 선택 (맵)
    const toggleTowerSelect = useCallback((tower) => {
        toggleSelect(tower, setSelectedTowers, [setSelectedInventory, setSelectedSupportInventory, setSelectedSupportTowers], 'colorIndex');
    }, [toggleSelect]);

    // 서포트 타워 선택 (인벤토리)
    const toggleSupportInventorySelect = useCallback((support) => {
        toggleSelect(support, setSelectedSupportInventory, [setSelectedInventory, setSelectedTowers, setSelectedSupportTowers], 'supportType');
    }, [toggleSelect]);

    // 서포트 타워 선택 (맵)
    const toggleSupportTowerSelect = useCallback((support) => {
        toggleSelect(support, setSelectedSupportTowers, [setSelectedInventory, setSelectedTowers, setSelectedSupportInventory], 'supportType');
    }, [toggleSelect]);

    // ===== 뽑기 =====
    // 영구 버프 할인 적용 (BuffHelper 사용)
    const drawDiscount = BuffHelper.getDrawDiscount(permanentBuffs);
    const effectiveDrawCost = Math.max(1, ECONOMY.drawCost - drawDiscount);

    const drawRandomNeon = useCallback(() => {
        const cost = Math.max(1, ECONOMY.drawCost - BuffHelper.getDrawDiscount(permanentBuffs));
        if (gold < cost || inventory.length >= ECONOMY.maxInventory) return;
        const colorIndex = Math.floor(Math.random() * 6);
        const newNeon = TowerSystem.create(1, colorIndex);
        setInventory(prev => [...prev, newNeon]);
        setGold(prev => prev - cost);
        // 통계: 타워 뽑기, 골드 사용
        updateStats(prev => ({
            ...prev,
            towersDrawn: prev.towersDrawn + 1,
            totalGoldSpent: prev.totalGoldSpent + cost,
        }));
        soundManager.playDraw();
    }, [gold, inventory.length, setGold, permanentBuffs, updateStats]);

    const drawRandomSupport = useCallback(() => {
        if (gold < ECONOMY.supportDrawCost || supportInventory.length >= ECONOMY.maxSupportInventory) return;
        const supportType = Math.floor(Math.random() * 4);
        const newSupport = TowerSystem.createSupport(1, supportType);
        setSupportInventory(prev => [...prev, newSupport]);
        setGold(prev => prev - ECONOMY.supportDrawCost);
        // 통계: 서포트 뽑기, 골드 사용
        updateStats(prev => ({
            ...prev,
            supportTowersDrawn: prev.supportTowersDrawn + 1,
            totalGoldSpent: prev.totalGoldSpent + ECONOMY.supportDrawCost,
        }));
        soundManager.playDraw();
    }, [gold, supportInventory.length, setGold, updateStats]);

    // ===== 조합 =====
    const combineNeons = useCallback(() => {
        if (selectedInventory.length !== 3) return;
        const result = TowerSystem.combine(selectedInventory);
        if (!result) return;

        // T3 → T4 조합 시 역할 선택 모달 표시
        if (result.pending) {
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

        // T3 → T4 조합 시 역할 선택 모달 표시
        if (result.pending) {
            const firstTower = selectedTowers[0];
            setPendingT4Choice({
                ...result,
                source: 'map',
                itemIds: selectedTowers.map(t => t.id),
                gridX: firstTower.gridX,
                gridY: firstTower.gridY,
            });
            return;
        }

        const firstTower = selectedTowers[0];
        const placedTower = TowerSystem.placeOnGrid(result, firstTower.gridX, firstTower.gridY);
        const idsToRemove = selectedTowers.map(t => t.id);
        setTowers(prev => [...prev.filter(t => !idsToRemove.includes(t.id)), placedTower]);
        setSelectedTowers([]);
        setEffects(prev => [...prev, { id: Date.now(), x: firstTower.x, y: firstTower.y, type: 'explosion', color: result.color }]);
        soundManager.playCombine();
    }, [selectedTowers, setTowers, setEffects]);

    // T4 역할 선택 완료 핸들러
    const confirmT4Role = useCallback((roleId) => {
        if (!pendingT4Choice) return;

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
            setTowers(prev => [...prev.filter(t => !pendingT4Choice.itemIds.includes(t.id)), placedTower]);
            setSelectedTowers([]);
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

    const canCombineTowers = selectedTowers.length === 3 && selectedTowers[0]?.tier < 4;

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
        drawRandomSupport,
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
    };
};

window.useInventory = useInventory;
