# Neon Defense — 타일셋 v2 생성 프롬프트

> v1 (`SKIN_PROMPTS.md`)의 문제: 타일마다 conduit 굵기가 달라서 (직선 25% / 코너 35% / T·Cross 40%) 연결부에 검은 갭이 발생. v2는 **픽셀 단위로 굵기·위치를 고정**해 갭 0을 보장한다.

## 목표 스펙 (변경 불가)

- **타일 크기**: 512×512 px (게임 내 40×40으로 다운스케일됨)
- **base color**: pure flat `#0a0a1f` (모든 타일 4 모서리 픽셀은 반드시 이 색)
- **conduit 굵기**: 정확히 **타일의 40% = 204 px** (모든 타일 동일)
- **conduit 중심선**: 타일의 정중앙 (px 256)
- **conduit 가장자리 픽셀**: **px 154 ~ px 358** (= 256 ± 102)
- **연결되는 edge에서**: conduit 전체 폭(px 154–358)이 그 edge의 0번째 픽셀까지 **풀-블리드**로 닿아야 함. fade out, 그라데이션 끝점 안쪽 멈춤 모두 금지.
- **연결되지 않는 edge에서**: edge로부터 안쪽 8 px까지 = pure `#0a0a1f`. glow / 내부 패턴이 절대 새어나오지 않음.

## 공통 스타일 카드 (모든 타일 프롬프트 앞에 붙여 쓰기)

```
Generate a SINGLE 512x512 tile image for a neon tower-defense game tileset.
Top-down orthographic. Base: pure flat #0a0a1f.

VISUAL: "Neon Data-Stream Conduit" (futuristic, NO hex / NO honeycomb)
A glowing teal conduit, structured outer→inner as:
  1) OUTER RAILS — two parallel cyan rails (#B8FFF5, 5 px thick) at the
     conduit edges with soft #4ECDC4 outer glow (max 6 px, fades to base).
  2) CONDUIT BODY — dark teal interior (#0a2828) filled with a layered
     futuristic texture (NOT a tessellated grid). Stack the following:
       a) DIRECTIONAL DATA STREAKS — thin bright streaks (1–2 px thick,
          #4ECDC4 at 35–55% alpha) running PARALLEL to the conduit flow
          direction. Streak length 30–80 px, spacing varies 3–9 px,
          irregular cadence (NOT a regular grid).
       b) FINE DIGITAL NOISE — per-pixel brightness jitter ±12%, monochrome
          teal, subtle, pure stochastic (no visible repeat / no banding).
       c) PULSE PACKETS — sparse 2–3 px bright #B8FFF5 dots, density ~3%,
          scattered along the streak direction (suggesting data flow).
       d) FAINT SCAN OVERLAY — one or two very low-contrast wide bands of
          #4ECDC4 at 8% alpha sliding along the flow direction.
     ABSOLUTELY NO hexagons, NO honeycomb, NO tessellated cells, NO grid
     pattern, NO repeating geometric shapes inside the conduit.
     The texture should read as "energy flowing through a circuit pipe,"
     not as a paved surface.

ABSOLUTE GEOMETRY (must be exact across all tiles in the set):
  • Conduit total width = 204 px (40% of 512). NEVER varies between tiles.
  • Conduit edges fall at pixel 154 and pixel 358 along the perpendicular axis.
  • Conduit centerline at pixel 256.
  • The two outer rails are at px 154-159 and px 353-358.

EDGE RULES:
  • CONNECTING EDGE (where the conduit exits the tile):
    - The conduit (rails + interior fill + streaks) must touch the edge at pixels 154-358.
    - That entire 204-px strip is FULLY OPAQUE conduit at the edge — no fade,
      no taper, no inset. Pixel column 0 (or 511) within rows 154-358 must
      be conduit pixels matching a neighbor tile's identical strip.
    - Outside that 204-px strip, the edge is pure #0a0a1f.
  • CLOSED EDGE (where conduit does NOT exit):
    - The edge and the inner 8 px are pure #0a0a1f.
    - No glow bleed, no rail crossing, no interior pattern reaching this edge.

FORBIDDEN:
  - Tile borders, frames, vignettes, drop shadows on the tile itself.
  - Any decorative element wider than 204 px in any axis.
  - Junction nodes / center lights extending past pixel 154 or 358.
  - Different conduit thickness on different tiles (visual continuity REQUIRED).
  - Text, arrows, ornaments outside the listed elements.
```

