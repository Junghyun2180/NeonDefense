// W1 UX (10연뽑 오버레이 / 인벤토리 필터) + 웨이브 테마 (배너 / 헤더 태그) e2e 검증
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const BROWSER = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = process.env.BASE_URL || 'http://localhost:3000/';
const OUT = '/tmp/w1-theme-shots';
fs.mkdirSync(OUT, { recursive: true });

async function clickByText(page, ...patterns) {
    return await page.evaluate((preds) => {
        const els = Array.from(document.querySelectorAll('button'));
        for (const el of els) {
            const t = (el.textContent || '').trim();
            if (!el.disabled && el.offsetParent !== null) {
                for (const p of preds) if (t.includes(p)) { el.click(); return t; }
            }
        }
        return null;
    }, patterns);
}

async function cheat(page, cmd) {
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(120);
    await page.keyboard.type(cmd, { delay: 8 });
    await page.waitForTimeout(80);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
    await page.keyboard.press('Backquote');
    await page.waitForTimeout(120);
}

(async () => {
    const browser = await chromium.launch({ executablePath: BROWSER, headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') {
        const t = m.text();
        if (!/CERT_AUTHORITY_INVALID|404 \(Not Found\)/.test(t)) errors.push('CONSOLE ' + t);
    }});

    const log = (m) => console.log('[STEP] ' + m);
    const shot = async (name) => { await page.screenshot({ path: path.join(OUT, name + '.png') }); console.log('  shot:', name); };

    log('1) 페이지 로드');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await shot('01-main');

    log('2) 캠페인 → 시작');
    let clicked = await clickByText(page, '🏰 캠페인', '캠페인');
    log('   clicked: ' + clicked);
    await page.waitForTimeout(800);
    clicked = await clickByText(page, '🏯', 'F1', 'NEW', '도전');
    log('   floor select: ' + clicked);
    await page.waitForTimeout(800);
    clicked = await clickByText(page, '🎮 시작', '시작');
    log('   start clicked: ' + clicked);
    await page.waitForTimeout(1500);
    await shot('02-stage1-w1');

    log('3) 치트로 골드 추가, 10연뽑 시도');
    await cheat(page, 'gold 5000');
    await page.waitForTimeout(300);
    // 10연뽑 버튼 찾기
    const tenPullText = await clickByText(page, '🎲 x10', 'x10');
    log('   10pull clicked: ' + tenPullText);
    await page.waitForTimeout(400);
    await shot('03-tenpull-overlay');
    // 결과 오버레이 노출 확인
    const overlayShown = await page.evaluate(() => {
        const el = document.querySelector('.draw-result-overlay');
        return el ? { visible: !!el.offsetParent, html: el.innerText.slice(0, 200) } : null;
    });
    log('   overlay: ' + JSON.stringify(overlayShown));

    log('4) 필터 칩 클릭 (화염)');
    await page.waitForTimeout(2700); // 오버레이 자동 닫힘 대기
    // 화염 필터 (🔥 아이콘)
    const filterClicked = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const b of btns) {
            const t = (b.textContent || '').trim();
            // 🔥만 들어있는 작은 필터 칩
            if (t === '🔥' || t === '🔥 ') { b.click(); return true; }
        }
        return false;
    });
    log('   fire-filter clicked: ' + filterClicked);
    await page.waitForTimeout(400);
    await shot('04-filter-fire');

    log('5) 정렬 토글 (티어↓ → 속성 묶음 → 조합 가능)');
    let sortLabel = await clickByText(page, '티어 ↓', '티어');
    log('   sort1: ' + sortLabel);
    await page.waitForTimeout(300);
    sortLabel = await clickByText(page, '속성 묶음');
    log('   sort2: ' + sortLabel);
    await page.waitForTimeout(300);
    await shot('05-sort-combinable');

    // 필터 해제
    await clickByText(page, '전체');
    await page.waitForTimeout(300);

    log('6) 치트로 Stage 2 진입 (테마 시작 전)');
    await cheat(page, 'stage 2');
    await page.waitForTimeout(800);
    await shot('06-stage2-w1');
    let waveLabel = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('span'))
            .find(s => /^\d+\/10$/.test((s.textContent || '').trim()));
        return el ? el.textContent.trim() : null;
    });
    log('   wave label: ' + waveLabel);

    log('7) 치트 cw로 W3 도달 (fast_swarm 테마 시작 웨이브)');
    // W2까지 cw 1번, W3까지 cw 2번
    await cheat(page, 'cw');
    await page.waitForTimeout(600);
    await cheat(page, 'cw');
    await page.waitForTimeout(600);
    // 시작 누르고 배너 확인
    await clickByText(page, '▶ 시작', '시작');
    await page.waitForTimeout(800);
    await shot('07-stage2-w3-banner');
    const themeBanner = await page.evaluate(() => {
        // WaveThemeBanner: position fixed, top 30%
        const all = Array.from(document.querySelectorAll('div'));
        for (const d of all) {
            const t = (d.textContent || '');
            if (t.includes('WAVE THEME') && t.includes('고속 군단')) {
                return { found: true, text: t.slice(0, 200) };
            }
        }
        return { found: false };
    });
    log('   theme banner: ' + JSON.stringify(themeBanner));

    log('8) GameHeader 테마 태그 확인');
    const headerTag = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('span'));
        for (const s of all) {
            const t = (s.textContent || '').trim();
            if (t === '고속 군단' || t === '엘리트 강습' || t === '교란 부대' || t === '중장갑') {
                return { found: true, text: t };
            }
        }
        return { found: false };
    });
    log('   header tag: ' + JSON.stringify(headerTag));

    log('9) Stage 3으로 점프 → 테마 강도 비교');
    await cheat(page, 'stage 3');
    await page.waitForTimeout(800);
    await cheat(page, 'cw'); // W2
    await page.waitForTimeout(500);
    await clickByText(page, '▶ 시작', '시작');
    await page.waitForTimeout(800);
    await shot('09-stage3-w2-banner');

    log('=== ERRORS ===');
    if (errors.length === 0) console.log('NONE');
    else for (const e of errors) console.log(' - ' + e);

    await browser.close();
    process.exit(errors.filter(e => e.startsWith('PAGEERROR')).length > 0 ? 1 : 0);
})().catch(e => { console.error('FAIL:', e.message); process.exit(2); });
