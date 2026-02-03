// Neon Defense - 상태이상 시스템 (OOP 방식)
// 상태이상은 적에게 부착되는 객체로, 스스로 tick/expire를 처리

// ===== 상태이상 기본 클래스 =====
class StatusEffect {
  constructor(duration) {
    this.id = Date.now() + Math.random();
    this.duration = duration;
    this.startTime = null;
    this.expired = false;
  }

  // 적에게 부착될 때 호출
  onAttach(enemy, now) {
    this.startTime = now;
  }

  // 매 틱마다 호출 - 반환: { enemy, damage?, visualEffect? }
  tick(enemy, now, gameSpeed) {
    if (this.isExpired(now)) {
      this.expired = true;
      return { enemy: this.onExpire(enemy, now) };
    }
    return { enemy };
  }

  // 만료 체크
  isExpired(now) {
    return this.startTime && (now - this.startTime >= this.duration);
  }

  // 만료 시 호출
  onExpire(enemy, now) {
    return enemy;
  }

  // 이동속도 배율 (기본 1.0)
  getSpeedMultiplier() {
    return 1.0;
  }

  // 같은 타입 상태이상과 스택/갱신 처리
  canStack(other) {
    return false;
  }

  // 시각 효과 정보
  getVisualEffect(enemy) {
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

// ===== 상태이상 관리자 =====
const StatusEffectManager = {
  // 적에게 상태이상 추가
  addEffect(enemy, effect, now) {
    const effects = enemy.statusEffects || [];
    effect.onAttach(enemy, now);

    // 즉시 적용 효과 처리
    let updatedEnemy = { ...enemy };
    if (effect instanceof KnockbackEffect) {
      updatedEnemy = effect.applyKnockback(updatedEnemy);
    } else if (effect instanceof PullEffect) {
      updatedEnemy = effect.applyPull(updatedEnemy);
    }

    // 스택/갱신 체크
    const existingIndex = effects.findIndex(e => e.type === effect.type);
    if (existingIndex >= 0) {
      const existing = effects[existingIndex];
      if (existing.canStack && existing.canStack(effect)) {
        // 새 효과로 갱신
        effects[existingIndex] = effect;
      }
      // 아니면 기존 유지
    } else if (!effect.expired) {
      effects.push(effect);
    }

    return { ...updatedEnemy, statusEffects: effects };
  },

  // 매 틱마다 모든 상태이상 처리
  processTick(enemy, now, gameSpeed) {
    const effects = enemy.statusEffects || [];
    if (effects.length === 0) return { enemy, totalDamage: 0, visualEffects: [] };

    let updatedEnemy = { ...enemy };
    let totalDamage = 0;
    const visualEffects = [];

    const activeEffects = effects.filter(effect => {
      const result = effect.tick(updatedEnemy, now, gameSpeed);
      updatedEnemy = result.enemy;
      if (result.damage) totalDamage += result.damage;
      if (result.visualEffect) visualEffects.push(result.visualEffect);
      return !effect.expired;
    });

    return {
      enemy: { ...updatedEnemy, statusEffects: activeEffects },
      totalDamage,
      visualEffects,
    };
  },

  // 이동속도 배율 계산 (가장 강한 감속 적용)
  getSpeedMultiplier(enemy, now) {
    const effects = enemy.statusEffects || [];
    let minMultiplier = 1.0;

    effects.forEach(effect => {
      if (!effect.isExpired(now)) {
        const mult = effect.getSpeedMultiplier();
        if (mult < minMultiplier) minMultiplier = mult;
      }
    });

    return minMultiplier;
  },

  // 특정 타입 상태이상 활성화 여부
  hasEffect(enemy, type, now) {
    const effects = enemy.statusEffects || [];
    return effects.some(e => e.type === type && !e.isExpired(now));
  },

  // 모든 시각 효과 가져오기
  getVisualEffects(enemy, now) {
    const effects = enemy.statusEffects || [];
    return effects
      .filter(e => !e.isExpired(now))
      .map(e => e.getVisualEffect(enemy))
      .filter(Boolean);
  },

  // 상태이상 배열 초기화
  initEffects() {
    return [];
  },
};

// ===== 팩토리 함수 (간편 생성) =====
const StatusEffects = {
  burn: (damage, duration) => new BurnEffect(damage, duration),
  slow: (percent, duration) => new SlowEffect(percent, duration),
  freeze: (duration) => new FreezeEffect(duration),
  stun: (duration) => new StunEffect(duration),
  knockback: (distance) => new KnockbackEffect(distance),
  pull: (targetX, targetY, distance) => new PullEffect(targetX, targetY, distance),
};

// ===== 하위 호환을 위한 래퍼 (기존 코드 지원) =====
const StatusEffectSystem = {
  // 기존 인터페이스 호환
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
      default:
        console.warn(`Unknown effect type: ${effect.type}`);
        return enemy;
    }
    return StatusEffectManager.addEffect(enemy, statusEffect, now);
  },

  processBurnTick(enemy, now, gameSpeed) {
    const result = StatusEffectManager.processTick(enemy, now, gameSpeed);
    if (result.totalDamage > 0) {
      return {
        damage: result.totalDamage,
        updatedEnemy: result.enemy,
      };
    }
    return null;
  },

  getSpeedMultiplier(enemy, now) {
    return StatusEffectManager.getSpeedMultiplier(enemy, now);
  },

  getDefaultFields() {
    return {
      statusEffects: [],
    };
  },
};

// 글로벌 등록
window.StatusEffect = StatusEffect;
window.BurnEffect = BurnEffect;
window.SlowEffect = SlowEffect;
window.FreezeEffect = FreezeEffect;
window.StunEffect = StunEffect;
window.KnockbackEffect = KnockbackEffect;
window.PullEffect = PullEffect;
window.StatusEffectManager = StatusEffectManager;
window.StatusEffects = StatusEffects;
window.StatusEffectSystem = StatusEffectSystem;
