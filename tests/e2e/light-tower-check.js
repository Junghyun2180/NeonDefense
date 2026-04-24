// 광휘 타워가 실제로 공격하는지 empirical 검증
// 방법:
//   1. 맵 상단에 광휘 T1~T4 4개 배치 (같은 경로 근처)
//   2. 동일한 화염 T1~T4 4개 (비교군) 배치
//   3. 웨이브 시작 → 10초 관찰
//   4. 각 타워의 lastShot, damageDealt 추적 (window 객체에 노출된 state 필요시 쓸 것)
//   5. 광휘 타워의 공격 횟수와 화염 타워 공격 횟수 비교

const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const URL = 'http://localhost:8765/index.html';
const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function placeTower(page, tileX, tileY, elementName, tierLabel) {
  const tile = await page.evaluate(({ tx, ty }) => {
    const tiles = document.querySelectorAll('.grass-tile, .tile-grass');
    for (const t of tiles) {
      const r = t.getBoundingClientRect();
      const mapRect = t.parentElement.getBoundingClientRect();
      const gx = Math.round((r.x - mapRect.x) / r.width);
      const gy = Math.round((r.y - mapRect.y) / r.height);
      if (gx === tx && gy === ty) {
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }
    }
    return null;
  }, { tx: tileX, ty: tileY });
  if (!tile) return false;

  await page.mouse.click(tile.x, tile.y);
  await page.waitForTimeout(250);

  const orb = await page.evaluate((name) => {
    const menu = document.querySelector('.fixed.inset-0.z-40');
    if (!menu) return null;
    const img = menu.querySelector(`img[alt="${name}"]`);
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, elementName);
  if (!orb) return false;
  await page.mouse.click(orb.x, orb.y);
  await page.waitForTimeout(250);

  const tier = await page.evaluate((lbl) => {
    const menu = document.querySelector('.fixed.inset-0.z-40');
    if (!menu) return null;
    const divs = Array.from(menu.querySelectorAll('div')).filter(d => d.textContent.startsWith(lbl));
    if (!divs.length) return null;
    const r = divs[0].getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, tierLabel);
  if (!tier) return false;
  await page.mouse.click(tier.x, tier.y);
  await page.waitForTimeout(400);
  return true;
}

(async () => {
  const b = await chromium.launch({ executablePath: BROWSER, headless: true });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
    sessionStorage.clear();
    const d = new Date(); const ymd = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('neonDefense_dailyLogin_v1', JSON.stringify({ currentDay: 1, lastClaimDate: ymd, streak: 1 }));
    localStorage.setItem('neonDefense_settings_v1', JSON.stringify({
      tutorialSeen: true, tutorialDone: true, autoCombine: false, autoSupportCombine: false, autoNextWave: false, maxGameSpeed: 5,
    }));
    sessionStorage.setItem('__dailyLoginOpened', '1');
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // 새 게임 시작
  await p.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await p.waitForTimeout(1500);

  // TowerSystem.processAttack 전체를 monkey-patch → 광휘 타워 호출 흐름 추적
  await p.evaluate(() => {
    window.__attackCounts = {};
    window.__lightDbg = { processAttackCalled: 0, cooldownBlocked: 0, noTarget: 0, fired: 0,
                          enemiesInRange: [], tierDist: {}, sampleSpeed: null, sampleRange: null };
    const ELEM_NAMES = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
    if (typeof TowerSystem === 'undefined') { window.__patched = false; return; }

    // createProjectile 카운트
    const origCreate = TowerSystem.createProjectile.bind(TowerSystem);
    TowerSystem.createProjectile = function(tower, target, dmg, gs) {
      const p = origCreate(tower, target, dmg, gs);
      if (p && typeof p.element === 'number') {
        const name = ELEM_NAMES[p.element] || ('elem' + p.element);
        window.__attackCounts[name] = (window.__attackCounts[name] || 0) + 1;
      }
      return p;
    };

    // processAttack 단계별 추적 (light만)
    const origProcess = TowerSystem.processAttack.bind(TowerSystem);
    TowerSystem.processAttack = function(tower, ctx) {
      if (tower.element === 5) {
        window.__lightDbg.processAttackCalled++;
        window.__lightDbg.tierDist[tower.tier] = (window.__lightDbg.tierDist[tower.tier] || 0) + 1;
        window.__lightDbg.sampleSpeed = tower.speed;
        window.__lightDbg.sampleRange = tower.range;
        // 적 상태 + 거리
        const { enemies, now, gameSpeed } = ctx || {};
        if (enemies && enemies.length) {
          const range = tower.range;
          const inRange = enemies.filter(e => {
            const dx = e.x - tower.x, dy = e.y - tower.y;
            return dx*dx + dy*dy <= range*range;
          });
          if (inRange.length) window.__lightDbg.enemiesInRange.push(inRange.length);
        }
      }
      const result = origProcess(tower, ctx);
      if (tower.element === 5) {
        if (result && result.projectile) {
          window.__lightDbg.fired++;
        } else {
          // cooldown vs no-target 구분 (projectile null일 때 tower.lastShot 변경 여부)
          if (result && result.tower && result.tower.lastShot === tower.lastShot) {
            // lastShot 변화 없음 → cooldown 또는 no-target
            window.__lightDbg.noTarget++; // 일단 합산
          }
        }
      }
      return result;
    };

    window.__patched = true;
  });
  console.log('patched:', await p.evaluate(() => window.__patched));

  // 치트로 타워 준비
  await p.keyboard.press('Backquote'); await p.waitForTimeout(150);
  await p.keyboard.type('gold 5000'); await p.keyboard.press('Enter'); await p.waitForTimeout(60);
  for (let i = 0; i < 3; i++) { await p.keyboard.type('give 1 light 3'); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  for (let i = 0; i < 3; i++) { await p.keyboard.type('give 1 fire 3'); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  await p.keyboard.press('Backquote'); await p.waitForTimeout(500);

  // 비어있는 타일 찾기 (경로 근접 2-3개 타일 선택)
  const emptyTiles = await p.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.grass-tile, .tile-grass'));
    const found = [];
    tiles.forEach(t => {
      const r = t.getBoundingClientRect();
      const mapRect = t.parentElement.getBoundingClientRect();
      const gx = Math.round((r.x - mapRect.x) / r.width);
      const gy = Math.round((r.y - mapRect.y) / r.height);
      found.push({ gx, gy });
    });
    return found.slice(0, 10);
  });

  console.log('빈 타일 후보 수:', emptyTiles.length);
  if (emptyTiles.length === 0) { await b.close(); return; }

  // 광휘 2개 + 화염 2개 배치 (경로 근접 타일 중 앞 4개)
  const toPlace = [
    { elem: '광휘', label: 'T1' },
    { elem: '광휘', label: 'T1' },
    { elem: '화염', label: 'T1' },
    { elem: '화염', label: 'T1' },
  ];
  let placed = 0;
  for (let i = 0; i < toPlace.length; i++) {
    const t = emptyTiles[i];
    if (!t) break;
    const ok = await placeTower(p, t.gx, t.gy, toPlace[i].elem, toPlace[i].label);
    if (ok) placed++;
  }
  console.log('배치 성공:', placed, '/', toPlace.length);

  // 배치된 타워 확인 (element별)
  const towers = await p.evaluate(() => {
    // React 컴포넌트 상태 접근이 어렵다. DOM에서 T1 뱃지 + tower element 인식
    // 더 좋은 방법: window에 게임 상태가 노출되어 있는지 확인
    return {
      hasGameState: typeof window.__gameState !== 'undefined',
      hasGameEngine: typeof window.GameEngine !== 'undefined',
      towerDOM: Array.from(document.querySelectorAll('[style*="position"][class*="tower"]')).length,
      allImgs: Array.from(document.querySelectorAll('img')).filter(i => i.src.includes('/assets/towers/')).map(i => {
        const m = i.src.match(/towers\/(\w+)\//);
        return m ? m[1] : 'unknown';
      }),
    };
  });
  console.log('상태:', JSON.stringify(towers, null, 2));

  // 시작 버튼 클릭 (autoNextWave false니까 수동)
  try {
    await p.locator('button:has-text("▶ 시작")').first().click({ timeout: 2000 });
  } catch (e) { console.log('start btn:', e.message.slice(0, 80)); }
  await p.waitForTimeout(1000);

  // 5x 배속
  try { await p.locator('button:text-is("5x")').first().click({ timeout: 1000 }); } catch {}

  // 10초 동안 투사체 추적
  console.log('\n=== 투사체 추적 (5초) ===');
  const snapshots = [];
  for (let i = 0; i < 10; i++) {
    await p.waitForTimeout(500);
    const snap = await p.evaluate(() => {
      const allImgs = Array.from(document.querySelectorAll('img'));
      const projectileImgs = allImgs.filter(i => i.src.includes('/assets/icons/elements/') || i.src.includes('projectile'));
      const byElement = {};
      projectileImgs.forEach(img => {
        const m = img.src.match(/elements\/(\w+)\.png/);
        if (m) {
          byElement[m[1]] = (byElement[m[1]] || 0) + 1;
        }
      });
      // DOM에서 SVG chain-lightning 수 세기
      const chains = document.querySelectorAll('line.chain-lightning').length;
      // enemy 수
      const enemies = document.querySelectorAll('img[src*="/assets/enemies/"]').length;
      return { byElement, chains, enemies };
    });
    snapshots.push(snap);
  }

  const totalByElement = {};
  snapshots.forEach(s => {
    Object.entries(s.byElement).forEach(([e, n]) => {
      totalByElement[e] = (totalByElement[e] || 0) + n;
    });
  });
  console.log('누적 속성별 투사체/아이콘:', totalByElement);
  console.log('마지막 스냅샷:', snapshots[snapshots.length - 1]);

  // 인스트루먼트 결과 (실제 createProjectile 호출 카운트)
  const attackCounts = await p.evaluate(() => window.__attackCounts || {});
  const lightDbg = await p.evaluate(() => window.__lightDbg || {});
  console.log('\n=== createProjectile 호출 카운트 (속성별) ===');
  console.log(JSON.stringify(attackCounts, null, 2));
  console.log('\n=== 광휘 타워 processAttack 추적 ===');
  console.log(JSON.stringify(lightDbg, null, 2));

  if (errors.length) {
    console.log('\n에러:', errors.length);
    errors.slice(0, 5).forEach(e => console.log('  ', e.slice(0, 120)));
  }

  await p.screenshot({ path: '/tmp/light-tower-debug.png' });
  console.log('\n스크린샷: /tmp/light-tower-debug.png');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
