// GameMap - 게임 맵 컴포넌트
const GameMap = ({
    mapRef,
    mapScale = 1,
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
    selectedTowerForPlacement,
    cancelPlacementMode,
    selectedTowers,
    selectedSupportTowers,
    selectedInventory,
    selectedSupportInventory,
    gameSpeed,
    setGameSpeed,
    maxGameSpeed = 5,
    bgmEnabled,
    sfxEnabled,
    toggleBgm,
    toggleSfx,
    setShowHelp,
    toggleTowerSelect,
    toggleSupportTowerSelect,
    handleTileClick,
    getElementInfo,
    selectedEnemyId,
    setSelectedEnemyId,
}) => {
    const speedOptions = React.useMemo(() => {
        const max = Math.max(3, Math.min(5, maxGameSpeed));
        const opts = [];
        for (let i = 1; i <= max; i++) opts.push(i);
        return opts;
    }, [maxGameSpeed]);
    const { useMemo } = React;

    // 모듈러 타일 선택용: 경로 이동 인접성 맵 (grid 근접이 아닌 실제 경로 기반)
    const pathAdjacency = useMemo(() => buildPathAdjacency(pathData), [pathData]);

    // 조합 미리보기: 맵 타워 1개 이상 + 인벤토리 합 = 3, 같은 element/tier, tier < 4 일 때
    // 결과는 selectedTowers[0] 위치에 생성됨 (combineTowers 로직과 동일)
    const combinePreview = useMemo(() => {
        const inv = selectedInventory || [];
        const supInv = selectedSupportInventory || [];
        // 공격 타워 조합
        if (selectedTowers.length > 0) {
            const total = selectedTowers.length + inv.length;
            if (total === 3) {
                const first = selectedTowers[0];
                const baseTier = first.tier;
                const baseElem = first.colorIndex ?? first.element;
                if (baseTier < 4) {
                    const all = [...selectedTowers, ...inv];
                    const same = all.every(t => t.tier === baseTier && (t.colorIndex ?? t.element) === baseElem);
                    if (same) {
                        return {
                            kind: 'tower',
                            resultId: first.id,
                            consumedIds: selectedTowers.slice(1).map(t => t.id),
                            nextTier: baseTier + 1,
                            element: baseElem,
                        };
                    }
                }
            }
        }
        // 서포트 타워 조합
        if (selectedSupportTowers.length > 0) {
            const total = selectedSupportTowers.length + supInv.length;
            if (total === 3) {
                const first = selectedSupportTowers[0];
                const baseTier = first.tier;
                const baseType = first.supportType;
                if (baseTier < 3) {
                    const all = [...selectedSupportTowers, ...supInv];
                    const same = all.every(s => s.tier === baseTier && s.supportType === baseType && s.isSupport);
                    if (same) {
                        return {
                            kind: 'support',
                            resultId: first.id,
                            consumedIds: selectedSupportTowers.slice(1).map(t => t.id),
                            nextTier: baseTier + 1,
                            supportType: baseType,
                        };
                    }
                }
            }
        }
        return null;
    }, [selectedTowers, selectedInventory, selectedSupportTowers, selectedSupportInventory]);

    // 속성 인덱스 → orb 이미지 URL
    const ELEMENT_KEYS = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    const getElementOrbUrl = (element) => `assets/icons/elements/${ELEMENT_KEYS[element]}.png`;
    const getStatusIconUrl = (type) => `assets/icons/status/${type}.png`;
    // 방향 화살표 (▶◀▲▼) PNG 옵션 — assets/icons/arrows/{right,left,down,up}.png 가 있으면 사용
    const ARROW_DIR = { '▶': 'right', '◀': 'left', '▼': 'down', '▲': 'up' };
    const [arrowPng, setArrowPng] = React.useState(() => ({ right: null, left: null, down: null, up: null }));
    React.useEffect(() => {
        const probe = (dir) => new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(`assets/icons/arrows/${dir}.png`);
            img.onerror = () => resolve(null);
            img.src = `assets/icons/arrows/${dir}.png`;
        });
        Promise.all(['right', 'left', 'down', 'up'].map(probe)).then(([r, l, d, u]) => {
            if (r || l || d || u) setArrowPng({ right: r, left: l, down: d, up: u });
        });
    }, []);
    // 스프라이트 로드 완료 감지 → 리렌더 트리거 (preload 비동기)
    const [spritesReady, setSpritesReady] = React.useState(() =>
        (typeof TowerSprite !== 'undefined' && TowerSprite._available?.size > 0)
        || (typeof EnemySprite !== 'undefined' && EnemySprite._available?.size > 0)
        || (typeof SupportSprite !== 'undefined' && SupportSprite._available?.size > 0));
    React.useEffect(() => {
        const h = () => setSpritesReady(true);
        window.addEventListener('tower-sprites-ready', h);
        window.addEventListener('enemy-sprites-ready', h);
        window.addEventListener('support-sprites-ready', h);
        return () => {
            window.removeEventListener('tower-sprites-ready', h);
            window.removeEventListener('enemy-sprites-ready', h);
            window.removeEventListener('support-sprites-ready', h);
        };
    }, []);

    return (
        <div className="relative">
            {/* 컨트롤 바: 좌(배속) / 가운데(배치 취소) / 우(음소거+?) — 항상 같은 높이 */}
            <div className="flex justify-between items-center mb-2 px-1">
                {/* 좌: 배속 */}
                <div className="flex gap-1">
                    {speedOptions.map(s => (
                        <button
                            key={s}
                            onClick={() => setGameSpeed(s)}
                            className={'px-2.5 py-1 rounded text-sm font-bold transition-all ' + (gameSpeed === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
                            style={gameSpeed === s ? { boxShadow: '0 0 10px rgba(0,255,255,0.5)' } : {}}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                {/* 가운데: 배치 취소 (없을 땐 투명하게 공간 유지) */}
                <button
                    onClick={cancelPlacementMode}
                    className="px-4 py-1 bg-red-700 border border-red-500 rounded-lg text-sm font-bold text-white hover:bg-red-600 transition-all"
                    style={{ visibility: selectedTowerForPlacement ? 'visible' : 'hidden', touchAction: 'manipulation' }}
                >
                    ✕ 배치 취소
                </button>

                {/* 우: 음소거 + 도움말 */}
                <div className="flex gap-1 items-center">
                    <button onClick={toggleBgm} className={'px-2 py-1 rounded text-sm transition-all ' + (bgmEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="BGM 토글">🎵</button>
                    <button onClick={toggleSfx} className={'px-2 py-1 rounded text-sm transition-all ' + (sfxEnabled ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500')} title="효과음 토글">🔊</button>
                    <button onClick={() => setShowHelp(true)} className="w-8 h-8 rounded-full bg-gray-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400 hover:bg-gray-700 hover:border-cyan-400 transition-all" style={{ boxShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                        <span className="text-sm font-bold">?</span>
                    </button>
                </div>
            </div>

            <div className="relative mx-auto overflow-hidden" style={{ width: GRID_WIDTH * TILE_SIZE * mapScale, height: GRID_HEIGHT * TILE_SIZE * mapScale }}>
                <div ref={mapRef} className="relative" style={{ width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE, transform: `scale(${mapScale})`, transformOrigin: 'top left' }}>
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
                                const hasSupport = supportTowers.some(t => t.gridX === x && t.gridY === y);
                                const canPlace = !isPath && !hasTower && !hasSupport;
                                const isPlacementAvailable = !!selectedTowerForPlacement && canPlace && !isDropPreview && !isSelectedTile;
                                let extraClass = '';
                                if (isPlacementAvailable) extraClass = 'tile-placement-available';
                                if (isDropPreview) extraClass = dropPreview.valid ? 'drop-preview-valid' : 'drop-preview-invalid';
                                if (isSelectedTile) extraClass = 'ring-2 ring-white ring-opacity-80';

                                // v4: 모든 path 타일은 단일 omnidirectional conduit 사용 (방향은 화살표 overlay로 표시)
                                // 구 클래스명(path-tile / grass-tile)도 함께 부여 — 레거시 E2E/선택자 호환
                                const tileClass = isPath
                                    ? 'tile-path path-tile'
                                    : 'tile-grass grass-tile';
                                // 경로별 색상 틴트는 제거 — 타일 이미지 자체의 네온 색상 유지 (셀 박스 사라지게)
                                const pathStyle = {};

                                const startPath = startPoint && pathData.paths.find(p => p.startPoint.id === startPoint.id);
                                const endPaths = endPoint && pathData.paths.filter(p => p.endPoint.id === endPoint.id);

                                return (
                                    <div key={x + '-' + y} className={'absolute ' + tileClass + ' ' + extraClass + (canPlace && !isSelectedTile ? ' cursor-pointer hover:brightness-125' : '')} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, ...pathStyle }} onClick={() => handleTileClick(x, y)}>
                                        {startPoint && startPath && (() => {
                                            // 경로 방향에 따른 화살표 결정
                                            const tiles = startPath.tiles;
                                            let startArrow = '▶';
                                            if (tiles.length > 1) {
                                                const dx = tiles[1].x - tiles[0].x;
                                                const dy = tiles[1].y - tiles[0].y;
                                                if (dx > 0) startArrow = '▶';
                                                else if (dx < 0) startArrow = '◀';
                                                else if (dy > 0) startArrow = '▼';
                                                else if (dy < 0) startArrow = '▲';
                                            }
                                            const arrowColor = startPath.id === 'A' ? '#FFD700' : startPath.color;
                                            const arrowDir = ARROW_DIR[startArrow];
                                            const arrowImg = arrowPng[arrowDir];
                                            return (
                                                <div className="tile-start w-full h-full flex items-center justify-center relative">
                                                    {arrowImg ? (
                                                        <img src={arrowImg} alt="" draggable={false}
                                                            className="relative z-10"
                                                            style={{ width: 18, height: 18, filter: `drop-shadow(0 0 6px ${arrowColor})` }} />
                                                    ) : (
                                                        <span className="text-lg font-bold relative z-10" style={{ color: arrowColor, textShadow: '0 0 8px ' + arrowColor + ', 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', filter: 'drop-shadow(0 0 6px ' + arrowColor + ')' }}>{startArrow}</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        {endPoint && endPaths && endPaths.length > 0 && !pathData.isSquareMap && (
                                            <div className="tile-end w-full h-full" />
                                        )}
                                        {!startPoint && !endPoint && pathArrows[`${x},${y}`] && pathArrows[`${x},${y}`].length > 0 && (
                                            <div className="w-full h-full flex items-center justify-center pointer-events-none flex-wrap gap-0" style={{ opacity: 0.9 }}>
                                                {pathArrows[`${x},${y}`].map((arrowInfo, idx) => {
                                                    // 화살표 방향 판별 (→←↓↑) → PNG 매핑
                                                    const turnDir = arrowInfo.arrow === '→' ? 'right'
                                                        : arrowInfo.arrow === '←' ? 'left'
                                                        : arrowInfo.arrow === '↓' ? 'down'
                                                        : arrowInfo.arrow === '↑' ? 'up'
                                                        : ARROW_DIR[arrowInfo.arrow];
                                                    const png = arrowPng[turnDir];
                                                    if (png) {
                                                        const sz = pathArrows[`${x},${y}`].length > 1 ? 12 : 16;
                                                        return <img key={idx} src={png} alt="" draggable={false}
                                                            style={{ width: sz, height: sz, filter: `drop-shadow(0 0 4px ${arrowInfo.color})` }} />;
                                                    }
                                                    return (
                                                        <span key={idx} style={{ color: arrowInfo.color, fontSize: pathArrows[`${x},${y}`].length > 1 ? '11px' : '14px', lineHeight: 1, fontWeight: 'bold', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 6px ' + arrowInfo.color }}>
                                                            {arrowInfo.arrow}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* 클릭 배치 모드 타워 프리뷰 — 실제 설치될 스프라이트와 동일 (스킨 교체 호환) */}
                                        {isDropPreview && selectedTowerForPlacement && (() => {
                                            const neon = selectedTowerForPlacement;
                                            if (neon.isSupport) {
                                                const supportType = SUPPORT_UI[neon.supportType];
                                                const url = (typeof SupportSprite !== 'undefined') ? SupportSprite.getUrl(neon.supportType, neon.tier) : null;
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none relative">
                                                        <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${supportType.color}40 0%, transparent 70%)`, animation: 'pulse 1s ease-in-out infinite' }} />
                                                        {url
                                                            ? <img src={url} alt="" draggable={false} className="relative z-10" style={{ width: '85%', height: '85%', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${supportType.color})` }} />
                                                            : <span className="text-2xl relative z-10" style={{ filter: `drop-shadow(0 0 8px ${supportType.color})` }}>{supportType.icon}</span>
                                                        }
                                                        <span className="text-xs font-bold text-white absolute bottom-0 right-0 z-10" style={{ textShadow: '0 0 4px #000, 1px 1px 0 #000' }}>S{neon.tier}</span>
                                                    </div>
                                                );
                                            } else {
                                                const elementInfo = getElementInfo(neon.colorIndex);
                                                const url = (typeof TowerSprite !== 'undefined') ? TowerSprite.getUrl(neon.colorIndex, neon.tier) : null;
                                                return (
                                                    <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none relative">
                                                        <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${elementInfo.color}40 0%, transparent 70%)`, animation: 'pulse 1s ease-in-out infinite' }} />
                                                        {url
                                                            ? <img src={url} alt="" draggable={false} className="relative z-10" style={{ width: '85%', height: '85%', objectFit: 'contain', filter: `drop-shadow(0 0 8px ${elementInfo.color})` }} />
                                                            : <span className="text-2xl relative z-10" style={{ filter: `drop-shadow(0 0 8px ${elementInfo.color})` }}>{elementInfo.icon}</span>
                                                        }
                                                        <span className="text-xs font-bold text-white absolute bottom-0 right-0 z-10" style={{ textShadow: '0 0 4px #000, 1px 1px 0 #000' }}>T{neon.tier}</span>
                                                    </div>
                                                );
                                            }
                                        })()}
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
                            const spriteUrl = spritesReady && typeof TowerSprite !== 'undefined' ? TowerSprite.getUrl(tower.element, tower.tier) : null;
                            // 티어별 비율로 표현 — TILE_SIZE 변경 시 자동 비례
                            const SPRITE_SIZE = TILE_SIZE * (tower.tier === 4 ? 1.4 : tower.tier === 3 ? 1.25 : tower.tier === 2 ? 1.1 : 1.0);
                            const isCombineResult = combinePreview && combinePreview.kind === 'tower' && combinePreview.resultId === tower.id;
                            const isCombineConsumed = combinePreview && combinePreview.kind === 'tower' && combinePreview.consumedIds.includes(tower.id);
                            return (
                                <div key={tower.id}>
                                    {isSelected && <div className="absolute rounded-full tower-range pointer-events-none" style={{ left: tower.x - displayRange, top: tower.y - displayRange, width: displayRange * 2, height: displayRange * 2, border: '2px solid ' + (isSelected ? '#ffffff' : tower.color) + '40', background: 'radial-gradient(circle, ' + tower.color + '10 0%, transparent 70%)' }} />}
                                    {/* 조합 결과 위치 표시: 황금 회전 링 */}
                                    {isCombineResult && (
                                        <div className="absolute pointer-events-none combine-result-ring"
                                             style={{ left: tower.x - SPRITE_SIZE / 2 - 6, top: tower.y - SPRITE_SIZE / 2 - 6, width: SPRITE_SIZE + 12, height: SPRITE_SIZE + 12 }} />
                                    )}
                                    {/* 조합 소멸 예정 표시: 빨간 점선 + X */}
                                    {isCombineConsumed && (
                                        <div className="absolute pointer-events-none combine-consumed-mark"
                                             style={{ left: tower.x - SPRITE_SIZE / 2 - 4, top: tower.y - SPRITE_SIZE / 2 - 4, width: SPRITE_SIZE + 8, height: SPRITE_SIZE + 8 }}>
                                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#ff4d6d', textShadow: '0 0 4px #000, 0 0 8px #ff0044' }}>✕</span>
                                        </div>
                                    )}
                                    {spriteUrl ? (
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedTowerForPlacement) cancelPlacementMode();
                                            else toggleTowerSelect(tower);
                                        }} className={'absolute ' + (isSelected ? 'tower-selected' : '')}
                                        style={{
                                            left: tower.x - SPRITE_SIZE / 2,
                                            top: tower.y - SPRITE_SIZE / 2,
                                            width: SPRITE_SIZE,
                                            height: SPRITE_SIZE,
                                            opacity: isCombineConsumed ? 0.4 : (tower.isDebuffed ? 0.6 : 1),
                                            cursor: selectedTowerForPlacement ? 'default' : 'pointer',
                                            filter: isCombineConsumed ? 'grayscale(0.7) brightness(0.85)' : (isSelected ? 'drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px ' + tower.color + ')' : 'drop-shadow(0 0 4px ' + tower.color + '80)'),
                                        }}>
                                            <img src={spriteUrl} alt={tower.name} draggable={false}
                                                 style={{ width: '100%', height: '100%', imageRendering: 'auto', pointerEvents: 'none' }} />
                                            {tower.isPrism && (
                                                <div className="absolute inset-0 pointer-events-none"
                                                     style={{ background: 'conic-gradient(from 0deg, #ff0080, #ffff00, #00ff80, #00ffff, #8000ff, #ff0080)', opacity: 0.25, mixBlendMode: 'screen', borderRadius: '50%' }} />
                                            )}
                                        </div>
                                    ) : (
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedTowerForPlacement) cancelPlacementMode();
                                            else toggleTowerSelect(tower);
                                        }} className={'absolute neon-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: tower.x - 15, top: tower.y - 15, width: 30, height: 30, background: 'radial-gradient(circle, ' + tower.color + ' 0%, ' + tower.color + '80 50%, transparent 70%)', borderRadius: '50%', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + tower.color : undefined, color: tower.color, opacity: tower.isDebuffed ? 0.6 : 1, cursor: selectedTowerForPlacement ? 'default' : 'pointer' }}>
                                            <span className="text-xs font-black text-white drop-shadow-lg">{elementInfo.icon}</span>
                                        </div>
                                    )}
                                    {tower.isPrism && (
                                        <div className="absolute pointer-events-none" style={{ left: tower.x + SPRITE_SIZE / 2 - 12, top: tower.y - SPRITE_SIZE / 2 - 2, fontSize: 14, textShadow: '0 0 4px #fff, 0 0 6px ' + tower.color }}>★</div>
                                    )}
                                    {/* 조합 결과 표시: 우상단에 깔끔한 골드 배지 (T+1) */}
                                    {isCombineResult && (
                                        <div className="absolute pointer-events-none combine-result-badge"
                                            style={{ left: tower.x + SPRITE_SIZE / 2 - 8, top: tower.y - SPRITE_SIZE / 2 - 10 }}>
                                            <span>⬆ T{combinePreview.nextTier}</span>
                                        </div>
                                    )}
                                    {(() => {
                                        // 타워에 적용된 구체적 버프/디버프 아이콘
                                        const nowTs = Date.now();
                                        const icons = [];
                                        if (typeof StatusEffectManager !== 'undefined') {
                                            for (const t of ['attackBuff', 'attackSpeedBuff', 'rangeBuff']) {
                                                if (StatusEffectManager.hasEffect(tower, t, nowTs)) icons.push(t);
                                            }
                                            if (StatusEffectManager.hasEffect(tower, 'attackSpeedDebuff', nowTs)) icons.push('attackSpeedDebuff');
                                        }
                                        // statusEffect가 없지만 isBuffed/isDebuffed 플래그만 켜진 경우 폴백
                                        if (icons.length === 0 && tower.isBuffed) icons.push('attackBuff');
                                        const showGenericDebuff = icons.length === 0 && tower.isDebuffed;
                                        return (
                                            <div className="absolute flex gap-0.5 pointer-events-none" style={{ left: tower.x - 18, top: tower.y - 20 }}>
                                                {icons.map((t, i) => (
                                                    <img key={i} src={getStatusIconUrl(t)} alt={t} draggable={false}
                                                         style={{ width: 12, height: 12, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }} />
                                                ))}
                                                {showGenericDebuff && <span className="text-xs">⬇️</span>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}

                        {/* 서포트 타워 렌더링 */}
                        {supportTowers.map(support => {
                            const isSelected = selectedSupportTowers.some(t => t.id === support.id);
                            const supportInfo = SUPPORT_UI[support.supportType];
                            const supUrl = typeof SupportSprite !== 'undefined' ? SupportSprite.getUrl(support.supportType, support.tier) : null;
                            const SPR_SIZE = support.tier === 3 ? 52 : support.tier === 2 ? 46 : 40;
                            const isCombineResult = combinePreview && combinePreview.kind === 'support' && combinePreview.resultId === support.id;
                            const isCombineConsumed = combinePreview && combinePreview.kind === 'support' && combinePreview.consumedIds.includes(support.id);
                            return (
                                <div key={support.id}>
                                    {isSelected && <div className="absolute rounded-full support-range pointer-events-none" style={{ left: support.x - support.range, top: support.y - support.range, width: support.range * 2, height: support.range * 2, border: '2px dashed ' + (isSelected ? '#ffffff' : support.color) + '60', background: 'radial-gradient(circle, ' + support.color + '15 0%, transparent 70%)' }} />}
                                    {isCombineResult && (
                                        <div className="absolute pointer-events-none combine-result-ring"
                                             style={{ left: support.x - SPR_SIZE / 2 - 6, top: support.y - SPR_SIZE / 2 - 6, width: SPR_SIZE + 12, height: SPR_SIZE + 12 }} />
                                    )}
                                    {isCombineConsumed && (
                                        <div className="absolute pointer-events-none combine-consumed-mark"
                                             style={{ left: support.x - SPR_SIZE / 2 - 4, top: support.y - SPR_SIZE / 2 - 4, width: SPR_SIZE + 8, height: SPR_SIZE + 8 }}>
                                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#ff4d6d', textShadow: '0 0 4px #000, 0 0 8px #ff0044' }}>✕</span>
                                        </div>
                                    )}
                                    {supUrl ? (
                                        <div onClick={(e) => { e.stopPropagation(); if (selectedTowerForPlacement) { cancelPlacementMode(); } else { toggleSupportTowerSelect(support); } }}
                                             className={'absolute ' + (isSelected ? 'tower-selected' : '')}
                                             style={{
                                                 left: support.x - SPR_SIZE / 2,
                                                 top: support.y - SPR_SIZE / 2,
                                                 width: SPR_SIZE, height: SPR_SIZE,
                                                 cursor: selectedTowerForPlacement ? 'default' : 'pointer',
                                                 opacity: isCombineConsumed ? 0.4 : 1,
                                                 filter: isCombineConsumed ? 'grayscale(0.7) brightness(0.85)' : (isSelected
                                                     ? 'drop-shadow(0 0 6px #fff) drop-shadow(0 0 12px ' + support.color + ')'
                                                     : 'drop-shadow(0 0 4px ' + support.color + '90)'),
                                             }}>
                                            <img src={supUrl} alt={supportInfo.name} draggable={false}
                                                 style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
                                        </div>
                                    ) : (
                                        <div onClick={(e) => { e.stopPropagation(); if (selectedTowerForPlacement) { cancelPlacementMode(); } else { toggleSupportTowerSelect(support); } }} className={'absolute support-glow flex items-center justify-center ' + (isSelected ? 'tower-selected' : '')} style={{ left: support.x - 15, top: support.y - 15, width: 30, height: 30, background: 'linear-gradient(135deg, ' + support.color + ' 0%, ' + support.color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', border: isSelected ? '3px solid #ffffff' : 'none', boxShadow: isSelected ? '0 0 20px #ffffff, 0 0 30px ' + support.color : '0 0 10px ' + support.color, cursor: selectedTowerForPlacement ? 'default' : 'pointer' }}>
                                            <span className="text-sm">{supportInfo.icon}</span>
                                        </div>
                                    )}
                                    {/* 서포트 조합 결과 표시: 우상단 골드 배지 */}
                                    {isCombineResult && (
                                        <div className="absolute pointer-events-none combine-result-badge"
                                            style={{ left: support.x + SPR_SIZE / 2 - 8, top: support.y - SPR_SIZE / 2 - 10 }}>
                                            <span>⬆ S{combinePreview.nextTier}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* 적 렌더링 */}
                        {enemies.map(enemy => {
                            const config = ENEMY_CONFIG[enemy.type];
                            if (!config) {
                                console.warn(`[GameMap] Unknown enemy type: ${enemy.type}`, enemy);
                                return null;
                            }
                            const now = Date.now();
                            const isBurning = StatusEffectManager.hasEffect(enemy, 'burn', now);
                            const isSlowed = StatusEffectManager.hasEffect(enemy, 'slow', now);
                            const isFrozen = StatusEffectManager.hasEffect(enemy, 'freeze', now);
                            const isStunned = StatusEffectManager.hasEffect(enemy, 'stun', now);
                            const isVulnerable = StatusEffectManager.hasEffect(enemy, 'vulnerability', now);
                            const isRegenerating = StatusEffectManager.hasEffect(enemy, 'regeneration', now);
                            const activeStatusIcons = [
                                isBurning && 'burn',
                                isFrozen ? 'freeze' : (isSlowed && 'slow'),
                                isStunned && 'stun',
                                isVulnerable && 'vulnerability',
                                isRegenerating && 'regeneration',
                            ].filter(Boolean);
                            const enemyUrl = typeof EnemySprite !== 'undefined' ? EnemySprite.getUrl(enemy.type) : null;
                            // 적 크기 — boss는 크게, 일반은 기본, fast는 약간 작게
                            // 합의 10: W5 미니보스(elite)는 일반 elite 보다 크게
                            // TILE_SIZE 비율로 표현 → TILE_SIZE 변경 시 자동 비례
                            const SIZE = TILE_SIZE * (
                                enemy.type === 'boss' ? 1.2
                                : enemy.isMiniboss ? 1.1
                                : enemy.type === 'elite' ? 0.95
                                : enemy.type === 'fast' ? 0.65
                                : enemy.type === 'splitter' ? 0.7
                                : 0.8
                            );
                            const isEnemySelected = selectedEnemyId === enemy.id;
                            return (
                                <div
                                    key={enemy.id}
                                    data-enemy-id={enemy.id}
                                    data-enemy-type={enemy.type}
                                    className="absolute enemy-clickable"
                                    style={{ left: enemy.x - SIZE / 2, top: enemy.y - SIZE / 2, cursor: selectedTowerForPlacement ? 'default' : 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (selectedTowerForPlacement) { cancelPlacementMode(); return; }
                                        setSelectedEnemyId && setSelectedEnemyId(prev => prev === enemy.id ? null : enemy.id);
                                    }}
                                >
                                    {isEnemySelected && (
                                        <div className="absolute pointer-events-none rounded-full" style={{
                                            left: -4, top: -4, width: SIZE + 8, height: SIZE + 8,
                                            border: '2px solid #fbbf24', boxShadow: '0 0 12px #fbbf24, 0 0 24px #fbbf24aa'
                                        }} />
                                    )}
                                    {EnemySystem.isDebuffer(enemy) && (
                                        <div className="absolute rounded-full opacity-20 pointer-events-none" style={{ left: SIZE / 2 - (enemy.debuffRange || 80), top: SIZE / 2 - (enemy.debuffRange || 80), width: (enemy.debuffRange || 80) * 2, height: (enemy.debuffRange || 80) * 2, background: enemy.type === 'jammer' ? 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' : 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
                                    )}
                                    {enemyUrl ? (() => {
                                        // 방향(Lerp) + 수평 flip + 상하 바빙
                                        const rotDeg = (enemy.facingAngle || 0) * 180 / Math.PI;
                                        const flip = enemy.facingFlip || 1;
                                        const bobY = Math.sin(enemy.bobPhase || 0) * 1.8;
                                        return (
                                            <img
                                                src={enemyUrl}
                                                alt={enemy.type}
                                                draggable={false}
                                                style={{
                                                    width: SIZE, height: SIZE,
                                                    imageRendering: 'auto',
                                                    transform: `translateY(${bobY.toFixed(2)}px) rotate(${rotDeg.toFixed(1)}deg) scaleX(${flip})`,
                                                    transformOrigin: 'center center',
                                                    filter: isFrozen ? 'hue-rotate(200deg) brightness(1.3)'
                                                          : isBurning ? 'drop-shadow(0 0 6px #FF6B6B)'
                                                          : isSlowed ? 'drop-shadow(0 0 4px #45B7D1) brightness(0.85)'
                                                          : 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        );
                                    })() : (
                                        <div className={config.size + ' ' + config.color + ' rounded-sm transform rotate-45'} style={{ boxShadow: config.shadow }} />
                                    )}
                                    {/* 실드 게이지 (HP 바 위, 청록) — shieldMax > 0 일 때만 */}
                                    {(enemy.shieldMax || 0) > 0 && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded">
                                            <div className="h-full bg-cyan-400 rounded" style={{ width: (Math.max(0, enemy.shield) / enemy.shieldMax * 100) + '%', boxShadow: enemy.shield > 0 ? '0 0 4px #22d3ee' : 'none' }} />
                                        </div>
                                    )}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-800 rounded">
                                        <div className="h-full bg-green-500 rounded enemy-health-bar" style={{ width: (enemy.health / enemy.maxHealth * 100) + '%' }} />
                                    </div>
                                    {/* 방어력 표시 (HP 바 우측, 작은 숫자) */}
                                    {(enemy.armor || 0) > 0 && (
                                        <div className="absolute -top-2 left-1/2 ml-3.5 text-[8px] leading-none font-bold text-yellow-300" style={{ textShadow: '0 0 2px #000, 0 0 4px #000' }}>
                                            {enemy.armor}
                                        </div>
                                    )}
                                    {activeStatusIcons.length > 0 && (
                                        <div className="absolute -top-5 left-1/2 flex gap-0.5 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                                            {activeStatusIcons.map((type, idx) => (
                                                <img
                                                    key={idx}
                                                    src={getStatusIconUrl(type)}
                                                    alt={type}
                                                    draggable={false}
                                                    style={{ width: 14, height: 14, filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* 투사체 — 속성별 orb 이미지 */}
                        {projectiles.map(proj => {
                            const orbUrl = getElementOrbUrl(proj.element);
                            const SIZE = 20;
                            return (
                                <img
                                    key={proj.id}
                                    src={orbUrl}
                                    alt=""
                                    draggable={false}
                                    className="absolute pointer-events-none"
                                    style={{
                                        left: proj.x - SIZE / 2,
                                        top: proj.y - SIZE / 2,
                                        width: SIZE,
                                        height: SIZE,
                                        filter: `drop-shadow(0 0 4px ${proj.color}) drop-shadow(0 0 8px ${proj.color})`,
                                    }}
                                />
                            );
                        })}

                        {/* 이펙트 */}
                        {effects.map(effect => {
                            // 기본 이펙트 클래스
                            let effectClass = effect.type === 'explosion' ? 'explosion' : 'hit';
                            if (effect.type === 'burn') effectClass = 'burning-effect';
                            if (effect.type === 'slow') effectClass = 'slowed-effect';
                            if (effect.type === 'knockback') effectClass = 'knockback-effect';
                            if (effect.type === 'heal') effectClass = 'heal-effect';
                            if (effect.type === 'split') effectClass = 'split-effect';
                            if (effect.type === 'pierce') effectClass = 'pierce-effect';
                            if (effect.type === 'execute') effectClass = 'execute-effect';

                            // T4 특수 이펙트 - 더 크고 화려하게
                            let size = 30;
                            let extraStyle = {};
                            // 적-속성 상성 시각 신호 (hit 이펙트 한정, 추천 라벨 없음)
                            // 약점: 1.5배 크기 + 밝기↑ 채도↑    (강하게 박혔다는 느낌)
                            // 저항: 0.6배 크기 + 어둡게 채도↓   (제대로 안 박혔다는 느낌)
                            let affinityFilterPart = '';
                            if (effect.type === 'hit' && effect.affinity) {
                                if (effect.affinity === 'weak') {
                                    size = 45;
                                    affinityFilterPart = ' brightness(1.5) saturate(1.4)';
                                    extraStyle.boxShadow = '0 0 18px ' + (effect.color || '#fff') + 'cc, 0 0 32px ' + (effect.color || '#fff') + '80';
                                } else if (effect.affinity === 'resist') {
                                    size = 18;
                                    affinityFilterPart = ' brightness(0.55) saturate(0.55)';
                                }
                            }
                            if (effect.type.startsWith('t4-')) {
                                size = 50; // T4 이펙트는 더 큼
                                const t4Type = effect.type.replace('t4-', '');

                                // 애니메이션 이름 매핑
                                const animMap = {
                                    'fire-spread': 't4FireSpread',
                                    'fire-stack': 't4FireStack',
                                    'fire-fast': 't4FireFast',
                                    'ice-freeze': 't4IceFreeze',
                                    'ice-aoe': 't4IceAoe',
                                    'ice-knockback': 't4IceKnockback',
                                    'elec-chain': 't4ElecChain',
                                    'elec-first': 't4ElecFirst',
                                    'elec-stun': 't4ElecStun',
                                    'wind-aoe': 't4WindAoe',
                                    'wind-pull': 't4WindPull',
                                    'wind-gust': 't4WindGust',
                                    'void-synergy': 't4VoidSynergy',
                                    'void-pierce': 't4VoidPierce',
                                    'void-balance': 't4VoidBalance',
                                    'light-crit': 't4LightCrit',
                                    'light-hit': 't4LightHit',
                                    'light-knockback': 't4LightKnockback',
                                    'light-fast': 't4LightFast',
                                };

                                const anim = animMap[t4Type];
                                if (anim) {
                                    extraStyle.animation = `${anim} 0.6s ease-out forwards`;
                                }

                                // AOE 이펙트는 범위 표시
                                if (effect.radius) {
                                    size = effect.radius * 2;
                                }

                                effectClass = ''; // CSS 클래스 대신 인라인 애니메이션 사용
                            }

                            // 스킨 호환: assets/effects/<type>.png 가 있으면 PNG 기반,
                            // 없으면 기존 CSS radial-gradient 폴백
                            const effectImgUrl = (typeof EffectSprite !== 'undefined') ? EffectSprite.getUrl(effect.type) : null;
                            return effectImgUrl ? (
                                <img
                                    key={effect.id}
                                    src={effectImgUrl}
                                    alt=""
                                    draggable={false}
                                    className={'absolute pointer-events-none ' + effectClass}
                                    style={{
                                        left: effect.x - size / 2,
                                        top: effect.y - size / 2,
                                        width: size,
                                        height: size,
                                        objectFit: 'contain',
                                        filter: `drop-shadow(0 0 6px ${effect.color}) drop-shadow(0 0 12px ${effect.color}80)` + affinityFilterPart,
                                        ...extraStyle
                                    }}
                                />
                            ) : (
                                <div
                                    key={effect.id}
                                    className={'absolute rounded-full pointer-events-none ' + effectClass}
                                    style={{
                                        left: effect.x - size / 2,
                                        top: effect.y - size / 2,
                                        width: size,
                                        height: size,
                                        background: `radial-gradient(circle, ${effect.color} 0%, transparent 70%)`,
                                        filter: affinityFilterPart ? affinityFilterPart.trim() : 'none',
                                        ...extraStyle
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.GameMap = GameMap;
