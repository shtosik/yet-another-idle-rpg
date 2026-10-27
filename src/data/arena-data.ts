import { EnemyID } from '../enums/ids/enemy-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemStack } from '../app/store/player/inventory'

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
 * attack): about 9.5 min without the bosses' mechanics, so the clear depends on handling them. First pass; tune with
 * the mechanics (batch 3). Arena enemies are never wave-scaled.
 */
export const ARENA = {
  entryFee: 1000,
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
