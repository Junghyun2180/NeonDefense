// 신규 모듈러 타일 적용 후 맵 렌더링 확인
// - 게임 시작 → 맵 보이는 상태로 진입 → 타일 DOM 검사 + 스크린샷
// Run: BASE_URL=http://localhost:3000/index.html node tests/e2e/verify-tiles.js
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/index.html';
const OUT_DIR = path.join(__dirname, '..', '..', 'tests', 'screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('requestfailed', (r) => errors.push('[requestfailed] ' + r.url() + ' — ' + r.failure().errorText));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('[console.error] ' + m.text());
  });

  console.log('→ Loading', BASE_URL);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // 메인 메뉴에서 "캠페인" 또는 "게임 시작" 버튼 클릭
  // 실제 DOM을 살펴 캠페인 진입 버튼을 찾기
  await page.waitForTimeout(1500);

  // 메뉴 스크린샷
  await page.screenshot({ path: path.join(OUT_DIR, 'tiles-00-menu.png') });

  // "캠페인" 또는 유사 텍스트 버튼 찾기
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => /캠페인|게임\s*시작|Campaign|Start/i.test(b.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: path.join(OUT_DIR, 'tiles-01-after-click.png') });

  // 스테이지 선택 화면이라면 1-1 클릭
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // 스테이지 버튼: "1-1", "Stage 1", 등
    const b = btns.find(bn => /^1\s*-\s*1|스테이지\s*1|Stage\s*1/i.test(bn.textContent) && !/모드|Mode/i.test(bn.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(2000);

  // 튜토리얼/도움말 모달 닫기 (여러 번 시도)
  for (let attempt = 0; attempt < 5; attempt++) {
    const closed = await page.evaluate(() => {
      const clicked = [];
      // 1. 튜토리얼 스킵 버튼
      document.querySelectorAll('button, a').forEach(b => {
        const t = b.textContent || '';
        if (/튜토리얼\s*건너뛰기|건너뛰기|Skip|닫기|×|✕/.test(t)) {
          b.click(); clicked.push(t.trim());
        }
      });
      // 2. 상단 우측 X 닫기 (SVG 또는 텍스트)
      const closeBtns = document.querySelectorAll('[aria-label*="close" i], button[class*="close" i]');
      closeBtns.forEach(b => { b.click(); clicked.push('aria-close'); });
      return clicked;
    });
    if (closed.length === 0) break;
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, 'tiles-02b-stage-clean.png') });

  // 맵이 렌더링 됐는지 확인: .tile-path, .tile-grass 클래스 있는지
  const tileCounts = await page.evaluate(() => {
    const counts = {};
    const classes = ['tile-grass', 'tile-path', 'tile-start', 'tile-end',
                     'str-h', 'str-v', 'cross', 'cor-ne', 'cor-nw', 'cor-se', 'cor-sw',
                     't-n', 't-s', 't-e', 't-w'];
    classes.forEach(c => { counts[c] = document.querySelectorAll('.' + c).length; });
    return counts;
  });

  console.log('\n=== 타일 DOM 카운트 ===');
  console.log(JSON.stringify(tileCounts, null, 2));

  // 타일 이미지 로드 확인 (네트워크 레벨)
  const imageStatus = await page.evaluate(async () => {
    const urls = [
      '/assets/tiles/path/grass.png',
      '/assets/tiles/path/str-h.png',
      '/assets/tiles/path/str-v.png',
      '/assets/tiles/path/cross.png',
      '/assets/tiles/path/cor-ne.png',
      '/assets/tiles/path/t-n.png',
      '/assets/tiles/points/start.png',
      '/assets/tiles/points/end.png',
    ];
    const results = {};
    for (const u of urls) {
      try {
        const r = await fetch(u, { method: 'HEAD' });
        results[u] = r.status;
      } catch (e) {
        results[u] = 'ERR: ' + e.message;
      }
    }
    return results;
  });

  console.log('\n=== 타일 이미지 HTTP 상태 ===');
  console.log(JSON.stringify(imageStatus, null, 2));

  // 맵 영역만 잘라서 스크린샷 (가장 많은 tile-*를 포함하는 직계 조상)
  const mapBox = await page.evaluate(() => {
    const anyTile = document.querySelector('.tile-grass, .tile-path');
    if (!anyTile) return null;
    // 공통 조상: 16*12 = 192 타일을 포함하는 가장 작은 조상
    let el = anyTile.parentElement;
    while (el && el.querySelectorAll('.tile-grass, .tile-path').length < 50) el = el.parentElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  if (mapBox) {
    await page.screenshot({
      path: path.join(OUT_DIR, 'tiles-03-map-closeup.png'),
      clip: { x: Math.max(0, mapBox.x), y: Math.max(0, mapBox.y),
              width: Math.min(mapBox.width, 1280 - mapBox.x),
              height: Math.min(mapBox.height, 900 - mapBox.y) },
    });
    console.log('→ map closeup saved:', JSON.stringify(mapBox));
  }

  if (errors.length) {
    console.log('\n⚠️ 에러 (' + errors.length + '건):');
    errors.slice(0, 10).forEach(e => console.log('  ' + e));
  } else {
    console.log('\n✅ 에러 없음');
  }

  await browser.close();
  console.log('\n스크린샷 →', OUT_DIR);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
