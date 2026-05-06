// Neon Defense — PlayTicketBadge
// 메인 메뉴 / 헤더에 표시되는 플레이 티켓 위젯.
// 사양: Plan/TICKET_AND_ADS_DESIGN.md §5.1
//
// 표시 형태
//   - 5/5 가득          : 🎟️ 5/5
//   - 충전 중 (3/5)     : 🎟️ 3/5  06:42
//   - 캡 초과 (광고/IAP) : 🎟️ 7/5+
//   - 부족              : 🎟️ 0/5  [+]  (광고 충전 CTA)

const PlayTicketBadge = ({ onRequestRefill = null, compact = false }) => {
  const { useState, useEffect } = React;
  const [, force] = useState(0);

  useEffect(() => {
    if (typeof PlayTicketSystem === 'undefined') return;

    const rerender = () => force(n => n + 1);
    const unsub = PlayTicketSystem.subscribe(rerender);

    // 1초마다 카운트다운 갱신 + 자연 충전 tick 호출
    const interval = setInterval(() => {
      PlayTicketSystem.tick();
      rerender();
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  if (typeof PlayTicketSystem === 'undefined') return null;

  const status = PlayTicketSystem.getStatus();
  const { current, max, msUntilNextCharge, canPlay } = status;
  const isOverCap = current > max;
  const isFull = current >= max && !isOverCap;
  const isEmpty = !canPlay;

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00';
    const totalSec = Math.ceil(ms / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const countLabel = isOverCap ? `${current}/${max}+` : `${current}/${max}`;
  const accent = isEmpty
    ? 'var(--nd-red-life, #f43f5e)'
    : isOverCap
      ? 'var(--nd-cyan, #38bdf8)'
      : isFull
        ? 'var(--nd-green, #22c55e)'
        : 'var(--nd-amber, #fbbf24)';

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: compact ? '0.2rem 0.45rem' : '0.3rem 0.55rem',
    fontSize: compact ? '0.78rem' : '0.85rem',
    color: accent,
    fontFamily: 'JetBrains Mono, monospace',
    cursor: isEmpty && onRequestRefill ? 'pointer' : 'default',
  };

  return (
    <div className="nd-shell-box nd-shell__stat" style={baseStyle} title="플레이 티켓 (게임 1판당 1장 차감)">
      <span className="nd-reticle__c nd-reticle__c--tl" />
      <span className="nd-reticle__c nd-reticle__c--tr" />
      <span className="nd-reticle__c nd-reticle__c--bl" />
      <span className="nd-reticle__c nd-reticle__c--br" />
      <span style={{ color: accent }}>🎟️</span>
      <strong>{countLabel}</strong>
      {!isFull && !isOverCap && current < max && (
        <span style={{ opacity: 0.7, fontSize: '0.85em' }}>
          {formatTime(msUntilNextCharge)}
        </span>
      )}
      {isEmpty && onRequestRefill && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRequestRefill(); }}
          style={{
            marginLeft: '0.2rem',
            padding: '0.1rem 0.4rem',
            background: accent,
            color: '#000',
            border: 'none',
            borderRadius: '3px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            fontSize: '0.75em',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      )}
    </div>
  );
};

window.PlayTicketBadge = PlayTicketBadge;
