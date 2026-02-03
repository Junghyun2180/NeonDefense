// GameMap - 게임 맵 컴포넌트
const GameMap = ({
    mapRef,
    pathData,
    pathArrows,
    towers,
    supportTowers,
    enemies,
    projectiles,
    effects,
    chainLightnings,
    dropPreview,
    placementMode,
    selectedTowers,
    selectedSupportTowers,
    gameSpeed,
    setGameSpeed,
    bgmEnabled,
    sfxEnabled,
    toggleBgm,
    toggleSfx,
    setShowHelp,
    toggleTowerSelect,
    toggleSupportTowerSelect,
    handleTileClick,
    getElementInfo,
}) => {
    const { useMemo } = React;

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                        <button
                            key={s}
                            onClick={() => setGameSpeed(s)}
                            className={'px-3 py-1 rounded text-sm font-bold transition-all ' + (gameSpeed === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
                            style={gameSpeed === s ? { boxShadow: '0 0 10px rgba(0,255,255,0.5)' } : {}}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
                <div className="flex gap-1">
                    <button onClick={toggleBgm} className={'px-2 py-1 rounded text-sm transition-all ' + (bgmEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="BGM 토글">🎵</button>
                    <button onClick={toggleSfx} className={'px-2 py-1 rounded text-sm transition-all ' + (sfxEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="효과음 토글">🔊</button>
                </div>
                <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-gray-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-gray-700 hover:border-cyan-400 transition-all" style={{ boxShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                    <span className="text-sm font-bold">?</span>
                </button>
            </div>

            <div ref={mapRef} className="relative mx-auto" style={{ width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE }}>
                <div className="absolute inset-0 rounded-lg overflow-hidden border-2 border-cyan-500/30" style={{ boxShadow: '0 0 30px rgba(78, 205, 196, 0.2), inset 0 0 30px rgba(0,0,0,0.5)' }}>
                    {Array.from({ length: GRID_HEIGHT }, (_, y) => (
                        Array.from({ length: GRID_WIDTH }, (_, x) => {
                            let pathInfo = null;
                            for (const path of pathData.paths) {
                                if (path.tiles.some(p => p.x === x && p.y === y)) { pathInfo = path; break; }
                            }
                            const isPath = pathInfo !== null;
                            const hasTower = towers.some(t => t.gridX === x && t.gridY === y);
                            const startPoint = pathData.startPoints.find(sp => sp.x === x && sp.y === y);
                            const endPoint = pathData.endPoints.find(ep => ep.x === x && ep.y === y);
                            const isDropPreview = dropPreview && dropPreview.gridX === x && dropPreview.gridY === y;
                            const isSelectedTile = placementMode && placementMode.gridX === x && placementMode.gridY === y;
                            const canPlace = !isPath && !hasTower;
                            let extraClass = '';
                            if (isDropPreview) extraClass = dropPreview.valid ? 'drop-preview-valid' : 'drop-preview-invalid';
                            if (isSelectedTile) extraClass = 'ring-2 ring-white ring-opacity-80';
                            const pathStyle = isPath && pathInfo ? { backgroundColor: pathInfo.color + '40', borderColor: pathInfo.color + '60' } : {};

                            const startPath = startPoint && pathData.paths.find(p => p.startPoint.id === startPoint.id);
                            const endPaths = endPoint && pathData.paths.filter(p => p.endPoint.id === endPoint.id);

                            return (
                                <div key={x + '-' + y} className={'absolute ' + (isPath ? 'path-tile' : 'grass-tile') + ' ' + extraClass + (canPlace && !isSelectedTile ? ' cursor-pointer hover:brightness-125' : '')} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, ...pathStyle }} onClick={() => canPlace && handleTileClick(x, y)}>
                                    {startPoint && startPath && (() => {
                                        // 경로 방향에 따른 화살표 결정
                                        const tiles = startPath.tiles;
                                        let startArrow = '▶'; // 기본값
                                        if (tiles.length > 1) {
                                            const dx = tiles[1].x - tiles[0].x;
                                            const dy = tiles[1].y - tiles[0].y;
                                            if (dx > 0) startArrow = '▶';
                                            else if (dx < 0) startArrow = '◀';
                                            else if (dy > 0) startArrow = '▼';
                                            else if (dy < 0) startArrow = '▲';
                                        }
                                        // 첫 번째 경로(A)는 노란색, 나머지는 경로별 색상
                                        const arrowColor = startPath.id === 'A' ? '#FFD700' : startPath.color;
                                        return (
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, ' + arrowColor + '50 0%, transparent 70%)' }}>
                                                <span className="text-lg font-bold" style={{ color: arrowColor, textShadow: '0 0 8px ' + arrowColor + ', 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', filter: 'drop-shadow(0 0 6px ' + arrowColor + ')' }}>{startArrow}</span>
                                            </div>
                                        );
                                    })()}
                                    {endPoint && endPaths && endPaths.length > 0 && (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(255,100,100,0.5) 0%, transparent 70%)' }}>
                                            <span className="text-lg" style={{ filter: 'drop-shadow(0 0 6px #FF6666)' }}>🏠</span>
                                        </div>
                                    )}
                                    {!startPoint && !endPoint && pathArrows[`${x},${y}`] && pathArrows[`${x},${y}`].length > 0 && (
                                        <div className="w-full h-full flex items-center justify-center pointer-events-none flex-wrap gap-0" style={{ opacity: 0.9 }}>
                                            {pathArrows[`${x},${y}`].map((arrowInfo, idx) => (
                                                <span key={idx} style={{ color: arrowInfo.color, fontSize: pathArrows[`${x},${y}`].length > 1 ? '11px' : '14px', lineHeight: 1, fontWeight: 'bold', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 6px ' + arrowInfo.color }}>
                                                    {arrowInfo.arrow}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ))}

                    {/* 체인 라이트닝 SVG */}
                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                        {chainLightnings.map(chain => (
                            <line key={chain.id} x1={chain.x1} y1={chain.y1} x2={chain.x2} y2={chain.y2} stroke="#FFD93D" strokeWidth="3" className="chain-lightning" style={{ filter: 'drop-shadow(0 0 5px #FFD93D)' }} />
                        ))}
                    </svg>

                    {/* 타워 렌더링 */}
                    {towers.map(tower => {
                        const isSelected = selectedTowers.some(t => t.id === tower.id);
                        const elementInfo = getElementInfo(tower.element);
                        const displayRange = tower.effectiveRange || tower.range;
                        return (
                            <div key={tower.id} onClick={() => toggleTowerSelect(tower)} style={{ cursor: 'pointer' }}>
                                <div className="absolute rounded-full tower-range pointer-events-none" style={{ left: tower.x - displayRange, top: tower.y - displayRange, width: displayRange * 2, height: displayRange * 2, border: '2px solid ' + (isSelected ? '#ffffff' : tower.color) + '40', background: 'radial-gradient(circle, ' + tower.color + '10 0%, transparent 70%)' }} />
                                <div className={'absolute neon-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: tower.x - 15, top: tower.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + tower.color + ' 0%, ' + tower.color + '80 50%, transparent 70%)', borderRadius: '50%', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + tower.color : undefined, color: tower.color, opacity: tower.isDebuffed ? 0.6 : 1 }}>
                                    <span className="text-xs font-black text-white drop-shadow-lg">{elementInfo.icon}</span>
                                </div>
                                <div className="absolute text-xs font-bold text-white" style={{ left: tower.x - 8, top: tower.y + 12, textShadow: '0 0 3px black' }}>T{tower.tier}</div>
                                {tower.isDebuffed && <div className="absolute text-xs" style={{ left: tower.x + 8, top: tower.y - 15 }}>⬇️</div>}
                                {tower.isBuffed && <div className="absolute text-xs" style={{ left: tower.x + 8, top: tower.y - 15 }}>⬆️</div>}
                            </div>
                        );
                    })}

                    {/* 서포트 타워 렌더링 */}
                    {supportTowers.map(support => {
                        const isSelected = selectedSupportTowers.some(t => t.id === support.id);
                        const supportInfo = SUPPORT_UI[support.supportType];
                        return (
                            <div key={support.id} onClick={() => toggleSupportTowerSelect(support)} style={{ cursor: 'pointer' }}>
                                <div className="absolute rounded-full support-range pointer-events-none" style={{ left: support.x - support.range, top: support.y - support.range, width: support.range * 2, height: support.range * 2, border: '2px dashed ' + (isSelected ? '#ffffff' : support.color) + '60', background: 'radial-gradient(circle, ' + support.color + '15 0%, transparent 70%)' }} />
                                <div className={'absolute support-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: support.x - 15, top: support.y - 15, width: 30, height: 30, background: 'linear-gradient(135deg, ' + support.color + ' 0%, ' + support.color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + support.color : '0 0 10px ' + support.color }}>
                                    <span className="text-sm">{supportInfo.icon}</span>
                                </div>
                                <div className="absolute text-xs font-bold text-white" style={{ left: support.x - 6, top: support.y + 12, textShadow: '0 0 3px black' }}>S{support.tier}</div>
                            </div>
                        );
                    })}

                    {/* 적 렌더링 */}
                    {enemies.map(enemy => {
                        const config = ENEMY_CONFIG[enemy.type];
                        const isBurning = enemy.burnEndTime > Date.now();
                        const isSlowed = enemy.slowEndTime > Date.now();
                        return (
                            <div key={enemy.id} className="absolute" style={{ left: enemy.x - 12, top: enemy.y - 12 }}>
                                {EnemySystem.isDebuffer(enemy) && (
                                    <div className="absolute rounded-full opacity-20 pointer-events-none" style={{ left: 12 - (enemy.debuffRange || 80), top: 12 - (enemy.debuffRange || 80), width: (enemy.debuffRange || 80) * 2, height: (enemy.debuffRange || 80) * 2, background: enemy.type === 'jammer' ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' : 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
                                )}
                                <div className={config.size + ' ' + config.color + ' rounded-sm transform rotate-45'} style={{ boxShadow: config.shadow }} />
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded">
                                    <div className="h-full bg-green-500 rounded enemy-health-bar" style={{ width: (enemy.health / enemy.maxHealth * 100) + '%' }} />
                                </div>
                                {isBurning && <div className="absolute -top-4 left-0 text-xs burning-effect">🔥</div>}
                                {isSlowed && <div className="absolute -top-4 right-0 text-xs slowed-effect">❄️</div>}
                                {config.icon && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs">{config.icon}</div>}
                            </div>
                        );
                    })}

                    {/* 투사체 */}
                    {projectiles.map(proj => (
                        <div key={proj.id} className="absolute w-3 h-3 rounded-full" style={{ left: proj.x - 6, top: proj.y - 6, background: proj.color, boxShadow: '0 0 10px ' + proj.color + ', 0 0 20px ' + proj.color }} />
                    ))}

                    {/* 이펙트 */}
                    {effects.map(effect => {
                        let effectClass = effect.type === 'explosion' ? 'explosion' : 'hit';
                        if (effect.type === 'burn') effectClass = 'burning-effect';
                        if (effect.type === 'slow') effectClass = 'slowed-effect';
                        if (effect.type === 'knockback') effectClass = 'knockback-effect';
                        return <div key={effect.id} className={'absolute rounded-full ' + effectClass} style={{ left: effect.x - 15, top: effect.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + effect.color + ' 0%, transparent 70%)' }} />;
                    })}
                </div>
            </div>
        </div>
    );
};

window.GameMap = GameMap;
