import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ZONES_BY_ENEMY } from './enemy-zones'

describe('ZONES_BY_ENEMY', () => {
  it('lists a shared enemy in every zone, in ZONES_DATA order', () => {
    // Quest kill rows link to the first unlocked zone, so the Pass must come before the Cleft.
    expect(ZONES_BY_ENEMY[EnemyID.goat]).toEqual([ZoneID.mountainPass, ZoneID.goatCleft])
  })

  it('lists a boss under its zone', () => {
    expect(ZONES_BY_ENEMY[EnemyID.goblinPackrat]).toEqual([ZoneID.goatCleft])
  })
})
