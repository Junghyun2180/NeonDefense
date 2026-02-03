// Neon Defense - 상태이상/버프 통합 시스템 (OOP 방식)
// 적/타워에 부착되는 효과 객체로, 스스로 tick/expire를 처리
// 디버프(적용 대상에게 불리), 버프(적용 대상에게 유리) 모두 지원

// ===== 효과 기본 클래스 =====
class StatusEffect {
  constructor(duration) {
    this.id = Date.now() + Math.random();
    this.duration = duration;
    this.startTime = null;
    this.expired = false;
    this.isDebuff = true; // 기본은 디버프 (적에게 불리한 효과)
  }

  // 대상에게 부착될 때 호출
  onAttach(target, now) {
    this.startTime = now;
  }

  // 매 틱마다 호출 - 반환: { target, damage?, heal?, visualEffect? }
  tick(target, now, gameSpeed) {
    if (this.isExpired(now)) {
      this.expired = true;
      return { target: this.onExpire(target, now) };
    }
    return { target };
  }

  // 만료 체크
  isExpired(now) {
    return this.startTime && (now - this.startTime >= this.duration);
  }

  // 만료 시 호출
  onExpire(target, now) {
    return target;
  }

  // 이동속도 배율 (기본 1.0)
  getSpeedMultiplier() {
    return 1.0;
  }

  // 공격 배율 (기본 1.0) - 타워/적 공통
  getDamageMultiplier() {
    return 1.0;
  }

  // 공속 배율 (기본 1.0) - 타워용
  getAttackSpeedMultiplier() {
    return 1.0;
  }

  // 사거리 배율 (기본 1.0) - 타워용
  getRangeMultiplier() {
    return 1.0;
  }

  // 받는 피해 배율 (기본 1.0) - 적 취약도
  getVulnerabilityMultiplier() {
    return 1.0;
  }

  // 같은 타입 효과와 스택/갱신 처리
  canStack(other) {
    return false;
  }

  // 시각 효과 정보
  getVisualEffect(target) {
    return null;
  }
}

// ===== 화상 (Burn) =====
class BurnEffect extends StatusEffect {
  static TYPE = 'burn';

  constructor(damage, duration, tickInterval = 500) {
    super(duration);
    this.type = BurnEffect.TYPE;
    this.damage = damage;
    this.tickInterval = tickInterval;
    this.lastTickTime = 0;
  }

  tick(enemy, now, gameSpeed) {
    if (this.isExpired(now)) {
      this.expired = true;
      return { enemy };
    }

    // 틱 간격마다 데미지
    const adjustedInterval = this.tickInterval / gameSpeed;
    if (now - this.lastTickTime >= adjustedInterval) {
      this.lastTickTime = now;
      return {
        enemy,
        damage: this.damage,
        visualEffect: { type: 'burn-tick', color: '#FF6B6B', x: enemy.x, y: enemy.y },
      };
    }
    return { enemy };
  }

  canStack(other) {
    // 더 강한 화상으로 갱신
    return other instanceof BurnEffect && other.damage > this.damage;
  }

  getVisualEffect(enemy) {
    return { type: 'burning', color: '#FF6B6B' };
  }
}

// ===== 슬로우 (Slow) =====
class SlowEffect extends StatusEffect {
  static TYPE = 'slow';

  constructor(percent, duration) {
    super(duration);
    this.type = SlowEffect.TYPE;
    this.percent = Math.min(0.9, percent); // 최대 90% 감속
  }

  getSpeedMultiplier() {
    return 1 - this.percent;
  }

  canStack(other) {
    // 더 강한 슬로우로 갱신
    return other instanceof SlowEffect && other.percent > this.percent;
  }

  getVisualEffect(enemy) {
    return { type: 'slowed', color: '#45B7D1' };
  }
}

// ===== 빙결 (Freeze) =====
class FreezeEffect extends StatusEffect {
  static TYPE = 'freeze';

  constructor(duration) {
    super(duration);
    this.type = FreezeEffect.TYPE;
  }

