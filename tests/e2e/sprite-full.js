// 최종 통합 스크린샷 — 타워/서포트/적 모두 배치된 게임 화면
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const URL = 'http://localhost:8765/index.html';

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true, args: ['--ignore-certificate-errors']
  });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('[err]', e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k)); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  for (let i = 0; i < 5; i++) {
    const has = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85'));
    if (!has) break;
    try { await page.mouse.click(10, 10); await page.waitForTimeout(250); } catch {}
  }

  // 스프라이트 로드 확인
  const sprites = await page.evaluate(() => ({
    tower: Array.from(TowerSprite?._available || []),
    enemy: Array.from(EnemySprite?._available || []),
    support: Array.from(SupportSprite?._available || []),
  }));
  console.log('Tower:', sprites.tower.length, '/ Enemy:', sprites.enemy.length, '/ Support:', sprites.support.length);

  // 새 게임 시작
  await page.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await page.waitForTimeout(1500);
  try { await page.locator('button:has-text("건너뛰기")').first().click({ timeout: 1500 }); } catch {}
  await page.waitForTimeout(400);

  // 치트 — 타워/서포트/적
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(200);
  // 6속성 T1~T3 각 1개
  for (const e of ['fire', 'water', 'electric', 'wind', 'void', 'light']) {
    await page.keyboard.type(`give 1 ${e} 1`); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    await page.keyboard.type(`give 3 ${e} 1`); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  }
  // 서포트 4종 S1~S3
  for (let t = 1; t <= 3; t++) {
    await page.keyboard.type(`support ${t}`); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  }
  await page.keyboard.type('gold 5000'); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(400);

  // 타워 여러개 배치 (일반 타워 좌표)
  const places = [30, 45, 60, 80, 100, 120];
  for (const idx of places) {
    try {
      const tiles = await page.locator('.grass-tile').all();
      if (idx >= tiles.length) continue;
      await tiles[idx].click({ timeout: 1000 });
      await page.waitForTimeout(200);
      // 첫 번째 활성 속성 오브
      const orb = page.locator('img[alt]').filter({ hasText: '' }).first();
      const orbAll = page.locator('div[style*="border-radius"] img[alt]');
      if (await orbAll.count() > 0) {
        await orbAll.first().click({ timeout: 800 });
        await page.waitForTimeout(200);
        const tbtns = page.locator('div').filter({ hasText: /^T\d+x\d+$/ });
        if (await tbtns.count() > 0) {
          await tbtns.first().click({ timeout: 800 });
          await page.waitForTimeout(300);
        }
      }
    } catch {}
  }

  // 웨이브 시작 → 적 스폰되어 맵에 등장
  try {
    await page.locator('button:has-text("▶ 시작")').first().click({ timeout: 1500 });
  } catch {}
  await page.waitForTimeout(2500);
  // 5배속
  try { await page.locator('button:text-is("5x")').first().click({ timeout: 1000 }); } catch {}
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/tmp/playtest/sprite-full-battle.png' });

  // DOM img 통계
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(i => (i.src || '').includes('/assets/'))
      .map(i => i.src.split('/').slice(-3).join('/'));
  });
  const byKind = {};
  imgs.forEach(s => {
    const k = s.split('/')[0];
    byKind[k] = (byKind[k] || 0) + 1;
  });
  console.log('img 개수 by kind:', byKind);

  await b.close();
})();
