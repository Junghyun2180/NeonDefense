// MobileGameLayout — 모바일 가로 전용 인-게임 레이아웃
// useMobileLayout().isMobileLandscape 가 true 일 때 App.jsx에서 데스크톱 그리드 대신 마운트.
// 슬롯 패턴 — App.jsx에서 element 인스턴스를 prop으로 주입받아 배치만 모바일용으로 다르게.
// 같은 element 인스턴스를 desktop/mobile이 공유 → React가 reconciliation 으로 상태 보존.
//
// 레이아웃 (≈800x360 가정):
//   ┌─ ROW1 header(auto) ────────────────────────┬─ commandBar(auto) ─┐
//   │                                             │                    │
//   │ ROW2 map (mapScale auto-fit) [mapRef]       │  controlPanel +    │
//   │                                             │  inventoryPanel    │
//   │                                             │  (세로 스크롤)     │
//   ├─ ROW3 waveInfo (compact, full-width span) ──┴────────────────────┤
//   └──────────────────────────────────────────────────────────────────┘
//   col1 = minmax(0, 1fr) | col2 = 240px
//   ROW3 (waveInfo) 는 양 컬럼을 합쳐 한 줄로 — 모바일 가로에서 가장 정보-밀도 높음.
//
// CSS 클래스 .nd-mobile-grid / .nd-mobile-rail 은 css/holo-tokens.css §13에서 정의 (PR2 정리 대상 아님).
// 모든 사이즈/패딩은 인라인 스타일 또는 .nd-mobile-* 클래스에 정의 — !important 사용 금지.
const MobileGameLayout = ({
    slots,             // { header, commandBar, map, waveInfo, controlPanel, inventoryPanel }
    mapContainerRef,   // App.jsx의 useCallback ref (ResizeObserver attach)
}) => {
    return (
        <div
            className="nd-mobile-grid"
            data-testid="mobile-layout"
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 240px',
                // ROW1 = top bars (auto), ROW2 = main (1fr 가용), ROW3 = wave info (auto, ~30~40px).
                gridTemplateRows: 'auto minmax(0, 1fr) auto',
                columnGap: 6,
                rowGap: 6,
                padding: 4,
                maxWidth: 1480,
                margin: '0 auto',
                height: '100vh',
                boxSizing: 'border-box',
            }}
        >
            {/* ROW 1 col 1 — Header */}
            <div style={{ gridColumn: 1, gridRow: 1 }}>
                {slots.header}
            </div>

            {/* ROW 1 col 2 — Command Bar */}
            <div style={{ gridColumn: 2, gridRow: 1 }}>
                {slots.commandBar}
            </div>

            {/* ROW 2 col 1 — Map.
                mapContainerRef 가 attach 되어 ResizeObserver 가 mapScale 갱신 (height-aware).
                overflow:hidden 으로 mapScale 미적용 한 프레임에서도 형제 row3 보호. */}
            <div
                ref={mapContainerRef}
                style={{
                    gridColumn: 1,
                    gridRow: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                {slots.map}
            </div>

            {/* ROW 2 col 2 — Right rail (control + inventory, 통째 세로 스크롤) */}
            <div style={{
                gridColumn: 2,
                gridRow: 2,
                position: 'relative',
                minWidth: 0,
                minHeight: 0,
            }}>
                <div
                    className="nd-mobile-rail"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}
                >
                    {slots.controlPanel}
                    {slots.inventoryPanel}
                </div>
            </div>

            {/* ROW 3 — WaveInfoBar (compact), 양 컬럼 가로 전체 차지 */}
            {slots.waveInfo && (
                <div style={{ gridColumn: '1 / -1', gridRow: 3, minWidth: 0 }}>
                    {slots.waveInfo}
                </div>
            )}
        </div>
    );
};

window.MobileGameLayout = MobileGameLayout;
