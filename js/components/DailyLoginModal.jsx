// Neon Defense - 일일 출석 보상 모달
// 7일 그리드 표시, 오늘 보상 강조, 클릭 시 수령
const DailyLoginModal = ({ isOpen, onClose, onClaim }) => {
  const { useState, useEffect } = React;
  const [status, setStatus] = useState(null);
  const [justClaimed, setJustClaimed] = useState(null);

  useEffect(() => {
    if (!isOpen) { setJustClaimed(null); return; }
    setStatus(DailyLogin.getStatus());
  }, [isOpen]);

  if (!isOpen) return null;

  const rewards = DailyLogin.REWARDS;
  const currentDay = status?.state?.currentDay || 0;
  const nextDay = status?.nextDay;
  const canClaim = status?.canClaim;

  const handleClaim = () => {
    const res = DailyLogin.claim({
      onCrystals: (n) => onClaim && onClaim({ crystals: n }),
      onTickets: (n) => onClaim && onClaim({ tickets: n }),
    });
    if (res.claimed) {
      setJustClaimed({ day: res.day, reward: res.reward });
      setStatus(DailyLogin.getStatus());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4" style={{ zIndex: 9998 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 rounded-2xl border-2 border-amber-500/50 max-w-2xl w-full overflow-hidden" style={{ boxShadow: '0 0 40px rgba(245,158,11,0.3)' }}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, transparent 100%)' }}>
          <h2 className="text-2xl font-black text-amber-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            📅 일일 출석 보상
          </h2>
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300">✕</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="text-xs text-gray-400">
            {canClaim
              ? (status?.streakBroken
                ? '⚠️ 연속 출석이 끊어졌습니다. Day 1부터 다시 시작!'
                : `✨ Day ${nextDay} 보상 수령 가능!`)
              : '오늘은 이미 수령했습니다. 내일 다시 오세요!'}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {rewards.map((r, idx) => {
              const day = idx + 1;
              const isClaimed = day <= currentDay && !canClaim;
              const isNext = canClaim && day === nextDay;
              const isFuture = !isClaimed && !isNext;
              return (
                <div key={day}
                  className={'rounded-lg p-2 text-center border-2 transition-all ' +
                    (isNext ? 'border-amber-400 bg-amber-500/20' :
                     isClaimed ? 'border-green-500/50 bg-green-900/20 opacity-70' :
                     'border-gray-700 bg-gray-800/50')}
                  style={isNext ? { boxShadow: '0 0 20px rgba(245,158,11,0.5)' } : {}}
                >
                  <div className="text-xs text-gray-400 mb-1">Day {day}</div>
                  <div className="text-2xl mb-1">{r.icon}</div>
                  <div className={'text-[10px] font-bold leading-tight ' + (isNext ? 'text-amber-300' : isClaimed ? 'text-green-300' : 'text-gray-400')}>
                    {r.label}
                  </div>
                  {isClaimed && <div className="text-xs text-green-400 mt-1">✓</div>}
                  {isNext && <div className="text-xs text-amber-400 mt-1 animate-pulse">TODAY</div>}
                </div>
              );
            })}
          </div>

          {justClaimed && (
            <div className="p-3 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border border-amber-500/50 rounded-lg text-center">
              <div className="text-sm text-amber-300 font-bold">🎉 Day {justClaimed.day} 보상 수령 완료!</div>
              <div className="text-xs text-gray-300 mt-1">{justClaimed.reward.label}</div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
            <div className="text-xs text-gray-400">
              🔥 연속 출석: <span className="text-orange-300 font-bold">{status?.state?.streak || 0}일</span>
            </div>
            {canClaim ? (
              <button onClick={handleClaim}
                className="px-6 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 rounded-lg font-bold text-white transition-all">
                보상 받기
              </button>
            ) : (
              <button onClick={onClose} className="px-6 py-2 bg-gray-700 rounded-lg text-gray-300">확인</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.DailyLoginModal = DailyLoginModal;
