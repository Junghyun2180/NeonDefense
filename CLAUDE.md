# Neon Defense - Claude Code 프로젝트 가이드

## 프로젝트 개요
네온 테마 랜덤 타워 디펜스 게임. 가챠 시스템 + 로그라이크 요소 결합 전략 게임.

- **실행**: `npx serve .` → `http://localhost:3000`
- **배포**: GitHub Pages (`https://junghyun2180.github.io/NeonDefense/`)
- **언어**: 순수 JavaScript + JSX (Babel Standalone 런타임 변환, CDN)

## 파일 구조

```
NeonDefense/
├── index.html          # 진입점 (CDN + 스크립트 로드)
├── css/styles.css      # 애니메이션, UI 스타일 (~230줄)
├── js/
│   ├── App.jsx         # 메인 React 컴포넌트 (~850줄) ⚠️ 모듈화 검토 대상
│   ├── constants.js    # 게임 상수 및 설정 테이블 (~260줄)
│   ├── enemy.js        # EnemySystem (~185줄)
│   ├── game-engine.js  # GameEngine (~310줄)
│   ├── sound.js        # SoundManager (~340줄)
│   ├── tower.js        # TowerSystem (~320줄)
│   └── utils.js        # 유틸리티 (~136줄)
└── .claude/SKILL/      # Claude 스킬 정의
```

## 핵심 아키텍처

### 네임스페이스 (글로벌 객체)
- `EnemySystem` — 적 생성/이동/상태이상
- `TowerSystem` — 타워/서포트 생성/조합/공격
- `GameEngine` — 게임 틱 오케스트레이터

### 주요 시스템
- **공격 타워** (6속성 × 4티어): 화염/냉기/전격/질풍/공허/광휘
- **서포트 타워** (4종 × 3티어): 공격력/공속/방감/사거리 버프
- **적 타입** (8종): normal, fast, elite, boss, jammer, suppressor, healer, splitter
- **경로**: 스테이지별 다중 경로 (최대 3출발/3도착)

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

### 필수 원칙
- 타워 생성: `TowerSystem.create()` 또는 `TowerSystem.createSupport()`
- 적 생성: `EnemySystem.create()`
- 게임 틱: `GameEngine.gameTick()`
- 상수: `constants.js`에 집중

### 주의사항
- CDN 기반 → import/export 불가 (글로벌 스코프)
- 적 타입은 문자열 기반 (`enemy.type`)
- 씨드 기반 경로 생성 → 호환성 고려

## 토큰 최적화 원칙

### 파일 모듈화 기준
- **500줄 초과 시 분리 검토**
- 현재 `App.jsx` (~850줄) → 분리 후보

### 읽기 최적화
- 전체 파일 대신 **특정 라인 범위** 읽기 (`offset`, `limit`)
- **Grep으로 함수 위치 먼저 파악** 후 해당 부분만 읽기
- 변경 필요한 부분만 정확히 타겟팅

### App.jsx 분리 후보
| 영역 | 분리 파일 | 라인 수 (예상) |
|------|----------|---------------|
| 드래그앤드롭 | `useDragAndDrop.js` | ~80줄 |
| 치트 콘솔 | `useCheatConsole.js` | ~60줄 |
| 서포트 타워 핸들러 | `useSupportTower.js` | ~100줄 |
| 타워 렌더러 | `TowerRenderer.jsx` | ~50줄 |
| 적 렌더러 | `EnemyRenderer.jsx` | ~40줄 |

## Skill 참조

| 스킬 | 용도 |
|------|------|
| `BugFixer` | 6단계 버그 수정 워크플로우 |
| `BalanceDesigner` | 경제/전투/메타 밸런스 설계 |
| `MonsterDesigner` | 몬스터 설계 및 구현 워크플로우 |

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
