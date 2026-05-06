// Neon Defense - 광고 관리 통합 인터페이스
// 사양: Plan/TICKET_AND_ADS_DESIGN.md §6
//
// 환경별 동작
//   - Capacitor + AdMob 플러그인 가용 시: 실제 광고 표시 (W16에서 admob-bridge.js 추가)
//   - 그 외 (웹 개발/테스트): stub 동작 (1초 시뮬 후 보상 콜백)
//
// 광고 타입
//   - Rewarded   : 보상형 (티켓 충전, 골드 2배, 부활 등)
//   - Interstitial: 전면 (게임 종료 후, 빈도 캡 적용)
//   - Banner     : 배너 (메인 메뉴 / 결과 화면)

const AdManager = {
  // ===== 환경 감지 =====
  isNative() {
    return typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  },

  isAdMobReady() {
    // W16에서 admob-bridge 로드 완료 시 true
    return this.isNative() && typeof window.AdMobBridge !== 'undefined' && window.AdMobBridge.isReady();
  },

  // ===== 보상형 광고 =====
  showRewarded({ onReward, onFail, onClose, source = 'unknown' } = {}) {
    if (this.isAdMobReady()) {
      window.AdMobBridge.showRewarded({ onReward, onFail, onClose, source });
      return;
    }
    // Stub: 1초 후 즉시 보상 (개발 편의)
    console.log(`[AdManager.stub] Rewarded 광고 시뮬레이션 (source=${source})`);
    setTimeout(() => {
      onReward && onReward();
      onClose && onClose();
    }, 1000);
  },

  // ===== 전면 광고 =====
  showInterstitial({ onClose, source = 'unknown' } = {}) {
    if (this.isAdMobReady()) {
      window.AdMobBridge.showInterstitial({ onClose, source });
      return;
    }
    console.log(`[AdManager.stub] Interstitial 시뮬레이션 (source=${source})`);
    setTimeout(() => onClose && onClose(), 800);
  },

  // ===== 배너 =====
  showBanner({ position = 'bottom' } = {}) {
    if (this.isAdMobReady()) {
      window.AdMobBridge.showBanner({ position });
      return;
    }
    console.log(`[AdManager.stub] Banner 노출 시뮬레이션 (position=${position})`);
  },

  hideBanner() {
    if (this.isAdMobReady()) {
      window.AdMobBridge.hideBanner();
      return;
    }
    console.log('[AdManager.stub] Banner 숨김');
  },
};

window.AdManager = AdManager;
