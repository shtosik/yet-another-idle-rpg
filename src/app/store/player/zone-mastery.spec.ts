import { masteryModifiers, zoneStarProgress, ZoneMasteryState } from './zone-mastery'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'

const state = (overrides: Partial<ZoneMasteryState> = {}): ZoneMasteryState => ({
  enemyKillCounts: {},
  shinyKillsByZone: {},
  claimedZoneStars: {},
  ...overrides,
})

const progress = (s: ZoneMasteryState) =>
  Object.fromEntries(zoneStarProgress(ZoneID.horseshoeBeach, s).map(p => [p.star, p]))

describe('zoneStarProgress', () => {
  it('starts with nothing done', () => {
    const p = progress(state())
    expect(p['conqueror'].done).toBeFalse()
    expect(p['hunter'].target).toBe(4)
    expect(p['shiny'].done).toBeFalse()
  })

  it('completes conqueror at 10 boss kills and hunter when every enemy has a bestiary star', () => {
    const p = progress(state({
      enemyKillCounts: {
        [EnemyID.crab]: 100, [EnemyID.seagull]: 100, [EnemyID.turtle]: 100, [EnemyID.gangsterCrab]: 10,
      },
    }))
    expect(p['conqueror'].done).toBeTrue()
    expect(p['hunter'].current).toBe(4)
    expect(p['hunter'].done).toBeTrue()
  })

  it('counts shiny kills in the zone and caps the shown count at the target', () => {
    const p = progress(state({ shinyKillsByZone: { [ZoneID.horseshoeBeach]: 12 }, claimedZoneStars: { [ZoneID.horseshoeBeach]: ['shiny'] } }))
    expect(p['shiny'].current).toBe(10)
    expect(p['shiny'].done).toBeTrue()
    expect(p['shiny'].claimed).toBeTrue()
  })
})

describe('masteryModifiers', () => {
  it('gives 2% gold per zone with all three stars claimed', () => {
    expect(masteryModifiers({
      [ZoneID.horseshoeBeach]: ['conqueror', 'hunter', 'shiny'],
      [ZoneID.plains]: ['conqueror', 'hunter', 'shiny'],
      [ZoneID.theLongPath]: ['conqueror'],
    })).toEqual([{ stat: 'goldCoinsMultiplier', amount: 0.04 }])
    expect(masteryModifiers({})).toEqual([])
  })
})
