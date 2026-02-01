// Neon Defense - 게임 엔진 (GameEngine)
// 게임 루프 오케스트레이터: 순수 함수로 상태 전환을 관리

const GameEngine = {
  // 체인 라이트닝 처리 (순수 함수)
  processChainLightning(startX, startY, firstTargetId, damage, tier, currentEnemies) {
    const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC];
    const chainCount = effect.chainCount[tier] || 2;
    const chainRange = effect.chainRange;
    const decay = effect.chainDamageDecay;

    const hitEnemies = new Set([firstTargetId]);
    const chains = [];
    let currentDamage = damage;
    let lastX = startX, lastY = startY;
    const lastTarget = currentEnemies.find(e => e.id === firstTargetId);

    if (lastTarget) {
      chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
      lastX = lastTarget.x;
      lastY = lastTarget.y;
    }

    const chainDamages = new Map();

    for (let i = 1; i < chainCount; i++) {
      currentDamage *= decay;
      if (currentDamage < 1) break;

      let nearestEnemy = null;
      let nearestDist = Infinity;

      currentEnemies.forEach(enemy => {
        if (hitEnemies.has(enemy.id)) return;
        const dist = calcDistance(lastX, lastY, enemy.x, enemy.y);
        if (dist <= chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
      chains.push({
        x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y,
        id: Date.now() + Math.random() + i,
      });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    }

    return { chains, chainDamages };
  },

  // 투사체 이동 + 충돌 처리
  processProjectiles(projectiles, enemies, gameSpeed) {
    const hits = [];

    const updatedProjectiles = projectiles.map(proj => {
      // 타겟 찾기 (기존 타겟 또는 가장 가까운 적)
      let target = enemies.find(e => e.id === proj.targetId);
      if (!target) {
        let nearestDist = Infinity;
        enemies.forEach(enemy => {
          const dist = calcDistance(proj.x, proj.y, enemy.x, enemy.y);
          if (dist < nearestDist) { nearestDist = dist; target = enemy; }
        });
      }
      if (!target) return null;

      const dist = calcDistance(proj.x, proj.y, target.x, target.y);

      // 충돌 감지 (overshoot 방지)
      if (dist <= COMBAT.collisionRadius + proj.speed) {
        hits.push({
          enemyId: target.id,
          damage: proj.damage,
          element: proj.element,
          tier: proj.tier,
          x: target.x,
          y: target.y,
          towerX: proj.towerX,
          towerY: proj.towerY,
          color: proj.color,
        });
        return null;
      }

      // 이동 (overshoot 방지)
      const moveStep = Math.min(proj.speed, dist);
      const dx = target.x - proj.x, dy = target.y - proj.y;
      return { ...proj, x: proj.x + (dx / dist) * moveStep, y: proj.y + (dy / dist) * moveStep };
    }).filter(Boolean);

    return { updatedProjectiles, hits };
  },

  // 충돌 효과 해석 — 데미지, 상태이상, 시각 효과, 체인 데이터 분리
  resolveHits(hits, currentEnemies) {
    const damageMap = new Map();
    const statusEffects = [];
    const visualEffects = [];
    let allChainLightnings = [];
    const chainDamagesAll = new Map();

    hits.forEach(hit => {
      let finalDamage = hit.damage;

      switch (hit.element) {
        case ELEMENT_TYPES.FIRE: {
          const fe = ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE];
          statusEffects.push({
            enemyId: hit.enemyId, type: 'burn',
            damage: Math.floor(hit.damage * fe.burnDamagePercent[hit.tier]),
            duration: fe.burnDuration[hit.tier],
          });
          visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'burn', color: '#FF6B6B' });
          break;
        }
        case ELEMENT_TYPES.WATER: {
          const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
          statusEffects.push({
            enemyId: hit.enemyId, type: 'slow',
            percent: we.slowPercent[hit.tier],
            duration: we.slowDuration[hit.tier],
          });
          visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'slow', color: '#45B7D1' });
          break;
        }
        case ELEMENT_TYPES.ELECTRIC: {
          const { chains, chainDamages } = this.processChainLightning(
            hit.towerX, hit.towerY, hit.enemyId, hit.damage, hit.tier, currentEnemies
          );
          allChainLightnings = allChainLightnings.concat(chains);
          chainDamages.forEach((dmg, id) => {
            chainDamagesAll.set(id, (chainDamagesAll.get(id) || 0) + dmg);
          });
          break;
        }
        case ELEMENT_TYPES.WIND: {
          const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WIND];
          finalDamage = Math.floor(hit.damage * we.damageMultiplier[hit.tier]);
          statusEffects.push({
            enemyId: hit.enemyId, type: 'knockback',
            distance: we.knockbackDistance[hit.tier],
          });
          visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'knockback', color: '#96E6A1' });
          break;
        }
      }

      damageMap.set(hit.enemyId, (damageMap.get(hit.enemyId) || 0) + finalDamage);
      visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'hit', color: hit.color });
    });

    // 체인 데미지 병합
    chainDamagesAll.forEach((dmg, id) => {
      damageMap.set(id, (damageMap.get(id) || 0) + dmg);
    });

    return { damageMap, statusEffects, visualEffects, chainLightnings: allChainLightnings };
  },

  // 이펙트 클린업
  cleanExpiredEffects(effects, now) {
    return effects.filter(e => now - e.id < COMBAT.effectDuration);
  },

  // ===== 메인 게임 틱 (오케스트레이터) =====
  gameTick(state, now) {
    const { enemies, towers, projectiles, gameSpeed } = state;
    const newEffects = [];
    const soundEvents = [];
    let totalLivesLost = 0;
    let totalGoldEarned = 0;
    let totalKilled = 0;

    // 1단계: 적 이동 + 화상 처리
    const burnDamages = new Map();
    let movedEnemies = enemies.map(enemy => {
      const moveResult = EnemySystem.move(enemy, gameSpeed, now);
      if (!moveResult.enemy) {
        totalLivesLost += moveResult.livesLost;
        return null;
      }

      // 화상 데미지 체크
      const burnResult = EnemySystem.processBurn(moveResult.enemy, now, gameSpeed);
      if (burnResult) {
        burnDamages.set(moveResult.enemy.id, burnResult.damage);
        return burnResult.updatedEnemy;
      }
      return moveResult.enemy;
    }).filter(Boolean);

    // 화상 데미지 적용
    if (burnDamages.size > 0) {
      movedEnemies = movedEnemies.map(enemy => {
        const damage = burnDamages.get(enemy.id);
        if (!damage) return enemy;
        const newHealth = enemy.health - damage;
        if (newHealth <= 0) {
          totalKilled++;
          totalGoldEarned += enemy.goldReward || 4;
          newEffects.push({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'explosion', color: '#FF6B6B' });
          return null;
        }
        return { ...enemy, health: newHealth };
      }).filter(Boolean);
    }

    // 목숨 손실 사운드
    if (totalLivesLost > 0) {
      soundEvents.push({ method: 'playLifeLost', args: [] });
    }

    // 2단계: 타워 공격 → 투사체 생성
    const newProjectiles = [];
    const updatedTowers = towers.map(tower => {
      const result = TowerSystem.processAttack(tower, movedEnemies, now, gameSpeed);
      if (result.projectile) {
        newProjectiles.push(result.projectile);
        if (Math.random() < COMBAT.shootSoundChance) {
          soundEvents.push({ method: 'playShoot', args: [tower.element] });
        }
      }
      return result.tower;
    });

    // 3단계: 투사체 처리 (이동 + 충돌)
    const allProjectiles = [...projectiles, ...newProjectiles];
    const { updatedProjectiles, hits } = this.processProjectiles(allProjectiles, movedEnemies, gameSpeed);

    // 4단계: 충돌 효과 해석
    let newChainLightnings = [];
    if (hits.length > 0) {
      const resolved = this.resolveHits(hits, movedEnemies);
      newEffects.push(...resolved.visualEffects);
      newChainLightnings = resolved.chainLightnings;

      // 상태이상 적용
      if (resolved.statusEffects.length > 0) {
        movedEnemies = movedEnemies.map(enemy => {
          const effects = resolved.statusEffects.filter(e => e.enemyId === enemy.id);
          let updatedEnemy = enemy;
          effects.forEach(effect => {
            updatedEnemy = EnemySystem.applyStatusEffect(updatedEnemy, effect, now);
          });
          return updatedEnemy;
        });
      }

      // 데미지 적용
      if (resolved.damageMap.size > 0) {
        movedEnemies = movedEnemies.map(enemy => {
          const damage = resolved.damageMap.get(enemy.id);
          if (!damage) return enemy;
          const newHealth = enemy.health - damage;
          if (newHealth <= 0) {
            totalKilled++;
            totalGoldEarned += enemy.goldReward || 4;
            newEffects.push({
              id: Date.now() + Math.random(), x: enemy.x, y: enemy.y,
              type: 'explosion', color: EnemySystem.getExplosionColor(enemy),
            });
            soundEvents.push({ method: 'playKill', args: [enemy.type === 'boss'] });
            return null;
          }
          soundEvents.push({ method: 'playHit', args: [] });
          return { ...enemy, health: newHealth };
        }).filter(Boolean);
      }
    }

    return {
      enemies: movedEnemies,
      towers: updatedTowers,
      projectiles: updatedProjectiles,
      newEffects,
      newChainLightnings,
      goldEarned: totalGoldEarned,
      livesLost: totalLivesLost,
      killedCount: totalKilled,
      soundEvents,
    };
  },
};
