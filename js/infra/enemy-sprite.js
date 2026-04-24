// Neon Defense - 적 몬스터 스프라이트 로더
// assets/enemies/<type>.png 존재 시 이미지 기반 렌더
// 없으면 기존 원형/이모지 폴백
const EnemySprite = {
  TYPES: ['normal', 'fast', 'elite', 'boss', 'jammer', 'suppressor', 'healer', 'splitter'],
  _available: new Set(),
  _preloadPromise: null,

  preload() {
    if (this._preloadPromise) return this._preloadPromise;
    const checks = this.TYPES.map(type => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this._available.add(type); resolve(true); };
      img.onerror = () => resolve(false);
      img.src = `assets/enemies/${type}.png`;
    }));
    this._preloadPromise = Promise.all(checks);
    return this._preloadPromise;
  },

  getUrl(type) {
    if (!this._available.has(type)) return null;
    return `assets/enemies/${type}.png`;
  },

  has(type) {
    return this._available.has(type);
  },
};

if (typeof window !== 'undefined') {
  window.EnemySprite = EnemySprite;
  EnemySprite.preload().then(() => {
    if (EnemySprite._available.size > 0) {
      console.log(`[EnemySprite] ${EnemySprite._available.size}/8 로드됨`);
      window.dispatchEvent(new CustomEvent('enemy-sprites-ready'));
    }
  });
}
