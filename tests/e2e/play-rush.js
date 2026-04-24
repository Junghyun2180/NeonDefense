// E2E: Rush Mode auto-play — 난이도 측정
// 자동 행동: 메인→런모드→Rush → 계속 뽑기+배치 → 자동 다음웨이브 → 결과 측정
// Run: node tests/e2e/play-rush.js
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const RUNS = parseInt(process.env.RUNS || '3', 10);
const TIMEOUT_SEC = parseInt(process.env.TIMEOUT_SEC || '120', 10);

async function clickButtonByText(page, text) {
  const btn = page.locator(`button:has-text("${text}")`).first();
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
}

async function setGameSpeed(page, s) {
  // In-game speed buttons have labels like "5x"
  const btn = page.locator(`button:text-is("${s}x")`).first();
  if (await btn.count() > 0) await btn.click().catch(() => {});
}

async function attemptPlace(page) {
  // 탭 배치: 맵의 빈 타일 클릭 → 속성 메뉴 → 티어 선택
  // 맵 타일 찾기: .grass-tile (canPlace), 없으면 패스
  const tiles = page.locator('.grass-tile');
  const count = await tiles.count();
  if (count === 0) return false;
  // 경로 인접 타일은 grass-tile로 렌더링됨. 중간 위치 하나 시도.
  const idx = Math.floor(count / 2);
  try {
    await tiles.nth(idx).click({ timeout: 1000 });
    // 속성 선택 방사형 메뉴가 뜨면 아무 활성 속성 클릭
    await page.waitForTimeout(100);
    // 활성 속성 버튼 = opacity-30이 아닌 것. 그냥 여러개 시도
    const elementBtns = page.locator('div[style*="radial-gradient"]').filter({ hasText: /[🔥❄️⚡🌪️🌀💎]/ });
    const ec = await elementBtns.count();
    if (ec > 0) {
      for (let i = 0; i < ec; i++) {
        try {
          await elementBtns.nth(i).click({ timeout: 500 });
          break;
        } catch {}
      }
      await page.waitForTimeout(100);
      // 티어 버튼
      const tierBtns = page.locator('div').filter({ hasText: /^T[1-4]x\d+$/ });
      const tc = await tierBtns.count();
      if (tc > 0) await tierBtns.first().click({ timeout: 500 });
    }
    return true;
  } catch {
    return false;
  }
}

async function readState(page) {
  return page.evaluate(() => {
    const txt = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };
    // 간단히 헤더의 숫자들을 정규식으로 추출
    const all = document.body.textContent;
    const gold = (all.match(/💰\s*(\d+)/) || [])[1];
    const lives = (all.match(/❤️\s*(\d+)/) || [])[1];
    const stage = (all.match(/Stage\s*(\d+)/i) || [])[1];
    const wave = (all.match(/Wave\s*(\d+)/i) || [])[1];
    return { gold: +gold || 0, lives: +lives || 0, stage: +stage || 0, wave: +wave || 0 };
  });
}

async function isRunResultOpen(page) {
  // RunResultModal 은 "결과" or 크리스탈 표시가 있는 모달
  return page.evaluate(() => {
    const txt = document.body.textContent;
    return txt.includes('결과') || txt.includes('획득한 크리스탈') || txt.includes('런 클리어') || txt.includes('런 실패');
  });
}

async function playOneRun(page, runIdx) {
  const start = Date.now();

  // 메인 메뉴 → 런 모드
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#root *', { timeout: 10000 });
  await page.waitForTimeout(500);

  await clickButtonByText(page, '런 모드');
  await page.waitForTimeout(300);

  // Rush Mode 카드 클릭
  await clickButtonByText(page, 'Rush Mode');
  await page.waitForTimeout(500);

  // 초기 배속 5x
  await setGameSpeed(page, 5);
  await page.waitForTimeout(100);

  // 자동 다음 웨이브는 설정 기본 ON. 첫 웨이브는 수동 시작 필요.
  // 전략: 뽑기 x10 → 배치 시도 반복 → 시작

  // 10연뽑 (골드 허용되는 만큼)
  for (let i = 0; i < 3; i++) {
    const pullBtn = page.locator('button:has-text("🎲 x10")').first();
    if (await pullBtn.count() > 0) {
      try { await pullBtn.click({ timeout: 1000 }); } catch {}
      await page.waitForTimeout(80);
    }
  }

  // 배치 시도 3회
  for (let i = 0; i < 3; i++) {
    await attemptPlace(page);
    await page.waitForTimeout(150);
  }

  // 웨이브 시작
  try {
    await clickButtonByText(page, '시작');
  } catch {}

  // 자동 진행: TIMEOUT_SEC초 또는 결과창 뜰때까지 대기하며 중간중간 뽑기+배치
  const deadline = start + TIMEOUT_SEC * 1000;
  let lastTick = Date.now();
  let endReason = 'timeout';

  while (Date.now() < deadline) {
    if (await isRunResultOpen(page)) { endReason = 'result'; break; }

    // 매 2초마다 추가 뽑기+배치
    if (Date.now() - lastTick > 2000) {
      lastTick = Date.now();
      const pullBtn = page.locator('button:has-text("🎲 x10")').first();
      if (await pullBtn.count() > 0) {
        try { await pullBtn.click({ timeout: 500 }); } catch {}
      }
      // 전체 조합 버튼
      const combineAllBtn = page.locator('button:has-text("전체")').first();
      if (await combineAllBtn.count() > 0) {
        try { await combineAllBtn.click({ timeout: 500 }); } catch {}
      }
      await attemptPlace(page);
    }

    await page.waitForTimeout(250);
  }

  const state = await readState(page);
  const duration = Date.now() - start;

  // 결과 모달에서 정보 추출
  let resultInfo = {};
  if (endReason === 'result') {
    resultInfo = await page.evaluate(() => {
      const txt = document.body.textContent;
      return {
        cleared: /클리어|CLEAR/i.test(txt),
        failed: /실패|FAIL|GAME OVER/i.test(txt),
        crystals: +(txt.match(/💎\s*(\d+)/) || [])[1] || 0,
        snippet: txt.slice(0, 500),
      };
    });
  }

  return {
    run: runIdx,
    durationSec: Math.round(duration / 1000),
    endReason,
    state,
    resultInfo,
  };
}

(async () => {
  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

  const results = [];
  for (let i = 1; i <= RUNS; i++) {
    try {
      const r = await playOneRun(page, i);
      results.push(r);
      console.log(`[Run ${i}] ${r.durationSec}s | end=${r.endReason} | state=${JSON.stringify(r.state)} | result=${JSON.stringify(r.resultInfo)}`);
    } catch (e) {
      results.push({ run: i, error: e.message });
      console.log(`[Run ${i}] ERROR: ${e.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  const cleared = results.filter(r => r.resultInfo && r.resultInfo.cleared).length;
  const failed = results.filter(r => r.resultInfo && r.resultInfo.failed).length;
  const durations = results.filter(r => r.durationSec).map(r => r.durationSec);
  const avg = durations.length ? Math.round(durations.reduce((a, b) => a + b) / durations.length) : 0;
  console.log(`Runs: ${results.length}, cleared: ${cleared}, failed: ${failed}, avg duration: ${avg}s`);
  console.log(`Errors: ${errors.length}`);
  errors.slice(0, 3).forEach(e => console.log('  ', e));

  await browser.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
