import { inject, Injectable, signal } from '@angular/core'
import { OfflineStore } from '../store/offline/offline.store'

/**
 * Game time (docs/systems/offline-progress.md): the clock game rules read for crops, cooldowns and the arena.
 * It only moves forward, online with each tick and offline by the claimed time away, so a moved device clock skips nothing.
 * Saved as `gameMs` in `OfflineStore`, written with `lastSeenAt`; a save without it starts at `lastSeenAt`,
 * which puts the wall timestamps of older saves on the game timeline unchanged.
 */
@Injectable({ providedIn: 'root' })
export class GameClock {
  private offlineStore = inject(OfflineStore)

  private ms = this.offlineStore.gameMs() ?? this.offlineStore.lastSeenAt() ?? 0
  private readonly currentSecond = signal(Math.floor(this.ms / 1000))

  /** Whole game seconds; changes at most once a second, for countdowns and computeds. */
  readonly second = this.currentSecond.asReadonly()

  private readonly settled = signal(true)
  /**
   * False while an offline claim waits for the host: its time away hasn't been added yet, so anything that stamps a
   * game time now (planting, a turn-in, entering the arena) would be aged by that whole absence once it lands. Those refuse meanwhile.
   */
  readonly isSettled = this.settled.asReadonly()

  /** Only the offline claim calls this. */
  setClaimPending(pending: boolean): void {
    this.settled.set(!pending)
  }

  /** Game time in ms, untracked, for rules. */
  nowMs(): number {
    return this.ms
  }

  /** Only the game loop's tick and the offline claim move the clock. */
  advance(ms: number): void {
    if (ms <= 0) return
    this.ms += ms
    this.currentSecond.set(Math.floor(this.ms / 1000))
  }
}
