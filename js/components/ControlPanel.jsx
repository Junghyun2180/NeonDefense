// 적 타입별 한글 이름·간단 설명 (정보 카드용)
const ENEMY_INFO = {
    normal:     { label: '일반',        icon: '👾', desc: '기본 적' },
    fast:       { label: '빠른 적',     icon: '💨', desc: '이동 속도 높음' },
    elite:      { label: '엘리트',      icon: '⭐', desc: '고체력 + 방어력' },
    boss:       { label: '보스',        icon: '👑', desc: '실드 + 방어력 + 패턴' },
    jammer:     { label: '재머',        icon: '📡', desc: '주변 타워 공속 감소' },
    suppressor: { label: '서프레서',    icon: '🛡️', desc: '주변 타워 공격력 감소 + 두꺼운 방어' },
    healer:     { label: '힐러',        icon: '💚', desc: '주변 적 회복' },
    splitter:   { label: '분열체',      icon: '💠', desc: '사망 시 분열' },
    aegis:      { label: '이지스',      icon: '🛡', desc: '큰 실드 + 깨진 후 1회 재생' },
};

// ControlPanel - 맵 우측 사이드 패널 (선택된 타워/서포트/적 정보)
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
    // 적 (신규)
    selectedEnemy,
    clearSelectedEnemy,
}) => {
    const hasSelection = selectedTowers.length > 0 || selectedSupportTowers.length > 0 || !!selectedEnemy;

    return (
        <div className="flex flex-col gap-2 w-40 shrink-0" style={{ visibility: hasSelection ? 'visible' : 'hidden' }}>
            {/* 선택된 타워 정보 */}
            {selectedTowers.length > 0 && (
                <div className="bg-gray-900/80 rounded-lg p-2 border border-emerald-500/50">
                    <p className="text-xs font-bold text-emerald-400 mb-1">🏗️ 선택 타워 ({selectedTowers.length})</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'radial-gradient(circle, ' + selectedTowers[0].color + ' 0%, ' + selectedTowers[0].color + '80 50%, transparent 70%)' }}>
                            {(() => {
                                const url = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(selectedTowers[0].element, selectedTowers[0].tier) : null;
                                return url
                                    ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <span className="text-xs">{getElementInfo(selectedTowers[0].element).icon}</span>;
                            })()}
                        </div>
                        <span className="text-gray-300 text-xs truncate">{selectedTowers[0].name}</span>
                        <span className="text-gray-500 text-xs shrink-0">T{selectedTowers[0].tier}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">판매 시 {totalSellPrice}G 환급</p>
                </div>
            )}

            {/* 선택된 적 정보 (신규) */}
            {selectedEnemy && (() => {
                const info = ENEMY_INFO[selectedEnemy.type] || { label: selectedEnemy.type, icon: '❓', desc: '' };
                const hpPct = Math.round((selectedEnemy.health / selectedEnemy.maxHealth) * 100);
                const shieldPct = (selectedEnemy.shieldMax || 0) > 0
                    ? Math.round(Math.max(0, selectedEnemy.shield) / selectedEnemy.shieldMax * 100)
                    : null;
                const abilityDesc = selectedEnemy.ability && typeof selectedEnemy.ability.getDescription === 'function'
                    ? selectedEnemy.ability.getDescription()
                    : null;
                return (
                    <div className="bg-gray-900/80 rounded-lg p-2 border border-rose-500/50">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-rose-400">👾 선택 적</p>
                            <button onClick={clearSelectedEnemy} className="text-gray-500 hover:text-gray-200 text-xs leading-none px-1">✕</button>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-base leading-none">{info.icon}</span>
                            <span className="text-gray-200 text-xs font-bold truncate">{info.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{info.desc}</p>

                        {/* HP */}
                        <div className="mt-1.5">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                                <span>HP</span>
                                <span className="text-green-300">{Math.max(0, Math.floor(selectedEnemy.health))}/{selectedEnemy.maxHealth}</span>
                            </div>
                            <div className="w-full h-1 bg-gray-800 rounded mt-0.5 overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: hpPct + '%' }} />
                            </div>
                        </div>

                        {/* Shield */}
                        {shieldPct !== null && (
                            <div className="mt-1">
                                <div className="flex items-center justify-between text-[10px] text-gray-400">
                                    <span>실드</span>
                                    <span className="text-cyan-300">{Math.max(0, Math.floor(selectedEnemy.shield))}/{selectedEnemy.shieldMax}</span>
                                </div>
                                <div className="w-full h-1 bg-gray-800 rounded mt-0.5 overflow-hidden">
                                    <div className="h-full bg-cyan-400" style={{ width: shieldPct + '%' }} />
                                </div>
                            </div>
                        )}

                        {/* Armor */}
                        {(selectedEnemy.armor || 0) > 0 && (
                            <div className="mt-1 flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">방어력</span>
                                <span className="text-yellow-300 font-bold">{selectedEnemy.armor}</span>
                            </div>
                        )}

                        {/* Speed */}
                        <div className="mt-0.5 flex items-center justify-between text-[10px]">
                            <span className="text-gray-400">이동 속도</span>
                            <span className="text-gray-300">{(selectedEnemy.speed || selectedEnemy.baseSpeed || 0).toFixed(2)}</span>
                        </div>

                        {/* Gold reward */}
                        {selectedEnemy.goldReward != null && (
                            <div className="mt-0.5 flex items-center justify-between text-[10px]">
                                <span className="text-gray-400">처치 보상</span>
                                <span className="text-yellow-200">{selectedEnemy.goldReward}G</span>
                            </div>
                        )}

                        {/* Ability description */}
                        {abilityDesc && (
                            <p className="text-[10px] text-purple-300 mt-1 leading-tight">{abilityDesc}</p>
                        )}
                    </div>
                );
            })()}

            {/* 선택된 서포트 타워 정보 */}
            {selectedSupportTowers.length > 0 && (
                <div className="bg-gray-900/80 rounded-lg p-2 border border-orange-500/50">
                    <p className="text-xs font-bold text-orange-400 mb-1">🛡️ 선택 서포트 ({selectedSupportTowers.length})</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, ' + selectedSupportTowers[0].color + ' 0%, ' + selectedSupportTowers[0].color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            {(() => {
                                const url = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(selectedSupportTowers[0].supportType, selectedSupportTowers[0].tier) : null;
                                return url
                                    ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    : <span className="text-xs">{SUPPORT_UI[selectedSupportTowers[0].supportType].icon}</span>;
                            })()}
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
    drawRandomNeon10,
    drawRandomSupport,
    drawRandomSupport10,
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
    // 속도감 설정
    autoCombine,
    setAutoCombine,
    autoSupportCombine,
    setAutoSupportCombine,
    clearAllT4RolePresets,
    t4RolePresets,
    autoNextWave,
    setAutoNextWave,
    maxGameSpeed,
    setMaxGameSpeed,
}) => {
    const [activeTab, setActiveTab] = React.useState('tower');

    // --- 통합 뽑기 ---
    const drawHandler = activeTab === 'tower' ? drawRandomNeon : drawRandomSupport;
    const drawHandler10 = activeTab === 'tower' ? drawRandomNeon10 : drawRandomSupport10;
    const drawCost = activeTab === 'tower' ? effectiveDrawCost : ECONOMY.supportDrawCost;
    const isFull = activeTab === 'tower' ? isInventoryFull : isSupportInventoryFull;
    const activeAutoCombine = activeTab === 'tower' ? autoCombine : autoSupportCombine;
    const setActiveAutoCombine = activeTab === 'tower' ? setAutoCombine : setAutoSupportCombine;
    const presetCount = Object.keys(t4RolePresets || {}).length;

    // 10연뽑 시 실제 가능 횟수 (골드/슬롯 제한 반영) — 버튼 레이블 오인 방지
    const remainingSlots = activeTab === 'tower'
        ? (ECONOMY.maxInventory - (inventory?.length || 0))
        : (ECONOMY.maxSupportInventory - (supportInventory?.length || 0));
    const maxByGold = Math.floor(gold / Math.max(1, drawCost));
    const draw10Count = Math.max(0, Math.min(10, remainingSlots, maxByGold));
    const draw10Cost = draw10Count * drawCost;

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
            {/* 버튼 행: 시작 / 뽑기 x1 / 뽑기 x10 / 조합 / 전체 조합 / 판매 */}
            <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={startWave} disabled={isPlaying}
                    className="btn-neon px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/30 text-sm whitespace-nowrap shrink-0">
                    {isPlaying ? '⏳ 전투 중' : '▶ 시작'}
                </button>
                <button type="button" onClick={drawHandler} disabled={gold < drawCost || isFull}
                    className={'flex-1 btn-neon px-2 py-1.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap border ' + (activeTab === 'tower' ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-400/30' : 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/30')}>
                    {isFull ? '📦 가득 참' : '🎲 x1 (' + drawCost + 'G)'}
                </button>
                <button type="button" onClick={drawHandler10} disabled={gold < drawCost || isFull || draw10Count === 0}
                    className={'flex-1 btn-neon px-2 py-1.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap border ' + (activeTab === 'tower' ? 'bg-gradient-to-r from-fuchsia-700 to-purple-700 border-fuchsia-400/50' : 'bg-gradient-to-r from-orange-600 to-rose-600 border-orange-400/50')}
                    title={'최대 10회 연속 뽑기 — 실제 ' + draw10Count + '회 (' + draw10Cost + 'G)'}>
                    {draw10Count === 10 ? '🎲 x10' : ('🎲 x' + draw10Count)} ({draw10Cost}G)
                </button>
                <div className="w-px bg-gray-700 self-stretch" />
                <button type="button" onClick={handleCombine} disabled={!canCombine}
                    className="flex-1 btn-neon px-2 py-1.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-400/30 text-sm whitespace-nowrap">
                    {isMaxTier ? '⚡ 최대' : '⚡ 조합 (' + combineCount + '/3)'}
                </button>
                <button type="button" onClick={handleCombineAll} disabled={combinableCount === 0}
                    className="flex-1 btn-neon px-2 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30 text-sm whitespace-nowrap">
                    🔄 전체 ({combinableCount})
                </button>
                <button type="button" onClick={handleSell} disabled={!canSell}
                    className="flex-1 btn-neon px-2 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30 text-sm whitespace-nowrap">
                    💰 판매 {canSell ? '(+' + sellPrice + 'G)' : ''}
                </button>
            </div>

            {/* 자동화 옵션 행 */}
            <div className="flex gap-3 items-center text-xs text-gray-400 px-1 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-gray-200">
                    <input type="checkbox" checked={!!activeAutoCombine}
                        onChange={(e) => setActiveAutoCombine && setActiveAutoCombine(e.target.checked)}
                        className="w-3.5 h-3.5 accent-cyan-400" />
                    <span>뽑기 후 자동 조합</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-gray-200">
                    <input type="checkbox" checked={!!autoNextWave}
                        onChange={(e) => setAutoNextWave && setAutoNextWave(e.target.checked)}
                        className="w-3.5 h-3.5 accent-cyan-400" />
                    <span>자동 다음 웨이브</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-gray-200" title="최대 배속 슬라이더">
                    <span>최대 배속</span>
                    <select
                        value={maxGameSpeed ?? 5}
                        onChange={(e) => setMaxGameSpeed && setMaxGameSpeed(Number(e.target.value))}
                        className="bg-gray-800 border border-gray-600 rounded px-1.5 py-0.5 text-gray-200 text-xs"
                    >
                        <option value={3}>3x</option>
                        <option value={4}>4x</option>
                        <option value={5}>5x</option>
                    </select>
                </label>
                {presetCount > 0 && (
                    <button type="button" onClick={clearAllT4RolePresets}
                        className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                        title="저장된 T4 역할 프리셋 초기화">
                        T4 역할 기억 초기화 ({presetCount})
                    </button>
                )}
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
                                            {(() => {
                                                const url = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(neon.element, neon.tier) : null;
                                                return url
                                                    ? <img src={url} alt="" draggable={false} style={{ width: '85%', height: '85%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 0 3px ' + neon.color + ')' }} />
                                                    : <span className="text-xs leading-none">{elementInfo.icon}</span>;
                                            })()}
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
                                            {(() => {
                                                const url = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(support.supportType, support.tier) : null;
                                                return url
                                                    ? <img src={url} alt="" draggable={false} style={{ width: '85%', height: '85%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 0 3px ' + support.color + ')' }} />
                                                    : <span className="text-xs leading-none">{supportInfo.icon}</span>;
                                            })()}
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
