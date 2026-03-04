// ControlPanel - 맵 우측 사이드 패널 (선택된 타워/서포트 정보만)
const ControlPanel = ({
    // 인벤토리 (조합용 카운트)
    inventory,
    selectedInventory,
    getElementInfo,
    selectedTowers,
    totalSellPrice,
    // 서포트
    selectedSupportInventory,
    selectedSupportTowers,
    totalSupportSellPrice,
}) => {
    const hasSelection = selectedTowers.length > 0 || selectedSupportTowers.length > 0;

    return (
        <div className="flex flex-col gap-2 w-40 shrink-0" style={{ visibility: hasSelection ? 'visible' : 'hidden' }}>
            {/* 선택된 타워 정보 */}
            {selectedTowers.length > 0 && (
                <div className="bg-gray-900/80 rounded-lg p-2 border border-emerald-500/50">
                    <p className="text-xs font-bold text-emerald-400 mb-1">🏗️ 선택 타워 ({selectedTowers.length})</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'radial-gradient(circle, ' + selectedTowers[0].color + ' 0%, ' + selectedTowers[0].color + '80 50%, transparent 70%)' }}>
                            <span className="text-xs">{getElementInfo(selectedTowers[0].element).icon}</span>
                        </div>
                        <span className="text-gray-300 text-xs truncate">{selectedTowers[0].name}</span>
                        <span className="text-gray-500 text-xs shrink-0">T{selectedTowers[0].tier}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">판매 시 {totalSellPrice}G 환급</p>
                </div>
            )}

            {/* 선택된 서포트 타워 정보 */}
            {selectedSupportTowers.length > 0 && (
                <div className="bg-gray-900/80 rounded-lg p-2 border border-orange-500/50">
                    <p className="text-xs font-bold text-orange-400 mb-1">🛡️ 선택 서포트 ({selectedSupportTowers.length})</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, ' + selectedSupportTowers[0].color + ' 0%, ' + selectedSupportTowers[0].color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <span className="text-xs">{SUPPORT_UI[selectedSupportTowers[0].supportType].icon}</span>
                        </div>
                        <span className="text-gray-300 text-xs truncate">{selectedSupportTowers[0].name}</span>
                        <span className="text-gray-500 text-xs shrink-0">S{selectedSupportTowers[0].tier}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">판매 시 {totalSupportSellPrice}G 환급</p>
                </div>
            )}
        </div>
    );
};

