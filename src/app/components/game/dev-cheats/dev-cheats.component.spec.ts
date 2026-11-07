import { ItemID } from 'enums/ids/item-id.enum'
import ITEM_DATA from '../../../../data/items-data'
import { allItemStacks, fromName } from './dev-cheats.component'

describe('allItemStacks', () => {
  it('has one stack of the amount for every item, at the item\'s own tier', () => {
    const stacks = allItemStacks(100)
    expect(stacks.length).toBe(Object.keys(ITEM_DATA).length)
    expect(stacks.every(s => s.amount === 100 && s.tier === ITEM_DATA[s.id].tier)).toBe(true)
  })
})

describe('fromName', () => {
  it('resolves a member name to its enum number', () => {
    expect(fromName(ItemID, 'ItemID', 'machete')).toBe(ItemID.machete)
  })

  it('passes an enum number through, 0 included', () => {
    expect(fromName(ItemID, 'ItemID', ItemID.slimeResidue)).toBe(0)
  })

  it('throws on an unknown name, listing the names', () => {
    expect(() => fromName(ItemID, 'ItemID', 'machet' as keyof typeof ItemID)).toThrowError(/no ItemID named 'machet'; names: slimeResidue, crabMeat/)
  })
})
