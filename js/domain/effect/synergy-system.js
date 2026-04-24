// Neon Defense - 속성 시너지 판정 시스템
// 적이 이미 가진 상태이상/스택에 따라 후속 공격에 보너스 적용
// 각 속성 ability의 onHit에서 SynergySystem.check(element, target)를 호출하여 보너스 반환
//
// 시너지 규칙:
// - 전격 + 동결(freeze)    → 감전: 피해 ×1.5
// - 공허 + 화상(burn)      → 에너지 파열: 관통 범위 +40%, damage +10%
// - 광휘 + 슬로우(slow)    → 집중 처형: 처형 임계치 +10%
// - 화염 + 슬로우(slow)    → 증폭 화상: burn duration +50%
// - 질풍 + 공중(airborne)  → 공중 적에 +30% (이미 Wind T4에 일부 있음)
// - 냉기 + 넉백(knockback) → 빙판: 슬로우 시간 +50%

const SynergySystem = {
  // target이 가진 활성 효과 세트 추출 (만료 제외)
  getActiveTypes(target, now = Date.now()) {
    if (!target || !target.statusEffects) return new Set();
    const types = new Set();
    for (const e of target.statusEffects) {
      if (!e || e.expired) continue;
      if (typeof e.startTime === 'number' && typeof e.duration === 'number') {
        if (now - e.startTime > e.duration) continue;
      }
      if (e.type) types.add(e.type);
    }
    return types;
  },

  // 시너지 평가: { damageMult, pierceRangeMult, executeThresholdBonus, burnDurationMult, slowDurationMult, tag }
  // 모든 속성 ability가 공용으로 사용. tag는 시각 효과 표시용.
  evaluate(element, target) {
    const types = this.getActiveTypes(target);
    const out = {
      damageMult: 1.0,
      pierceRangeMult: 1.0,
      executeThresholdBonus: 0,
      burnDurationMult: 1.0,
      slowDurationMult: 1.0,
      tags: [],
    };
    if (types.size === 0) return out;

    // ELEMENT_TYPES: FIRE=0, WATER=1, ELECTRIC=2, WIND=3, VOID=4, LIGHT=5
    if (element === 2 && types.has('freeze')) {
      out.damageMult *= 1.5;
      out.tags.push('shock');
    }
    if (element === 4 && types.has('burn')) {
      out.pierceRangeMult *= 1.4;
      out.damageMult *= 1.1;
      out.tags.push('energy-burst');
    }
    if (element === 5 && types.has('slow')) {
      out.executeThresholdBonus += 0.10;
      out.tags.push('focused-exec');
    }
    if (element === 0 && types.has('slow')) {
      out.burnDurationMult *= 1.5;
      out.tags.push('amplified-burn');
    }
    if (element === 1 && types.has('knockback')) {
      out.slowDurationMult *= 1.5;
      out.tags.push('icy-floor');
    }
    return out;
  },

  // 간단히 damageMult만 필요한 경우의 헬퍼
  damageMultFor(element, target) {
    return this.evaluate(element, target).damageMult;
  },

  // 적 객체에 _burnCharge / _slowCharge 등 Fire/Water가 넣은 상태도 감안 (type별로 공존 체크)
  hasChargeState(target, key) {
    return target && typeof target[key] === 'number' && target[key] > 0;
  },
};

window.SynergySystem = SynergySystem;
