# 플레이 티켓 & 광고 시스템 설계 (W3 신규 + W14/W16 연계)

**작성일**: 2026-05-05
**대상**: Android 출시 (`Plan/APP_STORE_LAUNCH_PLAN.md`)
**상태**: 사양 확정. 구현 진행 중.

---

## 0. 용어 (혼동 방지)

| 용어 | 의미 | 시스템 |
|------|------|--------|
| **플레이 티켓 (Play Ticket)** | 게임 한 판 입장권. 본 문서의 신규 시스템 | `PlayTicketSystem` (신규) |
| **무료 뽑기권 (Free Draw Ticket)** | 기존 가챠 1회권 (DailyLogin 보상) | `CollectionSystem.addFreeDrawTicket` (기존) |
| **크리스탈** | 메타 화폐 (메타 진행 / IAP 1차) | 기존 `runModeState.neonCrystals` |
| **골드** | 인게임 화폐 (가챠/조합/판매) | 기존 |

> 코드/UI에서 "티켓" 단독으로 표기되면 **플레이 티켓**을 의미한다. 가챠 1회권은 항상 "뽑기권"으로 명시.

---

## 1. 사양 확정값 (유저 결정)

| 항목 | 값 |
|------|-----|
| **Q4 자연 충전 속도** | **10분당 1장** |
| **Q5 적용 모드** | **전 모드** (캠페인 / Rush / 런모드 / 데일리챌린지) |
| **Q6 광고 충전 일일 한도** | **제한 없음** |
| **Q7 IAP 패키지** | **50티켓 패키지** (가격 미정 — W16 결정) |
| **Q8 5캡 도달 후** | **자연 충전 멈춤** (캡 초과는 광고/IAP 만 가능) |

### 파생 상수
| 상수 | 값 | 비고 |
|------|----|----|
| `MAX_TICKETS_BASE` | 5 | 자연 충전 캡 |
| `CHARGE_INTERVAL_MS` | 600_000 (10분) | |
| `AD_REFILL_AMOUNT` | 2 | 광고 1회당 |
| `GAME_COST` | 1 | 게임 1판당 차감 |
| `DAILY_FLOOR` | 5 | 매일 00:00 로컬 ≥5 보장 |
| `IAP_PACKAGE_AMOUNT` | 50 | 50티켓 패키지 |

---

## 2. 데이터 모델

```javascript
// localStorage key: 'neonDefense_playTickets_v1'
{
  current: 5,                    // 현재 보유 (광고/IAP로 5 초과 가능)
  lastChargeAt: 1714896000000,   // 마지막 자연 충전 timestamp (ms)
  lastDailyResetDate: '2026-05-05',  // YYYY-MM-DD (로컬)
  totalGamesPlayed: 0,           // 누적 (단조증가, 어뷰징 검증용)
  totalAdRefills: 0,             // 누적 (단조증가)
  totalIAPPurchases: 0,          // 누적 (단조증가)
  abuseFlag: false,              // 시계 변경 감지 시 true
  schemaVersion: 1,
}
```

### 단조 증가 카운터 의도
백엔드가 없는 상태이므로 **클라이언트 신뢰**가 기본이지만, 추후 텔레메트리(W16)로 서버 보냈을 때 `totalGamesPlayed - totalIAPPurchases - totalAdRefills * 2` 같은 검증식으로 비정상 패턴(예: 같은 디바이스가 IAP 0 + 광고 0 + 게임 1만판) 감지 가능.

---

## 3. 충전 로직

```
충전 함수 (틱마다 호출 가능, 멱등):
  now = Date.now()

  # 1) 일일 리셋 (로컬 자정 경계)
  today = formatDateLocal(now)  # YYYY-MM-DD
  if state.lastDailyResetDate != today:
    if state.current < DAILY_FLOOR:
      state.current = DAILY_FLOOR
    state.lastDailyResetDate = today
    state.lastChargeAt = now

  # 2) 시계 어뷰징 감지
  if state.lastChargeAt > now:
    state.abuseFlag = true
    state.lastChargeAt = now   # 정상 시각 기준 재시작
    return

  # 3) 자연 충전 (캡 5)
  if state.current < MAX_TICKETS_BASE:
    elapsed = now - state.lastChargeAt
    chargeCount = floor(elapsed / CHARGE_INTERVAL_MS)
    if chargeCount > 0:
      gained = min(chargeCount, MAX_TICKETS_BASE - state.current)
      state.current += gained
      state.lastChargeAt += gained * CHARGE_INTERVAL_MS
  else:
    # 캡 도달 → 자연 충전 멈춤
    state.lastChargeAt = now
```

