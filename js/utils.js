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
const getPathConfig = (stage, random) => {
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

// 다중 경로 생성
const generateMultiplePaths = (seed, stage = 1) => {
  const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  let randomIndex = 0;
  const random = () => seededRandom(seed + randomIndex++);

  const config = getPathConfig(stage, random);
  const paths = [];
  const startPoints = [];
  const endPoints = [];

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

  // 각 출발점에서 가장 가까운 도착점으로 경로 생성
  for (let i = 0; i < startPoints.length; i++) {
    const start = startPoints[i];
    const endIndex = i % endPoints.length;
    const end = endPoints[endIndex];

    const numTurns = Math.max(2, 5 - Math.floor(stage / 2) + Math.floor(random() * 2));
    const pathTiles = generateSinglePath(seed + i * 1000, start.y, end.y, start.x, end.x, numTurns);

    paths.push({
      id: start.id,
      tiles: pathTiles,
      startPoint: start,
      endPoint: end,
      color: PATH_COLORS[i % PATH_COLORS.length],
    });
  }

  return { paths, startPoints, endPoints };
};
