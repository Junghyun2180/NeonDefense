// 솔직 검증: 타워/적/서포트 모두 맵에 배치 후 실제 렌더 확인
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('[err]', e.message));

  await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => { Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k)); sessionStorage.clear(); });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // 모달 다 닫기
  for (let i = 0; i < 5; i++) {
    const has = await p.evaluate(() => !!document.querySelector('.fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85'));
    if (!has) break;
    try { await p.mouse.click(10, 10); await p.waitForTimeout(250); } catch {}
  }

  await p.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await p.waitForTimeout(1500);
  try { await p.locator('button:has-text("건너뛰기")').first().click({ timeout: 1500 }); } catch {}
  await p.waitForTimeout(400);

  // 치트: 여러 속성 + 서포트 + 골드
  await p.keyboard.press('Backquote');
  await p.waitForTimeout(200);
  for (const e of ['fire', 'water', 'electric', 'wind', 'void', 'light']) {
    await p.keyboard.type(`give 1 ${e} 3`); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  }
  for (let i = 0; i < 3; i++) { await p.keyboard.type('support 2'); await p.keyboard.press('Enter'); await p.waitForTimeout(80); }
  await p.keyboard.type('gold 5000'); await p.keyboard.press('Enter'); await p.waitForTimeout(80);
  await p.keyboard.press('Backquote'); await p.waitForTimeout(500);

  // 여러 타일에 타워 순차 배치 (각기 다른 속성)
  const elems = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
  const nameMap = { fire: '화염', water: '냉기', electric: '전격', wind: '질풍', void: '공허', light: '광휘' };
  const tileIndexes = [25, 40, 55, 72, 88, 105];
  for (let i = 0; i < 6; i++) {
    const tiles = await p.locator('.grass-tile').all();
    if (tileIndexes[i] >= tiles.length) continue;
    try {
      await tiles[tileIndexes[i]].click({ timeout: 1500 });
      await p.waitForTimeout(250);
      // 해당 속성 오브 클릭 (img alt 기반)
      const orb = p.locator(`img[alt="${nameMap[elems[i]]}"]`).first();
      if (await orb.count() > 0) {
        await orb.click({ timeout: 1500 });
        await p.waitForTimeout(200);
        // T1 선택
        const tbtn = p.locator('div').filter({ hasText: /^T1x\d+$/ }).first();
        if (await tbtn.count() > 0) {
          await tbtn.click({ timeout: 1000 });
          await p.waitForTimeout(400);
        }
      }
    } catch {}
  }

  // 웨이브 시작 → 적 스폰
  try {
    await p.locator('button:has-text("▶ 시작")').first().click({ timeout: 2000 });
  } catch (e) { console.log('start btn:', e.message.slice(0, 100)); }
  await p.waitForTimeout(2000);

  // 5x 배속 → 적 이동 활발히
  try { await p.locator('button:text-is("5x")').first().click({ timeout: 1000 }); } catch {}
  await p.waitForTimeout(2500);

  await p.screenshot({ path: '/tmp/playtest/final-verify.png' });

  // DOM 상세 통계
  const stats = await p.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const towerImgs = imgs.filter(i => i.src.includes('/assets/towers/'));
    const enemyImgs = imgs.filter(i => i.src.includes('/assets/enemies/'));
    const supportImgs = imgs.filter(i => i.src.includes('/assets/supports/'));
    const iconImgs = imgs.filter(i => i.src.includes('/assets/icons/'));
    return {
      total: imgs.length,
      tower: towerImgs.map(i => i.src.split('/').slice(-2).join('/')),
      enemy: enemyImgs.map(i => i.src.split('/').slice(-1)[0]),
      support: supportImgs.map(i => i.src.split('/').slice(-2).join('/')),
      icons: iconImgs.length,
    };
  });
  console.log('=== 실제 DOM 통계 ===');
  console.log('타워 img:', stats.tower.length, '개');
  stats.tower.slice(0, 10).forEach(s => console.log('  -', s));
  console.log('적 img:', stats.enemy.length, '개');
  stats.enemy.forEach(s => console.log('  -', s));
  console.log('서포트 img:', stats.support.length, '개');
  stats.support.forEach(s => console.log('  -', s));
  console.log('오브 img:', stats.icons, '개');

  await b.close();
})();
