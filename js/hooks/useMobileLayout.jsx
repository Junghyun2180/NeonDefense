// useMobileLayout — 모바일 가로 레이아웃 분기용 viewport 감지 훅
// matchMedia 기반으로 (orientation: landscape) and (max-height: 540px) 매칭 시
// isMobileLandscape = true 반환. App.jsx 에서 MobileGameLayout vs DesktopGameGrid 분기.
//
// breakpoint 540px 는 css/holo-tokens.css §11 (회전 안내) 와 동일하게 통일.
// 세로 모바일은 §11 회전 안내가 처리하므로 여기선 가로만 다룸.
const useMobileLayout = () => {
    const { useState, useEffect } = React;
    const QUERY = '(orientation: landscape) and (max-height: 540px)';

    const [isMobileLandscape, setIsMobileLandscape] = useState(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia(QUERY).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const mql = window.matchMedia(QUERY);
        const handler = (e) => setIsMobileLandscape(e.matches);
        // Safari < 14 호환: addEventListener 미지원 시 addListener fallback
        if (mql.addEventListener) {
            mql.addEventListener('change', handler);
            return () => mql.removeEventListener('change', handler);
        }
        mql.addListener(handler);
        return () => mql.removeListener(handler);
    }, []);

    return { isMobileLandscape };
};

window.useMobileLayout = useMobileLayout;
