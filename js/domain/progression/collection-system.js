// Neon Defense - 카드 수집 시스템
// 플레이어가 생성한/만난 타워/적/서포트를 도감에 기록
// 첫 획득 시 카드 잠금 해제, 누적 생성 횟수로 카드 레벨 상승
//
// 저장: localStorage 'neonDefense_collection_v1'
//
// 데이터 구조:
// {
//   tower: { "fire-1": { unlocked: ts, count: N, level: N }, ... },
//   towerRole: { "fire-A": { unlocked: ts, count: N, level: N }, ... },
//   support: { "dmg-1": { unlocked: ts, count: N, level: N }, ... },
//   enemy: { "normal": { unlocked: ts, kills: N }, ... },
// }

const CollectionSystem = {
  STORAGE_KEY: 'neonDefense_collection_v1',

  // ===== 카드 DB 정의 =====
  // 공격 타워 (속성×티어): 24장
  TOWER_CARDS: (() => {
    const ELEMENTS = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    const NAMES_KO = {
      fire: '화염', water: '냉기', electric: '전격',
      wind: '질풍', void: '공허', light: '광휘',
    };
    const ICONS = {
      fire: '🔥', water: '❄️', electric: '⚡',
      wind: '🌪️', void: '🌀', light: '💎',
    };
    const cards = {};
    ELEMENTS.forEach((elem, eIdx) => {
      for (let tier = 1; tier <= 4; tier++) {
        cards[`${elem}-${tier}`] = {
          id: `${elem}-${tier}`,
          kind: 'tower',
          element: eIdx,
          tier,
          name: `T${tier} ${NAMES_KO[elem]}`,
          icon: ICONS[elem],
          rarity: tier === 4 ? 'legendary' : tier === 3 ? 'epic' : tier === 2 ? 'rare' : 'common',
        };
      }
    });
    return cards;
  })(),

  // T4 역할 카드 (속성×역할): 18장
  TOWER_ROLE_CARDS: (() => {
    const ELEMENTS = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    const NAMES_KO = { fire: '화염', water: '냉기', electric: '전격', wind: '질풍', void: '공허', light: '광휘' };
    const ICONS = { fire: '🔥', water: '❄️', electric: '⚡', wind: '🌪️', void: '🌀', light: '💎' };
    const cards = {};
    ELEMENTS.forEach((elem, eIdx) => {
      ['A', 'B', 'C'].forEach(role => {
        cards[`${elem}-${role}`] = {
          id: `${elem}-${role}`,
          kind: 'towerRole',
          element: eIdx,
          role,
          name: `T4 ${NAMES_KO[elem]}-${role}`,
          icon: ICONS[elem],
          rarity: 'legendary',
        };
      });
    });
    return cards;
  })(),

  // 서포트 카드: 4종 × 3티어 = 12장
  SUPPORT_CARDS: (() => {
    const TYPES = ['damage', 'speed', 'defense', 'range'];
    const NAMES_KO = { damage: '공격력', speed: '공속', defense: '방감', range: '사거리' };
    const ICONS = { damage: '⚔️', speed: '⏱️', defense: '🛡️', range: '🎯' };
    const cards = {};
    TYPES.forEach((t, tIdx) => {
      for (let tier = 1; tier <= 3; tier++) {
        cards[`sup-${t}-${tier}`] = {
          id: `sup-${t}-${tier}`,
          kind: 'support',
          supportType: tIdx,
          tier,
          name: `S${tier} ${NAMES_KO[t]}`,
          icon: ICONS[t],
          rarity: tier === 3 ? 'epic' : tier === 2 ? 'rare' : 'common',
        };
      }
    });
    return cards;
  })(),

  // 적 카드: 8종
  ENEMY_CARDS: {
    normal:     { id: 'normal',     kind: 'enemy', name: '일반', icon: '🟣', rarity: 'common' },
    fast:       { id: 'fast',       kind: 'enemy', name: '빠름', icon: '🟦', rarity: 'common' },
    elite:      { id: 'elite',      kind: 'enemy', name: '엘리트', icon: '⭐', rarity: 'rare' },
    boss:       { id: 'boss',       kind: 'enemy', name: '보스', icon: '👑', rarity: 'legendary' },
    jammer:     { id: 'jammer',     kind: 'enemy', name: '재머', icon: '📡', rarity: 'rare' },
    suppressor: { id: 'suppressor', kind: 'enemy', name: '서프레서', icon: '🛡️', rarity: 'rare' },
    healer:     { id: 'healer',     kind: 'enemy', name: '힐러', icon: '💚', rarity: 'epic' },
    splitter:   { id: 'splitter',   kind: 'enemy', name: '분열체', icon: '🟢', rarity: 'epic' },
  },

  // ===== 저장/불러오기 =====
  _emptyState() {
    return { tower: {}, towerRole: {}, support: {}, enemy: {} };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this._emptyState();
      const parsed = JSON.parse(raw);
      return {
        tower: parsed.tower || {},
        towerRole: parsed.towerRole || {},
        support: parsed.support || {},
        enemy: parsed.enemy || {},
      };
    } catch {
      return this._emptyState();
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage not available
    }
  },

  reset() {
    this.save(this._emptyState());
  },

  // ===== 레벨 계산 (5개당 1레벨, 최대 10) =====
  countToLevel(count) {
    return Math.min(10, Math.floor(count / 5));
  },
  countForNextLevel(count) {
    const lvl = this.countToLevel(count);
    if (lvl >= 10) return 0;
    return (lvl + 1) * 5 - count;
  },

  // ===== 기록 헬퍼 =====
  _touch(bucket, key) {
    if (!bucket[key]) {
      bucket[key] = { unlocked: Date.now(), count: 0, level: 0 };
    }
    bucket[key].count += 1;
    bucket[key].level = this.countToLevel(bucket[key].count);
    return bucket[key];
  },

  // 타워 생성 기록
  recordTower(element, tier, role = null) {
    const state = this.load();
    const elementKey = ['fire', 'water', 'electric', 'wind', 'void', 'light'][element];
    if (!elementKey) return;
    this._touch(state.tower, `${elementKey}-${tier}`);
    if (tier === 4 && role) {
      this._touch(state.towerRole, `${elementKey}-${role}`);
    }
    this.save(state);
  },

  // 서포트 생성 기록
  recordSupport(supportType, tier) {
    const state = this.load();
    const typeKey = ['damage', 'speed', 'defense', 'range'][supportType];
    if (!typeKey) return;
    this._touch(state.support, `sup-${typeKey}-${tier}`);
    this.save(state);
  },

  // 적 처치 기록
  recordEnemyKill(enemyType) {
    if (!this.ENEMY_CARDS[enemyType]) return;
    const state = this.load();
    const bucket = state.enemy;
    if (!bucket[enemyType]) {
      bucket[enemyType] = { unlocked: Date.now(), count: 0, level: 0 };
    }
    bucket[enemyType].count += 1;
    bucket[enemyType].level = this.countToLevel(bucket[enemyType].count);
    this.save(state);
  },

  // ===== 조회 헬퍼 =====
  getAllCards() {
    return {
      tower: Object.values(this.TOWER_CARDS),
      towerRole: Object.values(this.TOWER_ROLE_CARDS),
      support: Object.values(this.SUPPORT_CARDS),
      enemy: Object.values(this.ENEMY_CARDS),
    };
  },

  getCompletion() {
    const state = this.load();
    const all = this.getAllCards();
    const total = all.tower.length + all.towerRole.length + all.support.length + all.enemy.length;
    const unlocked =
      Object.keys(state.tower).length +
      Object.keys(state.towerRole).length +
      Object.keys(state.support).length +
      Object.keys(state.enemy).length;
    return { total, unlocked, percent: Math.round((unlocked / total) * 100) };
  },

  getCardProgress(kind, id) {
    const state = this.load();
    const bucket = state[kind] || {};
    return bucket[id] || null;
  },

  // 카드 레벨 보너스 배율 (타워 공격력)
  // 예: 해당 속성-티어 카드 레벨 10 → +5%
  getTowerDamageBonus(element, tier) {
    const key = `${['fire', 'water', 'electric', 'wind', 'void', 'light'][element]}-${tier}`;
    const progress = this.getCardProgress('tower', key);
    if (!progress) return 1.0;
    return 1 + (progress.level * 0.005);  // 레벨당 +0.5%
  },
};

window.CollectionSystem = CollectionSystem;
