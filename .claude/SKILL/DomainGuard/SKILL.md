---
name: domain-guard
description: >
  Domain-Driven Design 가드레일 스킬. 코드 변경 시 도메인 경계를 검증하고
  올바른 패턴 준수를 안내. Prompt Hook과 연동하여 자동으로 활성화.
  트리거 키워드 - 도메인, DDD, 리팩토링, 구조, 아키텍처, 경계, domain, architecture
---

# DomainGuard - 도메인 가드 스킬

## 개요
NeonDefense 프로젝트의 DDD(Domain-Driven Design) 바운디드 컨텍스트를 관리하는 스킬.
파일 수정 시 해당 파일이 속한 도메인을 판별하고, 도메인 규칙을 검증하며, 위반 시 올바른 패턴을 안내합니다.

## 도메인 맵

| 도메인 | 경로 패턴 | 핵심 시스템 | 관련 스킬 |
|--------|----------|-------------|----------|
| **Tower** | `js/domain/tower/` | TowerSystem, AbilitySystem, SupportAbilitySystem | TowerDesigner, AbilityDesigner |
| **Enemy** | `js/domain/enemy/` | EnemySystem, EnemyAbilitySystem | MonsterDesigner |
| **Combat** | `js/domain/combat/` | GameEngine | BalanceDesigner |
| **Effect** | `js/domain/effect/` | StatusEffectSystem, StatusEffectManager | StatusEffectDesigner |
| **Progression** | `js/domain/progression/` | PermanentBuffManager, GameStats, AchievementSystem | BalanceDesigner |
| **Config** | `js/domain/config/` | Constants, DataResolver, GAME_DATA | BalanceDesigner |
| **UI** | `js/hooks/`, `js/components/`, `js/App.jsx` | React Hooks, Components | UIRefactor |
| **Infrastructure** | `js/infra/` | SoundManager, Utils, SaveSystem | BugFixer |

## 허용된 의존 방향

```
Config ──→ 모든 도메인 (읽기 전용, 상수 참조)
Effect ──→ Config
Tower  ──→ Config, Effect
Enemy  ──→ Config, Effect
Combat ──→ Tower, Enemy, Effect, Config (오케스트레이션)
Progression ──→ Config
UI     ──→ 모든 도메인 (Hook을 통한 호출만, 직접 로직 금지)
Infrastructure ──→ Config (최소한만)
```

## 금지된 의존 방향

| From | To | 이유 |
|------|----|------|
| Tower | Enemy | 직접 참조 금지. Combat을 통해 간접 상호작용 |
| Enemy | Tower | 직접 참조 금지. Combat을 통해 간접 상호작용 |
| Config | 어떤 도메인도 | 순환 의존 방지 (Config는 순수 데이터) |
| Effect | Tower, Enemy | 효과는 대상-무관(target-agnostic)해야 함 |
| Infrastructure | 도메인 시스템 | 유틸은 도메인 로직에 의존하면 안 됨 |

## 도메인별 핵심 규칙

### Tower Domain
- 모든 타워 어빌리티는 `Ability` 서브클래스여야 함 (`static TYPE` 필수)
- 타워 생성은 반드시 `TowerSystem.create()` 또는 `TowerSystem.createT4WithRole()`
- 서포트 타워 생성은 `TowerSystem.createSupport()`
- 새 어빌리티 추가 시 `AbilitySystem._baseAbilities` 또는 `_t4Abilities` 등록 필수
- 새 파일 추가 시 `index.html`에 올바른 로드 순서로 추가

### Enemy Domain
- 모든 적 어빌리티는 `EnemyAbility` 서브클래스여야 함
- 적 생성은 반드시 `EnemySystem.create()`
- 새 적 타입 추가 시 `ENEMY_CONFIG`과 `SPAWN_RULES`에 등록 필수
- `EnemyAbilitySystem._abilities`에 매핑 필수

### Combat Domain
- `GameEngine.gameTick()`은 **오케스트레이터만** 담당
- 원소별(element) switch 문 사용 금지 → AbilitySystem에 위임
- 히트 판정은 반드시 `AbilitySystem.resolveAllHits()` 사용
- 투사체 처리는 순수 함수로 구현

### Effect Domain
- 모든 효과는 `StatusEffect` 기본 클래스 상속 필수
- `tick()`, `canStack()`, `getVisualEffect()` 구현 필수
- `StatusEffects` 팩토리에 생성 메서드 등록 필수
- `StatusEffectSystem._effectParamMap`에 매핑 추가 필수
- 즉시 효과(knockback, pull)는 `onAttach`에서 `expired = true` 설정

### Progression Domain
- 영구 버프는 `{ id, maxStacks, effect }` 구조 필수
- `PermanentBuffManager` 메서드는 순수 함수
- 외부 접근은 `BuffHelper` 래퍼를 통해서만

### Config Domain
- 매직 넘버 금지 → 이름 있는 상수로 정의
- 밸런스 변경은 최대 2개 축만 (한 번에 너무 많이 바꾸지 않기)
- `ENEMY_CONFIG` 항목은 모든 필수 필드 포함

### UI Domain
- 컴포넌트에서 `TowerSystem`, `EnemySystem` 등 직접 호출 금지 → Hook 사용
- Hook은 `window.hookName = hookName` 패턴으로 글로벌 내보내기
- 상태 관리 로직은 컴포넌트가 아닌 Hook에 위치

### Infrastructure Domain
- 유틸 함수는 순수 함수 (부수 효과 없음)
- 사운드 재생은 `SoundManager`를 통해서만
- 저장/로드는 누락/손상 데이터를 안전하게 처리

## 검증 체크리스트

파일 수정 시 아래 항목을 확인:

- [ ] 해당 파일이 올바른 도메인 디렉토리에 있는가?
- [ ] 의존 방향이 허용된 범위 내인가?
- [ ] 도메인 경계를 넘는 로직이 있다면 올바른 도메인으로 위임했는가?
- [ ] 새 파일 추가 시 `index.html` 로드 순서가 올바른가?
- [ ] 글로벌 네임스페이스 등록이 되었는가?
- [ ] 해당 도메인의 패턴(팩토리, 상속, 위임)을 따르는가?
- [ ] OOP 원칙을 준수하는가? (switch 대신 다형성, 단일 책임 등)

## 도메인 판별 규칙

파일 경로로 도메인을 자동 판별:

```
js/domain/tower/**     → Tower Domain
js/domain/enemy/**     → Enemy Domain
js/domain/combat/**    → Combat Domain
js/domain/effect/**    → Effect Domain
js/domain/progression/** → Progression Domain
js/domain/config/**    → Config Domain
js/hooks/**            → UI Domain
js/components/**       → UI Domain
js/App.jsx             → UI Domain
js/infra/**            → Infrastructure Domain
```

## 위반 시 안내 템플릿

```
[DOMAIN_NAME] 도메인 위반 감지:
- 위반 내용: {구체적 설명}
- 올바른 패턴: {도메인 규칙에 따른 수정 방법}
- 참고 스킬: {관련 스킬 이름}
```

## 관련 스킬
- **TowerDesigner** — Tower 도메인 설계/구현
- **AbilityDesigner** — Tower 도메인 어빌리티 계층
- **MonsterDesigner** — Enemy 도메인 설계/구현
- **StatusEffectDesigner** — Effect 도메인 설계/구현
- **BalanceDesigner** — Combat/Config/Progression 도메인 밸런스
- **UIRefactor** — UI 도메인 모듈화
- **BugFixer** — 범용 버그 수정 (Infrastructure 포함)
