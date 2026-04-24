// 4-tier 합본 이미지를 티어별 정사각 PNG로 자동 분할
// 1) 채도/명도 기반 타워 픽셀 검출
// 2) 연결 컴포넌트 추출 → 각 컴포넌트를 가장 가까운 사분면에 할당
// 3) 사분면별 컴포넌트 union bbox 계산
// 4) 정사각 캔버스에 중앙 배치 (여백 포함) → PNG 저장
// 5) 배경을 투명으로 치환 (채도/명도 임계 미달 픽셀을 투명화)
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const QUADRANT_DEFS = [
  { tier: 't1', qx: 0.25, qy: 0.25 },
  { tier: 't2', qx: 0.75, qy: 0.25 },
  { tier: 't3', qx: 0.25, qy: 0.75 },
  { tier: 't4', qx: 0.75, qy: 0.75 },
];

async function detectComponents(data, iw, ih) {
  // 타워 픽셀 판정
  const opaque = new Uint8Array(iw * ih);
  for (let i = 0; i < iw * ih; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (min < 180 || sat > 0.15) opaque[i] = 1;
  }

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
      if (c >= scale * scale * 0.8) down[y * dw + x] = 1;
    }
  }

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
        });
      }
    }
  }
  return components;
}

function clusterByQuadrant(components, W, H) {
  const clusters = {};
  QUADRANT_DEFS.forEach(q => { clusters[q.tier] = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, comps: [] }; });
  for (const c of components) {
    let bestTier = null, bestDist = Infinity;
    for (const q of QUADRANT_DEFS) {
      const qcx = W * q.qx, qcy = H * q.qy;
      const dx = c.cx - qcx, dy = c.cy - qcy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; bestTier = q.tier; }
    }
    const cl = clusters[bestTier];
    cl.minX = Math.min(cl.minX, c.minX);
    cl.maxX = Math.max(cl.maxX, c.maxX);
    cl.minY = Math.min(cl.minY, c.minY);
    cl.maxY = Math.max(cl.maxY, c.maxY);
    cl.comps.push(c);
  }
  return clusters;
}

// 배경(흰색/저채도) 픽셀을 투명으로 치환한 RGBA 버퍼 생성
async function buildTransparent(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const isBg = (min >= 180 && sat <= 0.10);
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    if (isBg) {
      out[i * 4 + 3] = 0;
    } else {
      // 배경과의 거리 기반으로 부드러운 알파 (글로우 경계 자연스럽게)
      let a = 255;
      if (min >= 180) {
        // 거의 흰색이지만 약간의 색감 → 알파 감쇠
        a = Math.min(255, Math.round(sat * 2000));
      }
      out[i * 4 + 3] = a;
    }
  }
  return { buf: out, width: info.width, height: info.height };
}

async function splitTower(srcPath, outDir, label) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1) 분석용 원본 데이터
  const { data: rawData, info: rawInfo } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = rawInfo.width, H = rawInfo.height;

  // 2) 컴포넌트 검출 + 클러스터링
  const components = await detectComponents(rawData, W, H);
  const clusters = clusterByQuadrant(components, W, H);

  // 3) 투명 배경 버퍼 생성
  const { buf: transBuf, width: tw, height: th } = await buildTransparent(srcPath);

  const results = [];
  for (const q of QUADRANT_DEFS) {
    const cl = clusters[q.tier];
    if (!cl.comps.length) {
      console.warn(`[${label}] ${q.tier}: 컴포넌트 없음 — 건너뜀`);
      continue;
    }

    // 통합 bbox에 여백 추가 (22% — 이웃 사분면 침범은 아래서 마스킹)
    const bboxW = cl.maxX - cl.minX;
    const bboxH = cl.maxY - cl.minY;
    const cx = (cl.minX + cl.maxX) / 2;
    const cy = (cl.minY + cl.maxY) / 2;
    const side = Math.ceil(Math.max(bboxW, bboxH) * 1.22);
    let left = Math.round(cx - side / 2);
    let top = Math.round(cy - side / 2);
    left = Math.max(0, Math.min(W - side, left));
    top = Math.max(0, Math.min(H - side, top));
    const cropW = Math.min(side, W - left);
    const cropH = Math.min(side, H - top);

    // 이웃 티어 bbox 영역은 투명화 (bleed-in 제거)
    const maskedBuf = Buffer.from(transBuf); // 원본 복사 X — 개별 티어마다 재생성
    const freshBuf = Buffer.alloc(transBuf.length);
    transBuf.copy(freshBuf);
    for (const other of QUADRANT_DEFS) {
      if (other.tier === q.tier) continue;
      const o = clusters[other.tier];
      if (!o.comps.length) continue;
      const pad = 6; // 이웃 bbox에서 약간 확장
      const ox0 = Math.max(0, o.minX - pad);
      const oy0 = Math.max(0, o.minY - pad);
      const ox1 = Math.min(W, o.maxX + pad);
      const oy1 = Math.min(H, o.maxY + pad);
      for (let yy = oy0; yy < oy1; yy++) {
        for (let xx = ox0; xx < ox1; xx++) {
          freshBuf[(yy * W + xx) * 4 + 3] = 0;
        }
      }
    }

    const extracted = await sharp(freshBuf, { raw: { width: tw, height: th, channels: 4 } })
      .extract({ left, top, width: cropW, height: cropH })
      .png({ compressionLevel: 9 })
      .toBuffer();

    // 완전 정사각 보정 (클램프로 짤린 경우)
    let finalBuf = extracted;
    if (cropW !== side || cropH !== side) {
      const padX = Math.floor((side - cropW) / 2);
      const padY = Math.floor((side - cropH) / 2);
      finalBuf = await sharp({
        create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      }).composite([{ input: extracted, left: padX, top: padY }]).png().toBuffer();
    }

    const outPath = path.join(outDir, q.tier + '.png');
    fs.writeFileSync(outPath, finalBuf);
    results.push({ tier: q.tier, bbox: `(${cl.minX},${cl.minY})-(${cl.maxX},${cl.maxY})`, side: `${side}x${side}`, comps: cl.comps.length });
  }
  console.log(`[${label}]`, results);
}

(async () => {
  const root = path.resolve(__dirname, '..');
  await splitTower(
    path.join(root, 'Saved', 'src', 'Light.png'),
    path.join(root, 'Saved', 'preview', 'light'),
    'Light'
  );
  await splitTower(
    path.join(root, 'Saved', 'src', 'Void.png'),
    path.join(root, 'Saved', 'preview', 'void'),
    'Void'
  );
  console.log('\nPreview at: Saved/preview/');
})();
