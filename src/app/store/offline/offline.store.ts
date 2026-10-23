import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { ZoneID } from '../../../enums/ids/zone-id.enum'

/** Recent online kill intervals kept for the rolling kill rate. */
const KILL_WINDOW_SIZE = 20
/** Fewer samples than this and the rolling rate isn't trusted (the theoretical rate is used alone). */
const MIN_KILL_SAMPLES = 5
/** A longer gap between kills is a sleep or a pause, not the kill rate. */
const MAX_KILL_INTERVAL_IN_MS = 60 * 1000

/** Online kill intervals on one zone and wave. Another wave's kill rate says nothing about this one. */
export interface KillWindow {
  zoneId: ZoneID
  wave: number
  /** Milliseconds between recent kills, oldest first. */
  intervalsMs: number[]
}

export interface OfflineState {
  /** Host time (ms) the game was last seen running. High-water mark: it never moves back. */
  lastSeenAt: number | null
  killWindow: KillWindow | null
}

const initialState: OfflineState = {
  lastSeenAt: null,
  killWindow: null,
}

const STORE_KEY = 'offlineStore'

const isSameWave = (window: KillWindow | null, zoneId: ZoneID, wave: number): window is KillWindow =>
  !!window && window.zoneId === zoneId && window.wave === wave

export const OfflineStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withMethods((store) => {
    // Not saved: the first kill after a load or a wave change only starts the clock.
    let lastKillAt: number | null = null

    return {
      setLastSeen(at: number): void {
        const lastSeenAt = Math.max(store.lastSeenAt() ?? 0, at)
        if (lastSeenAt !== store.lastSeenAt()) patchState(store, { lastSeenAt })
      },

      /** Called on every online kill with `performance.now()` and the wave it happened on. */
      recordKill(now: number, zoneId: ZoneID, wave: number): void {
        const window = store.killWindow()
        if (!isSameWave(window, zoneId, wave)) {
          lastKillAt = now
          patchState(store, { killWindow: { zoneId, wave, intervalsMs: [] } })
          return
        }

        const interval = lastKillAt === null ? null : now - lastKillAt
        lastKillAt = now
        if (interval === null || interval <= 0 || interval > MAX_KILL_INTERVAL_IN_MS) return

        patchState(store, {
          killWindow: { ...window, intervalsMs: [...window.intervalsMs, interval].slice(-KILL_WINDOW_SIZE) },
        })
      },

      /** Average ms per online kill on this wave, or `null` until there are enough samples there. */
      rollingKillMs(zoneId: ZoneID, wave: number): number | null {
        const window = store.killWindow()
        if (!isSameWave(window, zoneId, wave) || window.intervalsMs.length < MIN_KILL_SAMPLES) return null
        return window.intervalsMs.reduce((sum, ms) => sum + ms, 0) / window.intervalsMs.length
      },

      resetState(): void {
        lastKillAt = null
        patchState(store, initialState)
      },
    }
  }),
)
