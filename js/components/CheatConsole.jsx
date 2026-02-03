// CheatConsole - 치트 콘솔 UI 컴포넌트
const CheatConsole = ({
    cheatOpen,
    setCheatOpen,
    cheatInput,
    setCheatInput,
    cheatLog,
    cheatInputRef,
    handleCheatSubmit,
    handleKeyDown,
}) => {
    if (!cheatOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50" style={{ fontFamily: 'monospace' }}>
            <div className="bg-black/95 border-t border-green-500/50 max-h-60 flex flex-col">
                <div className="flex justify-between items-center px-3 py-1 border-b border-green-500/30">
                    <span className="text-green-400 text-xs font-bold">CHEAT CONSOLE</span>
                    <button onClick={() => setCheatOpen(false)} className="text-gray-500 hover:text-white text-xs">ESC / `</button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-1 text-xs">
                    {cheatLog.map((line, i) => (
                        <div key={i} className={line.startsWith('>') ? 'text-cyan-400' : line.startsWith('❌') ? 'text-red-400' : 'text-green-300'} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>
                    ))}
                </div>
                <form onSubmit={handleCheatSubmit} className="flex border-t border-green-500/30">
                    <span className="text-green-400 px-2 py-2 text-sm">{'>'}</span>
                    <input
                        ref={cheatInputRef}
                        value={cheatInput}
                        onChange={(e) => setCheatInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setCheatOpen(false);
                            else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') handleKeyDown(e);
                        }}
                        className="flex-1 bg-transparent text-green-300 text-sm py-2 outline-none"
                        placeholder="help 입력으로 명령어 확인"
                        autoFocus
                    />
                </form>
            </div>
        </div>
    );
};

window.CheatConsole = CheatConsole;
