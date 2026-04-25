# [제안 05] 방어력 / 실드 시스템 도입

## TL;DR
- 적에게 **Armor(정수 차감)** 와 **Shield(별도 게이지)** 를 도입해 "그냥 더 큰 숫자" 외의 전략 축을 만든다.
- 광휘 = 방어 관통, 전격 = 실드 브레이커. 속성 선택이 처음으로 *카운터픽* 의미를 갖게 된다.

---

## 1. 두 시스템 정의

| 시스템 | 처리 방식 | 위치 | 채택 이유 |
|---|---|---|---|
| **Armor** | `finalDmg = max(1, rawDmg - armor)` (flat 차감) | 본체 HP 와 동일 객체 | 타워 데미지 분포(T1=10 ~ T4=350)가 넓어 % 차감은 T1 무력화 / T4 무의미. flat 은 저티어를 자연스럽게 도태시키되 1 dmg 최소 보장으로 완전 무효화 방지. |
| **Shield** | 별도 게이지. `shield > 0` 이면 데미지가 실드부터 차감, 0 되면 본체 HP 받음 | HP 바 위에 청록 게이지 | "두 단계 체력" 으로 보스/엘리트 페이즈감 부여. Armor 와 직교(곱연산 아님)해 튜닝 단순. |

**처리 순서**: `damage → (속성 보정) → Shield 차감 → Armor 차감 → HP 차감`

---

## 2. 수치 가안 (적 타입별)

| 타입 | Armor | Shield | 카운터 속성 | 비고 |
|---|---|---|---|---|
| normal | 0 | 0 | – | 기존 유지 |
| fast | 0 | 0 | – | 기존 유지 |
| elite | 5 | 0 | 광휘 (관통) | T1(10) 절반, T2(30) 17%, T4(350) 1.4% 차감 |
| boss | 10 | HP × 30% | 전격 (실드) | 페이즈감 부여, 실드 깨면 본체 노출 |
| jammer | 0 | 0 | – | 기존 디버프 역할 유지 |
| suppressor | 15 | 0 | 광휘 | 기존 디버프 + 두꺼운 장갑으로 "먼저 처리할 적" 시그널 강화 |
| healer | 0 | 0 | – | 처리 우선순위는 dps 로 |
| splitter | 3 | 0 | 광휘 | 분열체는 armor 0 |
| **aegis (신규)** | 0 | HP × 50% (1회 회복) | 전격 | 실드 방치 시 5초 후 50% 재생. 전격으로 빠르게 깨야 함 |

> 보스 실드는 "스테이지 보스에 한해" 적용. 멀티페이즈 보스 제안(03번)과 호환: 페이즈 전환 시 실드 재충전 가능.

---

## 3. 속성 카운터 매핑

| 속성 | 효과 | 수치 |
|---|---|---|
| 광휘 (Light) | **Armor Pierce** — 방어력 50% 무시 | `effectiveArmor = armor * 0.5` |
| 전격 (Electric) | **Shield Breaker** — 실드에 ×2 데미지 | shield 차감 시점에 `dmg *= 2` |
| 화염 / 냉기 / 공허 / 질풍 | 변화 없음 | 기존 고유 역할 유지 (지속피해/슬로우/디버프/넉백) |

핵심: **광휘·전격이 처음으로 "특정 적 카운터" 정체성을 가짐.** 다른 4속성은 기존 고유성으로 차별화.

---

## 4. 신규 StatusEffect: `ArmorBreakEffect`

| 항목 | 값 |
|---|---|
| type | `'armorBreak'` |
| 대상 | 적 (디버프) |
| 효과 | 방어력 50% 감소 |
| 지속 | 3000ms |
| 스택 | 갱신(refresh), 중첩 X |
| 적용 트리거 | 광휘 T3 이상 일정 확률, 또는 신규 어빌리티 |

`StatusEffectManager.getArmorMultiplier(enemy, now)` 를 신설해 데미지 계산 시 곱연산.

---

## 5. 구현 영역 (DDD 영향)

- `domain/config/constants.js` — `ENEMY_CONFIG` 각 타입에 `armor`, `shield` 필드 추가, 신규 `aegis` 추가
- `domain/enemy/enemy-system.js` — 데미지 적용 로직에 Shield → Armor → HP 순 처리, `applyDamage()` 신설
- `domain/enemy/abilities/enemy-ability.js` — `aegis` 의 실드 재생 어빌리티 추가
- `domain/effect/status-effect.js` — `ArmorBreakEffect` 클래스 + `getArmorMultiplier()` 추가
- `domain/tower/abilities/light-ability.js` — `armorPierce: 0.5` 플래그, 일정 확률로 `armorBreak` StatusEffect 부여
- `domain/tower/abilities/electric-ability.js` — `shieldDamageMult: 2.0` 플래그, 실드 차감 시 적용
- `components/EnemyHpBar.jsx` (또는 GameMap 내부) — HP 바 위 실드 게이지(청록), 좌측 armor 아이콘

---

## 6. 롤아웃 플랜

| 단계 | 내용 | 뺄 것 |
|---|---|---|
| **MVP** | Armor flat 차감만. elite(5) / boss(10) / suppressor(15) 에 적용. 광휘 50% 관통. | Shield, aegis, ArmorBreakEffect, 전격 카운터 |
| **V2** | Shield 게이지 + UI. boss 30% 실드, 신규 `aegis` 추가. 전격 ×2 실드 데미지. | ArmorBreakEffect |
| **V3** | `ArmorBreakEffect` + 광휘 어빌리티 통합. 멀티페이즈 보스 실드 재충전 연동. 밸런스 패스 (수치는 game-balancer 핸드오프). | – |

---

## 7. 리스크 & 오픈 이슈

1. **난이도 급등 리스크** — Armor 5 만 들어가도 T1 데미지가 절반. 초반 스테이지(1~3) 에는 armor 0 유지 필수. → MVP 에서 elite 부터 적용, normal/fast 는 영원히 0.
2. **광휘·전격 OP / 나머지 4속성 도태 리스크** — 카운터 속성이 너무 강하면 가챠 메타가 두 색에 쏠림. 완화책:
   - 광휘 관통 50% (100% 아님), 전격 실드 ×2 (×3 아님) 로 *우위지만 필수는 아닌* 수준 유지
   - Armor/Shield 보유 적은 전체의 30% 미만으로 제한
   - 4속성의 기존 고유성(화상 dot, 빙결 cc, 공허 디버프, 질풍 넉백) 은 armored 적에게도 그대로 작동

> 세부 수치 튜닝은 `game-balancer` 에이전트에게 핸드오프.
