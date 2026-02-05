# 🎮 밸런스 조정 계획 - 긴장감 강화

## 📊 현재 문제 분석

### 플레이테스트 결과
- ❌ **T4 타워 5개만으로 8스테이지 전체 클리어**
- ❌ **클리어 시 8000G 남음** (목표 대비 과도한 잉여)
- ❌ **T1 타워만 나와서 조합이 지루함**

### 경제 계산 (현재)

```
=== 현재 경제 ===
웨이브 보상 총합: 1460G
스테이지 보상 총합: 546G
총 적 수: 1046마리
킬 보상 추정: 4184G
초기 골드: 120G

총 획득 가능 골드: ~6310G (보수 추정)

T4 타워 5개 비용: 2700G (540G × 5)
남은 골드: 3610G

실제 플레이에서 8000G 남았다는 것은
→ 킬 골드가 예상보다 많거나 (엘리트/보스 보너스)
→ 타워를 적게 사용함 (5개만 사용)
```

### 적 체력 (현재 - Stage 8 기준)
```
Stage 8 Wave 5:
- Normal: ~266HP
- Boss: ~5709HP

T4 타워 DPS: 350 / 0.4s = 875 DPS
→ Normal은 0.3초, Boss는 6.5초에 처리
→ T4 5개면 Boss도 1.3초 안에 녹음
```

## 🎯 조정 목표

### 난이도 목표
- ✅ **T4 타워 7~8개 필요** (현재 5개 → 타워 40% 증가)
- ✅ **남은 골드 500~1000G** (현재 8000G → 긴박한 경제)
- ✅ **고티어 타워 스폰 확률 증가** (후반 조합 완화)

### 경제 목표
```
총 획득 가능 골드: ~5500G (현재 대비 -13%)
T4 타워 8개 비용: 4320G (540G × 8)
남은 골드: ~1180G ✅
```

## 🔧 구체적 조정 사항

### 1. 경제 하향 (constants.js - ECONOMY)

#### 웨이브 보상 감소 (-20%)
```javascript
// 변경 전
waveReward: (wave) => 25 + wave * 6 + (wave === 5 ? 25 : 0), // 총 1460G

// 변경 후
waveReward: (wave) => 20 + wave * 5 + (wave === 5 ? 20 : 0), // 총 1160G (-300G)
```

#### 스테이지 보상 조정
```javascript
// 변경 전
stageClearBonus: (stage) => {
  if (stage <= 3) return Math.floor((50 + stage * 10) * 1.3); // 78, 81, 83
  return 50 + stage * 10; // 90, 100, 110, 120
}, // 총 546G

// 변경 후
stageClearBonus: (stage) => {
  if (stage <= 3) return Math.floor((40 + stage * 8) * 1.2); // 58, 60, 62
  return 40 + stage * 8; // 72, 80, 88, 96
}, // 총 436G (-110G)
```

#### 킬 골드 감소 (-15%)
```javascript
// 변경 전 (ENEMY_CONFIG)
normal: { goldReward: 4, ... },
fast: { goldReward: 3, ... },
elite: { goldReward: 10, ... },
jammer: { goldReward: 12, ... },
suppressor: { goldReward: 14, ... },
healer: { goldReward: 15, ... },
splitter: { goldReward: 8, ... },

// 변경 후
normal: { goldReward: 3, ... },    // 4 → 3
fast: { goldReward: 2, ... },      // 3 → 2
elite: { goldReward: 8, ... },     // 10 → 8
jammer: { goldReward: 10, ... },   // 12 → 10
suppressor: { goldReward: 12, ... }, // 14 → 12
healer: { goldReward: 12, ... },   // 15 → 12
splitter: { goldReward: 6, ... },  // 8 → 6
```

