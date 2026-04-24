// GameHeader - 상단 정보 바 컴포넌트
const GameHeader = ({ stage, wave, gold, lives, pathCount, isPlaying, killedCount, permanentBuffs = {}, gameMode = null, spawnConfig = null, onMainMenu = null }) => {
    const { useState } = React;
    const [showExitConfirm, setShowExitConfirm] = useState(false);

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
            <div className="relative flex items-center justify-center mb-2 sm:mb-3 text-xs sm:text-sm">
                {/* 좌측: 메인메뉴 버튼 */}
                {onMainMenu && (
                    <button onClick={() => setShowExitConfirm(true)} className="absolute left-0 text-xs text-gray-400 hover:text-white transition-all whitespace-nowrap">← 메인 메뉴</button>
                )}
                {/* 가운데: 상태 뱃지 */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {isRunMode && (
                        <div className="px-2 py-1 bg-gray-900 rounded-lg border border-orange-500/50">
                            <span className="font-bold text-orange-300 text-xs" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {gameMode === 'endless' ? '♾️ ENDLESS' : gameMode === 'daily' ? '📅 DAILY' : '🎲 RUN'}
                            </span>
                        </div>
                    )}
                    <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-900 rounded-lg border border-emerald-500/50 flex items-center gap-1">
                        <span className="text-emerald-400">🏰</span>
                        <span className="font-bold text-emerald-300 whitespace-nowrap">{stage}/{gameMode === 'endless' ? '∞' : activeSPAWN.maxStage}</span>
                    </div>
                    <div
                        className={'px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border flex items-center gap-1 ' +
                            (wave === activeSPAWN.wavesPerStage
                                ? 'bg-red-900/60 border-red-500 animate-pulse'
                                : 'bg-gray-900 border-cyan-500/50')}
                        title={wave === activeSPAWN.wavesPerStage ? '🚨 DANGER WAVE — 적 속도/체력 강화' : ''}
                    >
                        <span className={wave === activeSPAWN.wavesPerStage ? 'text-red-400' : 'text-cyan-400'}>
                            {wave === activeSPAWN.wavesPerStage ? '🚨' : '🌊'}
                        </span>
                        <span className={'font-bold whitespace-nowrap ' + (wave === activeSPAWN.wavesPerStage ? 'text-red-300' : 'text-cyan-300')}>
                            {wave}/{activeSPAWN.wavesPerStage}
                        </span>
                    </div>
                    <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-900 rounded-lg border border-yellow-500/50 flex items-center gap-1">
                        <span className="text-yellow-400">💰</span>
                        <span className="font-bold text-yellow-300 whitespace-nowrap">{gold}</span>
                    </div>
                    <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-900 rounded-lg border border-red-500/50 flex items-center gap-1">
                        <span className="text-red-400">❤️</span>
                        <span className="font-bold text-red-300 whitespace-nowrap">{lives}</span>
                    </div>
                    <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-900 rounded-lg border border-orange-500/50 flex items-center gap-1">
                        <span className="text-orange-400">🛤️</span>
                        <span className="font-bold text-orange-300 whitespace-nowrap">{pathCount}</span>
                    </div>
                    {isPlaying && (
                        <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-gray-900 rounded-lg border border-purple-500/50 flex items-center gap-1">
                            <span className="text-purple-400">👾</span>
                            <span className="font-bold text-purple-300 whitespace-nowrap">{killedCount}/{activeSPAWN.enemiesPerWave(stage, wave)}</span>
                        </div>
                    )}
                </div>
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

            {/* 메인 메뉴 복귀 확인 모달 */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-600 text-center max-w-sm mx-4" style={{ boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                        <p className="text-lg text-white font-bold mb-2">메인 메뉴로 돌아가시겠습니까?</p>
                        <p className="text-sm text-gray-400 mb-5">현재 진행 상황이 저장되지 않습니다.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setShowExitConfirm(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-gray-300 transition-all">취소</button>
                            <button onClick={() => { setShowExitConfirm(false); onMainMenu(); }} className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg font-bold text-white transition-all">나가기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.GameHeader = GameHeader;
