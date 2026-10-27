import { EnemyID } from '../enums/ids/enemy-id.enum'
import { ItemID } from '../enums/ids/item-id.enum'
import { ItemStack } from '../app/store/player/inventory'

export interface ArenaWave {
  /** Each kill picks one at random. */
  enemies: EnemyID[]
  /** Kills that clear the wave. */
  count: number
}

const early = [EnemyID.deer, EnemyID.wolf, EnemyID.goblinScout]
const middle = [EnemyID.goat, EnemyID.mountainBat, EnemyID.goblinScavenger]
const late = [EnemyID.mountainBat, EnemyID.goblinScavenger, EnemyID.forestSpider, EnemyID.corruptedSapling]
const final = [EnemyID.forestSpider, EnemyID.corruptedSapling]
const regular = (enemies: EnemyID[]): ArenaWave => ({ enemies, count: 3 })
const boss = (enemyId: EnemyID): ArenaWave => ({ enemies: [enemyId], count: 1 })

/**
 * The Combat Arena in North Lirold: fixed waves against one clock (docs/systems/arena.md).
 * Sized for a player just past the Mountain Pass boss (~30 Attack Power, 3 s per attack) who handles the bosses'
 * mechanics; arena enemies are never wave-scaled.
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
  url: './assets/img/backgrounds/northLiroldArena.png',
}