## 개별 타일 프롬프트

각 타일은 **개별 생성 권장** (그리드 일괄 생성은 conduit 굵기 드리프트가 잘 일어남).

### 1) `grass.png` — non-path 배경 타일

```
[STYLE CARD]

VARIANT: GRASS (no conduit).
The entire tile is closed — all 4 edges are #0a0a1f for the inner 8 px.

Inner content: a faint, EVENLY VISIBLE square-dot grid covering the
central 60% of the tile (px 102 to px 410, both axes). Each dot is a
2-px square of #2a3a55, spaced 24 px apart in a clean orthogonal lattice
(NOT hex). Brightness = visible at 40×40 game scale but never bright
enough to compete with the conduit.

Add a single 1-px outer line at #1a2a40 inset 4 px from each edge so
adjacent grass tiles tessellate into a clearly-readable board grid in-game
(this is what tells players "you can place a tower here").

Optional: very subtle dark noise (#0d0d24 jitter, ±5% brightness) over
the inner area for a slight futuristic feel, but no bright streaks.
```

### 2) `str-h.png` — 좌↔우 직선

```
[STYLE CARD]

VARIANT: STRAIGHT-HORIZONTAL.
Connecting edges: LEFT and RIGHT.
Closed edges: TOP and BOTTOM.

The conduit runs from x=0 to x=511 within rows y=154 to y=358.
Data streaks, noise, and pulse packets all flow LEFT→RIGHT along the
horizontal axis. Pattern must be statistically uniform along x so two
str-h tiles placed side-by-side form a SEAMLESS continuous stream
(no visible vertical seam). Match brightness/density at the LEFT edge
(col 0) and RIGHT edge (col 511) so they tile cleanly.

Top edge (rows 0-7) and bottom edge (rows 504-511): pure #0a0a1f.
```

### 3) `str-v.png` — 위↕아래 직선

```
[STYLE CARD]

VARIANT: STRAIGHT-VERTICAL.
Connecting edges: TOP and BOTTOM.
Closed edges: LEFT and RIGHT.

Conduit runs from y=0 to y=511 within columns x=154 to x=358.
Data streaks, noise, and pulse packets all flow TOP↔BOTTOM along the
vertical axis. Statistically uniform along y so stacked str-v tiles form
a SEAMLESS continuous stream. Match brightness/density at top edge
(row 0) and bottom edge (row 511) for clean tiling.

Left edge (cols 0-7) and right edge (cols 504-511): pure #0a0a1f.
```

### 4) `cross.png` — 4-way 교차

```
[STYLE CARD]

VARIANT: CROSS (4-way junction).
ALL FOUR edges connect.

Both conduits (horizontal rows 154-358 and vertical cols 154-358) overlap
at the center, sharing the inner square (x:154-358, y:154-358).

At dead center (x:256, y:256), place a circular NODE — a #B8FFF5 bright
core (40-px diameter) with a thin angular #4ECDC4 ring around it (60-px
outer diameter, 2-px stroke), plus a 12-px outer glow. The node MUST fit
entirely inside the 204×204 inner square (px 154-358 both axes) and must
NOT touch or extend toward the rails. NO hexagon shape.

Data streaks in each of the 4 arms flow toward/away from this node along
that arm's axis. Streaks gracefully fade into the node halo at radius
~30 px from center.
```

### 5) `cor-ne.png` — ┗ (위 + 오른쪽)

