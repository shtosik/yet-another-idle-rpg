import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { GameTab } from 'enums/ids/game-tab.enum'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../store/player/player.store'
import { GameNavigationService } from '../../../services/game-navigation.service'
import { PlayerHudComponent } from './player-hud/player-hud.component'

interface NavTab {
  tab: GameTab
  unlocked: boolean
  /** Count shown next to the label; 0 hides it. */
  badge: number
}

@Component({
  selector: 'app-game-menu',
  templateUrl: 'game-menu.component.html',
  styleUrls: ['./game-menu.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, PlayerHudComponent],
})
export class GameMenuComponent {
  private playerStore = inject(PlayerStore)
  private navigation = inject(GameNavigationService)

  readonly GameTab = GameTab

  /** Fixed order; locked tabs keep their slot so the bar doesn't shift as features unlock. */
  protected tabs = computed<NavTab[]>(() => [
    { tab: GameTab.main, unlocked: true, badge: 0 },
    { tab: GameTab.map, unlocked: this.playerStore.mapUnlocked(), badge: 0 },
    { tab: GameTab.skillTree, unlocked: this.playerStore.skillTreeUnlocked(), badge: this.playerStore.resources.unspentSkillPoints() },
    { tab: GameTab.camp, unlocked: this.playerStore.campUnlocked(), badge: 0 },
    { tab: GameTab.bestiary, unlocked: true, badge: this.playerStore.unseenEnemyCount() },
    { tab: GameTab.spellbook, unlocked: this.playerStore.spellbookUnlocked(), badge: this.playerStore.unseenSpellCount() },
  ])

  /** Towns are reached through the map, so the map tab stays lit inside a town. */
  protected activeTab = computed(() => {
    const tab = this.navigation.tab()
    return tab === GameTab.towns ? GameTab.map : tab
  })

  select(entry: NavTab): void {
    if (entry.unlocked) this.navigation.changeTab(entry.tab)
  }
}
