// OptionsModal - language and play-assist settings
const OptionsModal = ({
  isOpen,
  onClose,
  language = 'ko',
  setLanguage,
  autoCombine,
  setAutoCombine,
  autoSupportCombine,
  setAutoSupportCombine,
  autoNextWave,
  setAutoNextWave,
  maxGameSpeed,
  setMaxGameSpeed,
}) => {
  if (!isOpen) return null;

  const t = (key, values) => (typeof I18n !== 'undefined' ? I18n.t(key, values) : key);
  const rowStyle = {
    padding: '12px 0',
    borderBottom: '1px solid var(--nd-hair)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  };
  const labelStyle = {
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
  };
  const hintStyle = {
    color: 'var(--nd-dim)',
    fontSize: 10,
    marginTop: 3,
    lineHeight: 1.45,
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange && onChange(!checked)}
      className="nd-mono"
      style={{
        minWidth: 70,
        padding: '7px 10px',
        border: '1px solid ' + (checked ? 'var(--nd-amber)' : 'var(--nd-hair-strong)'),
        background: checked ? 'rgba(255,169,77,0.15)' : 'rgba(255,255,255,0.03)',
        color: checked ? 'var(--nd-amber)' : 'var(--nd-dim)',
        fontSize: 10,
        letterSpacing: 1.5,
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {checked ? t('options.on') : t('options.off')}
    </button>
  );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 10000, background: 'rgba(8,8,10,0.78)', padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose && onClose()}
    >
      <div
        className="nd-panel nd-panel-strong"
        style={{
          width: 'min(520px, 100%)',
          background: 'var(--nd-bg-2)',
          padding: 20,
          fontFamily: 'var(--nd-font-sans)',
        }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div className="nd-eyebrow nd-eyebrow--amber" style={{ marginBottom: 6 }}>
              ◇ {t('options.title')}
            </div>
            <div style={{ color: 'var(--nd-dim)', fontSize: 12 }}>
              {t('options.subtitle')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('options.close')}
            className="nd-mono"
            style={{
              background: 'transparent',
              border: '1px solid var(--nd-hair-strong)',
              color: 'var(--nd-text)',
              width: 32,
              height: 32,
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>{t('options.language')}</div>
              <div style={hintStyle}>{t('options.languageHelp')}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {[
                { id: 'ko', label: t('options.language.ko') },
                { id: 'en', label: t('options.language.en') },
              ].map(opt => {
                const active = language === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLanguage && setLanguage(opt.id)}
                    className="nd-mono"
                    style={{
                      padding: '7px 10px',
                      border: '1px solid ' + (active ? 'var(--nd-crimson)' : 'var(--nd-hair)'),
                      background: active ? 'rgba(255,61,110,0.14)' : 'transparent',
                      color: active ? '#fff' : 'var(--nd-dim)',
                      fontSize: 10,
                      letterSpacing: 1.2,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="nd-eyebrow" style={{ marginTop: 14, color: 'var(--nd-crimson)' }}>
            ◆ {t('options.play')}
          </div>

          <div style={rowStyle}>
            <div style={labelStyle}>{t('options.autoTower')}</div>
            <Toggle checked={!!autoCombine} onChange={setAutoCombine} />
          </div>
          <div style={rowStyle}>
            <div style={labelStyle}>{t('options.autoSupport')}</div>
            <Toggle checked={!!autoSupportCombine} onChange={setAutoSupportCombine} />
          </div>
          <div style={rowStyle}>
            <div style={labelStyle}>{t('options.autoWave')}</div>
            <Toggle checked={!!autoNextWave} onChange={setAutoNextWave} />
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div style={labelStyle}>{t('options.maxSpeed')}</div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {[3, 4, 5].map(speed => {
                const active = maxGameSpeed === speed;
                return (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setMaxGameSpeed && setMaxGameSpeed(speed)}
                    className="nd-mono"
                    style={{
                      minWidth: 42,
                      padding: '7px 8px',
                      border: '1px solid ' + (active ? 'var(--nd-amber)' : 'var(--nd-hair)'),
                      background: active ? 'rgba(255,169,77,0.15)' : 'transparent',
                      color: active ? 'var(--nd-amber)' : 'var(--nd-dim)',
                      fontSize: 10,
                      letterSpacing: 1,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    ×{speed}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.OptionsModal = OptionsModal;
