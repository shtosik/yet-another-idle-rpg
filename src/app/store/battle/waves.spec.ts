import ZONES_DATA from '../../../data/zones-data'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { nextWave, previousWave, requiredKills, rollSpawn } from './waves'

describe('waves', () => {
  const beach = ZONES_DATA[ZoneID.horseshoeBeach]
  const plains = ZONES_DATA[ZoneID.plains]
  const unlocked = () => true
  const locked = () => false

  it('needs enemiesPerWave kills on a regular wave and one on the boss wave', () => {
    expect(requiredKills(beach, 1)).toBe(beach.enemiesPerWave)
    expect(requiredKills(beach, beach.maxWave)).toBe(1)
  })

  it('moves forward only after enough kills on a regular wave', () => {
    expect(nextWave(beach, 1, beach.enemiesPerWave - 1, unlocked)).toBeNull()
    expect(nextWave(beach, 1, beach.enemiesPerWave, unlocked)).toEqual({ zoneId: ZoneID.horseshoeBeach, wave: 2 })
  })

  it('leaves the boss wave only into an unlocked next zone', () => {
    expect(nextWave(beach, beach.maxWave, 1, locked)).toBeNull()
    expect(nextWave(beach, beach.maxWave, 0, unlocked)).toEqual({ zoneId: beach.nextZoneId!, wave: 1 })
    const last = Object.values(ZONES_DATA).find(zone => zone.nextZoneId === undefined)!
    expect(nextWave(last, last.maxWave, 1, unlocked)).toBeNull()
  })

  it('moves back a wave, or into the previous zone from wave 1', () => {
    expect(previousWave(beach, 1)).toBeNull()
    expect(previousWave(beach, 3)).toEqual({ zoneId: ZoneID.horseshoeBeach, wave: 2 })
    expect(previousWave(plains, 1)).toEqual({ zoneId: plains.previousZoneId!, wave: ZONES_DATA[plains.previousZoneId!].maxWave })
  })

  it('spawns the boss on the last wave and a zone enemy otherwise, rolling shiny after the pick', () => {
    expect(rollSpawn(beach, beach.maxWave, 0, () => 0).enemy.id).toBe(beach.bossEnemyId)
    const spawn = rollSpawn(beach, 1, 100, () => 0)
    expect(beach.enemies).toContain(spawn.enemy.id)
    expect(spawn.isShiny).toBeTrue()
    expect(spawn.maxHp).toBe(spawn.enemy.maxHp)
    expect(rollSpawn(beach, 1, 0, () => 0).isShiny).toBeFalse()
  })
})
