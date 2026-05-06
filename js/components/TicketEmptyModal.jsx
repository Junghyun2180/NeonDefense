// Neon Defense — TicketEmptyModal
// 티켓 부족 상태에서 게임 시작 시도 시 표시.
// 사양: Plan/TICKET_AND_ADS_DESIGN.md §5.2

const TicketEmptyModal = ({ isOpen, onClose, onWatchAdSuccess }) => {
  const { useState } = React;
  const [adInProgress, setAdInProgress] = useState(false);

  if (!isOpen) return null;

  const handleWatchAd = () => {
    if (typeof AdManager === 'undefined') return;
    setAdInProgress(true);
    AdManager.showRewarded({
      source: 'ticket-refill',
      onReward: () => {
        if (typeof PlayTicketSystem !== 'undefined') {
          PlayTicketSystem.refillByAd();
        }
        if (typeof onWatchAdSuccess === 'function') onWatchAdSuccess();
      },
      onClose: () => {
        setAdInProgress(false);
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--nd-panel, #0f1117)',
          border: '2px solid var(--nd-amber, #fbbf24)',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '420px',
          width: '90%',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--nd-text, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--nd-amber, #fbbf24)', fontSize: '1.2rem' }}>
          🎟️ 플레이 티켓 부족
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', lineHeight: 1.6, fontSize: '0.95rem' }}>
          게임을 시작하려면 티켓 1장이 필요합니다.
          광고를 시청하면 즉시 +2장을 받을 수 있습니다.
        </p>
        <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem' }}>
          💡 자연 충전: 10분당 1장 (최대 5장)
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          <button
            type="button"
            onClick={handleWatchAd}
            disabled={adInProgress}
            style={{
              padding: '0.8rem',
              background: adInProgress ? 'var(--nd-muted, #475569)' : 'var(--nd-amber, #fbbf24)',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: adInProgress ? 'wait' : 'pointer',
            }}
          >
            {adInProgress ? '광고 시청 중...' : '📺 광고 보고 +2 티켓'}
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem',
              background: 'transparent',
              color: 'var(--nd-text, #e2e8f0)',
              border: '1px solid var(--nd-border, #334155)',
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
};

window.TicketEmptyModal = TicketEmptyModal;
