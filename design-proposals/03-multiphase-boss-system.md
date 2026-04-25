# [제안 3] 다페이즈 보스 시스템 (Multi-Phase Bosses)

## TL;DR
현재 "체력만 높은 단일 적" 수준인 보스에 **HP 임계값 기반 3페이즈 전환** + **고유 보스 어빌리티(3종/보스)** 를 부여.
캠페인 W5·보스러시 전투를 "긴장감 있는 단일 이벤트" 로 바꾸고, **보스 첫 조우 인센티브** 로 도감 수집 욕구도 키운다.

## 문제 정의 (Why)
- 현재 `boss` 타입은 단일 적의 `healthMult: null + bossFormula` 스케일일 뿐, **행동 패턴/변화** 가 없다. 그냥 큰 normal.
- 플레이어는 "보스 == HP 오래 깎기". 한번 세팅이 되면 **40초 동안 지켜보기만** 하는 단조로운 전투가 된다.
- 보스러시 모드는 보스를 주력 콘텐츠로 내세우지만, 정작 보스의 **시각적/역학적 차별화** 가 거의 없어 "같은 적 체력 올린 것"에 그친다.
- `EnemyAbility` 시스템은 존재(8종 구현)하지만 **보스 전용 ability 가 없음** — 설계 공백.
- `collection-system.js` 도감에 `boss` 카드는 `ENEMY_CARDS.boss` 1장뿐. **보스 다양성 공백**.

## 참고 사례 (역기획)

### Kingdom Rush Frontiers / Vengeance — 보스 페이즈 전환
- J.T., Umbra 같은 보스는 HP 특정 구간에서 **소환/광폭화/스턴 면역 전환** 같은 페이즈 트리거가 있다.
- 유저 반응: "이 보스는 HP 50% 부터 분노한다" 가 공략 밈이 됨. **보스가 캐릭터로 기억된다.**
- 우리와 공통점: 싱글 보스가 최종 이벤트.
- 차이점: KR은 수동 영웅 조작이 있지만 우리는 타워만 있음 → **플레이어 행동 여지** 는 "보스 나오기 전에 얼마나 준비했는가" + "페이즈 전환 시점의 골드 사용" 으로 제한됨. 따라서 페이즈 전환은 **타워 배치 변경을 유도하는 방향** 이어야 한다.

### Arknights — 보스 스킬 로테이션
- 보스가 고정 간격(20초)마다 스킬 발동. 플레이어는 스킬 타이밍 맞춰 대응.
- 우리 맥락: 보스에 `skillInterval` + `onSkill()` 콜백 부여. `EnemyAbility.tick()` 기반 구현 가능.

### Hades / Slay the Spire 같은 로그라이크 보스
- 보스 HP가 3칸 이상의 "페이즈 바" 로 나뉘어 있고, 페이즈 전환 시 짧은 무적 + 효과 전환.
- 우리는 웨이브 완료까지의 "구간" 으로 활용 가능.

### Bloons TD 6 — Boss Bloons (Bloonarius, Vortex, Dreadbloon)
- 5단계 페이즈를 가지며, 각 단계 직전 **정지 + 해당 단계 속도 증가 + 스킬 발동** 순서가 고정.
- 보스별로 고유 메카닉 (독/폭발/실드/좀비화).
- 유저 반응: 주간 Boss 이벤트가 장기 리텐션 핵심 콘텐츠가 됨.

## 제안 기능 (What)

### 핵심 루프
1. 보스 등장 시 **풀 HP 상단에 페이즈 바** 표시 (3칸).
2. HP 66% / 33% 도달 시 **페이즈 전환**: 0.5초 정지 + 화면 플래시 + 이후 페이즈 ability 발동.
3. 각 보스는 **고유 ability 3종** (페이즈1/2/3 각기 다름 or 누적).
4. 보스 처치 시 도감 기록 → 해당 보스 **첫 처치 보너스** (골드/크리스탈).

### 주요 규칙
1. **보스 풀 확대**: 기존 단일 `boss` 타입 → **4종 테마 보스** 로 확대
   - `pyroLord` (🔥) — 화염 투사, 페이즈2에서 화염 장판 남김
   - `frostKing` (❄️) — 아군 적 슬로우 내성 버프, 페이즈2에서 주변 타워 일시 동결
   - `stormTitan` (⚡) — 체인 라이트닝 면역, 페이즈3에서 타워 1기를 2초 비활성
   - `voidReaper` (🌀) — 페이즈1 은신(디텍트 불가), 페이즈2 분열(실제 3마리 중 1마리만 진짜)
2. **스테이지별 보스 배정**: 씨드 기반 결정
   - 캠페인 S1~S4: 랜덤 1~2종 (약한 풀)
   - 캠페인 S5~S6: 랜덤 중에서 `voidReaper` 포함 강한 풀
   - 보스 러시: 모든 보스 순환 (웨이브 순서대로 4종 × N바퀴, 바퀴마다 체력 ×1.5)
