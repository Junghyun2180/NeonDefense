// Neon Defense - 일일 출석 보상 모달 (Holographic Command 디자인 적용)
const DailyLoginModal = ({ isOpen, onClose, onClaim }) => {
  const { useState, useEffect } = React;
  const [status, setStatus] = useState(null);
  const [justClaimed, setJustClaimed] = useState(null);

  useEffect(() => {
    if (!isOpen) { setJustClaimed(null); return; }
    setStatus(DailyLogin.getStatus());
  }, [isOpen]);

  if (!isOpen) return null;

  const rewards = DailyLogin.REWARDS;
  const currentDay = status?.state?.currentDay || 0;
  const nextDay = status?.nextDay;
  const canClaim = status?.canClaim;
  const streak = status?.state?.streak || 0;

  const handleClaim = () => {
    const res = DailyLogin.claim({
      onCrystals: (n) => onClaim && onClaim({ crystals: n }),
      onTickets: (n) => onClaim && onClaim({ tickets: n }),
    });
    if (res.claimed) {
      setJustClaimed({ day: res.day, reward: res.reward });
      setStatus(DailyLogin.getStatus());
    }
  };

  const banner = canClaim
    ? (status?.streakBroken
      ? { tone: 'amber', title: '◇ STREAK BROKEN', sub: 'DAY 1부터 다시 시작합니다.' }
      : { tone: 'amber', title: `◆ DAY ${nextDay} READY`, sub: '오늘 보상을 수령할 수 있습니다.' })
    : { tone: 'dim', title: '◇ ALREADY CLAIMED', sub: '내일 다시 방문해 주세요.' };

  return (
    <div
      className="nd-overlay"
      style={{ zIndex: 9998 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="nd-overlay__grid" aria-hidden="true" />

      <div className="nd-modal nd-modal--md" role="dialog" aria-label="Daily login reward">
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-modal__top">
          <div className="nd-modal__title">
            <span className="nd-modal__title-eyebrow" style={{ color: 'var(--nd-amber)' }}>
              ◆ DAILY DISPATCH
            </span>
            <span className="nd-modal__title-text">출석 보상</span>
          </div>
          <button type="button" className="nd-modal__close" onClick={onClose} aria-label="close">×</button>
        </div>

        <div className="nd-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="nd-banner">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="nd-banner__title">{banner.title}</span>
              <span className="nd-banner__sub">{banner.sub}</span>
            </div>
          </div>

          <div className="nd-daily-grid">
            {rewards.map((r, idx) => {
              const day = idx + 1;
              const isClaimed = day <= currentDay && !canClaim;
              const isNext = canClaim && day === nextDay;
              const cellClass =
                'nd-daily-cell' +
                (isNext ? ' nd-daily-cell--next' : '') +
                (isClaimed ? ' nd-daily-cell--claimed' : '');
              return (
                <div key={day} className={cellClass}>
                  <div className="nd-daily-cell__day">DAY {day}</div>
                  <div className="nd-daily-cell__icon">{r.icon}</div>
                  <div className="nd-daily-cell__label">{r.label}</div>
                  {isClaimed && <div className="nd-daily-cell__tag">✓ DONE</div>}
                  {isNext && <div className="nd-daily-cell__tag">▸ TODAY</div>}
                </div>
              );
            })}
          </div>

          {justClaimed && (
            <div
              className="nd-section"
              style={{
                borderColor: 'rgba(255, 169, 77, 0.35)',
                background: 'rgba(255, 169, 77, 0.06)',
              }}
            >
              <div className="nd-section__head">
                <span className="nd-eyebrow nd-eyebrow--amber">
                  ◆ DAY {justClaimed.day} CLAIMED
                </span>
              </div>
              <div
                className="nd-mono"
                style={{ color: 'var(--nd-text)', fontSize: 12, letterSpacing: 0.5 }}
              >
                {justClaimed.reward.label}
              </div>
            </div>
          )}
        </div>

        <div className="nd-modal__foot">
          <div className="nd-daily-streak">
            <span>STREAK</span>
            <strong>{streak}</strong>
            <span>DAYS</span>
          </div>

          {canClaim ? (
            <button type="button" onClick={handleClaim} className="nd-btn-deploy">
              ▸ CLAIM
            </button>
          ) : (
            <button type="button" onClick={onClose} className="nd-btn-ghost">
              CLOSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

window.DailyLoginModal = DailyLoginModal;
