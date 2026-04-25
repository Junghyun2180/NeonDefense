# [회의록 10] 사우론 타워 정정 + 모바일 친화 합의

> 작성: 회의 합의 (사용자 정정 × game-designer × game-balancer)
> 입력: 사용자 메시지 (정정), `09-mobile-pause-save.md`, `balance-04-floor-meta-curve.md`
> 대체: 합의 08 의 "1 run = 90W" 가정 폐기

---

## 0. 사용자 정정 (가장 중요)

| 항목 | 합의 08 (구) | **정정 (신)** |
|---|---|---|
| 1 run 길이 | 3 floors × 3 stages × 10 waves = 90W (60분+) | **3 stages × 10 waves = 30W (15~20분)** |
| Floor 의미 | 한 런 안에서 진행 | **런 외부 progression** — Floor N 클리어 → Floor N+1 도전 |
| 리텐션 동기 | 무한 등반 매력 | **영구 스탯 (META_UPGRADES) 강화 필요성** = floor 가 올라갈수록 메타 안 찍으면 못 깸 |
| 모바일 친화 | 미정의 | **pause / save 필수** (15~20분 세션이라도 모바일은 중단 빈번) |

→ "캠페인을 해야 할 이유" 의 진짜 답: 세션은 짧게(30W), 그러나 **세션을 반복해 메타를 쌓아야 다음 floor 가 열리는** 구조.

---

## 1. 합의 골격

### 1-1. 1 Run = 캠페인 1회 = 30W
```
Stage 1 (W1~10) → Stage 2 (W1~10) → Stage 3 (W1~10)
            W5: 미니보스 / W10: 스테이지 보스 (각 stage 마다)
```
- 보스 6회/run (미니 3 + 스테이지 3) — `balance-03` 시뮬에서 6×5 동률
- 영구버프 트리거: **W10 only** (인플레 방지) — 3장/run
- W5 미니보스는 골드 + 캐리오버 슬롯 +1 만
- 보드 와이프: W10 보스 처치 시 + Stage 경계 (현행 정책 유지)

### 1-2. Floor = 런 단위 외부 progression
```
Floor 1 (run 1: 30W, base HP) → 클리어 → Floor 2 해금
Floor 2 (run 2: 30W, HP × 1.15) → 클리어 → Floor 3 해금
... 
Floor N (HP × 1.15^(N-1))
```
- Floor 진척은 영구 저장 (`metaProgress.currentFloor`)
- Floor 클리어 시 크리스탈 보너스 + 다음 floor 해금
- Floor 5+ 부터 메타 스탯 없이는 사실상 불가 (밸런서 04 시뮬)

### 1-3. 메타 진척 = 리텐션 엔진
- 현재 `META_UPGRADES` 8종 (`run-mode-constants.js:173-254`) 은 floor 전제 X
- **신규 4종 추가** (밸런서 04 §5 권고):
  - `floorBonusGold`: 클리어 floor 당 +5G 시작
  - `damageVsHighFloor`: floor ≥5 적 추가 DMG (10/+2%)
  - `crystalMultiplier`: 크리스탈 획득 +% (10/+5%)
  - `baseDamage maxLv 30→50` 확장

### 1-4. 모바일 pause/save (디자이너 09)
- **MVP**: Pause 버튼 (`GameHeader` 우상단 44px) + `visibilitychange` 자동 pause + 카운트다운 재개
- **V2**: 웨이브 단위 자동 저장 + "저장하고 나가기" + statusEffect 시간 추상화
- **V3**: 클라우드 동기화

---

## 2. 두 산출물 정합성

| 영역 | 디자이너 09 (pause/save) | 밸런서 04 (메타 곡선) | 합의 |
|---|---|---|---|
| 1 run 길이 | 30W 전제 ✓ | 30W 전제 ✓ | 30W 확정 |
| Floor 외부 | 직접 언급 X (저장 단위로만) | 외부 progression 명시 ✓ | 밸런서 안 채택 |
| 자동 저장 단위 | wave 단위 (안전) | — | wave 단위 채택 |
| 메타 보강 | — | 4종 신규 권고 | 채택 |
| MVP 범위 | Pause 만 | Floor 1~3 만 | **둘 다 동시 MVP** |

→ 충돌 없음. 두 산출물이 서로 보완.

---

## 3. 합의 8 ↔ 합의 10 비교 (변경점)

