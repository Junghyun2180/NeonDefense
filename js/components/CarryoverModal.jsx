// CarryoverModal — Holographic Command 디자인 적용
// 스테이지 클리어 후 다음 스테이지로 가져갈 타워/서포트 선택
const CarryoverModal = ({
  isOpen,
  candidates,       // { towers: [], supports: [] }
  selectedIds,      // { towers: [], supports: [] }
  onToggleTower,    // (towerId) => void
  onToggleSupport,  // (supportId) => void
  onConfirm,        // () => void
  allTowers,        // 맵 + 인벤토리 전체 타워 (환급 계산용)
  allSupports,      // 맵 + 인벤토리 전체 서포트 (환급 계산용)
  nextStage,        // 다음 스테이지 번호 (테마 힌트용)
}) => {
  if (!isOpen) return null;

  const { useMemo } = React;

  const themeSummary = useMemo(() => {
    if (typeof WaveThemeSystem === 'undefined' || !nextStage) return [];
    return WaveThemeSystem.getStageThemeSummary(nextStage);
  }, [nextStage]);

  const selectedTowerCount = selectedIds.towers.length;
  const selectedSupportCount = selectedIds.supports.length;

  const refundAmount = useMemo(() => {
    return calculateCarryoverRefund(
      allTowers.towers || [],
      allTowers.supports || [],
      allTowers.inventory || [],
      allTowers.supportInventory || [],
      selectedIds
    );
  }, [allTowers, selectedIds]);

  const getElementInfo = (element) => {
    const info = ELEMENT_EFFECTS[element];
    return info || { name: '???', icon: '◇' };
  };

  const getSupportInfo = (supportType) => {
    const icons = ['⚔', '⏱', '♥', '◎'];
    const names = ['ATK', 'SPD', 'PEN', 'RNG'];
    return {
      icon: icons[supportType] || '◇',
      name: names[supportType] || '???',
    };
  };

  return (
    <div className="nd-overlay" style={{ zIndex: 9997 }}>
      <div className="nd-overlay__grid" aria-hidden="true" />

      <div className="nd-modal nd-modal--lg" role="dialog" aria-label="Carryover">
        <span className="nd-reticle__c nd-reticle__c--tl" />
        <span className="nd-reticle__c nd-reticle__c--tr" />
        <span className="nd-reticle__c nd-reticle__c--bl" />
        <span className="nd-reticle__c nd-reticle__c--br" />

        {/* Top */}
        <div className="nd-modal__top">
          <div className="nd-modal__title">
            <span className="nd-modal__title-eyebrow">◆ CARRYOVER · STAGE {nextStage || '--'}</span>
            <span className="nd-modal__title-text">타워 캐리오버</span>
          </div>
          <div className="nd-modal__top-tools">
            <div
              className="nd-modal__chip nd-modal__chip--amber"
              title="선택하지 않은 타워는 50% 환급"
            >
              <span style={{ color: 'var(--nd-amber)' }}>◆</span>
              <strong>{refundAmount}G</strong>
              <span style={{ color: 'var(--nd-dim)', fontWeight: 700 }}>REFUND</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="nd-modal__body"
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* 적 메타 힌트 */}
          {themeSummary.length > 0 && (
            <div className="nd-section">
              <div className="nd-section__head">
                <span className="nd-eyebrow nd-eyebrow--amber">◇ STAGE {nextStage} · ENEMY META</span>
              </div>
              <div className="nd-theme-strip">
                {themeSummary.map(theme => (
                  <span
                    key={theme.themeId + theme.range}
                    className={'nd-theme-chip' + (theme.intensity === 'weak' ? ' nd-theme-chip--weak' : '')}
                    style={{ '--nd-theme-color': theme.color }}
                    title={theme.hint}
                  >
                    <span className="nd-theme-chip__range">{theme.range}</span>
                    <span aria-hidden="true">{theme.icon}</span>
                    <span className="nd-theme-chip__name">{theme.name}</span>
                    {theme.intensity === 'weak' && (
                      <span style={{ fontSize: 9, color: 'var(--nd-dim)' }}>· WEAK</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 공격 타워 */}
          <PickSection
            title="◆ COMBAT TOWERS"
            empty="T2+ 타워 없음"
            count={selectedTowerCount}
            max={CARRYOVER.maxTowers}
          >
            {candidates.towers.length > 0 && candidates.towers.map(tower => {
              const isSelected = selectedIds.towers.includes(tower.id);
              const elementInfo = getElementInfo(tower.element);
              const canSelect = isSelected || selectedTowerCount < CARRYOVER.maxTowers;
              const accent = tower.color || 'var(--nd-text)';
              return (
                <button
                  key={tower.id}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onToggleTower(tower.id)}
                  className={'nd-pick' + (isSelected ? ' nd-pick--selected' : '')}
                  style={{
                    '--nd-pick-color': accent,
                    '--nd-pick-soft': accent + '22',
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="nd-pick__tier">T{tower.tier}</span>
                  <span className="nd-pick__icon" aria-hidden="true">{elementInfo.icon}</span>
                  {tower.roleIcon && (
                    <span className="nd-pick__role">{tower.roleIcon}</span>
                  )}
                  {isSelected && <span className="nd-pick__check">✓</span>}
                </button>
              );
            })}
          </PickSection>

          {/* 서포트 타워 */}
          <PickSection
            title="◇ SUPPORT TOWERS"
            empty="S2+ 서포트 없음"
            count={selectedSupportCount}
            max={CARRYOVER.maxSupports}
          >
            {candidates.supports.length > 0 && candidates.supports.map(support => {
              const isSelected = selectedIds.supports.includes(support.id);
              const supportInfo = getSupportInfo(support.supportType);
              const canSelect = isSelected || selectedSupportCount < CARRYOVER.maxSupports;
              const accent = support.color || 'var(--nd-amber)';
              return (
                <button
                  key={support.id}
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onToggleSupport(support.id)}
                  className={'nd-pick' + (isSelected ? ' nd-pick--selected' : '')}
                  style={{
                    '--nd-pick-color': accent,
                    '--nd-pick-soft': accent + '22',
                  }}
                  aria-pressed={isSelected}
                >
                  <span className="nd-pick__tier">S{support.tier}</span>
                  <span className="nd-pick__icon" aria-hidden="true">{supportInfo.icon}</span>
                  <span className="nd-pick__role">{supportInfo.name}</span>
                  {isSelected && <span className="nd-pick__check">✓</span>}
                </button>
              );
            })}
          </PickSection>
        </div>

        {/* Footer */}
        <div className="nd-modal__foot">
          <div
            className="nd-mono"
            style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--nd-dim)' }}
          >
            UNSELECTED · 50% REFUND
          </div>
          <button
            type="button"
            onClick={onConfirm}
            className="nd-btn-deploy"
          >
            ▸ CONFIRM ({selectedTowerCount + selectedSupportCount})
          </button>
        </div>
      </div>
    </div>
  );
};

const PickSection = ({ title, empty, count, max, children }) => {
  const isFull = count >= max;
  const childArray = React.Children.toArray(children);
  return (
    <div className="nd-section">
      <div
        className="nd-section__head"
        style={{ justifyContent: 'space-between' }}
      >
        <span className="nd-eyebrow">{title}</span>
        <span className={'nd-pick-counter' + (isFull ? ' nd-pick-counter--full' : '')}>
          <strong>{count}</strong>
          <span>/ {max}</span>
        </span>
      </div>
      {childArray.length > 0 ? (
        <div className="nd-pick-grid">{children}</div>
      ) : (
        <div className="nd-empty">{empty}</div>
      )}
    </div>
  );
};

window.CarryoverModal = CarryoverModal;
