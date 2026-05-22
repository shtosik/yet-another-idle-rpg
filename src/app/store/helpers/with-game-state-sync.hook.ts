import { effect } from '@angular/core'
import { getState, patchState, signalStoreFeature, withHooks } from '@ngrx/signals'
import { merge } from 'lodash-es'

export function withGameStateSync<T extends object>(key: string, initialState: T) {
    return signalStoreFeature(
        withHooks({
            onInit(store) {
                const saved = localStorage.getItem(key)
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        const patched = merge({}, initialState, parsed)
                        patchState(store, patched)
                    } catch (e) {
                        console.error(`Failed to rehydrate ${key}`, e)
                    }
                }

                effect(() => {
                    localStorage.setItem(key, JSON.stringify(getState(store)))
                })
            },
        }),
    )
}
