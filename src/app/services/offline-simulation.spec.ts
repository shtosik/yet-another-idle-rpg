import { OfflineSimulationInput, seededRng, simulateOfflineKills, theoreticalKillMs } from './offline-simulation'
import { deriveStats, initialResources } from '../store/player/stats'
import ZONES_DATA from '../../data/zones-data'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { DamageElement } from '../../enums/damage-element.enum'
import ENEMIES_DATA from '../../data/enemies-data'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import ITEM_DATA from '../../data/items-data'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'
import { KillContext, rollKills } from '../store/player/kill-rewards'

const HOUR_IN_MS = 60 * 60 * 1000

describe('simulateOfflineKills', () => {
  const stats = deriveStats(initialResources(), [])
  const input = (overrides: Partial<OfflineSimulationInput> = {}): OfflineSimulationInput => ({
    zone: ZONES_DATA[ZoneID.horseshoeBeach],
    wave: 1,
    segments: [{ durationMs: HOUR_IN_MS, stats }],
    damageType: DamageElement.physical,
    isMeleeWeapon: true,
    isRangedWeapon: false,
    hasWeaknessSkill: false,
    rollingKillMs: null,
    rng: seededRng(42),
    ...overrides,
  })
  /** Simulates, then pays the kills with the same rng, as an offline claim does. */
  const paid = (overrides: Partial<OfflineSimulationInput> = {}, ctx: Partial<KillContext> = {}) => {
    const sim = input(overrides)
    return rollKills(sim.zone, sim.wave, simulateOfflineKills(sim).kills, { enemyKillCounts: {}, taskEnemyIds: new Set(), ...ctx }, sim.rng)
  }

  it('applies the melee damage multiplier to melee weapons only', () => {
    const boosted = { ...stats, meleeDamageMultiplier: 2 }
    const kills = (isMeleeWeapon: boolean, s = stats) =>
      simulateOfflineKills(input({ isMeleeWeapon, segments: [{ durationMs: HOUR_IN_MS, stats: s }] })).kills.length

    expect(kills(false, boosted)).toBe(kills(false))
    expect(kills(true, boosted)).toBeGreaterThan(kills(true))
  })

  it("applies the ranged damage multiplier to ranged weapons only", () => {
    const boosted = { ...stats, rangedDamageMultiplier: 2 }
    const kills = (isRangedWeapon: boolean, s = stats) =>
      simulateOfflineKills(input({ isMeleeWeapon: false, isRangedWeapon, segments: [{ durationMs: HOUR_IN_MS, stats: s }] })).kills.length

    expect(kills(false, boosted)).toBe(kills(false))
    expect(kills(true, boosted)).toBeGreaterThan(kills(true))
  })

  it('replays the same result for the same seed', () => {
    expect(simulateOfflineKills(input())).toEqual(simulateOfflineKills(input()))
  })

  it('uses the seeded RNG for +1 gear drops after registration, leaving unique gear and pets at +0', () => {
    const strong = { ...stats, attackPower: 100_000, upgradedDropChance: 10 }
    const run = (upgradedDropChance: number) => paid({
      wave: ZONES_DATA[ZoneID.horseshoeBeach].maxWave,
      segments: [{ durationMs: HOUR_IN_MS, stats: { ...strong, upgradedDropChance } }],
    })
    spyOn(Math, 'random').and.throwError('Offline rolls must use the seeded RNG')
    const registered = run(10)
    expect(registered).toEqual(run(10))
    expect(registered.items.some(item => item.id === ItemID.knife && item.upgradeLevel === 1)).toBeTrue()
    expect(registered.items.some(item => item.id === ItemID.knife && !item.upgradeLevel)).toBeTrue()
    expect(registered.items.filter(item => item.upgradeLevel === 1).every(item => {
      const data = ITEM_DATA[item.id]
      return data.type === ItemType.equipment && data.slot !== EquipmentSlot.pet && !data.unique
    })).toBeTrue()
    expect(run(0).items.every(item => !item.upgradeLevel)).toBeTrue()
  })

  it('kills at offlineProgressRate times the theoretical rate', () => {
    const killMs = theoreticalKillMs(stats, input())
    const expected = HOUR_IN_MS / (killMs / stats.offlineProgressRate)

    const kills = simulateOfflineKills(input()).kills.length

    expect(kills).toBeGreaterThan(expected * 0.9)
    expect(kills).toBeLessThan(expected * 1.1)
  })

  it('is capped by a slower rolling online kill rate', () => {
    const killMs = theoreticalKillMs(stats, input())
    const normal = simulateOfflineKills(input()).kills.length
    const slowed = simulateOfflineKills(input({ rollingKillMs: killMs * 2 })).kills.length

    expect(slowed).toBeLessThan(normal * 0.6)
  })

  it('ignores a faster rolling rate', () => {
    const killMs = theoreticalKillMs(stats, input())
    expect(simulateOfflineKills(input({ rollingKillMs: killMs / 2 })).kills.length).toBe(simulateOfflineKills(input()).kills.length)
  })

  it('kills nothing at a zero rate', () => {
    const noRate = { ...stats, offlineProgressRate: 0 }
    expect(simulateOfflineKills(input({ segments: [{ durationMs: HOUR_IN_MS, stats: noRate }] })).kills.length).toBe(0)
  })

  it('skips a zero-rate segment and keeps killing in the next one', () => {
    const noRate = { ...stats, offlineProgressRate: 0 }
    const half = HOUR_IN_MS / 2
    const kills = simulateOfflineKills(input({ segments: [{ durationMs: half, stats: noRate }, { durationMs: half, stats }] })).kills.length
    const killMs = theoreticalKillMs(stats, input()) / stats.offlineProgressRate

    expect(kills).toBeGreaterThan((half / killMs) * 0.9)
    expect(kills).toBeLessThan((half / killMs) * 1.1)
  })

  it('rolls drops with the bestiary rank bonus', () => {
    // Every roll is 0.74: wave 1 spawns the turtle (index 2 of 3), and its 1-in-4 stick roll
    // (0.74 × 4 = 2.96) misses at rank 0 (hit above 3) but hits at rank 3 (hit above 2.85).
    const constantRoll = () => 0.74
    const sticks = (enemyKillCounts: KillContext['enemyKillCounts']) =>
      paid({ rng: constantRoll }, { enemyKillCounts }).items.filter(item => item.id === ItemID.stick).length

    expect(sticks({})).toBe(0)
    expect(sticks({ [EnemyID.turtle]: 10_000 })).toBe(1)
  })

  it('rolls seed drops with seedDropChance', () => {
    // As above, on a 1-in-4 seed drop: misses at no bonus (hit above 3), hits at +25% (above 2.75).
    const turtle = ENEMIES_DATA[EnemyID.turtle]
    const originalDrops = turtle.drops
    turtle.drops = [...originalDrops, { id: ItemID.turnipSeeds, minAmount: 1, maxAmount: 1, chance: 4 }]
    const seeds = (seedDropChance: number) => paid({
      rng: () => 0.74,
      segments: [{ durationMs: HOUR_IN_MS, stats: { ...stats, seedDropChance } }],
    }).items.filter(item => item.id === ItemID.turnipSeeds).length

    try {
      expect(seeds(0)).toBe(0)
      expect(seeds(0.25)).toBe(1)
    } finally {
      turtle.drops = originalDrops
    }
  })

  it('sums XP and gold per kill', () => {
    const result = paid()
    const killsCounted = Object.values(result.killsByEnemy).reduce((sum, n) => sum + (n ?? 0), 0)

    expect(killsCounted).toBe(result.kills)
    expect(result.experience).toBeGreaterThan(0)
  })
})
