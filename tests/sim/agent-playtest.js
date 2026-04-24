// 다양한 난이도/스타일 Agent로 Campaign 전체 플레이 시뮬레이션
// 스테이지별 상세 로그 + 각 agent 관점 피드백 자동 생성
'use strict';

const { load } = require('./loader');
const fs = require('fs');
const path = require('path');

const ELEMENTS = ['fire', 'water', 'electric', 'wind', 'void', 'light'];

// ================================================================
// 베이스 Agent — Campaign 플레이 + 스테이지별 로그
// ================================================================
class BaseAgent {
  constructor(g, opts = {}) {
    this.g = g;
    this.name = opts.name || 'BaseAgent';
    this.desc = opts.desc || '';
    this.opts = opts;
    this.cfg = {
      SPAWN: g.SPAWN, ECONOMY: g.ECONOMY,
      HEALTH_SCALING: g.HEALTH_SCALING, CARRYOVER: g.CARRYOVER,
      modeAbility: null, mapType: 'standard',
    };
    this.inventory = [];
    this.towers = [];
    this.supportTowers = [];
    this.supportInventory = [];
    this.gold = this.cfg.ECONOMY.startGold;
    this.lives = this.cfg.ECONOMY.startLives;
    this.stage = 1;
    this.wave = 1;
    this.enemies = [];
    this.projectiles = [];
    this.permanentBuffs = {};
    this.pathData = g.generateMultiplePaths(opts.seed || 1234, this.stage);
    this.spawnedCount = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.livesLost = 0;
    this.simTime = 0;
    this.lastSpawnAt = 0;
    this.lastActAt = 0;
    this.waveStartedAt = 0;

    // 스테이지별 상세 로그
    this.stageLogs = [];
    this.currentStageLog = this._newStageLog();

    // 전체 로그
    this.events = [];
  }

  _newStageLog() {
    return {
      stage: this.stage,
      startTime: this.simTime,
      endTime: null,
      startGold: this.gold,
      startLives: this.lives,
      endGold: null,
      endLives: null,
      towersPlaced: 0,
      towersByElement: { fire: 0, water: 0, electric: 0, wind: 0, void: 0, light: 0 },
      towersByTier: { 1: 0, 2: 0, 3: 0, 4: 0 },
      supportsPlaced: 0,
      drawCount: 0,
      combineCount: 0,
      t4RoleChoices: [],
      outcome: 'pending',
    };
  }

  // agent가 선호하는 속성 반환 (persona별 오버라이드)
  pickElement() {
    return Math.floor(Math.random() * 6);
  }

  // 자동 조합 사용 여부 (persona별)
  useAutoCombine() { return true; }

  // T4 역할 선택 전략 (persona별)
  pickT4Role(_element) { return 'A'; }

  // 배치할 후보 필터링 (persona별)
  filterPlaceable(_candidates) { return _candidates; }

  // act 사이클 (persona별 핵심 로직)
  act() {
    // 기본: 뽑기 → 자동조합 → 배치
    const ec = this.cfg.ECONOMY;
    const maxDraws = 10;
    for (let i = 0; i < maxDraws; i++) {
      if (this.gold < ec.drawCost || this.inventory.length >= ec.maxInventory) break;
      const elem = this.pickElement();
      const n = this.g.TowerSystem.create(1, elem);
      n.id = Math.random() * 1e12;
      this.inventory.push(n);
      this.gold -= ec.drawCost;
      this.currentStageLog.drawCount += 1;
    }
    if (this.useAutoCombine()) {
      const before = this.inventory.length;
      this.inventory = this.g.TowerSystem.combineAll(this.inventory);
      if (this.inventory.length < before) this.currentStageLog.combineCount += (before - this.inventory.length) / 2;
    }
    // T3→T4
    this._tryUpgradeT4();
    // 배치
    this._tryPlace();
  }

  _tryUpgradeT4() {
    let did = true;
    while (did) {
      did = false;
      for (let e = 0; e < 6; e++) {
        const matching = this.inventory.filter(x => x.tier === 3 && x.colorIndex === e);
        if (matching.length >= 3) {
          const ids = matching.slice(0, 3).map(x => x.id);
          const roleId = this.pickT4Role(e);
          const t4 = this.g.TowerSystem.createT4WithRole(e, roleId);
          if (!t4) continue;
          t4.id = Math.random() * 1e12;
          this.inventory = this.inventory.filter(x => !ids.includes(x.id));
          this.inventory.push(t4);
          this.currentStageLog.t4RoleChoices.push({ element: ELEMENTS[e], role: roleId });
          did = true;
        }
      }
    }
  }

