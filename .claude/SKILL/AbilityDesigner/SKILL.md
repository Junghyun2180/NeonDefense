---
name: ability-designer
description: >
  Ability 시스템 설계 및 구현 전문 스킬. 타워/적의 새로운 능력을 추가하거나 수정할 때 사용.
  (1) Ability 유형 결정 (공격/서포트/적), (2) onHit/onTick/onDeath 로직 구현,
  (3) StatusEffect 연동, (4) AbilitySystem 매핑. 모든 게임 능력의 핵심 시스템.
  트리거 키워드 - Ability, 능력, 스킬, 공격, 효과, 타워능력, 적능력, 특수능력
---

# AbilityDesigner - Ability 시스템 설계 스킬

Ability 시스템을 설계하고 구현하는 스킬입니다.
모든 타워/적의 능력은 Ability 클래스로 모듈화됩니다.

## 핵심 원칙

- **다형성**: 각 Ability가 자신의 로직을 캡슐화
- **컴포지션**: 객체가 여러 Ability 보유 가능 (복합 속성)
- **팩토리 패턴**: AbilitySystem, SupportAbilitySystem, EnemyAbilitySystem
- **개방-폐쇄**: 새 능력 추가 시 기존 코드 수정 최소화

## 관련 스킬

- **StatusEffect 시스템**: → `StatusEffectDesigner/SKILL.md`
- **타워 설계**: → `TowerDesigner/SKILL.md`
- **몬스터 설계**: → `MonsterDesigner/SKILL.md`

---

## Ability 추가 워크플로우

```
1. 설계 (Design)
   - Ability 유형 결정: 공격 / 서포트 / 적
   - 반환 데이터 설계: statusEffects, visualEffects 등
   ↓
2. 구현 (Implementation)
   - Ability 상속 클래스 생성
   - onHit() / onTick() / onDeath() 구현
   ↓
3. 매핑 (Mapping)
   - AbilitySystem에 등록
   - index.html 스크립트 추가
   ↓
4. 검증 (Verification)
   - 치트 콘솔로 테스트
   - StatusEffect 연동 확인
```

---

## Step 1: 설계

### Ability 유형 결정

| 유형 | 대상 | 메서드 | 시스템 |
|------|------|--------|--------|
| **공격 타워** | 적 명중 시 | `onHit(context)` | `AbilitySystem` |
| **서포트 타워** | 주변 타워/적 | `onTick(context)` | `SupportAbilitySystem` |
| **적** | 타워/다른 적 | `onTick()`, `onDeath()` | `EnemyAbilitySystem` |

### 현재 구현된 Ability

**공격 타워 (24개):**
| 속성 | 기본 | T4-A | T4-B | T4-C |
|------|------|------|------|------|
| 화염 | `BurnAbility` | `BurnStackAbility` | `BurnSpreadAbility` | `FastEnemyBonusAbility` |
| 냉기 | `SlowAbility` | `FreezeChanceAbility` | `AoeSlowAbility` | `SlowKnockbackAbility` |
| 전격 | `ChainLightningAbility` | `ChainFocusAbility` | `ChainStunAbility` | `FirstStrikeAbility` |
| 질풍 | `WindAbility` | `AoeDamageAbility` | `PullAbility` | `GustAbility` |
| 공허 | `PierceAbility` | `SynergyBuffAbility` | `EnhancedPierceAbility` | `BalancedAbility` |
| 광휘 | `ExecuteAbility` | `CriticalAbility` | `LightKnockbackAbility` | `RushBlockerAbility` |

**서포트 타워 (4개):**
`AttackBuffSupportAbility`, `SpeedBuffSupportAbility`, `DefenseDebuffSupportAbility`, `RangeBuffSupportAbility`

**적 (8개):**
`NormalEnemyAbility`, `FastEnemyAbility`, `EliteEnemyAbility`, `BossEnemyAbility`, `JammerEnemyAbility`, `SuppressorEnemyAbility`, `HealerEnemyAbility`, `SplitterEnemyAbility`

---

## Step 2: 구현

### 공격 타워 Ability

```javascript
// abilities/xxx-ability.js

class NewAbility extends Ability {
  static TYPE = 'new';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.XXX]);
    this.type = NewAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, enemies, permanentBuffs, now } = context;

    return {
      damageModifier: 1.0,      // 데미지 배율
      additionalDamage: 0,      // 추가 데미지
      statusEffects: [{         // StatusEffect 연동
        enemyId: hit.enemyId,
        type: 'burn',           // → StatusEffectDesigner 참조
        damage: 10,
        duration: 2000,
      }],
      visualEffects: [{
        id: Date.now() + Math.random(),
        x: hit.x, y: hit.y,
        type: 'newEffect',
        color: '#XXXXXX',
      }],
      aoeTargets: [],           // 광역 대상
      chainData: null,          // 체인 라이트닝
      pierceTargets: [],        // 관통 대상
    };
  }

  getDescription() {
    return '새로운 능력';
  }
}
```

### 서포트 타워 Ability

