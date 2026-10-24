import { effect, isDevMode } from '@angular/core'
import { getState, patchState, signalStoreFeature, withHooks } from '@ngrx/signals'
import { merge, omit, pick } from 'lodash-es'
import { compressToUTF16, decompressFromUTF16 } from 'lz-string'

/** Saves are batched: at most one `localStorage` write per store per interval. */
const SAVE_INTERVAL_IN_MS = 1000

/** Marks an encoded save. Plain JSON starts with `{`, so both formats load in either build. */
const ENCODED_PREFIX = 'z:'

/**
 * Production saves are lz-string compressed: not readable or hand-editable at a glance, and smaller.
 * This is obfuscation, not protection (docs/ideas/offline-progress.md, Anti-cheat). Dev builds keep plain JSON.
 */
const encodeSave = (json: string): string => isDevMode() ? json : ENCODED_PREFIX + compressToUTF16(json)

function decodeSave(saved: string): string {
    if (!saved.startsWith(ENCODED_PREFIX)) return saved
    const json = decompressFromUTF16(saved.slice(ENCODED_PREFIX.length))
    if (!json) throw new Error('corrupt encoded save')
    return json
}

const immediateSavers = new Set<() => void>()

/** Save version of every synced store by `localStorage` key; all of them are created with `GameComponent`. */
const syncedVersions = new Map<string, number>()

/** Set once saves are replaced by an import: no store may write its old state back before the reload. */
let savesSuspended = false

/** Writes every synced store now, skipping the batch interval (an offline claim must land before its modal opens). */
export function saveGameStateNow(): void {
    immediateSavers.forEach(save => save())
}

/** Every synced store's raw save, written fresh first. Raw means still encoded; `readSave` loads either format. */
export function exportGameSaves(): Record<string, string> {
    saveGameStateNow()
    const saves: Record<string, string> = {}
    syncedVersions.forEach((_, key) => {
        const raw = localStorage.getItem(key)
        if (raw !== null) saves[key] = raw
    })
    return saves
}

/**
 * How a raw save would load into a store of save version `version`: `load`, `outdated` (the store would start
 * fresh), `newer` (written by a newer build; the store would start fresh and not save) or `unreadable`.
 */
export function classifySave(raw: unknown, version: number): SaveReadResult['kind'] | 'unreadable' {
    if (typeof raw !== 'string') return 'unreadable'
    try {
        return readSave(raw, version).kind
    } catch {
        return 'unreadable'
    }
}

/** `classifySave` against the store saved under `key` in this build; `unknown` when no store uses that key. */
export function checkImportedSave(key: string, raw: unknown): ReturnType<typeof classifySave> | 'unknown' {
    const version = syncedVersions.get(key)
    return version === undefined ? 'unknown' : classifySave(raw, version)
}

/**
 * Replaces every synced store's save with `saves` (a store missing from it is cleared) and stops all saving,
 * so the running state can't overwrite the import. The caller reloads the page right after.
 */
export function replaceGameSaves(saves: Record<string, string>): void {
    savesSuspended = true
    syncedVersions.forEach((_, key) => key in saves ? localStorage.setItem(key, saves[key]) : localStorage.removeItem(key))
}

/** What is written to `localStorage` (before encoding). */
interface SaveEnvelope {
    /** The store's save version when it was written. */
    v: number
    state: object
}

/** Saves from before versioning are a bare state object; they count as version 1. */
const LEGACY_SAVE_VERSION = 1

const isPlainObject = (value: unknown): value is object =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * What loading a save should do:
 * - `load`: same version, patch `state` in.
 * - `outdated`: an older version; start from `initialState`, and the next save replaces it.
 * - `newer`: written by a newer build (another worktree on the same origin); start from `initialState`
 *   but never save over it.
 */
export type SaveReadResult =
    | { kind: 'load', state: object }
    | { kind: 'outdated', savedVersion: number }
    | { kind: 'newer', savedVersion: number }

