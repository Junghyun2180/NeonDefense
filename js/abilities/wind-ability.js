// Neon Defense - 질풍(WIND) 속성 Ability
// 고데미지 + 넉백 + T4 특수 능력

// ===== 기본 질풍 (T1~T3): 고데미지 + 넉백 =====
class WindAbility extends Ability {
  static TYPE = 'wind';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.WIND]);
    this.type = WindAbility.TYPE;
  }

  onHit(context) {
    const { hit } = context;
    const result = {
      damageModifier: this.getTierValue('damageMultiplier', 1.0),
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const knockbackDist = this.getTierValue('knockbackDistance', 15);

    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: knockbackDist,
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 'knockback',
      color: '#96E6A1',
    });

    return result;
  }

  getDescription() {
    return `질풍 (${this.getTierValue('damageMultiplier', 1.0)}x 피해 + 넉백)`;
  }
}

// ===== T4 질풍: 광역 분쇄형 =====
class AoeDamageAbility extends Ability {
  static TYPE = 'aoeDamage';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WIND],
      aoeRadius: 50,
      aoeDamageRatio: 0.5,
    });
    this.type = AoeDamageAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies } = context;
    const result = {
      damageModifier: this.getTierValue('damageMultiplier', 1.0),
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const knockbackDist = this.getTierValue('knockbackDistance', 15);
    const baseDamage = Math.floor(hit.damage * this.getTierValue('damageMultiplier', 1.0));

    // 주 대상 넉백
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: knockbackDist,
    });

    // 광역 피해
    enemies.forEach(enemy => {
      if (enemy.id === hit.enemyId) return;
      const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
      if (dist <= this.config.aoeRadius) {
        result.aoeTargets.push({
          enemy: enemy,
          damage: Math.floor(baseDamage * this.config.aoeDamageRatio),
          statusEffects: [],
        });
      }
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-wind-aoe',
      color: '#32CD32',
      radius: this.config.aoeRadius,
    });

    return result;
  }

  getDescription() {
    return `광역 분쇄 (반경 ${this.config.aoeRadius}px, ${this.config.aoeDamageRatio * 100}% 피해)`;
  }
}

// ===== T4 질풍: 흡인 제어형 =====
class PullAbility extends Ability {
  static TYPE = 'pull';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WIND],
      pullRadius: 100,
      pullDistance: 30,
      pullMinDist: 20,
    });
    this.type = PullAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies } = context;
    const result = {
      damageModifier: this.getTierValue('damageMultiplier', 1.0),
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const knockbackDist = this.getTierValue('knockbackDistance', 15);

    // 주 대상 넉백
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: knockbackDist,
    });

    // 주변 적 끌어당김
    enemies.forEach(enemy => {
      if (enemy.id === hit.enemyId) return;
      const dist = calcDistance(hit.x, hit.y, enemy.x, enemy.y);
      if (dist <= this.config.pullRadius && dist > this.config.pullMinDist) {
        result.statusEffects.push({
          enemyId: enemy.id,
          type: 'pull',
          targetX: hit.x,
          targetY: hit.y,
          distance: this.config.pullDistance,
        });
      }
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-wind-pull',
      color: '#9370DB',
    });

    return result;
  }

  getDescription() {
    return `흡인 (반경 ${this.config.pullRadius}px 끌어당김)`;
  }
}

// ===== T4 질풍: 돌풍 타격형 =====
class GustAbility extends Ability {
  static TYPE = 'gust';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.WIND],
      knockbackBonus: 15,
      bossBonus: 0.3, // 보스 30% 추가 피해
    });
    this.type = GustAbility.TYPE;
  }

  onHit(context) {
    const { hit, target } = context;
    const result = {
      damageModifier: this.getTierValue('damageMultiplier', 1.0),
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const baseKnockback = this.getTierValue('knockbackDistance', 15);
    const knockbackDist = baseKnockback + this.config.knockbackBonus;

    // 보스 추가 피해
    if (target && target.type === 'boss') {
      result.damageModifier *= (1 + this.config.bossBonus);
    }

    // 강화된 넉백
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'knockback',
      distance: knockbackDist,
    });

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-wind-gust',
      color: '#00FF7F',
    });

    return result;
  }

  getDescription() {
    return `돌풍 (넉백 +${this.config.knockbackBonus}px, 보스 +${this.config.bossBonus * 100}% 피해)`;
  }
}
