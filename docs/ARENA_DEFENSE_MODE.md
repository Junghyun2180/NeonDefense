# 아레나 디펜스 모드 (Arena Defense Mode) 기획서

> 작성일: 2026-05-05
> 상태: 초안 (구현 착수 전 확정 필요 항목 있음 — 7장 Open Questions 참고)
> 관련 합의: design-proposals/ 10-meeting-saurom-tower-corrected.md (런 독립 모드 패턴)

---

## 1. 개요 / 컨셉 한 줄 요약

"코어를 사방에서 쏟아지는 적들로부터 타워로 지켜내며, 매 레벨업마다 강력한 카드를 골라 점점 더 강해지는 생존형 타워 디펜스."

- **장르 하이브리드**: Vampire Survivors의 레벨업 카드 선택 루프 + Brotato의 즉각적인 위협감 + 기존 Neon Defense TD 타워 배치/자동공격 시스템
- **핵심 차별점**: 방향성 없는 360도 공격, 경험치 젬 수집, 실시간 레벨업 보상이 기존 wave/stage 루프를 대체
- **타깃 유저**: 뱀서류 경험이 있는 유저, 빠른 피드백 루프를 원하는 캐주얼~미드코어 유저

---

## 2. 타깃 플레이 시간 / 1게임 길이

| 옵션 | 총 시간 | 구성 | 특징 |
|---|---|---|---|
| **Short (권장 MVP)** | **8~10분** | 5분 생존 + 보스 1체 | 모바일 세션 길이, 진입 허들 낮음 |
| Standard | 13~15분 | 8분 생존 + 미니보스 2체 + 보스 1체 | 기존 Rush Mode와 유사한 만족감 |
| Endless | 무제한 | 매 3분마다 페이즈 상승 | 점수 도전형, 리더보드 연동 가능 |

> 결정 필요 (Open Q-1): MVP는 Short(8~10분) 단일 길이 고정으로 시작하고, Endless는 Phase 3에서 추가 권장.

---

## 3. 코어 게임 루프

### 3-1. 플로우 다이어그램

```
[모드 선택] → [타워 초기 드로우(3장 중 1장)] → [배치]
     ↓
[아레나 시작 — 타이머 00:00]
     ↓
[적 스폰 — 360도 동심원 링] → [적, 코어를 향해 이동]
     ↓
[타워 자동공격] → [적 처치 시 XP 젬 드롭]
     ↓                                   ↓
[코어가 젬 흡수 (반경 내 자동)]   [타워 뽑기 골드 적립]
     ↓
[레벨업 발동 → 게임 일시정지 → 카드 3장 제시 → 1장 선택]
     ↓
[타이머 재개 — 다음 페이즈로]
     ↓
[미니보스/보스 출현 (타이밍 표 참조)]
     ↓
[보스 처치 = 클리어 / 코어 HP 0 = 게임 오버]
```

### 3-2. 시간별 이벤트 표 (Short 8~10분 기준)

| 타이머 | 이벤트 | 세부 내용 |
|---|---|---|
| 00:00 | 게임 시작 | 초기 타워 1기 배치, 적 스폰 시작 |
| 00:00~01:30 | 페이즈 1 (입문) | 일반/fast 적 위주. 스폰 레이트 낮음. 첫 레벨업 경험 유도 |
| 01:30 | 미니이벤트 | 스폰 레이트 1.3배 증가 (페이즈 전환 알림) |
| 01:30~03:30 | 페이즈 2 (성장) | elite, jammer 등장 시작. 스폰 링 2개로 확장 |
| 03:30 | 미니보스 1체 | 코어를 향해 직진하는 강화 elite. 처치 시 골드 대폭 보상 + 레벨업 1회 강제 |
| 03:30~05:30 | 페이즈 3 (위기) | splitter, healer 등장. 스폰 레이트 최대치 근접 |
| 05:30 | 미니보스 2체 | healer + 강화 elite 동시 출현 |
| 05:30~07:00 | 페이즈 4 (클라이맥스) | 모든 적 타입 등장. 스폰 레이트 최대치 |
| 07:00 | 보스 등장 | 코어까지 돌진하는 보스. 별도 HP 바 UI 표시 |
| 보스 처치 후 | 클리어 | 결과 화면, 크리스탈 보상 |
| (보스 미처치) 08:00 | 타임아웃 패배 | 코어가 생존했더라도 보스 미처치 = 실패 처리 (선택) |

> 결정 필요 (Open Q-2): 보스 타임아웃 패배 정책 확정 필요.

### 3-3. 적 스폰 밀도 곡선

```
스폰 인터벌 (ms)
2000 |**
1800 |   **
1600 |     ***
1400 |        ***
1200 |           ***
1000 |              ****
 800 |                  ****-------- (페이즈 4 이후 최저치 유지)
     +----+----+----+----+----+----+-- 시간(분)
     0    1    2    3    4    5    6
```

---

## 4. 신규 시스템 명세

### 4-1. Core (코어)

