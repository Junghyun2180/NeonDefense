// Neon Defense - Game Engine

// 체인 라이트닝 처리
const processChainLightning = (startX, startY, firstTargetId, damage, tier, currentEnemies) => {
  const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC];
  const chainCount = effect.chainCount[tier] || 2;
  const chainRange = effect.chainRange;
  const decay = effect.chainDamageDecay;
  
  const hitEnemies = new Set([firstTargetId]);
  const chains = [];
  let currentDamage = damage;
  let lastX = startX;
  let lastY = startY;
  let lastTarget = currentEnemies.find(e => e.id === firstTargetId);
  
  if (lastTarget) {
    chains.push({
      x1: startX,
      y1: startY,
      x2: lastTarget.x,
      y2: lastTarget.y,
      id: Date.now() + Math.random(),
    });
    lastX = lastTarget.x;
    lastY = lastTarget.y;
  }
  
  const chainDamages = new Map();
  
  for (let i = 0; i < chainCount; i++) {
    currentDamage = Math.floor(currentDamage * decay);
    if (currentDamage < 1) break;
    
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    currentEnemies.forEach(enemy => {
      if (hitEnemies.has(enemy.id)) return;
      const dx = enemy.x - lastX;
      const dy = enemy.y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= chainRange && dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    });
    
    if (nearestEnemy) {
      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, currentDamage);
      chains.push({
        x1: lastX,
        y1: lastY,
        x2: nearestEnemy.x,
        y2: nearestEnemy.y,
        id: Date.now() + Math.random() + i,
      });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    } else {
      break;
    }
  }
  
  return { chains, chainDamages };
};

// 투사체 이동 및 충돌 처리
const processProjectile = (proj, enemies, gameSpeed) => {
  let targetEnemy = enemies.find(e => e.id === proj.targetId);
  
  // 타겟이 없으면 가장 가까운 적 찾기
  if (!targetEnemy) {
    let nearestDist = Infinity;
    enemies.forEach(enemy => {
      const dx = enemy.x - proj.x;
      const dy = enemy.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        targetEnemy = enemy;
      }
    });
  }
  
  if (!targetEnemy) return { projectile: null, hit: null };
  
  const dx = targetEnemy.x - proj.x;
  const dy = targetEnemy.y - proj.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // 충돌 체크: 프로젝타일 속도를 고려하여 overshoot 방지
  if (dist < 15 + proj.speed) {
    return {
      projectile: null,
      hit: {
        enemyId: targetEnemy.id,
        damage: proj.damage,
        element: proj.element,
        tier: proj.tier,
        x: targetEnemy.x,
        y: targetEnemy.y,
        towerX: proj.towerX,
        towerY: proj.towerY,
      },
    };
  }
  
  // 이동 (proj.speed에 이미 gameSpeed 포함)
  const moveStep = Math.min(proj.speed, dist);
  return {
    projectile: {
      ...proj,
      x: proj.x + (dx / dist) * moveStep,
      y: proj.y + (dy / dist) * moveStep,
    },
    hit: null,
  };
};

// 화상 데미지 처리
const processBurnDamage = (enemy, now, gameSpeed) => {
  if (enemy.burnEndTime > now && now >= enemy.burnTickTime) {
    return {
      damage: enemy.burnDamage,
      nextTickTime: now + 500 / gameSpeed,
    };
  }
  return null;
};

// 상태이상 적용
const applyStatusEffect = (enemy, effect, now) => {
  const updatedEnemy = { ...enemy };
  
  switch (effect.type) {
    case 'burn':
      updatedEnemy.burnDamage = effect.damage;
      updatedEnemy.burnEndTime = now + effect.duration;
      updatedEnemy.burnTickTime = now + 500;
      break;
    case 'slow':
      if (effect.percent > enemy.slowPercent || now > enemy.slowEndTime) {
        updatedEnemy.slowPercent = effect.percent;
        updatedEnemy.slowEndTime = now + effect.duration;
      }
      break;
    case 'knockback':
      const path = enemy.pathTiles;
      if (path) {
        const knockbackTiles = Math.floor(effect.distance / TILE_SIZE);
        const newPathIndex = Math.max(0, enemy.pathIndex - knockbackTiles);
        if (newPathIndex < enemy.pathIndex) {
          const newTile = path[newPathIndex];
          updatedEnemy.pathIndex = newPathIndex;
          updatedEnemy.x = newTile.x * TILE_SIZE + TILE_SIZE / 2;
          updatedEnemy.y = newTile.y * TILE_SIZE + TILE_SIZE / 2;
        }
      }
      break;
  }
  
  return updatedEnemy;
};
