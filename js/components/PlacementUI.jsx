// PlacementUI - 모바일 배치 UI 컴포넌트
const PlacementUI = ({
    placementMode,
    setPlacementMode,
    mapRef,
    mapScale = 1,
    getAvailableElements,
    getInventoryByElement,
    handleElementSelect,
    handleTierSelect,
    getElementInfo,
}) => {
    if (!placementMode) return null;

    const mapRect = mapRef.current?.getBoundingClientRect();
    if (!mapRect) return null;

    const centerX = mapRect.left + (placementMode.gridX * TILE_SIZE + TILE_SIZE / 2) * mapScale;
    const centerY = mapRect.top + (placementMode.gridY * TILE_SIZE + TILE_SIZE / 2) * mapScale;

    if (placementMode.step === 'element') {
        const availableElements = getAvailableElements();
        return (
            <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) setPlacementMode(null); }}>
                {/* 하단 중앙 종료 힌트 */}
                <div className="fixed text-xs text-gray-300 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-600 pointer-events-none"
                    style={{ bottom: 16, left: '50%', transform: 'translateX(-50%)' }}>
                    🎯 속성을 선택하세요 · 빈 곳 탭 시 취소
                </div>
                <div className="absolute" style={{ left: centerX, top: centerY }}>
                    <div className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all" style={{ left: -24, top: -24 }} onClick={() => setPlacementMode(null)}>
                        <span className="text-xl">✕</span>
                    </div>
                    {ELEMENT_UI.map((elem, index) => {
                        const angle = (index * 60 - 90) * (Math.PI / 180);
                        const radius = 65;
                        const x = Math.cos(angle) * radius - 22;
                        const y = Math.sin(angle) * radius - 22;
                        const hasElement = availableElements[elem.id];
                        const elemKey = ['fire', 'water', 'electric', 'wind', 'void', 'light'][elem.id];
                        const orbUrl = `assets/icons/elements/${elemKey}.png`;
                        return (
                            <div
                                key={elem.id}
                                className={'absolute w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all ' + (hasElement ? 'hover:scale-110' : 'opacity-30 cursor-not-allowed')}
                                style={{ left: x, top: y, background: 'transparent', boxShadow: hasElement ? `0 0 15px ${elem.color}80` : 'none' }}
                                onClick={() => hasElement && handleElementSelect(elem.id)}
                                title={elem.name}
                            >
                                <img src={orbUrl} alt={elem.name} draggable={false}
                                     style={{ width: '100%', height: '100%', pointerEvents: 'none', filter: hasElement ? 'none' : 'grayscale(1) brightness(0.5)' }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (placementMode.step === 'tier') {
        const byTier = getInventoryByElement(placementMode.element);
        const tiers = Object.keys(byTier).map(Number).sort((a, b) => a - b);
        const elementInfo = getElementInfo(placementMode.element);
        const elemColor = NEON_TYPES[1].colors[placementMode.element];
        return (
            <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) setPlacementMode(null); }}>
                {/* 하단 중앙 힌트 */}
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-300 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-600 pointer-events-none">
                    ⚡ 티어 선택 · 중앙 아이콘: 속성 되돌리기 · 빈 곳: 취소
                </div>
                <div className="absolute" style={{ left: centerX, top: centerY }}>
                    <div className="absolute w-12 h-12 rounded-full bg-gray-800 border-2 flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-all" style={{ left: -24, top: -24, borderColor: elemColor }} onClick={() => setPlacementMode(prev => ({ ...prev, step: 'element', element: null }))}>
                        <span className="text-xl">{elementInfo.icon}</span>
                    </div>
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
                                style={{ left: x, top: y, background: `radial-gradient(circle, ${tierColor} 0%, ${tierColor}80 70%)`, boxShadow: `0 0 15px ${tierColor}80`, border: `2px solid ${tierColor}` }}
                                onClick={() => handleTierSelect(tier)}
                            >
                                <span className="text-xs font-black text-white drop-shadow">T{tier}</span>
                                <span className="text-xs text-white/80">x{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

window.PlacementUI = PlacementUI;
