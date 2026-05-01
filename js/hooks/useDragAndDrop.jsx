// useDragAndDrop - 클릭 배치 및 모바일 배치 훅
const useDragAndDrop = (gameState, inventoryState, mapScale = 1) => {
    const { useState, useCallback, useRef, useEffect } = React;

    const { towers, setTowers, supportTowers, setSupportTowers, pathData, setGameStats } = gameState;

    // 통계 업데이트 헬퍼
    const updateStats = useCallback((updater) => {
        if (setGameStats) setGameStats(updater);
    }, [setGameStats]);
    const {
        inventory, setInventory,
        supportInventory, setSupportInventory,
        clearAllSelections,
        toggleInventorySelect,
        toggleSupportInventorySelect,
        getInventoryByElement,
    } = inventoryState;

    const [dropPreview, setDropPreview] = useState(null);

    // 모바일 배치 시스템 상태
    const [placementMode, setPlacementMode] = useState(null);

    // 클릭 기반 타워 배치 상태
    const [selectedTowerForPlacement, setSelectedTowerForPlacement] = useState(null);

    const mapRef = useRef(null);

    // ===== 타일 클릭 핸들러 (클릭 기반 배치 + 모바일 배치) =====
    const handleTileClick = useCallback((gridX, gridY) => {
        const isPath = pathData.paths.some(p => p.tiles.some(t => t.x === gridX && t.y === gridY));
        const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
        const hasSupportTower = supportTowers.some(t => t.gridX === gridX && t.gridY === gridY);

        // 클릭 기반 타워 배치 모드
        if (selectedTowerForPlacement) {
            if (isPath || hasTower || hasSupportTower) {
                setSelectedTowerForPlacement(null);
                setDropPreview(null);
                return;
            }

            if (selectedTowerForPlacement.isSupport) {
                const newTower = TowerSystem.placeSupportOnGrid(selectedTowerForPlacement, gridX, gridY);
                setSupportTowers(prev => [...prev, newTower]);
                setSupportInventory(prev => prev.filter(n => n.id !== selectedTowerForPlacement.id));
                updateStats(prev => ({
                    ...prev,
                    supportTowersPlaced: (prev.supportTowersPlaced || 0) + 1,
                }));
            } else {
                const newTower = TowerSystem.placeOnGrid(selectedTowerForPlacement, gridX, gridY);
                setTowers(prev => [...prev, newTower]);
                setInventory(prev => prev.filter(n => n.id !== selectedTowerForPlacement.id));
                updateStats(prev => ({
                    ...prev,
                    towersPlaced: prev.towersPlaced + 1,
                    t4TowersCreated: newTower.tier === 4 ? prev.t4TowersCreated + 1 : prev.t4TowersCreated,
                }));
            }

            setSelectedTowerForPlacement(null);
            setDropPreview(null);
            return;
        }

        // 빈 타일 클릭 시 별도 UI 띄우지 않음 (구 모바일 원형 배치 메뉴 제거).
        // 타워 배치는 인벤토리 슬롯 클릭 → selectedTowerForPlacement 활성화 후 타일 클릭 흐름으로만 처리.
    }, [pathData, towers, supportTowers, selectedTowerForPlacement, setTowers, setInventory, setSupportTowers, setSupportInventory, updateStats]);

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
        // 통계: 타워 배치
        updateStats(prev => ({
            ...prev,
            towersPlaced: prev.towersPlaced + 1,
            t4TowersCreated: newTower.tier === 4 ? prev.t4TowersCreated + 1 : prev.t4TowersCreated,
        }));
        setPlacementMode(null);
    }, [placementMode, inventory, setTowers, setInventory, updateStats]);

    // ===== 인벤토리 클릭 핸들러 (배치 모드 활성화) =====
    // 같은 타워 다시 클릭 → 선택 해제 (토글).
    // 다른 타워 클릭 → 기존 선택 교체하여 새 타워에 포커스.
    const handleInventoryClick = useCallback((neon) => {
        setSelectedTowerForPlacement(prev => (prev && prev.id === neon.id ? null : neon));
        clearAllSelections();
        setDropPreview(null);
    }, [clearAllSelections]);

    // 타일 hover (mouse/pointer enter) 핸들러 — 배치 모드일 때만 dropPreview 갱신.
    // 좌표 산술 대신 타일 div 의 onPointerEnter 에서 직접 (gridX, gridY) 를 받기 때문에
    // mapScale / uniformScale / 부모 transform 등 어떤 변형이 있어도 정확함.
    const handleTileHover = useCallback((gridX, gridY) => {
        if (!selectedTowerForPlacement) return;
        const isPath = pathData.paths.some(p => p.tiles.some(t => t.x === gridX && t.y === gridY));
        const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
        const hasSupportTower = supportTowers.some(t => t.gridX === gridX && t.gridY === gridY);
        setDropPreview({ gridX, gridY, valid: !isPath && !hasTower && !hasSupportTower });
    }, [selectedTowerForPlacement, pathData, towers, supportTowers]);

    // 맵 영역 밖으로 나갈 때 dropPreview 정리
    const handleMapPointerLeave = useCallback(() => {
        if (!selectedTowerForPlacement) return;
        setDropPreview(null);
    }, [selectedTowerForPlacement]);

    // 배치 모드 외부 클릭 핸들러 — 맵 rect 밖 클릭이면 배치 취소
    const handleClickOutside = useCallback((e) => {
        if (!selectedTowerForPlacement || !mapRef.current) return;

        const rect = mapRef.current.getBoundingClientRect();
        const isInsideMap = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (!isInsideMap) {
            setSelectedTowerForPlacement(null);
            setDropPreview(null);
        }
    }, [selectedTowerForPlacement]);

    // 외부 클릭 리스너만 등록 (mousemove 좌표 산술은 per-tile hover 로 대체됨)
    useEffect(() => {
        if (!selectedTowerForPlacement) {
            setDropPreview(null);
            return;
        }
        // 외부 클릭 핸들러는 다음 프레임에 등록 (인벤토리 클릭 이벤트가 먼저 처리되도록)
        const timeoutId = setTimeout(() => {
            window.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('click', handleClickOutside);
        };
    }, [selectedTowerForPlacement, handleClickOutside]);

    // ESC 키로 배치 모드 취소
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedTowerForPlacement) {
                setSelectedTowerForPlacement(null);
                setDropPreview(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTowerForPlacement]);

    // 배치 모드 취소
    const cancelPlacementMode = useCallback(() => {
        setSelectedTowerForPlacement(null);
        setDropPreview(null);
    }, []);

    // resetGame 시 드래그 상태 초기화
    const resetDragState = useCallback(() => {
        setDropPreview(null);
        setPlacementMode(null);
        setSelectedTowerForPlacement(null);
    }, []);

    return {
        // 프리뷰 상태
        dropPreview,
        // 모바일 배치
        placementMode,
        setPlacementMode,
        // 클릭 배치
        selectedTowerForPlacement,
        cancelPlacementMode,
        // 핸들러
        handleInventoryClick,
        handleTileClick,
        handleTileHover,
        handleMapPointerLeave,
        handleElementSelect,
        handleTierSelect,
        // Ref
        mapRef,
        // 리셋
        resetDragState,
    };
};

window.useDragAndDrop = useDragAndDrop;
