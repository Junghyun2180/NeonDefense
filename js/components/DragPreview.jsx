// DragPreview - 드래그 프리뷰 컴포넌트
const DragPreview = ({ draggingNeon, isDragging, dragPosition, getElementInfo }) => {
    if (!draggingNeon || !isDragging) return null;

    return (
        <div className="fixed pointer-events-none z-50" style={{ left: dragPosition.x - 20, top: dragPosition.y - 20, width: 40, height: 40 }}>
            {draggingNeon.isSupport ? (
                <div className="w-full h-full flex items-center justify-center support-glow" style={{ background: 'linear-gradient(135deg, ' + draggingNeon.color + ' 0%, ' + draggingNeon.color + '80 100%)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <span className="text-sm">{SUPPORT_UI[draggingNeon.supportType].icon}</span>
                </div>
            ) : (
                <div className="w-full h-full rounded-lg flex items-center justify-center neon-glow" style={{ background: 'radial-gradient(circle, ' + draggingNeon.color + ' 0%, ' + draggingNeon.color + '80 50%, transparent 70%)', color: draggingNeon.color }}>
                    <span className="text-sm font-black text-white drop-shadow-lg">{getElementInfo(draggingNeon.element).icon}</span>
                </div>
            )}
        </div>
    );
};

window.DragPreview = DragPreview;
