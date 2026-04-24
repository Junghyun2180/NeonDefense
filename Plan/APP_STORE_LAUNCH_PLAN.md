# NeonDefense 글로벌 출시 플랜 (2026.09.24)

## 기간 요약
- **시작**: 2026-04-24 (오늘)
- **목표 출시**: 2026-09-24
- **총 기간**: 5개월 / 22주
- **배포**: iOS App Store + Google Play (글로벌)
- **플랫폼**: Capacitor 래핑 (웹 자산 100% 재사용)

## 출시 전 평가 결론 (코드 감사 기반)
- **강점**: 네온 비주얼 아이덴티티, 정교한 수치 밸런스(`constants.js`), DDD 구조
- **치명적 약점**: 온보딩 없음 / 한국어 전용 / 속성 차별화 약함 / 1판 길이 과다 / 보스 패턴 없음
- **결론**: 현재 상태 출시 시 1분 이탈률 심각. 5개월 일정은 이 치명 약점을 전부 고치기에 적절

## 방향 (속도 + 깊이 + 수집 삼축)
| 축 | 의미 | 구현 |
|----|------|------|
| **속도** | 캐주얼 플레이어 획득 | Rush Mode (5~10분/판), 자동 조합, 10연뽑 |
| **깊이** | 코어 리텐션 확보 | 속성 고유 메커닉 + 속성 시너지, 보스 패턴 3종 |
| **수집** | 장기 플레이 훅 | T4 역할별 카드 도감, 카드 레벨링, 첫 획득 플레이버 |

---

## Phase A — 생존 기반 (W1~W7, 4/24 ~ 6/12)

### W1~W2 (4/24 ~ 5/08): i18n 인프라 + 번역
목표: 글로벌 출시 1순위 조건. 모든 하드코딩 텍스트를 리소스화.

- [ ] `js/infra/i18n.js` 생성 (t(key), setLocale(), 폴백 로직)
- [ ] `js/infra/locales/ko.js`, `en.js`, `ja.js` 구조 정의
- [ ] `constants.js`, `help-data.js`, 모든 `components/*.jsx` 내 한글 문자열 추출
- [ ] localStorage로 언어 선택 저장
- [ ] MainMenu에 언어 선택 UI
- [ ] 번역 초안 3개 언어 (영어/일본어는 기계 번역 + 게임 용어 사전 매핑, W14에 검수)

### W3 (5/08 ~ 5/15): 튜토리얼 스테이지 (Stage 0)
목표: 첫 3분 안에 "왜 재밌는지" 이해.

- [ ] `js/domain/config/tutorial-data.js` — 단계별 스크립트
- [ ] `js/components/TutorialOverlay.jsx` — 화살표, 말풍선, 하이라이트
- [ ] 단계: 배치 → 뽑기 → 조합 → 속성 개념 → 역할 선택
- [ ] 스킵/다시보기 가능 (최초 1회 강제)
- [ ] 완료 보상: 크리스탈 30개 + 첫 카드

### W4 (5/15 ~ 5/22): Rush Mode (속도 축)
목표: 세션 길이 10분 이내로 단축.

- [ ] `js/domain/config/rush-mode-constants.js` — 3스테이지×3웨이브
- [ ] `js/components/RushModeMenu.jsx` — 메인 메뉴 진입점
- [ ] 데일리 3판 제한 (리셋 00:00 로컬)
- [ ] 빠른 모드 전용 보상 테이블 (크리스탈 ↓, 카드 조각 ↑)
- [ ] 10연뽑 + 자동 조합 토글 기본 활성화

### W5~W6 (5/22 ~ 6/05): 속성 차별화 (깊이 축 Part 1)
목표: "왜 다른 속성을 써야 하는가" 답을 코드로 증명.

- [ ] **Fire**: 화상 중첩 3단계 → 3단계에서 폭발(주변 범위 피해)
- [ ] **Water(냉기)**: 슬로우 2초 → 동결(3중첩시 1초 완전 정지)
- [ ] **Electric**: 체인 라이트닝 + 적 마비(공속 20% 감소, 3초)
- [ ] **Wind**: 넉백 + 공중 상태(2초) → 공중 적은 관통 피해 1.5배
- [ ] **Void**: 방어 무시(30%) + 관통 + 최대 HP 비례 추가 피해(1%)
- [ ] **Light**: 처형(HP 15% 이하 즉사) + 주변 디버프 정화
- [ ] 각 변경 시 `balance-logger.js`로 DPS 변화 추적
- [ ] HelpModal 업데이트 (속성 고유 효과 시각화)

