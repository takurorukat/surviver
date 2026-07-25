/**
 * 敵 HP バーの生成・同期・破棄。
 */
import Phaser from 'phaser'
import {
  ENEMY_HP_BAR_BORDER_COLOR,
  ENEMY_HP_BAR_DEPTH,
  ENEMY_HP_BAR_EMPTY_COLOR,
  ENEMY_HP_BAR_FILL_COLOR,
  ENEMY_HP_BAR_HEIGHT,
  ENEMY_HP_BAR_OFFSET_Y,
  ENEMY_HP_BAR_WIDTH,
} from '../../GameConstants'
import { enemyHpBarMap, type EnemyHpBarView } from './enemyInternal'

/**
 * 敵の下に細い HP バーを付ける。
 * Graphics ではなく Rectangle 3枚の Container（Phaser 標準）。
 * 毎フレームは位置だけ動かし、幅の再計算はダメージ時だけ。
 */
export function attachEnemyHpBar(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
): void {
  const innerWidth = ENEMY_HP_BAR_WIDTH - 2
  const innerHeight = Math.max(1, ENEMY_HP_BAR_HEIGHT - 2)

  const border = scene.add.rectangle(
    0,
    0,
    ENEMY_HP_BAR_WIDTH,
    ENEMY_HP_BAR_HEIGHT,
    ENEMY_HP_BAR_BORDER_COLOR,
  )
  border.setOrigin(0.5, 0)

  const empty = scene.add.rectangle(0, 1, innerWidth, innerHeight, ENEMY_HP_BAR_EMPTY_COLOR)
  empty.setOrigin(0.5, 0)

  // 左端基準。幅を変えても左がずれない
  const fill = scene.add.rectangle(
    -innerWidth / 2,
    1,
    innerWidth,
    innerHeight,
    ENEMY_HP_BAR_FILL_COLOR,
  )
  fill.setOrigin(0, 0)

  const container = scene.add.container(enemy.x, enemy.y)
  container.setDepth(ENEMY_HP_BAR_DEPTH)
  container.add([border, empty, fill])

  const hpBar: EnemyHpBarView = {
    container,
    fill,
    innerWidth,
  }
  enemyHpBarMap.set(enemy, hpBar)

  enemy.once('destroy', () => {
    destroyEnemyHpBar(enemy)
  })

  redrawEnemyHpBar(enemy)
  syncEnemyHpBarPosition(enemy, hpBar)
}

/**
 * 敵グループ全体の HP バー位置だけ更新する（毎フレーム）。
 * 描き直し（clear）はしない。

/** HP バー Container を敵の足元へ合わせる。 */
export function syncEnemyHpBarPosition(
  enemy: Phaser.GameObjects.Rectangle,
  hpBar: EnemyHpBarView,
): void {
  const barTop = enemy.y + enemy.height / 2 + ENEMY_HP_BAR_OFFSET_Y
  hpBar.container.setPosition(enemy.x, barTop)
}

/**
 * 現在の HP / maxHp に合わせて緑ゲージの幅だけ更新する。
 * ダメージ時・出現時に呼ぶ（毎フレームは呼ばない）。
 */
export function redrawEnemyHpBar(enemy: Phaser.GameObjects.Rectangle): void {
  const hpBar = enemyHpBarMap.get(enemy)
  if (hpBar === undefined || !hpBar.container.active) {
    return
  }

  const currentHp = enemy.getData('hp') as number
  const maxHp = enemy.getData('maxHp') as number
  if (typeof currentHp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) {
    return
  }

  const ratio = Phaser.Math.Clamp(currentHp / maxHp, 0, 1)
  hpBar.fill.width = hpBar.innerWidth * ratio
  hpBar.fill.setVisible(ratio > 0)
}

/** WeakMap から外し、Container（中の Rectangle 含む）を destroy する */
export function destroyEnemyHpBar(enemy: Phaser.GameObjects.Rectangle): void {
  const hpBar = enemyHpBarMap.get(enemy)
  if (hpBar === undefined) {
    return
  }

  enemyHpBarMap.delete(enemy)
  if (hpBar.container.active) {
    // true = 子の Rectangle も一緒に破棄
    hpBar.container.destroy(true)
  }
}

