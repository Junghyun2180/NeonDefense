// Neon Defense - 화염(FIRE) 속성 Ability
// 화상 DoT + T4 특수 능력

// ===== 기본 화염 (T1~T3): 화상 =====
class BurnAbility extends Ability {
  static TYPE = 'burn';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.FIRE]);
    this.type = BurnAbility.TYPE;
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
    const permBurnMult = BuffHelper.getBurnDurationMultiplier(permanentBuffs);

    const burnDamage = Math.floor(hit.damage * this.getTierValue('burnDamagePercent'));
    const burnDuration = Math.floor(this.getTierValue('burnDuration') * permBurnMult);

    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'burn',
      damage: burnDamage,
      duration: burnDuration,
    });

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
    return `화상 (${this.getTierValue('burnDamagePercent') * 100}% 지속 피해)`;
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
