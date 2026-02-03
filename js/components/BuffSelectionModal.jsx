// BuffSelectionModal - 스테이지 클리어 시 버프 선택 모달
const BuffSelectionModal = ({ isOpen, buffChoices, currentBuffs, onSelectBuff }) => {
  if (!isOpen || !buffChoices || buffChoices.length === 0) return null;

  const { useState } = React;
  const [hoveredBuff, setHoveredBuff] = useState(null);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-500 rounded-2xl p-6 max-w-4xl mx-4"
        style={{ boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)' }}>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-2"
            style={{ textShadow: '0 0 10px #00ffff' }}>
            🎉 스테이지 클리어!
          </h2>
          <p className="text-gray-400">영구 버프를 선택하세요</p>
        </div>

        {/* 버프 카드들 */}
        <div className="flex gap-4 justify-center flex-wrap">
          {buffChoices.map((buff, index) => {
            const currentStacks = currentBuffs[buff.id] || 0;
            const isMaxed = currentStacks >= buff.maxStacks;
            const isHovered = hoveredBuff === buff.id;

            return (
              <div
                key={buff.id}
                className={`
                  relative w-48 p-4 rounded-xl cursor-pointer transition-all duration-300
                  ${isMaxed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  ${isHovered ? 'ring-2 ring-white' : ''}
                `}
                style={{
                  background: `linear-gradient(135deg, ${buff.color}30 0%, ${buff.color}10 100%)`,
                  border: `2px solid ${buff.color}`,
                  boxShadow: isHovered ? `0 0 30px ${buff.color}` : `0 0 15px ${buff.color}50`,
                }}
                onClick={() => !isMaxed && onSelectBuff(buff.id)}
                onMouseEnter={() => setHoveredBuff(buff.id)}
                onMouseLeave={() => setHoveredBuff(null)}
              >
                {/* 아이콘 */}
                <div className="text-5xl text-center mb-3"
                  style={{ filter: `drop-shadow(0 0 10px ${buff.color})` }}>
                  {buff.icon}
                </div>

                {/* 이름 */}
                <h3 className="text-lg font-bold text-center text-white mb-2"
                  style={{ textShadow: `0 0 5px ${buff.color}` }}>
                  {buff.name}
                </h3>

                {/* 설명 */}
                <p className="text-sm text-gray-300 text-center mb-3 min-h-[40px]">
                  {buff.description}
                </p>

                {/* 스택 표시 */}
                {buff.stackable && (
                  <div className="flex justify-center gap-1 mb-2">
                    {Array.from({ length: buff.maxStacks }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border ${
                          i < currentStacks
                            ? 'bg-white border-white'
                            : i === currentStacks
                            ? 'bg-transparent border-white animate-pulse'
                            : 'bg-transparent border-gray-600'
                        }`}
                        style={i < currentStacks ? { boxShadow: `0 0 5px ${buff.color}` } : {}}
                      />
                    ))}
                  </div>
                )}

                {/* 현재 스택 텍스트 */}
                <p className="text-xs text-center"
                  style={{ color: buff.color }}>
                  {isMaxed ? '최대 스택!' : `${currentStacks} / ${buff.maxStacks}`}
                </p>

                {/* 호버 시 선택 힌트 */}
                {isHovered && !isMaxed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <span className="text-white font-bold text-lg">클릭하여 선택</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 현재 활성 버프 표시 */}
        {Object.keys(currentBuffs).length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500 text-center mb-2">현재 활성 버프</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PermanentBuffManager.getActiveBuffsList(currentBuffs).map(buff => (
                <div
                  key={buff.id}
                  className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  style={{
                    backgroundColor: `${buff.color}30`,
                    border: `1px solid ${buff.color}`,
                    color: buff.color,
                  }}
                >
                  <span>{buff.icon}</span>
                  <span>{buff.name}</span>
                  {buff.stacks > 1 && <span>×{buff.stacks}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.BuffSelectionModal = BuffSelectionModal;
