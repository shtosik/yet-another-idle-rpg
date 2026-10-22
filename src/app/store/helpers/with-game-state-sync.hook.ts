import { effect } from '@angular/core'
import { getState, patchState, signalStoreFeature, withHooks } from '@ngrx/signals'
import { merge, omit, pick } from 'lodash-es'

/** Saves are batched: at most one `localStorage` write per store per interval. */
const SAVE_INTERVAL_IN_MS = 1000

/**
 * Rehydrates the store from `localStorage` and saves it on change.
 * `transientKeys` are never saved and always start from `initialState` (timers that change every tick).
 * Saved keys missing from `initialState` are dropped, so removed state doesn't linger in saves.
 */
export function withGameStateSync<T extends object>(key: string, initialState: T, transientKeys: (keyof T & string)[] = []) {
    return signalStoreFeature(
        withHooks({
            onInit(store) {
                const saved = localStorage.getItem(key)
                if (saved) {
                    try {
                        const parsed = omit(pick(JSON.parse(saved), Object.keys(initialState)), transientKeys)
                        const patched = merge({}, initialState, parsed)
                        patchState(store, patched)
                    } catch (e) {
                        console.error(`Failed to rehydrate ${key}`, e)
                    }
                }

                let isDirty = false
                const save = () => {
                    if (!isDirty) return
                    isDirty = false
                    try {
                        localStorage.setItem(key, JSON.stringify(omit(getState(store), transientKeys)))
                    } catch (e) {
                        console.error(`Failed to save ${key}`, e)
                    }
                }

                // No flush on page hide: it would re-save over a `localStorage.clear()` done before a reload.
                setInterval(save, SAVE_INTERVAL_IN_MS)

                effect(() => {
                    getState(store)
                    isDirty = true
                })
            },
        }),
    )
}
