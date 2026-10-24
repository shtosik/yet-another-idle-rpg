import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { PanelComponent } from '../shared/panel/panel.component'
import { GameNavigationService } from '../../services/game-navigation.service'
import { UnlockService } from '../../services/unlock.service'
import { GameTab } from 'enums/ids/game-tab.enum'
import { AsyncPipe, CommonModule } from '@angular/common'
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
import { OfflineStore } from '../../store/offline/offline.store'
import { SpellbookComponent } from './spellbook/spellbook.component'
import { DevCheatsComponent } from './dev-cheats/dev-cheats.component'
import { environment } from '../../../environments/environment'

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
    DevCheatsComponent,
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
  offlineStore = inject(OfflineStore)
  dialogueManagerService = inject(DialogueManagerService)
  // Created here so unlock rules start watching as soon as the game is on screen.
  private unlockService = inject(UnlockService)
  private navigation = inject(GameNavigationService)
  gameTab = this.navigation.tab

  hasDialogueActive = computed(() => this.dialogueManagerService.activeNpc())

  readonly GameTab = GameTab
  readonly cheats = environment.cheats

  changeTab(tab: GameTab) {
    this.navigation.changeTab(tab)
  }
}
