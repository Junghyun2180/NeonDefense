// Neon Defense - 전격(ELECTRIC) 속성 Ability
// 체인 라이트닝 + T4 특수 능력

// ===== 기본 전격 (T1~T3): 체인 라이트닝 =====
class ChainLightningAbility extends Ability {
  static TYPE = 'chainLightning';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC]);
    this.type = ChainLightningAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 영구 버프 적용
    const chainBonus = BuffHelper.getChainBonus(permanentBuffs);

    // 체인 라이트닝 처리
    const chainResult = this.processChain(
      hit.towerX, hit.towerY, hit.enemyId, hit.damage, enemies, chainBonus
    );

    result.chainData = {
      chains: chainResult.chains,
      damages: chainResult.chainDamages,
    };

    return result;
  }

  processChain(startX, startY, firstTargetId, damage, enemies, chainBonus = 0) {
    const chainCount = Math.max(1, this.getTierValue('chainCount', 2) + chainBonus);
    const chainRange = this.config.chainRange;
    const decay = this.config.chainDamageDecay;

    const hitEnemies = new Set([firstTargetId]);
    const chains = [];
    let currentDamage = damage;
    let lastX = startX, lastY = startY;
    const lastTarget = enemies.find(e => e.id === firstTargetId);

    if (lastTarget) {
      chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
      lastX = lastTarget.x;
      lastY = lastTarget.y;
    }

    const chainDamages = new Map();

    for (let i = 1; i < chainCount; i++) {
      currentDamage *= decay;
      if (currentDamage < 1) break;

      let nearestEnemy = null;
      let nearestDist = Infinity;

      enemies.forEach(enemy => {
        if (hitEnemies.has(enemy.id)) return;
        const dist = calcDistance(lastX, lastY, enemy.x, enemy.y);
        if (dist <= chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
      chains.push({ x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y, id: Date.now() + Math.random() + i });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    }

    return { chains, chainDamages };
  }

  getDescription() {
    return `체인 라이트닝 (${this.getTierValue('chainCount', 2)}회)`;
  }
}

// ===== T4 전격: 체인 집중형 =====
class ChainFocusAbility extends Ability {
  static TYPE = 'chainFocus';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC],
      chainBonus: 2, // 추가 체인 수
    });
    this.type = ChainFocusAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const permChainBonus = BuffHelper.getChainBonus(permanentBuffs);
    const totalChainBonus = this.config.chainBonus + permChainBonus;

    const chainResult = this.processChain(
      hit.towerX, hit.towerY, hit.enemyId, hit.damage, enemies, totalChainBonus
    );

    result.chainData = {
      chains: chainResult.chains,
      damages: chainResult.chainDamages,
    };

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-elec-chain',
      color: '#9400D3',
    });

    return result;
  }

  processChain(startX, startY, firstTargetId, damage, enemies, chainBonus = 0) {
    const chainCount = Math.max(1, this.getTierValue('chainCount', 2) + chainBonus);
    const chainRange = this.config.chainRange;
    const decay = this.config.chainDamageDecay;

    const hitEnemies = new Set([firstTargetId]);
    const chains = [];
    let currentDamage = damage;
    let lastX = startX, lastY = startY;
    const lastTarget = enemies.find(e => e.id === firstTargetId);

    if (lastTarget) {
      chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
      lastX = lastTarget.x;
      lastY = lastTarget.y;
    }

    const chainDamages = new Map();

    for (let i = 1; i < chainCount; i++) {
      currentDamage *= decay;
      if (currentDamage < 1) break;

      let nearestEnemy = null;
      let nearestDist = Infinity;

      enemies.forEach(enemy => {
        if (hitEnemies.has(enemy.id)) return;
        const dist = calcDistance(lastX, lastY, enemy.x, enemy.y);
        if (dist <= chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
      chains.push({ x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y, id: Date.now() + Math.random() + i });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    }

    return { chains, chainDamages };
  }

  getDescription() {
    return `체인 집중 (+${this.config.chainBonus} 체인)`;
  }
}

// ===== T4 전격: 과부하 제어형 =====
class ChainStunAbility extends Ability {
  static TYPE = 'chainStun';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC],
      chainStunChance: 0.3,
      chainStunDuration: 800,
    });
    this.type = ChainStunAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = {
      damageModifier: 1.0,
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    const chainBonus = BuffHelper.getChainBonus(permanentBuffs);

    const chainResult = this.processChain(
      hit.towerX, hit.towerY, hit.enemyId, hit.damage, enemies, chainBonus
    );

    // 체인 적중 시 스턴 확률
    chainResult.chainDamages.forEach((dmg, id) => {
      if (Math.random() < this.config.chainStunChance) {
        result.statusEffects.push({
          enemyId: id,
          type: 'freeze',
          duration: this.config.chainStunDuration,
        });
      }
    });

    result.chainData = {
      chains: chainResult.chains,
      damages: chainResult.chainDamages,
    };

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-elec-stun',
      color: '#00CED1',
    });

    return result;
  }

  processChain(startX, startY, firstTargetId, damage, enemies, chainBonus = 0) {
    const chainCount = Math.max(1, this.getTierValue('chainCount', 2) + chainBonus);
    const chainRange = this.config.chainRange;
    const decay = this.config.chainDamageDecay;

    const hitEnemies = new Set([firstTargetId]);
    const chains = [];
    let currentDamage = damage;
    let lastX = startX, lastY = startY;
    const lastTarget = enemies.find(e => e.id === firstTargetId);

    if (lastTarget) {
      chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
      lastX = lastTarget.x;
      lastY = lastTarget.y;
    }

    const chainDamages = new Map();

    for (let i = 1; i < chainCount; i++) {
      currentDamage *= decay;
      if (currentDamage < 1) break;

      let nearestEnemy = null;
      let nearestDist = Infinity;

      enemies.forEach(enemy => {
        if (hitEnemies.has(enemy.id)) return;
        const dist = calcDistance(lastX, lastY, enemy.x, enemy.y);
        if (dist <= chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
      chains.push({ x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y, id: Date.now() + Math.random() + i });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    }

    return { chains, chainDamages };
  }

  getDescription() {
    return `과부하 (${this.config.chainStunChance * 100}% 스턴)`;
  }
}

// ===== T4 전격: 번개 러너형 =====
class FirstStrikeAbility extends Ability {
  static TYPE = 'firstStrike';

  constructor(tier) {
    super(tier, {
      ...ELEMENT_EFFECTS[ELEMENT_TYPES.ELECTRIC],
      firstHitBonus: 0.5, // 첫 타격 50% 추가 피해
      chainPenalty: -2,   // 체인 수 감소
    });
    this.type = FirstStrikeAbility.TYPE;
  }

  onHit(context) {
    const { hit, enemies, permanentBuffs } = context;
    const result = {
      damageModifier: 1 + this.config.firstHitBonus, // 첫 타격 강화
      additionalDamage: 0,
      statusEffects: [],
      visualEffects: [],
      aoeTargets: [],
      chainData: null,
      pierceTargets: [],
    };

    // 체인 페널티로 체인 수 감소
    const chainBonus = this.config.chainPenalty;

    const chainResult = this.processChain(
      hit.towerX, hit.towerY, hit.enemyId, hit.damage, enemies, chainBonus
    );

    result.chainData = {
      chains: chainResult.chains,
      damages: chainResult.chainDamages,
    };

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: hit.x,
      y: hit.y,
      type: 't4-elec-first',
      color: '#FFD700',
    });

    return result;
  }

  processChain(startX, startY, firstTargetId, damage, enemies, chainBonus = 0) {
    const chainCount = Math.max(1, this.getTierValue('chainCount', 2) + chainBonus);
    const chainRange = this.config.chainRange;
    const decay = this.config.chainDamageDecay;

    const hitEnemies = new Set([firstTargetId]);
    const chains = [];
    let currentDamage = damage;
    let lastX = startX, lastY = startY;
    const lastTarget = enemies.find(e => e.id === firstTargetId);

    if (lastTarget) {
      chains.push({ x1: startX, y1: startY, x2: lastTarget.x, y2: lastTarget.y, id: Date.now() + Math.random() });
      lastX = lastTarget.x;
      lastY = lastTarget.y;
    }

    const chainDamages = new Map();

    for (let i = 1; i < chainCount; i++) {
      currentDamage *= decay;
      if (currentDamage < 1) break;

      let nearestEnemy = null;
      let nearestDist = Infinity;

      enemies.forEach(enemy => {
        if (hitEnemies.has(enemy.id)) return;
        const dist = calcDistance(lastX, lastY, enemy.x, enemy.y);
        if (dist <= chainRange && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) break;

      hitEnemies.add(nearestEnemy.id);
      chainDamages.set(nearestEnemy.id, Math.floor(currentDamage));
      chains.push({ x1: lastX, y1: lastY, x2: nearestEnemy.x, y2: nearestEnemy.y, id: Date.now() + Math.random() + i });
      lastX = nearestEnemy.x;
      lastY = nearestEnemy.y;
    }

    return { chains, chainDamages };
  }

  getDescription() {
    return `번개 러너 (첫 타격 +${this.config.firstHitBonus * 100}%)`;
  }
}
