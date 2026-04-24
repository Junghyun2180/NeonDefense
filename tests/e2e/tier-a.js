// E2E: Tier A 리텐션 훅 (별점 / 출석 / Danger Wave)
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:8765/index.html';

(async () => {
  const errors = [];
  const b = await chromium.launch({ executablePath: BROWSER, headless: true, args: ['--ignore-certificate-errors'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => m.type() === 'error' && errors.push('[console] ' + m.text()));

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => { Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k)); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  console.log('=== Tier A E2E ===\n');

  // ===== A1. StarRating 평가 로직 =====
  const starTests = await page.evaluate(() => {
    return {
      cleared_perfect: StarRating.evaluate({ cleared: true, maxLives: 30, livesLost: 0 }),
      cleared_minor_loss: StarRating.evaluate({ cleared: true, maxLives: 30, livesLost: 5 }),
      cleared_heavy_loss: StarRating.evaluate({ cleared: true, maxLives: 30, livesLost: 20 }),
      not_cleared: StarRating.evaluate({ cleared: false, maxLives: 30, livesLost: 10 }),
    };
  });
  const a1pass = starTests.cleared_perfect === 3 && starTests.cleared_minor_loss === 2
             && starTests.cleared_heavy_loss === 1 && starTests.not_cleared === 0;
  console.log(`A1. StarRating 평가: perfect=${starTests.cleared_perfect} minor=${starTests.cleared_minor_loss} heavy=${starTests.cleared_heavy_loss} fail=${starTests.not_cleared} ${a1pass ? '✅' : '❌'}`);

  // 기록/조회 + 더 높을 때만 갱신
  const recordTests = await page.evaluate(() => {
    StarRating.reset();
    const a = StarRating.recordStage(1, 2);
    const b = StarRating.recordStage(1, 1);  // 더 낮음 → 유지
    const c = StarRating.recordStage(1, 3);  // 더 높음 → 갱신
    return { a, b, c, final: StarRating.getStars(1), total: StarRating.totalStars() };
  });
  const a1record = recordTests.a.newBest && !recordTests.b.newBest && recordTests.c.newBest && recordTests.final === 3;
  console.log(`    기록 갱신 규칙: ${a1record ? '✅' : '❌'} (final=${recordTests.final}★, total=${recordTests.total})`);

  // ===== A2. DailyLogin 수령 로직 =====
  const dailyTests = await page.evaluate(() => {
    DailyLogin.reset();
    const before = DailyLogin.getStatus();
    const claimed = DailyLogin.claim({ onCrystals: () => {}, onTickets: () => {} });
    const after = DailyLogin.getStatus();
    return { beforeCanClaim: before.canClaim, claimedOk: claimed.claimed, afterCanClaim: after.canClaim, claimedDay: claimed.day };
  });
  const a2pass = dailyTests.beforeCanClaim && dailyTests.claimedOk && !dailyTests.afterCanClaim && dailyTests.claimedDay === 1;
  console.log(`A2. DailyLogin 수령: before=${dailyTests.beforeCanClaim} claimed=${dailyTests.claimedOk}(day ${dailyTests.claimedDay}) afterBlocked=${!dailyTests.afterCanClaim} ${a2pass ? '✅' : '❌'}`);

  // DailyLogin 7일 보상 스케줄 확인
  const rewardsCheck = await page.evaluate(() => {
    return DailyLogin.REWARDS.map(r => ({ day: r.day, label: r.label.slice(0, 30), crystals: r.crystals, tickets: r.tickets }));
  });
  console.log(`    7일 보상 스케줄 (총 ${rewardsCheck.length}일)`);
  const totalCrystals = rewardsCheck.reduce((a, r) => a + r.crystals, 0);
  const totalTickets = rewardsCheck.reduce((a, r) => a + r.tickets, 0);
  console.log(`    합계: 크리스탈 ${totalCrystals}개, 뽑기권 ${totalTickets}장 (7일 기준)`);

  // ===== A3. Danger Wave — 적 스탯 증폭 확인 =====
  const dangerTest = await page.evaluate(() => {
    // 같은 시드, 같은 조건 — wave 4 vs wave 5 (캠페인 wavesPerStage=5) 비교
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    // 여러 번 스폰해서 평균 내기 (랜덤 타입 때문)
    const sample = (wave) => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const e = EnemySystem.create(3, wave, 0, 10, path, 'A', 'campaign');
        if (e) results.push({ health: e.maxHealth, speed: e.speed, isDanger: !!e.isDangerWave, type: e.type });
      }
      const avgHp = results.reduce((a, r) => a + r.health, 0) / results.length;
      const avgSpeed = results.reduce((a, r) => a + r.speed, 0) / results.length;
      const dangerCount = results.filter(r => r.isDanger).length;
      return { avgHp, avgSpeed, dangerCount, N: results.length };
    };
    return { w4: sample(4), w5: sample(5) };
  });
  // 플래그 확인 + speed 증가 (적 타입 혼합으로 HP 평균은 불안정 → speed로만 검증)
  const dangerFlagsOn5 = dangerTest.w5.dangerCount >= dangerTest.w5.N * 0.9;
  const noDangerOn4 = dangerTest.w4.dangerCount === 0;
  const speedIncreased = dangerTest.w5.avgSpeed > dangerTest.w4.avgSpeed * 1.10;
  const a3pass = dangerFlagsOn5 && noDangerOn4 && speedIncreased;
  console.log(`A3. Danger Wave:`);
  console.log(`    Wave 4 평균 HP=${dangerTest.w4.avgHp.toFixed(0)} speed=${dangerTest.w4.avgSpeed.toFixed(2)} (danger 플래그 ${dangerTest.w4.dangerCount}/${dangerTest.w4.N})`);
  console.log(`    Wave 5 평균 HP=${dangerTest.w5.avgHp.toFixed(0)} speed=${dangerTest.w5.avgSpeed.toFixed(2)} (danger 플래그 ${dangerTest.w5.dangerCount}/${dangerTest.w5.N}) ${a3pass ? '✅' : '❌'}`);

  // ===== UI 확인: 메인 메뉴 별점 진척도, 출석 배지 =====
  await page.evaluate(() => { Object.keys(localStorage).forEach(k => k.startsWith('neonDefense_') && localStorage.removeItem(k)); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // DailyLogin 자동 모달 닫기
  for (let i = 0; i < 3; i++) {
    const btn = page.locator('button:has-text("✕")').first();
    if (await btn.count() > 0) { await btn.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(200); } else break;
  }
  const uiCheck = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      hasAttendanceTab: body.includes('📅 출석'),
      hasStarsGrid: body.includes('스테이지 별 진척도'),
      hasStarsDisplay: /S[1-6]/.test(body) && /☆/.test(body),
    };
  });
  console.log(`UI: 출석탭=${uiCheck.hasAttendanceTab ? '✅' : '❌'} 별점그리드=${uiCheck.hasStarsGrid ? '✅' : '❌'} 별표시=${uiCheck.hasStarsDisplay ? '✅' : '❌'}`);

  console.log('\nErrors:', errors.length);
  errors.slice(0, 3).forEach(e => console.log(' ', e.slice(0, 120)));

  const pass = a1pass && a1record && a2pass && a3pass
             && uiCheck.hasAttendanceTab && uiCheck.hasStarsGrid && uiCheck.hasStarsDisplay
             && errors.length === 0;
  console.log('\nTIER A E2E:', pass ? 'PASS' : 'FAIL');
  await b.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
