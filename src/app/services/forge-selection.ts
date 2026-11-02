import { inject, Injectable, signal } from '@angular/core'
import { MergeSource } from '../store/player/merge'
import { TownsStore } from '../store/towns/towns.store'

/** Transient bridge between the sibling inventory, equipment and Forge panels. */
@Injectable({ providedIn: 'root' })
export class ForgeSelection {
  readonly open = inject(TownsStore).forgeOpen
  readonly selected = signal<MergeSource | null>(null)
  readonly dragged = signal<MergeSource | null>(null)

  select(source: MergeSource): void {
    if (this.open()) this.selected.set(source)
  }

  clear(): void {
    this.selected.set(null)
    this.dragged.set(null)
  }
}