// InventoryPanel - 하단 전체: 탭 기반 통합 인벤토리
const InventoryPanel = ({
    gold,
    isPlaying,
    startWave,
    isInventoryFull,
    isSupportInventoryFull,
    drawRandomNeon,
    drawRandomSupport,
    effectiveDrawCost,
    // 인벤토리
    inventory,
    selectedInventory,
    selectedTowerForPlacement,
    handleInventoryClick,
    getElementInfo,
    combineNeons,
    combineAllNeons,
    combineTowers,
    sellSelectedTowers,
    selectedTowers,
    totalSellPrice,
    canCombineTowers,
    // 서포트 인벤토리
    supportInventory,
    selectedSupportInventory,
    combineSupports,
    combineAllSupports,
    combineSupportTowers,
    sellSelectedSupportTowers,
    selectedSupportTowers,
    totalSupportSellPrice,
    canCombineSupportTowers,
}) => {
    const [activeTab, setActiveTab] = React.useState('tower');

    // --- 통합 뽑기 ---
    const drawHandler = activeTab === 'tower' ? drawRandomNeon : drawRandomSupport;
    const drawCost = activeTab === 'tower' ? effectiveDrawCost : ECONOMY.supportDrawCost;
    const isFull = activeTab === 'tower' ? isInventoryFull : isSupportInventoryFull;

    // --- 통합 조합 ---
    const handleCombine = () => {
        if (selectedTowers.length > 0) return combineTowers();
        if (selectedSupportTowers.length > 0) return combineSupportTowers();
        if (selectedInventory.length === 3) return combineNeons();
        if (selectedSupportInventory.length === 3) return combineSupports();
    };
    const isMaxTier = (selectedInventory.length === 3 && selectedInventory[0]?.tier >= 4)
        || (selectedSupportInventory.length === 3 && selectedSupportInventory[0]?.tier >= 3)
        || (selectedTowers.length > 0 && selectedTowers[0]?.tier >= 4)
        || (selectedSupportTowers.length > 0 && selectedSupportTowers[0]?.tier >= 3);
    const canCombine = canCombineTowers || canCombineSupportTowers
        || (selectedInventory.length === 3 && selectedInventory[0]?.tier < 4)
        || (selectedSupportInventory.length === 3 && selectedSupportInventory[0]?.tier < 3);
    const combineCount = selectedTowers.length + selectedInventory.length + selectedSupportTowers.length + selectedSupportInventory.length;

    // --- 통합 전체 조합 ---
    const handleCombineAll = activeTab === 'tower' ? combineAllNeons : combineAllSupports;
    const combinableCount = activeTab === 'tower'
        ? TowerSystem.getCombinableCount(inventory)
        : TowerSystem.getSupportCombinableCount(supportInventory);

    // --- 통합 판매 ---
    const handleSell = () => {
        if (selectedTowers.length > 0) return sellSelectedTowers();
        if (selectedSupportTowers.length > 0) return sellSelectedSupportTowers();
    };
    const sellPrice = selectedTowers.length > 0 ? totalSellPrice : totalSupportSellPrice;
    const canSell = selectedTowers.length > 0 || selectedSupportTowers.length > 0;

    return (
        <div className="max-w-4xl mx-auto mt-3 space-y-1.5">
            {/* 버튼 행: 시작 / 뽑기 / 조합 / 전체 조합 / 판매 */}
            <div className="flex gap-1.5">
                <button type="button" onClick={startWave} disabled={isPlaying}
                    className="btn-neon px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30 text-sm whitespace-nowrap shrink-0">
                    {isPlaying ? '⏳ 전투 중' : '▶ 시작'}
                </button>
                <button type="button" onClick={drawHandler} disabled={gold < drawCost || isFull}
                    className={'flex-1 btn-neon px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap border ' + (activeTab === 'tower' ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-400/30' : 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/30')}>
                    {isFull ? '📦 가득 참' : '🎲 뽑기 (' + drawCost + 'G)'}
                </button>
                <div className="w-px bg-gray-700 self-stretch" />
                <button type="button" onClick={handleCombine} disabled={!canCombine}
                    className="flex-1 btn-neon px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm whitespace-nowrap">
                    {isMaxTier ? '⚡ 최대 티어' : '⚡ 조합 (' + combineCount + '/3)'}
                </button>
                <button type="button" onClick={handleCombineAll} disabled={combinableCount === 0}
                    className="flex-1 btn-neon px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30 text-sm whitespace-nowrap">
                    🔄 전체 ({combinableCount})
                </button>
                <button type="button" onClick={handleSell} disabled={!canSell}
                    className="flex-1 btn-neon px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30 text-sm whitespace-nowrap">
                    💰 판매 {canSell ? '(+' + sellPrice + 'G)' : ''}
                </button>
            </div>

            {/* 탭 + 인벤토리 그리드 */}
            <div className="bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden">
                {/* 탭 헤더 */}
                <div className="flex border-b border-gray-700">
                    <button type="button" onClick={() => setActiveTab('tower')}
                        className={'flex-1 px-3 py-1.5 text-xs font-bold transition-colors ' + (activeTab === 'tower' ? 'text-cyan-400 bg-gray-800/80 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300')}>
                        📦 타워 ({inventory.length}/{ECONOMY.maxInventory})
                    </button>
                    <button type="button" onClick={() => setActiveTab('support')}
                        className={'flex-1 px-3 py-1.5 text-xs font-bold transition-colors ' + (activeTab === 'support' ? 'text-orange-400 bg-gray-800/80 border-b-2 border-orange-400' : 'text-gray-500 hover:text-gray-300')}>
                        🛡️ 서포트 ({supportInventory.length}/{ECONOMY.maxSupportInventory})
                    </button>
                </div>

                {/* 인벤토리 그리드 - 15열 고정 (타워 2행, 서포트 1행) */}
                <div className="p-2">
                    {activeTab === 'tower' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gap: '2px' }}>
                            {Array.from({ length: ECONOMY.maxInventory }, (_, i) => {
                                const neon = inventory[i];
                                if (neon) {
                                    const isSelected = selectedInventory.some(n => n.id === neon.id);
                                    const isInPlacementMode = selectedTowerForPlacement && selectedTowerForPlacement.id === neon.id;
                                    const elementInfo = getElementInfo(neon.element);
                                    let borderClass = 'border-transparent hover:border-gray-500';
                                    let boxShadow = 'none';
                                    if (isInPlacementMode) { borderClass = 'border-yellow-400'; boxShadow = '0 0 8px #facc15'; }
                                    else if (isSelected) { borderClass = 'border-white selected'; boxShadow = '0 0 8px ' + neon.color; }
                                    return (
                                        <div key={neon.id}
                                            onClick={(e) => { e.stopPropagation(); handleInventoryClick(neon); }}
                                            className={'inventory-item aspect-square rounded flex flex-col items-center justify-center border-2 cursor-pointer ' + borderClass}
                                            style={{ background: 'radial-gradient(circle, ' + neon.color + '80 0%, ' + neon.color + '40 70%)', color: neon.color, boxShadow }}
                                            title={neon.name + '\nTier ' + neon.tier + '\n' + elementInfo.icon + ' ' + elementInfo.name + ': ' + elementInfo.desc}>
                                            <span className="text-xs leading-none">{elementInfo.icon}</span>
                                            <span className="text-[10px] font-black text-white drop-shadow leading-none">T{neon.tier}</span>
                                        </div>
                                    );
                                }
                                return <div key={'empty-' + i} className="aspect-square rounded border border-gray-700/50 bg-gray-800/30" />;
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gap: '2px' }}>
                            {Array.from({ length: ECONOMY.maxSupportInventory }, (_, i) => {
                                const support = supportInventory[i];
                                if (support) {
                                    const isSelected = selectedSupportInventory.some(s => s.id === support.id);
                                    const isInPlacementMode = selectedTowerForPlacement && selectedTowerForPlacement.id === support.id;
                                    const supportInfo = SUPPORT_UI[support.supportType];
                                    let borderClass = 'border-transparent hover:border-gray-500';
                                    let boxShadow = 'none';
                                    if (isInPlacementMode) { borderClass = 'border-yellow-400'; boxShadow = '0 0 8px #facc15'; }
                                    else if (isSelected) { borderClass = 'border-white selected'; boxShadow = '0 0 8px ' + support.color; }
                                    return (
                                        <div key={support.id}
                                            onClick={(e) => { e.stopPropagation(); handleInventoryClick(support); }}
                                            className={'inventory-item aspect-square flex flex-col items-center justify-center border-2 cursor-pointer ' + borderClass}
                                            style={{ background: 'linear-gradient(135deg, ' + support.color + '80 0%, ' + support.color + '40 100%)', color: support.color, boxShadow, clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                            title={support.name + '\nS' + support.tier + '\n' + supportInfo.icon + ' ' + supportInfo.name}>
                                            <span className="text-xs leading-none">{supportInfo.icon}</span>
                                            <span className="text-[10px] font-black text-white drop-shadow leading-none">S{support.tier}</span>
                                        </div>
                                    );
                                }
                                return <div key={'support-empty-' + i} className="aspect-square border border-gray-700/50 bg-gray-800/30"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />;
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.ControlPanel = ControlPanel;
window.InventoryPanel = InventoryPanel;
