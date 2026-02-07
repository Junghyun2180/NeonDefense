// Neon Defense - 런 결과 모달
// 런 종료 시 등급, 통계, 크리스탈 보상 표시

const RunResultModal = ({
  isOpen,
  runResult,
  gameStats,
  lives,
  gold,
  permanentBuffs,
  onRestart,
  onMainMenu,
  onUpgrades,
}) => {
  if (!isOpen || !runResult) return null;

  const { useState } = React;
  const [showDetails, setShowDetails] = useState(false);

  const gradeInfo = GameStats.calculateRunGrade(gameStats, runResult.mode);
  const playTimeSeconds = runResult.playTimeMs ? Math.floor(runResult.playTimeMs / 1000) : 0;
  const minutes = Math.floor(playTimeSeconds / 60);
  const seconds = playTimeSeconds % 60;

  const gradeColors = {
    S: 'from-yellow-400 to-orange-400',
    A: 'from-gray-300 to-gray-100',
    B: 'from-orange-400 to-yellow-600',
    C: 'from-blue-400 to-cyan-400',
    D: 'from-green-400 to-emerald-400',
  };

  const modeLabels = {
    standard: 'STANDARD RUN',
    daily: 'DAILY CHALLENGE',
    endless: 'ENDLESS MODE',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-cyan-500/50 rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl shadow-cyan-500/20">
        {/* 헤더 */}
        <div className={`p-6 text-center ${runResult.cleared ? 'bg-gradient-to-r from-cyan-900/50 to-purple-900/50' : 'bg-gradient-to-r from-red-900/40 to-gray-900/40'}`}>
          <div className="text-sm text-gray-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {modeLabels[runResult.mode] || 'RUN'}
          </div>
          <h2 className="text-3xl font-black mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {runResult.cleared ? (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                RUN COMPLETE!
              </span>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                RUN FAILED
              </span>
            )}
          </h2>

          {/* 등급 */}
          <div className={`inline-block text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b ${gradeColors[gradeInfo.grade] || gradeColors.D}`}
            style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 30px rgba(255,215,0,0.3)' }}>
            {gradeInfo.grade}
          </div>
          <div className="text-sm text-gray-300 mt-1">{gradeInfo.description}</div>
        </div>

        {/* 주요 통계 */}
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">스테이지</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {runResult.stagesCleared}/{runResult.mode === 'endless' ? '∞' : '5'}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">시간</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {minutes}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">처치</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {runResult.totalKills}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-2 text-center">
              <div className="text-xs text-gray-400">퍼펙트 웨이브</div>
              <div className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {runResult.perfectWaves}/{runResult.wavesCleared}
              </div>
            </div>
          </div>

          {/* 크리스탈 보상 */}
          <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border border-cyan-500/30 rounded-lg p-3">
            <div className="text-sm text-cyan-300 font-bold mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              REWARDS
            </div>
            <div className="space-y-1 text-sm">
              {runResult.cleared && (
                <div className="flex justify-between">
                  <span className="text-gray-300">
                    {runResult.mode === 'daily' ? '일일 챌린지 클리어' : '런 클리어'}
                  </span>
                  <span className="text-cyan-300">
                    💎 {runResult.mode === 'daily' ? CRYSTAL_REWARDS.dailyClear : CRYSTAL_REWARDS.standardClear}
                  </span>
                </div>
              )}
              {!runResult.cleared && runResult.stagesCleared > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">스테이지 보상 ({runResult.stagesCleared}단계)</span>
                  <span className="text-cyan-300">💎 {runResult.stagesCleared * CRYSTAL_REWARDS.perStageBonus}</span>
                </div>
              )}
              {runResult.isPerfect && (
                <div className="flex justify-between">
                  <span className="text-gray-300">퍼펙트 보너스</span>
                  <span className="text-green-300">💎 {CRYSTAL_REWARDS.perfectBonus}</span>
                </div>
              )}
              {runResult.isSpeedRun && runResult.cleared && (
                <div className="flex justify-between">
                  <span className="text-gray-300">스피드 보너스</span>
                  <span className="text-yellow-300">💎 {CRYSTAL_REWARDS.speedBonus}</span>
                </div>
              )}
              {(CRYSTAL_REWARDS.gradeBonus[gradeInfo.grade] || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-300">등급 보너스 ({gradeInfo.grade})</span>
                  <span className="text-purple-300">💎 {CRYSTAL_REWARDS.gradeBonus[gradeInfo.grade]}</span>
                </div>
              )}
              <div className="border-t border-gray-600 my-1"></div>
              <div className="flex justify-between font-bold">
                <span className="text-white">총 획득</span>
                <span className="text-cyan-300 text-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  💎 {runResult.crystalsEarned}
                </span>
              </div>
            </div>
          </div>

          {/* 상세 통계 토글 */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-xs text-gray-400 hover:text-gray-200 transition-colors py-1"
          >
            {showDetails ? '▲ 상세 통계 접기' : '▼ 상세 통계 보기'}
          </button>

          {showDetails && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-900/30 rounded p-2">
                <span className="text-gray-400">보스 처치: </span>
                <span className="text-white font-bold">{runResult.bossKills}</span>
              </div>
              <div className="bg-gray-900/30 rounded p-2">
                <span className="text-gray-400">T4 타워: </span>
                <span className="text-white font-bold">{runResult.t4TowersCreated}</span>
              </div>
              <div className="bg-gray-900/30 rounded p-2">
                <span className="text-gray-400">잃은 목숨: </span>
                <span className="text-white font-bold">{runResult.livesLost}</span>
              </div>
              <div className="bg-gray-900/30 rounded p-2">
                <span className="text-gray-400">남은 목숨: </span>
                <span className="text-white font-bold">{runResult.livesRemaining}</span>
              </div>
            </div>
          )}
        </div>

        {/* 버튼들 */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={onRestart}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-cyan-600 rounded-lg font-bold text-white hover:scale-105 transition-transform shadow-lg"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            새 런 시작
          </button>
          <div className="flex gap-2">
            <button
              onClick={onUpgrades}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-200 transition-colors"
            >
              ⚡ 업그레이드
            </button>
            <button
              onClick={onMainMenu}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-200 transition-colors"
            >
              ← 메인 메뉴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 전역 등록
window.RunResultModal = RunResultModal;
