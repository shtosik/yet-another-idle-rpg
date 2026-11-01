import { buffModifiers, consumableModifiers, deriveStats, equipmentModifiers, foodMultiplierOf, initialResources, statContributions } from './stats'
import { initialEquipmentState, statsInitialState } from './player'
import { ItemID } from '../../../enums/ids/item-id.enum'
import ITEM_DATA from '../../../data/items-data'
import { ConsumableItem } from '../../../interfaces/item.interface'
import { ItemTier } from '../../../enums/items/item-tier.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'

describe('deriveStats', () => {
  const withRing = { ...initialEquipmentState, ring: { id: ItemID.joshsHeirloom, tier: ItemTier.uncommon } }

  it('applies equipment and inverts attackSpeed', () => {
    const stats = deriveStats(initialResources(), equipmentModifiers(withRing))

    expect(stats.attackPower).toBe(statsInitialState.attackPower + 1)
    expect(stats.attackSpeed).toBe(statsInitialState.attackSpeed - 0.1)
  })

  it('returns to base once the source is gone', () => {
    deriveStats(initialResources(), equipmentModifiers(withRing))
    const stats = deriveStats(initialResources(), equipmentModifiers(initialEquipmentState))

    expect(stats.attackSpeed).toBe(statsInitialState.attackSpeed)
  })

  it('rounds away float drift', () => {
    const haste = buffModifiers([SpellID.haste])
    const stats = deriveStats(initialResources(), [...haste, ...equipmentModifiers(withRing)])

    expect(stats.attackSpeed).toBe(2.32)
  })

  it('never shows mana above maxMana', () => {
    const stats = deriveStats({ ...initialResources(), mana: 50 }, [])

    expect(stats.mana).toBe(statsInitialState.maxMana)
  })

  it('ignores modifiers on resources', () => {
    const stats = deriveStats(initialResources(), [{ stat: 'goldCoins', amount: 10 }])

    expect(stats.goldCoins).toBe(0)
  })
})

describe('statContributions', () => {
  const none = { equipment: [], skills: [], buffs: [], consumables: [], bonuses: [], mastery: [] }

  it('sums flat and percent amounts per source and skips sources without the stat', () => {
    const contributions = statContributions('attackPower', {
      ...none,
      equipment: [{ stat: 'attackPower', amount: 2 }, { stat: 'attackPower', amount: 1 }, { stat: 'critChance', amount: 5 }],
      skills: [{ stat: 'attackPower', amount: 0.1, percent: true }],
    })

    expect(contributions).toEqual([
      { source: 'equipment', flat: 3, percent: 0 },
      { source: 'skills', flat: 0, percent: 0.1 },
    ])
  })

  it('keeps the data sign for inverted stats and rounds float drift', () => {
    const contributions = statContributions('attackSpeed', {
      ...none,
      buffs: [{ stat: 'attackSpeed', amount: 0.1 }, { stat: 'attackSpeed', amount: 0.2 }],
    })

    expect(contributions).toEqual([{ source: 'buffs', flat: 0.3, percent: 0 }])
  })

  it('scales food stats by the food effect multiplier from gear, not potions', () => {
    // No potion gives stats yet, so lend one a stat for this test.
    const potion = ITEM_DATA[ItemID.minorManaPotion] as ConsumableItem
    const original = potion.effect.stats
    potion.effect.stats = [{ stat: 'critChance', amount: 4 }]
    try {
      const food = foodMultiplierOf([{ stat: 'foodEffectMultiplier', amount: 0.5 }])
      const stats = deriveStats(initialResources(), consumableModifiers([ItemID.grilledFish, ItemID.minorManaPotion], food))
      expect(food).toBe(1.5)
      expect(stats.attackPower).toBe(statsInitialState.attackPower + 3)
      expect(stats.critChance).toBe(statsInitialState.critChance + 4)
    } finally {
      potion.effect.stats = original
    }
  })
})