```
[STYLE CARD]

VARIANT: CORNER — TOP + RIGHT (┗ shape).
Connecting edges: TOP and RIGHT.
Closed edges: LEFT and BOTTOM.

The conduit enters from the TOP at columns 154-358 (rows 0-?) and exits
to the RIGHT at rows 154-358 (cols ?-511). It curves through a quarter
circle in the upper-right quadrant.

Curve geometry:
  • Inner rail (closer to corner center): radius ≈ 102 px, centered at (358, 154).
  • Outer rail (farther): radius ≈ 306 px, centered at (358, 154).
  • Data streaks between the rails follow the curve as smooth concentric
    arcs (NOT straight tangent segments). Pulse packets ride along these
    arcs. Noise stays uniform.

Critical: at the TOP edge (cols 154-358, rows 0-7), conduit width is
EXACTLY 204 px and fully opaque — identical pixel cross-section to str-v's
top edge. At the RIGHT edge (rows 154-358, cols 504-511), same rule —
identical to str-h's right edge.

Bottom edge and Left edge: pure #0a0a1f for inner 8 px.
```

### 6) `cor-nw.png` — ┛ (위 + 왼쪽)

```
[STYLE CARD]

VARIANT: CORNER — TOP + LEFT (┛ shape).
Mirror of cor-ne about the vertical axis.
Connecting edges: TOP (cols 154-358) and LEFT (rows 154-358).
Curve quadrant: upper-left.
Same conduit width, edge bleed, and rail thickness rules as cor-ne.
```

### 7) `cor-se.png` — ┏ (아래 + 오른쪽)

```
[STYLE CARD]

VARIANT: CORNER — BOTTOM + RIGHT (┏ shape).
Mirror of cor-ne about the horizontal axis.
Connecting edges: BOTTOM (cols 154-358) and RIGHT (rows 154-358).
Curve quadrant: lower-right.
Same rules.
```

### 8) `cor-sw.png` — ┓ (아래 + 왼쪽)

```
[STYLE CARD]

VARIANT: CORNER — BOTTOM + LEFT (┓ shape).
Diagonal mirror of cor-ne.
Connecting edges: BOTTOM (cols 154-358) and LEFT (rows 154-358).
Curve quadrant: lower-left.
Same rules.
```

### 9) `t-n.png` — ┻ (위 + 좌 + 우, 아래 닫힘)

```
[STYLE CARD]

VARIANT: T-JUNCTION — TOP + LEFT + RIGHT (┻ shape, bottom is closed).
Connecting edges: TOP, LEFT, RIGHT.
Closed edge: BOTTOM.

Horizontal main conduit (rows 154-358, full width) connects LEFT↔RIGHT.
Vertical branch (cols 154-358) extends UP from the main conduit to the TOP edge.
The vertical branch terminates at the main conduit; it does NOT extend below.

At the junction (the inner square x:154-358, y:154-358), place a bright
#B8FFF5 circular node (40-px diameter) with a thin angular #4ECDC4 ring
(60-px outer diameter, 2-px stroke) covering the seam. NO hexagon. Node
stays within the inner square. Data streaks from each connected arm fade
into the node halo at ~30 px radius.

BOTTOM edge and inner 8 px: pure #0a0a1f, no conduit material whatsoever.
```

### 10) `t-s.png` — ┳ (아래 + 좌 + 우, 위 닫힘)

```
[STYLE CARD]

VARIANT: T-JUNCTION — BOTTOM + LEFT + RIGHT (┳).
Vertical mirror of t-n. Top is closed.
```

### 11) `t-e.png` — ┣ (위 + 아래 + 오른쪽, 왼쪽 닫힘)

```
[STYLE CARD]

VARIANT: T-JUNCTION — TOP + BOTTOM + RIGHT (┣).
Vertical main conduit connects TOP↔BOTTOM.
Horizontal branch extends RIGHT from the main conduit.
LEFT edge closed.
```

