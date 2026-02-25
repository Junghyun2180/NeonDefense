# Neon Defense - Claude Code 프로젝트 가이드

## 프로젝트 개요
네온 테마 랜덤 타워 디펜스 게임. 가챠 시스템 + 로그라이크 요소 결합 전략 게임.

- **실행**: `npx serve .` → `http://localhost:3000`
- **배포**: GitHub Pages (`https://junghyun2180.github.io/NeonDefense/`)
- **언어**: 순수 JavaScript + JSX (Babel Standalone 런타임 변환, CDN)

## 파일 구조 (DDD 기반)

```
NeonDefense/
├── index.html              # 진입점 (CDN + 스크립트 로드 순서 정의)
├── css/styles.css          # 애니메이션, UI 스타일
├── js/
│   ├── App.jsx             # 메인 React 컴포넌트
│   ├── domain/             # 🎯 도메인 레이어 (핵심 비즈니스 로직)
│   │   ├── config/         # 설정 도메인
│   │   │   ├── constants.js        # 게임 상수 및 설정 테이블
│   │   │   ├── run-mode-constants.js # 런모드 전용 상수
│   │   │   ├── mode-abilities.js   # 모드별 어빌리티 설정
│   │   │   ├── game-data.js        # GAME_DATA 통합 레지스트리
│   │   │   └── data-resolver.js    # DataResolver (모드 기반 데이터 조회)
│   │   ├── tower/          # 타워 도메인
│   │   │   ├── ability.js          # Ability 기본 클래스 + 팩토리
│   │   │   ├── ability-system.js   # AbilitySystem (공격 타워 라우터)
│   │   │   ├── tower-system.js     # TowerSystem (타워/서포트 생성/조합)
│   │   │   └── abilities/          # 타워 Ability 모듈
│   │   │       ├── fire-ability.js
│   │   │       ├── water-ability.js
│   │   │       ├── electric-ability.js
│   │   │       ├── wind-ability.js
│   │   │       ├── void-ability.js
│   │   │       ├── light-ability.js
│   │   │       └── support-ability.js
│   │   ├── enemy/          # 적 도메인
│   │   │   ├── enemy-system.js     # EnemySystem (적 생성/이동)
│   │   │   └── abilities/
│   │   │       └── enemy-ability.js # 적 Ability (8종)
│   │   ├── effect/         # 효과 도메인
│   │   │   └── status-effect.js    # StatusEffectSystem (상태이상)
│   │   ├── combat/         # 전투 도메인
│   │   │   └── game-engine.js      # GameEngine (게임 틱 오케스트레이터)
│   │   └── progression/    # 진행 도메인
│   │       ├── permanent-buff.js   # PermanentBuffManager (영구 버프)
│   │       ├── game-stats.js       # GameStats (통계 추적)
│   │       ├── achievement-system.js # 업적 시스템
│   │       └── leaderboard.js      # 리더보드
│   ├── infra/              # 🔧 인프라 레이어 (기술적 지원)
│   │   ├── utils.js                # 유틸리티 + BuffHelper
│   │   ├── sound.js                # SoundManager
│   │   ├── save-system.js          # 저장/불러오기
│   │   ├── run-save-system.js      # 런모드 저장
│   │   ├── run-mode.js             # 런모드 관리
│   │   ├── daily-challenge.js      # 일일 도전
│   │   ├── balance-logger.js       # 밸런스 로거
│   │   └── help-data.js            # 도움말 데이터
│   ├── hooks/              # 🪝 커스텀 훅 (React 상태 관리)
│   │   ├── useGameState.jsx        # 게임 상태 관리
│   │   ├── useGameLoop.jsx         # 게임 루프
│   │   ├── useInventory.jsx        # 인벤토리 관리
│   │   ├── useDragAndDrop.jsx      # 드래그앤드롭
│   │   ├── useCheatConsole.jsx     # 치트 콘솔
│   │   ├── useSaveLoad.jsx         # 저장/불러오기
│   │   └── useRunMode.jsx          # 런모드
│   └── components/         # 🖥️ UI 컴포넌트
│       ├── GameMap.jsx, GameHeader.jsx, ControlPanel.jsx ...
│       └── (18개 컴포넌트)
└── .claude/SKILL/          # Claude 스킬 정의
```

