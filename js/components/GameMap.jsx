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
    stage = 1,
    wave = 1,
    isPlaying = false,
    spawnConfig = null,
    autoNextWave = false,
    setAutoNextWave = null,
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

    // Holo §9.2.2 — path flow polylines (continuous dashed line per path).
    // Reference: bigger, more elongated arrowheads sit on the line at
    // segment midpoints (between two tile centers). Heads are placed every
    // HEAD_INTERVAL segments, but skipped near the spawn and core so the
    // markers don't crowd those endpoints.
    const HEAD_INTERVAL = 3;  // segments between arrowheads
    const HEAD_SKIP_END = 2;  // tiles to leave clean near spawn and core
    const pathFlows = useMemo(() => {
        if (!pathData?.paths) return [];
        return pathData.paths.map(path => {
            const tiles = path.tiles || [];
            const points = tiles.map(t => ({
                x: t.x * TILE_SIZE + TILE_SIZE / 2,
                y: t.y * TILE_SIZE + TILE_SIZE / 2,
            }));
            const heads = [];
            const lastIdx = tiles.length - 1;
            const startI = Math.max(1, HEAD_SKIP_END + 1);
            const endI   = lastIdx - HEAD_SKIP_END;
            for (let i = startI; i <= endI; i += HEAD_INTERVAL) {
                const a = tiles[i - 1];
                const b = tiles[i];
                if (!a || !b) continue;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                if (dx === 0 && dy === 0) continue;
                heads.push({
                    // midpoint between two tile centers = on the boundary edge
                    x: ((a.x + b.x) / 2) * TILE_SIZE + TILE_SIZE / 2,
                    y: ((a.y + b.y) / 2) * TILE_SIZE + TILE_SIZE / 2,
                    angle: Math.atan2(dy, dx) * 180 / Math.PI,
                });
            }
            return { id: path.id, points, heads };
        });
    }, [pathData]);

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
        <div className="relative" style={{ fontFamily: 'var(--nd-font-sans)' }}>
            {/* CANCEL PLACEMENT — floats over the map, only when actively placing.
                Removes the always-on slim bar that left dead space above the map. */}
            {selectedTowerForPlacement && (
                <button
                    onClick={cancelPlacementMode}
                    className="nd-mono"
                    style={{
                        position: 'absolute',
                        top: 8, left: 8, zIndex: 40,
                        touchAction: 'manipulation',
                        background: 'rgba(255,77,109,0.20)',
                        border: '1px solid var(--nd-red-life)',
                        color: '#fff',
                        padding: '5px 14px', fontSize: 11, letterSpacing: 1.5, fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 0 12px rgba(255,77,109,0.45)',
                    }}
                >
                    ✕ CANCEL PLACEMENT
                </button>
            )}

            {/* Holo map frame: dark + reticle corners + hairline grid baseline */}
            <div className="relative mx-auto overflow-hidden" style={{ width: GRID_WIDTH * TILE_SIZE * mapScale, height: GRID_HEIGHT * TILE_SIZE * mapScale }}>
                <div ref={mapRef} className="relative" style={{ width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE, transform: `scale(${mapScale})`, transformOrigin: 'top left' }}>
                    <div
                        className="nd-game-map-frame nd-game-map-grid absolute inset-0"
                        style={{ '--nd-tile': TILE_SIZE + 'px' }}
                    >
                        <span className="nd-reticle__c nd-reticle__c--tl" />
                        <span className="nd-reticle__c nd-reticle__c--tr" />
                        <span className="nd-reticle__c nd-reticle__c--bl" />
                        <span className="nd-reticle__c nd-reticle__c--br" />

                        {/* T03 · tactical data-stream eyebrows — pure decoration, no pointer events.
                            top-left = sector identifier · top-right = threat level bars
                            (5 bars filled proportionally to stage progression) */}
                        {(() => {
                            const sCfg = spawnConfig || (typeof SPAWN !== 'undefined' ? SPAWN : null);
                            const maxS = sCfg?.maxStage || 30;
                            const filled = Math.max(1, Math.min(5, Math.ceil((stage / maxS) * 5)));
                            const bars = '▮'.repeat(filled) + '▯'.repeat(5 - filled);
                            return (
                                <React.Fragment>
                                    <div
                                        className="nd-mono"
                                        style={{
                                            position: 'absolute', top: 6, left: 10, zIndex: 30,
                                            color: 'var(--nd-crimson)', fontSize: 9, letterSpacing: 2,
                                            pointerEvents: 'none', textShadow: '0 0 4px rgba(8,8,10,0.9)',
                                        }}
                                    >
                                        ▸ TACTICAL MAP · SECTOR-{String(stage).padStart(2, '0')}
                                    </div>
                                    <div
                                        className="nd-mono"
                                        style={{
                                            position: 'absolute', top: 6, right: 10, zIndex: 30,
                                            color: 'var(--nd-amber)', fontSize: 9, letterSpacing: 2,
                                            pointerEvents: 'none', textShadow: '0 0 4px rgba(8,8,10,0.9)',
                                        }}
                                    >
                                        THREAT LVL <span style={{ color: '#fff', marginLeft: 4 }}>{bars}</span>
                                    </div>
                                </React.Fragment>
                            );
                        })()}
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
                                let extraClass = '';
                                // 빨간 점선 프리뷰 비활성화 — 호버 brightness 만으로 충분 (UX 정리)
                                if (isDropPreview) extraClass = dropPreview.valid ? 'nd-tile-drop-valid' : 'nd-tile-drop-invalid';
                                if (isSelectedTile) extraClass = 'nd-tile-selected';

                                // Holo Command spec §9.1: tile composition is CSS-only.
                                // Path tiles get a faint cyan-tinted channel; build tiles
                                // rely entirely on the .nd-game-map-grid hairline baseline.
                                const tileClass = isPath ? 'nd-tile-path' : 'nd-tile-build';
                                const pathStyle = {};

                                const startPath = startPoint && pathData.paths.find(p => p.startPoint.id === startPoint.id);
                                const endPaths = endPoint && pathData.paths.filter(p => p.endPoint.id === endPoint.id);

                                return (
                                    <div key={x + '-' + y} className={'absolute ' + tileClass + ' ' + extraClass + (canPlace && !isSelectedTile ? ' cursor-pointer hover:brightness-125' : '')} style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, ...pathStyle }} onClick={() => handleTileClick(x, y)}>
                                        {startPoint && startPath && (() => {
                                            // SPAWN — 그린 보더 사각 + ▶ (방향은 첫 두 타일 차로 판정)
                                            const tiles = startPath.tiles;
                                            let glyph = '▶';
                                            if (tiles.length > 1) {
                                                const dx = tiles[1].x - tiles[0].x;
                                                const dy = tiles[1].y - tiles[0].y;
                                                if (dx > 0) glyph = '▶';
                                                else if (dx < 0) glyph = '◀';
                                                else if (dy > 0) glyph = '▼';
                                                else if (dy < 0) glyph = '▲';
                                            }
                                            return (
                                                <div className="nd-spawn">
                                                    <span className="nd-spawn__glyph">{glyph}</span>
                                                </div>
                                            );
                                        })()}
                                        {endPoint && endPaths && endPaths.length > 0 && !pathData.isSquareMap && (
                                            // CORE — 레드 보더 사각 + 타겟 마커, 펄스 (CSS keyframe)
                                            <div className="nd-core">
                                                <span className="nd-core__glyph">◎</span>
                                            </div>
                                        )}
                                        {/* Path arrows are now drawn as a single SVG overlay (see .nd-path-flow below) — no per-tile rendering. */}
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

                        {/* Holo §9.2.2 — path flow: continuous cyan dashed polyline per path,
                            with arrowheads at every turn vertex and at the path end. */}
                        <svg className="nd-path-flow">
                            {pathFlows.map(flow => (
                                <g key={flow.id}>
                                    <polyline
                                        className="nd-path-flow__line"
                                        points={flow.points.map(p => `${p.x},${p.y}`).join(' ')}
                                    />
                                    {flow.heads.map((h, i) => (
                                        <polygon
                                            key={i}
                                            className="nd-path-flow__head"
                                            points="-12,-7 16,0 -12,7"
                                            transform={`translate(${h.x},${h.y}) rotate(${h.angle})`}
                                        />
                                    ))}
                                </g>
                            ))}
                        </svg>

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
                                    {isSelected && <div
                                        className="nd-range"
                                        data-state="selected"
                                        style={{
                                            '--el': tower.color,
                                            left: tower.x - displayRange,
                                            top: tower.y - displayRange,
                                            width: displayRange * 2,
                                            height: displayRange * 2,
                                        }}
                                    />}
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
                                    {isSelected && <div
                                        className="nd-range"
                                        data-state="selected"
                                        style={{
                                            '--el': support.color,
                                            left: support.x - support.range,
                                            top: support.y - support.range,
                                            width: support.range * 2,
                                            height: support.range * 2,
                                        }}
                                    />}
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

            {/* NEXT WAVE preview — inside map column (handoff §05 reference). */}
            {(() => {
                const sCfg = spawnConfig || (typeof SPAWN !== 'undefined' ? SPAWN : null);
                if (!sCfg) return null;
                const wavesTotal = sCfg.wavesPerStage || 10;
                // wave 상태는 이미 "다음에 플레이할 웨이브"를 나타냄 (wave=1이면 W1을 아직 안 한 것)
                const displayStage = stage;
                const displayWave = wave;
                const totalCount = sCfg.enemiesPerWave ? sCfg.enemiesPerWave(displayStage, displayWave) : 0;
                const theme = (typeof WaveThemeSystem !== 'undefined')
                    ? WaveThemeSystem.getTheme(displayStage, displayWave) : null;
                // Hint about likely special enemies based on wave progress
                const dangerTags = [];
                if (displayWave === wavesTotal) dangerTags.push({ icon: '👑', label: 'BOSS', color: 'var(--nd-red-life)' });
                else if (displayWave === 5)     dangerTags.push({ icon: '⭐', label: 'MINIBOSS', color: 'var(--nd-amber)' });
                if (theme) dangerTags.push({ icon: theme.icon, label: theme.name, color: theme.color });

                // 몬스터 구성 미리보기: EnemySystem.determineType의 실제 스폰 알고리즘과 일치시킴
                // — 각 슬롯별로 specialTypes 순회하며 첫 매치 채택 → 후순위 타입은 이전 실패 확률에 의존
                const enemyBreakdown = (() => {
                    if (typeof STAGE_ENEMY_POOL === 'undefined' || typeof SPECIAL_ENEMY_CHANCE === 'undefined') return [];
                    const pool = STAGE_ENEMY_POOL[displayStage] || (typeof ALL_ENEMY_TYPES !== 'undefined' ? ALL_ENEMY_TYPES : []);
                    if (!pool || pool.length === 0) return [];

                    const isBossWave = displayWave === wavesTotal;
                    const isMinibossWave = displayWave === 5;
                    const counts = {};

                    // 보스/미니보스는 마지막 1슬롯에 강제 배치 (EnemySystem.determineType 합의 10)
                    let normalSlots = totalCount;
                    if (isBossWave) {
                        counts['boss'] = 1;
                        normalSlots -= 1;
                    } else if (isMinibossWave) {
                        counts['elite'] = 1;
                        normalSlots -= 1;
                    }

                    if (normalSlots > 0) {
                        const resolvedBoost = theme && typeof WaveThemeSystem !== 'undefined'
                            ? WaveThemeSystem.resolveBoost(theme, pool) : null;
                        const intensity = theme && typeof WaveThemeSystem !== 'undefined'
                            ? WaveThemeSystem.getIntensityProfile(theme.intensity) : null;

                        // determineType과 동일한 정렬 (부스트 타입 우선)
                        let specialTypes = pool.filter(t => t !== 'normal');
                        if (resolvedBoost) {
                            specialTypes = [...specialTypes].sort((a, b) => {
                                const aBoost = resolvedBoost[a] !== undefined ? 1 : 0;
                                const bBoost = resolvedBoost[b] !== undefined ? 1 : 0;
                                return bBoost - aBoost;
                            });
                        }

                        // 체이닝된 기대치: 각 타입이 채택될 확률 = (이전 타입 모두 실패) × 자기 chance
                        let remainingProb = 1;
                        const expectedRatios = {};
                        for (const type of specialTypes) {
                            const config = SPECIAL_ENEMY_CHANCE[type];
                            if (!config) continue;
                            let chance = config.base + (config.perWave || 0) * (displayWave - 1);
                            if (resolvedBoost && intensity) {
                                if (resolvedBoost[type] !== undefined) {
                                    chance = chance + (resolvedBoost[type] - chance) * intensity.boostFactor;
                                } else {
                                    chance *= intensity.nonBoostMultiplier;
                                }
                            }
                            chance = Math.max(0, Math.min(1, chance));
                            expectedRatios[type] = remainingProb * chance;
                            remainingProb *= (1 - chance);
                        }
                        expectedRatios['normal'] = remainingProb;

                        // 정수 분배 (largest-remainder method): 합 = normalSlots 보장
                        const floors = {};
                        const fracs = [];
                        let allocated = 0;
                        for (const [type, ratio] of Object.entries(expectedRatios)) {
                            const exact = normalSlots * ratio;
                            const floor = Math.floor(exact);
                            floors[type] = floor;
                            allocated += floor;
                            fracs.push({ type, frac: exact - floor });
                        }
                        fracs.sort((a, b) => b.frac - a.frac);
                        for (let i = 0; i < normalSlots - allocated; i++) {
                            floors[fracs[i].type] += 1;
                        }
                        for (const [type, c] of Object.entries(floors)) {
                            if (c > 0) counts[type] = (counts[type] || 0) + c;
                        }
                    }

                    // 정렬: boss > elite > 특수 > 일반
                    const order = ['boss', 'elite', 'jammer', 'suppressor', 'healer', 'aegis', 'splitter', 'fast', 'normal'];
                    return order
                        .filter(t => counts[t] > 0)
                        .map(t => ({ type: t, count: counts[t] }));
                })();

                return (
                    <div
                        className="nd-panel relative nd-game-wave-info"
                        style={{
                            marginTop: 8, padding: '12px 14px',
                            display: 'flex', alignItems: 'center', gap: 14,
                        }}
                    >
                        <span className="nd-reticle__c nd-reticle__c--tl" />
                        <span className="nd-reticle__c nd-reticle__c--tr" />
                        <span className="nd-reticle__c nd-reticle__c--bl" />
                        <span className="nd-reticle__c nd-reticle__c--br" />
                        {/* 좌: 웨이브 정보 */}
                        <div style={{ minWidth: 0, flexShrink: 0 }}>
                            <div className="nd-eyebrow" style={{ color: 'var(--nd-crimson)', letterSpacing: 2 }}>
                                {isPlaying ? '▸ CURRENT WAVE' : '▸ NEXT WAVE'}
                            </div>
                            <div
                                className="nd-mono nd-tnum"
                                style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginTop: 2 }}
                            >
                                STAGE {String(displayStage).padStart(2, '0')} · WAVE {String(displayWave).padStart(2, '0')}
                            </div>
                        </div>
                        {/* 중앙: 몬스터 구성 (UNITS 자리 — 크게 표시) */}
                        {enemyBreakdown.length > 0 && (
                            <div style={{
                                display: 'flex', flexWrap: 'wrap',
                                gap: 8, alignItems: 'center',
                                paddingLeft: 14,
                                borderLeft: '1px solid var(--nd-hair)',
                                flexShrink: 1, minWidth: 0,
                            }}>
                                {enemyBreakdown.map(({ type, count }) => {
                                    const enemyUrl = typeof EnemySprite !== 'undefined' ? EnemySprite.getUrl(type) : null;
                                    const cfg = typeof ENEMY_CONFIG !== 'undefined' ? ENEMY_CONFIG[type] : null;
                                    const iconFallback = cfg?.icon || '●';
                                    const color = cfg?.explosionColor || '#9333ea';
                                    const isBoosted = theme?.boost?.[type] !== undefined;
                                    const isElite = type === 'boss' || type === 'elite';
                                    const accent = isBoosted ? theme.color : (isElite ? color : null);
                                    return (
                                        <div
                                            key={type}
                                            title={type}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '4px 10px 4px 6px',
                                                background: accent ? `${accent}18` : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${accent ? accent + '66' : 'var(--nd-hair)'}`,
                                            }}
                                        >
                                            {enemyUrl ? (
                                                <img
                                                    src={enemyUrl}
                                                    alt={type}
                                                    draggable={false}
                                                    style={{
                                                        width: 36, height: 36,
                                                        objectFit: 'contain',
                                                        filter: `drop-shadow(0 0 4px ${color}99)`,
                                                    }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: 22 }}>{iconFallback}</span>
                                            )}
                                            <span
                                                className="nd-mono nd-tnum"
                                                style={{
                                                    fontSize: 16, fontWeight: 700,
                                                    color: accent || '#fff',
                                                    lineHeight: 1,
                                                }}
                                            >
                                                ×{count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {/* 우: 위험 태그 + 테마 + AUTO */}
                        {dangerTags.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {dangerTags.map((t, i) => (
                                    <span
                                        key={i}
                                        className="nd-mono"
                                        title={t.label}
                                        style={{
                                            padding: '3px 8px', fontSize: 9, letterSpacing: 1.2, fontWeight: 700,
                                            background: `${t.color}20`,
                                            border: `1px solid ${t.color}66`,
                                            color: t.color,
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                        }}
                                    >
                                        <span style={{ fontFamily: 'var(--nd-font-sans)' }}>{t.icon}</span>
                                        {t.label}
                                    </span>
                                ))}
                            </div>
                        )}
                        {theme && (
                            <div
                                className="nd-mono"
                                style={{
                                    flex: 1, minWidth: 0,
                                    fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1, lineHeight: 1.4,
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}
                                title={theme.hint}
                            >
                                ◇ {theme.hint}
                            </div>
                        )}
                        {/* AUTO NEXT WAVE */}
                        {setAutoNextWave && (
                            <label
                                style={{
                                    marginLeft: 'auto',
                                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                    padding: '5px 10px',
                                    background: autoNextWave ? 'rgba(255,61,110,0.15)' : 'transparent',
                                    border: '1px solid ' + (autoNextWave ? 'rgba(255,61,110,0.55)' : 'var(--nd-hair-strong)'),
                                    color: autoNextWave ? 'var(--nd-crimson)' : 'var(--nd-dim)',
                                    fontFamily: 'var(--nd-font-mono)',
                                    fontSize: 10, letterSpacing: 1.5, fontWeight: 700,
                                    flexShrink: 0,
                                }}
                                title="웨이브 클리어 후 자동으로 다음 웨이브 시작"
                            >
                                <input
                                    type="checkbox"
                                    checked={!!autoNextWave}
                                    onChange={(e) => setAutoNextWave(e.target.checked)}
                                    style={{ accentColor: 'var(--nd-crimson)', width: 11, height: 11, margin: 0 }}
                                />
                                ▶ AUTO
                            </label>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

window.GameMap = GameMap;
