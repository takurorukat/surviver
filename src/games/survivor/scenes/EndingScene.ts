import Phaser from 'phaser'
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  FONT_FAMILY_UI,
  ENDING_VICTORY_KEY,
  ENDING_FINAL_ASCENT_KEY,
  ENDING_FADE_MS,
  ENDING_INPUT_LOCK_MS,
  ENDING_CONTINUE_HINT,
} from '../GameConstants'
import { GameAudioSystem } from '../systems/GameAudioSystem'
import {
  advanceEndingOnInput,
  createEndingSequenceState,
  unlockEndingInput,
  type EndingSequenceState,
} from '../systems/endingSequence'
import { markEndingSeen } from '../systems/UnlockSaveSystem'

export type EndingSceneData = {
  /** true のとき、2枚目終了で endingSeen を保存する（初回自動再生） */
  markSeenOnComplete?: boolean
}

/**
 * 4エリア全クリア後のエンディング（Victory → Final Ascent → Title）。
 * ゲーム進行ロジックは持たない。
 */
export class EndingScene extends Phaser.Scene {
  private sequenceState: EndingSequenceState = createEndingSequenceState()
  private markSeenOnComplete = true
  private image: Phaser.GameObjects.Image | null = null
  private hintText: Phaser.GameObjects.Text | null = null
  private keySpace: Phaser.Input.Keyboard.Key | null = null
  private keyEnter: Phaser.Input.Keyboard.Key | null = null
  private inputUnlockTimer: Phaser.Time.TimerEvent | null = null
  private fadeTween: Phaser.Tweens.Tween | null = null
  private isAdvancing = false
  private audioSystem: GameAudioSystem | null = null
  private onPointerDown: (() => void) | null = null

  constructor() {
    super({ key: 'EndingScene' })
  }

  init(data: EndingSceneData): void {
    this.markSeenOnComplete = data.markSeenOnComplete !== false
    this.sequenceState = createEndingSequenceState()
    this.isAdvancing = false
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000)
    this.audioSystem = new GameAudioSystem(this)
    this.audioSystem.prepare()
    // Ending 中は無音（既存 BGM をフェードアウト）
    this.audioSystem.stopBgm()
    this.audioSystem.stopAllSounds()

    this.showCurrentScreen(true)
    this.bindInput()
  }

  shutdown(): void {
    this.unbindInput()
    this.clearInputUnlockTimer()
    if (this.fadeTween !== null) {
      this.fadeTween.stop()
      this.fadeTween = null
    }
    this.image = null
    this.hintText = null
    this.audioSystem = null
  }

  private bindInput(): void {
    this.onPointerDown = () => {
      this.tryAdvance()
    }
    this.input.on('pointerdown', this.onPointerDown)

    if (this.input.keyboard !== null) {
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      this.keySpace.on('down', () => {
        this.tryAdvance()
      })
      this.keyEnter.on('down', () => {
        this.tryAdvance()
      })
    }
  }

  private unbindInput(): void {
    if (this.onPointerDown !== null) {
      this.input.off('pointerdown', this.onPointerDown)
      this.onPointerDown = null
    }
    if (this.keySpace !== null) {
      this.keySpace.removeAllListeners()
      this.keySpace.destroy()
      this.keySpace = null
    }
    if (this.keyEnter !== null) {
      this.keyEnter.removeAllListeners()
      this.keyEnter.destroy()
      this.keyEnter = null
    }
  }

  private clearInputUnlockTimer(): void {
    if (this.inputUnlockTimer !== null) {
      this.inputUnlockTimer.remove(false)
      this.inputUnlockTimer = null
    }
  }

  private textureKeyForCurrentScreen(): string {
    if (this.sequenceState.screen === 'victory') {
      return ENDING_VICTORY_KEY
    }
    return ENDING_FINAL_ASCENT_KEY
  }

  private fitImageContain(image: Phaser.GameObjects.Image): void {
    const sourceWidth = image.width
    const sourceHeight = image.height
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return
    }
    const scale = Math.min(GAME_WIDTH / sourceWidth, GAME_HEIGHT / sourceHeight)
    image.setScale(scale)
    image.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2)
  }

  private showCurrentScreen(fadeIn: boolean): void {
    this.clearInputUnlockTimer()
    this.isAdvancing = false

    if (this.image !== null) {
      this.image.destroy()
      this.image = null
    }
    if (this.hintText !== null) {
      this.hintText.destroy()
      this.hintText = null
    }

    const textureKey = this.textureKeyForCurrentScreen()
    this.image = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey)
    this.image.setOrigin(0.5)
    this.fitImageContain(this.image)
    this.image.setDepth(1)

    this.hintText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 18,
      ENDING_CONTINUE_HINT,
      {
        fontFamily: FONT_FAMILY_UI,
        fontSize: '14px',
        color: '#cbd5e1',
        stroke: '#000000',
        strokeThickness: 3,
      },
    )
    this.hintText.setOrigin(0.5)
    this.hintText.setDepth(2)
    this.hintText.setAlpha(0)

    const lockMs = Math.max(ENDING_FADE_MS, ENDING_INPUT_LOCK_MS)

    if (fadeIn) {
      this.image.setAlpha(0)
      this.fadeTween = this.tweens.add({
        targets: [this.image, this.hintText],
        alpha: 1,
        duration: ENDING_FADE_MS,
        onComplete: () => {
          this.fadeTween = null
        },
      })
    } else {
      this.image.setAlpha(1)
      this.hintText.setAlpha(1)
    }

    this.inputUnlockTimer = this.time.delayedCall(lockMs, () => {
      this.inputUnlockTimer = null
      this.sequenceState = unlockEndingInput(this.sequenceState)
    })
  }

  private tryAdvance(): void {
    if (this.isAdvancing) {
      return
    }

    const nextState = advanceEndingOnInput(this.sequenceState)
    if (nextState === this.sequenceState) {
      return
    }

    this.isAdvancing = true
    this.sequenceState = nextState

    if (nextState.finished) {
      this.finishAndReturnToTitle()
      return
    }

    // Victory → Final Ascent: フェードアウトしてから次画面
    const targets: Phaser.GameObjects.GameObject[] = []
    if (this.image !== null) {
      targets.push(this.image)
    }
    if (this.hintText !== null) {
      targets.push(this.hintText)
    }

    if (targets.length === 0) {
      this.showCurrentScreen(true)
      return
    }

    this.fadeTween = this.tweens.add({
      targets,
      alpha: 0,
      duration: ENDING_FADE_MS,
      onComplete: () => {
        this.fadeTween = null
        this.showCurrentScreen(true)
      },
    })
  }

  private finishAndReturnToTitle(): void {
    this.unbindInput()
    this.clearInputUnlockTimer()

    if (this.markSeenOnComplete) {
      markEndingSeen()
    }

    if (this.audioSystem !== null) {
      this.audioSystem.stopAllSounds()
    }

    // GameScene が残っていれば止める（Title の二重表示・裏進行を防ぐ）
    this.scene.stop('GameScene')

    this.scene.start('TitleScene')
  }
}
