import Phaser from 'phaser'
import {
  BOTTOM_CORNER_BUTTON_CENTER_Y,
  BOTTOM_CORNER_BUTTON_DEPTH,
  BOTTOM_CORNER_BUTTON_ICON_COLOR,
  BOTTOM_CORNER_BUTTON_ICON_CSS_COLOR,
  BOTTOM_CORNER_BUTTON_LABEL_FONT_SIZE,
  BOTTOM_CORNER_BUTTON_LABEL_OFFSET_Y,
  BOTTOM_CORNER_BUTTON_RADIUS,
  BOTTOM_CORNER_BUTTON_SELECTED_COLOR,
  BOTTOM_CORNER_BUTTON_STROKE_WIDTH,
  FONT_FAMILY_UI,
  SURVIVOR_SUPPORT_LINK_ENABLED,
  TITLE_SUPPORT_BUTTON_CENTER_X,
  TITLE_SUPPORT_LABEL,
} from '../GameConstants'
import {
  openSupportDeveloperLink,
  type OpenSupportDeveloperLinkResult,
} from './supportDeveloperLink'

export type SupportDeveloperButtonView = {
  setSelected: (selected: boolean) => void
  activate: () => OpenSupportDeveloperLinkResult | null
  destroy: () => void
}

type OpenSupportLink = () => OpenSupportDeveloperLinkResult

export function shouldCreateTitleSupportButton(
  enabled: boolean = SURVIVOR_SUPPORT_LINK_ENABLED,
): boolean {
  return enabled === true
}

/** PointerとKeyboardが共有する1回分のSupport操作。 */
export function activateTitleSupportDeveloperLink(
  openLink: OpenSupportLink = openSupportDeveloperLink,
): OpenSupportDeveloperLinkResult {
  return openLink()
}

export function createSupportDeveloperButton(
  scene: Phaser.Scene,
  onFocus?: () => void,
  canActivate?: () => boolean,
  openLink: OpenSupportLink = openSupportDeveloperLink,
): SupportDeveloperButtonView {
  const centerX = TITLE_SUPPORT_BUTTON_CENTER_X
  const centerY = BOTTOM_CORNER_BUTTON_CENTER_Y

  const circle = scene.add.circle(
    centerX,
    centerY,
    BOTTOM_CORNER_BUTTON_RADIUS,
    0x111111,
    0,
  )
  circle.setStrokeStyle(
    BOTTOM_CORNER_BUTTON_STROKE_WIDTH,
    BOTTOM_CORNER_BUTTON_ICON_COLOR,
  )
  circle.setInteractive({ useHandCursor: true })
  circle.setDepth(BOTTOM_CORNER_BUTTON_DEPTH)

  const heartGraphics = scene.add.graphics()
  heartGraphics.setDepth(BOTTOM_CORNER_BUTTON_DEPTH)
  heartGraphics.fillStyle(BOTTOM_CORNER_BUTTON_ICON_COLOR, 1)
  const pixelSize = 3
  const heartPixels = [
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ]
  const heartLeft = centerX - (heartPixels[0].length * pixelSize) / 2
  const heartTop = centerY - (heartPixels.length * pixelSize) / 2
  for (let row = 0; row < heartPixels.length; row++) {
    for (let column = 0; column < heartPixels[row].length; column++) {
      if (heartPixels[row][column] === 0) {
        continue
      }
      heartGraphics.fillRect(
        heartLeft + column * pixelSize,
        heartTop + row * pixelSize,
        pixelSize,
        pixelSize,
      )
    }
  }

  const labelText = scene.add.text(
    centerX,
    centerY - BOTTOM_CORNER_BUTTON_LABEL_OFFSET_Y,
    TITLE_SUPPORT_LABEL,
    {
      fontFamily: FONT_FAMILY_UI,
      fontSize: BOTTOM_CORNER_BUTTON_LABEL_FONT_SIZE,
      color: BOTTOM_CORNER_BUTTON_ICON_CSS_COLOR,
    },
  )
  labelText.setOrigin(0.5)
  labelText.setDepth(BOTTOM_CORNER_BUTTON_DEPTH)

  let isSelected = false
  let isHovered = false

  const refresh = (): void => {
    const useSelectedColor = isSelected || isHovered
    circle.setStrokeStyle(
      BOTTOM_CORNER_BUTTON_STROKE_WIDTH,
      useSelectedColor
        ? BOTTOM_CORNER_BUTTON_SELECTED_COLOR
        : BOTTOM_CORNER_BUTTON_ICON_COLOR,
    )
  }

  const activate = (): OpenSupportDeveloperLinkResult | null => {
    if (canActivate !== undefined && !canActivate()) {
      return null
    }
    return activateTitleSupportDeveloperLink(openLink)
  }

  const setSelected = (selected: boolean): void => {
    isSelected = selected
    refresh()
  }

  circle.on('pointerover', () => {
    isHovered = true
    refresh()
  })
  circle.on('pointerout', () => {
    isHovered = false
    refresh()
  })
  circle.on('pointerdown', () => {
    if (canActivate !== undefined && !canActivate()) {
      return
    }
    onFocus?.()
    activate()
  })

  const destroy = (): void => {
    circle.destroy()
    heartGraphics.destroy()
    labelText.destroy()
  }

  refresh()
  return { setSelected, activate, destroy }
}
