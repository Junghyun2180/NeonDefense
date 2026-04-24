// Rush Mode 시뮬레이터 — 실제 게임 엔진(GameEngine.gameTick) 그대로 사용
// 최소 AI(타워 자동 배치 + 뽑기/조합)로 플레이하여 클리어율/소요시간 측정
'use strict';

const { load } = require('./loader');

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// AI: 뽑기→자동조합→T4 역할 자동선택(첫 번째 A) → 빈 경로-인접 타일에 배치
class SimAgent {
  constructor(g, opts = {}) {
    this.g = g;
    this.opts = {
      mode: opts.mode || 'rush',          // 'rush' | 'standard' | 'campaign'
      aiLevel: opts.aiLevel || 'optimal', // 'optimal' | 'casual' | 'poor'
      seed: opts.seed ?? Math.floor(Math.random() * 1e9),
      aiIntervalMs: opts.aiIntervalMs || 2000,
    };
    const upgrades = {};
    if (this.opts.mode === 'rush') this.cfg = g.RunMode.buildRushConfig(upgrades);
    else if (this.opts.mode === 'standard') this.cfg = g.RunMode.buildRunConfig(upgrades);
    else this.cfg = { SPAWN: g.SPAWN, ECONOMY: g.ECONOMY, HEALTH_SCALING: g.HEALTH_SCALING, CARRYOVER: g.CARRYOVER, modeAbility: null, mapType: 'standard' };
    this.inventory = [];
    this.supportInventory = [];
    this.towers = [];
    this.supportTowers = [];
    this.gold = this.cfg.ECONOMY.startGold;
    this.lives = this.cfg.ECONOMY.startLives;
    this.stage = 1;
    this.wave = 1;
    this.enemies = [];
    this.projectiles = [];
    this.effects = [];
    this.chainLightnings = [];
    this.permanentBuffs = {};
    const pathGen = this.cfg.mapType === 'square' ? g.generateSquarePath : g.generateMultiplePaths;
    this.pathGen = pathGen;
    this.pathData = pathGen(this.opts.seed, this.stage);
    this.spawnedCount = 0;
    this.killedCount = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.livesLost = 0;
    this.startTime = Date.now();
    this.simTime = 0;      // 시뮬 경과 (ms)
    this.lastSpawnAt = 0;
    this.lastAIAt = 0;
    this.waveStartedAt = 0;   // 현재 웨이브 시작 시점 (자동 웨이브 타이머용)
    // 자동 웨이브 여부 (Rush/Run 모드)
    this.isAutoWaveMode = !!this.cfg.SPAWN.waveAutoStart;
  }

  // 뽑기 많이 → 자동 조합 → 최고 티어 타워들을 경로 인접에 배치
  act() {
    const g = this.g;
    const ec = this.cfg.ECONOMY;
    const aiLevel = this.opts.aiLevel;

    // AI 레벨별 행동 조정:
    // optimal: 골드 허용하는 최대까지 뽑기 + 자동조합 + T4까지 + 전부 배치
    // casual: 뽑기 3번 + 자동조합 + T3까지 + 50%만 배치
    // poor: 뽑기 2번 + 자동조합 없음 + 무작위 배치

    // 1) 뽑기
    const maxDraws = aiLevel === 'optimal' ? 999
      : aiLevel === 'casual' ? 3
      : 2;
    let drawn = 0;
    while (drawn < maxDraws && this.gold >= ec.drawCost && this.inventory.length < ec.maxInventory) {
      const elem = Math.floor(Math.random() * 6);
      const n = g.TowerSystem.create(1, elem);
      n.id = Math.random() * 1e12;
      this.inventory.push(n);
      this.gold -= ec.drawCost;
      drawn++;
    }

    // 2) 자동 조합 (poor 제외)
    if (aiLevel !== 'poor') {
      this.inventory = g.TowerSystem.combineAll(this.inventory);
    }

    // 3) T3 → T4 (optimal만)
    if (aiLevel === 'optimal') {
      let did = true;
      while (did) {
        did = false;
        for (let e = 0; e < 6; e++) {
          const matching = this.inventory.filter(x => x.tier === 3 && x.colorIndex === e);
          if (matching.length >= 3) {
            const ids = matching.slice(0, 3).map(x => x.id);
            const t4 = g.TowerSystem.createT4WithRole(e, 'A');
            t4.id = Math.random() * 1e12;
            this.inventory = this.inventory.filter(x => !ids.includes(x.id));
            this.inventory.push(t4);
            did = true;
          }
        }
      }
    }

    // 4) 배치
    const toPlace = aiLevel === 'optimal' ? this.inventory.slice()
      : aiLevel === 'casual' ? this.inventory.slice(0, Math.ceil(this.inventory.length / 2))
      : this.inventory.slice(0, 2);

    const sorted = [...toPlace].sort((a, b) => b.tier - a.tier);
    for (const tower of sorted) {
      const spot = this.findPlacementSpot();
      if (!spot) break;
      const placed = g.TowerSystem.placeOnGrid(tower, spot.x, spot.y);
      placed.id = Math.random() * 1e12;
      this.towers.push(placed);
      this.inventory = this.inventory.filter(x => x.id !== tower.id);
    }
  }

