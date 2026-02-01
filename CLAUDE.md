# Neon Defense - Claude Code 프로젝트 가이드

## 프로젝트 개요
네온 테마 랜덤 타워 디펜스 게임. 가챠 시스템 + 로그라이크 요소 결합 전략 게임.

- **경로**: `F:\VibeCodingProject\NeonDefense\`
- **실행**: `npx serve .` → `http://localhost:3000` (file:// 불가, 로컬 서버 필수)
- **배포**: GitHub Pages (`https://junghyun2180.github.io/NeonDefense/`) — main push 시 자동 배포
- **언어**: 순수 JavaScript + JSX (Babel Standalone 런타임 변환)

## 기술 스택
- **React 18** (CDN, 빌드 없음)
- **Babel Standalone 7.23.5** (브라우저 내 JSX 변환)
- **Tailwind CSS** (CDN)
- **Web Audio API** (SFX 프로시저럴 생성) + **HTML Audio** (BGM mp3 파일)
- **Node.js** (로컬 서버용, `npx serve .`)
- **버전 관리**: Git + GitHub Pages 자동 배포

빌드 도구, 패키지 매니저, TypeScript 없음. 모든 의존성은 CDN으로 로드.

## 파일 구조

```
NeonDefense/
├── index.html          # 모듈식 진입점 (~28줄, CDN + 스크립트 로드)
├── dev.html            # 개발용 localhost:3000 리다이렉트
├── index-backup.html   # 리팩토링 전 단일 파일 번들 백업
├── README.md
├── CLAUDE.md           # 이 파일
├── audio/
│   └── bgm.mp3         # BGM 음악 파일 (루프 재생)
├── css/
│   └── styles.css      # 애니메이션, UI 스타일 (~170줄)
├── js/
│   ├── App.jsx         # 메인 React 컴포넌트, 순수 UI + 상태 관리 (~715줄)
│   ├── constants.js    # 게임 상수 및 설정 테이블 (~185줄)
│   ├── enemy.js        # EnemySystem: 적 생성, 이동, 상태이상 (~175줄)
│   ├── game-engine.js  # GameEngine: 게임 틱 오케스트레이터 (~290줄)
│   ├── sound.js        # SoundManager: BGM(mp3)/SFX(Web Audio) (~340줄)
│   ├── tower.js        # TowerSystem: 타워 생성, 배치, 조합, 공격 (~166줄)
│   └── utils.js        # 경로 생성, 거리 계산, 유틸리티 (~136줄)
└── .claude/
    └── SKILL/
        ├── BalanceDesigner/SKILL.md  # 게임 밸런싱 스킬
        └── BugFixer/SKILL.md         # 버그 수정 스킬
```

## 핵심 아키텍처

### 설계 원칙
**SOLID + DRY** 원칙 준수:
- **단일 책임**: 각 모듈이 하나의 관심사만 담당 (적/타워/엔진/UI)
- **개방-폐쇄**: ENEMY_CONFIG 테이블로 적 타입 확장 가능 (코드 수정 없이)
- **데이터 주도**: 매직 넘버 제거, 모든 설정은 constants.js에 집중
- **DRY**: TowerSystem.create()가 타워 생성의 단일 진실의 원천

### 네임스페이스 패턴
CDN 기반이므로 import/export 없이 **글로벌 네임스페이스 객체** 사용:
- `EnemySystem` — 적 생성, 이동, 상태이상, 타입 판별
- `TowerSystem` — 타워 생성, 배치, 조합, 디버프 계산, 공격
- `GameEngine` — 게임 틱 오케스트레이터, 투사체/충돌/효과 처리

### 상태 관리
`App.jsx`에서 React `useState`로 모든 게임 상태를 관리:
- `gold`, `lives`, `stage`, `wave` — 게임 진행
- `towers[]`, `enemies[]`, `projectiles[]` — 게임 오브젝트
- `inventory[]`, `selectedInventory[]`, `selectedTowers[]` — UI 상태
- `gameSpeed` (1x/2x/3x), `pathData` (다중 경로)

### 게임 루프
`useEffect` + `setInterval` 기반. `GameEngine.gameTick(state, now)`이 순수 함수로 상태 전환을 처리하고, App.jsx는 반환된 결과를 React 상태에 반영.

### 적 타입 시스템
문자열 기반 타입 (`enemy.type`): `'normal'`, `'fast'`, `'elite'`, `'boss'`, `'jammer'`, `'suppressor'`
- `ENEMY_CONFIG[type]`으로 설정 조회 (데이터 주도 렌더링/밸런스)
- `SPAWN_RULES` 우선순위 테이블로 스폰 타입 결정

