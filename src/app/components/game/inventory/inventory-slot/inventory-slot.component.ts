import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, inject, input } from '@angular/core'
import { ForgeSelection } from '../../../../services/forge-selection'
import { ForgeDrag } from '../../../../directives/forge-drag'
import { ItemTier } from 'enums/items/item-tier.enum'
import { Item } from 'interfaces/item.interface'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'
import { SkillNodeID } from '../../../../../enums/ids/skill-node-id.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { StationID } from '../../../../../enums/ids/station-id.enum'
import { EquipmentSlot } from '../../../../../enums/equipment-slot.enum'
import { DamageElement } from '../../../../../enums/damage-element.enum'
import { SpellID } from '../../../../../enums/ids/spell-id.enum'
import { ItemType } from '../../../../../enums/items/item-type.enum'
import { ConsumableEffectComponent } from '../../../shared/consumable-effect/consumable-effect.component'
import { UPGRADE_MILESTONE_LEVEL } from '../../../../../data/upgrade-data'
import { upgradedStatAmount } from '../../../../store/player/stats'

@Component({
  selector: 'app-inventory-slot',
  templateUrl: 'inventory-slot.component.html',
  styleUrls: ['./inventory-slot.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, NgTemplateOutlet, I18nextPipe, TooltipTemplateDirective, StatToPercentagePipe, ConsumableEffectComponent, ForgeDrag],
})

export class InventoryItemComponent {
  protected readonly forge = inject(ForgeSelection)
  /** Only inventory-owned slots participate; shop and reward slots remain passive. */
  readonly forgeSelectable = input(false)
  @Input() item: Item
  @Input() amount: number
  @Input() tier: ItemTier
  readonly upgradeLevel = input(0)
  protected readonly milestoneLevel = UPGRADE_MILESTONE_LEVEL
  protected readonly upgradedStatAmount = upgradedStatAmount
  @Input() clickable = true
  /** Shows the destroy button; set by the inventory only. */
  @Input() destroyable = false

  @Output() equipItem = new EventEmitter<void>()
  @Output() useItem = new EventEmitter<void>()
  @Output() destroyItem = new EventEmitter<void>()

  @ViewChild(TooltipTemplateDirective) private tooltipDirective?: TooltipTemplateDirective

  /** Inline panels wrap passive slots in their own button, which owns keyboard focus. */
  showTooltip(): void {
    this.tooltipDirective?.show()
  }

  hideTooltip(): void {
    this.tooltipDirective?.hide()
  }

  readonly ItemTier = ItemTier
  protected readonly EnemyID = EnemyID
  protected readonly SkillNodeID = SkillNodeID
  protected readonly ItemID = ItemID
  protected readonly ItemType = ItemType
  protected readonly StationID = StationID
  protected readonly DamageElement = DamageElement
  protected readonly EquipmentSlot = EquipmentSlot
  protected readonly SpellID = SpellID

  get isUsable(): boolean {
    return this.item.type === ItemType.rewardsStats
      || this.item.type === ItemType.food
      || this.item.type === ItemType.potion
      || this.item.type === ItemType.book
      || this.item.type === ItemType.recipe
      || this.item.type === ItemType.stationUpgrade
      || this.item.type === ItemType.spellScroll
      || this.item.type === ItemType.chest
  }

  handleDestroy(event: MouseEvent) {
    event.stopPropagation()
    this.destroyItem.emit()
  }

  handleRightClick(event: MouseEvent) {
    event.preventDefault()
    this.act()
  }

  // detail is 0 for Enter, Space and screen-reader activation; touch taps have no right-click. A mouse left-click stays inert.
  handleActivate(event: MouseEvent) {
    if (this.forgeSelectable() && this.forge.open()) {
      this.act()
      return
    }
    if (event.detail === 0 || (event as PointerEvent).pointerType === 'touch') this.act()
  }

  private act() {
    if (!this.clickable) return
    if (this.forgeSelectable() && this.forge.open()) {
      this.forge.select({ from: 'inventory', item: { id: this.item.id, tier: this.tier, upgradeLevel: this.upgradeLevel() } })
      this.tooltipDirective?.hide()
      return
    }

    // The open tooltip keeps the old item; slots are reused by index, so a swapped item would show stale stats.
    this.tooltipDirective?.hide()
    if (this.item.type === ItemType.equipment) this.equipItem.emit()
    else if (this.isUsable) this.useItem.emit()
  }
}
