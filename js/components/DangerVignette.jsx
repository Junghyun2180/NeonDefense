// DangerVignette - lives 저하 시 화면 테두리 위험 표시
// lives 5이하: 붉은 vignette
// lives 2이하: 강한 vignette + BGM 피치 다운 (별도 처리)
const DangerVignette = ({ lives, maxLives, isPlaying }) => {
  if (!isPlaying) return null;
  if (lives > 5 || lives <= 0) return null;

  const intensity = lives <= 2 ? 'critical' : 'danger';
  const pulseSpeed = lives <= 2 ? '0.7s' : '1.4s';
  const innerColor = lives <= 2 ? 'rgba(239,68,68,0.6)' : 'rgba(234,88,12,0.35)';
  const outerColor = lives <= 2 ? 'rgba(239,68,68,0.95)' : 'rgba(234,88,12,0.75)';

  return (
    <>
      {/* Vignette 프레임 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9995,
          boxShadow: `inset 0 0 ${lives <= 2 ? 160 : 100}px ${lives <= 2 ? 40 : 20}px ${innerColor}`,
          animation: `pulse ${pulseSpeed} ease-in-out infinite alternate`,
        }}
      />
      {/* 상단 경고 아이콘 */}
      <div
        className="fixed pointer-events-none font-black"
        style={{
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9994,
          color: outerColor,
          fontSize: lives <= 2 ? 22 : 16,
          textShadow: `0 0 10px ${outerColor}, 2px 2px 4px rgba(0,0,0,0.8)`,
          fontFamily: 'Orbitron, sans-serif',
          animation: `pulse ${pulseSpeed} ease-in-out infinite`,
          letterSpacing: 2,
        }}
      >
        {lives <= 2 ? `⚠️ CRITICAL · LIVES ${lives}` : `⚠️ DANGER · LIVES ${lives}`}
      </div>
      <style>{`
        @keyframes pulse {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

window.DangerVignette = DangerVignette;
