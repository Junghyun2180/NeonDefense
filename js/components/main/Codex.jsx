// Neon Defense — Codex page (T09)
// 좌측 카테고리 필터 / 중앙 카드 그리드 / 우측 상세 인스펙터.
// CollectionSystem 데이터 사용.

const Codex = () => {
  const { useState, useMemo } = React;

  const [tab, setTab] = useState('tower');
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  if (typeof CollectionSystem === 'undefined') {
    return (
      <div style={{ padding: 32, color: 'var(--nd-dim)', textAlign: 'center' }} className="nd-mono">
        ◷ COLLECTION SYSTEM UNAVAILABLE
      </div>
    );
  }

  const state = CollectionSystem.load();
  const completion = CollectionSystem.getCompletion();

  const tabs = [
    { id: 'tower',     code: '◇',     label: 'TOWER',    sub: '6원소 × 4티어',   cards: CollectionSystem.TOWER_CARDS,      st: state.tower },
    { id: 'towerRole', code: '★',     label: 'T4 ROLE',  sub: '6원소 × 3역할',   cards: CollectionSystem.TOWER_ROLE_CARDS, st: state.towerRole },
    { id: 'support',   code: '◈',     label: 'SUPPORT',  sub: '4종 × 3티어',     cards: CollectionSystem.SUPPORT_CARDS,    st: state.support },
    { id: 'enemy',     code: '✕',     label: 'ENEMY',    sub: '8종',             cards: CollectionSystem.ENEMY_CARDS,      st: state.enemy },
  ];

  const current = tabs.find(t => t.id === tab) || tabs[0];
  const allCards = Object.values(current.cards);

  const filtered = useMemo(() => allCards.filter(card => {
    const progress = current.st[card.id];
    if (filter === 'unlocked') return !!progress;
    if (filter === 'locked') return !progress;
    return true;
  }), [allCards, filter, current.st]);

  const unlockedCount = Object.keys(current.st).length;
  const tabTotal = allCards.length;

  const rarityToken = {
    common:    { color: 'var(--nd-dim)',     code: 'CMN' },
    rare:      { color: 'var(--nd-el-water)',code: 'RAR' },
    epic:      { color: 'var(--nd-el-dark)', code: 'EPC' },
    legendary: { color: 'var(--nd-gold)',    code: 'LGD' },
  };

  const elementToken = ['var(--nd-el-fire)','var(--nd-el-water)','var(--nd-el-electric)','var(--nd-el-wind)','var(--nd-el-dark)','var(--nd-el-light)'];

  const selected = selectedId ? current.cards[selectedId] : null;
  const selectedProgress = selected ? current.st[selected.id] : null;

  return (
    <div
      style={{
        padding: '20px 24px', height: '100%', minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr) 280px',
        gap: 14,
      }}
    >
      {/* ─────────── LEFT · CATEGORY FILTER ─────────── */}
      <aside
        className="nd-panel relative"
        style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-eyebrow">◈ CATEGORY</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(t => {
            const active = t.id === tab;
            const tcount = Object.keys(t.st).length;
            const ttotal = Object.keys(t.cards).length;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelectedId(null); }}
                className="nd-mono"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr auto',
                  alignItems: 'center', gap: 8,
                  padding: '8px 10px', textAlign: 'left',
                  background: active ? 'rgba(255,61,110,0.10)' : 'transparent',
                  border: '1px solid ' + (active ? 'var(--nd-crimson)' : 'var(--nd-hair)'),
                  color: active ? '#fff' : 'var(--nd-dim)',
                  cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <span style={{
                  color: active ? 'var(--nd-crimson)' : 'var(--nd-dimmer)',
                  fontSize: 13,
                }}>
                  {t.code}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontWeight: 700 }}>{t.label}</span>
                  <span style={{
                    fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1,
                    fontFamily: 'var(--nd-font-sans)',
                  }}>
                    {t.sub}
                  </span>
                </span>
                <span className="nd-tnum" style={{
                  fontSize: 9, color: 'var(--nd-amber)', letterSpacing: 1,
                }}>
                  {tcount}/{ttotal}
                </span>
              </button>
            );
          })}
        </div>

        <div className="nd-hair" style={{ margin: '4px 0' }} />

        <div className="nd-eyebrow">◇ FILTER</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'all', label: 'ALL' },
            { id: 'unlocked', label: 'OWN' },
            { id: 'locked', label: 'LCK' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="nd-mono"
              style={{
                flex: 1, padding: '5px 6px',
                background: filter === f.id ? 'rgba(255,169,77,0.15)' : 'transparent',
                border: '1px solid ' + (filter === f.id ? 'var(--nd-amber)' : 'var(--nd-hair)'),
                color: filter === f.id ? '#fff' : 'var(--nd-dim)',
                fontSize: 9, letterSpacing: 1.5, cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div
          className="nd-mono nd-tnum"
          style={{
            padding: '8px 10px', border: '1px solid var(--nd-hair-strong)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="nd-eyebrow nd-eyebrow--gold" style={{ marginBottom: 4 }}>
            ◆ COMPLETION
          </div>
          <div style={{ fontSize: 22, color: '#fff', fontWeight: 700, letterSpacing: 2 }}>
            {completion.percent}<span style={{ fontSize: 12, color: 'var(--nd-dim)' }}>%</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1 }}>
            {completion.unlocked} / {completion.total}
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', marginTop: 6 }}>
            <div style={{
              height: '100%', width: `${completion.percent}%`,
              background: 'var(--nd-gold)', boxShadow: '0 0 6px var(--nd-gold)',
            }} />
          </div>
        </div>
      </aside>

      {/* ─────────── CENTER · CARD GRID ─────────── */}
      <section
        className="nd-panel relative"
        style={{ padding: 14, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <div className="nd-eyebrow">◇ {current.label} GRID · {unlockedCount}/{tabTotal}</div>
          <div className="nd-mono" style={{ fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2 }}>
            ◷ AUTO-RECORD ON GENERATE
          </div>
        </div>

        <div
          style={{
            flex: 1, overflowY: 'auto', overflowX: 'hidden',
            paddingRight: 4,
          }}
        >
          {filtered.length === 0 ? (
            <div
              className="nd-mono"
              style={{
                textAlign: 'center', padding: '40px 0',
                color: 'var(--nd-dim)', fontSize: 11, letterSpacing: 2,
              }}
            >
              ◌ NO CARDS MATCH FILTER
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                gap: 6,
              }}
            >
              {filtered.map(card => {
                const prog = current.st[card.id];
                const locked = !prog;
                const isSelected = selectedId === card.id;
                const rar = rarityToken[card.rarity] || rarityToken.common;
                const elColor = card.element != null ? elementToken[card.element] : rar.color;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedId(card.id)}
                    style={{
                      position: 'relative',
                      padding: 8,
                      background: isSelected
                        ? 'rgba(255,61,110,0.10)'
                        : locked ? 'rgba(255,255,255,0.012)' : 'rgba(255,255,255,0.025)',
                      border: '1px solid ' + (isSelected ? 'var(--nd-crimson)' : locked ? 'var(--nd-hair)' : rar.color),
                      cursor: 'pointer',
                      opacity: locked ? 0.45 : 1,
                      transition: 'border-color 0.12s, background 0.12s',
                      textAlign: 'left',
                    }}
                  >
                    <span className="nd-reticle__c nd-reticle__c--tl" />
                    <span className="nd-reticle__c nd-reticle__c--tr" />
                    <span className="nd-reticle__c nd-reticle__c--bl" />
                    <span className="nd-reticle__c nd-reticle__c--br" />

                    <div
                      className="nd-mono"
                      style={{
                        fontSize: 8, letterSpacing: 1.5,
                        color: rar.color, marginBottom: 4, fontWeight: 700,
                      }}
                    >
                      {rar.code}
                    </div>
                    <div style={{
                      fontSize: 28, textAlign: 'center', lineHeight: 1,
                      filter: locked ? 'grayscale(1) brightness(0.6)' : 'none',
                    }}>
                      {locked ? '◌' : card.icon}
                    </div>
                    <div
                      className="nd-mono"
                      style={{
                        fontSize: 9, color: locked ? 'var(--nd-dimmer)' : '#fff',
                        textAlign: 'center', marginTop: 6, letterSpacing: 0.5,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {locked ? '???' : card.name}
                    </div>
                    {!locked && card.kind !== 'enemy' && (
                      <div
                        className="nd-mono nd-tnum"
                        style={{
                          fontSize: 8, color: 'var(--nd-amber)',
                          textAlign: 'center', marginTop: 2, letterSpacing: 1,
                        }}
                      >
                        Lv.{prog.level || 0}
                      </div>
                    )}
                    {!locked && card.element != null && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 6, height: 6, background: elColor,
                        boxShadow: `0 0 4px ${elColor}`,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─────────── RIGHT · INSPECTOR ─────────── */}
      <aside
        className="nd-panel relative"
        style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-eyebrow">◇ INSPECTOR</div>

        {!selected ? (
          <div
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8, color: 'var(--nd-dimmer)',
            }}
          >
            <span style={{ fontSize: 32, opacity: 0.4 }}>◌</span>
            <div className="nd-mono" style={{ fontSize: 10, letterSpacing: 2 }}>
              SELECT A CARD
            </div>
          </div>
        ) : (() => {
          const locked = !selectedProgress;
          const rar = rarityToken[selected.rarity] || rarityToken.common;
          const elColor = selected.element != null ? elementToken[selected.element] : rar.color;
          return (
            <>
              <div
                style={{
                  border: '1px solid ' + rar.color,
                  background: 'rgba(255,255,255,0.02)',
                  padding: 14, position: 'relative',
                }}
              >
                <div
                  className="nd-mono"
                  style={{ fontSize: 9, letterSpacing: 2, color: rar.color, fontWeight: 700 }}
                >
                  {rar.code} · {selected.kind?.toUpperCase()}
                </div>
                <div style={{ fontSize: 44, textAlign: 'center', margin: '10px 0', lineHeight: 1 }}>
                  {locked ? '◌' : selected.icon}
                </div>
                <div
                  className="nd-mono"
                  style={{
                    fontSize: 14, color: '#fff', fontWeight: 700, textAlign: 'center',
                    letterSpacing: 1,
                  }}
                >
                  {locked ? 'UNKNOWN' : selected.name}
                </div>
              </div>

              {!locked && selectedProgress && (
                <div className="nd-mono" style={{ display: 'grid', gap: 6, fontSize: 10, letterSpacing: 1 }}>
                  {selected.kind !== 'enemy' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--nd-dim)' }}>◷ GENERATED</span>
                        <span className="nd-tnum" style={{ color: '#fff', fontWeight: 700 }}>
                          {selectedProgress.count || 0}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--nd-dim)' }}>★ LEVEL</span>
                        <span className="nd-tnum" style={{ color: 'var(--nd-amber)', fontWeight: 700 }}>
                          Lv.{selectedProgress.level || 0} / 10
                        </span>
                      </div>
                      {(selectedProgress.level || 0) < 10 && (
                        <div>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1.5,
                            marginBottom: 4,
                          }}>
                            <span>NEXT LV PROGRESS</span>
                            <span className="nd-tnum">{(selectedProgress.count || 0) % 5}/5</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{
                              height: '100%',
                              width: `${(((selectedProgress.count || 0) % 5) / 5) * 100}%`,
                              background: 'var(--nd-amber)',
                              boxShadow: '0 0 6px var(--nd-amber)',
                            }} />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {selected.kind === 'enemy' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--nd-dim)' }}>✕ KILLS</span>
                      <span className="nd-tnum" style={{ color: '#fff', fontWeight: 700 }}>
                        {selectedProgress.kills || 0}
                      </span>
                    </div>
                  )}
                  {selected.tier != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--nd-dim)' }}>▣ TIER</span>
                      <span className="nd-tnum" style={{ color: '#fff', fontWeight: 700 }}>T{selected.tier}</span>
                    </div>
                  )}
                  {selected.element != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--nd-dim)' }}>◇ ELEMENT</span>
                      <span style={{ color: elColor, fontWeight: 700 }}>
                        ▮ {['FIRE','WATER','ELECTRIC','WIND','VOID','LIGHT'][selected.element]}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {locked && (
                <div
                  className="nd-mono"
                  style={{
                    padding: 12, border: '1px dashed var(--nd-hair-strong)',
                    color: 'var(--nd-dim)', fontSize: 10, letterSpacing: 1.5,
                    textAlign: 'center',
                  }}
                >
                  ◌ LOCKED<br />
                  <span style={{ fontSize: 9, color: 'var(--nd-dimmer)' }}>
                    {selected.kind === 'enemy' ? '게임에서 처치 시 해금' : '게임에서 생성 시 해금'}
                  </span>
                </div>
              )}

              <div style={{ flex: 1 }} />

              <div
                className="nd-mono"
                style={{
                  fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1,
                  lineHeight: 1.6, paddingTop: 8,
                  borderTop: '1px solid var(--nd-hair)',
                }}
              >
                ◇ 5회 생성당 카드 LV +1 (MAX 10)
              </div>
            </>
          );
        })()}
      </aside>
    </div>
  );
};

window.Codex = Codex;
