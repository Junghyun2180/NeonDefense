// GameHeader - 상단 정보 바 컴포넌트
const GameHeader = ({ stage, wave, gold, lives, pathCount, isPlaying, killedCount }) => {
    return (
        <div className="max-w-4xl mx-auto mb-4">
            <h1 className="text-2xl sm:text-4xl font-black text-center mb-4 tracking-wider" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1, #dda0dd, #ffd93d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 30px rgba(78, 205, 196, 0.5)' }}>
                ⚡ NEON DEFENSE ⚡
            </h1>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 text-sm sm:text-base">
                <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-emerald-500/50 flex items-center gap-2">
                    <span className="text-emerald-400">🏰</span>
                    <span className="font-bold text-emerald-300">Stage {stage}</span>
                </div>
                <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-cyan-500/50 flex items-center gap-2">
                    <span className="text-cyan-400">🌊</span>
                    <span className="font-bold text-cyan-300">Wave {wave}/{SPAWN.wavesPerStage}</span>
                </div>
                <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center gap-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="font-bold text-yellow-300">{gold}</span>
                </div>
                <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-red-500/50 flex items-center gap-2">
                    <span className="text-red-400">❤️</span>
                    <span className="font-bold text-red-300">{lives}</span>
                </div>
                <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-2">
                    <span className="text-orange-400">🛤️</span>
                    <span className="font-bold text-orange-300">{pathCount}경로</span>
                </div>
                {isPlaying && (
                    <div className="px-3 sm:px-4 py-2 bg-gray-900 rounded-lg border border-purple-500/50 flex items-center gap-2">
                        <span className="text-purple-400">👾</span>
                        <span className="font-bold text-purple-300">{killedCount}/{SPAWN.enemiesPerWave(stage, wave)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

window.GameHeader = GameHeader;
