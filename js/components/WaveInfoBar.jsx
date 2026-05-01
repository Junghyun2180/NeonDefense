// WaveInfoBar — NEXT/CURRENT WAVE 정보 패널
// GameMap.jsx 에서 분리. 다음/현재 웨이브의 스테이지·웨이브 번호, 적 구성 미리보기,
// 위험 태그(BOSS/MINIBOSS), 테마 힌트, AUTO NEXT WAVE 토글을 한 줄에 표시.
//
// 모바일 레이아웃이 동일 컴포넌트를 재사용하면서 사이즈만 줄이도록 `compact` prop 추가.
// compact=true 일 때 padding/font/icon 사이즈를 70~80% 수준으로 축소.
//
// 의존(글로벌): SPAWN, WaveThemeSystem, STAGE_ENEMY_POOL, SPECIAL_ENEMY_CHANCE,
//              ALL_ENEMY_TYPES, EnemySprite, ENEMY_CONFIG
const WaveInfoBar = ({
    stage = 1,
    wave = 1,
    isPlaying = false,
    spawnConfig = null,
    autoNextWave = false,
    setAutoNextWave = null,
    compact = false,
    narrow = false,   // 좁은 세로 패널 모드 (모바일 가로 letterbox 활용용)
}) => {
    const sCfg = spawnConfig || (typeof SPAWN !== 'undefined' ? SPAWN : null);
    if (!sCfg) return null;

    const wavesTotal = sCfg.wavesPerStage || 10;
    const displayStage = stage;
    const displayWave = wave;
    const totalCount = sCfg.enemiesPerWave ? sCfg.enemiesPerWave(displayStage, displayWave) : 0;
    const theme = (typeof WaveThemeSystem !== 'undefined')
        ? WaveThemeSystem.getTheme(displayStage, displayWave) : null;

    const dangerTags = [];
    if (displayWave === wavesTotal) dangerTags.push({ icon: '👑', label: 'BOSS', color: 'var(--nd-red-life)' });
    else if (displayWave === 5)     dangerTags.push({ icon: '⭐', label: 'MINIBOSS', color: 'var(--nd-amber)' });
    if (theme) dangerTags.push({ icon: theme.icon, label: theme.name, color: theme.color });

    // 몬스터 구성 미리보기 — EnemySystem.determineType 의 실제 스폰 알고리즘과 일치
    const enemyBreakdown = (() => {
        if (typeof STAGE_ENEMY_POOL === 'undefined' || typeof SPECIAL_ENEMY_CHANCE === 'undefined') return [];
        const pool = STAGE_ENEMY_POOL[displayStage] || (typeof ALL_ENEMY_TYPES !== 'undefined' ? ALL_ENEMY_TYPES : []);
        if (!pool || pool.length === 0) return [];

        const isBossWave = displayWave === wavesTotal;
        const isMinibossWave = displayWave === 5;
        const counts = {};

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

            let specialTypes = pool.filter(t => t !== 'normal');
            if (resolvedBoost) {
                specialTypes = [...specialTypes].sort((a, b) => {
                    const aBoost = resolvedBoost[a] !== undefined ? 1 : 0;
                    const bBoost = resolvedBoost[b] !== undefined ? 1 : 0;
                    return bBoost - aBoost;
                });
            }

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

        const order = ['boss', 'elite', 'jammer', 'suppressor', 'healer', 'aegis', 'splitter', 'fast', 'normal'];
        return order
            .filter(t => counts[t] > 0)
            .map(t => ({ type: t, count: counts[t] }));
    })();

    // ── 사이즈 토큰 — compact 여부에 따른 인라인 값 (CSS !important 의존 제거) ──
    const z = {
        marginTop:    compact ? 2 : 8,
        padding:      compact ? '3px 8px' : '12px 14px',
        gap:          compact ? 6 : 14,
        eyebrowSize:  compact ? 7 : 10,
        eyebrowSpace: compact ? 1 : 2,
        stageSize:    compact ? 10 : 14,
        groupGap:     compact ? 4 : 8,
        groupPadL:    compact ? 6 : 14,
        chipPadding:  compact ? '1px 5px 1px 3px' : '4px 10px 4px 6px',
        chipGap:      compact ? 3 : 6,
        imgSize:      compact ? 18 : 36,
        countSize:    compact ? 10 : 16,
        tagPadding:   compact ? '1px 4px' : '3px 8px',
        tagSize:      compact ? 7 : 9,
        themeSize:    compact ? 8 : 9,
        autoPadding:  compact ? '2px 5px' : '5px 10px',
        autoSize:     compact ? 8 : 10,
        autoBoxSize:  compact ? 9 : 11,
    };

    return (
        <div
            className="nd-panel relative"
            style={{
                marginTop: z.marginTop,
                padding: z.padding,
                display: 'flex',
                flexDirection: narrow ? 'column' : 'row',
                alignItems: narrow ? 'stretch' : 'center',
                gap: z.gap,
            }}
        >
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            {/* 좌(narrow=상단): 웨이브 정보 */}
            <div style={{ minWidth: 0, flexShrink: 0 }}>
                <div className="nd-eyebrow" style={{
                    color: 'var(--nd-crimson)',
                    letterSpacing: z.eyebrowSpace,
                    fontSize: z.eyebrowSize,
                }}>
                    {isPlaying ? '▸ CURRENT WAVE' : '▸ NEXT WAVE'}
                </div>
                <div
                    className="nd-mono nd-tnum"
                    style={{ color: '#fff', fontSize: z.stageSize, fontWeight: 700, marginTop: 2, lineHeight: narrow ? 1.25 : 1.4 }}
                >
                    {narrow ? (
                        <>
                            <div>STAGE {String(displayStage).padStart(2, '0')}</div>
                            <div>WAVE {String(displayWave).padStart(2, '0')}</div>
                        </>
                    ) : (
                        <>STAGE {String(displayStage).padStart(2, '0')} · WAVE {String(displayWave).padStart(2, '0')}</>
                    )}
                </div>
            </div>
            {/* 중앙(narrow=중단): 몬스터 구성 — narrow 일 땐 2-column grid 로 wrap */}
            {enemyBreakdown.length > 0 && (
                <div style={narrow ? {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: z.groupGap, alignItems: 'stretch',
                    paddingTop: z.groupPadL,
                    borderTop: '1px solid var(--nd-hair)',
                    minWidth: 0,
                } : {
                    display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
                    gap: z.groupGap, alignItems: 'center',
                    paddingLeft: z.groupPadL,
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
                                    display: 'flex', alignItems: 'center', gap: z.chipGap,
                                    padding: z.chipPadding,
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
                                            width: z.imgSize, height: z.imgSize,
                                            objectFit: 'contain',
                                            filter: `drop-shadow(0 0 4px ${color}99)`,
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: Math.round(z.imgSize * 0.6) }}>{iconFallback}</span>
                                )}
                                <span
                                    className="nd-mono nd-tnum"
                                    style={{
                                        fontSize: z.countSize, fontWeight: 700,
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
            {/* 우(narrow=하단): 위험 태그 + 테마 + AUTO */}
            {dangerTags.length > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    flexWrap: narrow ? 'wrap' : 'nowrap',
                }}>
                    {dangerTags.map((t, i) => (
                        <span
                            key={i}
                            className="nd-mono"
                            title={t.label}
                            style={{
                                padding: z.tagPadding, fontSize: z.tagSize,
                                letterSpacing: 1.2, fontWeight: 700,
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
                        fontSize: z.themeSize, color: 'var(--nd-dim)',
                        letterSpacing: 1, lineHeight: 1.4,
                        // narrow 모드: 좁은 패널에서 잘림 방지 위해 wrap 허용
                        whiteSpace: narrow ? 'normal' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: narrow ? 'clip' : 'ellipsis',
                        wordBreak: narrow ? 'keep-all' : 'normal',
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
                        marginLeft: narrow ? 0 : 'auto',
                        marginTop: narrow ? z.groupPadL : 0,
                        paddingTop: narrow ? z.groupPadL : 0,
                        borderTop: narrow ? '1px solid var(--nd-hair)' : 'none',
                        display: 'flex', alignItems: 'center',
                        justifyContent: narrow ? 'center' : 'flex-start',
                        gap: 6, cursor: 'pointer',
                        padding: z.autoPadding,
                        background: autoNextWave ? 'rgba(255,61,110,0.15)' : 'transparent',
                        border: '1px solid ' + (autoNextWave ? 'rgba(255,61,110,0.55)' : 'var(--nd-hair-strong)'),
                        color: autoNextWave ? 'var(--nd-crimson)' : 'var(--nd-dim)',
                        fontFamily: 'var(--nd-font-mono)',
                        fontSize: z.autoSize, letterSpacing: 1.5, fontWeight: 700,
                        flexShrink: 0,
                    }}
                    title="웨이브 클리어 후 자동으로 다음 웨이브 시작"
                >
                    <input
                        type="checkbox"
                        checked={!!autoNextWave}
                        onChange={(e) => setAutoNextWave(e.target.checked)}
                        style={{
                            accentColor: 'var(--nd-crimson)',
                            width: z.autoBoxSize, height: z.autoBoxSize, margin: 0,
                        }}
                    />
                    ▶ AUTO
                </label>
            )}
        </div>
    );
};

window.WaveInfoBar = WaveInfoBar;
