// DrawResultOverlay - 10연뽑 직후 뽑은 카드 10장을 오버레이로 표시
// 자동조합이 ON이어도 합성 전 원본 결과를 보여주어 "내가 뭘 뽑았나" 즉시 인지 가능.
const DrawResultOverlay = ({ result, getElementInfo, onDismiss }) => {
    const { useEffect } = React;

    useEffect(() => {
        if (!result) return undefined;
        const id = setTimeout(() => onDismiss && onDismiss(), 2500);
        return () => clearTimeout(id);
    }, [result, onDismiss]);

    if (!result) return null;
    const { kind, items, pityApplied, autoCombineActive, count } = result;
    const partial = count < 10;

    return (
        <div
            onClick={onDismiss}
            style={{
                position: 'fixed',
                left: 0, right: 0, bottom: 0,
                paddingBottom: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                pointerEvents: 'auto',
                zIndex: 60,
                animation: 'drawResultSlideUp 0.25s ease-out',
            }}
            className="draw-result-overlay">
            <div
                style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
                }}
                onClick={(e) => e.stopPropagation()}
                className="cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-fuchsia-300">
                        🎲 {kind === 'tower' ? '타워' : '서포트'} 10연뽑 결과 ({items.length}{partial ? '/' + count : ''})
                    </span>
                    <div className="flex items-center gap-2">
                        {pityApplied && (
                            <span className="text-[10px] font-black bg-yellow-600/80 text-yellow-100 px-1.5 py-0.5 rounded">
                                PITY
                            </span>
                        )}
                        {autoCombineActive && (
                            <span className="text-[10px] text-cyan-300 bg-cyan-900/50 px-1.5 py-0.5 rounded">
                                자동 합성됨
                            </span>
                        )}
                        <button onClick={onDismiss} className="text-gray-400 hover:text-white text-xs leading-none px-1" title="닫기">✕</button>
                    </div>
                </div>
                <div className="flex gap-1.5" style={{ flexWrap: 'wrap', maxWidth: '720px' }}>
                    {items.map((item, idx) => {
                        if (kind === 'tower') {
                            const elInfo = getElementInfo ? getElementInfo(item.element ?? item.colorIndex) : null;
                            const sprite = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(item.element ?? item.colorIndex, item.tier) : null;
                            const isPityCard = pityApplied && idx === items.length - 1;
                            return (
                                <div key={'r-' + item.id}
                                    className="draw-result-card"
                                    style={{
                                        width: '52px', height: '52px',
                                        borderRadius: '8px',
                                        border: '2px solid ' + (item.isPrism ? '#fbbf24' : isPityCard ? '#fde047' : item.color || '#888'),
                                        background: 'radial-gradient(circle, ' + (item.color || '#666') + '50 0%, ' + (item.color || '#444') + '20 70%)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative',
                                        boxShadow: item.isPrism ? '0 0 12px #fbbf24, 0 0 24px #fb923c' : isPityCard ? '0 0 8px #fde047' : '0 0 6px ' + (item.color || '#666') + '80',
                                        animation: 'drawResultCardPop 0.4s ease-out backwards',
                                        animationDelay: (idx * 0.04) + 's',
                                    }}>
                                    {sprite
                                        ? <img src={sprite} alt="" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain', filter: 'drop-shadow(0 0 3px ' + (item.color || '#888') + ')' }} />
                                        : <span className="text-base">{elInfo ? elInfo.icon : '◆'}</span>}
                                    <span className="text-[10px] font-black text-white drop-shadow leading-none">T{item.tier}</span>
                                    {item.isPrism && (
                                        <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '12px' }}>✨</span>
                                    )}
                                </div>
                            );
                        }
                        // support
                        const supInfo = (typeof SUPPORT_UI !== 'undefined') ? SUPPORT_UI[item.supportType] : null;
                        const sprite = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(item.supportType, item.tier) : null;
                        return (
                            <div key={'r-' + item.id}
                                className="draw-result-card"
                                style={{
                                    width: '52px', height: '52px',
                                    background: 'linear-gradient(135deg, ' + (item.color || '#888') + '60 0%, ' + (item.color || '#666') + '20 100%)',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 6px ' + (item.color || '#666') + '80',
                                    animation: 'drawResultCardPop 0.4s ease-out backwards',
                                    animationDelay: (idx * 0.04) + 's',
                                }}>
                                {sprite
                                    ? <img src={sprite} alt="" draggable={false} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                                    : <span className="text-sm">{supInfo ? supInfo.icon : '◆'}</span>}
                                <span className="text-[9px] font-black text-white drop-shadow leading-none">S{item.tier}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

window.DrawResultOverlay = DrawResultOverlay;
