// 전 파이프라인 플레이 검증 (스크린샷 + 상태 덤프)
// 사용자가 직접 /tmp/playtest/pipeline/*.png 순서대로 보면서 검증 가능
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const SS_DIR = '/tmp/playtest/pipeline';
const URL = 'http://localhost:8765/index.html';
const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let stepNum = 0;
async function checkpoint(page, name, extraInfo = {}) {
  stepNum++;
  const n = String(stepNum).padStart(2, '0');
  const file = `${SS_DIR}/${n}-${name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  // 상태 덤프
  const state = await page.evaluate(() => {
    const body = document.body.textContent;
    const stage = body.match(/🏰\s*(\d+)\/(\d+)/);
    const wave = body.match(/🌊\s*(\d+)\/(\d+)/);
    const dangerWave = body.match(/🚨\s*(\d+)\/(\d+)/);
    const gold = body.match(/💰\s*(\d+)/);
    const lives = body.match(/❤️\s*(\d+)/);
    const invTower = body.match(/타워\s*\((\d+)\/(\d+)\)/);
    const invSupport = body.match(/서포트\s*\((\d+)\/(\d+)\)/);
    const mapTowerImgs = document.querySelectorAll('img[src*="/assets/towers/"]').length;
    const mapEnemyImgs = document.querySelectorAll('img[src*="/assets/enemies/"]').length;
    const mapSupportImgs = document.querySelectorAll('img[src*="/assets/supports/"]').length;
    const hasRadialMenu = !!document.querySelector('.fixed.inset-0.z-40');
    return {
      stage: stage ? `${stage[1]}/${stage[2]}` : null,
      wave: wave ? `${wave[1]}/${wave[2]}` : (dangerWave ? `🚨${dangerWave[1]}/${dangerWave[2]}` : null),
      gold: gold ? +gold[1] : null,
      lives: lives ? +lives[1] : null,
      invTower: invTower ? `${invTower[1]}/${invTower[2]}` : null,
      invSupport: invSupport ? `${invSupport[1]}/${invSupport[2]}` : null,
      mapTowerImgs, mapEnemyImgs, mapSupportImgs,
      hasRadialMenu,
    };
  });
  const extra = Object.entries(extraInfo).map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`[${n}] ${name.padEnd(30)} | Stage ${state.stage} W ${state.wave} | 💰${state.gold} ❤️${state.lives} | inv ${state.invTower}/${state.invSupport} | MAP 타워${state.mapTowerImgs} 적${state.mapEnemyImgs} 서포트${state.mapSupportImgs} ${extra}`);
  return state;
}

async function placeTower(page, tileX, tileY, elementName, tierLabel) {
  // 타일 좌표 구함
  const tile = await page.evaluate(({ tx, ty }) => {
    const tiles = document.querySelectorAll('.grass-tile');
    for (const t of tiles) {
      const r = t.getBoundingClientRect();
      const mapRect = t.parentElement.getBoundingClientRect();
      // 그리드 좌표 추정 (TILE_SIZE=40)
      const gx = Math.round((r.x - mapRect.x) / r.width);
      const gy = Math.round((r.y - mapRect.y) / r.height);
      if (gx === tx && gy === ty) {
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }
    }
    return null;
  }, { tx: tileX, ty: tileY });
  if (!tile) return false;

  // 타일 클릭 → 방사형 메뉴
  await page.mouse.click(tile.x, tile.y);
  await page.waitForTimeout(300);

  // 속성 오브 클릭 (alt 기반)
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
  await page.waitForTimeout(300);

  // 티어 div 클릭
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
  fs.mkdirSync(SS_DIR, { recursive: true });
  // 이전 스크린샷 비움
  fs.readdirSync(SS_DIR).forEach(f => fs.unlinkSync(`${SS_DIR}/${f}`));

  const b = await chromium.launch({ executablePath: BROWSER, headless: true, args: ['--ignore-certificate-errors'] });
  const p = await (await b.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } })).newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));

  console.log('=== 전 파이프라인 플레이 검증 ===\n');

  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
    sessionStorage.clear();
    // 설정 미리 세팅 (자동 팝업 방지)
    const d = new Date(); const ymd = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    localStorage.setItem('neonDefense_dailyLogin_v1', JSON.stringify({ currentDay: 1, lastClaimDate: ymd, streak: 1 }));
    localStorage.setItem('neonDefense_settings_v1', JSON.stringify({
      tutorialSeen: true, tutorialDone: true,
      autoCombine: true, autoSupportCombine: true,
      autoNextWave: true, maxGameSpeed: 5,
    }));
    sessionStorage.setItem('__dailyLoginOpened', '1');
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // ===== 01. 메인 메뉴 =====
  await checkpoint(p, 'main-menu');

  // ===== 02. 새 게임 시작 =====
  await p.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await p.waitForTimeout(1500);
  await checkpoint(p, 'game-started');

  // ===== 03. 치트로 타워 인벤 주입 =====
  await p.keyboard.press('Backquote'); await p.waitForTimeout(200);
  // 6속성 T1 각 3개
  for (const e of ['fire', 'water', 'electric', 'wind', 'void', 'light']) {
    await p.keyboard.type(`give 1 ${e} 3`); await p.keyboard.press('Enter'); await p.waitForTimeout(60);
  }
  // 서포트 S1 2개
  for (let i = 0; i < 2; i++) { await p.keyboard.type('support 1'); await p.keyboard.press('Enter'); await p.waitForTimeout(60); }
  await p.keyboard.type('gold 1000'); await p.keyboard.press('Enter'); await p.waitForTimeout(60);
  await p.keyboard.press('Backquote'); await p.waitForTimeout(500);
  await checkpoint(p, 'inventory-stocked');

  // ===== 04. 타워 6개 배치 (6속성) =====
  // 그리드 위치 (경로 옆, 빈 타일)
  const placements = [
    { x: 3,  y: 2, elem: '화염', tier: 'T1' },
    { x: 5,  y: 2, elem: '냉기', tier: 'T1' },
    { x: 7,  y: 2, elem: '전격', tier: 'T1' },
    { x: 9,  y: 2, elem: '질풍', tier: 'T1' },
    { x: 11, y: 2, elem: '공허', tier: 'T1' },
    { x: 13, y: 2, elem: '광휘', tier: 'T1' },
  ];
  let placedCount = 0;
  for (let i = 0; i < placements.length; i++) {
    const pl = placements[i];
    const ok = await placeTower(p, pl.x, pl.y, pl.elem, pl.tier);
    if (ok) placedCount++;
    if (i === 0 && ok) await checkpoint(p, 'tower-placed-1st');
  }
  await checkpoint(p, 'towers-placed-all', { placed: placedCount });

  // ===== 05. 웨이브 시작 =====
  try {
    await p.locator('button:has-text("▶ 시작")').first().click({ timeout: 2000 });
  } catch (e) { console.log('  (start btn click failed:', e.message.slice(0, 80), ')'); }
  await p.waitForTimeout(1500);
  await checkpoint(p, 'wave-started');

  // ===== 06. 배속 5x =====
  try { await p.locator('button:text-is("5x")').first().click({ timeout: 1000 }); } catch {}
  await p.waitForTimeout(2000);
  await checkpoint(p, 'battle-early');

  // ===== 07. 5초 후 — 적 스폰 진행 =====
  await p.waitForTimeout(3000);
  await checkpoint(p, 'battle-midwave');

  // ===== 08. 10초 후 =====
  await p.waitForTimeout(5000);
  await checkpoint(p, 'battle-late');

  // ===== 09. 웨이브 진행 확인 (최대 30초 대기) =====
  const startWave = await p.evaluate(() => {
    const m = document.body.textContent.match(/🌊\s*(\d+)/) || document.body.textContent.match(/🚨\s*(\d+)/);
    return m ? +m[1] : 0;
  });
  let newWave = startWave;
  const t0 = Date.now();
  while (Date.now() - t0 < 30000 && newWave === startWave) {
    await p.waitForTimeout(2000);
    newWave = await p.evaluate(() => {
      const m = document.body.textContent.match(/🌊\s*(\d+)/) || document.body.textContent.match(/🚨\s*(\d+)/);
      return m ? +m[1] : 0;
    });
  }
  await checkpoint(p, 'wave-advanced', { prev: startWave, now: newWave });

  // ===== 10. 더 오래 플레이 =====
  await p.waitForTimeout(10000);
  await checkpoint(p, 'battle-extended');

  console.log('\n에러:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e.slice(0, 120)));

  console.log(`\n스크린샷 ${stepNum}장 저장: ${SS_DIR}`);
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
