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
  // T3 → T4 조합 시에는 { pending: true } 반환하여 역할 선택 UI 표시
  combine(items) {
    if (items.length !== 3) return null;
    const baseTier = items[0].tier;
    const baseColorIndex = items[0].colorIndex;
    const allSame = items.every(t => t.tier === baseTier && t.colorIndex === baseColorIndex);
    if (!allSame || baseTier >= 4) return null;

    // T3 → T4 조합 시 역할 선택 필요
    if (baseTier === 3) {
      return {
        pending: true,
        element: baseColorIndex,
        roles: T4_ROLES[baseColorIndex] || [],
        items: items,
      };
    }

    return this.create(baseTier + 1, baseColorIndex);
  },

  // T4 타워 생성 (역할 선택 후 호출)
  createT4WithRole(colorIndex, roleId) {
    const roles = T4_ROLES[colorIndex];
    const selectedRole = roles?.find(r => r.id === roleId);
    if (!selectedRole) return null;

    const baseData = NEON_TYPES[4];
    const statMod = selectedRole.statMod;

    return {
      id: Date.now() + Math.random(),
      tier: 4,
      colorIndex,
      color: baseData.colors[colorIndex],
      name: baseData.names[colorIndex],
      damage: Math.floor(baseData.damage * (statMod.damage || 1)),
      range: Math.floor(baseData.range * (statMod.range || 1)),
      speed: Math.floor(baseData.speed * (statMod.speed || 1)),
      element: colorIndex,
      lastShot: 0,
      isDebuffed: false,
      // 역할 관련 추가 속성
      role: roleId,
      roleName: selectedRole.name,
      roleIcon: selectedRole.icon,
      special: selectedRole.special || {},
    };
  },

  // 전체 자동 조합 (인벤토리 전용)
  combineAll(inventory) {
    let current = [...inventory];
    let combined = true;
    let totalCombines = 0;

    while (combined) {
      combined = false;
      // T1 → T2, T2 → T3만 자동 조합 (T3 → T4는 역할 선택 필요하므로 제외)
      for (let tier = 1; tier <= 2; tier++) {
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

  // 조합 가능 세트 수 계산 (전체 조합용 - T3 제외)
  getCombinableCount(inventory) {
    let count = 0;
    // T1 → T2, T2 → T3만 카운트 (T3 → T4는 수동으로만)
    for (let tier = 1; tier <= 2; tier++) {
      for (let element = 0; element < 6; element++) {
        const matching = inventory.filter(n => n.tier === tier && n.colorIndex === element);
        count += Math.floor(matching.length / 3);
      }
    }
    return count;
  },

  // T3 조합 가능 여부 확인 (역할 선택 필요)
  getT3CombinableCount(inventory) {
    let count = 0;
    for (let element = 0; element < 6; element++) {
      const matching = inventory.filter(n => n.tier === 3 && n.colorIndex === element);
      count += Math.floor(matching.length / 3);
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
      // T4 특수 능력 정보
      special: tower.special || null,
      role: tower.role || null,
    };
  },

  // 타워 공격 처리 (디버프 + 서포트 버프 + 영구 버프 계산 포함)
  processAttack(tower, enemies, supportTowers, now, gameSpeed, permanentBuffs = {}) {
    const { speedDebuff, damageDebuff } = this.calcDebuffs(tower, enemies);
    const { attackBuff, speedBuff, rangeBuff } = this.calcSupportBuffs(tower, supportTowers || []);
    const isDebuffed = speedDebuff < 1 || damageDebuff < 1;
    const isBuffed = attackBuff > 0 || speedBuff > 0 || rangeBuff > 0;

    // 영구 버프 계산
    const permDamageMult = typeof PermanentBuffManager !== 'undefined'
      ? PermanentBuffManager.getDamageMultiplier(permanentBuffs) : 1;
    const permSpeedMult = typeof PermanentBuffManager !== 'undefined'
      ? PermanentBuffManager.getAttackSpeedMultiplier(permanentBuffs) : 1;
    const permRangeMult = typeof PermanentBuffManager !== 'undefined'
      ? PermanentBuffManager.getRangeMultiplier(permanentBuffs) : 1;
    const critInfo = typeof PermanentBuffManager !== 'undefined'
      ? PermanentBuffManager.getCritInfo(permanentBuffs) : { chance: 0, multiplier: 1 };

    // 쿨다운 체크 (서포트 공속 버프 + 영구 공속 버프 적용)
    const effectiveSpeed = tower.speed / speedDebuff / (1 + speedBuff) / permSpeedMult;
    if (now - tower.lastShot < effectiveSpeed / gameSpeed) {
      return { tower: { ...tower, isDebuffed, isBuffed }, projectile: null };
    }

    // 타겟 찾기 (서포트 사거리 버프 + 영구 사거리 버프 적용)
    const effectiveRange = tower.range * (1 + rangeBuff) * permRangeMult;
    const target = this.findTargetWithRange(tower, enemies, effectiveRange);
    if (!target) {
      return { tower: { ...tower, isDebuffed, isBuffed }, projectile: null };
    }

    // 데미지 계산 (디버프 * 서포트 공격력 버프 * 영구 데미지 버프)
    let effectiveDamage = Math.floor(tower.damage * damageDebuff * (1 + attackBuff) * permDamageMult);

    // 크리티컬 처리
    const isCrit = critInfo.chance > 0 && Math.random() < critInfo.chance;
    if (isCrit) {
      effectiveDamage = Math.floor(effectiveDamage * critInfo.multiplier);
    }

    const projectile = this.createProjectile(tower, target, effectiveDamage, gameSpeed);
    projectile.isCrit = isCrit;  // 크리티컬 여부 전달 (이펙트 표시용)

    return {
      tower: { ...tower, lastShot: now, isDebuffed, isBuffed, effectiveRange },
      projectile,
    };
  },

  // 사거리를 지정하여 타겟 찾기
  findTargetWithRange(tower, enemies, range) {
    let nearestEnemy = null;
    let nearestDist = Infinity;

    enemies.forEach(enemy => {
      const dist = calcDistance(tower.x, tower.y, enemy.x, enemy.y);
      if (dist <= range && dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });

    return nearestEnemy;
  },

  // ===== 서포트 타워 시스템 =====

  // 서포트 타워 생성
  createSupport(tier, supportType) {
    const config = SUPPORT_CONFIG[tier];
    return {
      id: Date.now() + Math.random(),
      tier,
      supportType,
      color: config.colors[supportType],
      name: config.names[supportType],
      range: config.range,
      buffValue: config.values[supportType],
      isSupport: true,
    };
  },

  // 서포트 타워 맵에 배치
  placeSupportOnGrid(support, gridX, gridY) {
    return {
      ...support,
      id: Date.now() + Math.random(),
      gridX,
      gridY,
      x: gridX * TILE_SIZE + TILE_SIZE / 2,
      y: gridY * TILE_SIZE + TILE_SIZE / 2,
    };
  },

  // 서포트 타워 3합 조합 (최대 T3)
  combineSupport(items) {
    if (items.length !== 3) return null;
    const baseTier = items[0].tier;
    const baseSupportType = items[0].supportType;
    const allSame = items.every(t =>
      t.tier === baseTier &&
      t.supportType === baseSupportType &&
      t.isSupport
    );
    if (!allSame || baseTier >= 3) return null; // 최대 T3
    return this.createSupport(baseTier + 1, baseSupportType);
  },

  // 서포트 전체 자동 조합
  combineAllSupport(inventory) {
    let current = [...inventory];
    let combined = true;
    let totalCombines = 0;

    while (combined) {
      combined = false;
      for (let tier = 1; tier <= 2; tier++) { // T3까지만
        for (let supportType = 0; supportType < 4; supportType++) {
          const matching = current.filter(s => s.tier === tier && s.supportType === supportType);
          while (matching.length >= 3) {
            const toRemove = matching.splice(0, 3);
            const idsToRemove = toRemove.map(s => s.id);
            const newSupport = this.createSupport(tier + 1, supportType);
            newSupport.id = Date.now() + Math.random() + totalCombines;
            current = current.filter(s => !idsToRemove.includes(s.id));
            current.push(newSupport);
            combined = true;
            totalCombines++;
          }
        }
      }
    }
    return current;
  },

  // 서포트 조합 가능 세트 수
  getSupportCombinableCount(inventory) {
    let count = 0;
    for (let tier = 1; tier <= 2; tier++) { // T3까지만
      for (let supportType = 0; supportType < 4; supportType++) {
        const matching = inventory.filter(s => s.tier === tier && s.supportType === supportType);
        count += Math.floor(matching.length / 3);
      }
    }
    return count;
  },

  // 공격 타워에 적용되는 서포트 버프 계산 (기존 방식 - 하위 호환)
  calcSupportBuffs(tower, supportTowers) {
    let attackBuff = 0;
    let speedBuff = 0;
    let rangeBuff = 0;

    supportTowers.forEach(support => {
      const dist = calcDistance(tower.x, tower.y, support.x, support.y);
      if (dist > support.range) return;

      switch (support.supportType) {
        case SUPPORT_TYPES.ATTACK:
          attackBuff += support.buffValue;
          break;
        case SUPPORT_TYPES.SPEED:
          speedBuff += support.buffValue;
          break;
        case SUPPORT_TYPES.RANGE:
          rangeBuff += support.buffValue;
          break;
      }
    });

    return {
      attackBuff: Math.min(attackBuff, SUPPORT_CAPS.attack),
      speedBuff: Math.min(speedBuff, SUPPORT_CAPS.speed),
      rangeBuff: Math.min(rangeBuff, SUPPORT_CAPS.range),
    };
  },

  // 타워에 서포트 버프를 StatusEffect로 적용 (새 방식)
  applySupportBuffsAsEffects(tower, supportTowers, now) {
    let updatedTower = { ...tower, statusEffects: [] };

    supportTowers.forEach(support => {
      const dist = calcDistance(tower.x, tower.y, support.x, support.y);
      if (dist > support.range) return;

      switch (support.supportType) {
        case SUPPORT_TYPES.ATTACK:
          updatedTower = StatusEffectSystem.applyToTower(updatedTower, {
            type: 'attackBuff',
            percent: support.buffValue,
            sourceId: support.id,
          }, now);
          break;
        case SUPPORT_TYPES.SPEED:
          updatedTower = StatusEffectSystem.applyToTower(updatedTower, {
            type: 'attackSpeedBuff',
            percent: support.buffValue,
            sourceId: support.id,
          }, now);
          break;
        case SUPPORT_TYPES.RANGE:
          updatedTower = StatusEffectSystem.applyToTower(updatedTower, {
            type: 'rangeBuff',
            percent: support.buffValue,
            sourceId: support.id,
          }, now);
          break;
      }
    });

    return updatedTower;
  },

  // 적에게 적용되는 방어력 감소 (취약도) 계산 (기존 방식 - 하위 호환)
  calcEnemyVulnerability(enemy, supportTowers) {
    let vulnerability = 0;

    supportTowers.forEach(support => {
      if (support.supportType !== SUPPORT_TYPES.DEFENSE) return;
      const dist = calcDistance(enemy.x, enemy.y, support.x, support.y);
      if (dist <= support.range) {
        vulnerability += support.buffValue;
      }
    });

    return Math.min(vulnerability, SUPPORT_CAPS.defense);
  },

  // 적에게 방감 디버프를 StatusEffect로 적용 (새 방식)
  applyVulnerabilityAsEffect(enemy, supportTowers, now) {
    let updatedEnemy = enemy;

    supportTowers.forEach(support => {
      if (support.supportType !== SUPPORT_TYPES.DEFENSE) return;
      const dist = calcDistance(enemy.x, enemy.y, support.x, support.y);
      if (dist <= support.range) {
        updatedEnemy = StatusEffectSystem.apply(updatedEnemy, {
          type: 'vulnerability',
          percent: support.buffValue,
          sourceId: support.id,
        }, now);
      }
    });

    return updatedEnemy;
  },

  // 서포트 판매 가격 계산
  getSupportSellPrice(tier) {
    return Math.floor((ECONOMY.supportBaseValues[tier] || 40) * ECONOMY.sellRefundRate);
  },
};