  isTileOccupied(x, y) {
    if (this.towers.some(t => t.gridX === x && t.gridY === y)) return true;
    if (this.supportTowers.some(t => t.gridX === x && t.gridY === y)) return true;
    return false;
  }

  isOnPath(x, y) {
    for (const p of this.pathData.paths) {
      for (const t of p.tiles) {
        if (t.x === x && t.y === y) return true;
      }
    }
    return false;
  }

  findPlacementSpot() {
    // 경로 타일 기준 인접 4방향 중 배치 가능한 것
    for (const p of this.pathData.paths) {
      for (const t of p.tiles) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of dirs) {
          const x = t.x + dx, y = t.y + dy;
          if (x < 0 || x >= this.g.GRID_WIDTH || y < 0 || y >= this.g.GRID_HEIGHT) continue;
          if (this.isOnPath(x, y)) continue;
          if (this.isTileOccupied(x, y)) continue;
          return { x, y };
        }
      }
    }
    return null;
  }

  // 1 게임 틱 (COMBAT.gameLoopInterval 기준)
  tick() {
    const g = this.g;
    const tickMs = g.COMBAT.gameLoopInterval;   // 기본값 16ms
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
        newEnemy.isLooping = true;
        newEnemy.loopCount = 0;
        newEnemy.spawnWave = this.wave;
        this.enemies.push(newEnemy);
        this.spawnedCount++;
        this.totalSpawned++;
      }
    }

    // 게임 틱 (실제 엔진 호출)
    const result = g.GameEngine.gameTick({
      enemies: this.enemies,
      towers: this.towers,
      supportTowers: this.supportTowers,
      projectiles: this.projectiles,
      gameSpeed: 1,
      permanentBuffs: this.permanentBuffs,
    }, now);

    // 순환 경로: 끝에 도달한 적을 처음으로
    result.enemies = result.enemies.map(enemy => {
      if (enemy.pathIndex >= enemy.pathTiles.length - 1 && enemy.isLooping) {
        return {
          ...enemy,
          pathIndex: 0,
          loopCount: (enemy.loopCount || 0) + 1,
          x: enemy.pathTiles[0].x * g.TILE_SIZE + g.TILE_SIZE / 2,
          y: enemy.pathTiles[0].y * g.TILE_SIZE + g.TILE_SIZE / 2,
        };
      }
      return enemy;
    });
    result.livesLost = 0; // 순환 맵이므로 lives 감소 없음

    this.enemies = result.enemies;
    this.towers = result.towers;
    this.projectiles = result.projectiles;
    this.totalKilled += result.killedCount || 0;
    this.gold += result.goldEarned || 0;
    this.livesLost += result.livesLost || 0;
    this.lives -= result.livesLost || 0;

    // 적 수 초과 패배 체크 (ㅁ 맵)
    if (this.enemies.length > (this.cfg.SPAWN.defeatThreshold || 70)) {
      return { state: 'gameover', reason: 'overflow' };
    }

    // 웨이브 클리어 판정
    // - 자동 웨이브 모드: 타이머(waveDurationMs) 종료 OR 조기 클리어(스폰 완료+전멸) 둘 중 먼저
    // - 수동 모드: 조기 클리어만
    const waveElapsed = now - this.waveStartedAt;
    const currentWaveEnemies = this.enemies.filter(e => e.spawnWave === this.wave);
    const earlyCleared = this.spawnedCount >= totalEnemies && currentWaveEnemies.length === 0;
    const timerExpired = this.isAutoWaveMode && this.cfg.SPAWN.waveDurationMs
      && waveElapsed >= this.cfg.SPAWN.waveDurationMs;

    if (earlyCleared || timerExpired) {
      this.gold += this.cfg.ECONOMY.waveReward(this.wave);
      if (this.wave >= this.cfg.SPAWN.wavesPerStage) {
        if (this.stage >= this.cfg.SPAWN.maxStage) {
          // 마지막 웨이브까지 왔어도 적이 너무 많이 남아있으면 실패로 간주하지 않음
          // (순환 맵이라 lives 안 까임 → 최종 웨이브 적 전멸 될 때까지 대기)
          if (timerExpired && currentWaveEnemies.length > 0) {
            // 최종 웨이브 타이머 종료했지만 아직 적 남음 → 조금 더 대기
            // 하지만 타이머는 다시 시작 안 함, 누적 스폰 멈추고 타워가 처리하길 기다림
            if (this.spawnedCount >= totalEnemies) {
              // 모두 스폰되었으므로 자연 소멸 대기 (사이클 계속)
              this.simTime += tickMs;
              return { state: 'running' };
            }
          }
          return { state: 'clear' };
        }
        // 스테이지 클리어 → 다음 스테이지
        this.stage++;
        this.wave = 1;
        this.spawnedCount = 0;
        this.lastSpawnAt = now;
        this.waveStartedAt = now;
        this.pathData = this.pathGen(this.opts.seed + this.stage, this.stage);
        this.enemies = this.enemies.filter(e => e.spawnWave >= this.wave); // 이전 웨이브 적 남은 것도 처리
        this.projectiles = [];
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

  run(maxSimMs = 30 * 60 * 1000) {
    const log = [];
    let aiCooldown = 0;
    const aiInterval = this.opts.aiLevel === 'optimal' ? 2000
      : this.opts.aiLevel === 'casual' ? 3500
      : 6000;
    const maxPlacedEver = this.opts.aiLevel === 'optimal' ? 999
      : this.opts.aiLevel === 'casual' ? 20
      : 8;
    while (this.simTime < maxSimMs) {
      // AI 액션 — 레벨별 간격 + 배치 상한
      if (this.simTime - aiCooldown >= aiInterval && this.towers.length < maxPlacedEver) {
        aiCooldown = this.simTime;
        this.act();
      }

      const r = this.tick();
      if (r.state === 'gameover') {
        return {
          outcome: 'gameover',
          reason: r.reason,
          stage: this.stage,
          wave: this.wave,
          simTimeMs: this.simTime,
          gold: this.gold,
          lives: this.lives,
          livesLost: this.livesLost,
          totalKilled: this.totalKilled,
          totalSpawned: this.totalSpawned,
          towersPlaced: this.towers.length,
          log,
        };
      }
      if (r.state === 'clear') {
        return {
          outcome: 'clear',
          stage: this.stage,
          wave: this.wave,
          simTimeMs: this.simTime,
          gold: this.gold,
          lives: this.lives,
          livesLost: this.livesLost,
          totalKilled: this.totalKilled,
          totalSpawned: this.totalSpawned,
          towersPlaced: this.towers.length,
          log,
        };
      }
      if (r.state === 'waveclear' || r.state === 'stageclear') {
        log.push({ t: this.simTime, event: r.state, stage: this.stage, wave: this.wave, towers: this.towers.length });
      }
    }
    return {
      outcome: 'timeout',
      stage: this.stage,
      wave: this.wave,
      simTimeMs: this.simTime,
      gold: this.gold,
      lives: this.lives,
      towersPlaced: this.towers.length,
      totalKilled: this.totalKilled,
      totalSpawned: this.totalSpawned,
    };
  }
}

function runBatch(g, mode, aiLevel, runs) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const agent = new SimAgent(g, { mode, aiLevel, seed: 1000 + i * 7919 });
    results.push(agent.run());
  }
  return results;
}

