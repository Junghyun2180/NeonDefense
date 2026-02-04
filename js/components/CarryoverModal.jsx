// CarryoverModal - 스테이지 클리어 시 타워 캐리오버 선택 모달
const CarryoverModal = ({
  isOpen,
  candidates,       // { towers: [], supports: [] }
  selectedIds,      // { towers: [], supports: [] }
  onToggleTower,    // (towerId) => void
  onToggleSupport,  // (supportId) => void
  onConfirm,        // () => void
  allTowers,        // 맵 + 인벤토리 전체 타워 (환급 계산용)
  allSupports,      // 맵 + 인벤토리 전체 서포트 (환급 계산용)
}) => {
  if (!isOpen) return null;

  const { useMemo } = React;

  const selectedTowerCount = selectedIds.towers.length;
  const selectedSupportCount = selectedIds.supports.length;

  // 예상 환급 계산
  const refundAmount = useMemo(() => {
    return calculateCarryoverRefund(
      allTowers.towers || [],
      allTowers.supports || [],
      allTowers.inventory || [],
      allTowers.supportInventory || [],
      selectedIds
    );
  }, [allTowers, selectedIds]);

  // 속성 정보 헬퍼
  const getElementInfo = (element) => {
    const info = ELEMENT_EFFECTS[element];
    return info || { name: '???', icon: '❓' };
  };

  // 서포트 타입 정보
  const getSupportInfo = (supportType) => {
    const icons = ['⚔️', '⏱️', '💔', '🎯'];
    const names = ['공격력', '공속', '방감', '사거리'];
    return { icon: icons[supportType] || '❓', name: names[supportType] || '???' };
  };

  // 티어별 색상
  const tierColors = {
    2: '#45B7D1',
    3: '#FFD700',
    4: '#FF6B6B',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-2xl p-6 max-w-4xl mx-4"
        style={{ boxShadow: '0 0 50px rgba(168, 85, 247, 0.3)' }}>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400 mb-2"
            style={{ textShadow: '0 0 10px #a855f7' }}>
            📦 타워 캐리오버
          </h2>
          <p className="text-gray-400">다음 스테이지로 가져갈 타워를 선택하세요</p>
        </div>

        {/* 공격 타워 섹션 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-cyan-400">공격 타워</h3>
            <span className="text-sm px-2 py-1 rounded-full"
              style={{
                background: selectedTowerCount >= CARRYOVER.maxTowers ? '#22c55e30' : '#6b728030',
                color: selectedTowerCount >= CARRYOVER.maxTowers ? '#22c55e' : '#9ca3af',
              }}>
              {selectedTowerCount} / {CARRYOVER.maxTowers}
            </span>
          </div>

          {candidates.towers.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {candidates.towers.map(tower => {
                const isSelected = selectedIds.towers.includes(tower.id);
                const elementInfo = getElementInfo(tower.element);
                const canSelect = isSelected || selectedTowerCount < CARRYOVER.maxTowers;

                return (
                  <div
                    key={tower.id}
                    onClick={() => canSelect && onToggleTower(tower.id)}
                    className={`
                      relative w-16 h-20 rounded-lg transition-all duration-200
                      ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
                      ${isSelected ? 'scale-105 ring-2 ring-cyan-400' : 'hover:scale-102'}
                    `}
                    style={{
                      background: `linear-gradient(135deg, ${tower.color}40, ${tower.color}20)`,
                      border: `2px solid ${isSelected ? '#22d3ee' : tierColors[tower.tier]}`,
                      boxShadow: isSelected ? `0 0 15px ${tower.color}` : 'none',
                    }}
                  >
                    {/* 티어 뱃지 */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black"
                      style={{ background: tierColors[tower.tier] }}>
                      T{tower.tier}
                    </div>

                    {/* 속성 아이콘 */}
                    <div className="text-2xl text-center pt-2">
                      {elementInfo.icon}
                    </div>

                    {/* T4 역할 아이콘 */}
                    {tower.roleIcon && (
                      <div className="text-xs text-center">{tower.roleIcon}</div>
                    )}

                    {/* 선택 체크 */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-lg flex items-end justify-center pb-1">
                        <span className="text-cyan-400 text-lg">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">T2 이상 타워 없음</p>
          )}
        </div>

        {/* 서포트 타워 섹션 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-pink-400">서포트 타워</h3>
            <span className="text-sm px-2 py-1 rounded-full"
              style={{
                background: selectedSupportCount >= CARRYOVER.maxSupports ? '#22c55e30' : '#6b728030',
                color: selectedSupportCount >= CARRYOVER.maxSupports ? '#22c55e' : '#9ca3af',
              }}>
              {selectedSupportCount} / {CARRYOVER.maxSupports}
            </span>
          </div>

          {candidates.supports.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {candidates.supports.map(support => {
                const isSelected = selectedIds.supports.includes(support.id);
                const supportInfo = getSupportInfo(support.supportType);
                const canSelect = isSelected || selectedSupportCount < CARRYOVER.maxSupports;

                return (
                  <div
                    key={support.id}
                    onClick={() => canSelect && onToggleSupport(support.id)}
                    className={`
                      relative w-16 h-20 rounded-lg transition-all duration-200
                      ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}
                      ${isSelected ? 'scale-105 ring-2 ring-pink-400' : 'hover:scale-102'}
                    `}
                    style={{
                      background: `linear-gradient(135deg, ${support.color}40, ${support.color}20)`,
                      border: `2px solid ${isSelected ? '#f472b6' : tierColors[support.tier]}`,
                      boxShadow: isSelected ? `0 0 15px ${support.color}` : 'none',
                    }}
                  >
                    {/* 티어 뱃지 */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black"
                      style={{ background: tierColors[support.tier] }}>
                      S{support.tier}
                    </div>

                    {/* 서포트 아이콘 */}
                    <div className="text-2xl text-center pt-3">
                      {supportInfo.icon}
                    </div>

                    {/* 선택 체크 */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-pink-400/20 rounded-lg flex items-end justify-center pb-1">
                        <span className="text-pink-400 text-lg">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">S2 이상 서포트 없음</p>
          )}
        </div>

        {/* 환급 정보 */}
        <div className="border-t border-gray-700 pt-4 mb-4">
          <p className="text-center text-gray-400 text-sm">
            선택하지 않은 타워는 <span className="text-yellow-400 font-bold">50%</span> 환급
          </p>
          <p className="text-center text-yellow-400 text-lg font-bold mt-1">
            💰 예상 환급: {refundAmount}G
          </p>
        </div>

        {/* 확인 버튼 */}
        <div className="text-center">
          <button
            onClick={onConfirm}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
            }}
          >
            확인 ({selectedTowerCount + selectedSupportCount}개 선택됨)
          </button>
        </div>
      </div>
    </div>
  );
};

window.CarryoverModal = CarryoverModal;
