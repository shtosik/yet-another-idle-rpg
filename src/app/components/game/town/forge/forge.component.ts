import { DOCUMENT, NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output, signal } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import i18next from 'i18next'
import ITEM_DATA from '../../../../../data/items-data'
import { UPGRADE_CHANCES, UPGRADE_LEVEL_CAP, UPGRADE_MILESTONE_LEVEL } from '../../../../../data/upgrade-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { EquipmentItem } from '../../../../../interfaces/player/equipment.type'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { ForgeInput, ForgeSelection } from '../../../../services/forge-selection'
import { evaluateMerge, mergeCost, MergeSource } from '../../../../store/player/merge'
import { PlayerStore } from '../../../../store/player/player.store'
import { gearModifiers } from '../../../../store/player/stats'
import { tabName } from '../../inventory/tab-text'

const TOAST_MS = 3000

@Component({
  selector: 'app-forge',
  templateUrl: './forge.component.html',
  styleUrl: './forge.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, StatToPercentagePipe, NgOptimizedImage, TooltipTemplateDirective],
})
export class ForgeComponent {
  private readonly playerStore = inject(PlayerStore)
  protected readonly selection = inject(ForgeSelection)
  private readonly document = inject(DOCUMENT)
  readonly closed = output<void>()
  protected readonly ITEM_DATA = ITEM_DATA
  protected readonly ItemTier = ItemTier
  protected readonly milestoneLevel = UPGRADE_MILESTONE_LEVEL
  readonly levelCap = UPGRADE_LEVEL_CAP
  protected readonly inputs: readonly ForgeInput[] = ['base', 'sacrifice']
  readonly base = this.selection.base
  readonly sacrifice = this.selection.sacrifice
  readonly item = computed(() => this.resolve(this.base()))
  readonly sacrificeItem = computed(() => this.resolve(this.sacrifice()))
  readonly evaluation = computed(() => {
    const base = this.base()
    const sacrifice = this.sacrifice()
    if (!base || !sacrifice) return null
    return evaluateMerge({
      base, sacrifice, inventory: this.playerStore.inventory(), equipment: this.playerStore.equipment(),
      capacity: this.playerStore.inventoryCapacity(), goldCoins: this.playerStore.resources.goldCoins(),
    })
  })
  readonly mismatch = computed(() => {
    const evaluation = this.evaluation()
    return evaluation?.status === 'refused' && evaluation.reason === 'mismatch'
  })
  readonly cost = computed(() => {
    const item = this.item()
    if (!item) return 0
    return mergeCost(ITEM_DATA[item.id].value, item.upgradeLevel)
  })
  readonly goldShort = computed(() => !!this.item() && this.playerStore.resources.goldCoins() < this.cost())
  readonly chance = computed(() => UPGRADE_CHANCES[(this.item()?.upgradeLevel ?? 0) + 1] ?? 0)
  readonly preview = computed(() => {
    const item = this.item()
    const evaluation = this.evaluation()
    if (!item || !evaluation) return null
    if (evaluation.status === 'refused' && evaluation.reason !== 'notEnoughGold' && evaluation.reason !== 'inventoryFull') return null
    return { ...item, upgradeLevel: (item.upgradeLevel ?? 0) + 1 }
  })
  readonly statPreview = computed(() => {
    const item = this.item()
    const preview = this.preview()
    if (!item || !preview) return []
    const after = gearModifiers(preview)
    return gearModifiers(item).map((modifier, index) => ({ ...modifier, after: after[index].amount }))
  })
  readonly toast = signal<string | null>(null)
  private toastTimer?: ReturnType<typeof setTimeout>

  constructor() {
    this.selection.clear()
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.toastTimer)
      this.selection.clear()
    })
  }

  private resolve(source: MergeSource | null): EquipmentItem | null {
    if (!source) return null
    if (source.from === 'equipped') return this.playerStore.equipment()[source.slot]
    return source.item
  }

  inputItem(slot: ForgeInput): EquipmentItem | null {
    if (slot === 'base') return this.item()
    return this.sacrificeItem()
  }

  dragOver(event: DragEvent): void {
    if (!this.selection.dragged()) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  drop(event: DragEvent, slot: ForgeInput): void {
    event.preventDefault()
    const source = this.selection.dragged()
    if (source) this.selection.setSlot(slot, source)
    this.selection.dragged.set(null)
  }

  focusGear(): void {
    this.document.querySelector<HTMLButtonElement>('app-inventory .item__action')?.focus()
  }

  activateInput(slot: ForgeInput): void {
    if (this.selection[slot]()) this.selection.setSlot(slot, null)
    else this.focusGear()
  }

  itemStats(item: EquipmentItem) {
    return gearModifiers(item)
  }

  itemName(item: EquipmentItem): string {
    const name = i18next.t(`items:names.${ItemID[item.id]}`)
    const level = item.upgradeLevel ?? 0
    return level > 0 ? i18next.t('items:upgradedName', { name, level }) : name
  }

  mergeLabel(): string {
    const evaluation = this.evaluation()
    if (!evaluation) return i18next.t('forge:selectGear')
    if (evaluation.status === 'ready') return i18next.t('forge:merge')
    switch (evaluation.reason) {
      case 'missingCopy': return i18next.t('forge:missingCopy')
      case 'mismatch': return i18next.t('forge:mismatch')
      case 'notEquipment':
      case 'pet': return i18next.t('forge:notUpgradable')
      case 'unique': return i18next.t('forge:unique')
      case 'atCap': return i18next.t('forge:atCap', { level: this.levelCap })
      case 'notEnoughGold': return i18next.t('forge:notEnoughGold')
      case 'inventoryFull': return i18next.t('forge:inventoryFull', { tab: tabName(evaluation.tab) })
    }
  }

  merge(): void {
    const item = this.item()
    const base = this.base()
    const sacrifice = this.sacrifice()
    if (!item || !base || !sacrifice || this.evaluation()?.status !== 'ready') return
    const result = this.playerStore.mergeItem(base, sacrifice)
    if (result.status === 'refused') return
    const upgraded = { ...item, upgradeLevel: (item.upgradeLevel ?? 0) + 1 }
    this.selection.setSlot('sacrifice', null)
    if (result.status === 'success' && base.from === 'inventory') {
      this.selection.setSlot('base', { from: 'inventory', item: upgraded })
    }
    const name = this.itemName(result.status === 'success' ? upgraded : item)
    clearTimeout(this.toastTimer)
    this.toast.set(i18next.t(`forge:${result.status}`, { item: name }))
    this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_MS)
  }
}
