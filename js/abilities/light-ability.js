// Neon Defense - 광휘(LIGHT) 속성 Ability
// 정밀 타격 + 처형 보너스 + T4 특수 능력

// ===== 기본 광휘 (T1~T3): 처형 보너스 =====
class ExecuteAbility extends Ability {
  static TYPE = 'execute';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.LIGHT]);
    this.type = ExecuteAbility.TYPE;
  }

  onHit(context) {
    const { hit, target } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 처형 보너스: HP가 임계값 이하면 추가 피해
    if (target) {
      const hpRatio = target.hp / target.maxHp;
      const threshold = this.getTierValue('executeThreshold', 0.2);
      if (hpRatio <= threshold) {
        result.damageModifier = this.getTierValue('executeBonus', 1.5);
        result.visualEffects.push({
          id: Date.now() + Math.random(),
          x: hit.x,
          y: hit.y,
          type: 'execute',
          color: '#FFD700',
        });
      }
    }

    return result;
  }

  getDescription() {
    const threshold = this.getTierValue('executeThreshold', 0.2) * 100;
    const bonus = this.getTierValue('executeBonus', 1.5);
    return `처형 (HP ${threshold}% 이하 시 ${bonus}x 피해)`;
  }
}

// ===== T4 광휘: 파쇄 타격형 =====
class CriticalAbility extends Ability {
  static TYPE = 'critical';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.LIGHT],
      critChance: 0.25,
      critDamage: 2.0,
    });
    this.type = CriticalAbility.TYPE;
  }

  onHit(context) {
    const { hit, target } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 크리티컬 확률
    if (Math.random() < this.config.critChance) {
      result.damageModifier = this.config.critDamage;
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 't4-light-crit',
        color: '#FFD700',
      });
    } else {
      // 크리티컬 실패시에도 처형 보너스 체크
      if (target) {
        const hpRatio = target.hp / target.maxHp;
        const threshold = this.getTierValue('executeThreshold', 0.35);
        if (hpRatio <= threshold) {
          result.damageModifier = this.getTierValue('executeBonus', 2.5);
          result.visualEffects.push({
            id: Date.now() + Math.random(),
            x: hit.x,
            y: hit.y,
            type: 'execute',
            color: '#FFD700',
          });
        } else {
          result.visualEffects.push({
            id: Date.now() + Math.random(),
            x: hit.x,
            y: hit.y,
            type: 't4-light-hit',
            color: '#FFFACD',
          });
        }
      }
    }

    return result;
  }

  getDescription() {
    return `파쇄 타격 (${this.config.critChance * 100}% 크리티컬, ${this.config.critDamage}x 피해)`;
  }
}

// ===== T4 광휘: 넉백 제어형 =====
class LightKnockbackAbility extends Ability {
  static TYPE = 'lightKnockback';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.LIGHT],
      knockbackDistance: 25,
      knockbackSlow: 0.3,
      knockbackSlowDuration: 2000,
    });
    this.type = LightKnockbackAbility.TYPE;
  }

  onHit(context) {
    const { hit, target } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 넉백
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: this.config.knockbackDistance,
    });

    // 슬로우
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'slow',
      percent: this.config.knockbackSlow,
      duration: this.config.knockbackSlowDuration,
    });

    // 처형 보너스도 체크
    if (target) {
      const hpRatio = target.hp / target.maxHp;
      const threshold = this.getTierValue('executeThreshold', 0.35);
      if (hpRatio <= threshold) {
        result.damageModifier = this.getTierValue('executeBonus', 2.5);
        result.visualEffects.push({
          id: Date.now() + Math.random(),
          x: hit.x,
          y: hit.y,
          type: 'execute',
          color: '#FFD700',
        });
      }
    }

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-light-knockback',
      color: '#E6E6FA',
    });

    return result;
  }

  getDescription() {
    return `넉백 제어 (${this.config.knockbackDistance}px 넉백 + ${this.config.knockbackSlow * 100}% 슬로우)`;
  }
}

// ===== T4 광휘: 러시 차단형 =====
class RushBlockerAbility extends Ability {
  static TYPE = 'rushBlocker';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.LIGHT],
      fastEnemyBonus: 0.5,
      fastThreshold: 0.6,
    });
    this.type = RushBlockerAbility.TYPE;
  }

  onHit(context) {
    const { hit, target } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 빠른 적 추가 피해
    if (target && target.baseSpeed > this.config.fastThreshold) {
      result.damageModifier = 1 + this.config.fastEnemyBonus;
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 't4-light-fast',
        color: '#FF69B4',
      });
    }

    // 처형 보너스도 체크
    if (target) {
      const hpRatio = target.hp / target.maxHp;
      const threshold = this.getTierValue('executeThreshold', 0.35);
      if (hpRatio <= threshold) {
        // 빠른 적 보너스와 처형 보너스 중 더 높은 것 적용
        const executeBonus = this.getTierValue('executeBonus', 2.5);
        if (executeBonus > result.damageModifier) {
          result.damageModifier = executeBonus;
          result.visualEffects.push({
            id: Date.now() + Math.random(),
            x: hit.x,
            y: hit.y,
            type: 'execute',
            color: '#FFD700',
          });
        }
      }
    }

    return result;
  }

  getDescription() {
    return `러시 차단 (빠른 적 +${this.config.fastEnemyBonus * 100}% 피해)`;
  }
}
