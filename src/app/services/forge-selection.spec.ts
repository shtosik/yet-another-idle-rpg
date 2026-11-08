import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ForgeSelection } from './forge-selection'
import { PlayerStore } from '../store/player/player.store'
import { TownsStore } from '../store/towns/towns.store'
import { mergeCost, MergeSource } from '../store/player/merge'
import { UPGRADE_CHANCES } from '../../data/upgrade-data'
import ITEM_DATA from '../../data/items-data'
import { ItemID } from '../../enums/ids/item-id.enum'

describe('ForgeSelection (Forge session)', () => {
  let session: ForgeSelection
  let player: InstanceType<typeof PlayerStore>
  const id = ItemID.woodenBow
  const tier = ITEM_DATA[id].tier
  const bow = (upgradeLevel = 0): MergeSource => ({ from: 'inventory', item: { id, tier, upgradeLevel } })

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    TestBed.inject(TownsStore).openForge()
    session = TestBed.inject(ForgeSelection)
  })

  afterEach(() => localStorage.clear())

  it('quotes cost, chance and the +1 gear while the merge is refused for gold', () => {
    player.grant([{ id, tier, amount: 2 }], 'lossy')
    session.select(bow())
    session.select(bow())

    expect(session.evaluation()).toEqual({ status: 'refused', reason: 'notEnoughGold' })
    expect(session.quote()).toEqual({ cost: mergeCost(ITEM_DATA[id].value, 0), chance: UPGRADE_CHANCES[1] ?? 0, next: { id, tier, upgradeLevel: 1 } })
    expect(session.merge()).toBeNull()
  })

  it('never puts one copy in both inputs', () => {
    player.grant([{ id, tier, amount: 1 }], 'lossy')
    session.select(bow())
    session.select(bow())
    expect(session.sacrifice()).toBeNull()
  })

  it('uses up the sacrifice and keeps an upgraded inventory base selected', () => {
    player.grant([{ id, tier, amount: 2 }], 'lossy')
    player.updatePlayerStats([{ stat: 'goldCoins', amount: 1_000_000 }])
    session.select(bow())
    session.select(bow())

    const merged = session.merge()

    expect(merged).not.toBeNull()
    expect(session.sacrifice()).toBeNull()
    const expectedBase = merged!.result.status === 'success' ? bow(1) : bow(0)
    expect(session.base()).toEqual(expectedBase)
    expect(merged!.before).toEqual({ id, tier, upgradeLevel: 0 })
  })
})