  _tryPlace() {
    const sorted = [...this.inventory].sort((a, b) => b.tier - a.tier);
    for (const tower of sorted) {
      const spot = this._findSpot();
      if (!spot) break;
      const placed = this.g.TowerSystem.placeOnGrid(tower, spot.x, spot.y);
      placed.id = Math.random() * 1e12;
      this.towers.push(placed);
      this.inventory = this.inventory.filter(x => x.id !== tower.id);
      this.currentStageLog.towersPlaced += 1;
      this.currentStageLog.towersByElement[ELEMENTS[placed.colorIndex]] += 1;
      this.currentStageLog.towersByTier[placed.tier] += 1;
    }
  }

  _isOnPath(x, y) {
    for (const p of this.pathData.paths) {
      for (const t of p.tiles) if (t.x === x && t.y === y) return true;
    }
    return false;
  }

  _findSpot() {
    for (const p of this.pathData.paths) {
      for (const t of p.tiles) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const x = t.x + dx, y = t.y + dy;
          if (x < 0 || x >= this.g.GRID_WIDTH || y < 0 || y >= this.g.GRID_HEIGHT) continue;
          if (this._isOnPath(x, y)) continue;
          if (this.towers.some(tw => tw.gridX === x && tw.gridY === y)) continue;
          if (this.supportTowers.some(tw => tw.gridX === x && tw.gridY === y)) continue;
          return { x, y };
        }
      }
    }
    return null;
  }

  tick() {
    const g = this.g;
    const tickMs = g.COMBAT.gameLoopInterval;
    const now = this.simTime;

    // 스폰
    const totalEnemies = this.cfg.SPAWN.enemiesPerWave(this.stage, this.wave);
    const spawnDelay = this.cfg.SPAWN.spawnDelay(this.stage, this.wave);
    if (this.spawnedCount < totalEnemies && now - this.lastSpawnAt >= spawnDelay) {
      this.lastSpawnAt = now;
      const paths = this.pathData.paths;
      const pickedPath = paths[Math.floor(Math.random() * paths.length)];
      const newEnemy = g.EnemySystem.create(
        this.stage, this.wave, this.spawnedCount, totalEnemies,
        pickedPath.tiles, pickedPath.id, this.cfg.modeAbility
      );
      if (newEnemy) {
        newEnemy.spawnWave = this.wave;
        this.enemies.push(newEnemy);
        this.spawnedCount++;
        this.totalSpawned++;
      }
    }

    const result = g.GameEngine.gameTick({
      enemies: this.enemies,
      towers: this.towers,
      supportTowers: this.supportTowers,
      projectiles: this.projectiles,
      gameSpeed: 1,
      permanentBuffs: this.permanentBuffs,
    }, now);

    this.enemies = result.enemies;
    this.towers = result.towers;
    this.projectiles = result.projectiles;
    this.totalKilled += result.killedCount || 0;
    this.gold += result.goldEarned || 0;
    this.livesLost += result.livesLost || 0;
    this.lives -= result.livesLost || 0;

    // Campaign은 lives=0 게임오버
    if (this.lives <= 0) {
      this._closeStageLog('gameover');
      return { state: 'gameover', reason: 'lives' };
    }

    // 웨이브 클리어 판정 (조기 클리어)
    const currentWaveEnemies = this.enemies.filter(e => e.spawnWave === this.wave);
    if (this.spawnedCount >= totalEnemies && currentWaveEnemies.length === 0) {
      this.gold += this.cfg.ECONOMY.waveReward(this.wave);
      if (this.wave >= this.cfg.SPAWN.wavesPerStage) {
        this._closeStageLog('clear');
        if (this.stage >= this.cfg.SPAWN.maxStage) {
          return { state: 'clear' };
        }
        this.stage++;
        this.wave = 1;
        this.spawnedCount = 0;
        this.lastSpawnAt = now;
        this.waveStartedAt = now;
        this.pathData = g.generateMultiplePaths(this.opts.seed + this.stage, this.stage);
        this.enemies = [];
        this.projectiles = [];
        this.currentStageLog = this._newStageLog();
        return { state: 'stageclear' };
      } else {
        this.wave++;
        this.spawnedCount = 0;
        this.lastSpawnAt = now;
        this.waveStartedAt = now;
        return { state: 'waveclear' };
      }
    }

    this.simTime += tickMs;
    return { state: 'running' };
  }

  _closeStageLog(outcome) {
    this.currentStageLog.endTime = this.simTime;
    this.currentStageLog.endGold = this.gold;
    this.currentStageLog.endLives = this.lives;
    this.currentStageLog.outcome = outcome;
    this.stageLogs.push({ ...this.currentStageLog });
  }

  run(maxSimMs = 60 * 60 * 1000) {
    const actInterval = this.opts.actIntervalMs || 2500;
    let aiCd = 0;
    while (this.simTime < maxSimMs) {
      if (this.simTime - aiCd >= actInterval) {
        aiCd = this.simTime;
        this.act();
      }
      const r = this.tick();
      if (r.state === 'gameover' || r.state === 'clear') {
        return {
          agent: this.name,
          outcome: r.state,
          stage: this.stage,
          wave: this.wave,
          simTimeMs: this.simTime,
          totalKilled: this.totalKilled,
          totalSpawned: this.totalSpawned,
          livesLost: this.livesLost,
          livesRemaining: this.lives,
          goldRemaining: this.gold,
          totalTowersPlaced: this.towers.length,
          stageLogs: this.stageLogs,
        };
      }
    }
    if (this.currentStageLog.outcome === 'pending') this._closeStageLog('timeout');
    return {
      agent: this.name,
      outcome: 'timeout',
      stage: this.stage,
      wave: this.wave,
      simTimeMs: this.simTime,
      totalKilled: this.totalKilled,
      totalSpawned: this.totalSpawned,
      livesLost: this.livesLost,
      livesRemaining: this.lives,
      goldRemaining: this.gold,
      totalTowersPlaced: this.towers.length,
      stageLogs: this.stageLogs,
    };
  }
}

