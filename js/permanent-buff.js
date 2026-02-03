// Neon Defense - 영구 버프 시스템 (스테이지 클리어 보상)
// 로그라이크 스타일: 스테이지 클리어 시 3장 중 1장 선택

// ===== 영구 버프 정의 =====
const PERMANENT_BUFFS = {
  // 공격 관련
  damageUp: {
    id: 'damageUp',
    name: '화력 강화',
    icon: '⚔️',
    color: '#FF6B6B',
    description: '모든 타워 공격력 +10%',
    stackable: true,
    maxStacks: 5,
    effect: { type: 'damage', value: 0.10 },
  },
  attackSpeedUp: {
    id: 'attackSpeedUp',
    name: '속사포',
    icon: '⏱️',
    color: '#FFD93D',
    description: '모든 타워 공격속도 +8%',
    stackable: true,
    maxStacks: 5,
    effect: { type: 'attackSpeed', value: 0.08 },
  },
  rangeUp: {
    id: 'rangeUp',
    name: '원거리 사격',
    icon: '🎯',
    color: '#45B7D1',
    description: '모든 타워 사거리 +12%',
    stackable: true,
    maxStacks: 4,
    effect: { type: 'range', value: 0.12 },
  },
  critChance: {
    id: 'critChance',
    name: '치명타 훈련',
    icon: '💥',
    color: '#FF4500',
    description: '모든 공격 15% 확률로 2배 데미지',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'crit', chance: 0.15, multiplier: 2.0 },
  },

  // 경제 관련
  goldBonus: {
    id: 'goldBonus',
    name: '금광 발견',
    icon: '💰',
    color: '#FFD700',
    description: '적 처치 시 골드 +20%',
    stackable: true,
    maxStacks: 4,
    effect: { type: 'goldBonus', value: 0.20 },
  },
  drawDiscount: {
    id: 'drawDiscount',
    name: '대량 구매',
    icon: '🏷️',
    color: '#98FB98',
    description: '타워 뽑기 비용 -3G',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'drawDiscount', value: 3 },
  },
  interestRate: {
    id: 'interestRate',
    name: '복리 이자',
    icon: '🏦',
    color: '#C0C0C0',
    description: '웨이브 종료 시 보유 골드의 5% 이자',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'interest', value: 0.05 },
  },

  // 생존 관련
  lifeSteal: {
    id: 'lifeSteal',
    name: '생명력 흡수',
    icon: '❤️‍🩹',
    color: '#FF69B4',
    description: '적 10마리 처치 시 목숨 +1 (웨이브당 1회)',
    stackable: false,
    maxStacks: 1,
    effect: { type: 'lifeSteal', killsRequired: 10 },
  },
  startingLives: {
    id: 'startingLives',
    name: '강화 방어선',
    icon: '🛡️',
    color: '#4169E1',
    description: '최대 목숨 +3',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'maxLives', value: 3 },
  },

  // 특수 효과
  burnDuration: {
    id: 'burnDuration',
    name: '지속 화염',
    icon: '🔥',
    color: '#FF4500',
    description: '화상 지속시간 +30%',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'burnDuration', value: 0.30 },
  },
  slowPower: {
    id: 'slowPower',
    name: '빙결 강화',
    icon: '❄️',
    color: '#00CED1',
    description: '슬로우 효과 +15%',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'slowPower', value: 0.15 },
  },
  chainBonus: {
    id: 'chainBonus',
    name: '연쇄 번개',
    icon: '⚡',
    color: '#FFD93D',
    description: '체인 라이트닝 +1 연쇄',
    stackable: true,
    maxStacks: 3,
    effect: { type: 'chainBonus', value: 1 },
  },
};

