// Neon Defense - 메타 업그레이드 패널
// 8종 영구 업그레이드 카드 그리드 + 구매 UI

const MetaUpgradePanel = ({ metaProgress, neonCrystals, onPurchaseUpgrade }) => {
  const upgradeIds = Object.keys(META_UPGRADES);

  return (
    <div className="space-y-4">
      {/* 크리스탈 잔액 */}
      <div className="flex items-center justify-center gap-2 text-lg">
        <span className="text-2xl">💎</span>
        <span className="text-cyan-300 font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {neonCrystals.toLocaleString()}
        </span>
        <span className="text-gray-400 text-sm">네온 크리스탈</span>
      </div>

      {/* 업그레이드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {upgradeIds.map(id => {
          const upgrade = META_UPGRADES[id];
          const currentLevel = metaProgress.upgrades[id] || 0;
          const isMaxed = currentLevel >= upgrade.maxLevel;
          const cost = isMaxed ? null : upgrade.cost(currentLevel);
          const canAfford = !isMaxed && neonCrystals >= cost;
          const currentEffect = currentLevel > 0 ? upgrade.formatEffect(currentLevel) : '-';
          const nextEffect = !isMaxed ? upgrade.formatEffect(currentLevel + 1) : '-';

          return (
            <div
              key={id}
              className={`relative bg-gray-800/80 border rounded-lg p-3 transition-all ${
                isMaxed
                  ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                  : canAfford
                    ? 'border-cyan-500/50 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 cursor-pointer'
                    : 'border-gray-600/50 opacity-70'
              }`}
              onClick={() => canAfford && onPurchaseUpgrade(id)}
            >
              {/* 최대 레벨 배지 */}
              {isMaxed && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  MAX
                </div>
              )}

              {/* 아이콘 & 이름 */}
              <div className="text-center mb-2">
                <div className="text-2xl mb-1">{upgrade.icon}</div>
                <div className="text-xs font-bold text-gray-200 truncate">{upgrade.name}</div>
              </div>

              {/* 레벨 바 */}
              <div className="flex gap-0.5 mb-2 justify-center">
                {Array.from({ length: upgrade.maxLevel }, (_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i < currentLevel
                        ? isMaxed ? 'bg-yellow-400' : 'bg-cyan-400'
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${Math.max(4, 100 / upgrade.maxLevel - 2)}%` }}
                  />
                ))}
              </div>

              {/* 현재 효과 */}
              <div className="text-center text-xs">
                <span className="text-gray-400">현재: </span>
                <span className="text-cyan-300 font-bold">{currentEffect}</span>
              </div>

              {/* 다음 레벨 & 비용 */}
              {!isMaxed && (
                <div className="mt-2 text-center">
                  <div className="text-xs text-gray-400">
                    다음: <span className="text-green-300">{nextEffect}</span>
                  </div>
                  <div className={`text-xs font-bold mt-1 ${canAfford ? 'text-cyan-300' : 'text-gray-500'}`}>
                    💎 {cost}
                  </div>
                </div>
              )}

              {/* 설명 툴팁 */}
              <div className="text-xs text-gray-500 text-center mt-1 truncate" title={upgrade.desc}>
                {upgrade.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 전역 등록
window.MetaUpgradePanel = MetaUpgradePanel;
