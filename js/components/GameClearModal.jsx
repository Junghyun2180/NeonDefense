// GameClearModal - 게임 클리어 축하 모달
const GameClearModal = ({ isOpen, stats, lives, gold, permanentBuffs, onRestart, onClose }) => {
  if (!isOpen || !stats) return null;

  const summary = GameStats.getSummary(stats, lives, gold);
  const activeBuffs = typeof PermanentBuffManager !== 'undefined'
    ? PermanentBuffManager.getActiveBuffsList(permanentBuffs || {})
    : [];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 rounded-2xl p-6 max-w-2xl w-full border-2 border-yellow-500/50 shadow-2xl my-4">
        {/* 헤더 - 축하 메시지 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2" style={{
            background: 'linear-gradient(90deg, #FFD700, #FFA500, #FF6B6B, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'glow 2s ease-in-out infinite alternate',
          }}>
            VICTORY!
          </h1>
          <p className="text-xl text-gray-300">네온 디펜스 클리어를 축하합니다!</p>
        </div>

        {/* 등급 표시 */}
        <div className="text-center mb-6 p-4 bg-black/30 rounded-xl border border-gray-700">
          <div className="text-6xl font-black mb-2" style={{ color: summary.grade.color }}>
            {summary.grade.grade}
          </div>
          <p className="text-lg" style={{ color: summary.grade.color }}>
            {summary.grade.description}
          </p>
        </div>

        {/* 주요 하이라이트 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {summary.highlights.map((item, idx) => (
            <div key={idx} className="bg-black/30 rounded-lg p-3 text-center border border-gray-700">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-lg font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-400">{item.label}</div>
            </div>
          ))}
        </div>

        {/* 상세 통계 탭 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* 타워 통계 */}
          <div className="bg-black/30 rounded-lg p-4 border border-purple-500/30">
            <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
              <span>🏰</span> 타워 통계
            </h3>
            <div className="space-y-2">
              {summary.towers.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.icon} {item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 경제 통계 */}
          <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/30">
            <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <span>💰</span> 경제 통계
            </h3>
            <div className="space-y-2">
              {summary.economy.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.icon} {item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 전투 통계 */}
          <div className="bg-black/30 rounded-lg p-4 border border-red-500/30">
            <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <span>⚔️</span> 전투 통계
            </h3>
            <div className="space-y-2">
              {summary.combat.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-400">{item.icon} {item.label}</span>
                  <span className="text-white font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 획득한 버프 */}
        {activeBuffs.length > 0 && (
          <div className="mb-6 p-4 bg-black/30 rounded-lg border border-emerald-500/30">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <span>✨</span> 획득한 버프
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeBuffs.map(buff => (
                <div
                  key={buff.id}
                  className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  style={{
                    backgroundColor: `${buff.color}20`,
                    border: `1px solid ${buff.color}`,
                    color: buff.color,
                  }}
                >
                  <span>{buff.icon}</span>
                  <span>{buff.name}</span>
                  {buff.stacks > 1 && <span className="font-bold">×{buff.stacks}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform border border-emerald-400/30"
          >
            🔄 다시 도전
          </button>
        </div>

        {/* 리더보드 안내 (추후 구현) */}
        <div className="mt-4 text-center text-xs text-gray-500">
          🏆 리더보드 기능은 곧 추가될 예정입니다!
        </div>
      </div>
    </div>
  );
};

window.GameClearModal = GameClearModal;