| 영역 | 합의 08 | 합의 10 (정정) |
|---|---|---|
| 1 run = | 90W (3 floors 안에) | **30W (1 floor)** |
| Floor 안에 stage | 3 | 3 (동일) |
| Stage 안에 wave | 10 | 10 (동일) |
| W5/W10 보스 | 채택 | 채택 (동일) |
| Floor 의미 | 런 내부 = 1 캠페인 = 90W | **런 외부 = 1 캠페인 = 1 floor = 30W. floor 누적은 세이브에 영구** |
| 리텐션 동기 | 90W 한 번이 매력 | **메타 스탯 찍어야 다음 floor 가능** |
| 모바일 pause/save | 언급 X | **MVP 필수 동반** |
| 등반 모드 분리 | 캠페인 클리어 후 해금 | **불필요 — 캠페인이 곧 등반** |
| 테마 | floor 단위 | floor 단위 (그대로 유효) |

---

## 4. 실행 순서 (롤아웃)

| 순번 | 작업 | 영향 파일 |
|---|---|---|
| **1** | `SPAWN.wavesPerStage 5→10`, `maxStage` 의미 = stage per floor 로 재정의 | `constants.js`, `data-resolver.js` |
| **2** | `metaProgress.currentFloor` 추가 + Floor 클리어 시 +1 + 해금 모달 | `progression/permanent-buff.js` 또는 신규 `floor-progress.js`, `infra/run-save-system.js` |
| **3** | Floor multiplier `1.15^(N-1)` 적용 — `calcBaseHealth` 에 floor 인자 추가 | `data-resolver.js`, `enemy-system.js` |
| **4** | W5 미니보스 + W10 스테이지보스 트리거 — `SPAWN_RULES` 분기 | `constants.js`, `enemy-system.js`, `enemy-ability.js` |
| **5** | 영구버프 트리거를 W10 only 로 한정, W5는 골드 + 캐리오버 슬롯 +1 | `permanent-buff.js`, `useGameState.jsx` |
| **6** | **메타 신규 4종**: `floorBonusGold`, `damageVsHighFloor`, `crystalMultiplier`, `baseDamage maxLv 30→50` | `run-mode-constants.js:173-254` |
| **7** | **Pause 시스템 MVP**: `useGameLoop` paused 분기 + `GameHeader` Pause 버튼 + `visibilitychange` 훅 + `PauseModal` | `useGameLoop.jsx`, `game-engine.js`, `GameHeader.jsx`, `App.jsx`, `PauseModal.jsx` (신규) |
| **8** | 검증 (KPI 표) | — |
| **9** | (V2) 웨이브 단위 자동 저장 + statusEffect 시간 추상화 | `save-system.js` v2, `status-effect.js` |
| **10** | (V2) Floor 4~5 추가 + 테마 2종 | 자산 + `game-data.js` |

---

## 5. 검증 KPI (Floor 1~3 MVP)

| KPI | 목표 |
|---|---|
| Floor 1 첫 클리어율 (0Lv 메타) | ≥ 70% |
| Floor 별 평균 시도 횟수 (Floor 5 까지) | ≤ 5회 |
| 풀맥스 누적 플레이타임 | 12~18시간 |
| 1 run 평균 시간 | 15~22분 |
| 모바일 백그라운드 → 복귀 시 정상 재개율 | 100% (라이프 손실 없이) |

---

## 6. 폐기·통합

- **합의 08**: 폐기. 본 합의 10 으로 대체.
- **balance-02 / balance-03**: balance-03 의 "3×10 + 1.15^N" 모델은 그대로 채택. balance-04 가 메타 영역 보강.
- **제안 04 (챕터-체크포인트)**: 폐기 유지 (08 결정 그대로).
- **제안 09 (pause/save)**: 본 합의에 통합 — MVP 동시 진행.
- **balance-04 (메타 곡선)**: 본 합의에 통합 — 신규 4종 메타 동반 도입.

---

## 7. 오픈 이슈

- **세이브 마이그레이션**: 기존 stage:1~6 → floor + stage(1~3) + wave(1~10). 호환 변환 함수 필요.
- **별점 시스템**: `StarRating.recordStage` 6 stage 가정 → "9 stage = 3 floor × 3 stage" 또는 floor 단위 재정의.
- **튜토리얼**: 첫 미니보스 등장 시 안내 + Pause 버튼 안내 (모바일 신규 유저).
- **statusEffect Date.now() 의존**: pause MVP 에서는 진입 시 `expiresAt - now` 변환, V2 에서 `gameNow` 추상화.
- **Floor 해금 보상**: 다음 floor 도전권 외에 시각 보상 (테마 미리보기, 크리스탈 부스트) 필요 검토.

---

**핵심**: "한 판은 짧게(30W·15~20분), 캠페인은 깊게(floor 누적 → 메타 → 더 높은 floor)" 의 모바일 친화 등반 구조. 디자이너의 pause/save MVP 와 밸런서의 메타 4종 신규는 **반드시 동반 도입** 해야 의미.
