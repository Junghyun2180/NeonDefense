// GameHeader - 상단 정보 바 컴포넌트
const GameHeader = ({ stage, wave, gold, lives, pathCount, isPlaying, killedCount, permanentBuffs = {}, gameMode = null, spawnConfig = null }) => {
    // 활성 버프 목록
    const activeBuffs = typeof PermanentBuffManager !== 'undefined'
        ? PermanentBuffManager.getActiveBuffsList(permanentBuffs)
        : [];

    const activeSPAWN = spawnConfig || SPAWN;
    const isRunMode = !!gameMode;

    return (
        <div className="max-w-4xl mx-auto mb-2 sm:mb-4">
            <h1 className="text-xl sm:text-4xl font-black text-center mb-2 sm:mb-4 tracking-wider" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1, #dda0dd, #ffd93d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 30px rgba(78, 205, 196, 0.5)' }}>
                ⚡ NEON DEFENSE ⚡
            </h1>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-3 mb-2 sm:mb-4 text-xs sm:text-base">
                {isRunMode && (
                    <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-1 sm:gap-2">
                        <span className="font-bold text-orange-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {gameMode === 'endless' ? '♾️ ENDLESS' : gameMode === 'daily' ? '📅 DAILY' : '🎲 RUN'}
                        </span>
                    </div>
                )}
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-emerald-500/50 flex items-center gap-1 sm:gap-2">
                    <span className="text-emerald-400">🏰</span>
                    <span className="font-bold text-emerald-300">{stage}/{gameMode === 'endless' ? '∞' : activeSPAWN.maxStage}</span>
                </div>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-cyan-500/50 flex items-center gap-1 sm:gap-2">
                    <span className="text-cyan-400">🌊</span>
                    <span className="font-bold text-cyan-300">{wave}/{activeSPAWN.wavesPerStage}</span>
                </div>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center gap-1 sm:gap-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="font-bold text-yellow-300">{gold}</span>
                </div>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-red-500/50 flex items-center gap-1 sm:gap-2">
                    <span className="text-red-400">❤️</span>
                    <span className="font-bold text-red-300">{lives}</span>
                </div>
                <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-1 sm:gap-2">
                    <span className="text-orange-400">🛤️</span>
                    <span className="font-bold text-orange-300">{pathCount}</span>
                </div>
                {isPlaying && (
                    <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-900 rounded-lg border border-purple-500/50 flex items-center gap-1 sm:gap-2">
                        <span className="text-purple-400">👾</span>
                        <span className="font-bold text-purple-300">{killedCount}/{activeSPAWN.enemiesPerWave(stage, wave)}</span>
                    </div>
                )}
            </div>
            {/* 영구 버프 표시 */}
            {activeBuffs.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mb-2">
                    {activeBuffs.map(buff => (
                        <div
                            key={buff.id}
                            className="px-2 py-1 rounded-full text-xs flex items-center gap-1"
                            style={{
                                backgroundColor: `${buff.color}20`,
                                border: `1px solid ${buff.color}`,
                                color: buff.color,
                            }}
                            title={`${buff.name}: ${buff.description}`}
                        >
                            <span>{buff.icon}</span>
                            {buff.stacks > 1 && <span className="font-bold">×{buff.stacks}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

window.GameHeader = GameHeader;
