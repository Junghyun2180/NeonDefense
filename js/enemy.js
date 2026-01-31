// Neon Defense - Enemy Logic

// 적 타입 상수
const ENEMY_TYPES = {
  NORMAL: 'normal',
  FAST: 'fast',
  ELITE: 'elite',
  BOSS: 'boss',
  JAMMER: 'jammer',       // 방해자: 타워 공속 감소
  SUPPRESSOR: 'suppressor', // 억제자: 타워 공격력 감소
};

// 적 생성
const createEnemy = (stage, wave, enemyIndex, totalEnemies, pathTiles, pathId) => {
  const progress = enemyIndex / totalEnemies;
  
  // 적 타입 결정
  const isBoss = enemyIndex === totalEnemies - 1;
  const isElite = !isBoss && wave >= 3 && progress > 0.7 && Math.random() < 0.3;
  const isJammer = !isBoss && !isElite && wave >= 2 && Math.random() < 0.1 + stage * 0.02;
  const isSuppressor = !isBoss && !isElite && !isJammer && wave >= 4 && Math.random() < 0.08 + stage * 0.02;
  const isFast = !isBoss && !isElite && !isJammer && !isSuppressor && Math.random() < 0.2 + wave * 0.05;
  
  // 체력 계산
  const stageMultiplier = 1 + (stage - 1) * 0.5;
  const waveMultiplier = 1 + (wave - 1) * 0.25;
  const lateWaveBonus = wave >= 4 ? 1.3 : 1;
  let baseHealth = Math.floor(30 * stageMultiplier * waveMultiplier * lateWaveBonus);
  
  let health, speed, goldReward;
  
  if (isBoss) {
    health = Math.floor(baseHealth * (8 + stage));
    speed = 0.25 + stage * 0.02;
    goldReward = 30 + stage * 10 + wave * 5;
  } else if (isElite) {
    health = Math.floor(baseHealth * 2.5);
    speed = 0.4 + Math.random() * 0.1;
    goldReward = 8;
  } else if (isJammer) {
    health = Math.floor(baseHealth * 1.8);
    speed = 0.35 + Math.random() * 0.1;
    goldReward = 10;
  } else if (isSuppressor) {
    health = Math.floor(baseHealth * 2.0);
    speed = 0.3 + Math.random() * 0.1;
    goldReward = 12;
  } else if (isFast) {
    health = Math.floor(baseHealth * 0.6);
    speed = 0.8 + Math.random() * 0.3;
    goldReward = 3;
  } else {
    health = baseHealth;
    speed = 0.45 + Math.random() * 0.15 + wave * 0.03;
    goldReward = 4;
  }
  
  return {
    id: Date.now() + Math.random(),
    health,
    maxHealth: health,
    pathIndex: 0,
    pathId,
    pathTiles,
    baseSpeed: speed,
    speed,
    isBoss,
    isElite,
    isFast,
    isJammer,
    isSuppressor,
    debuffRange: 80,
    goldReward,
    x: pathTiles[0].x * TILE_SIZE + TILE_SIZE / 2,
    y: pathTiles[0].y * TILE_SIZE + TILE_SIZE / 2,
    // 상태이상
    burnDamage: 0,
    burnEndTime: 0,
    burnTickTime: 0,
    slowEndTime: 0,
    slowPercent: 0,
  };
};

// 적 이동 처리
const moveEnemy = (enemy, gameSpeed, now) => {
  const path = enemy.pathTiles;
  if (!path || enemy.pathIndex >= path.length - 1) {
    return { enemy: null, livesLost: enemy.isBoss ? 5 : 1 };
  }
  
  let updatedEnemy = { ...enemy };
  
  // 슬로우 처리
  if (enemy.slowEndTime > now) {
    updatedEnemy.speed = enemy.baseSpeed * (1 - enemy.slowPercent);
  } else {
    updatedEnemy.speed = enemy.baseSpeed;
  }
  
  // 이동
  const moveSpeed = updatedEnemy.speed * gameSpeed;
  const nextTile = path[enemy.pathIndex + 1];
  const targetX = nextTile.x * TILE_SIZE + TILE_SIZE / 2;
  const targetY = nextTile.y * TILE_SIZE + TILE_SIZE / 2;
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < moveSpeed * 2) {
    return {
      enemy: { ...updatedEnemy, x: targetX, y: targetY, pathIndex: enemy.pathIndex + 1 },
      livesLost: 0,
    };
  }
  
  return {
    enemy: {
      ...updatedEnemy,
      x: enemy.x + (dx / dist) * moveSpeed * 2,
      y: enemy.y + (dy / dist) * moveSpeed * 2,
    },
    livesLost: 0,
  };
};

// 적 폭발 색상 가져오기
const getExplosionColor = (enemy) => {
  if (enemy.isBoss) return '#ff0000';
  if (enemy.isElite) return '#ff6600';
  if (enemy.isJammer) return '#8b5cf6';
  if (enemy.isSuppressor) return '#ec4899';
  if (enemy.isFast) return '#00ffff';
  return '#9333ea';
};

// 웨이브당 적 수 계산
const getEnemiesPerWave = (stage, wave) => {
  return Math.floor(15 + wave * 4 + stage * 3);
};

// 스폰 간격 계산
const getSpawnDelay = (stage, wave) => {
  return Math.max(250, 500 - wave * 30 - stage * 20);
};
