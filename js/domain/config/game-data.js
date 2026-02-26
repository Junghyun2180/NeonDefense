// Neon Defense - 통합 게임 데이터 레지스트리 (GAME_DATA)
// 모든 모드의 설정을 하나의 진실의 원천으로 관리
// 기존 constants.js, run-mode-constants.js, mode-abilities.js의 데이터를 통합 참조

const GAME_DATA = {
    // ===== 모든 모드에서 공유하는 상수 =====
    shared: {
        grid: {
            tileSize: TILE_SIZE,
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
        },
        elements: ELEMENT_TYPES,
        elementEffects: ELEMENT_EFFECTS,
        neonTypes: NEON_TYPES,
        enemyConfig: ENEMY_CONFIG,
        supportTypes: SUPPORT_TYPES,
        supportConfig: SUPPORT_CONFIG,
        supportCaps: SUPPORT_CAPS,
        combat: COMBAT,
        t4Roles: T4_ROLES,
        pathColors: PATH_COLORS,
        endColors: END_COLORS,
        elementUI: ELEMENT_UI,
        supportUI: SUPPORT_UI,
    },

    // ===== 모드별 설정 =====
    modes: {
        // --- 캠페인 모드 ---
        campaign: {
            id: 'campaign',
            name: '캠페인',
            icon: '🏰',
            mapType: 'standard',
            defeatCondition: 'lives',
            defeatThreshold: null,
            waveAutoStart: false,
            loopingPath: false,

            spawn: SPAWN,
            economy: ECONOMY,
            healthScaling: HEALTH_SCALING,
            carryover: CARRYOVER,
            spawnRules: SPAWN_RULES,
        },

        // --- 런 모드 ---
        run: {
            id: 'run',
            name: '런 모드',
            icon: '🎮',
            mapType: 'square',
            defeatCondition: 'enemyCount',
            defeatThreshold: 70,
            waveAutoStart: true,
            waveDurationMs: 60000,
            bossPhaseDurationMs: 60000,
            loopingPath: true,

            spawn: RUN_SPAWN,
            economy: RUN_ECONOMY,
            healthScaling: RUN_HEALTH_SCALING,
            carryover: RUN_CARRYOVER,
            spawnRules: MODE_ABILITIES.run.spawnRules,
        },

        // --- 보스 러시 모드 ---
        bossRush: {
            id: 'bossRush',
            name: '보스 러시',
            icon: '🏆',
            mapType: 'square',
            defeatCondition: 'lives',
            defeatThreshold: null,
            waveAutoStart: false,
            loopingPath: true,

            spawn: BOSS_RUSH_SPAWN,
            economy: BOSS_RUSH_ECONOMY,
            healthScaling: BOSS_RUSH_HEALTH_SCALING,
            carryover: BOSS_RUSH_CARRYOVER,
            spawnRules: MODE_ABILITIES.bossRush.spawnRules,

            // 보스 러시 전용
            bossKillReward: 'towerDraw',
            bossKillDrawCount: 1,
            scoring: MODE_ABILITIES.bossRush.scoring,
        },
    },

    // ===== 메타 시스템 =====
    meta: {
        upgrades: META_UPGRADES,
        crystalRewards: CRYSTAL_REWARDS,
        dailyModifiers: DAILY_MODIFIERS,
    },
};

// 전역 등록
window.GAME_DATA = GAME_DATA;