### 핵심 동작
- **5캡 도달**: `lastChargeAt` 을 현재 시각으로 밀어 다음 충전 대기 안 시작 (Q8)
- **5캡에서 게임 1판** = 4가 됨 → 즉시 다음 1장 충전 카운트 시작
- **광고로 7장**: 5 → 7 (캡 초과). 5캡 채워질 때까지(2장 소비될 때까지) 자연 충전 멈춤. 5 이하로 떨어지면 다시 자연 충전 시작.

---

## 4. API (PlayTicketSystem)

```javascript
window.PlayTicketSystem = {
  STORAGE_KEY: 'neonDefense_playTickets_v1',
  MAX_BASE: 5,
  CHARGE_INTERVAL_MS: 600_000,
  AD_REFILL_AMOUNT: 2,
  GAME_COST: 1,
  DAILY_FLOOR: 5,
  IAP_PACKAGE_AMOUNT: 50,

  // 조회
  getStatus(): {
    current: number,
    max: number,                  // 표시용 (5)
    canPlay: boolean,             // current >= GAME_COST
    msUntilNextCharge: number,    // 다음 1장까지 ms (current >= 5면 0)
    abuseFlag: boolean,
  },

  // 게임 시작 시 (App.jsx 게이트)
  consume(): boolean,             // 성공 true / 실패 false

  // 광고 시청 완료 콜백
  refillByAd(): { gained: number, current: number },

  // IAP 구매 콜백
  refillByPurchase(amount): { gained: number, current: number },

  // 매 틱 자동 호출 (10초 주기 권장)
  tick(): void,                   // 충전 + 일일리셋 멱등 처리

  // 디버그/치트
  setCurrent(n): void,
  reset(): void,
};
```

### 호출 지점
- **`tick()`**: `useGameLoop` 또는 **별도 setInterval(10_000)** — 매 틱이 아닌 10초마다.
- **`consume()`**: 모든 모드 시작 시 (`App.jsx` 모드 진입 핸들러)
- **`refillByAd()`**: 광고 시청 완료 콜백 (W16 AdMob 연동까지는 stub)
- **`refillByPurchase(50)`**: 50티켓 IAP 결제 성공 콜백 (W16)

---

## 5. UI 통합

### 5.1. 헤더 위젯 (모든 화면 공통)
```
[가득]   🎟️ 5/5
[충전중] 🎟️ 3/5  ⏱ 06:42
[초과]   🎟️ 7/5+ (광고/IAP로 캡 초과)
[부족]   🎟️ 0/5  [광고 보고 +2]
```

- 컴포넌트 위치: `js/components/PlayTicketBadge.jsx`
- 헤더(`GameHeader.jsx` + 메인메뉴)에 동일 위젯
- 카운트다운: 1초 주기 setState (또는 RAF)

### 5.2. 게임 시작 게이트
- **MainMenu / RunModeMenu / Rush / Daily 시작 버튼** 클릭 시:
  - `PlayTicketSystem.consume()` 호출
  - `false` 면 모달 띄움 → "티켓이 부족합니다. 광고 보고 +2 받기 / 50티켓 패키지 구매"
- 모달: `js/components/TicketEmptyModal.jsx`

### 5.3. 광고 충전 CTA
- 헤더 위젯 또는 모달에서 광고 버튼 → `AdManager.showRewarded({ onReward })`
- 보상 콜백: `PlayTicketSystem.refillByAd()`
- 광고 시청 실패 시 보상 미지급

---

## 6. 광고 시스템 (PlayTicket 외 광고 노출 포인트 종합)

### 6.1. 노출 포인트 (Phase 적용 시기 별도)
| 위치 | 종류 | 빈도 캡 | 보상 | 우선순위 |
|------|------|---------|------|--------|
| **티켓 충전 버튼** | Rewarded | 무제한 | +2 티켓 | **MVP** |
| 게임 종료 후 | Interstitial | 3판마다 + 5분 쿨다운 | - | W16 |
| 골드 2배 (게임 종료 보너스) | Rewarded | 일 5회 | 골드 +100% | W16 |
| 부활 1회 (게임 오버 시) | Rewarded | 게임당 1회 | 라이프 +3 | W16 |
| 무료 뽑기 추가 1회 | Rewarded | 일 3회 | 가챠 1회 | W16 |
| 일일 출석 보너스 2배 | Rewarded | 일 1회 | 보상 ×2 | W16 |
| 메인 메뉴 / 결과 화면 | Banner | 상시 (인게임 OFF) | - | W16 |

