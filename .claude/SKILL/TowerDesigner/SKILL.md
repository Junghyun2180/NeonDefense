---
name: tower-designer
description: >
  타워 설계 및 구현 전문 스킬. 공격 타워/서포트 타워의 새로운 속성이나 타입을 추가하거나
  기존 타워를 수정할 때 사용. (1) 속성/타입 정의, (2) Ability 클래스 구현,
  (3) AbilitySystem 매핑, (4) 밸런싱 조정.
  트리거 키워드 - 타워, 공격타워, 서포트타워, 속성, 버프, 뽑기, DPS, 사거리
---

# TowerDesigner - 타워 설계 스킬

## 개요
Neon Defense 게임의 공격 타워 및 서포트 타워를 설계하고 구현하는 워크플로우.
**모든 타워 능력은 Ability 클래스로 구현한다.**

## 관련 스킬
- **Ability 시스템**: → `AbilityDesigner/SKILL.md`
- **StatusEffect 시스템**: → `StatusEffectDesigner/SKILL.md`

## 적용 범위
- 새로운 타워 속성/타입 추가 (공격 Ability)
- 서포트 타워 효과 설계 (서포트 Ability)
- 타워 밸런싱 조정
- 시너지 시스템 설계

---

## 공격 타워 설계

### 속성 시스템 (6종)
| ID | 속성 | 아이콘 | 효과 |
|----|------|--------|------|
| 0 | 화염 | 🔥 | 화상 DoT |
| 1 | 냉기 | ❄️ | 이동속도 감소 |
| 2 | 전격 | ⚡ | 체인 라이트닝 |
| 3 | 질풍 | 🌪️ | 고데미지 + 넉백 |
| 4 | 공허 | 🌀 | 균형잡힌 공격 |
| 5 | 광휘 | 💎 | 균형잡힌 공격 |

### 티어별 기본 스탯
| 티어 | 데미지 | 사거리 | 공속 | 조합 비용 |
|------|--------|--------|------|----------|
| T1 | 10 | 80 | 1000ms | 20G |
| T2 | 30 | 100 | 800ms | 60G (T1×3) |
| T3 | 100 | 120 | 600ms | 180G (T2×3) |
| T4 | 350 | 150 | 400ms | 540G (T3×3) |

### 속성 효과 설정 (ELEMENT_EFFECTS)
```javascript
// 화염: 지속 데미지
burnDuration: { 1: 2000, 2: 2500, 3: 3000, 4: 4000 },
burnDamagePercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },

// 냉기: 슬로우
slowPercent: { 1: 0.3, 2: 0.4, 3: 0.5, 4: 0.6 },
slowDuration: { 1: 1500, 2: 2000, 3: 2500, 4: 3000 },

// 전격: 체인
chainCount: { 1: 2, 2: 3, 3: 4, 4: 6 },
chainDamageDecay: 0.7,

// 질풍: 넉백
damageMultiplier: { 1: 1.5, 2: 1.8, 3: 2.2, 4: 3.0 },
knockbackDistance: { 1: 15, 2: 20, 3: 25, 4: 35 },
```

---

## 서포트 타워 설계

### 타입 (4종)
| ID | 타입 | 아이콘 | 효과 대상 |
|----|------|--------|----------|
| 0 | 공격력 | ⚔️ | 타워 데미지 증가 |
| 1 | 공속 | ⏱️ | 타워 공격속도 증가 |
| 2 | 방감 | 💔 | 적 받는 피해 증가 |
| 3 | 사거리 | 🎯 | 타워 사거리 증가 |

### 티어별 버프 수치
| 티어 | 공격력 | 공속 | 방감 | 사거리 | 범위 |
|------|--------|------|------|--------|------|
| S1 | +15% | +10% | +10% | +10% | 100px |
| S2 | +25% | +18% | +18% | +18% | 120px |
| S3 | +40% | +30% | +30% | +30% | 150px |

### 스택 규칙
- 같은 타입 버프는 **가산**
- **상한선**: 공격력/공속/사거리 = +100%, 방감 = +50%

### 경제
- 뽑기 비용: 40G
- 인벤토리: 15칸
- 판매 가격: { S1: 20G, S2: 60G, S3: 180G }

---

## 구현 워크플로우

### Phase 1: 설계
```markdown
1. 역할 정의: 타워가 게임에 어떤 전략적 가치를 추가하는가?
2. 시각적 정체성: 아이콘, 색상, 애니메이션
3. 수치 초안:
   - 공격 타워: damage, range, speed per tier
   - 서포트 타워: buffValue, range per tier
4. 시너지: 다른 타워/적과의 상호작용
```

### Phase 2: 구현

#### 공격 타워 새 속성 추가

