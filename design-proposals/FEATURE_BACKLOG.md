# 기능 구현 필요 목록 (Feature Implementation Backlog)

> 출처: `design-proposals/` 의 `game-designer` 기획안 3건 + `game-balancer` 밸런스 리포트 1건을 기반으로 정리.
> 갱신: 2026-04-25

## 빠른 개요

| # | 기능 | 카테고리 | 우선순위 | 난이도 | 출처 |
|---|---|---|---|---|---|
| F-01 | 원소 융합 타워 (T5 Paragon) | 후반 콘텐츠 / 타워 다양성 | P1 | 상 | [01-elemental-fusion-tower](./01-elemental-fusion-tower.md) |
| F-02 | 이벤트 웨이브 8종 | 전투 다양성 | P0 | 중 | [02-event-waves-and-map-gimmicks](./02-event-waves-and-map-gimmicks.md) |
| F-03 | 맵 기믹 타일 4종 | 맵/배치 전략 | P2 | 중 | [02-event-waves-and-map-gimmicks](./02-event-waves-and-map-gimmicks.md) |
| F-04 | 다페이즈 보스 시스템 (4종 × 3페이즈) | 보스 / 후반 콘텐츠 | P0 | 상 | [03-multiphase-boss-system](./03-multiphase-boss-system.md) |
| F-05 | 캠페인 난이도 곡선 튜닝 (옵션 A) | 밸런스 | P0 | 하 | [balance-01-difficulty-curve](./balance-01-difficulty-curve.md) |
| F-06 | W3 미니 챌린지 웨이브 | 밸런스 / 리듬 | P1 | 하 | [balance-01-difficulty-curve](./balance-01-difficulty-curve.md) |

- **P0** = 즉시 착수 권장 (체감 변화 大 + 난이도 낮음 또는 핵심 페인포인트)
- **P1** = 다음 마일스톤 (P0 검증 후)
- **P2** = 백로그 (선행 작업 의존)

---

## P0 — 즉시 착수 권장

### F-05. 캠페인 난이도 곡선 튜닝 (옵션 A)
**왜 P0인가**: 코드 3줄 수정으로 모든 후속 콘텐츠(F-01/F-02/F-04)의 진입 시점을 정상화할 수 있는 **선행 작업**. 위험도 최저.

**구현 작업**
- [ ] `domain/config/constants.js:200-271` HEALTH_SCALING/ECONOMY 수정
  - `stageClearBonus`: `40 + stage*8` → `30 + stage*15`
  - `bossGoldReward`: `20 + stage*7 + wave*3` → `20 + stage*10 + wave*3`
  - `waveGrowth`: `0.13` → `0.11`
- [ ] DPS 시뮬레이션으로 "기대/요구 DPS 비율" 0.9~1.3 범위 검증

**예상 영향**: 초반 W5 벽 –12%, T4 첫 등장 시점 S6W1 → S5W3 앞당김.

---

### F-04. 다페이즈 보스 시스템 (MVP)
**왜 P0인가**: 보스러시 모드의 핵심 콘텐츠 공백을 메우고, 도감/업적/통계까지 확장 가능. 단, MVP 범위(2종)로 제한.

**MVP 작업 (보스 2종: pyroLord, stormTitan)**
- [ ] `domain/config/constants.js`
  - `BOSS_TYPES` 신규 (4종 정의 중 2종 활성)
  - `BOSS_PHASE_THRESHOLDS = [1.0, 0.66, 0.33]`
- [ ] `domain/enemy/enemy-system.js`
  - `create()` 보스 타입 시 `BOSS_TYPES` 풀 씨드 선택
  - `update()` HP 비율 모니터링 → 페이즈 전환 트리거
  - `applyPhaseTransition(enemy, newPhase)` 신규
- [ ] `domain/enemy/abilities/boss-ability.js` 신규
  - `BossAbility extends EnemyAbility` 베이스
  - `PyroLordPhase{1,2,3}Ability`, `StormTitanPhase{1,2,3}Ability`
