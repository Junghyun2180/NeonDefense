// Neon Defense - 서포트 타워 Ability
// 주변 공격 타워에 버프를 부여하거나 적에게 디버프를 부여

// ===== 서포트 Ability 기본 클래스 =====
class SupportAbility extends Ability {
  static TYPE = 'support';

  constructor(tier, supportType) {
    const config = SUPPORT_CONFIG[tier];
    super(tier, {
      range: config.range,
      buffValue: config.values[supportType],
      supportType: supportType,
    });
    this.type = SupportAbility.TYPE;
    this.supportType = supportType;
  }

  /**
   * 서포트 타워의 효과 적용
   * @param {Object} context - { support, targets, now }
   *   - support: 서포트 타워
   *   - targets: 대상 배열 (타워 또는 적)
   *   - now: 현재 시간
   * @returns {Object} 처리 결과
   */
  onTick(context) {
    return {
      buffedTargets: [],
      visualEffects: [],
    };
  }

  /**
   * 대상이 범위 내인지 확인
   */
  isInRange(support, target) {
    const dist = calcDistance(support.x, support.y, target.x, target.y);
    return dist <= this.config.range;
  }

  getDescription() {
    return '서포트';
  }
}

// ===== 공격력 버프 서포트 =====
class AttackBuffSupportAbility extends SupportAbility {
  static TYPE = 'attackBuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.ATTACK);
    this.type = AttackBuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets, now } = context;
    const result = {
      buffedTargets: [],
      visualEffects: [],
    };

    targets.forEach(tower => {
      if (!this.isInRange(support, tower)) return;

      result.buffedTargets.push({
        targetId: tower.id,
        buffType: 'attackBuff',
        value: this.config.buffValue,
        sourceId: support.id,
      });
    });

    return result;
  }

  getDescription() {
    return `공격력 +${Math.round(this.config.buffValue * 100)}%`;
  }
}

// ===== 공격속도 버프 서포트 =====
class SpeedBuffSupportAbility extends SupportAbility {
  static TYPE = 'speedBuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.SPEED);
    this.type = SpeedBuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets, now } = context;
    const result = {
      buffedTargets: [],
      visualEffects: [],
    };

    targets.forEach(tower => {
      if (!this.isInRange(support, tower)) return;

      result.buffedTargets.push({
        targetId: tower.id,
        buffType: 'speedBuff',
        value: this.config.buffValue,
        sourceId: support.id,
      });
    });

    return result;
  }

  getDescription() {
    return `공격속도 +${Math.round(this.config.buffValue * 100)}%`;
  }
}

// ===== 방어력 감소 서포트 (적에게 취약 디버프) =====
class DefenseDebuffSupportAbility extends SupportAbility {
  static TYPE = 'defenseDebuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.DEFENSE);
    this.type = DefenseDebuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets, now } = context;
    const result = {
      buffedTargets: [], // 이 경우는 debuffedTargets
      visualEffects: [],
    };

    // targets = enemies
    targets.forEach(enemy => {
      if (!this.isInRange(support, enemy)) return;

      result.buffedTargets.push({
        targetId: enemy.id,
        buffType: 'vulnerability',
        value: this.config.buffValue,
        sourceId: support.id,
      });
    });

    return result;
  }

  getDescription() {
    return `적 방어력 -${Math.round(this.config.buffValue * 100)}%`;
  }
}

// ===== 사거리 버프 서포트 =====
class RangeBuffSupportAbility extends SupportAbility {
  static TYPE = 'rangeBuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.RANGE);
    this.type = RangeBuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets, now } = context;
    const result = {
      buffedTargets: [],
      visualEffects: [],
    };

    targets.forEach(tower => {
      if (!this.isInRange(support, tower)) return;

      result.buffedTargets.push({
        targetId: tower.id,
        buffType: 'rangeBuff',
        value: this.config.buffValue,
        sourceId: support.id,
      });
    });

    return result;
  }

  getDescription() {
    return `사거리 +${Math.round(this.config.buffValue * 100)}%`;
  }
}

// ===== SupportAbilitySystem =====
const SupportAbilitySystem = {
  // 서포트 타입 → Ability 클래스 매핑
  _abilities: {
    [SUPPORT_TYPES.ATTACK]: AttackBuffSupportAbility,
    [SUPPORT_TYPES.SPEED]: SpeedBuffSupportAbility,
    [SUPPORT_TYPES.DEFENSE]: DefenseDebuffSupportAbility,
    [SUPPORT_TYPES.RANGE]: RangeBuffSupportAbility,
  },

  /**
   * 서포트 타워에 맞는 Ability 생성
   */
  createAbility(tier, supportType) {
    const AbilityClass = this._abilities[supportType];
    if (AbilityClass) {
      return new AbilityClass(tier);
    }
    return new SupportAbility(tier, supportType);
  },

  /**
   * 서포트 타워에 Ability 할당
   */
  assignAbility(support) {
    const ability = this.createAbility(support.tier, support.supportType);
    return {
      ...support,
      ability: ability,
      abilityType: ability.type,
    };
  },

  /**
   * 모든 서포트 타워의 버프 계산 (기존 calcSupportBuffs 대체)
   * @returns { attackBuff, speedBuff, rangeBuff } - 타워별 버프 맵
   */
  calculateAllBuffs(supportTowers, attackTowers) {
    const towerBuffs = new Map(); // towerId -> { attack, speed, range }

    // 초기화
    attackTowers.forEach(tower => {
      towerBuffs.set(tower.id, { attack: 0, speed: 0, range: 0 });
    });

    // 각 서포트의 Ability 실행
    supportTowers.forEach(support => {
      if (!support.ability || support.supportType === SUPPORT_TYPES.DEFENSE) return;

      const result = support.ability.onTick({
        support,
        targets: attackTowers,
        now: Date.now(),
      });

      result.buffedTargets.forEach(buff => {
        const current = towerBuffs.get(buff.targetId);
        if (!current) return;

        switch (buff.buffType) {
          case 'attackBuff':
            current.attack += buff.value;
            break;
          case 'speedBuff':
            current.speed += buff.value;
            break;
          case 'rangeBuff':
            current.range += buff.value;
            break;
        }
      });
    });

    // 상한선 적용
    towerBuffs.forEach((buffs, towerId) => {
      buffs.attack = Math.min(buffs.attack, SUPPORT_CAPS.attack);
      buffs.speed = Math.min(buffs.speed, SUPPORT_CAPS.speed);
      buffs.range = Math.min(buffs.range, SUPPORT_CAPS.range);
    });

    return towerBuffs;
  },

  /**
   * 적에 대한 취약도 계산 (기존 calcEnemyVulnerability 대체)
   */
  calculateEnemyVulnerability(supportTowers, enemies) {
    const vulnerabilities = new Map(); // enemyId -> vulnerability

    // 초기화
    enemies.forEach(enemy => {
      vulnerabilities.set(enemy.id, 0);
    });

    // 방감 서포트만 처리
    supportTowers.forEach(support => {
      if (!support.ability || support.supportType !== SUPPORT_TYPES.DEFENSE) return;

      const result = support.ability.onTick({
        support,
        targets: enemies,
        now: Date.now(),
      });

      result.buffedTargets.forEach(debuff => {
        const current = vulnerabilities.get(debuff.targetId) || 0;
        vulnerabilities.set(debuff.targetId, current + debuff.value);
      });
    });

    // 상한선 적용
    vulnerabilities.forEach((value, enemyId) => {
      vulnerabilities.set(enemyId, Math.min(value, SUPPORT_CAPS.defense));
    });

    return vulnerabilities;
  },
};
