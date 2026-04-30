// Neon Defense — Home page
// Mission select + holographic arsenal preview.

const HOME_TOWER_PREVIEWS = [
  { element: 0, key: 'fire', title: 'PHOENIX', ident: 'IGN-04', role: '화염 지속', color: '#ff3d6e', soft: 'rgba(255,61,110,0.36)' },
  { element: 1, key: 'water', title: 'ABYSSAL', ident: 'CRY-04', role: '냉기 제어', color: '#45b7ff', soft: 'rgba(69,183,255,0.32)' },
  { element: 2, key: 'electric', title: 'NOVA', ident: 'ELC-04', role: '전격 연쇄', color: '#ffd166', soft: 'rgba(255,209,102,0.32)' },
  { element: 3, key: 'wind', title: 'VERDANT', ident: 'WND-04', role: '질풍 타격', color: '#80ed99', soft: 'rgba(128,237,153,0.30)' },
  { element: 4, key: 'void', title: 'NULLION', ident: 'VOD-04', role: '공허 관통', color: '#c77dff', soft: 'rgba(199,125,255,0.34)' },
  { element: 5, key: 'light', title: 'AUREL', ident: 'LUX-04', role: '광휘 정밀', color: '#f5f5f5', soft: 'rgba(245,245,245,0.24)' },
];

const shuffleHomeTowerPreviews = () => {
  const items = HOME_TOWER_PREVIEWS.slice();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = items[i];
    items[i] = items[j];
    items[j] = tmp;
  }
  return items;
};

