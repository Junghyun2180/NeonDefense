// Neon Defense — Rank page (T11)
// 모드 필터 + 포디움(2-1-3) + Top 10 테이블.
// 백엔드 mock 없음 — Leaderboard localStorage 데이터 사용.

const Rank = () => {
  const { useState } = React;
  const [mode, setMode] = useState('campaign');

  const modes = [
    { id: 'campaign', code: '◇', label: 'CAMPAIGN', accent: 'var(--nd-crimson)' },
    { id: 'standard', code: '◎', label: 'STANDARD', accent: 'var(--nd-amber)' },
    { id: 'daily',    code: '☼', label: 'DAILY',    accent: 'var(--nd-gold)' },
    { id: 'endless',  code: '∞', label: 'ENDLESS',  accent: 'var(--nd-el-dark)' },
  ];

  const entries = (typeof Leaderboard !== 'undefined') ? Leaderboard.getEntries(mode) : [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  const formatTime = (ms) => {
    if (!ms) return '-';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const gradeColor = (g) => g === 'S' ? 'var(--nd-gold)' :
    g === 'A' ? 'var(--nd-amber)' :
    g === 'B' ? 'var(--nd-el-water)' :
    g === 'C' ? 'var(--nd-green)' :
    'var(--nd-dim)';

  const activeMode = modes.find(m => m.id === mode) || modes[0];

  // podium order: silver-gold-bronze visually (left-center-right)
  const podiumOrder = [];
  if (podium[1]) podiumOrder.push({ rank: 2, entry: podium[1], height: 80 });
  if (podium[0]) podiumOrder.push({ rank: 1, entry: podium[0], height: 110 });
  if (podium[2]) podiumOrder.push({ rank: 3, entry: podium[2], height: 64 });

  const rankColor = (r) => r === 1 ? 'var(--nd-gold)' :
    r === 2 ? '#cfd2d6' : 'var(--nd-amber)';

  return (
    <div
      style={{
        padding: '20px 24px', height: '100%', minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      {/* mode filter */}
      <div className="nd-panel relative" style={{ padding: '10px 14px' }}>
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="nd-eyebrow" style={{ flex: 'none' }}>▲ MODE FILTER</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="nd-mono"
                style={{
                  padding: '6px 12px',
                  background: mode === m.id ? 'rgba(255,61,110,0.10)' : 'transparent',
                  border: '1px solid ' + (mode === m.id ? m.accent : 'var(--nd-hair)'),
                  color: mode === m.id ? '#fff' : 'var(--nd-dim)',
                  fontSize: 10, letterSpacing: 1.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ color: m.accent }}>{m.code}</span>
                {m.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span className="nd-mono nd-tnum" style={{ fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 1.5 }}>
            ◇ TOTAL ENTRIES <span style={{ color: '#fff', fontWeight: 700 }}>{entries.length}</span>
          </span>
        </div>
      </div>

      {/* podium */}
      <div className="nd-panel relative" style={{ padding: '14px 16px' }}>
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-eyebrow" style={{ marginBottom: 12 }}>
          ▲ {activeMode.label} · TOP 3
        </div>

        {podium.length === 0 ? (
          <div
            className="nd-mono"
            style={{
              textAlign: 'center', padding: '30px 0',
              color: 'var(--nd-dim)', fontSize: 11, letterSpacing: 2,
            }}
          >
            ◌ NO PODIUM ENTRIES YET
          </div>
        ) : (
          <div
            style={{
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              gap: 14, paddingTop: 6,
            }}
          >
            {podiumOrder.map(({ rank, entry, height }) => (
              <div
                key={rank}
                style={{
                  width: 180, position: 'relative',
                  border: '1px solid ' + rankColor(rank),
                  background: rank === 1
                    ? 'rgba(255,182,39,0.06)'
                    : 'rgba(255,255,255,0.025)',
                  padding: '12px 12px 10px',
                  boxShadow: rank === 1 ? '0 0 12px rgba(255,182,39,0.25)' : 'none',
                }}
              >
                <span className="nd-reticle__c nd-reticle__c--tl" />
                <span className="nd-reticle__c nd-reticle__c--tr" />
                <span className="nd-reticle__c nd-reticle__c--bl" />
                <span className="nd-reticle__c nd-reticle__c--br" />

                <div
                  className="nd-mono"
                  style={{
                    position: 'absolute', top: -10, left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 10, color: '#000',
                    background: rankColor(rank),
                    padding: '2px 10px', letterSpacing: 2, fontWeight: 700,
                  }}
                >
                  #{rank}
                </div>

                <div
                  style={{
                    fontSize: 32, textAlign: 'center', lineHeight: 1,
                    color: rankColor(rank), fontWeight: 700,
                    textShadow: rank === 1 ? '0 0 12px var(--nd-gold)' : 'none',
                  }}
                  className="nd-mono"
                >
                  {rank === 1 ? '★' : rank === 2 ? '◆' : '▲'}
                </div>

                <div className="nd-hair" style={{ margin: '10px 0' }} />

                <div className="nd-mono" style={{ display: 'grid', gap: 4, fontSize: 10, letterSpacing: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--nd-dim)' }}>STAGE</span>
                    <span className="nd-tnum" style={{ color: '#fff', fontWeight: 700 }}>S{entry.stage}</span>
                  </div>
                  {entry.grade && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--nd-dim)' }}>GRADE</span>
                      <span style={{ color: gradeColor(entry.grade), fontWeight: 700 }}>{entry.grade}</span>
                    </div>
                  )}
                  {entry.time && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--nd-dim)' }}>TIME</span>
                      <span className="nd-tnum" style={{ color: 'var(--nd-amber)' }}>{formatTime(entry.time)}</span>
                    </div>
                  )}
                </div>

                {/* podium step */}
                <div
                  style={{
                    height: height,
                    marginTop: 10,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)',
                    borderTop: '1px solid ' + rankColor(rank),
                    position: 'relative',
                  }}
                >
                  <div
                    className="nd-mono"
                    style={{
                      position: 'absolute', bottom: 4, left: 0, right: 0,
                      textAlign: 'center', fontSize: 9, letterSpacing: 2,
                      color: 'var(--nd-dimmer)',
                    }}
                  >
                    {formatDate(entry.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* full table */}
      <div
        className="nd-panel relative"
        style={{ padding: '12px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-eyebrow" style={{ marginBottom: 8 }}>
          ◇ FULL RANKINGS · TOP {entries.length || 0}
        </div>

        {entries.length === 0 ? (
          <div
            className="nd-mono"
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--nd-dim)', fontSize: 11, letterSpacing: 2,
            }}
          >
            ◌ NO RECORDS · PLAY TO SUBMIT YOUR FIRST ENTRY
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
                <tr>
                  {['#', 'STAGE', 'GRADE', 'TIME', 'LIVES', 'DATE'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '8px',
                      borderBottom: '1px solid var(--nd-hair-strong)',
                      color: 'var(--nd-dimmer)', fontWeight: 500,
                      fontSize: 9, letterSpacing: 2,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const r = i + 1;
                  const isTop3 = r <= 3;
                  return (
                    <tr
                      key={i}
                      style={{
                        background: isTop3
                          ? `linear-gradient(90deg, rgba(255,255,255,0.04), transparent)`
                          : (i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent'),
                        borderLeft: isTop3 ? `2px solid ${rankColor(r)}` : '2px solid transparent',
                      }}
                    >
                      <td className="nd-tnum" style={{
                        padding: '8px', fontWeight: 700,
                        color: isTop3 ? rankColor(r) : 'var(--nd-dim)',
                      }}>
                        {r}
                      </td>
                      <td className="nd-tnum" style={{ padding: '8px', color: '#fff', fontWeight: 700 }}>
                        S{entry.stage}
                      </td>
                      <td style={{ padding: '8px', color: gradeColor(entry.grade), fontWeight: 700 }}>
                        {entry.grade || '-'}
                      </td>
                      <td className="nd-tnum" style={{ padding: '8px', color: 'var(--nd-amber)' }}>
                        {formatTime(entry.time)}
                      </td>
                      <td className="nd-tnum" style={{ padding: '8px', color: 'var(--nd-red-life)' }}>
                        {entry.lives != null ? '♥ ' + entry.lives : '-'}
                      </td>
                      <td className="nd-tnum" style={{ padding: '8px', color: 'var(--nd-dimmer)' }}>
                        {formatDate(entry.date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="nd-mono"
          style={{
            paddingTop: 10, marginTop: 10,
            borderTop: '1px solid var(--nd-hair)',
            fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2,
            display: 'flex', justifyContent: 'space-between',
          }}
        >
          <span>◇ LOCAL LEADERBOARD · MAX 10 PER MODE</span>
          <span>◷ AUTO-RECORD ON CLEAR</span>
        </div>
      </div>
    </div>
  );
};

window.Rank = Rank;
