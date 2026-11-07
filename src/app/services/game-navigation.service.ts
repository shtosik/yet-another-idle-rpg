import { inject, Injectable, signal } from '@angular/core'
import { GameTab } from '../../enums/ids/game-tab.enum'
import { TownID } from '../../enums/map/town-id.enum'
import { TownBuildingID } from '../../enums/map/town-building-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { SiteID } from '../../enums/ids/site-id.enum'
import TOWNS_DATA from '../../data/towns-data'
import { NpcPlace } from '../../data/helpers/npc-places'
import { TownsStore } from '../store/towns/towns.store'
import { DialogueManagerService } from './dialogue-manager.service'
import { BattleStore } from '../store/battle/battle.store'
import { ZoneID } from '../../enums/ids/zone-id.enum'

/** The open game tab, and shortcuts that jump straight to a place in the game. */
@Injectable({ providedIn: 'root' })
export class GameNavigationService {
  private townsStore = inject(TownsStore)
  private dialogueManager = inject(DialogueManagerService)
  private battleStore = inject(BattleStore)

  readonly tab = signal(GameTab.main)
  /** The Site the farm tab shows. Not saved, like the tab. */
  readonly siteId = signal<SiteID>(SiteID.farm)

  changeTab(tab: GameTab): void {
    this.tab.set(tab)
  }

  /** Opens `siteId`'s home screen. */
  openSite(siteId: SiteID): void {
    this.townsStore.closeShop()
    this.siteId.set(siteId)
    this.tab.set(GameTab.farm)
  }

  /** Opens the farm's plots panel; its close button goes back to the farm home. */
  openFarmPlots(): void {
    this.openSite(SiteID.farm)
    this.tab.set(GameTab.farmPlots)
  }

  /** Opens the town building or Site home screen `place` is in and starts a conversation with its NPC. */
  talkTo(place: NpcPlace): void {
    if (place.kind === 'site') {
      this.openSite(place.siteId)
    } else {
      const building = TOWNS_DATA[place.townId]?.buildings.find(b => b.buildingId === place.buildingId)
      if (!building) return

      this.townsStore.closeShop()
      this.townsStore.selectTown(place.townId)
      this.townsStore.selectTownBuilding(building)
      this.tab.set(GameTab.towns)
    }
    this.dialogueManager.startDialogue(place.npcId)
  }

  /** Opens the battle tab in `zoneId`. Moving to another zone starts it from wave 1; staying keeps the current wave. */
  fightIn(zoneId: ZoneID): void {
    if (this.battleStore.currentZoneId() !== zoneId) this.battleStore.setZone(zoneId)
    this.tab.set(GameTab.main)
  }

  /** Marvin, to claim finished Exploration Guild tasks. */
  talkToMarvin(): void {
    this.talkTo({ kind: 'town', townId: TownID.laHarpar, buildingId: TownBuildingID.explorationGuild, npcId: NpcID.laHarparMarvin })
  }
}