### 12) `t-w.png` — ┫ (위 + 아래 + 왼쪽, 오른쪽 닫힘)

```
[STYLE CARD]

VARIANT: T-JUNCTION — TOP + BOTTOM + LEFT (┫).
Horizontal mirror of t-e. RIGHT edge closed.
```

## 검수 절차 (생성 후 반드시 실행)

각 타일이 도착하면:

1. **Edge cross-section 일치 검사**
   - 모든 LEFT-connect 타일의 col 0 슬라이스가 픽셀 단위로 동일한가?
   - 모든 RIGHT-connect 타일의 col 511 슬라이스가 동일한가?
   - 동일하지 않으면 → 해당 타일 재생성.

2. **Conduit 폭 검사**
   - 직선 타일에서 path가 차지하는 폭(픽셀)을 측정 → 204 ± 4 px이 아니면 재생성.

3. **굵기 일관성 검사 (간이)**
   - str-h, cor-ne, t-n을 한 줄로 늘어놓고 conduit 두께가 변하는지 육안 확인.

4. **갭 0 검사 (게임 빌드)**
   - 새 타일 적용 후 `.tile-path { background-size: 100% 100% }` (102%로 봉합 안 함)으로 돌려놓고 스테이지 진입.
   - 어떤 연결부에서도 검은 줄이 보이면 안 됨.

## 검수 통과 후 적용

```css
/* css/styles.css */
.tile-path {
  background-size: 100% 100%; /* v2 타일은 봉합 트릭 불필요 */
}
```

## 추가 개선 (별건 — 프롬프트와 무관)

- **타워 배치 크기 착시**: 현재 타워 placement footprint = 1×1 타일. conduit이 좁아 grass 타일이 "빈 공간"처럼 보여서 "왜 배치 안 됨?" 혼동을 유발. v2 grass에 격자선이 추가되면 자연스럽게 해결됨.
- **grid 가시성**: v2 grass의 square-dot grid + 1-px cell border로 "여기는 배치 가능 칸"이 명확해질 것.

---

## 🚀 ALL-IN-ONE — 12 타일 한 번에 생성 프롬프트

> 아래 블록 전체를 그대로 이미지 생성기에 붙여넣으면 12개 타일이 4×3 그리드(2048×1536 px)로 한 장에 나옵니다. 받은 후 자동 슬라이서로 분할 → 개별 PNG로 저장하세요.

