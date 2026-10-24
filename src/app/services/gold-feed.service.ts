import { Injectable, signal } from '@angular/core'

export interface GoldChange {
  id: number
  amount: number
}

/** How long a change floats next to the HUD gold; matches the `gold-float` animation. */
export const GOLD_FLOAT_MS = 1200
/** Changes of the same sign closer together than this merge into one number. */
const MERGE_WINDOW_MS = 400

/** Gold gained or spent by a player action (buying, selling), shown as floating text in the HUD. */
@Injectable({ providedIn: 'root' })
export class GoldFeedService {
  private nextId = 0
  private lastAt = 0

  readonly changes = signal<GoldChange[]>([])

  show(amount: number): void {
    if (!amount) return

    const now = Date.now()
    const last = this.changes().at(-1)
    const merge = last && now - this.lastAt < MERGE_WINDOW_MS && Math.sign(last.amount) === Math.sign(amount)
    this.lastAt = now

    // A fresh id restarts the float animation for the merged total.
    const change = { id: this.nextId++, amount: merge ? last.amount + amount : amount }
    this.changes.update(list => [...(merge ? list.slice(0, -1) : list), change])
    setTimeout(() => this.changes.update(list => list.filter(c => c.id !== change.id)), GOLD_FLOAT_MS)
  }
}
