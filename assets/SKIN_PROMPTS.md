# Neon Defense - 이미지 제작 프롬프트 모음

이번 세션에서 ChatGPT 이미지 생성에 사용한 프롬프트 전체 보관. 동일 스타일로 추가 자산을 만들거나 다른 게임에 재사용할 때 참고.

---

## 1. 모듈러 타일셋 (12 path 타일 + grass)

### 공통 스타일 카드 (모든 타일 프롬프트 맨 앞에 붙여 쓰기)

```
Generate a SINGLE 512x512 tile image for "Neon Defense" path tileset.
Top-down orthographic view. Base: pure flat #0a0a1f.

VISUAL DESIGN — "Neon Hex-Conduit" (match this exactly):
The path is a glowing TEAL CONDUIT with an internal honeycomb mesh.
Structure (outer → inner):

  1) OUTER RAILS: two bright parallel cyan rails (#B8FFF5, ~4-6px thick)
     running along BOTH edges of the conduit with strong outer bloom glow
     (#4ECDC4 halo fading to #0a0a1f).
  2) CONDUIT BODY: ~30% of tile width, bounded by the two rails.
     Dark teal interior (#0a2828) — slightly brighter than the tile base.
  3) HEX MESH FILL: the interior is filled with a honeycomb grid of
     elongated hexagons, hex cells ~40-50px tall, outlined in glowing
     teal (#4ECDC4) with thin strokes (~2px). The hex orientation follows
     the conduit direction (vertical hexes in vertical segments,
     horizontal-flow hexes in horizontal segments).
  4) SUBTLE DETAIL: occasional brighter hex cell (like an energized node),
     very faint chromatic aberration on outer rails.

HARD RULES (must obey):
- Design is ENTIRELY SELF-CONTAINED within this 512x512 tile.
- All 4 corner pixels of the tile = pure flat #0a0a1f.
- At edges where the conduit CONNECTS, the conduit (both rails + hex fill)
  reaches EXACTLY the middle 30% strip of that edge, so it lines up with
  a neighboring tile of the same style.
- At edges where the conduit does NOT connect, the entire edge = pure #0a0a1f
  (no glow, no rails, no hex pattern leaking out).
- At CORNERS, both outer rails curve smoothly (inner rail has tighter radius,
  outer rail has wider radius — like a real track), and the hex mesh inside
  curves with them, remaining continuous.
- At JUNCTIONS (cross, T), the rails split cleanly, and a glowing hexagonal
  NODE (bright #B8FFF5 core) sits at the junction center covering the seam.
- No frames, no outer borders, no ornaments, no text, no arrows.
```

### 개별 타일 프롬프트 (위 스타일 카드 뒤에 붙임)

> **🟢 권장 워크플로**: 12개를 4×3 그리드 한 장으로 한 번에 생성 → 자동 슬라이서(`scripts/split-modular-tileset.js`)로 분할.
> 그리드 생성 시 코너끼리 셀 경계를 무시하고 이어진 곡선으로 그려질 수 있으므로, 안 되면 **타일별 개별 생성**으로 fallback.

#### Grid 한방 생성 프롬프트

```
[USE STYLE CARD ABOVE]

Output: one image, 4x3 grid = 12 cells, each cell 512x512.

Row 1: Grass · Straight-H · Straight-V · Cross
  (1,1) GRASS — no conduit, faint hex dot grid in inner 40%, 4 corners flat
  (1,2) STRAIGHT-H — conduit LEFT↔RIGHT only, hex flows horizontally
  (1,3) STRAIGHT-V — conduit TOP↔BOTTOM only, hex flows vertically
  (1,4) CROSS — connects all 4 edges with hex node at center

Row 2 (4 corners, smooth 90° curves):
  (2,1) CORNER — TOP+RIGHT  (┗ shape)
  (2,2) CORNER — TOP+LEFT   (┛ shape)
  (2,3) CORNER — BOTTOM+RIGHT (┏ shape)
  (2,4) CORNER — BOTTOM+LEFT  (┓ shape)

Row 3 (4 T-junctions):
  (3,1) T — LEFT+RIGHT+TOP    (┻ bottom closed)
  (3,2) T — LEFT+RIGHT+BOTTOM (┳ top closed)
  (3,3) T — TOP+BOTTOM+RIGHT  (┣ left closed)
  (3,4) T — TOP+BOTTOM+LEFT   (┫ right closed)
```

#### 개별 타일 프롬프트 (그리드 실패 시 백업)