```javascript
// abilities/support-ability.js

class NewBuffSupportAbility extends SupportAbility {
  static TYPE = 'newBuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.NEW_BUFF);
    this.type = NewBuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets, now } = context;
    const result = { buffedTargets: [], visualEffects: [] };

    targets.forEach(tower => {
      if (!this.isInRange(support, tower)) return;
      result.buffedTargets.push({
        targetId: tower.id,
        buffType: 'newBuff',
        value: this.config.buffValue,
        sourceId: support.id,
      });
    });

    return result;
  }
}
```

### 적 Ability

```javascript
// abilities/enemy-ability.js

class NewEnemyAbility extends EnemyAbility {
  static TYPE = 'newEnemy';

  constructor() {
    super('newType');
    this.type = NewEnemyAbility.TYPE;
  }

  onTick(context) {
    const { enemy, towers, enemies, now } = context;
    return {
      towerDebuffs: [],    // 타워에 디버프
      enemyHeals: [],      // 적에게 힐
      visualEffects: [],
      spawnEnemies: [],
    };
  }

  onDeath(context) {
    const { enemy } = context;
    return {
      spawnEnemies: [],    // 분열 시 생성할 적
      visualEffects: [],
    };
  }
}
```

---

## Step 3: 매핑

### AbilitySystem 등록

```javascript
// ability-system.js

// 공격 타워
AbilitySystem._baseAbilities[ELEMENT_TYPES.NEW] = NewAbility;
AbilitySystem._t4Abilities['new-A'] = NewT4AAbility;
AbilitySystem._t4Abilities['new-B'] = NewT4BAbility;
AbilitySystem._elementKeys[ELEMENT_TYPES.NEW] = 'new';

// 서포트 타워
SupportAbilitySystem._abilities[SUPPORT_TYPES.NEW_BUFF] = NewBuffSupportAbility;

// 적
EnemyAbilitySystem._abilities['newType'] = NewEnemyAbility;
```

### index.html 스크립트 추가

```html
<!-- Ability 시스템 순서 중요 -->
<script src="js/ability.js"></script>
<script src="js/abilities/xxx-ability.js"></script>  <!-- 새 파일 -->
<script src="js/ability-system.js"></script>
<script src="js/abilities/support-ability.js"></script>
<script src="js/abilities/enemy-ability.js"></script>
```

---

## Step 4: 검증

### 검증 체크리스트

```
□ 타워/적 생성 시 Ability가 자동 할당되는가?
□ onHit/onTick/onDeath가 올바르게 호출되는가?
□ StatusEffect가 정상 적용되는가?
□ 시각 효과가 표시되는가?
□ 복합 효과가 올바르게 병합되는가?
```

### 치트 콘솔 테스트

```
`tower 4` - T4 타워 획득 (공격 Ability 테스트)
`support 3` - S3 서포트 획득 (서포트 Ability 테스트)
`stage 3` - Stage 3 이동 (다양한 적 Ability 테스트)
`clearwave` - 웨이브 클리어
```

---

## StatusEffect 연동

### 흐름 요약

```
Ability.onHit() → statusEffects 배열 반환
       ↓
AbilitySystem.resolveAllHits() → resolved.statusEffects
       ↓
GameEngine.gameTick() → EnemySystem.applyStatusEffect()
       ↓
StatusEffectSystem.apply() → new XxxEffect() 생성
```

### 사용 예시

```javascript
// Ability에서 화상 적용
result.statusEffects.push({
  enemyId: hit.enemyId,
  type: 'burn',           // StatusEffect TYPE
  damage: burnDamage,     // BurnEffect 생성자 파라미터
  duration: burnDuration,
});
```

---

## 복합 속성 확장 (향후)

### 다중 Ability 지원

```javascript
// 화염+냉기 복합 타워
tower.abilities = [
  new BurnAbility(3),
  new SlowAbility(3),
];

// 공격 처리 시 모든 Ability 실행
tower.abilities.forEach(ability => {
  const result = ability.onHit(context);
  // 결과 병합
});
```

---

## 체크리스트

### 공격 Ability 추가

- [ ] `Ability` 상속 클래스 생성
- [ ] `static TYPE` 상수 정의
- [ ] `onHit()` 구현 (statusEffects 포함)
- [ ] `getDescription()` 구현
- [ ] `AbilitySystem._baseAbilities` 또는 `_t4Abilities`에 매핑
- [ ] `index.html`에 스크립트 추가

### 서포트 Ability 추가

- [ ] `SupportAbility` 상속 클래스 생성
- [ ] `onTick()` 구현
- [ ] `SupportAbilitySystem._abilities`에 매핑

### 적 Ability 추가

- [ ] `EnemyAbility` 상속 클래스 생성
- [ ] `onTick()` 또는 `onDeath()` 구현
- [ ] `EnemyAbilitySystem._abilities`에 매핑

## 커뮤니케이션 가이드

### 능력 설계 요청 시

> "새로운 Ability를 설계하기 위해 확인이 필요합니다:
> 1. 어떤 유형인가요? (공격 타워 / 서포트 타워 / 적)
> 2. 어떤 효과를 원하시나요?
> 3. StatusEffect가 필요한가요? (화상, 슬로우 등)"

### 구현 완료 시

> "Ability 구현을 완료했습니다.
> - 능력: [능력명]
> - 파일: abilities/xxx-ability.js
> - 매핑: AbilitySystem에 등록 완료
> - 테스트: `tower 4` 또는 `stage X`로 확인 가능"
