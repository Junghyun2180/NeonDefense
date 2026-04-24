// icons.png (3x6 grid, 18개) 분할
// Row 1: 투사체 orb (fire, water, electric, wind, void, light)
// Row 2: 적 디버프 (burn, slow, freeze, stun, vulnerability, knockback)
// Row 3: 적 버프 + 타워 버프/디버프 (pull, regeneration, attackBuff, attackSpeedBuff, damageDebuff, attackSpeedDebuff)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// analyze 결과: row 1, 2 cx = [~250, 440, 636, 824, 1020, 1220], cy row1≈235, row2≈472, row3≈716
// 셀 크기 ~190x220 으로 추출 후 정사각 패딩/리사이즈
const COL_CX = [252, 440, 636, 824, 1020, 1220];
const ROW_CY = [234, 472, 716];
const CELL_SIZE = 180; // 정사각 셀 크기 (이웃 아이콘 엣지 침범 방지)

const LABELS = [
  // Row 1 — projectile orbs
  ['fire', 'water', 'electric', 'wind', 'void', 'light'],
  // Row 2 — enemy debuffs
  ['burn', 'slow', 'freeze', 'stun', 'vulnerability', 'knockback'],
  // Row 3 — pull, regen, (skipped yellow-plus), attackBuff, attackSpeedBuff, attackSpeedDebuff
  // 주의: AI가 col 3에 "AttackUp (orange sword)" 대신 금색 + 를 생성해 시각적 어긋남 발생
  // col 3 은 저장하지 않고 스킵 (null)
  ['pull', 'regeneration', null, 'attackBuff', 'attackSpeedBuff', 'attackSpeedDebuff'],
];

const TARGET = 128;

async function saveIcon(src, left, top, size, outPath) {
  const meta = await sharp(src).metadata();
  const safeLeft = Math.max(0, Math.min(meta.width - size, left));
  const safeTop = Math.max(0, Math.min(meta.height - size, top));
  await sharp(src)
    .extract({ left: safeLeft, top: safeTop, width: size, height: size })
    .resize(TARGET, TARGET, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'Saved', 'src', 'icons.png');

  const elemDir = path.join(root, 'assets', 'icons', 'elements');
  const statusDir = path.join(root, 'assets', 'icons', 'status');
  fs.mkdirSync(elemDir, { recursive: true });
  fs.mkdirSync(statusDir, { recursive: true });

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const name = LABELS[r][c];
      if (!name) { console.log(`  row=${r + 1} col=${c + 1}  [skip]`); continue; }
      const cx = COL_CX[c], cy = ROW_CY[r];
      const left = Math.round(cx - CELL_SIZE / 2);
      const top = Math.round(cy - CELL_SIZE / 2);
      const outDir = r === 0 ? elemDir : statusDir;
      const outPath = path.join(outDir, name + '.png');
      await saveIcon(src, left, top, CELL_SIZE, outPath);
      console.log(`  row=${r + 1} col=${c + 1}  ${name.padEnd(18)} → ${path.relative(root, outPath)}`);
    }
  }
})();
