// Neon Defense - 런 모드 메뉴
// 모드 선택 / 메타 업그레이드 / 리더보드 / 업적 탭

const RunModeMenu = ({
  metaProgress,
  neonCrystals,
  onStartRun,
  onPurchaseUpgrade,
  onBack,
  activeRunInfo,
  onLoadRun,
}) => {
  const { useState } = React;
  const [tab, setTab] = useState('modes'); // 'modes' | 'upgrades' | 'leaderboard' | 'achievements'

  // Daily Challenge 정보
  const dailyAttempted = typeof RunSaveSystem !== 'undefined' && RunSaveSystem.hasAttemptedToday();
  const dailyModifiers = typeof DailyChallenge !== 'undefined'
    ? DailyChallenge.getModifiers(DailyChallenge.getTodaySeed())
    : [];


  // 업적 데이터
  const achievementData = typeof AchievementSystem !== 'undefined'
    ? AchievementSystem.getUnlocked()
    : {};

  const tabs = [
    { id: 'modes', label: '모드 선택', icon: '🎮' },
    { id: 'upgrades', label: '업그레이드', icon: '⚡' },
    { id: 'achievements', label: '업적', icon: '🎖️' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-900 to-black flex items-center justify-center z-50">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        <div className="absolute w-80 h-80 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-80 h-80 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ top: '50%', right: '15%', animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative max-w-4xl w-full mx-4 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800/50"
          >
            ← 메인 메뉴
          </button>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400"
            style={{ fontFamily: 'Orbitron, sans-serif' }}>
            RUN MODE
          </h1>
          <div className="flex items-center gap-2 bg-gray-800/60 px-4 py-2 rounded-lg border border-cyan-500/30">
            <span className="text-xl">💎</span>
            <span className="text-cyan-300 font-bold text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {neonCrystals.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 탭 바 */}
        <div className="flex gap-2 bg-gray-800/40 p-1 rounded-lg">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-bold transition-all ${tab === t.id
                ? 'bg-gradient-to-r from-orange-600 to-cyan-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 min-h-[400px]">
          {/* 모드 선택 탭 */}
          {tab === 'modes' && (
            <div className="space-y-4">
              {/* 진행 중 런 */}
              {activeRunInfo && (
                <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-cyan-500/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-cyan-400 font-bold">진행 중인 런</div>
                      <div className="text-lg text-white font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Stage {activeRunInfo.stage} - Wave {activeRunInfo.wave}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        💰 {activeRunInfo.gold}G | ❤️ {activeRunInfo.lives} | 🗼 {activeRunInfo.towerCount}개
                      </div>
                    </div>
                    <button
                      onClick={onLoadRun}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-white hover:scale-105 transition-transform shadow-lg shadow-cyan-500/30"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      이어하기
                    </button>
                  </div>
                </div>
              )}

              {/* 모드 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rush Mode (신규, 짧은 세션) */}
                <button
                  onClick={() => onStartRun('rush')}
                  className="group bg-gray-900/60 border-2 border-cyan-500/40 hover:border-cyan-400 rounded-xl p-5 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20 text-left"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">⚡</div>
                  <h3 className="text-lg font-bold text-cyan-300 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Rush Mode
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">3 스테이지 x 3 웨이브 | 5-8분</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>보상</span>
                      <span className="text-cyan-300">💎 25+</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>난이도</span>
                      <span className="text-cyan-300">★★☆☆☆</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>특징</span>
                      <span className="text-cyan-300">캐주얼 / 빠른 한 판</span>
                    </div>
                  </div>
                </button>

                {/* Standard Run */}
                <button
                  onClick={() => onStartRun('standard')}
                  className="group bg-gray-900/60 border-2 border-orange-500/40 hover:border-orange-400 rounded-xl p-5 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 text-left"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
                  <h3 className="text-lg font-bold text-orange-300 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Standard Run
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">5 스테이지 x 5 웨이브 | ㅁ 맵</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>보상</span>
                      <span className="text-cyan-300">💎 50+</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>난이도</span>
                      <span className="text-orange-300">★★★☆☆</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>패배</span>
                      <span className="text-red-300">적 70마리 초과</span>
                    </div>
                  </div>
                </button>

                {/* Daily Challenge */}
                <button
                  onClick={() => !dailyAttempted && onStartRun('daily', dailyModifiers)}
                  disabled={dailyAttempted}
                  className={`group bg-gray-900/60 border-2 rounded-xl p-5 transition-all text-left ${dailyAttempted
                    ? 'border-gray-600/40 opacity-50 cursor-not-allowed'
                    : 'border-purple-500/40 hover:border-purple-400 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20'
                    }`}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📅</div>
                  <h3 className="text-lg font-bold text-purple-300 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Daily Challenge
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">
                    {dailyAttempted ? '오늘 이미 도전함' : '오늘의 특별 규칙'}
                  </p>
                  {dailyModifiers.length > 0 && (
                    <div className="space-y-1 text-xs">
                      {dailyModifiers.slice(0, 2).map(modId => {
                        const mod = DAILY_MODIFIERS[modId];
                        return mod ? (
                          <div key={modId} className="flex items-center gap-1 text-gray-300">
                            <span>{mod.icon}</span>
                            <span>{mod.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-xs text-gray-300">
                    <span>보상</span>
                    <span className="text-cyan-300">💎 100+</span>
                  </div>
                </button>

                {/* Endless Mode */}
                <button
                  onClick={() => onStartRun('endless')}
                  className="group bg-gray-900/60 border-2 border-red-500/40 hover:border-red-400 rounded-xl p-5 transition-all hover:scale-105 hover:shadow-xl hover:shadow-red-500/20 text-left"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">♾️</div>
                  <h3 className="text-lg font-bold text-red-300 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Endless Mode
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">무한 도전</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>최고 기록</span>
                      <span className="text-red-300">Stage {metaProgress.stats.highestEndlessStage || 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>보상</span>
                      <span className="text-cyan-300">💎 스테이지당 10</span>
                    </div>
                  </div>
                </button>

                {/* Boss Rush */}
                <button
                  onClick={() => onStartRun('bossRush')}
                  className="group bg-gray-900/60 border-2 border-yellow-500/40 hover:border-yellow-400 rounded-xl p-5 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/20 text-left"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">🏆</div>
                  <h3 className="text-lg font-bold text-yellow-300 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Boss Rush
                  </h3>
                  <p className="text-gray-400 text-xs mb-3">보스만 출현 | 한정 자원</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>보상</span>
                      <span className="text-cyan-300">💎 보스당 15</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>보스 처치</span>
                      <span className="text-yellow-300">🎰 무료 뽑기</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>난이도</span>
                      <span className="text-red-300">★★★★☆</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* 메타 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-gray-400">총 런 수</div>
                  <div className="text-white font-bold">{metaProgress.stats.totalRuns || 0}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-gray-400">클리어 수</div>
                  <div className="text-green-300 font-bold">{metaProgress.stats.totalClears || 0}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-gray-400">최고 등급</div>
                  <div className="text-yellow-300 font-bold">{metaProgress.stats.bestGrade || '-'}</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                  <div className="text-gray-400">총 획득 크리스탈</div>
                  <div className="text-cyan-300 font-bold">{(metaProgress.stats.totalCrystalsEarned || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* 업그레이드 탭 */}
          {tab === 'upgrades' && (
            <MetaUpgradePanel
              metaProgress={metaProgress}
              neonCrystals={neonCrystals}
              onPurchaseUpgrade={onPurchaseUpgrade}
            />
          )}

          {/* 업적 탭 */}
          {tab === 'achievements' && (
            <AchievementTab unlocked={achievementData} />
          )}
        </div>
      </div>
    </div>
  );
};

// LeaderboardTab은 js/components/LeaderboardTab.jsx에서 전역 등록됨

// 업적 탭 (인라인, Phase 2용 플레이스홀더)
const AchievementTab = ({ unlocked }) => {
  const achievements = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : {};
  const achievementList = Object.values(achievements);

  if (achievementList.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        업적 시스템 준비 중...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {achievementList.map(ach => {
        const isUnlocked = unlocked && unlocked[ach.id];
        return (
          <div key={ach.id} className={`rounded-lg p-3 text-center transition-all ${isUnlocked
            ? 'bg-gradient-to-b from-yellow-900/40 to-gray-800/40 border border-yellow-500/40'
            : 'bg-gray-800/50 border border-gray-700/30 opacity-60'
            }`}>
            <div className="text-2xl mb-1">{isUnlocked ? ach.icon : '🔒'}</div>
            <div className="text-xs font-bold text-gray-200">{ach.name}</div>
            <div className="text-xs text-gray-400 mt-1">{ach.desc}</div>
          </div>
        );
      })}
    </div>
  );
};

// 전역 등록
window.RunModeMenu = RunModeMenu;
