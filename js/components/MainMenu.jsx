// Neon Defense — MainMenu (Sprint 2 · 5-page split)
// 단일 컴포넌트 → HoloShell + 5 page (Home / Codex / Profile / Meta / Rank).
// 외부 인터페이스(props)는 변경하지 않음 — App.jsx 변경 없이 동작.
//
// 의도적 결정:
// - URL hash 라우터는 도입하지 않음 (사용자 선호 · 토글/단축키 미도입과 동일 선상).
// - Daily Login 모달은 유지 — 첫 진입 시 자동 오픈 동작도 유지.
// - 상세 진행 상태는 docs/design-handoff/STATUS.md.

const MainMenu = ({
  saveInfo,
  onNewGame,
  onLoadGame,
  onSelectMode,
  metaProgress,
  neonCrystals,
  onPurchaseUpgrade,
  onDailyLoginReward,
  onShowOptions,
}) => {
  const { useState, useEffect } = React;

  const [page, setPage] = useState('home');
  const [showDailyLogin, setShowDailyLogin] = useState(false);

  const dailyStatus = (typeof DailyLogin !== 'undefined')
    ? DailyLogin.getStatus() : { canClaim: false };

  // 첫 진입 시 오늘 보상 있으면 자동 오픈 (한 번만)
  useEffect(() => {
    if (dailyStatus.canClaim) {
      const opened = sessionStorage.getItem('__dailyLoginOpened');
      if (!opened) {
        sessionStorage.setItem('__dailyLoginOpened', '1');
        setShowDailyLogin(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crystals = (neonCrystals ?? metaProgress?.crystals) || 0;
  const codexCompletion = (typeof CollectionSystem !== 'undefined')
    ? CollectionSystem.getCompletion() : null;
  const achievementProgress = (typeof AchievementSystem !== 'undefined')
    ? AchievementSystem.getProgress() : { unlocked: 0, total: 0 };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          typeof Home !== 'undefined' && (
            <Home
              saveInfo={saveInfo}
              onNewGame={onNewGame}
              onLoadGame={onLoadGame}
              onSelectMode={onSelectMode}
              metaProgress={metaProgress}
            />
          )
        );
      case 'codex':
        return typeof Codex !== 'undefined' && <Codex />;
      case 'profile':
        return (
          typeof Profile !== 'undefined' && (
            <Profile metaProgress={metaProgress} neonCrystals={neonCrystals} />
          )
        );
      case 'meta':
        return (
          typeof Meta !== 'undefined' && (
            <Meta
              metaProgress={metaProgress}
              neonCrystals={neonCrystals}
              onPurchaseUpgrade={onPurchaseUpgrade}
            />
          )
        );
      case 'rank':
        return typeof Rank !== 'undefined' && <Rank />;
      default:
        return null;
    }
  };

  return (
    <>
      {typeof HoloShell !== 'undefined' && (
        <HoloShell
          activePage={page}
          onChangePage={setPage}
          crystals={crystals}
          achievements={achievementProgress}
          codexPercent={codexCompletion?.percent || 0}
          dailyDot={dailyStatus.canClaim}
          onShowOptions={onShowOptions}
        >
          {renderPage()}
        </HoloShell>
      )}

      {showDailyLogin && typeof DailyLoginModal !== 'undefined' && (
        <DailyLoginModal
          isOpen={showDailyLogin}
          onClose={() => setShowDailyLogin(false)}
          onClaim={onDailyLoginReward}
        />
      )}
    </>
  );
};

window.MainMenu = MainMenu;
