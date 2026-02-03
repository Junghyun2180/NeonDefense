// useDragAndDrop - 드래그 앤 드롭 및 모바일 배치 훅
const useDragAndDrop = (gameState, inventoryState) => {
    const { useState, useCallback, useRef, useEffect } = React;

    const { towers, setTowers, supportTowers, setSupportTowers, pathData } = gameState;
    const {
        inventory, setInventory,
        supportInventory, setSupportInventory,
        clearAllSelections,
        toggleInventorySelect,
        toggleSupportInventorySelect,
        getInventoryByElement,
    } = inventoryState;

    const [draggingNeon, setDraggingNeon] = useState(null);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [dropPreview, setDropPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // 모바일 배치 시스템 상태
    const [placementMode, setPlacementMode] = useState(null);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const mapRef = useRef(null);

    // ===== 모바일 배치 핸들러 =====
    const handleTileClick = useCallback((gridX, gridY) => {
        const isPath = pathData.paths.some(p => p.tiles.some(t => t.x === gridX && t.y === gridY));
        const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
        const hasSupportTower = supportTowers.some(t => t.gridX === gridX && t.gridY === gridY);
        if (isPath || hasTower || hasSupportTower) { setPlacementMode(null); return; }
        setPlacementMode({ gridX, gridY, step: 'element', element: null });
        clearAllSelections();
    }, [pathData, towers, supportTowers, clearAllSelections]);

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
    }, [placementMode, inventory, setTowers, setInventory]);

    // ===== 드래그 앤 드롭 =====
    const handleDragStart = useCallback((e, neon) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStartPos.current = { x: clientX, y: clientY };
        setDraggingNeon(neon);
        setDragPosition({ x: clientX, y: clientY });
        setIsDragging(false);
    }, []);

    const handleDragMove = useCallback((e) => {
        if (!draggingNeon) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const distance = calcDistance(clientX, clientY, dragStartPos.current.x, dragStartPos.current.y);
        if (distance > 10) {
            setIsDragging(true);
            clearAllSelections();
        }
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
    }, [draggingNeon, towers, supportTowers, pathData, isDragging, clearAllSelections]);

    const handleDragEnd = useCallback(() => {
        if (!draggingNeon) return;
        if (!isDragging) {
            const neon = draggingNeon;
            setDraggingNeon(null);
            setDropPreview(null);
            if (neon.isSupport) {
                toggleSupportInventorySelect(neon);
            } else {
                toggleInventorySelect(neon);
            }
            return;
        }
        if (dropPreview && dropPreview.valid) {
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
        setDraggingNeon(null);
        setDropPreview(null);
        setIsDragging(false);
    }, [draggingNeon, dropPreview, isDragging, toggleInventorySelect, toggleSupportInventorySelect, setTowers, setInventory, setSupportTowers, setSupportInventory]);

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

    // resetGame 시 드래그 상태 초기화
    const resetDragState = useCallback(() => {
        setDraggingNeon(null);
        setDropPreview(null);
        setPlacementMode(null);
    }, []);

    return {
        // 드래그 상태
        draggingNeon,
        dragPosition,
        dropPreview,
        isDragging,
        // 모바일 배치
        placementMode,
        setPlacementMode,
        // 핸들러
        handleDragStart,
        handleTileClick,
        handleElementSelect,
        handleTierSelect,
        // Ref
        mapRef,
        // 리셋
        resetDragState,
    };
};

window.useDragAndDrop = useDragAndDrop;
