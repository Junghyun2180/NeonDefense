// Neon Defense — Meta page (T10 second half)
// 8개 메타 업그레이드 노드 + 우측 인스펙터.
// META_UPGRADES (run-mode-constants.js) 데이터 사용.

const Meta = ({ metaProgress, neonCrystals, onPurchaseUpgrade }) => {
  const { useState } = React;

  if (typeof META_UPGRADES === 'undefined') {
    return (
      <div style={{ padding: 32, color: 'var(--nd-dim)', textAlign: 'center' }} className="nd-mono">
        ◷ META UPGRADES UNAVAILABLE
      </div>
    );
  }

  const upgradeIds = Object.keys(META_UPGRADES);
  const [selectedId, setSelectedId] = useState(upgradeIds[0]);

  if (!metaProgress) {
    return (
      <div style={{ padding: 32 }}>
        <div className="nd-mono" style={{ color: 'var(--nd-dim)', textAlign: 'center', letterSpacing: 2 }}>
          ◷ LOADING META PROGRESS…
        </div>
      </div>
    );
  }

  const crystals = neonCrystals ?? metaProgress?.crystals ?? 0;
  const upgrades = metaProgress.upgrades || {};
  const totalLevels = Object.values(upgrades).reduce((s, n) => s + (n || 0), 0);
  const maxedNodes = upgradeIds.filter(id => (upgrades[id] || 0) >= META_UPGRADES[id].maxLevel).length;

  // category grouping for "branch" feel
  const branches = [
    { id: 'economy', label: '◆ ECONOMY',     ids: ['startingGold','goldMultiplier','drawDiscount'] },
    { id: 'combat',  label: '⚔ COMBAT',      ids: ['baseDamage','baseAttackSpeed'] },
    { id: 'survival',label: '♥ SURVIVAL',    ids: ['startingLives','carryoverSlots','rerollCount'] },
  ];

  const selected = META_UPGRADES[selectedId];
  const selectedLv = upgrades[selectedId] || 0;
  const selectedMaxed = selectedLv >= selected.maxLevel;
  const selectedCost = selectedMaxed ? null : selected.cost(selectedLv);
  const canAfford = !selectedMaxed && crystals >= selectedCost;

  return (
    <div
      style={{
        padding: '20px 24px', height: '100%', minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: 14,
      }}
    >
      {/* ─────────── LEFT · TREE (branches) ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* crystal balance bar */}
        <div className="nd-panel relative" style={{ padding: '12px 16px' }}>
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="nd-eyebrow nd-eyebrow--gold">◆ NEON CRYSTAL · BALANCE</div>
              <div
                className="nd-mono nd-tnum"
                style={{ fontSize: 24, color: '#fff', fontWeight: 700, letterSpacing: 2, marginTop: 2 }}
              >
                {crystals.toLocaleString()}
              </div>
            </div>
            <div className="nd-mono" style={{
              display: 'grid', gap: 4,
              fontSize: 10, letterSpacing: 1.5, color: 'var(--nd-dim)',
              textAlign: 'right',
            }}>
              <div>◇ NODES MAXED <span style={{ color: '#fff', fontWeight: 700 }}>{maxedNodes}/{upgradeIds.length}</span></div>
              <div>★ TOTAL NODE LV <span style={{ color: 'var(--nd-amber)', fontWeight: 700 }}>{totalLevels}</span></div>
              <div style={{ color: 'var(--nd-dimmer)' }}>EARN ON CLEAR / SECTOR PROGRESSION</div>
            </div>
          </div>
        </div>

        {/* tree */}
        <div
          className="nd-panel relative"
          style={{ flex: 1, minHeight: 0, padding: 16, overflowY: 'auto' }}
        >
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          <div className="nd-eyebrow" style={{ marginBottom: 14 }}>◆ UPGRADE TREE · 3 BRANCHES</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {branches.map(branch => (
              <div key={branch.id}>
                <div
                  className="nd-mono"
                  style={{
                    fontSize: 10, letterSpacing: 2,
                    color: 'var(--nd-amber)', fontWeight: 700,
                    paddingBottom: 6, marginBottom: 8,
                    borderBottom: '1px solid var(--nd-hair)',
                  }}
                >
                  {branch.label}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 8,
                  }}
                >
                  {branch.ids.map(id => {
                    const u = META_UPGRADES[id];
                    if (!u) return null;
                    const lv = upgrades[id] || 0;
                    const maxed = lv >= u.maxLevel;
                    const cost = maxed ? null : u.cost(lv);
                    const afford = !maxed && crystals >= cost;
                    const isSelected = selectedId === id;

                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedId(id)}
                        style={{
                          position: 'relative',
                          padding: 10, textAlign: 'left',
                          background: isSelected
                            ? 'rgba(255,61,110,0.10)'
                            : maxed ? 'rgba(255,182,39,0.06)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid ' + (
                            isSelected ? 'var(--nd-crimson)' :
                            maxed ? 'var(--nd-gold)' :
                            afford ? 'var(--nd-amber)' : 'var(--nd-hair)'
                          ),
                          cursor: 'pointer',
                          transition: 'border-color 0.12s',
                        }}
                      >
                        <span className="nd-reticle__c nd-reticle__c--tl" />
                        <span className="nd-reticle__c nd-reticle__c--tr" />
                        <span className="nd-reticle__c nd-reticle__c--bl" />
                        <span className="nd-reticle__c nd-reticle__c--br" />

                        {maxed && (
                          <span
                            className="nd-mono"
                            style={{
                              position: 'absolute', top: -8, right: 8,
                              fontSize: 8, color: '#000',
                              background: 'var(--nd-gold)',
                              padding: '1px 6px', letterSpacing: 1, fontWeight: 700,
                            }}
                          >
                            MAX
                          </span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{u.icon}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              className="nd-mono"
                              style={{
                                fontSize: 10, fontWeight: 700,
                                color: '#fff', letterSpacing: 0.5,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}
                            >
                              {u.name}
                            </div>
                            <div
                              className="nd-mono nd-tnum"
                              style={{
                                fontSize: 9, letterSpacing: 1, marginTop: 2,
                                color: maxed ? 'var(--nd-gold)' : 'var(--nd-amber)',
                                fontWeight: 700,
                              }}
                            >
                              {u.formatEffect(lv) || '-'}
                            </div>
                          </div>
                        </div>

                        {/* level pips */}
                        <div style={{ display: 'flex', gap: 2, marginTop: 8 }}>
                          {Array.from({ length: u.maxLevel }, (_, i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1, height: 3,
                                background: i < lv
                                  ? (maxed ? 'var(--nd-gold)' : 'var(--nd-amber)')
                                  : 'rgba(255,255,255,0.10)',
                                boxShadow: i < lv && (maxed ? '0 0 4px var(--nd-gold)' : '0 0 4px var(--nd-amber)'),
                              }}
                            />
                          ))}
                        </div>

                        <div
                          className="nd-mono nd-tnum"
                          style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginTop: 6, fontSize: 9, letterSpacing: 1,
                          }}
                        >
                          <span style={{ color: 'var(--nd-dim)' }}>LV {lv}/{u.maxLevel}</span>
                          {!maxed && (
                            <span style={{ color: afford ? 'var(--nd-gold)' : 'var(--nd-dimmer)' }}>
                              ◆ {cost}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── RIGHT · NODE INSPECTOR ─────────── */}
      <aside
        className="nd-panel relative"
        style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-eyebrow">◆ NODE INSPECTOR</div>

        {selected && (
          <>
            <div
              style={{
                border: '1px solid ' + (selectedMaxed ? 'var(--nd-gold)' : 'var(--nd-hair-strong)'),
                background: 'rgba(255,255,255,0.02)',
                padding: 16, position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44,
                    border: '1px solid var(--nd-hair-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {selected.icon}
                </div>
                <div>
                  <div
                    className="nd-mono"
                    style={{
                      fontSize: 13, color: '#fff', fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    className="nd-mono"
                    style={{
                      fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1,
                      marginTop: 2,
                    }}
                  >
                    {selected.id.toUpperCase()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12, fontSize: 11, color: 'var(--nd-dim)',
                  letterSpacing: 0.5, lineHeight: 1.5,
                }}
              >
                {selected.desc}
              </div>
            </div>

            <div className="nd-mono" style={{ display: 'grid', gap: 8, fontSize: 10, letterSpacing: 1 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 8px', border: '1px solid var(--nd-hair)',
              }}>
                <span style={{ color: 'var(--nd-dim)' }}>★ CURRENT</span>
                <span className="nd-tnum" style={{ color: '#fff', fontWeight: 700 }}>
                  LV {selectedLv}/{selected.maxLevel} · {selected.formatEffect(selectedLv)}
                </span>
              </div>
              {!selectedMaxed && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 8px', border: '1px solid var(--nd-hair)',
                }}>
                  <span style={{ color: 'var(--nd-dim)' }}>▸ NEXT</span>
                  <span className="nd-tnum" style={{ color: 'var(--nd-green)', fontWeight: 700 }}>
                    {selected.formatEffect(selectedLv + 1)}
                  </span>
                </div>
              )}
              {!selectedMaxed && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 8px', border: '1px solid var(--nd-hair)',
                }}>
                  <span style={{ color: 'var(--nd-dim)' }}>◆ COST</span>
                  <span className="nd-tnum" style={{
                    color: canAfford ? 'var(--nd-gold)' : 'var(--nd-dimmer)',
                    fontWeight: 700,
                  }}>
                    {selectedCost.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => canAfford && onPurchaseUpgrade && onPurchaseUpgrade(selectedId)}
              disabled={!canAfford}
              className={selectedMaxed ? 'nd-btn-amber nd-mono' : 'nd-btn-deploy nd-mono'}
              style={{
                padding: '12px 14px',
                fontSize: 11, letterSpacing: 2, fontWeight: 700,
                marginTop: 'auto',
                opacity: selectedMaxed ? 0.5 : 1,
                cursor: selectedMaxed ? 'default' : (canAfford ? 'pointer' : 'not-allowed'),
              }}
            >
              {selectedMaxed
                ? '◆ NODE MAXED'
                : canAfford
                  ? `▸ ALLOCATE · ${selectedCost.toLocaleString()} ◆`
                  : `◌ NEED ${(selectedCost - crystals).toLocaleString()} MORE`}
            </button>
          </>
        )}
      </aside>
    </div>
  );
};

window.Meta = Meta;