**1. constants.js 수정**
```javascript
// ELEMENT_TYPES에 추가
const ELEMENT_TYPES = {
  ...existing,
  NEW_TYPE: 6,
};

// ELEMENT_EFFECTS에 효과 정의
[ELEMENT_TYPES.NEW_TYPE]: {
  name: '이름', icon: '🆕', desc: '설명',
  // 효과별 수치...
},

// NEON_TYPES 각 티어에 색상/이름 추가
colors: [...existing, '#XXXXXX'],
names: [...existing, '새 타워 이름'],
```

**2. abilities/new-ability.js 생성 (Ability 시스템)**
```javascript
// 기본 Ability
class NewAbility extends Ability {
  static TYPE = 'new';

  constructor(tier) {
    super(tier, ELEMENT_EFFECTS[ELEMENT_TYPES.NEW_TYPE]);
    this.type = NewAbility.TYPE;
  }

  onHit(context) {
    const { hit, target, enemies, permanentBuffs } = context;
    return {
      damageModifier: 1.0,
      statusEffects: [],  // StatusEffect 연동
      visualEffects: [],
      // ...
    };
  }
}

// T4 역할별 Ability
class NewT4AAbility extends Ability { ... }
class NewT4BAbility extends Ability { ... }
```

**3. ability-system.js 매핑 추가**
```javascript
AbilitySystem._baseAbilities[ELEMENT_TYPES.NEW_TYPE] = NewAbility;
AbilitySystem._t4Abilities['new-A'] = NewT4AAbility;
AbilitySystem._t4Abilities['new-B'] = NewT4BAbility;
```

**4. index.html 스크립트 추가**
```html
<script src="js/abilities/new-ability.js"></script>
```

#### 서포트 타워 새 타입 추가

**1. constants.js 수정**
```javascript
// SUPPORT_TYPES에 추가
const SUPPORT_TYPES = {
  ...existing,
  NEW_BUFF: 4,
};

// SUPPORT_CONFIG 각 티어에 값 추가
values: [...existing, 0.XX],
```

**2. abilities/support-ability.js 추가 (Ability 시스템)**
```javascript
class NewBuffSupportAbility extends SupportAbility {
  static TYPE = 'newBuffSupport';

  constructor(tier) {
    super(tier, SUPPORT_TYPES.NEW_BUFF);
    this.type = NewBuffSupportAbility.TYPE;
  }

  onTick(context) {
    const { support, targets } = context;
    // 버프 로직...
  }
}

// 매핑 추가
SupportAbilitySystem._abilities[SUPPORT_TYPES.NEW_BUFF] = NewBuffSupportAbility;
```

### Phase 3: 테스트
치트 콘솔 활용:
- `tower 4` - T4 타워 획득
- `support 3` - S3 서포트 획득

---

## 밸런싱 가이드

### DPS 기준
| 티어 | 기본 DPS | 버프 적용 시 (S3 풀버프) |
|------|---------|------------------------|
| T1 | 10 | 28 (+180%) |
| T2 | 37.5 | 105 (+180%) |
| T3 | 166.7 | 466.7 (+180%) |
| T4 | 875 | 2450 (+180%) |

### 골드 효율
- T1: 0.5 DPS/G
- T2: 0.625 DPS/G (조합이 효율적)
- T3: 0.926 DPS/G
- T4: 1.62 DPS/G

### 서포트 투자 가치
서포트 S3 풀세트 (공격력+공속+사거리):
- 비용: 360G × 3 = 1080G
- 효과: 범위 내 모든 타워 +180% DPS
- 타워 3개 이상이면 투자 가치 있음

---

## 체크리스트

### 공격 타워 추가 시
- [ ] `ELEMENT_TYPES`에 새 타입 ID 추가
- [ ] `ELEMENT_EFFECTS`에 효과 정의
- [ ] `NEON_TYPES` 각 티어에 색상/이름 추가
- [ ] **`abilities/xxx-ability.js` 파일 생성 (Ability 클래스)**
- [ ] **`AbilitySystem._baseAbilities`에 매핑 추가**
- [ ] **`AbilitySystem._t4Abilities`에 T4 역할 매핑 추가**
- [ ] **`index.html`에 스크립트 추가**
- [ ] CSS 애니메이션 추가 (필요시)

### 서포트 타워 추가 시
- [ ] `SUPPORT_TYPES`에 새 타입 ID 추가
- [ ] `SUPPORT_CONFIG` 각 티어에 수치 추가
- [ ] `SUPPORT_UI`에 아이콘/색상 추가
- [ ] `SUPPORT_CAPS`에 상한선 추가
- [ ] **`abilities/support-ability.js`에 SupportAbility 클래스 추가**
- [ ] **`SupportAbilitySystem._abilities`에 매핑 추가**

## 참조
- **Ability 시스템**: → `AbilityDesigner/SKILL.md`
- **StatusEffect 시스템**: → `StatusEffectDesigner/SKILL.md`
- **몬스터 설계**: → `MonsterDesigner/SKILL.md`
- **밸런스 설계**: → `BalanceDesigner/SKILL.md`
