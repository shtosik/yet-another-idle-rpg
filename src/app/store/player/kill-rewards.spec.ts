import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED } from '../../../data/quests-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import { InventoryItem } from '../../../interfaces/item.interface'
import { getQuestDropLimits } from '../../services/quest-status'
import { rollDropList } from './kill-rewards'

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
