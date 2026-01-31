// Neon Defense - Tower Logic

// 새 타워 생성
const createTower = (tier, colorIndex) => {
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
};

// 타워 배치
const placeTower = (tower, gridX, gridY) => {
  return {
    ...tower,
    gridX,
    gridY,
    x: gridX * TILE_SIZE + TILE_SIZE / 2,
    y: gridY * TILE_SIZE + TILE_SIZE / 2,
  };
};

// 타워 조합 (3개 -> 1개 상위 티어)
const combineTowers = (towers) => {
  if (towers.length !== 3) return null;
  
  const baseTier = towers[0].tier;
  const baseColorIndex = towers[0].colorIndex;
  
  // 같은 티어, 같은 속성인지 확인
  const allSame = towers.every(t => t.tier === baseTier && t.colorIndex === baseColorIndex);
  if (!allSame || baseTier >= 4) return null;
  
  const nextTier = baseTier + 1;
  return createTower(nextTier, baseColorIndex);
};

// 타워 공격 처리 (디버프 적용)
const processTowerAttack = (tower, enemies, now, gameSpeed, jammerEnemies, suppressorEnemies) => {
  // 디버프 계산
  let speedDebuff = 1;
  let damageDebuff = 1;
  
  // 방해자 효과: 공격속도 -50%
  jammerEnemies.forEach(jammer => {
    const dx = jammer.x - tower.x;
    const dy = jammer.y - tower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= (jammer.debuffRange || 80)) {
      speedDebuff = Math.max(speedDebuff * 0.5, 0.3);
    }
  });
  
  // 억제자 효과: 공격력 -40%
  suppressorEnemies.forEach(suppressor => {
    const dx = suppressor.x - tower.x;
    const dy = suppressor.y - tower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= (suppressor.debuffRange || 80)) {
      damageDebuff = Math.max(damageDebuff * 0.6, 0.3);
    }
  });
  
  // 쿨다운 체크
  const effectiveSpeed = tower.speed / speedDebuff;
  if (now - tower.lastShot < effectiveSpeed / gameSpeed) {
    return { tower: { ...tower, isDebuffed: speedDebuff < 1 || damageDebuff < 1 }, projectile: null };
  }
  
  // 가장 가까운 적 찾기
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  enemies.forEach(enemy => {
    const dx = enemy.x - tower.x;
    const dy = enemy.y - tower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= tower.range && dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  });
  
  if (nearestEnemy) {
    const effectiveDamage = Math.floor(tower.damage * damageDebuff);
    
    const projectile = {
      id: Date.now() + Math.random(),
      x: tower.x,
      y: tower.y,
      targetId: nearestEnemy.id,
      damage: effectiveDamage,
      color: tower.color,
      speed: 10 * gameSpeed,
      element: tower.element,
      tier: tower.tier,
      towerX: tower.x,
      towerY: tower.y,
      isDebuffed: damageDebuff < 1,
    };
    
    return {
      tower: { ...tower, lastShot: now, isDebuffed: speedDebuff < 1 || damageDebuff < 1 },
      projectile,
    };
  }
  
  return { tower: { ...tower, isDebuffed: speedDebuff < 1 || damageDebuff < 1 }, projectile: null };
};

// 속성 효과 적용
const applyElementEffect = (element, tier, enemy, damage, now) => {
  const effects = [];
  
  switch (element) {
    case ELEMENT_TYPES.FIRE: {
      const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE];
      const burnDamage = Math.floor(damage * effect.burnDamagePercent[tier]);
      effects.push({
        type: 'burn',
        enemyId: enemy.id,
        damage: burnDamage,
        duration: effect.burnDuration[tier],
      });
      break;
    }
    case ELEMENT_TYPES.WATER: {
      const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
      effects.push({
        type: 'slow',
        enemyId: enemy.id,
        percent: effect.slowPercent[tier],
        duration: effect.slowDuration[tier],
      });
      break;
    }
    case ELEMENT_TYPES.WIND: {
      const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.WIND];
      effects.push({
        type: 'knockback',
        enemyId: enemy.id,
        distance: effect.knockbackDistance[tier],
      });
      break;
    }
  }
  
  return effects;
};
