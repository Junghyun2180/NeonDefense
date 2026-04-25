// Neon Defense - 데이터 조회 헬퍼 (DataResolver)
// 모드 ID 기반으로 GAME_DATA에서 설정을 조회하는 단일 진입점
// 모든 소비자 코드는 글로벌 상수 대신 DataResolver를 통해 데이터에 접근

const DataResolver = {
    // ===== 모드 설정 조회 =====

    // 모드 전체 설정 가져오기 (기본: campaign)
    getMode(modeId) {
        return GAME_DATA.modes[modeId] || GAME_DATA.modes.campaign;
    },

    // 스폰 설정
    getSpawn(modeId) {
        return this.getMode(modeId).spawn;
    },

    // 경제 설정
    getEconomy(modeId) {
        return this.getMode(modeId).economy;
    },

    // 체력 스케일링
    getHealthScaling(modeId) {
        return this.getMode(modeId).healthScaling;
    },

    // 캐리오버 설정
    getCarryover(modeId) {
        return this.getMode(modeId).carryover;
    },

    // 스폰 규칙 (우선순위 기반 적 타입 결정)
    getSpawnRules(modeId) {
        return this.getMode(modeId).spawnRules;
    },

    // 맵 타입
    getMapType(modeId) {
        return this.getMode(modeId).mapType;
    },

    // 순환 경로 여부
    isLoopingPath(modeId) {
        return this.getMode(modeId).loopingPath || false;
    },

    // 패배 조건 체크
    checkDefeat(modeId, state) {
        const mode = this.getMode(modeId);
        if (mode.defeatCondition === 'enemyCount') {
            return state.enemyCount >= mode.defeatThreshold;
        }
        if (mode.defeatCondition === 'lives') {
            return state.lives <= 0;
        }
        return false;
    },

    // ㅁ형 맵 사용 여부
    usesSquareMap(modeId) {
        return this.getMapType(modeId) === 'square';
    },

    // ===== 계산 헬퍼 =====

    // 기본 체력 계산
    // 합의 10: floor 인자 — Floor N 의 HP 는 base × 1.15^(N-1) (Floor 1 = ×1.0)
    calcBaseHealth(modeId, stage, wave, floor = 1) {
        const hs = this.getHealthScaling(modeId);
        const stageScale = 1 + (stage - 1) * hs.stageGrowth;
        const waveScale = 1 + (wave - 1) * hs.waveGrowth;
        const floorMult = Math.pow(1.15, Math.max(0, floor - 1));
        let health = Math.floor(hs.base * stageScale * waveScale * floorMult);

        // 후반 웨이브 보너스
        if (wave >= hs.lateWaveThreshold) {
            health = Math.floor(health * hs.lateWaveBonus);
        }
        return health;
    },

    // 보스 체력 계산 (통합)
    getBossHealth(modeId, stage, wave, floor = 1) {
        const hs = this.getHealthScaling(modeId);
        const baseHealth = this.calcBaseHealth(modeId, stage, wave, floor);
        return Math.floor(baseHealth * hs.bossFormula(stage));
    },

    // ===== 공유 데이터 접근 =====

    getEnemyConfig(enemyType) {
        return GAME_DATA.shared.enemyConfig[enemyType] || null;
    },

    getElementEffect(elementType) {
        return GAME_DATA.shared.elementEffects[elementType] || null;
    },

    getNeonType(tier) {
        return GAME_DATA.shared.neonTypes[tier] || null;
    },

    getSupportConfig(tier) {
        return GAME_DATA.shared.supportConfig[tier] || null;
    },

    getT4Roles(elementType) {
        return GAME_DATA.shared.t4Roles[elementType] || [];
    },

    getCombatConfig() {
        return GAME_DATA.shared.combat;
    },

    // ===== 메타 데이터 접근 =====

    getMetaUpgrade(upgradeId) {
        return GAME_DATA.meta.upgrades[upgradeId] || null;
    },

    getCrystalRewards() {
        return GAME_DATA.meta.crystalRewards;
    },

    getDailyModifier(modifierId) {
        return GAME_DATA.meta.dailyModifiers[modifierId] || null;
    },
};

// 전역 등록
window.DataResolver = DataResolver;
