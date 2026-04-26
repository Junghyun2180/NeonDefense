# Neon Defense 스킨 가이드

게임의 모든 시각 요소는 **PNG 교체만으로** 변경 가능합니다. 코드 수정 없이 `assets/` 하위 PNG만 바꾸면 즉시 반영됩니다.

## 자산 디렉토리 구조

```
assets/
├── towers/                  # 공격 타워 24장 (6속성 × 4티어)
│   ├── fire/t1.png ~ t4.png
│   ├── water/t1.png ~ t4.png
│   ├── electric/t1.png ~ t4.png
│   ├── wind/t1.png ~ t4.png
│   ├── void/t1.png ~ t4.png
│   └── light/t1.png ~ t4.png
│
├── supports/                # 서포트 타워 12장 (4종 × 3티어)
│   ├── damage/t1.png ~ t3.png
│   ├── speed/t1.png ~ t3.png
│   ├── defense/t1.png ~ t3.png
│   └── range/t1.png ~ t3.png
│
├── enemies/                 # 적 8종
│   ├── normal.png            ├── elite.png
│   ├── fast.png              ├── boss.png
│   ├── jammer.png            ├── suppressor.png
│   ├── healer.png            └── splitter.png
│
├── icons/
│   ├── elements/            # 6속성 아이콘 (속성 라디얼 메뉴 + 투사체 orb)
│   │   ├── fire.png   ├── water.png   ├── electric.png
│   │   ├── wind.png   ├── void.png    └── light.png
│   ├── status/              # 상태이상 아이콘 12종 (적 머리 위 + 타워 버프)
│   │   ├── burn.png         ├── slow.png         ├── freeze.png
│   │   ├── stun.png         ├── vulnerability.png├── knockback.png
│   │   ├── pull.png         ├── regeneration.png ├── attackBuff.png
│   │   ├── attackSpeedBuff.png ├── rangeBuff.png ├── attackSpeedDebuff.png
│   └── arrows/              # (선택) 방향 화살표 4종
│       ├── up.png  ├── down.png  ├── left.png  ├── right.png
│
├── tiles/                   # 맵 타일
│   ├── path/                # 모듈러 경로 12종
│   │   ├── grass.png        ├── str-h.png   ├── str-v.png   ├── cross.png
│   │   ├── cor-ne.png ┗     ├── cor-nw.png ┛
│   │   ├── cor-se.png ┏     ├── cor-sw.png ┓
│   │   ├── t-n.png ┻        ├── t-s.png ┳   ├── t-e.png ┣  ├── t-w.png ┫
│   └── points/              # 시작/종료 포털 (투명 PNG, 타일 위 오버레이)
│       ├── start.png        └── end.png
│
└── effects/                 # (선택) 이펙트 PNG — 없으면 CSS 기반 폴백
    ├── explosion.png        ├── hit.png        ├── burn.png
    ├── slow.png             ├── knockback.png  ├── heal.png
    ├── split.png            ├── pierce.png     ├── execute.png
    └── t4-*.png             # T4 특수 이펙트 19종
```

## 명세

### 캐논 방향 규약 (적 스프라이트)

**적 PNG는 반드시 오른쪽(→)을 향하도록 그려야 합니다.**

게임의 facing 로직(`enemy-system.js`)이 다음 규약 기준으로 동작:
- 적이 **오른쪽으로 이동** → flip 없음 (PNG 그대로 → 캐논 방향 = 오른쪽)
- 적이 **왼쪽으로 이동** → CSS `scaleX(-1)` 적용 (좌우 반전)
- 위/아래 이동 → 작은 각도 회전(rotate)

만약 받은 PNG가 왼쪽을 향한다면:
```bash
node scripts/mirror-enemies.js   # 8개 PNG 일괄 좌우 미러링
```

> 외부 자산(Kenney/itch.io 등)도 대부분 오른쪽 facing이 표준이라 그대로 사용 가능.
> 새 적 PNG 추가 시 오른쪽 향하게 그리면 됩니다.

### 권장 사이즈
| 카테고리 | 권장 PNG 크기 | 게임 내 표시 |
|---|---|---|
| 타워 (T1) | 256×256 | 34×34px |
| 타워 (T2) | 256×256 | 38×38px |
| 타워 (T3) | 256×256 | 42×42px |
| 타워 (T4) | 256×256 | 48×48px |
| 서포트 | 256×256 | ~40×40px |
| 적 (normal/fast/...) | 128×128 | 28~32px |
| 적 (elite) | 128×128 | 38px |
| 적 (boss) | 128×128 | 48px |
| 속성 아이콘 (orb) | 64×64 | 20×20px (투사체) |
| 상태 아이콘 | 32×32 | 12~14px |
| 화살표 | 32×32 | 16~18px |
| 타일 (path/grass) | 160×160 | 40×40px (이음새 없도록) |
| 시작/종료 포털 | 160×160 | 40×40px (투명 배경) |
| 이펙트 | 128×128 | 30~50px (effect.radius에 따라) |

### 투명도
- **시작/종료 포털**: 반드시 투명 배경 (path 타일 위에 오버레이)
- **이펙트**: 투명 배경 권장 (게임 화면에 오버레이)
- **타워/적/서포트**: 투명 배경 권장 (배경 타일 보임)
- **타일**: **불투명** (단, path 타일은 4코너 픽셀이 grass와 일치해야 자연스러움)

### 폴백 동작
PNG가 없으면 다음 순서로 폴백:
- **타워/서포트**: 색깔 원형 + 이모지 글리프
- **적**: `ENEMY_CONFIG`의 색상 사각형
- **이펙트**: CSS `radial-gradient` + 애니메이션
- **화살표**: 유니코드 ▶◀▲▼ + 글로우
- **타일**: 레거시 `path-tile.png` / `grass-tile.png` (단일 이미지)

따라서 일부 PNG만 있어도 게임은 정상 동작합니다.

### 스킨 교체 워크플로
1. `assets/` 하위 원하는 PNG를 같은 경로/이름으로 덮어쓰기
2. 브라우저 새로고침 (캐시 강제 새로고침: Ctrl+F5)
3. 끝.

## 수정되지 않은 시각 요소 (스킨 불가)

다음은 동적 렌더링이라 PNG로 대체할 수 없습니다:
- **체인 라이트닝**: SVG line (두 점 연결, 동적 좌표)
- **타워 사거리 원**: 타워 색상 기반 radial-gradient
- **잼머/서프레서 디버프 오라**: 적 위치 기반 radial-gradient
- **HP 바**: 상태 기반 너비 계산
- **이펙트 애니메이션 자체** (회전/확장 동작): CSS keyframes

이들은 동적/시스템적 요소이므로 코드 수정이 필요합니다.
