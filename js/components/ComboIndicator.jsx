// ComboIndicator - 연속 킬 콤보 카운터 (화면 중앙 상단 펄스)
// 2초 내 추가 킬 없으면 리셋. 마일스톤(10/25/50/100)에서 강조 플래시.
const ComboIndicator = ({ combo, maxCombo }) => {
  const [flash, setFlash] = React.useState(false);
  const prevRef = React.useRef(0);

  React.useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = combo;
    if (combo > prev && (combo === 10 || combo === 25 || combo === 50 || combo === 100)) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    }
  }, [combo]);

  if (!combo || combo < 3) return null;

  // 색상 단계
  let color = '#22D3EE';  // cyan
  if (combo >= 10) color = '#A855F7';  // purple
  if (combo >= 25) color = '#F59E0B';  // amber
  if (combo >= 50) color = '#EF4444';  // red
  if (combo >= 100) color = '#F43F5E'; // rose

  return (
    <div
      className="fixed pointer-events-none select-none"
      style={{
        top: 120,
        left: '50%',
        transform: `translateX(-50%) ${flash ? 'scale(1.35)' : 'scale(1)'}`,
        zIndex: 9996,
        transition: 'transform 200ms ease-out',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'Orbitron, sans-serif',
            fontWeight: 900,
            fontSize: combo >= 50 ? 64 : combo >= 25 ? 52 : combo >= 10 ? 44 : 36,
            color: color,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}80, 2px 2px 4px rgba(0,0,0,0.8)`,
            lineHeight: 1,
            animation: flash ? 'neonPulse 0.6s ease-out' : 'none',
          }}
        >
          {combo} KILLS!
        </div>
        {combo >= 10 && (
          <div style={{ color: color, fontSize: 14, fontWeight: 'bold', marginTop: 4, textShadow: `0 0 10px ${color}` }}>
            {combo >= 100 ? '🔥 GODLIKE' : combo >= 50 ? '🔥 UNSTOPPABLE' : combo >= 25 ? '⚡ RAMPAGE' : '✨ COMBO!'}
          </div>
        )}
      </div>
    </div>
  );
};

window.ComboIndicator = ComboIndicator;