### DDD 레이어 규칙
| 레이어 | 경로 | 역할 | 의존 방향 |
|--------|------|------|----------|
| **domain** | `js/domain/` | 핵심 비즈니스 로직, 게임 규칙 | 다른 도메인만 참조 가능 |
| **infra** | `js/infra/` | 저장, 사운드, 유틸리티 등 기술 지원 | domain 참조 가능 |
| **hooks** | `js/hooks/` | React 상태 + domain/infra 연결 | domain + infra 참조 |
| **components** | `js/components/` | UI 렌더링 | hooks를 통해 간접 참조 |

### 도메인별 담당 영역
| 도메인 | 경로 | 수정 대상 |
|--------|------|----------|
| **config** | `domain/config/` | 게임 상수, 모드 설정, GAME_DATA |
| **tower** | `domain/tower/` | 타워 생성/조합, 공격 Ability, 서포트 Ability |
| **enemy** | `domain/enemy/` | 적 생성/이동, 적 Ability |
| **effect** | `domain/effect/` | 상태이상 (버프/디버프) |
| **combat** | `domain/combat/` | 게임 틱, 전투 흐름 |
| **progression** | `domain/progression/` | 영구 버프, 통계, 업적, 리더보드 |

## 핵심 아키텍처

### 네임스페이스 (글로벌 객체)
- `StatusEffectSystem` — 상태이상 정의/적용/틱 처리
- `AbilitySystem` — 공격 타워 Ability 라우터
- `SupportAbilitySystem` — 서포트 타워 Ability 라우터
- `EnemyAbilitySystem` — 적 Ability 라우터
- `EnemySystem` — 적 생성/이동 (StatusEffectSystem에 위임)
- `TowerSystem` — 타워/서포트 생성/조합/공격
- `GameEngine` — 게임 틱 오케스트레이터
- `PermanentBuffManager` — 영구 버프 관리
- `GameStats` — 게임 통계 추적/요약
- `BuffHelper` — 영구 버프 안전 접근 래퍼 (utils.js)

### 주요 시스템
- **공격 타워** (6속성 × 4티어): 화염/냉기/전격/질풍/공허/광휘
- **서포트 타워** (4종 × 3티어): 공격력/공속/방감/사거리 버프
- **적 타입** (8종): normal, fast, elite, boss, jammer, suppressor, healer, splitter
- **경로**: 스테이지별 다중 경로 (최대 3출발/3도착)
- **영구 버프** (로그라이크): 스테이지 클리어 시 3가지 중 1개 선택

### 상태 관리 (App.jsx)
```javascript
// 게임 진행
gold, lives, stage, wave, gameSpeed

// 공격 타워
towers[], inventory[], selectedInventory[], selectedTowers[]

// 서포트 타워
supportTowers[], supportInventory[], selectedSupportInventory[], selectedSupportTowers[]

// 전투
enemies[], projectiles[], effects[], chainLightnings[]
```

## 코드 수정 규칙

### DDD 원칙 (최우선)
- **도메인 경계 준수**: 수정할 내용이 속한 도메인 폴더의 파일만 변경
  - 타워 관련 → `domain/tower/` 내에서 해결
  - 적 관련 → `domain/enemy/` 내에서 해결
  - 상태이상 → `domain/effect/` 내에서 해결
  - 게임 수치/설정 → `domain/config/` 내에서 해결
  - 진행/업적 → `domain/progression/` 내에서 해결
  - 저장/사운드/유틸 → `infra/` 내에서 해결
- **의존성 방향**: domain ← infra ← hooks ← components (역방향 의존 금지)
- **모드별 데이터**: `GAME_DATA` + `DataResolver`를 통해 조회 (글로벌 상수 직접 참조 지양)

### 필수 원칙
- 타워 생성: `TowerSystem.create()` 또는 `TowerSystem.createSupport()`
- 적 생성: `EnemySystem.create()`
- 게임 틱: `GameEngine.gameTick()`
- 상수: `domain/config/constants.js`에 집중
- 모드별 설정: `domain/config/game-data.js` + `domain/config/data-resolver.js`

### 주의사항
- CDN 기반 → import/export 불가 (글로벌 스코프)
- 적 타입은 문자열 기반 (`enemy.type`)
- 씨드 기반 경로 생성 → 호환성 고려

## 객체지향 설계 원칙

