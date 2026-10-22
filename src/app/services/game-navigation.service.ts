import { inject, Injectable, signal } from '@angular/core'
import { GameTab } from '../../enums/ids/game-tab.enum'
import { TownID } from '../../enums/map/town-id.enum'
import { TownBuildingID } from '../../enums/map/town-building-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import TOWNS_DATA from '../../data/towns-data'
import { TownsStore } from '../store/towns/towns.store'
import { DialogueManagerService } from './dialogue-manager.service'

/** The open game tab, and shortcuts that jump straight to a place in the game. */
@Injectable({ providedIn: 'root' })
export class GameNavigationService {
  private townsStore = inject(TownsStore)
  private dialogueManager = inject(DialogueManagerService)

  readonly tab = signal(GameTab.main)

  changeTab(tab: GameTab): void {
    this.tab.set(tab)
  }

  /** Opens the town tab inside `buildingId` and starts a conversation with `npcId`. */
  talkTo(townId: TownID, buildingId: TownBuildingID, npcId: NpcID): void {
    const building = TOWNS_DATA[townId]?.buildings.find(b => b.buildingId === buildingId)
    if (!building) return

    this.townsStore.closeShop()
    this.townsStore.selectTown(townId)
    this.townsStore.selectTownBuilding(building)
    this.tab.set(GameTab.towns)
    this.dialogueManager.startDialogue(npcId)
  }

  /** Marvin, to claim finished Exploration Guild tasks. */
  talkToMarvin(): void {
    this.talkTo(TownID.laHarpar, TownBuildingID.explorationGuild, NpcID.laHarparMarvin)
  }
}