| 항목 | 명세 |
|---|---|
| **위치** | 맵 픽셀 정중앙 고정 (`GRID_WIDTH/2 * TILE_SIZE`, `GRID_HEIGHT/2 * TILE_SIZE`) |
| **HP** | 기본 1000 (가안, 밸런스 조정 위임) |
| **데미지 조건** | 적이 코어 중심 반경 `CORE_DAMAGE_RADIUS`(=24px) 이내 진입 시 적 타입별 `coreDamage` 값만큼 감소 후 해당 적 사망 처리 |
| **시각 표현** | 코어 전용 셀 (3x3 중앙 9칸을 타워 배치 불가 존으로 마킹). 네온 원형 아이콘 + HP 게이지 링(원형 프로그레스 바). HP 30% 이하 시 빨간 점멸 이펙트 |
| **HP 회복** | 없음 (MVP). 레벨업 카드 "코어 수리"로 %회복 가능 (Phase 2 추가) |
| **사망** | 코어 HP 0 → 게임 오버 (기존 `lives` 시스템 대신 코어 HP 단일 게이지로 교체) |
| **배치 제한** | 코어 주변 3×3 셀(12x12 타일 정중앙)은 타워 배치 불가 (하드코드 예외 처리 필요) |

**적 타입별 코어 접촉 데미지 (가안)**

| 적 타입 | 코어 데미지 |
|---|---|
| normal | 5 |
| fast | 4 |
| elite | 15 |
| boss | 50 |
| jammer | 10 |
| suppressor | 12 |
| healer | 8 |
| splitter | 자식 생성 후 8 |

### 4-2. Spawn Ring (동심원 스폰 링)

기존 `EnemySystem.create()`의 `pathTiles` 기반 이동을 아레나 모드에서는 사용하지 않는다.
대신 코어를 중심으로 한 동심원 스폰 링에서 적이 생성된다.

**스폰 링 설정 (가안)**

| 항목 | 값 |
|---|---|
| 링 반경 | 페이즈 1~2: `mapDiagonal * 0.52` (맵 바깥쪽 약간 안쪽). 페이즈 3~4: 동일 반경 유지 |
| 스폰 각도 | 0~360도 균등 분포 + 난수 offset ±15도 |
| 동시 스폰 링 수 | 페이즈 1~2: 1개. 페이즈 3 이후: 2개 (반경 0.52x, 0.7x) |
| 스폰 위치 | 링 위에서 코어 방향 기준 랜덤 각도. 맵 경계를 벗어나면 맵 경계 클램프 |
| 페이즈 전환 | 미니보스 처치 또는 타이머 기준 (3-2 표 참조) |

**스폰 레이트 곡선 (가안)**

```javascript
// ARENA_SPAWN_RATE: 타이머 경과 시간(초) → 스폰 인터벌(ms)
const ARENA_SPAWN_RATE = {
  getInterval(elapsedSec) {
    if (elapsedSec < 90)  return 2000 - elapsedSec * 4;    // 00:00~01:30
    if (elapsedSec < 210) return 1640 - (elapsedSec - 90) * 3; // 01:30~03:30
    if (elapsedSec < 330) return 1280 - (elapsedSec - 210) * 2; // 03:30~05:30
    return Math.max(800, 1040 - (elapsedSec - 330) * 1.5);  // 05:30~
  },
};
```

### 4-3. Enemy 추적 이동 (Core-Chasing Movement)

기존 `EnemySystem.move()` 는 `pathTiles[pathIndex]`를 목표로 이동한다.
아레나 모드에서는 이를 코어 좌표를 목표로 하는 추격 이동으로 교체한다.

**분기 전략: EnemySystem 확장 (신규 컴포넌트 X)**

`EnemySystem`에 `moveArena(enemy, coreX, coreY, deltaMs, modeId)` 메서드를 추가한다.
기존 `move()` 는 `modeId !== 'arena'` 케이스 그대로 유지 (OCP 원칙 준수).

```
// 의사 코드 — 실제 구현은 TowerDesigner/구현팀에 위임
EnemySystem.moveArena(enemy, coreX, coreY, deltaMs, modeId):
  1. 방향 벡터 = normalize(core - enemy.pos)
  2. 속도에 StatusEffectSystem 슬로우/빙결 배율 적용
  3. enemy.x += dir.x * speed * deltaMs / 1000
  4. enemy.y += dir.y * speed * deltaMs / 1000
  5. 코어 반경 내 진입 감지 → coreDamage 이벤트 반환
  6. flip, facingAngle 갱신 (dx 부호 기반)
```

**군집 회피 (Phase 2 추가 검토)**
- 적끼리 겹침 방지: 동일 위치에 적 다수 스택 시 각도 offset 분산 처리
- MVP에서는 단순 직진만 구현, 군집 회피는 Phase 2

**특수 적 이동 예외**

| 적 타입 | 예외 동작 |
|---|---|
| jammer | 기본 추격. 코어 반경 150px 진입 시 정지하고 재밍 효과만 지속 |
| healer | 다른 적 무리 중심을 향해 이동 (자기 주변 적 HP 회복) |
| splitter | 처치 시 자식 적 2마리 즉시 스폰 (코어 방향으로 각도 ±30도) |
| boss | 일직선 돌진 + 주기적 360도 레이저 스윕 패턴 (Phase 2 구현 가능, MVP는 직진만) |

### 4-4. XP Gem (경험치 젬) & 레벨업

**참고 사례**: Vampire Survivors의 젬 자동 흡수 메커니즘 + Brotato의 레벨업 즉시 선택 UI

