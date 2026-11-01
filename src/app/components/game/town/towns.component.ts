import { ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, inject, Output } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueComponent } from '../dialogue/dialogue.component'
import { TownID } from '../../../../enums/map/town-id.enum'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import TOWNS_DATA from '../../../../data/towns-data'
import { TownBuilding } from '../../../../interfaces/town.interface'
import { TownBuildingID } from '../../../../enums/map/town-building-id.enum'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { TownsStore } from '../../../store/towns/towns.store'
import { TownBuildingComponent } from './town-building/town-building.component'
import { BattleStore } from '../../../store/battle/battle.store'
import { QuestsStore } from '../../../store/quests/quests.store'
import { GameTab } from '../../../../enums/ids/game-tab.enum'
import { ShopComponent } from './shop/shop.component'
import { PlayerStore } from '../../../store/player/player.store'
import { REPUTATION_TOWNS, reputationTier } from '../../../store/player/reputation'
import { ReputationTier } from '../../../../enums/reputation-tier.enum'

@Component({
  selector: 'app-towns',
  templateUrl: './towns.component.html',
  styleUrls: ['./towns.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    I18nextPipe,
    CloseButtonComponent,
    TownBuildingComponent,
    ShopComponent,
    DialogueComponent,
  ],
})
export class TownsComponent {
  protected readonly TownID = TownID
  protected readonly TOWNS_DATA = TOWNS_DATA
  protected readonly TownBuildingID = TownBuildingID
  private townsStore = inject(TownsStore)
  private battleStore = inject(BattleStore)
  private questsStore = inject(QuestsStore)
  private playerStore = inject(PlayerStore)
  private destroyRef = inject(DestroyRef)
  private dialogueManager = inject(DialogueManagerService)
  selectedTownId = this.townsStore.selectedTownId
  selectedTownBuilding = this.townsStore.selectedTownBuilding
  activeShopId = this.townsStore.activeShopId
  activeShopStage = this.townsStore.activeShopStage
  dialogueActive = computed(() => this.dialogueManager.activeNpc() !== null)
  /** Wrapped so Neutral (0) still shows; `null` for towns without reputation. */
  townTier = computed(() => {
    const townId = this.selectedTownId()
    if (!REPUTATION_TOWNS.includes(townId)) return null
    return { value: reputationTier(this.playerStore.reputation()[townId] ?? 0) }
  })
  protected readonly ReputationTier = ReputationTier

  @Output() changeTab = new EventEmitter<GameTab>()

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.selectTownBuilding(null)
      this.selectTown(null)
    })
  }

  selectTown(townId: TownID) {
    this.townsStore.selectTown(townId)
  }

  goToMap() {
    this.changeTab.emit(GameTab.map)
  }

  closeShop() {
    this.townsStore.closeShop()
  }

  isBuildingAvailable(building: TownBuilding): boolean {
    if (building.questRequirement == null) return true
    return this.questsStore.hasQuestStarted(building.questRequirement)
  }

  selectTownBuilding(townBuilding: TownBuilding) {
    if (townBuilding?.zoneId) {
      this.battleStore.setZone(townBuilding.zoneId)
      return
    }
    this.townsStore.selectTownBuilding(townBuilding)
  }
}
