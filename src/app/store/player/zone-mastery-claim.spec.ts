import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import ITEM_DATA from '../../../data/items-data'
import ZONES_DATA from '../../../data/zones-data'
import { tabOf } from './inventory'

describe('PlayerStore zone mastery', () => {
  let store: InstanceType<typeof PlayerStore>
  const beach = ZoneID.horseshoeBeach
  const reward = ZONES_DATA[beach].masteryReward

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('pays a finished star once', () => {
    store.updateEnemyKillCount(EnemyID.gangsterCrab, 10)
    const gold = store.resources().goldCoins

    expect(store.claimZoneStar(beach, 'conqueror')).toBeTrue()
    expect(store.resources().goldCoins).toBe(gold + reward.gold)
    expect(store.explorerTokens()).toBe(reward.explorerTokens)
    expect(store.inventory().materials.find(slot => slot?.id === reward.items[0].id)?.amount).toBe(reward.items[0].amount)

    expect(store.claimZoneStar(beach, 'conqueror')).toBeFalse()
    expect(store.resources().goldCoins).toBe(gold + reward.gold)
  })

  it('refuses an unfinished star', () => {
    store.updateEnemyKillCount(EnemyID.gangsterCrab, 9)
    expect(store.claimZoneStar(beach, 'conqueror')).toBeFalse()
  })

  it('refuses the claim while the chest items do not fit', () => {
    const rewardIds = new Set(reward.items.map(item => item.id))
    // Stacks are per id + tier, so every tier of each resource takes its own slot.
    const resources = (Object.values(ItemID).filter(v => typeof v === 'number') as ItemID[])
      .filter(id => !rewardIds.has(id) && ITEM_DATA[id]?.type === ItemType.resource)
    const tiers = Object.values(ItemTier).filter(v => typeof v === 'number') as ItemTier[]
    const fillers = resources.flatMap(id => tiers.map(tier => ({ id, tier, amount: 1 }))).slice(0, store.inventoryCapacity().materials)
    store.addItems(fillers)
    expect(store.inventory().materials.every(slot => slot !== null)).toBeTrue()
    store.updateEnemyKillCount(EnemyID.gangsterCrab, 10)

    expect(store.canClaimZoneStar(beach, 'conqueror')).toBeFalse()
    expect(store.claimZoneStar(beach, 'conqueror')).toBeFalse()
    expect(store.claimedZoneStars()).toEqual({})
  })

  it('claims into Materials while the Gear tab is full', () => {
    const gear = (Object.values(ItemID).filter(v => typeof v === 'number') as ItemID[])
      .filter(id => tabOf(id) === 'gear').slice(0, store.inventoryCapacity().gear)
    store.addItems(gear.map(id => ({ id, amount: 1 })))
    expect(store.inventory().gear.every(slot => slot !== null)).toBeTrue()
    store.updateEnemyKillCount(EnemyID.gangsterCrab, 10)

    expect(store.claimZoneStar(beach, 'conqueror')).toBeTrue()
  })

  it('counts shiny kills per zone online and offline', () => {
    store.processBattleEnd(EnemyID.crab, beach, 1, true)
    store.processBattleEnd(EnemyID.crab, beach, 1, false)
    store.applyKillBatch({
      zoneId: beach, wave: 1, kills: 2, shinies: 2, killsByEnemy: { [EnemyID.crab]: 2 },
      taskCountsByEnemy: {}, experience: 0, gold: 0, items: [],
    })

    expect(store.shinyKillsByZone()[beach]).toBe(3)
  })
})