### W7 (6/05 ~ 6/12): 속성 시너지 + 타워 뽑기 UX 재설계
목표: 속성 조합이 플레이어 전략의 핵심이 되게.

- [ ] `js/domain/effect/synergy-system.js` — 상태이상 결합 판정
- [ ] 시너지: 동결+전격=감전(1.5배 피해) / 화상+공허=에너지 파열(범위) / 넉백+광휘=처형 임계치 ↑
- [ ] 뽑기 화면 리팩토링: 10연뽑 버튼, 결과 모아보기
- [ ] 자동 조합 스위치 (기본 ON)
- [ ] T4 역할 자동선택 프리셋 (DPS/CC/서포트)

---

## Phase B — 확장 (W8~W13, 6/12 ~ 7/24)

### W8~W10 (6/12 ~ 7/03): 카드 수집 시스템 (수집 축)
목표: 장기 리텐션을 위한 "모으는 재미".

- [ ] `js/domain/progression/collection-system.js` — 카드 DB
- [ ] 카드 정의: 6속성 × 4역할(T4 기준) = 24장 + 서포트 12장 = 36장
- [ ] 첫 획득 시 일러스트 카드 + 한줄 플레이버 텍스트 (SVG 기반 생성)
- [ ] 카드 레벨: 중복 시 조각 축적, 5조각당 1레벨 (최대 10)
- [ ] 카드 레벨 보너스: 해당 타워 소형 스탯 +1%/레벨
- [ ] `js/components/CollectionModal.jsx` — 도감 UI (ALL/속성별/미획득 필터)
- [ ] 카드 획득 소스: 스테이지 클리어, 업적, 데일리, 가챠(조각)

### W11 (7/03 ~ 7/10): 보스 패턴 + 사운드/비주얼 (깊이 축 Part 2)
목표: 엔드게임이 "HP 많은 적" 이상이 되게.

- [ ] 보스 패턴 3종 구현 (`enemy-ability.js` 확장)
  - 분열(Splitter Boss): 50% HP에서 3분신 생성
  - 회복(Regen Boss): 주기적 힐, 처형 시 폭발
  - 광폭(Berserk Boss): 체력 낮을수록 이동/공격 속도 증가
- [ ] BGM 5곡 추가 (메뉴/캠페인/러시/보스/클리어) — royalty-free 라이선스 구매
- [ ] 효과음 30+ 풀세트 (현재 Web Audio API 합성 → 실제 에셋)
- [ ] 스테이지별 배경 타일 5종 (네온 시티/사이버 숲/데이터 바다/보이드/광자 차원)

### W12 (7/10 ~ 7/17): Capacitor 네이티브 래핑
목표: iOS/Android 앱 빌드 가능 상태.

- [ ] `npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`
- [ ] `capacitor.config.ts` 작성
- [ ] CDN 의존성 제거: React/ReactDOM/Tailwind 로컬 번들링 (build.js 확장)
- [ ] Tailwind JIT → 정적 CSS 빌드
- [ ] Babel 런타임 → 빌드 타임 변환 (이미 build.js가 함, 검증 필요)
- [ ] `npx cap add ios`, `npx cap add android`
- [ ] Xcode/Android Studio 빌드 검증
- [ ] BGM/SFX autoplay 정책 대응 (iOS WebView)

### W13 (7/17 ~ 7/24): 모바일 최적화
목표: 60fps 안정, 터치 정밀도.

- [ ] 세이프에어리어 (노치, 홈 인디케이터) CSS 변수 적용
- [ ] 터치 타겟 최소 44pt 보장
- [ ] 캔버스 렌더링 프로파일링 (requestAnimationFrame 안정성)
- [ ] 저사양 기기 테스트 (iPhone SE 2세대, Galaxy A 시리즈)
- [ ] 배터리 소모 체크 (30분 플레이 기준)
- [ ] 가로 모드 고정 여부 결정 → 세로 고정 권장 (편의성)

---

## Phase C — 라이브 준비 (W14~W20, 7/24 ~ 9/11)

### W14~W15 (7/24 ~ 8/07): 번역 검수 + 밸런스 최종 패스
- [ ] en/ja 현지 네이티브 검수 (크라우드소싱 or fiverr)
- [ ] 캠페인 10스테이지 완주 테스트 × 3회 (시간/이탈 포인트 측정)
- [ ] Rush Mode 밸런스 (승률 55~65% 목표)
- [ ] 속성 DPS 표준편차 15% 이내 조정

