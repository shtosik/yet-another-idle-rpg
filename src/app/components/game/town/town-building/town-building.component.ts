import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core'
import { TownBuilding } from '../../../../../interfaces/town.interface'
import { SceneComponent } from '../../../shared/scene/scene.component'
import { SceneMaskComponent } from '../../../shared/scene/scene-mask/scene-mask.component'
import { NpcFrameComponent } from '../npc-frame/npc-frame.component'
import { CommonModule } from '@angular/common'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { TownBuildingID } from '../../../../../enums/map/town-building-id.enum'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { DialogueManagerService } from '../../../../services/dialogue-manager.service'
import { TownsStore } from '../../../../store/towns/towns.store'
import { ShopID } from '../../../../../enums/ids/shop-id.enum'

@Component({
  selector: 'app-town-building',
  templateUrl: './town-building.component.html',
  styleUrls: ['./town-building.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SceneComponent,
    SceneMaskComponent,
    NpcFrameComponent,
    CommonModule,
    I18nextPipe,
  ],
})
export class TownBuildingComponent {
  private destroyRef = inject(DestroyRef)
  private dialogueManagerService = inject(DialogueManagerService)
  private townsStore = inject(TownsStore)
  protected readonly npcShops = this.townsStore.npcShops

  protected readonly TownBuildingID = TownBuildingID

  /** A town building, or a Site home screen (no building id, so no title). */
  building = input<Pick<TownBuilding, 'npcs' | 'url'> & Partial<Pick<TownBuilding, 'buildingId'>>>(null)

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.dialogueManagerService.closeDialogue()
    })
  }

  openDialogue(id: NpcID) {
    this.dialogueManagerService.startDialogue(id)
  }

  openShop(npcId: NpcID, shopId: ShopID) {
    this.townsStore.openShop(shopId, this.townsStore.npcShopStages()[npcId] ?? 0)
  }
}
