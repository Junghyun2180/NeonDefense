// WaveThemeBanner - 새 웨이브 테마가 시작되는 웨이브 진입 시 1.5초 풀스크린 배너
// 코어 정체성 "스테이지마다 메타 변화"의 시각 신호. 테마명 + 아이콘 + 힌트 한 줄.
const WaveThemeBanner = ({ stage, wave, isRunMode }) => {
    const { useState, useEffect } = React;
    const [activeTheme, setActiveTheme] = useState(null);

    useEffect(() => {
        if (isRunMode) return undefined;
        if (typeof WaveThemeSystem === 'undefined') return undefined;
        const starting = WaveThemeSystem.getThemeStartingAt(stage, wave);
        if (!starting) return undefined;
        setActiveTheme(starting);
        const id = setTimeout(() => setActiveTheme(null), 1800);
        return () => clearTimeout(id);
    }, [stage, wave, isRunMode]);

    if (!activeTheme) return null;

    return (
        <div
            style={{
                position: 'fixed',
                left: 0, right: 0, top: '30%',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 65,
                animation: 'waveThemeBannerIn 0.4s ease-out, waveThemeBannerOut 0.4s ease-in 1.4s forwards',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, ' + activeTheme.color + '40 0%, rgba(15,23,42,0.92) 100%)',
                    border: '2px solid ' + activeTheme.color,
                    borderRadius: '12px',
                    padding: '18px 32px',
                    boxShadow: '0 0 40px ' + activeTheme.color + '80, inset 0 0 20px ' + activeTheme.color + '30',
                    minWidth: '320px',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', marginBottom: '4px' }}>
                    WAVE THEME
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '28px' }}>{activeTheme.icon}</span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: activeTheme.color, letterSpacing: '1px' }}>
                        {activeTheme.name}
                    </span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {activeTheme.hint}
                </div>
            </div>
        </div>
    );
};

window.WaveThemeBanner = WaveThemeBanner;