**XP 젬 명세**

| 항목 | 값 |
|---|---|
| 드롭 주체 | 처치된 모든 적 (확률 아님, 무조건 드롭) |
| 드롭 XP량 | 적 타입별 상이. 아래 표 참조 |
| 흡수 방식 | 코어 중심 반경 `XP_COLLECT_RADIUS`(=150px) 이내 젬을 매 틱 자동 흡수 |
| 젬 이동 | 흡수 반경 내 진입 시 코어 방향으로 이동(lerp). 반경 밖 젬은 제자리 유지 |
| 젬 시각 | 속성별 색상 마름모 파티클. 크기는 XP량 비례 |
| 젬 소멸 | 흡수되지 않은 젬은 15초 후 소멸 |

**적 타입별 XP 드롭 (가안)**

| 적 타입 | XP |
|---|---|
| normal | 4 |
| fast | 3 |
| elite | 12 |
| boss | 100 |
| jammer | 8 |
| suppressor | 10 |
| healer | 8 |
| splitter (부모) | 6 |
| splitter (자식) | 2 |
| 미니보스 | 50 |

**레벨업 곡선 (가안)**

```javascript
// ARENA_XP_TABLE: 레벨별 필요 XP
const ARENA_XP_TABLE = [
  // lv1→2  lv2→3  lv3→4  lv4→5  lv5~10: 매 레벨 +30  lv10+: 매 레벨 +60
   20, 35, 55, 80, 110, 140, 170, 200, 230, 260,
  // lv10→11 이후: 320, 380, 440, ...
];
// getXpRequired(level) = level <= 10
//   ? ARENA_XP_TABLE[level-1]
//   : 260 + (level - 10) * 60
```

**레벨업 이벤트 처리**

1. 코어가 필요 XP 달성 → 게임 루프 일시정지 (`paused = true`)
2. 카드 풀에서 랜덤 3장 추출 (중복 없음, 이미 보유한 카드는 업그레이드 버전으로 제시)
3. 플레이어가 1장 선택 → 효과 즉시 적용 → 게임 재개
4. 선택 UI가 5초 이상 방치되면 자동 선택 (모바일 배려)

### 4-5. 레벨업 카드 풀 (최소 20종 예시)

카드는 3개 등급으로 구분된다. 레벨이 높을수록 고등급 카드 출현율 상승.

**등급별 출현 가중치 (가안)**

| 레벨 구간 | 일반(Common) | 희귀(Rare) | 영웅(Epic) |
|---|---|---|---|
| lv 1~4 | 80% | 20% | 0% |
| lv 5~9 | 50% | 40% | 10% |
| lv 10+ | 30% | 40% | 30% |

**카드 목록 (가안)**

| # | 카드 이름 | 등급 | 효과 | 비고 |
|---|---|---|---|---|
| C-01 | 화력 강화 | 일반 | 모든 타워 공격력 +12% (스택 가능, 최대 5회) | 기존 PERMANENT_BUFFS.damageUp 재활용 |
| C-02 | 속사포 | 일반 | 모든 타워 공속 +10% (스택 가능, 최대 5회) | 기존 attackSpeedUp 재활용 |
| C-03 | 원거리 사격 | 일반 | 모든 타워 사거리 +12% (스택 가능, 최대 4회) | 기존 rangeUp 재활용 |
| C-04 | 황금 손길 | 일반 | 적 처치 시 골드 +20% | 기존 goldBonus 재활용 |
| C-05 | 복리 이자 | 일반 | 웨이브 종료 시 보유 골드 5% 이자 | 기존 interestRate 재활용 |
| C-06 | 무료 뽑기 | 일반 | 즉시 타워 무료 뽑기 1회 | 즉시 효과 (스택 불가) |
| C-07 | 뽑기 할인 | 일반 | 타워 뽑기 비용 -3G (스택 가능, 최대 4회) | 기존 drawDiscount 재활용 |
| R-01 | 치명타 훈련 | 희귀 | 모든 공격 15% 확률 2배 데미지 (스택 가능, 최대 3회) | 기존 critChance 재활용 |
| R-02 | 코어 수리 | 희귀 | 코어 HP 즉시 15% 회복 (최대 현재 HP 50%까지) | 신규 — 아레나 전용 |
| R-03 | 젬 자력 | 희귀 | XP 젬 흡수 반경 +80px (150→230px) | 신규 — 아레나 전용 |
| R-04 | 연쇄 폭발 | 희귀 | 적 사망 시 10% 확률 반경 40px 폭발 데미지 (= 5% 기본 데미지) | 신규 — 아레나 전용 |
| R-05 | 냉각 시스템 | 희귀 | 슬로우/빙결 효과 지속시간 +30% | 신규 — 아레나 전용 |
| R-06 | 돌격 명령 | 희귀 | 모든 타워 공격력 +8% + 공속 +8% (동시) | 복합 버프 — 아레나 전용 |
| R-07 | 이중 사격 | 희귀 | 모든 타워 투사체 1개 추가 발사 (데미지 60%) | 신규 — 아레나 전용 (AbilitySystem 확장 필요) |
| R-08 | 젬 폭발 | 희귀 | 레벨업 시 코어 주변 120px에 있는 적에게 현재 코어 레벨 × 5 데미지 | 신규 — 아레나 전용 |
| E-01 | 네온 과부하 | 영웅 | 가장 높은 티어 타워의 공격력 +50% + 사거리 +20% | 신규 — 아레나 전용 |
| E-02 | 무한 탄창 | 영웅 | 모든 타워 공속 +25% (단, 사거리 -10%) | 신규 — 아레나 전용 (트레이드오프) |
| E-03 | 코어 실드 | 영웅 | 코어 HP 최대치 +200 + 현재 HP 즉시 +100 | 신규 — 아레나 전용 |
| E-04 | 원소 증폭 | 영웅 | 모든 속성 상태이상 효과(화상 데미지, 빙결 시간 등) +40% | 신규 — 아레나 전용 |
| E-05 | 타워 출동 | 영웅 | 즉시 무료 S3 서포트 타워 1기 획득 | 신규 — 아레나 전용 (즉시 효과) |

