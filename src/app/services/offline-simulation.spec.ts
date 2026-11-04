import { OfflineSimulationInput, seededRng, simulateOfflineKills, theoreticalKillMs } from './offline-simulation'
import { deriveStats, initialResources } from '../store/player/stats'
import ZONES_DATA from '../../data/zones-data'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { DamageElement } from '../../enums/damage-element.enum'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import ITEM_DATA from '../../data/items-data'
import { ItemType } from '../../enums/items/item-type.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'

const HOUR_IN_MS = 60 * 60 * 1000

describe('simulateOfflineKills', () => {
  const stats = deriveStats(initialResources(), [])
  const input = (overrides: Partial<OfflineSimulationInput> = {}): OfflineSimulationInput => ({
    zone: ZONES_DATA[ZoneID.horseshoeBeach],
    wave: 1,
    segments: [{ durationMs: HOUR_IN_MS, stats }],
    damageType: DamageElement.physical,
    isMeleeWeapon: true,
    hasWeaknessSkill: false,
    questDropLimits: new Map(),
    taskEnemyIds: new Set(),
    enemyKillCounts: {},
    rollingKillMs: null,
    rng: seededRng(42),
    ...overrides,
  })

  it('applies the melee damage multiplier to melee weapons only', () => {
    const boosted = { ...stats, meleeDamageMultiplier: 2 }
    const kills = (isMeleeWeapon: boolean, s = stats) =>
      simulateOfflineKills(input({ isMeleeWeapon, segments: [{ durationMs: HOUR_IN_MS, stats: s }] })).kills

    expect(kills(false, boosted)).toBe(kills(false))
    expect(kills(true, boosted)).toBeGreaterThan(kills(true))
  })

  it('replays the same result for the same seed', () => {
    expect(simulateOfflineKills(input())).toEqual(simulateOfflineKills(input()))
  })

  it('uses the seeded RNG for +1 gear drops after registration, leaving unique gear and pets at +0', () => {
    const strong = { ...stats, attackPower: 100_000, upgradedDropChance: 10 }
    const run = (upgradedDropChance: number) => simulateOfflineKills(input({
      wave: ZONES_DATA[ZoneID.horseshoeBeach].maxWave,
      segments: [{ durationMs: HOUR_IN_MS, stats: { ...strong, upgradedDropChance } }],
    }))
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

    const { kills } = simulateOfflineKills(input())

    expect(kills).toBeGreaterThan(expected * 0.9)
    expect(kills).toBeLessThan(expected * 1.1)
  })

  it('is capped by a slower rolling online kill rate', () => {
    const killMs = theoreticalKillMs(stats, input())
    const normal = simulateOfflineKills(input()).kills
    const slowed = simulateOfflineKills(input({ rollingKillMs: killMs * 2 })).kills

    expect(slowed).toBeLessThan(normal * 0.6)
  })

  it('ignores a faster rolling rate', () => {
    const killMs = theoreticalKillMs(stats, input())
    expect(simulateOfflineKills(input({ rollingKillMs: killMs / 2 })).kills).toBe(simulateOfflineKills(input()).kills)
  })

  it('kills nothing at a zero rate', () => {
    const noRate = { ...stats, offlineProgressRate: 0 }
    expect(simulateOfflineKills(input({ segments: [{ durationMs: HOUR_IN_MS, stats: noRate }] })).kills).toBe(0)
  })

  it('skips a zero-rate segment and keeps killing in the next one', () => {
    const noRate = { ...stats, offlineProgressRate: 0 }
    const half = HOUR_IN_MS / 2
    const { kills } = simulateOfflineKills(input({ segments: [{ durationMs: half, stats: noRate }, { durationMs: half, stats }] }))
    const killMs = theoreticalKillMs(stats, input()) / stats.offlineProgressRate

    expect(kills).toBeGreaterThan((half / killMs) * 0.9)
    expect(kills).toBeLessThan((half / killMs) * 1.1)
  })

  it('rolls drops with the bestiary rank bonus', () => {
    // Every roll is 0.74: wave 1 spawns the turtle (index 2 of 3), and its 1-in-4 stick roll
    // (0.74 × 4 = 2.96) misses at rank 0 (hit above 3) but hits at rank 3 (hit above 2.85).
    const constantRoll = () => 0.74
    const sticks = (enemyKillCounts: OfflineSimulationInput['enemyKillCounts']) =>
      simulateOfflineKills(input({ rng: constantRoll, enemyKillCounts })).items.filter(item => item.id === ItemID.stick).length

    expect(sticks({})).toBe(0)
    expect(sticks({ [EnemyID.turtle]: 10_000 })).toBe(1)
  })

  it('sums XP and gold per kill', () => {
    const result = simulateOfflineKills(input())
    const killsCounted = Object.values(result.killsByEnemy).reduce((sum, n) => sum + (n ?? 0), 0)

    expect(killsCounted).toBe(result.kills)
    expect(result.experience).toBeGreaterThan(0)
  })
})