  getSpeedMultiplier() {
    return 0; // 완전 정지
  }

  getVisualEffect(enemy) {
    return { type: 'frozen', color: '#00FFFF' };
  }
}

// ===== 스턴 (Stun) =====
class StunEffect extends StatusEffect {
  static TYPE = 'stun';

  constructor(duration) {
    super(duration);
    this.type = StunEffect.TYPE;
  }

  getSpeedMultiplier() {
    return 0;
  }

  getVisualEffect(enemy) {
    return { type: 'stunned', color: '#FFD700' };
  }
}

// ===== 넉백 (Knockback) - 즉시 적용 후 만료 =====
class KnockbackEffect extends StatusEffect {
  static TYPE = 'knockback';

  constructor(distance) {
    super(0); // 즉시 만료
    this.type = KnockbackEffect.TYPE;
    this.distance = distance;
    this.applied = false;
  }

  onAttach(enemy, now) {
    super.onAttach(enemy, now);
    // 즉시 적용
    this.applied = true;
    this.expired = true;
  }

  // 넉백은 즉시 적용이므로 별도 처리
  applyKnockback(enemy) {
    const path = enemy.pathTiles;
    if (!path) return enemy;

    const knockbackTiles = Math.floor(this.distance / TILE_SIZE);
    const newPathIndex = Math.max(0, enemy.pathIndex - knockbackTiles);

    if (newPathIndex < enemy.pathIndex && path[newPathIndex]) {
      const newTile = path[newPathIndex];
      return {
        ...enemy,
        pathIndex: newPathIndex,
        x: newTile.x * TILE_SIZE + TILE_SIZE / 2,
        y: newTile.y * TILE_SIZE + TILE_SIZE / 2,
      };
    }
    return enemy;
  }
}

// ===== 끌어당김 (Pull) - 즉시 적용 후 만료 =====
class PullEffect extends StatusEffect {
  static TYPE = 'pull';

  constructor(targetX, targetY, distance) {
    super(0);
    this.type = PullEffect.TYPE;
    this.targetX = targetX;
    this.targetY = targetY;
    this.distance = distance;
    this.applied = false;
  }

  onAttach(enemy, now) {
    super.onAttach(enemy, now);
    this.applied = true;
    this.expired = true;
  }

  applyPull(enemy) {
    const dx = this.targetX - enemy.x;
    const dy = this.targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const pullDist = Math.min(this.distance, dist - 10);
      return {
        ...enemy,
        x: enemy.x + (dx / dist) * pullDist,
        y: enemy.y + (dy / dist) * pullDist,
      };
    }
    return enemy;
  }
}

// =====================================================
// ===== 적 버프 (힐러/디버프 몬스터용) =====
// =====================================================

// ===== 재생 (Regeneration) - 힐러가 부여하는 지속 회복 =====
class RegenerationEffect extends StatusEffect {
  static TYPE = 'regeneration';

  constructor(healPercent, duration, tickInterval = 1000) {
    super(duration);
    this.type = RegenerationEffect.TYPE;
    this.healPercent = healPercent; // 최대 체력의 %
    this.tickInterval = tickInterval;
    this.lastTickTime = 0;
    this.isDebuff = false; // 버프임
  }

  tick(target, now, gameSpeed) {
    if (this.isExpired(now)) {
      this.expired = true;
      return { target };
    }

    const adjustedInterval = this.tickInterval / gameSpeed;
    if (now - this.lastTickTime >= adjustedInterval) {
      this.lastTickTime = now;
      const healAmount = Math.floor(target.maxHealth * this.healPercent);
      return {
        target,
        heal: healAmount,
        visualEffect: { type: 'heal-tick', color: '#22c55e', x: target.x, y: target.y },
      };
    }
    return { target };
  }

  canStack(other) {
    return other instanceof RegenerationEffect && other.healPercent > this.healPercent;
  }

  getVisualEffect(target) {
    return { type: 'regenerating', color: '#22c55e' };
  }
}

