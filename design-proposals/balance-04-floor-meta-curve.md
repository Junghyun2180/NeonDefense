# [밸런스 04] Floor 메타 + 영구 스탯 곡선 검증

## 1. 재검토 사유
합의 08 "1 run=90W" 폐기 → **1 run=3 stage × 10 wave=30W (15~20분), Floor 는 run 외부 progression** (N 클리어 → N+1). `1.15^N` 은 stage 내부 곱이 아닌 **런 baseHP 외부 다이얼**.

## 2. Floor 1~10 난이도 곡선
HP: `base × (1+(s-1)×stageGrowth) × (1+(w-1)×waveGrowth) × floorMult` (`run-mode-constants.js:111-118`). 보스: `30 × bossFormula(s) × floorMult`. floorMult=`1.15^(N-1)`.

| Floor | floorMult | S3W10 일반 HP | S3W10 보스 HP |
|---:|---:|---:|---:|
| 1  | 1.00 | 222 |   720 |
| 2  | 1.15 | 255 |   828 |
| 3  | 1.32 | 293 |   950 |
| 5  | 1.75 | 388 | 1,260 |
| 7  | 2.31 | 513 | 1,663 |
| 10 | 3.52 | 781 | 2,534 |

> base 30, S3 ×2.0, W10 ×3.7. 보스 `30×(15+3×3)×mult`.

## 3. META_UPGRADES 현황 (`run-mode-constants.js:173-254`)

| ID | Lv당 | maxLv | Max | 누적비용 |
|---|---|---:|---|---:|
| startingGold    | +5G  | 15 | +75G | ~580 |
| startingLives   | +1   |  8 | +8   | ~360 |
| baseDamage      | +1%  | 30 | +30% | ~1,650 |
| baseAttackSpeed | +1%  | 20 | +20% | ~990 |
| goldMultiplier  | +3%  | 15 | +45% | ~810 |
| drawDiscount    | -1G  |  5 | -5G  | ~600 |
| rerollCount     | +1   |  5 | +5회 | ~600 |
| carryoverSlots  | +1   |  5 | +5   | ~470 |

**풀맥스 ≈ 6,060 크리스탈.** Floor 1 클리어 1회 ≈ `50+30+20+S30 = 130` → **풀맥스 ≈ 47 런 (14~17h)**.

## 4. 0Lv vs Max — Floor 임계 시뮬

| Floor | mult | 0Lv | Mid | Max(+30%) |
|---:|---:|:--:|:--:|:--:|
| 1  | 1.00 | 가능 | 가능 | 가능 |
| 3  | 1.32 | 빠듯 | 가능 | 가능 |
| 5  | 1.75 | 어려움 | 빠듯 | 가능 |
| 6  | 2.01 | 거의불가 | 빠듯 | 가능 |
| 8  | 2.66 | 불가 | 어려움 | 빠듯 |
| 10 | 3.52 | 불가 | 불가 | 어려움 |

**관찰**: 0Lv Floor 1 가능 → 진입 장벽 X (OK). Floor 5~6 부터 메타 동기 발생 (의도). **단 Max(+30%)도 Floor 9~10 빠듯** — 메타 천장 < floor 천장. balance-03 "MVP=floor 1~3" 와 정합.

## 5. 메타 동기 검증

**한계**: `baseDamage +30%` 는 Floor 5(×1.75) 못 따라잡음 → DMG 천장 부족. floor-의존 스탯 0종, floor 별 차별 보상 X.

**신규 권고**:

| ID | 효과 | Lv |
|---|---|---|
| **floorBonusGold**    | 클리어 floor 당 +5G   | floor 비례 |
| **damageVsHighFloor** | floor≥5 추가 DMG     | 10/+2% |
| **crystalMultiplier** | 크리스탈 +%          | 10/+5% |
| baseDamage 확장       | maxLv 30→50          | +1% |

추가로 **floor 첫 클리어 보너스** (+50) — `campaignFirstClearBonus` 패턴 이식.

## 6. 권고
**부분 도입 + 메타 보강.** META_UPGRADES 8종은 floor 전제 X. MVP=1~3 + 위 4종 동반 도입해야 Floor 5+ 곡선 의미.

## 7. 검증 KPI
1. **Floor 1 첫 클리어율 ≥ 70%** (0Lv 평균 플레이어).
2. **Floor 별 평균 시도 ≤ 5회** (Floor 5 까지).
3. **풀맥스 누적 플레이타임 12~18h** 범위.

## 8. 리스크
- `metaProgress.currentFloor` 마이그레이션 필요.
- Floor 4~5 정체감 — 후반 전용 스탯이 완화.
- 20-floor 풀구현 X (MVP 1~3).
