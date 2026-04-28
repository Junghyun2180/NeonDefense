// FloorTower - 사우론 타워 시각화 (계단형 floor 등반 UI)
// 합의 10: 1 run = 1 floor, floor 가 높아질수록 HP × 1.15^(N-1)
const FloorTower = ({
    highestFloor = 0,    // 클리어한 최고 floor (default 0 = 한 번도 못 깸)
    currentFloor = null, // 현재 도전 중 floor (없으면 next 로 강조)
    onSelectFloor = null,// floor 선택 콜백 (옵션)
    rangeAbove = 3,      // next floor 위로 표시할 칸 수
    rangeBelow = 4,      // next floor 아래로 표시할 칸 수
    showHeader = true,
    compact = false,     // true 면 padding 작게 (인게임 미니버전)
}) => {
    const nextFloor = highestFloor + 1;
    const focus = currentFloor || nextFloor;
    // 클리어 만족감을 위해 highestFloor 만큼 below 자동 확장 (최대 7)
    const adaptiveBelow = Math.min(7, Math.max(rangeBelow, highestFloor));
    const top = focus + rangeAbove;
    const bottom = Math.max(1, focus - adaptiveBelow);

    // 위에서 아래로 (탑은 위, 시작은 아래)
    const floors = [];
    for (let n = top; n >= bottom; n--) floors.push(n);

    const itemPad = compact ? 'px-2 py-0.5' : 'px-3 py-2';

    return (
        <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700/40 rounded-lg p-2">
            {showHeader && (
                <div className="flex items-baseline justify-between mb-1.5 px-1">
                    <span className="text-[10px] font-bold text-purple-400 tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>NEON TOWER</span>
                    <span className="text-[9px] text-gray-500">최고 F{highestFloor}</span>
                </div>
            )}
            <div className="flex flex-col gap-0.5">
                {floors.map((n, i) => {
                    const cleared = n <= highestFloor;
                    const isNext = !currentFloor && n === nextFloor;
                    const isCurrent = currentFloor && n === currentFloor;
                    const future = n > nextFloor && !isCurrent;
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

                    const clickable = onSelectFloor && (cleared || isNext);

                    return (
                        <div
                            key={n}
                            onClick={clickable ? () => onSelectFloor(n) : undefined}
                            className={`relative flex items-center gap-1.5 rounded border ${itemPad} ${bg} ${clickable ? 'cursor-pointer hover:brightness-125' : ''} transition-all`}
                            style={{
                                marginLeft: indent + 'px',
                                boxShadow: glow,
                            }}
                            title={future ? `Floor ${n} — 잠김` : (isCurrent ? `Floor ${n} — 현재 도전 중` : (isNext ? `Floor ${n} — 다음 도전` : `Floor ${n} — 클리어`))}
                        >
                            <span className={`${compact ? 'text-sm' : 'text-base'} leading-none ${iconColor}`}>{icon}</span>
                            <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold leading-none ${compact ? '' : 'tracking-wider'}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>F{n}</span>
                            {(isNext || isCurrent) && !compact && (
                                <span className="ml-auto text-[10px] text-yellow-300 leading-none font-bold">HP ×{calcFloorHpMultiplier(n).toFixed(2)}</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {!compact && (
                <p className="text-[9px] text-gray-500 mt-1.5 text-center">한 층 = 3 스테이지 × 10 웨이브</p>
            )}
        </div>
    );
};

window.FloorTower = FloorTower;
