# 🎯 밸런스 로거 사용 가이드

## 📋 개요

**BalanceLogger**는 게임 클리어/실패 시 상세한 플레이 정보를 자동으로 수집하여 밸런스 조정에 활용할 수 있도록 돕는 시스템입니다.

---

## 🚀 자동 동작

### 로그가 기록되는 시점
1. **게임 클리어**: Stage 8 Wave 5 클리어 시
2. **게임오버**: 목숨이 0이 되었을 때

### 자동 수집 정보
- ⏱️ 플레이 타임
- 🏰 진행도 (Stage, Wave)
- 💰 남은 골드, 목숨
- 🏰 배치된 타워 분석 (티어별, 속성별, 역할별)
- 🛡️ 서포트 타워 분석
- 👾 전투 통계 (킬, 보스 처치, 퍼펙트 웨이브 등)
- ⭐ 영구 버프 현황
- ⚠️ 밸런스 경고 (골드 과다, 난이도 불균형 등)

---

## 💻 콘솔 명령어

### 로그 확인

#### 최근 로그 출력
```javascript
// 자동으로 게임 종료 시 콘솔에 출력됨
// 또는 수동으로 마지막 로그 확인
const logs = BalanceLogger.getLogs();
const lastLog = logs[logs.length - 1];
BalanceLogger.printLog(lastLog);
```

#### 통계 리포트 생성
```javascript
BalanceLogger.generateReport();
```

**출력 예시**:
```
📊 밸런스 분석 리포트 (총 10게임)
  ✅ 클리어: 7회 (70%)
  ❌ 게임오버: 3회

  ✅ 클리어 게임 평균
    플레이 타임: 46분 23초
    남은 골드: 1523G
    남은 목숨: 8
    T4 타워: 7개
    서포트 타워: 3개

  ❌ 게임오버 평균
    도달 스테이지: 6
    T4 타워: 4개

  ⚠️ 주요 밸런스 이슈
    gold: 2회 (골드 관련 경고)
    difficulty: 3회 (난이도 관련 경고)
```

---

### 로그 관리

#### 저장된 로그 조회
```javascript
const logs = BalanceLogger.getLogs();
console.log(logs);
```

#### 로그 내보내기 (JSON 파일)
```javascript
BalanceLogger.exportLogs();
// → neonDefense_balanceLogs_[timestamp].json 다운로드
```

#### 로그 전체 삭제
```javascript
BalanceLogger.clearLogs();
```

---

## 📊 로그 데이터 구조

```javascript
{
  // 메타 정보
  timestamp: 1709876543210,
  date: "2026-02-05 14:30:15",
  result: "clear", // 또는 "gameover"
  playTime: 2783, // 초
  playTimeFormatted: "46분 23초",

  // 진행도
  finalStage: 8,
  finalWave: 5,
  highestStage: 8,

  // 자원
  remainingGold: 1523,
  remainingLives: 8,

  // 타워 분석
  towers: {
    total: 12,
    byTier: { 1: 0, 2: 1, 3: 2, 4: 9 },
    byElement: { 0: 2, 1: 3, 2: 2, 3: 1, 4: 2, 5: 2 },
    byRole: { A: 3, B: 4, C: 2 },
    avgDamage: 320,
    avgRange: 145,
    totalValue: 4980 // 골드 환산
  },

  // 서포트 타워 분석
  supportTowers: {
    total: 3,
    byTier: { 1: 0, 2: 1, 3: 2 },
    byType: { 0: 1, 1: 1, 2: 0, 3: 1 },
    totalValue: 840
  },

  // 통계
  stats: {
    totalKills: 1566,
    bossKills: 8,
    eliteKills: 47,
    healerKills: 23,
    splitterKills: 31,
    totalGoldEarned: 5737,
    totalGoldSpent: 4214,
    towersDrawn: 142,
    towersPlaced: 12,
    towersCombined: 11,
    t4TowersCreated: 9,
    supportTowersDrawn: 15,
    perfectWaves: 32,
    wavesCleared: 40,
    livesLost: 12
  },

  // 영구 버프
  permanentBuffs: [
    { id: "goldBonus", stacks: 2 },
    { id: "damageBonus", stacks: 1 }
  ],

  // 효율성 지표
  efficiency: {
    goldPerMinute: 123, // 분당 획득 골드
    killsPerMinute: 33, // 분당 킬
    goldEfficiency: 73, // 골드 사용률 %
    survivalRate: 80 // 퍼펙트 비율 %
  },

  // 밸런스 경고
  warnings: [
    {
      type: "gold",
      message: "남은 골드 과다 (1523G) - 경제 너무 여유로움"
    }
  ]
}
```

