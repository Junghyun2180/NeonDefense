# Neon Defense — 타일셋 v3 생성 프롬프트 (직각 코너 / 일괄 생성)

> v2 문제: 곡선 코너의 conduit 중심이 타일 정중앙을 벗어나 직선과 어긋남. v3는 **곡선 제거 + 직각 코너 + 12 타일 일괄 생성**으로 정렬을 강제한다.

## 핵심 변경
- **코너**: 부드러운 곡선 → **하드 90° 직각**. 수직 conduit과 수평 conduit이 타일 중심에서 만나 정확히 90°로 꺾인다. fillet/rounding 절대 금지.
- **일괄 생성**: 12 타일을 한 장의 4×3 그리드(2048×1536 px)로 한 번에 생성. 모든 타일이 같은 batch에서 나와야 conduit 굵기가 일치.

## 픽셀 정렬 스펙 (절대 변경 불가)
- 셀 크기: 512×512
- conduit 굵기: 정확히 **타일의 40% = 204 px** (모든 셀 동일)
- conduit 중심선: 타일/셀 정중앙 (px 256)
- conduit 가장자리: **px 154 ~ px 358** (= 256 ± 102)
- 직각 코너: 수직 conduit(cols 154–358)과 수평 conduit(rows 154–358)이 타일 중앙의 **204×204 정사각형**(x:154–358, y:154–358)에서 겹침. 이 안쪽이 코너 junction.
- base 색: `#0a0a1f` (모든 타일 4 모서리)

---

## 🚀 ALL-IN-ONE 프롬프트 (이 블록만 그대로 붙여 쓰면 됨)

