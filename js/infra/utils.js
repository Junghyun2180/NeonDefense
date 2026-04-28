// Neon Defense - 유틸리티 함수
// 경로 생성, 거리 계산, 판매 가격 등

// ===== 수학 유틸리티 =====

// 두 점 사이 거리 계산 (DRY: 모든 모듈에서 공용)
const calcDistance = (x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

// 두 점 사이 거리의 제곱 계산 (성능 최적화용 - Math.sqrt 생략)
const calcDistanceSq = (x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  return dx * dx + dy * dy;
};

// Floor 1 = ×1.0, Floor N HP 배율 = 1.15^(N-1)
const FLOOR_HP_GROWTH = 1.15;
const calcFloorHpMultiplier = (floor) => Math.pow(FLOOR_HP_GROWTH, Math.max(0, floor - 1));

// ===== 시간 포맷팅 =====

// "방금 전" / "N분 전" / "N시간 전" / "N일 전"
const formatRelativeTime = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
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

// 점유 맵에 경로 타일 등록 (셀 → 이동 방향 Set)
const registerPathTiles = (pathTiles, occupiedMap) => {
  for (let i = 0; i < pathTiles.length - 1; i++) {
    const key = `${pathTiles[i].x},${pathTiles[i].y}`;
    const dir = getTileDirection(pathTiles, i);
    if (!occupiedMap.has(key)) occupiedMap.set(key, new Set());
    occupiedMap.get(key).add(dir);
  }
};

// ===== ㅁ형 순환 경로 생성 (런 모드 전용) =====
// 그리드 외곽을 시계방향으로 순환하는 ㅁ 경로
// 패딩 1칸을 두고, 내부 공간은 타워 배치 영역
const generateSquarePath = (seed, stage) => {
  const pad = 1; // 외곽 패딩
  const left = pad;
  const right = GRID_WIDTH - 1 - pad;
  const top = pad;
  const bottom = GRID_HEIGHT - 1 - pad;

  const tiles = [];

  // 시작점: 좌측 중앙 (left, midY)
  const midY = Math.floor((top + bottom) / 2);

  // 좌측 중앙 → 위로 이동 (좌상단으로)
  for (let y = midY; y >= top; y--) {
    tiles.push({ x: left, y });
  }
  // 좌상단 → 우상단 (위쪽 가로)
  for (let x = left + 1; x <= right; x++) {
    tiles.push({ x, y: top });
  }
  // 우상단 → 우하단 (우측 세로)
  for (let y = top + 1; y <= bottom; y++) {
    tiles.push({ x: right, y });
  }
  // 우하단 → 좌하단 (아래쪽 가로)
  for (let x = right - 1; x >= left; x--) {
    tiles.push({ x, y: bottom });
  }
  // 좌하단 → 시작점 아래 (좌측 세로, 돌아오기)
  for (let y = bottom - 1; y > midY; y--) {
    tiles.push({ x: left, y });
  }

  const startPoint = { x: left, y: midY, id: 'A' };
  // 끝점은 시작점 바로 아래 (순환이므로 의미적으로만 사용)
  const endPoint = { x: left, y: midY + 1, id: '1' };

  return {
    paths: [{
      id: 'A',
      tiles,
      startPoint,
      endPoint,
      color: PATH_COLORS[0],
      isLoop: true, // 순환 경로 표시
    }],
    startPoints: [startPoint],
    endPoints: [endPoint],
    isSquareMap: true,
  };
};

// ===== A* 기반 경로 탐색 =====
//
// 시작→도착 사이를 격자에서 A*로 탐색. 비용 함수에 시드 노이즈/직진 페널티/회전
// 보너스/가장자리 페널티/점유 셀 페널티를 합쳐 "다양하면서도 길이/도달성이 보장"
// 되는 경로를 만든다. 휴리스틱은 맨해튼 거리(admissible).
//
// 상태 공간: (x, y, lastDirIdx, straightRun) — 회전 보너스/직진 페널티를 정확히
// 반영하려면 직전 이동 방향과 직진 누적 길이가 상태에 포함되어야 함.

// 셀별 결정론 노이즈 [0, 1)
const hashCell = (seed, x, y) => {
  let h = ((seed | 0) ^ (x * 73856093) ^ (y * 19349663)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// 4방향: 0=Up, 1=Down, 2=Left, 3=Right
const ASTAR_DIRS = [
  { dx: 0, dy: -1, axis: 'V' },
  { dx: 0, dy:  1, axis: 'V' },
  { dx: -1, dy: 0, axis: 'H' },
  { dx:  1, dy: 0, axis: 'H' },
];
const ASTAR_OPPOSITE = [1, 0, 3, 2];

const generatePathAStar = (seed, startX, startY, endX, endY, occupiedMap, options = {}) => {
  const {
    noiseWeight = 0.6,
    straightThreshold = 3,
    straightPenalty = 0.4,
    turnBonus = 0.3,
    edgePenalty = 1.5,
    parallelPenalty = Infinity,
    crossPenalty = 2.0,
  } = options;

  const heuristic = (x, y) => Math.abs(endX - x) + Math.abs(endY - y);
  const stateKey = (x, y, dir, run) => (((y * GRID_WIDTH + x) * 5 + (dir + 1)) * 8) + Math.min(run, 7);

  const gScore = new Map();
  const came = new Map(); // stateKey → { parentKey, parentX, parentY } (부모 좌표)
  const visitedCells = new Set(); // (x,y) 단위 방문 셀 — 같은 셀 재방문 차단(루프 방지)
  // 단순 배열 우선순위 큐 (노드 수 적음: 16*12*5*8 = 7680 상한)
  const open = [];

  const startKey = stateKey(startX, startY, -1, 0);
  gScore.set(startKey, 0);
  open.push({ key: startKey, x: startX, y: startY, dir: -1, run: 0, g: 0, f: heuristic(startX, startY) });

  while (open.length > 0) {
    // 가장 작은 f 추출 (선형 탐색)
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i;
    }
    const cur = open.splice(bestIdx, 1)[0];
    const cellKey = cur.y * GRID_WIDTH + cur.x;
    if (visitedCells.has(cellKey)) continue; // 이미 더 좋은 경로로 도달한 셀
    visitedCells.add(cellKey);

    if (cur.x === endX && cur.y === endY) {
      // 경로 복원: came 값은 "부모의 좌표"이므로 시작점까지 정확히 unshift됨
      const path = [{ x: cur.x, y: cur.y }];
      let key = cur.key;
      while (came.has(key)) {
        const node = came.get(key);
        path.unshift({ x: node.parentX, y: node.parentY });
        key = node.parentKey;
      }
      return path;
    }

    for (let d = 0; d < 4; d++) {
      // 즉시 백트래킹 차단 (직전 방향의 반대로는 가지 않음)
      if (cur.dir !== -1 && d === ASTAR_OPPOSITE[cur.dir]) continue;

      const dir = ASTAR_DIRS[d];
      const nx = cur.x + dir.dx;
      const ny = cur.y + dir.dy;
      if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT) continue;

      let cost = 1;
      cost += hashCell(seed, nx, ny) * noiseWeight;
      if (ny === 0 || ny === GRID_HEIGHT - 1) cost += edgePenalty;

      // 점유 셀: 같은 축이면 병렬(차단), 다른 축이면 교차(허용/페널티)
      if (occupiedMap) {
        const occDirs = occupiedMap.get(`${nx},${ny}`);
        if (occDirs) {
          if (occDirs.has(dir.axis)) {
            if (!isFinite(parallelPenalty)) continue; // ∞면 아예 후보 제외
            cost += parallelPenalty;
          } else {
            cost += crossPenalty;
          }
        }
      }

      // 회전/직진
      const isTurn = cur.dir !== -1 && ASTAR_DIRS[cur.dir].axis !== dir.axis;
      const newRun = (cur.dir === -1 || isTurn) ? 1 : cur.run + 1;
      if (isTurn) cost = Math.max(0.05, cost - turnBonus);
      if (newRun > straightThreshold) cost += straightPenalty;

      const tentativeG = cur.g + cost;
      const nextKey = stateKey(nx, ny, d, newRun);
      const oldG = gScore.get(nextKey);
      if (oldG !== undefined && oldG <= tentativeG) continue;
      // 이미 (x,y)를 방문했다면 재진입 차단 (루프 방지)
      if (visitedCells.has(ny * GRID_WIDTH + nx)) continue;

      gScore.set(nextKey, tentativeG);
      came.set(nextKey, { parentKey: cur.key, parentX: cur.x, parentY: cur.y });
      open.push({
        key: nextKey,
        x: nx, y: ny, dir: d, run: newRun,
        g: tentativeG,
        f: tentativeG + heuristic(nx, ny),
      });
    }
  }

  return null; // 모든 후보가 차단된 경우
};

// 다중 경로 생성: A*로 한 경로씩 탐색하고 점유 등록 → 다음 경로는 자연 회피
const generateMultiplePaths = (seed, stage = 1) => {
  const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
  let randomIndex = 0;
  const random = () => seededRandom(seed + randomIndex++);

  const config = getPathConfig(stage, random);
  const paths = [];
  const startPoints = [];
  const endPoints = [];
  const occupiedMap = new Map();

  const startSpacing = Math.floor(GRID_HEIGHT / (config.starts + 1));
  for (let i = 0; i < config.starts; i++) {
    const y = Math.max(1, Math.min(GRID_HEIGHT - 2, startSpacing * (i + 1) + Math.floor(random() * 2 - 1)));
    startPoints.push({ x: 0, y, id: String.fromCharCode(65 + i) });
  }

  const endSpacing = Math.floor(GRID_HEIGHT / (config.ends + 1));
  for (let i = 0; i < config.ends; i++) {
    const y = Math.max(1, Math.min(GRID_HEIGHT - 2, endSpacing * (i + 1) + Math.floor(random() * 2 - 1)));
    endPoints.push({ x: GRID_WIDTH - 1, y, id: String(i + 1) });
  }

  for (let i = 0; i < startPoints.length; i++) {
    const start = startPoints[i];
    const end = endPoints[i % endPoints.length];
    const pathSeed = seed + i * 1000 + 1;

    // 최소 길이: 맨해튼 거리에 굴곡 마진을 더해 단조로운 직선 차단
    const manhattan = Math.abs(end.x - start.x) + Math.abs(end.y - start.y);
    const lengthFactor = 1.3 + Math.min(stage, 6) * 0.03;
    const minLength = Math.floor(manhattan * lengthFactor);

    let pathTiles = generatePathAStar(pathSeed, start.x, start.y, end.x, end.y, occupiedMap);

    // 길이 미달 → 굴곡 강조하여 1회 재탐색
    if (pathTiles && pathTiles.length < minLength) {
      const retry = generatePathAStar(pathSeed + 12345, start.x, start.y, end.x, end.y, occupiedMap, {
        noiseWeight: 1.0,
        straightPenalty: 0.9,
        turnBonus: 0.6,
      });
      if (retry && retry.length > pathTiles.length) pathTiles = retry;
    }

    // 점유로 완전 차단된 극단 케이스 → 병렬 페널티 완화하여 폴백
    if (!pathTiles) {
      pathTiles = generatePathAStar(pathSeed, start.x, start.y, end.x, end.y, occupiedMap, {
        parallelPenalty: 5.0,
        crossPenalty: 1.0,
      });
    }
    if (!pathTiles) continue; // 정말 실패 시 해당 경로 스킵 (방어)

    registerPathTiles(pathTiles, occupiedMap);

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

// ===== 모듈러 타일 선택 유틸리티 =====
// pathData → 실제 경로 이동 인접성 맵 → (x,y) 이웃 4비트 마스크(UDLR)
//   U=8, D=4, L=2, R=1
//
// 중요: "grid상 인접"이 아니라 "경로에서 실제로 이어지는" 셀만 연결로 판정.
// 이렇게 하지 않으면 두 개의 나란한 경로가 서로를 이웃으로 오인하여
// 직선 세로 구간이 T-junction으로 잘못 렌더됨 (ladder effect)

const buildPathAdjacency = (pathData) => {
  const adj = new Map();
  if (!pathData || !pathData.paths) return adj;
  for (const p of pathData.paths) {
    for (let i = 0; i < p.tiles.length; i++) {
      const key = `${p.tiles[i].x},${p.tiles[i].y}`;
      if (!adj.has(key)) adj.set(key, new Set());
      // 실제 경로에서 이 셀 이전/다음으로 이어진 셀만 이웃으로 추가
      if (i > 0) {
        const prev = `${p.tiles[i - 1].x},${p.tiles[i - 1].y}`;
        adj.get(key).add(prev);
      }
      if (i < p.tiles.length - 1) {
        const next = `${p.tiles[i + 1].x},${p.tiles[i + 1].y}`;
        adj.get(key).add(next);
      }
    }
  }
  return adj;
};

// (하위 호환용) 단순 Set: 셀이 path에 속하는지 조회만 필요한 경우
const buildPathCellsSet = (pathData) => {
  const set = new Set();
  if (!pathData || !pathData.paths) return set;
  for (const p of pathData.paths) {
    for (const tile of p.tiles) set.add(`${tile.x},${tile.y}`);
  }
  return set;
};

const getPathTileMask = (x, y, adjacencyOrSet) => {
  const key = `${x},${y}`;
  // adjacency Map (정확한 경로 기반) 또는 단순 Set 둘 다 지원
  const isAdj = adjacencyOrSet instanceof Map;
  const neighbors = isAdj ? (adjacencyOrSet.get(key) || new Set()) : null;
  const hasNeighbor = (nx, ny) => {
    const nk = `${nx},${ny}`;
    return isAdj ? neighbors.has(nk) : adjacencyOrSet.has(nk);
  };
  let mask = 0;
  if (hasNeighbor(x, y - 1)) mask |= 8; // U
  if (hasNeighbor(x, y + 1)) mask |= 4; // D
  if (hasNeighbor(x - 1, y)) mask |= 2; // L
  if (hasNeighbor(x + 1, y)) mask |= 1; // R
  return mask;
};

const PATH_TILE_BY_MASK = {
  0b0011: 'str-h',  // LR
  0b1100: 'str-v',  // UD
  0b1111: 'cross',  // UDLR
  0b1001: 'cor-ne', // UR  ┗
  0b1010: 'cor-nw', // UL  ┛
  0b0101: 'cor-se', // DR  ┏
  0b0110: 'cor-sw', // DL  ┓
  0b1011: 't-n',    // ULR ┻
  0b0111: 't-s',    // DLR ┳
  0b1101: 't-e',    // UDR ┣
  0b1110: 't-w',    // UDL ┫
};

// 단방향(dead-end)은 start/end 마커가 덮으므로 보이지 않지만 안전 폴백 제공
const getPathTileName = (mask) => {
  if (PATH_TILE_BY_MASK[mask]) return PATH_TILE_BY_MASK[mask];
  switch (mask) {
    case 0b1000: case 0b0100: return 'str-v';
    case 0b0010: case 0b0001: return 'str-h';
    default: return 'cross';
  }
};

window.buildPathAdjacency = buildPathAdjacency;
window.buildPathCellsSet = buildPathCellsSet;
window.getPathTileMask = getPathTileMask;
window.getPathTileName = getPathTileName;

// ===== 버프 매니저 안전 접근 헬퍼 =====
// PermanentBuffManager가 로드되지 않았을 때 기본값 반환

const BuffHelper = {
  // 버프 매니저 참조 (로드 후 캐싱)
  _manager: null,

  getManager() {
    if (!this._manager && typeof PermanentBuffManager !== 'undefined') {
      this._manager = PermanentBuffManager;
    }
    return this._manager;
  },

  // 배율 조회 (기본값 1)
  getDamageMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getDamageMultiplier(buffs) : 1;
  },

  getAttackSpeedMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getAttackSpeedMultiplier(buffs) : 1;
  },

  getRangeMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getRangeMultiplier(buffs) : 1;
  },

  getGoldMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getGoldMultiplier(buffs) : 1;
  },

  getDrawDiscount(buffs) {
    const pm = this.getManager();
    return pm ? pm.getDrawDiscount(buffs) : 0;
  },

  getInterestRate(buffs) {
    const pm = this.getManager();
    return pm ? pm.getInterestRate(buffs) : 0;
  },

  getCritInfo(buffs) {
    const pm = this.getManager();
    return pm ? pm.getCritInfo(buffs) : { chance: 0, multiplier: 1 };
  },

  getBurnDurationMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getBurnDurationMultiplier(buffs) : 1;
  },

  getSlowPowerMultiplier(buffs) {
    const pm = this.getManager();
    return pm ? pm.getSlowPowerMultiplier(buffs) : 1;
  },

  getChainBonus(buffs) {
    const pm = this.getManager();
    return pm ? pm.getChainBonus(buffs) : 0;
  },

  getActiveBuffsList(buffs) {
    const pm = this.getManager();
    return pm ? pm.getActiveBuffsList(buffs) : [];
  },
};

