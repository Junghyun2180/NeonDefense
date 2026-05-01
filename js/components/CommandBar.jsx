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
}) => {
    // Two-row internal layout so panel content fills the grid cell height
    // (cell stretches to match the header on the left, ~118px).
    const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, width: '100%' };

    return (
        <div
            className="nd-topbar-panel"
            style={{
                fontFamily: 'var(--nd-font-sans)',
                padding: '10px 14px',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'space-between',
                gap: 8,
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
                        fontSize: 9, color: 'var(--nd-crimson)', letterSpacing: 2.5,
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
                                style={{ fontSize: 11, padding: '4px 8px', minWidth: 30 }}
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
                            padding: '4px 7px', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
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
                            padding: '4px 7px', fontSize: 12, cursor: 'pointer', letterSpacing: 1,
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
                            padding: '4px 9px', fontSize: 12, cursor: 'pointer',
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
                            padding: '4px 8px', fontSize: 12, cursor: 'pointer',
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
                        padding: '14px',
                        fontSize: 14,
                        letterSpacing: 3,
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
