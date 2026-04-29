// GameHeader — Holographic Command top bar
// Spec: design handoff v1.0 / Page A · Game Play
//   ◇ OPERATION · NEON DEFENSE   ◈ WAVE  ▣ STAGE  ◆ GOLD  ♥ LIFE  ✕ KILLS
const GameHeader = ({ stage, wave, floor = 1, gold, lives, pathCount, isPlaying, killedCount, permanentBuffs = {}, gameMode = null, spawnConfig = null, onMainMenu = null }) => {
    const { useState } = React;
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const activeBuffs = typeof PermanentBuffManager !== 'undefined'
        ? PermanentBuffManager.getActiveBuffsList(permanentBuffs)
        : [];

    const activeSPAWN = spawnConfig || SPAWN;
    const isRunMode = !!gameMode;
    const wavesTotal = activeSPAWN.wavesPerStage;
    const isDangerWave = wave === wavesTotal;
    const enemiesPerWave = activeSPAWN.enemiesPerWave(stage, wave);
    const maxStageLabel = gameMode === 'endless' ? '∞' : activeSPAWN.maxStage;
    const themeTag = (!isRunMode && typeof WaveThemeSystem !== 'undefined')
        ? WaveThemeSystem.getTheme(stage, wave) : null;

    const safePct = (num, den, fallback = 0) => {
        if (!den || !isFinite(den)) return fallback;
        const v = Math.max(0, Math.min(100, (num / den) * 100));
        return Number.isFinite(v) ? v : fallback;
    };

    const vitals = [
        { key: 'wave',  label: 'WAVE',  icon: isDangerWave ? '🚨' : '◈',
          val: `${wave}/${wavesTotal}`, color: isDangerWave ? 'var(--nd-red-life)' : 'var(--nd-crimson)',
          pct: safePct(wave, wavesTotal) },
        { key: 'stage', label: 'STAGE', icon: '▣',
          val: gameMode === 'endless' ? `${stage}/∞` : `${stage}/${maxStageLabel}`,
          color: 'var(--nd-green)',
          pct: gameMode === 'endless' ? 100 : safePct(stage, activeSPAWN.maxStage) },
        { key: 'gold',  label: 'GOLD',  icon: '◆',
          val: Number(gold || 0).toLocaleString(), color: 'var(--nd-gold)',
          // gold has no upper bound — show a flat indicator at 100%
          pct: 100 },
        { key: 'life',  label: 'LIFE',  icon: '♥',
          val: `${lives}`, color: 'var(--nd-red-life)',
          pct: Math.max(0, Math.min(100, lives * 5)) },
        { key: 'kills', label: 'KILLS', icon: '✕',
          val: isPlaying ? `${killedCount}/${enemiesPerWave}` : `${killedCount}`,
          color: 'var(--nd-amber)',
          pct: isPlaying ? safePct(killedCount, enemiesPerWave) : 0 },
    ];

    return (
        <div className="max-w-4xl mx-auto mb-2 sm:mb-4" style={{ fontFamily: 'var(--nd-font-sans)' }}>
            {/* Holographic top bar — single wide panel with reticle corners */}
            <div className="nd-topbar-panel" style={{ marginBottom: 10 }}>
                <span className="nd-reticle__c nd-reticle__c--tl" />
                <span className="nd-reticle__c nd-reticle__c--tr" />
                <span className="nd-reticle__c nd-reticle__c--bl" />
                <span className="nd-reticle__c nd-reticle__c--br" />

                {/* Identity block: back button + OPERATION + sector */}
                <div className="nd-identity">
                    {onMainMenu && (
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="nd-mono"
                            style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'var(--nd-dim)', padding: 0, fontSize: 9, letterSpacing: 2,
                                marginBottom: 2, display: 'block',
                            }}
                            aria-label="메인 메뉴로"
                        >
                            ◀ MAIN
                        </button>
                    )}
                    <div className="nd-identity__op">◇ OPERATION</div>
                    <div className="nd-identity__title">NEON DEFENSE</div>
                    <div className="nd-identity__sector">
                        <span style={{ display: 'inline-block', width: 6, height: 6,
                            background: 'var(--nd-green)', boxShadow: '0 0 6px var(--nd-green)',
                            marginRight: 6, verticalAlign: 'middle' }} />
                        SECTOR-{String(stage).padStart(2, '0')} · {isPlaying ? 'ACTIVE' : 'STANDBY'}
                    </div>
                </div>

                {/* 5 vital stats — equal-width horizontal gauges */}
                <div className="nd-vital-grid">
                    {vitals.map(s => (
                        <div key={s.key} className="nd-vital">
                            <div className="nd-vital__head">
                                <span className="nd-vital__lbl" style={{ color: s.color }}>
                                    <span style={{ marginRight: 4 }}>{s.icon}</span>{s.label}
                                </span>
                                <span className="nd-vital__val">{s.val}</span>
                            </div>
                            <div className="nd-vital__bar">
                                <div style={{
                                    width: `${s.pct}%`,
                                    background: s.color,
                                    boxShadow: `0 0 8px ${s.color}`,
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Secondary chip row — run mode / floor / wave theme / paths.
                These are contextual, only show when relevant. */}
            {(isRunMode || (!isRunMode && floor > 0) || themeTag || pathCount > 1) && (
                <div className="flex flex-wrap items-center gap-2 mb-2 nd-mono" style={{ fontSize: 10, letterSpacing: 1.5 }}>
                    {isRunMode && (
                        <span style={{
                            padding: '4px 10px', border: '1px solid rgba(255,169,77,0.4)',
                            color: 'var(--nd-amber)', background: 'rgba(255,169,77,0.05)',
                        }}>
                            {gameMode === 'endless' ? '♾ ENDLESS' : gameMode === 'daily' ? '◆ DAILY' : '◎ RUN'}
                        </span>
                    )}
                    {!isRunMode && floor > 0 && (
                        <span
                            title={`Floor ${floor} — HP ×${calcFloorHpMultiplier(floor).toFixed(2)}`}
                            style={{
                                padding: '4px 10px', border: '1px solid rgba(199,125,255,0.4)',
                                color: 'var(--nd-el-dark)', background: 'rgba(199,125,255,0.05)',
                            }}>
                            ▲ F{floor}
                        </span>
                    )}
                    {themeTag && (
                        <span
                            title={themeTag.name + ' — ' + themeTag.hint}
                            style={{
                                padding: '4px 10px', border: `1px solid ${themeTag.color}66`,
                                color: themeTag.color, background: `${themeTag.color}10`,
                            }}>
                            {themeTag.icon} {themeTag.name}
                        </span>
                    )}
                    {pathCount > 1 && (
                        <span style={{
                            padding: '4px 10px', border: '1px solid var(--nd-hair-strong)',
                            color: 'var(--nd-dim)',
                        }}>
                            ◇ PATHS · {pathCount}
                        </span>
                    )}
                </div>
            )}

            {/* Active permanent buffs — chip row */}
            {activeBuffs.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {activeBuffs.map(buff => (
                        <div
                            key={buff.id}
                            className="nd-mono"
                            style={{
                                padding: '3px 8px',
                                background: `${buff.color}15`,
                                border: `1px solid ${buff.color}66`,
                                color: buff.color,
                                fontSize: 10, letterSpacing: 1,
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                            title={`${buff.name}: ${buff.description}`}
                        >
                            <span style={{ fontFamily: 'var(--nd-font-sans)' }}>{buff.icon}</span>
                            {buff.stacks > 1 && <span style={{ fontWeight: 700 }}>×{buff.stacks}</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Exit confirm modal — restyled to Holo language */}
            {showExitConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-50"
                    style={{ background: 'rgba(8,8,10,0.78)' }}>
                    <div className="nd-panel nd-panel-strong" style={{
                        background: 'var(--nd-bg-2)', padding: 28, maxWidth: 380, margin: '0 16px',
                        textAlign: 'center', fontFamily: 'var(--nd-font-sans)',
                    }}>
                        <span className="nd-reticle__c nd-reticle__c--tl" />
                        <span className="nd-reticle__c nd-reticle__c--tr" />
                        <span className="nd-reticle__c nd-reticle__c--bl" />
                        <span className="nd-reticle__c nd-reticle__c--br" />
                        <div className="nd-eyebrow nd-eyebrow--amber" style={{ marginBottom: 10 }}>
                            ◆ ABORT OPERATION
                        </div>
                        <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
                            메인 메뉴로 돌아가시겠습니까?
                        </p>
                        <p style={{ color: 'var(--nd-dim)', fontSize: 12, margin: '0 0 22px' }}>
                            현재 진행 상황이 저장되지 않습니다.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setShowExitConfirm(false)} className="nd-btn-ghost">
                                × CANCEL
                            </button>
                            <button onClick={() => { setShowExitConfirm(false); onMainMenu(); }} className="nd-btn-deploy">
                                ▶ EXIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.GameHeader = GameHeader;