- [ ] `domain/effect/status-effect.js`
  - `TowerDisableEffect` 신규 (stormTitan P2/P3용)
- [ ] `domain/combat/game-engine.js`
  - 페이즈 전환 시 `effects[]`에 화면 플래시 push
  - 0.5초 무적 + 투사체 무효 처리
- [ ] `domain/progression/collection-system.js`
  - `ENEMY_CARDS`에 보스 2장 추가
  - `recordBossKill(bossId)` 훅
- [ ] `components/BossHealthBar.jsx` 신규 (3칸 페이즈 바)
- [ ] `components/EnemySprite.jsx` — 보스별 고유 아이콘/페이즈 오라
- [ ] `components/GameHeader.jsx` — 보스 등장 배너

**v2 이후**
- frostKing, voidReaper 추가 (분열/은신은 구현 난이도 상)
- 보스러시 모드 4종 순환 + 바퀴당 체력 ×1.5
- 보스별 업적 4종 + "모든 보스 처치" 업적
- 스테이지 시작 전 "다음 보스 프리뷰" UI

---

### F-02. 이벤트 웨이브 (MVP 4종)
**왜 P0인가**: 캠페인 W2/W4의 단조로움을 즉시 해소. 8종 중 단순한 4종은 기존 `SPAWN_RULES`만 확장하면 됨.

**MVP 작업 (4종: rushWave, tankWave, swarmWave, splitterWave)**
- [ ] `domain/config/constants.js`
  - `EVENT_WAVE_TYPES` 신규 (4종 정의: id/name/icon/modifier)
  - `EVENT_WAVE_CHANCE` 테이블 (S1: 0%, S2: 30/40%, S3+: 40/60%)
- [ ] `domain/config/game-data.js`
  - 모드별 활성화 플래그: `modes.campaign.eventWaves: true`, `modes.bossRush: false`
- [ ] `domain/combat/event-wave-system.js` 신규
  - `rollEventWave(stage, wave)` 평가
  - 이벤트 활성 시 `SPECIAL_ENEMY_CHANCE` **덮어쓰기** (가산 X)
- [ ] `domain/enemy/enemy-system.js`
  - `create()` 내 `eventWaveType` 주입 시 `healthMult`/수/타입 오버라이드
  - `determineType()` 이벤트 분기
- [ ] `hooks/useGameLoop.jsx` — 웨이브 시작 시 이벤트 알림 트리거
- [ ] `hooks/useGameState.jsx` — `currentEventWave` 상태
- [ ] `components/WaveAnnouncer.jsx` 신규 (텍스트 배너 1.5초)
- [ ] 이벤트 웨이브 진입 시 1초 일시정지 (특히 런모드)

**v2 이후**
- 나머지 4종 (`fogWave`, `timeBombWave`, `jammerWave`, `convoyWave`)
- 런모드/일일 챌린지 적용
- 웨이브 프리뷰 문구 자동 생성, 이벤트 도감, 8종 클리어 업적

---

## P1 — 다음 마일스톤

### F-01. 원소 융합 타워 (T5 Paragon, MVP 3종)
**왜 P1인가**: End-Game 임팩트는 크지만 신규 도메인 객체(`fusionCores` 재화) + 융합 UI 모달까지 필요. F-05 밸런스 안정 후 착수가 안전.

**MVP 작업 (T5 3종: 증기 폭발, 플라즈마 아크, 심판자의 눈)**
- [ ] `domain/config/constants.js`
  - `FUSION_TYPES` (3종 활성 / 15종 슬롯 정의)
  - `NEON_TYPES[5]` 베이스 스탯
  - `ECONOMY.fusionCost = 200`
- [ ] `domain/tower/tower-system.js`
  - `createFusion(elementA, elementB)` 신규
  - `combineFusion(towerA, towerB, coreCount)` — 재료 검증 + 생성
  - `create()` Tier 5 분기 허용
