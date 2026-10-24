import { Injectable, signal } from '@angular/core'

/** Currencies shown in the HUD strip. */
export type Currency = 'gold' | 'explorerTokens'

export interface CurrencyChange {
  id: number
  currency: Currency
  amount: number
}

/** How long a change floats under its HUD value; matches the `currency-float` animation. */
export const CURRENCY_FLOAT_MS = 1200
/** Changes to the same currency with the same sign closer together than this merge into one number. */
const MERGE_WINDOW_MS = 400

/** Currency gained or spent by a player action (buying, selling, claiming tasks), shown as floating text in the HUD. */
@Injectable({ providedIn: 'root' })
export class CurrencyFeedService {
  private nextId = 0
  private lastAt: Partial<Record<Currency, number>> = {}
  private readonly list = signal<CurrencyChange[]>([])

  readonly changes = this.list.asReadonly()

  show(currency: Currency, amount: number): void {
    if (!amount) return

    const now = Date.now()
    const last = this.list().filter(c => c.currency === currency).at(-1)
    const merge = last && now - (this.lastAt[currency] ?? 0) < MERGE_WINDOW_MS && Math.sign(last.amount) === Math.sign(amount)
    this.lastAt[currency] = now

    // A fresh id restarts the float animation for the merged total.
    const change = { id: this.nextId++, currency, amount: merge ? last.amount + amount : amount }
    this.list.update(list => [...list.filter(c => !merge || c !== last), change])
    setTimeout(() => this.list.update(list => list.filter(c => c.id !== change.id)), CURRENCY_FLOAT_MS)
  }
}