// ================================================================
// PERSONA: Noob (초보 — 뽑기만 알고 전략 없음)
// ================================================================
class NoobAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Noob', desc: '초보: 자동조합 모름, 랜덤 배치, T4 안 감', actIntervalMs: 5000, ...opts });
  }
  useAutoCombine() { return false; }
  _tryUpgradeT4() { /* T4까지 안 감 */ }
  act() {
    // 뽑기 2~3회만
    const ec = this.cfg.ECONOMY;
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      if (this.gold < ec.drawCost || this.inventory.length >= ec.maxInventory) break;
      const elem = Math.floor(Math.random() * 6);
      const t = this.g.TowerSystem.create(1, elem);
      t.id = Math.random() * 1e12;
      this.inventory.push(t);
      this.gold -= ec.drawCost;
      this.currentStageLog.drawCount += 1;
    }
    // 간혹 수동 조합 (50% 확률)
    if (Math.random() < 0.5) {
      const before = this.inventory.length;
      this.inventory = this.g.TowerSystem.combineAll(this.inventory);
      if (this.inventory.length < before) this.currentStageLog.combineCount += (before - this.inventory.length) / 2;
    }
    // 배치: 처음 몇 개만
    const toPlace = this.inventory.slice(0, 3);
    for (const tower of toPlace) {
      const spot = this._findSpot();
      if (!spot) break;
      const placed = this.g.TowerSystem.placeOnGrid(tower, spot.x, spot.y);
      placed.id = Math.random() * 1e12;
      this.towers.push(placed);
      this.inventory = this.inventory.filter(x => x.id !== tower.id);
      this.currentStageLog.towersPlaced += 1;
      this.currentStageLog.towersByElement[ELEMENTS[placed.colorIndex]] += 1;
      this.currentStageLog.towersByTier[placed.tier] += 1;
    }
  }
}

// ================================================================
// Casual (평균 유저 — 자동조합 ON, 적당히 배치)
// ================================================================
class CasualAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Casual', desc: '평균: 자동조합, 랜덤 속성, 적당한 배치', actIntervalMs: 3000, ...opts });
  }
  useAutoCombine() { return true; }
  pickT4Role(_e) { return 'A'; }
}

// ================================================================
// Strategist (전략 플레이어 — 속성 시너지 활용)
// ================================================================
class StrategistAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Strategist', desc: '전략: 속성 시너지 (Fire+Water, Electric+조합)', actIntervalMs: 2200, ...opts });
    // 시너지 조합 우선 속성 (Fire=0, Water=1, Electric=2)
    this.focusElements = [0, 1, 2];
  }
  pickElement() {
    return this.focusElements[Math.floor(Math.random() * this.focusElements.length)];
  }
  useAutoCombine() { return true; }
  pickT4Role(e) {
    // Fire: B(확산), Water: A(빙결), Electric: B(과부하)
    if (e === 0) return 'B';
    if (e === 1) return 'A';
    if (e === 2) return 'B';
    return 'A';
  }
}