3. **페이즈 전환 규칙**
   - HP > 66%: Phase 1 (베이스 behavior)
   - 33% < HP ≤ 66%: Phase 2 진입 시 0.5s 정지 + 페이즈2 ability 활성
   - HP ≤ 33%: Phase 3 진입 시 0.5s 정지 + 페이즈3 ability 활성 + 이동속도 ×1.3 (광폭화)
4. **페이즈 전환 중 무적** 0.5초 → 플레이어가 타워 세트업/재배치할 시간
5. **보스 어빌리티 예시** (`stormTitan`)
   - P1: 기본 이동 + 전격 면역 (electric damage 50% 감소 수령)
   - P2: 20초당 1회, 가장 가까운 타워 1기를 2초 비활성 (공격 불가)
   - P3: P2 간격 10초로 단축 + 이동속도 ×1.3
6. **보스 처치 보상**
   - 첫 처치: 골드 ×2 + 크리스탈 +20 + 도감 해금
   - 반복 처치: 골드 ×1 (기존 공식)
7. **도감 연동**: `CollectionSystem.ENEMY_CARDS` 에 4종 추가. 각 보스 처치 시 누적 카운트 증가.

### 예시 수치 — `pyroLord` (화염 군주)

| 페이즈 | HP 구간 | 이동속도 | 고유 ability |
|---|---|---|---|
| P1 | 100~66% | 0.35 | **화염 탄환**: 12초마다 가장 가까운 타워 1기를 2초 화상 디버프 (damage -30%) |
| P2 | 66~33% | 0.40 | P1 + **화염 장판**: 지나가는 경로 뒤에 3초 동안 화염 장판 남김. 장판 위 적은 `burn 면역` |
| P3 | ≤ 33% | 0.45 (광폭화 ×1.3) | P2 + **지옥불 진노**: 5초마다 주변 120px 반경 모든 타워에 2초 비활성 |

### 보스별 차별화 요약
| 보스 | 대표 카운터 | 주의 상호작용 |
|---|---|---|
| pyroLord | 냉기/광휘 추천 (화염 저항 X) | 화염 타워 효과 없음 (화상 면역은 P2부터) |
| frostKing | 화염/질풍 | 냉기 타워가 "본인" 에게 역효과 (슬로우 적용 X) |
| stormTitan | 화염/광휘 | 전격 타워 데미지 50% (빌드 전면 교체 유도) |
| voidReaper | 광휘/공허 | 체인 라이트닝이 분열체 3마리 모두에게 체인 불가 (가짜 구분 불가) |

## 구현 영역 (Where)

### 영향 받는 도메인/파일

**domain/config**
- `constants.js`
  - `BOSS_TYPES` 신규 상수 (4종 정의: id/name/icon/color/elementResist/phaseAbilities)
  - `ENEMY_CONFIG` 내 기존 `boss` 엔트리를 `BOSS_TYPES` 참조하도록 변경 (또는 병존)
  - `BOSS_PHASE_THRESHOLDS = [1.0, 0.66, 0.33]` 상수
- `game-data.js` — 모드별 보스 풀 설정 추가

**domain/enemy**
- `enemy-system.js`
  - `create()` 에서 보스 타입일 때 `BOSS_TYPES` 풀에서 씨드 기반 선택
  - `update()` (틱) 내 HP 비율 모니터링 → 페이즈 전환 트리거
  - `applyPhaseTransition(enemy, newPhase)` 신규 메서드
- `abilities/enemy-ability.js` → `abilities/boss-ability.js` 로 신규 파일 분리
  - `PyroLordPhase1Ability`, `PyroLordPhase2Ability`, `PyroLordPhase3Ability` ...
  - 공통 기반 `BossAbility extends EnemyAbility`

**domain/effect**
- `status-effect.js` — 타워 비활성 효과 `TowerDisableEffect` 신규 (또는 기존 `AttackSpeedDebuffEffect` 극단화)

**domain/combat**
- `game-engine.js`
  - 페이즈 전환 시 `effects[]` 에 화면 플래시 이펙트 push
  - 타워 비활성/장판 로직 틱 처리

**domain/progression**
- `collection-system.js` — `ENEMY_CARDS` 에 4종 추가, `recordBossKill(bossId)` 훅
- `achievement-system.js` — 보스별 업적 4종 + "모든 보스 처치" 업적 1종 추가
- `game-stats.js` — `bossKillsByType: { pyroLord: N, ... }` 통계 추가

**hooks**
- `useGameState.jsx` — 페이즈 전환 알림용 상태

**components**
- `EnemySprite.jsx` — 보스별 고유 아이콘/색상 + 페이즈 오라 렌더
- `BossHealthBar.jsx` (신규) — 3칸 페이즈 바 + 현재 페이즈 텍스트
- `GameHeader.jsx` — 보스 등장 배너 ("⚠️ 화염 군주 강림")

### 새 파일 경로 제안
- `js/domain/enemy/abilities/boss-ability.js`
- `js/components/BossHealthBar.jsx`

