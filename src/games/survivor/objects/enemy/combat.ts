/**
 * ダメージ・撃破演出・生存数・毎フレーム更新。
 */
import Phaser from 'phaser'
import {
  ENEMY_DEFEAT_FADE_DURATION_MS,
  ENEMY_DEFEAT_SCALE_TO,
} from '../../GameConstants'
import {
  enemyBreathingSpriteMap,
  enemyWalkSpriteMap,
  enemyHpBarMap,
} from './enemyInternal'
import {
  destroyEnemyHpBar,
  redrawEnemyHpBar,
  syncEnemyHpBarPosition,
} from './enemyHpBar'
import {
  ENEMY_WALK_COLUMN_BY_DIRECTION,
  type EnemyWalkDirection,
} from './enemySprites'

/**
 * 敵グループの生存数を数える（撃破演出中 isDefeated は含めない）。
 * ウェーブ進行やクリア判定で「まだ倒していない敵がいるか」を見る。
 */
export function countActiveEnemies(enemyGroup: Phaser.Physics.Arcade.Group): number {
  const children = enemyGroup.getChildren()
  let activeCount = 0

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    activeCount = activeCount + 1
  }

  return activeCount
}

/**
 * 敵にダメージを与える。今回のダメージで倒れたら true を返す（まだ destroy しない）。
 *
 * 倒れた場合:
 * - isDefeated=true、HP バー破棄、Body 無効化
 * - 呼び出し側が playEnemyDefeatFadeOut などで見た目を消す
 *
 * @returns true = このヒットで撃破になった / false = 生存 or 無効対象
 */
export function applyDamageToEnemy(
  enemy: Phaser.GameObjects.Rectangle,
  damage: number,
): boolean {
  if (!enemy.active) {
    return false
  }

  if (enemy.getData('isDefeated') === true) {
    return false
  }

  const currentHp = enemy.getData('hp') as number
  if (typeof currentHp !== 'number') {
    return false
  }

  // すでに倒れている敵には何もしない
  if (currentHp <= 0) {
    return false
  }

  const newHp = currentHp - damage
  enemy.setData('hp', newHp)

  // HP が今回 0 以下になったときだけ撃破扱い
  if (newHp <= 0) {
    enemy.setData('isDefeated', true)
    enemy.setData('hp', 0)
    destroyEnemyHpBar(enemy)

    // 当たり判定と移動を止める（見た目は tween で消す）
    if (enemy.body !== null) {
      const body = enemy.body as Phaser.Physics.Arcade.Body
      body.enable = false
      body.setVelocity(0, 0)
    }

    return true
  }

  redrawEnemyHpBar(enemy)
  return false
}

/**
 * 撃破演出: Phaser tween で素早くフェードアウトしてから destroy。
 * 白い四角フラッシュは出さない（スプライト／矩形そのものを消す）。
 * onComplete でコイン生成など後処理を渡す想定。
 */
