// HintToast - 동적 힌트 토스트 (lives 급격 손실, 웨이브 정체 등 상황 감지)
// 짧게 상단 중앙에 2-3초 팝업 → 자동 소멸
const HintToast = ({ message, icon = '💡', visible, onClose }) => {
  const { useEffect } = React;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onClose && onClose(), 4000);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible || !message) return null;

  return (
    <div
      className="fixed bg-gray-900/95 border-2 border-yellow-400/70 rounded-xl px-4 py-2 shadow-2xl pointer-events-auto flex items-center gap-2"
      style={{
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9997,
        boxShadow: '0 0 30px rgba(251, 191, 36, 0.35)',
        maxWidth: '90%',
      }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm text-gray-100">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-200 text-xs">✕</button>
    </div>
  );
};

window.HintToast = HintToast;