- [ ] `domain/tower/abilities/fusion-ability.js` 신규 (속성 짝별 분리 권장)
  - 500줄 초과 시 `fusion-ability-fire.js` / `fusion-ability-cold.js` 등 분할
- [ ] `domain/tower/ability-system.js` — `tier=5` 라우팅
- [ ] `domain/progression/collection-system.js`
  - `FUSION_CARDS` 15장 슬롯 (3장만 활성)
  - `recordFusion(elementA, elementB)` 훅
- [ ] `domain/combat/game-engine.js`
  - 보스 처치 시 융합 코어 10% 드롭
- [ ] `infra/save-system.js`, `infra/run-save-system.js`
  - `fusionCores` 필드 추가
- [ ] `infra/utils.js` — `BuffHelper.getFusionCoreDropChance()`
- [ ] `hooks/useInventory.jsx` — T4 2기 선택 → "융합" 진입점
- [ ] `hooks/useGameState.jsx` — `fusionCores` 상태
- [ ] `components/FusionModal.jsx` 신규 — 2기 선택 + 결과 미리보기 + 도감 연동
- [ ] `components/ControlPanel.jsx` — 융합 코어 HUD
- [ ] `components/CollectionModal.jsx` — `fusion` 탭

**전제 규칙**
- T5는 맵당 **종당 최대 2기** 배치 제한 (스펙 폭증 방지)
- T5는 서포트 버프 **50%만 수령** (곱셈 폭발 방지)
- 캐리오버 후보에 **무조건 포함**

**v2 이후**
- 나머지 12종 순차 추가
- 영구버프 "융합 마스터" (코어 드롭률 +5%/레벨)
- 모드별 코어 드롭률 튜닝
- (v3) T6 "오버드라이브" / 일일 챌린지 `fusionOnly`

---

### F-06. W3 미니 챌린지 웨이브
**왜 P1인가**: F-02(이벤트 웨이브)와 충돌 가능 — 이벤트 웨이브는 W2/W4 슬롯이지만 W3 챌린지가 추가로 들어가면 W3/W4/W5 3연속 봉우리 위험. F-02 검증 후 적용.

**구현 작업**
- [ ] `domain/config/constants.js`
  - `SPECIAL_ENEMY_CHANCE`, `SPAWN.enemiesPerWave`에 `wave===3 && stage>=2` 분기
  - 스폰 수 –30%, 개체 HP +60%, 골드 보상 +50%, 특수 몬스터 확률 ×2
- [ ] `domain/config/data-resolver.js` — 난이도별 W3 챌린지 ON/OFF 스위치
- [ ] W4는 의도적으로 숨고르기로 유지

---

## P2 — 백로그

### F-03. 맵 기믹 타일 4종
**왜 P2인가**: F-02 이벤트 웨이브 구현 후 자연스럽게 다음 단계. UI/렌더링 변경이 무겁고, 런모드 ㅁ맵 특수 케이스 검증 필요.

**구현 작업**
- [ ] `domain/config/constants.js`
  - `MAP_GIMMICK_TYPES` 4종 (crystalNode, dampField, speedRail, choke)
  - `GIMMICK_COUNT_PER_STAGE` 테이블
- [ ] `domain/combat/map-gimmick-system.js` 신규
  - `Map<gridKey, gimmick>` O(1) 조회 (성능)
  - 경로 확정 → 기믹 배치 순서 고정
- [ ] `domain/tower/tower-system.js`
  - `placeOnGrid()` 시 `tower.gimmickBonus = {damageMult, rangeMult}` 반영
  - 서포트 캡 외 별도 보너스 채널로 처리
- [ ] `domain/combat/game-engine.js`
  - 적 이동 처리에 `speedRail` 체크 (런모드 쿨다운 2초)
