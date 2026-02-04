// Neon Defense - 냉기(WATER) 속성 Ability
// 슬로우 + T4 빙결/광역 슬로우/넉백

// ===== 기본 냉기 (T1~T3): 슬로우 =====
class SlowAbility extends Ability {
  static TYPE = 'slow';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.WATER]);
    this.type = SlowAbility.TYPE;
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

    // 영구 버프 적용
    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);

    const slowPercent = this.getTierValue('slowPercent') * permSlowMult;
    const slowDuration = this.getTierValue('slowDuration');

    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'slow',
      percent: slowPercent,
      duration: slowDuration,
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 'slow',
      color: '#45B7D1',
    });

    return result;
  }

  getDescription() {
    return `슬로우 (${this.getTierValue('slowPercent') * 100}% 감속)`;
  }
}

// ===== T4 냉기: 빙결 제어형 =====
class FreezeChanceAbility extends Ability {
  static TYPE = 'freezeChance';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WATER],
      freezeChance: 0.25,
      freezeDuration: 1500,
    });
    this.type = FreezeChanceAbility.TYPE;
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

    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);
    const slowPercent = this.getTierValue('slowPercent') * permSlowMult;
    const slowDuration = this.getTierValue('slowDuration');

    // 빙결 확률
    if (Math.random() < this.config.freezeChance) {
      result.statusEffects.push({
        enemyId: hit.enemyId,
        type: 'freeze',
        duration: this.config.freezeDuration,
      });
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 't4-ice-freeze',
        color: '#00FFFF',
      });
    } else {
      // 빙결 실패시 슬로우
      result.statusEffects.push({
        enemyId: hit.enemyId,
        type: 'slow',
        percent: slowPercent,
        duration: slowDuration,
      });
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 't4-ice-freeze',
        color: '#00FFFF',
      });
    }

    return result;
  }

  getDescription() {
    return `빙결 (${this.config.freezeChance * 100}% 확률)`;
  }
}

// ===== T4 냉기: 광역 감속형 =====
class AoeSlowAbility extends Ability {
  static TYPE = 'aoeSlow';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WATER],
      aoeRadius: 80,
      aoeSlowRatio: 0.6,
      aoeDurationRatio: 0.5,
    });
    this.type = AoeSlowAbility.TYPE;
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

    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);
    const slowPercent = this.getTierValue('slowPercent') * permSlowMult;
    const slowDuration = this.getTierValue('slowDuration');

    // 주 대상 슬로우
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'slow',
      percent: slowPercent,
      duration: slowDuration,
    });

    // 광역 슬로우
    enemies.forEach(enemy => {
      if (enemy.id === hit.enemyId) return;
      const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
      if (dist <= this.config.aoeRadius) {
        result.statusEffects.push({
          enemyId: enemy.id,
          type: 'slow',
          percent: slowPercent * this.config.aoeSlowRatio,
          duration: slowDuration * this.config.aoeDurationRatio,
        });
      }
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-ice-aoe',
      color: '#87CEEB',
    });

    return result;
  }

  getDescription() {
    return `광역 슬로우 (반경 ${this.config.aoeRadius}px)`;
  }
}

// ===== T4 냉기: 파동 차단형 =====
class SlowKnockbackAbility extends Ability {
  static TYPE = 'slowKnockback';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WATER],
      knockbackDistance: 25,
    });
    this.type = SlowKnockbackAbility.TYPE;
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

    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);
    const slowPercent = this.getTierValue('slowPercent') * permSlowMult;
    const slowDuration = this.getTierValue('slowDuration');

    // 슬로우
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'slow',
      percent: slowPercent,
      duration: slowDuration,
    });

    // 넉백
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: this.config.knockbackDistance,
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-ice-knockback',
      color: '#B0E0E6',
    });

    return result;
  }

  getDescription() {
    return `파동 차단 (슬로우 + 넉백 ${this.config.knockbackDistance}px)`;
  }
}
