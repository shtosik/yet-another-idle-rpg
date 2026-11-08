import { canCast, CastContext, manaCost, planConsumable, spellCooldown } from './spell-rules'
import SPELLS_DATA from '../../../data/spells-data'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'

const ctx = (spellId: SpellID, over: Partial<CastContext> = {}): CastContext => ({
  slot: { spellId, cooldownRemainingMs: 0 },
  mana: 100,
  cost: 1,
  isKnown: true,
  hasRequiredWeapon: true,
  isInCombat: true,
  activeBuffs: [],
  activeDamageOverTime: [],
  empowered: null,
  ...over,
})

describe('Spell rules', () => {
  describe('manaCost', () => {
    it('is the base cost without a perk level', () => {
      expect(manaCost(SPELLS_DATA[SpellID.stoneSpike], {})).toBe(3)
    })

    it('drops per perk level but never below 1', () => {
      expect(manaCost(SPELLS_DATA[SpellID.stoneSpike], { [SkillNodeID.stoneSpikeMana]: 1 })).toBe(2)
      expect(manaCost(SPELLS_DATA[SpellID.stoneSpike], { [SkillNodeID.stoneSpikeMana]: 9 })).toBe(1)
    })
  })

  describe('spellCooldown', () => {
    it('subtracts the stat and the perk', () => {
      expect(spellCooldown(SPELLS_DATA[SpellID.fireStrike], { [SkillNodeID.fireStrikeCooldown]: 2 }, 5)).toBe(45)
    })

    it('never drops below 1 second', () => {
      expect(spellCooldown(SPELLS_DATA[SpellID.fireStrike], {}, 500)).toBe(1)
    })
  })

  describe('canCast', () => {
    it('needs the spell on the bar, off cooldown, known, armed and affordable', () => {
      const id = SpellID.fireStrike
      expect(canCast(SPELLS_DATA[id], ctx(id))).toBe(true)
      expect(canCast(SPELLS_DATA[id], ctx(id, { slot: undefined }))).toBe(false)
      expect(canCast(SPELLS_DATA[id], ctx(id, { slot: { spellId: id, cooldownRemainingMs: 1 } }))).toBe(false)
      expect(canCast(SPELLS_DATA[id], ctx(id, { isKnown: false }))).toBe(false)
      expect(canCast(SPELLS_DATA[id], ctx(id, { hasRequiredWeapon: false }))).toBe(false)
      expect(canCast(SPELLS_DATA[id], ctx(id, { mana: 0 }))).toBe(false)
    })

    it('needs a living enemy for damage spells', () => {
      expect(canCast(SPELLS_DATA[SpellID.fireStrike], ctx(SpellID.fireStrike, { isInCombat: false }))).toBe(false)
    })

    it('lets buffs be cast between fights but not while active', () => {
      const id = SpellID.haste
      expect(canCast(SPELLS_DATA[id], ctx(id, { isInCombat: false }))).toBe(true)
      expect(canCast(SPELLS_DATA[id], ctx(id, { activeBuffs: [id] }))).toBe(false)
    })

    it('does not recast damage over time while it runs', () => {
      const id = SpellID.thunderstorm
      expect(canCast(SPELLS_DATA[id], ctx(id))).toBe(true)
      expect(canCast(SPELLS_DATA[id], ctx(id, { activeDamageOverTime: [id] }))).toBe(false)
    })

    it('does not recast empower while it is already active, but allows it between fights', () => {
      const id = SpellID.ambush
      expect(canCast(SPELLS_DATA[id], ctx(id, { isInCombat: false }))).toBe(true)
      expect(canCast(SPELLS_DATA[id], ctx(id, { empowered: id }))).toBe(false)
    })
  })

  describe('planConsumable', () => {
    const food = { slot: 'food' as const, cooldown: 60, duration: 120, stats: [{ stat: 'attackPower' as const, amount: 5 }] }
    const manaPotion = { slot: 'potion' as const, cooldown: 30, manaRestore: 5 }

    it('caps the effect at the lock and gives no mana without a mana effect', () => {
      expect(planConsumable(food, 0, 1, 10, 10)).toEqual({ manaGained: 0, effectRemaining: 60, lockRemaining: 60 })
    })

    it('does nothing while the slot is locked or none are owned', () => {
      expect(planConsumable(food, 5, 1, 10, 10)).toBeNull()
      expect(planConsumable(food, 0, 0, 10, 10)).toBeNull()
    })

    it('gives only the mana that fits', () => {
      expect(planConsumable(manaPotion, 0, 1, 8, 10)?.manaGained).toBe(2)
    })

    it('does nothing for a pure mana potion at full mana', () => {
      expect(planConsumable(manaPotion, 0, 1, 10, 10)).toBeNull()
    })

    it('still works at full mana when it has stats', () => {
      const both = { ...food, manaRestore: 5 }
      expect(planConsumable(both, 0, 1, 10, 10)?.manaGained).toBe(0)
    })
  })
})