---

## 🎯 밸런스 조정 활용법

### 1. 경제 밸런스 체크

#### 남은 골드 분석
```javascript
const logs = BalanceLogger.getLogs();
const clearLogs = logs.filter(l => l.result === 'clear');

const avgRemainingGold = clearLogs.reduce((sum, l) => sum + l.remainingGold, 0) / clearLogs.length;
console.log('클리어 시 평균 남은 골드:', avgRemainingGold);

// 목표: 500~2000G
// 현재 3000G 이상 → 경제 너무 여유로움 → 하향 필요
// 현재 500G 이하 → 경제 너무 타이트 → 상향 필요
```

#### 골드 사용률 분석
```javascript
const avgEfficiency = clearLogs.reduce((sum, l) => sum + l.efficiency.goldEfficiency, 0) / clearLogs.length;
console.log('평균 골드 사용률:', avgEfficiency, '%');

// 목표: 70~90%
// 50% 이하 → 골드가 너무 많음
// 95% 이상 → 골드가 너무 부족함
```

---

### 2. 난이도 밸런스 체크

#### 클리어율 분석
```javascript
const logs = BalanceLogger.getLogs();
const clearRate = logs.filter(l => l.result === 'clear').length / logs.length;
console.log('클리어율:', Math.round(clearRate * 100), '%');

// 목표: 40~70%
// 80% 이상 → 너무 쉬움
// 30% 이하 → 너무 어려움
```

#### 게임오버 스테이지 분석
```javascript
const gameoverLogs = logs.filter(l => l.result === 'gameover');
const avgGameoverStage = gameoverLogs.reduce((sum, l) => sum + l.finalStage, 0) / gameoverLogs.length;
console.log('평균 게임오버 스테이지:', avgGameoverStage);

// Stage 3 이하 → 초반 너무 어려움
// Stage 7 이상 → 후반만 어려움 (밸런스 OK)
```

#### 퍼펙트 웨이브 비율
```javascript
const clearLogs = logs.filter(l => l.result === 'clear');
const avgSurvivalRate = clearLogs.reduce((sum, l) => sum + l.efficiency.survivalRate, 0) / clearLogs.length;
console.log('평균 퍼펙트 비율:', avgSurvivalRate, '%');

// 목표: 60~80%
// 90% 이상 → 너무 쉬움
// 50% 이하 → 너무 어려움
```

---

### 3. 타워 밸런스 체크

#### T4 타워 개수 분석
```javascript
const clearLogs = logs.filter(l => l.result === 'clear');
const avgT4Count = clearLogs.reduce((sum, l) => sum + l.towers.byTier[4], 0) / clearLogs.length;
console.log('클리어 시 평균 T4 타워:', avgT4Count, '개');

// 목표: 7~9개
// 5개 이하 → 너무 어렵거나 경제 부족
// 12개 이상 → 너무 쉬움, 경제 너무 많음
```

#### 속성별 사용률
```javascript
const clearLogs = logs.filter(l => l.result === 'clear');
const elementUsage = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const elementNames = ['화염', '냉기', '전격', '질풍', '공허', '광휘'];

clearLogs.forEach(log => {
  for (let i = 0; i < 6; i++) {
    elementUsage[i] += log.towers.byElement[i];
  }
});

const total = Object.values(elementUsage).reduce((a, b) => a + b, 0);
for (let i = 0; i < 6; i++) {
  const rate = (elementUsage[i] / total * 100).toFixed(1);
  console.log(`${elementNames[i]}: ${elementUsage[i]}개 (${rate}%)`);
}

// 목표: 각 속성 10~25%
// 30% 이상 → 해당 속성이 너무 강함
// 5% 이하 → 해당 속성이 너무 약함
```

