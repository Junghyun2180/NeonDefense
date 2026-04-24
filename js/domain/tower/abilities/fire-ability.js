// Neon Defense - 화염(FIRE) 속성 Ability
// 화상 DoT + T4 특수 능력

// ===== 기본 화염 (T1~T3): 화상 + 3적중마다 범위 폭발 (차별화) =====
class BurnAbility extends Ability {
  static TYPE = 'burn';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE]);
    this.type = BurnAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, enemies = [], permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
      targetMutations: [],
    };

    // 시너지: 화염+슬로우=증폭 화상 (burn duration ×1.5)
    const syn = (typeof SynergySystem !== 'undefined')
      ? SynergySystem.evaluate(ELEMENT_TYPES.FIRE, target)
      : { burnDurationMult: 1.0, tags: [] };

    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);
    const burnDamage = Math.floor(hit.damage * this.getTierValue('burnDamagePercent'));
    const burnDuration = Math.floor(this.getTierValue('burnDuration') * permBurnMult * syn.burnDurationMult);

    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'burn',
      damage: burnDamage,
      duration: burnDuration,
    });

    // 화상 스택: _burnCharge 누적, 3에 도달하면 폭발
    const prevCharge = (target && target._burnCharge) || 0;
    const nextCharge = prevCharge + 1;
    if (nextCharge >= 3) {
      const explosionRadius = 65;
      const explosionDamage = Math.floor(hit.damage * 0.55);
      for (const e of enemies) {
        if (!e || e.id === hit.enemyId) continue;
        const dx = e.x - hit.x, dy = e.y - hit.y;
        if (dx * dx + dy * dy <= explosionRadius * explosionRadius) {
          result.aoeTargets.push({
            enemy: e,
            damage: explosionDamage,
            statusEffects: [{
              enemyId: e.id,
              type: 'burn',
              damage: Math.floor(burnDamage * 0.6),
              duration: burnDuration * 0.5,
            }],
          });
        }
      }
      result.targetMutations.push({ enemyId: hit.enemyId, set: { _burnCharge: 0 } });
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x, y: hit.y,
        type: 'fire-burst',
        color: '#FF4500',
      });
    } else {
      result.targetMutations.push({ enemyId: hit.enemyId, set: { _burnCharge: nextCharge } });
    }

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 'burn',
      color: '#FF6B6B',
    });

    return result;
  }

  getDescription() {
    return `화상 (${this.getTierValue('burnDamagePercent') * 100}% 지속 · 3스택 폭발)`;
  }
}

// ===== T4 화염: 연소 누적형 =====
class BurnStackAbility extends Ability {
  static TYPE = 'burnStack';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE]);
    this.type = BurnStackAbility.TYPE;
  }

  onHit(context) {
    const { hit, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);
    const burnDamage = Math.floor(hit.damage * this.getTierValue('burnDamagePercent'));
    const burnDuration = Math.floor(this.getTierValue('burnDuration') * permBurnMult);

    // 화상 스택 (enemy.js에서 누적 처리)
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'burn',
      damage: burnDamage,
      duration: burnDuration,
      stacking: true, // 스택 가능 플래그
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-fire-stack',
      color: '#FF0000',
    });

    return result;
  }

  getDescription() {
    return '연소 누적 (화상 중첩)';
  }
}

// ===== T4 화염: 확산 연소형 =====
class BurnSpreadAbility extends Ability {
  static TYPE = 'burnSpread';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE],
      spreadCount: 2,
      spreadRadius: 60,
      spreadDamageRatio: 0.5,
      spreadDurationRatio: 0.7,
    });
    this.type = BurnSpreadAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);
    const burnDamage = Math.floor(hit.damage * this.getTierValue('burnDamagePercent'));
    const burnDuration = Math.floor(this.getTierValue('burnDuration') * permBurnMult);

    // 주 대상 화상
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'burn',
      damage: burnDamage,
      duration: burnDuration,
    });

    // 확산 화상
    const spreadCount = this.config.spreadCount;
    const spreadRadius = this.config.spreadRadius;
    let spreadTargets = 0;

    enemies.forEach(enemy => {
      if (enemy.id === hit.enemyId || spreadTargets >= spreadCount) return;
      const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
      if (dist <= spreadRadius) {
        result.statusEffects.push({
          enemyId: enemy.id,
          type: 'burn',
          damage: Math.floor(burnDamage * this.config.spreadDamageRatio),
          duration: burnDuration * this.config.spreadDurationRatio,
        });
        result.visualEffects.push({
          id: Date.now() + Math.random(),
          x: enemy.x,
          y: enemy.y,
          type: 't4-fire-spread',
          color: '#FF4500',
        });
        spreadTargets++;
      }
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-fire-spread',
      color: '#FF4500',
    });

    return result;
  }

  getDescription() {
    return `화상 확산 (주변 ${this.config.spreadCount}체)`;
  }
}

// ===== T4 화염: 고열 압축형 =====
class FastEnemyBonusAbility extends Ability {
  static TYPE = 'fastEnemyBonus';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE],
      fastEnemyBonus: 0.5, // 빠른 적 50% 추가 피해
      fastThreshold: 0.6,  // 기본 속도 0.6 이상이면 빠른 적
    });
    this.type = FastEnemyBonusAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);
    const burnDamage = Math.floor(hit.damage * this.getTierValue('burnDamagePercent'));
    const burnDuration = Math.floor(this.getTierValue('burnDuration') * permBurnMult);

    // 빠른 적 추가 피해
    if (target && target.baseSpeed > this.config.fastThreshold) {
      result.damageModifier = 1 + this.config.fastEnemyBonus;
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 't4-fire-fast',
        color: '#FFD700',
      });
    }

    // 화상 적용
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'burn',
      damage: burnDamage,
      duration: burnDuration,
    });

    return result;
  }

  getDescription() {
    return `고열 압축 (빠른 적 +${this.config.fastEnemyBonus * 100}% 피해)`;
  }
}
