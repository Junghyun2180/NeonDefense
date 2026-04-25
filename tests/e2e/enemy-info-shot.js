// 적 클릭 → ControlPanel 정보 카드 표시 검증
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const OUT = '/tmp/enemy-info-shots';
fs.mkdirSync(OUT, { recursive: true });

async function clickFirstMatching(page, predicate, label) {
  const ok = await page.evaluate((preds) => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled);
    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      for (const p of preds) if (text.includes(p)) { b.click(); return text; }
    }
    return null;
  }, predicate);
  console.log(`[click ${label}] →`, ok ? ok.slice(0, 40) : 'NOT FOUND');
  return !!ok;
}

async function cheat(page, cmd) {
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(120);
  await page.keyboard.type(cmd, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(100);
}

async function closeXModals(page, n = 3) {
  for (let i = 0; i < n; i++) {
    const closed = await page.evaluate(() => {
      const xs = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && !b.disabled)
        .filter(b => { const t = (b.textContent || '').trim(); return t === '✕' || t === '×'; });
      if (xs.length === 0) return false;
      xs[0].click();
      return true;
    });
    if (!closed) break;
    await page.waitForTimeout(250);
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
  await clickFirstMatching(page, ['🏰 캠페인'], 'mode');
  await page.waitForTimeout(300);
  await clickFirstMatching(page, ['새 게임 시작'], 'start');
  await page.waitForTimeout(1500);

  await clickFirstMatching(page, ['튜토리얼 건너뛰기'], 'skip');
  await page.waitForTimeout(400);

  // Stage 4 점프 (elite/suppressor armor + aegis shield 활성)
  await page.click('body');
  await cheat(page, 'stage 4');
  await closeXModals(page, 3);
  await cheat(page, 'lives 99');

  await closeXModals(page, 3);
  await clickFirstMatching(page, ['▶ 시작'], 'wave-start');
  await page.waitForTimeout(8000); // W1 진행 — 적 다양하게 등장

  // 적 정보 다양성 확보: 여러 종류 등장하는 시점 캡처
  const enemyTypes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-enemy-type]'))
      .map(el => el.getAttribute('data-enemy-type'));
  });
  console.log('현재 적 타입:', enemyTypes);

  await page.screenshot({ path: path.join(OUT, '01-before-click.png') });

  // 우선 elite/aegis/suppressor 같은 특수 적을 클릭, 없으면 첫 번째 적
  const preferredOrder = ['aegis', 'elite', 'suppressor', 'jammer', 'splitter', 'healer', 'normal', 'fast'];
  let clicked = false;
  for (const t of preferredOrder) {
    const ok = await page.evaluate((t) => {
      const el = document.querySelector(`[data-enemy-type="${t}"]`);
      if (!el) return false;
      el.click();
      return true;
    }, t);
    if (ok) {
      console.log('클릭한 적 타입:', t);
      clicked = true;
      break;
    }
  }
  if (clicked) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '02-after-click.png') });

    // 추가 — aegis 가 있으면 따로 클릭해서 shield 정보 카드도 검증
    const aegisOk = await page.evaluate(() => {
      const el = document.querySelector('[data-enemy-type="aegis"]');
      if (!el) return false;
      el.click();
      return true;
    });
    if (aegisOk) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, '03-aegis-clicked.png') });
      const aegisCard = await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('p.text-rose-400'))
          .filter(p => p.textContent.includes('선택 적'));
        if (headers.length === 0) return null;
        const card = headers[0].closest('div.bg-gray-900\\/80') || headers[0].parentElement?.parentElement;
        return { text: (card?.textContent || '').trim().slice(0, 250) };
      });
      console.log('aegis 카드:', aegisCard);
    } else {
      console.log('이번 런에서 aegis 미등장 — skip');
    }

    // ControlPanel 적 정보 카드 검증
    const card = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('p.text-rose-400'))
        .filter(p => p.textContent.includes('선택 적'));
      if (headers.length === 0) return null;
      const card = headers[0].closest('div.bg-gray-900\\/80') || headers[0].parentElement?.parentElement;
      return { found: true, text: (card?.textContent || '').trim().slice(0, 200) };
    });
    console.log('적 정보 카드:', card);
  }

  console.log('에러:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e));
  console.log('스크린샷:', OUT);
  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
