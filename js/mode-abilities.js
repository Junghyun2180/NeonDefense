// Neon Defense - 모드 어빌리티 시스템
// 모드별 스폰 규칙, 스케일링, 패배 조건을 어빌리티로 추상화

const MODE_ABILITIES = {
    // ===== 런 모드 어빌리티 =====
    run: {
        id: 'run',
        name: '런 모드',
        icon: '🎮',
        mapType: 'square',             // ㅁ형 순환 맵
        defeatCondition: 'enemyCount', // 맵 위 적 수 기반 패배
        defeatThreshold: 70,           // 70마리 이상이면 패배
        waveAutoStart: true,           // 타이머 기반 자동 웨이브
        waveDurationMs: 60000,         // 웨이브 간격: 1분
        bossPhaseDurationMs: 60000,    // 보스 페이즈 제한시간: 1분
        loopingPath: true,             // 적이 경로 끝에 도달하면 다시 순환

        // 스폰 규칙 (우선순위 순)
        spawnRules: [
            // Stage 1: 기본 적 + 약간의 Fast
            { type: 'elite', condition: (idx, total, wave, stage) => stage >= 2 && wave >= 3 && idx % 8 === 0, chance: 1.0 },
            { type: 'healer', condition: (idx, total, wave, stage) => stage >= 3 && wave >= 2, chanceBase: 0.08, chancePerStage: 0.02 },
            { type: 'jammer', condition: (idx, total, wave, stage) => stage >= 3, chanceBase: 0.05, chancePerStage: 0.02 },
            { type: 'suppressor', condition: (idx, total, wave, stage) => stage >= 4, chanceBase: 0.05, chancePerStage: 0.02 },
            { type: 'splitter', condition: (idx, total, wave, stage) => stage >= 3, chanceBase: 0.06, chancePerStage: 0.02 },
            { type: 'fast', condition: () => true, chanceBase: 0.35 },
            { type: 'normal', condition: () => true, chance: 1.0 },
        ],

        // 체력 스케일링
        healthScaling: {
            base: 30,
            stageGrowth: 0.5,
            waveGrowth: 0.3,
            lateWaveThreshold: 4,
            lateWaveBonus: 1.4,
            bossFormula: (stage) => 15 + stage * 3,
        },
    },

    // ===== 보스 러시 어빌리티 =====
    bossRush: {
        id: 'bossRush',
        name: '보스 러시',
        icon: '🏆',
        mapType: 'square',             // ㅁ형 순환 맵
        defeatCondition: 'lives',      // 전통적 lives 시스템
        defeatThreshold: null,
        waveAutoStart: false,          // 수동 웨이브 시작
        loopingPath: true,             // 보스도 순환

        // 스폰 규칙: 보스만 출현
        spawnRules: [
            { type: 'boss', condition: () => true, chance: 1.0 },
        ],

        // 보스 체력 스케일링 (웨이브마다 강해짐)
        healthScaling: {
            base: 60,
            stageGrowth: 0.0,             // 스테이지 개념 없음
            waveGrowth: 0.8,              // 웨이브(=보스 차수)마다 크게 증가
            lateWaveThreshold: 99,
            lateWaveBonus: 1.0,
            bossFormula: (stage) => 20 + stage * 5,
        },

        // 보스 러시 전용: 보스 처치 보상
        bossKillReward: 'towerDraw',   // 보스 킬 시 타워 뽑기 보상
        bossKillDrawCount: 1,          // 뽑기 횟수

        // 효율 스코어링
        scoring: {
            baseScore: (bossesKilled) => bossesKilled * 100,
            timeBonus: (totalTimeMs, bossesKilled) => {
                if (bossesKilled === 0) return 0;
                const avgTimePerBoss = totalTimeMs / bossesKilled / 1000;
                if (avgTimePerBoss <= 30) return 50;
                if (avgTimePerBoss <= 60) return 30;
                if (avgTimePerBoss <= 90) return 10;
                return 0;
            },
            resourceEfficiency: (goldSpent, bossesKilled) => {
                if (bossesKilled === 0) return 0;
                return Math.floor(bossesKilled * 500 / Math.max(1, goldSpent) * 100);
            },
        },
    },
};

// ===== 모드 어빌리티 헬퍼 =====
const ModeAbilityHelper = {
    // 모드의 어빌리티 가져오기
    getAbility(modeId) {
        return MODE_ABILITIES[modeId] || null;
    },

    // 모드의 스폰 규칙 가져오기 (없으면 캠페인 기본 SPAWN_RULES 반환)
    getSpawnRules(modeId) {
        const ability = this.getAbility(modeId);
        return ability ? ability.spawnRules : SPAWN_RULES;
    },

    // 모드의 체력 스케일링 가져오기
    getHealthScaling(modeId) {
        const ability = this.getAbility(modeId);
        return ability ? ability.healthScaling : HEALTH_SCALING;
    },

    // 순환 경로 여부
    isLoopingPath(modeId) {
        const ability = this.getAbility(modeId);
        return ability ? ability.loopingPath : false;
    },

    // 패배 조건 체크
    checkDefeat(modeId, state) {
        const ability = this.getAbility(modeId);
        if (!ability) return false;

        if (ability.defeatCondition === 'enemyCount') {
            return state.enemyCount >= ability.defeatThreshold;
        }
        if (ability.defeatCondition === 'lives') {
            return state.lives <= 0;
        }
        return false;
    },

    // ㅁ형 맵 사용 여부
    usesSquareMap(modeId) {
        const ability = this.getAbility(modeId);
        return ability ? ability.mapType === 'square' : false;
    },
};

// 전역 등록
window.MODE_ABILITIES = MODE_ABILITIES;
window.ModeAbilityHelper = ModeAbilityHelper;
