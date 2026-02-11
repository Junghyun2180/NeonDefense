// useGameState - 게임 핵심 상태 관리 훅
// configOverride: 런 모드에서 SPAWN/ECONOMY/CARRYOVER를 주입. null이면 캠페인 기본값 사용.
const useGameState = (configOverride = null) => {
    const { useState, useEffect, useCallback, useRef, useMemo } = React;

    // ===== 설정 해석 (런 모드 / 캠페인 모드) =====
    const cfg = useMemo(() => ({
        SPAWN: configOverride?.SPAWN || SPAWN,
        ECONOMY: configOverride?.ECONOMY || ECONOMY,
        CARRYOVER: configOverride?.CARRYOVER || CARRYOVER,
        modeAbility: configOverride?.modeAbility || null,
        mapType: configOverride?.mapType || 'standard',
    }), [configOverride]);
    const cfgRef = useRef(cfg);
    useEffect(() => { cfgRef.current = cfg; }, [cfg]);

    // ===== 게임 상태 =====
    const [gold, setGold] = useState(cfg.ECONOMY.startGold);
    const [lives, setLives] = useState(cfg.ECONOMY.startLives);
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
    const livesAtWaveStart = useRef(cfg.ECONOMY.startLives);

    // 보스 페이즈 상태
    const [isBossPhase, setIsBossPhase] = useState(false);
    const [waveTimer, setWaveTimer] = useState(0); // 남은 웨이브 시간 (ms)
    const waveTimerIntervalRef = useRef(null);

    // 다중 경로 시스템 (ㅁ 맵 지원)
    const [pathData, setPathData] = useState(() => {
        if (cfg.mapType === 'square') {
            return generateSquarePath(Date.now(), 1);
        }
        return generateMultiplePaths(Date.now(), 1);
    });

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

    // ===== 자동 웨이브 전환 콜백 =====
    const handleWaveAutoAdvance = useCallback(() => {
        const activeCfg = cfgRef.current;
        // 웨이브 클리어 보상 (자동 전환 시에도 지급)
        const waveReward = activeCfg.ECONOMY.waveReward(wave);
        setGold(prev => prev + waveReward);
        setGameStats(prev => ({
            ...prev,
            wavesCleared: prev.wavesCleared + 1,
            totalGoldEarned: prev.totalGoldEarned + waveReward,
            goldFromWaves: prev.goldFromWaves + waveReward,
        }));

        if (wave >= activeCfg.SPAWN.wavesPerStage) {
            // 스테이지 끝 → 보스 페이즈
            setGameStats(prev => ({ ...prev, stagesCleared: prev.stagesCleared + 1 }));

            if (stage >= activeCfg.SPAWN.maxStage) {
                setGameStats(prev => GameStats.finalize(prev));
                setGameCleared(true);
                soundManager.stopBGM();
                soundManager.playWaveStart();
                return;
            }

            // 보스 페이즈 시작
            setIsBossPhase(true);
            // 보스 스폰 (1마리)
            const paths = pathDataRef.current.paths;
            const selectedPath = paths[0];
            const bossEnemy = EnemySystem.create(stage, wave + 1, 0, 1, selectedPath.tiles, selectedPath.id);
            if (bossEnemy) {
                bossEnemy.type = 'boss';
                bossEnemy.isLooping = true;
                bossEnemy.loopCount = 0;
                // 보스 체력 재설정
                const bossHealth = Math.floor(EnemySystem.calcBaseHealth(stage, wave) * HEALTH_SCALING.bossFormula(stage));
                bossEnemy.health = bossHealth;
                bossEnemy.maxHealth = bossHealth;
                setEnemies(prev => [...prev, bossEnemy]);
            }
            return;
        }

        // 다음 웨이브로 (적을 제거하지 않고 누적)
        setWave(prev => prev + 1);
        setSpawnedCount(0);
    }, [wave, stage]);

    // ===== 게임 루프 (분리된 훅) =====
    const { clearIntervals } = useGameLoop({
        isPlaying,
        gameOver,
        stage,
        wave,
        gold,
        lives,
        spawnConfig: cfg.SPAWN,
        modeAbility: cfg.modeAbility,
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
        onWaveAutoAdvance: handleWaveAutoAdvance,
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
        const activeCfg = cfgRef.current;
        const isAutoWaveMode = activeCfg.modeAbility === 'run';

        // 자동 웨이브 모드에서는 타이머가 웨이브를 전환하므로 기존 클리어 판정 스킵
        // 대신 보스 페이즈 종료 감지만 처리
        if (isAutoWaveMode) {
            // 보스 페이즈에서 보스가 죽으면 다음 스테이지로
            if (isBossPhase && enemies.length === 0 && isPlaying) {
                setIsBossPhase(false);
                setIsPlaying(false);

                // 보스 킬 통계
                setGameStats(prev => ({ ...prev, bossKills: prev.bossKills + 1 }));

                setShowStageTransition(true);
                setTimeout(() => {
                    setShowStageTransition(false);

                    // 캐리오버 후보 생성
                    const candidates = generateCarryoverCandidates(
                        towersRef.current,
                        supportTowersRef.current,
                        inventoryRef.current,
                        supportInventoryRef.current
                    );

                    if (candidates.towers.length > 0 || candidates.supports.length > 0) {
                        setCarryoverCandidates(candidates);
                        setSelectedCarryover({ towers: [], supports: [] });
                        setShowCarryoverSelection(true);
                    } else {
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
            }
            return;
        }

        // ===== 기존 방식: 적 전멸 시 클리어 (캠페인 + 보스 러시) =====
        const totalEnemies = activeCfg.SPAWN.enemiesPerWave(stage, wave);
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

        // 보스 러시: 보스 처치 시 무료 뽑기 보상
        if (activeCfg.modeAbility === 'bossRush') {
            setGameStats(prev => ({ ...prev, bossKills: (prev.bossKills || 0) + 1 }));
            // 무료 뽑기 보상은 App.jsx에서 확인하여 처리
        }

        // 웨이브 보상
        const waveReward = activeCfg.ECONOMY.waveReward(wave);
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
                setGameStats(ps => ({
                    ...ps,
                    totalGoldEarned: ps.totalGoldEarned + interest,
                    goldFromInterest: ps.goldFromInterest + interest,
                }));
                return prev + interest;
            });
        }

        if (wave >= activeCfg.SPAWN.wavesPerStage) {
            // 통계: 스테이지 클리어
            setGameStats(prev => ({ ...prev, stagesCleared: prev.stagesCleared + 1 }));

            // 최종 스테이지 클리어 체크
            if (stage >= activeCfg.SPAWN.maxStage) {
                setGameStats(prev => GameStats.finalize(prev));
                setGameCleared(true);
                soundManager.stopBGM();
                soundManager.playWaveStart();

                if (typeof BalanceLogger !== 'undefined') {
                    BalanceLogger.logGameEnd('clear', {
                        towers,
                        supportTowers,
                        gold,
                        lives,
                        stage,
                        wave: activeCfg.SPAWN.wavesPerStage,
                        gameStats: gameStatsRef.current,
                        permanentBuffs,
                    });
                }
                return;
            }

            setShowStageTransition(true);
            setTimeout(() => {
                setShowStageTransition(false);

                const candidates = generateCarryoverCandidates(
                    towersRef.current,
                    supportTowersRef.current,
                    inventoryRef.current,
                    supportInventoryRef.current
                );

                if (candidates.towers.length > 0 || candidates.supports.length > 0) {
                    setCarryoverCandidates(candidates);
                    setSelectedCarryover({ towers: [], supports: [] });
                    setShowCarryoverSelection(true);
                } else {
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
    }, [spawnedCount, enemies.length, isPlaying, gameOver, wave, stage, lives, isBossPhase]);

    // ===== 리셋 =====
    const resetGame = useCallback(() => {
        const activeCfg = cfgRef.current;
        setGold(activeCfg.ECONOMY.startGold);
        setLives(activeCfg.ECONOMY.startLives);
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
        // ㅁ 맵 지원
        if (activeCfg.mapType === 'square') {
            setPathData(generateSquarePath(Date.now(), 1));
        } else {
            setPathData(generateMultiplePaths(Date.now(), 1));
        }
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
        // 보스 페이즈 초기화
        setIsBossPhase(false);
        setWaveTimer(0);
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
        const activeCfg = cfgRef.current;
        clearWave();
        setStage(targetStage);
        setWave(1);
        setIsBossPhase(false);
        if (activeCfg.mapType === 'square') {
            setPathData(generateSquarePath(Date.now(), targetStage));
        } else {
            setPathData(generateMultiplePaths(Date.now(), targetStage));
        }
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
            const activeCfg = cfgRef.current;
            const isSelected = prev.towers.includes(towerId);
            if (isSelected) {
                return { ...prev, towers: prev.towers.filter(id => id !== towerId) };
            } else if (prev.towers.length < activeCfg.CARRYOVER.maxTowers) {
                return { ...prev, towers: [...prev.towers, towerId] };
            }
            return prev;
        });
    }, []);

    // 캐리오버 서포트 토글
    const toggleCarryoverSupport = useCallback((supportId) => {
        setSelectedCarryover(prev => {
            const activeCfg = cfgRef.current;
            const isSelected = prev.supports.includes(supportId);
            if (isSelected) {
                return { ...prev, supports: prev.supports.filter(id => id !== supportId) };
            } else if (prev.supports.length < activeCfg.CARRYOVER.maxSupports) {
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
        const activeCfg = cfgRef.current;
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
        setIsBossPhase(false);
        const activeCfgLocal = cfgRef.current;
        if (activeCfgLocal.mapType === 'square') {
            setPathData(generateSquarePath(Date.now(), nextStage));
        } else {
            setPathData(generateMultiplePaths(Date.now(), nextStage));
        }
        setTowers([]);
        setSupportTowers([]);

        // 스테이지 클리어 보너스
        const stageBonus = activeCfg.ECONOMY.stageClearBonus(stage);
        setGold(prev => prev + stageBonus);
        setGameStats(prev => ({
            ...prev,
            totalGoldEarned: prev.totalGoldEarned + stageBonus,
            goldFromStages: prev.goldFromStages + stageBonus,
        }));

        // 최대 목숨 버프 적용
        const bonusLives = PermanentBuffManager.getBonusMaxLives(permanentBuffs);
        if (bonusLives > 0 && lives < activeCfg.ECONOMY.startLives + bonusLives) {
            setLives(activeCfg.ECONOMY.startLives + bonusLives);
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
        pathData, setPathData,
        gameSpeed, setGameSpeed,
        // 설정 (런 모드에서 참조용)
        activeConfig: cfg,
        // 보스 페이즈
        isBossPhase,
        waveTimer,
        // 영구 버프
        permanentBuffs, setPermanentBuffs,
        showBuffSelection,
        buffChoices, setBuffChoices,
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