export function playEnemyDefeatFadeOut(
  scene: Phaser.Scene,
  enemy: Phaser.GameObjects.Rectangle,
  onComplete: () => void,
): void {
  const walkSprite = enemyWalkSpriteMap.get(enemy)
  const breathingSprite = enemyBreathingSpriteMap.get(enemy)

  function finishDefeat(): void {
    if (enemy.active) {
      enemy.destroy()
    }
    onComplete()
  }

  // 呼吸スプライト: 伸び縮みを止めてから、本体と枠を同時に透明へ
  if (breathingSprite !== undefined) {
    breathingSprite.stopBreathing()
    const tweenTargets = breathingSprite.getTweenTargets()
    // 白い塗りつぶしは使わず、絵のまま消す
    breathingSprite.body.clearTint()
    breathingSprite.outline.clearTint()
    scene.tweens.killTweensOf(tweenTargets)
    scene.tweens.add({
      targets: tweenTargets,
      alpha: 0,
      duration: ENEMY_DEFEAT_FADE_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: finishDefeat,
    })
    return
  }

  // 歩行シート: 少し拡大しながら透明へ
  if (walkSprite !== undefined) {
    walkSprite.clearTint()
    scene.tweens.killTweensOf(walkSprite)
    scene.tweens.add({
      targets: walkSprite,
      alpha: 0,
      scaleX: walkSprite.scaleX * ENEMY_DEFEAT_SCALE_TO,
      scaleY: walkSprite.scaleY * ENEMY_DEFEAT_SCALE_TO,
      duration: ENEMY_DEFEAT_FADE_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: finishDefeat,
    })
    return
  }

  // 見た目が矩形だけの敵（フォールバック）
  scene.tweens.killTweensOf(enemy)
  scene.tweens.add({
    targets: enemy,
    alpha: 0,
    scaleX: ENEMY_DEFEAT_SCALE_TO,
    scaleY: ENEMY_DEFEAT_SCALE_TO,
    duration: ENEMY_DEFEAT_FADE_DURATION_MS,
    ease: 'Cubic.Out',
    onComplete: finishDefeat,
  })
}

/**
 * 全敵の見た目を物理本体へ追従させる。
 * - 呼吸方式: 足元位置だけ追従（伸び縮みは tween が担当）
 * - 歩行シート方式: 速度に合う方向アニメも更新
 * playerX は蜂など、停止中にプレイヤーを向く敵向け。
 */
export function updateAllEnemyWalkSprites(
  enemyGroup: Phaser.Physics.Arcade.Group,
  playerX: number = 0,
): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle

    const breathing = enemyBreathingSpriteMap.get(enemy)
    if (breathing !== undefined) {
      breathing.followEnemyCenter(enemy.x, enemy.y, enemy.height)
      if (enemy.active && enemy.getData('isDefeated') !== true && enemy.body !== null) {
        const body = enemy.body as Phaser.Physics.Arcade.Body
        breathing.updateFacing(body.velocity.x, enemy.x, playerX)
      }
      continue
    }

    const sprite = enemyWalkSpriteMap.get(enemy)
    if (sprite === undefined || !sprite.active) {
      continue
    }

    sprite.setPosition(enemy.x, enemy.y)
    if (!enemy.active || enemy.getData('isDefeated') === true) {
      sprite.anims.stop()
      continue
    }

    const body = enemy.body as Phaser.Physics.Arcade.Body
    const velocityX = body.velocity.x
    const velocityY = body.velocity.y
    const isMoving = Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1

    if (!isMoving) {
      const lastDirection = sprite.getData('walkDirection') as EnemyWalkDirection
      sprite.anims.stop()
      sprite.setFrame(ENEMY_WALK_COLUMN_BY_DIRECTION[lastDirection])
      continue
    }

    let direction: EnemyWalkDirection
    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      direction = velocityX >= 0 ? 'right' : 'left'
    } else {
      direction = velocityY >= 0 ? 'down' : 'up'
    }

    sprite.setData('walkDirection', direction)
    const animationPrefix = sprite.getData('walkAnimationPrefix') as string
    sprite.anims.play(`${animationPrefix}-${direction}`, true)
  }
}

/**
 * 敵グループ全体の HP バー位置だけ更新する（毎フレーム）。
 * 描き直し（clear）はしない。
 */
export function updateAllEnemyHpBars(enemyGroup: Phaser.Physics.Arcade.Group): void {
  const children = enemyGroup.getChildren()

  for (let index = 0; index < children.length; index++) {
    const enemy = children[index] as Phaser.GameObjects.Rectangle
    if (!enemy.active) {
      continue
    }
    if (enemy.getData('isDefeated') === true) {
      continue
    }
    const hpBar = enemyHpBarMap.get(enemy)
    if (hpBar === undefined) {
      continue
    }
    syncEnemyHpBarPosition(enemy, hpBar)
  }
}


