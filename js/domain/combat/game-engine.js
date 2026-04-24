// Neon Defense - 게임 엔진 (GameEngine)
// 게임 루프 오케스트레이터: 순수 함수로 상태 전환을 관리

const GameEngine = {
  // 체인 라이트닝 처리 (순수 함수)
  processChainLightning(startX, startY, firstTargetId, damage, tier, currentEnemies, chainBonus = 0) {
    const effect = ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC];
    const chainCount = Math.max(1, (effect.chainCount[tier] || 2) + chainBonus);
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

  // 투사체 이동 + 충돌 처리 (성능 최적화: 거리 제곱 사용)
  processProjectiles(projectiles, enemies, gameSpeed) {
    const hits = [];
    const collisionThreshold = COMBAT.collisionRadius + COMBAT.projectileBaseSpeed * gameSpeed;
    const collisionThresholdSq = collisionThreshold * collisionThreshold;

    const updatedProjectiles = projectiles.map(proj => {
      // 타겟 찾기 (원래 타겟만 추적, 없으면 제거)
      const target = enemies.find(e => e.id === proj.targetId);
      if (!target) return null;

      const dx = target.x - proj.x, dy = target.y - proj.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // 충돌 감지 (overshoot 방지, 거리 제곱 비교)
      if (distSq <= collisionThresholdSq) {
        hits.push({
          enemyId: target.id,
          damage: proj.damage,
          element: proj.element,
          tier: proj.tier,
          x: target.x,
          y: target.y,
          towerX: proj.towerX,
          towerY: proj.towerY,
          towerId: proj.towerId,   // 속성 스택 추적
          color: proj.color,
          // T4 특수 능력 정보 전달
          special: proj.special || {},
          role: proj.role || null,
        });
        return null;
      }

      // 이동 (overshoot 방지)
      const moveStep = Math.min(proj.speed, dist);
      return { ...proj, x: proj.x + (dx / dist) * moveStep, y: proj.y + (dy / dist) * moveStep };
    }).filter(Boolean);

    return { updatedProjectiles, hits };
  },

  // 이펙트 클린업

  // 이펙트 클린업
  cleanExpiredEffects(effects, now) {
    return effects.filter(e => now - e.id < COMBAT.effectDuration);
  },

  // ===== 메인 게임 틱 (오케스트레이터) =====
  gameTick(state, now) {
    const { enemies, towers, supportTowers, projectiles, gameSpeed, permanentBuffs = {} } = state;
    const newEffects = [];
    const soundEvents = [];
    let totalLivesLost = 0;
    let totalGoldEarned = 0;
    let totalKilled = 0;

    // 1단계: 적 이동 + 화상 처리
    const burnDamages = new Map();
    let movedEnemies = enemies.map(enemy => {
      // 유효성 검사
      if (!enemy || !enemy.type) {
        console.warn('[GameEngine] Invalid enemy detected, removing:', enemy);
        return null;
      }

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
          if (typeof CollectionSystem !== 'undefined') CollectionSystem.recordEnemyKill(enemy.type);
          return null;
        }
        return { ...enemy, health: newHealth };
      }).filter(Boolean);
    }

    // 목숨 손실 사운드
    if (totalLivesLost > 0) {
      soundEvents.push({ method: 'playLifeLost', args: [] });
    }

    // 1.5단계: 힐러의 주변 적 치유 처리
    const healers = movedEnemies.filter(e => EnemySystem.isHealer(e));
    if (healers.length > 0) {
      const healMap = new Map(); // enemyId -> 최종 체력
      healers.forEach(healer => {
        const { updatedHealer, healedEnemies } = EnemySystem.processHealerHeal(healer, movedEnemies, now);
        // 힐러 상태 업데이트
        const idx = movedEnemies.findIndex(e => e.id === healer.id);
        if (idx !== -1) movedEnemies[idx] = updatedHealer;
        // 치유 적용
        healedEnemies.forEach(({ id, newHealth }) => {
          const current = healMap.get(id) || movedEnemies.find(e => e.id === id)?.health || 0;
          healMap.set(id, Math.max(current, newHealth));
        });
      });
      // 치유 적용 및 이펙트
      if (healMap.size > 0) {
        movedEnemies = movedEnemies.map(enemy => {
          const newHealth = healMap.get(enemy.id);
          if (newHealth && newHealth > enemy.health) {
            newEffects.push({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'heal', color: '#22c55e' });
            return { ...enemy, health: newHealth };
          }
          return enemy;
        });
      }
    }

    // 1.7단계: 보스 패턴 (splitter 분신, regen 자가힐, berserk 속도 증가)
    const bossPatternResults = [];
    const bossEnemies = movedEnemies.filter(e => e.type === 'boss' && e.bossPattern && e.ability);
    for (const boss of bossEnemies) {
      if (typeof boss.ability.onTick !== 'function') continue;
      const r = boss.ability.onTick({ enemy: boss, towers, enemies: movedEnemies, now });
      if (r) bossPatternResults.push(r);
    }
    if (bossPatternResults.length > 0) {
      // 자가 힐 적용
      const healMap = new Map();
      const mutMap = [];
      const spawnList = [];
      const bossVisualFx = [];
      for (const r of bossPatternResults) {
        (r.enemyHeals || []).forEach(h => {
          const id = h.enemyId;
          healMap.set(id, (healMap.get(id) || 0) + h.amount);
        });
        (r.targetMutations || []).forEach(m => mutMap.push(m));
        (r.spawnEnemies || []).forEach(e => spawnList.push(e));
        (r.visualEffects || []).forEach(v => bossVisualFx.push(v));
      }
      if (healMap.size > 0) {
        movedEnemies = movedEnemies.map(e => {
          const heal = healMap.get(e.id);
          if (!heal) return e;
          return { ...e, health: Math.min(e.maxHealth, e.health + heal) };
        });
      }
      if (mutMap.length > 0) {
        movedEnemies = movedEnemies.map(e => {
          const muts = mutMap.filter(m => m.enemyId === e.id);
          if (muts.length === 0) return e;
          let next = e;
          for (const m of muts) if (m.set) next = { ...next, ...m.set };
          return next;
        });
      }
      if (spawnList.length > 0) {
        movedEnemies.push(...spawnList);
      }
      if (bossVisualFx.length > 0) {
        newEffects.push(...bossVisualFx);
      }
    }

    // 2단계: 타워 공격 → 투사체 생성 (서포트 버프 + 영구 버프 적용)
    const attackContext = { enemies: movedEnemies, supportTowers, now, gameSpeed, permanentBuffs };
    const newProjectiles = [];
    const updatedTowers = towers.map(tower => {
      const result = TowerSystem.processAttack(tower, attackContext);
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

    // 4단계: 충돌 효과 해석 (AbilitySystem 사용)
    let newChainLightnings = [];
    if (hits.length > 0) {
      const resolved = AbilitySystem.resolveAllHits(hits, movedEnemies, permanentBuffs);
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

      // 적 상태 직접 변경 요청 적용 (속성 스택 카운터 등)
      if (resolved.targetMutations && resolved.targetMutations.length > 0) {
        movedEnemies = movedEnemies.map(enemy => {
          const muts = resolved.targetMutations.filter(m => m.enemyId === enemy.id);
          if (muts.length === 0) return enemy;
          let next = enemy;
          for (const m of muts) {
            if (m.set) next = { ...next, ...m.set };
          }
          return next;
        });
      }

      // 데미지 적용 (서포트 방감 타워 취약도 포함)
      const splitSpawns = []; // 분열체가 죽으면 여기에 새 적 추가
      if (resolved.damageMap.size > 0) {
        movedEnemies = movedEnemies.map(enemy => {
          let damage = resolved.damageMap.get(enemy.id);
          if (!damage) return enemy;

          // 서포트 타워 방어력 감소 적용 (적이 추가 피해를 받음)
          const vulnerability = TowerSystem.calcEnemyVulnerability(enemy, supportTowers || []);
          damage = Math.floor(damage * (1 + vulnerability));

          const newHealth = enemy.health - damage;
          if (newHealth <= 0) {
            totalKilled++;
            totalGoldEarned += enemy.goldReward || 4;
            if (typeof CollectionSystem !== 'undefined') CollectionSystem.recordEnemyKill(enemy.type);
            newEffects.push({
              id: Date.now() + Math.random(), x: enemy.x, y: enemy.y,
              type: 'explosion', color: EnemySystem.getExplosionColor(enemy),
            });
            soundEvents.push({ method: 'playKill', args: [enemy.type === 'boss'] });

            // 분열체 처리: 죽으면 작은 적 2마리로 분열
            if (EnemySystem.isSplitter(enemy)) {
              const splitChildren = EnemySystem.createSplitEnemies(enemy);
              splitSpawns.push(...splitChildren);
              newEffects.push({
                id: Date.now() + Math.random(), x: enemy.x, y: enemy.y,
                type: 'split', color: '#84cc16',
              });
            }

            return null;
          }
          soundEvents.push({ method: 'playHit', args: [] });
          return { ...enemy, health: newHealth };
        }).filter(Boolean);

        // 분열된 새 적 추가
        if (splitSpawns.length > 0) {
          movedEnemies = [...movedEnemies, ...splitSpawns];
        }
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
