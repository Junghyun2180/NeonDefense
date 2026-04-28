// Neon Defense - 냉기(WATER) 속성 Ability
// 슬로우 + T4 빙결/광역 슬로우/넉백

// ===== 기본 냉기 (T1~T3): 슬로우 + 3적중마다 빙결 (차별화) =====
// 적 객체에 slowChargeMap을 두고, 같은 적에 3번 적중하면 짧은 빙결 발동 후 카운터 리셋
class SlowAbility extends Ability {
  static TYPE = 'slow';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.WATER]);
    this.type = SlowAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, permanentBuffs } = context;
    // targetMutations: 엔진이 적 상태를 변경하도록 요청
    const result = Ability.makeResult({ targetMutations: [] });

    // 시너지: 냉기+넉백=빙판 (슬로우 지속시간 ×1.5)
    const syn = (typeof SynergySystem !== 'undefined')
      ? SynergySystem.evaluate(ELEMENT_TYPES.WATER, target)
      : { slowDurationMult: 1.0, tags: [] };

    const permSlowMult = BuffHelper.getSlowPowerMultiplier(permanentBuffs);
    const slowPercent = this.getTierValue('slowPercent') * permSlowMult;
    const slowDuration = this.getTierValue('slowDuration') * syn.slowDurationMult;

    // Water는 CC 의존이라 단일 DPS가 낮음 → 기본 공격에 +15% 보정
    result.damageModifier = 1.15;

    // 슬로우 적용 (기존 동작 유지 — 더 강한 값이면 갱신)
    result.statusEffects.push({
      enemyId: hit.enemyId,
      type: 'slow',
      percent: slowPercent,
      duration: slowDuration,
    });

    // 슬로우 스택: 대상의 _slowCharge를 증가시키고 5에 도달하면 freeze + 빙결 폭발 AoE
    // 5스택 기준: 적이 너무 자주 정지해 누적되는 문제를 완화
    const prevCharge = (target && target._slowCharge) || 0;
    const nextCharge = prevCharge + 1;
    if (nextCharge >= 4) {
      result.statusEffects.push({
        enemyId: hit.enemyId,
        type: 'freeze',
        duration: 600,
      });
      // 빙결 폭발 — 주변 적에게 AoE 데미지 (Water의 유일한 burst damage)
      const { enemies = [] } = context;
      const explosionRadius = 70;
      const explosionDamage = Math.floor(hit.damage * 0.85);
      for (const e of enemies) {
        if (!e || e.id === hit.enemyId) continue;
        const dx = e.x - hit.x, dy = e.y - hit.y;
        if (dx * dx + dy * dy <= explosionRadius * explosionRadius) {
          result.aoeTargets.push({
            enemy: e,
            damage: explosionDamage,
            statusEffects: [{
              enemyId: e.id,
              type: 'slow',
              percent: slowPercent * 0.7,
              duration: slowDuration * 0.6,
            }],
          });
        }
      }
      result.targetMutations.push({ enemyId: hit.enemyId, set: { _slowCharge: 0 } });
      result.visualEffects.push({
        id: Date.now() + Math.random(),
        x: hit.x,
        y: hit.y,
        type: 'water-freeze-burst',
        color: '#00FFFF',
      });
    } else {
      result.targetMutations.push({ enemyId: hit.enemyId, set: { _slowCharge: nextCharge } });
    }

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
    return `슬로우 (${this.getTierValue('slowPercent') * 100}% 감속 · 3적중 빙결)`;
  }
}

// ===== T4 냉기: 빙결 제어형 =====
class FreezeChanceAbility extends Ability {
  static TYPE = 'freezeChance';

  constructor(tier) {
    const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
    super(tier, {
      ...we,
      freezeChance: we.t4FreezeChance,
      freezeDuration: we.t4FreezeDuration,
    });
    this.type = FreezeChanceAbility.TYPE;
  }

  onHit(context) {
    const { hit, permanentBuffs } = context;
    const result = Ability.makeResult();

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
    const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
    super(tier, {
      ...we,
      aoeRadius: we.t4AoeRadius,
      aoeSlowRatio: we.t4AoeSlowRatio,
      aoeDurationRatio: we.t4AoeDurationRatio,
    });
    this.type = AoeSlowAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = Ability.makeResult();

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
    const we = ELEMENT_EFFECTS[ELEMENT_TYPES.WATER];
    super(tier, {
      ...we,
      knockbackDistance: we.t4KnockbackDistance,
    });
    this.type = SlowKnockbackAbility.TYPE;
  }

  onHit(context) {
    const { hit, permanentBuffs } = context;
    const result = Ability.makeResult();

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
