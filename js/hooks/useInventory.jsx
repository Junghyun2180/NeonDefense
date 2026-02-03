// useInventory - 인벤토리 및 조합 관리 훅
const useInventory = (gameState) => {
    const { useState, useCallback, useMemo } = React;

    const { gold, setGold, towers, setTowers, supportTowers, setSupportTowers, setEffects } = gameState;

    // 일반 타워 인벤토리
    const [inventory, setInventory] = useState([]);
    const [selectedInventory, setSelectedInventory] = useState([]);
    const [selectedTowers, setSelectedTowers] = useState([]);

    // 서포트 타워 인벤토리
    const [supportInventory, setSupportInventory] = useState([]);
    const [selectedSupportInventory, setSelectedSupportInventory] = useState([]);
    const [selectedSupportTowers, setSelectedSupportTowers] = useState([]);

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

    // ===== 공용 선택 토글 =====
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

    const clearAllSelections = useCallback(() => {
        setSelectedInventory([]);
        setSelectedTowers([]);
        setSelectedSupportInventory([]);
        setSelectedSupportTowers([]);
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

    // ===== 뽑기 =====
    const drawRandomNeon = useCallback(() => {
        if (gold < ECONOMY.drawCost || inventory.length >= ECONOMY.maxInventory) return;
        const colorIndex = Math.floor(Math.random() * 6);
        const newNeon = TowerSystem.create(1, colorIndex);
        setInventory(prev => [...prev, newNeon]);
        setGold(prev => prev - ECONOMY.drawCost);
        soundManager.playDraw();
    }, [gold, inventory.length, setGold]);

    const drawRandomSupport = useCallback(() => {
        if (gold < ECONOMY.supportDrawCost || supportInventory.length >= ECONOMY.maxSupportInventory) return;
        const supportType = Math.floor(Math.random() * 4);
        const newSupport = TowerSystem.createSupport(1, supportType);
        setSupportInventory(prev => [...prev, newSupport]);
        setGold(prev => prev - ECONOMY.supportDrawCost);
        soundManager.playDraw();
    }, [gold, supportInventory.length, setGold]);

    // ===== 조합 =====
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
    }, [selectedTowers, setTowers, setEffects]);

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
        // 치트용
        addTowerToInventory,
        addSupportToInventory,
        resetInventory,
    };
};

window.useInventory = useInventory;
