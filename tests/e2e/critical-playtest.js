// 비판적 플레이테스트 — 실제 유저가 처음 접속해서 진행할 때 체감하는 것들 기록
// 각 단계마다 스크린샷 + DOM 상태 + 타이밍 측정

const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:8765/index.html';
const SS_DIR = '/tmp/playtest';

// 관찰 결과 수집
const findings = [];
function note(severity, category, title, detail) {
  findings.push({ severity, category, title, detail });
  console.log(`[${severity}] ${category} | ${title}${detail ? ': ' + detail : ''}`);
}

async function snap(page, name) {
  const p = path.join(SS_DIR, name + '.png');
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function countByText(page, texts) {
  return await page.evaluate((texts) => {
    const body = document.body.textContent;
    return texts.map(t => ({ text: t, found: body.includes(t) }));
  }, texts);
}

(async () => {
  console.log('=== NEON DEFENSE 비판적 플레이테스트 ===\n');
  const startTime = Date.now();

  const browser = await chromium.launch({
    executablePath: BROWSER,
    headless: true,
    args: ['--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const warnings = [];
  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push(m.text());
    if (m.type() === 'warning') warnings.push(m.text());
  });
  page.on('pageerror', e => consoleErrors.push('[pageerror] ' + e.message));

  // localStorage 초기화 (신규 유저 시뮬레이션)
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('neonDefense_')) localStorage.removeItem(k);
    });
  });
  await page.reload({ waitUntil: 'networkidle' });

  // ===== STEP 1: 첫 접속 — 무엇이 보이는가? =====
  console.log('\n--- STEP 1: 첫 접속 (신규 유저) ---');
  const t1 = Date.now();
  await page.waitForSelector('#root *', { timeout: 10000 });
  const firstPaintMs = Date.now() - t1;
  await page.waitForTimeout(1000);
  await snap(page, '01-first-paint');

  // 첫 화면에 도움말 모달이 자동으로 떴는지
  const helpModalOpen = await page.evaluate(() => {
    return document.body.textContent.includes('기본 조작') || document.body.textContent.includes('도움말');
  });
  if (!helpModalOpen) {
    note('🟡 MID', 'onboarding', '첫 접속에 도움말 자동 표시 안 됨', '처음 하는 유저가 게임 방법을 모를 수 있음');
  } else {
    note('🟢 OK', 'onboarding', '첫 접속 도움말 자동 표시됨', '');
  }
  if (firstPaintMs > 3000) {
    note('🔴 HIGH', 'perf', '초기 로딩 3초 초과', firstPaintMs + 'ms');
  }

  // ===== STEP 2: 도움말 내용 확인 =====
  console.log('\n--- STEP 2: 도움말 내용 확인 ---');
  const helpPages = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      hasGachaExplain: body.includes('뽑기') && body.includes('조합'),
      hasElementExplain: body.includes('화염') || body.includes('냉기'),
      hasPlaceExplain: body.includes('배치') || body.includes('타일'),
      hasCombineExplain: body.includes('3개') || body.includes('조합'),
    };
  });
  console.log('도움말 항목:', helpPages);
  if (!helpPages.hasPlaceExplain) note('🟡 MID', 'onboarding', '도움말에 배치 방법 설명 부족', '');
  if (!helpPages.hasElementExplain) note('🟡 MID', 'onboarding', '도움말에 속성 설명 부족', '');
  await snap(page, '02-help-modal');

  // 도움말 닫기 (ESC)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ===== STEP 3: 메인 메뉴 파악 =====
  console.log('\n--- STEP 3: 메인 메뉴 파악 ---');
  await snap(page, '03-main-menu');
  const mainMenuButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().slice(0, 80));
  });
  console.log('메인 메뉴 버튼 개수:', mainMenuButtons.length);
  console.log('주요 버튼:', mainMenuButtons.slice(0, 10));

  // 메인 탭에 너무 많은 항목인지
  const topTabs = ['🎮 시작', '💎 업그레이드', '🏆 순위', '🗂️ 도감'];
  const topTabsFound = mainMenuButtons.filter(b => topTabs.some(t => b.includes(t.slice(2))));
  console.log('최상단 탭:', topTabsFound.length, '개');

  // ===== STEP 4: 캠페인 시작 =====
  console.log('\n--- STEP 4: 캠페인 "새 게임" 시작 ---');
  // "🆕 새 게임 시작" 또는 "캠페인" 카드 클릭
  const newGameBtn = page.locator('button').filter({ hasText: /새 게임 시작/ }).first();
  if (await newGameBtn.count() === 0) {
    note('🔴 HIGH', 'flow', '새 게임 버튼 못 찾음', '진입 자체 불가');
  } else {
    await newGameBtn.click();
    await page.waitForTimeout(1500);
  }

  await snap(page, '04-campaign-game');
  const gameState = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      hasGold: /💰\s*\d+/.test(body),
      hasLives: /❤️\s*\d+/.test(body),
      hasWave: /Wave|🌊|웨이브/i.test(body),
      hasStage: /Stage|🏰|스테이지/i.test(body),
      hasInventoryPanel: body.includes('📦 타워') || body.includes('인벤토리'),
      hasDrawButton: body.includes('🎲'),
      hasStartButton: body.includes('▶ 시작') || body.includes('시작'),
    };
  });
  console.log('게임 화면 요소:', gameState);

  // ===== STEP 5: 뽑기 → 배치 → 웨이브 시작 (신규 유저 플로우) =====
  console.log('\n--- STEP 5: 신규 유저 행동 시뮬레이션 ---');

  // 5-1: 뽑기 x10 버튼 눌러보기
  const t5a = Date.now();
  const x10Btn = page.locator('button:has-text("🎲 x10")').first();
  if (await x10Btn.count() === 0) {
    note('🔴 HIGH', 'ux', '10연뽑 버튼 노출 안 됨', '속도감 개선 핵심 기능이 숨어있음');
  } else {
    await x10Btn.click();
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => {
      const goldMatch = document.body.textContent.match(/💰\s*(\d+)/);
      return { gold: goldMatch ? +goldMatch[1] : 0 };
    });
    console.log('10연뽑 후 골드:', after.gold);
  }
  await snap(page, '05a-after-draw10');

  // 5-2: 인벤토리 확인
  const invState = await page.evaluate(() => {
    const inventoryCounter = document.body.textContent.match(/타워\s*\((\d+)\/(\d+)\)/);
    return {
      count: inventoryCounter ? +inventoryCounter[1] : 0,
      max: inventoryCounter ? +inventoryCounter[2] : 0,
    };
  });
  console.log('인벤토리:', invState);
  if (invState.count === 0) {
    note('🟡 MID', 'flow', '10연뽑 후 인벤토리에 타워 없음', '골드 부족 또는 버튼 오동작 가능성');
  }

  // 5-3: 전체 조합 버튼 (disabled면 skip)
  const combineAllBtn = page.locator('button:has-text("🔄 전체")').first();
  if (await combineAllBtn.count() > 0) {
    const disabled = await combineAllBtn.isDisabled().catch(() => true);
    if (!disabled) await combineAllBtn.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(200);
  }

  // 5-4: 배치 시도 (맵의 빈 타일 클릭)
  const tileBounds = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.grass-tile'));
    if (tiles.length === 0) return null;
    const tile = tiles[Math.floor(tiles.length / 2)];
    const r = tile.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, totalTiles: tiles.length };
  });

  if (!tileBounds) {
    note('🔴 HIGH', 'ux', '배치 가능 타일 인식 못 함', 'grass-tile 클래스 누락 또는 맵 미렌더링');
  } else {
    console.log('배치 가능 타일:', tileBounds.totalTiles, '개');
    await page.mouse.click(tileBounds.x, tileBounds.y);
    await page.waitForTimeout(400);
    await snap(page, '05b-placement-menu');

    // 속성 선택 팝업 떴는지
    const hasPlacementUI = await page.evaluate(() => {
      // 방사형 팝업의 속성 버튼 (🔥❄️⚡🌪️🌀💎)
      const html = document.body.innerHTML;
      return html.includes('radial-gradient') || /fixed inset-0.*z-40/.test(html);
    });
    if (hasPlacementUI) {
      console.log('배치 모드 팝업 열림');
      // 임의 속성 버튼 클릭 시도 (첫 활성 속성)
      const elementDiv = page.locator('div[style*="radial-gradient"]').filter({ hasText: /[🔥❄️⚡🌪️🌀💎]/ }).first();
      if (await elementDiv.count() > 0) {
        await elementDiv.click().catch(() => {});
        await page.waitForTimeout(300);
        // 티어 선택
        const tierBtn = page.locator('div').filter({ hasText: /^T[1-4].*x\d+$/ }).first();
        if (await tierBtn.count() > 0) {
          await tierBtn.click().catch(() => {});
          await page.waitForTimeout(300);
        }
      }
    } else {
      note('🟡 MID', 'ux', '배치 팝업 즉시 안 뜸', '탭 시 반응 느림 또는 별도 액션 필요');
    }
  }

  await snap(page, '05c-tower-placed');

  // 5-5: 웨이브 시작
  const startBtn = page.locator('button:has-text("▶ 시작")').first();
  if (await startBtn.count() === 0) {
    note('🔴 HIGH', 'flow', '▶ 시작 버튼 못 찾음', '');
  } else {
    await startBtn.click();
    await page.waitForTimeout(1500);
    await snap(page, '05d-wave-started');
  }

  // ===== STEP 6: 웨이브 진행 중 관찰 =====
  console.log('\n--- STEP 6: 전투 관찰 ---');
  await page.waitForTimeout(3000);
  const midGameState = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      text: body.slice(0, 500),
      enemyCount: (body.match(/적 \d+/g) || []).length,
      isPlaying: body.includes('⏳ 전투 중'),
    };
  });
  await snap(page, '06-mid-battle');
  console.log('전투 중:', midGameState.isPlaying);

  // ===== STEP 7: 5x 배속 시험 =====
  console.log('\n--- STEP 7: 배속 변경 ---');
  const speed5Btn = page.locator('button:text-is("5x")').first();
  if (await speed5Btn.count() === 0) {
    note('🟡 MID', 'ux', '5x 배속 버튼 없음', '');
  } else {
    await speed5Btn.click();
    await page.waitForTimeout(500);
  }

  // ===== STEP 8: 자동화 옵션 노출 확인 =====
  console.log('\n--- STEP 8: 자동화 옵션 노출 ---');
  const autoLabels = await page.evaluate(() => {
    const body = document.body.textContent;
    return {
      autoCombine: body.includes('뽑기 후 자동 조합'),
      autoNext: body.includes('자동 다음 웨이브'),
      maxSpeed: body.includes('최대 배속'),
    };
  });
  console.log('자동화 옵션:', autoLabels);
  const missingAuto = Object.entries(autoLabels).filter(([, v]) => !v).map(([k]) => k);
  if (missingAuto.length > 0) {
    note('🟡 MID', 'ux', '자동화 옵션 일부 안 보임', missingAuto.join(','));
  }

  // ===== STEP 9: 웨이브 종료 대기 후 다음 웨이브 자동 진행 =====
  console.log('\n--- STEP 9: 자동 다음 웨이브 관찰 (최대 30초 대기) ---');
  const waitEnd = Date.now() + 30000;
  let waveProgressDetected = false;
  let lastWave = null;
  while (Date.now() < waitEnd) {
    const w = await page.evaluate(() => {
      const m = document.body.textContent.match(/🌊\s*(\d+)\/(\d+)/);
      return m ? +m[1] : null;
    });
    if (lastWave !== null && w !== null && w !== lastWave) {
      waveProgressDetected = true;
      console.log('웨이브 진행:', lastWave, '→', w);
      break;
    }
    lastWave = w;
    await page.waitForTimeout(1500);
  }
  if (!waveProgressDetected) {
    note('🟠 MID', 'balance', '30초 내 웨이브 진행 없음', '초반 난이도 또는 자동진행 안 됨');
  }
  await snap(page, '09-after-wait');

  // ===== STEP 10: 도감 접근성 검증 =====
  console.log('\n--- STEP 10: 도감 (게임 중엔 접근 불가?) ---');
  // 게임 중 도감 버튼 접근 여부
  const inGameCollectionBtn = await page.locator('button:has-text("🗂️")').count();
  if (inGameCollectionBtn === 0) {
    note('🟡 MID', 'feature', '게임 중 도감 접근 불가', '메인 메뉴로 나가야만 확인 가능');
  }

  // ===== STEP 11: 메인 메뉴로 돌아가기 =====
  console.log('\n--- STEP 11: 메인 메뉴 복귀 ---');
  const homeBtn = page.locator('button').filter({ hasText: /메인 메뉴|← 메인/ }).first();
  if (await homeBtn.count() === 0) {
    note('🔴 HIGH', 'flow', '메인 메뉴 복귀 버튼 없음', '');
  } else {
    await homeBtn.click();
    await page.waitForTimeout(600);
    // 확인 팝업이 뜨면 확인
    const confirmBtn = page.locator('button').filter({ hasText: /확인|네|예|OK/ }).first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(800);
    }
  }
  await snap(page, '11-back-to-menu');

  // ===== STEP 12: 도감 열어보기 =====
  console.log('\n--- STEP 12: 도감 열기 ---');
  const collectionBtn = page.locator('button:has-text("🗂️ 도감")').first();
  if (await collectionBtn.count() === 0) {
    note('🔴 HIGH', 'feature', '도감 버튼 메인 메뉴에 없음', '');
  } else {
    await collectionBtn.click();
    await page.waitForTimeout(600);
    await snap(page, '12-collection');
    const completion = await page.evaluate(() => {
      const m = document.body.textContent.match(/수집률\s*(\d+)\/(\d+)/);
      return m ? { unlocked: +m[1], total: +m[2] } : null;
    });
    if (completion) {
      console.log('도감 수집률:', completion);
      if (completion.unlocked === 0) {
        note('🟡 MID', 'feature', '게임 플레이 후 도감 수집률 0', '타워 생성 → 기록 연결 안 됨?');
      }
    }
  }

  // ===== STEP 13: Rush Mode 진입 =====
  console.log('\n--- STEP 13: 런 모드 → Rush Mode ---');
  // 도감 닫기
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
  await page.locator('button:has-text("✕")').first().click().catch(() => {});
  await page.waitForTimeout(300);

  const runBtn = page.locator('button:has-text("런 모드")').first();
  if (await runBtn.count() > 0) {
    await runBtn.click();
    await page.waitForTimeout(500);
    await snap(page, '13a-run-menu');
    const rushBtn = page.locator('button:has-text("Rush Mode")').first();
    if (await rushBtn.count() === 0) {
      note('🔴 HIGH', 'feature', 'Rush Mode 카드 노출 안 됨', '');
    } else {
      await rushBtn.click();
      await page.waitForTimeout(1500);
      await snap(page, '13b-rush-started');
    }
  }

  // ===== STEP 14: 성능/사운드 체크 =====
  console.log('\n--- STEP 14: 성능/사운드 ---');
  const audio = await page.evaluate(() => {
    return {
      audioContextCreated: !!window.AudioContext || !!window.webkitAudioContext,
      audioElements: document.querySelectorAll('audio').length,
      audioPlaying: Array.from(document.querySelectorAll('audio')).some(a => !a.paused),
    };
  });
  console.log('사운드 상태:', audio);
  if (audio.audioElements === 0) {
    note('🟠 MID', 'polish', '<audio> 요소 없음', 'BGM이 Web Audio API 합성이라 파일 재생 아님?');
  }

  // ===== 마무리 =====
  const totalMs = Date.now() - startTime;
  console.log(`\n=== 총 소요 ${(totalMs / 1000).toFixed(1)}초 ===`);

  if (consoleErrors.length > 0) {
    console.log('\n콘솔 에러:');
    consoleErrors.slice(0, 10).forEach(e => console.log('  ', e.slice(0, 150)));
    note('🔴 HIGH', 'bug', `콘솔 에러 ${consoleErrors.length}개`, consoleErrors[0].slice(0, 80));
  }

  // 최종 리포트
  console.log('\n\n========== 비판적 플레이테스트 결과 ==========');
  const bySeverity = { '🔴 HIGH': [], '🟠 MID': [], '🟡 MID': [], '🟢 OK': [] };
  findings.forEach(f => (bySeverity[f.severity] || []).push(f));
  for (const sev of Object.keys(bySeverity)) {
    const list = bySeverity[sev];
    if (list.length === 0) continue;
    console.log(`\n${sev} (${list.length}건)`);
    list.forEach(f => console.log(`  [${f.category}] ${f.title}${f.detail ? ' — ' + f.detail : ''}`));
  }

  fs.writeFileSync(path.join(SS_DIR, 'findings.json'), JSON.stringify(findings, null, 2));
  console.log('\n스크린샷 + findings.json:', SS_DIR);

  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
