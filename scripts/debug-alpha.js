const sharp = require('sharp');
const path = require('path');

(async () => {
  for (const name of ['Light.png', 'Void.png']) {
    const src = path.resolve(__dirname, '..', 'Saved', 'src', name);
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    console.log(`--- ${name} ${info.width}x${info.height} channels=${info.channels} ---`);
    // 여러 지점 알파 샘플
    const pts = [
      [0, 0], [100, 100], [500, 500], [info.width - 1, info.height - 1],
      [info.width / 4 | 0, info.height / 4 | 0],
      [info.width / 2 | 0, info.height / 2 | 0],
      [10, info.height / 2 | 0],
      [info.width / 2 | 0, 10],
    ];
    for (const [x, y] of pts) {
      const idx = (y * info.width + x) * 4;
      console.log(`  (${x},${y}) rgba=${data[idx]},${data[idx+1]},${data[idx+2]},${data[idx+3]}`);
    }
    // 히스토그램 (알파)
    const hist = new Array(256).fill(0);
    for (let i = 3; i < data.length; i += 4) hist[data[i]]++;
    const total = info.width * info.height;
    console.log(`  Alpha=0: ${hist[0]} (${(hist[0]/total*100).toFixed(1)}%)`);
    console.log(`  Alpha<50: ${hist.slice(0,50).reduce((a,b)=>a+b,0)}`);
    console.log(`  Alpha>=200: ${hist.slice(200).reduce((a,b)=>a+b,0)}`);
    console.log(`  Alpha=255: ${hist[255]}`);
  }
})();
