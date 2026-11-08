import { computed, inject, Injectable, signal } from '@angular/core'
import { evaluateMerge, MergeResult, MergeSource, sharesOneCopy, upgradeQuote } from '../store/player/merge'
import { PlayerStore } from '../store/player/player.store'
import { TownsStore } from '../store/towns/towns.store'
import { EquipmentItem } from '../../interfaces/player/equipment.type'

export type ForgeInput = 'base' | 'sacrifice'

/**
 * The Forge session, shared by the sibling inventory, equipment and Forge panels: the two picked sources, the
 * attempt's quote and evaluation, and the merge with what stays selected after it.
 */
@Injectable({ providedIn: 'root' })
export class ForgeSelection {
  private readonly playerStore = inject(PlayerStore)
  readonly open = inject(TownsStore).forgeOpen
  readonly base = signal<MergeSource | null>(null)
  readonly sacrifice = signal<MergeSource | null>(null)
  readonly dragged = signal<MergeSource | null>(null)

  /** The base gear as picked. */
  readonly item = computed(() => this.resolve(this.base()))
  readonly sacrificeItem = computed(() => this.resolve(this.sacrifice()))
  /** Cost, chance and the +1 gear for the base, also while the merge is refused. */
  readonly quote = computed(() => {
    const item = this.item()
    return item ? upgradeQuote(item) : null
  })
  /** Null until both inputs are picked. */
  readonly evaluation = computed(() => {
    const base = this.base()
    const sacrifice = this.sacrifice()
    if (!base || !sacrifice) return null
    return evaluateMerge({
      base, sacrifice, inventory: this.playerStore.inventory(), equipment: this.playerStore.equipment(),
      capacity: this.playerStore.inventoryCapacity(), goldCoins: this.playerStore.resources.goldCoins(),
    })
  })

  select(source: MergeSource): void {
    this.setSlot(this.base() ? 'sacrifice' : 'base', source)
  }

  setSlot(slot: ForgeInput, source: MergeSource | null): void {
    if (!this.open()) return
    const other = this[slot === 'base' ? 'sacrifice' : 'base']()
    if (source && other && sharesOneCopy(source, other, this.playerStore.inventory())) return
    this[slot].set(source)
  }

  /**
   * Rolls the attempt when it is ready. The sacrifice is always used up; an upgraded inventory base stays selected as
   * its new stack, so the next attempt needs only a new sacrifice. `before` is the base as it was.
   */
  merge(): { result: MergeResult, before: EquipmentItem, after: EquipmentItem } | null {
    const base = this.base()
    const sacrifice = this.sacrifice()
    const quote = this.quote()
    const before = this.item()
    if (!base || !sacrifice || !quote || !before || this.evaluation()?.status !== 'ready') return null
    const result = this.playerStore.mergeItem(base, sacrifice)
    if (result.status === 'refused') return null
    this.sacrifice.set(null)
    if (result.status === 'success' && base.from === 'inventory') this.base.set({ from: 'inventory', item: quote.next })
    return { result, before, after: result.status === 'success' ? quote.next : before }
  }

  clear(): void {
    this.base.set(null)
    this.sacrifice.set(null)
    this.dragged.set(null)
  }

  /** Shows a picked inventory copy even once it is gone; \`evaluation\` refuses it then (\`missingCopy\`). */
  private resolve(source: MergeSource | null): EquipmentItem | null {
    if (!source) return null
    return source.from === 'equipped' ? this.playerStore.equipment()[source.slot] : source.item
  }
}
