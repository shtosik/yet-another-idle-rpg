import { ItemID } from '../enums/ids/item-id.enum'
import { QuestID } from '../enums/ids/quest-id.enum'
import { ZoneID } from '../enums/ids/zone-id.enum'
import { QuestStep } from '../types/quests/quest-progression.type'

/**
 * Something painted into a background that the player can click (`docs/systems/scene-spots.md`). It works only
 * while its quest is at `when.step` and its item isn't held (search spot) or its Zone is locked (hidden passage).
 */
export interface SceneSpot {
  /** Search spots: found text at `map:spots.<id>.title|body`. A passage shows its Zone's unlock notice instead. */
  id: string
  /** The spot's flat colour in the Scene mask, `#rrggbb`. */
  color: string
  when: { questId: QuestID, step: QuestStep }
  gives: { itemId: ItemID } | { zoneId: ZoneID }
}

export interface SceneSpots {
  /** Same size as the art; one flat colour per spot, transparent elsewhere. */
  maskUrl: string
  spots: SceneSpot[]
}

/** Spots by background art url: a Scene shows one art, and its mask pairs with it. */
export const SCENE_SPOTS: Record<string, SceneSpots> = {
  './assets/img/backgrounds/mountain-pass.png': {
    maskUrl: './assets/img/backgrounds/mountain-pass-mask.png',
    spots: [
      { id: 'passGuildPost', color: '#ff0000', when: { questId: QuestID.theQuietRoad, step: 1 }, gives: { itemId: ItemID.passPostDaybook } },
      { id: 'passGoatCleft', color: '#00ff00', when: { questId: QuestID.theQuietRoad, step: 2 }, gives: { zoneId: ZoneID.goatCleft } },
    ],
  },
  './assets/img/backgrounds/mawoodElderTree.png': {
    maskUrl: './assets/img/backgrounds/mawoodElderTree-mask.png',
    spots: [
      { id: 'elderTreeTrunk', color: '#0000ff', when: { questId: QuestID.theSameWinter, step: 2 }, gives: { itemId: ItemID.corwinsRitualNotes } },
    ],
  },
}
