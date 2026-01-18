import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { PanelComponent } from '../shared/panel/panel.component'
import { BehaviorSubject } from 'rxjs'
import { GameTab } from 'enums/ids/game-tab.enum'
import { AsyncPipe, CommonModule } from '@angular/common'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { TownsComponent } from './town/towns.component'
import { InventoryWindow } from './inventory/inventory.component'
import { EquipmentComponent } from './equipment/equipment.component'
import { CraftingComponent } from './crafting/crafting.component'
import { PlayerStore } from '../../store/player/player.store'
import { PlayerStatsComponent } from './player-stats/player-stats.component'
import { GameMenuComponent } from './game-menu/game-menu.component'
import { BattleComponent } from './battle/battle.component'
import { SkillTreesComponent } from './skill-trees/skill-trees.component'
import { BattleStore } from '../../store/battle/battle.store'
import { QuestsStore } from '../../store/quests/quests.store'
import { TownsStore } from '../../store/towns/towns.store'
import { DialogueManagerService } from '../../services/dialogue-manager.service'
import { DialogueComponent } from './dialogue/dialogue.component'

const imports = [
  PanelComponent,
  AsyncPipe,
  CommonModule,
  TownsComponent,
  InventoryWindow,
  EquipmentComponent,
  CraftingComponent,
  PlayerStatsComponent,
  GameMenuComponent,
  BattleComponent,
  SkillTreesComponent,
]

@Component({
  selector: 'app-game',
  templateUrl: 'game.component.html',
  styleUrls: ['./game.component.sass'],
  imports: [
    imports,
    DialogueComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class GameComponent {
  playerStore = inject(PlayerStore)
  battleStore = inject(BattleStore)
  questsStore = inject(QuestsStore)
  townsStore = inject(TownsStore)
  dialogueManagerService = inject(DialogueManagerService)
  gameTab = new BehaviorSubject<GameTab>(GameTab.main)

  hasDialogueActive = computed(() => this.dialogueManagerService.activeNpc())

  readonly GameTab = GameTab

  resetState() {
    this.playerStore.resetState()
    this.battleStore.resetState()
    this.questsStore.resetState()
    this.townsStore.resetState()
  }

  resetQuests() {
    this.questsStore.resetState()
  }

  changeTab(tab: GameTab) {
    this.gameTab.next(tab)
  }

  giveStat(stat: PlayerStat) {
    this.playerStore.updatePlayerStats([{ stat, amount: 1000 }])
  }
}