```
Generate ONE 2048x1536 image arranged as a STRICT 4-column × 3-row grid
of TILES for a neon tower-defense game tileset. Each cell is exactly
512x512 px. Cells will be sliced apart and used as standalone tiles —
treat every cell as an independent tile, not as panels of a single picture.

GLOBAL VISUAL — "Neon Data-Stream Conduit" (futuristic, NO hex / NO honeycomb)
A glowing teal conduit composed of (outer → inner):
  1) OUTER RAILS — two parallel cyan rails (#B8FFF5, 5 px thick) running
     along both edges of the conduit, with a soft #4ECDC4 outer glow
     (max 6 px, fades to base).
  2) CONDUIT BODY — dark teal interior (#0a2828) filled with a layered
     futuristic texture (NOT a tessellated grid):
       a) DIRECTIONAL DATA STREAKS — thin bright streaks (1–2 px thick,
          #4ECDC4 at 35–55% alpha) running PARALLEL to the conduit flow
          direction. Length 30–80 px, irregular spacing 3–9 px.
       b) FINE DIGITAL NOISE — per-pixel brightness jitter ±12%, monochrome
          teal, pure stochastic (no visible repeat / no banding).
       c) PULSE PACKETS — sparse 2–3 px bright #B8FFF5 dots (~3% density)
          along streak direction.
       d) FAINT SCAN OVERLAY — 1–2 very low-contrast wide bands of
          #4ECDC4 at 8% alpha sliding along flow direction.
     ABSOLUTELY NO hexagons, honeycomb, tessellation, or repeating
     geometric grids inside the conduit.

ABSOLUTE GEOMETRY — IDENTICAL ACROSS EVERY CELL:
  • Conduit width = exactly 204 px (40% of 512). NEVER varies.
  • Conduit edges fall at pixel 154 and pixel 358 along the perpendicular axis.
  • Conduit centerline at pixel 256 (cell-local coords).
  • Outer rails at px 154–159 and px 353–358.
  • Tile base color #0a0a1f. All 4 corner pixels of every cell = #0a0a1f.

EDGE RULES (per cell):
  • CONNECTING EDGE: conduit (rails + interior fill + streaks) reaches the
    cell edge with FULL OPACITY across pixels 154–358 — no fade, taper, or
    inset. The 0-th pixel column/row inside that 204-px strip is fully
    saturated conduit pixels matching a neighbor cell's identical strip.
  • CLOSED EDGE: that edge and the inner 8 px are pure #0a0a1f. No glow
    bleed, no rail crossing, no streak / pulse / scan reaching this edge.

CORNERS ARE RIGHT-ANGLE (HARD 90° TURN — NOT CURVED):
  Where two perpendicular conduits meet inside a cell, they meet at a
  HARD 90° ANGLE — straight vertical conduit and straight horizontal
  conduit overlap precisely on the central 204×204 square (x:154–358,
  y:154–358). NO arcs, NO quarter-circles, NO rounded fillets, NO curves
  of any kind. The two conduits read as two perpendicular pipes overlapping
  at right angles. The outer rails of each leg are clipped exactly at the
  intersection — they do NOT round into each other.

JUNCTION NODES (only at intersection cells: cross + 4 T-junctions + 4 corners):
  At dead center of the cell (x=256, y=256), place a single circular NODE:
  #B8FFF5 bright core (40 px diameter) + thin angular #4ECDC4 ring
  (60 px outer diameter, 2 px stroke) + 12 px outer glow. The node MUST
  fit entirely inside the central 204×204 inner square. NO hexagons.
  Streaks in each connected arm gracefully fade into the node halo around
  radius ~30 px from center.

FORBIDDEN (image-wide):
  • Outer frame, vignette, drop shadow on the image or any cell.
  • Cell labels, captions, numbers, arrows, text of any kind.
  • Any decorative element wider than 204 px in any axis inside a cell.
  • Curves, arcs, fillets, rounded corners — corners must be HARD 90°.
  • Hexagons, honeycomb, tessellation, repeating geometric grids.
  • Different conduit thickness on different cells.
  • Conduit flowing across cell borders within this image — every cell
    is an independent tile.

CELL CONTENTS — strict 4×3 layout, 1-indexed (col, row):

ROW 1 (y = 0–511):
  (col 1, row 1) GRASS — closed all 4 edges. No conduit at all. Inner 60%
    (px 102–410 both axes) covered with a faint #2a3a55 square-dot grid:
    2 px square dots, 24 px orthogonal spacing (NOT hex). One 1 px
    #1a2a40 line inset 4 px from each edge to give a clear cell boundary.
    Optional very subtle dark #0d0d24 noise (±5% brightness). Visible at
    40×40 game scale, but never bright enough to compete with conduit.
  (col 2, row 1) STRAIGHT-H — connect LEFT + RIGHT only, close TOP + BOTTOM.
    Streaks/noise/pulses flow LEFT→RIGHT. Statistically uniform along x
    so two of these tile seamlessly side-by-side.
  (col 3, row 1) STRAIGHT-V — connect TOP + BOTTOM only, close LEFT + RIGHT.
    Streaks/noise/pulses flow TOP↔BOTTOM. Statistically uniform along y
    for seamless vertical stacking.
  (col 4, row 1) CROSS (4-way junction) — connect ALL 4 edges. Horizontal
    band rows 154–358 and vertical band cols 154–358 overlap on the
    central 204×204 square (HARD RIGHT ANGLES at the four interior corners
    of this overlap — no rounding). Junction node at center.

ROW 2 (y = 512–1023) — FOUR HARD-90° CORNERS (NOT CURVED):
  (col 1, row 2) CORNER ┗ — connect TOP + RIGHT, close LEFT + BOTTOM.
    Vertical conduit (cols 154–358) runs from TOP edge down to row 358.
    Horizontal conduit (rows 154–358) runs from col 154 right to RIGHT edge.
    They overlap on the central 204×204 square (x:154–358, y:154–358).
    The overlap region is a hard-corner inside-bend at the inner corner
    pixel (x=358, y=358) — no fillet, no rounding. Junction node at center.
    Outside the conduit: pure #0a0a1f.
  (col 2, row 2) CORNER ┛ — connect TOP + LEFT, close RIGHT + BOTTOM.
    Vertical leg (cols 154–358) runs TOP edge → row 358.
    Horizontal leg (rows 154–358) runs col 154 ← LEFT edge.
    Overlap on central 204×204 square. Hard right-angle bend at (x=154, y=358).
  (col 3, row 2) CORNER ┏ — connect BOTTOM + RIGHT, close TOP + LEFT.
    Vertical leg runs row 154 → BOTTOM edge.
    Horizontal leg runs col 154 → RIGHT edge.
    Hard right-angle bend at (x=358, y=154).
  (col 4, row 2) CORNER ┓ — connect BOTTOM + LEFT, close TOP + RIGHT.
    Vertical leg runs row 154 → BOTTOM edge.
    Horizontal leg runs col 154 ← LEFT edge.
    Hard right-angle bend at (x=154, y=154).

ROW 3 (y = 1024–1535) — FOUR T-JUNCTIONS (3 connected, 1 closed):
  (col 1, row 3) T ┻ — connect TOP + LEFT + RIGHT, close BOTTOM.
    Horizontal main conduit rows 154–358 spans full width LEFT↔RIGHT.
    Vertical branch cols 154–358 extends UP from the main conduit to TOP edge.
    Branch terminates at the main conduit; does NOT extend below.
    Junction node at center. BOTTOM edge + inner 8 px: pure #0a0a1f.
  (col 2, row 3) T ┳ — connect BOTTOM + LEFT + RIGHT, close TOP.
    Vertical mirror of ┻.
  (col 3, row 3) T ┣ — connect TOP + BOTTOM + RIGHT, close LEFT.
    Vertical main conduit cols 154–358 spans full height TOP↔BOTTOM.
    Horizontal branch rows 154–358 extends RIGHT to right edge.
    Junction node at center. LEFT edge closed.
  (col 4, row 3) T ┫ — connect TOP + BOTTOM + LEFT, close RIGHT.
    Horizontal mirror of ┣.

OUTPUT REQUIREMENTS:
  • Single image, exactly 2048 × 1536 px.
  • Strict 4×3 grid; cell boundaries fall at multiples of 512 px.
  • No visible grid lines, labels, captions, or guides.
  • Each cell is renderable as a standalone 512×512 PNG after slicing.
  • Treat every cell as an independent tile — no conduit flows across
    cell borders within this image.
```

