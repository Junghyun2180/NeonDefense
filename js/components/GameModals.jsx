// GameModals - 게임 모달 컴포넌트들
const GameModals = ({
    gameOver,
    resetGame,
    onMainMenu,
    stage,
    wave,
    killedCount,
    showStageTransition,
    showHelp,
    setShowHelp,
    getElementInfo,
    crystalResult,
}) => {
    return (
        <>
            {/* 게임 오버 모달 */}
            {gameOver && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-2xl text-center border border-red-500/50 max-w-md w-full mx-4" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.3)' }}>
                        <h2 className="text-4xl font-black text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-xl text-gray-300 mb-2">Stage {stage} - Wave {wave}까지 도달!</p>
                        <p className="text-gray-500 mb-4">처치한 적: {killedCount + ((stage - 1) * SPAWN.wavesPerStage + wave - 1) * 50}</p>
                        {/* 캠페인 크리스탈 보상 */}
                        {crystalResult && crystalResult.crystals > 0 && (
                            <div className="mb-4 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-lg p-3">
                                <div className="text-sm text-cyan-300 font-bold mb-2">💎 획득 크리스탈</div>
                                <div className="space-y-1 text-xs">
                                    {crystalResult.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="text-gray-300">{item.label}</span>
                                            <span className={item.color}>💎 {item.amount}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-gray-600 my-1"></div>
                                    <div className="flex justify-between font-bold text-sm">
                                        <span className="text-white">총 획득</span>
                                        <span className="text-cyan-300">💎 {crystalResult.crystals}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <button type="button" onClick={resetGame} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all">🔄 다시 시작</button>
                            {onMainMenu && (
                                <button type="button" onClick={onMainMenu} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-gray-300 transition-all">← 메인 메뉴</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 스테이지 전환 모달 */}
            {showStageTransition && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="text-center">
                        <h2 className="text-5xl font-black mb-4" style={{ background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96e6a1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'neonPulse 1s ease-in-out infinite' }}>🎉 STAGE {stage} CLEAR! 🎉</h2>
                        <p className="text-2xl text-cyan-300 mb-2">Stage {stage + 1} 준비 중...</p>
                        <p className="text-yellow-400 mb-2">⚠️ 새로운 경로가 랜덤 생성됩니다</p>
                        <p className="text-gray-500">타워가 초기화됩니다</p>
                    </div>
                </div>
            )}

            {/* 도움말 모달은 App.jsx 최상위에서 렌더 (메인메뉴/게임 공용) */}
        </>
    );
};

window.GameModals = GameModals;