#### 보스 골드 감소 (-20%)
```javascript
// 변경 전
bossGoldReward: (stage, wave) => 35 + stage * 12 + wave * 6,
// Stage 1~8 총: ~780G

// 변경 후
bossGoldReward: (stage, wave) => 25 + stage * 10 + wave * 5,
// Stage 1~8 총: ~560G (-220G)
```

#### 초기 골드 감소
```javascript
// 변경 전
startGold: 120,

// 변경 후
startGold: 100, // -20G
```

### 총 골드 감소 예상
```
웨이브 보상: -300G
스테이지 보상: -110G
킬 골드: -15% (~-630G)
보스 골드: -220G
초기 골드: -20G
---
총 감소: ~-1280G

예상 총 골드: 6310G - 1280G = 5030G
T4 타워 8개: 4320G
남은 골드: ~710G ✅
```

---

### 2. 난이도 상향 (constants.js - HEALTH_SCALING)

```javascript
// 변경 전
const HEALTH_SCALING = {
  base: 30,
  stageGrowth: 0.38,
  waveGrowth: 0.30,
  lateWaveBonus: 1.3,
  bossFormula: (stage) => 10 + stage * 1.3,
};

// 변경 후
const HEALTH_SCALING = {
  base: 35,            // 30 → 35 (+16% 기본 체력)
  stageGrowth: 0.42,   // 0.38 → 0.42 (후반 체력 증가)
  waveGrowth: 0.32,    // 0.30 → 0.32
  lateWaveBonus: 1.4,  // 1.3 → 1.4 (Wave 4-5 체력 증가)
  bossFormula: (stage) => 12 + stage * 1.5, // 보스 체력 20% 증가
};
```

#### 예상 체력 변화
```
Stage 8 Wave 5 (최종):
- Normal: 266HP → 380HP (+43%)
- Boss: 5709HP → 8100HP (+42%)

T4 타워 5개 DPS: 4375
→ Boss 처리 시간: 1.3초 → 1.85초
→ Normal 처리 시간: 0.06초 → 0.09초
```

---

### 3. 고티어 타워 스폰 확률 증가 (새 시스템)

#### 개요
스테이지가 올라갈수록 T2/T3 타워가 나올 확률 증가
→ 후반 조합 부담 완화

#### 구현 (constants.js - TOWER_DRAW)
```javascript
// 새로 추가
const TOWER_DRAW = {
  // 스테이지별 고티어 스폰 확률
  tierChance: (stage) => {
    if (stage <= 2) return { t1: 1.0, t2: 0, t3: 0 }; // Stage 1-2: T1만
    if (stage <= 4) return { t1: 0.85, t2: 0.15, t3: 0 }; // Stage 3-4: T2 15%
    if (stage <= 6) return { t1: 0.70, t2: 0.25, t3: 0.05 }; // Stage 5-6: T2 25%, T3 5%
    return { t1: 0.60, t2: 0.30, t3: 0.10 }; // Stage 7-8: T2 30%, T3 10%
  },
};
```

#### 타워 뽑기 로직 수정 필요
- `js/App.jsx` 또는 `js/hooks/useInventory.jsx`의 `drawTower()` 함수
- 현재: `const tier = 1;` 고정
- 변경: 위 확률표에 따라 tier 랜덤 결정

```javascript
// 예시 (구현 파일에서 수정 필요)
const drawTower = () => {
  const chances = TOWER_DRAW.tierChance(stage);
  const rand = Math.random();

  let tier = 1;
  if (rand < chances.t3) tier = 3;
  else if (rand < chances.t3 + chances.t2) tier = 2;
  else tier = 1;

  const colorIndex = Math.floor(Math.random() * 6);
  return TowerSystem.create(tier, colorIndex);
};
```

---

### 4. 적 스폰 약간 증가 (선택사항)

