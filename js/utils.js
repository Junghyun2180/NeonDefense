// Neon Defense - 유틸리티 함수
// 경로 생성, 거리 계산, 판매 가격 등

// ===== 수학 유틸리티 =====

// 두 점 사이 거리 계산 (DRY: 모든 모듈에서 공용)
const calcDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// ===== 경제 유틸리티 =====

// 타워 판매 가격 계산
const getTowerSellPrice = (tier) => {
  return Math.floor((ECONOMY.towerBaseValues[tier] || 20) * ECONOMY.sellRefundRate);
};

// ===== 경로 생성 시스템 =====

// 스테이지별 경로 설정 (랜덤 요소 포함)
// random 미전달 시 Math.random 폴백 (UI 미리보기 등에서 사용)
const getPathConfig = (stage, random = Math.random) => {
  // 스테이지 진행에 따라 범위 내에서 랜덤 결정
  // stage 1: 항상 1시작 1도착 (튜토리얼 성격)
  if (stage === 1) return { starts: 1, ends: 1 };

  // stage 2~3: 1~2 시작, 1~2 도착
  if (stage <= 3) {
    return {
      starts: 1 + Math.floor(random() * 2), // 1~2
      ends: 1 + Math.floor(random() * 2),   // 1~2
    };
  }
  // stage 4~5: 2~3 시작, 1~2 도착
  if (stage <= 5) {
    return {
      starts: 2 + Math.floor(random() * 2), // 2~3
      ends: 1 + Math.floor(random() * 2),   // 1~2
    };
  }
  // stage 6+: 2~3 시작, 2~3 도착
  return {
    starts: 2 + Math.floor(random() * 2), // 2~3
    ends: 2 + Math.floor(random() * 2),   // 2~3
  };
};

// ===== 경로 겹침 방지 유틸리티 =====

// 타일의 이동 방향 계산 ('H': 수평, 'V': 수직)
const getTileDirection = (tiles, index) => {
  if (index >= tiles.length - 1) return null;
  return (tiles[index + 1].x !== tiles[index].x) ? 'H' : 'V';
};

// 경로 겹침 점수 계산 (병렬 겹침만 페널티, 직교 교차는 허용)
const calcPathOverlap = (newPath, occupiedMap) => {
  let score = 0;
  for (let i = 0; i < newPath.length - 1; i++) {
    const key = `${newPath[i].x},${newPath[i].y}`;
    const existingDirs = occupiedMap.get(key);
    if (existingDirs) {
      const newDir = getTileDirection(newPath, i);
      if (existingDirs.has(newDir)) {
        score += 2; // 같은 방향 겹침 (병렬) = 높은 페널티
      }
      // 직교 교차(십자 크로스)는 페널티 없음
    }
  }
  return score;
};

// 점유 맵에 경로 타일 등록
const registerPathTiles = (pathTiles, occupiedMap) => {
  for (let i = 0; i < pathTiles.length - 1; i++) {
    const key = `${pathTiles[i].x},${pathTiles[i].y}`;
    const dir = getTileDirection(pathTiles, i);
    if (!occupiedMap.has(key)) occupiedMap.set(key, new Set());
    occupiedMap.get(key).add(dir);
  }
};

