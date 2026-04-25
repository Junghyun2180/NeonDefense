# [제안 09] 모바일 친화 일시정지/저장 시스템

## TL;DR
**일시정지(즉시) + 웨이브 단위 자동저장 + 백그라운드 자동 pause** 3종 콤보를 도입한다. 패배(lives=0) 직전이 아닌 모든 상태에서 게임은 멈추거나 저장될 수 있어야 한다.

## 문제 정의 (Why)
- 1 run = 30W = 15~20분. 모바일 우선이지만 통화/앱 전환/지하철 환승 등으로 중단 빈번.
- 현행 `infra/save-system.js`는 `stage / wave / gold / lives / towers / inventory / permanentBuffs` 만 저장. **웨이브 진행 중인 적/투사체/스폰 큐는 직렬화되지 않음** → 웨이브 중간 종료 시 진행 손실.
- `useSaveLoad.jsx`의 자동 저장은 **stageClear 시점에만** 동작 (`saveLoadMode === 'stageClear'`). 일시정지/백그라운드 트리거 없음.
- 게임 루프(`useGameLoop.jsx`)에 pause 분기 없음 → 사용자가 손 뗀 사이에도 적이 진행해서 lives가 깎임.

## 참고 사례 (역기획)
| 게임 | 시스템 | 우리 적용 |
|---|---|---|
| Bloons TD 6 | 라운드 시작 전만 자동저장, 라운드 중 pause는 가능하나 저장X | 우리는 모바일 비중↑이므로 라운드 중 강제저장 필요 |
| Kingdom Rush | 웨이브 단위 체크포인트 + pause 버튼 큰 UI | 동일하게 wave 단위 스냅샷 |
| Random Dice | 비동기 매치, pause 없음 | 우리는 싱글이므로 자유롭게 pause 가능 |
| Arknights | 작전 도중 앱 백그라운드 → 자동 일시정지 + 복귀 시 재개 | `visibilitychange` 훅으로 동일 적용 |

## 3가지 모드 정의

| 모드 | 트리거 | 시뮬레이션 | 저장 | UI |
|---|---|---|---|---|
| **Pause** | 사용자 버튼 / `visibilitychange:hidden` | 정지 | X (메모리만) | 흐림 + 재개/메뉴 |
| **Auto-Save** | 매 wave 종료 / `pagehide` / `visibilitychange:hidden` 5초 후 | 진행 (일반시) | wave 스냅샷 | 우상단 토스트 |
| **Manual Save & Quit** | 메뉴의 "저장하고 나가기" 버튼 | 정지 | wave 스냅샷 | 확인 알럿 |

## 모바일 트리거 분석

| 이벤트 | 발생 시점 | 권장 동작 |
|---|---|---|
| `visibilitychange (hidden)` | 앱 전환, 화면 잠금 | **즉시 Pause + 5초 후에도 hidden이면 자동 저장** |
| `visibilitychange (visible)` | 복귀 | Pause 유지 (사용자가 재개 버튼) → 카운트다운 3..2..1 |
| `pagehide` | 탭 종료, 앱 강제 종료 | **동기 저장** (localStorage는 동기라 가능) |
| `beforeunload` | 새로고침/닫기 | 저장 + 확인 다이얼로그 |
| 사용자 Pause 버튼 | 명시적 | Pause만 (저장 X) |

> 근거: `infra/save-system.js`는 localStorage 기반(동기 API)이므로 `pagehide` 핸들러에서 직렬화 가능.

## 저장 데이터 정의 (현행 위에 추가)

현행 `SaveSystem.save()`의 `version: 1`을 `v2`로 올리고 다음 필드 추가:

| 필드 | 내용 | 비고 |
|---|---|---|
| `mode` | `campaign / run / bossRush` | DataResolver 분기 |
| `inProgress` | bool. 웨이브 진행 중 여부 | false면 기존과 동일 |
| `runtime.enemies[]` | 적 배열 (id, type, hp, x, y, pathId, pathIndex, statusEffects) | `EnemySystem.create` 역직렬화 필요 |
| `runtime.projectiles[]` | 투사체 (생략 권장 — 1프레임 손실 허용) | MVP에서는 비움 |
| `runtime.spawnQueue` | 남은 스폰 수, 다음 스폰 시각 오프셋 | `useGameLoop`의 `localSpawnedCount` |
| `runtime.killedCount / spawnedCount` | 진행도 | 클리어 판정 복원 |
| `runtime.waveStartedAt` | 게임 시간(누적 ms) | Date.now() 의존 회피 |
| `carryover` | 합의 08의 캐리오버 보유 (스킬/유물) | 스테이지 사이 |
| `pausedAt / playTimeMs` | 누적 플레이 시간 | 통계 정확성 |