> 결정 필요 (Open Q-3): R-07 "이중 사격"은 AbilitySystem 투사체 로직 수정을 요하므로 Phase 2 이후로 미룰지 결정.

### 4-6. 타워 배치 룰

| 항목 | 규칙 |
|---|---|
| 배치 가능 영역 | 기존 그리드 전체 — 단, 코어 3×3 중앙 9셀 제외. 경로 타일 개념 없음 (모든 비-코어 셀에 배치 가능) |
| 배치 방식 | 기존 드래그앤드롭(`useDragAndDrop`) 그대로 재활용 |
| 배치 중 게임 | 실시간 진행 (기존 TD와 동일). 배치 창 없음 |
| 사거리 표현 | 기존 hover 시 원형 사거리 표시 그대로 재활용 |
| 코어와의 거리 | MVP에서는 거리 페널티/보너스 없음. Phase 2에서 "코어 근처 타워 +10% 공격력" 보너스 카드로 간접 유도 검토 |
| 서포트 타워 | 기존 서포트 타워 시스템 그대로 사용 |
| 타워 판매 | 기존 50% 환급 유지 |
| 초기 배치 기회 | 게임 시작 전 10초의 "준비 시간" 제공. 이 동안 적 스폰 없음. 타워 배치만 가능 |

---

## 5. 재활용 vs 신규 매트릭스

| 시스템 | 재활용 여부 | 변경 수준 | 비고 |
|---|---|---|---|
| `TowerSystem.create()` / `createSupport()` | 재활용 | 변경 없음 | 타워 생성 로직 동일 |
| `AbilitySystem` (6속성 Ability) | 재활용 | 변경 없음 | 공격 처리 동일 |
| `SupportAbilitySystem` | 재활용 | 변경 없음 | 서포트 버프 동일 |
| `StatusEffectSystem` | 재활용 | 변경 없음 | 화상/슬로우 등 그대로 |
| `GameEngine.processProjectiles()` | 재활용 | 변경 없음 | 투사체 로직 동일 |
| `GameEngine.gameTick()` | 부분 수정 | 낮음 | `modeId === 'arena'` 분기 추가: 코어 HP 처리, 타이머 업데이트, 젬 수집 |
| `EnemySystem.create()` | 부분 수정 | 중간 | pathTiles 없이 스폰 위치 직접 주입, bossPattern 아레나 전용 추가 |
| `EnemySystem.move()` | 부분 수정 | 중간 | `moveArena()` 메서드 추가 (기존 move 보존) |
| `DataResolver` | 부분 수정 | 낮음 | `modeId === 'arena'` 케이스 추가 |
| `GAME_DATA.modes` | 부분 수정 | 낮음 | `arena` 모드 설정 객체 추가 |
| `run-mode-constants.js` | 부분 수정 | 낮음 | `ARENA_SPAWN_RATE`, `ARENA_XP_TABLE`, `ARENA_ECONOMY` 추가 |
| `RunMode` (infra/run-mode.js) | 부분 수정 | 낮음 | `buildArenaConfig()` 메서드 추가 |
| `useRunMode.jsx` | 부분 수정 | 낮음 | `runMode === 'arena'` 케이스 추가 |
| `PERMANENT_BUFFS` | 재활용 | 변경 없음 | 레벨업 카드의 Common 카드에 직접 매핑 |
| `PermanentBuffManager` | 재활용 | 변경 없음 | 아레나 레벨업 카드 효과를 permanentBuffs에 적용 |
| `useDragAndDrop.jsx` | 재활용 | 변경 없음 | 배치 로직 그대로 |
| `GameStats`, `RunLog` | 부분 수정 | 낮음 | 아레나 전용 지표(survivalTime, coreHpRemaining, arenaLevel, peakLevel 등) 추가 |
| **경로 생성 시스템** | **미사용** | — | 아레나 모드는 경로 없음 |
| **WebSocket/멀티플레이** | **신규 불필요** | — | 싱글플레이 전용 |
| 코어 시스템 | **신규** | — | `js/domain/arena/core-system.js` |
| 스폰 링 시스템 | **신규** | — | `js/domain/arena/spawn-ring.js` |
| XP 젬 시스템 | **신규** | — | `js/domain/arena/xp-gem-system.js` |
| 레벨업 카드 UI | **신규** | — | `js/components/ArenaLevelUpCard.jsx` |
| 아레나 HUD | **신규** | — | `js/components/ArenaHUD.jsx` (타이머, 레벨, 경험치 바, 코어 HP 링) |
| `useArenaMode.jsx` | **신규** | — | `js/hooks/useArenaMode.jsx` |
| 아레나 상수 | **신규** | — | `js/domain/config/arena-constants.js` |

