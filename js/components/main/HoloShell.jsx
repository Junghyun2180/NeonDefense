// Neon Defense — HoloShell (T07)
// 메인 메뉴 5페이지 공통 쉘. 좌측 220px nav · 상단 ops bar · 푸터.
// children 으로 활성 페이지 컴포넌트를 받는다.
// Spec: docs/design-handoff/handoff-spec.html · §06 PAGE B
//
// 의도적으로 URL hash 라우터는 도입하지 않음 — 사용자 선호(토글/단축키 미도입)와
// 동일 선상에서, 상태 기반 page switching 으로 충분.

const HoloShell = ({
  activePage = 'home',
  onChangePage,
  crystals = 0,
  achievements = { unlocked: 0, total: 0 },
  codexPercent = 0,
  dailyDot = false,
  children,
}) => {
  const navItems = [
    { k: 'home',    code: '◇',  label: 'HOME',    sub: '시작' },
    { k: 'codex',   code: '◈',  label: 'CODEX',   sub: '도감',
      meta: codexPercent ? `${codexPercent}%` : null },
    { k: 'profile', code: '✦',  label: 'PROFILE', sub: '프로필',
      meta: achievements.total
        ? `${achievements.unlocked}/${achievements.total}` : null },
    { k: 'meta',    code: '◆',  label: 'META',    sub: '업그레이드',
      meta: crystals > 0 ? crystals.toLocaleString() : null,
      metaColor: 'var(--nd-gold)' },
    { k: 'rank',    code: '▲',  label: 'RANK',    sub: '순위' },
  ];

  const activeNav = navItems.find(n => n.k === activePage) || navItems[0];

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: 'var(--nd-bg)',
        color: 'var(--nd-text)',
        fontFamily: 'var(--nd-font-sans)',
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gridTemplateRows: '52px 1fr 28px',
      }}
    >
      {/* ambient grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, opacity: 0.22, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 0,
        }}
      />

      {/* ─────────── TOP OPS BAR (full width) ─────────── */}
      <div
        className="nd-mono"
        style={{
          gridColumn: '1 / -1', gridRow: '1',
          display: 'grid', gridTemplateColumns: '220px 1fr auto',
          alignItems: 'center',
          borderBottom: '1px solid var(--nd-hair-strong)',
          background: 'rgba(8,8,10,0.92)',
          backdropFilter: 'blur(6px)',
          fontSize: 10, letterSpacing: 2,
          position: 'relative', zIndex: 2,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '0 16px', height: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            borderRight: '1px solid var(--nd-hair-strong)',
          }}
        >
          <span style={{ color: 'var(--nd-crimson)', fontSize: 14 }}>◇</span>
          <span style={{ color: '#fff', fontWeight: 700, letterSpacing: 3 }}>
            NEON DEFENSE
          </span>
        </div>

        {/* Breadcrumb */}
        <div
          style={{
            padding: '0 18px', display: 'flex',
            alignItems: 'center', gap: 12,
            color: 'var(--nd-dimmer)',
          }}
        >
          <span>HOLOGRAPHIC COMMAND</span>
          <span style={{ color: 'var(--nd-crimson)', opacity: 0.5 }}>/</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>
            {activeNav.code} {activeNav.label}
          </span>
          <span style={{ color: 'var(--nd-dimmer)', opacity: 0.6 }}>·</span>
          <span style={{ color: 'var(--nd-dim)' }}>{activeNav.sub}</span>
        </div>

        {/* Right indicators */}
        <div
          style={{
            padding: '0 18px', display: 'flex',
            alignItems: 'center', gap: 18,
          }}
        >
          <span className="nd-tnum" style={{ color: 'var(--nd-gold)' }}>
            ◆ <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>
              {crystals.toLocaleString()}
            </span>
          </span>
          <span style={{ width: 1, height: 14, background: 'var(--nd-hair-strong)' }} />
          <span className="nd-tnum" style={{ color: 'var(--nd-amber)' }}>
            ✕ <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>
              {achievements.unlocked}/{achievements.total}
            </span>
          </span>
          <span style={{ width: 1, height: 14, background: 'var(--nd-hair-strong)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 6, height: 6, background: 'var(--nd-green)',
              boxShadow: '0 0 6px var(--nd-green)',
            }} />
            <span style={{ color: 'var(--nd-green)' }}>CMDR · STANDBY</span>
          </span>
        </div>
      </div>

      {/* ─────────── LEFT NAV ─────────── */}
      <nav
        style={{
          gridColumn: '1', gridRow: '2',
          borderRight: '1px solid var(--nd-hair-strong)',
          background: 'rgba(12,12,16,0.6)',
          padding: '14px 0',
          display: 'flex', flexDirection: 'column', gap: 2,
          position: 'relative', zIndex: 2,
        }}
      >
        <div
          className="nd-mono"
          style={{
            padding: '0 16px 10px',
            fontSize: 9, letterSpacing: 3,
            color: 'var(--nd-dimmer)',
          }}
        >
          ◇ NAVIGATION
        </div>

        {navItems.map(n => {
          const active = n.k === activePage;
          return (
            <button
              key={n.k}
              onClick={() => onChangePage && onChangePage(n.k)}
              className="nd-mono"
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '24px 1fr auto',
                gap: 10, alignItems: 'center',
                padding: '12px 16px',
                background: active ? 'rgba(255,61,110,0.10)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--nd-crimson)' : '2px solid transparent',
                color: active ? '#fff' : 'var(--nd-dim)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.12s, color 0.12s',
                fontSize: 11, letterSpacing: 2,
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{
                fontSize: 14,
                color: active ? 'var(--nd-crimson)' : 'var(--nd-dimmer)',
                textShadow: active ? '0 0 8px var(--nd-crimson)' : 'none',
              }}>
                {n.code}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{
                  fontWeight: 700,
                  textShadow: active ? '0 0 8px rgba(255,61,110,0.5)' : 'none',
                }}>
                  {n.label}
                </span>
                <span style={{
                  fontSize: 9, color: 'var(--nd-dimmer)',
                  letterSpacing: 1, fontWeight: 400,
                  fontFamily: 'var(--nd-font-sans)',
                }}>
                  {n.sub}
                </span>
              </span>
              {n.meta && (
                <span
                  className="nd-tnum"
                  style={{
                    fontSize: 9, letterSpacing: 1,
                    color: n.metaColor || (active ? 'var(--nd-amber)' : 'var(--nd-dimmer)'),
                    fontWeight: 500,
                  }}
                >
                  {n.meta}
                </span>
              )}
              {n.k === 'codex' && dailyDot && (
                <span
                  className="nd-motion-pulse"
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 6, height: 6, background: 'var(--nd-crimson)',
                    boxShadow: '0 0 6px var(--nd-crimson)',
                  }}
                />
              )}
            </button>
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer info inside nav */}
        <div
          className="nd-mono"
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--nd-hair)',
            fontSize: 9, letterSpacing: 2,
            color: 'var(--nd-dimmer)',
            lineHeight: 1.7,
          }}
        >
          <div>HOLO SHELL · v1.1</div>
          <div style={{ color: 'var(--nd-green)' }}>◇ LINK STABLE</div>
        </div>
      </nav>

      {/* ─────────── PAGE CONTENT ─────────── */}
      <main
        style={{
          gridColumn: '2', gridRow: '2',
          overflow: 'auto',
          position: 'relative', zIndex: 1,
        }}
      >
        {children}
      </main>

      {/* ─────────── FOOTER ─────────── */}
      <div
        className="nd-mono"
        style={{
          gridColumn: '1 / -1', gridRow: '3',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 18px',
          borderTop: '1px solid var(--nd-hair-strong)',
          background: 'rgba(8,8,10,0.92)',
          fontSize: 9, letterSpacing: 2,
          color: 'var(--nd-dimmer)',
          position: 'relative', zIndex: 2,
        }}
      >
        <span style={{ color: 'var(--nd-crimson)' }}>NEON DEFENSE</span>
        <span>HOLOGRAPHIC COMMAND · BUILD {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
        <span>SECTOR LINK · SECURE</span>
      </div>
    </div>
  );
};

window.HoloShell = HoloShell;
