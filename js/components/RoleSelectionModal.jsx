// RoleSelectionModal - T4 타워 역할 선택 모달 컴포넌트
const RoleSelectionModal = ({
    pendingT4Choice,
    onSelectRole,
    onCancel,
    getElementInfo,
}) => {
    if (!pendingT4Choice) return null;

    const { element, roles } = pendingT4Choice;
    const elementInfo = getElementInfo(element);
    const elementUI = ELEMENT_UI.find(e => e.id === element);

    return (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="bg-gray-900 rounded-2xl border-2 max-w-3xl w-full overflow-hidden" style={{ borderColor: elementUI?.color || '#4ECDC4', boxShadow: `0 0 50px ${elementUI?.color}40` }}>
                {/* 헤더 */}
                <div className="p-4 border-b border-gray-700 text-center" style={{ background: `linear-gradient(135deg, ${elementUI?.color}30 0%, transparent 100%)` }}>
                    <h2 className="text-2xl font-black text-white mb-1">
                        <span className="text-3xl mr-2">{elementInfo.icon}</span>
                        T4 역할 선택
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {elementUI?.name} 계열 • {NEON_TYPES[4].names[element]}
                    </p>
                </div>

                {/* 카드 3장 */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roles.map((role, idx) => (
                        <div
                            key={role.id}
                            onClick={() => onSelectRole(role.id)}
                            className="relative bg-gray-800 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-gray-750 border-2 border-transparent hover:border-white group"
                            style={{
                                boxShadow: `0 4px 20px ${elementUI?.color}20`,
                            }}
                        >
                            {/* 역할 레이블 */}
                            <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ background: elementUI?.color, color: '#000' }}>
                                {role.id}
                            </div>

                            {/* 아이콘 */}
                            <div className="text-4xl text-center mb-3 transform group-hover:scale-110 transition-transform">
                                {role.icon}
                            </div>

                            {/* 이름 */}
                            <h3 className="text-lg font-bold text-center mb-2" style={{ color: elementUI?.color }}>
                                {role.name}
                            </h3>

                            {/* 설명 */}
                            <p className="text-xs text-gray-400 text-center mb-3 whitespace-pre-line min-h-[36px]">
                                {role.desc}
                            </p>

                            {/* 스탯 변화 */}
                            <div className="flex justify-center gap-2 text-xs">
                                <StatBadge label="공격" value={role.statMod.damage} color="#FF6B6B" />
                                <StatBadge label="범위" value={role.statMod.range} color="#4ECDC4" />
                                <StatBadge label="속도" value={role.statMod.speed} color="#FFD93D" />
                            </div>

                            {/* 호버 시 선택 표시 */}
                            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
                                    클릭하여 선택
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 하단 */}
                <div className="p-4 border-t border-gray-700 flex justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-gray-300 transition-all"
                    >
                        ✕ 취소
                    </button>
                </div>
            </div>
        </div>
    );
};

// 스탯 배지 컴포넌트
const StatBadge = ({ label, value, color }) => {
    const percent = Math.round((value - 1) * 100);
    const sign = percent >= 0 ? '+' : '';
    const isNeutral = percent === 0;

    return (
        <div
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
                background: isNeutral ? '#374151' : (percent > 0 ? `${color}30` : '#EF444430'),
                color: isNeutral ? '#9CA3AF' : (percent > 0 ? color : '#EF4444'),
                border: `1px solid ${isNeutral ? '#4B5563' : (percent > 0 ? color : '#EF4444')}40`,
            }}
        >
            {label} {sign}{percent}%
        </div>
    );
};

window.RoleSelectionModal = RoleSelectionModal;
window.StatBadge = StatBadge;
