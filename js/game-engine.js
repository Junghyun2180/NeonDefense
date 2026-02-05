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
          // T4 특수 능력 정보 전달
          special: proj.special || {},
          role: proj.role || null,
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
  resolveHits(hits, currentEnemies, permanentBuffs = {}) {
    const damageMap = new Map();
    const statusEffects = [];
    const visualEffects = [];
    let allChainLightnings = [];
    const chainDamagesAll = new Map();

    // 영구 버프 계산
    // 영구 버프 계산 (BuffHelper 사용)
    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);
    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);
    const permChainBonus = BuffHelper.getChainBonus(permanentBuffs);

    hits.forEach(hit => {
      let finalDamage = hit.damage;
      const special = hit.special || {};
      const isT4 = hit.tier === 4;

      // 크리티컬 이펙트
      if (hit.isCrit) {
        visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'crit', color: '#FFD700' });
      }

      switch (hit.element) {
        case ELEMENT_TYPES.FIRE: {
          const fe = ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE];
          let burnDamage = Math.floor(hit.damage * fe.burnDamagePercent[hit.tier]);
          let burnDuration = Math.floor(fe.burnDuration[hit.tier] * permBurnMult); // 영구 버프 적용

          // T4 화염: 확산 연소형 - 주변 적에게 화상 전파
          if (isT4 && special.burnSpread) {
            const spreadCount = special.spreadCount || 2;
            let spreadTargets = 0;
            currentEnemies.forEach(enemy => {
              if (enemy.id === hit.enemyId || spreadTargets >= spreadCount) return;
              const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
              if (dist <= 60) {
                statusEffects.push({
                  enemyId: enemy.id, type: 'burn',
                  damage: Math.floor(burnDamage * 0.5),
                  duration: burnDuration * 0.7,
                });
                visualEffects.push({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 't4-fire-spread', color: '#FF4500' });
                spreadTargets++;
              }
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-fire-spread', color: '#FF4500' });
          }
          // T4 화염: 고열 압축형 - 빠른 적 추가 피해
          else if (isT4 && special.fastEnemyBonus) {
            const target = currentEnemies.find(e => e.id === hit.enemyId);
            if (target && target.baseSpeed > 0.6) {
              finalDamage = Math.floor(finalDamage * (1 + special.fastEnemyBonus));
              visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-fire-fast', color: '#FFD700' });
            }
          }
          // T4 화염: 연소 누적형 - 이펙트만 (스택은 enemy.js에서 처리 필요)
          else if (isT4 && special.burnStacks) {
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-fire-stack', color: '#FF0000' });
          }

          statusEffects.push({
            enemyId: hit.enemyId, type: 'burn',
            damage: burnDamage,
            duration: burnDuration,
          });
          if (!isT4) {
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'burn', color: '#FF6B6B' });
          }
          break;
        }

        case ELEMENT_TYPES.WATER: {
          const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
          let slowPercent = we.slowPercent[hit.tier] * permSlowMult; // 영구 버프 적용
          let slowDuration = we.slowDuration[hit.tier];

          // T4 냉기: 빙결 제어형 - 스턴 확률
          if (isT4 && special.freezeChance) {
            if (Math.random() < special.freezeChance) {
              statusEffects.push({
                enemyId: hit.enemyId, type: 'freeze',
                duration: special.freezeDuration || 1500,
              });
              visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-ice-freeze', color: '#00FFFF' });
            }
          }
          // T4 냉기: 광역 감속형 - 주변 적 슬로우
          else if (isT4 && special.aoeSlowBonus) {
            currentEnemies.forEach(enemy => {
              if (enemy.id === hit.enemyId) return;
              const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
              if (dist <= 80) {
                statusEffects.push({
                  enemyId: enemy.id, type: 'slow',
                  percent: slowPercent * 0.6,
                  duration: slowDuration * 0.5,
                });
              }
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-ice-aoe', color: '#87CEEB' });
          }
          // T4 냉기: 파동 차단형 - 넉백 추가
          else if (isT4 && special.knockbackBonus) {
            statusEffects.push({
              enemyId: hit.enemyId, type: 'knockback',
              distance: special.knockbackBonus,
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-ice-knockback', color: '#B0E0E6' });
          }

          statusEffects.push({
            enemyId: hit.enemyId, type: 'slow',
            percent: slowPercent,
            duration: slowDuration,
          });
          if (!isT4) {
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'slow', color: '#45B7D1' });
          }
          break;
        }

        case ELEMENT_TYPES.ELECTRIC: {
          let chainBonus = permChainBonus; // 영구 버프 기본 적용
          // T4 전격: 체인 집중형 - 체인 수 증가
          if (isT4 && special.chainBonus) {
            chainBonus = special.chainBonus;
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-elec-chain', color: '#9400D3' });
          }
          // T4 전격: 번개 러너형 - 첫 타격 강화
          if (isT4 && special.firstHitBonus) {
            finalDamage = Math.floor(finalDamage * (1 + special.firstHitBonus));
            chainBonus = special.chainPenalty || 0;
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-elec-first', color: '#FFD700' });
          }

          const { chains, chainDamages } = this.processChainLightning(
            hit.towerX, hit.towerY, hit.enemyId, hit.damage, hit.tier, currentEnemies, chainBonus
          );
          allChainLightnings = allChainLightnings.concat(chains);

          // T4 전격: 과부하 제어형 - 체인 적중 시 스턴
          if (isT4 && special.chainStunChance) {
            chainDamages.forEach((dmg, id) => {
              if (Math.random() < special.chainStunChance) {
                statusEffects.push({
                  enemyId: id, type: 'freeze',
                  duration: special.chainStunDuration || 800,
                });
              }
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-elec-stun', color: '#00CED1' });
          }

          chainDamages.forEach((dmg, id) => {
            chainDamagesAll.set(id, (chainDamagesAll.get(id) || 0) + dmg);
          });
          break;
        }

        case ELEMENT_TYPES.WIND: {
          const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WIND];
          finalDamage = Math.floor(hit.damage * we.damageMultiplier[hit.tier]);
          let knockbackDist = we.knockbackDistance[hit.tier];

          // T4 질풍: 광역 분쇄형 - 범위 피해
          if (isT4 && special.aoeDamage) {
            const aoeRadius = special.aoeRadius || 50;
            currentEnemies.forEach(enemy => {
              if (enemy.id === hit.enemyId) return;
              const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
              if (dist <= aoeRadius) {
                const aoeDmg = Math.floor(finalDamage * 0.5);
                damageMap.set(enemy.id, (damageMap.get(enemy.id) || 0) + aoeDmg);
              }
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-wind-aoe', color: '#32CD32', radius: aoeRadius });
          }
          // T4 질풍: 흡인 제어형 - 적 끌어당김
          else if (isT4 && special.pullEnemies) {
            currentEnemies.forEach(enemy => {
              if (enemy.id === hit.enemyId) return;
              const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
              if (dist <= 100 && dist > 20) {
                statusEffects.push({
                  enemyId: enemy.id, type: 'pull',
                  targetX: hit.x, targetY: hit.y,
                  distance: special.pullDistance || 30,
                });
              }
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-wind-pull', color: '#9370DB' });
          }
          // T4 질풍: 돌풍 타격형 - 넉백 강화 + 보스 추가 피해
          else if (isT4 && special.knockbackBonus) {
            knockbackDist += special.knockbackBonus;
            const target = currentEnemies.find(e => e.id === hit.enemyId);
            if (target && target.type === 'boss' && special.bossBonus) {
              finalDamage = Math.floor(finalDamage * (1 + special.bossBonus));
            }
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-wind-gust', color: '#00FF7F' });
          }

          statusEffects.push({
            enemyId: hit.enemyId, type: 'knockback',
            distance: knockbackDist,
          });
          if (!isT4) {
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'knockback', color: '#96E6A1' });
          }
          break;
        }

        case ELEMENT_TYPES.VOID: {
          const ve = ELEMENT_EFFECTS[ELEMENT_TYPES.VOID];

          // T4 공허: 시너지 촉매형 - 주변 타워 버프 (별도 시스템 필요)
          if (isT4 && special.synergyBuff) {
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-void-synergy', color: '#8A2BE2' });
          }
          // T4 공허: 차원 파열형 - 강화된 관통
          else if (isT4 && special.piercing) {
            let pierceCount = special.pierceCount || 3;
            let pierced = 0;
            const sortedEnemies = currentEnemies
              .filter(e => e.id !== hit.enemyId)
              .map(e => ({ enemy: e, dist: calcDistance(hit.x, hit.y, e.x, e.y) }))
              .filter(e => e.dist <= 120)
              .sort((a, b) => a.dist - b.dist);

            sortedEnemies.forEach(({ enemy }) => {
              if (pierced >= pierceCount) return;
              const pierceDmg = Math.floor(finalDamage * 0.7);
              damageMap.set(enemy.id, (damageMap.get(enemy.id) || 0) + pierceDmg);
              pierced++;
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-void-pierce', color: '#4B0082' });
          }
          // T4 공허: 균형 딜러형 - 기본 (관통 포함)
          else if (isT4) {
            // T4 기본형도 관통 적용
            const pierceCount = ve.pierceCount[4];
            const pierceDamageDecay = ve.pierceDamageDecay[4];
            let pierced = 0;
            const sortedEnemies = currentEnemies
              .filter(e => e.id !== hit.enemyId)
              .map(e => ({ enemy: e, dist: calcDistance(hit.x, hit.y, e.x, e.y) }))
              .filter(e => e.dist <= 100)
              .sort((a, b) => a.dist - b.dist);

            sortedEnemies.forEach(({ enemy }) => {
              if (pierced >= pierceCount) return;
              const pierceDmg = Math.floor(finalDamage * pierceDamageDecay);
              damageMap.set(enemy.id, (damageMap.get(enemy.id) || 0) + pierceDmg);
              pierced++;
            });
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-void-balance', color: '#9932CC' });
          }
          // T1~T3 공허: 관통 공격
          else {
            const pierceCount = ve.pierceCount[hit.tier];
            const pierceDamageDecay = ve.pierceDamageDecay[hit.tier];
            let pierced = 0;
            const sortedEnemies = currentEnemies
              .filter(e => e.id !== hit.enemyId)
              .map(e => ({ enemy: e, dist: calcDistance(hit.x, hit.y, e.x, e.y) }))
              .filter(e => e.dist <= 80)
              .sort((a, b) => a.dist - b.dist);

            sortedEnemies.forEach(({ enemy }) => {
              if (pierced >= pierceCount) return;
              const pierceDmg = Math.floor(finalDamage * pierceDamageDecay);
              damageMap.set(enemy.id, (damageMap.get(enemy.id) || 0) + pierceDmg);
              visualEffects.push({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'pierce', color: '#DDA0DD' });
              pierced++;
            });
          }
          break;
        }

        case ELEMENT_TYPES.LIGHT: {
          const le = ELEMENT_EFFECTS[ELEMENT_TYPES.LIGHT];
          const target = currentEnemies.find(e => e.id === hit.enemyId);

          // T4 광휘: 파쇄 타격형 - 크리티컬
          if (isT4 && special.critChance) {
            if (Math.random() < special.critChance) {
              finalDamage = Math.floor(finalDamage * (special.critDamage || 2.0));
              visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-light-crit', color: '#FFD700' });
            } else {
              visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-light-hit', color: '#FFFACD' });
            }
          }
          // T4 광휘: 넉백 제어형 - 넉백 + 슬로우
          else if (isT4 && special.knockbackBonus) {
            statusEffects.push({
              enemyId: hit.enemyId, type: 'knockback',
              distance: special.knockbackBonus,
            });
            if (special.knockbackSlow) {
              statusEffects.push({
                enemyId: hit.enemyId, type: 'slow',
                percent: special.knockbackSlow,
                duration: 2000,
              });
            }
            visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-light-knockback', color: '#E6E6FA' });
          }
          // T4 광휘: 러시 차단형 - 빠른 적 보너스
          else if (isT4 && special.fastEnemyBonus) {
            if (target && target.baseSpeed > 0.6) {
              finalDamage = Math.floor(finalDamage * (1 + special.fastEnemyBonus));
              visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-light-fast', color: '#FF69B4' });
            }
          }
          // T4 기본 (정밀 타격 포함)
          else if (isT4) {
            // 처형 보너스: HP가 임계값 이하면 추가 피해
            if (target) {
              const hpRatio = target.hp / target.maxHp;
              const threshold = le.executeThreshold[4];
              if (hpRatio <= threshold) {
                finalDamage = Math.floor(finalDamage * le.executeBonus[4]);
                visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'execute', color: '#FFD700' });
              } else {
                visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 't4-light-hit', color: '#FFFACD' });
              }
            }
          }
          // T1~T3 광휘: 정밀 타격 (HP 낮은 적 처형 보너스)
          else {
            if (target) {
              const hpRatio = target.hp / target.maxHp;
              const threshold = le.executeThreshold[hit.tier];
              if (hpRatio <= threshold) {
                finalDamage = Math.floor(finalDamage * le.executeBonus[hit.tier]);
                visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'execute', color: '#FFD700' });
              }
            }
          }
          break;
        }
      }

      damageMap.set(hit.enemyId, (damageMap.get(hit.enemyId) || 0) + finalDamage);
      if (!isT4) {
        visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'hit', color: hit.color });
      }
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
    const { enemies, towers, supportTowers, projectiles, gameSpeed, permanentBuffs = {} } = state;
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