// ===== 공속 디버프 (Jammer 오라) - 타워 공격속도 감소 =====
class AttackSpeedDebuffEffect extends StatusEffect {
  static TYPE = 'attackSpeedDebuff';

  constructor(percent, duration) {
    super(duration);
    this.type = AttackSpeedDebuffEffect.TYPE;
    this.percent = percent; // 감소율 (0.4 = 40% 감소)
  }

  getAttackSpeedMultiplier() {
    return 1 - this.percent;
  }

  canStack(other) {
    return other instanceof AttackSpeedDebuffEffect && other.percent > this.percent;
  }

  getVisualEffect(target) {
    return { type: 'jammed', color: '#8b5cf6' };
  }
}

// ===== 공격력 디버프 (Suppressor 오라) - 타워 데미지 감소 =====
class DamageDebuffEffect extends StatusEffect {
  static TYPE = 'damageDebuff';

  constructor(percent, duration) {
    super(duration);
    this.type = DamageDebuffEffect.TYPE;
    this.percent = percent;
  }

  getDamageMultiplier() {
    return 1 - this.percent;
  }

  canStack(other) {
    return other instanceof DamageDebuffEffect && other.percent > this.percent;
  }

  getVisualEffect(target) {
    return { type: 'suppressed', color: '#ec4899' };
  }
}

// =====================================================
// ===== 타워 버프 (서포트 타워용) =====
// =====================================================

// ===== 공격력 버프 =====
class AttackBuffEffect extends StatusEffect {
  static TYPE = 'attackBuff';

  constructor(percent, duration = Infinity) {
    super(duration);
    this.type = AttackBuffEffect.TYPE;
    this.percent = percent;
    this.isDebuff = false;
    this.sourceId = null; // 버프 제공자 ID
  }

  getDamageMultiplier() {
    return 1 + this.percent;
  }

  canStack(other) {
    // 같은 소스의 버프는 갱신, 다른 소스는 가산
    if (other instanceof AttackBuffEffect && other.sourceId === this.sourceId) {
      return other.percent > this.percent;
    }
    return false;
  }

  getVisualEffect(target) {
    return { type: 'attack-buffed', color: '#FFB347' };
  }
}

// ===== 공속 버프 =====
class AttackSpeedBuffEffect extends StatusEffect {
  static TYPE = 'attackSpeedBuff';

  constructor(percent, duration = Infinity) {
    super(duration);
    this.type = AttackSpeedBuffEffect.TYPE;
    this.percent = percent;
    this.isDebuff = false;
    this.sourceId = null;
  }

  getAttackSpeedMultiplier() {
    return 1 + this.percent;
  }

  canStack(other) {
    if (other instanceof AttackSpeedBuffEffect && other.sourceId === this.sourceId) {
      return other.percent > this.percent;
    }
    return false;
  }

  getVisualEffect(target) {
    return { type: 'speed-buffed', color: '#87CEEB' };
  }
}

// ===== 사거리 버프 =====
class RangeBuffEffect extends StatusEffect {
  static TYPE = 'rangeBuff';

  constructor(percent, duration = Infinity) {
    super(duration);
    this.type = RangeBuffEffect.TYPE;
    this.percent = percent;
    this.isDebuff = false;
    this.sourceId = null;
  }

  getRangeMultiplier() {
    return 1 + this.percent;
  }

  canStack(other) {
    if (other instanceof RangeBuffEffect && other.sourceId === this.sourceId) {
      return other.percent > this.percent;
    }
    return false;
  }

  getVisualEffect(target) {
    return { type: 'range-buffed', color: '#98FB98' };
  }
}

// ===== 적 취약도 (방감 디버프) - 적이 받는 피해 증가 =====
class VulnerabilityEffect extends StatusEffect {
  static TYPE = 'vulnerability';

  constructor(percent, duration = Infinity) {
    super(duration);
    this.type = VulnerabilityEffect.TYPE;
    this.percent = percent; // 추가 피해율 (0.1 = +10% 피해)
    this.sourceId = null;
  }

  getVulnerabilityMultiplier() {
    return 1 + this.percent;
  }

