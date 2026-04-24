// Icons.png의 상/하 2행 아이콘 bbox 검출
const sharp = require('sharp');
const path = require('path');

(async () => {
  const src = path.resolve(__dirname, '..', 'Saved', 'src', 'Icons.png');
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  console.log(`Size: ${W}x${H}`);

  // 높은 알파 임계값 (solid 영역만) — glow로 인한 이웃 아이콘 연결 방지
  const opaque = new Uint8Array(W * H);
  let count = 0;
  for (let i = 0; i < W * H; i++) {
    if (data[i * 4 + 3] >= 200) { opaque[i] = 1; count++; }
  }
  console.log(`Opaque pixels (alpha>=200): ${count}`);

  // 다운샘플 + 팽창
  const scale = 4;
  const dw = Math.floor(W / scale), dh = Math.floor(H / scale);
  const down = new Uint8Array(dw * dh);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      let c = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          if (opaque[(y * scale + dy) * W + (x * scale + dx)]) c++;
        }
      }
      if (c >= 2) down[y * dw + x] = 1;
    }
  }
  // 팽창 0회 (이웃 아이콘 연결 방지)
  for (let iter = 0; iter < 0; iter++) {
    const next = new Uint8Array(dw * dh);
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        if (down[y * dw + x]) { next[y * dw + x] = 1; continue; }
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          if (down[ny * dw + nx]) { n = 1; break; }
        }
        if (n) next[y * dw + x] = 1;
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
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= dw || ny >= dh) continue;
          const ni = ny * dw + nx;
          if (down[ni] && !visited[ni]) { visited[ni] = 1; queue[tail++] = ni; }
        }
      }
      if (px >= 100) {
        components.push({
          minX: minX * scale, maxX: (maxX + 1) * scale,
          minY: minY * scale, maxY: (maxY + 1) * scale,
          cx: Math.round(((minX + maxX) / 2) * scale),
          cy: Math.round(((minY + maxY) / 2) * scale),
          w: (maxX - minX + 1) * scale,
          h: (maxY - minY + 1) * scale,
          px: px * scale * scale,
        });
      }
    }
  }

  // Y 중심 기준 행 클러스터링
  components.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const c of components) {
    let added = false;
    for (const r of rows) {
      if (Math.abs(r.cy - c.cy) < 80) {
        r.items.push(c);
        r.cy = r.items.reduce((s, it) => s + it.cy, 0) / r.items.length;
        added = true;
        break;
      }
    }
    if (!added) rows.push({ cy: c.cy, items: [c] });
  }
  rows.forEach(r => r.items.sort((a, b) => a.cx - b.cx));

  rows.forEach((r, ri) => {
    console.log(`\n--- Row ${ri + 1} (cy≈${Math.round(r.cy)}, count=${r.items.length}) ---`);
    r.items.forEach((c, i) => {
      console.log(`  [${i}] bbox=(${c.minX},${c.minY})-(${c.maxX},${c.maxY}) ${c.w}x${c.h} center=(${c.cx},${c.cy}) px=${c.px}`);
    });
  });
})();
