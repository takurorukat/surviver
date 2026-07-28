import Phaser from 'phaser'
import {
  FONT_FAMILY_UI,
  UNLOCK_ICON_LETTER_COLOR,
  getSkillIconDefinition,
  getSkillIconMetrics,
  type SkillIconId,
} from '../GameConstants'

export type SkillIconView = {
  container: Phaser.GameObjects.Container
  border: Phaser.GameObjects.Rectangle
  fill: Phaser.GameObjects.Rectangle
  symbol: Phaser.GameObjects.Text | Phaser.GameObjects.Graphics
}

/**
 * 一元定義されたスキルアイコンを指定倍率で生成する。
 * コンテナ内に Border, Fill, Symbol を含める。
 * Orbiting Orb だけは記号の代わりに核＋周回Orb＋軌道弧を描く。
 */
export function createSkillIcon(
  scene: Phaser.Scene,
  id: SkillIconId,
  scale: number,
): SkillIconView {
  const definition = getSkillIconDefinition(id)
  const metrics = getSkillIconMetrics(scale)

  const container = scene.add.container(0, 0)

  const border = scene.add.rectangle(
    0,
    0,
    metrics.outerSize,
    metrics.outerSize,
    definition.color,
  )
  const fill = scene.add.rectangle(
    0,
    0,
    metrics.size,
    metrics.size,
    definition.color,
  )

  let symbol: Phaser.GameObjects.Text | Phaser.GameObjects.Graphics
  if (id === 'orbitingOrb') {
    symbol = drawOrbitingOrbIconSymbol(scene, metrics.size, definition.color)
  } else {
    const symbolText = scene.add.text(
      metrics.symbolOffsetX,
      metrics.symbolOffsetY,
      definition.symbol,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: `${metrics.symbolFontSize}px`,
        color: UNLOCK_ICON_LETTER_COLOR,
        fontStyle: 'bold',
      },
    )
    symbolText.setOrigin(0.5)
    symbol = symbolText
  }

  container.add([border, fill, symbol])

  return { container, border, fill, symbol }
}

/**
 * Orbiting Orb 用: 中央核・周囲2 Orb・軌道弧。氷らしい白〜水色で描く。
 */
function drawOrbitingOrbIconSymbol(
  scene: Phaser.Scene,
  size: number,
  color: number,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics()
  const orbitRadius = size * 0.28
  const coreRadius = Math.max(1.5, size * 0.1)
  const smallOrbRadius = Math.max(1.2, size * 0.08)

  // 薄い氷の軌道
  graphics.lineStyle(Math.max(1, size * 0.06), 0xe0f2fe, 0.9)
  graphics.beginPath()
  graphics.arc(0, 0, orbitRadius, -Math.PI * 0.15, Math.PI * 1.05, false)
  graphics.strokePath()

  // 白い氷核
  graphics.fillStyle(0xf0f9ff, 1)
  graphics.fillCircle(0, 0, coreRadius)

  // 周囲の小さな氷片
  graphics.fillStyle(0xbae6fd, 1)
  graphics.fillCircle(Math.cos(-0.4) * orbitRadius, Math.sin(-0.4) * orbitRadius, smallOrbRadius)
  graphics.fillCircle(Math.cos(2.4) * orbitRadius, Math.sin(2.4) * orbitRadius, smallOrbRadius)

  // スキル色の薄い外縁
  graphics.lineStyle(Math.max(1, size * 0.04), color, 0.7)
  graphics.strokeCircle(0, 0, orbitRadius)

  return graphics
}
