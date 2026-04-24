// points.png의 체커보드 배경을 실제 알파 0으로 변환
// (AI 이미지 모델이 "transparent bg" 프롬프트를 체커보드 패턴으로 오해한 것 복구)
//
// 알고리즘:
//   - 픽셀이 (채도 낮음) & (밝기 중상) 이면 → 체커보드 픽셀로 판정, alpha=0
//   - 원본 이미지 Saved/src/points.png 를 다시 읽어 처리 후
//     assets/tiles/points/{start,end}.png 로 저장 (방식: 좌/우 2분할 → 정사각 크롭 → 160×160)

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'Saved', 'src', 'points.png');
const OUT = path.join(ROOT, 'assets', 'tiles', 'points');
const TARGET_SIZE = 160;

// 체커보드 판정 임계값
const SAT_THRESHOLD = 0.15;  // 채도 낮음 기준
const BRIGHT_MIN = 120;      // 밝기 이 이상이면 체커보드 후보
const CORE_RADIUS = 0.35;    // 이 반경 안쪽은 절대 투명화하지 않음 (포털 코어 보호)

// RGB → 채도/밝기
function saturationBrightness(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const s = max === 0 ? 0 : (max - min) / max;
  return { s, v: max };
}

async function processHalf(leftX, width, height, name) {
  // 1단계: 원본 절반 크롭 → raw buffer
  const { data: rawData, info } = await sharp(SRC)
    .extract({ left: leftX, top: 0, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height;
  const buf = Buffer.from(rawData);

  // 이미지 중심 기준 정규화 거리 계산용
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(cx, cy);

  let transparentCount = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];

      // 중심에서 거리 (0~1)
      const dx = (x - cx) / maxR;
      const dy = (y - cy) / maxR;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 코어 영역 보호
      if (dist < CORE_RADIUS) continue;

      const { s, v } = saturationBrightness(r, g, b);
      // 체커보드: 밝고 채도 낮음 (흰색~회색 범위)
      if (v >= BRIGHT_MIN && s <= SAT_THRESHOLD) {
        buf[i + 3] = 0;
        transparentCount++;
      }
    }
  }

  console.log(`  ${name}: ${transparentCount} px → transparent (of ${W*H} total, ${(transparentCount/(W*H)*100).toFixed(1)}%)`);

  // 정사각 크롭 (세로=H 고정, 가로도 H로 맞춤 — 중앙)
  const squareSize = Math.min(W, H);
  const cropL = Math.floor((W - squareSize) / 2);
  const cropT = Math.floor((H - squareSize) / 2);

  const squareBuf = Buffer.alloc(squareSize * squareSize * 4);
  for (let y = 0; y < squareSize; y++) {
    for (let x = 0; x < squareSize; x++) {
      const srcIdx = ((y + cropT) * W + (x + cropL)) * 4;
      const dstIdx = (y * squareSize + x) * 4;
      squareBuf[dstIdx    ] = buf[srcIdx    ];
      squareBuf[dstIdx + 1] = buf[srcIdx + 1];
      squareBuf[dstIdx + 2] = buf[srcIdx + 2];
      squareBuf[dstIdx + 3] = buf[srcIdx + 3];
    }
  }

  const outPath = path.join(OUT, name + '.png');
  await sharp(squareBuf, { raw: { width: squareSize, height: squareSize, channels: 4 } })
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'fill', kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  return outPath;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const meta = await sharp(SRC).metadata();
  const W = meta.width, H = meta.height;
  const halfW = Math.floor(W / 2);

  console.log(`Source: ${W}x${H}`);
  console.log('\n체커보드 → 투명 변환:');
  const startPath = await processHalf(0, halfW, H, 'start');
  const endPath = await processHalf(halfW, W - halfW, H, 'end');

  // 4코너 알파 확인
  console.log('\n=== 결과 검증 (4코너 알파) ===');
  for (const p of [startPath, endPath]) {
    const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const a = (x, y) => data[(y * W + x) * 4 + 3];
    console.log(`  ${path.basename(p)}: [${a(0,0)}, ${a(W-1,0)}, ${a(0,H-1)}, ${a(W-1,H-1)}] (0=투명, 255=불투명)`);
  }
  console.log('\n✅ 완료');
})().catch(e => { console.error(e); process.exit(1); });
