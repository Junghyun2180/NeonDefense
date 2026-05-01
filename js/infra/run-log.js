// Neon Defense - 런 로그 시스템 (RunLog)
// 한 게임 세션 동안 발생하는 상세 정보(적 스폰/이동/사망/누수, 타워 명중, 배치 정보)를
// 모두 수집해서 밸런스 검토에 활용한다.
//
// 설계 원칙:
//   - 게임 로직(gameTick/EnemySystem/AbilitySystem)은 events 배열을 통해 알리기만 함
//   - RunLog는 옵저버처럼 이벤트만 받아 누적, 게임 로직에 영향을 주지 않음
//   - 메모리 보호: 적 1마리당 hits 50개, 적 총 5000마리, hit 총 50000개 한도
//   - 저장은 요약본만, 원본은 메모리/다운로드로

const RunLog = {
  // 저장 키
  SUMMARIES_KEY: 'neonDefense_runLogSummaries_v1',
  LAST_RUN_KEY: 'neonDefense_runLogLast_v1',
  MAX_SUMMARIES: 30,

  // 메모리 한도
  MAX_ENEMIES: 5000,
  MAX_HITS_PER_ENEMY: 50,
  MAX_TOTAL_HITS: 50000,

  // 현재 세션
  current: null,
  active: false,

  // ===== 세션 라이프사이클 =====
  startSession(meta = {}) {
    this.current = {
      sessionId: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      startTime: Date.now(),
      endTime: null,
      meta: {
        modeAbility: meta.modeAbility || 'campaign',
        startStage: meta.stage || 1,
        startSector: meta.sector || 1,
        ...meta,
      },
      // 적: id → record
      enemies: new Map(),
      enemyOrder: [], // 메모리 한도 초과시 가장 오래된 것부터 제거
      totalHits: 0,
      droppedHitCount: 0,    // 한도 초과로 누락한 hit 수
      droppedEnemyCount: 0,  // 한도 초과로 누락한 enemy 수
      // 웨이브/스테이지 이벤트
      timeline: [],
      // 최종 스냅샷용
      finalSnapshot: null,
    };
    this.active = true;
    console.log('[RunLog] 세션 시작', this.current.sessionId);
  },

  endSession(result, finalState = {}) {
    if (!this.active || !this.current) return null;
    this.current.endTime = Date.now();
    this.current.result = result; // 'clear' | 'gameover' | 'gameover_overflow' | 'abandoned'
    this.current.finalSnapshot = this._buildFinalSnapshot(finalState);
    this.active = false;

    // 요약본 생성 → 저장
    const summary = this.summarize();
    this._persistSummary(summary);

    // 마지막 풀 로그도 별도 저장 (재내보내기용)
    try {
      const fullJson = JSON.stringify(this.exportFull(), this._mapReplacer);
      localStorage.setItem(this.LAST_RUN_KEY, fullJson);
    } catch (e) {
      console.warn('[RunLog] 마지막 풀 로그 저장 실패 (용량 초과 가능):', e.message);
    }

    this.printSummary(summary);
    return summary;
  },

  // ===== 적 이벤트 =====
  onEnemySpawn(enemy, ctx = {}) {
    if (!this.active || !this.current || !enemy) return;
    if (this.current.enemies.size >= this.MAX_ENEMIES) {
      this.current.droppedEnemyCount++;
      return;
    }
    const path = enemy.pathTiles || [];
    this.current.enemies.set(enemy.id, {
      id: enemy.id,
      type: enemy.type,
      stage: ctx.stage || enemy.stage || 0,
      wave: ctx.wave || enemy.spawnWave || 0,
      sector: enemy.sector || ctx.sector || 1,
      pathId: enemy.pathId,
      pathLen: path.length,
      isMiniboss: !!enemy.isMiniboss,
      isDangerWave: !!enemy.isDangerWave,
      isLooping: !!enemy.isLooping,
      isSplitChild: !!enemy.isSplitChild,
      abilityType: enemy.abilityType || null,
      bossPattern: enemy.bossPattern || null,
      maxHealth: enemy.maxHealth,
      armor: enemy.armor || 0,
      shieldMax: enemy.shieldMax || 0,
      baseSpeed: enemy.baseSpeed,
      goldReward: enemy.goldReward || 0,
      spawnTime: Date.now(),
      // 결과 (사망/누수 시 채움)
      deathTime: null,
      result: 'alive',     // 'killed' | 'leaked' | 'looped' | 'alive'
      cause: null,         // 'projectile' | 'burn'
      finishedBy: null,    // 마지막 가격 towerId
      finalPathIndex: 0,
      pathProgress: 0,     // pathIndex / pathLen
      leakX: null,
      leakY: null,
      loopCount: 0,
      // 누적 데이터
      hits: [],
      hitCount: 0,
      totalDamageTaken: 0,
      damageByElement: {}, // element → damage
      damageByTier: {},    // tier → damage
      damageByTower: {},   // towerId → damage
    });
    this.current.enemyOrder.push(enemy.id);
  },

  onHit(hit) {
    if (!this.active || !this.current || !hit) return;
    if (this.current.totalHits >= this.MAX_TOTAL_HITS) {
      this.current.droppedHitCount++;
      return;
    }
    const rec = this.current.enemies.get(hit.enemyId);
    if (!rec) return;

    rec.totalDamageTaken += (hit.damage || 0);
    rec.hitCount++;
    this.current.totalHits++;

    if (hit.element !== undefined && hit.element !== null) {
      const k = String(hit.element);
      rec.damageByElement[k] = (rec.damageByElement[k] || 0) + (hit.damage || 0);
    }
    if (hit.tier !== undefined && hit.tier !== null) {
      const k = `T${hit.tier}`;
      rec.damageByTier[k] = (rec.damageByTier[k] || 0) + (hit.damage || 0);
    }
    if (hit.towerId !== undefined && hit.towerId !== null) {
      const k = String(hit.towerId);
      rec.damageByTower[k] = (rec.damageByTower[k] || 0) + (hit.damage || 0);
    }

    if (rec.hits.length < this.MAX_HITS_PER_ENEMY) {
      rec.hits.push({
        t: Date.now(),
        towerId: hit.towerId ?? null,
        element: hit.element ?? null,
        tier: hit.tier ?? null,
        role: hit.role ?? null,
        damage: hit.damage || 0,
        isCrit: !!hit.isCrit,
      });
    }
  },

  onEnemyKilled(enemy, info = {}) {
    if (!this.active || !this.current || !enemy) return;
    const rec = this.current.enemies.get(enemy.id);
    if (!rec) return;
    rec.deathTime = Date.now();
    rec.result = 'killed';
    rec.cause = info.cause || 'projectile';
    rec.finishedBy = info.byTowerId ?? null;
    rec.finalPathIndex = enemy.pathIndex || 0;
    rec.pathProgress = rec.pathLen > 1 ? (enemy.pathIndex / (rec.pathLen - 1)) : 0;
  },

  onEnemyLeaked(enemy, livesLost) {
    if (!this.active || !this.current || !enemy) return;
    const rec = this.current.enemies.get(enemy.id);
    if (!rec) return;
    rec.deathTime = Date.now();
    rec.result = 'leaked';
    rec.livesLost = livesLost || 0;
    rec.finalPathIndex = enemy.pathIndex || (rec.pathLen - 1);
    rec.pathProgress = 1;
    rec.leakX = enemy.x;
    rec.leakY = enemy.y;
  },

  onWaveStart(stage, wave) {
    if (!this.active || !this.current) return;
    this.current.timeline.push({ t: Date.now(), kind: 'waveStart', stage, wave });
  },

  onWaveClear(stage, wave, info = {}) {
    if (!this.active || !this.current) return;
    this.current.timeline.push({ t: Date.now(), kind: 'waveClear', stage, wave, ...info });
  },

  onStageClear(stage, info = {}) {
    if (!this.active || !this.current) return;
    this.current.timeline.push({ t: Date.now(), kind: 'stageClear', stage, ...info });
  },

  // 게임 종료 직전 호출하는 이벤트들 (gameTick 결과)
  consumeEvents(events) {
    if (!this.active || !this.current || !events || events.length === 0) return;
    for (const ev of events) {
      switch (ev.type) {
        case 'hit': this.onHit(ev); break;
        case 'kill': this.onEnemyKilled(ev.enemy, { cause: ev.cause, byTowerId: ev.byTowerId }); break;
        case 'leak': this.onEnemyLeaked(ev.enemy, ev.livesLost); break;
      }
    }
  },

  // ===== 최종 스냅샷 / 요약 =====
  _buildFinalSnapshot(state) {
    const TILE = (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : 72;
    const elementNames = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    const supportTypeNames = ['attack', 'speed', 'armorPierce', 'range'];

    const towers = (state.towers || []).map(t => ({
      id: t.id,
      kind: 'attack',
      tier: t.tier,
      element: t.colorIndex,
      elementName: elementNames[t.colorIndex] || `e${t.colorIndex}`,
      role: t.role || null,
      cell: { x: Math.floor(t.x / TILE), y: Math.floor(t.y / TILE) },
      pos: { x: t.x, y: t.y },
    }));
    const supports = (state.supportTowers || []).map(t => ({
      id: t.id,
      kind: 'support',
      tier: t.tier,
      type: t.supportType,
      typeName: supportTypeNames[t.supportType] || `s${t.supportType}`,
      cell: { x: Math.floor(t.x / TILE), y: Math.floor(t.y / TILE) },
      pos: { x: t.x, y: t.y },
    }));

    return {
      stage: state.stage,
      wave: state.wave,
      sector: state.sector,
      gold: state.gold,
      lives: state.lives,
      towers,
      supports,
      gameStats: state.gameStats || {},
      permanentBuffs: state.permanentBuffs || {},
    };
  },

  // 한 세션을 요약본으로 변환 (저장용 — 가벼움)
  summarize() {
    if (!this.current) return null;
    const cur = this.current;
    const enemies = Array.from(cur.enemies.values());

    // 적 타입별 집계
    const byType = {};
    enemies.forEach(e => {
      const t = e.type;
      if (!byType[t]) {
        byType[t] = {
          type: t,
          spawned: 0,
          killed: 0,
          leaked: 0,
          alive: 0,
          totalAdvanceRatio: 0,
          totalLifetimeMs: 0,
          totalHits: 0,
          totalDamage: 0,
          maxAdvanceRatio: 0,  // 가장 멀리 간 비율
          minAdvanceRatioOnLeak: 1, // 누수된 것 중 최소 (= 가장 빠른 누수)
        };
      }
      const b = byType[t];
      b.spawned++;
      if (e.result === 'killed') b.killed++;
      else if (e.result === 'leaked') b.leaked++;
      else b.alive++;

      const adv = e.pathProgress || 0;
      b.totalAdvanceRatio += adv;
      if (adv > b.maxAdvanceRatio) b.maxAdvanceRatio = adv;
      if (e.result === 'leaked' && adv < b.minAdvanceRatioOnLeak) b.minAdvanceRatioOnLeak = adv;

      const lifetime = e.deathTime ? (e.deathTime - e.spawnTime) : (cur.endTime - e.spawnTime);
      b.totalLifetimeMs += Math.max(0, lifetime);
      b.totalHits += e.hitCount;
      b.totalDamage += e.totalDamageTaken;
    });
    const enemySummary = Object.values(byType).map(b => ({
      type: b.type,
      spawned: b.spawned,
      killed: b.killed,
      leaked: b.leaked,
      killRate: b.spawned > 0 ? b.killed / b.spawned : 0,
      avgAdvanceRatio: b.spawned > 0 ? b.totalAdvanceRatio / b.spawned : 0,
      maxAdvanceRatio: b.maxAdvanceRatio,
      avgLifetimeMs: b.spawned > 0 ? Math.round(b.totalLifetimeMs / b.spawned) : 0,
      avgHits: b.spawned > 0 ? b.totalHits / b.spawned : 0,
      avgDamageTaken: b.spawned > 0 ? Math.round(b.totalDamage / b.spawned) : 0,
    }));

    // 타워 기여도 집계
    const towerContrib = new Map(); // towerId → {damage, hits, kills}
    enemies.forEach(e => {
      Object.entries(e.damageByTower || {}).forEach(([tid, dmg]) => {
        const tc = towerContrib.get(tid) || { towerId: tid, damage: 0, hits: 0, kills: 0 };
        tc.damage += dmg;
        towerContrib.set(tid, tc);
      });
      e.hits.forEach(h => {
        if (h.towerId == null) return;
        const tc = towerContrib.get(String(h.towerId)) || { towerId: String(h.towerId), damage: 0, hits: 0, kills: 0 };
        tc.hits++;
        towerContrib.set(String(h.towerId), tc);
      });
      if (e.result === 'killed' && e.finishedBy != null) {
        const tc = towerContrib.get(String(e.finishedBy)) || { towerId: String(e.finishedBy), damage: 0, hits: 0, kills: 0 };
        tc.kills++;
        towerContrib.set(String(e.finishedBy), tc);
      }
    });

    // 최종 타워 정보와 합치기
    const snap = cur.finalSnapshot || { towers: [], supports: [] };
    const towerLookup = new Map();
    (snap.towers || []).forEach(t => towerLookup.set(String(t.id), t));
    const towerSummary = Array.from(towerContrib.values()).map(tc => ({
      ...tc,
      info: towerLookup.get(tc.towerId) || null,
    })).sort((a, b) => b.damage - a.damage);

    // 누수 hot-spot (가장 자주 누수된 지점)
    const leakBuckets = new Map();
    enemies.filter(e => e.result === 'leaked').forEach(e => {
      const key = `s${e.stage}_w${e.wave}_p${e.pathId}`;
      const b = leakBuckets.get(key) || { stage: e.stage, wave: e.wave, pathId: e.pathId, count: 0, types: {} };
      b.count++;
      b.types[e.type] = (b.types[e.type] || 0) + 1;
      leakBuckets.set(key, b);
    });
    const leakHotspots = Array.from(leakBuckets.values()).sort((a, b) => b.count - a.count).slice(0, 10);

    // T1 → T4 유형별 데미지 분포
    const damageByTier = { T1: 0, T2: 0, T3: 0, T4: 0 };
    const damageByElement = {};
    enemies.forEach(e => {
      Object.entries(e.damageByTier || {}).forEach(([k, v]) => {
        damageByTier[k] = (damageByTier[k] || 0) + v;
      });
      Object.entries(e.damageByElement || {}).forEach(([k, v]) => {
        damageByElement[k] = (damageByElement[k] || 0) + v;
      });
    });

    return {
      sessionId: cur.sessionId,
      result: cur.result,
      timestamp: cur.endTime,
      date: new Date(cur.endTime).toLocaleString('ko-KR'),
      durationMs: cur.endTime - cur.startTime,
      meta: cur.meta,
      finalSnapshot: snap,
      enemyTotals: {
        spawned: enemies.length,
        killed: enemies.filter(e => e.result === 'killed').length,
        leaked: enemies.filter(e => e.result === 'leaked').length,
        alive: enemies.filter(e => e.result === 'alive').length,
      },
      enemySummary,
      towerSummary,
      damageByTier,
      damageByElement,
      leakHotspots,
      timeline: cur.timeline,
      drops: {
        droppedEnemies: cur.droppedEnemyCount,
        droppedHits: cur.droppedHitCount,
      },
    };
  },

  // 풀 로그 (다운로드용 — 매우 큼)
  exportFull() {
    if (!this.current) return null;
    return {
      ...this.current,
      enemies: Array.from(this.current.enemies.values()),
      enemyOrder: undefined,
    };
  },

  // ===== 영속화 =====
  _persistSummary(summary) {
    try {
      const list = this.getSummaries();
      list.push(summary);
      while (list.length > this.MAX_SUMMARIES) list.shift();
      localStorage.setItem(this.SUMMARIES_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[RunLog] 요약 저장 실패:', e.message);
    }
  },

  getSummaries() {
    try {
      const raw = localStorage.getItem(this.SUMMARIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  getLastFullRun() {
    try {
      const raw = localStorage.getItem(this.LAST_RUN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clearAll() {
    localStorage.removeItem(this.SUMMARIES_KEY);
    localStorage.removeItem(this.LAST_RUN_KEY);
    console.log('[RunLog] 모든 로그 삭제');
  },

  // ===== 출력/내보내기 =====
  printSummary(summary) {
    if (!summary) return;
    console.group(`📋 RunLog - ${summary.result} (${summary.date})`);
    console.log(`Session: ${summary.sessionId} / Mode: ${summary.meta.modeAbility}`);
    console.log(`Duration: ${Math.round(summary.durationMs / 1000)}s`);
    console.log(`Enemies: spawned=${summary.enemyTotals.spawned} killed=${summary.enemyTotals.killed} leaked=${summary.enemyTotals.leaked}`);

    if (summary.enemySummary.length > 0) {
      console.group('👾 적 타입별 요약');
      summary.enemySummary.forEach(s => {
        console.log(
          `  ${s.type.padEnd(10)} sp=${s.spawned} kill=${s.killed} leak=${s.leaked} ` +
          `kr=${(s.killRate * 100).toFixed(0)}% avgAdv=${(s.avgAdvanceRatio * 100).toFixed(0)}% ` +
          `maxAdv=${(s.maxAdvanceRatio * 100).toFixed(0)}% avgHits=${s.avgHits.toFixed(1)} avgDmg=${s.avgDamageTaken}`
        );
      });
      console.groupEnd();
    }

    if (summary.towerSummary.length > 0) {
      console.group('🏰 타워 기여도 (TOP 10)');
      summary.towerSummary.slice(0, 10).forEach(t => {
        const info = t.info ? ` [T${t.info.tier} ${t.info.elementName || t.info.typeName}${t.info.role ? '-' + t.info.role : ''} @ (${t.info.cell?.x},${t.info.cell?.y})]` : '';
        console.log(`  tower#${t.towerId} dmg=${t.damage} hits=${t.hits} kills=${t.kills}${info}`);
      });
      console.groupEnd();
    }

    if (summary.leakHotspots.length > 0) {
      console.group('💧 누수 핫스팟');
      summary.leakHotspots.forEach(h => {
        console.log(`  s${h.stage} w${h.wave} path=${h.pathId} count=${h.count} types=${JSON.stringify(h.types)}`);
      });
      console.groupEnd();
    }

    if (summary.drops.droppedEnemies || summary.drops.droppedHits) {
      console.warn(`⚠️ 한도 초과 누락: enemies=${summary.drops.droppedEnemies} hits=${summary.drops.droppedHits}`);
    }
    console.groupEnd();
  },

  exportSummariesAsJson() {
    const summaries = this.getSummaries();
    const blob = new Blob([JSON.stringify(summaries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neonDefense_runLogs_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportLastFullRun() {
    const data = this.exportFull() || this.getLastFullRun();
    if (!data) {
      console.warn('[RunLog] 내보낼 풀 로그가 없습니다.');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `neonDefense_runLogFull_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  // 요약 텍스트 리포트 (마지막 N개 게임의 평균 vs 최근 트렌드)
  generateReport(limit = 10) {
    const summaries = this.getSummaries().slice(-limit);
    if (summaries.length === 0) {
      console.log('[RunLog] 저장된 요약이 없습니다.');
      return null;
    }
    const totalEnemies = summaries.reduce((s, x) => s + x.enemyTotals.spawned, 0);
    const totalKilled = summaries.reduce((s, x) => s + x.enemyTotals.killed, 0);
    const totalLeaked = summaries.reduce((s, x) => s + x.enemyTotals.leaked, 0);

    // 적 타입별 평균 advanceRatio
    const typeAcc = {};
    summaries.forEach(s => s.enemySummary.forEach(e => {
      if (!typeAcc[e.type]) typeAcc[e.type] = { samples: 0, advSum: 0, killSum: 0, spawnSum: 0 };
      const a = typeAcc[e.type];
      a.samples++;
      a.advSum += e.avgAdvanceRatio;
      a.killSum += e.killed;
      a.spawnSum += e.spawned;
    }));

    console.group(`📊 RunLog 리포트 (최근 ${summaries.length}게임)`);
    console.log(`총 적: ${totalEnemies} / 처치: ${totalKilled} (${totalEnemies > 0 ? Math.round(totalKilled / totalEnemies * 100) : 0}%) / 누수: ${totalLeaked}`);
    console.log('타입별 평균:');
    Object.entries(typeAcc).forEach(([type, a]) => {
      const avgAdv = a.advSum / a.samples;
      const kr = a.spawnSum > 0 ? a.killSum / a.spawnSum : 0;
      console.log(`  ${type.padEnd(10)} avgAdvance=${(avgAdv * 100).toFixed(0)}% killRate=${(kr * 100).toFixed(0)}%`);
    });
    console.groupEnd();
    return { summaries, typeAcc, totalEnemies, totalKilled, totalLeaked };
  },

  // Map 직렬화 헬퍼
  _mapReplacer(_key, value) {
    if (value instanceof Map) return Array.from(value.values());
    return value;
  },
};

// 전역 노출
window.RunLog = RunLog;
