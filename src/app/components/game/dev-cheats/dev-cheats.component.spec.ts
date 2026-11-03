import { ItemID } from 'enums/ids/item-id.enum'
import { fromName } from './dev-cheats.component'

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