  canStack(other) {
    if (other instanceof VulnerabilityEffect && other.sourceId === this.sourceId) {
      return other.percent > this.percent;
    }
    return false;
  }

  getVisualEffect(target) {
    return { type: 'vulnerable', color: '#FF6B9D' };
  }
}

// ===== 효과 관리자 (적/타워 공통) =====
const StatusEffectManager = {
  // 대상에게 효과 추가
  addEffect(target, effect, now) {
    const effects = [...(target.statusEffects || [])];
    effect.onAttach(target, now);

    // 즉시 적용 효과 처리
    let updatedTarget = { ...target };
    if (effect instanceof KnockbackEffect) {
      updatedTarget = effect.applyKnockback(updatedTarget);
    } else if (effect instanceof PullEffect) {
      updatedTarget = effect.applyPull(updatedTarget);
    }

    // 같은 소스의 같은 타입 효과 찾기
    const existingIndex = effects.findIndex(e =>
      e.type === effect.type &&
      (e.sourceId === effect.sourceId || !e.sourceId)
    );

    if (existingIndex >= 0) {
      const existing = effects[existingIndex];
      if (existing.canStack && existing.canStack(effect)) {
        effects[existingIndex] = effect;
      }
      // 다른 소스의 같은 타입은 별도로 추가 (스택)
      else if (effect.sourceId && existing.sourceId !== effect.sourceId) {
        if (!effect.expired) effects.push(effect);
      }
    } else if (!effect.expired) {
      effects.push(effect);
    }

    return { ...updatedTarget, statusEffects: effects };
  },

  // 특정 소스의 모든 효과 제거
  removeEffectsBySource(target, sourceId) {
    const effects = target.statusEffects || [];
    return {
      ...target,
      statusEffects: effects.filter(e => e.sourceId !== sourceId),
    };
  },

  // 매 틱마다 모든 효과 처리
  processTick(target, now, gameSpeed) {
    const effects = target.statusEffects || [];
    if (effects.length === 0) return { target, totalDamage: 0, totalHeal: 0, visualEffects: [] };

    let updatedTarget = { ...target };
    let totalDamage = 0;
    let totalHeal = 0;
    const visualEffects = [];

    const activeEffects = effects.filter(effect => {
      const result = effect.tick(updatedTarget, now, gameSpeed);
      updatedTarget = result.target;
      if (result.damage) totalDamage += result.damage;
      if (result.heal) totalHeal += result.heal;
      if (result.visualEffect) visualEffects.push(result.visualEffect);
      return !effect.expired;
    });

    return {
      target: { ...updatedTarget, statusEffects: activeEffects },
      totalDamage,
      totalHeal,
      visualEffects,
    };
  },

  // 이동속도 배율 계산 (가장 강한 감속)
  getSpeedMultiplier(target, now) {
    const effects = target.statusEffects || [];
    let minMultiplier = 1.0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getSpeedMultiplier();
        if (mult < minMultiplier) minMultiplier = mult;
      }
    });

    return minMultiplier;
  },

  // 공격력 배율 계산 (모든 버프/디버프 합산)
  getDamageMultiplier(target, now) {
    const effects = target.statusEffects || [];
    let totalBuff = 0;
    let totalDebuff = 0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getDamageMultiplier();
        if (mult > 1) totalBuff += (mult - 1);
        else if (mult < 1) totalDebuff += (1 - mult);
      }
    });

    // 버프는 가산, 디버프는 별도 적용
    return Math.max(COMBAT.debuffMinFactor, (1 + totalBuff) * (1 - totalDebuff));
  },

  // 공속 배율 계산
  getAttackSpeedMultiplier(target, now) {
    const effects = target.statusEffects || [];
    let totalBuff = 0;
    let totalDebuff = 0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getAttackSpeedMultiplier();
        if (mult > 1) totalBuff += (mult - 1);
        else if (mult < 1) totalDebuff += (1 - mult);
      }
    });

    return Math.max(COMBAT.debuffMinFactor, (1 + totalBuff) * (1 - totalDebuff));
  },

  // 사거리 배율 계산
  getRangeMultiplier(target, now) {
    const effects = target.statusEffects || [];
    let totalBuff = 0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getRangeMultiplier();
        if (mult > 1) totalBuff += (mult - 1);
      }
    });

    return 1 + totalBuff;
  },

  // 취약도 배율 계산 (적이 받는 추가 피해)
  getVulnerabilityMultiplier(target, now) {
    const effects = target.statusEffects || [];
    let totalVuln = 0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getVulnerabilityMultiplier();
        if (mult > 1) totalVuln += (mult - 1);
      }
    });

    // 상한선 적용 (SUPPORT_CAPS.defense)
    return 1 + Math.min(totalVuln, SUPPORT_CAPS?.defense || 0.5);
  },

  // 특정 타입 효과 활성화 여부
  hasEffect(target, type, now) {
    const effects = target.statusEffects || [];
    return effects.some(e => e.type === type && !e.isExpired(now));
  },

  // 모든 시각 효과 가져오기
  getVisualEffects(target, now) {
    const effects = target.statusEffects || [];
    return effects
      .filter(e => !e.isExpired(now))
      .map(e => e.getVisualEffect(target))
      .filter(Boolean);
  },

  // 버프만 가져오기
  getBuffs(target, now) {
    const effects = target.statusEffects || [];
    return effects.filter(e => !e.isDebuff && !e.isExpired(now));
  },

  // 디버프만 가져오기
  getDebuffs(target, now) {
    const effects = target.statusEffects || [];
    return effects.filter(e => e.isDebuff && !e.isExpired(now));
  },

  // 효과 배열 초기화
  initEffects() {
    return [];
  },
};

