// Neon Defense - AbilitySystem
// 타워 공격 시 Ability 기반 효과 처리 라우터

const AbilitySystem = {
  // 속성 → 기본 Ability 클래스 매핑
  _baseAbilities: {
    [ELEMENT_TYPES.FIRE]: BurnAbility,
    [ELEMENT_TYPES.WATER]: SlowAbility,
    [ELEMENT_TYPES.ELECTRIC]: ChainLightningAbility,
    [ELEMENT_TYPES.WIND]: WindAbility,
    [ELEMENT_TYPES.VOID]: PierceAbility,
    [ELEMENT_TYPES.LIGHT]: ExecuteAbility,
  },

  // T4 역할 ID → Ability 클래스 매핑
  _t4Abilities: {
    // 화염
    'fire-A': BurnStackAbility,      // 연소 누적형
    'fire-B': BurnSpreadAbility,     // 확산 연소형
    'fire-C': FastEnemyBonusAbility, // 고열 압축형
    // 냉기
    'water-A': FreezeChanceAbility,  // 빙결 제어형
    'water-B': AoeSlowAbility,       // 광역 감속형
    'water-C': SlowKnockbackAbility, // 파동 차단형
    // 전격
    'elec-A': ChainFocusAbility,     // 체인 집중형
    'elec-B': ChainStunAbility,      // 과부하 제어형
    'elec-C': FirstStrikeAbility,    // 번개 러너형
    // 질풍
    'wind-A': AoeDamageAbility,      // 광역 분쇄형
    'wind-B': PullAbility,           // 흡인 제어형
    'wind-C': GustAbility,           // 돌풍 타격형
    // 공허
    'void-A': SynergyBuffAbility,    // 시너지 촉매형
    'void-B': EnhancedPierceAbility, // 차원 파열형
    'void-C': BalancedAbility,       // 균형 딜러형
    // 광휘
    'light-A': CriticalAbility,      // 파쇄 타격형
    'light-B': LightKnockbackAbility,// 넉백 제어형
    'light-C': RushBlockerAbility,   // 러시 차단형
  },

  // 속성 이름 (키 생성용)
  _elementKeys: {
    [ELEMENT_TYPES.FIRE]: 'fire',
    [ELEMENT_TYPES.WATER]: 'water',
    [ELEMENT_TYPES.ELECTRIC]: 'elec',
    [ELEMENT_TYPES.WIND]: 'wind',
    [ELEMENT_TYPES.VOID]: 'void',
    [ELEMENT_TYPES.LIGHT]: 'light',
  },

  /**
   * 타워에 맞는 Ability 인스턴스 생성
   * @param {number} element - 속성 타입
   * @param {number} tier - 티어 (1~4)
   * @param {string|null} role - T4 역할 ID (A, B, C)
   * @returns {Ability} Ability 인스턴스
   */
  createAbility(element, tier, role = null) {
    // T4이고 역할이 지정된 경우
    if (tier === 4 && role) {
      const key = `${this._elementKeys[element]}-${role}`;
      const AbilityClass = this._t4Abilities[key];
      if (AbilityClass) {
        return new AbilityClass(tier);
      }
    }

    // 기본 Ability (T1~T3 또는 T4 역할 미지정)
    const BaseAbility = this._baseAbilities[element];
    if (BaseAbility) {
      return new BaseAbility(tier);
    }

    // fallback: 기본 Ability
    return new Ability(tier);
  },

  /**
   * 단일 Hit 처리 - Ability 기반
   * @param {Object} hit - 명중 정보
   * @param {Array} enemies - 전체 적 배열
   * @param {Object} permanentBuffs - 영구 버프
   * @returns {Object} 처리 결과
   */
  resolveHit(hit, enemies, permanentBuffs = {}) {
    const now = Date.now();
    const target = enemies.find(e => e.id === hit.enemyId);

    // Ability 인스턴스 생성 또는 재사용
    const ability = this.createAbility(hit.element, hit.tier, hit.role);

    // Ability 실행
    const context = {
      hit,
      target,
      enemies,
      permanentBuffs,
      now,
    };

    return ability.onHit(context);
  },

  /**
   * 다중 Hit 처리 - 기존 resolveHits 대체
   * @param {Array} hits - 명중 배열
   * @param {Array} currentEnemies - 현재 적 배열
   * @param {Object} permanentBuffs - 영구 버프
   * @returns {Object} { damageMap, statusEffects, visualEffects, chainLightnings }
   */
  resolveAllHits(hits, currentEnemies, permanentBuffs = {}) {
    // 합의 06: damageMap 구조 = Map<enemyId, Array<{damage, armorPierce, shieldDamageMult}>>
    // entry 별로 Shield → Armor → HP 처리해야 광휘 관통/전격 실드 ×2 가 정확히 적용됨
    const damageMap = new Map();
    const enemyById = new Map();
    currentEnemies.forEach(e => enemyById.set(e.id, e));

    // 적-속성 상성 곱셈 (추천 X — 유저가 데미지 체감으로 발견)
    const affMult = (element, enemyId) => {
      if (typeof AffinitySystem === 'undefined') return 1.0;
      const enemy = enemyById.get(enemyId);
      return AffinitySystem.getMultiplier(element, enemy && enemy.type);
    };

    const pushEntry = (id, damage, opts = {}) => {
      if (damage <= 0) return;
      const list = damageMap.get(id) || [];
      list.push({
        damage: Math.floor(damage),
        armorPierce: opts.armorPierce || 0,
        shieldDamageMult: opts.shieldDamageMult || 1,
      });
      damageMap.set(id, list);
    };

    const statusEffects = [];
    const visualEffects = [];
    let allChainLightnings = [];
    const targetMutations = [];

    hits.forEach(hit => {
      let finalDamage = hit.damage;

      if (hit.isCrit) {
        visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'crit', color: '#FFD700' });
      }

      const result = this.resolveHit(hit, currentEnemies, permanentBuffs);
      const dmgOpts = result.damageOptions || {};

      finalDamage = Math.floor(finalDamage * result.damageModifier);
      finalDamage += result.additionalDamage;

      // 본 타겟에 affinity 적용
      const mainAff = affMult(hit.element, hit.enemyId);
      pushEntry(hit.enemyId, Math.floor(finalDamage * mainAff), dmgOpts);

      statusEffects.push(...result.statusEffects);
      visualEffects.push(...result.visualEffects);

      // AOE — 각 적 타입마다 affinity가 다를 수 있으므로 개별 적용
      result.aoeTargets.forEach(aoe => {
        const aoeAff = affMult(hit.element, aoe.enemy.id);
        pushEntry(aoe.enemy.id, Math.floor(aoe.damage * aoeAff), dmgOpts);
        if (aoe.statusEffects) statusEffects.push(...aoe.statusEffects);
      });

      // 관통 — 동일
      result.pierceTargets.forEach(pierce => {
        const pierceAff = affMult(hit.element, pierce.enemy.id);
        pushEntry(pierce.enemy.id, Math.floor(pierce.damage * pierceAff), dmgOpts);
      });

      if (result.targetMutations && result.targetMutations.length > 0) {
        targetMutations.push(...result.targetMutations);
      }

      // 체인 라이트닝 — 각 체인 타겟에 개별 affinity
      if (result.chainData) {
        allChainLightnings = allChainLightnings.concat(result.chainData.chains);
        result.chainData.damages.forEach((dmg, id) => {
          const chainAff = affMult(hit.element, id);
          pushEntry(id, Math.floor(dmg * chainAff), dmgOpts);
        });
      }

      if (hit.tier !== 4) {
        visualEffects.push({ id: Date.now() + Math.random(), x: hit.x, y: hit.y, type: 'hit', color: hit.color });
      }
    });

    return {
      damageMap,
      statusEffects,
      visualEffects,
      chainLightnings: allChainLightnings,
      targetMutations,
    };
  },

  /**
   * 타워에 Ability 할당 (tower.js에서 호출)
   * @param {Object} tower - 타워 객체
   * @returns {Object} Ability가 할당된 타워
   */
  assignAbility(tower) {
    const ability = this.createAbility(tower.element, tower.tier, tower.role);
    return {
      ...tower,
      ability: ability,
      abilityType: ability.type,
    };
  },
};
