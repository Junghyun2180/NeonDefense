# Neon Defense - Claude Code 프로젝트 가이드

## 프로젝트 개요
네온 테마 랜덤 타워 디펜스 게임. 가챠 시스템 + 로그라이크 요소 결합 전략 게임.

- **경로**: `F:\VibeCodingProject\NeonDefense\`
- **실행**: `index.html`을 브라우저에서 직접 열기 (빌드 도구 없음)
- **언어**: 순수 JavaScript + JSX (Babel Standalone 런타임 변환)

## 기술 스택
- **React 18** (CDN, 빌드 없음)
- **Babel Standalone 7.23.5** (브라우저 내 JSX 변환)
- **Tailwind CSS** (CDN)
- **Web Audio API** (프로시저럴 사운드 생성)
- **버전 관리**: Git

빌드 도구, 패키지 매니저, TypeScript 없음. 모든 의존성은 CDN으로 로드.

## 파일 구조

```
NeonDefense/
├── index.html          # 메인 게임 (단일 파일 번들, ~2,184줄)
├── index-modular.html  # 모듈식 버전 (미사용)
├── README.md
├── CLAUDE.md           # 이 파일
├── css/
│   └── styles.css      # 애니메이션, UI 스타일 (~170줄)
├── js/
│   ├── App.jsx         # 메인 React 컴포넌트, 게임 상태 관리 (~1,480줄)
│   ├── constants.js    # 게임 상수: 타일, 속성, 타워 티어 정의 (~91줄)
│   ├── enemy.js        # 적 생성, 이동, 웨이브 구성 (~145줄)
│   ├── game-engine.js  # 게임 루프, 물리, 체인 라이트닝 (~165줄)
│   ├── sound.js        # SoundManager: BGM/SFX 생성 (~340줄)
│   ├── tower.js        # 타워 생성, 배치, 조합, 공격 (~158줄)
│   └── utils.js        # 경로 생성, 판매 가격, 유틸리티 (~129줄)
└── .claude/
    └── SKILL/
        ├── BalanceDesigner/SKILL.md  # 게임 밸런싱 스킬
        └── BugFixer/SKILL.md         # 버그 수정 스킬
```

## 핵심 아키텍처

### 상태 관리
`App.jsx`에서 React `useState`로 모든 게임 상태를 관리:
- `gold`, `lives`, `stage`, `wave` - 게임 진행
- `towers[]`, `enemies[]`, `projectiles[]` - 게임 오브젝트
- `inventory[]`, `selectedInventory[]`, `selectedTowers[]` - UI 상태
- `gameSpeed` (1x/2x/3x), `pathData` (다중 경로)

### 게임 루프
`useEffect` + `requestAnimationFrame` 기반. `game-engine.js`에서 물리/충돌 처리.

### 주요 시스템
- **속성 시스템** (6종): 화염(DoT), 냉기(슬로우), 전격(체인), 질풍(넉백), 공허, 광휘
- **티어 시스템** (T1~T4): 3개 조합으로 상위 티어 승급
- **다중 경로**: 스테이지별 복잡도 증가 (1경로 → 최대 3출발/3도착)
- **적 타입** (6종): 일반, 빠름, 엘리트, 보스, 방해자(공속감소), 억제자(공격력감소)
- **드래그앤드롭 + 모바일 배치**: PC는 드래그, 모바일은 탭 → 선택 방식

## 코드 수정 규칙

### 필수 지침
- 세션 메시지 한도 도달 시, 이전 메시지 삭제하지 말고 세션 변경 요청
- 작업 완료 후 Git 커밋 (사용자 요청 시)
- `index.html`은 단일 파일 번들 — `js/` 폴더의 모듈식 파일을 수정할 것

### 코드 스타일
- 한국어 주석 사용
- React 함수형 컴포넌트 + Hooks 패턴
- 게임 상수는 `constants.js`에 집중
- 게임 로직은 관심사별로 분리된 JS 파일에 작성

### 주의사항
- CDN 기반이므로 import/export 구문 사용 불가 (글로벌 스코프)
- `index.html`의 인라인 코드와 `js/` 폴더의 모듈 파일이 별도로 존재 — 동기화 필요
- Web Audio API는 사용자 인터랙션 후에만 초기화 가능
- 씨드 기반 경로 생성 — 경로 로직 변경 시 기존 씨드 호환성 고려

## 테스트 가이드

### 자동화된 테스트
현재 테스트 프레임워크 미도입. 수동 브라우저 테스트로 검증.

### 버그 테스트 시 Subagent 활용
버그 관련 테스트는 **Task 도구의 Subagent**를 활용하여 진행:

```
1. 코드 분석 Subagent (Explore)
   - 버그 관련 코드 탐색 및 영향 범위 파악
   - 관련 파일 간 의존성 추적

2. 버그 수정 검증 Subagent (general-purpose)
   - 수정 전후 코드 비교 분석
   - 로직 정합성 검증
   - 경계값/에지케이스 시나리오 검토

3. 회귀 분석 Subagent (Explore)
   - 수정이 다른 기능에 미치는 영향 탐색
   - 관련 함수 호출 체인 추적
```

### 수동 테스트 체크리스트
- 게임 시작 → 뽑기 → 배치 → 웨이브 클리어 흐름
- 타워 조합 (인벤토리 3합, 맵 위 3합)
- 모바일/PC 양쪽 배치 방식
- 속성 효과 (화상 DoT, 슬로우, 체인, 넉백)
- 디버프 적 (방해자/억제자) 근처 타워 성능 저하
- 스테이지 전환 및 다중 경로 생성
- 사운드 토글 (BGM/SFX)
- 게임 배속 변경 (1x/2x/3x)

## Skill 참조

프로젝트에 등록된 Skill은 `.claude/SKILL/` 폴더에 위치:

- **BugFixer** (`bug-fixer`): 6단계 버그 수정 워크플로우 — 증상 파악 → 재현 → RCA → 수정 설계 → 적용 → 검증
- **BalanceDesigner**: 게임 밸런스 설계 — 경제/전투/메타 밸런스, KPI 기반 난이도 곡선 관리

새 Skill 추가 시 `.claude/SKILL/{SkillName}/SKILL.md` 형식으로 작성.

## 주요 수치 참조

### 타워 (constants.js)
| 티어 | 데미지 | 사거리 | 공속 |
|------|--------|--------|------|
| T1 | 10 | 80 | 1000ms |
| T2 | 30 | 100 | 800ms |
| T3 | 100 | 120 | 600ms |
| T4 | 350 | 150 | 400ms |

### 적 체력 계산 (enemy.js)
```
baseHealth = 30 * stageMultiplier * waveMultiplier * lateWaveBonus
보스: baseHealth * (8 + stage)
엘리트: baseHealth * 2.5
빠른 적: baseHealth * 0.6
```

### 경제
- 뽑기 비용: 20G
- 판매 환급: 50%
- 웨이브 보상: 스테이지/웨이브에 따라 증가
