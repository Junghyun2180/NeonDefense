// useGameLoop - 게임 루프 및 적 스폰 관리 훅
// useGameState에서 분리: 게임 틱 처리에만 집중
// ㅁ맵 순환, 타이머 기반 자동 웨이브, 적 수 패배 조건 지원

const useGameLoop = (config) => {
    const { useEffect, useRef } = React;

    const {
        // 상태
        isPlaying,
        gameOver,
        stage,
        wave,
        gold,
        lives,
        // 설정 (런 모드에서 주입, null이면 캠페인 기본값)
        spawnConfig,
        // 모드 어빌리티 (런 모드에서 주입)
        modeAbility,
        // Refs (최신 값 참조용)
        enemiesRef,
        towersRef,
        supportTowersRef,
        projectilesRef,
        pathDataRef,
        gameSpeedRef,
        permanentBuffsRef,
        gameStatsRef,
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
        // 자동 웨이브용
        onWaveAutoAdvance,
    } = config;

    const gameLoopRef = useRef(null);
    const spawnIntervalRef = useRef(null);
    const waveTimerRef = useRef(null);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        let localSpawnedCount = 0;
        const activeSPAWN = spawnConfig || SPAWN;
        const totalEnemies = activeSPAWN.enemiesPerWave(stage, wave);
        const baseSpawnDelay = activeSPAWN.spawnDelay(stage, wave);
        const ability = modeAbility ? ModeAbilityHelper.getAbility(modeAbility) : null;
        const isLooping = ability ? ability.loopingPath : false;

        // 적 스폰 인터벌
        spawnIntervalRef.current = setInterval(() => {
            if (localSpawnedCount >= totalEnemies) return;
            const paths = pathDataRef.current.paths;
            const selectedPath = paths[Math.floor(Math.random() * paths.length)];
            const newEnemy = EnemySystem.create(stage, wave, localSpawnedCount, totalEnemies, selectedPath.tiles, selectedPath.id);
            if (newEnemy) {
                // 순환 경로인 경우 표시
                if (isLooping) {
                    newEnemy.isLooping = true;
                    newEnemy.loopCount = 0;
                }
                newEnemy.spawnWave = wave; // 웨이브 태그 (조기 클리어 감지용)
                setEnemies(prev => [...prev, newEnemy]);
            }
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

            // ===== 순환 경로 처리: 끝에 도달한 적을 다시 처음으로 =====
            if (isLooping) {
                result.enemies = result.enemies.map(enemy => {
                    if (enemy.pathIndex >= enemy.pathTiles.length - 1 && enemy.isLooping) {
                        return {
                            ...enemy,
                            pathIndex: 0,
                            loopCount: (enemy.loopCount || 0) + 1,
                            x: enemy.pathTiles[0].x * TILE_SIZE + TILE_SIZE / 2,
                            y: enemy.pathTiles[0].y * TILE_SIZE + TILE_SIZE / 2,
                        };
                    }
                    return enemy;
                });
                // 순환 모드에서는 lives 감소 대신 적이 계속 순환
                result.livesLost = 0;
            }

            setEnemies(result.enemies);
            setTowers(result.towers);
            setProjectiles(result.projectiles);

            // 킬 카운트 및 통계
            if (result.killedCount > 0) {
                setKilledCount(prev => prev + result.killedCount);
                setGameStats(prev => ({ ...prev, totalKills: prev.totalKills + result.killedCount }));
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

            // ===== 적 수 패배 조건 체크 (런 모드 ㅁ 맵) =====
            if (ability && ability.defeatCondition === 'enemyCount') {
                const currentEnemyCount = result.enemies.length;
                if (currentEnemyCount >= ability.defeatThreshold) {
                    setGameOver(true);
                    soundManager.playGameOver();
                    soundManager.stopBGM();

                    if (typeof BalanceLogger !== 'undefined') {
                        BalanceLogger.logGameEnd('gameover_overflow', {
                            towers: towersRef.current,
                            supportTowers: supportTowersRef.current,
                            gold: gold,
                            lives: lives,
                            stage: stage,
                            wave: wave,
                            enemyCount: currentEnemyCount,
                            gameStats: gameStatsRef.current,
                            permanentBuffs: permanentBuffsRef.current,
                        });
                    }
                    return; // 게임오버 후 더이상 처리 안함
                }
            }

            // 목숨 손실 (기존 lives 방식 - 캠페인 + 보스 러시)
            if (!isLooping && result.livesLost > 0) {
                setGameStats(prev => ({ ...prev, livesLost: prev.livesLost + result.livesLost }));
                setLives(l => {
                    const newLives = l - result.livesLost;
                    if (newLives <= 0) {
                        setGameOver(true);
                        soundManager.playGameOver();
                        soundManager.stopBGM();

                        if (typeof BalanceLogger !== 'undefined') {
                            BalanceLogger.logGameEnd('gameover', {
                                towers: towersRef.current,
                                supportTowers: supportTowersRef.current,
                                gold: gold,
                                lives: 0,
                                stage: stage,
                                wave: wave,
                                gameStats: gameStatsRef.current,
                                permanentBuffs: permanentBuffsRef.current,
                            });
                        }
                    }
                    return Math.max(0, newLives);
                });
            }

            // 만료된 이펙트 정리
            setEffects(prev => GameEngine.cleanExpiredEffects(prev, now));
        }, COMBAT.gameLoopInterval);

        // ===== 자동 웨이브 타이머 (런 모드 전용) =====
        if (ability && ability.waveAutoStart && activeSPAWN.waveDurationMs) {
            waveTimerRef.current = setTimeout(() => {
                // 웨이브 시간 종료 → 자동으로 다음 웨이브
                if (onWaveAutoAdvance) {
                    onWaveAutoAdvance();
                }
            }, activeSPAWN.waveDurationMs);
        }

        // Cleanup
        return () => {
            clearInterval(gameLoopRef.current);
            clearInterval(spawnIntervalRef.current);
            if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
        };
    }, [isPlaying, gameOver, wave, stage]);

    // 외부에서 인터벌 정리 필요 시 사용
    const clearIntervals = () => {
        clearInterval(gameLoopRef.current);
        clearInterval(spawnIntervalRef.current);
        if (waveTimerRef.current) clearTimeout(waveTimerRef.current);
    };

    return { clearIntervals };
};

window.useGameLoop = useGameLoop;
