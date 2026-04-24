// 실제 렌더된 path 타일의 분포를 확인
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 캠페인 → 스테이지 1-1
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => /캠페인/.test(b.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(b => /^1\s*-\s*1|1-1/.test(b.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(2000);

  // 튜토리얼 닫기
  for (let i = 0; i < 6; i++) {
    const closed = await page.evaluate(() => {
      let c = 0;
      document.querySelectorAll('button, a').forEach(b => {
        if (/튜토리얼\s*건너뛰기|건너뛰기|Skip|×|✕/.test(b.textContent || '')) { b.click(); c++; }
      });
      return c;
    });
    if (!closed) break;
    await page.waitForTimeout(300);
  }

  // 모든 path 타일의 x,y와 클래스를 출력
  const tiles = await page.evaluate(() => {
    const arr = [];
    document.querySelectorAll('.tile-path').forEach(el => {
      const cls = [...el.classList].filter(c => c.startsWith('cor-') || c.startsWith('t-') || c === 'str-h' || c === 'str-v' || c === 'cross');
      const style = el.style.left + ',' + el.style.top;
      arr.push({ style, cls: cls.join(' ') });
    });
    return arr;
  });

  // x, y 좌표로 grid 복원
  const TILE = 40;
  const gridTiles = new Map();
  tiles.forEach(t => {
    const m = t.style.match(/(\d+)px,(\d+)px/);
    if (!m) return;
    const x = parseInt(m[1]) / TILE;
    const y = parseInt(m[2]) / TILE;
    gridTiles.set(`${x},${y}`, t.cls);
  });

  // 16x12 grid 출력
  console.log('Grid view (path tiles only):');
  for (let y = 0; y < 12; y++) {
    let line = '';
    for (let x = 0; x < 16; x++) {
      const cls = gridTiles.get(`${x},${y}`);
      if (!cls) { line += '  . '; continue; }
      const sym = {
        'str-h': ' ─ ', 'str-v': ' │ ', 'cross': ' ┼ ',
        'cor-ne': ' ┗ ', 'cor-nw': ' ┛ ', 'cor-se': ' ┏ ', 'cor-sw': ' ┓ ',
        't-n': ' ┻ ', 't-s': ' ┳ ', 't-e': ' ┣ ', 't-w': ' ┫ ',
      }[cls] || ' ? ';
      line += sym;
    }
    console.log(line);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
