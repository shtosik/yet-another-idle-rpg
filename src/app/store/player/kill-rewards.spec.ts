import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { InventoryItem } from '../../../interfaces/item.interface'
import { stackKey } from './inventory'
import { rollDropList, rollEnemyDrops } from './kill-rewards'
import ENEMIES_DATA from '../../../data/enemies-data'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'

describe('upgraded drop rolls', () => {
  it('rolls each copy independently and accumulates +0 and +1 stacks separately at the 10% boundary', () => {
    const drops = new Map<string, InventoryItem>()
    const rng = jasmine.createSpy('rng').and.returnValues(0.99, 0.99, 0.099, 0.1, 0.8)
    rollDropList([{ id: ItemID.knife, chance: 1, minAmount: 3, maxAmount: 3 }], 1, 0, drops, undefined, rng, 10)
    const items = [...drops.values()]
    expect(items.find(item => item.upgradeLevel === 1)?.amount).toBe(1)
    expect(items.find(item => !item.upgradeLevel)?.amount).toBe(2)
    expect(new Set(items.map(stackKey)).size).toBe(2)
  })

  it('never upgrades unique gear, pets or resources, and never spends an upgrade roll on them', () => {
    const ids = [ItemID.patronGloves, ItemID.petGreenSlime, ItemID.crabMeat]
    const drops = new Map<string, InventoryItem>()
    const rng = jasmine.createSpy('rng').and.returnValue(0.99)
    rollDropList(ids.map(id => ({ id, chance: 1, minAmount: 1, maxAmount: 1 })), 1, 0, drops, undefined, rng, 100)
    expect(drops.size).toBe(3)
    expect([...drops.values()].every(item => item.upgradeLevel === undefined)).toBeTrue()
    expect(rng).toHaveBeenCalledTimes(ids.length * 2)
  })

  it('does not roll upgrades before registration or for a drop that misses its ordinary roll', () => {
    const drops = new Map<string, InventoryItem>()
    const rng = jasmine.createSpy('rng').and.returnValue(0.5)
    rollDropList([{ id: ItemID.knife, chance: 1, minAmount: 1, maxAmount: 1 }], 1, 0, drops, undefined, rng)
    expect([...drops.values()][0].upgradeLevel).toBeUndefined()
    expect(rng).toHaveBeenCalledTimes(2)
    rng.calls.reset()
    rollDropList([{ id: ItemID.knife, chance: 10, minAmount: 1, maxAmount: 1 }], 1, 0, drops, undefined, rng, 10)
    expect(rng).toHaveBeenCalledTimes(1)
  })

  it('keeps the quest gate independent of upgrade rolls', () => {
    const rng = jasmine.createSpy('rng').and.returnValue(0.99)
    const drops = new Map<string, InventoryItem>()
    rollDropList([{
      id: ItemID.phurgosForgeTongs, chance: 1, minAmount: 1, maxAmount: 1, requiredActiveQuestId: QuestID.theColdForge,
    }], 1, 0, drops, new Set(), rng, 10)
    expect(drops.size).toBe(0)
    expect(rng).not.toHaveBeenCalled()
  })

  it('upgrades shiny regular-list gear but leaves shiny-list pets at +0', () => {
    const drops = new Map<string, InventoryItem>()
    rollEnemyDrops(ENEMIES_DATA[EnemyID.gangsterCrab], 10, true, 0, drops, undefined, () => 0.99999, 100)
    expect([...drops.values()].find(item => item.id === ItemID.knife)?.upgradeLevel).toBe(1)
    expect([...drops.values()].filter(item => item.id !== ItemID.knife).every(item => !item.upgradeLevel)).toBeTrue()
    expect([...drops.values()].some(item => item.id === ItemID.shinyPetGangsterCrab)).toBeTrue()
  })
})
