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
    const damageMap = new Map();
    const statusEffects = [];
    const visualEffects = [];
    let allChainLightnings = [];
    const chainDamagesAll = new Map();

    hits.forEach(hit => {
      let finalDamage = hit.damage;

      // 크리티컬 이펙트 (기존 로직 유지)
      if (hit.isCrit) {
        visualEffects.push({
          id: Date.now() + Math.random(),
          x: hit.x,
          y: hit.y,
          type: 'crit',
          color: '#FFD700',
        });
      }

      // Ability 실행
      const result = this.resolveHit(hit, currentEnemies, permanentBuffs);

      // 데미지 배율 적용
      finalDamage = Math.floor(finalDamage * result.damageModifier);
      finalDamage += result.additionalDamage;

      // 주 대상 데미지
      damageMap.set(hit.enemyId, (damageMap.get(hit.enemyId) || 0) + finalDamage);

      // 상태이상 수집
      statusEffects.push(...result.statusEffects);

      // 시각 효과 수집
      visualEffects.push(...result.visualEffects);

      // 광역 대상 처리
      result.aoeTargets.forEach(aoe => {
        damageMap.set(aoe.enemy.id, (damageMap.get(aoe.enemy.id) || 0) + aoe.damage);
        if (aoe.statusEffects) {
          statusEffects.push(...aoe.statusEffects);
        }
      });

      // 관통 대상 처리
      result.pierceTargets.forEach(pierce => {
        damageMap.set(pierce.enemy.id, (damageMap.get(pierce.enemy.id) || 0) + pierce.damage);
      });

      // 체인 라이트닝 처리
      if (result.chainData) {
        allChainLightnings = allChainLightnings.concat(result.chainData.chains);
        result.chainData.damages.forEach((dmg, id) => {
          chainDamagesAll.set(id, (chainDamagesAll.get(id) || 0) + dmg);
        });
      }

      // 기본 hit 이펙트 (T4가 아닐 때)
      if (hit.tier !== 4) {
        visualEffects.push({
          id: Date.now() + Math.random(),
          x: hit.x,
          y: hit.y,
          type: 'hit',
          color: hit.color,
        });
      }
    });

    // 체인 데미지 병합
    chainDamagesAll.forEach((dmg, id) => {
      damageMap.set(id, (damageMap.get(id) || 0) + dmg);
    });

    return {
      damageMap,
      statusEffects,
      visualEffects,
      chainLightnings: allChainLightnings,
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
