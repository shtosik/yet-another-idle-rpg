import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleStore } from '../../../store/battle/battle.store'
import { QuestsStore } from '../../../store/quests/quests.store'
import { TownsStore } from '../../../store/towns/towns.store'
import { ShopStore } from '../../../store/shop/shop.store'
import { CampStore } from '../../../store/camp/camp.store'
import { OfflineStore } from '../../../store/offline/offline.store'
import { PlayerStat } from '../../../../types/player/player-stat.type'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'

// Cheat buttons for dev and testing builds. GameComponent renders it only when environment.cheats is on.
@Component({
  selector: 'app-dev-cheats',
  templateUrl: 'dev-cheats.component.html',
  styles: `
    :host
      display: flex
      gap: 0.2rem
      margin-top: 1rem
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevCheatsComponent {
  private playerStore = inject(PlayerStore)
  private battleStore = inject(BattleStore)
  private questsStore = inject(QuestsStore)
  private townsStore = inject(TownsStore)
  private shopStore = inject(ShopStore)
  private campStore = inject(CampStore)
  private offlineStore = inject(OfflineStore)

  resetState() {
    this.playerStore.resetState()
    this.battleStore.resetState()
    this.questsStore.resetState()
    this.townsStore.resetState()
    this.shopStore.resetState()
    this.campStore.resetState()
    this.offlineStore.resetState()
  }

  resetQuests() {
    this.questsStore.resetState()
  }

  resetShops() {
    this.shopStore.resetState()
  }

  giveStat(stat: PlayerStat) {
    this.playerStore.updatePlayerStats([{ stat, amount: 1000 }])
  }

  unlockAllZones() {
    for (const id of Object.values(ZoneID)) {
      if (typeof id === 'number') this.playerStore.unlockZone(id)
    }
  }

  giveMachete() {
    this.playerStore.addItems([{ id: ItemID.machete, tier: ItemTier.uncommon, amount: 1 }])
  }
}