---

### 4. 플레이 타임 체크

```javascript
const clearLogs = logs.filter(l => l.result === 'clear');
const avgPlayTime = clearLogs.reduce((sum, l) => sum + l.playTime, 0) / clearLogs.length;
const minutes = Math.floor(avgPlayTime / 60);
console.log('평균 플레이 타임:', minutes, '분');

// 목표: 40~60분
// 30분 이하 → 너무 짧음
// 70분 이상 → 너무 김
```

---

## 🔍 경고 시스템

### 자동 경고 종류

#### 골드 경고
- 남은 골드 3000G 이상 → "경제 너무 여유로움"
- 남은 골드 100G 이하 (Stage < 8) → "경제 너무 타이트"

#### 목숨 경고
- 남은 목숨 15개 이상 → "난이도 너무 쉬움"
- 남은 목숨 3개 이하 (Stage >= 6) → "난이도 너무 어려움"

#### 타워 경고
- T4 타워 3개 이하 (Stage >= 6) → "조합 어려움"
- T4 타워 12개 이상 → "난이도 너무 쉬움"

#### 난이도 경고
- 퍼펙트 비율 90% 이상 → "난이도 하향 필요"

---

## 📁 로그 파일 활용

### JSON 내보내기
1. 콘솔에서 `BalanceLogger.exportLogs()` 실행
2. JSON 파일 다운로드
3. 스프레드시트나 분석 도구로 열기

### Python 분석 예시
```python
import json
import pandas as pd

# JSON 파일 로드
with open('neonDefense_balanceLogs_xxxxx.json', 'r', encoding='utf-8') as f:
    logs = json.load(f)

# DataFrame 변환
df = pd.DataFrame([
    {
        'result': log['result'],
        'playTime': log['playTime'] / 60,  # 분
        'stage': log['finalStage'],
        'gold': log['remainingGold'],
        'lives': log['remainingLives'],
        't4_count': log['towers']['byTier']['4'],
    }
    for log in logs
])

# 분석
print(df.groupby('result').mean())
print(f"클리어율: {len(df[df['result'] == 'clear']) / len(df) * 100:.1f}%")
```

---

## 🛠️ 고급 사용법

### 커스텀 분석 함수
```javascript
// 속성별 T4 타워 승률 분석
function analyzeElementWinRate() {
  const logs = BalanceLogger.getLogs();
  const elementWins = {};
  const elementGames = {};

  logs.forEach(log => {
    const t4Elements = {};
    // T4 타워만 카운트
    log.towers.byElement에서 집계
    // ...

    if (log.result === 'clear') {
      // 승리 집계
    }
    // 게임 수 집계
  });

  // 승률 계산
  for (const element in elementGames) {
    const winRate = (elementWins[element] || 0) / elementGames[element] * 100;
    console.log(`${element}: ${winRate.toFixed(1)}%`);
  }
}
```

---

## 📝 주의사항

1. **로그 개수 제한**: 최대 50개 로그 저장 (오래된 것부터 자동 삭제)
2. **localStorage 사용**: 브라우저 저장소 용량 제한 있음
3. **자동 수집**: 게임 종료 시에만 로그 생성
4. **세션 추적**: 새 게임 시작 또는 이어하기 시 세션 초기화

---

## 🎯 밸런스 조정 워크플로우

1. **데이터 수집**: 10~20게임 플레이 (또는 테스터 모집)
2. **리포트 생성**: `BalanceLogger.generateReport()`
3. **문제점 파악**: 경고 확인, 평균값 분석
4. **조정안 작성**: constants.js 수정 계획
5. **패치 적용**: 경제/난이도 수치 변경
6. **재테스트**: 10게임 추가 플레이
7. **비교 분석**: 이전 로그와 비교
8. **반복**: 목표 달성까지 반복

---

**작성일**: 2026-02-05
**버전**: 1.0
**파일**: `js/balance-logger.js`
