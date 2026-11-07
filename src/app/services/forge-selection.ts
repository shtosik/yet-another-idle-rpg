import { inject, Injectable, signal } from '@angular/core'
import { stackKey } from '../store/player/inventory'
import { MergeSource } from '../store/player/merge'
import { PlayerStore } from '../store/player/player.store'
import { TownsStore } from '../store/towns/towns.store'

export type ForgeInput = 'base' | 'sacrifice'

/** Transient bridge between the sibling inventory, equipment and Forge panels. */
@Injectable({ providedIn: 'root' })
export class ForgeSelection {
  private readonly playerStore = inject(PlayerStore)
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
    // One equipped slot supplies one copy; an inventory stack supplies both inputs only while it holds two.
    if (source?.from === 'equipped' && other?.from === 'equipped' && source.slot === other.slot) return
    if (source?.from === 'inventory' && other?.from === 'inventory' && stackKey(source.item) === stackKey(other.item)) {
      const { id, tier, upgradeLevel } = source.item
      if (this.playerStore.itemCount(id, tier, upgradeLevel) < 2) return
    }
    this[slot].set(source)
  }

  clear(): void {
    this.base.set(null)
    this.sacrifice.set(null)
    this.dragged.set(null)
  }
}