/** Parses a raw `localStorage` value. Throws when it can't be read at all (the caller then never saves over it). */
export function readSave(raw: string, version: number): SaveReadResult {
    const data: unknown = JSON.parse(decodeSave(raw))
    if (!isPlainObject(data)) throw new Error('save is not an object')

    // A save with a `v` is an envelope and must be a valid one; anything else is a bare pre-versioning state.
    let savedVersion = LEGACY_SAVE_VERSION
    let state: object = data
    if ('v' in data) {
        const envelope = data as Partial<SaveEnvelope>
        if (typeof envelope.v !== 'number' || !isPlainObject(envelope.state)) throw new Error('malformed save envelope')
        savedVersion = envelope.v
        state = envelope.state
    }

    if (savedVersion === version) return { kind: 'load', state }
    return savedVersion < version ? { kind: 'outdated', savedVersion } : { kind: 'newer', savedVersion }
}

export interface GameStateSyncOptions<T> {
    /**
     * Bump when a change to the saved state shape would break loading an older save. An older save is ignored
     * and replaced (the store starts from `initialState`); a newer one is left alone. Pre-release; a migration
     * table comes later.
     */
    version?: number
    /** Never saved; always start from `initialState` (timers that change every tick). Changing them doesn't trigger a save. */
    transientKeys?: (keyof T & string)[]
}

/**
 * Rehydrates the store from `localStorage` and saves it on change.
 * Saved keys missing from `initialState` are dropped, so removed state doesn't linger in saves.
 */
export function withGameStateSync<T extends object>(key: string, initialState: T, options: GameStateSyncOptions<T> = {}) {
    const { version = LEGACY_SAVE_VERSION, transientKeys = [] } = options
    const savedKeys = Object.keys(initialState).filter(k => !(transientKeys as string[]).includes(k))

    return signalStoreFeature(
        withHooks({
            onInit(store) {
                // An unreadable or newer save is never overwritten: the store runs from `initialState` and doesn't
                // save this session, so a bug or an older build can't wipe progress (docs/systems/persistence.md).
                let canSave = true
                const saved = localStorage.getItem(key)
                if (saved) {
                    try {
                        const result = readSave(saved, version)
                        switch (result.kind) {
                            case 'load':
                                patchState(store, merge({}, initialState, pick(result.state, savedKeys)))
                                break
                            case 'outdated':
                                console.info(`${key}: save version ${result.savedVersion} < ${version}; starting fresh`)
                                break
                            case 'newer':
                                canSave = false
                                console.warn(`${key}: save version ${result.savedVersion} > ${version} (newer build); it won't be saved this session`)
                                break
                        }
                    } catch (e) {
                        canSave = false
                        console.error(`Failed to rehydrate ${key}; it won't be saved this session`, e)
                    }
                }

                syncedVersions.set(key, version)
                let isDirty = false
                const save = (force = false) => {
                    if (savesSuspended || !canSave || (!isDirty && !force)) return
                    isDirty = false
                    try {
                        const envelope: SaveEnvelope = { v: version, state: omit(getState(store), transientKeys) }
                        localStorage.setItem(key, encodeSave(JSON.stringify(envelope)))
                    } catch (e) {
                        console.error(`Failed to save ${key}`, e)
                    }
                }

                // No flush on page hide: it would re-save over a `localStorage.clear()` done before a reload.
                setInterval(save, SAVE_INTERVAL_IN_MS)
                // Forced: the dirty-marking effect may not have run yet for a change made this turn.
                immediateSavers.add(() => save(true))

                // Tracks saved keys only, so a transient timer ticking doesn't rewrite the whole store every second.
                // NgRx Signal Stores expose one signal per top-level state key, and `patchState` only sets the keys
                // whose reference changed, so reading a key's signal subscribes to that key alone.
                const stateSignals = store as unknown as Record<string, () => unknown>
                effect(() => {
                    savedKeys.forEach(k => stateSignals[k]())
                    isDirty = true
                })
            },
        }),
    )
}
