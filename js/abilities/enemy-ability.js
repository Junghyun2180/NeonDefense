// Neon Defense - 적 Ability
// 각 적 타입별 특수 능력 (디버프, 힐, 분열 등)

// ===== 적 Ability 기본 클래스 =====
class EnemyAbility extends Ability {
  static TYPE = 'enemy';

  constructor(enemyType) {
    const config = ENEMY_CONFIG[enemyType] || {};
    super(1, config);
    this.type = EnemyAbility.TYPE;
    this.enemyType = enemyType;
  }

  /**
   * 매 틱마다 호출되는 능력
   * @param {Object} context - { enemy, towers, enemies, now, gameSpeed }
   * @returns {Object} 처리 결과
   */
  onTick(context) {
    return {
      towerDebuffs: [],    // 타워에 적용할 디버프
      enemyHeals: [],      // 적에게 적용할 힐
      visualEffects: [],
      spawnEnemies: [],    // 분열 시 생성할 적
    };
  }

  /**
   * 사망 시 호출
   */
  onDeath(context) {
    return {
      spawnEnemies: [],
      visualEffects: [],
    };
  }

  getDescription() {
    return '일반';
  }
}

// ===== 일반 적 (특수 능력 없음) =====
class NormalEnemyAbility extends EnemyAbility {
  static TYPE = 'normalEnemy';

  constructor() {
    super('normal');
    this.type = NormalEnemyAbility.TYPE;
  }

  getDescription() {
    return '일반 적';
  }
}

// ===== 빠른 적 (특수 능력 없음, 빠른 이동) =====
class FastEnemyAbility extends EnemyAbility {
  static TYPE = 'fastEnemy';

  constructor() {
    super('fast');
    this.type = FastEnemyAbility.TYPE;
  }

  getDescription() {
    return '빠른 적';
  }
}

// ===== 엘리트 적 (높은 체력) =====
class EliteEnemyAbility extends EnemyAbility {
  static TYPE = 'eliteEnemy';

  constructor() {
    super('elite');
    this.type = EliteEnemyAbility.TYPE;
  }

  getDescription() {
    return '엘리트 적 (고체력)';
  }
}

// ===== 보스 적 (매우 높은 체력) =====
class BossEnemyAbility extends EnemyAbility {
  static TYPE = 'bossEnemy';

  constructor() {
    super('boss');
    this.type = BossEnemyAbility.TYPE;
  }

  getDescription() {
    return '보스 (최고 체력)';
  }
}

// ===== 재머 적 (타워 공속 감소) =====
class JammerEnemyAbility extends EnemyAbility {
  static TYPE = 'jammerEnemy';

  constructor() {
    super('jammer');
    this.type = JammerEnemyAbility.TYPE;
  }

  onTick(context) {
    const { enemy, towers, now } = context;
    const result = {
      towerDebuffs: [],
      enemyHeals: [],
      visualEffects: [],
      spawnEnemies: [],
    };

    const debuffRange = this.config.debuffRange || 100;
    const debuffFactor = this.config.debuffFactor || 0.4;

    towers.forEach(tower => {
      const dist = calcDistance(enemy.x, enemy.y, tower.x, tower.y);
      if (dist <= debuffRange) {
        result.towerDebuffs.push({
          towerId: tower.id,
          debuffType: 'speed',
          factor: debuffFactor,
          sourceId: enemy.id,
        });
      }
    });

    return result;
  }

  getDescription() {
    return `재머 (타워 공속 ${Math.round((1 - this.config.debuffFactor) * 100)}% 감소)`;
  }
}

// ===== 서프레서 적 (타워 공격력 감소) =====
class SuppressorEnemyAbility extends EnemyAbility {
  static TYPE = 'suppressorEnemy';

  constructor() {
    super('suppressor');
    this.type = SuppressorEnemyAbility.TYPE;
  }