```
TILE: STRAIGHT-H — conduit connects LEFT and RIGHT only.
TILE: STRAIGHT-V — conduit connects TOP and BOTTOM only.
TILE: CROSS — conduit connects all 4 edges, glowing hex node at intersection.
TILE: CORNER-NE — connects TOP and RIGHT only (┗).
TILE: CORNER-NW — connects TOP and LEFT only (┛).
TILE: CORNER-SE — connects BOTTOM and RIGHT only (┏).
TILE: CORNER-SW — connects BOTTOM and LEFT only (┓).
TILE: T-N — connects LEFT+RIGHT+TOP, glowing hex node at junction (bottom closed).
TILE: T-S — connects LEFT+RIGHT+BOTTOM, hex node at junction (top closed).
TILE: T-E — connects TOP+BOTTOM+RIGHT, hex node at junction (left closed).
TILE: T-W — connects TOP+BOTTOM+LEFT, hex node at junction (right closed).
TILE: GRASS — no conduit, faint cyan hex dot grid in inner 40%, 4 corners flat.
```

---

## 2. Start / End 포털 (1×2 그리드)

### 공통 스타일 카드

```
Generate a single 512x512 tile-overlay icon for "Neon Defense."
Top-down orthographic. This image will be LAYERED ON TOP of an existing
hex-conduit path tile in a 2D tower-defense grid, so:

• BACKGROUND MUST BE FULLY TRANSPARENT (alpha 0).
  NO dark fill, NO black square, NO glow spilling into the 4 corners.
• The 4 corner pixels = transparent.
• Design confined to the INNER 70% of the frame; fades cleanly to transparent
  before reaching any edge.
• Visual language matches the existing path tileset:
  - Same teal neon (#4ECDC4) accents at base
  - Same bright cyan cores (#B8FFF5)
  - Same subtle hex-mesh detailing
  - Same metallic dark rim style
  Only the CORE color changes per variant (green for Start / red for End).
• Read as "something embedded INTO the floor tile," not a separate hovering
  hologram. Think "a teleport pad recessed flush with the conduit."
• NO wide outer rings, NO far-flung sparkle particles, NO rain-like streams.
  Keep it compact and contained.
```

### Start (스폰 패드)

```
[USE STYLE CARD ABOVE]

VARIANT: SPAWN PAD (Start Point)

Central element: a small hexagonal emitter pad (~40% of frame width)
sitting flush on the floor, ringed by 2-3 concentric teal hex-wire rings
that match the existing tile's hex-mesh thickness. From the pad's center,
a vivid GREEN (#4ADE80) energy core glows outward — like a power cell
embedded in the tile surface. A thin, short upward beam (no wider than
the hex cells) rises ~30% of the frame height then fades out.

Color rules:
• Outer rings / frame = same teal #4ECDC4 (matches tiles)
• Inner hex panels around the core = subtle green tint blending to teal
• Core bulb = bright neon green #4ADE80 with soft outer glow
• No other bright colors, no outer particle storm
```

### End (드레인 패드)

```
[USE STYLE CARD ABOVE]

VARIANT: DRAIN PAD (End Point)

Central element: a small hexagonal sink pad (~40% of frame width) sitting
flush on the floor, with 2-3 concentric teal hex-wire rings (mirror of Start).
The pad's center has a small circular "drain hole" — darker than the base
tile, with a RED/MAGENTA (#EF4444) glowing rim pulling inward. A few short,
faint inward arrows or converging lines inside the inner 40% suggest flow
TOWARD the center (opposite of Start's outward beam).

Color rules:
• Outer rings / frame = same teal #4ECDC4 (matches tiles)
• Inner hex panels = subtle red tint blending to teal
• Drain rim = bright neon red #EF4444 with soft outer glow
• Center is DARKER than the tile base (a "hole" effect)
• No wide outer rings, no particle storm
```

> **⚠️ 후처리 필수**: AI 모델이 "transparent background"를 체커보드 패턴으로 잘못 그리는 경우가 많음.
> 생성 후 `scripts/make-points-transparent.js`로 채도 기반 체커보드 → 실제 알파 0 변환.

---

## 3. (참고) 이전 시도 — 단일 path 타일 v1

> 이 버전은 "사다리 효과" 문제로 폐기됨. 현재는 위 모듈러 시스템을 사용.
> 보존 목적으로만 기록.

```
Generate 4 map tiles for "Neon Defense" in a single 2x2 grid image.
Each cell 512x512 (final in-game 40x40). Top-down, orthographic.

GLOBAL BASE COLOR: solid deep navy #0a0a1f.
This exact color MUST fill the outer 20% margin of EVERY tile with NO variation.
All decorative detail lives ONLY in the inner 60% area.

GRID:
[Top-Left: GRASS] [Top-Right: PATH]
[Bot-Left: START] [Bot-Right: END]

(상세 생략 — 자세한 건 git history)
```

