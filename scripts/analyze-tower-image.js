// 4-tier 합본 이미지에서 채도/명도 기반 타워 영역 검출 + 연결 컴포넌트 분석
// (PNG에 실제 알파가 없고 배경이 흰색/체크보드로 칠해진 케이스용)
const sharp = require('sharp');
const path = require('path');

async function analyze(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const iw = info.width, ih = info.height;
  console.log(`Image: ${srcPath} (${iw}x${ih})`);

  // 타워 픽셀 판정: (min(RGB) < 200) OR (채도 > 0.15)
  // → 흰색/밝은 회색 배경은 제외, 색감 있는 타워 영역만 포함
  const opaque = new Uint8Array(iw * ih);
  let count = 0;
  for (let i = 0; i < iw * ih; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isDark = min < 180;
    const isSaturated = sat > 0.15;
    if (isDark || isSaturated) {
      opaque[i] = 1;
      count++;
    }
  }
  console.log(`Tower pixels: ${count} (${(count / (iw * ih) * 100).toFixed(1)}%)`);

  // 다운샘플 + morphological close (glow 이어지는 부분 무시하기 위해 opening 느낌)
  const scale = 4;
  const dw = Math.floor(iw / scale), dh = Math.floor(ih / scale);
  const down = new Uint8Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      let c = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          if (opaque[(y * scale + dy) * iw + (x * scale + dx)]) c++;
        }
      }
      // 80% 이상이 타워 픽셀일 때만 (erosion 효과 — glow 가장자리 컷)
      if (c >= scale * scale * 0.8) down[y * dw + x] = 1;
    }
  }

  // 연결 컴포넌트 (BFS)
  const visited = new Uint8Array(dw * dh);
  const components = [];
  const queue = new Int32Array(dw * dh);

  for (let sy = 0; sy < dh; sy++) {
    for (let sx = 0; sx < dw; sx++) {
      const si = sy * dw + sx;
      if (!down[si] || visited[si]) continue;
      let head = 0, tail = 0;
      queue[tail++] = si;
      visited[si] = 1;
      let minX = sx, maxX = sx, minY = sy, maxY = sy, pxCount = 0;
      while (head < tail) {
        const idx = queue[head++];
        const x = idx % dw, y = (idx - x) / dw;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        pxCount++;
        const neigh = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1], [x + 1, y + 1]];
        for (const [nx, ny] of neigh) {
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          const ni = ny * dw + nx;
          if (down[ni] && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; }
        }
      }
      if (pxCount >= 200) {
        components.push({
          minX: minX * scale, maxX: (maxX + 1) * scale,
          minY: minY * scale, maxY: (maxY + 1) * scale,
          cx: ((minX + maxX) / 2) * scale,
          cy: ((minY + maxY) / 2) * scale,
          count: pxCount * scale * scale,
        });
      }
    }
  }

  components.sort((a, b) => b.count - a.count);
  console.log(`Connected components: ${components.length}`);
  components.slice(0, 10).forEach((c, i) => {
    console.log(`  [${i}] bbox=(${c.minX},${c.minY})-(${c.maxX},${c.maxY}) w=${c.maxX - c.minX} h=${c.maxY - c.minY} center=(${Math.round(c.cx)},${Math.round(c.cy)}) pixels=${c.count}`);
  });

  return { W: iw, H: ih, components };
}

(async () => {
  await analyze(path.resolve(__dirname, '..', 'Saved', 'src', 'Light.png'));
  console.log('');
  await analyze(path.resolve(__dirname, '..', 'Saved', 'src', 'Void.png'));
})();
