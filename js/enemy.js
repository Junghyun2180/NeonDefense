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
      // 상태이상 (StatusEffectSystem에서 기본값 가져옴)
      ...StatusEffectSystem.getDefaultFields(),
      // 힐러 전용
      lastHealTime: 0,
    };
  },

  // 분열체가 죽을 때 작은 적 생성
  createSplitEnemies(parent) {
    const config = ENEMY_CONFIG.splitter;
    const splitEnemies = [];

    for (let i = 0; i < config.splitCount; i++) {
      // 부모 경로의 현재 위치부터 시작
      const splitEnemy = {
        id: Date.now() + Math.random() + i,
        type: 'normal', // 분열된 적은 일반 타입
        health: Math.floor(parent.maxHealth * config.splitHealthMult),
        maxHealth: Math.floor(parent.maxHealth * config.splitHealthMult),
        pathIndex: parent.pathIndex,
        pathId: parent.pathId,
        pathTiles: parent.pathTiles,
        baseSpeed: parent.baseSpeed * config.splitSpeedMult,
        speed: parent.baseSpeed * config.splitSpeedMult,
        debuffRange: 0,
        goldReward: Math.floor(ENEMY_CONFIG.normal.goldReward / 2),
        // 약간 퍼지게 위치 조정
        x: parent.x + (Math.random() - 0.5) * 20,
        y: parent.y + (Math.random() - 0.5) * 20,
        // 상태이상 초기화
        ...StatusEffectSystem.getDefaultFields(),
        lastHealTime: 0,
        isSplitChild: true, // 분열 자식 표시 (재분열 방지)
      };
      splitEnemies.push(splitEnemy);
    }

    return splitEnemies;
  },

  // 힐러의 주변 적 치유 처리 (즉시 힐 방식)
  processHealerHeal(healer, allEnemies, now) {
    const config = ENEMY_CONFIG.healer;

    // 쿨다운 체크
    if (now - healer.lastHealTime < config.healInterval) {
      return { updatedHealer: healer, healedEnemies: [] };
    }

    const healedEnemies = [];
    const healRange = config.healRange;
    const healAmount = config.healAmount;

    allEnemies.forEach(enemy => {
      if (enemy.id === healer.id) return; // 자기 자신 제외
      if (enemy.health >= enemy.maxHealth) return; // 풀피인 적 제외

      const dist = calcDistance(healer.x, healer.y, enemy.x, enemy.y);
      if (dist <= healRange) {
        const healValue = Math.floor(enemy.maxHealth * healAmount);
        const newHealth = Math.min(enemy.maxHealth, enemy.health + healValue);
        healedEnemies.push({ id: enemy.id, newHealth });
      }
    });

    return {
      updatedHealer: { ...healer, lastHealTime: now },
      healedEnemies,
    };
  },

  // 힐러가 재생 버프를 부여하는 방식 (StatusEffect 활용)
  applyHealerRegeneration(healer, allEnemies, now) {
    const config = ENEMY_CONFIG.healer;

    // 쿨다운 체크
    if (now - healer.lastHealTime < config.healInterval) {
      return { updatedHealer: healer, affectedEnemies: [] };
    }

    const affectedEnemies = [];
    const healRange = config.healRange;

    allEnemies.forEach(enemy => {
      if (enemy.id === healer.id) return;

      const dist = calcDistance(healer.x, healer.y, enemy.x, enemy.y);
      if (dist <= healRange) {
        // 재생 버프 부여 (2초간 틱당 2.5% 회복)
        const updatedEnemy = StatusEffectSystem.apply(enemy, {
          type: 'regeneration',
          healPercent: 0.025,
          duration: 2000,
        }, now);
        affectedEnemies.push(updatedEnemy);
      }
    });

    return {
      updatedHealer: { ...healer, lastHealTime: now },
      affectedEnemies,
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

    // 슬로우 처리 (StatusEffectSystem 위임)
    const speedMult = StatusEffectSystem.getSpeedMultiplier(enemy, now);
    updatedEnemy.speed = enemy.baseSpeed * speedMult;

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

  // 화상 데미지 처리 (StatusEffectSystem 위임)
  processBurn(enemy, now, gameSpeed) {
    return StatusEffectSystem.processBurnTick(enemy, now, gameSpeed);
  },

  // 상태이상 적용 (StatusEffectSystem 위임)
  applyStatusEffect(enemy, effect, now) {
    return StatusEffectSystem.apply(enemy, effect, now);
  },

  // 폭발 색상 (ENEMY_CONFIG 참조)
  getExplosionColor(enemy) {
    return ENEMY_CONFIG[enemy.type].explosionColor;
  },

  // 디버프 적인지 확인
  isDebuffer(enemy) {
    return enemy.type === 'jammer' || enemy.type === 'suppressor';
  },

  // 힐러인지 확인
  isHealer(enemy) {
    return enemy.type === 'healer';
  },

  // 분열체인지 확인 (재분열 방지를 위해 isSplitChild 체크)
  isSplitter(enemy) {
    return enemy.type === 'splitter' && !enemy.isSplitChild;
  },
};
