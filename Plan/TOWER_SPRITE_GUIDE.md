# NeonDefense — 타워 스프라이트 아트 가이드

> Fire 타워 4티어(T1~T4)가 이미 통합되어 있음 (assets/towers/fire/).
> 나머지 5속성을 동일 스타일로 생성하기 위한 프롬프트/가이드.

---

## 스타일 상수 (모든 속성 공통)

| 요소 | 값 |
|------|-----|
| **해상도** | 1024×1024 → 256×256로 다운스케일 사용 |
| **배경** | 완전 투명 (PNG, RGBA) |
| **뷰 각도** | 약 3/4 탑뷰 (45도 내려본 각도) |
| **받침대 재질** | 다크 메탈릭 + 그라데이션 엣지 |
| **받침대 형태** | 팔각형/육각형 단(platform), 티어 올라갈수록 층 ↑ |
| **티어별 구조** | T1: 1층 + 단일 코어 / T2: 2층 + 3코어 / T3: 3층 + 4~5코어 / T4: 3-4층 + 3코어 + 에너지링 |
| **라인아트** | 밝은 네온 엣지 라인 (속성 컬러) |
| **글로우** | 코어/이펙트에서 발산 |
| **이펙트 위치** | 코어 상단에 속성별 이펙트 분출 |

---

## 4티어 공통 설계 원칙

### Tier 1 — 초입
- 1개의 작은 코어만
- 받침대 1층 (간소)
- 이펙트 작음, 색상은 밝지만 규모 작음

### Tier 2 — 확장
- 코어 **3개** (삼각형 배치, 중앙 + 양옆)
- 받침대 2~3층
- 코어 각각에서 이펙트 분출
- 크기 약 130% T1

### Tier 3 — 성숙
- 코어 **4~5개** (중앙 1 + 주변 3~4)
- 받침대 3층
- 작은 보조 이펙트 추가 (하단에도)
- 크기 약 150% T1

### Tier 4 — 각성
- 코어 **3개** (집중형, 중앙 크고 양옆 작게)
- 받침대 **에너지 링** (중단~하단에 회전하는 색 오라)
- 받침대 3-4층 + 바닥 플랫폼 확장
- 크기 약 175% T1

---

## 속성별 프롬프트

### 🔥 Fire (완료)
이미 완성. 받침대 검정/붉은 균열 광채, 코어는 오렌지 불꽃, 링은 오렌지-적색.

### ❄️ Water (냉기)
```
4 tier progression of ice crystal tower, isometric 3/4 view,
dark steel platform with frost-cracked edges, cyan-blue glowing cores
emitting icy mist and snowflake particles, jagged ice shards growing
from each core, blue neon rim light, transparent background, 1024x1024
sprite sheet in 2x2 grid. T1: single small crystal core, 1-tier base.
T2: three crystal cores arranged in triangle, 2-tier base with frost runes.
T3: four to five crystal cores plus small secondary shards below, 3-tier base.
T4: three concentrated crystal cores with rotating blue energy ring around
the base, most elaborate tier with thick ice armor platform.
Cool blue (#45B7D1) as primary accent. Consistent dark metallic base
across all tiers. Clean neon game-art style, not photorealistic.
```

### ⚡ Electric (전격)
```
4 tier progression of plasma coil tower, isometric 3/4 view,
dark chrome platform with copper-yellow circuitry etchings, bright yellow
lightning arcs emitting from cores, Tesla-coil-like vertical antennas,
yellow-gold neon rim light, small blue plasma balls inside cores,
transparent background, 1024x1024 sprite sheet in 2x2 grid.
T1: single coil with one arc. T2: three coils in triangle, visible
lightning bolts connecting them. T3: four to five coils, arcs jumping
between multiple cores. T4: three focused coils with golden energy ring
rotating at base, bolts spiraling outward.
Golden yellow (#FFD93D) as primary accent, occasional blue plasma highlights.
Consistent dark chrome base. Clean neon game-art style.
```

### 🌪️ Wind (질풍)
```
4 tier progression of wind vortex tower, isometric 3/4 view,
dark slate platform with jade-green carved wind sigils, swirling green
wind currents emitting from cores, visible air turbulence lines,
emerald-mint neon rim light, small tornado cores, transparent background,
1024x1024 sprite sheet in 2x2 grid.
T1: single small vortex core. T2: three vortex cores in triangle,
connected by wind streams. T3: four to five vortexes with secondary
wind gusts below. T4: three concentrated vortexes with rotating green
energy ring around base, large swirling aura.
Jade green (#96E6A1) as primary accent. Consistent dark slate base.
Clean neon game-art style, dynamic feel.
```

