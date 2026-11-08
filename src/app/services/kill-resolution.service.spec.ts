import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { KillResolutionService } from './kill-resolution.service'
import { ModalService } from './modal.service'
import { seededRng } from './offline-simulation'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { tabOf } from '../store/player/inventory'
import { Kill } from '../store/player/kill-rewards'
import ZONES_DATA from '../../data/zones-data'
import ENEMIES_DATA from '../../data/enemies-data'
import { ZONE_UNLOCK_NOTIFICATIONS } from '../../data/unlock-conditions'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'

interface Case {
  name: string
  zoneId: ZoneID
  wave: number
  kills: { enemyId: EnemyID, isShiny?: boolean }[]
  /** State set before the kills, the same in both runs. */
  setup?: (player: InstanceType<typeof PlayerStore>, quests: InstanceType<typeof QuestsStore>) => void
}

const beach = ZONES_DATA[ZoneID.horseshoeBeach]
const wilds = ZONES_DATA[ZoneID.elderwoodWilds]
const times = (n: number, kill: Case['kills'][number]) => Array.from({ length: n }, () => kill)

const CASES: Case[] = [
  { name: 'plain kills', zoneId: beach.id, wave: 1, kills: [...times(3, { enemyId: beach.enemies[0] }), ...times(3, { enemyId: beach.enemies[1] })] },
  { name: 'shiny kills', zoneId: beach.id, wave: 2, kills: times(4, { enemyId: EnemyID.gangsterCrab, isShiny: true }) },
  {
    name: 'task progress with Bounty Mark double kills',
    zoneId: beach.id, wave: 1, kills: times(8, { enemyId: EnemyID.crab }),
    setup: player => player.acceptTask({ id: 't', monsterId: EnemyID.crab, targetCount: 50, currentCount: 0, rewardTokens: 1, zoneId: beach.id }),
  },
  {
    name: 'a quest-capped drop',
    zoneId: wilds.id, wave: 1, kills: times(8, { enemyId: EnemyID.corruptedSapling }),
    setup: (_, quests) => quests.startQuest(QuestID.signsOfRot),
  },
  {
    name: 'a full inventory',
    zoneId: beach.id, wave: 2, kills: times(6, { enemyId: EnemyID.gangsterCrab, isShiny: true }),
    setup: player => {
      // Every tab full of items the crab never drops, so nothing it drops can stack.
      const crab = ENEMIES_DATA[EnemyID.gangsterCrab]
      const dropped = new Set([...crab.drops, ...(crab.shinyDrops ?? [])].map(drop => drop.id))
      const ids = (Object.values(ItemID).filter(v => typeof v === 'number') as ItemID[]).filter(id => !dropped.has(id))
      const capacity = player.inventoryCapacity()
      for (const tab of Object.keys(capacity) as (keyof typeof capacity)[]) {
        player.addItems(ids.filter(id => tabOf(id) === tab).slice(0, capacity[tab]).map(id => ({ id, amount: 1 })))
      }
    },
  },
  { name: 'a boss kill', zoneId: beach.id, wave: beach.maxWave, kills: times(2, { enemyId: beach.bossEnemyId }) },
]

describe('Kill resolution', () => {
  afterEach(() => localStorage.clear())

  /** A fresh game, then the kills resolved one by one (online) or as one batch (offline claim), with one seed. */
  const run = (testCase: Case, mode: 'oneByOne' | 'batch') => {
    localStorage.clear()
    TestBed.resetTestingModule()
    const modal = jasmine.createSpyObj<ModalService>('ModalService', ['openUnlockNotification', 'openQuestCompleted', 'openStationInstalled'])
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: ModalService, useValue: modal }] })
    const player = TestBed.inject(PlayerStore)
    const quests = TestBed.inject(QuestsStore)
    testCase.setup?.(player, quests)
    const resolver = TestBed.inject(KillResolutionService)

    // Bounty Mark at 50% so both task counts show up.
    const kills: Kill[] = testCase.kills.map(({ enemyId, isShiny = false }) =>
      ({ enemyId, isShiny, stats: { ...player.stats(), taskDoubleKillChance: 50 } }))
    const rng = seededRng(7)
    let lostDrops = 0
    if (mode === 'batch') lostDrops = resolver.resolveKills(testCase.zoneId, testCase.wave, kills, rng).lostDrops
    else kills.forEach(kill => lostDrops += resolver.resolveKills(testCase.zoneId, testCase.wave, [kill], rng).lostDrops)

    return {
      resources: player.resources(),
      enemyKillCounts: player.enemyKillCounts(),
      zonesProgression: player.zonesProgression(),
      shinyKillsByZone: player.shinyKillsByZone(),
      activeTasks: player.activeTasks(),
      seeds: player.farm().seeds,
      stations: player.stations(),
      inventory: player.inventory(),
      unlockedZones: Object.values(ZoneID).filter(id => typeof id === 'number' && player.isZoneUnlocked(id as ZoneID)),
      lostDrops,
      notices: modal.openUnlockNotification.calls.allArgs(),
    }
  }

  CASES.forEach(testCase => {
    it(`gives the same state one by one and as a batch: ${testCase.name}`, () => {
      expect(run(testCase, 'batch')).toEqual(run(testCase, 'oneByOne'))
    })
  })

  it('makes the cases meaningful: double task counts, a quest cap, lost drops', () => {
    const task = run(CASES[2], 'batch').activeTasks[0]
    expect(task.currentCount).toBeGreaterThan(8)

    const capped = Object.values(run(CASES[3], 'batch').inventory).flat().find(slot => slot?.id === ItemID.corruptedResin)
    expect(capped?.amount).toBe(3)

    expect(run(CASES[4], 'batch').lostDrops).toBeGreaterThan(0)
  })

  it('opens the next zone on a boss kill, with its notice once', () => {
    const { unlockedZones, notices } = run(CASES[5], 'batch')
    expect(unlockedZones).toContain(beach.nextZoneId!)
    const notice = ZONE_UNLOCK_NOTIFICATIONS[beach.nextZoneId!]
    expect(notices).toEqual(notice ? [[notice]] : [])
  })
})
