// SectorTower - 사우론 타워 시각화 (계단형 sector 등반 UI)
// 합의 10: 1 run = 1 sector, sector 가 높아질수록 HP × 1.15^(N-1)
const SectorTower = ({
    highestSector = 0,    // 클리어한 최고 sector (default 0 = 한 번도 못 깸)
    currentSector = null, // 현재 도전 중 sector (없으면 next 로 강조)
    onSelectSector = null,// sector 선택 콜백 (옵션)
    rangeAbove = 3,       // next sector 위로 표시할 칸 수
    rangeBelow = 4,       // next sector 아래로 표시할 칸 수
    showHeader = true,
    compact = false,      // true 면 padding 작게 (인게임 미니버전)
}) => {
    const nextSector = highestSector + 1;
    const focus = currentSector || nextSector;
    // 클리어 만족감을 위해 highestSector 만큼 below 자동 확장 (최대 7)
    const adaptiveBelow = Math.min(7, Math.max(rangeBelow, highestSector));
    const top = focus + rangeAbove;
    const bottom = Math.max(1, focus - adaptiveBelow);

    // 위에서 아래로 (탑은 위, 시작은 아래)
    const sectors = [];
    for (let n = top; n >= bottom; n--) sectors.push(n);

    const itemPad = compact ? 'px-2 py-0.5' : 'px-3 py-2';

    return (
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/40 rounded-lg p-2">
            {showHeader && (
                <div className="flex items-baseline justify-between mb-1.5 px-1">
                    <span className="text-[10px] font-bold text-purple-400 tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>NEON TOWER</span>
                    <span className="text-[9px] text-gray-500">최고 S{highestSector}</span>
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {sectors.map((n, i) => {
                    const cleared = n <= highestSector;
                    const isNext = !currentSector && n === nextSector;
                    const isCurrent = currentSector && n === currentSector;
                    const future = n > nextSector && !isCurrent;
                    // 위로 갈수록 좌측으로 밀려 계단 느낌
                    const indent = (top - n) * (compact ? 6 : 10);

                    let bg = 'bg-gray-800/60 border-gray-700/50 text-gray-500';
                    let icon = '🔒';
                    let iconColor = 'text-gray-600';
                    let glow = '';
                    if (cleared) {
                        bg = 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300';
                        icon = '✓';
                        iconColor = 'text-cyan-400';
                    }
                    if (isNext || isCurrent) {
                        bg = 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-400 text-yellow-200';
                        icon = isCurrent ? '⚔' : '▶';
                        iconColor = 'text-yellow-300';
                        glow = '0 0 12px rgba(250, 204, 21, 0.6)';
                    }
                    if (future) {
                        bg = 'bg-gray-900/40 border-gray-700/30 text-gray-600';
                        icon = '🔒';
                        iconColor = 'text-gray-700';
                    }

                    const clickable = onSelectSector && (cleared || isNext);

                    return (
                        <div
                            key={n}
                            onClick={clickable ? () => onSelectSector(n) : undefined}
                            className={`relative flex items-center gap-1.5 rounded border ${itemPad} ${bg} ${clickable ? 'cursor-pointer hover:brightness-125' : ''} transition-all`}
                            style={{
                                marginLeft: indent + 'px',
                                boxShadow: glow,
                            }}
                            title={future ? `Sector ${n} — 잠김` : (isCurrent ? `Sector ${n} — 현재 도전 중` : (isNext ? `Sector ${n} — 다음 도전` : `Sector ${n} — 클리어`))}
                        >
                            <span className={`${compact ? 'text-sm' : 'text-base'} leading-none ${iconColor}`}>{icon}</span>
                            <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold leading-none ${compact ? '' : 'tracking-wider'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>S{n}</span>
                            {(isNext || isCurrent) && !compact && (
                                <span className="ml-auto text-[10px] text-yellow-300 leading-none font-bold">HP ×{calcSectorHpMultiplier(n).toFixed(2)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {!compact && (
                <p className="text-[9px] text-gray-500 mt-1.5 text-center">한 섹터 = 3 스테이지 × 10 웨이브</p>
            )}
        </div>
    );
};

window.SectorTower = SectorTower;
