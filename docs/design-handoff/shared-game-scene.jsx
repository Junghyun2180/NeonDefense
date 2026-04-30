// Shared game scene — TILE-BASED mini tower defense
// 14 cols × 9 rows grid, 48px tiles → 672 × 432 design size
// Props: { variant: 'holo' | 'mini' | 'field', width, height }

const { useState, useEffect, useRef, useMemo } = React;

// --- Element metadata ---
const ELEMENTS = {
  fire:     { color: '#ff6b2e', glyph: '◈', label: '화염', name: 'Pyrocore' },
  water:    { color: '#4cc9f0', glyph: '❄', label: '냉기', name: 'Cryo' },
  electric: { color: '#ffd60a', glyph: '⚡', label: '전격', name: 'Volt' },
  wind:     { color: '#56e39f', glyph: '➤', label: '질풍', name: 'Gale' },
  void:     { color: '#c77dff', glyph: '✦', label: '공허', name: 'Void' },
  light:    { color: '#ffe66d', glyph: '◇', label: '광휘', name: 'Lumen' },
};

// --- Tower using real PNG asset ---
function TowerGlyph({ element, tier = 3, size = 40, selected = false }) {
  const el = ELEMENTS[element] || ELEMENTS.fire;
  const t = Math.max(1, Math.min(4, tier));
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: `drop-shadow(0 0 ${selected ? 12 : 6}px ${el.color}cc) drop-shadow(0 2px 4px rgba(0,0,0,0.6))`,
      transition: 'filter 0.2s',
    }}>
      <img src={`assets/towers/${element}/t${t}.png`}
        alt={`${el.name} T${t}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
    </div>
  );
}

// --- Enemy using real PNG asset ---
function EnemyGlyph({ type = 'normal', size = 22 }) {
  const sizeMap = { boss: 1.8, elite: 1.4, suppressor: 1.3, splitter: 1.2, jammer: 1.1, healer: 1.1, normal: 1.0, fast: 0.95 };
  const scale = sizeMap[type] ?? 1;
  const sz = size * scale;
  const glow = type === 'boss' ? '#ff4d6d' : type === 'elite' ? '#ff6b2e' : type === 'fast' ? '#4cc9f0' : type === 'healer' ? '#56e39f' : '#c77dff';
  return (
    <img src={`assets/enemies/${type}.png`} alt={type}
      style={{
        width: sz, height: sz, objectFit: 'contain',
        filter: `drop-shadow(0 0 6px ${glow}bb) drop-shadow(0 2px 3px rgba(0,0,0,0.7))`,
        display: 'block',
      }} />
  );
}

// --- TILE GRID CONFIG ---
const COLS = 14;
const ROWS = 9;
const TILE = 48;
const MAP_W = COLS * TILE; // 672
const MAP_H = ROWS * TILE; // 432

// Path as a sequence of [col, row] tile coordinates — enemies walk tile-to-tile
// Starts at left edge (col=-0.5 outside) and exits right edge
const PATH_TILES = [
  [0, 1], [1, 1], [2, 1], [3, 1],
  [3, 2], [3, 3],
  [4, 3], [5, 3], [6, 3],
  [6, 2], [6, 1],
  [7, 1], [8, 1], [9, 1],
  [9, 2], [9, 3], [9, 4], [9, 5],
  [8, 5], [7, 5], [6, 5], [5, 5], [4, 5], [3, 5],
  [3, 6], [3, 7],
  [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7],
];

// Build a Set of path tile keys for quick lookup
const pathSet = new Set(PATH_TILES.map(([c, r]) => `${c},${r}`));
const isPath = (c, r) => pathSet.has(`${c},${r}`);

// Tile center in pixels
const tileCenter = (c, r) => [c * TILE + TILE / 2, r * TILE + TILE / 2];

// SVG polyline "points" for path rendering — follows tile centers
const pathCenters = PATH_TILES.map(([c, r]) => tileCenter(c, r));
const pathPoints = pathCenters.map(([x, y]) => `${x},${y}`).join(' ');

// Default towers: placed on non-path tiles near the path
// stored as [col, row, element, tier]
const DEFAULT_TOWERS = [
  { id: 't1', col: 1, row: 2, element: 'fire',     tier: 3, range: 2.2 },
  { id: 't2', col: 4, row: 2, element: 'water',    tier: 2, range: 2.0 },
  { id: 't3', col: 7, row: 2, element: 'electric', tier: 4, range: 2.6 },
  { id: 't4', col: 10, row: 2, element: 'void',    tier: 3, range: 2.2 },
  { id: 't5', col: 10, row: 5, element: 'wind',    tier: 2, range: 2.0 },
  { id: 't6', col: 5, row: 6, element: 'light',    tier: 3, range: 2.2 },
  { id: 't7', col: 8, row: 6, element: 'fire',     tier: 2, range: 1.8 },
];

function GameScene({ variant = 'holo', width = 672, height = 432, towers: customTowers, showRanges = true, selectedTowerId = null, onSelect }) {
  const [enemies, setEnemies] = useState([
    { id: 1, type: 'normal', offset: 0.12 },
    { id: 2, type: 'fast',   offset: 0.28 },
    { id: 3, type: 'normal', offset: 0.44 },
    { id: 4, type: 'elite',  offset: 0.58 },
    { id: 5, type: 'normal', offset: 0.72 },
    { id: 6, type: 'boss',   offset: 0.88 },
  ]);

  const towers = customTowers || DEFAULT_TOWERS;

  // animate enemies along tile path
  useEffect(() => {
    const iv = setInterval(() => {
      setEnemies(es => es.map(e => ({
        ...e,
        offset: (e.offset + 0.0035) % 1,
      })));
    }, 50);
    return () => clearInterval(iv);
  }, []);

  // Resolve enemy tile position from offset along polyline
  const getPositionAt = (offset) => {
    const total = pathCenters.length - 1;
    const f = offset * total;
    const i = Math.floor(f);
    const frac = f - i;
    const a = pathCenters[i];
    const b = pathCenters[Math.min(i + 1, total)];
    return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
  };

  // variant-specific colors
  const gridLine = variant === 'mini' ? 'rgba(255,255,255,0.04)' : 'rgba(76, 201, 240, 0.08)';
  const pathFill = variant === 'mini' ? '#141821' : variant === 'field' ? '#2a1b3d' : '#0f2a3d';
  const pathEdge = variant === 'mini' ? 'rgba(76, 201, 240, 0.25)' : variant === 'field' ? '#c77dff' : '#4cc9f0';
  const buildTileFill = variant === 'mini' ? 'rgba(255,255,255,0.015)' : 'rgba(76, 201, 240, 0.03)';
  const buildTileStroke = variant === 'mini' ? 'rgba(255,255,255,0.05)' : 'rgba(76, 201, 240, 0.1)';

  // Find start/end tiles
  const startTile = PATH_TILES[0];
  const endTile = PATH_TILES[PATH_TILES.length - 1];

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={width} height={height} style={{ display: 'block' }}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <linearGradient id="tile-path-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={pathFill} />
            <stop offset="100%" stopColor={variant === 'field' ? '#1a0f2e' : '#06101d'} />
          </linearGradient>
        </defs>

        {/* Build tiles — grid of non-path squares */}
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            if (isPath(c, r)) return null;
            return (
              <rect key={`b-${c}-${r}`}
                x={c * TILE + 1} y={r * TILE + 1}
                width={TILE - 2} height={TILE - 2}
                fill={buildTileFill}
                stroke={buildTileStroke}
                strokeWidth="1" />
            );
          })
        )}

        {/* Path tiles — darker filled tiles underneath */}
        {PATH_TILES.map(([c, r], i) => (
          <rect key={`p-${c}-${r}`}
            x={c * TILE} y={r * TILE}
            width={TILE} height={TILE}
            fill="url(#tile-path-grad)"
            stroke={pathEdge} strokeOpacity="0.25" strokeWidth="1" />
        ))}

        {/* Path center line — dashed, showing direction */}
        <polyline points={pathPoints}
          fill="none" stroke={pathEdge} strokeWidth="2"
          strokeDasharray="6 6" strokeLinecap="round" strokeLinejoin="round"
          opacity="0.6" />

        {/* Direction arrows along path */}
        {pathCenters.filter((_, i) => i > 0 && i < pathCenters.length - 1 && i % 4 === 0).map(([x, y], i) => {
          const idx = pathCenters.findIndex(p => p[0] === x && p[1] === y);
          const prev = pathCenters[Math.max(0, idx - 1)];
          const next = pathCenters[Math.min(pathCenters.length - 1, idx + 1)];
          const dx = next[0] - prev[0], dy = next[1] - prev[1];
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return (
            <g key={`arr-${i}`} transform={`translate(${x}, ${y}) rotate(${angle})`}>
              <polygon points="-5,-4 5,0 -5,4" fill={pathEdge} opacity="0.5" />
            </g>
          );
        })}

        {/* START tile highlight */}
        <rect x={startTile[0] * TILE} y={startTile[1] * TILE} width={TILE} height={TILE}
          fill="none" stroke="#56e39f" strokeWidth="2" opacity="0.9" />
        <text x={startTile[0] * TILE + TILE/2} y={startTile[1] * TILE + TILE/2 + 5}
          textAnchor="middle" fontSize="16" fontWeight="800" fill="#56e39f"
          style={{ filter: 'drop-shadow(0 0 4px #56e39f)' }}>▶</text>

        {/* END tile highlight (base) */}
        <rect x={endTile[0] * TILE} y={endTile[1] * TILE} width={TILE} height={TILE}
          fill="#ff4d6d" fillOpacity="0.1"
          stroke="#ff4d6d" strokeWidth="2" />
        <text x={endTile[0] * TILE + TILE/2} y={endTile[1] * TILE + TILE/2 + 5}
          textAnchor="middle" fontSize="18" fill="#ff4d6d"
          style={{ filter: 'drop-shadow(0 0 6px #ff4d6d)' }}>◎</text>

        {/* Tower ranges — rendered as tile-snapped circles */}
        {showRanges && towers.map(t => {
          const [cx, cy] = tileCenter(t.col, t.row);
          const el = ELEMENTS[t.element];
          const isSel = selectedTowerId === t.id;
          return (
            <circle key={`r-${t.id}`} cx={cx} cy={cy} r={t.range * TILE}
              fill={el.color} fillOpacity={isSel ? 0.1 : 0.03}
              stroke={el.color} strokeOpacity={isSel ? 0.7 : 0.15}
              strokeWidth={isSel ? 1.5 : 1} strokeDasharray="3 5" />
          );
        })}

        {/* Tile-snapped range tiles for selected tower — shows which tiles are in range */}
        {showRanges && selectedTowerId && towers.filter(t => t.id === selectedTowerId).map(t => {
          const rTiles = Math.ceil(t.range);
          const [tx, ty] = [t.col, t.row];
          const highlights = [];
          for (let dr = -rTiles; dr <= rTiles; dr++) {
            for (let dc = -rTiles; dc <= rTiles; dc++) {
              const c = tx + dc, r = ty + dr;
              if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
              if (!isPath(c, r)) continue;
              const dist = Math.sqrt(dc * dc + dr * dr);
              if (dist <= t.range) {
                highlights.push(
                  <rect key={`rh-${c}-${r}`}
                    x={c * TILE} y={r * TILE}
                    width={TILE} height={TILE}
                    fill={ELEMENTS[t.element].color}
                    fillOpacity="0.18"
                    stroke={ELEMENTS[t.element].color}
                    strokeOpacity="0.5"
                    strokeWidth="1" />
                );
              }
            }
          }
          return highlights;
        })}

        {/* Projectile eye candy */}
        <circle cx={tileCenter(1,2)[0] + 18} cy={tileCenter(1,2)[1] - 6} r="3" fill="#ff6b2e" filter="url(#glow)" />
        <circle cx={tileCenter(7,2)[0] - 10} cy={tileCenter(7,2)[1] + 10} r="3" fill="#ffd60a" filter="url(#glow)" />
      </svg>

      {/* Tower HTML overlays — click handling + PNG render */}
      {towers.map(t => {
        const [cx, cy] = tileCenter(t.col, t.row);
        return (
          <div key={t.id}
            onClick={() => onSelect && onSelect(t)}
            style={{
              position: 'absolute',
              left: `${(cx / MAP_W) * 100}%`,
              top: `${(cy / MAP_H) * 100}%`,
              transform: 'translate(-50%, -55%)',
              cursor: 'pointer',
              zIndex: selectedTowerId === t.id ? 5 : 2,
            }}>
            <TowerGlyph element={t.element} tier={t.tier} size={54} selected={selectedTowerId === t.id} />
          </div>
        );
      })}

      {/* Enemies — animated along tile path */}
      {enemies.map(e => {
        const [x, y] = getPositionAt(e.offset);
        return (
          <div key={e.id} style={{
            position: 'absolute',
            left: `${(x / MAP_W) * 100}%`,
            top: `${(y / MAP_H) * 100}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            transition: 'left 60ms linear, top 60ms linear',
          }}>
            <EnemyGlyph type={e.type} size={34} />
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { GameScene, TowerGlyph, EnemyGlyph, ELEMENTS, PATH_TILES, TILE, COLS, ROWS });