**저장 단위 권고: 웨이브 단위(안전).** 사유:
1. 적 status effect, 투사체 in-flight, 차임라이트닝 같은 임시 객체까지 직렬화하면 버그 표면이 커진다.
2. 1웨이브 ≈ 30~40초 손실은 사용자 인내 가능 범위 (Kingdom Rush 동일).
3. tick 단위 저장은 60Hz × 30W → 직렬화 비용 + 호환성 깨짐 위험.
4. 단, **웨이브 진행 중 백그라운드 진입**은 그 wave를 **시작 시점으로 롤백**하여 저장 (스폰 큐/처치수 0 리셋, 적 배열은 비움). 이게 가장 단순하고 안전.

## UX 디테일

| 항목 | 사양 |
|---|---|
| Pause 버튼 | `GameHeader.jsx` 우상단, 44px × 44px (iOS HIG 터치 최소) |
| 흐림 효과 | `backdrop-filter: blur(8px)` + 네온 보더 |
| 재개 카운트다운 | 3 → 2 → 1 → GO (1초 간격, 큰 폰트) |
| 자동저장 토스트 | 우상단 2초 페이드 "자동 저장됨" |
| 저장하고 나가기 | 확인 다이얼로그 ("진행 중인 웨이브는 처음부터 시작합니다") |
| 백그라운드 복귀 | "일시정지됨" 모달 강제 표시 (자동 재개 X — 안전) |

## 구현 영역 (DDD 기준)

| 파일 | 변경 |
|---|---|
| `domain/combat/game-engine.js` | `gameTick(state)` 진입에 `if (state.paused) return state;` 분기. `now` 인자 외부 주입 권장 |
| `hooks/useGameLoop.jsx` | `paused` ref 도입. `setInterval` 콜백 내부에서 분기. `clearInterval`은 언마운트시만 |
| `infra/save-system.js` | `version: 2`, `runtime` 직렬화/역직렬화 로직, `validateSaveData` v2 분기 |
| `hooks/useSaveLoad.jsx` | `visibilitychange / pagehide` 리스너, `handlePause`, `handleResume` |
| `components/GameHeader.jsx` | Pause 버튼, 자동저장 토스트 |
| `components/PauseModal.jsx` (신규) | 흐림 오버레이, 재개/메뉴 버튼, 카운트다운 |
| `App.jsx` | `paused` 상태 관리, 모달 렌더 분기 |

> 구체 수치/모달 디자인은 `UIRefactor` 스킬, 직렬화 포맷은 `BalanceDesigner` 핸드오프.

## 위험 / 오픈 이슈

| 이슈 | 대응 |
|---|---|
| **Date.now() 의존 status effect** (BurnEffect.tick 등) pause 후 종료시각 오작동 | 게임 내부 시간 `gameNow`로 추상화 (pause 동안 증가 정지). 마이그레이션 비용 큼 → V2로 이연. MVP에서는 pause 진입 시 모든 statusEffect의 `expiresAt`을 `expiresAt - now` (남은시간)로 변환 후 재개 시 재계산 |
| **다른 폰에서 이어하기** | 로컬 저장으로는 불가. V3 클라우드 동기화 (Firebase/PlayGames). MVP에서는 명시 X |
| **모바일 저전력 모드 / iOS 백그라운드 30초 제한** | `pagehide` 동기 저장으로 대응. 백그라운드 타이머는 어차피 멈추므로 자동 pause와 부합 |
| **저장 데이터 비대화** | 적 배열 비우는 정책으로 < 50KB 유지 |
| **치트 콘솔과의 상호작용** | 치트 키 `` ` `` 도 pause 중 동작 가능하게 (디버깅) |

## 롤아웃 (MVP → V2 → V3)

| 단계 | 범위 | 산출물 |
|---|---|---|
| **MVP** | Pause 버튼 + `visibilitychange` 자동 pause + 카운트다운 | `useGameLoop` 분기, `PauseModal`, GameHeader 버튼 |
| **V2** | 웨이브 단위 자동 저장 + "저장하고 나가기" + statusEffect 시간 추상화 | `save-system v2`, `pagehide` 훅 |
| **V3** | 클라우드 동기화, 멀티 디바이스 이어하기 | 별도 백엔드 검토 |

수치/UX 디테일은 `BalanceDesigner` / `UIRefactor` 스킬로 핸드오프.
