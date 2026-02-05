// Neon Defense - 저장/불러오기 모달
// 게임 시작 시 불러오기 옵션, 스테이지 클리어 시 저장 옵션 제공

const SaveLoadModal = ({ show, mode, onNewGame, onLoadGame, onSaveAndQuit, onContinue, saveInfo }) => {
  if (!show) return null;

  // mode: 'start' (게임 시작), 'stageClear' (스테이지 클리어)

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  // ===== 게임 시작 모달 =====
  if (mode === 'start') {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border-2 border-purple-500 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #a855f7' }}>
            ⚡ NEON DEFENSE ⚡
          </h2>

          {saveInfo ? (
            <div className="space-y-4">
              {/* 저장된 게임 정보 */}
              <div className="bg-gray-800 border border-purple-400 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-sm text-gray-400 mb-1">저장된 게임</div>
                  <div className="text-2xl font-bold text-purple-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Stage {saveInfo.stage} - Wave {saveInfo.wave}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">💰</span>
                    <span className="text-gray-300">{saveInfo.gold}G</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">❤️</span>
                    <span className="text-gray-300">{saveInfo.lives}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🗼</span>
                    <span className="text-gray-300">{saveInfo.towerCount}개</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🛡️</span>
                    <span className="text-gray-300">{saveInfo.supportCount}개</span>
                  </div>
                </div>
                <div className="text-center mt-3 text-xs text-gray-500">
                  {formatTime(saveInfo.timestamp)}
                </div>
              </div>

              {/* 버튼 */}
              <button
                onClick={onLoadGame}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all text-lg shadow-lg"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                ▶ 이어하기
              </button>

              <button
                onClick={onNewGame}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                🆕 새 게임 (기존 저장 삭제)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-gray-400 mb-6">
                저장된 게임이 없습니다
              </div>
              <button
                onClick={onNewGame}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all text-lg shadow-lg"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                ▶ 새 게임 시작
              </button>
            </div>
          )}

          {/* 하단 정보 */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <div>최대 스테이지: {SPAWN.maxStage}</div>
            <div className="mt-1">자동 저장: 30초마다</div>
          </div>
        </div>
      </div>
    );
  }

  // ===== 스테이지 클리어 모달 (저장 옵션) =====
  if (mode === 'stageClear') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-6 text-green-400" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #22c55e' }}>
            🎉 스테이지 클리어!
          </h2>

          <div className="text-center mb-8">
            <div className="text-gray-300 mb-2">다음 스테이지로 진행하시겠습니까?</div>
            <div className="text-sm text-gray-500">
              저장하고 나가기를 선택하면<br/>
              언제든지 이어서 플레이할 수 있습니다
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all text-lg shadow-lg"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              ▶ 계속 플레이
            </button>

            <button
              onClick={onSaveAndQuit}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              💾 저장하고 나가기
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            자동 저장이 활성화되어 있습니다
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// 글로벌 등록
window.SaveLoadModal = SaveLoadModal;
