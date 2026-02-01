// Neon Defense - 적 시스템 (EnemySystem)
// 적 생성, 이동, 상태이상, 타입 판별을 단일 네임스페이스로 관리

const EnemySystem = {
  // 적 타입 결정 (SPAWN_RULES 테이블 기반, 우선순위 순)
  determineType(enemyIndex, totalEnemies, wave, stage) {
    const progress = enemyIndex / totalEnemies;
    for (const rule of SPAWN_RULES) {
      if (!rule.condition(enemyIndex, totalEnemies, wave, stage, progress)) continue;
      // 확률 기반 체크
      const chance = rule.chance
        ?? (rule.chanceBase || 0) + (rule.chancePerWave || 0) * wave + (rule.chancePerStage || 0) * stage;
      if (Math.random() < chance) return rule.type;
    }
    return 'normal'; // fallback
  },

  // 기본 체력 계산 (HEALTH_SCALING 설정 참조)
  calcBaseHealth(stage, wave) {
    const hs = HEALTH_SCALING;
    const stageMult = 1 + (stage - 1) * hs.stageGrowth;
    const waveMult = 1 + (wave - 1) * hs.waveGrowth;
    const lateBonus = wave >= hs.lateWaveThreshold ? hs.lateWaveBonus : 1;
    return Math.floor(hs.base * stageMult * waveMult * lateBonus);
  },

  // 적 생성 팩토리 (단일 진실의 원천)
  create(stage, wave, enemyIndex, totalEnemies, pathTiles, pathId) {
    const type = this.determineType(enemyIndex, totalEnemies, wave, stage);
    const config = ENEMY_CONFIG[type];
    const baseHealth = this.calcBaseHealth(stage, wave);

    // 체력 계산
    let health;
    if (type === 'boss') {
      health = Math.floor(baseHealth * HEALTH_SCALING.bossFormula(stage));
    } else {
      health = Math.floor(baseHealth * config.healthMult);
    }

    // 속도 계산
    let speed;
    if (type === 'boss') {
      speed = 0.25 + stage * 0.02;
    } else {
      const [minSpeed, maxSpeed] = config.speedRange;
      speed = minSpeed + Math.random() * (maxSpeed - minSpeed) + config.speedWaveBonus * wave;
    }

    // 골드 보상
    const goldReward = type === 'boss'
      ? ECONOMY.bossGoldReward(stage, wave)
      : config.goldReward;

    return {
      id: Date.now() + Math.random(),
      type,
      health,
      maxHealth: health,
      pathIndex: 0,
      pathId,
      pathTiles,
      baseSpeed: speed,
      speed,
      debuffRange: config.debuffRange || 0,
      goldReward,
      x: pathTiles[0].x * TILE_SIZE + TILE_SIZE / 2,
      y: pathTiles[0].y * TILE_SIZE + TILE_SIZE / 2,
      // 상태이상
      burnDamage: 0,
      burnEndTime: 0,
      burnTickTime: 0,
      slowEndTime: 0,
      slowPercent: 0,
    };
  },

  // 적 이동 처리 (슬로우 포함)
  move(enemy, gameSpeed, now) {
    const path = enemy.pathTiles;
    if (!path || enemy.pathIndex >= path.length - 1) {
      const config = ENEMY_CONFIG[enemy.type];
      return { enemy: null, livesLost: config.livesLost };
    }

    let updatedEnemy = { ...enemy };

    // 슬로우 처리
    if (enemy.slowEndTime > now) {
      updatedEnemy.speed = enemy.baseSpeed * (1 - enemy.slowPercent);
    } else {
      updatedEnemy.speed = enemy.baseSpeed;
    }

    // 배속 적용된 이동
    const moveSpeed = updatedEnemy.speed * gameSpeed;
    const nextTile = path[enemy.pathIndex + 1];
    const targetX = nextTile.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = nextTile.y * TILE_SIZE + TILE_SIZE / 2;
    const dist = calcDistance(enemy.x, enemy.y, targetX, targetY);

    if (dist < moveSpeed * 2) {
      return {
        enemy: { ...updatedEnemy, x: targetX, y: targetY, pathIndex: enemy.pathIndex + 1 },
        livesLost: 0,
      };
    }

    const dx = targetX - enemy.x, dy = targetY - enemy.y;
    return {
      enemy: {
        ...updatedEnemy,
        x: enemy.x + (dx / dist) * moveSpeed * 2,
        y: enemy.y + (dy / dist) * moveSpeed * 2,
      },
      livesLost: 0,
    };
  },

  // 화상 데미지 처리
  processBurn(enemy, now, gameSpeed) {
    if (enemy.burnEndTime > now && now >= enemy.burnTickTime) {
      return {
        damage: enemy.burnDamage,
        updatedEnemy: { ...enemy, burnTickTime: now + COMBAT.burnTickInterval / gameSpeed },
      };
    }
    return null;
  },

  // 상태이상 적용 (burn, slow, knockback)
  applyStatusEffect(enemy, effect, now) {
    const updatedEnemy = { ...enemy };

    switch (effect.type) {
      case 'burn':
        updatedEnemy.burnDamage = effect.damage;
        updatedEnemy.burnEndTime = now + effect.duration;
        updatedEnemy.burnTickTime = now + COMBAT.burnTickInterval;
        break;
      case 'slow':
        if (effect.percent > enemy.slowPercent || now > enemy.slowEndTime) {
          updatedEnemy.slowPercent = effect.percent;
          updatedEnemy.slowEndTime = now + effect.duration;
        }
        break;
      case 'knockback': {
        const path = enemy.pathTiles;
        if (path) {
          const knockbackTiles = Math.floor(effect.distance / TILE_SIZE);
          const newPathIndex = Math.max(0, enemy.pathIndex - knockbackTiles);
          if (newPathIndex < enemy.pathIndex && path[newPathIndex]) {
            const newTile = path[newPathIndex];
            updatedEnemy.pathIndex = newPathIndex;
            updatedEnemy.x = newTile.x * TILE_SIZE + TILE_SIZE / 2;
            updatedEnemy.y = newTile.y * TILE_SIZE + TILE_SIZE / 2;
          }
        }
        break;
      }
    }

    return updatedEnemy;
  },

  // 폭발 색상 (ENEMY_CONFIG 참조)
  getExplosionColor(enemy) {
    return ENEMY_CONFIG[enemy.type].explosionColor;
  },

  // 디버프 적인지 확인
  isDebuffer(enemy) {
    return enemy.type === 'jammer' || enemy.type === 'suppressor';
  },
};
