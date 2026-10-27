import { EnemyID } from '../enums/ids/enemy-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemStack } from '../app/store/player/inventory'
import { DamageElement } from '../enums/damage-element.enum'

export interface ArenaWave {
  /** Each kill picks one at random. */
  enemies: EnemyID[]
  /** Kills that clear the wave. */
  count: number
}

const early = [EnemyID.forestSpider, EnemyID.corruptedSapling]
const middle = [EnemyID.forestSpider, EnemyID.corruptedSapling, EnemyID.gnollScout]
const late = [EnemyID.gnollScout, EnemyID.treantSprout]
const final = [EnemyID.treantSprout, EnemyID.bogSkeleton]
const regular = (enemies: EnemyID[]): ArenaWave => ({ enemies, count: 3 })
const boss = (enemyId: EnemyID): ArenaWave => ({ enemies: [enemyId], count: 1 })

/**
 * The Combat Arena in Lirold: fixed waves against one clock (docs/systems/arena.md).
 * Opens after the Mawood Zones. Sized for a player just past the Harpy Matriarch (~40 Attack Power, ~2.6 s per
 * attack): about 9.5 min of plain fighting, so the champions' abilities (`ARENA_BOSSES`) decide the clear. Arena
 * enemies are never wave-scaled.
 */
export const ARENA = {
  entryFee: 10000,
  timeLimitMs: 10 * 60 * 1000,
  /** Replaces the zones' 2 s respawn delay inside the arena. */
  respawnDelayMs: 500,
  waves: [
    regular(early), regular(early), regular(early), regular(early), boss(EnemyID.arenaBrute),
    regular(middle), regular(middle), regular(middle), regular(middle), boss(EnemyID.arenaArcanist),
    regular(late), regular(late), regular(late), regular(late), boss(EnemyID.arenaBurrower),
    regular(final), regular(final), regular(final), regular(final), boss(EnemyID.arenaYad),
  ] as ArenaWave[],
  /** Every clear. */
  clearRewards: [{ id: ItemID.moltenCape, amount: 1 }] as ItemStack[],
  /** The first clear only, on top of `clearRewards`. */
  firstClearRewards: [{ id: ItemID.skillPointBook, amount: 2 }] as ItemStack[],
  /** The battle background (vertical, like the Zones'); the Arena building uses `liroldArena.png`. */
  url: './assets/img/backgrounds/liroldArena-vertical.png',
}

/** The champions' abilities (`ArenaService`); each tests a different skill. Times in ms. */
export const ARENA_BOSSES = {
  /** The Brute: a weak point shows on the sprite; clicking it raises the player's damage for a while. */
  brute: { firstAfterMs: 5000, visibleMs: 3000, cooldownMs: 30000, damageBonus: 0.5, bonusMs: 10000 },
  /** The Arcanist: magic hits cost run time, `secondsPerDamage` per point, capped per hit and per fight. */
  arcanist: { secondsPerDamage: 0.2, maxPerHitMs: 5000, maxPerFightMs: 60000 },
  /** The Burrower: goes under, one of `mounds` shakes; the right pick stuns it, a wrong or no pick heals it. */
  burrower: { everyMs: 20000, pickMs: 4000, mounds: 3, stunMs: 5000, stunDamageBonus: 0.5, healFraction: 0.1 },
  /** Yad: a shield of one element; only that element hurts it, and its first hit breaks it. */
  yad: { minGapMs: 5000, maxGapMs: 10000, elements: [DamageElement.fire, DamageElement.air, DamageElement.water] },
}
