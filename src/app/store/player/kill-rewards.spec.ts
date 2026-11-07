import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED } from '../../../data/quests-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import { InventoryItem } from '../../../interfaces/item.interface'
import { getQuestDropLimits } from '../../services/quest-status'
import { stackKey } from './inventory'
import { rollDropList, rollEnemyDrops } from './kill-rewards'
import ENEMIES_DATA from '../../../data/enemies-data'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'

describe('seed drop chance', () => {
  const hits = (id: ItemID, roll: number, seedDropChance: number, dropChanceBonus = 0) => {
    const drops = new Map<string, InventoryItem>()
    rollDropList([{ id, chance: 10, minAmount: 1, maxAmount: 1 }], 1, dropChanceBonus, drops, undefined, () => roll, 0, seedDropChance)
    return drops.size === 1
  }

  it('raises seed odds by (1 + x), on top of the rank bonus', () => {
    // 1 in 10 hits above 0.9; +25% above 0.875; with a +10% rank bonus also above 0.8625.
    expect(hits(ItemID.turnipSeeds, 0.88, 0)).toBeFalse()
    expect(hits(ItemID.turnipSeeds, 0.88, 0.25)).toBeTrue()
    expect(hits(ItemID.turnipSeeds, 0.87, 0.25)).toBeFalse()
    expect(hits(ItemID.turnipSeeds, 0.87, 0.25, 0.1)).toBeTrue()
  })

  it('leaves other drops alone', () => {
    expect(hits(ItemID.stick, 0.88, 0.25)).toBeFalse()
  })
})

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
    }], 1, 0, drops, new Map(), rng, 10)
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

describe('quest-only drops', () => {
  const questId = QuestID.signsOfRot
  const originalSteps = QUEST_DATA[questId].steps
  const drop: EnemyDrop = {
    id: ItemID.corruptedResin, minAmount: 1, maxAmount: 5, chance: 1, requiredActiveQuestId: questId,
  }
  let accumulator: Map<string, InventoryItem>

  beforeEach(() => {
    accumulator = new Map()
    // Put the real resin requirement between two talk steps to exercise current-step gating.
    const talk = { ...originalSteps[0], requirements: [] }
    QUEST_DATA[questId].steps = [talk, ...originalSteps, talk]
  })

  afterEach(() => { QUEST_DATA[questId].steps = originalSteps })

  const roll = (step: number | undefined, held = 0, rolls = 1) => {
    const progression = step === undefined ? {} : { [questId]: step }
    const limits = getQuestDropLimits(progression, () => held)
    rollDropList([drop], rolls, 0, accumulator, limits, () => 0.999)
    return [...accumulator.values()].reduce((sum, item) => sum + item.amount, 0)
  }

  it('skips a quest that is not started or is completed', () => {
    expect(roll(undefined)).toBe(0)
    expect(roll(QUEST_STEP_AFTER_COMPLETED)).toBe(0)
  })

  it('waits for the step that requires the item', () => {
    expect(roll(1)).toBe(0)
    expect(roll(2)).toBe(3)
  })

  it('stops after the item step, even though the quest is still active', () => {
    expect(roll(3)).toBe(0)
  })

  it('stops when enough is held, even while other step requirements are unmet', () => {
    expect(roll(2, 3)).toBe(0)
    expect(roll(2, 4)).toBe(0)
  })

  it('caps a stack roll at the missing count', () => {
    expect(roll(2, 2)).toBe(1)
  })

  it('counts earlier rolls and earlier drop lists in the accumulator', () => {
    expect(roll(2, 1, 10)).toBe(2)
    expect(roll(2, 1, 10)).toBe(2)
  })

  it('leaves drops without a quest gate uncapped', () => {
    const { requiredActiveQuestId: _, ...ordinaryDrop } = drop
    rollDropList([ordinaryDrop], 10, 0, accumulator, undefined, () => 0.999)
    expect([...accumulator.values()][0].amount).toBe(50)
  })
})
