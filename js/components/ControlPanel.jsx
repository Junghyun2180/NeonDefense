// ControlPanel & InventoryPanel — Holographic Command
// Spec: design handoff v1.0 / Page A · Game Play
//   - ControlPanel = right rail "SELECTED UNIT" + selected enemy + selected support
//   - InventoryPanel = bottom panel: tabs + element-tinted grid + action buttons

const ENEMY_INFO = {
    normal:     { label: '일반',      icon: '👾', desc: '기본 적' },
    fast:       { label: '빠른 적',   icon: '💨', desc: '이동 속도 높음' },
    elite:      { label: '엘리트',    icon: '⭐', desc: '고체력 + 방어력' },
    boss:       { label: '보스',      icon: '👑', desc: '실드 + 방어력 + 패턴' },
    jammer:     { label: '재머',      icon: '📡', desc: '주변 타워 공속 감소' },
    suppressor: { label: '서프레서',  icon: '🛡️', desc: '주변 타워 공격력 감소 + 두꺼운 방어' },
    healer:     { label: '힐러',      icon: '💚', desc: '주변 적 회복' },
    splitter:   { label: '분열체',    icon: '💠', desc: '사망 시 분열' },
    aegis:      { label: '이지스',    icon: '🛡', desc: '큰 실드 + 깨진 후 1회 재생' },
};

// Reticle corner helper — adds 4 absolute-positioned 14px L-shapes
const HoloReticle = () => React.createElement(React.Fragment, null,
    React.createElement('span', { className: 'nd-reticle__c nd-reticle__c--tl' }),
    React.createElement('span', { className: 'nd-reticle__c nd-reticle__c--tr' }),
    React.createElement('span', { className: 'nd-reticle__c nd-reticle__c--bl' }),
    React.createElement('span', { className: 'nd-reticle__c nd-reticle__c--br' }),
);

