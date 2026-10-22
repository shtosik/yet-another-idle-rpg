import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { PanelComponent } from '../shared/panel/panel.component'
import { GameNavigationService } from '../../services/game-navigation.service'
import { GameTab } from 'enums/ids/game-tab.enum'
import { AsyncPipe, CommonModule } from '@angular/common'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { TownsComponent } from './town/towns.component'
import { InventoryWindow } from './inventory/inventory.component'
import { EquipmentComponent } from './equipment/equipment.component'
import { CampComponent } from './camp/camp.component'
import { PlayerStore } from '../../store/player/player.store'
import { PlayerStatsComponent } from './player-stats/player-stats.component'
import { GameMenuComponent } from './game-menu/game-menu.component'
import { BattleComponent } from './battle/battle.component'
import { SkillTreeComponent } from './skill-tree/skill-tree.component'
import { BattleStore } from '../../store/battle/battle.store'
import { QuestsStore } from '../../store/quests/quests.store'
import { TownsStore } from '../../store/towns/towns.store'
import { DialogueManagerService } from '../../services/dialogue-manager.service'
import { DialogueComponent } from './dialogue/dialogue.component'
import { QuestsComponent } from './quests/quests.component'
import { WorldMapComponent } from './world-map/world-map.component'
import { BestiaryComponent } from './bestiary/bestiary.component'
import { ShopStore } from '../../store/shop/shop.store'
import { CampStore } from '../../store/camp/camp.store'
import { SpellbookComponent } from './spellbook/spellbook.component'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'

const imports = [
  PanelComponent,
  AsyncPipe,
  CommonModule,
  TownsComponent,
  InventoryWindow,
  EquipmentComponent,
  PlayerStatsComponent,
  GameMenuComponent,
  BattleComponent,
  SkillTreeComponent,
]

@Component({
  selector: 'app-game',
  templateUrl: 'game.component.html',
  styleUrls: ['./game.component.sass'],
  imports: [
    imports,
    DialogueComponent,
    QuestsComponent,
    WorldMapComponent,
    BestiaryComponent,
    SpellbookComponent,
    CampComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class GameComponent {
  playerStore = inject(PlayerStore)
  battleStore = inject(BattleStore)
  questsStore = inject(QuestsStore)
  townsStore = inject(TownsStore)
  shopStore = inject(ShopStore)
  campStore = inject(CampStore)
  dialogueManagerService = inject(DialogueManagerService)
  private navigation = inject(GameNavigationService)
  gameTab = this.navigation.tab

  hasDialogueActive = computed(() => this.dialogueManagerService.activeNpc())

  readonly GameTab = GameTab

  resetState() {
    this.playerStore.resetState()
    this.battleStore.resetState()
    this.questsStore.resetState()
    this.townsStore.resetState()
    this.shopStore.resetState()
    this.campStore.resetState()
  }

  resetQuests() {
    this.questsStore.resetState()
  }

  resetShops() {
    this.shopStore.resetState()
  }

  changeTab(tab: GameTab) {
    this.navigation.changeTab(tab)
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