### W16 (8/07 ~ 8/14): 수익화 + 분석
- [ ] AdMob SDK (Capacitor 플러그인) — 전면/보상형
- [ ] IAP: 광고 제거($2.99), 크리스탈 번들 3종 (선택적 IAP, 페이투윈 아님)
- [ ] Firebase Analytics — 핵심 이벤트 20종 (tutorial_complete, stage_clear, gacha_pull, ad_watched 등)
- [ ] Firebase Crashlytics
- [ ] Remote Config (긴급 밸런스 패치용)

### W17 (8/14 ~ 8/21): 베타 (CBT)
- [ ] TestFlight 업로드, 테스터 30명 모집 (Twitter/Reddit r/TowerDefense)
- [ ] Google Play Internal Testing 업로드
- [ ] 피드백 채널: Discord 또는 Google Form
- [ ] 버그 트래커: GitHub Issues 라벨 `beta`

### W18 (8/21 ~ 8/28): 베타 피드백 반영 + 최종 밸런스
- [ ] Critical 버그 100% 수정
- [ ] UX 개선 제안 중 탑 10 반영
- [ ] D1 리텐션 데이터 확인 (40%+ 목표)

### W19 (8/28 ~ 9/04): 스토어 자료
- [ ] 앱 아이콘: 1024×1024 + Android 적응형(foreground/background)
- [ ] 스크린샷 × 5 × 3언어 × (iOS 6.7"/6.5", Android)
- [ ] 프로모 영상 30초 (세로, Playable style)
- [ ] 스토어 메타데이터
  - 제목: NeonDefense: Roguelike TD (후보)
  - 부제: Strategic Tower Defense
  - 설명 4000자 3언어
  - 키워드: tower defense, roguelike, neon, gacha, strategy
- [ ] App Store/Google Play 리스팅 프리뷰 확정

### W20 (9/04 ~ 9/11): 법적 준비 + 연령등급
- [ ] 개인정보처리방침 (ko/en/ja) — 정적 URL 호스팅 (GitHub Pages 서브경로)
- [ ] 이용약관
- [ ] GDPR/CCPA 동의 플로우 (첫 실행 시)
- [ ] 연령등급: ESRB E, PEGI 7, GRAC 전체이용가 (IAP 있음 고지)
- [ ] Apple 제출 자료: 데이터 수집 항목, 추적 동의(ATT) 문구
- [ ] Google Data Safety 양식

---

## Phase D — 제출 & 출시 (W21~W22, 9/11 ~ 9/24)

### W21 (9/11 ~ 9/18): 심사 제출
- [ ] 최종 빌드 서명 + 업로드
- [ ] Apple App Review 제출 (평균 1~3일, 리젝 시 수정 여유)
- [ ] Google Play Production 제출 (평균 2~7일)
- [ ] 리젝 사유 대비 대응 문서 미리 준비 (IAP 연동, 광고 정책, 데이터 안전성)

### W22 (9/18 ~ 9/24): 런칭
- [ ] 9/22 전후: 마지막 리젝 대응
- [ ] 9/24 00:00: 전 지역 릴리스
- [ ] 마케팅:
  - Reddit r/TowerDefense, r/incremental_games
  - Twitter 개발일지 스레드
  - Product Hunt 게시
- [ ] 런칭 후 24시간 모니터링 (크래시, 1★ 리뷰)

---

## KPI (출시 30일 목표)
| 지표 | 목표 |
|------|------|
| D1 리텐션 | 40% |
| D7 리텐션 | 15% |
| 튜토리얼 완료율 | 85% |
| 크래시 프리 세션 | 99.5% |
| 평균 세션 길이 | 8분 |
| 평균 세션/DAU | 2.5 |
| 스토어 평점 | 4.3+ |

## 리스크 & 완화책
| 리스크 | 완화 |
|--------|------|
| iOS WebView 오디오 자동재생 차단 | 사용자 첫 탭에서 AudioContext.resume(), W12에서 검증 |
| CDN 제거 시 번들 크기 > 5MB | Tailwind JIT, React production build, 코드스플릿팅 |
| 번역 품질 | W14 네이티브 검수 + 베타 피드백 |
| Apple 리젝 (가챠 관련) | 확률 공개 + 광고 제거 IAP 명시 |
| 24시간 Chores (출시 당일 이슈) | W21에 롤백 빌드 준비, Remote Config 대기 |

## 다음 액션 (W1 시작)
1. i18n 디렉토리 구조 생성
2. 한글 문자열 인벤토리 (현재 몇 개 있는지 측정)
3. `i18n.js` t() 헬퍼 구현
4. 가장 자주 보이는 메인메뉴/헤더부터 순차 치환

---
*업데이트: 2026-04-24 생성*
