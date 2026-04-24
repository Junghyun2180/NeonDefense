// E2E: 6속성 모두 인게임 렌더 확인
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

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 모달 백드롭 클릭으로 닫기
  for (let i = 0; i < 5; i++) {
    const has = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85'));
    if (!has) break;
    try { await page.mouse.click(10, 10); await page.waitForTimeout(250); } catch {}
  }

  await page.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await page.waitForTimeout(1500);
  try { await page.locator('button:has-text("건너뛰기")').first().click({ timeout: 1500 }); } catch {}
  await page.waitForTimeout(500);

  // 각 속성 T1, T3 하나씩 (6속성 × 2티어 = 12개)
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(200);
  const elems = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
  for (const e of elems) {
    for (const t of [1, 3]) {
      await page.keyboard.type(`give ${t} ${e} 1`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
  }
  // 골드 추가
  await page.keyboard.type('gold 2000');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(400);

  // 인벤토리에서 각 타워 하나씩 배치 — 자동 배치 대신 위치 직접 클릭
  // 간단히 방사형 메뉴 플로우 돌리기
  const positions = [
    { tx: 2, ty: 1 },  { tx: 5, ty: 1 },  { tx: 8, ty: 1 },
    { tx: 11, ty: 1 }, { tx: 14, ty: 1 }, { tx: 2, ty: 4 },
    { tx: 5, ty: 4 },  { tx: 8, ty: 4 },  { tx: 11, ty: 4 },
    { tx: 14, ty: 4 }, { tx: 2, ty: 7 },  { tx: 5, ty: 7 },
  ];

  const TILE_SIZE = await page.evaluate(() => {
    const t = document.querySelector('.grass-tile');
    return t ? t.getBoundingClientRect().width : 40;
  });
  const mapRect = await page.evaluate(() => {
    const tiles = document.querySelectorAll('.grass-tile');
    if (!tiles.length) return null;
    const first = tiles[0].getBoundingClientRect();
    const last = tiles[tiles.length - 1].getBoundingClientRect();
    return { left: first.left, top: first.top };
  });

  // 각 속성별 1 타일씩 시도 — 타일 직접 좌표 클릭
  const elemsAll = ['fire', 'water', 'electric', 'wind', 'void', 'light'];
  for (let i = 0; i < 6 && i < positions.length; i++) {
    const pos = positions[i];
    const elem = elemsAll[i];
    try {
      // 해당 타일 클릭
      const tiles = await page.locator('.grass-tile').all();
      const idx = 20 + i * 8;
      if (idx >= tiles.length) continue;
      await tiles[idx].click({ timeout: 1000 });
      await page.waitForTimeout(250);
      // 해당 속성 오브 클릭 — title로 찾기
      const orbImg = page.locator(`img[title="${elem}"], [title*="${elem}"] img, img[alt*="${elem}"]`).first();
      if (await orbImg.count() === 0) {
        // alt 기반으로 시도
        const names = { fire: '화염', water: '냉기', electric: '전격', wind: '질풍', void: '공허', light: '광휘' };
        const imgAlt = page.locator(`img[alt="${names[elem]}"]`).first();
        if (await imgAlt.count() > 0) await imgAlt.click({ timeout: 1000 });
      } else {
        await orbImg.click({ timeout: 1000 });
      }
      await page.waitForTimeout(250);
      // 티어 선택
      const tier = page.locator('div').filter({ hasText: /^T\d+x\d+$/ }).first();
      if (await tier.count() > 0) {
        await tier.click({ timeout: 1000 });
        await page.waitForTimeout(300);
      }
    } catch {}
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/playtest/sprite-all-6.png' });

  // img 태그 개수
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(i => (i.src || '').includes('/towers/'))
      .map(i => i.src.split('/').slice(-3).join('/'));
  });
  console.log('타워 img 태그:', imgs.length + '개');
  imgs.forEach(s => console.log(' -', s));

  const orbs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(i => (i.src || '').includes('/icons/elements/'))
      .map(i => i.src.split('/').slice(-1)[0]);
  });
  console.log('오브 img 태그:', orbs.length + '개 —', orbs.join(', '));

  await b.close();
  console.log('스크린샷 저장: /tmp/playtest/sprite-all-6.png');
})().catch(e => { console.error(e); process.exit(1); });