---

## 6. 모드 진입/종료 플로우

### 6-1. 진입 플로우

```
[메인 메뉴]
   ↓ "아레나 디펜스" 버튼 클릭
[아레나 모드 로비]
   - 최고 기록(생존 시간, 최대 레벨, 적 처치 수) 표시
   - "시작" 버튼
   ↓
[게임 화면 초기화]
   - arenaConfig 빌드 (RunMode.buildArenaConfig() 호출)
   - 코어 배치 (맵 중앙)
   - 초기 타워 뽑기: 무료 2회 자동 드로우
   - "준비 시간" 10초 카운트다운 표시 (배치 가능)
   ↓
[아레나 게임 루프 시작]
```

### 6-2. 종료 플로우

```
[인게임]
   ↓ (코어 HP 0 또는 보스 처치)
[게임 종료 이벤트]
   - GameEngine에서 arenaOver 이벤트 반환
   - useArenaMode.handleArenaOver() 호출
   ↓
[결과 화면]
   - 생존 시간
   - 도달 레벨
   - 선택한 카드 목록
   - 처치 적 수 / 코어 잔여 HP
   - 크리스탈 보상 (아레나 전용 공식 적용)
   - 최고 기록 경신 여부
   ↓ "계속" 버튼
[메인 메뉴로 복귀]
```

### 6-3. 아레나 모드 크리스탈 보상 (가안)

| 조건 | 보상 |
|---|---|
| 보스 처치 (클리어) | 60 크리스탈 |
| 생존 시간 매 1분 | +5 크리스탈 |
| 도달 레벨 매 1레벨 | +2 크리스탈 |
| 코어 HP 50% 이상 유지 클리어 | +20 크리스탈 (퍼펙트 보너스) |
| 최고 기록 경신 | +10 크리스탈 (1회) |
| 실패 (게임 오버) | 생존 시간 × 1 크리스탈 (최대 20) |

---

## 7. DDD 파일 구조 제안

CLAUDE.md의 DDD 레이어 규칙을 엄격히 준수한다.

```
js/
├── domain/
│   ├── config/
│   │   ├── arena-constants.js       [신규] 아레나 전용 상수
│   │   │   (ARENA_SPAWN_RATE, ARENA_XP_TABLE, ARENA_XP_DROP,
│   │   │    ARENA_CORE_CONFIG, ARENA_LEVEL_UP_CARDS,
│   │   │    ARENA_ECONOMY, ARENA_CRYSTAL_REWARDS)
│   │   ├── game-data.js             [수정] modes.arena 객체 추가
│   │   └── run-mode-constants.js    [수정] ARENA_* 상수 이관 or 여기 직접 추가
│   │
│   ├── arena/                       [신규 도메인 폴더]
│   │   ├── core-system.js           [신규]
│   │   │   (CoreSystem: HP 관리, 데미지 처리, 흡수 반경, 이벤트 반환)
│   │   ├── spawn-ring.js            [신규]
│   │   │   (SpawnRingSystem: 링 반경 계산, 스폰 위치 결정, 페이즈 전환)
│   │   └── xp-gem-system.js         [신규]
│   │       (XpGemSystem: 젬 생성, 이동, 흡수, 레벨업 판정, 카드 뽑기)
│   │
│   ├── enemy/
│   │   └── enemy-system.js          [수정] moveArena() 메서드 추가
│   │
│   ├── combat/
│   │   └── game-engine.js           [수정] modeId === 'arena' 분기
│   │       - 코어 HP 감소 처리 (적 접촉 이벤트 소비)
│   │       - 젬 수집 틱 (XpGemSystem.tick 호출)
│   │       - 아레나 타이머 업데이트
│   │       - 페이즈 전환 트리거
│   │
│   └── config/
│       └── data-resolver.js         [수정] arena modeId 케이스 추가
│
├── infra/
│   └── run-mode.js                  [수정] buildArenaConfig() 추가
│
├── hooks/
│   └── useArenaMode.jsx             [신규]
│       (아레나 세션 상태: arenaActive, coreHp, arenaLevel, currentXp,
│        gems[], peakLevel, elapsedMs, phase, startArena, handleArenaOver,
│        handleLevelUpChoice, handleCardDraw)
│
└── components/
    ├── ArenaHUD.jsx                  [신규] 타이머 / 레벨 / XP 바 / 코어 HP 링
    ├── ArenaLevelUpCard.jsx          [신규] 레벨업 시 카드 3장 선택 모달
    ├── ArenaCoreOverlay.jsx          [신규] 코어 위치 오버레이 (GameMap 위에 렌더)
    └── mobile/
        └── ArenaMobileLayout.jsx     [신규] 모바일 가로 모드 아레나 레이아웃
            (MOBILE_LAYOUT.md 패턴 적용: compact prop, nd-arena-grid CSS 스코프)
```

**의존성 방향 검증**

