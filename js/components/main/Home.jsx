// Neon Defense — Home page (T08)
// 홀로 프로젝션 챔버 + 미션 카드 + DEPLOY.
// HoloShell 안에 마운트되는 페이지.

const Home = ({
  saveInfo,
  onNewGame,
  onLoadGame,
  onSelectMode,
  metaProgress,
}) => {
  const { useState } = React;
  const [mission, setMission] = useState('campaign');

  const highestSector = metaProgress?.stats?.highestCampaignSector || 0;
  const nextSector = highestSector + 1;
  const sectorHpMult = (typeof calcSectorHpMultiplier !== 'undefined')
    ? calcSectorHpMultiplier(nextSector) : 1;

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${hh}:${mm}`;
  };

  const missions = [
    {
      id: 'campaign',
      code: '◇ CAMPAIGN',
      title: 'SECTOR ASCENT',
      desc: '3 STAGES × 10 WAVES · 매 웨이브 자동 저장',
      reward: 'CRYSTAL UP TO 200+',
      duration: '15-20 MIN',
      accent: 'var(--nd-crimson)',
      enabled: true,
    },
    {
      id: 'run',
      code: '◎ RUN MODE',
      title: 'ROGUELIKE RUN',
      desc: '랜덤 시드 · 영구 업그레이드 적용',
      reward: 'CRYSTAL VARIABLE',
      duration: '10-30 MIN',
      accent: 'var(--nd-amber)',
      enabled: true,
      badge: 'NEW',
    },
    {
      id: 'endless',
      code: '∞ ENDLESS',
      title: 'INFINITE TIDE',
      desc: '잠금 해제: SECTOR 5 클리어',
      reward: '???',
      duration: 'NO LIMIT',
      accent: 'var(--nd-dim)',
      enabled: false,
      badge: 'LOCKED',
    },
  ];

  const handleDeploy = (isContinue) => {
    if (mission === 'run') {
      onSelectMode && onSelectMode('run');
      return;
    }
    if (isContinue && saveInfo) onLoadGame();
    else onNewGame();
  };

  return (
    <div
      style={{
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 380px',
        gap: 16, height: '100%', minHeight: 0,
        alignItems: 'stretch',
      }}
    >
      {/* ─────────── LEFT · PROJECTION CHAMBER ─────────── */}
      <div
        className="nd-panel relative"
        style={{
          padding: 20,
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <div>
            <div className="nd-eyebrow">◇ HOLO PROJECTION · SECTOR PREVIEW</div>
            <div
              className="nd-mono"
              style={{
                fontSize: 24, color: '#fff', fontWeight: 700,
                letterSpacing: 2, marginTop: 4, lineHeight: 1.1,
              }}
            >
              SECTOR <span style={{ color: 'var(--nd-crimson)' }}>{nextSector}</span>
              <span style={{ color: 'var(--nd-dimmer)', margin: '0 10px', fontWeight: 200 }}>·</span>
              <span style={{ color: 'var(--nd-amber)', fontSize: 14 }}>HP ×{sectorHpMult.toFixed(2)}</span>
            </div>
          </div>
          <div
            className="nd-mono"
            style={{
              padding: '4px 10px', border: '1px solid var(--nd-hair-strong)',
              fontSize: 9, letterSpacing: 2, color: 'var(--nd-green)',
            }}
          >
            ◇ READY FOR DEPLOY
          </div>
        </div>

        {/* Tower visualization */}
        <div
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background:
              'radial-gradient(ellipse at center, rgba(255,61,110,0.06) 0%, transparent 60%), ' +
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 24px), ' +
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 24px)',
            border: '1px solid var(--nd-hair)',
            position: 'relative', minHeight: 0, padding: 16,
            overflow: 'auto',
          }}
        >
          {/* corner reticles inside chamber */}
          <span style={{ position: 'absolute', top: 6, left: 6, color: 'var(--nd-crimson)', fontSize: 10, letterSpacing: 2 }} className="nd-mono">▸ S{nextSector}</span>
          <span style={{ position: 'absolute', top: 6, right: 6, color: 'var(--nd-amber)', fontSize: 10, letterSpacing: 2 }} className="nd-mono">THREAT ▮▮▮▮▯</span>

          {typeof SectorTower !== 'undefined' && (
            <SectorTower highestSector={highestSector} />
          )}
        </div>

        {/* Stage stars row */}
        {typeof StarRating !== 'undefined' && typeof SPAWN !== 'undefined' && (
          <div style={{ marginTop: 12 }}>
            <div
              className="nd-mono"
              style={{
                fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2,
                marginBottom: 6, textAlign: 'center',
              }}
            >
              ◇ STAGE PROGRESS · {StarRating.totalStars()} / {SPAWN.maxStage * 3}
            </div>
            <div
              style={{
                display: 'grid', gap: 4,
                gridTemplateColumns: `repeat(${SPAWN.maxStage}, 1fr)`,
              }}
            >
              {Array.from({ length: SPAWN.maxStage }, (_, idx) => {
                const s = idx + 1;
                const stars = StarRating.getStars(s);
                const color = stars === 3 ? 'var(--nd-gold)' :
                              stars === 2 ? 'var(--nd-amber)' :
                              stars === 1 ? 'var(--nd-dim)' : 'var(--nd-dimmer)';
                return (
                  <div
                    key={s}
                    style={{
                      padding: '4px 0', textAlign: 'center',
                      border: '1px solid var(--nd-hair)',
                      background: 'rgba(255,255,255,0.015)',
                    }}
                  >
                    <div className="nd-mono" style={{ fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1 }}>S{s}</div>
                    <div style={{ fontSize: 11, color, fontWeight: 700 }}>
                      {stars === 3 ? '★★★' : stars === 2 ? '★★☆' : stars === 1 ? '★☆☆' : '☆☆☆'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────── RIGHT · MISSION SELECT + DEPLOY ─────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* Mission cards */}
        <div className="nd-panel relative" style={{ padding: '14px 14px 12px', flex: '0 0 auto' }}>
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />
          <div className="nd-eyebrow" style={{ marginBottom: 10 }}>◇ MISSION · 3 OPTIONS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {missions.map(m => {
              const active = mission === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => m.enabled && setMission(m.id)}
                  disabled={!m.enabled}
                  className="nd-mono"
                  style={{
                    position: 'relative',
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: active ? 'rgba(255,61,110,0.08)' : 'transparent',
                    border: '1px solid ' + (active ? m.accent : 'var(--nd-hair)'),
                    color: m.enabled ? '#fff' : 'var(--nd-dimmer)',
                    cursor: m.enabled ? 'pointer' : 'not-allowed',
                    opacity: m.enabled ? 1 : 0.5,
                    transition: 'border-color 0.12s, background 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (m.enabled && !active)
                      e.currentTarget.style.borderColor = m.accent;
                  }}
                  onMouseLeave={e => {
                    if (m.enabled && !active)
                      e.currentTarget.style.borderColor = 'var(--nd-hair)';
                  }}
                >
                  {m.badge && (
                    <span
                      style={{
                        position: 'absolute', top: -7, right: 10,
                        fontSize: 8, color: '#000',
                        background: m.id === 'endless' ? 'var(--nd-dim)' : m.accent,
                        padding: '1px 5px', letterSpacing: 1, fontWeight: 700,
                      }}
                    >
                      {m.badge}
                    </span>
                  )}
                  <div style={{
                    fontSize: 9, letterSpacing: 2,
                    color: active ? m.accent : 'var(--nd-dimmer)',
                    marginBottom: 4,
                  }}>
                    {m.code}
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, letterSpacing: 1,
                    marginBottom: 4,
                  }}>
                    {m.title}
                  </div>
                  <div style={{
                    fontSize: 10, letterSpacing: 0.5,
                    color: 'var(--nd-dim)', marginBottom: 6,
                    fontFamily: 'var(--nd-font-sans)',
                  }}>
                    {m.desc}
                  </div>
                  <div
                    className="nd-tnum"
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 9, letterSpacing: 1, color: 'var(--nd-dim)',
                    }}
                  >
                    <span>◷ {m.duration}</span>
                    <span style={{ color: m.enabled ? 'var(--nd-amber)' : 'var(--nd-dimmer)' }}>
                      ◆ {m.reward}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue (saved game) */}
        {saveInfo ? (
          <button
            onClick={() => handleDeploy(true)}
            className="nd-panel relative"
            style={{
              padding: '10px 14px', textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nd-amber)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nd-hair)'}
          >
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <div className="nd-eyebrow nd-eyebrow--amber" style={{ marginBottom: 4 }}>
              ◆ RESUME · LAST SESSION
            </div>
            <div
              className="nd-mono"
              style={{ fontSize: 14, color: '#fff', fontWeight: 700, letterSpacing: 1 }}
            >
              STAGE <span style={{ color: 'var(--nd-amber)' }}>{saveInfo.stage}</span>
              <span style={{ color: 'var(--nd-dimmer)', margin: '0 6px' }}>·</span>
              WAVE <span style={{ color: 'var(--nd-amber)' }}>{saveInfo.wave}</span>
            </div>
            <div
              className="nd-mono"
              style={{ fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1, marginTop: 2 }}
            >
              {formatDate(saveInfo.timestamp)}
              {typeof formatRelativeTime !== 'undefined' && (
                <> · {formatRelativeTime(saveInfo.timestamp)}</>
              )}
            </div>
          </button>
        ) : (
          <div
            className="nd-panel relative"
            style={{ padding: '10px 14px', opacity: 0.45 }}
          >
            <span className="nd-reticle__c nd-reticle__c--tl" />
            <span className="nd-reticle__c nd-reticle__c--tr" />
            <span className="nd-reticle__c nd-reticle__c--bl" />
            <span className="nd-reticle__c nd-reticle__c--br" />
            <div className="nd-eyebrow nd-eyebrow--dim">◌ NO CHECKPOINT</div>
            <div
              className="nd-mono"
              style={{ fontSize: 11, color: 'var(--nd-dim)', letterSpacing: 1, marginTop: 4 }}
            >
              새 게임으로 체크포인트를 생성합니다.
            </div>
          </div>
        )}

        {/* DEPLOY button */}
        <button
          onClick={() => handleDeploy(false)}
          className="nd-btn-deploy nd-mono"
          style={{
            padding: '14px 16px',
            fontSize: 13, letterSpacing: 3, fontWeight: 700,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <span>▸ DEPLOY · {missions.find(m => m.id === mission)?.code.replace(/^\S+\s/, '')}</span>
          <span style={{ fontSize: 16 }}>⟶</span>
        </button>
      </div>
    </div>
  );
};

window.Home = Home;
