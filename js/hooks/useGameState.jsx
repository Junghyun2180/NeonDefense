// useGameState - 게임 핵심 상태 관리 훅
const useGameState = () => {
    const { useState, useEffect, useCallback, useRef } = React;

    // ===== 게임 상태 =====
    const [gold, setGold] = useState(ECONOMY.startGold);
    const [lives, setLives] = useState(ECONOMY.startLives);
    const [stage, setStage] = useState(1);
    const [wave, setWave] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [towers, setTowers] = useState([]);
    const [enemies, setEnemies] = useState([]);
    const [projectiles, setProjectiles] = useState([]);
    const [spawnedCount, setSpawnedCount] = useState(0);
    const [killedCount, setKilledCount] = useState(0);
    const [effects, setEffects] = useState([]);
    const [chainLightnings, setChainLightnings] = useState([]);
    const [showStageTransition, setShowStageTransition] = useState(false);

    // 서포트 타워 상태
    const [supportTowers, setSupportTowers] = useState([]);

    // 영구 버프 시스템
    const [permanentBuffs, setPermanentBuffs] = useState({});
    const [showBuffSelection, setShowBuffSelection] = useState(false);
    const [buffChoices, setBuffChoices] = useState([]);
    const permanentBuffsRef = useRef({});

    // 캐리오버 시스템
    const [showCarryoverSelection, setShowCarryoverSelection] = useState(false);
    const [carryoverCandidates, setCarryoverCandidates] = useState({ towers: [], supports: [] });
    const [selectedCarryover, setSelectedCarryover] = useState({ towers: [], supports: [] });
    const [pendingCarryover, setPendingCarryover] = useState(null);
    // 인벤토리 참조 (App.jsx에서 주입)
    const inventoryRef = useRef([]);
    const supportInventoryRef = useRef([]);

    // 게임 클리어 및 통계
    const [gameCleared, setGameCleared] = useState(false);
    const [gameStats, setGameStats] = useState(() => GameStats.createEmpty());
    const gameStatsRef = useRef(gameStats);
    const livesAtWaveStart = useRef(ECONOMY.startLives);

    // 다중 경로 시스템
    const [pathData, setPathData] = useState(() => generateMultiplePaths(Date.now(), 1));

    // 게임 속도 (1x, 2x, 3x)
    const [gameSpeed, setGameSpeed] = useState(1);
    const gameSpeedRef = useRef(1);
    useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);

    // Refs (최신 값 참조용)
    const enemiesRef = useRef([]);
    const towersRef = useRef([]);
    const projectilesRef = useRef([]);
    const pathDataRef = useRef(pathData);
    const supportTowersRef = useRef([]);

    useEffect(() => { pathDataRef.current = pathData; }, [pathData]);
    useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
    useEffect(() => { towersRef.current = towers; }, [towers]);
    useEffect(() => { projectilesRef.current = projectiles; }, [projectiles]);
    useEffect(() => { supportTowersRef.current = supportTowers; }, [supportTowers]);
    useEffect(() => { permanentBuffsRef.current = permanentBuffs; }, [permanentBuffs]);
    useEffect(() => { gameStatsRef.current = gameStats; }, [gameStats]);

    // ===== 게임 루프 (분리된 훅) =====
    const { clearIntervals } = useGameLoop({
        isPlaying,
        gameOver,
        stage,
        wave,
        gold,
        lives,
        enemiesRef,
        towersRef,
        supportTowersRef,
        projectilesRef,
        pathDataRef,
        gameSpeedRef,
        permanentBuffsRef,
        gameStatsRef,
        setEnemies,
        setTowers,
        setProjectiles,
        setEffects,
        setChainLightnings,
        setGold,
        setLives,
        setGameOver,
        setSpawnedCount,
        setKilledCount,
        setGameStats,
    });

    // ===== 밸런스 로그 진행도 추적 =====
    useEffect(() => {
        if (typeof BalanceLogger !== 'undefined') {
            BalanceLogger.updateProgress(stage, wave);
        }
    }, [stage, wave]);

    // ===== 웨이브 시작 =====
    const startWave = useCallback(() => {
        if (isPlaying) return;
        setIsPlaying(true);
        setSpawnedCount(0);
        setKilledCount(0);
        livesAtWaveStart.current = lives;
        soundManager.playWaveStart();
        soundManager.playBGM();
    }, [isPlaying, lives]);

    // ===== 웨이브 클리어 판정 =====
    useEffect(() => {
        const totalEnemies = SPAWN.enemiesPerWave(stage, wave);
        if (spawnedCount < totalEnemies || enemies.length > 0 || !isPlaying || gameOver) return;

        setIsPlaying(false);

        // 통계: 웨이브 클리어
        const livesLostThisWave = livesAtWaveStart.current - lives;
        setGameStats(prev => ({
            ...prev,
            wavesCleared: prev.wavesCleared + 1,
            perfectWaves: livesLostThisWave === 0 ? prev.perfectWaves + 1 : prev.perfectWaves,
            closeCallWaves: lives === 1 ? prev.closeCallWaves + 1 : prev.closeCallWaves,
        }));

        // 웨이브 보상
        const waveReward = ECONOMY.waveReward(wave);
        setGold(prev => prev + waveReward);
        setGameStats(prev => ({
            ...prev,
            totalGoldEarned: prev.totalGoldEarned + waveReward,
            goldFromWaves: prev.goldFromWaves + waveReward,
        }));

        // 웨이브 클리어 시 이자 적용
        const interestRate = PermanentBuffManager.getInterestRate(permanentBuffs);
        if (interestRate > 0) {
            setGold(prev => {
                const interest = Math.floor(prev * interestRate);
                // 통계: 이자 수익
                setGameStats(ps => ({
                    ...ps,
                    totalGoldEarned: ps.totalGoldEarned + interest,
                    goldFromInterest: ps.goldFromInterest + interest,
                }));
                return prev + interest;
            });
        }

        if (wave >= SPAWN.wavesPerStage) {
            // 통계: 스테이지 클리어
            setGameStats(prev => ({ ...prev, stagesCleared: prev.stagesCleared + 1 }));

            // 최종 스테이지 클리어 체크 (10스테이지)
            if (stage >= SPAWN.maxStage) {
                // 게임 클리어!
                setGameStats(prev => GameStats.finalize(prev));
                setGameCleared(true);
                soundManager.stopBGM();
                // 승리 사운드 (없으면 웨이브 시작 사운드로 대체)
                soundManager.playWaveStart();

                // 밸런스 로그 기록 (클리어)
                if (typeof BalanceLogger !== 'undefined') {
                    BalanceLogger.logGameEnd('clear', {
                        towers,
                        supportTowers,
                        gold,
                        lives,
                        stage,
                        wave: SPAWN.wavesPerStage,
                        gameStats: gameStatsRef.current,
                        permanentBuffs,
                    });
                }

                return;
            }

            setShowStageTransition(true);
            // 2초 후 캐리오버 또는 버프 선택 모달 표시
            setTimeout(() => {
                setShowStageTransition(false);

                // 캐리오버 후보 생성
                const candidates = generateCarryoverCandidates(
                    towersRef.current,
                    supportTowersRef.current,
                    inventoryRef.current,
                    supportInventoryRef.current
                );

                // 후보가 있으면 캐리오버 선택, 없으면 바로 버프 선택
                if (candidates.towers.length > 0 || candidates.supports.length > 0) {
                    setCarryoverCandidates(candidates);
                    setSelectedCarryover({ towers: [], supports: [] });
                    setShowCarryoverSelection(true);
                } else {
                    // 후보 없음 - 모든 타워 환급 후 버프 선택으로
                    const refund = calculateCarryoverRefund(
                        towersRef.current,
                        supportTowersRef.current,
                        inventoryRef.current,
                        supportInventoryRef.current,
                        { towers: [], supports: [] }
                    );
                    if (refund > 0) {
                        setGold(prev => prev + refund);
                        setGameStats(prev => ({
                            ...prev,
                            totalGoldEarned: prev.totalGoldEarned + refund,
                        }));
                    }
                    const choices = PermanentBuffManager.getRandomBuffChoices(permanentBuffs, 3);
                    setBuffChoices(choices);
                    setShowBuffSelection(true);
                }
            }, 2000);
        } else {
            setWave(prev => prev + 1);
        }
    }, [spawnedCount, enemies.length, isPlaying, gameOver, wave, stage, lives]);

    // ===== 리셋 =====
    const resetGame = useCallback(() => {
        setGold(ECONOMY.startGold);
        setLives(ECONOMY.startLives);
        setStage(1);
        setWave(1);
        setIsPlaying(false);
        setGameOver(false);
        setTowers([]);
        setEnemies([]);
        setProjectiles([]);
        setSupportTowers([]);
        setSpawnedCount(0);
        setKilledCount(0);
        setPathData(generateMultiplePaths(Date.now(), 1));
        setShowStageTransition(false);
        setChainLightnings([]);
        setGameSpeed(1);
        // 영구 버프 초기화
        setPermanentBuffs({});
        setShowBuffSelection(false);
        setBuffChoices([]);
        // 캐리오버 초기화
        setShowCarryoverSelection(false);
        setCarryoverCandidates({ towers: [], supports: [] });
        setSelectedCarryover({ towers: [], supports: [] });
        setPendingCarryover(null);
        // 게임 클리어 및 통계 초기화
        setGameCleared(false);
        setGameStats(GameStats.createEmpty());
        soundManager.stopBGM();
    }, []);

    // 치트용 clearWave (외부에서 호출)
    const clearWave = useCallback(() => {
        setIsPlaying(false);
        setEnemies([]);
        setProjectiles([]);
        setSpawnedCount(0);
        setKilledCount(0);
        clearIntervals();
    }, [clearIntervals]);

    const advanceStage = useCallback((targetStage) => {
        clearWave();
        setStage(targetStage);
        setWave(1);
        setPathData(generateMultiplePaths(Date.now(), targetStage));
        setTowers([]);
        setSupportTowers([]);
    }, [clearWave]);

    // ===== 캐리오버 핸들러 =====

    // 인벤토리 참조 업데이트 함수 (App.jsx에서 호출)
    const updateInventoryRefs = useCallback((inventory, supportInventory) => {
        inventoryRef.current = inventory;
        supportInventoryRef.current = supportInventory;
    }, []);

    // 캐리오버 타워 토글
    const toggleCarryoverTower = useCallback((towerId) => {
        setSelectedCarryover(prev => {
            const isSelected = prev.towers.includes(towerId);
            if (isSelected) {
                return { ...prev, towers: prev.towers.filter(id => id !== towerId) };
            } else if (prev.towers.length < CARRYOVER.maxTowers) {
                return { ...prev, towers: [...prev.towers, towerId] };
            }
            return prev;
        });
    }, []);

    // 캐리오버 서포트 토글
    const toggleCarryoverSupport = useCallback((supportId) => {
        setSelectedCarryover(prev => {
            const isSelected = prev.supports.includes(supportId);
            if (isSelected) {
                return { ...prev, supports: prev.supports.filter(id => id !== supportId) };
            } else if (prev.supports.length < CARRYOVER.maxSupports) {
                return { ...prev, supports: [...prev.supports, supportId] };
            }
            return prev;
        });
    }, []);

    // 캐리오버 확정
    const confirmCarryover = useCallback(() => {
        // 선택된 타워들 준비 (위치 정보 제거)
        const carriedTowers = carryoverCandidates.towers
            .filter(t => selectedCarryover.towers.includes(t.id))
            .map(prepareCarryoverTower);

        const carriedSupports = carryoverCandidates.supports
            .filter(s => selectedCarryover.supports.includes(s.id))
            .map(prepareCarryoverTower);

        // 미선택 타워 환급 계산
        const refund = calculateCarryoverRefund(
            towersRef.current,
            supportTowersRef.current,
            inventoryRef.current,
            supportInventoryRef.current,
            selectedCarryover
        );

        // 환급 적용
        if (refund > 0) {
            setGold(prev => prev + refund);
            setGameStats(prev => ({
                ...prev,
                totalGoldEarned: prev.totalGoldEarned + refund,
            }));
        }

        // 캐리오버 타워 저장 (버프 선택 후 인벤토리에 추가)
        setPendingCarryover({
            towers: carriedTowers,
            supports: carriedSupports,
        });

        // 캐리오버 모달 닫고 버프 선택으로
        setShowCarryoverSelection(false);
        const choices = PermanentBuffManager.getRandomBuffChoices(permanentBuffs, 3);
        setBuffChoices(choices);
        setShowBuffSelection(true);
    }, [carryoverCandidates, selectedCarryover, permanentBuffs]);

    // 버프 선택 핸들러
    const selectBuff = useCallback((buffId) => {
        setPermanentBuffs(prev => PermanentBuffManager.applyBuff(prev, buffId));
        setShowBuffSelection(false);
        setBuffChoices([]);

        // 통계: 버프 선택 기록
        setGameStats(prev => ({
            ...prev,
            buffsSelected: [...prev.buffsSelected, buffId],
        }));

        // 다음 스테이지로 진행
        const nextStage = stage + 1;
        setStage(nextStage);
        setWave(1);
        setPathData(generateMultiplePaths(Date.now(), nextStage));
        setTowers([]);
        setSupportTowers([]);

        // 스테이지 클리어 보너스
        const stageBonus = ECONOMY.stageClearBonus(stage);
        setGold(prev => prev + stageBonus);
        setGameStats(prev => ({
            ...prev,
            totalGoldEarned: prev.totalGoldEarned + stageBonus,
            goldFromStages: prev.goldFromStages + stageBonus,
        }));

        // 최대 목숨 버프 적용
        const bonusLives = PermanentBuffManager.getBonusMaxLives(permanentBuffs);
        if (bonusLives > 0 && lives < ECONOMY.startLives + bonusLives) {
            setLives(ECONOMY.startLives + bonusLives);
        }

        // 캐리오버 타워 반환 (App.jsx에서 인벤토리에 추가)
        const carryover = pendingCarryover;
        setPendingCarryover(null);
        return carryover;
    }, [stage, permanentBuffs, lives, pendingCarryover]);

    return {
        // 상태
        gold, setGold,
        lives, setLives,
        stage, setStage,
        wave, setWave,
        isPlaying,
        gameOver,
        towers, setTowers,
        enemies, setEnemies,
        projectiles, setProjectiles,
        supportTowers, setSupportTowers,
        spawnedCount,
        killedCount,
        effects, setEffects,
        chainLightnings,
        showStageTransition,
        pathData,
        gameSpeed, setGameSpeed,
        // 영구 버프
        permanentBuffs,
        showBuffSelection,
        buffChoices,
        selectBuff,
        // 캐리오버 시스템
        showCarryoverSelection,
        carryoverCandidates,
        selectedCarryover,
        toggleCarryoverTower,
        toggleCarryoverSupport,
        confirmCarryover,
        updateInventoryRefs,
        // 게임 클리어 및 통계
        gameCleared,
        gameStats, setGameStats,
        // 액션
        startWave,
        resetGame,
        clearWave,
        advanceStage,
    };
};

// 전역 노출
window.useGameState = useGameState;
