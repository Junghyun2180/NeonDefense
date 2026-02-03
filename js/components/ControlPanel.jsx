// ControlPanel - 사이드 패널 컴포넌트
const ControlPanel = ({
    // 뽑기/시작
    gold,
    isPlaying,
    drawRandomNeon,
    drawRandomSupport,
    startWave,
    isInventoryFull,
    isSupportInventoryFull,
    // 인벤토리
    inventory,
    selectedInventory,
    handleDragStart,
    toggleInventorySelect,
    getElementInfo,
    // 조합
    combineNeons,
    combineAllNeons,
    combineTowers,
    sellSelectedTowers,
    selectedTowers,
    totalSellPrice,
    canCombineTowers,
    // 서포트
    supportInventory,
    selectedSupportInventory,
    toggleSupportInventorySelect,
    combineSupports,
    combineAllSupports,
    combineSupportTowers,
    sellSelectedSupportTowers,
    selectedSupportTowers,
    totalSupportSellPrice,
    canCombineSupportTowers,
}) => {
    return (
        <div className="flex-1 min-w-[280px] space-y-3">
            {/* 뽑기 버튼들 */}
            <div className="flex gap-2">
                <button type="button" onClick={drawRandomNeon} disabled={gold < ECONOMY.drawCost || isInventoryFull} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-pink-400/30 text-sm">
                    {isInventoryFull ? '📦 가득 참' : '🎲 뽑기 (' + ECONOMY.drawCost + 'G)'}
                </button>
                <button type="button" onClick={drawRandomSupport} disabled={gold < ECONOMY.supportDrawCost || isSupportInventoryFull} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-orange-400/30 text-sm">
                    {isSupportInventoryFull ? '📦 가득 참' : '🛡️ 서포트 (' + ECONOMY.supportDrawCost + 'G)'}
                </button>
                <button type="button" onClick={startWave} disabled={isPlaying} className="flex-1 btn-neon px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30 text-sm">
                    {isPlaying ? '전투 중...' : '▶ 시작'}
                </button>
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

            {/* 인벤토리 */}
            <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700">
                <h3 className="text-sm font-bold mb-2 text-gray-400">📦 인벤토리 ({inventory.length}/{ECONOMY.maxInventory}) - 클릭: 선택 / 드래그: 배치</h3>
                <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: ECONOMY.maxInventory }, (_, i) => {
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

            {/* 서포트 인벤토리 */}
            <div className="bg-gray-900/80 rounded-lg p-3 border border-orange-500/30">
                <h3 className="text-sm font-bold mb-2 text-orange-400">🛡️ 서포트 ({supportInventory.length}/{ECONOMY.maxSupportInventory})</h3>
                <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: ECONOMY.maxSupportInventory }, (_, i) => {
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
    );
};

window.ControlPanel = ControlPanel;