// ===== 팩토리 함수 (간편 생성) =====
const StatusEffects = {
  // 적에게 거는 디버프
  burn: (damage, duration) => new BurnEffect(damage, duration),
  slow: (percent, duration) => new SlowEffect(percent, duration),
  freeze: (duration) => new FreezeEffect(duration),
  stun: (duration) => new StunEffect(duration),
  knockback: (distance) => new KnockbackEffect(distance),
  pull: (targetX, targetY, distance) => new PullEffect(targetX, targetY, distance),
  vulnerability: (percent, sourceId) => {
    const effect = new VulnerabilityEffect(percent);
    effect.sourceId = sourceId;
    return effect;
  },

  // 적에게 거는 버프 (힐러 등)
  regeneration: (healPercent, duration) => new RegenerationEffect(healPercent, duration),

  // 타워에 거는 디버프 (적 오라)
  attackSpeedDebuff: (percent, duration) => new AttackSpeedDebuffEffect(percent, duration),
  damageDebuff: (percent, duration) => new DamageDebuffEffect(percent, duration),

  // 타워에 거는 버프 (서포트 타워)
  attackBuff: (percent, sourceId) => {
    const effect = new AttackBuffEffect(percent);
    effect.sourceId = sourceId;
    return effect;
  },
  attackSpeedBuff: (percent, sourceId) => {
    const effect = new AttackSpeedBuffEffect(percent);
    effect.sourceId = sourceId;
    return effect;
  },
  rangeBuff: (percent, sourceId) => {
    const effect = new RangeBuffEffect(percent);
    effect.sourceId = sourceId;
    return effect;
  },
};

