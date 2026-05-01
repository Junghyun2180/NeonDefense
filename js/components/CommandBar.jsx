// CommandBar — Holographic Command top-right panel (handoff §05).
// Lives on row 1 col 2 of the game grid, aligned with the game header on the
// left. Hosts speed selector + DEPLOY (primary action) + audio/help icons.
//
// Speed is hard-capped at ×3 (gameplay decision — higher rates broke
// targeting feel during balance testing).
const SPEED_MAX = 3;
const SPEED_OPTIONS = [1, 2, 3];

const CommandBar = ({
    gameSpeed = 1,
    setGameSpeed = null,
    isPlaying = false,
    startWave = null,
    bgmEnabled = false,
    sfxEnabled = false,
    toggleBgm = null,
    toggleSfx = null,
    onShowHelp = null,
    onShowOptions = null,
    compact = false,
}) => {
    // 모바일 가로(compact) 일 때 인라인 토큰을 줄여 row 1 height 압축.
    const z = {
        panelPadding: compact ? '4px 8px' : '10px 14px',
        panelGap:     compact ? 4 : 8,
        rowGap:       compact ? 5 : 8,
        labelSize:    compact ? 7 : 9,
        speedFont:    compact ? 9 : 11,
        speedPad:     compact ? '2px 5px' : '4px 8px',
        speedMinW:    compact ? 22 : 30,
        iconPadHV:    compact ? '2px 5px' : '4px 7px',
        iconFont:     compact ? 9 : 12,
        deployPad:    compact ? '5px 8px' : '14px',
        deployFont:   compact ? 10 : 14,
        deploySpace:  compact ? 1.5 : 3,
    };
    const rowStyle = { display: 'flex', alignItems: 'center', gap: z.rowGap, width: '100%' };

    return (
        <div
            className="nd-topbar-panel"
            style={{
                fontFamily: 'var(--nd-font-sans)',
                padding: z.panelPadding,
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: z.panelGap,
                height: '100%',
            }}
        >
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />

            {/* Top row: SPEED label + selector + audio/help icons */}
            <div style={rowStyle}>
                <span
                    className="nd-mono"
                    style={{
                        fontSize: z.labelSize, color: 'var(--nd-crimson)', letterSpacing: 2.5,
                        fontWeight: 700,
                    }}
                >
                    ◇ SPEED
                </span>
                {setGameSpeed && (
                    <div style={{ display: 'flex', gap: 3 }}>
                        {SPEED_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => setGameSpeed(s)}
                                className={'nd-speed-btn' + (gameSpeed === s ? ' nd-speed-btn--active' : '')}
                                title={`${s}배속`}
                                style={{ fontSize: z.speedFont, padding: z.speedPad, minWidth: z.speedMinW }}
                            >×{s}</button>
                        ))}
                    </div>
                )}
                {/* spacer pushes icons to the right */}
                <div style={{ flex: 1 }} />
                {toggleBgm && (
                    <button
                        onClick={toggleBgm}
                        title="BGM 토글"
                        aria-label="BGM 토글"
                        className="nd-mono"
                        style={{
                            background: bgmEnabled ? 'rgba(199,125,255,0.15)' : 'transparent',
                            border: '1px solid ' + (bgmEnabled ? 'rgba(199,125,255,0.45)' : 'var(--nd-hair)'),
                            color: bgmEnabled ? 'var(--nd-el-dark)' : 'var(--nd-dim)',
                            padding: z.iconPadHV, fontSize: z.iconFont, cursor: 'pointer', letterSpacing: 1,
                            lineHeight: 1,
                        }}
                    >♪</button>
                )}
                {toggleSfx && (
                    <button
                        onClick={toggleSfx}
                        title="효과음 토글"
                        aria-label="효과음 토글"
                        className="nd-mono"
                        style={{
                            background: sfxEnabled ? 'rgba(199,125,255,0.15)' : 'transparent',
                            border: '1px solid ' + (sfxEnabled ? 'rgba(199,125,255,0.45)' : 'var(--nd-hair)'),
                            color: sfxEnabled ? 'var(--nd-el-dark)' : 'var(--nd-dim)',
                            padding: z.iconPadHV, fontSize: z.iconFont, cursor: 'pointer', letterSpacing: 1,
                            lineHeight: 1,
                        }}
                    >♬</button>
                )}
                {onShowHelp && (
                    <button
                        onClick={onShowHelp}
                        className="nd-mono"
                        title="도움말"
                        aria-label="도움말"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--nd-hair-strong)',
                            color: 'var(--nd-text)',
                            padding: z.iconPadHV, fontSize: z.iconFont, cursor: 'pointer',
                            letterSpacing: 1, fontWeight: 700, lineHeight: 1,
                        }}
                    >?</button>
                )}
                {onShowOptions && (
                    <button
                        onClick={onShowOptions}
                        className="nd-mono"
                        title={typeof I18n !== 'undefined' ? I18n.t('options.open') : '옵션 열기'}
                        aria-label={typeof I18n !== 'undefined' ? I18n.t('options.open') : '옵션 열기'}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--nd-hair-strong)',
                            color: 'var(--nd-text)',
                            padding: z.iconPadHV, fontSize: z.iconFont, cursor: 'pointer',
                            letterSpacing: 1, fontWeight: 700, lineHeight: 1,
                        }}
                    >⚙</button>
                )}
            </div>

            {/* Bottom row: full-width DEPLOY (primary action, hero element) */}
            {startWave && (
                <button
                    onClick={() => !isPlaying && startWave()}
                    disabled={isPlaying}
                    className="nd-btn-deploy"
                    style={{
                        width: '100%',
                        padding: z.deployPad,
                        fontSize: z.deployFont,
                        letterSpacing: z.deploySpace,
                        fontWeight: 800,
                    }}
                >
                    {isPlaying ? '⏳ IN COMBAT' : '▶ DEPLOY'}
                </button>
            )}
        </div>
    );
};

window.CommandBar = CommandBar;
