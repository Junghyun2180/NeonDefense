// Node.js 시뮬 환경 — 브라우저의 classic script 여러 개를 하나의 vm 컨텍스트에서 로드
// JSX 파일은 제외하고 순수 JS(도메인 + 인프라)만 로드
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

// index.html 로드 순서와 일치
const FILES = [
  'js/domain/config/constants.js',
  'js/infra/utils.js',
  'js/infra/sound.js',
  'js/infra/save-system.js',
  'js/domain/config/run-mode-constants.js',
  'js/infra/run-mode.js',
  'js/domain/config/mode-abilities.js',
  'js/domain/config/game-data.js',
  'js/domain/config/data-resolver.js',
  'js/infra/run-save-system.js',
  'js/infra/daily-challenge.js',
  'js/domain/progression/leaderboard.js',
  'js/domain/progression/achievement-system.js',
  'js/infra/balance-logger.js',
  'js/domain/effect/status-effect.js',
  'js/domain/effect/synergy-system.js',
  'js/domain/progression/permanent-buff.js',
  'js/domain/progression/game-stats.js',
  'js/infra/help-data.js',
  'js/domain/tower/ability.js',
  'js/domain/tower/abilities/fire-ability.js',
  'js/domain/tower/abilities/water-ability.js',
  'js/domain/tower/abilities/electric-ability.js',
  'js/domain/tower/abilities/wind-ability.js',
  'js/domain/tower/abilities/void-ability.js',
  'js/domain/tower/abilities/light-ability.js',
  'js/domain/tower/ability-system.js',
  'js/domain/tower/abilities/support-ability.js',
  'js/domain/enemy/abilities/enemy-ability.js',
  'js/domain/tower/tower-system.js',
  'js/domain/enemy/enemy-system.js',
  'js/domain/combat/game-engine.js',
];

// localStorage 간이 shim
class MemoryStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] ?? null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

function createContext() {
  const window = {};
  const ctx = {
    window,
    globalThis: null,    // 자기 참조 아래에서 채움
    console,
    Date,
    Math,
    JSON,
    Array,
    Object,
    Map,
    Set,
    Number,
    String,
    Boolean,
    Error,
    TypeError,
    RangeError,
    Symbol,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
    performance: { now: () => Date.now() },
    // soundManager 등 UI 의존 모듈이 호출하는 객체들
    document: { addEventListener: () => {}, createElement: () => ({}) },
    AudioContext: function () { return { createGain: () => ({}), createOscillator: () => ({ connect: () => {}, start: () => {}, stop: () => {} }) }; },
    webkitAudioContext: undefined,
  };
  ctx.globalThis = ctx;
  // window를 그대로 이 컨텍스트 자체와 매핑
  // (전역 할당 `window.X = X` 가 그대로 동작하려면 window === ctx 가 이상적이지만, vm은 분리)
  // 대신 window 프로퍼티를 참조할 수 있도록 Proxy로 방어
  return ctx;
}

function concatSources(files) {
  return files.map(f => {
    const abs = path.join(ROOT, f);
    const src = fs.readFileSync(abs, 'utf-8');
    return `// ===== ${f} =====\n${src}`;
  }).join('\n\n');
}

// 노출할 이름 — 각 시스템/상수를 sim에서 사용
const EXPORT_NAMES = [
  // 시스템
  'AbilitySystem', 'SupportAbilitySystem', 'EnemyAbilitySystem',
  'TowerSystem', 'EnemySystem', 'GameEngine',
  'StatusEffectSystem', 'StatusEffectManager', 'SynergySystem',
  'PermanentBuffManager', 'GameStats',
  'RunMode', 'DataResolver', 'ModeAbilityHelper', 'BuffHelper',
  // 상수
  'ELEMENT_TYPES', 'ELEMENT_EFFECTS', 'ELEMENT_UI', 'NEON_TYPES',
  'SUPPORT_TYPES', 'SUPPORT_UI', 'SUPPORT_CONFIG', 'SUPPORT_CAPS',
  'T4_ROLES', 'COMBAT', 'SPAWN', 'ECONOMY', 'HEALTH_SCALING',
  'TILE_SIZE', 'GRID_WIDTH', 'GRID_HEIGHT', 'CARRYOVER',
  'RUN_SPAWN', 'RUN_ECONOMY', 'RUN_HEALTH_SCALING', 'RUN_CARRYOVER',
  'RUSH_SPAWN', 'RUSH_ECONOMY', 'RUSH_HEALTH_SCALING', 'RUSH_CARRYOVER',
  'BOSS_RUSH_SPAWN', 'BOSS_RUSH_ECONOMY',
  'ENEMY_TYPES', 'ENEMY_SPAWN_RULES', 'CRYSTAL_REWARDS', 'META_UPGRADES',
  'ARRAY_LENGTHS',
  // 효과 클래스 (필요하면 내부에서 인스턴스화)
  'StatusEffect', 'BurnEffect', 'SlowEffect', 'FreezeEffect', 'StunEffect',
  'KnockbackEffect', 'PullEffect', 'VulnerabilityEffect', 'RegenerationEffect',
  'AttackBuffEffect', 'AttackSpeedBuffEffect', 'RangeBuffEffect',
  'AttackSpeedDebuffEffect', 'DamageDebuffEffect',
  // 게임 맵 유틸
  'generateMultiplePaths', 'generateSquarePath', 'calcDistance',
];

function load() {
  const ctx = createContext();
  const src = concatSources(FILES);
  // 한 함수 스코프에서 전체 코드를 실행 → 반환할 이름들을 객체로 노출
  const returnExpr = `return { ${EXPORT_NAMES.map(n => `${n}: (typeof ${n} !== 'undefined' ? ${n} : undefined)`).join(', ')} };`;
  const body = src + '\n\n' + returnExpr;
  const argNames = Object.keys(ctx);
  const argValues = argNames.map(n => ctx[n]);
  // eslint-disable-next-line no-new-func
  const fn = new Function(...argNames, body);
  const exported = fn.apply(ctx, argValues);
  return { ...ctx, ...exported };
}

module.exports = { load, createContext, FILES };
