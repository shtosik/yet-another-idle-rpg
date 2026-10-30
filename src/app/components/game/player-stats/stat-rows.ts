import { additivePercentStats, PlayerStat } from '../../../../types/player/player-stat.type'

/**
 * How a stat's value reads:
 * `number` as is · `seconds` already seconds · `ms` milliseconds shown as seconds · `minutes` milliseconds shown as minutes ·
 * `multiplier` ×1.2 · `percent` already a percent (5 = 5%) · `fraction` 0.5 = 50% · `bonus` 0.2 = +20% ·
 * `mana` current / max with the regen countdown.
 */
export type StatFormat = 'number' | 'seconds' | 'ms' | 'minutes' | 'multiplier' | 'percent' | 'fraction' | 'bonus' | 'mana'

export interface StatRow {
  stat: PlayerStat
  format: StatFormat
  /** Shown even at its base value; other rows appear once something changes them, or with "Show all". */
  always?: boolean
  /** `app:statsPanel.descriptions.<key>`; defaults to the stat. Rows of one kind share a key. */
  description?: string
}

export interface StatGroup {
  /** `app:statsPanel.groups.<key>` */
  key: string
  rows: StatRow[]
}

/** The stats panel, top to bottom. A new stat is one row here. */
export const STAT_GROUPS: StatGroup[] = [
  {
    key: 'combat',
    rows: [
      { stat: 'attackPower', format: 'number', always: true },
      { stat: 'attackSpeed', format: 'seconds', always: true },
      { stat: 'critChance', format: 'percent', always: true },
      { stat: 'critMulti', format: 'multiplier', always: true },
      { stat: 'meleeDamageMultiplier', format: 'multiplier' },
      { stat: 'magicDamage', format: 'number' },
      { stat: 'magicDamageMultiplier', format: 'multiplier' },
    ],
  },
  {
    key: 'magic',
    rows: [
      { stat: 'maxMana', format: 'mana', always: true },
      { stat: 'manaRegenRate', format: 'ms', always: true },
      { stat: 'spellCooldownReduction', format: 'seconds' },
      { stat: 'increasedSpellDuration', format: 'seconds' },
    ],
  },
  {
    key: 'progress',
    rows: [
      { stat: 'xpMultiplier', format: 'multiplier', always: true },
      { stat: 'goldCoinsMultiplier', format: 'multiplier', always: true },
      { stat: 'offlineProgressRate', format: 'fraction', always: true },
      { stat: 'shinyChance', format: 'percent' },
      { stat: 'inventorySlots', format: 'number' },
      { stat: 'maxTaskSlots', format: 'number' },
      { stat: 'taskDoubleKillChance', format: 'percent' },
      { stat: 'shopRefreshCooldown', format: 'minutes' },
    ],
  },
  {
    key: 'weaknesses',
    rows: [
      { stat: 'extraPhysicalDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraFireDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraWaterDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraAirDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraEarthDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraLightDamageMultiplier', format: 'multiplier', description: 'weakness' },
      { stat: 'extraDarkDamageMultiplier', format: 'multiplier', description: 'weakness' },
    ],
  },
  {
    key: 'vsEnemies',
    rows: additivePercentStats.map(stat => ({ stat, format: 'bonus' as const, description: 'damageVs' })),
  },
]

/** `value` in the row's unit, without a sign. */
export function formatStat(format: StatFormat, value: number): string {
  switch (format) {
    case 'seconds':
      return `${trim(value)}s`
    case 'ms':
      return `${trim(value / 1000)}s`
    case 'minutes':
      return `${trim(value / 60000)} min`
    case 'multiplier':
      return `×${trim(value)}`
    case 'percent':
      return `${trim(value)}%`
    case 'fraction':
    case 'bonus':
      return `${trim(value * 100)}%`
    case 'number':
    case 'mana':
      return trim(value)
  }
}

/** Up to two decimals, no trailing zeros (2.50 -> 2.5, 3.00 -> 3). */
const trim = (value: number): string => String(Math.round(value * 100) / 100)
