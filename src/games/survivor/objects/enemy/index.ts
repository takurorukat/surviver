/**
 * 敵オブジェクト公開 API の集約。
 * 既存の `../objects/Enemy` import は Enemy.ts 経由でここへ辿る。
 */
export type { SpawnPosition, EnemyKind, SpawnWarningTimers } from './types'

export {
  getRandomInsideSpawnPosition,
  pickEnemyKindForArea,
  pickVolcanoStage5EnemyKind,
  startEnemyPackSpawnWithWarning,
  startEnemySpawnWithWarning,
  startMeleeEnemySpawnWithWarning,
} from './packSpawn'

export {
  spawnMeleeEnemy,
  spawnToughMeleeEnemy,
  spawnMushroomEnemy,
  spawnSpiritFireEnemy,
  spawnSpiritThunderEnemy,
  spawnBurningTreeEnemy,
  spawnAshKnightEnemy,
  spawnChaosElementalEnemy,
  spawnVolcanoStage5ChaosElemental,
  spawnStumpEnemy,
  spawnBeetleEnemy,
  spawnBranchEnemy,
  spawnGravestoneEnemy,
  spawnForestStage5Gravestone,
  spawnStoneGuardEnemy,
  spawnRangedEnemy,
} from './spawnFactories'

export {
  countActiveEnemies,
  applyDamageToEnemy,
  playEnemyDefeatFadeOut,
  updateAllEnemyWalkSprites,
  updateAllEnemyHpBars,
} from './combat'

export {
  getEnemyXpDropMultiplier,
  getEnemyBlastDamageMultiplier,
  updateStumpMushroomSpawns,
  updateBurningTreeSpiritFireSpawns,
  updateBranchBeetleSpawns,
  updateGravestoneBeetleSpawns,
  updateChaosElementalSpawns,
} from '../../systems/EnemySummonSystem'