window.BuffHelper = BuffHelper;

// ===== 캐리오버 시스템 유틸리티 =====

// 타워 점수 계산 (티어 기반, 정렬용)
// T4 = 81점, T3 = 27점, T2 = 9점, T1 = 3점 (3^tier)
const calculateTowerScore = (tower) => {
  return Math.pow(3, tower.tier);
};

// 캐리오버 후보 생성
// 맵 + 인벤토리 통합, 티어 순 정렬, 상위 N개 반환
const generateCarryoverCandidates = (towers, supportTowers, inventory, supportInventory) => {
  // 공격 타워: T2 이상만 후보
  const allTowers = [...towers, ...inventory]
    .filter(t => t.tier >= CARRYOVER.minTowerTier)
    .sort((a, b) => calculateTowerScore(b) - calculateTowerScore(a));

  // 서포트 타워: S2 이상만 후보
  const allSupports = [...supportTowers, ...supportInventory]
    .filter(s => s.tier >= CARRYOVER.minSupportTier)
    .sort((a, b) => b.tier - a.tier);

  return {
    towers: allTowers.slice(0, 10),  // 최대 10개 후보
    supports: allSupports.slice(0, 6), // 최대 6개 후보
  };
};

// 캐리오버 환급 계산
// 모든 타워(맵+인벤토리)에서 선택된 것을 제외한 나머지 환급
const calculateCarryoverRefund = (towers, supportTowers, inventory, supportInventory, selectedIds) => {
  let refund = 0;

  // 모든 공격 타워 (맵 + 인벤토리)
  const allTowers = [...towers, ...inventory];
  allTowers.forEach(t => {
    if (!selectedIds.towers.includes(t.id)) {
      refund += getTowerSellPrice(t.tier);
    }
  });

  // 모든 서포트 타워 (맵 + 인벤토리)
  const allSupports = [...supportTowers, ...supportInventory];
  allSupports.forEach(s => {
    if (!selectedIds.supports.includes(s.id)) {
      refund += Math.floor((ECONOMY.supportBaseValues[s.tier] || 40) * ECONOMY.sellRefundRate);
    }
  });

  return refund;
};

// 캐리오버용 타워 복사 (위치 + 임시 상태 + 상태이상 전부 제거)
// 버그 수정: statusEffects가 남아 다음 스테이지에 버프/디버프 아이콘 잔존 현상 방지
const prepareCarryoverTower = (tower) => {
  const {
    gridX, gridY, x, y,
    lastShot, isBuffed, isDebuffed, effectiveRange,
    statusEffects,  // 이전 스테이지의 상태이상(버프/디버프) 제거
    ...rest
  } = tower;
  return { ...rest, lastShot: 0, statusEffects: [] };
};

window.calculateTowerScore = calculateTowerScore;
window.generateCarryoverCandidates = generateCarryoverCandidates;
window.calculateCarryoverRefund = calculateCarryoverRefund;
window.prepareCarryoverTower = prepareCarryoverTower;
