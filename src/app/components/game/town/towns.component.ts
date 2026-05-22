import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Output } from '@angular/core'
import { TownID } from '../../../../enums/map/town-id.enum'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import TOWNS_DATA, { TownBuilding } from '../../../../data/towns-data'
import { TownBuildingID } from '../../../../enums/map/town-tab-id.enum'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { TownsStore } from '../../../store/towns/towns.store'
import { TownBuildingComponent } from './town-building/town-building.component'
import { BattleStore } from '../../../store/battle/battle.store'
import { QuestsStore } from '../../../store/quests/quests.store'
import { GameTab } from '../../../../enums/ids/game-tab.enum'
import { ShopComponent } from '../../modals/shop/shop.component'

@Component({
  selector: 'app-towns',
  templateUrl: './towns.component.html',
  styleUrls: ['./towns.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CloseButtonComponent,
    TownBuildingComponent,
    ShopComponent,
  ],
})
export class TownsComponent {
  protected readonly TownID = TownID
  protected readonly TOWNS_DATA = TOWNS_DATA
  protected readonly TownBuildingID = TownBuildingID
  private townsStore = inject(TownsStore)
  private battleStore = inject(BattleStore)
  private questsStore = inject(QuestsStore)
  private destroyRef = inject(DestroyRef)
  selectedTownId = this.townsStore.selectedTownId
  selectedTownBuilding = this.townsStore.selectedTownBuilding
  activeShopId = this.townsStore.activeShopId

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
