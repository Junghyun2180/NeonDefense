// Neon Defense - Ability 기본 클래스
// 타워의 공격 로직을 모듈화하여 확장성 개선
// StatusEffect 패턴을 참고한 다형성 기반 설계

// ===== Ability 기본 클래스 =====
class Ability {
  static TYPE = 'base';

  constructor(tier, config = {}) {
    this.tier = tier;
    this.config = config;
    this.type = this.constructor.TYPE;
  }

  /**
   * 투사체가 적에게 명중했을 때 호출
   * @param {Object} context - { hit, target, enemies, permanentBuffs, now }
   *   - hit: 명중 정보 (damage, tower, projectile 등)
   *   - target: 피격 대상 (적)
   *   - enemies: 모든 적 배열 (체인/광역용)
   *   - permanentBuffs: 영구 버프 객체
   *   - now: 현재 시간
   * @returns {Object} 처리 결과
   */
  onHit(context) {
    return {
      damageModifier: 1.0,      // 데미지 배율
      additionalDamage: 0,      // 추가 데미지
      statusEffects: [],        // 적용할 상태이상 배열 [{ target, effect }]
      visualEffects: [],        // 시각 효과 배열 [{ type, x, y, ... }]
      aoeTargets: [],           // 광역 대상 [{ enemy, damage, statusEffects }]
      chainData: null,          // 체인 라이트닝 데이터 { targets, damages }
      pierceTargets: [],        // 관통 대상 [{ enemy, damage }]
    };
  }

  /**
   * 티어별 설정값 조회
   * @param {string} key - 설정 키
   * @param {*} defaultValue - 기본값
   */
  getTierValue(key, defaultValue = 0) {
    const tierConfig = this.config[key];
    if (!tierConfig) return defaultValue;
    return tierConfig[this.tier] ?? defaultValue;
  }

  /**
   * 사거리 내 적 필터링 유틸리티
   */
  getEnemiesInRange(x, y, range, enemies, excludeIds = []) {
    return enemies.filter(e => {
      if (excludeIds.includes(e.id)) return false;
      const dist = Math.sqrt((e.x - x) ** 2 + (e.y - y) ** 2);
      return dist <= range;
    });
  }

  /**
   * 능력 설명 (UI용)
   */
  getDescription() {
    return '기본 공격';
  }
}

// ===== Ability 팩토리 =====
const Abilities = {
  // 화염 계열
  burn: (tier) => new BurnAbility(tier),
  burnStack: (tier) => new BurnStackAbility(tier),
  burnSpread: (tier) => new BurnSpreadAbility(tier),
  fastEnemyBonus: (tier) => new FastEnemyBonusAbility(tier),

  // 냉기 계열
  slow: (tier) => new SlowAbility(tier),
  freezeChance: (tier) => new FreezeChanceAbility(tier),
  aoeSlow: (tier) => new AoeSlowAbility(tier),
  slowKnockback: (tier) => new SlowKnockbackAbility(tier),

  // 전격 계열
  chainLightning: (tier) => new ChainLightningAbility(tier),
  chainFocus: (tier) => new ChainFocusAbility(tier),
  chainStun: (tier) => new ChainStunAbility(tier),
  firstStrike: (tier) => new FirstStrikeAbility(tier),

  // 질풍 계열
  wind: (tier) => new WindAbility(tier),
  aoeDamage: (tier) => new AoeDamageAbility(tier),
  pull: (tier) => new PullAbility(tier),
  gust: (tier) => new GustAbility(tier),

  // 공허 계열
  pierce: (tier) => new PierceAbility(tier),
  synergyBuff: (tier) => new SynergyBuffAbility(tier),
  balanced: (tier) => new BalancedAbility(tier),
  enhancedPierce: (tier) => new EnhancedPierceAbility(tier),

  // 광휘 계열
  execute: (tier) => new ExecuteAbility(tier),
  critical: (tier) => new CriticalAbility(tier),
  lightKnockback: (tier) => new LightKnockbackAbility(tier),
  rushBlocker: (tier) => new RushBlockerAbility(tier),
};