## 롤아웃 플랜

### MVP (v1)
- [할 것]
  - 4종 중 **2종만 먼저**: `pyroLord`, `stormTitan` (대비 뚜렷한 메카닉)
  - 3페이즈 전환 + 페이즈 바 UI
  - 타워 비활성 효과 1종 (`stormTitan` 전용)
  - 캠페인 W5 보스 전용으로 적용 (보스러시는 v2)
  - 도감 카드 2장 해금
- [뺄 것]
  - `frostKing`, `voidReaper` (특히 voidReaper의 분열/은신은 구현 난이도 상)
  - 스테이지별 씨드 분포 튜닝 (초기엔 랜덤 균등)
  - 보스별 업적

### v2 (확장)
- `frostKing`, `voidReaper` 추가
- 보스러시 모드 보스 로테이션 적용 (4종 순환 × 바퀴당 체력 ×1.5)
- 보스별 업적 4종 + "모든 보스 처치" 업적
- 보스 첫 처치 크리스탈 보상
- 일일 챌린지 모디파이어 `bossFocus` (매 웨이브 마지막 적이 랜덤 보스)

### v3 (연출 강화)
- 페이즈 전환 시 화면 전체 플래시 + 슬로우모션 0.5초
- 보스별 고유 사운드 (입장/페이즈 전환/처치)
- 보스 첫 조우 시 대사 1줄 ("타버려라" 등)

## 리스크 & 오픈 이슈

### 밸런스
- **전격 면역 `stormTitan`** 이 S6 최종 보스로 나오면 전격 올인 빌드 전멸 → **스테이지별 보스 풀 제한** 으로 "보스 속성 쏠림 방지".
- **페이즈3 광폭화(이동속도 ×1.3)** 가 런모드 ㅁ맵에서 너무 빨리 루프 돌아 처치 불가 → 런모드 한정 ×1.15 로 완화.
- **voidReaper 분열**: 3마리 중 1마리만 진짜 설정이 재미는 좋지만 AOE 타워가 전부 카운터가 되어 특정 빌드 지나치게 유리 → 분열체도 모두 일정 데미지 받으면 진짜 HP 감소(×0.3 전이) 규칙 검토.
- **BalanceDesigner 핸드오프**: 페이즈별 체력 분배(`HEALTH_SCALING.bossFormula` 재설계), 보상 배수 튜닝 필요.

### 기존 시스템 충돌
- 기존 `boss` 타입에 하드코딩된 로직(speed 공식: `speedBase + stage * speedGrowth`)과 `BOSS_TYPES` 병존 방식 정리 필요.
  → `ENEMY_CONFIG.boss` 는 **레거시 fallback** 으로 남기고, `BOSS_TYPES` 에서 온 보스가 우선.
- `StatusEffectSystem` 의 화상/슬로우가 보스 페이즈별 저항 규칙(`elementResist`)을 어떻게 타는지 명확화 필요.
  → `StatusEffectSystem.apply()` 단계에서 resist 체크 후 duration/damage 감쇠.
- **캐리오버** 와 충돌: 플레이어가 특정 보스 대비 빌드를 알고 왔는데 다른 보스가 나오면 불공정 → 보스 배정은 **스테이지 시작 전 미리 표시** 필요 (UI에 다음 보스 프리뷰).

### 토큰/성능
- 보스 ability 클래스 × 4보스 × 3페이즈 = 12클래스. 단일 파일 500줄 위반 가능 → 보스별 파일 분리 (`boss-ability-pyro.js`, `boss-ability-frost.js` ...).
- 페이즈 전환 0.5초 무적 + 화면 플래시가 게임 루프에 부담은 미미 (일회성 이벤트).
- `BossHealthBar` 는 보스 1마리당 고정 렌더 → 부담 없음.

### UX 혼선
- 페이즈 전환 시 **정지 0.5초** 가 "버그 같다" 는 피드백 가능 → 반드시 **명시적 연출**(화면 플래시 + "PHASE 2" 텍스트) 필요.
- 전격/화염/냉기 저항은 **공격 시 "저항!" 플로팅 텍스트** 필수. 없으면 플레이어가 "왜 데미지 적게 들어가지?" 혼란.
- 보스 종류를 플레이어가 **스테이지 시작 전에 알아야** 대비 가능. 스테이지 선택 화면에 "다음 보스: 🔥 화염 군주" 표기.

### 오픈 이슈
- Q: 페이즈 전환 중 무적 시간에 투사체가 맞으면? → **투사체 소멸 + 데미지 무효** (간단한 처리 선호)
- Q: `voidReaper` 분열체가 lives를 각 1씩 깎는가, 진짜만 깎는가? → **진짜만 10 (보스 기본 livesLost)**, 가짜는 0. 가짜는 일정 시간 후 자동 소멸.
- Q: 보스 처치 카운트를 통계에 넣을 때 가짜/진짜 구분? → 진짜만 카운트.
