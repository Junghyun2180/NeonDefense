// Neon Defense - 런 모드 메뉴 (Holographic Command 디자인 적용)
// 모드 선택 / 메타 업그레이드 / 업적 탭

const RunModeMenu = ({
  metaProgress,
  neonCrystals,
  onStartRun,
  onBack,
  activeRunInfo,
  onLoadRun,
  onShowOptions,
}) => {
  const { useState } = React;
  const [tab, setTab] = useState('modes'); // 'modes' | 'achievements'

  const dailyAttempted = typeof RunSaveSystem !== 'undefined' && RunSaveSystem.hasAttemptedToday();
  const dailyModifiers = typeof DailyChallenge !== 'undefined'
    ? DailyChallenge.getModifiers(DailyChallenge.getTodaySeed())
    : [];

  const achievementData = typeof AchievementSystem !== 'undefined'
    ? AchievementSystem.getUnlocked()
    : {};

  const tabs = [
    { id: 'modes', glyph: '◆', label: 'MODES' },
    { id: 'achievements', glyph: '◇', label: 'ACHIEVEMENTS' },
  ];

  const stats = metaProgress?.stats || {};

  return (
    <div className="nd-overlay">
      <div className="nd-overlay__grid" aria-hidden="true" />

      <div className="nd-modal nd-modal--lg" role="dialog" aria-label="Run Mode">
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        {/* Top bar */}
        <div className="nd-modal__top">
          <button type="button" onClick={onBack} className="nd-modal__back">← MAIN</button>

          <div className="nd-modal__title" style={{ alignItems: 'center', flex: 1 }}>
            <span className="nd-modal__title-eyebrow">◇ DEPLOYMENT REGISTRY</span>
            <span className="nd-modal__title-text">RUN MODE</span>
          </div>

          <div className="nd-modal__top-tools">
            <div className="nd-modal__chip nd-modal__chip--gold" title="Neon Crystals">
              <span style={{ color: 'var(--nd-gold)' }}>◆</span>
              <strong>{neonCrystals.toLocaleString()}</strong>
            </div>
            {onShowOptions && (
              <button
                type="button"
                onClick={onShowOptions}
                className="nd-modal__close"
                title={typeof I18n !== 'undefined' ? I18n.t('options.open') : '옵션 열기'}
                aria-label={typeof I18n !== 'undefined' ? I18n.t('options.open') : '옵션 열기'}
              >
                ⚙
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav className="nd-modal__tabs" aria-label="Run mode tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={'nd-modal__tab' + (tab === t.id ? ' nd-modal__tab--active' : '')}
            >
              <span>{t.glyph}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Body */}
        <div className="nd-modal__body">
          {tab === 'modes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeRunInfo && (
                <div className="nd-active-run">
                  <div className="nd-active-run__lead">
                    <div className="nd-active-run__label">◆ ACTIVE RUN</div>
                    <div className="nd-active-run__title">
                      STAGE {activeRunInfo.stage} · WAVE {activeRunInfo.wave}
                    </div>
                    <div className="nd-active-run__meta">
                      G {activeRunInfo.gold} · LIFE {activeRunInfo.lives} · TWR {activeRunInfo.towerCount}
                    </div>
                  </div>
                  <button type="button" onClick={onLoadRun} className="nd-btn-deploy">
                    ▸ RESUME
                  </button>
                </div>
              )}

              <ModeCardGrid
                onStartRun={onStartRun}
                metaProgress={metaProgress}
                dailyAttempted={dailyAttempted}
                dailyModifiers={dailyModifiers}
              />

              <div className="nd-stat-strip">
                <StatCell label="TOTAL RUNS" value={stats.totalRuns || 0} />
                <StatCell label="CLEARS" value={stats.totalClears || 0} accent="var(--nd-green)" />
                <StatCell label="BEST GRADE" value={stats.bestGrade || '—'} accent="var(--nd-gold)" />
                <StatCell
                  label="CRYSTALS EARNED"
                  value={(stats.totalCrystalsEarned || 0).toLocaleString()}
                  accent="var(--nd-amber)"
                />
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <AchievementTab unlocked={achievementData} />
          )}
        </div>
      </div>
    </div>
  );
};

const StatCell = ({ label, value, accent }) => (
  <div className="nd-stat-cell">
    <div className="nd-stat-cell__lbl">{label}</div>
    <div className="nd-stat-cell__val" style={accent ? { color: accent } : undefined}>{value}</div>
  </div>
);

