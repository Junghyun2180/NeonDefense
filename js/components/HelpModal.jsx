// HelpModal - 페이지네이션이 있는 도움말 모달
const HelpModal = ({ showHelp, setShowHelp, getElementInfo }) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const pages = HELP_DATA.pages;
  const totalPages = pages.length;

  // 페이지 변경
  const goToPage = (pageIndex) => {
    setCurrentPage(Math.max(0, Math.min(pageIndex, totalPages - 1)));
  };

  // 키보드 네비게이션
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

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!showHelp) return null;

  const currentPageData = pages[currentPage];
  const sections = HELP_DATA.sections[currentPageData.id] || [];

  // 섹션 렌더링
  const renderSection = (section, index) => {
    // 속성 정보 (ELEMENT_UI 사용)
    if (section.type === 'elements') {
      return (
        <div key={index} className="bg-gray-800/50 rounded-lg p-3">
          <h3 className={`text-sm font-bold mb-2 ${section.color}`}>{section.icon} {section.title}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {ELEMENT_UI.map(elem => {
              const info = getElementInfo(elem.id);
              return (
                <div key={elem.id} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                  <span className="text-lg">{elem.icon}</span>
                  <div>
                    <p className="font-bold" style={{ color: elem.color }}>{elem.name}</p>
                    <p className="text-gray-500">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 서포트 타입 정보
    if (section.type === 'support_types') {
      return (
        <div key={index} className="bg-gray-800/50 rounded-lg p-3">
          <h3 className={`text-sm font-bold mb-2 ${section.color}`}>{section.icon} {section.title}</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {SUPPORT_UI.map(support => (
              <div key={support.id} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                <span className="text-lg">{support.icon}</span>
                <div>
                  <p className="font-bold" style={{ color: support.color }}>{support.name}</p>
                  <p className="text-gray-500">{support.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 적 타입 정보 (기본)
    if (section.type === 'enemies_basic') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.basic);
    }

    // 적 타입 정보 (강력)
    if (section.type === 'enemies_strong') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.strong);
    }

    // 적 타입 정보 (특수)
    if (section.type === 'enemies_special') {
      return renderEnemySection(section, index, HELP_DATA.enemyDetails.special);
    }

    // 일반 섹션
    return (
      <div key={index} className="bg-gray-800/50 rounded-lg p-3">
        <h3 className={`text-sm font-bold mb-2 ${section.color}`}>{section.icon} {section.title}</h3>
        <div className="text-xs text-gray-300 space-y-1">
          {section.items.map((item, i) => (
            <p key={i}>
              • <span className={item.color}>{item.label}</span>: {item.desc}
              {item.costKey && ` (${ECONOMY[item.costKey]}G)`}
              {item.refundKey && ` (${Math.floor(ECONOMY[item.refundKey] * 100)}% 환급)`}
            </p>
          ))}
        </div>
      </div>
    );
  };

  // 적 섹션 렌더링 헬퍼
  const renderEnemySection = (section, index, enemyTypes) => {
    const { labels, descriptions, counters } = HELP_DATA.enemyDetails;
    return (
      <div key={index} className="bg-gray-800/50 rounded-lg p-3">
        <h3 className={`text-sm font-bold mb-2 ${section.color}`}>{section.icon} {section.title}</h3>
        <div className="space-y-2 text-xs">
          {enemyTypes.map(type => {
            const cfg = ENEMY_CONFIG[type];
            if (!cfg) return null;
            return (
              <div key={type} className="flex items-start gap-2 bg-gray-900/50 p-2 rounded">
                {cfg.icon ? (
                  <span className="text-lg">{cfg.icon}</span>
                ) : (
                  <span className={'w-4 h-4 rounded-sm rotate-45 mt-1 ' + cfg.color}></span>
                )}
                <div className="flex-1">
                  <p className="font-bold" style={{ color: cfg.explosionColor }}>{labels[type]}</p>
                  <p className="text-gray-400">{descriptions[type]}</p>
                  <p className="text-gray-500 mt-1">💡 카운터: {counters[type]}</p>
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
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-cyan-500/50 max-w-md w-full max-h-[85vh] flex flex-col"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)' }}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentPageData.icon}</span>
            <h2 className={`text-lg font-black ${currentPageData.color}`}>{currentPageData.title}</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-all"
          >
            ✕
          </button>
        </div>

        {/* 페이지 탭 */}
        <div className="flex border-b border-gray-700 bg-gray-800/50">
          {pages.map((page, idx) => (
            <button
              key={page.id}
              onClick={() => goToPage(idx)}
              className={`flex-1 py-2 text-xs transition-all ${
                idx === currentPage
                  ? `${page.color} bg-gray-700/50 border-b-2 border-current`
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <span className="block text-base">{page.icon}</span>
              <span className="hidden sm:block">{page.title}</span>
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sections.map((section, index) => renderSection(section, index))}
        </div>

        {/* 푸터 - 네비게이션 */}
        <div className="sticky bottom-0 bg-gray-900 p-3 border-t border-gray-700 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className={`px-3 py-1 rounded text-sm transition-all ${
              currentPage === 0
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-cyan-400 hover:bg-gray-800'
            }`}
          >
            ← 이전
          </button>

          <div className="flex items-center gap-1">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentPage ? 'bg-cyan-400 w-4' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className={`px-3 py-1 rounded text-sm transition-all ${
              currentPage === totalPages - 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-cyan-400 hover:bg-gray-800'
            }`}
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
};

window.HelpModal = HelpModal;
