// Neon Defense - 메인 메뉴 화면
// 게임 시작 전 모드 선택 및 저장 데이터 불러오기

const MainMenu = ({ saveInfo, onNewGame, onLoadGame, onSelectMode, metaProgress, neonCrystals, onPurchaseUpgrade }) => {
  const [showCollection, setShowCollection] = React.useState(false);
  const { useState } = React;

  const [selectedMode, setSelectedMode] = useState('campaign'); // 'campaign', 'run'
  const [activeTab, setActiveTab] = useState('start'); // 'start', 'upgrade', 'ranking'

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handleStartGame = (isNewGame) => {
    if (isNewGame) {
      onNewGame();
    } else {
      onLoadGame();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center z-50">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ top: '10%', left: '20%' }}></div>
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ top: '60%', right: '20%', animationDelay: '1s' }}></div>
      </div>

      {/* 고정 레이아웃 컨테이너: 전체 높이를 뷰포트에 맞추고 내부만 스크롤 */}
      <div className="relative max-w-4xl w-full mx-4 flex flex-col" style={{ height: 'min(92vh, 820px)' }}>

        {/* ── 상단 고정: 타이틀 ── */}
        <div className="text-center py-4 shrink-0">
          <h1
            className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse"
            style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px rgba(168, 85, 247, 0.5)' }}
          >
            ⚡ NEON DEFENSE ⚡
          </h1>
          <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Random Tower Defense × Roguelike
          </p>
        </div>

        {/* ── 상단 고정: 탭 네비게이션 ── */}
        <div className="flex bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden shrink-0 mb-3">
          <button
            onClick={() => setActiveTab('start')}
            className={'flex-1 py-3 text-sm font-bold transition-colors ' + (activeTab === 'start' ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50')}
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            🎮 시작
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={'flex-1 py-3 text-sm font-bold transition-colors ' + (activeTab === 'upgrade' ? 'bg-cyan-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50')}
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            💎 업그레이드
            {metaProgress && metaProgress.crystals > 0 && activeTab !== 'upgrade' && (
              <span className="ml-1.5 text-xs text-cyan-300 font-normal">{(metaProgress.crystals || 0).toLocaleString()}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={'flex-1 py-3 text-sm font-bold transition-colors ' + (activeTab === 'ranking' ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50')}
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            🏆 순위
          </button>
          <button
            onClick={() => setShowCollection(true)}
            className="flex-1 py-3 text-sm font-bold transition-colors text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            🗂️ 도감
            {typeof CollectionSystem !== 'undefined' && (() => {
              const c = CollectionSystem.getCompletion();
              return c.unlocked > 0 ? <span className="ml-1.5 text-xs text-cyan-300 font-normal">{c.percent}%</span> : null;
            })()}
          </button>
        </div>

        {showCollection && typeof CollectionModal !== 'undefined' && (
          <CollectionModal isOpen={showCollection} onClose={() => setShowCollection(false)} />
        )}

        {/* ── 중간 스크롤 영역: 탭 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ===== 시작 탭 ===== */}
          <div style={{ display: activeTab === 'start' ? 'block' : 'none' }}>
            <div className="space-y-3 pb-2">
              {/* 새 게임 / 이어하기 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 새 게임 카드 */}
                <button
                  onClick={() => handleStartGame(true)}
                  className="group relative bg-gray-800/80 backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-400 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                >
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg animate-bounce">
                    NEW
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-6xl group-hover:scale-110 transition-transform">🆕</div>
                    <h2 className="text-2xl font-bold text-purple-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>새 게임 시작</h2>
                    <p className="text-gray-400 text-sm text-center">처음부터 도전하기<br />Stage 1-1부터 시작</p>
                    <div className="w-full bg-gray-900/50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>📊 총 스테이지</span>
                        <span className="font-bold text-purple-300">{SPAWN.maxStage}개</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>⏱️ 예상 시간</span>
                        <span className="font-bold text-blue-300">50~70분</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>💎 크리스탈 보상</span>
                        <span className="font-bold text-cyan-300">최대 200+</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>💾 자동 저장</span>
                        <span className="font-bold text-green-300">30초마다</span>
                      </div>
                    </div>
                    <div className="text-yellow-400 text-xs">💡 언제든지 저장하고 나갈 수 있습니다</div>
                  </div>
                </button>

                {/* 이어하기 카드 */}
                {saveInfo ? (
                  <button
                    onClick={() => handleStartGame(false)}
                    className="group relative bg-gray-800/80 backdrop-blur-sm border-2 border-blue-500/50 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                  >
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">SAVED</div>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-6xl group-hover:scale-110 transition-transform">💾</div>
                      <h2 className="text-2xl font-bold text-blue-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>이어하기</h2>
                      <div className="w-full space-y-3">
                        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-3 border border-blue-500/30">
                          <div className="text-center mb-2">
                            <div className="text-3xl font-bold text-blue-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              Stage {saveInfo.stage} - Wave {saveInfo.wave}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(saveInfo.timestamp)} ({formatTime(saveInfo.timestamp)})
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                              <span className="text-yellow-400">💰</span><span className="text-gray-300 font-bold">{saveInfo.gold}G</span>
                            </div>
                            <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                              <span className="text-red-400">❤️</span><span className="text-gray-300 font-bold">{saveInfo.lives}</span>
                            </div>
                            <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                              <span className="text-blue-400">🗼</span><span className="text-gray-300 font-bold">{saveInfo.towerCount}개</span>
                            </div>
                            <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                              <span className="text-green-400">🛡️</span><span className="text-gray-300 font-bold">{saveInfo.supportCount}개</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${(saveInfo.stage / SPAWN.maxStage) * 100}%` }}></div>
                        </div>
                        <div className="text-xs text-gray-400 text-center">진행률: {Math.round((saveInfo.stage / SPAWN.maxStage) * 100)}%</div>
                      </div>
                      <div className="text-yellow-400 text-xs">💡 저장된 위치부터 계속 플레이</div>
                    </div>
                  </button>
                ) : (
                  <div className="relative bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600/50 rounded-xl p-6 opacity-60">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-6xl opacity-50">💾</div>
                      <h2 className="text-2xl font-bold text-gray-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>이어하기</h2>
                      <p className="text-gray-500 text-sm text-center">저장된 게임이 없습니다<br />새 게임을 시작해주세요</p>
                      <div className="w-full bg-gray-900/50 rounded-lg p-3 text-sm opacity-50 text-center text-gray-500">
                        게임 진행 후 자동 저장됩니다
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 게임 모드 선택 */}
              <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">게임 모드:</span>
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedMode === 'campaign' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      🏰 캠페인
                    </button>
                    <button
                      onClick={() => { setSelectedMode('run'); onSelectMode && onSelectMode('run'); }}
                      className={`px-4 py-2 rounded-lg font-bold transition-all relative ${selectedMode === 'run' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      🎲 런 모드
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 게임 정보 */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { icon: '🎯', label: '난이도', value: '보통', color: 'text-purple-300' },
                  { icon: '🗼', label: '타워 종류', value: '24개', color: 'text-blue-300' },
                  { icon: '👾', label: '적 종류', value: '8종', color: 'text-red-300' },
                  { icon: '🎁', label: '로그라이크', value: '영구버프', color: 'text-green-300' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-gray-400">{label}</div>
                    <div className={'font-bold ' + color}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 업그레이드 탭 ===== */}
          <div style={{ display: activeTab === 'upgrade' ? 'block' : 'none' }}>
            <div className="space-y-3 pb-2">
              <div className="flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-cyan-700/40 rounded-xl px-5 py-3">
                <div>
                  <div className="text-xs text-gray-400">보유 크리스탈</div>
                  <div className="text-2xl font-black text-cyan-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    💎 {((neonCrystals ?? metaProgress?.crystals) || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  <div>캠페인 &amp; 런 모드 공통 적용</div>
                  <div className="text-cyan-600">게임 클리어 시 크리스탈 획득</div>
                </div>
              </div>
              {metaProgress && onPurchaseUpgrade ? (
                <MetaUpgradePanel
                  metaProgress={metaProgress}
                  neonCrystals={neonCrystals ?? metaProgress.crystals}
                  onPurchaseUpgrade={onPurchaseUpgrade}
                />
              ) : (
                <div className="text-center text-gray-500 py-8">업그레이드 데이터를 불러오는 중...</div>
              )}
            </div>
          </div>

          {/* ===== 순위 탭 ===== */}
          <div style={{ display: activeTab === 'ranking' ? 'block' : 'none' }}>
            <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 border border-yellow-500/30 rounded-xl p-4 pb-2">
              <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-3"
                style={{ fontFamily: 'Orbitron, sans-serif' }}>
                🏆 LEADERBOARD
              </h2>
              <LeaderboardTab initialMode="campaign" />
            </div>
          </div>

        </div>

        {/* ── 하단 고정: 크리스탈 & 업적 & 버전 ── */}
        {metaProgress && (
          <div className="shrink-0 flex items-center justify-between bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 mt-3">
            <button
              onClick={() => setActiveTab('upgrade')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-lg">💎</span>
              <div>
                <div className="text-[10px] text-gray-400">크리스탈</div>
                <div className="text-cyan-300 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {(metaProgress.crystals || 0).toLocaleString()}
                </div>
              </div>
            </button>
            <div className="text-gray-600 text-xs">Neon Defense v1.1 · Made with ❤️ by Junghyun</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <div className="text-[10px] text-gray-400">업적</div>
                <div className="text-yellow-300 font-bold text-sm">
                  {AchievementSystem.getProgress().unlocked}/{AchievementSystem.getProgress().total}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// 글로벌 등록
window.MainMenu = MainMenu;