// 단일 경로 생성 (시작점에서 도착점까지)
const generateSinglePath = (seed, startY, endY, startX = 0, endX = GRID_WIDTH - 1, numTurns = 4) => {
  const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  let randomIndex = 0;
  const random = () => seededRandom(seed + randomIndex++);

  const path = [];
  let currentX = startX;
  let currentY = startY;
  path.push({ x: currentX, y: currentY });

  const segmentWidth = Math.floor((endX - startX) / (numTurns + 1));

  for (let i = 0; i < numTurns; i++) {
    const targetX = Math.min(endX - 1, startX + (i + 1) * segmentWidth + Math.floor(random() * 2));

    let targetY;
    if (i === numTurns - 1) {
      targetY = endY;
    } else {
      const variance = 3;
      const midY = (startY + endY) / 2;
      if (i % 2 === 0) {
        targetY = Math.max(1, Math.floor(midY - variance - random() * variance));
      } else {
        targetY = Math.min(GRID_HEIGHT - 2, Math.floor(midY + variance + random() * variance));
      }
    }
    targetY = Math.max(1, Math.min(GRID_HEIGHT - 2, targetY));

    // 수평 이동
    while (currentX < targetX) {
      currentX++;
      path.push({ x: currentX, y: currentY });
    }

    // 수직 이동
    while (currentY !== targetY) {
      currentY += currentY < targetY ? 1 : -1;
      path.push({ x: currentX, y: currentY });
    }
  }

  // 끝점까지 이동
  while (currentX < endX) {
    currentX++;
    path.push({ x: currentX, y: currentY });
  }
  while (currentY !== endY) {
    currentY += currentY < endY ? 1 : -1;
    path.push({ x: currentX, y: currentY });
  }

  return path;
};

// 다중 경로 생성 (겹침 최소화: 직교 교차만 허용)
const generateMultiplePaths = (seed, stage = 1) => {
  const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  let randomIndex = 0;
  const random = () => seededRandom(seed + randomIndex++);

  const config = getPathConfig(stage, random);
  const paths = [];
  const startPoints = [];
  const endPoints = [];
  const occupiedMap = new Map(); // 점유 타일 + 방향 추적 (겹침 방지)

  // 출발점 Y 좌표 계산 (균등 분배)
  const startSpacing = Math.floor(GRID_HEIGHT / (config.starts + 1));
  for (let i = 0; i < config.starts; i++) {
    const y = Math.max(1, Math.min(GRID_HEIGHT - 2, startSpacing * (i + 1) + Math.floor(random() * 2 - 1)));
    startPoints.push({ x: 0, y, id: String.fromCharCode(65 + i) });
  }

  // 도착점 Y 좌표 계산 (균등 분배)
  const endSpacing = Math.floor(GRID_HEIGHT / (config.ends + 1));
  for (let i = 0; i < config.ends; i++) {
    const y = Math.max(1, Math.min(GRID_HEIGHT - 2, endSpacing * (i + 1) + Math.floor(random() * 2 - 1)));
    endPoints.push({ x: GRID_WIDTH - 1, y, id: String(i + 1) });
  }

  // 각 출발점에서 도착점으로 경로 생성 (겹침 최소화)
  for (let i = 0; i < startPoints.length; i++) {
    const start = startPoints[i];
    const endIndex = i % endPoints.length;
    const end = endPoints[endIndex];
    const numTurns = Math.max(2, 5 - Math.floor(stage / 2) + Math.floor(random() * 2));

    let bestPath = null;
    let bestScore = Infinity;
    const maxAttempts = i === 0 ? 1 : 8; // 첫 경로는 바로 생성, 이후는 최대 8번 시도

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const pathTiles = generateSinglePath(
        seed + i * 1000 + attempt * 137,
        start.y, end.y, start.x, end.x, numTurns
      );

      if (i === 0) {
        bestPath = pathTiles;
        break;
      }

      // 병렬 겹침 점수 계산 (직교 교차는 허용)
      const score = calcPathOverlap(pathTiles, occupiedMap);
      if (score < bestScore) {
        bestScore = score;
        bestPath = pathTiles;
      }
      if (score === 0) break; // 겹침 없는 최적 경로 발견
    }

    // 선택된 경로를 점유 맵에 등록
    registerPathTiles(bestPath, occupiedMap);

    paths.push({
      id: start.id,
      tiles: bestPath,
      startPoint: start,
      endPoint: end,
      color: PATH_COLORS[i % PATH_COLORS.length],
    });
  }

  return { paths, startPoints, endPoints };
};
