// Neon Defense - 서포트 타워 스프라이트 로더
// assets/supports/<type>/t<tier>.png
// supportType (0~3): damage, speed, defense, range
const SupportSprite = {
  TYPE_KEYS: ['damage', 'speed', 'defense', 'range'],
  _available: new Set(),
  _preloadPromise: null,

  preload() {
    if (this._preloadPromise) return this._preloadPromise;
    const checks = [];
    this.TYPE_KEYS.forEach(type => {
      for (let t = 1; t <= 3; t++) {
        const key = `${type}-${t}`;
        checks.push(new Promise(resolve => {
          const img = new Image();
          img.onload = () => { this._available.add(key); resolve(true); };
          img.onerror = () => resolve(false);
          img.src = `assets/supports/${type}/t${t}.png`;
        }));
      }
    });
    this._preloadPromise = Promise.all(checks);
    return this._preloadPromise;
  },

  getUrl(supportType, tier) {
    const key = `${this.TYPE_KEYS[supportType]}-${tier}`;
    if (!this._available.has(key)) return null;
    return `assets/supports/${this.TYPE_KEYS[supportType]}/t${tier}.png`;
  },

  has(supportType, tier) {
    return this._available.has(`${this.TYPE_KEYS[supportType]}-${tier}`);
  },
};

if (typeof window !== 'undefined') {
  window.SupportSprite = SupportSprite;
  SupportSprite.preload().then(() => {
    if (SupportSprite._available.size > 0) {
      console.log(`[SupportSprite] ${SupportSprite._available.size}/12 로드됨`);
      window.dispatchEvent(new CustomEvent('support-sprites-ready'));
    }
  });
}
