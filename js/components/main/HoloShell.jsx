// Neon Defense — HoloShell
// Reference-aligned main command shell: top ops bar, horizontal navigation,
// and a constrained tactical canvas.

const HoloShell = ({
  activePage = 'home',
  onChangePage,
  crystals = 0,
  achievements = { unlocked: 0, total: 0 },
  codexPercent = 0,
  dailyDot = false,
  children,
}) => {
  const navItems = [
    { k: 'home',  code: '◇', label: 'HOME',    sub: 'READY TO DEPLOY' },
    { k: 'codex', code: '◆', label: 'CODEX',   sub: codexPercent ? `${codexPercent}% SCANNED` : 'ARSENAL DATA' },
    { k: 'meta',  code: '◆', label: 'META',    sub: crystals > 0 ? `${crystals.toLocaleString()} CRYSTALS` : 'UPGRADE GRID' },
    { k: 'profile', code: '●', label: 'PROFILE', sub: achievements.total
      ? `${achievements.unlocked}/${achievements.total}` : 'OPERATOR' },
    { k: 'rank',  code: '▲', label: 'RANK',    sub: 'LEADERBOARD' },
  ];

  const activeNav = navItems.find(n => n.k === activePage) || navItems[0];
  const commanderSeed = ((crystals || 0) + (achievements.unlocked || 0) * 97 + Math.round(codexPercent || 0) * 13) % 9000;
  const commanderId = 'CMDR-' + String(1000 + commanderSeed).padStart(4, '0');
  const achievementCount = achievements.total
    ? achievements.unlocked
    : Math.round(codexPercent || 0);

  return (
    <div className="nd-shell nd-mono">
      <div className="nd-shell__grid" aria-hidden="true" />
      <div className="nd-shell__wrap">
        <header className="nd-shell__top">
          <div className="nd-shell-box nd-shell__brand">
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <span className="nd-shell__brand-dot">◇</span>
            <span className="nd-shell__brand-muted">NEON DEFENSE</span>
            <span className="nd-shell__slash">/</span>
            <span className="nd-shell__crumb">{activeNav.label} · {activeNav.sub}</span>
          </div>

          <div className="nd-shell-box nd-shell__stat">
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <span style={{ color: 'var(--nd-gold)' }}>◆</span>
            <strong>{crystals.toLocaleString()}</strong>
          </div>

          <div className="nd-shell-box nd-shell__stat">
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <span style={{ color: 'var(--nd-amber)' }}>◆</span>
            <strong>{achievementCount.toLocaleString()}</strong>
          </div>

          <div className="nd-shell-box nd-shell__operator">
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <span className="nd-shell__live-dot" />
            <span>{commanderId}</span>
          </div>
        </header>

        <nav className="nd-shell__tabs" aria-label="Main menu">
          {navItems.map(n => {
            const active = n.k === activePage;
            return (
              <button
                key={n.k}
                type="button"
                onClick={() => onChangePage && onChangePage(n.k)}
                className={'nd-shell__tab' + (active ? ' nd-shell__tab--active' : '')}
              >
                <span>{n.code}</span>
                <strong>{n.label}</strong>
                {n.k === 'codex' && dailyDot && <i className="nd-shell__tab-dot" />}
              </button>
            );
          })}
        </nav>

        <main className="nd-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
};

window.HoloShell = HoloShell;
