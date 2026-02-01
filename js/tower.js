// Neon Defense - 타워 시스템 (TowerSystem)
// 타워 생성, 배치, 조합, 공격 처리를 단일 네임스페이스로 관리

const TowerSystem = {
  // 타워/네온 생성 팩토리 (단일 진실의 원천)
  create(tier, colorIndex) {
    const neonData = NEON_TYPES[tier];
    return {
      id: Date.now() + Math.random(),
      tier,
      colorIndex,
      color: neonData.colors[colorIndex],
      name: neonData.names[colorIndex],
      damage: neonData.damage,
      range: neonData.range,
      speed: neonData.speed,
      element: colorIndex,
      lastShot: 0,
      isDebuffed: false,
    };
  },

  // 맵에 배치 (그리드 좌표 추가)
  placeOnGrid(neon, gridX, gridY) {
    return {
      ...neon,
      id: Date.now() + Math.random(),
      gridX,
      gridY,
      x: gridX * TILE_SIZE + TILE_SIZE / 2,
      y: gridY * TILE_SIZE + TILE_SIZE / 2,
      lastShot: 0,
    };
  },

  // 3개 조합 → 상위 티어 (인벤토리 / 맵 타워 공용)
  combine(items) {
    if (items.length !== 3) return null;
    const baseTier = items[0].tier;
    const baseColorIndex = items[0].colorIndex;
    const allSame = items.every(t => t.tier === baseTier && t.colorIndex === baseColorIndex);
    if (!allSame || baseTier >= 4) return null;
    return this.create(baseTier + 1, baseColorIndex);
  },

  // 전체 자동 조합 (인벤토리 전용)
  combineAll(inventory) {
    let current = [...inventory];
    let combined = true;
    let totalCombines = 0;

    while (combined) {
      combined = false;
      for (let tier = 1; tier <= 3; tier++) {
        for (let element = 0; element < 6; element++) {
          const matching = current.filter(n => n.tier === tier && n.colorIndex === element);
          while (matching.length >= 3) {
            const toRemove = matching.splice(0, 3);
            const idsToRemove = toRemove.map(n => n.id);
            const newNeon = this.create(tier + 1, element);
            // 고유 ID 보장
            newNeon.id = Date.now() + Math.random() + totalCombines;
            current = current.filter(n => !idsToRemove.includes(n.id));
            current.push(newNeon);
            combined = true;
            totalCombines++;
          }
        }
      }
    }
    return current;
  },

  // 조합 가능 세트 수 계산
  getCombinableCount(inventory) {
    let count = 0;
    for (let tier = 1; tier <= 3; tier++) {
      for (let element = 0; element < 6; element++) {
        const matching = inventory.filter(n => n.tier === tier && n.colorIndex === element);
        count += Math.floor(matching.length / 3);
      }
    }
    return count;
  },

  // 디버프 적에 의한 감쇄 계산 (DRY: 한 곳에서만 정의)
  calcDebuffs(tower, enemies) {
    let speedDebuff = 1;
    let damageDebuff = 1;

    enemies.forEach(enemy => {
      const config = ENEMY_CONFIG[enemy.type];
      if (!config.debuffRange) return;

      const dist = calcDistance(tower.x, tower.y, enemy.x, enemy.y);
      if (dist > config.debuffRange) return;

      if (config.debuffType === 'speed') {
        speedDebuff = Math.max(speedDebuff * config.debuffFactor, COMBAT.debuffMinFactor);
      } else if (config.debuffType === 'damage') {
        damageDebuff = Math.max(damageDebuff * config.debuffFactor, COMBAT.debuffMinFactor);
      }
    });

    return { speedDebuff, damageDebuff };
  },

  // 가장 가까운 적 찾기
  findTarget(tower, enemies) {
    let nearestEnemy = null;
    let nearestDist = Infinity;

    enemies.forEach(enemy => {
      const dist = calcDistance(tower.x, tower.y, enemy.x, enemy.y);
      if (dist <= tower.range && dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });

    return nearestEnemy;
  },

  // 투사체 생성
  createProjectile(tower, target, effectiveDamage, gameSpeed) {
    return {
      id: Date.now() + Math.random(),
      x: tower.x,
      y: tower.y,
      targetId: target.id,
      damage: effectiveDamage,
      color: tower.color,
      speed: COMBAT.projectileBaseSpeed * gameSpeed,
      element: tower.element,
      tier: tower.tier,
      towerX: tower.x,
      towerY: tower.y,
    };
  },

  // 타워 공격 처리 (디버프 계산 포함)
  processAttack(tower, enemies, now, gameSpeed) {
    const { speedDebuff, damageDebuff } = this.calcDebuffs(tower, enemies);
    const isDebuffed = speedDebuff < 1 || damageDebuff < 1;

    // 쿨다운 체크
    const effectiveSpeed = tower.speed / speedDebuff;
    if (now - tower.lastShot < effectiveSpeed / gameSpeed) {
      return { tower: { ...tower, isDebuffed }, projectile: null };
    }

    // 타겟 찾기
    const target = this.findTarget(tower, enemies);
    if (!target) {
      return { tower: { ...tower, isDebuffed }, projectile: null };
    }

    const effectiveDamage = Math.floor(tower.damage * damageDebuff);
    const projectile = this.createProjectile(tower, target, effectiveDamage, gameSpeed);

    return {
      tower: { ...tower, lastShot: now, isDebuffed },
      projectile,
    };
  },
};