### SOLID 원칙 준수
- **S (단일 책임)**: 클래스는 하나의 역할만 담당
- **O (개방-폐쇄)**: 확장에 열려있고, 수정에 닫혀있음
- **L (리스코프 치환)**: 하위 클래스는 상위 클래스를 대체 가능
- **I (인터페이스 분리)**: 필요한 메서드만 노출
- **D (의존성 역전)**: 구체 클래스가 아닌 추상에 의존

### 클래스 설계 규칙
```javascript
// ✅ 좋은 예: 객체가 자신의 상태와 행동을 관리
class BurnEffect extends StatusEffect {
  tick(enemy, now) { /* 자신이 처리 */ }
  canStack(other) { /* 자신이 판단 */ }
}

// ❌ 나쁜 예: switch문으로 타입별 분기
switch (effect.type) {
  case 'burn': /* 외부에서 처리 */
  case 'slow': /* 외부에서 처리 */
}
```

### 적용 패턴
| 패턴 | 적용 대상 | 예시 |
|------|----------|------|
| **상속** | 상태이상 | `BurnEffect extends StatusEffect` |
| **컴포지션** | 적/타워에 효과 부착 | `target.statusEffects[]` |
| **팩토리** | 객체 생성 | `StatusEffects.burn(damage, duration)` |
| **전략** | 행동 위임 | 각 Effect 클래스가 tick() 구현 |

### 새 기능 추가 시
1. **기존 코드 수정 최소화** - 새 클래스 추가로 해결
2. **자기 완결적 객체** - 객체가 자신의 로직을 캡슐화
3. **다형성 활용** - 공통 인터페이스로 일관된 처리

## Ability 시스템

### 개요
모든 타워/적의 능력을 Ability 클래스로 모듈화. StatusEffect와 연동하여 효과 적용.

### Ability 분류
| 시스템 | 파일 | 클래스 예시 |
|--------|------|-------------|
| 공격 타워 | `domain/tower/abilities/*-ability.js` | `BurnAbility`, `SlowAbility`, `ChainLightningAbility` |
| 서포트 타워 | `domain/tower/abilities/support-ability.js` | `AttackBuffSupportAbility`, `SpeedBuffSupportAbility` |
| 적 | `domain/enemy/abilities/enemy-ability.js` | `JammerEnemyAbility`, `HealerEnemyAbility` |

### 사용법
```javascript
// 공격 타워 - 자동 할당
const tower = TowerSystem.create(tier, colorIndex);
// → tower.ability, tower.abilityType 자동 부여

// 공격 처리
const resolved = AbilitySystem.resolveAllHits(hits, enemies, permanentBuffs);

// 서포트 타워 - 자동 할당
const support = TowerSystem.createSupport(tier, supportType);
// → support.ability, support.abilityType 자동 부여

// 적 - 자동 할당
const enemy = EnemySystem.create(stage, wave, ...);
// → enemy.ability, enemy.abilityType 자동 부여
```

### Ability → StatusEffect 연동
```javascript
// Ability에서 상태이상 반환
result.statusEffects.push({
  enemyId: hit.enemyId,
  type: 'burn',  // StatusEffect TYPE
  damage: burnDamage,
  duration: burnDuration,
});
// → StatusEffectSystem이 자동으로 BurnEffect 인스턴스 생성
```

## StatusEffect 통합 시스템

### 효과 분류
| 대상 | 유형 | 클래스 | 설명 |
|------|------|--------|------|
| 적 | 디버프 | `BurnEffect` | 화상 (지속 데미지) |
| 적 | 디버프 | `SlowEffect` | 슬로우 (이동속도 감소) |
| 적 | 디버프 | `FreezeEffect` | 빙결 (완전 정지) |
| 적 | 디버프 | `StunEffect` | 스턴 (완전 정지) |
| 적 | 디버프 | `KnockbackEffect` | 넉백 (즉시 적용) |
| 적 | 디버프 | `PullEffect` | 끌어당김 (즉시 적용) |
| 적 | 디버프 | `VulnerabilityEffect` | 취약 (받는 피해 증가) |
| 적 | 버프 | `RegenerationEffect` | 재생 (지속 회복) |
| 타워 | 버프 | `AttackBuffEffect` | 공격력 증가 |
| 타워 | 버프 | `AttackSpeedBuffEffect` | 공속 증가 |
| 타워 | 버프 | `RangeBuffEffect` | 사거리 증가 |
| 타워 | 디버프 | `AttackSpeedDebuffEffect` | 공속 감소 |
| 타워 | 디버프 | `DamageDebuffEffect` | 공격력 감소 |

