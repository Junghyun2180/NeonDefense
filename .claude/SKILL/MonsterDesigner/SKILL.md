---
name: monster-designer
description: >
  몬스터 설계 및 구현 전문 스킬. 새로운 적 타입을 추가하거나 기존 적을 수정할 때 사용.
  (1) 역할/수치 설계, (2) EnemyAbility 클래스 구현, (3) 스폰 규칙 설정, (4) 카운터플레이 검증.
  트리거 키워드 - 몬스터, 적, 보스, 엘리트, 디버퍼, 힐러, 분열체, 스폰
---

# MonsterDesigner - 몬스터 디자인 스킬

## 개요
Neon Defense 게임의 새로운 몬스터 타입을 설계하고 구현하는 체계적인 워크플로우.
**모든 적 능력은 EnemyAbility 클래스로 구현한다.**

## 관련 스킬
- **Ability 시스템**: → `AbilityDesigner/SKILL.md`
- **StatusEffect 시스템**: → `StatusEffectDesigner/SKILL.md`

## 적용 범위
- 새로운 적 타입 추가
- 기존 적 타입 밸런싱
- 스폰 규칙 조정
- 특수 능력 구현 (EnemyAbility)

---

## 몬스터 설계 원칙

### 1. 역할 분류 (Role)
| 역할 | 설명 | 예시 |
|------|------|------|
| **Tank** | 높은 체력, 느린 속도 | boss, elite |
| **Swarm** | 낮은 체력, 빠른 속도, 대량 스폰 | fast, normal |
| **Support** | 아군 버프/힐 | healer |
| **Debuffer** | 타워 방해 | jammer, suppressor |
| **Special** | 독특한 메카닉 | splitter |

### 2. 난이도 곡선 고려사항
- **스테이지 1~2**: 기본 적 위주 (normal, fast)
- **스테이지 3~5**: 디버퍼 등장 (jammer, suppressor)
- **스테이지 6+**: 특수 적 비율 증가 (healer, splitter)
- **웨이브 5**: 항상 보스 출현

### 3. 카운터플레이 설계
모든 몬스터는 반드시 **카운터 전략**이 존재해야 함:
- healer → 힐러 우선 타겟팅, 광역 딜
- splitter → 체인 라이트닝, 높은 단일 타겟 딜
- jammer → 사거리 밖에서 공격
- suppressor → 서포트 타워로 데미지 보완

---

## 몬스터 추가 워크플로우

### Phase 1: 기획 (Design)
```markdown
1. 역할 정의: 이 몬스터가 게임에 어떤 도전을 추가하는가?
2. 시각적 정체성: 아이콘, 색상, 크기
3. 수치 초안:
   - healthMult (기준: normal=1.0)
   - speedRange [min, max]
   - goldReward
   - livesLost
4. 특수 능력 (있다면):
   - 발동 조건
   - 효과 범위/수치
   - 쿨다운
5. 스폰 조건: 언제부터 등장하는가?
```

### Phase 2: 구현 (Implementation)

#### 2.1 `constants.js` 수정
```javascript
// ENEMY_CONFIG에 새 타입 추가
newType: {
  healthMult: 1.5,
  speedRange: [0.4, 0.5],
  speedWaveBonus: 0.01,
  goldReward: 10,
  livesLost: 1,
  color: 'bg-xxx-500',
  shadow: '0 0 15px #xxxxxx',
  size: 'w-7 h-7',
  icon: '🆕',
  explosionColor: '#xxxxxx',
  // 특수 능력 설정
  abilityRange: 80,
  abilityValue: 0.1,
  abilityCooldown: 1000,
},

// SPAWN_RULES에 스폰 규칙 추가 (우선순위 주의!)
{ type: 'newType', condition: (idx, total, wave, stage) => stage >= X && wave >= Y, chanceBase: 0.1, chancePerStage: 0.02 },
```

#### 2.2 `abilities/enemy-ability.js` 수정 (Ability 시스템)
```javascript
// 새로운 EnemyAbility 클래스 추가
class NewTypeEnemyAbility extends EnemyAbility {
  static TYPE = 'newTypeEnemy';

  constructor() {
    super('newType');
    this.type = NewTypeEnemyAbility.TYPE;
  }

  // 매 틱마다 호출 (디버프, 힐 등)
  onTick(context) {
    const { enemy, towers, enemies, now } = context;
    return {
      towerDebuffs: [],    // 타워 디버프
      enemyHeals: [],      // 적 힐
      visualEffects: [],
      spawnEnemies: [],
    };
  }

  // 사망 시 호출 (분열 등)
  onDeath(context) {
    const { enemy } = context;
    return {
      spawnEnemies: [],
      visualEffects: [],
    };
  }
}

// EnemyAbilitySystem에 매핑 추가
EnemyAbilitySystem._abilities['newType'] = NewTypeEnemyAbility;
```

