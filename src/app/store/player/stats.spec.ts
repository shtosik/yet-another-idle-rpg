import { buffModifiers, deriveStats, equipmentModifiers, initialResources } from './stats'
import { initialEquipmentState, statsInitialState } from './player'
import { ItemID } from '../../../enums/ids/item-id.enum'
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
