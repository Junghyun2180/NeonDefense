# Archive

> 보존용 아카이브. **현재 작업의 단일 소스(Single Source of Truth)는 [`design-proposals/FEATURE_BACKLOG.md`](../design-proposals/FEATURE_BACKLOG.md) 입니다.**
> 본 디렉토리의 문서는 참고용으로만 보존되며, 신규 기획·구현 시 이 문서들을 직접 따르지 마십시오.

## 이동 매핑

| 아카이브 위치 | 원본 위치 | 보존 사유 |
|---|---|---|
| `vision-10wave/Balance.md` | `.claude/MD/Balance.md` | 10웨이브 v2 비전 — 현재 5웨이브 구현과 충돌하나 후일 재검토 가치 있음 |
| `vision-10wave/TierTower.md` | `.claude/MD/TierTower.md` | T4 "극단화 2택" 비전 — 현재 T4 역할 3종 구현과 다른 방향 |
| `vision-10wave/NeonDefense_Design.md` | `.claude/MD/NeonDefense_Design.md` | 10웨이브 PvE 로그라이크 정체성 + 스테이지 보상 카드 20종 비전 |
| `implemented/PLAN_RUN_MODE_IMPLEMENTATION.md` | `Plan/PLAN_RUN_MODE_IMPLEMENTATION.md` | 런모드 구현 계획서 — 이미 구현 완료 |
| `content-design/DOPAMINE_CONTENT_DESIGN.md` | `Plan/DOPAMINE_CONTENT_DESIGN.md` | 도파민 콘텐츠 Tier S/A/B/C — `FEATURE_BACKLOG.md` F-07~F-13 으로 통합됨 |
| `balance-logs/Log.md` | `Saved/Log.md` | 2026-02 밸런스 로그 데이터 |

## 카테고리

### `vision-10wave/`
스테이지를 10 웨이브로 재편하는 구버전 설계 비전. 현재 구현(5 웨이브 × 6 스테이지)과 충돌하므로 백로그에서는 "장기 비전 (재검토)" 섹션의 참조 링크로만 다룬다. 10웨이브로 전환하기로 결정될 경우 본 문서들이 출발점이 된다.

### `implemented/`
이미 구현이 완료된 플랜 문서. 구현 결과는 코드와 `CLAUDE.md` 에 반영되어 있어 본 문서는 더 이상 갱신되지 않는다. 구현 의도/결정 이력 추적용으로만 보존.

### `content-design/`
`FEATURE_BACKLOG.md` 에 통합된 콘텐츠 기획서의 원본. 백로그의 항목은 요약본이며, 상세 설계 의도가 필요할 때 본 원본을 참조한다.

### `balance-logs/`
과거 플레이테스트 밸런스 로그. `balance-logger.js` 가 산출한 raw 데이터로, 현재 밸런스 진단의 비교 기준점으로 보존.