### 6.2. 광고 시스템 모듈 구조 (W16에서 본격 구현)
```
js/infra/ads/
├── ad-manager.js        # 통합 인터페이스 (showRewarded/showInterstitial/showBanner)
├── admob-bridge.js      # @capacitor-community/admob 래퍼
├── ad-config.js         # 광고 유닛 ID + 빈도 캡 상수
└── ad-stub.js           # 개발/웹 환경용 stub (Capacitor 미가용 시)
```

### 6.3. MVP에서 만들 stub (지금)
```javascript
window.AdManager = {
  showRewarded({ onReward, onFail }) {
    // 개발 중: 1초 후 즉시 보상
    if (window.Capacitor && window.AdMob) {
      // 실제 AdMob (W16에서 구현)
    } else {
      console.log('[AdStub] 광고 시뮬레이션 (1초)');
      setTimeout(() => onReward && onReward(), 1000);
    }
  },
  showInterstitial(opts) { /* W16 */ },
  showBanner(opts) { /* W16 */ },
};
```

이렇게 하면 **PlayTicketSystem 은 광고 SDK 유무와 무관**하게 동작 — 시스템 분리 원칙 준수.

---

## 7. 통합 체크리스트 (이번 작업 범위)

### Phase 1 (지금 - 1~2일)
- [x] 사양 확정 + 본 문서 작성
- [ ] `js/domain/progression/play-ticket-system.js` 생성
- [ ] `js/infra/ads/ad-stub.js` 생성 (광고 stub만)
- [ ] `js/components/PlayTicketBadge.jsx` 헤더 위젯
- [ ] `js/components/TicketEmptyModal.jsx` 부족 시 모달
- [ ] `App.jsx` 모든 모드 시작 게이트에 `consume()` 삽입
- [ ] `index.html` 스크립트 로드 추가
- [ ] 치트 콘솔: `tickets [n]` 명령 (개발 편의)
- [ ] tick 루프: 10초 주기 setInterval (App.jsx 마운트 시)

### Phase 2 (W14 Capacitor 작업 시)
- [ ] `@capacitor-community/admob` 플러그인 설치
- [ ] `AndroidManifest.xml` AdMob App ID
- [ ] UMP (사용자 동의) SDK 통합

### Phase 3 (W16 수익화)
- [ ] `js/infra/ads/admob-bridge.js` 실제 구현
- [ ] 6.1 표의 모든 광고 노출 포인트 활성화
- [ ] Google Play Billing 연동 (50티켓 IAP)
- [ ] Firebase Analytics 이벤트 (ticket_consume, ad_shown, ad_rewarded, iap_purchase)

### Phase 4 (W17 베타)
- [ ] 광고 빈도 / 충전 속도 / 보상량 베타 피드백 반영
- [ ] 광고 노출 → 매출 / 잔존율 KPI 측정

---

## 8. 리스크 & 완화책

| 리스크 | 완화 |
|--------|------|
| 시계 변경 어뷰징 | `abuseFlag` + 단조증가 카운터, 광고/IAP 외 캡 초과 차단 |
| 광고 SDK 로딩 실패 → 보상 못 받음 | stub 폴백 + "다시 시도" 버튼 |
| 캡 초과 상태에서 자연 충전 재개 시점 모호 | 5 이하로 떨어지면 `lastChargeAt = now` 부터 시작 (간단·일관) |
| 다중 디바이스 동기화 | **Out of scope** (출시 후 클라우드 저장 도입 시) |
| 광고 무제한 + 10분 충전 = 사실상 무한 플레이 | 의도된 사양 (Q4·Q6 결정). 광고 노출이 곧 매출이므로 OK |
| 50티켓 패키지가 광고 시청 ROI 보다 비효율이면 매출 손실 | 가격을 광고 시청 25분 시간가치(≈ 50회 = 광고 25회 가치)에 맞춰 책정 |

---

## 9. KPI (W16 Firebase 연동 후 측정)

| 지표 | 설명 | 목표 (베타 후 결정) |
|------|------|-------|
| `tickets_consumed_per_dau` | DAU당 티켓 소비량 | 측정 후 결정 |
| `ad_rewarded_per_dau` | DAU당 광고 시청 횟수 | 측정 후 결정 |
| `ticket_empty_modal_shown_rate` | 티켓 부족 모달 노출률 | 너무 낮으면 충전 속도 ↑ 검토 |
| `iap_50pack_conversion` | 50티켓 패키지 구매 전환율 | 측정 후 결정 |

---

## 10. 다음 단계

1. ✅ 본 문서 확정
2. → `js/domain/progression/play-ticket-system.js` 구현
3. → UI 위젯 + 모달 구현
4. → App.jsx 게이트 삽입
5. → `Plan/APP_STORE_LAUNCH_PLAN.md` W3·W14·W16 패치 (티켓 일정 반영)
6. → 빌드 + Android sync 검증
