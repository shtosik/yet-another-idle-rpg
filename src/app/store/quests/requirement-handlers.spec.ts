import i18next from 'i18next'
import { consumedItems, killBaseline, RequirementContext, requirementProgress, requirementRows } from './requirement-handlers'
import { statsInitialState } from '../player/player'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { REPUTATION_THRESHOLDS } from '../player/reputation'

const held: Partial<Record<ItemID, number>> = { [ItemID.turnip]: 20, [ItemID.wheat]: 2, [ItemID.crabMeat]: 7 }
const ctx = (over: Partial<RequirementContext> = {}): RequirementContext => ({
  stats: { ...statsInitialState, level: 4 },
  progression: { [QuestID.meatShortage]: 2 },
  picks: [{ itemId: ItemID.turnip, amount: 14 }, { itemId: ItemID.wheat, amount: 5 }],
  itemCount: id => held[id] ?? 0,
  enemyKills: () => 3,
  waveKills: () => 9,
  professionLevel: () => 6,
  reputation: () => 50,
  isZoneUnlocked: id => id === ZoneID.horseshoeBeach,
  ...over,
})

describe('requirement handlers', () => {
  beforeAll(async () => {
    await i18next.init({ lng: 'en', resources: {} })
  })

  it('reads each requirement type', () => {
    expect(requirementProgress({ type: 'item', itemId: ItemID.crabMeat, amount: 30 }, ctx())).toEqual({ current: 7, target: 30 })
    expect(requirementProgress({ type: 'enemy', enemyId: EnemyID.rat, amount: 50 }, ctx())).toEqual({ current: 3, target: 50 })
    expect(requirementProgress({ type: 'wave', zoneId: ZoneID.horseshoeBeach, wave: 7, amount: 50 }, ctx())).toEqual({ current: 9, target: 50 })
    expect(requirementProgress({ type: 'stat', key: 'level', amount: 5 }, ctx())).toEqual({ current: 4, target: 5 })
    expect(requirementProgress({ type: 'quest', questId: QuestID.meatShortage }, ctx())).toEqual({ current: 1, target: 1 })
    expect(requirementProgress({ type: 'quest', questId: QuestID.meatShortage, step: 1 }, ctx())).toEqual({ current: 0, target: 1 })
    expect(requirementProgress({ type: 'professionLevel', professionId: ProfessionID.farming, level: 5 }, ctx())).toEqual({ current: 6, target: 5 })
    expect(requirementProgress({ type: 'reputation', reputationId: ReputationID.laHarpar, tier: ReputationTier.friendly }, ctx()))
      .toEqual({ current: 50, target: REPUTATION_THRESHOLDS[ReputationTier.friendly] })
  })

  it('caps picked items per pick in progress, but shows each pick held in full', () => {
    expect(requirementProgress({ type: 'pickedItems' }, ctx())).toEqual({ current: 14 + 2, target: 19 })
    expect(requirementRows({ type: 'pickedItems' }, ctx()).map(({ current, target }) => [current, target])).toEqual([[20, 14], [2, 5]])
    expect(requirementProgress({ type: 'pickedItems' }, ctx({ picks: [] }))).toEqual({ current: 0, target: 1 })
  })

  it('links kill rows to an unlocked zone only', () => {
    expect(requirementRows({ type: 'wave', zoneId: ZoneID.horseshoeBeach, wave: 7, amount: 50 }, ctx())[0].zoneId).toBe(ZoneID.horseshoeBeach)
    expect(requirementRows({ type: 'wave', zoneId: ZoneID.plains, wave: 2, amount: 5 }, ctx())[0].zoneId).toBeNull()
  })

  it('records kill baselines and the items a turn-in takes', () => {
    const baseline = killBaseline([
      { type: 'enemy', enemyId: EnemyID.rat, amount: 50 },
      { type: 'wave', zoneId: ZoneID.horseshoeBeach, wave: 7, amount: 50 },
      { type: 'item', itemId: ItemID.crabMeat, amount: 30 },
    ], { enemy: () => 11, wave: () => 22 })
    expect(baseline).toEqual({ enemies: { [EnemyID.rat]: 11 }, waves: { [`${ZoneID.horseshoeBeach}-7`]: 22 } })

    expect(consumedItems([{ type: 'item', itemId: ItemID.crabMeat, amount: 30 }, { type: 'pickedItems' }, { type: 'stat', key: 'level', amount: 1 }], ctx().picks))
      .toEqual([{ id: ItemID.crabMeat, amount: 30 }, { id: ItemID.turnip, amount: 14 }, { id: ItemID.wheat, amount: 5 }])
  })
})
