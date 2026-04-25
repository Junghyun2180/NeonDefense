// Neon Defense - 적 시스템 (EnemySystem)
// 적 생성, 이동, 상태이상, 타입 판별을 단일 네임스페이스로 관리

const EnemySystem = {
  // 적 타입 결정 (스테이지 풀 기반 + 웨이브별 확률 증가)
  // modeId: 'campaign' | 'run' | 'bossRush' (DataResolver로 규칙 조회)
  determineType(enemyIndex, totalEnemies, wave, stage, modeId) {
    // 1. 보스 체크 (마지막 웨이브의 마지막 적)
    const spawnRules = DataResolver.getSpawnRules(modeId);
    for (const rule of spawnRules) {
      if (rule.type === 'boss' && rule.condition(enemyIndex, totalEnemies, wave, stage)) {
        return 'boss';
      }
    }

    // 1.5. 캠페인 W5 미니보스 슬롯 (합의 10: W5 마지막 적 = elite 강제, create()에서 강화)
    if ((modeId === 'campaign' || !modeId) && wave === 5 && enemyIndex === totalEnemies - 1) {
      return 'elite';
    }

    // 2. 캠페인 모드: 스테이지 풀 기반 타입 결정
    if (modeId === 'campaign' || !modeId) {
      const pool = STAGE_ENEMY_POOL[stage] || ALL_ENEMY_TYPES;

      // 풀에서 special 타입 확률 순회 (normal, fast 제외한 특수 타입 먼저)
      const specialTypes = pool.filter(t => t !== 'normal');
      for (const type of specialTypes) {
        const config = SPECIAL_ENEMY_CHANCE[type];
        if (!config) continue;
        const chance = config.base + (config.perWave || 0) * (wave - 1);
        if (Math.random() < chance) return type;
      }
      return 'normal'; // fallback
    }

    // 3. 다른 모드: 기존 스폰 규칙 사용
    const progress = enemyIndex / totalEnemies;
    for (const rule of spawnRules) {
      if (!rule.condition(enemyIndex, totalEnemies, wave, stage, progress)) continue;
      const chance = rule.chance
        ?? (rule.chanceBase || 0) + (rule.chancePerWave || 0) * wave + (rule.chancePerStage || 0) * stage;
      if (Math.random() < chance) return rule.type;
    }
    return 'normal';
  },

  // 기본 체력 계산 (DataResolver 기반)
  // modeId: 'campaign' | 'run' | 'bossRush'
  calcBaseHealth(stage, wave, modeId) {
    return DataResolver.calcBaseHealth(modeId, stage, wave);
  },

  // 초기 이동 방향으로부터 facingAngle/flip 계산 (스폰 시 최초 정렬용)
  _computeInitialFacing(pathTiles) {
    if (!pathTiles || pathTiles.length < 2) return { angle: 0, flip: 1 };
    const dx = pathTiles[1].x - pathTiles[0].x;
    const dy = pathTiles[1].y - pathTiles[0].y;
    const flip = dx >= 0 ? 1 : -1;
    const effDx = flip === 1 ? dx : -dx;
    const angle = Math.atan2(dy, Math.max(0.01, effDx));
    return { angle, flip };
  },

  // 적 생성 팩토리 (단일 진실의 원천)
  // modeId: 'campaign' | 'run' | 'bossRush' (선택, 기본값 'campaign')
  create(stage, wave, enemyIndex, totalEnemies, pathTiles, pathId, modeId) {
    let type = this.determineType(enemyIndex, totalEnemies, wave, stage, modeId);
    let config = DataResolver.getEnemyConfig(type);

    // 타입이 유효하지 않으면 'normal'로 fallback
    if (!config) {
      console.error(`[EnemySystem.create] Unknown enemy type: ${type}. Using 'normal' as fallback.`);
      type = 'normal';
      config = DataResolver.getEnemyConfig('normal');

      // 그래도 없으면 심각한 오류
      if (!config) {
        console.error('[EnemySystem.create] ENEMY_CONFIG["normal"] is missing! Game is broken.');
        return null;
      }
    }
    const baseHealth = this.calcBaseHealth(stage, wave, modeId);

    // 체력 계산
    // 합의 10: W5 마지막 적 = 미니보스 (elite 강화). W10 마지막 적 = 스테이지 보스.
    const isMinibossSlot =
      (modeId === 'campaign' || !modeId) &&
      wave === 5 &&
      enemyIndex === totalEnemies - 1 &&
      type === 'elite';
    let health;
    if (type === 'boss') {
      health = DataResolver.getBossHealth(modeId, stage, wave);
    } else if (isMinibossSlot) {
      const hs = DataResolver.getHealthScaling(modeId);
      const mult = hs.minibossHealthMult || 4;
      health = Math.floor(baseHealth * config.healthMult * mult);
    } else {
      health = Math.floor(baseHealth * config.healthMult);
    }

    // 속도 계산
    let speed;
    if (type === 'boss') {
      speed = config.speedBase + stage * config.speedGrowth;
    } else {
      const [minSpeed, maxSpeed] = config.speedRange;
      speed = minSpeed + Math.random() * (maxSpeed - minSpeed) + config.speedWaveBonus * wave;
    }

    // 골드 보상
    const economy = DataResolver.getEconomy(modeId);
    const goldReward = type === 'boss'
      ? economy.bossGoldReward(stage, wave)
      : config.goldReward;

    // Danger Wave 판정 — 각 스테이지의 마지막 웨이브 (wave === wavesPerStage)
    // 적 이동속도 +15%, HP +12% — 스테이지 클라이맥스 느낌
    const spawnCfg = DataResolver.getSpawn(modeId);
    const wavesPerStage = spawnCfg?.wavesPerStage || 5;
    const isDangerWave = (wave === wavesPerStage) && type !== 'boss';
    if (isDangerWave) {
      speed = Math.round(speed * 1.15 * 100) / 100;
      health = Math.floor(health * 1.12);
    }

    // 합의 06: Armor / Shield — Stage 2+ 에서만 적용 (S1은 진입 장벽 X)
    // 합의 10: W5 미니보스 = armor 가산
    let armor = (stage >= 2 && config.armor) ? config.armor : 0;
    if (isMinibossSlot) {
      const hs = DataResolver.getHealthScaling(modeId);
      armor = (config.armor || 0) + (hs.minibossArmorBonus || 2);
    }
    const shieldMax = (stage >= 2 && config.shieldRatio) ? Math.floor(health * config.shieldRatio) : 0;

    const initFacing = this._computeInitialFacing(pathTiles);
    const enemy = {
      id: Date.now() + Math.random(),
      type,
      health,
      maxHealth: health,
      armor,
      shield: shieldMax,
      shieldMax,
      shieldBrokenAt: 0,        // aegis 재생 트리거 시간
      shieldRegenUsed: false,   // aegis 재생 1회만
      isMiniboss: isMinibossSlot, // 합의 10: W5 미니보스 표식 (UI/통계용)
      pathIndex: 0,
      pathId,
      pathTiles,
      baseSpeed: speed,
      speed,
      debuffRange: config.debuffRange || 0,
      goldReward,
      isDangerWave,
      x: pathTiles[0].x * GAME_DATA.shared.grid.tileSize + GAME_DATA.shared.grid.tileSize / 2,
      y: pathTiles[0].y * GAME_DATA.shared.grid.tileSize + GAME_DATA.shared.grid.tileSize / 2,
      // 상태이상 (StatusEffectSystem에서 기본값 가져옴)
      ...StatusEffectSystem.getDefaultFields(),
      // 힐러 전용
      lastHealTime: 0,
      // 스프라이트 방향/애니메이션 (Lerp 회전 + 상하 바빙)
      facingAngle: initFacing.angle,
      facingFlip: initFacing.flip,
      bobPhase: Math.random() * Math.PI * 2,
    };
    // 보스면 패턴 지정 (스테이지 기반 순환: splitter → regen → berserk)
    if (type === 'boss') {
      const patterns = ['splitter', 'regen', 'berserk'];
      enemy.bossPattern = patterns[(Math.max(1, stage) - 1) % patterns.length];
    }
    // Ability 할당
    return EnemyAbilitySystem.assignAbility(enemy);
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
        // 분열 자식: armor/shield 미적용 (잔여 처리 단순화)
        armor: 0, shield: 0, shieldMax: 0, shieldBrokenAt: 0, shieldRegenUsed: true,
        // 상태이상 초기화
        ...StatusEffectSystem.getDefaultFields(),
        lastHealTime: 0,
        spawnWave: parent.spawnWave, // 부모 웨이브 상속
        isSplitChild: true, // 분열 자식 표시 (재분열 방지)
        // 부모 방향 상속, bobPhase는 독립 (같은 위상으로 보이지 않도록)
        facingAngle: parent.facingAngle || 0,
        facingFlip: parent.facingFlip || 1,
        bobPhase: Math.random() * Math.PI * 2,
      };
      // Ability 할당
      splitEnemies.push(EnemyAbilitySystem.assignAbility(splitEnemy));
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
        // 재생 버프 부여 (ENEMY_CONFIG.healer 수치 기반)
        const updatedEnemy = StatusEffectSystem.apply(enemy, {
          type: 'regeneration',
          healPercent: config.regenHealPercent,
          duration: config.regenDuration,
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
      // 순환 경로인 경우: 시작점으로 리셋 (제거하지 않음)
      if (enemy.isLooping) {
        return {
          enemy: {
            ...enemy,
            pathIndex: 0,
            loopCount: (enemy.loopCount || 0) + 1,
            x: path[0].x * TILE_SIZE + TILE_SIZE / 2,
            y: path[0].y * TILE_SIZE + TILE_SIZE / 2,
          },
          livesLost: 0,
        };
      }
      const config = ENEMY_CONFIG[enemy.type];
      if (!config) {
        console.warn(`[EnemySystem.move] Unknown enemy type: ${enemy.type}`, enemy);
        return { enemy: null, livesLost: 1 }; // 기본값
      }
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

    // 방향·바빙 갱신 (거리 체크보다 먼저) — 현재 위치→타겟 방향 기준
    const rawDx = targetX - enemy.x;
    const rawDy = targetY - enemy.y;
    const prevFlip = enemy.facingFlip ?? 1;
    // dx가 거의 0이면 이전 flip 유지 (순수 상하 이동 시 갑자기 뒤집히지 않게)
    const desiredFlip = Math.abs(rawDx) < 0.01 ? prevFlip : (rawDx >= 0 ? 1 : -1);
    // flip 기준으로 각도 계산 → 스프라이트가 뒤집힌 좌표계에서 ±90° 범위로만 기울임
    const effDx = desiredFlip === 1 ? rawDx : -rawDx;
    const targetAngle = Math.atan2(rawDy, Math.max(0.01, effDx));
    const currentAngle = enemy.facingAngle ?? targetAngle;
    // 배속 비례 Lerp (코너에서 빠르게 수렴, 0.15 * gameSpeed → ~10틱)
    const lerpT = Math.min(1, 0.18 * gameSpeed);
    const newAngle = currentAngle + (targetAngle - currentAngle) * lerpT;
    // 바빙 위상: 이동량에 비례 (빠른 적은 빠르게, 슬로우/빙결 시 정적)
    const bobAdvance = moveSpeed * 0.08;
    const newBobPhase = (enemy.bobPhase ?? 0) + bobAdvance;

    updatedEnemy.facingAngle = newAngle;
    updatedEnemy.facingFlip = desiredFlip;
    updatedEnemy.bobPhase = newBobPhase;

    if (dist < moveSpeed * 2) {
      return {
        enemy: { ...updatedEnemy, x: targetX, y: targetY, pathIndex: enemy.pathIndex + 1 },
        livesLost: 0,
      };
    }

    return {
      enemy: {
        ...updatedEnemy,
        x: enemy.x + (rawDx / dist) * moveSpeed * 2,
        y: enemy.y + (rawDy / dist) * moveSpeed * 2,
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

  // 폭발 색상 (DataResolver 참조)
  getExplosionColor(enemy) {
    const config = DataResolver.getEnemyConfig(enemy.type);
    return config ? config.explosionColor : '#ffffff';
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

  // 데미지 적용 헬퍼: Shield → (overflow) → Armor → HP
  // 합의 06: Shield 는 Armor 미적용. Burn 같은 DoT 는 둘 다 우회.
  // opts: { armorPierce: 0~1, shieldDamageMult: number, bypassShield: bool, bypassArmor: bool }
  // returns: { enemy, killed, shieldBrokenNow }
  applyDamage(enemy, rawDamage, opts = {}) {
    if (!enemy || rawDamage <= 0) return { enemy, killed: false, shieldBrokenNow: false };

    const armorPierce = opts.armorPierce || 0;
    const shieldDamageMult = opts.shieldDamageMult || 1;
    const bypassShield = !!opts.bypassShield;
    const bypassArmor = !!opts.bypassArmor;

    let remaining = rawDamage; // 원시 데미지 단위 (실드 계수 적용 전)
    let shield = enemy.shield || 0;
    let shieldBrokenNow = false;
    const next = { ...enemy };

    // 1) 실드 단계 — Armor 미적용
    if (!bypassShield && shield > 0) {
      const shieldDmg = remaining * shieldDamageMult;
      if (shieldDmg >= shield) {
        // 실드 완전 파괴 + overflow 산출 (원시 데미지 기준)
        const consumedRaw = shield / shieldDamageMult;
        remaining = Math.max(0, remaining - consumedRaw);
        next.shield = 0;
        next.shieldBrokenAt = Date.now();
        shieldBrokenNow = true;
      } else {
        next.shield = shield - shieldDmg;
        remaining = 0; // 실드가 다 흡수
      }
    }

    if (remaining <= 0) {
      return { enemy: next, killed: false, shieldBrokenNow };
    }

    // 2) Armor 단계 — flat 차감, 광휘는 50% 관통, 최소 1 보장
    let hpDamage = remaining;
    if (!bypassArmor && (next.armor || 0) > 0) {
      const effectiveArmor = next.armor * (1 - armorPierce);
      hpDamage = Math.max(1, remaining - effectiveArmor);
    }

    next.health = enemy.health - Math.floor(hpDamage);
    return {
      enemy: next,
      killed: next.health <= 0,
      shieldBrokenNow,
    };
  },

  // 이지스 실드 재생 처리: 깨진 후 일정 시간 경과 + 1회만
  tickShieldRegen(enemy, now) {
    if (enemy.type !== 'aegis') return enemy;
    if (enemy.shieldRegenUsed) return enemy;
    if (enemy.shield > 0) return enemy;
    const config = ENEMY_CONFIG.aegis;
    if (!enemy.shieldBrokenAt || now - enemy.shieldBrokenAt < config.shieldRegenDelay) return enemy;

    const regen = Math.floor(enemy.shieldMax * config.shieldRegenPercent);
    return { ...enemy, shield: regen, shieldRegenUsed: true };
  },
};
