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

/** Writes every synced store now, skipping the batch interval (an offline claim must land before its modal opens). */
export function saveGameStateNow(): void {
    immediateSavers.forEach(save => save())
}

/** What is written to `localStorage` (before encoding). */
interface SaveEnvelope {
    /** The store's save version when it was written. */
    v: number
    state: object
}

/** Saves from before versioning are a bare state object; they count as version 1. */
const LEGACY_SAVE_VERSION = 1

const isEnvelope = (data: object): data is SaveEnvelope =>
    typeof (data as SaveEnvelope).v === 'number' && typeof (data as SaveEnvelope).state === 'object'

export interface GameStateSyncOptions<T> {
    /**
     * Bump when a change to the saved state shape would break loading an older save. A save with another
     * version is ignored and the store starts from `initialState` (pre-release; a migration table comes later).
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
                // An unreadable save is never overwritten: the store runs from `initialState` and doesn't save this
                // session, so a bug can't wipe progress (docs/systems/persistence.md).
                let canSave = true
                const saved = localStorage.getItem(key)
                if (saved) {
                    try {
                        const data = JSON.parse(decodeSave(saved))
                        if (typeof data !== 'object' || data === null) throw new Error('save is not an object')
                        const { v, state } = isEnvelope(data) ? data : { v: LEGACY_SAVE_VERSION, state: data }

                        if (v === version) {
                            patchState(store, merge({}, initialState, pick(state, savedKeys)))
                        } else {
                            console.info(`${key}: save version ${v}, expected ${version}; starting fresh`)
                        }
                    } catch (e) {
                        canSave = false
                        console.error(`Failed to rehydrate ${key}; it won't be saved this session`, e)
                    }
                }

                let isDirty = false
                const save = (force = false) => {
                    if (!canSave || (!isDirty && !force)) return
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
                const stateSignals = store as unknown as Record<string, () => unknown>
                effect(() => {
                    savedKeys.forEach(k => stateSignals[k]())
                    isDirty = true
                })
            },
        }),
    )
}
