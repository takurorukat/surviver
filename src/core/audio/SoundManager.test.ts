import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SoundManager } from './SoundManager'

type SourceMock = {
  buffer: AudioBuffer | null
  loop: boolean
  loopStart: number
  loopEnd: number
  playbackRate: { value: number }
  onended: (() => void) | null
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

function createAudioHarness(state: AudioContextState = 'running') {
  const sources: SourceMock[] = []
  const gainParams: Array<{
    value: number
    cancelScheduledValues: ReturnType<typeof vi.fn>
    setValueAtTime: ReturnType<typeof vi.fn>
    linearRampToValueAtTime: ReturnType<typeof vi.fn>
  }> = []
  const resumeResolvers: Array<() => void> = []

  const context = {
    currentTime: 4,
    state,
    destination: {},
    resume: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resumeResolvers.push(resolve)
        }),
    ),
    createGain: vi.fn(() => {
      const gain = {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      }
      gainParams.push(gain)
      return {
        context,
        gain,
        connect: vi.fn(),
        disconnect: vi.fn(),
      }
    }),
    createBufferSource: vi.fn(() => {
      const source: SourceMock = {
        buffer: null,
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        playbackRate: { value: 1 },
        onended: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      sources.push(source)
      return source
    }),
  }
  const buffers = new Map<string, AudioBuffer>()
  const scene = {
    sound: {
      context,
      unlock: vi.fn(),
      stopAll: vi.fn(),
    },
    cache: {
      audio: {
        exists: (key: string) => buffers.has(key),
        get: (key: string) => buffers.get(key),
      },
    },
  }

  return {
    context,
    gainParams,
    scene,
    sources,
    addBuffer(key: string, duration = 60) {
      buffers.set(
        key,
        { duration, getChannelData: vi.fn() } as unknown as AudioBuffer,
      )
    },
    resolveResume() {
      for (const resolve of resumeResolvers) {
        resolve()
      }
    },
  }
}

describe('SoundManager Web Audio playback', () => {
  let manager: SoundManager

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    manager = new SoundManager({
      bgmEnabledKey: 'sound-manager-test-bgm',
      defaultBgmEnabled: true,
      bgmFadeMs: 100,
      sfxPolicy: {
        maxConcurrent: 1,
        cooldownMs: 0,
        volumeJitter: 0,
        rateJitter: 0,
      },
    })
  })

  afterEach(() => {
    manager.stopSharedBgm({ immediate: true })
    manager.stopAllActiveSfx()
    vi.useRealTimers()
  })

  it('BGM のフェードインと loopEnd を実再生ノードへ設定する', () => {
    const harness = createAudioHarness()
    harness.addBuffer('plains', 62.6)

    expect(
      manager.startNativeBgm(
        harness.scene as never,
        'plains',
        0.4,
        'battle',
        true,
        undefined,
        { loopEnd: 60.1 },
      ),
    ).toBe(true)

    expect(harness.sources).toHaveLength(1)
    expect(harness.sources[0].loop).toBe(true)
    expect(harness.sources[0].loopStart).toBe(0)
    expect(harness.sources[0].loopEnd).toBe(60.1)
    expect(harness.gainParams[0].setValueAtTime).toHaveBeenCalledWith(0, 4)
    expect(harness.gainParams[0].linearRampToValueAtTime).toHaveBeenCalledWith(
      0.4,
      4.1,
    )
  })

  it('BGM 切替時は旧曲をフェードアウトしてから新曲を開始する', () => {
    const harness = createAudioHarness()
    harness.addBuffer('title')
    harness.addBuffer('battle')
    manager.startNativeBgm(
      harness.scene as never,
      'title',
      0.2,
      'title',
      true,
    )

    manager.startNativeBgm(
      harness.scene as never,
      'battle',
      0.4,
      'battle',
      true,
    )

    expect(harness.sources).toHaveLength(1)
    expect(harness.gainParams[0].linearRampToValueAtTime).toHaveBeenLastCalledWith(
      0,
      4.1,
    )
    expect(harness.sources[0].stop).toHaveBeenCalledWith(4.1)

    vi.advanceTimersByTime(130)

    expect(harness.sources).toHaveLength(2)
    expect(harness.sources[1].buffer).toBe(
      harness.scene.cache.audio.get('battle'),
    )
    expect(manager.getActiveBgmAudioKey()).toBe('battle')
  })

  it('AudioContext の再開待ち中も同一SEの同時発音上限を守る', async () => {
    const harness = createAudioHarness('suspended')
    harness.addBuffer('hit', 0.2)

    manager.playOneShot(harness.scene as never, 'hit', 0.5)
    manager.playOneShot(harness.scene as never, 'hit', 0.5)

    expect(harness.sources).toHaveLength(0)
    harness.resolveResume()
    await Promise.resolve()

    expect(harness.sources).toHaveLength(1)
    expect(harness.sources[0].start).toHaveBeenCalledTimes(1)
  })
})
