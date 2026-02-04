---
name: status-effect-designer
description: >
  상태이상(StatusEffect) 시스템 설계 및 구현 전문 스킬. 새로운 디버프/버프를 추가하거나
  기존 효과를 수정할 때 사용. (1) 효과 유형 결정 (적/타워 대상, 디버프/버프),
  (2) StatusEffect 클래스 설계, (3) 틱/만료 로직 구현, (4) AbilitySystem 연동.
  트리거 키워드 - 상태이상, 버프, 디버프, 효과, StatusEffect, 화상, 슬로우, 빙결, 스턴
---

# StatusEffectDesigner - 상태이상 설계 스킬

상태이상(StatusEffect) 시스템을 설계하고 구현하는 스킬입니다.

## 핵심 원칙

- **다형성**: 각 Effect 클래스가 자신의 로직을 캡슐화
- **단일 책임**: 하나의 Effect는 하나의 역할만 담당
- **개방-폐쇄**: 새 효과 추가 시 기존 코드 수정 최소화

## 관련 스킬

- **Ability 시스템**: → `AbilityDesigner/SKILL.md`

---

## 효과 추가 워크플로우

```
1. 설계 (Design)
   - 효과 유형 결정: 적 vs 타워, 디버프 vs 버프
   - 동작 방식: 즉시 vs 지속 vs 배율
   - 스택/갱신 규칙
   ↓
2. 구현 (Implementation)
   - StatusEffect 상속 클래스 생성
   - tick(), canStack() 구현
   - StatusEffects 팩토리 추가
   ↓
3. 연동 (Integration)
   - StatusEffectSystem.apply() 지원
   - Ability에서 사용
   ↓
4. 검증 (Verification)
   - 효과 적용/만료 확인
   - 스택/갱신 규칙 확인
```

---

## Step 1: 설계

### 효과 유형 결정

| 질문 | 선택지 |
|------|--------|
| **대상은?** | 적(Enemy) / 타워(Tower) |
| **분류는?** | 디버프(불리) / 버프(유리) |
| **동작 방식은?** | 즉시(Knockback) / 지속(Burn, Slow) / 배율(Vulnerability) |
| **스택 규칙은?** | 더 강한 것으로 갱신 / 중첩 가능 / 출처별 독립 |

### 현재 구현된 효과

**적(Enemy) 대상:**
| 클래스명 | TYPE | 분류 | 설명 |
|----------|------|------|------|
| `BurnEffect` | burn | 디버프 | 지속 데미지 |
| `SlowEffect` | slow | 디버프 | 이동속도 감소 |
| `FreezeEffect` | freeze | 디버프 | 완전 정지 |
| `StunEffect` | stun | 디버프 | 완전 정지 |
| `KnockbackEffect` | knockback | 디버프 | 뒤로 밀림 |
| `PullEffect` | pull | 디버프 | 끌어당김 |
| `VulnerabilityEffect` | vulnerability | 디버프 | 받는 피해 증가 |
| `RegenerationEffect` | regeneration | 버프 | 지속 회복 |

**타워(Tower) 대상:**
| 클래스명 | TYPE | 분류 | 설명 |
|----------|------|------|------|
| `AttackBuffEffect` | attackBuff | 버프 | 공격력 증가 |
| `AttackSpeedBuffEffect` | attackSpeedBuff | 버프 | 공속 증가 |
| `RangeBuffEffect` | rangeBuff | 버프 | 사거리 증가 |
| `AttackSpeedDebuffEffect` | attackSpeedDebuff | 디버프 | 공속 감소 |
| `DamageDebuffEffect` | damageDebuff | 디버프 | 공격력 감소 |

---

## Step 2: 구현

### 2.1 StatusEffect 클래스 생성