function summarize(results) {
  const cleared = results.filter(r => r.outcome === 'clear');
  const gameovers = results.filter(r => r.outcome === 'gameover');
  const timeouts = results.filter(r => r.outcome === 'timeout');
  const avgSimSec = results.reduce((a, r) => a + r.simTimeMs, 0) / results.length / 1000;
  const avgTowers = results.reduce((a, r) => a + r.towersPlaced, 0) / results.length;
  const avgKills = results.reduce((a, r) => a + r.totalKilled, 0) / results.length;
  const clearSimSec = cleared.map(r => r.simTimeMs / 1000);
  const reachedStages = gameovers.map(r => r.stage + '-' + r.wave).sort();
  return {
    clearRate: (cleared.length / results.length * 100).toFixed(1) + '%',
    clearCount: cleared.length,
    gameoverCount: gameovers.length,
    timeoutCount: timeouts.length,
    avgSimSec: avgSimSec.toFixed(1),
    avgTowers: avgTowers.toFixed(1),
    avgKills: avgKills.toFixed(1),
    clearMinSec: clearSimSec.length ? Math.min(...clearSimSec).toFixed(1) : '-',
    clearMaxSec: clearSimSec.length ? Math.max(...clearSimSec).toFixed(1) : '-',
    gameoverReached: reachedStages,
  };
}

function main() {
  const g = load();
  const RUNS = parseInt(process.env.RUNS || '15', 10);
  const MODE_FILTER = (process.env.MODE || 'rush,standard,campaign').split(',').map(s => s.trim());
  const AI_FILTER = (process.env.AI || 'optimal,casual,poor').split(',').map(s => s.trim());

  const t0 = Date.now();
  const table = [];
  for (const mode of MODE_FILTER) {
    for (const ai of AI_FILTER) {
      const results = runBatch(g, mode, ai, RUNS);
      const s = summarize(results);
      table.push({ mode, ai, ...s });
    }
  }
  const realMs = Date.now() - t0;

  console.log(`=== SIM MATRIX (${RUNS} runs per cell) ===`);
  console.log('mode\t| ai\t\t| clear\t| avg_sim\t| towers\t| kills\t| clear_min/max\t| gameover_at');
  console.log('-'.repeat(110));
  for (const row of table) {
    console.log(`${row.mode}\t| ${row.ai}\t| ${row.clearRate}\t| ${row.avgSimSec}s\t\t| ${row.avgTowers}\t\t| ${row.avgKills}\t| ${row.clearMinSec}/${row.clearMaxSec}s\t| ${row.gameoverReached.slice(0, 5).join(',')}`);
  }
  console.log(`\nTotal real time: ${(realMs / 1000).toFixed(1)}s`);
}

if (require.main === module) main();
module.exports = { SimAgent };
