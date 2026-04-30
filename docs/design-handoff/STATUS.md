# Holographic Command — Implementation Status

본 문서는 `next-steps.html`의 14개 티켓 진행 상태를 추적합니다.
원본 디자인 명세는 `handoff-spec.html`(디자인 스펙) / `next-steps.html`(작업 스텝).

## 파일 인덱스

| 파일 | 역할 |
|------|------|
| `handoff-spec.html` | 디자인 명세서 v1.0 (컬러·타이포·컴포넌트·레이아웃) |
| `next-steps.html` | 14개 티켓 실행 계획서 (3 스프린트 / 17일) |
| `shared-tokens.css` | 디자인 시안 공통 토큰 (참고용) |
| `shared-game-scene.jsx` | 인게임 씬 시안 컴포넌트 (참고용) |
| `chat-history.md` | 디자이너-사용자 의사결정 기록 (1.7K lines) |
| `README.md` | 디자인 핸드오프 번들 안내 (claude.ai/design 발신) |

## Sprint 1 — In-Game HUD (완료)

| ID | 제목 | 상태 | 비고 |
|----|------|------|------|
| T01 | 토큰 시스템 도입 | ✅ DONE | `css/holo-tokens.css` 542 lines |
| T02 | GameHeader 5 vital 가로 배치 | ✅ DONE | `js/components/GameHeader.jsx` |
| T03 | GameMap · 레티클 + 데이터 스트림 | ✅ DONE | `js/components/GameMap.jsx` |
| T04 | ControlPanel · 3카드 우측 레일 | ✅ DONE | `js/components/ControlPanel.jsx` |
| T05 | Inventory 10열 그리드 + 탭 | ✅ DONE | ControlPanel 하단 통합 |
| T06 | 사거리 표시 (클릭 시 단일 표시) | ✅ DONE | 사용자 결정: 전체 토글 버튼/R 단축키는 도입하지 않음 (2026-04-30) |

### Sprint 1 추가 산출물
- `js/components/CommandBar.jsx` — 우상단 SPEED + DEPLOY + ♪♬? 패널 (스펙 외 신규)

### 스펙 대비 의도적 미구현
- **토글 버튼 / 키보드 단축키 일체 미도입** — 사용자 명시 결정. 향후 작업 제안 시 토글·핫키 형태(R/Q/W/E/Space 등)로 기능을 추가하지 말 것.

## Sprint 2 — Main 5-page Split (완료)

| ID | 제목 | 상태 | 산출물 |
|----|------|------|--------|
| T07 | HoloShell + (라우터) | ✅ DONE | `js/components/main/HoloShell.jsx` — 좌 220px nav · 상단 ops bar · 푸터. URL hash 라우터는 사용자 선호(토글/단축키 미도입)에 맞춰 의도적 미도입, 상태 기반 page switching. |
| T08 | Home · 홀로 프로젝션 + 미션 3장 | ✅ DONE | `js/components/main/Home.jsx` — 좌측 projection chamber (SectorTower + stage stars), 우측 미션 3장 (Campaign / Run / Endless-locked) + Resume 카드 + DEPLOY 버튼. |
| T09 | Codex · 도감 3컬럼 | ✅ DONE | `js/components/main/Codex.jsx` — 좌 카테고리/필터/완성도, 중앙 카드 그리드, 우 인스펙터. CollectionModal은 더 이상 메뉴에서 호출되지 않음 (게임 내 사용 그대로). |
| T10 | Profile + Meta | ✅ DONE | `js/components/main/Profile.jsx` — 오퍼레이터 카드 + 메타 progression + 업적 14종 그리드 + 최근 전적 테이블. `js/components/main/Meta.jsx` — 크리스탈 잔액 + 3 branches 트리 + 노드 인스펙터(Allocate). |
| T11 | Rank · 리더보드 | ✅ DONE | `js/components/main/Rank.jsx` — 모드 필터 (4종) + Top 3 포디움 (silver-gold-bronze 시각 정렬) + Top 10 테이블. 로컬 Leaderboard 시스템 사용. |

### Sprint 2 의도적 미구현
- **URL hash 라우터** — `#/main/codex` 형태 미도입. 토글/단축키 미도입 정책과 동일 선상에서 상태 기반 nav 만 사용.
- **MainMenu.jsx** 는 HoloShell 마운트 + page switch 만 담당하는 얇은 셸 (110 lines).
- 기존 `CollectionModal.jsx` / `MetaUpgradePanel.jsx` / `LeaderboardTab.jsx` 는 그대로 유지 (게임 내 다른 진입점에서 사용 가능). 메인 메뉴는 신규 `main/` 컴포넌트만 사용.

## Sprint 3 — Polish (보류 중)

| ID | 제목 | 상태 |
|----|------|------|
| T12 | 모션 · 트랜지션 적용 | 🟡 PARTIAL (일부 keyframes만) |
| T13 | 접근성 + 다국어 점검 | ❌ NOT AUDITED |
| T14 | 디바이스 매트릭스 QA + 릴리즈 | ❌ NOT STARTED |

## 다음 작업 추천

1. **Sprint 2 시작 여부 결정** — MainMenu를 단일 컴포넌트 유지 vs 5페이지 라우터 분해. 후자는 큰 리팩토링.
2. **Sprint 3는 Sprint 2 직후가 자연스러움** — 모션/A11Y는 페이지 구조 확정 후 일괄 적용.

> Sprint 1은 사용자 기준에서 종료(T06 토글/단축키 미도입 확정).