### 사용법
```javascript
// 적에게 디버프 적용
enemy = StatusEffectSystem.apply(enemy, { type: 'burn', damage: 10, duration: 2000 }, now);

// 타워에 버프 적용
tower = StatusEffectSystem.applyToTower(tower, { type: 'attackBuff', percent: 0.15, sourceId: supportId }, now);

// 배율 조회
const speedMult = StatusEffectManager.getSpeedMultiplier(target, now);
const damageMult = StatusEffectManager.getDamageMultiplier(target, now);
const vulnMult = StatusEffectManager.getVulnerabilityMultiplier(target, now);
```

## 토큰 최적화 원칙

### 파일 모듈화 기준
- **500줄 초과 시 분리 검토**
- 현재 `App.jsx` (~850줄) → 분리 후보

### 읽기 최적화
- 전체 파일 대신 **특정 라인 범위** 읽기 (`offset`, `limit`)
- **Grep으로 함수 위치 먼저 파악** 후 해당 부분만 읽기
- 변경 필요한 부분만 정확히 타겟팅

### App.jsx 분리 현황 (완료)
| 영역 | 분리된 훅 | 상태 |
|------|----------|------|
| 게임 상태 | `hooks/useGameState.jsx` | ✅ 완료 |
| 게임 루프 | `hooks/useGameLoop.jsx` | ✅ 완료 |
| 인벤토리 | `hooks/useInventory.jsx` | ✅ 완료 |
| 드래그앤드롭 | `hooks/useDragAndDrop.jsx` | ✅ 완료 |
| 치트 콘솔 | `hooks/useCheatConsole.jsx` | ✅ 완료 |
| 저장/불러오기 | `hooks/useSaveLoad.jsx` | ✅ 완료 |
| 런모드 | `hooks/useRunMode.jsx` | ✅ 완료 |

## Skill 참조

| 스킬 | 용도 |
|------|------|
| `AbilityDesigner` | **Ability 시스템 설계 및 구현 (핵심)** |
| `StatusEffectDesigner` | **StatusEffect 설계 및 구현** |
| `BugFixer` | 6단계 버그 수정 워크플로우 |
| `BalanceDesigner` | 경제/전투/메타 밸런스 설계 |
| `MonsterDesigner` | 몬스터 설계 및 구현 (EnemyAbility) |
| `TowerDesigner` | 타워/서포트 타워 설계 및 구현 (Ability) |
| `UIRefactor` | App.jsx 모듈화 가이드 (토큰 최적화) |

## 주요 수치

### 타워 (NEON_TYPES)
| 티어 | 데미지 | 사거리 | 공속 |
|------|--------|--------|------|
| T1 | 10 | 80 | 1000ms |
| T2 | 30 | 100 | 800ms |
| T3 | 100 | 120 | 600ms |
| T4 | 350 | 150 | 400ms |

### 서포트 타워 (SUPPORT_CONFIG)
| 티어 | 공격력 | 공속 | 방감 | 사거리 | 범위 |
|------|--------|------|------|--------|------|
| S1 | +15% | +10% | +10% | +10% | 100px |
| S2 | +25% | +18% | +18% | +18% | 120px |
| S3 | +40% | +30% | +30% | +30% | 150px |

### 경제 (ECONOMY)
- 타워 뽑기: 20G / 서포트 뽑기: 40G
- 인벤토리: 30칸 / 서포트 인벤토리: 15칸
- 판매 환급: 50%

## 치트 콘솔

`` ` `` 키로 토글:
| 명령어 | 효과 |
|--------|------|
| `nextstage` / `ns` | 다음 스테이지 |
| `stage [n]` | n 스테이지로 이동 |
| `clearwave` / `cw` | 웨이브 즉시 클리어 |
| `gold [n]` | 골드 추가 (기본 500) |
| `lives [n]` | 목숨 추가 (기본 10) |
| `tower [tier]` | 타워 획득 (기본 T4) |
| `support [tier]` | 서포트 획득 (기본 S3) |
