// Neon Defense - 도감 모달
// 카드 그리드 + 수집 진행률 + 필터 (전체/획득/미획득)
const CollectionModal = ({ isOpen, onClose }) => {
  const { useState, useMemo } = React;
  const [tab, setTab] = useState('tower');
  const [filter, setFilter] = useState('all');

  if (!isOpen) return null;

  const state = CollectionSystem.load();
  const completion = CollectionSystem.getCompletion();

  const tabs = [
    { id: 'tower', label: '타워', icon: '🗼', cards: CollectionSystem.TOWER_CARDS, state: state.tower },
    { id: 'towerRole', label: 'T4 역할', icon: '⭐', cards: CollectionSystem.TOWER_ROLE_CARDS, state: state.towerRole },
    { id: 'support', label: '서포트', icon: '🛡️', cards: CollectionSystem.SUPPORT_CARDS, state: state.support },
    { id: 'enemy', label: '적', icon: '👾', cards: CollectionSystem.ENEMY_CARDS, state: state.enemy },
  ];

  const current = tabs.find(t => t.id === tab);
  const allCards = Object.values(current.cards);
  const filtered = allCards.filter(card => {
    const progress = current.state[card.id];
    if (filter === 'unlocked') return !!progress;
    if (filter === 'locked') return !progress;
    return true;
  });

  const unlockedCount = Object.keys(current.state).length;

  const rarityColors = {
    common:    { bg: 'bg-gray-800',  border: 'border-gray-600',  text: 'text-gray-300' },
    rare:      { bg: 'bg-blue-900/50',   border: 'border-blue-500/60',    text: 'text-blue-300' },
    epic:      { bg: 'bg-purple-900/50', border: 'border-purple-500/60',  text: 'text-purple-300' },
    legendary: { bg: 'bg-amber-900/50',  border: 'border-amber-500/60',   text: 'text-amber-300' },
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 rounded-2xl border-2 border-cyan-500/40 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0891b280 0%, transparent 100%)' }}>
          <h2 className="text-2xl font-black text-cyan-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            🗂️ 도감
          </h2>
          <div className="text-sm">
            <span className="text-gray-400">수집률 </span>
            <span className="text-cyan-300 font-bold">{completion.unlocked}/{completion.total}</span>
            <span className="text-cyan-300 font-bold"> ({completion.percent}%)</span>
          </div>
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300">✕</button>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-2 bg-gray-800/40 border-b border-gray-700">
          {tabs.map(t => {
            const unlockedInTab = Object.keys(t.state).length;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={'flex-1 px-3 py-2 rounded text-xs font-bold transition-all ' + (tab === t.id ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50')}
              >
                {t.icon} {t.label} <span className="text-[10px] opacity-80">{unlockedInTab}/{Object.keys(t.cards).length}</span>
              </button>
            );
          })}
        </div>

        {/* 필터 */}
        <div className="flex gap-2 px-3 py-2 bg-gray-800/30 border-b border-gray-700/50 text-xs">
          {[{ id: 'all', label: '전체' }, { id: 'unlocked', label: '획득' }, { id: 'locked', label: '미획득' }].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={'px-3 py-1 rounded transition-colors ' + (filter === f.id ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 카드 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {filtered.map(card => {
              const progress = current.state[card.id];
              const locked = !progress;
              const rc = rarityColors[card.rarity] || rarityColors.common;
              return (
                <div
                  key={card.id}
                  className={`rounded-lg p-2 border-2 ${rc.border} ${rc.bg} transition-all ${locked ? 'opacity-40 saturate-0' : 'hover:scale-105'}`}
                >
                  <div className="text-2xl text-center mb-1">{locked ? '🔒' : card.icon}</div>
                  <div className={`text-xs font-bold text-center ${rc.text}`}>{locked ? '???' : card.name}</div>
                  {!locked && (
                    <div className="mt-1 text-center">
                      <div className="text-[10px] text-gray-400">생성 {progress.count}회</div>
                      <div className="text-[10px] text-amber-300">Lv.{progress.level}</div>
                      {progress.level < 10 && (
                        <div className="mt-1 h-1 rounded bg-gray-700 overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${((progress.count % 5) / 5) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-gray-500 py-10">조건에 맞는 카드가 없습니다.</div>
          )}
        </div>

        {/* 안내 */}
        <div className="p-3 text-xs text-gray-500 border-t border-gray-700 bg-gray-800/30">
          💡 타워를 생성하거나 적을 처치할 때마다 자동으로 기록됩니다. 5회당 카드 레벨 1 상승 (최대 Lv.10).
        </div>
      </div>
    </div>
  );
};

window.CollectionModal = CollectionModal;
