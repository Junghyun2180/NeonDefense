// tileset.png 상단 3패널 각각의 정확한 bbox를 연결 컴포넌트로 자동 검출
const sharp = require('sharp');
const path = require('path');

(async () => {
  const src = path.resolve(__dirname, '..', 'Saved', 'src', 'tileset.png');
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  console.log(`Size: ${W}x${H}`);

  // 상단 영역만 분석 (y=0~380)
  const TOP_Y = 380;
  // 비-검정 픽셀 (명도 >= 35) 을 "content"로 간주
  const opaque = new Uint8Array(W * H);
  let count = 0;
  for (let y = 0; y < TOP_Y; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const b = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (b >= 35) { opaque[y * W + x] = 1; count++; }
    }
  }
  console.log(`Opaque (b>=35) in top: ${count}`);

  // 다운샘플 + 팽창(morphological closing 느낌)
  const scale = 4;
  const dw = Math.floor(W / scale), dh = Math.floor(TOP_Y / scale);
  const down = new Uint8Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      let c = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          if (opaque[(y * scale + dy) * W + (x * scale + dx)]) c++;
        }
      }
      if (c >= 1) down[y * dw + x] = 1; // 느슨하게 (dilation)
    }
  }

  // 팽창 (3회) — 인접 픽셀 연결
  for (let iter = 0; iter < 3; iter++) {
    const next = new Uint8Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        if (down[y * dw + x]) { next[y * dw + x] = 1; continue; }
        let hasN = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
            if (down[ny * dw + nx]) { hasN = true; break; }
          }
          if (hasN) break;
        }
        if (hasN) next[y * dw + x] = 1;
      }
    }
    down.set(next);
  }

  // 연결 컴포넌트
  const visited = new Uint8Array(dw * dh);
  const components = [];
  const queue = new Int32Array(dw * dh);
  for (let sy = 0; sy < dh; sy++) {
    for (let sx = 0; sx < dw; sx++) {
      const si = sy * dw + sx;
      if (!down[si] || visited[si]) continue;
      let head = 0, tail = 0;
      queue[tail++] = si; visited[si] = 1;
      let minX = sx, maxX = sx, minY = sy, maxY = sy, px = 0;
      while (head < tail) {
        const idx = queue[head++];
        const x = idx % dw, y = (idx - x) / dw;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        px++;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
            const ni = ny * dw + nx;
            if (down[ni] && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; }
          }
        }
      }
      if (px >= 300) {
        components.push({
          minX: minX * scale, maxX: (maxX + 1) * scale,
          minY: minY * scale, maxY: (maxY + 1) * scale,
          cx: ((minX + maxX) / 2) * scale,
          cy: ((minY + maxY) / 2) * scale,
          w: (maxX - minX + 1) * scale,
          h: (maxY - minY + 1) * scale,
          px: px * scale * scale,
        });
      }
    }
  }

  components.sort((a, b) => a.cx - b.cx);
  console.log(`Components (sorted by x): ${components.length}`);
  components.forEach((c, i) => {
    console.log(`  [${i}] bbox=(${c.minX},${c.minY})-(${c.maxX},${c.maxY}) size=${c.w}x${c.h} center=(${Math.round(c.cx)},${Math.round(c.cy)}) px=${c.px}`);
  });
})();
