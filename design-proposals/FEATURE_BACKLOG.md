# 기능 구현 필요 목록 (Feature Implementation Backlog)

> **본 문서가 Neon Defense 기획·기능 백로그의 단일 소스(Single Source of Truth)입니다.**
> 출처: `design-proposals/` 기획안 3건 + 밸런스 리포트 1건 + `archive/content-design/DOPAMINE_CONTENT_DESIGN.md` + `Saved/Problem.md` 버그 리포트 통합.
> 갱신: 2026-04-25

> **전제 (스코프 명시)**
> 본 백로그는 **현재 구현(5웨이브 × 6스테이지, T4 역할 3종)** 기준으로 작성되었습니다.
> 10웨이브 전환·T4 2택 극단화·스테이지 카드 20종 같은 구버전 비전은 [§ 장기 비전 (재검토)](#장기-비전-재검토) 섹션에서 참조 링크로만 다룹니다.

## 빠른 개요

### 신규 콘텐츠 (game-designer 기획안)

| # | 기능 | 카테고리 | 우선순위 | 난이도 | 출처 |
|---|---|---|---|---|---|
| F-01 | 원소 융합 타워 (T5 Paragon) | 후반 콘텐츠 / 타워 다양성 | P1 | 상 | [01-elemental-fusion-tower](./01-elemental-fusion-tower.md) |
| F-02 | 이벤트 웨이브 8종 | 전투 다양성 | P0 | 중 | [02-event-waves-and-map-gimmicks](./02-event-waves-and-map-gimmicks.md) |
| F-03 | 맵 기믹 타일 4종 | 맵/배치 전략 | P2 | 중 | [02-event-waves-and-map-gimmicks](./02-event-waves-and-map-gimmicks.md) |
| F-04 | 다페이즈 보스 시스템 (4종 × 3페이즈) | 보스 / 후반 콘텐츠 | P0 | 상 | [03-multiphase-boss-system](./03-multiphase-boss-system.md) |

### 밸런스 (game-balancer 리포트)

| # | 기능 | 카테고리 | 우선순위 | 난이도 | 출처 |
|---|---|---|---|---|---|
| F-05 | 캠페인 난이도 곡선 튜닝 (옵션 A) | 밸런스 | P0 | 하 | [balance-01-difficulty-curve](./balance-01-difficulty-curve.md) |
| F-06 | W3 미니 챌린지 웨이브 | 밸런스 / 리듬 | P1 | 하 | [balance-01-difficulty-curve](./balance-01-difficulty-curve.md) |

### 도파민·리텐션 (DOPAMINE 통합)

| # | 기능 | Tier | 우선순위 | 난이도 | 비고 |
|---|---|---|---|---|---|
| F-07 | Prism 레어 가챠 + Pity 시스템 | S1 | P0 | 중 | 0.5% 확률 + 200연뽑 천장 |
| F-08 | 킬 콤보 카운터 | S2 | P0 | 하 | 화면 중앙 펄스 + 마일스톤 보너스 |
| F-09 | Near-miss 연출 (vignette/슬로우) | S3 | P0 | 하 | lives ≤ 5/2/0 단계별 |
| F-10 | 스테이지 별점 1~3★ | A1 | P1 | 중 | 클리어 조건별 별점 + Master 칭호 |
| F-11 | 7일 출석 보상 | A2 | P1 | 중 | 사이클 카드 + 7일 완주 유니크 T4 |
| F-12 | Danger Wave 시각/사운드 강조 | A3 | P1 | 하 | 이미 HP×1.15는 적용 — 연출만 추가 |
| F-13 | 세트 효과 (속성 N개 배치) | C1 | P2 | 중 | Fire×3, Electric×3 등 자동 버프 |
| F-14 | 프리스티지 (SP 환원) | B1 | P2 | 상 | 출시 후 라이브 업데이트 |
| F-15 | 아티팩트/룬 영구 슬롯 5종 | C2 | P2 | 상 | 출시 후 라이브 업데이트 |
| F-16 | 유니크 카드 히든 해금 | B2 | P2 | 중 | 도전 조건 기반 도감 확장 |
| F-17 | 주간 리더보드 (로컬 → 서버) | B3 | P2 | 상 | 월요일 00:00 리셋 + 시즌 보상 |
| F-18 | 간단한 스토리 텍스트 | C3 | P2 | 하 | 스테이지 진입 5초 텍스트 |

### 알려진 버그 (Saved/Problem.md 통합)

| # | 항목 | 우선순위 | 비고 |
|---|---|---|---|
| B-01 | 설치된 타워 선택이 가끔 안 됨 | P0 | 휠 스크롤 후 픽셀 좌표 오프셋 추정 |
| B-02 | 모든 타워 사거리 항상 표시 → 화면 복잡 | P0 | 기본 OFF + 토글/선택 시만 표시 |
| B-03 | 타겟 잃은 미사일이 화면에 잔존 | P1 | 다음 웨이브 진입 시는 정리됨 — 즉시 정리 필요 |
| B-04 | 최대 티어 타워 조합 시 UI 표기 부재 | P1 | 조합 버튼 비활성화 + "최대 티어" 라벨 |
| B-05 | 서포트 미설치 상태에서 StatusEffect 아이콘 잔존 | P1 | 스테이지 이동 시 적 effect 클리어 누락 추정 |
| B-06 | 광휘 계열 (스틸글로우)이 공격을 안 함 | P0 | 회귀 — `light-ability.js` 점검 필요 |

### 우선순위 정의

- **P0** = 즉시 착수 권장 (체감 변화 大 + 난이도 낮음 또는 핵심 페인포인트, 회귀 버그)
- **P1** = 다음 마일스톤 (P0 검증 후)
- **P2** = 백로그 (선행 작업 의존, 출시 후 라이브 업데이트 후보)

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
6. **F-13 vs F-01**: 세트 효과(속성 N개 자동 버프)와 융합 타워 재료 요구가 충돌 — 같은 속성 5개 모으면 융합용 재료가 부족

---

## 도파민·리텐션 상세 (F-07 ~ F-18)

> 출처: [`archive/content-design/DOPAMINE_CONTENT_DESIGN.md`](../archive/content-design/DOPAMINE_CONTENT_DESIGN.md)
> 원본의 Tier S/A/B/C 분류는 본 백로그에서 P0/P1/P2 와 매핑되어 단일 우선순위 체계로 통합됨.

### F-07. Prism 레어 가챠 + Pity 시스템 (P0 / S1)
- 뽑기 시 **0.5% 확률** Prism T1 출현 (모든 스탯 ×1.30, Rainbow 속성 = 모든 속성으로 조합 가능)
- Pity: 10연뽑 내 T2+ 1개 보장 (10번 모두 T1이면 마지막 T1 강제 T2 승급)
- Prism 천장: 200연뽑 누적 시 Prism 확정 (`localStorage` 카운터)
- Prism 등장 시 화면 전체 플래시 + 사운드
- **영향 영역**: `domain/tower/tower-system.js`, `domain/progression/collection-system.js`, `infra/save-system.js`

### F-08. 킬 콤보 카운터 (P0 / S2)
- 2초 내 연속 킬 = 콤보. 2초 내 추가 킬 없으면 리셋
- 화면 중앙 큰 숫자 `12 KILLS!` 펄스 애니메이션
- 마일스톤 (10 / 25 / 50 / 100): 화면 플래시 + 크리스탈 보너스
- 최대 콤보는 게임 결과·리더보드·도전과제에 기록
- **영향 영역**: `domain/combat/game-engine.js`, `components/ComboIndicator.jsx` (신규)

### F-09. Near-miss 연출 (P0 / S3)
- `lives ≤ 5`: 화면 테두리 붉은 vignette + ⚠️ 상단 깜빡임
- `lives ≤ 2`: vignette 진하게 + BGM 피치 −10%
- `lives = 0` 직전 적: 슬로우모션 (gameSpeed 일시 0.5×)
- 웨이브 마지막 적에 BOSS 스타일 강조 테두리
- **영향 영역**: `App.jsx` lives 감지, `css/styles.css` vignette, `infra/sound.js` 피치

### F-10. 스테이지 별점 1~3★ (P1 / A1)
- ★ 클리어 / ★★ lives 50%+ 유지 / ★★★ lives 손실 0 (퍼펙트)
- `localStorage` 저장, 스테이지 맵에서 표시
- 모든 스테이지 3★ → "Master" 칭호 + 크리스탈 보너스
- 갱신 규칙: 현재 별점 이하면 갱신, 이상이면 유지
- **영향 영역**: `domain/progression/game-stats.js`, `infra/save-system.js`, 메뉴 UI

### F-11. 7일 출석 보상 (P1 / A2)
- 첫 런치 후 매 24시간 = 출석 1일 카운트
- 7일 사이클 카드 (뽑기권 / 크리스탈 / Prism 부스터)
- 7일 완주 보상: **유니크 T4 타워** (메뉴 배너로 자랑)
- 연속 출석 끊기면 day 1부터
- **영향 영역**: `infra/save-system.js`, 메뉴 UI 모달

### F-12. Danger Wave 시각/사운드 강조 (P1 / A3)
- 현재 코드는 W4+ 에 `lateWaveBonus = 1.15` HP 곱셈만 적용 — **연출이 누락**
- 마지막 웨이브 진입 시 "🚨 Danger Wave" 배너 + 적 색상 강조
- BGM 템포 상승 또는 위험 스팅거 사운드
- 통과 시 "Waved Through!" 애니메이션 + 보너스 크리스탈
- **영향 영역**: `components/WaveAnnouncer.jsx` (F-02와 공유), `infra/sound.js`

### F-13. 세트 효과 (P2 / C1)
- 같은 속성 3 / 5 / 7개 배치 시 자동 버프
  - Fire×3: 전역 burnDuration +20%
  - Electric×3: chainCount +1
  - Water×5: 슬로우 중첩 한도 +2
- 맵 상단에 활성 세트 배지 표시
- **영향 영역**: `domain/tower/tower-system.js` 카운트 집계, `domain/effect/` 글로벌 버프 채널

### F-14. 프리스티지 (P2 / B1)
- 크리스탈 1000 도달 → "별똥별 포인트(SP)" 환원 가능
- SP 해금: 스킨(타워 이펙트), 부제(프로필), 영구 패시브
- 프리스티지 전환 시 메타 업그레이드 리셋 (장기 플레이어용)
- **출시 후 라이브 업데이트 후보**

### F-15. 아티팩트/룬 영구 슬롯 (P2 / C2)
- 메타 슬롯 5개, 각 영구 패시브
- 크리스탈 가챠, 희귀도 4단계
- 예: "Neon Surge — 전투 시작 30초간 공격력 +20%"
- **출시 후 라이브 업데이트 후보** — 장르 고인물 타겟

### F-16. 유니크 카드 히든 해금 (P2 / B2)
- 도감에 ❓ 숨김 슬롯
- 해금 조건 예시:
  - 불사조: 화염 T3 조합 10회 (부활 특수)
  - 제로 카운터: lives 손실 0으로 캠페인 클리어
  - 로그 러너: Rush 5분 이내 클리어 10회
- 해금 시 화면 전체 "ACHIEVEMENT UNLOCKED" 애니메이션

### F-17. 주간 리더보드 (P2 / B3)
- 매주 월요일 00:00 리셋
- 이번 주 Rush 최단 시간 / 캠페인 최고 별점
- 시즌 종료 시 상위 10% 보상 (크리스탈 + 한정 스킨)
- 로컬 → 출시 후 서버 구축

### F-18. 간단한 스토리 텍스트 (P2 / C3)
- 각 스테이지 진입 시 5초 텍스트 장면
  - S1: "네온 시티의 방어막이 붕괴됐다…"
  - S3: "중앙 서버 침투 저지. 바이러스 감지."
  - S6: "마지막 방어선. 당신이 유일한 희망."
- 클리어 후 크레딧 스타일 에필로그
- 세계관이 생기면 스킨/이벤트 명분 확보

---

## 알려진 버그 상세 (B-01 ~ B-06)

> 출처: 구 `Saved/Problem.md` (제거됨, 본 섹션이 후속 활성 트래커)

### B-01. 설치된 타워 선택 가끔 실패 (P0)
- **증상**: 휠로 스크롤 후 맵 타워 클릭이 안 되는 경우 발생
- **추정 원인**: 스크롤 오프셋이 클릭 좌표 → 그리드 좌표 변환에 반영되지 않음
- **확인 영역**: `components/GameMap.jsx` 클릭 핸들러, 좌표 변환 로직

### B-02. 모든 타워 사거리 항상 표시 (P0)
- **증상**: 화면이 사거리 원으로 가득 차 가독성 저하
- **수정 방향**:
  - 기본 OFF
  - 옵션 1: HUD 토글 버튼 (전체 ON/OFF)
  - 옵션 2: 선택한 타워의 사거리만 표시
- **확인 영역**: `components/GameMap.jsx`, 타워 렌더 옵션

### B-03. 타겟 잃은 미사일 잔존 (P1)
- **증상**: 적 처치 시 일부 미사일이 화면에 남음. 다음 웨이브 진입 시는 정리됨
- **수정 방향**: 매 틱에서 `target` 무효 미사일 즉시 정리 또는 직진 후 화면 밖 소멸
- **확인 영역**: `domain/combat/game-engine.js` 투사체 업데이트

### B-04. 최대 티어 조합 시 UI 표기 부재 (P1)
- **증상**: T4 타워 3개 선택 시에도 조합 버튼이 활성화되어 보임 (실제 동작 없음)
- **수정 방향**: T4 + T4 + T4 또는 T4×n 조합 시도 시 "최대 티어" 라벨 + 버튼 비활성화
- **확인 영역**: `components/InventoryPanel.jsx`, `hooks/useInventory.jsx` 조합 가능 판정

### B-05. 서포트 미설치 상태에서 StatusEffect 아이콘 잔존 (P1)
- **증상**: 다음 스테이지 이동 시 서포트 타워가 없는데도 적에게 효과 아이콘이 표시됨
- **추정 원인**: 스테이지 전환 시 `enemy.statusEffects` 클리어 누락 또는 캐리오버 잔여
- **확인 영역**: `domain/effect/status-effect.js`, 스테이지 전환 hook

### B-06. 광휘 계열 공격 안 함 (P0 — 회귀)
- **증상**: 광휘(스틸글로우 라인) 타워가 공격을 시작하지 않음
- **확인 영역**: `domain/tower/abilities/light-ability.js`, 공격 라우팅 (`AbilitySystem`)
- **재현 시나리오**: 광휘 T1~T4 단독 배치 → 적이 사거리 진입 시 공격 발동 여부 확인

---

## 장기 비전 (재검토)

> 본 섹션의 항목들은 **현재 구현과 충돌**하므로 즉시 백로그에 편입하지 않는다.
> 추후 팀 의사결정이 필요한 거대 변경이며, 채택 시 본 섹션이 신규 F-XX 항목으로 전환된다.
> 원본 문서는 `archive/vision-10wave/` 에 보존되어 있다.

### V-01. 10웨이브 구조 전환
- **출처**: [`archive/vision-10wave/Balance.md`](../archive/vision-10wave/Balance.md), [`archive/vision-10wave/NeonDefense_Design.md`](../archive/vision-10wave/NeonDefense_Design.md)
- **요지**: 스테이지당 5웨이브 → **10웨이브 고정**, Wave 10 = 보스
- **현재 충돌**: F-02(W2/W4 이벤트 슬롯), F-04(W5 보스), F-06(W3 챌린지) 모두 5웨이브 전제로 설계됨
- **결정 필요**: 10웨이브 채택 시 F-02/04/06 슬롯 매핑 전면 재작성 필요

### V-02. T4 "극단화 2택" 진화 시스템
- **출처**: [`archive/vision-10wave/TierTower.md`](../archive/vision-10wave/TierTower.md)
- **요지**: 현재 T4 = 역할 3종 → **T3 역할별 A/B 2택 극단화** 로 변경
- **현재 충돌**: F-01(T5 융합 타워)이 "T4 역할 무관" 규칙으로 설계됨. T4 시스템 변경 시 F-01 재료 규칙 재검토 필요
- **결정 필요**: T4 정체성을 "다양성"(현재 3종) vs "극단화"(2택) 중 어느 쪽으로 갈지

### V-03. 스테이지 보상 카드 20종
- **출처**: [`archive/vision-10wave/NeonDefense_Design.md`](../archive/vision-10wave/NeonDefense_Design.md)
- **요지**: 스테이지 종료 시 20종 카드 풀에서 3장 중 1장 선택 (운영/빌드강화/리스크리턴 카테고리)
- **현재 상태**: "영구 버프 3가지 중 1개 선택"이 이미 구현됨 (`PermanentBuffManager`)
- **결정 필요**: 기존 영구 버프 시스템을 카드 20종으로 **확장**할지, **유지**할지

---

## 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-04-25 | 초기 통합본 (F-01 ~ F-06) |
| 2026-04-25 | DOPAMINE 통합 (F-07 ~ F-18), Problem.md 버그 통합 (B-01 ~ B-06), 장기 비전 (V-01 ~ V-03) 섹션 추가. 구버전 비전 문서 `archive/` 이동에 따른 링크 갱신. |
