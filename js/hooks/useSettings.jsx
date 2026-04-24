// useSettings — 속도감 개선용 사용자 설정 (localStorage 영속)
// autoCombine: 뽑기 후 자동 조합 (T1→T2→T3)
// autoSupportCombine: 서포트 뽑기 후 자동 조합 (S1→S2→S3)
// t4RolePresets: 속성별 T4 역할 자동선택 맵 { [element]: 'A'|'B'|'C' }
const useSettings = () => {
    const { useState, useCallback } = React;
    const STORAGE_KEY = 'neonDefense_settings_v1';

    const loadInitial = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    };

    const initial = loadInitial() || {};
    const [autoCombine, setAutoCombineState] = useState(initial.autoCombine ?? true);
    const [autoSupportCombine, setAutoSupportCombineState] = useState(initial.autoSupportCombine ?? true);
    const [t4RolePresets, setT4RolePresetsState] = useState(initial.t4RolePresets || {});
    const [autoNextWave, setAutoNextWaveState] = useState(initial.autoNextWave ?? true);
    const [maxGameSpeed, setMaxGameSpeedState] = useState(initial.maxGameSpeed ?? 5);
    const [tutorialSeen, setTutorialSeenState] = useState(initial.tutorialSeen ?? false);

    const persist = useCallback((next) => {
        try {
            const current = loadInitial() || {};
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...next }));
        } catch {
            // localStorage unavailable - silently continue
        }
    }, []);

    const setAutoCombine = useCallback((val) => {
        setAutoCombineState(val);
        persist({ autoCombine: val });
    }, [persist]);

    const setAutoSupportCombine = useCallback((val) => {
        setAutoSupportCombineState(val);
        persist({ autoSupportCombine: val });
    }, [persist]);

    const setT4RolePreset = useCallback((element, roleId) => {
        setT4RolePresetsState(prev => {
            const next = { ...prev, [element]: roleId };
            persist({ t4RolePresets: next });
            return next;
        });
    }, [persist]);

    const clearT4RolePreset = useCallback((element) => {
        setT4RolePresetsState(prev => {
            const next = { ...prev };
            delete next[element];
            persist({ t4RolePresets: next });
            return next;
        });
    }, [persist]);

    const clearAllT4RolePresets = useCallback(() => {
        setT4RolePresetsState({});
        persist({ t4RolePresets: {} });
    }, [persist]);

    const setAutoNextWave = useCallback((val) => {
        setAutoNextWaveState(val);
        persist({ autoNextWave: val });
    }, [persist]);

    const setMaxGameSpeed = useCallback((val) => {
        const clamped = Math.max(3, Math.min(5, val));
        setMaxGameSpeedState(clamped);
        persist({ maxGameSpeed: clamped });
    }, [persist]);

    const setTutorialSeen = useCallback((val) => {
        setTutorialSeenState(val);
        persist({ tutorialSeen: val });
    }, [persist]);

    return {
        autoCombine, setAutoCombine,
        autoSupportCombine, setAutoSupportCombine,
        t4RolePresets, setT4RolePreset, clearT4RolePreset, clearAllT4RolePresets,
        autoNextWave, setAutoNextWave,
        maxGameSpeed, setMaxGameSpeed,
        tutorialSeen, setTutorialSeen,
    };
};

window.useSettings = useSettings;