```
Generate ONE 2048x1536 image arranged as a STRICT 4-column × 3-row grid
of TILES for a neon tower-defense game tileset. Each cell is exactly
512x512 px and is rendered as if it were an independent tile that will be
sliced out and used standalone.

GLOBAL VISUAL — "Neon Data-Stream Conduit" (futuristic, NO hex / NO honeycomb)
A glowing teal conduit, structured outer→inner as:
  1) OUTER RAILS — two parallel cyan rails (#B8FFF5, 5 px thick) at the
     conduit edges with soft #4ECDC4 outer glow (max 6 px, fades to base).
  2) CONDUIT BODY — dark teal interior (#0a2828) filled with a layered
     futuristic texture (NOT a tessellated grid). Stack the following:
       a) DIRECTIONAL DATA STREAKS — thin bright streaks (1–2 px thick,
          #4ECDC4 at 35–55% alpha) running PARALLEL to the conduit flow
          direction. Streak length 30–80 px, spacing varies 3–9 px,
          irregular cadence (NOT a regular grid).
       b) FINE DIGITAL NOISE — per-pixel brightness jitter ±12%, monochrome
          teal, subtle, pure stochastic (no visible repeat / no banding).
       c) PULSE PACKETS — sparse 2–3 px bright #B8FFF5 dots, density ~3%,
          scattered along the streak direction (suggesting data flow).
       d) FAINT SCAN OVERLAY — one or two very low-contrast wide bands of
          #4ECDC4 at 8% alpha sliding along the flow direction.
     ABSOLUTELY NO hexagons, NO honeycomb, NO tessellated cells, NO grid
     pattern, NO repeating geometric shapes inside the conduit.
     The texture should read as "energy flowing through a circuit pipe,"
     not as a paved surface.

ABSOLUTE GEOMETRY (every cell, every tile — IDENTICAL):
  • Tile base color: pure flat #0a0a1f. All 4 corner pixels of every cell = #0a0a1f.
  • Conduit total width = 204 px (40% of 512). NEVER varies between tiles.
  • Conduit edges fall at pixel 154 and pixel 358 along the perpendicular axis.
  • Conduit centerline at pixel 256.
  • Outer rails at px 154–159 and px 353–358.

EDGE RULES (per cell):
  • CONNECTING EDGE: the conduit (rails + interior fill + streaks) reaches
    the cell edge at pixels 154–358 with FULL OPACITY — no fade, no taper,
    no inset. The 0-th pixel column/row inside the 204-px strip is conduit.
  • CLOSED EDGE: that edge and inner 8 px are pure #0a0a1f. No glow bleed,
    no rail crossing, no streak / pulse / scan overlay reaching this edge.

CRITICAL — TREAT EACH CELL AS A SEPARATE TILE:
  • Do NOT let conduits flow ACROSS cell borders within this image.
    Each cell's conduit terminates exactly at its own 512-px edges per the
    rules above. Cells are independent tiles, not panels of one diagram.
  • Pixel-cross-section AT the connecting edge MUST be visually identical
    across cells of the same connection direction (so when the user later
    places a Cell-A right-edge next to a Cell-B left-edge in-game, they
    line up perfectly). Same rail positions, same streak density, same
    brightness.

FORBIDDEN (whole image):
  • Outer frame, border, vignette, drop shadow on the image or any cell.
  • Cell labels, captions, numbers, arrows, text of any kind.
  • Any decorative element wider than 204 px in any axis inside a cell.
  • Junction nodes / center lights extending past px 154 or 358.
  • Different conduit thickness on different cells (visual continuity REQUIRED).
  • Hexagons, honeycomb, tessellation, repeating geometric grids.

CELL CONTENTS — exact placement in the 4×3 grid (column × row, 1-indexed):

ROW 1 (y = 0–511):
  (col 1, row 1) GRASS — closed on all 4 edges. No conduit. Inner 60%
    (px 102–410 both axes) covered with a faint #2a3a55 square-dot grid:
    2-px square dots, 24-px orthogonal spacing. A 1-px #1a2a40 line inset
    4 px from each edge. Optional very subtle dark #0d0d24 noise (±5%
    brightness). Visible at 40×40 game scale, never brighter than conduit.
  (col 2, row 1) STRAIGHT-H — connect LEFT + RIGHT, close TOP + BOTTOM.
    Streaks/noise/pulses flow LEFT→RIGHT, statistically uniform along x
    so two of these tile seamlessly side-by-side.
  (col 3, row 1) STRAIGHT-V — connect TOP + BOTTOM, close LEFT + RIGHT.
    Streaks/noise/pulses flow TOP↔BOTTOM, uniform along y for seamless
    vertical stacking.
  (col 4, row 1) CROSS (4-way) — connect ALL FOUR edges. The horizontal
    band (rows 154–358) and vertical band (cols 154–358) overlap; the
    inner 204×204 square is shared. At dead center place a circular NODE:
    #B8FFF5 core 40-px diameter + a thin angular #4ECDC4 ring of 60-px
    outer diameter (2-px stroke) + 12-px outer glow. Node confined to the
    inner square; NO hexagon. Streaks in each arm fade into the node halo
    around radius ~30 px from center.

ROW 2 (y = 512–1023) — four 90° corners (smooth quarter-circle curves):
  (col 1, row 2) CORNER ┗ — connect TOP + RIGHT, close LEFT + BOTTOM.
    Quarter-circle in upper-right quadrant.
    Inner rail radius ≈ 102 px centered at (358, 154 within the cell).
    Outer rail radius ≈ 306 px centered at the same point.
    Streaks follow concentric arcs between the rails. Pulse packets ride
    these arcs. Noise stays uniform.
    AT TOP EDGE (cols 154–358): cross-section IDENTICAL to STRAIGHT-V's
    top edge. AT RIGHT EDGE (rows 154–358): IDENTICAL to STRAIGHT-H's
    right edge.
  (col 2, row 2) CORNER ┛ — connect TOP + LEFT, close RIGHT + BOTTOM.
    Mirror of ┗ across the vertical axis. Curve in upper-left quadrant.
  (col 3, row 2) CORNER ┏ — connect BOTTOM + RIGHT, close TOP + LEFT.
    Mirror of ┗ across the horizontal axis. Curve in lower-right quadrant.
  (col 4, row 2) CORNER ┓ — connect BOTTOM + LEFT, close TOP + RIGHT.
    Diagonal mirror of ┗. Curve in lower-left quadrant.

ROW 3 (y = 1024–1535) — four T-junctions (3 connect, 1 closed):
  (col 1, row 3) T ┻ — connect TOP + LEFT + RIGHT, close BOTTOM.
    Horizontal main conduit rows 154–358 spans full width LEFT↔RIGHT.
    Vertical branch cols 154–358 extends UP from the main conduit to the
    TOP edge; does NOT extend below the main conduit.
    Junction node at center: same circular node spec as CROSS, confined
    to the inner 204×204 square. NO hexagon. Streaks in each connected
    arm fade into node halo ~30 px from center.
    BOTTOM edge + inner 8 px: pure #0a0a1f, no conduit material.
  (col 2, row 3) T ┳ — connect BOTTOM + LEFT + RIGHT, close TOP.
    Vertical mirror of ┻.
  (col 3, row 3) T ┣ — connect TOP + BOTTOM + RIGHT, close LEFT.
    Vertical main conduit cols 154–358 spans full height TOP↔BOTTOM.
    Horizontal branch rows 154–358 extends RIGHT to the right edge.
    Junction node identical spec. LEFT edge closed.
  (col 4, row 3) T ┫ — connect TOP + BOTTOM + LEFT, close RIGHT.
    Horizontal mirror of ┣.

OUTPUT REQUIREMENTS:
  • Single image, exactly 2048 × 1536 px.
  • Strict 4×3 grid; cell boundaries fall at multiples of 512 px.
  • No visible grid lines, labels, captions, or guides.
  • Each cell is renderable as a standalone 512×512 PNG after slicing.
```

### 슬라이싱 후 파일명 매핑

| 위치 (col, row) | 파일명 |
|---|---|
| (1, 1) | `assets/tiles/path/grass.png` |
| (2, 1) | `assets/tiles/path/str-h.png` |
| (3, 1) | `assets/tiles/path/str-v.png` |
| (4, 1) | `assets/tiles/path/cross.png` |
| (1, 2) | `assets/tiles/path/cor-ne.png` |
| (2, 2) | `assets/tiles/path/cor-nw.png` |
| (3, 2) | `assets/tiles/path/cor-se.png` |
| (4, 2) | `assets/tiles/path/cor-sw.png` |
| (1, 3) | `assets/tiles/path/t-n.png` |
| (2, 3) | `assets/tiles/path/t-s.png` |
| (3, 3) | `assets/tiles/path/t-e.png` |
| (4, 3) | `assets/tiles/path/t-w.png` |

> 일괄 그리드는 conduit 굵기 드리프트 위험이 있습니다. 결과가 일관성 검수(폭 204 ± 4 px, edge cross-section 일치)에 실패하면, 위 §개별 타일 프롬프트로 fallback해서 한 장씩 다시 뽑으세요.