```
arena-constants.js (config)
   ↑
core-system.js / spawn-ring.js / xp-gem-system.js (domain/arena)
   ↑
game-engine.js (domain/combat) — arena 분기 추가
   ↑
useArenaMode.jsx (hooks)
   ↑
ArenaHUD.jsx / ArenaLevelUpCard.jsx / ArenaCoreOverlay.jsx (components)
```

domain → infra → hooks → components 방향 준수. 역방향 의존 없음.

---

## 8. 밸런스 초안 (가안 — BalanceDesigner 핸드오프 필요)

> 아래 수치는 설계 의도를 표현한 가안이다. 정식 수치 검증은 `BalanceDesigner` 에이전트 또는 `game-balancer`에게 위임한다.

### 8-1. 코어 HP

| 항목 | 가안 값 | 설계 의도 |
|---|---|---|
| 기본 HP | 1000 | 8~10분 게임에서 적 접촉 약 10~15회 허용 수준 |
| 일반 적 1마리 데미지 | 5 | 동시 20마리 접촉 시 코어 HP 10% 손실 |
| 보스 접촉 데미지 | 50 | "보스가 닿으면 위기감" 표현 |

### 8-2. 적 체력 스케일링 (아레나 전용)

기존 `HEALTH_SCALING`을 시간 기반으로 재해석한다.

```javascript
const ARENA_HEALTH_SCALING = {
  base: 25,                               // 페이즈 1 기본체력
  phaseGrowth: 0.35,                      // 페이즈당 35% 증가
  timeBonusPerMin: 0.08,                  // 경과 분당 8% 추가 증가
  bossHealthMultiplier: 20,               // 보스 = 일반 적 × 20
  minibossHealthMultiplier: 6,            // 미니보스 = 일반 적 × 6
};
```

### 8-3. 레벨업 카드 효과량 설계 기준

| 등급 | 기준 | 예시 |
|---|---|---|
| 일반(Common) | 단일 스탯 소폭 강화. 5회 중첩 시 "그냥 좋은" 수준 | 공격력 +12% × 5 = +60% → T2 기준 DPS 1.6배 |
| 희귀(Rare) | 복합 효과 또는 새 메커니즘 추가. 2회 중첩이 상한 | 이중 사격: 사실상 DPS 1.6배 상당 |
| 영웅(Epic) | 게임 판도를 바꾸는 수준. 비등급 상한 | 원소 증폭 +40%: 화상/슬로우 시너지 폭발 |

### 8-4. 경제 (가안)

```javascript
const ARENA_ECONOMY = {
  startGold: 60,              // 초기 타워 3기 구매 가능 (뽑기 20G × 3)
  drawCost: 20,               // 기존 동일
  supportDrawCost: 40,        // 기존 동일
  killGoldBase: 1,            // 일반 적 처치 시 골드 1
  killGoldByType: {
    elite: 4, boss: 30, jammer: 3, suppressor: 3, healer: 3,
    splitter: 2, fast: 1, miniboss: 15,
  },
  goldPerSecond: 0,           // 패시브 골드 없음 (카드로만 획득 가능)
};
```

---

## 9. 참고 사례 (역기획)

### 9-1. Vampire Survivors — 레벨업 카드 선택

- **차용 요소**: 적 처치 → 경험치 → 레벨업 → 3장 카드 선택 → 즉시 강화 루프. 게임 일시정지 후 선택, 고도감 연출.
- **우리 차이점**: 타워가 자동공격 주체(플레이어 이동 없음). 카드는 "타워 전체 강화"이며, VS처럼 무기 자체가 레벨업되지 않음.
- **공통점**: 레벨업 인터벌이 핵심 도파민. 매 선택이 빌드 방향을 결정.

### 9-2. Brotato — 즉각적인 위협 + 빌드 다양성

- **차용 요소**: 사방 동시 진입 적으로 인한 즉각적 위기감. 상점(=레벨업 카드)에서 성장 루프. 단계적 난이도 페이즈.
- **우리 차이점**: Brotato는 플레이어 직접 조작. 아레나 디펜스는 타워가 자동공격 — 배치 전략이 핵심.
- **공통점**: 한 게임 내에서 몇 가지 방향 중 특화 빌드로 수렴해가는 과정.

### 9-3. Soulstone Survivors — 타워형 스킬 + 360도 방어

- **차용 요소**: 스킬/타워가 360도 전 방위를 커버해야 하는 설계. 타워 배치 위치의 전략성.
- **우리 차이점**: 아레나 디펜스는 그리드 배치형으로, SS처럼 자동 조준이 아니라 셀 위치가 사거리를 결정.

### 9-4. Bloons TD 6 — 타워 재활용 + 어빌리티 카드

- **차용 요소**: 기존 타워 풀(6속성 × 4티어) 그대로 유지. 신규 모드에서 기존 타워를 새 방식으로 활용.
- **우리 차이점**: BTD6 치어 시스템(3갈래 업그레이드) 대신 레벨업 카드로 전체 강화.
- **공통점**: 타워의 속성/역할 조합에 따른 메타 다양성.

### 9-5. Kingdom Rush — 배치 전략 + 즉각적 스킬

- **차용 요소**: 그리드 배치 후 방어라인 형성의 전략적 쾌감. "어디에 둘까"가 핵심 의사결정.
- **아레나 전용 차이**: KR은 선형 경로 수비. 아레나는 360도 어디서 올지 모르는 방어라인 형성.

