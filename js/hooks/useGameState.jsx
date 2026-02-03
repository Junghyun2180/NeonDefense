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

    // 다중 경로 시스템
    const [pathData, setPathData] = useState(() => generateMultiplePaths(Date.now(), 1));

    // 게임 속도 (1x, 2x, 3x)
    const [gameSpeed, setGameSpeed] = useState(1);
    const gameSpeedRef = useRef(1);
    useEffect(() => { gameSpeedRef.current = gameSpeed; }, [gameSpeed]);

    // Refs
    const gameLoopRef = useRef(null);
    const spawnIntervalRef = useRef(null);
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

    // ===== 웨이브 시작 =====
    const startWave = useCallback(() => {
        if (isPlaying) return;
        setIsPlaying(true);
        setSpawnedCount(0);
        setKilledCount(0);
        soundManager.playWaveStart();
        soundManager.playBGM();
    }, [isPlaying]);

    // ===== 메인 게임 루프 =====
    useEffect(() => {
        if (!isPlaying || gameOver) return;
        let localSpawnedCount = 0;
        const totalEnemies = SPAWN.enemiesPerWave(stage, wave);
        const baseSpawnDelay = SPAWN.spawnDelay(stage, wave);

        // 적 스폰 인터벌
        spawnIntervalRef.current = setInterval(() => {
            if (localSpawnedCount >= totalEnemies) return;
            const paths = pathDataRef.current.paths;
            const selectedPath = paths[Math.floor(Math.random() * paths.length)];
            const newEnemy = EnemySystem.create(stage, wave, localSpawnedCount, totalEnemies, selectedPath.tiles, selectedPath.id);
            setEnemies(prev => [...prev, newEnemy]);
            localSpawnedCount++;
            setSpawnedCount(localSpawnedCount);
        }, baseSpawnDelay);

        // 게임 틱 루프
        gameLoopRef.current = setInterval(() => {
            const now = Date.now();
            const speed = gameSpeedRef.current;

            const result = GameEngine.gameTick({
                enemies: enemiesRef.current,
                towers: towersRef.current,
                supportTowers: supportTowersRef.current,
                projectiles: projectilesRef.current,
                gameSpeed: speed,
                permanentBuffs: permanentBuffsRef.current,
            }, now);

            setEnemies(result.enemies);
            setTowers(result.towers);
            setProjectiles(result.projectiles);

            if (result.killedCount > 0) setKilledCount(prev => prev + result.killedCount);
            if (result.goldEarned > 0) {
                // 영구 버프 골드 보너스 적용
                const goldMult = PermanentBuffManager.getGoldMultiplier(permanentBuffsRef.current);
                setGold(prev => prev + Math.floor(result.goldEarned * goldMult));
            }
            if (result.newEffects.length > 0) setEffects(prev => [...prev, ...result.newEffects]);

            if (result.newChainLightnings.length > 0) {
                setChainLightnings(prev => [...prev, ...result.newChainLightnings]);
                const chainIds = result.newChainLightnings.map(c => c.id);
                setTimeout(() => {
                    setChainLightnings(prev => prev.filter(c => !chainIds.includes(c.id)));
                }, COMBAT.chainLightningDisplayTime);
            }

            result.soundEvents.forEach(evt => {
                if (soundManager[evt.method]) soundManager[evt.method](...evt.args);
            });

            if (result.livesLost > 0) {
                setLives(l => {
                    const newLives = l - result.livesLost;
                    if (newLives <= 0) { setGameOver(true); soundManager.playGameOver(); soundManager.stopBGM(); }
                    return Math.max(0, newLives);
                });
            }

            setEffects(prev => GameEngine.cleanExpiredEffects(prev, now));
        }, COMBAT.gameLoopInterval);

        return () => { clearInterval(gameLoopRef.current); clearInterval(spawnIntervalRef.current); };
    }, [isPlaying, gameOver, wave, stage]);

    // ===== 웨이브 클리어 판정 =====
    useEffect(() => {
        const totalEnemies = SPAWN.enemiesPerWave(stage, wave);
        if (spawnedCount < totalEnemies || enemies.length > 0 || !isPlaying || gameOver) return;

        setIsPlaying(false);
        setGold(prev => prev + ECONOMY.waveReward(wave));

        // 웨이브 클리어 시 이자 적용
        const interestRate = PermanentBuffManager.getInterestRate(permanentBuffs);
        if (interestRate > 0) {
            setGold(prev => prev + Math.floor(prev * interestRate));
        }

        if (wave >= SPAWN.wavesPerStage) {
            setShowStageTransition(true);
            // 2초 후 버프 선택 모달 표시
            setTimeout(() => {
                setShowStageTransition(false);
                // 버프 선택지 생성
                const choices = PermanentBuffManager.getRandomBuffChoices(permanentBuffs, 3);
                setBuffChoices(choices);
                setShowBuffSelection(true);
            }, 2000);
        } else {
            setWave(prev => prev + 1);
        }
    }, [spawnedCount, enemies.length, isPlaying, gameOver, wave, stage]);

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
        soundManager.stopBGM();
    }, []);

    // 치트용 clearWave (외부에서 호출)
    const clearWave = useCallback(() => {
        setIsPlaying(false);
        setEnemies([]);
        setProjectiles([]);
        setSpawnedCount(0);
        setKilledCount(0);
        clearInterval(gameLoopRef.current);
        clearInterval(spawnIntervalRef.current);
    }, []);

    const advanceStage = useCallback((targetStage) => {
        clearWave();
        setStage(targetStage);
        setWave(1);
        setPathData(generateMultiplePaths(Date.now(), targetStage));
        setTowers([]);
        setSupportTowers([]);
    }, [clearWave]);

    // 버프 선택 핸들러
    const selectBuff = useCallback((buffId) => {
        setPermanentBuffs(prev => PermanentBuffManager.applyBuff(prev, buffId));
        setShowBuffSelection(false);
        setBuffChoices([]);

        // 다음 스테이지로 진행
        const nextStage = stage + 1;
        setStage(nextStage);
        setWave(1);
        setPathData(generateMultiplePaths(Date.now(), nextStage));
        setTowers([]);
        setSupportTowers([]);
        setGold(prev => prev + ECONOMY.stageClearBonus(stage));

        // 최대 목숨 버프 적용
        const bonusLives = PermanentBuffManager.getBonusMaxLives(permanentBuffs);
        if (bonusLives > 0 && lives < ECONOMY.startLives + bonusLives) {
            setLives(ECONOMY.startLives + bonusLives);
        }
    }, [stage, permanentBuffs, lives]);

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
        // 액션
        startWave,
        resetGame,
        clearWave,
        advanceStage,
    };
};

// 전역 노출
window.useGameState = useGameState;