// ================================================================
// Completionist (모든 속성 한번씩 — 도감 중심)
// ================================================================
class CompletionistAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Completionist', desc: '수집: 6속성 고루 + 모든 T4 역할 경험', actIntervalMs: 2500, ...opts });
    this.elementRotation = 0;
    this.roleRotation = ['A', 'B', 'C'];
    this.roleIdx = 0;
  }
  pickElement() {
    const e = this.elementRotation % 6;
    this.elementRotation++;
    return e;
  }
  useAutoCombine() { return true; }
  pickT4Role(_e) {
    const r = this.roleRotation[this.roleIdx % 3];
    this.roleIdx++;
    return r;
  }
}

// ================================================================
// Speedrunner (속도 극대화 — 한 속성만, 5x 배속)
// ================================================================
class SpeedrunnerAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Speedrunner', desc: '속도: Electric만 스팸 (최고 DPS)', actIntervalMs: 1800, ...opts });
  }
  pickElement() { return 2; }  // Electric
  pickT4Role(_e) { return 'C'; }  // 번개 러너형 (첫 타격 극대화)
  useAutoCombine() { return true; }
}

// ================================================================
// Cheapskate (자원 효율 — 최소 뽑기, 조합 재활용)
// ================================================================
class CheapskateAgent extends BaseAgent {
  constructor(g, opts = {}) {
    super(g, { name: 'Cheapskate', desc: '짠돌이: 최소 뽑기, 조합 우선, T3에 멈춤', actIntervalMs: 4000, ...opts });
  }
  _tryUpgradeT4() { /* 비용 아끼려고 T4 안 감 */ }
  useAutoCombine() { return true; }
  act() {
    const ec = this.cfg.ECONOMY;
    // 뽑기 최소화: 골드 100 이상 쌓였을 때만 x5 뽑기
    if (this.gold < 100) {
      // 기존 배치만 진행
    } else {
      for (let i = 0; i < 5; i++) {
        if (this.gold < ec.drawCost || this.inventory.length >= ec.maxInventory) break;
        const elem = Math.floor(Math.random() * 6);
        const t = this.g.TowerSystem.create(1, elem);
        t.id = Math.random() * 1e12;
        this.inventory.push(t);
        this.gold -= ec.drawCost;
        this.currentStageLog.drawCount += 1;
      }
    }
    const before = this.inventory.length;
    this.inventory = this.g.TowerSystem.combineAll(this.inventory);
    if (this.inventory.length < before) this.currentStageLog.combineCount += (before - this.inventory.length) / 2;
    // 배치
    this._tryPlace();
  }
}

