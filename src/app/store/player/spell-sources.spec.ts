import { SAVE_MIGRATIONS } from './player.store'
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'

describe('PlayerStore save v2 to v3: scroll spell levels', () => {
  const migrate = (unlockedNodes: object, unlockedSpells: object) =>
    SAVE_MIGRATIONS[2]({ unlockedNodes, unlockedSpells, gold: 5 })

  it('keeps no scroll level for a spell only a node taught', () => {
    expect(migrate({ [SkillNodeID.haste]: 1 }, { [SpellID.haste]: 1 }))
      .toEqual({ unlockedNodes: { [SkillNodeID.haste]: 1 }, scrollSpellLevels: {}, gold: 5 })
  })

  it('keeps a scroll-only spell as its scroll level', () => {
    expect(migrate({}, { [SpellID.ambush]: 1 })['scrollSpellLevels']).toEqual({ [SpellID.ambush]: 1 })
  })

  it('keeps what a spell has beyond its node levels', () => {
    expect(migrate({ [SkillNodeID.haste]: 1 }, { [SpellID.haste]: 2 })['scrollSpellLevels']).toEqual({ [SpellID.haste]: 1 })
  })

  it('drops a refunded spell\'s zero and a save without spells', () => {
    expect(migrate({}, { [SpellID.volley]: 0 })['scrollSpellLevels']).toEqual({})
    expect(SAVE_MIGRATIONS[2]({})).toEqual({ scrollSpellLevels: {} })
  })
})