### 주요 시스템
- **속성 시스템** (6종): 화염(DoT), 냉기(슬로우), 전격(체인), 질풍(넉백), 공허, 광휘
- **티어 시스템** (T1~T4): 3개 조합으로 상위 티어 승급
- **다중 경로**: 스테이지별 복잡도 증가 (1경로 → 최대 3출발/3도착)
- **적 타입** (6종): 일반, 빠름, 엘리트, 보스, 방해자(공속감소), 억제자(공격력감소)
- **드래그앤드롭 + 모바일 배치**: PC는 드래그, 모바일은 탭 → 선택 방식
- **인벤토리**: 6열 × 5행 = 30칸 고정 (`ECONOMY.maxInventory`), 가득 차면 뽑기 불가
- **치트 콘솔**: 백틱(`) 키로 토글, 커맨드 입력 방식 (nextstage, gold, tower 등)

### 설정 테이블 (constants.js)
| 상수 | 용도 |
|------|------|
| `ENEMY_CONFIG` | 적 타입별 체력/속도/보상/시각 설정 |
| `SPAWN_RULES` | 우선순위 기반 스폰 규칙 |
| `HEALTH_SCALING` | 체력 스케일링 공식 |
| `ECONOMY` | 골드/뽑기/판매/보상 설정 |
| `COMBAT` | 투사체/충돌/이펙트 설정 |
| `SPAWN` | 웨이브당 적 수/스폰 딜레이 |
| `ELEMENT_UI` | 모바일 배치 UI 속성 데이터 |

## 코드 수정 규칙

### 필수 지침
- 세션 메시지 한도 도달 시, 이전 메시지 삭제하지 말고 세션 변경 요청
- 작업 완료 후 Git 커밋 (사용자 요청 시)
- `index.html`은 모듈 로더 역할만 함 — 코드 수정은 `js/` 폴더의 모듈 파일에서 진행

### 코드 스타일
- 한국어 주석 사용
- React 함수형 컴포넌트 + Hooks 패턴
- 게임 상수는 `constants.js`에 집중
- 게임 로직은 관심사별로 분리된 JS 파일에 작성
- 타워 생성은 반드시 `TowerSystem.create()` 사용 (단일 진실의 원천)
- 적 생성은 반드시 `EnemySystem.create()` 사용
- 게임 틱 처리는 `GameEngine.gameTick()` 경유

### 주의사항
- CDN 기반이므로 import/export 구문 사용 불가 (글로벌 스코프)
- `index.html`은 진입점만 담당, 모든 로직은 `js/` 폴더에 위치
- `index-backup.html`은 리팩토링 전 백업 — 참조용으로만 사용
- Web Audio API는 사용자 인터랙션 후에만 초기화 가능
- 씨드 기반 경로 생성 — 경로 로직 변경 시 기존 씨드 호환성 고려
- 적 타입은 문자열(`enemy.type`) 기반 — boolean 플래그 사용 금지

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

### 타워 (constants.js → NEON_TYPES)
| 티어 | 데미지 | 사거리 | 공속 |
|------|--------|--------|------|
| T1 | 10 | 80 | 1000ms |
| T2 | 30 | 100 | 800ms |
| T3 | 100 | 120 | 600ms |
| T4 | 350 | 150 | 400ms |

### 적 체력 계산 (constants.js → HEALTH_SCALING + ENEMY_CONFIG)
```
baseHealth = HEALTH_SCALING.base * stageMult * waveMult * lateBonus
보스: baseHealth * HEALTH_SCALING.bossFormula(stage)
엘리트: baseHealth * ENEMY_CONFIG.elite.healthMult (2.5)
빠른 적: baseHealth * ENEMY_CONFIG.fast.healthMult (0.6)
```

### 경제 (constants.js → ECONOMY)
- 뽑기 비용: ECONOMY.drawCost (20G)
- 인벤토리 상한: ECONOMY.maxInventory (30)
- 판매 환급: ECONOMY.sellRefundRate (50%)
- 웨이브 보상: ECONOMY.waveReward(wave)
- 스테이지 클리어 보너스: ECONOMY.stageClearBonus(stage)

## 개발 환경

### 로컬 실행
```bash
npx serve .
# → http://localhost:3000 에서 확인
# 또는 dev.html 더블클릭 (서버가 켜져있어야 함)
```

### 배포
- GitHub Pages: main 브랜치 push 시 자동 배포
- URL: `https://junghyun2180.github.io/NeonDefense/`

### 치트 콘솔 (테스트용)
게임 화면에서 `` ` `` 키로 콘솔 열기:
| 명령어 | 효과 |
|--------|------|
| `nextstage` / `ns` | 다음 스테이지 |
| `stage [n]` | n 스테이지로 이동 |
| `clearwave` / `cw` | 웨이브 즉시 클리어 |
| `gold [n]` | 골드 추가 (기본 500) |
| `lives [n]` | 목숨 추가 (기본 10) |
| `tower [tier]` | 타워 획득 (기본 T4) |