const ModeCardGrid = ({ onStartRun, metaProgress, dailyAttempted, dailyModifiers }) => {
  const stats = metaProgress?.stats || {};
  const dailyMods = (dailyModifiers || []).map(modId => {
    const mod = (typeof DAILY_MODIFIERS !== 'undefined') ? DAILY_MODIFIERS[modId] : null;
    return mod ? mod.name : null;
  }).filter(Boolean);

  return (
    <div className="nd-mode-grid">
      <ModeCard
        accent="var(--nd-amber)"
        glyph="▲"
        code="RSH-03"
        title="RUSH"
        sub="3 STG · 3 WAVE · 5–8 MIN"
        rows={[
          { lbl: 'REWARD', val: '◆ 25+', accent: 'var(--nd-gold)' },
          { lbl: 'TIER', val: '★★☆☆☆', accent: 'var(--nd-amber)' },
          { lbl: 'PROFILE', val: 'CASUAL · FAST', accent: 'var(--nd-text)' },
        ]}
        onClick={() => onStartRun('rush')}
      />

      <ModeCard
        accent="var(--nd-crimson)"
        glyph="◆"
        code="STD-05"
        title="STANDARD"
        sub="5 STG · 5 WAVE · STD MAP"
        rows={[
          { lbl: 'REWARD', val: '◆ 50+', accent: 'var(--nd-gold)' },
          { lbl: 'TIER', val: '★★★☆☆', accent: 'var(--nd-crimson)' },
          { lbl: 'FAILURE', val: 'LEAK > 70', accent: 'var(--nd-red-life)' },
        ]}
        onClick={() => onStartRun('standard')}
      />

      <ModeCard
        accent="var(--nd-el-dark)"
        glyph="◇"
        code="DLY-01"
        title="DAILY CHALLENGE"
        sub={dailyAttempted ? 'COMPLETED · TRY TOMORROW' : 'TODAY ONLY · SPECIAL RULE'}
        rows={[
          dailyMods[0] ? { lbl: 'MOD-1', val: dailyMods[0], accent: 'var(--nd-el-dark)' } : null,
          dailyMods[1] ? { lbl: 'MOD-2', val: dailyMods[1], accent: 'var(--nd-el-dark)' } : null,
          { lbl: 'REWARD', val: '◆ 100+', accent: 'var(--nd-gold)' },
        ].filter(Boolean)}
        disabled={dailyAttempted}
        onClick={() => !dailyAttempted && onStartRun('daily', dailyModifiers)}
      />

      <ModeCard
        accent="var(--nd-red-life)"
        glyph="∞"
        code="END-∞"
        title="ENDLESS"
        sub="UNBOUND WAVES"
        rows={[
          { lbl: 'BEST', val: `STG ${stats.highestEndlessStage || 0}`, accent: 'var(--nd-red-life)' },
          { lbl: 'REWARD', val: '◆ 10 / STG', accent: 'var(--nd-gold)' },
          { lbl: 'TIER', val: '★★★★☆', accent: 'var(--nd-red-life)' },
        ]}
        onClick={() => onStartRun('endless')}
      />

      <ModeCard
        accent="var(--nd-gold)"
        glyph="◇"
        code="BSS-RSH"
        title="BOSS RUSH"
        sub="BOSS WAVES · LIMITED RES"
        rows={[
          { lbl: 'REWARD', val: '◆ 15 / BOSS', accent: 'var(--nd-gold)' },
          { lbl: 'BONUS', val: 'FREE DRAW', accent: 'var(--nd-amber)' },
          { lbl: 'TIER', val: '★★★★☆', accent: 'var(--nd-red-life)' },
        ]}
        onClick={() => onStartRun('bossRush')}
      />
    </div>
  );
};

const ModeCard = ({ accent, glyph, code, title, sub, rows, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="nd-mode-card"
    style={{ color: accent }}
  >
    <span className="nd-reticle__c nd-reticle__c--tl" style={{ borderColor: accent }} />
    <span className="nd-reticle__c nd-reticle__c--tr" style={{ borderColor: accent }} />
    <span className="nd-reticle__c nd-reticle__c--bl" style={{ borderColor: accent }} />
    <span className="nd-reticle__c nd-reticle__c--br" style={{ borderColor: accent }} />

    <div className="nd-mode-card__head">
      <span className="nd-mode-card__glyph" style={{ color: accent }}>{glyph}</span>
      <span className="nd-mode-card__code">{code}</span>
    </div>
    <div className="nd-mode-card__title">{title}</div>
    <div className="nd-mode-card__sub">{sub}</div>

    <div className="nd-mode-card__rows">
      {rows.map((r, i) => (
        <div key={i} className="nd-mode-card__row">
          <span>{r.lbl}</span>
          <em style={{ color: r.accent || 'var(--nd-text)' }}>{r.val}</em>
        </div>
      ))}
    </div>
  </button>
);

const AchievementTab = ({ unlocked }) => {
  const achievements = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : {};
  const achievementList = Object.values(achievements);

  if (achievementList.length === 0) {
    return (
      <div
        className="nd-mono"
        style={{
          textAlign: 'center',
          color: 'var(--nd-dim)',
          padding: '32px 0',
          fontSize: 11,
          letterSpacing: 2,
        }}
      >
        ACHIEVEMENT SYSTEM · STANDBY
      </div>
    );
  }

  return (
    <div className="nd-achv-grid">
      {achievementList.map(ach => {
        const isUnlocked = unlocked && unlocked[ach.id];
        return (
          <div
            key={ach.id}
            className={'nd-achv' + (isUnlocked ? ' nd-achv--unlocked' : '')}
          >
            <div className="nd-achv__icon">{isUnlocked ? ach.icon : '◇'}</div>
            <div className="nd-achv__name">{ach.name}</div>
            <div className="nd-achv__desc">{ach.desc}</div>
          </div>
        );
      })}
    </div>
  );
};

window.RunModeMenu = RunModeMenu;
