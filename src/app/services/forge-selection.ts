import { inject, Injectable, signal } from '@angular/core'
import { MergeSource } from '../store/player/merge'
import { TownsStore } from '../store/towns/towns.store'

export type ForgeInput = 'base' | 'sacrifice'

/** Transient bridge between the sibling inventory, equipment and Forge panels. */
@Injectable({ providedIn: 'root' })
export class ForgeSelection {
  readonly open = inject(TownsStore).forgeOpen
  readonly base = signal<MergeSource | null>(null)
  readonly sacrifice = signal<MergeSource | null>(null)
  readonly dragged = signal<MergeSource | null>(null)

  select(source: MergeSource): void {
    this.setSlot(this.base() ? 'sacrifice' : 'base', source)
  }

  setSlot(slot: ForgeInput, source: MergeSource | null): void {
    if (!this.open()) return
    const other = this[slot === 'base' ? 'sacrifice' : 'base']()
    // An inventory stack can supply two copies; one equipped slot can only supply one.
    if (source?.from === 'equipped' && other?.from === 'equipped' && source.slot === other.slot) return
    this[slot].set(source)
  }

  clear(): void {
    this.base.set(null)
    this.sacrifice.set(null)
    this.dragged.set(null)
  }
}
