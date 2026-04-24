// tileset.png (1254x1254, 2x2 grid) 분할 → assets/tiles/
// 레이아웃:
//   top-left: grass-tile (육각 그리드)
//   top-right: path-tile (네온 회로 경로)
//   bottom-left: start-point (녹색 포털)
//   bottom-right: end-point (빨간 포털 — 집/도착지)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const REGIONS = [
  { name: 'grass-tile',  quadrant: [0, 0], target: 128 },
  { name: 'path-tile',   quadrant: [1, 0], target: 128 },
  { name: 'start-point', quadrant: [0, 1], target: 160 },
  { name: 'end-point',   quadrant: [1, 1], target: 160 },
];

(async () => {
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'Saved', 'src', 'tileset.png');
  const meta = await sharp(src).metadata();
  const W = meta.width, H = meta.height;
  const halfW = Math.floor(W / 2);
  const halfH = Math.floor(H / 2);

  const outDir = path.join(root, 'assets', 'tiles');
  fs.mkdirSync(outDir, { recursive: true });

  for (const r of REGIONS) {
    const [qx, qy] = r.quadrant;
    const left = qx * halfW;
    const top = qy * halfH;
    const width = qx === 0 ? halfW : W - halfW;
    const height = qy === 0 ? halfH : H - halfH;
    const outPath = path.join(outDir, r.name + '.png');
    await sharp(src)
      .extract({ left, top, width, height })
      .resize(r.target, r.target, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ${r.name.padEnd(12)} src=(${left},${top}) ${width}x${height}  →  ${r.target}x${r.target}`);
  }
  console.log(`\nSaved to: ${outDir}`);
})();
