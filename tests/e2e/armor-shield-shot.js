// armor/shield UI 스크린샷 — Stage 4 강제 진입 후 적 스폰 캡처
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const OUT = '/tmp/armor-shield-shots';
fs.mkdirSync(OUT, { recursive: true });

async function snap(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
}

async function snapMap(page, name) {
  // 게임 맵 영역만 확대 캡처 (적 HP/Shield/Armor UI 가독성)
  const box = await page.evaluate(() => {
    // 맵 컨테이너 추정: 가장 큰 .relative 컨테이너 중 적 HP 바를 포함하는 것
    const bars = document.querySelector('.enemy-health-bar');
    if (!bars) return null;
    let el = bars.parentElement;
    while (el && el.parentElement) {
      const r = el.getBoundingClientRect();
      if (r.width >= 400 && r.height >= 300) return { x: r.x, y: r.y, w: r.width, h: r.height };
      el = el.parentElement;
    }
    return null;
  });
  if (!box) {
    await snap(page, name);
    return;
  }
  await page.screenshot({
    path: path.join(OUT, name + '.png'),
    clip: { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.w), height: Math.ceil(box.h) },
  });
}

async function dumpButtons(page, label) {
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled)
      .map(b => (b.textContent || '').trim())
      .filter(t => t.length > 0 && t.length < 100);
  });
  console.log(`[${label}] visible buttons:`, JSON.stringify(buttons.slice(0, 20)));
}

async function clickFirstMatching(page, predicate, label) {
  const ok = await page.evaluate((preds) => {
    const buttons = Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled);
    for (const b of buttons) {
      const text = (b.textContent || '').trim();
      for (const p of preds) {
        if (text.includes(p)) { b.click(); return text; }
      }
    }
    return null;
  }, predicate);
  console.log(`[click ${label}] →`, ok || 'NOT FOUND');
  return !!ok;
}

async function dismissModals(page) {
  // 간단히 보이는 모달 닫기 버튼이나 첫 옵션 클릭
  for (let i = 0; i < 5; i++) {
    const dismissed = await page.evaluate(() => {
      // 모달 안의 버튼 찾기
      const modals = Array.from(document.querySelectorAll('div'))
        .filter(d => d.className.includes('fixed') && d.className.includes('inset-0'));
      if (modals.length === 0) return null;
      // 첫 번째 모달 내 첫 클릭 가능 버튼
      const firstModal = modals[modals.length - 1]; // 최신
      const btns = Array.from(firstModal.querySelectorAll('button'))
        .filter(b => !b.disabled && b.offsetParent !== null);
      if (btns.length === 0) return null;
      const text = (btns[0].textContent || '').trim();
      btns[0].click();
      return text;
    });
    if (!dismissed) break;
    console.log('[dismiss modal]', dismissed);
    await page.waitForTimeout(400);
  }
}

