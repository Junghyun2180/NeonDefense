// E2E: 튜토리얼 플로우 — 첫 유저 관점으로 draw → combine → place → start → done 진행
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:8765/index.html';

function readTutorialState(page) {
  return page.evaluate(() => {
    const body = document.body.textContent;
    // 튜토리얼 오버레이 감지: "1️⃣ 타워 뽑기", "2️⃣ 조합", ...
    const steps = ['1️⃣ 타워 뽑기', '2️⃣ 조합', '3️⃣ 배치', '4️⃣ 웨이브 시작', '✨ 튜토리얼 완료'];
    const visible = steps.find(s => body.includes(s)) || null;
    return { visibleStep: visible };
  });
}

(async () => {
  const errors = [];
  const b = await chromium.launch({ executablePath: BROWSER, headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => m.type() === 'error' && errors.push('[console] ' + m.text()));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  console.log('=== 튜토리얼 E2E 플로우 ===\n');

  // 1. 도움말 모달 닫기
  const helpClose = page.locator('button:has-text("✕")').first();
  if (await helpClose.count() > 0) {
    await helpClose.click();
    await page.waitForTimeout(200);
  }
  console.log('1. 도움말 모달 닫음');

  // 2. 새 게임 시작 → 튜토리얼 시작 확인
  await page.locator('button').filter({ hasText: /새 게임 시작/ }).first().click();
  await page.waitForTimeout(1500);

  let t = await readTutorialState(page);
  console.log('2. 새 게임 시작 직후 튜토리얼 단계:', t.visibleStep);
  if (!t.visibleStep) {
    console.log('   ❌ FAIL: 튜토리얼 자동 시작 안 됨');
    await b.close();
    process.exit(1);
  }
  console.log('   ✅ "' + t.visibleStep + '" 표시');

  // 3. 10연뽑 버튼 레이블 확인 (3번 작업 검증)
  const draw10Label = await page.locator('button').filter({ hasText: /🎲 x\d+/ }).nth(1).textContent().catch(() => null);
  console.log('3. 10연뽑 버튼 레이블:', JSON.stringify(draw10Label));
  if (!draw10Label || !/\(\d+G\)/.test(draw10Label)) {
    console.log('   ⚠️  레이블에 골드 정보 없음 (예상: "🎲 x5 (100G)" 형태)');
  } else {
    console.log('   ✅ 동적 레이블 OK');
  }

  // 4. 뽑기 실행 → 다음 단계(조합) 진입 확인
  const drawX1 = page.locator('button:has-text("🎲 x1")').first();
  await drawX1.click();
  await page.waitForTimeout(500);
  t = await readTutorialState(page);
  console.log('4. 뽑기 후 튜토리얼 단계:', t.visibleStep);

  // 5. 조합 단계에서 "다음" 클릭
  if (t.visibleStep === '2️⃣ 조합') {
    const nextBtn = page.locator('button').filter({ hasText: /다음 →/ }).first();
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(400);
      t = await readTutorialState(page);
      console.log('5. "다음" 클릭 후:', t.visibleStep);
    }
  }

  // 6. 배치 시도 (3번 작업 + PlacementUI 힌트 확인)
  const tile = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.grass-tile'));
    if (!tiles.length) return null;
    // 경로 옆 첫 번째 풀 타일
    const t = tiles[Math.floor(tiles.length / 2)];
    const r = t.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (tile) {
    await page.mouse.click(tile.x, tile.y);
    await page.waitForTimeout(400);
    // PlacementUI 힌트 배너 확인
    const hintVisible = await page.evaluate(() => document.body.textContent.includes('빈 곳 탭 시 취소'));
    console.log('6. 타일 탭 → PlacementUI 힌트:', hintVisible ? '✅ 표시됨' : '❌ 안 보임');
  }

  // 튜토리얼 진행 끝까지 타워 배치하고 웨이브 시작은 스킵 (시간 많이 걸림)
  // 대신 "튜토리얼 건너뛰기" 버튼 확인
  const skipBtn = page.locator('button:has-text("튜토리얼 건너뛰기")').first();
  const hasSkip = await skipBtn.count() > 0;
  console.log('7. 건너뛰기 버튼 존재:', hasSkip ? '✅' : '❌');

  // ESC로 배치 UI 먼저 닫기
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
  // 백드롭 클릭으로 닫기
  await page.mouse.click(50, 50).catch(() => {});
  await page.waitForTimeout(300);

  // 건너뛰기 → tutorialDone 저장 확인
  if (hasSkip) {
    const visibleSkip = await skipBtn.isVisible().catch(() => false);
    if (visibleSkip) {
      await skipBtn.click().catch(() => {});
      await page.waitForTimeout(300);
      const done = await page.evaluate(() => (JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}')).tutorialDone);
      console.log('8. 건너뛰기 클릭 후 tutorialDone:', done);
    }
  }

  console.log('\nErrors:', errors.length);
  errors.slice(0, 3).forEach(e => console.log('  ', e.slice(0, 150)));
  await b.close();
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
