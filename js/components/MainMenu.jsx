// Neon Defense — MainMenu (Holographic Command shell)
// Spec: design handoff v1.0 / Page B · Main 5-page split
//
// 5 nav tabs: HOME · META · RANK · CODEX · DAILY (preserves existing
// functionality — Codex/Daily still open modal-style content windows).
// Visual language: hairline panels, mono eyebrows, crimson active
// underline, reticle corners, no gradient washes.

const MainMenu = ({ saveInfo, onNewGame, onLoadGame, onSelectMode, metaProgress, neonCrystals, onPurchaseUpgrade, onDailyLoginReward }) => {
  const { useState, useEffect } = React;

  const [showCollection, setShowCollection] = useState(false);
  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home | meta | rank
  const [selectedMode, setSelectedMode] = useState('campaign');

  const dailyStatus = typeof DailyLogin !== 'undefined' ? DailyLogin.getStatus() : { canClaim: false };

  // 첫 진입 시 오늘 보상 있으면 자동 오픈 (한 번만)
  useEffect(() => {
    if (dailyStatus.canClaim && !showDailyLogin) {
      const opened = sessionStorage.getItem('__dailyLoginOpened');
      if (!opened) {
        sessionStorage.setItem('__dailyLoginOpened', '1');
        setShowDailyLogin(true);
      }
    }
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handleStartGame = (isNewGame) => {
    if (isNewGame) onNewGame();
    else onLoadGame();
  };

  const codexCompletion = (typeof CollectionSystem !== 'undefined')
    ? CollectionSystem.getCompletion() : null;
  const achievementProgress = (typeof AchievementSystem !== 'undefined')
    ? AchievementSystem.getProgress() : { unlocked: 0, total: 0 };
  const crystals = (neonCrystals ?? metaProgress?.crystals) || 0;
  const highestFloor = metaProgress?.stats?.highestCampaignFloor || 0;
  const nextFloor = highestFloor + 1;

  // ─────────── nav tabs ───────────
  const navTabs = [
    { k: 'home',  code: '◇ HOME',   label: '시작' },
    { k: 'meta',  code: '◆ META',   label: '업그레이드',
      badge: crystals > 0 ? crystals.toLocaleString() : null },
    { k: 'rank',  code: '▲ RANK',   label: '순위' },
    { k: 'codex', code: '◈ CODEX',  label: '도감',
      badge: codexCompletion?.unlocked > 0 ? `${codexCompletion.percent}%` : null,
      onClick: () => setShowCollection(true) },
    { k: 'daily', code: '☼ DAILY',  label: '출석',
      dot: dailyStatus.canClaim,
      onClick: () => setShowDailyLogin(true) },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: 'var(--nd-bg)',
        fontFamily: 'var(--nd-font-sans)',
        color: 'var(--nd-text)',
      }}
    >
      {/* ambient grid background — subtle, doesn't compete with content */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div
        className="relative w-full mx-4 flex flex-col"
        style={{ maxWidth: 1100, height: 'min(94vh, 880px)' }}
      >
        {/* ─────────── TOP OPS BAR ─────────── */}
        <div
          className="nd-panel"
          style={{
            display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12,
            padding: '8px 14px', alignItems: 'center', minHeight: 44,
            marginBottom: 10,
          }}
        >
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          <div className="flex items-center" style={{ gap: 10 }}>
            <span className="nd-eyebrow" style={{ letterSpacing: 2 }}>◇</span>
            <span className="nd-mono" style={{ fontSize: 10, color: 'var(--nd-dimmer)', letterSpacing: 2 }}>
              NEON DEFENSE
            </span>
            <span style={{ color: 'rgba(255,61,110,0.4)' }}>/</span>
            <span className="nd-mono" style={{ fontSize: 10, color: '#fff', letterSpacing: 2, fontWeight: 700 }}>
              {(navTabs.find(t => t.k === activeTab)?.code || '◇ HOME').replace(/^[^A-Z]+/, '')}
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 14 }}>
            <span className="nd-mono nd-tnum" style={{ fontSize: 10, color: 'var(--nd-gold)', letterSpacing: 1.5 }}>
              ◆ <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>{crystals.toLocaleString()}</span>
            </span>
            <span className="nd-hair--vertical" style={{ width: 1, height: 14, background: 'var(--nd-hair-strong)' }} />
            <span className="nd-mono nd-tnum" style={{ fontSize: 10, color: 'var(--nd-amber)', letterSpacing: 1.5 }}>
              ✕ <span style={{ color: '#fff', fontWeight: 700, marginLeft: 4 }}>
                {achievementProgress.unlocked}/{achievementProgress.total}
              </span>
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{
              width: 6, height: 6, background: 'var(--nd-green)',
              boxShadow: '0 0 6px var(--nd-green)', display: 'inline-block',
            }} />
            <span className="nd-mono" style={{ fontSize: 10, color: 'var(--nd-green)', letterSpacing: 2 }}>
              CMDR · STANDBY
            </span>
          </div>
        </div>

        {/* ─────────── TITLE BLOCK ─────────── */}
        <div className="text-center shrink-0" style={{ padding: '8px 0 12px' }}>
          <div className="nd-main-eyebrow" style={{ marginBottom: 8 }}>
            ◇ HOLOGRAPHIC COMMAND · v1.0
          </div>
          <h1 className="nd-main-title" style={{ fontSize: 'clamp(36px, 5.5vw, 52px)' }}>
            NEON <span className="nd-main-title__accent">DEFENSE</span>
          </h1>
          <p
            className="nd-mono"
            style={{
              color: 'var(--nd-dim)', fontSize: 10, letterSpacing: 3,
              marginTop: 8, textTransform: 'uppercase',
            }}
          >
            ▲ TOWER-CLIMBING DEFENSE · ROGUELIKE
          </p>
          {highestFloor > 0 && (
            <p
              className="nd-mono nd-tnum"
              style={{ color: 'var(--nd-amber)', fontSize: 11, letterSpacing: 1.5, marginTop: 8 }}
            >
              ◈ HIGHEST <span style={{ color: '#fff', fontWeight: 700 }}>F{highestFloor}</span>
              <span style={{ color: 'var(--nd-dimmer)', margin: '0 8px' }}>·</span>
              NEXT <span style={{ color: '#fff', fontWeight: 700 }}>F{nextFloor}</span>
              <span style={{ color: 'var(--nd-dim)' }}> (HP ×{calcFloorHpMultiplier(nextFloor).toFixed(2)})</span>
            </p>
          )}
        </div>

        {/* ─────────── SECONDARY NAV (5 tabs) ─────────── */}
        <div
          className="nd-panel shrink-0"
          style={{
            display: 'flex', overflow: 'hidden', height: 40, padding: 0,
            marginBottom: 10, position: 'relative',
          }}
        >
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />

          {navTabs.map((t, i) => {
            const isActive = activeTab === t.k && !t.onClick;
            return (
              <button
                key={t.k}
                onClick={() => t.onClick ? t.onClick() : setActiveTab(t.k)}
                className="nd-mono"
                style={{
                  flex: 1, padding: '0 12px', textAlign: 'center', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: isActive ? 'rgba(255,61,110,0.12)' : 'transparent',
                  borderRight: i < navTabs.length - 1 ? '1px solid rgba(255,61,110,0.15)' : 'none',
                  borderBottom: isActive ? '2px solid var(--nd-crimson)' : '2px solid transparent',
                  color: isActive ? '#fff' : 'var(--nd-dim)',
                  fontSize: 10, letterSpacing: 2, fontWeight: 700,
                  textShadow: isActive ? '0 0 8px var(--nd-crimson)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {t.code}
                {t.badge && (
                  <span
                    className="nd-tnum"
                    style={{
                      fontSize: 9, color: isActive ? 'var(--nd-amber)' : 'var(--nd-dimmer)',
                      letterSpacing: 1, fontWeight: 500,
                    }}
                  >
                    · {t.badge}
                  </span>
                )}
                {t.dot && (
                  <span
                    className="nd-motion-pulse"
                    style={{
                      position: 'absolute', top: 8, right: 12,
                      width: 6, height: 6, background: 'var(--nd-crimson)',
                      boxShadow: '0 0 6px var(--nd-crimson)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────── TAB CONTENT (scrollable) ─────────── */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ paddingRight: 2 }}>

          {/* ===== HOME ===== */}
          {activeTab === 'home' && (
            <div className="space-y-3 pb-2">
              {/* New game / Continue cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* NEW GAME */}
                <button
                  onClick={() => handleStartGame(true)}
                  className="nd-panel group relative"
                  style={{
                    padding: 20, textAlign: 'left', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    background: 'var(--nd-panel)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nd-crimson)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nd-hair)'}
                >
                  <span className="nd-reticle__c nd-reticle__c--tl" />
                  <span className="nd-reticle__c nd-reticle__c--tr" />
                  <span className="nd-reticle__c nd-reticle__c--bl" />
                  <span className="nd-reticle__c nd-reticle__c--br" />

                  <div
                    className="nd-mono"
                    style={{
                      position: 'absolute', top: 12, right: 14,
                      fontSize: 9, color: 'var(--nd-green)', letterSpacing: 2,
                      padding: '2px 8px', border: '1px solid rgba(128,237,153,0.4)',
                    }}
                  >
                    NEW
                  </div>

                  <div className="nd-eyebrow" style={{ marginBottom: 8 }}>◇ DEPLOY · CAMPAIGN</div>
                  <div
                    className="nd-mono"
                    style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: 2, lineHeight: 1.1 }}
                  >
                    FLOOR <span style={{ color: 'var(--nd-crimson)' }}>{nextFloor}</span>
                  </div>
                  <div
                    className="nd-mono nd-tnum"
                    style={{ fontSize: 11, color: 'var(--nd-dim)', letterSpacing: 1, marginTop: 6 }}
                  >
                    HP ×{calcFloorHpMultiplier(nextFloor).toFixed(2)} · 3 STAGES × 10 WAVES
                  </div>

                  {typeof FloorTower !== 'undefined' && (
                    <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
                      <FloorTower highestFloor={highestFloor} />
                    </div>
                  )}

                  <div className="nd-hair" style={{ margin: '14px 0' }} />

                  <div
                    className="nd-mono"
                    style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, fontSize: 11, letterSpacing: 1 }}
                  >
                    <span style={{ color: 'var(--nd-dim)' }}>◷ DURATION</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>15-20 MIN</span>
                    <span style={{ color: 'var(--nd-dim)' }}>◆ CRYSTAL REWARD</span>
                    <span style={{ color: 'var(--nd-amber)', fontWeight: 700 }}>UP TO 200+</span>
                    <span style={{ color: 'var(--nd-dim)' }}>▣ CHECKPOINT</span>
                    <span style={{ color: 'var(--nd-green)', fontWeight: 700 }}>EVERY WAVE</span>
                    {typeof StarRating !== 'undefined' && (() => {
                      const total = StarRating.totalStars();
                      const max = SPAWN.maxStage * 3;
                      return (
                        <>
                          <span style={{ color: 'var(--nd-dim)' }}>★ STAR PROGRESS</span>
                          <span className="nd-tnum" style={{ color: 'var(--nd-gold)', fontWeight: 700 }}>{total} / {max}</span>
                        </>
                      );
                    })()}
                  </div>

                  {/* per-stage star grid */}
                  {typeof StarRating !== 'undefined' && (
                    <div style={{ marginTop: 14 }}>
                      <div
                        className="nd-mono"
                        style={{ fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2, marginBottom: 6, textAlign: 'center' }}
                      >
                        ◇ STAGE PROGRESS
                      </div>
                      <div
                        style={{ display: 'grid', gap: 4,
                          gridTemplateColumns: `repeat(${Math.min(SPAWN.maxStage, 6)}, 1fr)` }}
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
                              <div style={{ fontSize: 12, color, fontWeight: 700 }}>
                                {stars === 3 ? '★★★' : stars === 2 ? '★★☆' : stars === 1 ? '★☆☆' : '☆☆☆'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    className="nd-mono"
                    style={{
                      marginTop: 14, fontSize: 9, color: 'var(--nd-dimmer)',
                      letterSpacing: 1.5, textAlign: 'center',
                    }}
                  >
                    ◇ AUTO-SAVE ENABLED · EXIT ANYTIME
                  </div>
                </button>

                {/* CONTINUE */}
                {saveInfo ? (
                  <button
                    onClick={() => handleStartGame(false)}
                    className="nd-panel relative"
                    style={{
                      padding: 20, textAlign: 'left', cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--nd-amber)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--nd-hair)'}
                  >
                    <span className="nd-reticle__c nd-reticle__c--tl" />
                    <span className="nd-reticle__c nd-reticle__c--tr" />
                    <span className="nd-reticle__c nd-reticle__c--bl" />
                    <span className="nd-reticle__c nd-reticle__c--br" />

                    <div
                      className="nd-mono"
                      style={{
                        position: 'absolute', top: 12, right: 14,
                        fontSize: 9, color: 'var(--nd-amber)', letterSpacing: 2,
                        padding: '2px 8px', border: '1px solid rgba(255,169,77,0.4)',
                      }}
                    >
                      SAVED
                    </div>

                    <div className="nd-eyebrow nd-eyebrow--amber" style={{ marginBottom: 8 }}>◆ RESUME · LAST SESSION</div>
                    <div
                      className="nd-mono"
                      style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1, lineHeight: 1.2 }}
                    >
                      STAGE <span style={{ color: 'var(--nd-amber)' }}>{saveInfo.stage}</span>
                      <span style={{ color: 'var(--nd-dimmer)', margin: '0 8px' }}>·</span>
                      WAVE <span style={{ color: 'var(--nd-amber)' }}>{saveInfo.wave}</span>
                    </div>
                    <div
                      className="nd-mono"
                      style={{ fontSize: 10, color: 'var(--nd-dim)', letterSpacing: 1, marginTop: 4 }}
                    >
                      {formatDate(saveInfo.timestamp)} · {formatRelativeTime(saveInfo.timestamp)}
                    </div>

                    <div className="nd-hair" style={{ margin: '14px 0' }} />

                    <div
                      className="grid grid-cols-2 gap-2 nd-mono nd-tnum"
                      style={{ fontSize: 11, letterSpacing: 0.5 }}
                    >
                      {[
                        { lbl: '◆ GOLD',    val: `${saveInfo.gold}`,         c: 'var(--nd-gold)' },
                        { lbl: '♥ LIVES',   val: `${saveInfo.lives}`,        c: 'var(--nd-red-life)' },
                        { lbl: '▲ TOWERS',  val: `${saveInfo.towerCount}`,   c: 'var(--nd-crimson)' },
                        { lbl: '◇ SUPPORT', val: `${saveInfo.supportCount}`, c: 'var(--nd-green)' },
                      ].map(s => (
                        <div
                          key={s.lbl}
                          style={{
                            padding: '6px 10px', border: '1px solid var(--nd-hair)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <span style={{ color: s.c }}>{s.lbl}</span>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{s.val}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div
                        className="nd-mono"
                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 1.5, marginBottom: 4 }}
                      >
                        <span>CAMPAIGN PROGRESS</span>
                        <span className="nd-tnum">{Math.round((saveInfo.stage / SPAWN.maxStage) * 100)}%</span>
                      </div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{
                          height: '100%',
                          width: `${(saveInfo.stage / SPAWN.maxStage) * 100}%`,
                          background: 'var(--nd-amber)',
                          boxShadow: '0 0 6px var(--nd-amber)',
                        }} />
                      </div>
                    </div>

                    <div
                      className="nd-mono"
                      style={{
                        marginTop: 14, fontSize: 9, color: 'var(--nd-dimmer)',
                        letterSpacing: 1.5, textAlign: 'center',
                      }}
                    >
                      ▸ RESUME FROM CHECKPOINT
                    </div>
                  </button>
                ) : (
                  <div
                    className="nd-panel relative"
                    style={{ padding: 20, opacity: 0.45 }}
                  >
                    <span className="nd-reticle__c nd-reticle__c--tl" />
                    <span className="nd-reticle__c nd-reticle__c--tr" />
                    <span className="nd-reticle__c nd-reticle__c--bl" />
                    <span className="nd-reticle__c nd-reticle__c--br" />
                    <div className="nd-eyebrow nd-eyebrow--dim" style={{ marginBottom: 8 }}>◌ NO SAVE DATA</div>
                    <div
                      className="nd-mono"
                      style={{ fontSize: 14, color: 'var(--nd-dim)', letterSpacing: 1, lineHeight: 1.6 }}
                    >
                      START A NEW GAME<br />TO CREATE A CHECKPOINT.
                    </div>
                    <div className="nd-hair" style={{ margin: '18px 0' }} />
                    <div
                      className="nd-mono"
                      style={{ fontSize: 10, color: 'var(--nd-dimmer)', letterSpacing: 1.5, textAlign: 'center' }}
                    >
                      ◇ AUTO-SAVE ON WAVE START
                    </div>
                  </div>
                )}
              </div>

              {/* MODE SELECT */}
              <div className="nd-panel relative" style={{ padding: '12px 14px' }}>
                <span className="nd-reticle__c nd-reticle__c--tl" />
                <span className="nd-reticle__c nd-reticle__c--tr" />
                <span className="nd-reticle__c nd-reticle__c--bl" />
                <span className="nd-reticle__c nd-reticle__c--br" />
                <div className="flex items-center gap-3">
                  <span
                    className="nd-eyebrow"
                    style={{ color: 'var(--nd-dim)', fontSize: 9, letterSpacing: 3 }}
                  >
                    ◇ MODE
                  </span>
                  <div className="flex" style={{ gap: 6, flex: 1 }}>
                    <button
                      onClick={() => setSelectedMode('campaign')}
                      className="nd-mono"
                      style={{
                        padding: '6px 14px', cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                        background: selectedMode === 'campaign' ? 'rgba(255,61,110,0.15)' : 'transparent',
                        border: '1px solid ' + (selectedMode === 'campaign' ? 'var(--nd-crimson)' : 'var(--nd-hair)'),
                        color: selectedMode === 'campaign' ? '#fff' : 'var(--nd-dim)',
                      }}
                    >
                      ▣ CAMPAIGN
                    </button>
                    <button
                      onClick={() => { setSelectedMode('run'); onSelectMode && onSelectMode('run'); }}
                      className="nd-mono relative"
                      style={{
                        padding: '6px 14px', cursor: 'pointer', fontSize: 11, letterSpacing: 1.5,
                        background: selectedMode === 'run' ? 'rgba(255,169,77,0.15)' : 'transparent',
                        border: '1px solid ' + (selectedMode === 'run' ? 'var(--nd-amber)' : 'var(--nd-hair)'),
                        color: selectedMode === 'run' ? '#fff' : 'var(--nd-dim)',
                      }}
                    >
                      ◎ RUN MODE
                      <span
                        className="nd-mono"
                        style={{
                          position: 'absolute', top: -7, right: -7,
                          fontSize: 8, color: '#000', background: 'var(--nd-amber)',
                          padding: '1px 4px', letterSpacing: 1, fontWeight: 700,
                        }}
                      >
                        NEW
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* INFO TILES */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { lbl: 'DIFFICULTY', val: 'STANDARD', c: 'var(--nd-crimson)' },
                  { lbl: 'TOWERS',     val: '24',       c: 'var(--nd-el-water)' },
                  { lbl: 'ENEMIES',    val: '8',        c: 'var(--nd-red-life)' },
                  { lbl: 'META',       val: 'BUFFS',    c: 'var(--nd-green)' },
                ].map(t => (
                  <div key={t.lbl} className="nd-panel relative" style={{ padding: '10px 12px', textAlign: 'left' }}>
                    <div
                      className="nd-mono"
                      style={{ fontSize: 9, color: 'var(--nd-dim)', letterSpacing: 2 }}
                    >
                      ◇ {t.lbl}
                    </div>
                    <div
                      className="nd-mono nd-tnum"
                      style={{ fontSize: 16, color: t.c, fontWeight: 700, marginTop: 4, letterSpacing: 1 }}
                    >
                      {t.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== META (UPGRADE) ===== */}
          {activeTab === 'meta' && (
            <div className="space-y-3 pb-2">
              <div className="nd-panel relative" style={{ padding: '14px 18px' }}>
                <span className="nd-reticle__c nd-reticle__c--tl" />
                <span className="nd-reticle__c nd-reticle__c--tr" />
                <span className="nd-reticle__c nd-reticle__c--bl" />
                <span className="nd-reticle__c nd-reticle__c--br" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="nd-eyebrow nd-eyebrow--gold">◆ NEON CRYSTAL · BALANCE</div>
                    <div
                      className="nd-mono nd-tnum"
                      style={{ fontSize: 28, color: '#fff', fontWeight: 700, letterSpacing: 2, marginTop: 2 }}
                    >
                      {crystals.toLocaleString()}
                    </div>
                  </div>
                  <div
                    className="nd-mono"
                    style={{ fontSize: 10, color: 'var(--nd-dim)', textAlign: 'right', letterSpacing: 1, lineHeight: 1.7 }}
                  >
                    SHARED ACROSS CAMPAIGN &amp; RUN<br />
                    <span style={{ color: 'var(--nd-amber)' }}>EARN ON CLEAR / FLOOR PROGRESSION</span>
                  </div>
                </div>
              </div>
              {metaProgress && onPurchaseUpgrade ? (
                <MetaUpgradePanel
                  metaProgress={metaProgress}
                  neonCrystals={crystals}
                  onPurchaseUpgrade={onPurchaseUpgrade}
                />
              ) : (
                <div
                  className="nd-mono"
                  style={{ textAlign: 'center', color: 'var(--nd-dim)', padding: 32, letterSpacing: 1 }}
                >
                  ◷ LOADING UPGRADE DATA…
                </div>
              )}
            </div>
          )}

          {/* ===== RANK ===== */}
          {activeTab === 'rank' && (
            <div className="space-y-3 pb-2">
              <div className="nd-panel relative" style={{ padding: '14px 18px' }}>
                <span className="nd-reticle__c nd-reticle__c--tl" />
                <span className="nd-reticle__c nd-reticle__c--tr" />
                <span className="nd-reticle__c nd-reticle__c--bl" />
                <span className="nd-reticle__c nd-reticle__c--br" />
                <div className="nd-eyebrow nd-eyebrow--amber">▲ LEADERBOARD · GLOBAL</div>
                <div
                  className="nd-mono"
                  style={{
                    fontSize: 22, color: '#fff', fontWeight: 200, letterSpacing: 4,
                    marginTop: 2, fontFamily: 'var(--nd-font-sans)',
                  }}
                >
                  RANKING
                </div>
                <div className="nd-hair" style={{ margin: '12px 0' }} />
                <LeaderboardTab initialMode="campaign" />
              </div>
            </div>
          )}

        </div>

        {/* ─────────── BOTTOM FOOTER ─────────── */}
        <div
          className="shrink-0 nd-mono relative"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 14px', marginTop: 10, borderTop: '1px solid var(--nd-hair-strong)',
            fontSize: 9, color: 'var(--nd-dimmer)', letterSpacing: 2,
          }}
        >
          <span style={{ color: 'var(--nd-crimson)' }}>NEON DEFENSE</span>
          <span>HOLOGRAPHIC COMMAND · v1.1</span>
          <span>BUILD · {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</span>
        </div>

      </div>

      {showCollection && typeof CollectionModal !== 'undefined' && (
        <CollectionModal isOpen={showCollection} onClose={() => setShowCollection(false)} />
      )}
      {showDailyLogin && typeof DailyLoginModal !== 'undefined' && (
        <DailyLoginModal
          isOpen={showDailyLogin}
          onClose={() => setShowDailyLogin(false)}
          onClaim={onDailyLoginReward}
        />
      )}
    </div>
  );
};

window.MainMenu = MainMenu;