```javascript
// status-effect.js에 추가

class NewEffect extends StatusEffect {
  static TYPE = 'newEffect';

  constructor(param1, param2, duration) {
    super(duration);
    this.type = NewEffect.TYPE;
    this.param1 = param1;
    this.param2 = param2;
    this.isDebuff = true; // 또는 false (버프인 경우)
  }

  tick(target, now, gameSpeed) {
    if (this.isExpired(now)) {
      this.expired = true;
      return { target: this.onExpire(target, now) };
    }

    // 효과 로직 구현
    // 예: 데미지 적용, 상태 변경 등

    return { target };
  }

  // 배율 효과인 경우 오버라이드
  getSpeedMultiplier() { return 1.0; }
  getDamageMultiplier() { return 1.0; }
  getVulnerabilityMultiplier() { return 1.0; }

  // 스택 규칙
  canStack(other) {
    return other instanceof NewEffect && other.param1 > this.param1;
  }

  // 시각 효과
  getVisualEffect(target) {
    return { type: 'newEffect', color: '#XXXXXX' };
  }
}
```

### 2.2 팩토리 추가

```javascript
// status-effect.js 하단의 StatusEffects 객체에 추가

const StatusEffects = {
  // 기존...
  newEffect: (param1, param2, duration) => new NewEffect(param1, param2, duration),
};
```

### 2.3 apply() 지원 추가

```javascript
// StatusEffectSystem.apply() 함수의 switch 문에 추가

case 'newEffect':
  effect = StatusEffects.newEffect(effectData.param1, effectData.param2, effectData.duration);
  break;
```

---

## Step 3: Ability 연동

### Ability에서 상태이상 반환

```javascript
// abilities/*.js 에서
onHit(context) {
  const { hit } = context;
  return {
    statusEffects: [{
      enemyId: hit.enemyId,
      type: 'newEffect',    // StatusEffect TYPE
      param1: value1,       // 생성자 파라미터
      param2: value2,
      duration: 2000,
    }],
    // ...
  };
}
```

### 흐름 요약

```
Ability.onHit() → statusEffects 배열 반환
       ↓
AbilitySystem.resolveAllHits() → resolved.statusEffects
       ↓
GameEngine.gameTick() → EnemySystem.applyStatusEffect()
       ↓
StatusEffectSystem.apply() → new XxxEffect() 생성
       ↓
적/타워의 statusEffects[] 배열에 추가
       ↓
매 틱마다 Effect.tick() 호출
```

---

## Step 4: 검증

### 검증 체크리스트

```
□ 효과가 대상에 정상 적용되는가?
□ tick()이 매 틱마다 호출되는가?
□ 만료 시 효과가 제거되는가?
□ 스택/갱신 규칙이 올바른가?
□ 시각 효과가 표시되는가?
□ 성능 영향은 적당한가? (대량 적용 시)
```

### 치트 콘솔 테스트

```
`gold 500` - 골드 추가
`tower 4` - T4 타워로 효과 테스트
`nextstage` - 다양한 적으로 테스트
```

---

## 배율 계산 규칙

### 이동속도 (적)

```javascript
finalSpeed = baseSpeed × slowMult × freezeMult × stunMult
// Slow: 1 - percent (최소 0.1)
// Freeze/Stun: 0 (완전 정지)
```

### 공격 배율 (타워)

```javascript
finalDamage = baseDamage × attackBuffMult × damageDebuffMult
// AttackBuff: 1 + percent
// DamageDebuff: factor (0.3~1.0)
```

### 받는 피해 (적)

```javascript
finalDamage = incomingDamage × (1 + vulnerabilityPercent)
```

---

## 체크리스트

새 효과 추가 시:
- [ ] `StatusEffect` 상속 클래스 생성
- [ ] `static TYPE` 상수 정의
- [ ] `tick()` 메서드 구현
- [ ] 필요한 배율 메서드 오버라이드
- [ ] `canStack()` 스택 규칙 정의
- [ ] `getVisualEffect()` 시각 효과 정의
- [ ] `StatusEffects` 팩토리에 추가
- [ ] `StatusEffectSystem.apply()` 지원 추가
- [ ] CSS 애니메이션 추가 (필요시)

## 커뮤니케이션 가이드

### 효과 설계 요청 시

> "새로운 상태이상을 설계하기 위해 몇 가지 확인이 필요합니다:
> 1. 대상은 적인가요, 타워인가요?
> 2. 어떤 효과를 원하시나요? (데미지, 감속, 버프 등)
> 3. 지속 시간이 있나요, 즉시 효과인가요?"

### 구현 완료 시

> "상태이상 구현을 완료했습니다.
> - 효과: [효과명]
> - 위치: status-effect.js
> - 연동: Ability에서 `type: 'xxx'`로 사용 가능"