#### 2.3 `enemy.js` 수정
적 생성 시 자동으로 Ability가 할당됨:
```javascript
// EnemySystem.create() 내부에서 자동 호출
return EnemyAbilitySystem.assignAbility(enemy);
// → enemy.ability, enemy.abilityType 자동 부여
```

#### 2.4 `game-engine.js` (필요시)
EnemyAbilitySystem의 처리 함수 호출:
- 타워 디버프: `EnemyAbilitySystem.calculateTowerDebuffs(enemies, towers)`
- 힐러 힐: `EnemyAbilitySystem.processHealerHeals(enemies, now)`
- 분열 사망: `EnemyAbilitySystem.processSplitterDeath(enemy)`

#### 2.4 `styles.css` 수정 (필요시)
```css
/* 새 타입 전용 애니메이션 */
.newtype-glow {
  animation: newtypePulse 1.5s ease-in-out infinite;
}

@keyframes newtypePulse {
  0%, 100% { box-shadow: 0 0 8px #color; }
  50% { box-shadow: 0 0 20px #color; }
}
```

### Phase 3: 테스트 (Testing)
1. 치트 콘솔로 해당 스테이지 이동: `` `stage X` ``
2. 확인 사항:
   - [ ] 정상 스폰되는가?
   - [ ] 시각적으로 구분 가능한가?
   - [ ] 특수 능력이 정상 작동하는가?
   - [ ] 카운터플레이가 유효한가?
   - [ ] 골드/경험치 보상이 적절한가?
3. 밸런스 조정 (필요시 Phase 1로 회귀)

### Phase 4: 문서화 (Documentation)
- `CLAUDE.md` 업데이트: 새 적 타입 추가
- 변경 내역 커밋 메시지 작성

---

## 밸런싱 가이드라인

### 체력 배율 기준
| 타입 | healthMult | 비고 |
|------|------------|------|
| fast | 0.5~0.8 | 빠른 대신 연약 |
| normal | 1.0~1.5 | 기준점 |
| elite | 2.5~4.0 | 중보스급 |
| support/debuffer | 1.5~2.5 | 적당히 튼튼 |
| boss | 공식 적용 | `12 + stage * 1.5` |

### 속도 범위 기준
| 타입 | speedRange | 비고 |
|------|------------|------|
| 매우 느림 | [0.25, 0.35] | 보스, 탱크 |
| 느림 | [0.35, 0.45] | 서포트, 디버퍼 |
| 보통 | [0.5, 0.7] | 일반 |
| 빠름 | [0.9, 1.3] | 스웜 |

### 보상 기준
- 기본 적: 3~5G
- 특수 적: 8~15G
- 보스: 공식 `30 + stage * 10 + wave * 5`

### 스폰 확률 기준
- 희귀: 5~10% (힐러, 분열체)
- 보통: 10~15% (엘리트, 디버퍼)
- 흔함: 20~30% (빠른 적)

---

## 몬스터 타입 레퍼런스

### 현재 구현된 타입
| 타입 | 아이콘 | 역할 | 특수 능력 |
|------|--------|------|----------|
| normal | - | Swarm | 없음 |
| fast | - | Swarm | 빠른 이동 |
| elite | ⭐ | Tank | 높은 체력 |
| boss | 👑 | Tank | 매우 높은 체력 |
| jammer | 📡 | Debuffer | 타워 공속 감소 |
| suppressor | 🛡️ | Debuffer | 타워 데미지 감소 |
| healer | 💚 | Support | 주변 적 체력 회복 |
| splitter | 💠 | Special | 사망 시 2마리로 분열 |

### 향후 추가 후보
- **shield**: 주변 적에게 보호막 부여
- **teleporter**: 경로 일부 스킵
- **mimic**: 타워로 위장하다 활성화
- **necromancer**: 사망한 적 부활
- **stealth**: 일정 거리까지 투명

---

## 체크리스트

새 몬스터 추가 시 확인:
- [ ] `ENEMY_CONFIG`에 타입 정의 추가
- [ ] `SPAWN_RULES`에 스폰 규칙 추가 (우선순위 확인!)
- [ ] **`abilities/enemy-ability.js`에 EnemyAbility 클래스 추가**
- [ ] **`EnemyAbilitySystem._abilities`에 매핑 추가**
- [ ] `GameEngine.gameTick()`에 능력 호출 통합 (필요시)
- [ ] CSS 애니메이션 추가 (필요시)
- [ ] 치트 콘솔로 테스트
- [ ] `CLAUDE.md` 문서 업데이트

## 참조
- **Ability 시스템**: → `AbilityDesigner/SKILL.md`
- **StatusEffect 시스템**: → `StatusEffectDesigner/SKILL.md`
- **타워 설계**: → `TowerDesigner/SKILL.md`
