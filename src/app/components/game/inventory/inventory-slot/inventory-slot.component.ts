import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { ItemTier } from 'enums/items/item-tier.enum'
import { Item } from 'interfaces/item.interface'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'
import { SkillPointID } from '../../../../../enums/ids/skill-tree-node-id.enum'
import { ItemID } from '../../../../../enums/ids/item-id.enum'
import { TooltipTemplateDirective } from 'ngx-tooltip-directives'
import { StatToPercentagePipe } from '../../../../pipes/stat-to-percentage.pipe'
import { ItemType } from '../../../../../enums/items/item-type.enum'

@Component({
  selector: 'app-inventory-slot',
  templateUrl: 'inventory-slot.component.html',
  styleUrls: ['./inventory-slot.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, TranslatePipe, TooltipTemplateDirective, StatToPercentagePipe],
})

export class InventoryItemComponent implements OnInit {
  @Input() item: Item
  @Input() amount: number
  @Input() tier: ItemTier
  @Input() clickable = true

  @Output() equipItem = new EventEmitter<void>()

  readonly ItemTier = ItemTier
  protected readonly EnemyID = EnemyID
  protected readonly SkillPointID = SkillPointID
  protected readonly ItemID = ItemID
  protected readonly ItemType = ItemType

  constructor() {
  }

  ngOnInit() {
  }
}