---

## 4. (미사용) 추가 아이디어

다음은 향후 자산 추가 시 활용 가능한 프롬프트 토대.

### 이펙트 PNG (28종 — `assets/effects/{type}.png`)

```
Generate a 256x256 transparent PNG game effect sprite for "Neon Defense."
Top-down, no background. Style: cyberpunk neon glow, soft particle bloom.

EFFECT: <type>
  - explosion: orange-yellow radial blast, jagged outer edges, debris specks
  - hit: small white-cyan flash, 4-pointed star shape
  - burn: red-orange flame puff with rising sparks
  - slow: blue snowflake particles forming a slow swirl
  - knockback: magenta shockwave ring expanding outward
  - heal: green plus-cross + ascending sparkle dust
  - split: violet diamond bursting into 4 fragments
  - pierce: cyan directional dash with motion blur lines
  - execute: gold/white star with radial light rays

The icon should be most visible when scaled to 30-50px.
Center the design; fade to fully transparent at the edges.
```

### 화살표 PNG (4종 — `assets/icons/arrows/{dir}.png`)

```
Generate a 64x64 transparent PNG navigation arrow icon for "Neon Defense."
Style: bright neon glyph, top-down orthographic, soft outer glow.

VARIANT: <up/down/left/right>
  - Solid teal #4ECDC4 fill with bright #B8FFF5 inner highlight
  - Drop-shadow style outer glow
  - Pointing in the named direction (up.png arrows up, etc.)
  - Same silhouette across all 4 (just rotated)

Background: fully transparent.
Inner art occupies 60% of frame; fades out at edges.
```

---

## 5. 사용된 색상 토큰

| 용도 | HEX | 설명 |
|---|---|---|
| 베이스 (타일/배경) | `#0a0a1f` | Deep navy black |
| 콘듀잇 메인 | `#4ECDC4` | Teal neon (cyan-green) |
| 콘듀잇 코어 | `#B8FFF5` | Bright cyan-white highlight |
| 콘듀잇 내부 어두움 | `#0a2828` | Dark teal panel |
| Start 코어 | `#4ADE80` | Neon green |
| End 코어 | `#EF4444` | Neon red |
| End 보조 | `#EC4899` | Magenta highlight |
| 메탈릭 림 | `#2a4a4a` | Dark teal-gray seam |

이 색상 팔레트를 유지하면 신규 자산이 기존과 어울려 보입니다.

---

## 6. AI 이미지 생성 시 주의사항 (실전 노하우)

이번 세션에서 발견한 함정들:

1. **"Transparent background" 요청 → 체커보드 그림** — AI가 투명 표시용 체커보드 패턴을 실제로 그려버림. **반드시 후처리로 알파 변환** (채도 ≤ 0.15 + 밝기 ≥ 120 픽셀을 alpha 0).
2. **"Seamless tile" 요청 → 셀마다 자기 프레임 추가** — 각 타일에 장식적 테두리가 생김. **명시: "All 4 corner pixels = pure flat #0a0a1f"**, "No frames, no borders".
3. **그리드 생성 시 코너가 셀 경계를 넘어 이어짐** — AI가 4개 코너를 하나의 곡선 시퀀스로 보고 U자/工자로 그림. **셀 독립성 강조** ("Design is ENTIRELY SELF-CONTAINED within this single tile").
4. **헥사 메쉬가 흐름과 수직** — 가로 콘듀잇에 세로 헥사가 들어가면 회전 시 사다리 모양. **흐름 방향과 평행한 헥사 명시**.
5. **셀 가장자리 페이드** — 타일링 시 어두운 줄이 보임. **"reaches EXACTLY the middle 30% strip of that edge"** 명시 + 후처리로 행 평균 정렬.

---

## 7. 검증 체크리스트

생성된 이미지를 받으면 다음 확인:

- [ ] 4코너 픽셀이 단색인지 (포털은 알파 0, 타일은 `#0a0a1f`)
- [ ] 연결되지 않는 엣지 전체가 깨끗한지 (글로우 누출 없음)
- [ ] 연결되는 엣지에서 콘듀잇이 **중앙 30%** 구간에 정확히 위치
- [ ] 타일을 직접 격자로 깔아 봤을 때 이음새가 안 보이는지
- [ ] 같은 시리즈의 다른 타일과 색·두께·헥사 메쉬가 일치하는지

체크 실패 → "Regenerate. The [X] edge must be entirely pure flat #0a0a1f with no glow." 한 줄로 재생성 요청.
