// 합의 10 Phase 2: Floor 시스템 시각 검증
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const OUT = '/tmp/floor-shots';
fs.mkdirSync(OUT, { recursive: true });

async function clickFirstMatching(page, predicate) {
  return await page.evaluate((preds) => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled);
    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      for (const p of preds) if (text.includes(p)) { b.click(); return true; }
    }
    return false;
  }, predicate);
}
async function cheat(page, cmd) {
  await page.keyboard.press('Backquote'); await page.waitForTimeout(100);
  await page.keyboard.type(cmd, { delay: 10 });
  await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  await page.keyboard.press('Backquote'); await page.waitForTimeout(100);
}
async function closeXModals(page, n = 3) {
  for (let i = 0; i < n; i++) {
    const closed = await page.evaluate(() => {
      const xs = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && !b.disabled)
        .filter(b => { const t = (b.textContent || '').trim(); return t === '✕' || t === '×'; });
      if (xs.length === 0) return false;
      xs[0].click(); return true;
    });
    if (!closed) break;
    await page.waitForTimeout(200);
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  // localStorage 초기화 (clean state)
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await closeXModals(page, 3);
  await page.screenshot({ path: path.join(OUT, '01-mainmenu-fresh.png') });

  // Floor 표기 확인
  const floorTextFresh = await page.evaluate(() => {
    const m = document.body.textContent.match(/F\d+|Floor \d+|🏯[^\s]*/g);
    return m;
  });
  console.log('메인메뉴 Floor 표기 (fresh):', floorTextFresh);

  // 새 게임 → 헤더 F1 확인
  await clickFirstMatching(page, ['🏰 캠페인']);
  await page.waitForTimeout(300);
  await clickFirstMatching(page, ['새 게임 시작']);
  await page.waitForTimeout(1500);
  await clickFirstMatching(page, ['튜토리얼 건너뛰기']);
  await page.waitForTimeout(400);
  await page.click('body');

  const headerText = await page.evaluate(() => document.body.textContent.match(/F\d+|🏯F?\d+|🏰\s*\d+\/\d+/g));
  console.log('인게임 헤더:', headerText);
  await page.screenshot({ path: path.join(OUT, '02-game-header-floor1.png') });

  // metaProgress 강제 변경 → Floor 2 도전 시 헤더 변화
  await page.evaluate(() => {
    const meta = JSON.parse(localStorage.getItem('neonDefense_runMeta_v1') || '{}');
    meta.stats = { ...(meta.stats || {}), highestCampaignFloor: 5 };
    meta.version = 1;
    meta.crystals = meta.crystals || 0;
    meta.upgrades = meta.upgrades || {};
    localStorage.setItem('neonDefense_runMeta_v1', JSON.stringify(meta));
  });

  // 메인메뉴로 돌아가기 → 새 게임 시작 → F6 (highest+1)
  await clickFirstMatching(page, ['← 메인 메뉴']);
  await page.waitForTimeout(300);
  await closeXModals(page, 2);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await closeXModals(page, 3);
  await page.screenshot({ path: path.join(OUT, '03-mainmenu-after-clears.png') });

  const floorTextAfter = await page.evaluate(() => document.body.textContent.match(/F\d+|🏯[^\s]*|F\d+\s*\(최고/g));
  console.log('메인메뉴 Floor 표기 (highest=5):', floorTextAfter);

  await clickFirstMatching(page, ['🏰 캠페인']);
  await page.waitForTimeout(300);
  await clickFirstMatching(page, ['새 게임 시작']);
  await page.waitForTimeout(1500);
  await clickFirstMatching(page, ['튜토리얼 건너뛰기']);
  await page.waitForTimeout(400);

  const headerAfter = await page.evaluate(() => document.body.textContent.match(/F\d+|🏯F?\d+/g));
  console.log('인게임 헤더 (F6 도전):', headerAfter);
  await page.screenshot({ path: path.join(OUT, '04-game-header-floor6.png') });

  // 적 HP 확인 — Floor 6 = ×1.15^5 = 2.01배 적용되었는지
  await page.click('body');
  await cheat(page, 'lives 99');
  await cheat(page, 'gold 10000');
  await cheat(page, 'wave 10');
  await page.waitForTimeout(300);
  await closeXModals(page, 2);
  await clickFirstMatching(page, ['▶ 시작']);
  await page.waitForTimeout(15000); // 보스 등장 대기

  const bossHp = await page.evaluate(() => {
    const bosses = Array.from(document.querySelectorAll('[data-enemy-type="boss"]'));
    if (bosses.length === 0) return null;
    const hpBars = bosses.map(b => b.querySelector('.enemy-health-bar')).filter(Boolean);
    return { count: bosses.length };
  });
  console.log('Floor 6 W10 보스 등장:', bossHp);

  if (bossHp && bossHp.count > 0) {
    await page.evaluate(() => {
      const b = document.querySelector('[data-enemy-type="boss"]');
      if (b) b.click();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '05-floor6-boss-info.png') });
    const bossInfoText = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('p.text-rose-400')).filter(p => p.textContent.includes('선택 적'));
      const card = headers[0]?.closest('div.bg-gray-900\\/80') || headers[0]?.parentElement?.parentElement;
      return (card?.textContent || '').slice(0, 200);
    });
    console.log('Floor 6 보스 정보:', bossInfoText);
  }

  console.log('에러:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e));
  console.log('스크린샷:', OUT);
  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
