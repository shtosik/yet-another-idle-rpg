import { inject, Injectable } from '@angular/core'
import ITEM_DATA from '../../data/items-data'
import { ItemType } from '../../enums/items/item-type.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { InventoryItem } from '../../interfaces/item.interface'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { missingSlotsText } from '../components/game/inventory/tab-text'
import { BattleManagerService } from './battle-manager.service'
import { ModalService } from './modal.service'

/** Which item types the inventory's use action applies to. */
const USABLE: Record<ItemType, boolean> = {
  [ItemType.resource]: false,
  [ItemType.equipment]: false, // equipped instead
  [ItemType.book]: false, // no book items yet
  [ItemType.food]: true,
  [ItemType.potion]: true,
  [ItemType.rewardsStats]: true,
  [ItemType.recipe]: true,
  [ItemType.stationUpgrade]: true,
  [ItemType.spellScroll]: true,
  [ItemType.chest]: true,
  [ItemType.seed]: false,
  [ItemType.quest]: false,
}

/** Using an inventory item: what it does per type, and the notice it shows. */
@Injectable({ providedIn: 'root' })
export class ItemUseService {
  private playerStore = inject(PlayerStore)
  private battleManager = inject(BattleManagerService)
  private battleStore = inject(BattleStore)
  private modalService = inject(ModalService)

  canUse(itemId: ItemID): boolean {
    return USABLE[ITEM_DATA[itemId].type]
  }

  use(item: InventoryItem): void {
    const itemData = ITEM_DATA[item.id]
    switch (itemData.type) {
      case ItemType.stationUpgrade:
        this.playerStore.installStationItem(item) // shows its notice
        return
      case ItemType.food:
      case ItemType.potion:
        this.battleManager.useConsumable(item.id)
        return
      case ItemType.chest: {
        const { contents, missing } = this.playerStore.openChest(item)
        this.modalService.openChestOpened({ contents, slotsNeeded: missingSlotsText(missing) })
        return
      }
      case ItemType.spellScroll:
        // Like learning it from the skill tree: onto the spell bar if there's a free slot.
        if (this.playerStore.useItem(item)) this.battleStore.placeSpell(itemData.spellId)
        return
      case ItemType.recipe:
      case ItemType.rewardsStats:
        this.playerStore.useItem(item)
        return
    }
  }
}
