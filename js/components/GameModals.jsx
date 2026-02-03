// GameModals - 게임 모달 컴포넌트들
const GameModals = ({
    gameOver,
    resetGame,
    stage,
    wave,
    killedCount,
    showStageTransition,
    showHelp,
    setShowHelp,
    getElementInfo,
}) => {
    return (
        <>
            {/* 게임 오버 모달 */}
            {gameOver && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-8 rounded-2xl text-center border border-red-500/50" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.3)' }}>
                        <h2 className="text-4xl font-black text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-xl text-gray-300 mb-2">Stage {stage} - Wave {wave}까지 도달!</p>
                        <p className="text-gray-500 mb-6">처치한 적: {killedCount + ((stage - 1) * SPAWN.wavesPerStage + wave - 1) * 50}</p>
                        <button type="button" onClick={resetGame} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all">🔄 다시 시작</button>
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

            {/* 도움말 모달 */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowHelp(false)}>
                    <div className="bg-gray-900 rounded-2xl border border-cyan-500/50 max-w-md w-full max-h-[80vh] overflow-y-auto" style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)' }}>
                        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-black text-cyan-400">📖 게임 도움말</h2>
                            <button onClick={() => setShowHelp(false)} className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center hover:bg-gray-700 transition-all">✕</button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <h3 className="text-sm font-bold mb-2 text-pink-400">🎮 기본 조작</h3>
                                <div className="text-xs text-gray-300 space-y-1">
                                    <p>• <span className="text-pink-400">뽑기 ({ECONOMY.drawCost}G)</span>: 랜덤 Tier 1 네온 획득</p>
                                    <p>• <span className="text-yellow-400">선택 조합</span>: 인벤토리에서 같은 타입 3개 선택 후 조합</p>
                                    <p>• <span className="text-amber-400">전체 조합</span>: 조합 가능한 모든 타워 자동 조합</p>
                                    <p>• <span className="text-cyan-400">배치 (PC)</span>: 인벤토리에서 드래그하여 맵에 배치</p>
                                    <p>• <span className="text-green-400">배치 (모바일)</span>: 빈 타일 탭 → 속성 선택 → 티어 선택</p>
                                    <p>• <span className="text-emerald-400">타워 조합</span>: 맵에서 같은 타워 3개 선택 후 조합</p>
                                    <p>• <span className="text-red-400">판매</span>: 맵의 타워 선택 후 판매 ({Math.floor(ECONOMY.sellRefundRate * 100)}% 환급)</p>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <h3 className="text-sm font-bold mb-2 text-purple-400">🔮 속성 정보</h3>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {ELEMENT_UI.map(elem => {
                                        const info = getElementInfo(elem.id);
                                        return (
                                            <div key={elem.id} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                                                <span className="text-lg">{elem.icon}</span>
                                                <div><p className="font-bold" style={{ color: elem.color }}>{elem.name}</p><p className="text-gray-500">{info.desc}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <h3 className="text-sm font-bold mb-2 text-red-400">👾 적 타입</h3>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.entries(ENEMY_CONFIG).map(([type, cfg]) => {
                                        const labels = { normal: '일반', fast: '빠름', elite: '엘리트', boss: '보스', jammer: '방해자', suppressor: '억제자' };
                                        const descs = { normal: '기본 적', fast: '60% HP, 고속', elite: '250% HP', boss: '800%+ HP', jammer: '타워 공속⬇️', suppressor: '타워 공격력⬇️' };
                                        return (
                                            <div key={type} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded">
                                                {cfg.icon ? <span className="text-lg">{cfg.icon}</span> : <span className={'w-4 h-4 rounded-sm rotate-45 ' + cfg.color}></span>}
                                                <div><p className="font-bold" style={{ color: cfg.explosionColor }}>{labels[type]}</p><p className="text-gray-500">{descs[type]}</p></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <h3 className="text-sm font-bold mb-2 text-yellow-400">💡 팁</h3>
                                <div className="text-xs text-gray-300 space-y-1">
                                    <p>• 스테이지가 올라갈수록 출발점/도착점이 늘어나요!</p>
                                    <p>• 🚪A, 🚪B, 🚪C... 여러 경로를 모두 방어하세요</p>
                                    <p>• ❄️ 슬로우로 적을 늦추고 🔥 화상으로 지속 데미지!</p>
                                    <p>• ⚡ 전격은 다수의 적에게 효과적</p>
                                    <p>• 🌪️ 질풍은 보스에게 강력한 데미지</p>
                                    <p>• 전체 조합으로 빠르게 고티어 타워를 만드세요</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

window.GameModals = GameModals;
