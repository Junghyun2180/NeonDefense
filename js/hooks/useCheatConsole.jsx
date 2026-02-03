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

    // 명령어 히스토리
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // 속성명 → 인덱스 매핑
    const ELEMENT_MAP = {
        fire: 0, 화염: 0, 불: 0, f: 0, '0': 0,
        water: 1, 냉기: 1, 얼음: 1, w: 1, ice: 1, '1': 1,
        electric: 2, 전격: 2, 전기: 2, e: 2, '2': 2,
        wind: 3, 질풍: 3, 바람: 3, 공허: 3, v: 3, '3': 3,
        void: 4, 보라: 4, p: 4, purple: 4, '4': 4,
        light: 5, 광휘: 5, 빛: 5, l: 5, '5': 5,
    };

    const executeCheat = useCallback((cmd) => {
        const parts = cmd.trim().toLowerCase().split(/\s+/);
        const command = parts[0];
        const arg = parts[1] ? parseInt(parts[1]) : null;
        const arg2 = parts[2];
        const arg3 = parts[3] ? parseInt(parts[3]) : 1;

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

            // 새 명령어: give [tier] [element] [count]
            case 'give':
            case 'g':
                const gTier = Math.min(4, Math.max(1, arg || 3));
                const gElem = arg2 !== undefined ? (ELEMENT_MAP[arg2] ?? Math.floor(Math.random() * 6)) : Math.floor(Math.random() * 6);
                const gCount = Math.min(30, Math.max(1, arg3));
                for (let i = 0; i < gCount; i++) {
                    addTowerToInventory(gTier, gElem);
                }
                const elemName = ELEMENT_UI[gElem]?.name || gElem;
                return `▶ T${gTier} ${elemName} × ${gCount} 획득`;

            // 새 명령어: t3all - 모든 속성 T3 타워 3개씩 추가
            case 't3all':
                for (let e = 0; e < 6; e++) {
                    for (let i = 0; i < 3; i++) {
                        addTowerToInventory(3, e);
                    }
                }
                return '▶ 모든 속성 T3 × 3 획득 (18개)';

            case 'support':
                const sTier = Math.min(3, Math.max(1, arg || 3));
                const sType = Math.floor(Math.random() * 4);
                addSupportToInventory(sTier, sType);
                return '▶ S' + sTier + ' ' + SUPPORT_UI[sType].name + ' 서포트 획득';

            // 버프 선택 모달 강제 표시
            case 'buff':
            case 'showbuff':
                if (typeof gameState.showBuffSelection !== 'undefined') {
                    // 버프 선택지 생성 및 모달 표시
                    const choices = PermanentBuffManager.getRandomBuffChoices(gameState.permanentBuffs || {}, 3);
                    if (choices.length === 0) {
                        return '❌ 모든 버프가 최대 스택입니다';
                    }
                    // useGameState에서 이 상태를 노출해야 함
                    return '▶ 버프 선택 (스테이지 클리어로 테스트)';
                }
                return '❌ 버프 시스템이 로드되지 않았습니다';

            case 'help':
                return [
                    '── 명령어 목록 ──',
                    'nextstage (ns)  다음 스테이지',
                    'stage [n]       n 스테이지로 이동',
                    'clearwave (cw)  웨이브 즉시 클리어',
                    'gold [n]        골드 추가 (기본 500)',
                    'lives [n]       목숨 추가 (기본 10)',
                    'tower [tier]    랜덤 타워 획득',
                    'give [tier] [속성] [개수]  지정 타워 획득',
                    '  예: give 3 fire 3, give 3 electric 5',
                    '  속성: fire/water/electric/wind/void/light',
                    't3all           모든 속성 T3 × 3 획득',
                    'support [tier]  서포트 획득 (기본 S3)',
                    '↑/↓ 방향키     이전/다음 명령어',
                    'help            명령어 목록',
                    '* 스테이지 클리어 시 버프 선택',
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
        // 히스토리에 추가
        setHistory(prev => [...prev.slice(-50), cheatInput]);
        setHistoryIndex(-1);
        setCheatInput('');
    }, [cheatInput, executeCheat]);

    // 방향키로 히스토리 탐색
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHistoryIndex(prev => {
                const newIdx = Math.min(prev + 1, history.length - 1);
                if (newIdx >= 0 && history.length > 0) {
                    setCheatInput(history[history.length - 1 - newIdx]);
                }
                return newIdx;
            });
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHistoryIndex(prev => {
                const newIdx = Math.max(prev - 1, -1);
                if (newIdx < 0) {
                    setCheatInput('');
                } else {
                    setCheatInput(history[history.length - 1 - newIdx]);
                }
                return newIdx;
            });
        }
    }, [history]);

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
        handleKeyDown,
    };
};

window.useCheatConsole = useCheatConsole;

