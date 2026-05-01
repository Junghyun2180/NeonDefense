// MobileGameLayout — 모바일 가로 전용 인-게임 레이아웃
// useMobileLayout().isMobileLandscape 가 true 일 때 App.jsx 에서 데스크톱 그리드 대신 마운트.
// 슬롯 패턴 — App.jsx 에서 element 인스턴스를 prop 으로 주입받아 배치만 모바일용으로 다르게.
//
// 레이아웃:
//   ┌─ ROW1 header(auto) ────────────────────────┬─ commandBar(auto) ─┐
//   │                                             │                    │
//   │ ROW2 map (anisotropic stretch — 12칸 보임   │  controlPanel      │
//   │       + column 영역 가득 채움)              │  + inventoryPanel  │
//   │                                             │  (세로 스크롤,     │
//   ├─ ROW3 waveInfo (col 1, 맵 width 따라감) ───┤   row 2~3 span)    │
//   └─────────────────────────────────────────────┴────────────────────┘
//   col1 = minmax(0, 1fr) | col2 = 240px
//
// 맵 stretch 원리:
//   - App.jsx mapContainerRef 가 cw 측정 → mapScale = min(1, cw / MAP_WIDTH) (isotropic).
//   - GameMap 은 mapScale 적용해 MAP_W × mapScale × MAP_H × mapScale 자연 크기로 렌더.
//   - MobileGameLayout 이 추가 transform: scale(sx, sy) 로 column 가득 채움 (가로/세로 별도).
//   - useDragAndDrop 은 비율 기반 좌표 (rect.width 사용) 라 anisotropic 정확.
const MobileGameLayout = ({
    slots,             // { header, commandBar, map, waveInfo, controlPanel, inventoryPanel }
    mapContainerRef,   // App.jsx 의 useCallback ref (ResizeObserver attach, mapScale 갱신)
    mapScale = 1,      // App.jsx 의 isotropic mapScale (자연 크기 계산용)
}) => {
    const { useState, useCallback, useEffect, useRef } = React;
    const MAP_W_LOGIC = (typeof GRID_WIDTH !== 'undefined' && typeof TILE_SIZE !== 'undefined')
        ? GRID_WIDTH * TILE_SIZE : 1152;
    const MAP_H_LOGIC = (typeof GRID_HEIGHT !== 'undefined' && typeof TILE_SIZE !== 'undefined')
        ? GRID_HEIGHT * TILE_SIZE : 864;
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const innerObserverRef = useRef(null);

    // App.jsx mapContainerRef 와 자체 ResizeObserver 를 동시에 attach (containerSize 측정용)
    const combinedMapContainerRef = useCallback((node) => {
        if (typeof mapContainerRef === 'function') mapContainerRef(node);
        else if (mapContainerRef && typeof mapContainerRef === 'object') mapContainerRef.current = node;

        if (innerObserverRef.current) {
            innerObserverRef.current.disconnect();
            innerObserverRef.current = null;
        }
        if (!node) {
            setContainerSize({ w: 0, h: 0 });
            return;
        }
        const update = () => {
            const cw = node.offsetWidth || node.clientWidth;
            const ch = node.offsetHeight || node.clientHeight;
            if (cw > 0 && ch > 0) setContainerSize({ w: cw, h: ch });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(node);
        innerObserverRef.current = ro;
    }, [mapContainerRef]);

    useEffect(() => () => {
        if (innerObserverRef.current) innerObserverRef.current.disconnect();
    }, []);

    // GameMap 자연 크기 = MAP_LOGIC × mapScale. column 가득 채우려면 추가 stretch 비율 필요.
    const naturalW = MAP_W_LOGIC * mapScale;
    const naturalH = MAP_H_LOGIC * mapScale;
    const stretchX = (containerSize.w > 0 && naturalW > 0) ? containerSize.w / naturalW : 1;
    const stretchY = (containerSize.h > 0 && naturalH > 0) ? containerSize.h / naturalH : 1;

    return (
        <div
            className="nd-mobile-grid"
            data-testid="mobile-layout"
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 240px',
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
            <div style={{ gridColumn: 1, gridRow: 1 }}>{slots.header}</div>
            <div style={{ gridColumn: 2, gridRow: 1 }}>{slots.commandBar}</div>

            {/* ROW 2 col 1 — Map (anisotropic stretch wrapper) */}
            <div
                ref={combinedMapContainerRef}
                style={{
                    gridColumn: 1,
                    gridRow: 2,
                    position: 'relative',
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                }}
            >
                {/* GameMap 자연 크기로 렌더, transform 으로 column 가득 채움 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transformOrigin: 'top left',
                        transform: `scale(${stretchX}, ${stretchY})`,
                    }}
                >
                    {slots.map}
                </div>
            </div>

            {/* col 2 row 2~3 — Right rail */}
            <div style={{
                gridColumn: 2,
                gridRow: '2 / 4',
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

            {/* ROW 3 col 1 — WaveInfoBar (compact, 맵 width 따라감) */}
            {slots.waveInfo && (
                <div style={{ gridColumn: 1, gridRow: 3, minWidth: 0 }}>
                    {slots.waveInfo}
                </div>
            )}
        </div>
    );
};

window.MobileGameLayout = MobileGameLayout;