// ===== 하위 호환을 위한 래퍼 (기존 코드 지원) =====
const StatusEffectSystem = {
  // 기존 인터페이스 호환 (적 디버프)
  apply(enemy, effect, now) {
    let statusEffect;
    switch (effect.type) {
      case 'burn':
        statusEffect = StatusEffects.burn(effect.damage, effect.duration);
        break;
      case 'slow':
        statusEffect = StatusEffects.slow(effect.percent, effect.duration);
        break;
      case 'freeze':
        statusEffect = StatusEffects.freeze(effect.duration);
        break;
      case 'stun':
        statusEffect = StatusEffects.stun(effect.duration);
        break;
      case 'knockback':
        statusEffect = StatusEffects.knockback(effect.distance);
        break;
      case 'pull':
        statusEffect = StatusEffects.pull(effect.targetX, effect.targetY, effect.distance);
        break;
      case 'vulnerability':
        statusEffect = StatusEffects.vulnerability(effect.percent, effect.sourceId);
        break;
      case 'regeneration':
        statusEffect = StatusEffects.regeneration(effect.healPercent, effect.duration);
        break;
      default:
        console.warn(`Unknown effect type: ${effect.type}`);
        return enemy;
    }
    return StatusEffectManager.addEffect(enemy, statusEffect, now);
  },

  // 타워에 버프/디버프 적용
  applyToTower(tower, effect, now) {
    let statusEffect;
    switch (effect.type) {
      case 'attackBuff':
        statusEffect = StatusEffects.attackBuff(effect.percent, effect.sourceId);
        break;
      case 'attackSpeedBuff':
        statusEffect = StatusEffects.attackSpeedBuff(effect.percent, effect.sourceId);
        break;
      case 'rangeBuff':
        statusEffect = StatusEffects.rangeBuff(effect.percent, effect.sourceId);
        break;
      case 'attackSpeedDebuff':
        statusEffect = StatusEffects.attackSpeedDebuff(effect.percent, effect.duration);
        break;
      case 'damageDebuff':
        statusEffect = StatusEffects.damageDebuff(effect.percent, effect.duration);
        break;
      default:
        console.warn(`Unknown tower effect type: ${effect.type}`);
        return tower;
    }
    return StatusEffectManager.addEffect(tower, statusEffect, now);
  },

  processTick(target, now, gameSpeed) {
    const result = StatusEffectManager.processTick(target, now, gameSpeed);
    return {
      damage: result.totalDamage,
      heal: result.totalHeal,
      updatedTarget: result.target,
      visualEffects: result.visualEffects,
    };
  },

  // 화상 틱 처리 (하위 호환)
  processBurnTick(enemy, now, gameSpeed) {
    const result = StatusEffectManager.processTick(enemy, now, gameSpeed);
    if (result.totalDamage > 0 || result.totalHeal > 0) {
      return {
        damage: result.totalDamage,
        heal: result.totalHeal,
        updatedEnemy: result.target,
      };
    }
    return null;
  },

  getSpeedMultiplier(enemy, now) {
    return StatusEffectManager.getSpeedMultiplier(enemy, now);
  },

  getDamageMultiplier(target, now) {
    return StatusEffectManager.getDamageMultiplier(target, now);
  },

  getAttackSpeedMultiplier(target, now) {
    return StatusEffectManager.getAttackSpeedMultiplier(target, now);
  },

  getRangeMultiplier(target, now) {
    return StatusEffectManager.getRangeMultiplier(target, now);
  },

  getVulnerabilityMultiplier(target, now) {
    return StatusEffectManager.getVulnerabilityMultiplier(target, now);
  },

  getDefaultFields() {
    return {
      statusEffects: [],
    };
  },
};

// 글로벌 등록
window.StatusEffect = StatusEffect;
// 적 디버프
window.BurnEffect = BurnEffect;
window.SlowEffect = SlowEffect;
window.FreezeEffect = FreezeEffect;
window.StunEffect = StunEffect;
window.KnockbackEffect = KnockbackEffect;
window.PullEffect = PullEffect;
// 적 버프
window.RegenerationEffect = RegenerationEffect;
// 타워 디버프
window.AttackSpeedDebuffEffect = AttackSpeedDebuffEffect;
window.DamageDebuffEffect = DamageDebuffEffect;
// 타워 버프
window.AttackBuffEffect = AttackBuffEffect;
window.AttackSpeedBuffEffect = AttackSpeedBuffEffect;
window.RangeBuffEffect = RangeBuffEffect;
window.VulnerabilityEffect = VulnerabilityEffect;
// 매니저
window.StatusEffectManager = StatusEffectManager;
window.StatusEffects = StatusEffects;
window.StatusEffectSystem = StatusEffectSystem;
