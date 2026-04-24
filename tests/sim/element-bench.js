// 속성 독립 벤치마크: 6속성 각각을 독점 사용할 때 Rush Mode 클리어 효율
// 같은 시드, 같은 AI 전략으로 속성만 바꿔 비교 → 속성 간 상대 강도 측정
'use strict';

const { load } = require('./loader');
const { SimAgent } = require('./rush-sim');

// SimAgent를 속성 고정으로 오버라이드
class ElementFixedAgent extends SimAgent {
  constructor(g, opts) {
    super(g, opts);
    this.fixedElement = opts.element; // 0~5
  }
  act() {
    const g = this.g;
    const ec = this.cfg.ECONOMY;
    // 뽑기: 고정 속성만
    const maxDraws = this.opts.aiLevel === 'optimal' ? 999 : this.opts.aiLevel === 'casual' ? 3 : 2;
    let drawn = 0;
    while (drawn < maxDraws && this.gold >= ec.drawCost && this.inventory.length < ec.maxInventory) {
      const n = g.TowerSystem.create(1, this.fixedElement);
      n.id = Math.random() * 1e12;
      this.inventory.push(n);
      this.gold -= ec.drawCost;
      drawn++;
    }
    // 자동 조합
    this.inventory = g.TowerSystem.combineAll(this.inventory);
    // T3 → T4 (역할 A)
    if (this.opts.aiLevel === 'optimal') {
      let did = true;
      while (did) {
        did = false;
        const m = this.inventory.filter(x => x.tier === 3 && x.colorIndex === this.fixedElement);
        if (m.length >= 3) {
          const ids = m.slice(0, 3).map(x => x.id);
          const t4 = g.TowerSystem.createT4WithRole(this.fixedElement, 'A');
          t4.id = Math.random() * 1e12;
          this.inventory = this.inventory.filter(x => !ids.includes(x.id));
          this.inventory.push(t4);
          did = true;
        }
      }
    }
    // 배치
    const toPlace = this.opts.aiLevel === 'optimal' ? this.inventory.slice()
      : this.opts.aiLevel === 'casual' ? this.inventory.slice(0, Math.ceil(this.inventory.length / 2))
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
}

const ELEMENT_NAMES = ['Fire', 'Water', 'Electric', 'Wind', 'Void', 'Light'];

function main() {
  const g = load();
  const RUNS = parseInt(process.env.RUNS || '15', 10);
  const AI = process.env.AI || 'casual';
  const MODE = process.env.MODE || 'rush';

  console.log(`=== ELEMENT BENCHMARK (mode=${MODE}, ai=${AI}, ${RUNS} runs) ===`);
  console.log('element\t| clear\t\t| avg_time\t| avg_kills\t| min_kills');
  console.log('-'.repeat(75));

  const rows = [];
  for (let e = 0; e < 6; e++) {
    const results = [];
    for (let i = 0; i < RUNS; i++) {
      const agent = new ElementFixedAgent(g, {
        mode: MODE, aiLevel: AI, seed: 2000 + i * 13, element: e,
      });
      results.push(agent.run());
    }
    const cleared = results.filter(r => r.outcome === 'clear');
    const avgTime = results.reduce((a, r) => a + r.simTimeMs, 0) / results.length / 1000;
    const avgKills = results.reduce((a, r) => a + r.totalKilled, 0) / results.length;
    const minKills = Math.min(...results.map(r => r.totalKilled));
    const clearRate = (cleared.length / results.length * 100).toFixed(0) + '%';
    rows.push({ element: ELEMENT_NAMES[e], clearRate, avgTime, avgKills, minKills });
    console.log(`${ELEMENT_NAMES[e].padEnd(8)}| ${clearRate}\t\t| ${avgTime.toFixed(1)}s\t\t| ${avgKills.toFixed(0)}\t\t| ${minKills}`);
  }

  // 상대 강도 분석
  const avgKillsValues = rows.map(r => r.avgKills);
  const max = Math.max(...avgKillsValues);
  const min = Math.min(...avgKillsValues);
  console.log(`\n상대 강도: strongest=${rows.find(r => r.avgKills === max).element}(${max.toFixed(0)} kills), weakest=${rows.find(r => r.avgKills === min).element}(${min.toFixed(0)} kills), spread=${((max - min) / min * 100).toFixed(1)}%`);
}

if (require.main === module) main();
