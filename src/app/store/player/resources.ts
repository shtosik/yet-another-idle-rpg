import { ShopCurrency } from '../../../types/shop/shop.type'
import { calculateXp } from './experience'
import { Resources } from './stats'

/** The saved resources with explorer tokens, which `PlayerState` keeps beside them. */
export type Held = Resources & { explorerTokens: number }

/** Amounts added to held resources; negative takes. */
export type ResourceChange = Partial<Held>

/** What a change did: levels and skill points gained, and the gold, tokens and shown mana it added (negative when taken). */
export interface ResourceGain {
  levelsGained: number
  skillPointsGained: number
  gold: number
  tokens: number
  mana: number
}

export const NO_GAIN: ResourceGain = { levelsGained: 0, skillPointsGained: 0, gold: 0, tokens: 0, mana: 0 }

const CURRENCY_FIELD: Record<ShopCurrency, 'goldCoins' | 'explorerTokens'> = { gold: 'goldCoins', explorerTokens: 'explorerTokens' }

/** The one rule for every spend (shops, fees, respec, merge): a balance never goes below 0. */
export const canAfford = (balance: number, amount: number): boolean => amount >= 0 && balance >= amount

/** Stored mana after adding `amount`, kept in 0..`maxMana`; stored mana above `maxMana` counts as `maxMana`. */
const clampMana = (mana: number, maxMana: number, amount: number): number =>
  Math.max(0, Math.min(maxMana, Math.min(mana, maxMana) + amount))

/** How much shown mana adding `amount` really gives (a potion at full mana gives 0). */
export const manaGain = (mana: number, maxMana: number, amount: number): number =>
  clampMana(mana, maxMana, amount) - Math.min(mana, maxMana)

/** Spends XP on levels while it covers the next one, one skill point per level. */
const levelUp = (held: Held): Held => {
  let { experience, level, unspentSkillPoints } = held
  for (let next = calculateXp(level + 1); experience >= next; next = calculateXp(level + 1)) {
    experience -= next
    level++
    unspentSkillPoints++
  }
  return { ...held, experience, level, unspentSkillPoints }
}

/** What changed from `before` to `after`; mana is compared as shown (capped at `maxMana`). */
export const gainOf = (before: Held, after: Held, maxMana: number): ResourceGain => ({
  levelsGained: after.level - before.level,
  skillPointsGained: after.unspentSkillPoints - before.unspentSkillPoints,
  gold: after.goldCoins - before.goldCoins,
  tokens: after.explorerTokens - before.explorerTokens,
  mana: Math.min(after.mana, maxMana) - Math.min(before.mana, maxMana),
})

/** Adds `change`: mana stays in 0..`maxMana`, XP levels up as far as it reaches. Gold and tokens are not checked: spends use `spendResource`. */
export function addResources(held: Held, change: ResourceChange, maxMana: number): { held: Held; gain: ResourceGain } {
  let next = { ...held }
  for (const [stat, amount] of Object.entries(change) as [keyof Held, number][]) {
    next[stat] = stat === 'mana' ? clampMana(next.mana, maxMana, amount) : next[stat] + amount
  }
  if (change.experience) next = levelUp(next)
  return { held: next, gain: gainOf(held, next, maxMana) }
}

/** Takes `amount` of `currency`; null (nothing changes) when the player holds less or `amount` is negative. */
export function spendResource(held: Held, currency: ShopCurrency, amount: number): { held: Held; gain: ResourceGain } | null {
  const field = CURRENCY_FIELD[currency]
  if (!canAfford(held[field], amount)) return null
  const next = { ...held, [field]: held[field] - amount }
  // Mana is untouched, so any cap compares it the same.
  return { held: next, gain: gainOf(held, next, held.mana) }
}

/** One mana point per `manaRegenRate` ms of `timer + deltaMs`, up to `maxMana`; the timer restarts at full mana. */
export function manaRegen(
  held: Held, timer: number, deltaMs: number, caps: { maxMana: number; manaRegenRate: number },
): { held: Held; timer: number; gain: ResourceGain } {
  const { maxMana, manaRegenRate } = caps
  const current = Math.min(held.mana, maxMana)
  if (current >= maxMana) return { held, timer: 0, gain: NO_GAIN }

  let mana = current
  timer += deltaMs
  while (timer >= manaRegenRate && mana < maxMana) {
    timer -= manaRegenRate
    mana++
  }
  if (mana >= maxMana) timer = 0
  const next = mana === current ? held : { ...held, mana }
  return { held: next, timer, gain: gainOf(held, next, maxMana) }
}
