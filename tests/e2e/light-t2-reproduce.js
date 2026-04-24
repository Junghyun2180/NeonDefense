// 광휘 T2(스틸글로우) 이상을 경로 바로 옆에 배치해서 실제 공격 여부 재현
// "경로 인접 grass 타일" 을 자동 탐색해서 거기에 배치 → 반드시 범위 내 적 존재 보장
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const URL = 'http://localhost:8765/index.html';
const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: BROWSER, headless: true });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/CERT|requestfailed/.test(m.text())) errors.push('[console] ' + m.text()); });

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
    sessionStorage.clear();
    const d = new Date(); const ymd = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('neonDefense_dailyLogin_v1', JSON.stringify({ currentDay: 1, lastClaimDate: ymd, streak: 1 }));
    localStorage.setItem('neonDefense_settings_v1', JSON.stringify({
      tutorialSeen: true, tutorialDone: true,
      autoCombine: false, autoSupportCombine: false, autoNextWave: false, maxGameSpeed: 5,
    }));
    sessionStorage.setItem('__dailyLoginOpened', '1');
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  await p.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await p.waitForTimeout(1500);

  // 인스트루먼트 — processAttack 단계별 추적
  await p.evaluate(() => {
    window.__att = { fire: 0, light: 0 };
    window.__dbg = { lightProcessed: 0, lightFired: 0, lightTargetInRange: 0, lightElementValues: new Set() };
    const ELEM = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    if (typeof TowerSystem === 'undefined') return;
    const origCreate = TowerSystem.createProjectile.bind(TowerSystem);
    TowerSystem.createProjectile = function(tower, target, dmg, gs) {
      const proj = origCreate(tower, target, dmg, gs);
      if (proj && ELEM[proj.element]) window.__att[ELEM[proj.element]] = (window.__att[ELEM[proj.element]] || 0) + 1;
      return proj;
    };
    const origProcess = TowerSystem.processAttack.bind(TowerSystem);
    window.__lightSample = null;
    window.__fireSample = null;
    TowerSystem.processAttack = function(tower, ctx) {
      if (tower.element === 5) {
        window.__dbg.lightProcessed++;
        window.__dbg.lightElementValues.add(tower.element);
        // 첫 번째 광휘 타워의 상태 전체를 캡쳐
        if (!window.__lightSample && ctx?.enemies?.length) {
          window.__lightSample = {
            tower: JSON.parse(JSON.stringify({
              x: tower.x, y: tower.y, range: tower.range, tier: tower.tier,
              element: tower.element, damage: tower.damage, speed: tower.speed,
              lastShot: tower.lastShot, color: tower.color, name: tower.name,
              hasAbility: !!tower.ability, abilityType: tower.abilityType,
            })),
            enemyCount: ctx.enemies.length,
            firstEnemy: ctx.enemies[0] ? { x: ctx.enemies[0].x, y: ctx.enemies[0].y, health: ctx.enemies[0].health, maxHealth: ctx.enemies[0].maxHealth } : null,
          };
        }
        const inRange = (ctx?.enemies || []).filter(e => {
          const dx = e.x - tower.x, dy = e.y - tower.y;
          return dx*dx + dy*dy <= (tower.range || 80) * (tower.range || 80);
        });
        if (inRange.length) window.__dbg.lightTargetInRange++;
      }
      if (tower.element === 0 && !window.__fireSample && ctx?.enemies?.length) {
        window.__fireSample = {
          tower: { x: tower.x, y: tower.y, range: tower.range, tier: tower.tier, element: tower.element, speed: tower.speed },
          enemyCount: ctx.enemies.length,
        };
      }
      const r = origProcess(tower, ctx);
      if (tower.element === 5 && r && r.projectile) window.__dbg.lightFired++;
      return r;
    };
  });

  // 치트로 타워 + 골드
  await p.keyboard.press('Backquote'); await p.waitForTimeout(150);
  await p.keyboard.type('gold 5000'); await p.keyboard.press('Enter'); await p.waitForTimeout(60);
  // 광휘 T2 3개, 화염 T2 3개 (비교군)
  for (let i = 0; i < 3; i++) { await p.keyboard.type('give 2 light 3'); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  for (let i = 0; i < 3; i++) { await p.keyboard.type('give 2 fire 3'); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  await p.keyboard.press('Backquote'); await p.waitForTimeout(500);

  // **경로에 가장 가까운 빈 타일을 자동 탐색**
  const tilePick = await p.evaluate(() => {
    // path 타일 좌표 수집
    const pathCells = new Set();
    document.querySelectorAll('.tile-path, .path-tile').forEach(t => {
      const r = t.getBoundingClientRect();
      const mapRect = t.parentElement.getBoundingClientRect();
      const gx = Math.round((r.x - mapRect.x) / r.width);
      const gy = Math.round((r.y - mapRect.y) / r.height);
      pathCells.add(`${gx},${gy}`);
    });
    // 경로에 인접한 grass 타일 선별
    const candidates = [];
    document.querySelectorAll('.tile-grass, .grass-tile').forEach(t => {
      const r = t.getBoundingClientRect();
      const mapRect = t.parentElement.getBoundingClientRect();
      const gx = Math.round((r.x - mapRect.x) / r.width);
      const gy = Math.round((r.y - mapRect.y) / r.height);
      // 4방향 이웃 중 하나가 path이면 후보
      const adjacentToPath = [[0,-1],[0,1],[-1,0],[1,0]].some(([dx,dy]) => pathCells.has(`${gx+dx},${gy+dy}`));
      if (adjacentToPath) {
        candidates.push({ gx, gy, cx: r.x + r.width/2, cy: r.y + r.height/2 });
      }
    });
    return candidates.slice(0, 8);
  });
  console.log('경로 인접 타일 후보:', tilePick.length);

  // placeTower helper
  async function placeTower(tile, elem, tierLabel) {
    await p.mouse.click(tile.cx, tile.cy);
    await p.waitForTimeout(250);
    const orb = await p.evaluate((name) => {
      const menu = document.querySelector('.fixed.inset-0.z-40');
      if (!menu) return null;
      const img = menu.querySelector(`img[alt="${name}"]`);
      if (!img) return null;
      const r = img.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
    }, elem);
    if (!orb) return false;
    await p.mouse.click(orb.x, orb.y);
    await p.waitForTimeout(200);
    const tier = await p.evaluate((lbl) => {
      const menu = document.querySelector('.fixed.inset-0.z-40');
      if (!menu) return null;
      const divs = Array.from(menu.querySelectorAll('div')).filter(d => d.textContent.startsWith(lbl));
      if (!divs.length) return null;
      const r = divs[0].getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
    }, tierLabel);
    if (!tier) return false;
    await p.mouse.click(tier.x, tier.y);
    await p.waitForTimeout(350);
    return true;
  }

  // 짝수 인덱스에 light T2, 홀수에 fire T2
  let placedL = 0, placedF = 0;
  for (let i = 0; i < Math.min(6, tilePick.length); i++) {
    const elem = i % 2 === 0 ? '광휘' : '화염';
    const ok = await placeTower(tilePick[i], elem, 'T2');
    if (ok) {
      if (elem === '광휘') placedL++; else placedF++;
    }
  }
  console.log('배치:', { light: placedL, fire: placedF });

  // 시작
  try { await p.locator('button:has-text("▶ 시작")').first().click({ timeout: 2000 }); } catch {}
  await p.waitForTimeout(1000);
  try { await p.locator('button:text-is("5x")').first().click({ timeout: 1000 }); } catch {}

  // 10초 전투
  await p.waitForTimeout(10000);

  // 결과
  const att = await p.evaluate(() => window.__att);
  const dbg = await p.evaluate(() => ({
    ...window.__dbg,
    lightElementValues: Array.from(window.__dbg.lightElementValues),
  }));
  console.log('\n=== 결과 ===');
  console.log('속성별 발사:', JSON.stringify(att));
  console.log('광휘 디버그:', JSON.stringify(dbg));
  const samples = await p.evaluate(() => ({ light: window.__lightSample, fire: window.__fireSample }));
  console.log('\n=== 광휘 타워 샘플 ===');
  console.log(JSON.stringify(samples.light, null, 2));
  console.log('\n=== 화염 타워 샘플 ===');
  console.log(JSON.stringify(samples.fire, null, 2));

  await p.screenshot({ path: '/tmp/light-t2-result.png' });
  if (errors.length) console.log('에러:', errors.slice(0, 5));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