### 🌀 Void (공허)
```
4 tier progression of void rift tower, isometric 3/4 view,
dark obsidian platform with purple cosmic cracks, deep violet swirling
dimensional rifts as cores, stars/galaxy particles swirling around,
lavender neon rim light, floating geometric shards around cores,
transparent background, 1024x1024 sprite sheet in 2x2 grid.
T1: single small rift portal. T2: three rift portals in triangle,
portals distorting reality between them. T3: four to five rifts with
secondary micro-portals. T4: three concentrated rifts with rotating
purple event horizon ring, reality-bending distortion visible.
Lavender purple (#DDA0DD) as primary accent. Consistent obsidian-black base.
Clean neon game-art style, cosmic/eldritch feel.
```

### 💎 Light (광휘)
```
4 tier progression of prism beam tower, isometric 3/4 view,
dark platinum platform with pearl-white inlays, brilliant white-silver
glowing crystal cores, light beams shooting upward, holy aura,
white-silver neon rim light, small floating light orbs around cores,
transparent background, 1024x1024 sprite sheet in 2x2 grid.
T1: single small prism crystal. T2: three prisms in triangle,
light beams bouncing between them. T3: four to five prisms with secondary
smaller crystals. T4: three concentrated prisms with rotating rainbow
energy ring at base, radiant halo.
Silver-white (#C0C0C0) as primary accent with rainbow highlights.
Consistent dark platinum base. Clean neon game-art style, sacred feel.
```

---

## 사후 편집

각 프롬프트 결과를 받은 후:

1. **2×2 그리드로 분할** — Python 스크립트 제공:
   ```bash
   python3 tests/scripts/split-tower-sheet.py <input.png> <element_name>
   ```
   (현재 Fire 분할 로직 재사용)

2. **파일 배치**:
   ```
   assets/towers/water/t1.png ~ t4.png
   assets/towers/electric/t1.png ~ t4.png
   assets/towers/wind/t1.png ~ t4.png
   assets/towers/void/t1.png ~ t4.png
   assets/towers/light/t1.png ~ t4.png
   ```

3. **빌드**: `npm run build` — dist/assets/도 자동 복사됨

4. **테스트**:
   - 게임 실행 후 치트: `give 3 water 3` → 인벤에 Water T3 3개
   - 또는 E2E: `node tests/e2e/sprite-render.js` (Fire 기준, element 0 → 1~5 바꿔서 검증)

---

## 품질 체크리스트

각 스프라이트 통합 후 확인:
- [ ] 투명 배경 (PNG 알파 채널)
- [ ] 타일 64×64 사이즈에서 실루엣 알아볼 수 있음
- [ ] 동일 속성 내 T1→T4 스케일 점진 증가 (T1 대비 T4 약 175%)
- [ ] 속성 컬러 일관성 (다른 속성과 혼동 없어야)
- [ ] 받침대 형태/재질이 Fire와 호환 (같은 게임 세계 느낌)
- [ ] 코어 수: T1=1, T2=3, T3=4~5, T4=3(집중)
- [ ] T4만 에너지 링 이펙트

---

## 비용 추산

| 방법 | 시간 | 비용 |
|------|------|------|
| AI (Midjourney v6 / DALL-E 3) | 30분~1시간 per 속성 × 5 = 2.5~5시간 | ~$20 (구독 포함) |
| Fiverr 2D artist | 3~7일 | $100~300 |
| 크몽 프리랜서 | 1~2주 | ₩150만~₩300만 |

**5속성 모두 완료 시 예상 시각 퀄리티 향상 효과**: 게임 리뷰 평점 **3.3→4.0** 예상 (Fire 통합 이후 체감 이미 확실함)

---

## 다음 에셋 (우선순위 순)

1. **나머지 5속성 타워** (가장 시급, 20장) ← 이번 프롬프트
2. **적 유닛 스프라이트** (8종 × 2~3 프레임 = ~20장)
3. **서포트 타워** (4종 × 3티어 = 12장)
4. **보스 3~6종** (6장)
5. **이펙트 시트** (폭발/체인/슬로우 애니메이션)
6. **배경 타일 5종** (스테이지별 교체)
