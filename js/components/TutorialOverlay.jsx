// Neon Defense - 튜토리얼 오버레이 (경량 가이드)
// 첫 게임 진입 시 주요 액션을 단계별로 안내. 플레이어 행동으로 자동 진행.
//
// 단계:
//   1. draw   — 뽑기 액션 유도 (🎲 x1 또는 x10)
//   2. combine — (인벤토리 3개 이상 시) 조합 또는 전체 조합 설명 (자동 조합이 ON이면 자동 처리됨을 알림)
//   3. place   — 맵에 타워 배치
//   4. start   — ▶ 시작 버튼으로 웨이브 시작
//   5. done    — 완료 안내
//
// 진행은 상태 변화를 부모가 감지해 step을 넘겨줌.

const TutorialOverlay = ({ step, onSkip, onNext, onClose }) => {
  if (!step || step === 'none' || step === 'done-closed') return null;

  const stepData = {
    draw: {
      title: '1️⃣ 타워 뽑기',
      body: '아래 🎲 버튼을 눌러 랜덤 타워를 획득하세요. x10 버튼은 골드가 허용하는 만큼 한 번에 뽑습니다.',
      target: 'bottom',
      icon: '🎲',
    },
    combine: {
      title: '2️⃣ 조합',
      body: '같은 속성/티어 3개를 조합하면 상위 티어 타워가 됩니다. 자동 조합 옵션이 켜져 있으면 뽑기 후 자동 처리돼요.',
      target: 'bottom',
      icon: '⚡',
    },
    place: {
      title: '3️⃣ 배치',
      body: '경로 인접 빈 타일을 탭하고 속성 → 티어를 선택해 타워를 배치하세요. PC에서는 인벤토리에서 드래그도 가능.',
      target: 'top',
      icon: '📍',
    },
    start: {
      title: '4️⃣ 웨이브 시작',
      body: '준비가 끝나면 ▶ 시작 버튼으로 웨이브를 시작하세요. 적이 경로를 따라 이동하면 타워가 자동 공격합니다.',
      target: 'bottom',
      icon: '▶',
    },
    done: {
      title: '✨ 튜토리얼 완료',
      body: '기본 조작을 모두 배웠습니다. 웨이브를 클리어하며 자원/버프를 모아 상위 타워를 만들어보세요!',
      target: 'center',
      icon: '🎉',
    },
  };

  const data = stepData[step];
  if (!data) return null;

  // 타겟에 따라 위치 조정 (JIT 안전 인라인 스타일)
  const posStyle = data.target === 'bottom'
    ? { bottom: 80, left: '50%', transform: 'translateX(-50%)' }
    : data.target === 'top'
    ? { top: 80, left: '50%', transform: 'translateX(-50%)' }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed bg-gray-900/95 border-2 border-cyan-400/60 rounded-xl p-4 max-w-sm w-[90%] shadow-2xl pointer-events-auto"
      style={{ ...posStyle, zIndex: 9998, boxShadow: '0 0 30px rgba(0, 255, 255, 0.3)' }}>
      <div className="flex items-start gap-3">
        <div className="text-3xl">{data.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-cyan-300 font-bold text-sm mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>{data.title}</h3>
          <p className="text-gray-200 text-xs leading-relaxed">{data.body}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs">
        <button onClick={onSkip} className="text-gray-400 hover:text-gray-200 underline">튜토리얼 건너뛰기</button>
        <div className="flex gap-2">
          {step !== 'done' && onNext && (
            <button onClick={onNext} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200">다음 →</button>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 rounded font-bold text-white">확인</button>
          )}
        </div>
      </div>
    </div>
  );
};

window.TutorialOverlay = TutorialOverlay;
