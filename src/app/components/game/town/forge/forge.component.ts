import { DOCUMENT, NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, output } from '@angular/core'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import i18next from 'i18next'
import ITEM_DATA from '../../../../../data/items-data'
import { UPGRADE_LEVEL_CAP, UPGRADE_MILESTONE_LEVEL } from '../../../../../data/upgrade-data'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../../enums/items/item-tier.enum'
import { EquipmentItem } from '../../../../../interfaces/player/equipment.type'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { ForgeInput, ForgeSelection } from '../../../../services/forge-selection'
import { PlayerStore } from '../../../../store/player/player.store'
import { NoticesService } from '../../../../services/notices.service'
import { gearModifiers } from '../../../../store/player/stats'
import { tabName } from '../../inventory/tab-text'


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
  readonly item = this.selection.item
  readonly sacrificeItem = this.selection.sacrificeItem
  readonly evaluation = this.selection.evaluation
  readonly mismatch = computed(() => {
    const evaluation = this.evaluation()
    return evaluation?.status === 'refused' && evaluation.reason === 'mismatch'
  })
  readonly cost = computed(() => this.selection.quote()?.cost ?? 0)
  readonly goldShort = computed(() => !!this.item() && this.playerStore.resources.goldCoins() < this.cost())
  readonly chance = computed(() => this.selection.quote()?.chance ?? 0)
  /** The +1 gear, unless the pair itself is wrong (gold and room only block the attempt). */
  readonly preview = computed(() => {
    const evaluation = this.evaluation()
    if (!evaluation) return null
    if (evaluation.status === 'refused' && evaluation.reason !== 'notEnoughGold' && evaluation.reason !== 'inventoryFull') return null
    return this.selection.quote()?.next ?? null
  })
  readonly statPreview = computed(() => {
    const item = this.item()
    const preview = this.preview()
    if (!item || !preview) return []
    const after = gearModifiers(preview)
    return gearModifiers(item).map((modifier, index) => ({ ...modifier, after: after[index].amount }))
  })
  private notices = inject(NoticesService)
  readonly toast = this.notices.toast('forge')

  constructor() {
    this.selection.clear()
    inject(DestroyRef).onDestroy(() => this.selection.clear())
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
    const merged = this.selection.merge()
    // `selection.merge` never returns a refusal; the check narrows the type.
    if (!merged || merged.result.status === 'refused') return
    this.notices.push({ type: 'merged', status: merged.result.status, item: merged.after })
  }
}