// ─────────────── ControlPanel (right rail) ───────────────
const ControlPanel = ({
    inventory,
    selectedInventory,
    getElementInfo,
    selectedTowers,
    totalSellPrice,
    selectedSupportInventory,
    selectedSupportTowers,
    totalSupportSellPrice,
    selectedEnemy,
    clearSelectedEnemy,
}) => {
    const hasSelection = selectedTowers.length > 0 || selectedSupportTowers.length > 0 || !!selectedEnemy;

    return (
        <div
            className="flex flex-col w-40 shrink-0"
            style={{
                gap: 8,
                visibility: hasSelection ? 'visible' : 'hidden',
                fontFamily: 'var(--nd-font-sans)',
            }}
        >
            {/* ── SELECTED TOWER ── */}
            {selectedTowers.length > 0 && (() => {
                const t = selectedTowers[0];
                const info = getElementInfo(t.element);
                const url = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(t.element, t.tier) : null;
                return (
                    <div className="nd-panel relative" style={{ padding: '10px 12px' }}>
                        <HoloReticle />
                        <div className="nd-eyebrow" style={{ color: 'var(--nd-crimson)', letterSpacing: 2 }}>
                            ◆ SELECTED UNIT {selectedTowers.length > 1 && (
                                <span className="nd-tnum" style={{ color: 'var(--nd-text)', marginLeft: 4 }}>×{selectedTowers.length}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div
                                style={{
                                    width: 32, height: 32,
                                    background: `radial-gradient(circle, ${t.color}55 0%, transparent 70%)`,
                                    border: `1px solid ${t.color}66`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {url
                                    ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 3px ${t.color})` }} />
                                    : <span style={{ fontSize: 14 }}>{info.icon}</span>}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 12, color: '#fff', fontWeight: 700,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}
                                    title={t.name}
                                >
                                    {t.name}
                                </div>
                                <div className="nd-mono" style={{ fontSize: 9, color: t.color, letterSpacing: 1, marginTop: 2 }}>
                                    T{t.tier} · {info.name?.toUpperCase?.() || ''}
                                </div>
                            </div>
                        </div>
                        <div className="nd-hair" style={{ margin: '8px 0' }} />
                        <div
                            className="nd-mono nd-tnum"
                            style={{ fontSize: 10, color: 'var(--nd-amber)', letterSpacing: 1 }}
                        >
                            ◆ SELL <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>+{totalSellPrice}G</span>
                        </div>
                    </div>
                );
            })()}

            {/* ── SELECTED ENEMY ── */}
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
                    <div className="nd-panel relative" style={{ padding: '10px 12px' }}>
                        <HoloReticle />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="nd-eyebrow" style={{ color: 'var(--nd-red-life)', letterSpacing: 2 }}>
                                ✕ TARGET INTEL
                            </div>
                            <button
                                onClick={clearSelectedEnemy}
                                aria-label="close"
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                    color: 'var(--nd-dim)', padding: 0, fontSize: 11, lineHeight: 1,
                                }}
                            >×</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                            <span style={{ fontSize: 16 }}>{info.icon}</span>
                            <span
                                style={{
                                    fontSize: 12, color: '#fff', fontWeight: 700,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}
                            >
                                {info.label}
                            </span>
                            {selectedEnemy.type === 'boss' && (
                                <span
                                    className="nd-mono"
                                    style={{
                                        fontSize: 8, color: '#000', background: 'var(--nd-red-life)',
                                        padding: '1px 4px', letterSpacing: 1, fontWeight: 700,
                                    }}
                                >BOSS</span>
                            )}
                            {selectedEnemy.isMiniboss && (
                                <span
                                    className="nd-mono"
                                    style={{
                                        fontSize: 8, color: '#000', background: 'var(--nd-amber)',
                                        padding: '1px 4px', letterSpacing: 1, fontWeight: 700,
                                    }}
                                >MINI</span>
                            )}
                        </div>
                        <p
                            className="nd-mono"
                            style={{
                                fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 0.5,
                                marginTop: 4, lineHeight: 1.4,
                            }}
                        >{info.desc}</p>

                        {/* HP gauge */}
                        <div style={{ marginTop: 8 }}>
                            <div
                                className="nd-mono nd-tnum"
                                style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: 9, letterSpacing: 1.5,
                                }}
                            >
                                <span style={{ color: 'var(--nd-green)' }}>HP</span>
                                <span style={{ color: '#fff' }}>
                                    {Math.max(0, Math.floor(selectedEnemy.health))}/{selectedEnemy.maxHealth}
                                </span>
                            </div>
                            <div className="nd-vital__bar" style={{ marginTop: 3 }}>
                                <div style={{ width: hpPct + '%', background: 'var(--nd-green)' }} />
                            </div>
                        </div>

                        {/* Shield gauge */}
                        {shieldPct !== null && (
                            <div style={{ marginTop: 6 }}>
                                <div
                                    className="nd-mono nd-tnum"
                                    style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        fontSize: 9, letterSpacing: 1.5,
                                    }}
                                >
                                    <span style={{ color: 'var(--nd-el-water)' }}>SHIELD</span>
                                    <span style={{ color: '#fff' }}>
                                        {Math.max(0, Math.floor(selectedEnemy.shield))}/{selectedEnemy.shieldMax}
                                    </span>
                                </div>
                                <div className="nd-vital__bar" style={{ marginTop: 3 }}>
                                    <div style={{ width: shieldPct + '%', background: 'var(--nd-el-water)' }} />
                                </div>
                            </div>
                        )}

                        {/* compact stat row */}
                        <div className="nd-hair" style={{ margin: '8px 0' }} />
                        <div
                            className="nd-mono nd-tnum"
                            style={{
                                display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 3,
                                fontSize: 9, letterSpacing: 1,
                            }}
                        >
                            {(selectedEnemy.armor || 0) > 0 && (<>
                                <span style={{ color: 'var(--nd-dim)' }}>ARMOR</span>
                                <span style={{ color: 'var(--nd-gold)', fontWeight: 700 }}>{selectedEnemy.armor}</span>
                            </>)}
                            <span style={{ color: 'var(--nd-dim)' }}>SPEED</span>
                            <span style={{ color: '#fff' }}>{(selectedEnemy.speed || selectedEnemy.baseSpeed || 0).toFixed(2)}</span>
                            {selectedEnemy.goldReward != null && (<>
                                <span style={{ color: 'var(--nd-dim)' }}>BOUNTY</span>
                                <span style={{ color: 'var(--nd-amber)', fontWeight: 700 }}>+{selectedEnemy.goldReward}G</span>
                            </>)}
                        </div>

                        {abilityDesc && (
                            <div
                                className="nd-mono"
                                style={{
                                    marginTop: 6, padding: '4px 6px',
                                    borderLeft: '2px solid var(--nd-el-dark)',
                                    background: 'rgba(199,125,255,0.05)',
                                    fontSize: 9, color: 'var(--nd-el-dark)', lineHeight: 1.4,
                                }}
                            >
                                {abilityDesc}
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ── SELECTED SUPPORT ── */}
            {selectedSupportTowers.length > 0 && (() => {
                const s = selectedSupportTowers[0];
                const supportInfo = SUPPORT_UI[s.supportType];
                const url = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(s.supportType, s.tier) : null;
                return (
                    <div className="nd-panel relative" style={{ padding: '10px 12px' }}>
                        <HoloReticle />
                        <div className="nd-eyebrow nd-eyebrow--amber" style={{ letterSpacing: 2 }}>
                            ◇ SUPPORT UNIT {selectedSupportTowers.length > 1 && (
                                <span className="nd-tnum" style={{ color: 'var(--nd-text)', marginLeft: 4 }}>×{selectedSupportTowers.length}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div
                                style={{
                                    width: 32, height: 32,
                                    background: `radial-gradient(circle, ${s.color}55 0%, transparent 70%)`,
                                    border: `1px solid ${s.color}66`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {url
                                    ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 3px ${s.color})` }} />
                                    : <span style={{ fontSize: 14 }}>{supportInfo?.icon}</span>}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                    style={{
                                        fontSize: 12, color: '#fff', fontWeight: 700,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}
                                    title={s.name}
                                >
                                    {s.name}
                                </div>
                                <div className="nd-mono" style={{ fontSize: 9, color: s.color, letterSpacing: 1, marginTop: 2 }}>
                                    S{s.tier} · {(supportInfo?.name || '').toUpperCase()}
                                </div>
                            </div>
                        </div>
                        <div className="nd-hair" style={{ margin: '8px 0' }} />
                        <div
                            className="nd-mono nd-tnum"
                            style={{ fontSize: 10, color: 'var(--nd-amber)', letterSpacing: 1 }}
                        >
                            ◆ SELL <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>+{totalSupportSellPrice}G</span>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

// ─────────────── InventoryPanel ───────────────
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
    supportInventory,
    selectedSupportInventory,
    combineSupports,
    combineAllSupports,
    combineSupportTowers,
    sellSelectedSupportTowers,
    selectedSupportTowers,
    totalSupportSellPrice,
    canCombineSupportTowers,
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
    const [towerFilter, setTowerFilter] = React.useState(null);
    const [supportFilter, setSupportFilter] = React.useState(null);
    const [sortMode, setSortMode] = React.useState('tier');

    // 스프라이트 로드 완료 감지 → 리렌더 트리거
    const [spritesReady, setSpritesReady] = React.useState(() =>
        (typeof TowerSprite !== 'undefined' && TowerSprite._available?.size > 0)
        || (typeof SupportSprite !== 'undefined' && SupportSprite._available?.size > 0));
    React.useEffect(() => {
        const h = () => setSpritesReady(true);
        window.addEventListener('tower-sprites-ready', h);
        window.addEventListener('support-sprites-ready', h);
        return () => {
            window.removeEventListener('tower-sprites-ready', h);
            window.removeEventListener('support-sprites-ready', h);
        };
    }, []);

    const activeFilter = activeTab === 'tower' ? towerFilter : supportFilter;
    const setActiveFilter = activeTab === 'tower' ? setTowerFilter : setSupportFilter;

    // group counts (for combinable sort)
    const towerGroupCounts = React.useMemo(() => {
        const map = {};
        (inventory || []).forEach(n => {
            const key = n.tier + ':' + (n.colorIndex ?? n.element ?? 0);
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [inventory]);

    const supportGroupCounts = React.useMemo(() => {
        const map = {};
        (supportInventory || []).forEach(s => {
            const key = s.tier + ':s' + (s.supportType ?? 0);
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [supportInventory]);

    const sortedInventory = React.useMemo(() => {
        let list = [...(inventory || [])];
        if (towerFilter !== null) list = list.filter(n => (n.colorIndex ?? n.element) === towerFilter);
        return list.sort((a, b) => {
            const ea = a.colorIndex ?? a.element ?? 0;
            const eb = b.colorIndex ?? b.element ?? 0;
            if (sortMode === 'group') {
                if (ea !== eb) return ea - eb;
                return b.tier - a.tier;
            }
            if (sortMode === 'combinable') {
                const ka = a.tier + ':' + ea, kb = b.tier + ':' + eb;
                const aReady = (towerGroupCounts[ka] || 0) >= 3 ? 1 : 0;
                const bReady = (towerGroupCounts[kb] || 0) >= 3 ? 1 : 0;
                if (aReady !== bReady) return bReady - aReady;
            }
            if (b.tier !== a.tier) return b.tier - a.tier;
            return ea - eb;
        });
    }, [inventory, towerFilter, sortMode, towerGroupCounts]);

    const sortedSupportInventory = React.useMemo(() => {
        let list = [...(supportInventory || [])];
        if (supportFilter !== null) list = list.filter(s => s.supportType === supportFilter);
        return list.sort((a, b) => {
            const ta = a.supportType ?? 0, tb = b.supportType ?? 0;
            if (sortMode === 'group') {
                if (ta !== tb) return ta - tb;
                return b.tier - a.tier;
            }
            if (sortMode === 'combinable') {
                const ka = a.tier + ':s' + ta, kb = b.tier + ':s' + tb;
                const aReady = (supportGroupCounts[ka] || 0) >= 3 ? 1 : 0;
                const bReady = (supportGroupCounts[kb] || 0) >= 3 ? 1 : 0;
                if (aReady !== bReady) return bReady - aReady;
            }
            if (b.tier !== a.tier) return b.tier - a.tier;
            return ta - tb;
        });
    }, [supportInventory, supportFilter, sortMode, supportGroupCounts]);

    const drawHandler = activeTab === 'tower' ? drawRandomNeon : drawRandomSupport;
    const drawHandler10 = activeTab === 'tower' ? drawRandomNeon10 : drawRandomSupport10;
    const drawCost = activeTab === 'tower' ? effectiveDrawCost : ECONOMY.supportDrawCost;
    const isFull = activeTab === 'tower' ? isInventoryFull : isSupportInventoryFull;
    const activeAutoCombine = activeTab === 'tower' ? autoCombine : autoSupportCombine;
    const setActiveAutoCombine = activeTab === 'tower' ? setAutoCombine : setAutoSupportCombine;
    const presetCount = Object.keys(t4RolePresets || {}).length;

    const remainingSlots = activeTab === 'tower'
        ? (ECONOMY.maxInventory - (inventory?.length || 0))
        : (ECONOMY.maxSupportInventory - (supportInventory?.length || 0));
    const maxByGold = Math.floor(gold / Math.max(1, drawCost));
    const draw10Count = Math.max(0, Math.min(10, remainingSlots, maxByGold));
    const draw10Cost = draw10Count * drawCost;

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

    const handleCombineAll = activeTab === 'tower' ? combineAllNeons : combineAllSupports;
    const combinableCount = activeTab === 'tower'
        ? TowerSystem.getCombinableCount(inventory)
        : TowerSystem.getSupportCombinableCount(supportInventory);

    const handleSell = () => {
        if (selectedTowers.length > 0) return sellSelectedTowers();
        if (selectedSupportTowers.length > 0) return sellSelectedSupportTowers();
    };
    const sellPrice = selectedTowers.length > 0 ? totalSellPrice : totalSupportSellPrice;
    const canSell = selectedTowers.length > 0 || selectedSupportTowers.length > 0;

    // ─── shared button helper ───
    const holoBtn = ({
        label, sub, color, onClick, disabled, title,
        flex = 1, primary = false, isStart = false,
    }) => {
        const base = {
            flex, padding: isStart ? '6px 14px' : '6px 10px',
            fontFamily: 'var(--nd-font-mono)',
            fontSize: 11, letterSpacing: 1.5, fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            border: '1px solid', borderRadius: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            whiteSpace: 'nowrap', minWidth: 0,
            transition: 'background 0.12s, border-color 0.12s',
        };
        const variant = primary
            ? {
                background: 'linear-gradient(90deg, var(--nd-crimson) 0%, var(--nd-amber) 100%)',
                color: '#000', border: 'none',
            }
            : {
                background: `${color}12`, borderColor: `${color}66`, color,
            };
        return (
            <button
                type="button" onClick={onClick} disabled={disabled} title={title}
                style={{ ...base, ...variant }}
            >
                <span>{label}</span>
                {sub && (
                    <span
                        className="nd-tnum"
                        style={{ fontSize: 10, opacity: primary ? 0.85 : 0.7, fontWeight: 500 }}
                    >
                        {sub}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div
            className="max-w-4xl mx-auto"
            style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--nd-font-sans)' }}
        >
            {/* ── ACTION BAR ── */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {holoBtn({
                    label: isPlaying ? '⏳ IN COMBAT' : '▶ DEPLOY',
                    onClick: startWave, disabled: isPlaying,
                    primary: true, flex: '0 0 auto', isStart: true,
                })}
                {holoBtn({
                    label: isFull ? '◌ INVENTORY FULL' : '◇ ROLL ×1',
                    sub: isFull ? null : `${drawCost}G`,
                    color: activeTab === 'tower' ? 'var(--nd-crimson)' : 'var(--nd-amber)',
                    onClick: drawHandler, disabled: gold < drawCost || isFull,
                })}
                {holoBtn({
                    label: draw10Count === 10 ? '◇ ROLL ×10' : `◇ ROLL ×${draw10Count}`,
                    sub: `${draw10Cost}G`,
                    color: activeTab === 'tower' ? 'var(--nd-el-dark)' : 'var(--nd-amber)',
                    onClick: drawHandler10, disabled: gold < drawCost || isFull || draw10Count === 0,
                    title: `최대 10회 연속 — 실제 ${draw10Count}회 (${draw10Cost}G)`,
                })}
                <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--nd-hair)' }} />
                {holoBtn({
                    label: isMaxTier ? '⚡ MAX TIER' : '⚡ FUSE',
                    sub: isMaxTier ? null : `${combineCount}/3`,
                    color: 'var(--nd-gold)',
                    onClick: handleCombine, disabled: !canCombine,
                })}
                {holoBtn({
                    label: '⚡ FUSE-ALL',
                    sub: combinableCount > 0 ? `×${combinableCount}` : null,
                    color: 'var(--nd-amber)',
                    onClick: handleCombineAll, disabled: combinableCount === 0,
                })}
                {holoBtn({
                    label: '◢ SELL',
                    sub: canSell ? `+${sellPrice}G` : null,
                    color: 'var(--nd-red-life)',
                    onClick: handleSell, disabled: !canSell,
                })}
            </div>

            {/* ── AUTOMATION ROW ── */}
            <div
                className="nd-mono"
                style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14,
                    fontSize: 10, letterSpacing: 1, color: 'var(--nd-dim)',
                    padding: '0 4px',
                }}
            >
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={!!activeAutoCombine}
                        onChange={(e) => setActiveAutoCombine && setActiveAutoCombine(e.target.checked)}
                        style={{ accentColor: 'var(--nd-crimson)', width: 12, height: 12 }}
                    />
                    AUTO-FUSE ON ROLL
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={!!autoNextWave}
                        onChange={(e) => setAutoNextWave && setAutoNextWave(e.target.checked)}
                        style={{ accentColor: 'var(--nd-crimson)', width: 12, height: 12 }}
                    />
                    AUTO NEXT WAVE
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="최대 배속 슬라이더">
                    <span>MAX SPEED</span>
                    <select
                        value={maxGameSpeed ?? 5}
                        onChange={(e) => setMaxGameSpeed && setMaxGameSpeed(Number(e.target.value))}
                        className="nd-mono nd-tnum"
                        style={{
                            background: 'var(--nd-bg-2)', border: '1px solid var(--nd-hair)',
                            color: '#fff', padding: '2px 6px', fontSize: 10, letterSpacing: 1,
                        }}
                    >
                        <option value={3}>×3</option>
                        <option value={4}>×4</option>
                        <option value={5}>×5</option>
                    </select>
                </label>
                {presetCount > 0 && (
                    <button
                        type="button" onClick={clearAllT4RolePresets}
                        title="저장된 T4 역할 프리셋 초기화"
                        className="nd-mono"
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--nd-amber)', textDecoration: 'underline',
                            fontSize: 10, letterSpacing: 1, padding: 0, marginLeft: 'auto',
                        }}
                    >
                        ◇ RESET T4 PRESET ({presetCount})
                    </button>
                )}
            </div>

            {/* ── TABS + GRID PANEL ── */}
            <div className="nd-panel relative" style={{ overflow: 'hidden' }}>
                <HoloReticle />

                {/* Tab header */}
                <div className="nd-tabs" style={{ gap: 0, padding: '0 14px' }}>
                    {[
                        { k: 'tower',   label: 'ARSENAL', count: `${inventory.length}/${ECONOMY.maxInventory}`,        c: 'var(--nd-crimson)' },
                        { k: 'support', label: 'SUPPORT', count: `${supportInventory.length}/${ECONOMY.maxSupportInventory}`, c: 'var(--nd-amber)' },
                    ].map(t => {
                        const active = activeTab === t.k;
                        return (
                            <button
                                key={t.k} type="button" onClick={() => setActiveTab(t.k)}
                                className={'nd-tab' + (active ? ' nd-tab--active' : '')}
                                style={{
                                    color: active ? '#fff' : t.c,
                                    borderBottomColor: active ? t.c : 'transparent',
                                    paddingLeft: 0, paddingRight: 18,
                                }}
                            >
                                {t.label}
                                <span
                                    className="nd-tnum"
                                    style={{
                                        marginLeft: 6, fontSize: 10, color: active ? 'var(--nd-amber)' : 'var(--nd-dimmer)',
                                        fontWeight: 500, letterSpacing: 1,
                                    }}
                                >
                                    {t.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter chips + sort toggle */}
                <div
                    style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4,
                        padding: '6px 10px', borderBottom: '1px solid var(--nd-hair)',
                    }}
                >
                    <button
                        type="button" onClick={() => setActiveFilter(null)}
                        className="nd-mono"
                        style={{
                            fontSize: 9, letterSpacing: 1, padding: '2px 8px',
                            background: activeFilter === null ? 'rgba(255,255,255,0.06)' : 'transparent',
                            border: '1px solid ' + (activeFilter === null ? 'var(--nd-hair-strong)' : 'var(--nd-hair)'),
                            color: activeFilter === null ? '#fff' : 'var(--nd-dim)',
                            cursor: 'pointer',
                        }}
                        title="전체 보기"
                    >
                        ALL
                    </button>
                    {activeTab === 'tower'
                        ? [0, 1, 2, 3, 4, 5].map(elIdx => {
                            const info = getElementInfo(elIdx);
                            const active = towerFilter === elIdx;
                            return (
                                <button
                                    key={'fc-' + elIdx} type="button"
                                    onClick={() => setTowerFilter(active ? null : elIdx)}
                                    title={info.name + ' 필터'}
                                    style={{
                                        fontSize: 11, padding: '2px 6px',
                                        border: '1px solid ' + (active ? info.color : 'var(--nd-hair)'),
                                        background: active ? `${info.color}1f` : 'transparent',
                                        color: active ? '#fff' : info.color,
                                        cursor: 'pointer',
                                        boxShadow: active ? `0 0 4px ${info.color}` : 'none',
                                    }}
                                >
                                    {info.icon}
                                </button>
                            );
                        })
                        : [0, 1, 2, 3].map(stIdx => {
                            const info = SUPPORT_UI[stIdx];
                            const active = supportFilter === stIdx;
                            return (
                                <button
                                    key={'fs-' + stIdx} type="button"
                                    onClick={() => setSupportFilter(active ? null : stIdx)}
                                    title={info.name + ' 필터'}
                                    style={{
                                        fontSize: 11, padding: '2px 6px',
                                        border: '1px solid ' + (active ? info.color : 'var(--nd-hair)'),
                                        background: active ? `${info.color}1f` : 'transparent',
                                        color: active ? '#fff' : info.color,
                                        cursor: 'pointer',
                                        boxShadow: active ? `0 0 4px ${info.color}` : 'none',
                                    }}
                                >
                                    {info.icon}
                                </button>
                            );
                        })}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="nd-mono" style={{ fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1.5 }}>
                            SORT
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                const next = sortMode === 'tier' ? 'group' : sortMode === 'group' ? 'combinable' : 'tier';
                                setSortMode(next);
                            }}
                            title="정렬 모드 전환"
                            className="nd-mono"
                            style={{
                                fontSize: 9, letterSpacing: 1, padding: '2px 8px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--nd-hair)', color: 'var(--nd-text)',
                                cursor: 'pointer',
                            }}
                        >
                            {sortMode === 'tier' ? '◆ TIER ↓' : sortMode === 'group' ? '◇ GROUP' : '⚡ FUSABLE'}
                        </button>
                    </div>
                </div>

                {/* Inventory grid */}
                <div style={{ padding: 8 }}>
                    {activeTab === 'tower' ? (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_SIZE}px, 1fr))`,
                                gap: 4,
                            }}
                        >
                            {Array.from({ length: towerFilter === null ? ECONOMY.maxInventory : sortedInventory.length }, (_, i) => {
                                const neon = sortedInventory[i];
                                if (!neon) {
                                    return (
                                        <div
                                            key={'empty-' + i}
                                            style={{
                                                aspectRatio: '1',
                                                border: '1px dashed var(--nd-hair)',
                                                background: 'rgba(255,255,255,0.015)',
                                            }}
                                        />
                                    );
                                }
                                const isSelected = selectedInventory.some(n => n.id === neon.id);
                                const isInPlacementMode = selectedTowerForPlacement && selectedTowerForPlacement.id === neon.id;
                                const elementInfo = getElementInfo(neon.element);
                                const url = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(neon.element, neon.tier) : null;
                                const groupKey = neon.tier + ':' + (neon.colorIndex ?? neon.element ?? 0);
                                const fusableHint = !isSelected && !isInPlacementMode && (towerGroupCounts[groupKey] || 0) >= 3 && neon.tier < 4;

                                let borderColor = `${neon.color}55`;
                                let boxShadow = 'none';
                                let bgFill = `linear-gradient(135deg, ${neon.color}26 0%, rgba(0,0,0,0.4) 100%)`;
                                if (isInPlacementMode) {
                                    borderColor = 'var(--nd-gold)';
                                    boxShadow = '0 0 8px var(--nd-gold)';
                                } else if (isSelected) {
                                    borderColor = '#fff';
                                    boxShadow = `0 0 8px ${neon.color}`;
                                    bgFill = `linear-gradient(135deg, ${neon.color}40 0%, rgba(0,0,0,0.3) 100%)`;
                                }

                                return (
                                    <div
                                        key={neon.id}
                                        onClick={(e) => { e.stopPropagation(); handleInventoryClick(neon); }}
                                        className="inventory-item"
                                        style={{
                                            aspectRatio: '1', position: 'relative',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: bgFill,
                                            border: `1px solid ${borderColor}`,
                                            color: neon.color, cursor: 'pointer', boxShadow,
                                            transition: 'border-color 0.12s, box-shadow 0.12s',
                                        }}
                                        title={neon.name + '\nTier ' + neon.tier + '\n' + elementInfo.icon + ' ' + elementInfo.name + ': ' + elementInfo.desc}
                                    >
                                        {/* tier badge — handoff spec: top-left, mono, element color chip */}
                                        <span
                                            className="nd-mono"
                                            style={{
                                                position: 'absolute', top: 2, left: 3, zIndex: 2,
                                                fontSize: 9, padding: '0 4px',
                                                background: neon.color, color: '#000',
                                                fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.4,
                                            }}
                                        >
                                            T{neon.tier}
                                        </span>
                                        {/* fusable hint */}
                                        {fusableHint && (
                                            <span
                                                className="nd-motion-pulse"
                                                style={{
                                                    position: 'absolute', top: 2, right: 4, zIndex: 2,
                                                    fontSize: 9, color: 'var(--nd-green)',
                                                    fontWeight: 700, textShadow: '0 0 4px var(--nd-green)',
                                                }}
                                            >
                                                ⚡
                                            </span>
                                        )}
                                        {url
                                            ? <img src={url} alt="" draggable={false}
                                                style={{
                                                    width: '85%', height: '85%', objectFit: 'contain',
                                                    pointerEvents: 'none',
                                                    filter: `drop-shadow(0 0 3px ${neon.color})`,
                                                }} />
                                            : <span style={{ fontSize: 16 }}>{elementInfo.icon}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(auto-fill, minmax(${TILE_SIZE}px, 1fr))`,
                                gap: 4,
                            }}
                        >
                            {Array.from({ length: supportFilter === null ? ECONOMY.maxSupportInventory : sortedSupportInventory.length }, (_, i) => {
                                const support = sortedSupportInventory[i];
                                if (!support) {
                                    return (
                                        <div
                                            key={'support-empty-' + i}
                                            style={{
                                                aspectRatio: '1',
                                                border: '1px dashed var(--nd-hair)',
                                                background: 'rgba(255,255,255,0.015)',
                                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                            }}
                                        />
                                    );
                                }
                                const isSelected = selectedSupportInventory.some(s => s.id === support.id);
                                const isInPlacementMode = selectedTowerForPlacement && selectedTowerForPlacement.id === support.id;
                                const supportInfo = SUPPORT_UI[support.supportType];
                                const url = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(support.supportType, support.tier) : null;
                                const groupKey = support.tier + ':s' + (support.supportType ?? 0);
                                const fusableHint = !isSelected && !isInPlacementMode && (supportGroupCounts[groupKey] || 0) >= 3 && support.tier < 3;

                                let borderColor = `${support.color}55`;
                                let boxShadow = 'none';
                                let bgFill = `linear-gradient(135deg, ${support.color}26 0%, rgba(0,0,0,0.4) 100%)`;
                                if (isInPlacementMode) {
                                    borderColor = 'var(--nd-gold)';
                                    boxShadow = '0 0 8px var(--nd-gold)';
                                } else if (isSelected) {
                                    borderColor = '#fff';
                                    boxShadow = `0 0 8px ${support.color}`;
                                    bgFill = `linear-gradient(135deg, ${support.color}40 0%, rgba(0,0,0,0.3) 100%)`;
                                }

                                return (
                                    <div
                                        key={support.id}
                                        onClick={(e) => { e.stopPropagation(); handleInventoryClick(support); }}
                                        className="inventory-item"
                                        style={{
                                            aspectRatio: '1', position: 'relative',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: bgFill,
                                            border: `1px solid ${borderColor}`,
                                            color: support.color, cursor: 'pointer', boxShadow,
                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                            transition: 'border-color 0.12s, box-shadow 0.12s',
                                        }}
                                        title={support.name + '\nS' + support.tier + '\n' + supportInfo.icon + ' ' + supportInfo.name}
                                    >
                                        <span
                                            className="nd-mono"
                                            style={{
                                                position: 'absolute', top: '14%', left: '50%',
                                                transform: 'translateX(-50%)', zIndex: 2,
                                                fontSize: 8, padding: '0 4px',
                                                background: support.color, color: '#000',
                                                fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.4,
                                            }}
                                        >
                                            S{support.tier}
                                        </span>
                                        {fusableHint && (
                                            <span
                                                className="nd-motion-pulse"
                                                style={{
                                                    position: 'absolute', top: '18%', right: '18%', zIndex: 2,
                                                    fontSize: 9, color: 'var(--nd-green)',
                                                    fontWeight: 700, textShadow: '0 0 4px var(--nd-green)',
                                                }}
                                            >
                                                ⚡
                                            </span>
                                        )}
                                        {url
                                            ? <img src={url} alt="" draggable={false}
                                                style={{
                                                    width: '78%', height: '78%', objectFit: 'contain',
                                                    pointerEvents: 'none',
                                                    filter: `drop-shadow(0 0 3px ${support.color})`,
                                                }} />
                                            : <span style={{ fontSize: 16 }}>{supportInfo.icon}</span>}
                                    </div>
                                );
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
