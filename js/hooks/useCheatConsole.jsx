// useCheatConsole - 치트 콘솔 훅
const useCheatConsole = (gameState, inventoryState) => {
    const { useState, useCallback, useRef, useEffect } = React;

    const {
        stage, setGold, setLives,
        clearWave, advanceStage
    } = gameState;

    const {
        addTowerToInventory,
        addSupportToInventory
    } = inventoryState;

    const [cheatOpen, setCheatOpen] = useState(false);
    const [cheatInput, setCheatInput] = useState('');
    const [cheatLog, setCheatLog] = useState([]);
    const cheatInputRef = useRef(null);

    const executeCheat = useCallback((cmd) => {
        const parts = cmd.trim().toLowerCase().split(/\s+/);
        const command = parts[0];
        const arg = parts[1] ? parseInt(parts[1]) : null;

        switch (command) {
            case 'nextstage':
            case 'ns':
                const ns = stage + 1;
                advanceStage(ns);
                setGold(prev => prev + ECONOMY.stageClearBonus(stage));
                return '▶ Stage ' + ns + '로 이동';
            case 'stage':
                if (!arg || arg < 1) return '❌ 사용법: stage [번호]';
                advanceStage(arg);
                return '▶ Stage ' + arg + '로 이동';
            case 'clearwave':
            case 'cw':
                clearWave();
                return '▶ 웨이브 클리어';
            case 'gold':
                const goldAmt = arg || 500;
                setGold(prev => prev + goldAmt);
                return '▶ 골드 +' + goldAmt;
            case 'lives':
                const livesAmt = arg || 10;
                setLives(prev => prev + livesAmt);
                return '▶ 목숨 +' + livesAmt;
            case 'tower':
                const tier = Math.min(4, Math.max(1, arg || 4));
                const elem = Math.floor(Math.random() * 6);
                addTowerToInventory(tier, elem);
                return '▶ T' + tier + ' 타워 획득';
            case 'support':
                const sTier = Math.min(3, Math.max(1, arg || 3));
                const sType = Math.floor(Math.random() * 4);
                addSupportToInventory(sTier, sType);
                return '▶ S' + sTier + ' ' + SUPPORT_UI[sType].name + ' 서포트 획득';
            case 'help':
                return [
                    '── 명령어 목록 ──',
                    'nextstage (ns)  다음 스테이지',
                    'stage [n]       n 스테이지로 이동',
                    'clearwave (cw)  웨이브 즉시 클리어',
                    'gold [n]        골드 추가 (기본 500)',
                    'lives [n]       목숨 추가 (기본 10)',
                    'tower [tier]    타워 획득 (기본 T4)',
                    'support [tier]  서포트 획득 (기본 S3)',
                    'help            명령어 목록',
                ].join('\n');
            default:
                return '❌ 알 수 없는 명령어. help 입력';
        }
    }, [stage, setGold, setLives, clearWave, advanceStage, addTowerToInventory, addSupportToInventory]);

    const handleCheatSubmit = useCallback((e) => {
        e.preventDefault();
        if (!cheatInput.trim()) return;
        const result = executeCheat(cheatInput);
        setCheatLog(prev => [...prev.slice(-20), '> ' + cheatInput, result]);
        setCheatInput('');
    }, [cheatInput, executeCheat]);

    // 백틱(`)으로 콘솔 토글
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === '`') {
                e.preventDefault();
                setCheatOpen(prev => {
                    if (!prev) setTimeout(() => cheatInputRef.current?.focus(), 50);
                    return !prev;
                });
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return {
        cheatOpen,
        setCheatOpen,
        cheatInput,
        setCheatInput,
        cheatLog,
        cheatInputRef,
        handleCheatSubmit,
    };
};

window.useCheatConsole = useCheatConsole;