```javascript
// 현재: 80% 수준
enemiesPerWave: (stage, wave) => {
  if (stage === 1) return Math.floor(8 + wave * 1.6);
  if (stage === 2) return Math.floor(12 + wave * 2.4);
  return Math.floor(20 + wave * 4 + (stage - 3) * 6);
},

// 옵션: 90% 수준 (물량 10% 증가)
enemiesPerWave: (stage, wave) => {
  if (stage === 1) return Math.floor(9 + wave * 1.8);
  if (stage === 2) return Math.floor(14 + wave * 2.7);
  return Math.floor(23 + wave * 4.5 + (stage - 3) * 6.7);
},
```

**추천**: 일단 경제/체력 조정만 적용 후 테스트
→ 여전히 쉬우면 물량도 증가

---

## 📈 예상 효과

### Before (현재)
```
T4 타워 필요: 5개
총 획득 골드: ~9000G
남은 골드: 8000G
난이도: ★★☆☆☆ (매우 쉬움)
조합 난이도: ★★★★★ (T1만 나옴)
```

### After (조정 후)
```
T4 타워 필요: 7~8개
총 획득 골드: ~5000G
남은 골드: 500~1000G
난이도: ★★★★☆ (도전적)
조합 난이도: ★★★☆☆ (후반 고티어 나옴)
```

---

## 🛠️ 구현 순서

### Phase 1: 경제 조정 (constants.js만 수정)
1. ✅ ECONOMY.waveReward 감소
2. ✅ ECONOMY.stageClearBonus 감소
3. ✅ ECONOMY.bossGoldReward 감소
4. ✅ ECONOMY.startGold 감소
5. ✅ ENEMY_CONFIG.*.goldReward 감소

### Phase 2: 난이도 조정 (constants.js만 수정)
6. ✅ HEALTH_SCALING 값 상향

### Phase 3: 고티어 스폰 시스템 (constants.js + App.jsx)
7. ✅ constants.js에 TOWER_DRAW 추가
8. ⚠️ App.jsx 또는 useInventory.jsx의 drawTower() 수정

### Phase 4: 테스트
9. 플레이테스트 (치트 없이)
10. 필요시 미세 조정

---

## 🧪 테스트 체크리스트

### 경제 테스트
- [ ] Stage 8 클리어 시 남은 골드 500~1500G
- [ ] T4 타워 7~8개 배치 가능
- [ ] Stage 3~4에서 골드 부족감 느껴짐
- [ ] Stage 6~7에서 타워 선택 고민됨

### 난이도 테스트
- [ ] Stage 8에서 T4 타워 5개로는 부족함
- [ ] Stage 6~7에서 방어 실패 위기 경험
- [ ] 보스가 체감상 강해짐
- [ ] 서포트 타워 필요성 증가

### 고티어 스폰 테스트
- [ ] Stage 3부터 T2 타워 가끔 나옴
- [ ] Stage 5부터 T3 타워 가끔 나옴
- [ ] 조합이 덜 지루함
- [ ] T4 도달 시간 단축됨

---

## 📝 수정 파일 목록

### 필수
- `js/constants.js` - ECONOMY, HEALTH_SCALING, TOWER_DRAW 추가

### 선택 (고티어 스폰 구현 시)
- `js/App.jsx` 또는 `js/hooks/useInventory.jsx` - drawTower() 로직 수정

---

## 💡 추가 개선 아이디어 (차후)

### 단기
- [ ] 이자 시스템 조정 (현재 너무 관대할 수 있음)
- [ ] 서포트 타워 비용 조정 (40G가 적정한지)
- [ ] 타워 판매 환급률 조정 (50% → 40%?)

### 중기
- [ ] 스테이지별 특수 제약 (타워 배치 수 제한 등)
- [ ] 영구 버프 밸런스 재검토
- [ ] 엔드게임 콘텐츠 (Stage 9-10 추가, 하드 모드)

---

**작성일**: 2026-02-05
**목표**: 긴장감 있는 경제 + 도전적 난이도
**예상 작업 시간**: 30분 (Phase 1-2), +30분 (Phase 3)
**테스트 필요**: ✅ 필수
