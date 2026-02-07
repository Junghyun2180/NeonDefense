// Neon Defense - 런 모드 핵심 시스템
// 런 설정 빌드, 크리스탈 보상, 메타 업그레이드 관리, 메타 버프 계산

const RunMode = {
  // ===== 런 설정 빌드 (메타 업그레이드 적용) =====
  buildRunConfig(metaUpgrades = {}) {
    const startGoldBonus = META_UPGRADES.startingGold.effect(metaUpgrades.startingGold || 0);
    const startLivesBonus = META_UPGRADES.startingLives.effect(metaUpgrades.startingLives || 0);
    const carryoverBonus = META_UPGRADES.carryoverSlots.effect(metaUpgrades.carryoverSlots || 0);
    const discountBonus = META_UPGRADES.drawDiscount.effect(metaUpgrades.drawDiscount || 0);

    return {
      SPAWN: { ...RUN_SPAWN },
      ECONOMY: {
        ...RUN_ECONOMY,
        startGold: RUN_ECONOMY.startGold + startGoldBonus,
        startLives: RUN_ECONOMY.startLives + startLivesBonus,
        drawCost: Math.max(1, RUN_ECONOMY.drawCost - discountBonus),
      },
      HEALTH_SCALING: { ...RUN_HEALTH_SCALING },
      CARRYOVER: {
        ...RUN_CARRYOVER,
        maxTowers: RUN_CARRYOVER.maxTowers + carryoverBonus,
      },
    };
  },

  // ===== Endless 모드용 설정 빌드 =====
  buildEndlessConfig(metaUpgrades = {}, currentStage = 1) {
    const base = this.buildRunConfig(metaUpgrades);
    const scaling = this.getEndlessScaling(currentStage);

    return {
      ...base,
      SPAWN: {
        ...base.SPAWN,
        maxStage: 999, // 무한
        enemiesPerWave: (stage, wave) => {
          const baseCount = RUN_SPAWN.enemiesPerWave(stage, wave);
          return Math.floor(baseCount + scaling.enemyCountBonus);
        },
        spawnDelay: (stage, wave) => {
          const baseDelay = RUN_SPAWN.spawnDelay(stage, wave);
          return Math.max(80, baseDelay - scaling.spawnDelayReduction);
        },
      },
      HEALTH_SCALING: {
        ...base.HEALTH_SCALING,
        base: RUN_HEALTH_SCALING.base * scaling.healthMultiplier,
      },
    };
  },

  // ===== Daily Challenge용 설정 빌드 =====
  buildDailyConfig(metaUpgrades = {}, modifiers = []) {
    const base = this.buildRunConfig(metaUpgrades);

    // 모디파이어 적용
    let config = { ...base };
    for (const mod of modifiers) {
      config = this.applyModifier(config, mod);
    }

    return config;
  },

  // ===== 모디파이어 적용 =====
  applyModifier(config, modifierId) {
    switch (modifierId) {
      case 'speedRush':
        // 적 이동속도 +50% → spawnDelay는 동일, 적 speed는 EnemySystem에서 처리
        return { ...config, _modifiers: [...(config._modifiers || []), 'speedRush'] };

      case 'bossWave':
        return { ...config, _modifiers: [...(config._modifiers || []), 'bossWave'] };

      case 'lowEconomy':
        return {
          ...config,
          ECONOMY: {
            ...config.ECONOMY,
            waveReward: (wave) => Math.floor(RUN_ECONOMY.waveReward(wave) * 0.6),
            stageClearBonus: (stage) => Math.floor(RUN_ECONOMY.stageClearBonus(stage) * 0.6),
            bossGoldReward: (stage, wave) => Math.floor(RUN_ECONOMY.bossGoldReward(stage, wave) * 0.6),
          },
          _modifiers: [...(config._modifiers || []), 'lowEconomy'],
        };

      case 'noSupport':
        return { ...config, _modifiers: [...(config._modifiers || []), 'noSupport'] };

      case 'oneElement':
        return { ...config, _modifiers: [...(config._modifiers || []), 'oneElement'] };

      default:
        return config;
    }
  },

  // ===== 크리스탈 보상 계산 =====
  calculateCrystals(result) {
    let crystals = 0;

    if (result.cleared) {
      // 모드별 기본 보상
      if (result.mode === 'daily') {
        crystals += CRYSTAL_REWARDS.dailyClear;
      } else {
        crystals += CRYSTAL_REWARDS.standardClear;
      }
      // 퍼펙트 보너스 (목숨 손실 0)
      if (result.isPerfect) {
        crystals += CRYSTAL_REWARDS.perfectBonus;
      }
      // 스피드 보너스 (15분 이내)
      if (result.playTimeMs && result.playTimeMs < 15 * 60 * 1000) {
        crystals += CRYSTAL_REWARDS.speedBonus;
      }
    } else {
      // 실패: 스테이지당 보상
      crystals += (result.stagesCleared || 0) * CRYSTAL_REWARDS.perStageBonus;
    }

    // Endless: 스테이지당 보상
    if (result.mode === 'endless') {
      crystals = (result.stagesCleared || 0) * CRYSTAL_REWARDS.perStageBonus;
    }

    // 등급 보너스
    const gradeBonus = CRYSTAL_REWARDS.gradeBonus[result.grade] || 0;
    crystals += gradeBonus;

    return crystals;
  },

  // ===== 메타 업그레이드 비용 =====
  getUpgradeCost(upgradeId, currentLevel) {
    const upgrade = META_UPGRADES[upgradeId];
    if (!upgrade || currentLevel >= upgrade.maxLevel) return Infinity;
    return upgrade.cost(currentLevel);
  },

  // ===== 업그레이드 구매 가능 여부 =====
  canPurchaseUpgrade(metaData, upgradeId) {
    const currentLevel = metaData.upgrades[upgradeId] || 0;
    const cost = this.getUpgradeCost(upgradeId, currentLevel);
    return metaData.crystals >= cost && currentLevel < META_UPGRADES[upgradeId].maxLevel;
  },

  // ===== 업그레이드 구매 =====
  purchaseUpgrade(metaData, upgradeId) {
    const currentLevel = metaData.upgrades[upgradeId] || 0;
    const cost = this.getUpgradeCost(upgradeId, currentLevel);

    if (metaData.crystals < cost || currentLevel >= META_UPGRADES[upgradeId].maxLevel) {
      return null; // 구매 불가
    }

    return {
      ...metaData,
      crystals: metaData.crystals - cost,
      upgrades: {
        ...metaData.upgrades,
        [upgradeId]: currentLevel + 1,
      },
    };
  },

  // ===== 메타 버프 배율 계산 (게임 틱에서 사용) =====
  getMetaBuffs(metaUpgrades = {}) {
    return {
      damageMultiplier: 1 + META_UPGRADES.baseDamage.effect(metaUpgrades.baseDamage || 0),
      attackSpeedMultiplier: 1 + META_UPGRADES.baseAttackSpeed.effect(metaUpgrades.baseAttackSpeed || 0),
      goldMultiplier: 1 + META_UPGRADES.goldMultiplier.effect(metaUpgrades.goldMultiplier || 0),
      drawDiscount: META_UPGRADES.drawDiscount.effect(metaUpgrades.drawDiscount || 0),
      rerollCount: META_UPGRADES.rerollCount.effect(metaUpgrades.rerollCount || 0),
    };
  },

  // ===== Endless 모드 스케일링 =====
  getEndlessScaling(stageNumber) {
    const mult = Math.pow(1.10, stageNumber - 1); // 스테이지당 10% 증가
    return {
      healthMultiplier: mult,
      enemyCountBonus: Math.floor(stageNumber * 1.5),
      spawnDelayReduction: Math.min(stageNumber * 8, 350),
    };
  },

  // ===== 런 등급 계산 =====
  calculateRunGrade(stats, runMode = 'standard') {
    let score = 0;

    // 클리어 보너스
    if (stats.stagesCleared >= 5) score += 40;

    // 퍼펙트 웨이브
    score += (stats.perfectWaves || 0) * 3;

    // T4 타워 생성
    score += (stats.t4TowersCreated || 0) * 5;

    // 보스 킬
    score += (stats.bossKills || 0) * 3;

    // 시간 보너스
    if (stats.endTime && stats.startTime) {
      const playTimeMin = (stats.endTime - stats.startTime) / 60000;
      if (playTimeMin <= 10) score += 25;
      else if (playTimeMin <= 15) score += 15;
      else if (playTimeMin <= 20) score += 5;
    }

    // 킬 수
    score += Math.min(20, Math.floor((stats.totalKills || 0) / 10));

    // Endless 보너스
    if (runMode === 'endless') {
      score = Math.min(100, (stats.stagesCleared || 0) * 8);
    }

    // 등급 산정
    if (score >= 100) return 'S';
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  },
};

// 전역 등록
window.RunMode = RunMode;
