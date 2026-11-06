import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output } from '@angular/core'
import { DialogueManagerService } from '../../../services/dialogue-manager.service'
import { DialogueComponent } from '../dialogue/dialogue.component'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { TownBuildingComponent } from '../town/town-building/town-building.component'
import { ShopComponent } from '../town/shop/shop.component'
import { TownsStore } from '../../../store/towns/towns.store'
import { SITES_DATA } from '../../../../data/sites-data'
import { TEST_SITE_NPCS } from '../../../../data/dev/test-site-npcs'
import { SiteID } from '../../../../enums/ids/site-id.enum'
import { environment } from '../../../../environments/environment'

/** A Site's home screen: background, NPCs, dialogue, shop and the Gate button. Needs no selected Town. */
@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, CloseButtonComponent, TownBuildingComponent, ShopComponent, DialogueComponent],
})
export class SiteComponent {
  private townsStore = inject(TownsStore)
  private dialogueManager = inject(DialogueManagerService)

  protected readonly SiteID = SiteID

  siteId = input.required<SiteID>()
  closed = output<void>()
  /** The Gate button: the plots panel opens. */
  gate = output<void>()

  activeShopId = this.townsStore.activeShopId
  activeShopStage = this.townsStore.activeShopStage
  dialogueActive = computed(() => this.dialogueManager.activeNpc() !== null)

  /** With cheats on, a Site that has no NPCs of its own gets test NPCs, so the home screen can be tried before its real ones exist. */
  site = computed(() => {
    const site = SITES_DATA[this.siteId()]
    const npcs = site.npcs.length === 0 && environment.cheats ? (TEST_SITE_NPCS[site.id] ?? []) : site.npcs
    return { ...site, npcs }
  })

  constructor() {
    inject(DestroyRef).onDestroy(() => this.townsStore.closeShop())
  }

  closeShop() {
    this.townsStore.closeShop()
  }
}