// ================================================================
// 피드백 생성 (결과 분석 → 가상 플레이어 코멘트)
// ================================================================
function generateFeedback(result) {
  const fb = { praise: [], pain: [], ideas: [] };
  const totalTimeSec = result.simTimeMs / 1000;
  const avgTowersPerStage = result.totalTowersPlaced / Math.max(1, result.stageLogs.length);

  // 결과별 피드백
  if (result.outcome === 'clear') {
    fb.praise.push(`캠페인 전체 클리어 (${Math.round(totalTimeSec / 60)}분)`);
    if (totalTimeSec < 15 * 60) fb.praise.push('예상 시간(12~24분)에 안착, 세션 길이 적당');
    if (totalTimeSec > 25 * 60) fb.pain.push(`25분 초과 — 지루함 유발 가능. 중반 (stage 3~4)에서 진행 느려짐 확인 필요`);
  } else if (result.outcome === 'gameover') {
    fb.pain.push(`Stage ${result.stage}-Wave ${result.wave}에서 실패 (lives 0)`);
    // 어느 스테이지에서 난이도 급증했는지
    const lastLog = result.stageLogs[result.stageLogs.length - 1];
    if (lastLog && lastLog.towersPlaced < 5) {
      fb.pain.push('실패 스테이지에 타워 5개 미만 배치 — 배치 판단 어렵거나 골드 부족');
      fb.ideas.push('스테이지 진입 시 "권장 타워 수" 힌트 표시');
    }
    if (result.stage === 2) fb.pain.push('Stage 2에서 탈락 — 초반 난이도 곡선 너무 가파름');
  } else if (result.outcome === 'timeout') {
    fb.pain.push(`시간 초과 (${Math.round(totalTimeSec / 60)}분) — 웨이브 클리어 불가로 무한 대기`);
    fb.ideas.push('"막혔을 때 힌트" 기능: 30초 웨이브 클리어 못하면 전략 조언 팝업');
  }

  // 조합/티어 사용 패턴
  const hasT4 = result.stageLogs.some(s => (s.towersByTier[4] || 0) > 0);
  const totalT4 = result.stageLogs.reduce((a, s) => a + (s.towersByTier[4] || 0), 0);
  if (!hasT4 && result.outcome === 'clear') {
    fb.praise.push('T4 없이 클리어 — T3 완전 최적화 플레이');
    fb.ideas.push('T4 없이 클리어한 플레이어에게 "T4 안내" 팝업으로 엔드게임 소개');
  }
  if (totalT4 >= 6) fb.praise.push(`T4 타워 ${totalT4}개 생성 — 엔드게임 콘텐츠 충분히 경험`);

  // 속성 편중
  const totalByElement = { fire: 0, water: 0, electric: 0, wind: 0, void: 0, light: 0 };
  result.stageLogs.forEach(s => {
    for (const k of Object.keys(totalByElement)) totalByElement[k] += (s.towersByElement[k] || 0);
  });
  const sum = Object.values(totalByElement).reduce((a, b) => a + b, 0) || 1;
  const maxElem = Object.entries(totalByElement).sort((a, b) => b[1] - a[1])[0];
  if (maxElem[1] / sum > 0.6) {
    fb.pain.push(`${maxElem[0]} 속성만 ${Math.round(maxElem[1] / sum * 100)}% — 시너지 체감 어려움`);
    fb.ideas.push('속성 혼합 권장 퀘스트: "2가지 이상 속성 배치하고 클리어 시 크리스탈 보너스"');
  }
  const usedCount = Object.values(totalByElement).filter(v => v > 0).length;
  if (usedCount <= 2) {
    fb.pain.push(`총 ${usedCount}가지 속성만 사용 — 게임의 넓이 대부분 미경험`);
    fb.ideas.push('도감 진행 보상: 속성 3/6 수집 시 무료 뽑기권');
  }
  if (usedCount === 6) fb.praise.push('6속성 모두 사용 — 시너지 시스템 잘 활용');

  // 경제 상태
  const stageGoldDeltas = result.stageLogs.map(s => (s.endGold || 0) - (s.startGold || 0));
  const negativeStages = stageGoldDeltas.filter(d => d < -100).length;
  if (negativeStages >= 3) {
    fb.pain.push(`${negativeStages}개 스테이지에서 골드 100 이상 적자 — 경제 압박감`);
    fb.ideas.push('스테이지 중간 "골드 부스트" 이벤트 (적 처치 연속 시 보너스)');
  }

  // 스테이지별 타워 배치 패턴
  const earlyStage1Towers = result.stageLogs[0]?.towersPlaced || 0;
  if (earlyStage1Towers < 3) {
    fb.pain.push('Stage 1에서 타워 3개 미만 — 첫 배치 결정 어려움');
    fb.ideas.push('Stage 1 첫 진입 시 자동으로 T1 타워 2개 무료 제공');
  }

  // 보스 전투
  const noBossKills = result.stageLogs.every(s => !s.bossKilled);
  // (현재 스테이지 로그에 bossKilled 없음 — 향후 확장)

  // 건별 누락 아이디어
  if (result.outcome === 'gameover' && result.livesLost >= 15) {
    fb.pain.push('라이프 대량 손실 — 경로 이해 부족한 초보에겐 실패 반복 누적');
    fb.ideas.push('라이프 손실 5 초과 시 "타워 위치 추천" 힌트 팝업');
  }

  return fb;
}

