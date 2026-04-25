// 합의 10 검증: W5 미니보스 + W10 스테이지보스 시각 확인
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const OUT = '/tmp/saurom-shots';
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

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root *');
  await page.waitForTimeout(500);
  await closeXModals(page, 3);
  await clickFirstMatching(page, ['🏰 캠페인']);
  await page.waitForTimeout(300);
  await clickFirstMatching(page, ['새 게임 시작']);
  await page.waitForTimeout(1500);
  await clickFirstMatching(page, ['튜토리얼 건너뛰기']);
  await page.waitForTimeout(400);
  await page.click('body');

  // 헤더에 Stage 1/3 W 1/10 표시 확인
  const headerInitial = await page.evaluate(() => document.body.textContent.match(/Stage \d+\/\d+|W\s*\d+\/\d+|🌊\s*\d+\/\d+/g));
  console.log('헤더 표기:', headerInitial);

  // tower 4개 + 라이프 + Stage 2 (elite 풀에 포함되어야 visible elite 다수)
  await cheat(page, 'lives 99');
  await cheat(page, 'gold 10000');
  for (let i = 0; i < 4; i++) await cheat(page, 'tower 4');
  await cheat(page, 'stage 2');
  await page.waitForTimeout(300);
  await closeXModals(page, 2);

  // W5 로 점프
  await cheat(page, 'wave 5');
  await page.waitForTimeout(400);
  await closeXModals(page, 2);

  // 헤더 W 표기 재확인
  const headerW5 = await page.evaluate(() => document.body.textContent.match(/W\s*\d+\/\d+|🌊\s*\d+\/\d+|🚨\s*\d+\/\d+/g));
  console.log('W5 시작 직전:', headerW5);

  // W5 시작 + 미니보스(마지막 적) 등장 대기
  await closeXModals(page, 2);
  await clickFirstMatching(page, ['▶ 시작']);
  await page.waitForTimeout(15000); // 미니보스는 마지막 적 — enemiesPerWave(2,5)=18 × 600ms ≈ 11s

  // 미니보스 검색
  const miniInfo = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[data-enemy-type]'));
    const types = els.map(e => e.getAttribute('data-enemy-type'));
    return { types, count: els.length };
  });
  console.log('W5 진행 중 적 타입:', miniInfo);
  await page.screenshot({ path: path.join(OUT, '01-w5-running.png') });

  // 미니보스 클릭 (elite 중 isMiniboss 인 것)
  const miniClick = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[data-enemy-type="elite"]'));
    if (els.length === 0) return null;
    // 마지막 적이 미니보스일 가능성 높음 — 가장 큰 size 선택
    let target = els[0];
    let max = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width > max) { max = r.width; target = el; }
    }
    target.click();
    return { width: max };
  });
  console.log('가장 큰 elite 클릭:', miniClick);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02-miniboss-clicked.png') });

  // 패널의 MINI 배지 검증
  const miniBadge = await page.evaluate(() => {
    const all = document.body.textContent;
    const m = all.match(/MINI/g);
    return m ? m.length : 0;
  });
  console.log('MINI 배지 개수:', miniBadge);

  // W10 로 점프
  await cheat(page, 'wave 10');
  await page.waitForTimeout(400);
  await closeXModals(page, 2);

  // W10 시작 + 보스 등장 대기
  const headerW10 = await page.evaluate(() => document.body.textContent.match(/W\s*\d+\/\d+|🌊\s*\d+\/\d+|🚨\s*\d+\/\d+/g));
  console.log('W10 시작 직전:', headerW10);

  await closeXModals(page, 2);
  await clickFirstMatching(page, ['▶ 시작']);
  await page.waitForTimeout(15000); // 보스가 마지막 적이라 길게 대기

  const bossInfo = await page.evaluate(() => {
    const bosses = Array.from(document.querySelectorAll('[data-enemy-type="boss"]'));
    return { count: bosses.length };
  });
  console.log('W10 보스:', bossInfo);
  await page.screenshot({ path: path.join(OUT, '03-w10-boss.png') });

  if (bossInfo.count > 0) {
    await page.evaluate(() => {
      const b = document.querySelector('[data-enemy-type="boss"]');
      if (b) b.click();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '04-boss-clicked.png') });
    const bossBadge = await page.evaluate(() => (document.body.textContent.match(/BOSS/g) || []).length);
    console.log('BOSS 배지 개수:', bossBadge);
  }

  console.log('에러:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e));
  console.log('스크린샷:', OUT);
  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
