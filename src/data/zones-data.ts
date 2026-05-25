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
    enemies: [EnemyID.deer, EnemyID.wolf, EnemyID.goblinScout],
    maxWave: 20,
    enemiesPerWave: 8,
    bossEnemyId: EnemyID.bandit,
    previousZoneId: ZoneID.plains,
    nextZoneId: ZoneID.mountainPass,
  },
  [ZoneID.mountainPass]: {
    id: ZoneID.mountainPass,
    url: './assets/img/backgrounds/mountain-pass.png',
    enemies: [EnemyID.goat, EnemyID.mountainBat, EnemyID.goblinScavenger],
    maxWave: 15,
    enemiesPerWave: 10,
    bossEnemyId: EnemyID.troll,
    previousZoneId: ZoneID.theLongPath,
    nextZoneId: ZoneID.elderwoodWilds,
  },
  [ZoneID.elderwoodWilds]: {
    id: ZoneID.elderwoodWilds,
    url: './assets/img/backgrounds/elderwood-wilds.png',
    enemies: [EnemyID.forestSpider, EnemyID.gnollScout, EnemyID.corruptedSapling, EnemyID.wolf],
    maxWave: 15,
    enemiesPerWave: 10,
    bossEnemyId: EnemyID.gnollWarchief,
    previousZoneId: ZoneID.mountainPass,
  },
  [ZoneID.deepwood]: {
    id: ZoneID.deepwood,
    url: './assets/img/backgrounds/the-deepwood.png',
    enemies: [EnemyID.elderSpider, EnemyID.forestBear, EnemyID.bogSkeleton, EnemyID.treantSprout],
    maxWave: 20,
    enemiesPerWave: 8,
    bossEnemyId: EnemyID.gnarledTreant,
  },
  [ZoneID.upperCanopy]: {
    id: ZoneID.upperCanopy,
    url: './assets/img/backgrounds/the-upper-canopy.png',
    enemies: [EnemyID.harpy, EnemyID.giantEagle, EnemyID.canopyBandit, EnemyID.seagull],
    maxWave: 15,
    enemiesPerWave: 8,
    bossEnemyId: EnemyID.harpyMatriarch,
  },
}

export default ZONES_DATA
