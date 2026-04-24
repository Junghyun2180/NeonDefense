// Neon Defense - 타워 스프라이트 로더
// assets/towers/<element>/t<tier>.png 존재 시 이미지 기반 렌더
// 없으면 기존 그라데이션 원 폴백
//
// 경로 규칙:
//   fire: assets/towers/fire/t1.png ~ t4.png
//   water: assets/towers/water/t1.png ~ t4.png
//   ...

const TowerSprite = {
  ELEMENT_KEYS: ['fire', 'water', 'electric', 'wind', 'void', 'light'],

  // 스프라이트 존재 여부 캐시 (프리로드 결과)
  _available: new Set(),
  _preloadPromise: null,

  // 게임 시작 시 1회 호출 — 존재하는 에셋만 set에 등록
  preload() {
    if (this._preloadPromise) return this._preloadPromise;
    const checks = [];
    this.ELEMENT_KEYS.forEach(elem => {
      for (let t = 1; t <= 4; t++) {
        const key = `${elem}-${t}`;
        const url = `assets/towers/${elem}/t${t}.png`;
        checks.push(new Promise(resolve => {
          const img = new Image();
          img.onload = () => { this._available.add(key); resolve(true); };
          img.onerror = () => resolve(false);
          img.src = url;
        }));
      }
    });
    this._preloadPromise = Promise.all(checks);
    return this._preloadPromise;
  },

  // element(0~5), tier(1~4) → 스프라이트 URL 반환 (없으면 null)
  getUrl(element, tier) {
    const key = `${this.ELEMENT_KEYS[element]}-${tier}`;
    if (!this._available.has(key)) return null;
    return `assets/towers/${this.ELEMENT_KEYS[element]}/t${tier}.png`;
  },

  has(element, tier) {
    return this._available.has(`${this.ELEMENT_KEYS[element]}-${tier}`);
  },

  // 치트/디버그: 강제로 가용 목록 세팅
  _setAvailable(keys) {
    this._available = new Set(keys);
  },
};

// 자동 프리로드 (비동기, 완료 여부 비동기 확인 가능)
if (typeof window !== 'undefined') {
  window.TowerSprite = TowerSprite;
  TowerSprite.preload().then(() => {
    if (TowerSprite._available.size > 0) {
      console.log(`[TowerSprite] ${TowerSprite._available.size}개 스프라이트 로드됨:`, [...TowerSprite._available]);
      // 다른 컴포넌트가 리렌더 할 수 있도록 이벤트
      window.dispatchEvent(new CustomEvent('tower-sprites-ready'));
    }
  });
}