const Home = ({
  saveInfo,
  onNewGame,
  onLoadGame,
  onSelectMode,
  metaProgress,
}) => {
  const { useEffect, useMemo, useState } = React;
  const [mission, setMission] = useState('campaign');
  const [previewOrder] = useState(() => shuffleHomeTowerPreviews());
  const [previewIndex, setPreviewIndex] = useState(0);

  const highestSector = metaProgress?.stats?.highestCampaignSector || 0;
  const highestEndless = metaProgress?.stats?.highestEndlessStage || 0;
  const nextSector = highestSector + 1;
  const sectorHpMult = (typeof calcSectorHpMultiplier !== 'undefined')
    ? calcSectorHpMultiplier(nextSector) : 1;
  const maxStage = typeof SPAWN !== 'undefined' ? SPAWN.maxStage : 3;
  const wavesPerStage = typeof SPAWN !== 'undefined' ? SPAWN.wavesPerStage : 10;
  const startLives = typeof ECONOMY !== 'undefined' ? ECONOMY.startLives : 30;

  const saveTime = saveInfo?.timestamp
    ? new Date(saveInfo.timestamp)
    : null;

  const lastSessionLabel = saveTime
    ? `${String(saveTime.getMonth() + 1).padStart(2, '0')}/${String(saveTime.getDate()).padStart(2, '0')} · ${String(saveTime.getHours()).padStart(2, '0')}:${String(saveTime.getMinutes()).padStart(2, '0')}`
    : 'NO ACTIVE CHECKPOINT';

  const stageStars = useMemo(() => {
    if (typeof StarRating === 'undefined') return [];
    return Array.from({ length: maxStage }, (_, idx) => {
      const stage = idx + 1;
      return { stage, stars: StarRating.getStars(stage) };
    });
  }, [maxStage]);

  useEffect(() => {
    if (previewOrder.length <= 1) return undefined;
    const id = setInterval(() => {
      setPreviewIndex(idx => (idx + 1) % previewOrder.length);
    }, 3400);
    return () => clearInterval(id);
  }, [previewOrder.length]);

  const preview = previewOrder[previewIndex] || HOME_TOWER_PREVIEWS[4];
  const previewSrc = (
    typeof TowerSprite !== 'undefined'
      ? TowerSprite.getUrl(preview.element, 4)
      : null
  ) || `assets/towers/${preview.key}/t4.png`;

  const missions = [
    {
      id: 'campaign',
      eyebrow: 'CMP-01',
      title: '캠페인',
      subtitle: `${maxStage} 스테이지 · 확정 맵`,
      line: `STG ${Math.min(Math.max(1, highestSector + 1), maxStage)} / ${maxStage}`,
      progress: Math.min(100, ((highestSector || 0) / Math.max(1, maxStage)) * 100),
      enabled: true,
      accent: 'var(--nd-crimson)',
      action: 'INITIATE DEPLOYMENT',
    },
    {
      id: 'run',
      eyebrow: 'RUN-∞',
      title: '로그라이크 런',
      subtitle: '영구 버프 · 점수전',
      line: highestSector > 0 ? `BEST: SECTOR ${highestSector}` : 'BEST: STG 12',
      progress: 44,
      enabled: true,
      accent: 'var(--nd-amber)',
      action: 'OPEN RUN SELECT',
    },
    {
      id: 'endless',
      eyebrow: 'END-∞',
      title: '엔드리스',
      subtitle: '무한 웨이브',
      line: highestSector >= 5 ? `BEST: STG ${highestEndless || 1}` : 'LOCKED · 스테이지 15 클리어',
      progress: highestSector >= 5 ? Math.min(100, highestEndless * 4) : 0,
      enabled: highestSector >= 5,
      accent: 'var(--nd-dim)',
      action: 'OPEN ENDLESS',
    },
  ];

  const selectedMission = missions.find(m => m.id === mission) || missions[0];

  const handleDeploy = () => {
    if (mission === 'campaign') {
      onNewGame && onNewGame();
      return;
    }
    if (mission === 'run') {
      onSelectMode && onSelectMode('run');
      return;
    }
    if (mission === 'endless') {
      onSelectMode && onSelectMode('endless');
    }
  };

  const handleResume = () => {
    if (!saveInfo) return;
    onLoadGame && onLoadGame();
  };

  return (
    <div className="nd-home">
      <section
        className="nd-home__projection nd-panel"
        style={{ '--nd-preview-color': preview.color, '--nd-preview-soft': preview.soft }}
      >
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        <div className="nd-home__panel-head">
          <div className="nd-eyebrow">◇ HOLO-PROJECTION · ARSENAL PREVIEW</div>
          <div className="nd-home__counter">
            {String(previewIndex + 1).padStart(2, '0')} / {String(previewOrder.length).padStart(2, '0')}
          </div>
        </div>

        <div className="nd-home__scan">
          <div className="nd-home__rings" aria-hidden="true">
            <span className="nd-home__ring nd-home__ring--outer" />
            <span className="nd-home__ring nd-home__ring--inner" />
            <span className="nd-home__axis nd-home__axis--v" />
            <span className="nd-home__axis nd-home__axis--h" />
          </div>

          <div className="nd-home__tower-wrap">
            <img
              className="nd-home__tower"
              src={previewSrc}
              alt={`Tier 4 ${preview.key} tower preview`}
            />
            <span className="nd-home__tower-glow" />
          </div>

          <div className="nd-home__platform" aria-hidden="true">
            <span />
            <i />
          </div>
        </div>

        <div className="nd-home__arsenal-copy">
          <div className="nd-home__ident">IDENT · {preview.ident}</div>
          <h1>{preview.title}</h1>
          <div className="nd-home__meta">
            <span>TIER 4</span>
            <span>{preview.role}</span>
            <span>HP ×{sectorHpMult.toFixed(2)}</span>
          </div>
        </div>

        <div className="nd-home__stage-strip" aria-label="Stage star progress">
          {(stageStars.length ? stageStars : [{ stage: 1, stars: 0 }, { stage: 2, stars: 0 }, { stage: 3, stars: 0 }]).map(s => (
            <span
              key={s.stage}
              className={s.stars > 0 ? 'is-lit' : ''}
              title={`Stage ${s.stage}: ${s.stars || 0} stars`}
            />
          ))}
        </div>
      </section>

      <aside className="nd-home__side">
        <section className="nd-panel nd-home__mission-panel">
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />
          <div className="nd-eyebrow">◇ MISSION SELECT</div>

          <div className="nd-home__mission-list">
            {missions.map(m => {
              const active = mission === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={!m.enabled}
                  onClick={() => m.enabled && setMission(m.id)}
                  className={'nd-home__mission' + (active ? ' is-active' : '')}
                >
                  <span className="nd-home__mission-code">{m.eyebrow}</span>
                  <strong>{m.title}</strong>
                  <small>{m.subtitle}</small>
                  <em>{m.line}</em>
                  <i>
                    <span style={{ width: `${m.progress}%`, background: m.enabled ? m.accent : 'var(--nd-dimmer)' }} />
                  </i>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={handleDeploy}
          disabled={!selectedMission.enabled}
          className="nd-home__deploy nd-mono"
        >
          <span>▸ {selectedMission.action}</span>
          <small><b /> ALL SYSTEMS NOMINAL</small>
        </button>

        <section className="nd-panel nd-home__session">
          <span className="nd-reticle__c nd-reticle__c--tl" />
          <span className="nd-reticle__c nd-reticle__c--tr" />
          <span className="nd-reticle__c nd-reticle__c--bl" />
          <span className="nd-reticle__c nd-reticle__c--br" />
          <div className="nd-eyebrow">◇ LAST SESSION</div>
          <strong>{lastSessionLabel}</strong>
          <span>
            {saveInfo
              ? `STAGE ${saveInfo.stage} · WAVE ${saveInfo.wave} · ${saveInfo.lives ?? '--'}/${startLives}`
              : `${maxStage} STAGES · ${wavesPerStage} WAVES`}
          </span>
          <button type="button" onClick={handleResume} disabled={!saveInfo}>
            ▸ RESUME
          </button>
        </section>
      </aside>
    </div>
  );
};

window.Home = Home;
