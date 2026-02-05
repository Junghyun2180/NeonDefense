// Neon Defense - 메인 메뉴 화면
// 게임 시작 전 모드 선택 및 저장 데이터 불러오기

const MainMenu = ({ saveInfo, onNewGame, onLoadGame, onSelectMode }) => {
  const { useState } = React;

  const [selectedMode, setSelectedMode] = useState('campaign'); // 'campaign', 'run' (미래)

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

      <div className="relative max-w-4xl w-full mx-4 space-y-6">
        {/* 타이틀 */}
        <div className="text-center space-y-4 mb-8">
          <h1
            className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 animate-pulse"
            style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 40px rgba(168, 85, 247, 0.5)' }}
          >
            ⚡ NEON DEFENSE ⚡
          </h1>
          <p className="text-gray-400 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Random Tower Defense × Roguelike
          </p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 새 게임 카드 */}
          <button
            onClick={() => handleStartGame(true)}
            className="group relative bg-gray-800/80 backdrop-blur-sm border-2 border-purple-500/50 hover:border-purple-400 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
          >
            {/* 신규 배지 */}
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
              NEW
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="text-6xl group-hover:scale-110 transition-transform">🆕</div>
              <h2 className="text-2xl font-bold text-purple-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                새 게임 시작
              </h2>
              <p className="text-gray-400 text-sm text-center">
                처음부터 도전하기<br/>
                Stage 1-1부터 시작
              </p>

              {/* 게임 정보 */}
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
                  <span>💾 자동 저장</span>
                  <span className="font-bold text-green-300">30초마다</span>
                </div>
              </div>

              <div className="text-yellow-400 text-xs mt-2">
                💡 언제든지 저장하고 나갈 수 있습니다
              </div>
            </div>
          </button>

          {/* 이어하기 카드 */}
          {saveInfo ? (
            <button
              onClick={() => handleStartGame(false)}
              className="group relative bg-gray-800/80 backdrop-blur-sm border-2 border-blue-500/50 hover:border-blue-400 rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              {/* 저장된 게임 배지 */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                SAVED
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="text-6xl group-hover:scale-110 transition-transform">💾</div>
                <h2 className="text-2xl font-bold text-blue-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  이어하기
                </h2>

                {/* 저장된 게임 정보 */}
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
                        <span className="text-yellow-400">💰</span>
                        <span className="text-gray-300 font-bold">{saveInfo.gold}G</span>
                      </div>
                      <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-red-400">❤️</span>
                        <span className="text-gray-300 font-bold">{saveInfo.lives}</span>
                      </div>
                      <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-blue-400">🗼</span>
                        <span className="text-gray-300 font-bold">{saveInfo.towerCount}개</span>
                      </div>
                      <div className="bg-gray-900/50 rounded px-2 py-1 flex items-center justify-between">
                        <span className="text-green-400">🛡️</span>
                        <span className="text-gray-300 font-bold">{saveInfo.supportCount}개</span>
                      </div>
                    </div>
                  </div>

                  {/* 진행도 바 */}
                  <div className="w-full bg-gray-900/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(saveInfo.stage / SPAWN.maxStage) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    진행률: {Math.round((saveInfo.stage / SPAWN.maxStage) * 100)}%
                  </div>
                </div>

                <div className="text-yellow-400 text-xs mt-2">
                  💡 저장된 위치부터 계속 플레이
                </div>
              </div>
            </button>
          ) : (
            <div className="relative bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600/50 rounded-xl p-6 opacity-60">
              <div className="flex flex-col items-center space-y-4">
                <div className="text-6xl opacity-50">💾</div>
                <h2 className="text-2xl font-bold text-gray-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  이어하기
                </h2>
                <p className="text-gray-500 text-sm text-center">
                  저장된 게임이 없습니다<br/>
                  새 게임을 시작해주세요
                </p>
                <div className="w-full bg-gray-900/50 rounded-lg p-3 space-y-2 text-sm opacity-50">
                  <div className="flex items-center justify-center text-gray-500">
                    <span>게임 진행 후 자동 저장됩니다</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 하단 정보 & 옵션 */}
        <div className="space-y-3">
          {/* 게임 모드 (미래 확장용 - 현재는 캠페인만) */}
          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">게임 모드:</span>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      selectedMode === 'campaign'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    🏰 캠페인
                  </button>
                  <button
                    disabled
                    className="px-4 py-2 rounded-lg font-bold bg-gray-800 text-gray-600 cursor-not-allowed relative"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                    title="추후 업데이트 예정"
                  >
                    🎲 런 모드
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                      SOON
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-gray-400">난이도</div>
              <div className="text-purple-300 font-bold">보통</div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🗼</div>
              <div className="text-gray-400">타워 종류</div>
              <div className="text-blue-300 font-bold">24개</div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">👾</div>
              <div className="text-gray-400">적 종류</div>
              <div className="text-red-300 font-bold">8종</div>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🎁</div>
              <div className="text-gray-400">로그라이크</div>
              <div className="text-green-300 font-bold">영구버프</div>
            </div>
          </div>

          {/* 버전 정보 */}
          <div className="text-center text-gray-600 text-xs">
            <div>Neon Defense v1.0 (PLAN 2)</div>
            <div className="mt-1">Made with ❤️ by Claude & junghyun</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 글로벌 등록
window.MainMenu = MainMenu;
