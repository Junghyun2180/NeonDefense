// Neon Defense — Profile page (T10 first half)
// 오퍼레이터 카드 + 업적 그리드 + 최근 전적.

const Profile = ({ metaProgress, neonCrystals }) => {
  const { useState, useMemo } = React;
  const [achFilter, setAchFilter] = useState('all');

  const stats = metaProgress?.stats || {};
  const crystals = neonCrystals ?? metaProgress?.crystals ?? 0;
  const upgrades = metaProgress?.upgrades || {};
  const totalUpgradeLevels = Object.values(upgrades).reduce((s, n) => s + (n || 0), 0);

  const achList = (typeof ACHIEVEMENTS !== 'undefined') ? Object.values(ACHIEVEMENTS) : [];
  const unlockedMap = (typeof AchievementSystem !== 'undefined') ? AchievementSystem.getUnlocked() : {};

  const achProgress = (typeof AchievementSystem !== 'undefined')
    ? AchievementSystem.getProgress() : { unlocked: 0, total: achList.length, percentage: 0 };

  const filteredAch = useMemo(() => {
    if (achFilter === 'unlocked') return achList.filter(a => unlockedMap[a.id]);
    if (achFilter === 'locked') return achList.filter(a => !unlockedMap[a.id]);
    if (achFilter === 'all') return achList;
    return achList.filter(a => a.category === achFilter);
  }, [achList, achFilter, unlockedMap]);

  // 가짜 최근 전적 — 실제로는 leaderboard에서 가져온다.
  const recent = (() => {
    if (typeof Leaderboard === 'undefined') return [];
    const merged = [];
    ['campaign', 'standard', 'daily', 'endless'].forEach(mode => {
      const entries = Leaderboard.getEntries(mode);
      entries.forEach(e => merged.push({ ...e, mode }));
    });
    return merged.sort((a, b) => (b.date || 0) - (a.date || 0)).slice(0, 8);
  })();

  const formatTime = (ms) => {
    if (!ms) return '-';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const achTabs = [
    { id: 'all', label: 'ALL' },
    { id: 'unlocked', label: 'OWN' },
    { id: 'locked', label: 'LCK' },
    { id: 'campaign', label: 'CAMP' },
    { id: 'run', label: 'RUN' },
    { id: 'combat', label: 'CMB' },
    { id: 'economy', label: 'ECO' },
  ];

  return (
    <div
      style={{
        padding: '20px 24px', height: '100%', minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '320px minmax(0, 1fr)',
        gap: 14,
      }}
    >
      {/* ─────────── LEFT · OPERATOR CARD ─────────── */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        <div className="nd-panel relative" style={{ padding: 16 }}>
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          <div className="nd-eyebrow">✦ OPERATOR PROFILE</div>

          {/* avatar */}
          <div
            style={{
              marginTop: 12, display: 'flex',
              alignItems: 'center', gap: 14,
            }}
          >
            <div
              style={{
                width: 64, height: 64, position: 'relative',
                border: '1px solid var(--nd-crimson)',
                background:
                  'radial-gradient(ellipse at center, rgba(255,61,110,0.15) 0%, transparent 70%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span className="nd-reticle__c nd-reticle__c--tl" />
              <span className="nd-reticle__c nd-reticle__c--tr" />
              <span className="nd-reticle__c nd-reticle__c--bl" />
              <span className="nd-reticle__c nd-reticle__c--br" />
              <span className="nd-mono" style={{
                fontSize: 24, color: '#fff', fontWeight: 700,
                textShadow: '0 0 12px var(--nd-crimson)',
              }}>
                ◇
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                className="nd-mono"
                style={{
                  fontSize: 16, color: '#fff', fontWeight: 700,
                  letterSpacing: 2,
                }}
              >
                CMDR-001
              </div>
              <div
                className="nd-mono"
                style={{
                  fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2,
                  marginTop: 2,
                }}
              >
                ◇ ACTIVE · STANDBY
              </div>
            </div>
          </div>

          <div className="nd-hair" style={{ margin: '14px 0' }} />

          {/* core stats */}
          <div className="nd-mono" style={{ display: 'grid', gap: 8, fontSize: 11, letterSpacing: 1 }}>
            {[
              { lbl: '◆ CRYSTALS',         val: crystals.toLocaleString(), c: 'var(--nd-gold)' },
              { lbl: '▲ HIGHEST SECTOR',   val: 'S' + (stats.highestCampaignSector || 0), c: 'var(--nd-crimson)' },
              { lbl: '◇ CAMPAIGN CLEARS',  val: stats.campaignClears || 0, c: 'var(--nd-amber)' },
              { lbl: '◎ TOTAL RUNS',       val: stats.totalRuns || 0, c: 'var(--nd-el-water)' },
              { lbl: '★ BEST GRADE',       val: stats.bestGrade || '-', c: 'var(--nd-gold)' },
              { lbl: '∞ ENDLESS HIGH',     val: stats.highestEndlessStage ? 'S' + stats.highestEndlessStage : '-', c: 'var(--nd-el-dark)' },
              { lbl: '⚡ FASTEST CLEAR',   val: formatTime(stats.fastestClear), c: 'var(--nd-green)' },
              { lbl: '✕ ACHIEVEMENTS',     val: `${achProgress.unlocked}/${achProgress.total}`, c: '#fff' },
            ].map(s => (
              <div key={s.lbl} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--nd-hair)',
              }}>
                <span style={{ color: 'var(--nd-dim)' }}>{s.lbl}</span>
                <span className="nd-tnum" style={{ color: s.c, fontWeight: 700 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* upgrade summary */}
        <div className="nd-panel relative" style={{ padding: 14 }}>
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />
          <div className="nd-eyebrow nd-eyebrow--gold" style={{ marginBottom: 8 }}>
            ◆ META PROGRESSION
          </div>
          <div
            className="nd-mono nd-tnum"
            style={{
              fontSize: 22, color: '#fff', fontWeight: 700, letterSpacing: 2,
            }}
          >
            {totalUpgradeLevels}<span style={{ fontSize: 11, color: 'var(--nd-dim)', marginLeft: 6 }}>NODE LV</span>
          </div>
          <div
            className="nd-mono"
            style={{ fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1, marginTop: 4 }}
          >
            8 UPGRADE NODES · MAX LV REACHED: {Object.entries(upgrades).filter(([id, lv]) => {
              const u = (typeof META_UPGRADES !== 'undefined') ? META_UPGRADES[id] : null;
              return u && lv >= u.maxLevel;
            }).length}
          </div>
        </div>
      </aside>

      {/* ─────────── RIGHT · ACHIEVEMENTS + RECENT ─────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* Achievements grid */}
        <div className="nd-panel relative" style={{ padding: 14, flex: '0 0 auto' }}>
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'baseline', marginBottom: 10,
            }}
          >
            <div className="nd-eyebrow">✕ ACHIEVEMENTS · {achProgress.unlocked}/{achProgress.total} ({achProgress.percentage}%)</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {achTabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setAchFilter(t.id)}
                  className="nd-mono"
                  style={{
                    padding: '4px 9px',
                    background: achFilter === t.id ? 'rgba(255,169,77,0.15)' : 'transparent',
                    border: '1px solid ' + (achFilter === t.id ? 'var(--nd-amber)' : 'var(--nd-hair)'),
                    color: achFilter === t.id ? '#fff' : 'var(--nd-dim)',
                    fontSize: 9, letterSpacing: 1.5, cursor: 'pointer',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* progress bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }}>
            <div style={{
              height: '100%',
              width: `${achProgress.percentage}%`,
              background: 'var(--nd-amber)',
              boxShadow: '0 0 6px var(--nd-amber)',
            }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 6,
            }}
          >
            {filteredAch.map(a => {
              const unlocked = !!unlockedMap[a.id];
              return (
                <div
                  key={a.id}
                  style={{
                    position: 'relative',
                    padding: '8px 10px',
                    background: unlocked ? 'rgba(255,169,77,0.08)' : 'rgba(255,255,255,0.012)',
                    border: '1px solid ' + (unlocked ? 'var(--nd-amber)' : 'var(--nd-hair)'),
                    opacity: unlocked ? 1 : 0.5,
                  }}
                  title={a.desc}
                >
                  <span className="nd-reticle__c nd-reticle__c--tl" />
                  <span className="nd-reticle__c nd-reticle__c--tr" />
                  <span className="nd-reticle__c nd-reticle__c--bl" />
                  <span className="nd-reticle__c nd-reticle__c--br" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 22, lineHeight: 1,
                      filter: unlocked ? 'none' : 'grayscale(1) brightness(0.6)',
                    }}>
                      {unlocked ? a.icon : '◌'}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        className="nd-mono"
                        style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: 1,
                          color: unlocked ? '#fff' : 'var(--nd-dim)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {unlocked ? a.name : '???'}
                      </div>
                      <div
                        className="nd-mono"
                        style={{
                          fontSize: 8, color: unlocked ? 'var(--nd-amber)' : 'var(--nd-dimmer)',
                          letterSpacing: 1.5, marginTop: 2,
                        }}
                      >
                        {a.category?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div
                    className="nd-mono"
                    style={{
                      fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 0.5,
                      marginTop: 6, lineHeight: 1.4,
                      fontFamily: 'var(--nd-font-sans)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {unlocked ? a.desc : '◇ HIDDEN OBJECTIVE'}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredAch.length === 0 && (
            <div
              className="nd-mono"
              style={{
                textAlign: 'center', padding: 20,
                color: 'var(--nd-dim)', fontSize: 11, letterSpacing: 2,
              }}
            >
              ◌ NO ACHIEVEMENTS MATCH FILTER
            </div>
          )}
        </div>

        {/* Recent runs table */}
        <div
          className="nd-panel relative"
          style={{
            padding: 14, flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column',
          }}
        >
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          <div className="nd-eyebrow" style={{ marginBottom: 10 }}>
            ◷ RECENT RUNS · LAST {recent.length}
          </div>

          {recent.length === 0 ? (
            <div
              className="nd-mono"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--nd-dim)', fontSize: 11, letterSpacing: 2,
              }}
            >
              ◌ NO RUN HISTORY YET
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <table
                className="nd-mono"
                style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: 10, letterSpacing: 1,
                }}
              >
                <thead>
                  <tr style={{ color: 'var(--nd-dimmer)' }}>
                    {['MODE','STAGE','GRADE','TIME','DATE'].map(h => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderBottom: '1px solid var(--nd-hair-strong)',
                          fontWeight: 500, letterSpacing: 2, fontSize: 9,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 8px', color: 'var(--nd-dim)', textTransform: 'uppercase' }}>
                        {r.mode}
                      </td>
                      <td className="nd-tnum" style={{ padding: '6px 8px', color: '#fff', fontWeight: 700 }}>
                        S{r.stage}
                      </td>
                      <td style={{
                        padding: '6px 8px',
                        color: r.grade === 'S' ? 'var(--nd-gold)' :
                               r.grade === 'A' ? 'var(--nd-amber)' :
                               r.grade === 'B' ? 'var(--nd-el-water)' :
                               'var(--nd-dim)',
                        fontWeight: 700,
                      }}>
                        {r.grade || '-'}
                      </td>
                      <td className="nd-tnum" style={{ padding: '6px 8px', color: 'var(--nd-dim)' }}>
                        {formatTime(r.time)}
                      </td>
                      <td className="nd-tnum" style={{ padding: '6px 8px', color: 'var(--nd-dimmer)' }}>
                        {formatDate(r.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

window.Profile = Profile;
