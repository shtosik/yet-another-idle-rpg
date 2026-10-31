import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core'
import TOWNS_DATA from '../../../data/towns-data'
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
import { QuestsComponent } from './quests/quests.component'
import { WorldMapComponent } from './world-map/world-map.component'
import { BestiaryComponent } from './bestiary/bestiary.component'
import { ShopStore } from '../../store/shop/shop.store'
import { CampStore } from '../../store/camp/camp.store'
import { OfflineStore } from '../../store/offline/offline.store'
import { SettingsStore } from '../../store/settings/settings.store'
import { SpellbookComponent } from './spellbook/spellbook.component'
import { DevCheatsComponent } from './dev-cheats/dev-cheats.component'
import { SettingsComponent } from './settings/settings.component'
import { environment } from '../../../environments/environment'

const imports = [
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
    QuestsComponent,
    WorldMapComponent,
    BestiaryComponent,
    SpellbookComponent,
    CampComponent,
    DevCheatsComponent,
    SettingsComponent,
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
  // Created here so its saves are registered for export and import (persistence.md).
  settingsStore = inject(SettingsStore)
  // Created here so unlock rules start watching as soon as the game is on screen.
  private unlockService = inject(UnlockService)
  private navigation = inject(GameNavigationService)
  gameTab = this.navigation.tab

  readonly GameTab = GameTab
  readonly cheats = environment.cheats

  private preloadedImages = new Set<string>()

  constructor() {
    // Town and building backgrounds are large; fetch them once a town unlocks so they don't pop in on first visit.
    effect(() => {
      const towns = this.playerStore.unlockedContent().towns ?? []
      const urls = towns.flatMap(id => [TOWNS_DATA[id]?.url, ...(TOWNS_DATA[id]?.buildings.map(b => b.url) ?? [])])
      for (const url of urls) {
        if (!url || this.preloadedImages.has(url)) continue
        this.preloadedImages.add(url)
        new Image().src = url
      }
    })
  }

  changeTab(tab: GameTab) {
    this.navigation.changeTab(tab)
  }
}
