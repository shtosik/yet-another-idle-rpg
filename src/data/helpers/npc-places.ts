import { NpcID } from 'enums/map/npc-id.enum'
import { TownID } from 'enums/map/town-id.enum'
import { SiteID } from 'enums/ids/site-id.enum'
import { TownBuildingID } from 'enums/map/town-building-id.enum'
import TOWNS_DATA from 'data/towns-data'
import { SITES_DATA } from 'data/sites-data'

/** Where an NPC stands: in a town building, or on a Site's home screen. */
export type NpcPlace =
  | { kind: 'town'; npcId: NpcID; townId: TownID; buildingId: TownBuildingID }
  | { kind: 'site'; npcId: NpcID; siteId: SiteID }

/** The town building or Site `npcId` stands in. An NPC in several buildings (the Trader: market and shop) gets the first one in TOWNS_DATA; towns are searched before Sites. */
export function npcPlace(npcId: NpcID): NpcPlace | null {
  for (const town of Object.values(TOWNS_DATA)) {
    const building = town.buildings.find(b => b.npcs.some(n => n.id === npcId))
    if (building) return { kind: 'town', npcId, townId: town.id, buildingId: building.buildingId }
  }
  const site = Object.values(SITES_DATA).find(s => s.npcs.some(n => n.id === npcId))
  return site ? { kind: 'site', npcId, siteId: site.id } : null
}

/** Whether the player has unlocked the town or Site of `place`. */
export function isNpcPlaceUnlocked(
  place: NpcPlace,
  player: { isTownUnlocked(id: TownID): boolean; isSiteUnlocked(id: SiteID): boolean },
): boolean {
  return place.kind === 'site' ? player.isSiteUnlocked(place.siteId) : player.isTownUnlocked(place.townId)
}
