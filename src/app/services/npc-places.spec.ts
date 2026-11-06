import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { GameNavigationService } from './game-navigation.service'
import { DialogueManagerService } from './dialogue-manager.service'
import { PlayerStore } from '../store/player/player.store'
import { TownsStore } from '../store/towns/towns.store'
import { isNpcPlaceUnlocked, npcPlace } from '../../data/helpers/npc-places'
import { SITES_DATA } from '../../data/sites-data'
import { GameTab } from '../../enums/ids/game-tab.enum'
import { SiteID } from '../../enums/ids/site-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { TownBuildingID } from '../../enums/map/town-building-id.enum'
import { TownID } from '../../enums/map/town-id.enum'

// An NPC id no town has, standing in for the Guild NPCs that arrive later.
const HOMELESS = 99 as NpcID

describe('NPC places', () => {
  const farm = SITES_DATA[SiteID.farm]
  const shippedNpcs = farm.npcs

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
  })

  afterEach(() => {
    farm.npcs = shippedNpcs
    localStorage.clear()
  })

  it('finds a town NPC in its building, towns before Sites', () => {
    expect(npcPlace(NpcID.laHarparMarvin)).toEqual({
      kind: 'town', npcId: NpcID.laHarparMarvin, townId: TownID.laHarpar, buildingId: TownBuildingID.explorationGuild,
    })
    expect(npcPlace(NpcID.mawoodSylvie)?.kind).toBe('town')
  })

  it('finds an NPC that stands on a Site', () => {
    farm.npcs = [{ id: HOMELESS, position: { x: 10, y: 10 } }]
    expect(npcPlace(HOMELESS)).toEqual({ kind: 'site', npcId: HOMELESS, siteId: SiteID.farm })
  })

  it('checks the town for a town place and the Site for a Site place', () => {
    const player = { isTownUnlocked: (id: TownID) => id === TownID.laHarpar, isSiteUnlocked: () => false }
    expect(isNpcPlaceUnlocked({ kind: 'town', npcId: NpcID.laHarparMarvin, townId: TownID.laHarpar, buildingId: TownBuildingID.explorationGuild }, player)).toBe(true)
    expect(isNpcPlaceUnlocked({ kind: 'site', npcId: NpcID.laHarparMarvin, siteId: SiteID.farm }, player)).toBe(false)
    expect(isNpcPlaceUnlocked({ kind: 'site', npcId: NpcID.laHarparMarvin, siteId: SiteID.farm }, { ...player, isSiteUnlocked: () => true })).toBe(true)
  })

  it('does not reach a Site NPC before the Site is unlocked, then does', () => {
    const player = TestBed.inject(PlayerStore)
    const place = { kind: 'site', npcId: NpcID.mawoodSylvie, siteId: SiteID.farm } as const
    expect(isNpcPlaceUnlocked(place, player)).toBe(false)
    player.applyUnlockTarget({ type: 'site', siteId: SiteID.farm })
    expect(isNpcPlaceUnlocked(place, player)).toBe(true)
  })

  it('talkTo opens the farm tab for a Site NPC with no Town selected', () => {
    const navigation = TestBed.inject(GameNavigationService)
    const towns = TestBed.inject(TownsStore)
    navigation.talkTo({ kind: 'site', npcId: NpcID.mawoodSylvie, siteId: SiteID.farm })
    expect(navigation.tab()).toBe(GameTab.farm)
    expect(navigation.siteId()).toBe(SiteID.farm)
    expect(towns.selectedTownId()).toBeNull()
    expect(TestBed.inject(DialogueManagerService).activeNpc()?.id).toBe(NpcID.mawoodSylvie)
  })

  it('talkTo opens the town building for a town NPC', () => {
    const navigation = TestBed.inject(GameNavigationService)
    const towns = TestBed.inject(TownsStore)
    navigation.talkToMarvin()
    expect(navigation.tab()).toBe(GameTab.towns)
    expect(towns.selectedTownId()).toBe(TownID.laHarpar)
    expect(towns.selectedTownBuilding()?.buildingId).toBe(TownBuildingID.explorationGuild)
  })
})
