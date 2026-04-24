// str-v를 str-h의 "수직 단면 평균"으로 재구성 → 세로 방향 완전 seamless
//
// 방법:
//   1. str-h를 폭 1px로 압축 → 각 y에서의 가로 평균 단면 (1×H)
//      이건 str-h의 "위아래 레일 구조" 요약
//   2. 90° 회전 → W×1 (한 행)
//   3. 세로로 H번 복제해서 W×H tile 생성
//   → 모든 행이 동일하므로 세로 타일링 시 완벽 seamless (접합선 없음)

const sharp = require('sharp');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STR_H = path.join(ROOT, 'assets', 'tiles', 'path', 'str-h.png');
const STR_V = path.join(ROOT, 'assets', 'tiles', 'path', 'str-v.png');

(async () => {
  const meta = await sharp(STR_H).metadata();
  const W = meta.width, H = meta.height;

  // 1. str-h를 폭 1px로 압축 → 1×H (각 y의 가로 평균 색)
  const crossSection = await sharp(STR_H)
    .resize(1, H, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  // crossSection: H 픽셀, 각 픽셀 4채널 (RGBA)

  // 2. 회전: 이 1×H 수직 스트립을 시각적으로 H×1 가로 스트립으로 변환
  //    (단일 행이 "str-v의 수평 단면"이 됨)
  //    구현: crossSection을 단순히 가로 방향으로 배치하면 됨
  //    각 x 위치에 crossSection[y=x] 픽셀 넣기
  const rowBuf = Buffer.alloc(H * 1 * 4); // 가로 H, 세로 1
  for (let x = 0; x < H; x++) {
    const srcIdx = x * 4; // crossSection[y=x]
    const dstIdx = x * 4;
    rowBuf[dstIdx    ] = crossSection[srcIdx];
    rowBuf[dstIdx + 1] = crossSection[srcIdx + 1];
    rowBuf[dstIdx + 2] = crossSection[srcIdx + 2];
    rowBuf[dstIdx + 3] = crossSection[srcIdx + 3];
  }

  // 3. 이 1×W 행을 H번 세로로 복제 → W×H tile (모든 행 동일)
  const fullBuf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    rowBuf.copy(fullBuf, y * W * 4, 0, W * 4);
  }

  await sharp(fullBuf, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(STR_V);

  console.log('✅ str-v rebuilt: vertical cross-section of str-h, tiled');
  console.log(`   (${W}×${H}, all rows identical → perfectly seamless vertical tiling)`);

  // 검증: 3개 스택
  const verifyBuf = await sharp(STR_V).raw().ensureAlpha().toBuffer();
  const out = Buffer.alloc(W * H * 3 * 4);
  for (let i = 0; i < 3; i++) verifyBuf.copy(out, i * W * H * 4, 0, W * H * 4);
  await sharp(out, { raw: { width: W, height: H * 3, channels: 4 } })
    .png()
    .toFile('/tmp/str-v-stacked-v3.png');
  console.log('검증 스택 이미지: /tmp/str-v-stacked-v3.png');
})().catch(e => { console.error(e); process.exit(1); });