// ================================================================
// Main
// ================================================================
function main() {
  const g = load();
  const RUNS_PER_AGENT = parseInt(process.env.RUNS || '3', 10);
  const Agents = [NoobAgent, CasualAgent, StrategistAgent, CompletionistAgent, SpeedrunnerAgent, CheapskateAgent];

  console.log('=== CAMPAIGN MULTI-AGENT PLAYTEST ===\n');
  console.log(`${Agents.length}종 persona × ${RUNS_PER_AGENT}런 per agent = ${Agents.length * RUNS_PER_AGENT}런\n`);

  const allResults = [];
  const startT = Date.now();

  for (const AgentClass of Agents) {
    const runs = [];
    for (let i = 0; i < RUNS_PER_AGENT; i++) {
      const agent = new AgentClass(g, { seed: 3000 + i * 4001 });
      const r = agent.run();
      r.desc = agent.desc;
      runs.push(r);
    }
    allResults.push({ agent: runs[0].agent, desc: runs[0].desc, runs });
  }

  const realMs = Date.now() - startT;

  // 요약
  console.log('=== 요약 ===\n');
  console.log('Agent         | Desc                                        | Clear | AvgTime | TotalTowers | Elements');
  console.log('-'.repeat(135));
  for (const a of allResults) {
    const clearCount = a.runs.filter(r => r.outcome === 'clear').length;
    const avgTime = a.runs.reduce((s, r) => s + r.simTimeMs, 0) / a.runs.length / 1000;
    const avgTowers = a.runs.reduce((s, r) => s + r.totalTowersPlaced, 0) / a.runs.length;
    const elemSet = new Set();
    a.runs.forEach(r => r.stageLogs.forEach(s => Object.entries(s.towersByElement).forEach(([k, v]) => v > 0 && elemSet.add(k))));
    console.log(`${a.agent.padEnd(14)}| ${a.desc.slice(0, 43).padEnd(45)}| ${clearCount}/${a.runs.length}   | ${avgTime.toFixed(0)}s    | ${avgTowers.toFixed(0)}          | ${elemSet.size}/6`);
  }

  // 각 agent 피드백
  console.log('\n\n=== 피드백 & 개선 아이디어 ===\n');
  const allPain = {};
  const allIdeas = {};
  for (const a of allResults) {
    console.log(`\n▼ ${a.agent} — ${a.desc}`);
    a.runs.forEach((r, idx) => {
      const fb = generateFeedback(r);
      console.log(`  [Run ${idx + 1}: ${r.outcome} ${r.stage}-${r.wave} · ${Math.round(r.simTimeMs / 1000)}s · tower ${r.totalTowersPlaced}]`);
      if (fb.praise.length) fb.praise.forEach(p => console.log(`    ✓ ${p}`));
      if (fb.pain.length) fb.pain.forEach(p => {
        console.log(`    ✗ ${p}`);
        allPain[p] = (allPain[p] || 0) + 1;
      });
      if (fb.ideas.length) fb.ideas.forEach(i => {
        console.log(`    💡 ${i}`);
        allIdeas[i] = (allIdeas[i] || 0) + 1;
      });
    });
  }

  // 집계
  console.log('\n\n=== 공통 페인 포인트 (빈도 ≥2) ===');
  Object.entries(allPain).filter(([, v]) => v >= 2).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  [${v}회] ${k}`));

  console.log('\n=== 제안된 신기능 (빈도 순) ===');
  const ideaCounts = Object.entries(allIdeas).sort((a, b) => b[1] - a[1]);
  ideaCounts.forEach(([k, v]) => console.log(`  [${v}회] ${k}`));

  // 스테이지별 클리어 타워 사용 상세 (첫 agent 대표)
  console.log('\n\n=== 스테이지별 타워 사용 상세 (Strategist 첫 런) ===');
  const strategistRun = allResults.find(a => a.agent === 'Strategist').runs[0];
  strategistRun.stageLogs.forEach((s, idx) => {
    const elems = Object.entries(s.towersByElement).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(' ');
    const tiers = Object.entries(s.towersByTier).filter(([, v]) => v > 0).map(([k, v]) => `T${k}:${v}`).join(' ');
    console.log(`  Stage ${s.stage}: ${s.outcome} · ${((s.endTime - s.startTime) / 1000).toFixed(0)}s · 배치 ${s.towersPlaced} [${elems}] [${tiers}] · 조합 ${s.combineCount} · 뽑기 ${s.drawCount}`);
  });

  // JSON 저장
  const reportPath = '/tmp/agent-playtest-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    meta: { realMs, runsPerAgent: RUNS_PER_AGENT, timestamp: new Date().toISOString() },
    agents: allResults,
    painAggregate: allPain,
    ideaAggregate: allIdeas,
  }, null, 2));
  console.log(`\n\n실제 소요 ${(realMs / 1000).toFixed(1)}초. 리포트: ${reportPath}`);
}

if (require.main === module) main();
