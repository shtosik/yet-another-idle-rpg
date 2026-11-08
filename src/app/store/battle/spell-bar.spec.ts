import { place, prune, remove, SPELL_BAR_SLOTS, SpellBar } from './spell-bar'
import { SpellID } from '../../../enums/ids/spell-id.enum'

const ready = (spellId: SpellID) => ({ spellId, cooldownRemainingMs: 0 })
const cooling = (spellId: SpellID) => ({ spellId, cooldownRemainingMs: 5000 })
const ids = (bar: SpellBar) => bar.map(slot => slot?.spellId ?? null)
const empty = (): SpellBar => new Array(SPELL_BAR_SLOTS).fill(null)

describe('Spell bar', () => {
  describe('place', () => {
    it('puts a new spell in the first free slot without a slot given', () => {
      const bar = [ready(SpellID.haste), null, null, null, null]
      expect(ids(place(bar, SpellID.volley))).toEqual([SpellID.haste, SpellID.volley, null, null, null])
    })

    it('changes nothing for a spell already on the bar or a full bar', () => {
      const bar = [ready(SpellID.haste), null, null, null, null]
      expect(place(bar, SpellID.haste)).toBe(bar)
      const full = [SpellID.haste, SpellID.volley, SpellID.ambush, SpellID.warCry, SpellID.fireStrike].map(ready)
      expect(place(full, SpellID.galeCut)).toBe(full)
    })

    it('pads an older, shorter bar', () => {
      expect(ids(place([], SpellID.haste))).toEqual([SpellID.haste, null, null, null, null])
    })

    it('puts a new spell in the chosen slot, fresh off cooldown', () => {
      const next = place(empty(), SpellID.volley, 3)
      expect(next[3]).toEqual(ready(SpellID.volley))
    })

    it('displaces the occupant to the first free slot', () => {
      const bar = [ready(SpellID.haste), ready(SpellID.volley), null, null, null]
      expect(ids(place(bar, SpellID.ambush, 0))).toEqual([SpellID.ambush, SpellID.volley, SpellID.haste, null, null])
    })

    it('drops the occupant off a full bar', () => {
      const full = [SpellID.haste, SpellID.volley, SpellID.ambush, SpellID.warCry, SpellID.fireStrike].map(ready)
      expect(ids(place(full, SpellID.galeCut, 1))).toEqual([SpellID.haste, SpellID.galeCut, SpellID.ambush, SpellID.warCry, SpellID.fireStrike])
    })

    it('swaps a spell already on the bar with the slot it moves to, keeping both cooldowns', () => {
      const bar = [ready(SpellID.haste), null, { spellId: SpellID.volley, cooldownRemainingMs: 0 }, null, null]
      expect(ids(place(bar, SpellID.volley, 0))).toEqual([SpellID.volley, null, SpellID.haste, null, null])
      expect(ids(place(bar, SpellID.haste, 4))).toEqual([null, null, SpellID.volley, null, SpellID.haste])
    })

    it('locks a slot on cooldown: nothing lands on it and its spell does not move', () => {
      const bar = [cooling(SpellID.haste), ready(SpellID.volley), null, null, null]
      expect(place(bar, SpellID.ambush, 0)).toBe(bar)
      expect(place(bar, SpellID.volley, 0)).toBe(bar)
      expect(place(bar, SpellID.haste, 2)).toBe(bar)
    })
  })

  describe('remove', () => {
    it('empties the spell\'s slot', () => {
      expect(ids(remove([ready(SpellID.haste), ready(SpellID.volley)], SpellID.haste))).toEqual([null, SpellID.volley])
    })

    it('keeps a spell on cooldown and ignores one not on the bar', () => {
      const bar = [cooling(SpellID.haste), null]
      expect(remove(bar, SpellID.haste)).toBe(bar)
      expect(remove(bar, SpellID.volley)).toBe(bar)
    })
  })

  describe('prune', () => {
    it('empties slots of spells no longer known, but not while they cool down', () => {
      const bar = [ready(SpellID.haste), cooling(SpellID.volley), ready(SpellID.ambush), null, null]
      expect(ids(prune(bar, [SpellID.ambush]))).toEqual([null, SpellID.volley, SpellID.ambush, null, null])
    })

    it('returns the same bar when every spell is known', () => {
      const bar = [ready(SpellID.haste), null]
      expect(prune(bar, [SpellID.haste])).toBe(bar)
    })
  })
})
