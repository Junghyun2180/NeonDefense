// Neon Defense - 로컬 저장 시스템
// localStorage를 활용한 게임 진행도 저장/불러오기

const SaveSystem = {
  SAVE_KEY: 'neonDefense_save_v1',
  AUTO_SAVE_INTERVAL: 30000, // 30초마다 자동 저장

  // ===== 저장 =====
  save(gameState) {
    try {
      const saveData = {
        version: 1,
        timestamp: Date.now(),

        // 진행도
        stage: gameState.stage,
        wave: gameState.wave,
        gold: gameState.gold,
        lives: gameState.lives,

        // 타워 데이터
        towers: gameState.towers.map(t => ({
          id: t.id,
          x: t.x,
          y: t.y,
          tier: t.tier,
          colorIndex: t.colorIndex,
          abilityType: t.abilityType,
          role: t.role,
          lastShot: 0, // 시간 정보는 초기화
        })),

        // 서포트 타워
        supportTowers: gameState.supportTowers.map(s => ({
          id: s.id,
          x: s.x,
          y: s.y,
          tier: s.tier,
          supportType: s.supportType,
          abilityType: s.abilityType,
        })),

        // 인벤토리
        inventory: gameState.inventory,
        supportInventory: gameState.supportInventory,

        // 영구 버프
        permanentBuffs: gameState.permanentBuffs,

        // 통계
        stats: gameState.stats,
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log('[SaveSystem] 게임 저장 완료', saveData.stage, saveData.wave);
      return true;
    } catch (error) {
      console.error('[SaveSystem] 저장 실패:', error);
      return false;
    }
  },

  // ===== 불러오기 =====
  load() {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) return null;

      const saveData = JSON.parse(saved);

      // 버전 호환성 체크
      if (saveData.version !== 1) {
        console.warn('[SaveSystem] 버전 불일치, 저장 데이터 무시');
        return null;
      }

      console.log('[SaveSystem] 게임 불러오기 완료', saveData.stage, saveData.wave);
      return saveData;
    } catch (error) {
      console.error('[SaveSystem] 불러오기 실패:', error);
      return null;
    }
  },

  // ===== 저장 존재 여부 =====
  hasSave() {
    const saved = localStorage.getItem(this.SAVE_KEY);
    return saved !== null;
  },

  // ===== 저장 삭제 =====
  deleteSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('[SaveSystem] 저장 데이터 삭제 완료');
      return true;
    } catch (error) {
      console.error('[SaveSystem] 삭제 실패:', error);
      return false;
    }
  },

  // ===== 저장 정보 조회 (미리보기용) =====
  getSaveInfo() {
    try {
      const saved = localStorage.getItem(this.SAVE_KEY);
      if (!saved) return null;

      const saveData = JSON.parse(saved);
      return {
        stage: saveData.stage,
        wave: saveData.wave,
        timestamp: saveData.timestamp,
        gold: saveData.gold,
        lives: saveData.lives,
        towerCount: saveData.towers.length,
        supportCount: saveData.supportTowers.length,
      };
    } catch (error) {
      console.error('[SaveSystem] 정보 조회 실패:', error);
      return null;
    }
  },

  // ===== 자동 저장 시작 =====
  startAutoSave(getGameState) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      const gameState = getGameState();
      // 게임 중일 때만 자동 저장
      if (gameState.isPlaying || gameState.enemies.length > 0) {
        this.save(gameState);
      }
    }, this.AUTO_SAVE_INTERVAL);

    console.log('[SaveSystem] 자동 저장 시작 (30초 간격)');
  },

  // ===== 자동 저장 중지 =====
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('[SaveSystem] 자동 저장 중지');
    }
  },

  // ===== 게임 상태 복원 (타워 재생성) =====
  restoreGameState(saveData, gameState) {
    try {
      // 타워 복원 (TowerSystem 사용)
      const restoredTowers = saveData.towers.map(tData => {
        const tower = TowerSystem.create(tData.tier, tData.colorIndex);
        tower.id = tData.id;
        tower.x = tData.x;
        tower.y = tData.y;
        tower.abilityType = tData.abilityType;
        tower.role = tData.role;
        tower.lastShot = Date.now(); // 현재 시간으로 초기화
        return tower;
      });

      // 서포트 타워 복원
      const restoredSupports = saveData.supportTowers.map(sData => {
        const support = TowerSystem.createSupport(sData.tier, sData.supportType);
        support.id = sData.id;
        support.x = sData.x;
        support.y = sData.y;
        support.abilityType = sData.abilityType;
        return support;
      });

      return {
        ...gameState,
        stage: saveData.stage,
        wave: saveData.wave,
        gold: saveData.gold,
        lives: saveData.lives,
        towers: restoredTowers,
        supportTowers: restoredSupports,
        inventory: saveData.inventory,
        supportInventory: saveData.supportInventory,
        permanentBuffs: saveData.permanentBuffs,
        stats: saveData.stats,
        // 전투 상태 초기화
        enemies: [],
        projectiles: [],
        effects: [],
        chainLightnings: [],
        spawnedCount: 0,
        killedCount: 0,
        isPlaying: false,
        gameOver: false,
      };
    } catch (error) {
      console.error('[SaveSystem] 상태 복원 실패:', error);
      return null;
    }
  },

  // ===== 데이터 검증 =====
  validateSaveData(saveData) {
    if (!saveData) return false;

    // 필수 필드 체크
    const requiredFields = ['stage', 'wave', 'gold', 'lives', 'towers', 'supportTowers', 'inventory', 'supportInventory', 'permanentBuffs'];
    for (const field of requiredFields) {
      if (saveData[field] === undefined) {
        console.error(`[SaveSystem] 필수 필드 누락: ${field}`);
        return false;
      }
    }

    // 범위 체크
    if (saveData.stage < 1 || saveData.stage > SPAWN.maxStage) {
      console.error('[SaveSystem] 스테이지 범위 오류:', saveData.stage);
      return false;
    }

    if (saveData.wave < 1 || saveData.wave > SPAWN.wavesPerStage) {
      console.error('[SaveSystem] 웨이브 범위 오류:', saveData.wave);
      return false;
    }

    return true;
  },

  // ===== 저장 크기 확인 (디버그용) =====
  getSaveSize() {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (!saved) return 0;
    return new Blob([saved]).size;
  },

  // ===== 저장 데이터 압축 (선택사항) =====
  compressSaveData(saveData) {
    // 간단한 압축: 불필요한 필드 제거
    const compressed = JSON.parse(JSON.stringify(saveData));

    // 타워 데이터 압축
    compressed.towers = compressed.towers.map(t => ({
      i: t.id,
      x: t.x,
      y: t.y,
      t: t.tier,
      c: t.colorIndex,
      a: t.abilityType,
      r: t.role,
    }));

    return compressed;
  },
};

// 글로벌 등록
window.SaveSystem = SaveSystem;
