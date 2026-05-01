// FloatingFuseButton — 합성 가능 시 viewport 하단에 floating action 노출.
// 모바일에서 인벤토리/SELECTED UNIT 카드를 스크롤하지 않고 바로 합성하기 위한 단축 버튼.
// 우선순위: 맵 합성(맵 타워+인벤 자동선택) → 인벤토리 단독 합성.
const FloatingFuseButton = ({
    selectedInventory,
    selectedTowers,
    selectedSupportInventory,
    selectedSupportTowers,
    canCombineTowers,
    canCombineSupportTowers,
    combineNeons,
    combineSupports,
    combineTowers,
    combineSupportTowers,
    getElementInfo,
}) => {
    const sameType = (arr, key) => arr.length > 0 && arr.every(it => it[key] === arr[0][key] && it.tier === arr[0].tier);
    const towerInvReady = selectedInventory.length === 3
        && selectedInventory[0].tier < 4
        && sameType(selectedInventory, 'colorIndex');
    const supportInvReady = selectedSupportInventory.length === 3
        && selectedSupportInventory[0].tier < 3
        && sameType(selectedSupportInventory, 'supportType');
    const towerMapReady = !!canCombineTowers;
    const supportMapReady = !!canCombineSupportTowers;

    if (!towerInvReady && !supportInvReady && !towerMapReady && !supportMapReady) return null;

    let label = 'FUSE';
    let color = '#ffd60a';
    let onClick = null;
    let icon = '⚡';

    if (towerMapReady) {
        const t = selectedTowers[0];
        const info = getElementInfo(t.element);
        const nextTier = Math.min(4, t.tier + 1);
        color = t.color;
        onClick = combineTowers;
        label = `T${nextTier} ${info.name || info.icon || ''} 합성`;
    } else if (supportMapReady) {
        const s = selectedSupportTowers[0];
        const nextTier = Math.min(3, s.tier + 1);
        color = s.color;
        onClick = combineSupportTowers;
        label = `S${nextTier} 합성`;
    } else if (towerInvReady) {
        const t = selectedInventory[0];
        const info = getElementInfo(t.element);
        const nextTier = Math.min(4, t.tier + 1);
        color = t.color;
        onClick = combineNeons;
        label = `T${nextTier} ${info.name || info.icon || ''} 합성`;
    } else if (supportInvReady) {
        const s = selectedSupportInventory[0];
        const nextTier = Math.min(3, s.tier + 1);
        color = s.color;
        onClick = combineSupports;
        label = `S${nextTier} 합성`;
    }

    if (!onClick) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="nd-mono nd-floating-fuse"
            style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 60,
                padding: '11px 22px',
                background: `linear-gradient(135deg, ${color} 0%, #ffa94d 100%)`,
                color: '#0a0a0f',
                border: `1px solid ${color}`,
                borderRadius: 0,
                fontSize: 12, letterSpacing: 2, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: `0 0 20px ${color}, 0 4px 16px rgba(0,0,0,0.6)`,
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'nd-pulse-soft 1.6s ease-in-out infinite',
                pointerEvents: 'auto',
            }}
            title="선택한 3개를 즉시 합성"
        >
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
};

window.FloatingFuseButton = FloatingFuseButton;
