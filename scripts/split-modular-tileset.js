// 신규 4x3 모듈러 tileset.png + 1x2 points.png 를 14장 타일로 분할
// 각 셀의 4변 중앙 밝기를 측정해 연결 방향(UDLR) 4비트 마스크로 자동 식별,
// 이를 바탕으로 grass/str-h/str-v/cross/cor-*/t-* 파일명을 자동 결정.
//
// 출력:
//   assets/tiles/path/grass.png, str-h.png, str-v.png, cross.png,
//                    cor-ne.png, cor-nw.png, cor-se.png, cor-sw.png,
//                    t-n.png, t-s.png, t-e.png, t-w.png
//   assets/tiles/points/start.png, end.png

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const TILESET = path.join(ROOT, 'Saved', 'src', 'tileset.png');
const POINTS = path.join(ROOT, 'Saved', 'src', 'points.png');
const OUT_PATH_DIR = path.join(ROOT, 'assets', 'tiles', 'path');
const OUT_POINTS_DIR = path.join(ROOT, 'assets', 'tiles', 'points');

const TARGET_SIZE = 160; // 40px × 4배 — 고해상도 소스로 보관
const BRIGHTNESS_THRESHOLD = 60; // 평균 > 60 이면 "연결됨"으로 판정

// UDLR 4비트 마스크 → 파일명
const MASK_TO_NAME = {
  0b0000: 'grass',       // 연결 없음 (또는 grass로 취급, 안쓰임)
  0b0011: 'str-h',        // L+R
  0b1100: 'str-v',        // U+D
  0b1111: 'cross',        // 모두
  0b1001: 'cor-ne',       // U+R   ┗
  0b1010: 'cor-nw',       // U+L   ┛
  0b0101: 'cor-se',       // D+R   ┏
  0b0110: 'cor-sw',       // D+L   ┓
  0b1011: 't-n',          // U+L+R (아래 막힘) ┻
  0b0111: 't-s',          // D+L+R (위 막힘) ┳
  0b1101: 't-e',          // U+D+R (좌 막힘) ┣
  0b1110: 't-w',          // U+D+L (우 막힘) ┫
};

function maskLabel(mask) {
  const dirs = [];
  if (mask & 0b1000) dirs.push('U');
  if (mask & 0b0100) dirs.push('D');
  if (mask & 0b0010) dirs.push('L');
  if (mask & 0b0001) dirs.push('R');
  return dirs.join('') || 'none';
}

// 픽셀 버퍼에서 특정 (x,y) 영역의 평균 밝기 계산
function avgBrightness(data, W, x0, y0, w, h) {
  let sum = 0, n = 0;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (y * W + x) * 4;
      // RGB 최대값 사용 (네온 글로우는 채도 높은 특정 채널이 강함)
      const b = Math.max(data[i], data[i + 1], data[i + 2]);
      sum += b;
      n++;
    }
  }
  return sum / n;
}

// 셀 내부 엣지 중앙 30% 영역의 밝기로 연결 여부 판정
function detectMask(data, W, cellX, cellY, cellW, cellH) {
  const stripW = Math.floor(cellW * 0.30);
  const stripH = Math.floor(cellH * 0.30);
  const edgeT = Math.max(2, Math.floor(cellH * 0.04));  // 엣지에서 살짝 안쪽을 샘플
  const mx = cellX + Math.floor((cellW - stripW) / 2);
  const my = cellY + Math.floor((cellH - stripH) / 2);

  const up    = avgBrightness(data, W, mx, cellY + edgeT,                stripW, edgeT);
  const down  = avgBrightness(data, W, mx, cellY + cellH - edgeT * 2,    stripW, edgeT);
  const left  = avgBrightness(data, W, cellX + edgeT,              my,   edgeT, stripH);
  const right = avgBrightness(data, W, cellX + cellW - edgeT * 2,  my,   edgeT, stripH);

  const t = BRIGHTNESS_THRESHOLD;
  let mask = 0;
  if (up    > t) mask |= 0b1000;
  if (down  > t) mask |= 0b0100;
  if (left  > t) mask |= 0b0010;
  if (right > t) mask |= 0b0001;
  return { mask, brightness: { up, down, left, right } };
}

async function splitTileset() {
  fs.mkdirSync(OUT_PATH_DIR, { recursive: true });

  const meta = await sharp(TILESET).metadata();
  const W = meta.width, H = meta.height;
  const COLS = 4, ROWS = 3;
  const cellW = Math.floor(W / COLS);
  const cellH = Math.floor(H / ROWS);

  console.log(`Tileset: ${W}x${H}, cell: ${cellW}x${cellH}`);

  const { data } = await sharp(TILESET).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const used = new Set();
  const report = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * cellW;
      const cy = row * cellH;
      const { mask, brightness } = detectMask(data, W, cx, cy, cellW, cellH);
      let name = MASK_TO_NAME[mask];

      // Row 1 첫 셀은 grass로 강제 (mask 0인 grass 타일)
      if (row === 0 && col === 0) name = 'grass';
      if (!name) name = `unknown-${row}-${col}-m${mask.toString(2).padStart(4, '0')}`;

      // 중복 방지 (예외 케이스)
      if (used.has(name)) name = name + `-dup-${row}-${col}`;
      used.add(name);

      const b = brightness;
      report.push({
        row, col, mask: mask.toString(2).padStart(4, '0'),
        dirs: maskLabel(mask), name,
        U: b.up.toFixed(0), D: b.down.toFixed(0), L: b.left.toFixed(0), R: b.right.toFixed(0),
      });

      const outPath = path.join(OUT_PATH_DIR, `${name}.png`);
      await sharp(TILESET)
        .extract({ left: cx, top: cy, width: cellW, height: cellH })
        .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill', kernel: 'lanczos3' })
        .png({ compressionLevel: 9 })
        .toFile(outPath);
    }
  }

  console.log('\n=== 타일셋 분석 ===');
  console.table(report);
  console.log('출력 →', OUT_PATH_DIR);
  return report;
}

async function splitPoints() {
  fs.mkdirSync(OUT_POINTS_DIR, { recursive: true });

  const meta = await sharp(POINTS).metadata();
  const W = meta.width, H = meta.height;
  const halfW = Math.floor(W / 2);

  console.log(`\nPoints: ${W}x${H}, half: ${halfW}`);

  // 좌측 = start, 우측 = end
  const regions = [
    { name: 'start', left: 0,      width: halfW },
    { name: 'end',   left: halfW,  width: W - halfW },
  ];

  // 중앙 정사각형 크롭 (세로=H 고정, 가로=H로 맞춤)
  for (const r of regions) {
    const squareSize = Math.min(r.width, H);
    const cropLeft = r.left + Math.floor((r.width - squareSize) / 2);
    const cropTop = Math.floor((H - squareSize) / 2);

    const outPath = path.join(OUT_POINTS_DIR, `${r.name}.png`);
    await sharp(POINTS)
      .extract({ left: cropLeft, top: cropTop, width: squareSize, height: squareSize })
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill', kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ${r.name}: crop ${cropLeft},${cropTop} ${squareSize}x${squareSize} → ${TARGET_SIZE}x${TARGET_SIZE}`);
  }

  console.log('출력 →', OUT_POINTS_DIR);
}

(async () => {
  await splitTileset();
  await splitPoints();
  console.log('\n✅ 분할 완료');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
