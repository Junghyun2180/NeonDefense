// Neon Defense - 이펙트 스프라이트 로더 (스킨 호환 옵션)
// assets/effects/<type>.png 가 존재하면 PNG 기반 렌더, 없으면 CSS 애니메이션 폴백.
//
// 지원 type:
//   기본: explosion, hit, burn, slow, knockback, heal, split, pierce, execute
//   T4:   t4-fire-spread, t4-fire-stack, t4-fire-fast,
//         t4-ice-freeze, t4-ice-aoe, t4-ice-knockback,
//         t4-elec-chain, t4-elec-first, t4-elec-stun,
//         t4-wind-aoe, t4-wind-pull, t4-wind-gust,
//         t4-void-synergy, t4-void-pierce, t4-void-balance,
//         t4-light-crit, t4-light-hit, t4-light-knockback, t4-light-fast
//
// 파일 규칙: 점은 dash 사용 (t4-fire-spread.png), 가능한 경우 투명 배경 권장.
// PNG 추가만 하면 자동 인식 — 코드 수정 불필요.

const EffectSprite = {
  TYPES: [
    'explosion', 'hit', 'burn', 'slow', 'knockback', 'heal', 'split', 'pierce', 'execute',
    't4-fire-spread', 't4-fire-stack', 't4-fire-fast',
    't4-ice-freeze', 't4-ice-aoe', 't4-ice-knockback',
    't4-elec-chain', 't4-elec-first', 't4-elec-stun',
    't4-wind-aoe', 't4-wind-pull', 't4-wind-gust',
    't4-void-synergy', 't4-void-pierce', 't4-void-balance',
    't4-light-crit', 't4-light-hit', 't4-light-knockback', 't4-light-fast',
  ],

  _available: new Set(),
  _preloadPromise: null,

  preload() {
    if (this._preloadPromise) return this._preloadPromise;
    const checks = this.TYPES.map(type => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this._available.add(type); resolve(true); };
      img.onerror = () => resolve(false);
      img.src = `assets/effects/${type}.png`;
    }));
    this._preloadPromise = Promise.all(checks);
    return this._preloadPromise;
  },

  // type → URL (없으면 null)
  getUrl(type) {
    return this._available.has(type) ? `assets/effects/${type}.png` : null;
  },

  has(type) {
    return this._available.has(type);
  },
};

if (typeof window !== 'undefined') {
  window.EffectSprite = EffectSprite;
  EffectSprite.preload().then(() => {
    if (EffectSprite._available.size > 0) {
      console.log(`[EffectSprite] ${EffectSprite._available.size}/${EffectSprite.TYPES.length} 로드됨`);
      window.dispatchEvent(new CustomEvent('effect-sprites-ready'));
    }
  });
}
