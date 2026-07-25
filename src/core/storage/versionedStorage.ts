/**
 * ゲーム共通の localStorage 保存ユーティリティ。
 * Survivor 固有のキー・型・移行ロジックは import しない。
 */

export type StorageKeyNamespace = string
export type StorageKeyName = string

/** 将来のゲーム間衝突を避けるキー命名: `namespace:name` */
export function createStorageKey(
  namespace: StorageKeyNamespace,
  name: StorageKeyName,
): string {
  return `${namespace}:${name}`
}

export type VersionedStorageLoadSource =
  | 'storage'
  | 'default'
  | 'migrated'

export type VersionedStorageLoadFailureReason =
  | 'missing'
  | 'parse_error'
  | 'invalid_shape'
  | 'migration_failed'
  | 'storage_error'

export type VersionedStorageLoadResult<T> =
  | {
      ok: true
      data: T
      source: VersionedStorageLoadSource
    }
  | {
      ok: false
      data: T
      reason: VersionedStorageLoadFailureReason
      /** 破損時も削除しない。デバッグ用に生文字列を返すことがある */
      raw?: string
    }

export type VersionedStorageWriteResult =
  | { ok: true }
  | { ok: false; reason: 'storage_error' }

export type VersionedStorageRemoveResult =
  | { ok: true }
  | { ok: false; reason: 'storage_error' }

export type VersionedStorageMigrateFn<T> = (
  oldData: unknown,
  fromVersion: number,
) => T | null

export type VersionedStorageValidateFn<T> = (value: unknown) => value is T

export type VersionedStorageConfig<T> = {
  key: string
  version: number
  createDefault: () => T
  /** 旧バージョンから現在版へ。null を返すと移行失敗 → 初期値 */
  migrate?: VersionedStorageMigrateFn<T>
  /** 未指定時は payload が object かどうかだけ見る */
  validate?: VersionedStorageValidateFn<T>
}

export type VersionedStorage<T> = {
  readonly key: string
  readonly version: number
  load(): VersionedStorageLoadResult<T>
  save(data: T): VersionedStorageWriteResult
  remove(): VersionedStorageRemoveResult
}

type StoredEnvelope = {
  version: number
  payload: unknown
}

type StorageBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEnvelope(raw: string): StoredEnvelope | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed)) {
    return null
  }
  if (typeof parsed.version !== 'number' || !Number.isFinite(parsed.version)) {
    return null
  }
  if (!('payload' in parsed)) {
    return null
  }
  return {
    version: parsed.version,
    payload: parsed.payload,
  }
}

function readRaw(backend: StorageBackend, key: string): string | null | 'error' {
  try {
    return backend.getItem(key)
  } catch {
    return 'error'
  }
}

function writeRaw(backend: StorageBackend, key: string, value: string): boolean {
  try {
    backend.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function removeRaw(backend: StorageBackend, key: string): boolean {
  try {
    backend.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * バージョン付き JSON を localStorage に保存・読込する小さなヘルパー。
 *
 * - load 失敗時は createDefault() を返す（破損データは削除しない）
 * - save は { version, payload } 形式で書き込む
 */
export function createVersionedStorage<T>(
  config: VersionedStorageConfig<T>,
  backend: StorageBackend = localStorage,
): VersionedStorage<T> {
  const validate: VersionedStorageValidateFn<T> =
    config.validate ??
    ((value: unknown): value is T => isRecord(value))

  function load(): VersionedStorageLoadResult<T> {
    const raw = readRaw(backend, config.key)
    if (raw === 'error') {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'storage_error',
      }
    }
    if (raw === null) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'missing',
      }
    }

    const envelope = parseEnvelope(raw)
    if (envelope === null) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'parse_error',
        raw,
      }
    }

    if (envelope.version === config.version) {
      if (!validate(envelope.payload)) {
        return {
          ok: false,
          data: config.createDefault(),
          reason: 'invalid_shape',
          raw,
        }
      }
      return {
        ok: true,
        data: envelope.payload,
        source: 'storage',
      }
    }

    if (envelope.version > config.version) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'invalid_shape',
        raw,
      }
    }

    if (!config.migrate) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'migration_failed',
        raw,
      }
    }

    const migrated = config.migrate(envelope.payload, envelope.version)
    if (migrated === null) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'migration_failed',
        raw,
      }
    }

    if (!validate(migrated)) {
      return {
        ok: false,
        data: config.createDefault(),
        reason: 'migration_failed',
        raw,
      }
    }

    return {
      ok: true,
      data: migrated,
      source: 'migrated',
    }
  }

  function save(data: T): VersionedStorageWriteResult {
    const envelope: StoredEnvelope = {
      version: config.version,
      payload: data,
    }
    const ok = writeRaw(backend, config.key, JSON.stringify(envelope))
    if (!ok) {
      return { ok: false, reason: 'storage_error' }
    }
    return { ok: true }
  }

  function remove(): VersionedStorageRemoveResult {
    const ok = removeRaw(backend, config.key)
    if (!ok) {
      return { ok: false, reason: 'storage_error' }
    }
    return { ok: true }
  }

  return {
    key: config.key,
    version: config.version,
    load,
    save,
    remove,
  }
}