async function cheat(page, cmd) {
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(150);
  await page.keyboard.type(cmd, { delay: 15 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(120);
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

  await snap(page, '01-main-menu');
  await dumpButtons(page, 'main');

  // 도움말 + 일일 로그인 모달을 X 버튼으로 직접 닫기 (위치 우상단 X)
  for (let i = 0; i < 4; i++) {
    const closed = await page.evaluate(() => {
      // SVG X 또는 텍스트 ✕ 버튼만 정확히 찾기 (내용이 X 한 글자 또는 빈 텍스트인 버튼)
      const xButtons = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && !b.disabled)
        .filter(b => {
          const t = (b.textContent || '').trim();
          return t === '✕' || t === '×' || t === 'X' || t.length === 0;
        });
      if (xButtons.length === 0) return false;
      xButtons[0].click();
      return true;
    });
    if (!closed) break;
    console.log('[close X modal]');
    await page.waitForTimeout(300);
  }
  await snap(page, '02-modals-closed');
  await dumpButtons(page, 'after-close');

  // 캠페인 모드 토글 (이미 기본값이지만 확실히)
  await clickFirstMatching(page, ['🏰 캠페인'], 'mode-campaign');
  await page.waitForTimeout(300);
  // 새 게임 시작 카드 클릭 — 실제 게임 진입
  await clickFirstMatching(page, ['새 게임 시작'], 'new-game');
  await page.waitForTimeout(1500);
  await snap(page, '04-after-new-game');
  await dumpButtons(page, 'after-new-game');

  // 잔여 모달 닫기
  for (let i = 0; i < 3; i++) {
    const closed = await page.evaluate(() => {
      const xButtons = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && !b.disabled)
        .filter(b => {
          const t = (b.textContent || '').trim();
          return t === '✕' || t === '×';
        });
      if (xButtons.length === 0) return false;
      xButtons[0].click();
      return true;
    });
    if (!closed) break;
    await page.waitForTimeout(250);
  }

  // 튜토리얼 스킵 (키 입력 막힘 방지)
  await clickFirstMatching(page, ['튜토리얼 건너뛰기'], 'skip-tutorial');
  await page.waitForTimeout(500);

  // 캔버스 / 게임 영역 포커스
  await page.click('body');
  await page.waitForTimeout(200);

  // Stage 4 점프 — 백틱 + 입력
  await cheat(page, 'stage 4');
  await page.waitForTimeout(500);
  await dismissModals(page);
  await cheat(page, 'lives 99');
  await cheat(page, 'gold 5000');
  await page.waitForTimeout(300);
  await snap(page, '05-stage4-ready');
  await dumpButtons(page, 'stage4');

  // 타워 몇 개 미리 뽑기 (보스 처치를 어느 정도 해야 다음 웨이브로 진입)
  for (let i = 0; i < 8; i++) await cheat(page, 'tower 4');
  await page.waitForTimeout(200);

  // W5 보스 웨이브까지 cw 로 점프 (W1→W5 = 4번)
  for (let i = 0; i < 4; i++) {
    await cheat(page, 'cw');
    await page.waitForTimeout(500);
    await dismissModals(page);
  }

  // 웨이브 시작
  await dismissModals(page);
  await snap(page, '06-stage4-w5-ready');
  const started = await clickFirstMatching(page, ['▶ 시작'], 'wave-start');
  if (!started) console.log('[fallback] no wave-start');
  // 보스(W5 마지막 적, ~15초 후 스폰) 까지 일정 간격으로 캡처
  const checkpoints = [
    { name: '07-w5-early', wait: 2500 },
    { name: '08-w5-spread', wait: 3000 },
    { name: '09-w5-mid', wait: 3000 },
    { name: '10-w5-pre-boss', wait: 3000 },
    { name: '11-w5-boss', wait: 3000 },
    { name: '12-w5-boss-mid', wait: 4000 },
  ];
  for (const cp of checkpoints) {
    await page.waitForTimeout(cp.wait);
    await snapMap(page, cp.name + '-map');
    const stat = await page.evaluate(() => {
      const armorLabels = Array.from(document.querySelectorAll('div.text-yellow-300'))
        .filter(d => /^\d+$/.test((d.textContent || '').trim()))
        .map(d => d.textContent.trim());
      const shieldBars = Array.from(document.querySelectorAll('div'))
        .filter(d => d.className && typeof d.className === 'string' && d.className.includes('bg-cyan-400'))
        .map(d => parseFloat(d.style.width) || 0)
        .filter(w => w > 0);
      const hp = document.querySelectorAll('.enemy-health-bar').length;
      return { hp, armorLabels, shieldBars };
    });
    console.log(`[${cp.name}] HP=${stat.hp} armor=${JSON.stringify(stat.armorLabels)} shield(width%)=${JSON.stringify(stat.shieldBars)}`);

    // 좁은 클로즈업: armor 라벨 첫 위치 / shield 게이지 첫 위치 ±60px
    const closeups = await page.evaluate(() => {
      const out = [];
      const armorEls = Array.from(document.querySelectorAll('div.text-yellow-300'))
        .filter(d => /^\d+$/.test((d.textContent || '').trim()));
      if (armorEls[0]) {
        const r = armorEls[0].getBoundingClientRect();
        out.push({ tag: 'armor', x: r.x, y: r.y, w: r.width, h: r.height });
      }
      const shieldEls = Array.from(document.querySelectorAll('div'))
        .filter(d => d.className && typeof d.className === 'string' && d.className.includes('bg-cyan-400'))
        .filter(d => (parseFloat(d.style.width) || 0) > 0);
      if (shieldEls[0]) {
        const r = shieldEls[0].getBoundingClientRect();
        out.push({ tag: 'shield', x: r.x, y: r.y, w: r.width, h: r.height });
      }
      return out;
    });
    for (const c of closeups) {
      const padX = 80, padY = 80;
      await page.screenshot({
        path: path.join(OUT, `${cp.name}-closeup-${c.tag}.png`),
        clip: {
          x: Math.max(0, Math.floor(c.x - padX)),
          y: Math.max(0, Math.floor(c.y - padY)),
          width: Math.ceil(c.w + padX * 2),
          height: Math.ceil(c.h + padY * 2),
        },
      });
    }
  }

  // UI 카운트
  const enemySnap = await page.evaluate(() => {
    const hpBars = document.querySelectorAll('.enemy-health-bar').length;
    const shieldBars = Array.from(document.querySelectorAll('div'))
      .filter(d => d.className.includes('bg-cyan-400')).length;
    const armorLabels = Array.from(document.querySelectorAll('div.text-yellow-300'))
      .filter(d => /^\d+$/.test((d.textContent || '').trim()))
      .map(d => d.textContent.trim());
    return { hpBars, shieldBars, armorLabels };
  });
  console.log('=== ARMOR/SHIELD UI CHECK ===');
  console.log('적 HP 바:', enemySnap.hpBars);
  console.log('실드 게이지(청록):', enemySnap.shieldBars);
  console.log('Armor 라벨 수:', enemySnap.armorLabels.length, '값:', enemySnap.armorLabels);
  console.log('에러:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e));
  console.log('스크린샷:', OUT);

  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