  onTick(context) {
    const { enemy, towers, now } = context;
    const result = {
      towerDebuffs: [],
      enemyHeals: [],
      visualEffects: [],
      spawnEnemies: [],
    };

    const debuffRange = this.config.debuffRange || 100;
    const debuffFactor = this.config.debuffFactor || 0.5;

    towers.forEach(tower => {
      const dist = calcDistance(enemy.x, enemy.y, tower.x, tower.y);
      if (dist <= debuffRange) {
        result.towerDebuffs.push({
          towerId: tower.id,
          debuffType: 'damage',
          factor: debuffFactor,
          sourceId: enemy.id,
        });
      }
    });

    return result;
  }

  getDescription() {
    return `서프레서 (타워 공격력 ${Math.round((1 - this.config.debuffFactor) * 100)}% 감소)`;
  }
}

// ===== 힐러 적 (주변 적 회복) =====
class HealerEnemyAbility extends EnemyAbility {
  static TYPE = 'healerEnemy';

  constructor() {
    super('healer');
    this.type = HealerEnemyAbility.TYPE;
    this.lastHealTime = 0;
  }

  onTick(context) {
    const { enemy, enemies, now } = context;
    const result = {
      towerDebuffs: [],
      enemyHeals: [],
      visualEffects: [],
      spawnEnemies: [],
    };

    const healRange = this.config.healRange || 80;
    const healAmount = this.config.healAmount || 0.05;
    const healInterval = this.config.healInterval || 1000;

    // 쿨다운 체크 (enemy.lastHealTime 사용)
    if (now - (enemy.lastHealTime || 0) < healInterval) {
      return result;
    }

    // 주변 적 회복
    enemies.forEach(target => {
      if (target.id === enemy.id) return; // 자기 자신 제외
      if (target.health >= target.maxHealth) return; // 풀피 제외

      const dist = calcDistance(enemy.x, enemy.y, target.x, target.y);
      if (dist <= healRange) {
        const healValue = Math.floor(target.maxHealth * healAmount);
        result.enemyHeals.push({
          targetId: target.id,
          healAmount: healValue,
          sourceId: enemy.id,
        });
        result.visualEffects.push({
          id: Date.now() + Math.random(),
          x: target.x,
          y: target.y,
          type: 'heal',
          color: '#22c55e',
        });
      }
    });

    // 힐러 쿨다운 갱신 플래그
    if (result.enemyHeals.length > 0) {
      result.updateHealerCooldown = true;
    }

    return result;
  }

  getDescription() {
    return `힐러 (주변 적 ${Math.round(this.config.healAmount * 100)}% 회복)`;
  }
}

// ===== 분열체 적 (사망 시 분열) =====
class SplitterEnemyAbility extends EnemyAbility {
  static TYPE = 'splitterEnemy';

  constructor() {
    super('splitter');
    this.type = SplitterEnemyAbility.TYPE;
  }

  onDeath(context) {
    const { enemy } = context;
    const result = {
      spawnEnemies: [],
      visualEffects: [],
    };

    // 이미 분열된 자식이면 재분열 방지
    if (enemy.isSplitChild) {
      return result;
    }

    const splitCount = this.config.splitCount || 2;
    const splitHealthMult = this.config.splitHealthMult || 0.4;
    const splitSpeedMult = this.config.splitSpeedMult || 1.3;

    for (let i = 0; i < splitCount; i++) {
      const splitEnemy = {
        id: Date.now() + Math.random() + i,
        type: 'normal',
        health: Math.floor(enemy.maxHealth * splitHealthMult),
        maxHealth: Math.floor(enemy.maxHealth * splitHealthMult),
        pathIndex: enemy.pathIndex,
        pathId: enemy.pathId,
        pathTiles: enemy.pathTiles,
        baseSpeed: enemy.baseSpeed * splitSpeedMult,
        speed: enemy.baseSpeed * splitSpeedMult,
        debuffRange: 0,
        goldReward: Math.floor(ENEMY_CONFIG.normal.goldReward / 2),
        x: enemy.x + (Math.random() - 0.5) * 20,
        y: enemy.y + (Math.random() - 0.5) * 20,
        ...StatusEffectSystem.getDefaultFields(),
        lastHealTime: 0,
        isSplitChild: true,
      };
      result.spawnEnemies.push(splitEnemy);
    }

    result.visualEffects.push({
      id: Date.now() + Math.random(),
      x: enemy.x,
      y: enemy.y,
      type: 'split',
      color: '#84cc16',
    });

    return result;
  }

