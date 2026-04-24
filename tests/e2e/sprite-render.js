// E2E: Fire 타워 스프라이트 렌더 — 치트로 인벤 채우고 배치까지
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
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 모달 닫기 (도움말/출석) - 백드롭 클릭
  for (let i = 0; i < 5; i++) {
    const has = await page.evaluate(() => {
      return !!document.querySelector('.fixed.inset-0[style*="z-index"], .fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85');
    });
    if (!has) break;
    try { await page.mouse.click(10, 10); await page.waitForTimeout(250); } catch {}
  }

  // 새 게임
  await page.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await page.waitForTimeout(1500);
  // 튜토리얼 skip
  try { await page.locator('button:has-text("건너뛰기")').first().click({ timeout: 1500 }); } catch {}
  await page.waitForTimeout(400);

  // Cheat: Fire 각 티어 3개씩
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(200);
  for (const t of [1, 2, 3, 4]) {
    await page.keyboard.type(`give ${t} fire 3`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(300);

  // T4 역할 모달 자동 확인 (만약 뜬다면 A 클릭)
  const roleBtn = page.locator('button, div').filter({ hasText: /^[ABC]$|연소|확산|고열/ }).first();
  if (await roleBtn.count() > 0) { try { await roleBtn.click({ timeout: 1000 }); await page.waitForTimeout(300); } catch {} }

  // 맵에 4개 배치 — 타일 직접 클릭 좌표 (가운데 쯤)
  const mapInfo = await page.evaluate(() => {
    const map = document.querySelector('[ref]') || document.querySelector('.relative > .relative');
    const firstTile = document.querySelector('.grass-tile');
    if (!firstTile) return null;
    const rect = firstTile.getBoundingClientRect();
    return { tileSize: rect.width, mapTop: rect.top, mapLeft: rect.left };
  });

  // 타워 배치 좌표 4개 (경로 옆)
  const placements = [
    { tileX: 3, tileY: 1 },
    { tileX: 6, tileY: 2 },
    { tileX: 9, tileY: 3 },
    { tileX: 12, tileY: 4 },
  ];

  for (const p of placements) {
    // 경로가 아닌 빈 타일 위치 추정
    const tiles = await page.locator('.grass-tile').all();
    // 간단히 클릭 가능한 영역에 있는 타일 시도
    let clicked = false;
    for (let i = 20; i < tiles.length && !clicked; i += 7) {
      try {
        await tiles[i].click({ timeout: 1000 });
        await page.waitForTimeout(300);
        // 방사형 메뉴 열렸는지
        const radialHint = await page.evaluate(() => document.body.textContent.includes('속성을 선택'));
        if (!radialHint) continue;
        // Fire 아이콘 클릭 (🔥 포함 div)
        const fireIcon = page.locator('div').filter({ hasText: /^🔥$/ }).first();
        if (await fireIcon.count() > 0) {
          await fireIcon.click({ timeout: 1000 });
          await page.waitForTimeout(250);
          // 티어 선택 (첫 번째)
          const tBtns = page.locator('div').filter({ hasText: /^T\d+x\d+$/ });
          const tc = await tBtns.count();
          if (tc > 0) {
            await tBtns.first().click({ timeout: 1000 });
            await page.waitForTimeout(400);
            clicked = true;
          }
        }
      } catch {}
    }
    if (!clicked) break;
  }

  await page.waitForTimeout(500);

  // 스크린샷 전체
  await page.screenshot({ path: '/tmp/playtest/sprite-fire-placed.png' });

  // img 태그 확인
  const imgs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(i => (i.src || '').includes('/towers/fire/'))
      .map(i => ({ src: i.src.split('/').slice(-3).join('/'), w: i.naturalWidth, h: i.naturalHeight }));
  });
  console.log('Fire 스프라이트 img 태그:', imgs.length + '개');
  imgs.forEach(i => console.log(' -', i.src, `${i.w}x${i.h}`));

  console.log('Errors:', errors.length);
  await b.close();
  process.exit(imgs.length > 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
