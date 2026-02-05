// useGameLoop - 게임 루프 및 적 스폰 관리 훅
// useGameState에서 분리: 게임 틱 처리에만 집중

const useGameLoop = (config) => {
    const { useEffect, useRef } = React;

    const {
        // 상태
        isPlaying,
        gameOver,
        stage,
        wave,
        // Refs (최신 값 참조용)
        enemiesRef,
        towersRef,
        supportTowersRef,
        projectilesRef,
        pathDataRef,
        gameSpeedRef,
        permanentBuffsRef,
        // Setters
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
    } = config;

    const gameLoopRef = useRef(null);
    const spawnIntervalRef = useRef(null);

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

            // 킬 카운트 및 통계
            if (result.killedCount > 0) {
                setKilledCount(prev => prev + result.killedCount);

                // 적 타입별 킬 통계 추적
                if (result.killedEnemies && result.killedEnemies.length > 0) {
                    setGameStats(prev => {
                        let updated = { ...prev, totalKills: prev.totalKills + result.killedCount };
                        result.killedEnemies.forEach(enemy => {
                            switch (enemy.type) {
                                case 'boss':
                                    updated.bossKills = (updated.bossKills || 0) + 1;
                                    break;
                                case 'elite':
                                    updated.eliteKills = (updated.eliteKills || 0) + 1;
                                    break;
                                case 'healer':
                                    updated.healerKills = (updated.healerKills || 0) + 1;
                                    break;
                                case 'splitter':
                                    updated.splitterKills = (updated.splitterKills || 0) + 1;
                                    break;
                            }
                        });
                        return updated;
                    });
                } else {
                    // fallback (킬 정보가 없으면 totalKills만 증가)
                    setGameStats(prev => ({ ...prev, totalKills: prev.totalKills + result.killedCount }));
                }
            }

            // 골드 획득 (영구 버프 적용)
            if (result.goldEarned > 0) {
                const goldMult = BuffHelper.getGoldMultiplier(permanentBuffsRef.current);
                const earnedGold = Math.floor(result.goldEarned * goldMult);
                setGold(prev => prev + earnedGold);
                setGameStats(prev => ({
                    ...prev,
                    totalGoldEarned: prev.totalGoldEarned + earnedGold,
                    goldFromKills: prev.goldFromKills + earnedGold,
                }));
            }

            // 이펙트
            if (result.newEffects.length > 0) {
                setEffects(prev => [...prev, ...result.newEffects]);
            }

            // 체인 라이트닝
            if (result.newChainLightnings.length > 0) {
                setChainLightnings(prev => [...prev, ...result.newChainLightnings]);
                const chainIds = result.newChainLightnings.map(c => c.id);
                setTimeout(() => {
                    setChainLightnings(prev => prev.filter(c => !chainIds.includes(c.id)));
                }, COMBAT.chainLightningDisplayTime);
            }

            // 사운드 이벤트
            result.soundEvents.forEach(evt => {
                if (soundManager[evt.method]) soundManager[evt.method](...evt.args);
            });

            // 목숨 손실
            if (result.livesLost > 0) {
                setGameStats(prev => ({ ...prev, livesLost: prev.livesLost + result.livesLost }));
                setLives(l => {
                    const newLives = l - result.livesLost;
                    if (newLives <= 0) {
                        setGameOver(true);
                        soundManager.playGameOver();
                        soundManager.stopBGM();
                    }
                    return Math.max(0, newLives);
                });
            }

            // 만료된 이펙트 정리
            setEffects(prev => GameEngine.cleanExpiredEffects(prev, now));
        }, COMBAT.gameLoopInterval);

        // Cleanup
        return () => {
            clearInterval(gameLoopRef.current);
            clearInterval(spawnIntervalRef.current);
        };
    }, [isPlaying, gameOver, wave, stage]);

    // 외부에서 인터벌 정리 필요 시 사용
    const clearIntervals = () => {
        clearInterval(gameLoopRef.current);
        clearInterval(spawnIntervalRef.current);
    };

    return { clearIntervals };
};

window.useGameLoop = useGameLoop;
