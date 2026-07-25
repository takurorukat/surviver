import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStorageKey,
  createVersionedStorage,
  type VersionedStorageConfig,
} from './versionedStorage'

type TestSave = {
  coins: number
  level: number
}

function makeConfig(
  overrides: Partial<VersionedStorageConfig<TestSave>> = {},
): VersionedStorageConfig<TestSave> {
  return {
    key: 'test-game:save',
    version: 2,
    createDefault: () => ({ coins: 0, level: 1 }),
    validate: (value): value is TestSave => {
      if (typeof value !== 'object' || value === null) {
        return false
      }
      const obj = value as Record<string, unknown>
      return typeof obj.coins === 'number' && typeof obj.level === 'number'
    },
    migrate: (oldData, fromVersion) => {
      if (fromVersion === 1 && isRecord(oldData) && typeof oldData.coins === 'number') {
        return {
          coins: oldData.coins,
          level: 1,
        }
      }
      return null
    },
    ...overrides,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

describe('createStorageKey', () => {
  it('namespace と name を結合する', () => {
    expect(createStorageKey('mage-survivor', 'save')).toBe('mage-survivor:save')
    expect(createStorageKey('mage-clicker', 'settings')).toBe('mage-clicker:settings')
  })
})

describe('createVersionedStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('正常な保存・読込', () => {
    const storage = createVersionedStorage(makeConfig())
    const saveResult = storage.save({ coins: 42, level: 3 })
    expect(saveResult.ok).toBe(true)

    const loadResult = storage.load()
    expect(loadResult.ok).toBe(true)
    if (loadResult.ok) {
      expect(loadResult.source).toBe('storage')
      expect(loadResult.data).toEqual({ coins: 42, level: 3 })
    }
  })

  it('localStorage が空の場合は初期値', () => {
    const storage = createVersionedStorage(makeConfig())
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(false)
    if (!loadResult.ok) {
      expect(loadResult.reason).toBe('missing')
      expect(loadResult.data).toEqual({ coins: 0, level: 1 })
    }
  })

  it('壊れた JSON は parse_error で初期値（削除しない）', () => {
    localStorage.setItem('test-game:save', '{not-json')
    const storage = createVersionedStorage(makeConfig())
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(false)
    if (!loadResult.ok) {
      expect(loadResult.reason).toBe('parse_error')
      expect(loadResult.data).toEqual({ coins: 0, level: 1 })
      expect(loadResult.raw).toBe('{not-json')
    }
    expect(localStorage.getItem('test-game:save')).toBe('{not-json')
  })

  it('期待しない JSON 構造は invalid_shape', () => {
    localStorage.setItem(
      'test-game:save',
      JSON.stringify({ version: 2, payload: { coins: 'many' } }),
    )
    const storage = createVersionedStorage(makeConfig())
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(false)
    if (!loadResult.ok) {
      expect(loadResult.reason).toBe('invalid_shape')
      expect(loadResult.data).toEqual({ coins: 0, level: 1 })
    }
  })

  it('バージョン移行に成功する', () => {
    localStorage.setItem(
      'test-game:save',
      JSON.stringify({ version: 1, payload: { coins: 99 } }),
    )
    const storage = createVersionedStorage(makeConfig())
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(true)
    if (loadResult.ok) {
      expect(loadResult.source).toBe('migrated')
      expect(loadResult.data).toEqual({ coins: 99, level: 1 })
    }
  })

  it('移行失敗時は初期値復帰', () => {
    localStorage.setItem(
      'test-game:save',
      JSON.stringify({ version: 1, payload: { wrong: true } }),
    )
    const storage = createVersionedStorage(makeConfig())
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(false)
    if (!loadResult.ok) {
      expect(loadResult.reason).toBe('migration_failed')
      expect(loadResult.data).toEqual({ coins: 0, level: 1 })
    }
  })

  it('localStorage 読込例外は storage_error', () => {
    const backend = {
      getItem: vi.fn(() => {
        throw new Error('quota')
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    const storage = createVersionedStorage(makeConfig(), backend)
    const loadResult = storage.load()
    expect(loadResult.ok).toBe(false)
    if (!loadResult.ok) {
      expect(loadResult.reason).toBe('storage_error')
      expect(loadResult.data).toEqual({ coins: 0, level: 1 })
    }
  })

  it('localStorage 保存例外は save が失敗する', () => {
    const backend = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('quota')
      }),
      removeItem: vi.fn(),
    }
    const storage = createVersionedStorage(makeConfig(), backend)
    const saveResult = storage.save({ coins: 1, level: 1 })
    expect(saveResult.ok).toBe(false)
    if (!saveResult.ok) {
      expect(saveResult.reason).toBe('storage_error')
    }
  })

  it('remove でキーを削除できる', () => {
    const storage = createVersionedStorage(makeConfig())
    storage.save({ coins: 5, level: 2 })
    expect(localStorage.getItem('test-game:save')).not.toBeNull()

    const removeResult = storage.remove()
    expect(removeResult.ok).toBe(true)
    expect(localStorage.getItem('test-game:save')).toBeNull()
  })
})
