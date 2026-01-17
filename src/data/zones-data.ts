import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Zone } from 'interfaces/zone.interface'

const ZONES_DATA: Record<ZoneID, Zone> = {
  [ZoneID.horseshoeBeach]: {
    id: ZoneID.horseshoeBeach,
    url: './assets/img/backgrounds/horseshoeBeach-vertical.png',
    enemies: [EnemyID.crab, EnemyID.seagull, EnemyID.turtle],
    maxWave: 10,
    enemiesPerWave: 10,
    bossEnemyId: EnemyID.gangsterCrab,
    nextZoneId: ZoneID.plains,
  },
  [ZoneID.tradersBasement]: {
    id: ZoneID.tradersBasement,
    url: './assets/img/backgrounds/tradersBasement.png',
    enemies: [EnemyID.rat],
    maxWave: 6,
    enemiesPerWave: 10,
    bossEnemyId: EnemyID.giantRat,
  },
  [ZoneID.plains]: {
    id: ZoneID.plains,
    url: './assets/img/backgrounds/plains-vertical.png',
    enemies: [EnemyID.blueSlime, EnemyID.redSlime, EnemyID.greenSlime],
    maxWave: 10,
    enemiesPerWave: 10,
    bossEnemyId: EnemyID.kingSlime,
    previousZoneId: ZoneID.horseshoeBeach,
    nextZoneId: ZoneID.theLongPath,
  },
  [ZoneID.theLongPath]: {
    id: ZoneID.theLongPath,
    url: './assets/img/backgrounds/the-long-path-vertical.png',
    enemies: [EnemyID.bandit, EnemyID.deer, EnemyID.wolf, EnemyID.goblinScout],
    maxWave: 20,
    enemiesPerWave: 8,
    bossEnemyId: EnemyID.troll,
    previousZoneId: ZoneID.plains,
  },
}

export default ZONES_DATA
