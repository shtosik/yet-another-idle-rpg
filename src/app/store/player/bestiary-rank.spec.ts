import { bestiaryRank, rankBonus } from './bestiary-rank'
import { rollDropList } from './kill-rewards'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { InventoryItem } from '../../../interfaces/item.interface'

describe('bestiaryRank', () => {
  it('fills a star at each regular threshold', () => {
    expect(bestiaryRank(EnemyID.crab, 99)).toBe(0)
    expect(bestiaryRank(EnemyID.crab, 100)).toBe(1)
    expect(bestiaryRank(EnemyID.crab, 9_999)).toBe(2)
    expect(bestiaryRank(EnemyID.crab, 10_000)).toBe(3)
  })

  it('uses lower thresholds for zone bosses', () => {
    expect(bestiaryRank(EnemyID.gangsterCrab, 10)).toBe(1)
    expect(bestiaryRank(EnemyID.gangsterCrab, 500)).toBe(3)
  })

  it('stacks bonuses with rank', () => {
    expect(rankBonus(EnemyID.crab, 0).dropChance).toBe(0)
    expect(rankBonus(EnemyID.crab, 10_000)).toEqual({ dropChance: 0.15, revealsDropOdds: true })
  })
})

describe('rollDropList drop chance bonus', () => {
  const drop = { id: ItemID.slimeResidue, minAmount: 1, maxAmount: 1, chance: 100 }
  const hits = (roll: number, bonus: number) => {
    const accumulator = new Map<string, InventoryItem>()
    rollDropList([drop], 1, bonus, accumulator, undefined, () => roll)
    return accumulator.size
  }

  it('hits only in the top 1 in chance without a bonus', () => {
    expect(hits(0.991, 0)).toBe(1)
    expect(hits(0.989, 0)).toBe(0)
  })

  it('widens the hit window by the bonus', () => {
    expect(hits(0.9896, 0.05)).toBe(1)
    expect(hits(0.9894, 0.05)).toBe(0)
  })
})