---

## 10. MVP / 단계별 구현 로드맵

### Phase 1 — MVP (최소 플레이 가능)

**목표**: 아레나 모드를 플레이 가능한 상태로 만드는 것. 화려한 연출보다 코어 루프 검증.

**구현 항목**

| 항목 | 설명 | 위임 |
|---|---|---|
| `arena-constants.js` 작성 | ARENA_CORE_CONFIG, ARENA_SPAWN_RATE, ARENA_XP_TABLE, ARENA_ECONOMY | TowerDesigner/구현팀 |
| `CoreSystem` 기본 구현 | HP 관리, 적 접촉 감지, 데미지 처리, 게임 오버 이벤트 | 구현팀 |
| `SpawnRingSystem` 기본 구현 | 링 반경 계산, 랜덤 각도 스폰, 페이즈 타이머 | 구현팀 |
| `EnemySystem.moveArena()` | 코어 직진 추격 이동 (군집 회피 없음) | 구현팀 |
| `XpGemSystem` 기본 구현 | 젬 드롭, 자동 흡수, 레벨업 판정 | 구현팀 |
| `GameEngine.gameTick()` arena 분기 | 코어 접촉 처리, 젬 수집 틱, 타이머 업데이트 | 구현팀 |
| 레벨업 카드 풀 MVP (10종) | C-01~07 + R-01 + R-03 + E-03 | 구현팀 |
| `ArenaLevelUpCard.jsx` | 카드 3장 선택 UI (모달, 일시정지 연동) | 구현팀 |
| `ArenaHUD.jsx` 기본 | 타이머, 레벨 표시, XP 바 | 구현팀 |
| `useArenaMode.jsx` | 아레나 세션 상태 관리 | 구현팀 |
| `GAME_DATA.modes.arena` 추가 | DataResolver arena 케이스 추가 | 구현팀 |
| `RunMode.buildArenaConfig()` | 아레나 설정 빌드 | 구현팀 |
| 모드 진입 버튼 | 메인 메뉴 또는 런 모드 선택 화면에 아레나 추가 | 구현팀 |

**Phase 1 제외 항목 (뺄 것)**
- 코어 HP 회복 (R-02 카드)
- 미니보스 특수 패턴 (직진만)
- 군집 회피 AI
- 모바일 전용 레이아웃
- 크리스탈 보상 연동
- 아레나 RunLog 지표

### Phase 2 — 레벨업 확장

**목표**: 레벨업 빌드 다양성 완성. 연출 개선.

**추가 항목**

| 항목 | 설명 |
|---|---|
| 레벨업 카드 풀 전체 20종 | R-02, R-04~R-08, E-01, E-02, E-04, E-05 추가 |
| R-07 이중 사격 | AbilitySystem 투사체 분기 확장 |
| 코어 HP 회복 카드 | R-02 연동 |
| 젬 흡수 반경 카드 | R-03 시각 연출 (흡수 링 표시) |
| 미니보스 특수 패턴 | 미니보스 2체 동시 스폰 로직 |
| jammer 특수 이동 | 코어 반경 150px 정지 + 재밍 효과 |
| ArenaCoreOverlay | 코어 HP 링 프로그레스, HP 30% 점멸 이펙트 |
| 크리스탈 보상 연동 | CRYSTAL_REWARDS에 arena 섹션 추가 |
| 아레나 RunLog 지표 | survivalTime, arenaLevel, coreHpRemaining 등 |
| 준비 시간 10초 UI | 카운트다운 + 배치 가이드 표시 |

### Phase 3 — 폴리시 & 확장

**목표**: 완성도 향상. 리텐션 기능 추가.

**추가 항목**

| 항목 | 설명 |
|---|---|
| Endless 아레나 | 보스 처치 후 계속 진행. 매 3분 페이즈 상승. 점수 리더보드 |
| 군집 회피 AI | 적 겹침 방지, 자연스러운 분산 이동 |
| 보스 360도 레이저 패턴 | boss 전용 bossPattern: 'arenaLaser' |
| 모바일 전용 레이아웃 | ArenaMobileLayout.jsx (nd-arena-grid CSS 스코프) |
| 일일 챌린지 아레나 | 아레나 전용 모디파이어 (젬 2배, 공속 절반 등) |
| 코어 근처 타워 보너스 카드 | "전진 배치" 전략 유도 |
| 아레나 전용 적 타입 | "분열체 군단" 등 아레나에서만 등장하는 적 (MonsterDesigner 위임) |
| 업적 연동 | "아레나 lv20 도달", "코어 HP 만렙 클리어" 등 |

---

## 11. 리스크 & 오픈 이슈

### Open Questions (구현 착수 전 확정 필요)