---

## 슬라이싱 후 파일명 매핑

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

## 적용 절차

1. 위 ALL-IN-ONE 블록을 이미지 생성기에 그대로 입력
2. 결과(2048×1536 PNG) → `Saved/src/tileset_v3.png` 로 저장
3. 자동 슬라이서 실행 (4×3 그리드 → 12개 512×512 PNG)
4. CSS의 `background-size: cover` 그대로 사용 (봉합 트릭 불필요)
5. 게임에서 검증 — 직각 코너로 인해 모든 연결부가 완벽히 정렬되어야 함

## 검수 포인트 (직각 코너 버전)

- conduit 폭이 모든 12 셀에서 동일한가? (204 ± 4 px)
- 코너 4종이 모두 곡선이 아닌 직각인가?
- corner의 두 leg가 정확히 cols 154–358 / rows 154–358에 위치하는가?
- 직선/T/cross/corner를 인접 배치했을 때 conduit이 1픽셀 어긋남 없이 이어지는가?

## 디자인 의도

- **직각 코너 = 픽셀 정렬 자동 보장**: 곡선은 AI가 미세하게 비뚤어지기 쉬움. 직선만으로 구성하면 conduit 위치는 cols/rows 154–358만 지키면 됨.
- **사이버펑크/회로기판 룩**: 직각 turn은 PCB 트레이스나 디지털 회로의 시각 언어와 맞아떨어짐. 부드러운 곡선보다 "데이터가 흐르는 회로"라는 컨셉에 더 부합.
- **junction node가 시각적 포커스**: 코너에서도 중앙 노드를 두면, 모든 방향 변경 지점이 일관된 시각 anchor를 갖게 됨.
