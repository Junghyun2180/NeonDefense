// HelpModal — Holographic Command 디자인 적용 도움말 패널
const HelpModal = ({ showHelp, setShowHelp, getElementInfo }) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const pages = HELP_DATA.pages;
  const totalPages = pages.length;

  const goToPage = (pageIndex) => {
    setCurrentPage(Math.max(0, Math.min(pageIndex, totalPages - 1)));
  };

  React.useEffect(() => {
    if (!showHelp) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
      else if (e.key === 'ArrowRight') goToPage(currentPage + 1);
      else if (e.key === 'Escape') setShowHelp(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, currentPage]);

  if (!showHelp) return null;

  const currentPageData = pages[currentPage];
  const sections = HELP_DATA.sections[currentPageData.id] || [];

  const renderSection = (section, index) => {
    if (section.type === 'elements') {
      return (
        <div key={index} className="nd-section">
          <div className="nd-section__head">
            <span className="nd-eyebrow">◆ {section.title}</span>
          </div>
          <div className="nd-section__grid">
            {ELEMENT_UI.map(elem => {
              const info = getElementInfo(elem.id);
              return (
                <div key={elem.id} className="nd-section__cell">
                  <span className="nd-section__cell-icon" style={{ color: elem.color }}>{elem.icon}</span>
                  <div className="nd-section__cell-text">
                    <span className="nd-section__cell-name" style={{ color: elem.color }}>{elem.name}</span>
                    <span className="nd-section__cell-desc">{info.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (section.type === 'support_types') {
      return (
        <div key={index} className="nd-section">
          <div className="nd-section__head">
            <span className="nd-eyebrow">◆ {section.title}</span>
          </div>
          <div className="nd-section__grid">
            {SUPPORT_UI.map(support => (
              <div key={support.id} className="nd-section__cell">
                <span className="nd-section__cell-icon" style={{ color: support.color }}>{support.icon}</span>
                <div className="nd-section__cell-text">
                  <span className="nd-section__cell-name" style={{ color: support.color }}>{support.name}</span>
                  <span className="nd-section__cell-desc">{support.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (section.type === 'enemies_basic') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.basic);
    }
    if (section.type === 'enemies_strong') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.strong);
    }
    if (section.type === 'enemies_special') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.special);
    }

    return (
      <div key={index} className="nd-section">
        <div className="nd-section__head">
          <span className="nd-eyebrow">◆ {section.title}</span>
        </div>
        <div className="nd-section__list">
          {section.items.map((item, i) => (
            <div key={i} className="nd-section__list-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{item.label}</b>
                <span>
                  {item.desc}
                  {item.costKey && ` (${ECONOMY[item.costKey]}G)`}
                  {item.refundKey && ` (${Math.floor(ECONOMY[item.refundKey] * 100)}% 환급)`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnemySection = (section, index, enemyTypes) => {
    const { labels, descriptions, counters } = HELP_DATA.enemyDetails;
    return (
      <div key={index} className="nd-section">
        <div className="nd-section__head">
          <span className="nd-eyebrow">◆ {section.title}</span>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {enemyTypes.map(type => {
            const cfg = ENEMY_CONFIG[type];
            if (!cfg) return null;
            const accent = cfg.explosionColor || '#fff';
            return (
              <div key={type} className="nd-section__enemy">
                <span className="nd-section__enemy-icon" style={{ color: accent }}>
                  {cfg.icon || '◇'}
                </span>
                <div className="nd-section__enemy-body">
                  <span className="nd-section__enemy-name" style={{ color: accent }}>
                    {labels[type]}
                  </span>
                  <span className="nd-section__enemy-desc">{descriptions[type]}</span>
                  <span className="nd-section__enemy-counter">▸ {counters[type]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="nd-overlay"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}
    >
      <div className="nd-overlay__grid" aria-hidden="true" />

      <div className="nd-modal nd-modal--md" role="dialog" aria-label="Help">
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-modal__top">
          <div className="nd-modal__title">
            <span className="nd-modal__title-eyebrow">◇ FIELD MANUAL</span>
            <span className="nd-modal__title-text">
              {currentPageData.icon} {currentPageData.title}
            </span>
          </div>
          <button
            type="button"
            className="nd-modal__close"
            onClick={() => setShowHelp(false)}
            aria-label="close"
          >
            ×
          </button>
        </div>

        <nav className="nd-modal__tabs" aria-label="Help pages">
          {pages.map((page, idx) => (
            <button
              key={page.id}
              type="button"
              onClick={() => goToPage(idx)}
              className={'nd-modal__tab' + (idx === currentPage ? ' nd-modal__tab--active' : '')}
            >
              <span>{page.icon}</span>
              <span style={{ letterSpacing: 1 }}>{page.title}</span>
            </button>
          ))}
        </nav>

        <div className="nd-modal__body">
          {sections.map((section, index) => renderSection(section, index))}
        </div>

        <div className="nd-modal__foot">
          <button
            type="button"
            className="nd-link"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ← PREV
          </button>

          <div className="nd-dots" role="tablist">
            {pages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToPage(idx)}
                className={'nd-dot' + (idx === currentPage ? ' nd-dot--active' : '')}
                aria-label={`page ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="nd-link"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
};

window.HelpModal = HelpModal;