// ===== 영구 버프 관리자 =====
const PermanentBuffManager = {
  // 현재 활성화된 버프들 (App.jsx에서 상태로 관리)
  // 형식: { buffId: stackCount }

  // 랜덤 버프 3개 선택 (중복 방지, 스택 제한 고려)
  getRandomBuffChoices(currentBuffs, count = 3) {
    const availableBuffs = Object.values(PERMANENT_BUFFS).filter(buff => {
      const currentStacks = currentBuffs[buff.id] || 0;
      return currentStacks < buff.maxStacks;
    });

    // 셔플
    const shuffled = [...availableBuffs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  // 버프 적용 (스택 증가)
  applyBuff(currentBuffs, buffId) {
    const buff = PERMANENT_BUFFS[buffId];
    if (!buff) return currentBuffs;

    const currentStacks = currentBuffs[buffId] || 0;
    if (currentStacks >= buff.maxStacks) return currentBuffs;

    return {
      ...currentBuffs,
      [buffId]: currentStacks + 1,
    };
  },

  // 특정 효과 타입의 총합 계산
  getTotalEffect(currentBuffs, effectType) {
    let total = 0;

    Object.entries(currentBuffs).forEach(([buffId, stacks]) => {
      const buff = PERMANENT_BUFFS[buffId];
      if (buff && buff.effect.type === effectType) {
        total += buff.effect.value * stacks;
      }
    });

    return total;
  },

  // 데미지 배율 계산 (기본 1.0 + 버프)
  getDamageMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'damage');
  },

  // 공속 배율 계산
  getAttackSpeedMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'attackSpeed');
  },

  // 사거리 배율 계산
  getRangeMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'range');
  },

  // 골드 보너스 배율 계산
  getGoldMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'goldBonus');
  },

  // 뽑기 비용 할인 계산
  getDrawDiscount(currentBuffs) {
    return this.getTotalEffect(currentBuffs, 'drawDiscount');
  },

  // 이자율 계산
  getInterestRate(currentBuffs) {
    return this.getTotalEffect(currentBuffs, 'interest');
  },

  // 추가 최대 목숨 계산
  getBonusMaxLives(currentBuffs) {
    return this.getTotalEffect(currentBuffs, 'maxLives');
  },

  // 화상 지속시간 배율
  getBurnDurationMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'burnDuration');
  },

  // 슬로우 강화 배율
  getSlowPowerMultiplier(currentBuffs) {
    return 1 + this.getTotalEffect(currentBuffs, 'slowPower');
  },

  // 체인 보너스
  getChainBonus(currentBuffs) {
    return Math.floor(this.getTotalEffect(currentBuffs, 'chainBonus'));
  },

  // 크리티컬 정보
  getCritInfo(currentBuffs) {
    const buff = PERMANENT_BUFFS.critChance;
    const stacks = currentBuffs.critChance || 0;
    if (stacks === 0) return { chance: 0, multiplier: 1 };
    return {
      chance: buff.effect.chance * stacks,
      multiplier: buff.effect.multiplier,
    };
  },

  // 생명력 흡수 활성화 여부
  hasLifeSteal(currentBuffs) {
    return (currentBuffs.lifeSteal || 0) > 0;
  },

  // 활성화된 버프 목록 (UI 표시용)
  getActiveBuffsList(currentBuffs) {
    return Object.entries(currentBuffs)
      .filter(([_, stacks]) => stacks > 0)
      .map(([buffId, stacks]) => ({
        ...PERMANENT_BUFFS[buffId],
        stacks,
      }));
  },

  // 버프 효과 요약 텍스트
  getBuffSummary(buffId, stacks) {
    const buff = PERMANENT_BUFFS[buffId];
    if (!buff) return '';

    switch (buff.effect.type) {
      case 'damage':
        return `공격력 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'attackSpeed':
        return `공속 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'range':
        return `사거리 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'goldBonus':
        return `골드 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'drawDiscount':
        return `뽑기 -${buff.effect.value * stacks}G`;
      case 'interest':
        return `이자 ${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'maxLives':
        return `목숨 +${buff.effect.value * stacks}`;
      case 'burnDuration':
        return `화상 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'slowPower':
        return `슬로우 +${Math.round(buff.effect.value * stacks * 100)}%`;
      case 'chainBonus':
        return `체인 +${buff.effect.value * stacks}`;
      case 'crit':
        return `크리 ${Math.round(buff.effect.chance * stacks * 100)}%`;
      case 'lifeSteal':
        return '10킬당 목숨 +1';
      default:
        return '';
    }
  },
};

// 글로벌 등록
window.PERMANENT_BUFFS = PERMANENT_BUFFS;
window.PermanentBuffManager = PermanentBuffManager;
