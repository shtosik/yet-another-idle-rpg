import { EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import { SpellID } from '../../../enums/ids/spell-id.enum'

/** Spells the bar holds. */
export const SPELL_BAR_SLOTS = 5

export type SpellBar = (EquippedSpell | null)[]

/** A slot on cooldown keeps its spell: it can't be emptied, moved or given another spell. */
export const isLocked = (slot: EquippedSpell | null | undefined): boolean => (slot?.cooldownRemainingMs ?? 0) > 0

/** Pads a shorter (older save) bar to `SPELL_BAR_SLOTS`. */
const full = (bar: SpellBar): (EquippedSpell | null)[] =>
  [...bar, ...new Array<null>(Math.max(0, SPELL_BAR_SLOTS - bar.length)).fill(null)]

/**
 * Puts `spell` in `slot`. A spell already on the bar swaps places with the slot's occupant; a new one displaces it to
 * the first free slot, or off the bar when none is free. Without `slot`, a new spell takes the first free slot (none:
 * nothing changes). A locked slot, at either end, changes nothing. Returns `bar` itself when nothing changes.
 */
export function place(bar: SpellBar, spell: SpellID, slot?: number): SpellBar {
  const next = full(bar)
  const from = next.findIndex(s => s?.spellId === spell)
  const target = slot ?? (from === -1 ? next.findIndex(s => !s) : from)
  if (target === -1 || target === from || isLocked(next[target]) || isLocked(next[from])) return bar

  if (from !== -1) {
    ;[next[target], next[from]] = [next[from], next[target]]
    return next
  }
  const displaced = next[target]
  next[target] = { spellId: spell, cooldownRemainingMs: 0 }
  const free = next.findIndex(s => !s)
  if (displaced && free !== -1) next[free] = displaced
  return next
}

/** Takes `spell` off the bar unless its slot is locked. Returns `bar` itself when nothing changes. */
export function remove(bar: SpellBar, spell: SpellID): SpellBar {
  const i = bar.findIndex(s => s?.spellId === spell)
  if (i === -1 || isLocked(bar[i])) return bar
  return bar.map((s, j) => j === i ? null : s)
}

/** Empties every unlocked slot whose spell isn't `known`. Returns `bar` itself when nothing changes. */
export function prune(bar: SpellBar, known: SpellID[]): SpellBar {
  const gone = (s: EquippedSpell | null) => !!s && !known.includes(s.spellId) && !isLocked(s)
  return bar.some(gone) ? bar.map(s => gone(s) ? null : s) : bar
}
