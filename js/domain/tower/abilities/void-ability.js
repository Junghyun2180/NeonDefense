// Neon Defense - 공허(VOID) 속성 Ability
// 관통 공격 + T4 특수 능력

// 관통 공통 로직 — hit 주변 가까운 적 N체에 감쇠 데미지 추가
// fxBuilder(enemy) 가 주어지면 각 관통 대상마다 시각 효과도 push
const applyPierce = (result, hit, enemies, pierceCount, pierceDamageRatio, pierceRange, fxBuilder = null) => {
  const sortedEnemies = enemies
    .filter(e => e.id !== hit.enemyId)
    .map(e => ({ enemy: e, dist: calcDistance(hit.x, hit.y, e.x, e.y) }))
    .filter(e => e.dist <= pierceRange)
    .sort((a, b) => a.dist - b.dist);

  let pierced = 0;
  for (const { enemy } of sortedEnemies) {
    if (pierced >= pierceCount) break;
    result.pierceTargets.push({
      enemy,
      damage: Math.floor(hit.damage * pierceDamageRatio),
    });
    if (fxBuilder) result.visualEffects.push(fxBuilder(enemy));
    pierced++;
  }
};

// ===== 기본 공허 (T1~T3): 관통 =====
class PierceAbility extends Ability {
  static TYPE = 'pierce';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.VOID]);
    this.type = PierceAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, enemies } = context;
    const result = Ability.makeResult();

    // 시너지: 공허+화상=에너지 파열 (pierceRange +40%, damageMult +10%)
    const syn = (typeof SynergySystem !== 'undefined')
      ? SynergySystem.evaluate(ELEMENT_TYPES.VOID, target)
      : { damageMult: 1.0, pierceRangeMult: 1.0, tags: [] };
    result.damageModifier = syn.damageMult;

    const pierceCount = this.getTierValue('pierceCount', 1);
    const pierceDamageDecay = this.getTierValue('pierceDamageDecay', 0.5);
    const pierceRange = this.getTierValue('pierceRange', 80) * syn.pierceRangeMult;

    applyPierce(result, hit, enemies, pierceCount, pierceDamageDecay * syn.damageMult, pierceRange,
      (enemy) => ({ id: Date.now() + Math.random(), x: enemy.x, y: enemy.y, type: 'pierce', color: '#DDA0DD' }),
    );

    if (syn.tags.includes('energy-burst')) {
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x, y: hit.y,
        type: 'energy-burst',
        color: '#C77DFF',
      });
    }

    return result;
  }

  getDescription() {
    return `관통 (${this.getTierValue('pierceCount', 1)}체, ${this.getTierValue('pierceDamageDecay', 0.5) * 100}% 피해)`;
  }
}

// ===== T4 공허: 시너지 촉매형 =====
class SynergyBuffAbility extends Ability {
  static TYPE = 'synergyBuff';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.VOID],
      synergyRadius: 120,
      synergyBuff: 0.1, // 주변 타워 10% 공격력 증가
    });
    this.type = SynergyBuffAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies } = context;
    // towerBuffs: 타워 버프용 추가 필드 (시너지 촉매)
    const result = Ability.makeResult({ towerBuffs: [] });

    // 관통 (T4 기본)
    applyPierce(result, hit, enemies,
      this.getTierValue('pierceCount', 3),
      this.getTierValue('pierceDamageDecay', 0.8),
      this.getTierValue('pierceRange', 100),
    );

    // 시너지 버프 효과 (별도 시스템에서 처리)
    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-void-synergy',
      color: '#8A2BE2',
    });

    return result;
  }

  getDescription() {
    return `시너지 촉매 (주변 타워 +${this.config.synergyBuff * 100}% 공격력)`;
  }
}

// ===== T4 공허: 균형 딜러형 =====
class BalancedAbility extends Ability {
  static TYPE = 'balanced';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.VOID]);
    this.type = BalancedAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies } = context;
    const result = Ability.makeResult();

    // T4 기본 관통
    applyPierce(result, hit, enemies,
      this.getTierValue('pierceCount', 3),
      this.getTierValue('pierceDamageDecay', 0.8),
      this.getTierValue('pierceRange', 100),
    );

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-void-balance',
      color: '#9932CC',
    });

    return result;
  }

  getDescription() {
    return '균형 딜러 (강화된 관통)';
  }
}

// ===== T4 공허: 차원 파열형 =====
class EnhancedPierceAbility extends Ability {
  static TYPE = 'enhancedPierce';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.VOID],
      enhancedPierceCount: 4,
      enhancedPierceRange: 120,
      enhancedPierceDamageRatio: 0.7,
    });
    this.type = EnhancedPierceAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies } = context;
    const result = Ability.makeResult();

    // 강화된 관통
    applyPierce(result, hit, enemies,
      this.config.enhancedPierceCount,
      this.config.enhancedPierceDamageRatio,
      this.config.enhancedPierceRange,
    );

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-void-pierce',
      color: '#4B0082',
    });

    return result;
  }

  getDescription() {
    return `차원 파열 (${this.config.enhancedPierceCount}체 관통, ${this.config.enhancedPierceDamageRatio * 100}% 피해)`;
  }
}
