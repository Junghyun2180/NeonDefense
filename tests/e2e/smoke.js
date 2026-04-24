// E2E smoke test: verify game loads, main menu renders, globals are initialized
// Run: node tests/e2e/smoke.js
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER_PATH = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_URL = process.env.BASE_URL || 'http://localhost:8765/index.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  const errors = [];
  const logs = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', (m) => {
    logs.push('[' + m.type() + '] ' + m.text());
    if (m.type() === 'error') errors.push('[console.error] ' + m.text());
  });
  page.on('requestfailed', (r) => errors.push('[requestfailed] ' + r.url() + ' — ' + r.failure().errorText));

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Debug: dump first few console logs
  if (process.env.DEBUG) {
    console.log('--- console logs ---');
    logs.slice(0, 20).forEach(l => console.log(l));
    console.log('--- errors ---');
    errors.forEach(e => console.log(e));
  }

  // 1) React 앱이 렌더링되었는지 확인
  await page.waitForSelector('#root *', { timeout: 10000 });

  // 2) 전역(lexical) 객체들이 로드되었는지 (AbilitySystem, TowerSystem, 등)
  //    classic script의 top-level const는 window에 안 붙으므로 raw reference로 확인
  const globals = await page.evaluate(() => {
    const check = (name) => {
      try { return typeof eval(name) !== 'undefined'; } catch { return false; }
    };
    const names = ['AbilitySystem', 'TowerSystem', 'EnemySystem', 'GameEngine',
      'StatusEffectSystem', 'useSettings', 'useInventory', 'RunMode', 'RUSH_SPAWN',
      'NEON_TYPES', 'ELEMENT_TYPES'];
    return names.map(n => ({ name: n, defined: check(n) }));
  });

  // 3) 메인 메뉴 버튼 텍스트 수집
  const mainMenuTexts = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 80);
  });

  console.log('=== SMOKE TEST RESULT ===');
  console.log('URL:', BASE_URL);
  console.log('Globals:', globals.filter(g => !g.defined).length === 0 ? 'ALL OK' : 'MISSING');
  globals.forEach(g => !g.defined && console.log('  MISSING:', g.name));
  console.log('Main menu buttons (top 10):');
  mainMenuTexts.slice(0, 10).forEach(t => console.log('  •', t));
  console.log('Errors:', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  ', e));

  await browser.close();

  const pass = errors.length === 0 && globals.every(g => g.defined);
  console.log('\nSMOKE:', pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
