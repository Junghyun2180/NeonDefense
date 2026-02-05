// Neon Defense - 저장/불러오기 훅
// 게임 시작 시 불러오기, 자동 저장, 수동 저장 기능

const { useState, useEffect, useCallback } = React;

const useSaveLoad = (gameState) => {
  const [showMainMenu, setShowMainMenu] = useState(true); // 메인 메뉴 표시
  const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState('start'); // 'start' or 'stageClear'
  const [saveInfo, setSaveInfo] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [loadedData, setLoadedData] = useState(null); // 불러온 데이터 임시 저장

  // ===== 초기화: 저장 데이터 확인 =====
  useEffect(() => {
    const info = SaveSystem.getSaveInfo();
    setSaveInfo(info);

    // 게임 시작 전에는 메인 메뉴 표시
    if (!gameStarted) {
      setShowMainMenu(true);
    }
  }, []);

  // ===== 자동 저장 시작 =====
  useEffect(() => {
    if (!gameStarted) return;

    const getGameState = () => gameState;
    SaveSystem.startAutoSave(getGameState);

    return () => {
      SaveSystem.stopAutoSave();
    };
  }, [gameStarted, gameState]);

  // ===== 새 게임 시작 =====
  const handleNewGame = useCallback(() => {
    // 기존 저장 삭제
    SaveSystem.deleteSave();
    setSaveInfo(null);
    setShowMainMenu(false);
    setShowSaveLoadModal(false);
    setGameStarted(true);
    setLoadedData(null);

    // 밸런스 로그 세션 시작
    if (typeof BalanceLogger !== 'undefined') {
      BalanceLogger.startSession();
    }

    console.log('[SaveLoad] 새 게임 시작');
  }, []);

  // ===== 저장된 게임 불러오기 =====
  const handleLoadGame = useCallback(() => {
    const saveData = SaveSystem.load();
    if (!saveData) {
      console.error('[SaveLoad] 저장 데이터 없음');
      return;
    }

    // 데이터 검증
    if (!SaveSystem.validateSaveData(saveData)) {
      alert('저장 데이터가 손상되었습니다. 새 게임을 시작합니다.');
      SaveSystem.deleteSave();
      handleNewGame();
      return;
    }

    // 불러온 데이터를 상태로 저장 (App.jsx에서 사용)
    setLoadedData(saveData);
    setShowMainMenu(false);
    setShowSaveLoadModal(false);
    setGameStarted(true);

    // 밸런스 로그 세션 시작 (이어하기)
    if (typeof BalanceLogger !== 'undefined') {
      BalanceLogger.startSession();
      BalanceLogger.updateProgress(saveData.stage, saveData.wave);
    }

    console.log('[SaveLoad] 게임 불러오기 완료:', saveData.stage, saveData.wave);
  }, [handleNewGame]);

  // ===== 저장하고 나가기 =====
  const handleSaveAndQuit = useCallback(() => {
    // 현재 상태 저장
    const success = SaveSystem.save(gameState);

    if (success) {
      alert('게임이 저장되었습니다!');
      // 페이지 새로고침으로 초기화
      window.location.reload();
    } else {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, [gameState]);

  // ===== 스테이지 클리어 시 저장 옵션 표시 =====
  const showStageClearSaveOption = useCallback(() => {
    setSaveLoadMode('stageClear');
    setShowSaveLoadModal(true);
  }, []);

  // ===== 계속 플레이 (모달 닫기) =====
  const handleContinue = useCallback(() => {
    setShowSaveLoadModal(false);
  }, []);

  // ===== 수동 저장 (치트 또는 버튼) =====
  const manualSave = useCallback(() => {
    const success = SaveSystem.save(gameState);
    if (success) {
      console.log('[SaveLoad] 수동 저장 완료');
      return true;
    }
    return false;
  }, [gameState]);

  return {
    // 상태
    showMainMenu,
    showSaveLoadModal,
    saveLoadMode,
    saveInfo,
    gameStarted,
    loadedData,

    // 핸들러
    handleNewGame,
    handleLoadGame,
    handleSaveAndQuit,
    handleContinue,
    showStageClearSaveOption,
    manualSave,
  };
};

// 글로벌 등록
window.useSaveLoad = useSaveLoad;
