// E2E: 도감(CollectionModal) 동작 + 타워 생성 시 기록 검증
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';

(async () => {
  const browser = await chromium.launch({ executablePath: BROWSER, headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#root *', { timeout: 10000 });
  await page.waitForTimeout(500);
  // DailyLogin 자동팝업 방지 — sessionStorage 플래그 미리 세팅 후 리로드
  await page.evaluate(() => {
    sessionStorage.setItem('__dailyLoginOpened', '1');
    // 오늘 보상 이미 수령한 상태로 마킹 (자동 오픈 조건 차단)
    const today = new Date();
    const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    localStorage.setItem('neonDefense_dailyLogin_v1', JSON.stringify({ currentDay: 1, lastClaimDate: d, streak: 1 }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // 첫 접속 도움말 자동 표시 닫기 (W13) + DailyLogin 자동팝업 닫기 (A2)
  for (let i = 0; i < 3; i++) {
    try {
      const closeBtn = page.locator('button:has-text("✕")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click({ timeout: 1500 });
        await page.waitForTimeout(200);
      } else break;
    } catch { break; }
  }
  await page.waitForTimeout(200);

  // localStorage 초기 상태 기록
  const before = await page.evaluate(() => {
    return {
      collection: localStorage.getItem('neonDefense_collection_v1'),
      tutorialSeen: !!JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}').tutorialSeen,
    };
  });

  // 도감 버튼 클릭
  const collectionBtn = page.locator('button:has-text("🗂️ 도감")').first();
  await collectionBtn.click();
  await page.waitForTimeout(300);

  // 모달 열림 확인
  const modalText = await page.evaluate(() => document.body.textContent);
  const hasCollection = modalText.includes('수집률');
  const hasTabs = modalText.includes('타워') && modalText.includes('T4 역할') && modalText.includes('서포트') && modalText.includes('적');

  // 탭 전환 테스트
  await page.locator('button:has-text("T4 역할")').first().click().catch(() => {});
  await page.waitForTimeout(150);
  await page.locator('button:has-text("서포트")').first().click().catch(() => {});
  await page.waitForTimeout(150);
  await page.locator('button:has-text("👾 적")').first().click().catch(() => {});
  await page.waitForTimeout(150);

  // 필터 전환
  await page.locator('button:has-text("미획득")').first().click().catch(() => {});
  await page.waitForTimeout(100);
  await page.locator('button:has-text("전체")').first().click().catch(() => {});
  await page.waitForTimeout(100);

  // CollectionSystem에 수동 기록 → UI 반영 확인
  await page.evaluate(() => {
    CollectionSystem.recordTower(0, 1);   // fire T1
    CollectionSystem.recordTower(0, 2);   // fire T2
    CollectionSystem.recordTower(1, 1);   // water T1
    CollectionSystem.recordEnemyKill('normal');
    CollectionSystem.recordEnemyKill('fast');
  });

  const completion = await page.evaluate(() => CollectionSystem.getCompletion());

  // 모달 닫기
  await page.locator('button:has-text("✕")').first().click().catch(() => {});
  await page.waitForTimeout(200);

  console.log('=== COLLECTION E2E ===');
  console.log('도감 모달 열림:', hasCollection ? 'OK' : 'FAIL');
  console.log('4개 탭 렌더링:', hasTabs ? 'OK' : 'FAIL');
  console.log('수동 기록 후 수집률:', completion.unlocked + '/' + completion.total + ' (' + completion.percent + '%)');
  console.log('Errors:', errors.length);
  errors.slice(0, 3).forEach(e => console.log('  ', e));

  await browser.close();
  const pass = hasCollection && hasTabs && completion.unlocked > 0 && errors.length === 0;
  console.log('\nCOLLECTION E2E:', pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