  getDescription() {
    return `분열체 (사망 시 ${this.config.splitCount}마리로 분열)`;
  }
}

// ===== EnemyAbilitySystem =====
const EnemyAbilitySystem = {
  // 적 타입 → Ability 클래스 매핑
  _abilities: {
    'normal': NormalEnemyAbility,
    'fast': FastEnemyAbility,
    'elite': EliteEnemyAbility,
    'boss': BossEnemyAbility,
    'jammer': JammerEnemyAbility,
    'suppressor': SuppressorEnemyAbility,
    'healer': HealerEnemyAbility,
    'splitter': SplitterEnemyAbility,
  },

  /**
   * 적 타입에 맞는 Ability 생성
   */
  createAbility(enemyType) {
    const AbilityClass = this._abilities[enemyType];
    if (AbilityClass) {
      return new AbilityClass();
    }
    return new NormalEnemyAbility();
  },

  /**
   * 적에게 Ability 할당
   */
  assignAbility(enemy) {
    const ability = this.createAbility(enemy.type);
    return {
      ...enemy,
      ability: ability,
      abilityType: ability.type,
    };
  },

  /**
   * 모든 적의 타워 디버프 계산 (기존 calcDebuffs 대체)
   */
  calculateTowerDebuffs(enemies, towers) {
    const towerDebuffs = new Map(); // towerId -> { speedDebuff, damageDebuff }

    // 초기화
    towers.forEach(tower => {
      towerDebuffs.set(tower.id, { speed: 1, damage: 1 });
    });

    // 재머/서프레서 처리
    enemies.forEach(enemy => {
      if (!enemy.ability) return;
      if (enemy.ability.type !== 'jammerEnemy' && enemy.ability.type !== 'suppressorEnemy') return;

      const result = enemy.ability.onTick({
        enemy,
        towers,
        enemies: [],
        now: Date.now(),
      });

      result.towerDebuffs.forEach(debuff => {
        const current = towerDebuffs.get(debuff.towerId);
        if (!current) return;

        if (debuff.debuffType === 'speed') {
          current.speed = Math.max(current.speed * debuff.factor, COMBAT.debuffMinFactor);
        } else if (debuff.debuffType === 'damage') {
          current.damage = Math.max(current.damage * debuff.factor, COMBAT.debuffMinFactor);
        }
      });
    });

    return towerDebuffs;
  },

  /**
   * 힐러의 힐 처리
   */
  processHealerHeals(enemies, now) {
    const heals = new Map(); // enemyId -> totalHeal
    const visualEffects = [];
    const updatedHealers = new Set(); // 쿨다운 갱신할 힐러 ID

    enemies.forEach(enemy => {
      if (!enemy.ability || enemy.ability.type !== 'healerEnemy') return;

      const result = enemy.ability.onTick({
        enemy,
        towers: [],
        enemies,
        now,
      });

      result.enemyHeals.forEach(heal => {
        const current = heals.get(heal.targetId) || 0;
        heals.set(heal.targetId, current + heal.healAmount);
      });

      visualEffects.push(...result.visualEffects);

      if (result.updateHealerCooldown) {
        updatedHealers.add(enemy.id);
      }
    });

    return { heals, visualEffects, updatedHealers };
  },

  /**
   * 분열체 사망 처리
   */
  processSplitterDeath(enemy) {
    if (!enemy.ability || enemy.ability.type !== 'splitterEnemy') {
      return { spawnEnemies: [], visualEffects: [] };
    }

    return enemy.ability.onDeath({ enemy });
  },
};