| # | 질문 | 옵션 | 권장 |
|---|---|---|---|
| Q-1 | MVP 게임 길이를 Short(8~10분) 단일 고정으로 시작할지, 처음부터 Short/Standard 선택 가능하게 할지 | A: 단일 고정 / B: 선택 가능 | A (단순화) |
| Q-2 | 보스를 시간 내 미처치 시 타임아웃 패배로 처리할지, 코어가 살아있으면 생존 성공으로 볼지 | A: 타임아웃 패배 / B: 생존 성공 | A (긴장감 유지) |
| Q-3 | R-07 "이중 사격" 카드를 Phase 1에 포함할지 Phase 2로 미룰지 | A: Phase 1 포함 / B: Phase 2 | B (구현 부하 절감) |
| Q-4 | 코어 위치를 맵 정확한 픽셀 중앙으로 고정할지, 맵 생성 시마다 약간의 offset을 줄지 | A: 정중앙 고정 / B: 약간의 offset | A (예측 가능성) |
| Q-5 | 레벨업 카드 선택 자동화 타이머를 5초로 할지 없앨지 (없애면 무한 대기 가능) | A: 5초 자동선택 / B: 무제한 | A (모바일 배려) |
| Q-6 | 아레나 모드의 메타 업그레이드(`META_UPGRADES`)를 기존 런 모드 메타와 공유할지, 아레나 전용 메타로 분리할지 | A: 공유 / B: 분리 | A (단순화, Phase 3에서 분리 검토) |
| Q-7 | 준비 시간(Pre-Game) 10초 중 골드 지급을 즉시 할지, 게임 시작 후 할지 | A: 시작 전 지급 / B: 시작 후 지급 | A (배치 전략 가능) |

### 밸런스 리스크

| 리스크 | 내용 | 완화책 |
|---|---|---|
| 레벨업 카드 적층 폭발 | Common 카드 5중첩 + Epic 카드 조합 시 DPS가 너무 커져 적이 의미 없어짐 | 카드 중첩 상한 설정 + 적 HP 페이즈 스케일링으로 대응. 정식 수치는 BalanceDesigner 위임 |
| 코어 HP 너무 빠른 감소 | 초반 타워 없이 몰리면 1~2분 내 게임 오버 | 준비 시간 10초 + 초기 골드 60G + 페이즈 1 스폰 레이트 낮게 설정 |
| 코어 너무 빠른 HP 회복 | R-02 카드 중첩 시 사실상 무적 | R-02를 단일 발동 카드(스택 없음)로 제한. 최대 회복량 현재 HP 50%로 캡 |
| 젬 스팸 누적 | 화면에 젬이 너무 많아 성능 저하 | 젬 최대 개수 상한 설정 (예: 200개). 초과 시 오래된 젬부터 소멸 |
| 경로 없는 mapType | 기존 getPath(), pathTiles 관련 코드가 arena 모드에서 빈 배열 / null을 받을 때 오류 | arena modeId 분기에서 pathTiles = [] 로 초기화. EnemySystem.create() arena 전용 팩토리 오버로드 검토 |

### 기술적 리스크

| 리스크 | 내용 | 완화책 |
|---|---|---|
| GameEngine 분기 복잡도 증가 | gameTick에 arena 분기가 쌓이면 가독성 저하 | arena 전용 틱 메서드 `GameEngine.arenaGameTick()` 분리 후 gameTick에서 라우팅 |
| 성능: 360도 스폰 + 전체 적 이동 | 적 수 × 거리 계산 매 틱. 기존 경로 이동보다 연산량 증가 | 코어 좌표 캐싱. 거리 제곱(distSq) 비교로 sqrt 최소화. 목표 프레임 60fps 기준 50마리 이상 시 프로파일링 필요 |
| 기존 lives 시스템과 코어 HP의 충돌 | `useGameState`의 lives 상태를 arena에서 어떻게 처리할지 | arena 모드에서는 lives를 1로 고정하고 코어 HP를 별도 상태로 관리. useArenaMode에서 coreHp 독립 관리 |
| 맵 중앙 3×3 배치 불가 | 기존 그리드 배치 가능/불가 판정 로직 수정 필요 | ARENA_CORE_BLOCKED_CELLS 상수 정의 후 useDragAndDrop 배치 가능 여부 체크에 추가 |

---

## 부록 A. 관련 문서 링크

- 아키텍처 전반: `/home/user/NeonDefense/CLAUDE.md`
- 런 모드 패턴 참고: `js/domain/config/run-mode-constants.js`, `js/infra/run-mode.js`, `js/hooks/useRunMode.jsx`
- 기존 영구 버프 (카드 재활용): `js/domain/progression/permanent-buff.js`
- 모바일 레이아웃 패턴: `docs/MOBILE_LAYOUT.md`
- 밸런스 수치 검증: `design-proposals/balance-03-saurom-tower-numbers.md`, `balance-04-floor-meta-curve.md`
- 보스 패턴 참고: `design-proposals/03-multiphase-boss-system.md`

## 부록 B. BalanceDesigner 핸드오프 항목

다음 수치는 이 문서에서 가안으로 제시했으나, 정식 수치 확정은 `BalanceDesigner` 스킬 또는 `game-balancer` 에이전트에게 위임한다.

1. 코어 HP 1000 및 적 타입별 코어 접촉 데미지
2. ARENA_HEALTH_SCALING (base, phaseGrowth, timeBonusPerMin)
3. ARENA_XP_TABLE (레벨업 곡선)
4. 적 타입별 XP 드롭량
5. 레벨업 카드 효과 수치 (특히 Common 최대 중첩 시 최종 DPS)
6. ARENA_ECONOMY (startGold, killGoldBase, killGoldByType)
7. 아레나 크리스탈 보상 공식
