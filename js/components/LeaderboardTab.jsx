// Neon Defense - 리더보드 탭 컴포넌트
// 모든 게임 모드의 리더보드를 표시하는 재사용 가능한 컴포넌트

const LeaderboardTab = ({ initialMode = 'campaign', modes }) => {
  const { useState } = React;

  const defaultModes = [
    { id: 'campaign', label: 'Campaign', icon: '🏰' },
    { id: 'standard', label: 'Standard', icon: '🎮' },
    { id: 'daily', label: 'Daily', icon: '📅' },
    { id: 'endless', label: 'Endless', icon: '♾️' },
  ];

  const activeModes = modes || defaultModes;
  const [mode, setMode] = useState(initialMode);

  const entries = typeof Leaderboard !== 'undefined'
    ? Leaderboard.getEntries(mode)
    : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {activeModes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1 rounded text-sm font-bold transition-all ${
              mode === m.id ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          기록이 없습니다. 플레이하여 기록을 남기세요!
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map((entry, idx) => (
            <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded ${
              idx === 0 ? 'bg-yellow-900/30 border border-yellow-500/30' :
              idx === 1 ? 'bg-gray-700/30 border border-gray-500/20' :
              idx === 2 ? 'bg-orange-900/20 border border-orange-500/20' :
              'bg-gray-800/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold w-8 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                </span>
                <div>
                  <span className="text-white text-sm font-bold">Stage {entry.stage}</span>
                  {entry.grade && <span className="ml-2 text-xs text-yellow-300">{entry.grade}</span>}
                  {mode === 'campaign' && entry.lives != null && (
                    <span className="ml-2 text-xs text-red-300">❤️ {entry.lives}</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {entry.time ? `${Math.floor(entry.time / 60000)}분` : ''} |{' '}
                {entry.date ? new Date(entry.date).toLocaleDateString() : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.LeaderboardTab = LeaderboardTab;
