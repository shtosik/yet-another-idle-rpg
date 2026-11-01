import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core'
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

@Component({
  selector: 'app-inventory-slot',
  templateUrl: 'inventory-slot.component.html',
  styleUrls: ['./inventory-slot.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, I18nextPipe, TooltipTemplateDirective, StatToPercentagePipe, ConsumableEffectComponent],
})

export class InventoryItemComponent {
  @Input() item: Item
  @Input() amount: number
  @Input() tier: ItemTier
  @Input() clickable = true
  /** Shows the destroy button; set by the inventory only. */
  @Input() destroyable = false

  @Output() equipItem = new EventEmitter<void>()
  @Output() useItem = new EventEmitter<void>()
  @Output() destroyItem = new EventEmitter<void>()

  @ViewChild(TooltipTemplateDirective) private tooltipDirective?: TooltipTemplateDirective

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
    if (!this.clickable) return

    // The open tooltip keeps the old item; slots are reused by index, so a swapped item would show stale stats.
    this.tooltipDirective?.hide()
    if (this.item.type === ItemType.equipment) this.equipItem.emit()
    else if (this.isUsable) this.useItem.emit()
  }
}