- [ ] `infra/run-mode.js`, `infra/save-system.js`
  - 스테이지 시작 시 기믹 씨드 결정/복원
- [ ] `hooks/useGameState.jsx` — `mapGimmicks[]` 상태
- [ ] `components/GameMap.jsx` — 기믹 타일 렌더링 + hover/long-press 툴팁

---

## 도메인별 영향도 요약

| 도메인 | 영향 받는 기능 | 변경 규모 |
|---|---|---|
| `domain/config` | F-01, F-02, F-03, F-04, F-05, F-06 | **대** (전 기능 진입점) |
| `domain/tower` | F-01, F-03 | 중 (T5 Ability + 기믹 보너스) |
| `domain/enemy` | F-02, F-04 | 중 (이벤트 웨이브 오버라이드 + 보스 페이즈) |
| `domain/effect` | F-04 | 소 (`TowerDisableEffect` 1종) |
| `domain/combat` | F-02, F-03, F-04 | 중 (이벤트/기믹/보스 페이즈 시스템) |
| `domain/progression` | F-01, F-04 | 중 (도감 카드 + 통계) |
| `infra` | F-01, F-03 | 소 (재화/기믹 씨드 저장) |
| `hooks` | F-01, F-02, F-03, F-04 | 중 (UI 상태 추가) |
| `components` | F-01(`FusionModal`), F-02(`WaveAnnouncer`), F-03(`GameMap`), F-04(`BossHealthBar`) | **대** (신규 컴포넌트 4개) |

---

## 권장 마일스톤 순서

```
M1 (P0 묶음) — 1~2주
  ├─ F-05 난이도 곡선 튜닝 (1일)         ← 모든 후속 작업 선행
  ├─ F-04 보스 시스템 MVP (보스 2종)
  └─ F-02 이벤트 웨이브 MVP (4종)
       ↓ 플레이테스트 + 클리어율 측정

M2 (P1 묶음) — 2~3주
  ├─ F-01 융합 타워 MVP (T5 3종)
  └─ F-06 W3 챌린지 웨이브 (F-02와 리듬 충돌 검증 후)
       ↓ End-Game 루프 검증

M3 (P2 + v2 확장) — 3~4주
  ├─ F-03 맵 기믹 타일
  ├─ F-04 v2: 보스 4종 + 보스러시 적용
  ├─ F-02 v2: 이벤트 웨이브 8종 완성
  └─ F-01 v2: 융합 타워 15종 완성
```

---

## BalanceDesigner 핸드오프 항목

다음은 구현 후 **별도 밸런스 튜닝이 필수**인 항목:

- F-01: T5 도입 시 S6 체력 스케일 재조정, T5 + 서포트 곱셈 캡
- F-02: 이벤트 웨이브 보상 +% 누적으로 인한 골드 인플레이션
- F-04: 페이즈별 체력 분배(`HEALTH_SCALING.bossFormula` 재설계), 보상 배수
- F-04: 페이즈3 광폭화(×1.3) — 런모드 ㅁ맵 한정 ×1.15 완화 검토
- F-06: 캐주얼 난이도 모드용 W3 챌린지 OFF 스위치

---

## 오픈 이슈 (의사결정 필요)

1. **F-01**: T5 융합 시 재료 T4의 역할(A/B/C)을 결과에 반영할 것인가? → 현재 안: 반영 안 함 (결정론 유지)
2. **F-02**: 런모드 자동 시작 환경에서 이벤트 웨이브 일시정지 길이? → 현재 안: 1초
3. **F-04**: `voidReaper` 분열체 처리 — 전체 데미지가 진짜 HP에 0.3 비율로 전이?
4. **F-04**: 페이즈 전환 0.5초 무적 시 투사체 처리 — 소멸? 흡수? → 현재 안: 소멸 + 데미지 무효
5. **F-06 vs F-02**: W3 챌린지 + W4 이벤트 + W5 보스의 3연속 봉우리 허용 여부
