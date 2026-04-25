# Design Proposals

Neon Defense 기획·밸런스 제안 모음.

- `game-designer` 에이전트 → 신규 콘텐츠·시스템 기획안 (`NN-<topic>.md`)
- `game-balancer` 에이전트 → 난이도·모드 진단 리포트 (`balance-NN-<topic>.md`)

## Index

<!-- 에이전트들이 새 문서를 추가할 때 이 목록을 갱신한다 -->

### 기획안 (game-designer)

| # | 제목 | 카테고리 | 요약 |
|---|---|---|---|
| 01 | [원소 융합 타워 (Elemental Fusion) — T5 파라곤 시스템](./01-elemental-fusion-tower.md) | 타워 다양성 / End-Game | 이종 속성 T4 2기 + 융합 코어로 T5 레전더리(15종) 제작. BTD6 Paragon 영감. |
| 02 | [이벤트 웨이브 & 동적 맵 기믹](./02-event-waves-and-map-gimmicks.md) | 후반 콘텐츠 / 전투 다양성 | 웨이브마다 8종 이벤트 조건, 맵에 4종 기믹 타일 배치. Kingdom Rush · PvZ · Infinitode 영감. |
| 03 | [다페이즈 보스 시스템 (Multi-Phase Bosses)](./03-multiphase-boss-system.md) | 후반 콘텐츠 / 보스 | HP 66%/33% 구간 페이즈 전환 + 속성별 테마 보스 4종(화염/냉기/전격/공허). Kingdom Rush · BTD6 Boss Bloons · Arknights 영감. |
| 04 | [스테이지 구조 재설계 (Chapter-Checkpoint)](./04-stage-structure-redesign.md) | 코어 루프 / 진행 구조 | 6×5 캠페인 비판 + 4 대안 비교. 추천: 2 챕터 × 12 웨이브 + W4/W8 체크포인트(보드 유지). Slay the Spire · Kingdom Rush 영감. |
| 05 | [방어력 / 실드 시스템](./05-armor-and-shield-system.md) | 전투 다양성 / 카운터 메타 | Armor(flat 차감) + Shield(별도 게이지) 도입. 광휘=관통, 전격=실드 브레이커로 속성 카운터 메타 형성. ArmorBreakEffect 신설. |
| 06 | [회의록: 스테이지 구조 + 방어력/실드 합의안](./06-meeting-stage-structure-and-armor.md) | 합의 / 롤아웃 | 디자이너(전면 개편)·밸런서(현행 유지) 충돌 → **점진 개편 합의**: 캠페인은 CARRYOVER 강화 + W3 챌린지, 챕터 모델은 신규 모드로 시즈. Armor MVP는 elite 만 armor=3 으로 보수적 도입. |
| 07 | [네온 사우론 타워 — 무한 등반 캠페인 재설계 비판](./07-saurom-tower-campaign.md) | 코어 루프 / 메타 진행 | 3×10 + W5/W10 보스 + 20 floors 테마 안건 비판 검토. 결론: **신규 "등반 모드"로 분리, 캠페인 본체 대체 ❌**. 보스 120종·테마 96 스킨 비용 치명, 04 폐기 권고. |
| 08 | [회의록: 사우론 타워 합의안](./08-meeting-saurom-tower.md) | 합의 / 롤아웃 | 디자이너(분리)·밸런서(부분 도입) 충돌 → **유한 캠페인 (3 floors × 3 stages × 10 waves = 90 waves) + 무한 등반은 별도 모드** 합의. W5 미니/W10 스테이지보스 채택. 04 폐기, 06 1단계 흡수, balance-02 부분 뒤집음. |

### 밸런스 리포트 (game-balancer)

| # | 제목 | 요약 |
|---|---|---|
| 01 | [난이도 곡선 진단](./balance-01-difficulty-curve.md) | 캠페인 6스테이지 HP·경제 곡선 정량 분석. 초반 슬럼프·중반 도파민 부재·후반 T4 병목 진단 및 경제 튜닝 / W3 미니 챌린지 처방 2안. |
| 02 | [스테이지 구조 변경안 수치 검증](./balance-02-stage-structure-numbers.md) | 6×5 vs 3×12 vs 1×30 시뮬 비교. 결론: **현행 6×5 유지 + 부분 조정** 권고 — 캐리오버로 빌드 만족감 보존, 스파이크 빈도 1위. (※ balance-03 에서 부분 뒤집힘) |
| 03 | [사우론 타워 구조 (3×10 / 20-floor) 검증](./balance-03-saurom-tower-numbers.md) | 1 floor=3×10 시뮬 + Floor 인플레 모델 A/B/C 비교. 결론: **부분 도입** — 3×10 + W5/W10 보스 + Floor B(1.15^N) 채택, MVP 1~3 floor. 영구버프는 W10 만, 미니는 골드만. |
