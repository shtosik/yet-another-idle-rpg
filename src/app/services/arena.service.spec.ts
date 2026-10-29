import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ArenaService } from './arena.service'
import { BattleManagerService } from './battle-manager.service'
import { ModalService } from './modal.service'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { ARENA } from '../../data/arena-data'
import ENEMIES_DATA from '../../data/enemies-data'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { OfflineProgressService } from './offline-progress.service'
import { OfflineStore } from '../store/offline/offline.store'

describe('ArenaService', () => {
  let arena: ArenaService
  let battleStore: InstanceType<typeof BattleStore>
  let playerStore: InstanceType<typeof PlayerStore>
  let openResult: jasmine.Spy

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    openResult = spyOn(TestBed.inject(ModalService), 'openArenaResult')
    arena = TestBed.inject(ArenaService)
    battleStore = TestBed.inject(BattleStore)
    playerStore = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  /** Kills the arena's current wave enemies until the run ends or `kills` run out. */
  const killThrough = (kills: number, now = 1000) => {
    for (let i = 0; i < kills && arena.run(); i++) {
      const wave = ARENA.waves[arena.run()!.wave - 1]
      arena.onKill(ENEMIES_DATA[wave.enemies[0]], now)
    }
  }
  const totalKills = ARENA.waves.reduce((sum, wave) => sum + wave.count, 0)
  const countOf = (id: ItemID) => playerStore.itemCount(id)

  it('a run holds the fight: zone and wave moves are blocked', () => {
    arena.enter(0)
    battleStore.setZone(ZoneID.plains)
    battleStore.changeWave(true)

    expect(battleStore.currentZoneId()).toBe(ZoneID.horseshoeBeach)
    expect(battleStore.currentWave()).toBe(1)
    expect(arena.run()?.endsAt).toBe(ARENA.timeLimitMs)
  })

  it('a clear pays the cape, and the books on the first clear only', () => {
    arena.enter(0)
    killThrough(totalKills)
    expect(arena.run()).toBeNull()
    expect(battleStore.arenaClears()).toBe(1)
    expect(battleStore.arenaBestTimeMs()).toBe(1000)
    expect(openResult).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'cleared', isBestTime: true }))

    expect(arena.claimRewards()).toBeTrue()
    expect(countOf(ItemID.moltenCape)).toBe(1)
    expect(countOf(ItemID.skillPointBook)).toBe(2)

    arena.enter(0)
    killThrough(totalKills)
    arena.claimRewards()
    expect(countOf(ItemID.moltenCape)).toBe(2)
    expect(countOf(ItemID.skillPointBook)).toBe(2)
  })

  it('time running out ends the run with no rewards waiting', () => {
    arena.enter(0)
    killThrough(4)
    arena.tick(ARENA.timeLimitMs)

    expect(arena.run()).toBeNull()
    expect(battleStore.arenaRewards()).toEqual([])
    expect(battleStore.arenaClears()).toBe(0)
    expect(openResult).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'timeout', kills: 4, timeMs: ARENA.timeLimitMs }))
  })

  it('an arena kill pays XP and gold but no zone progress', () => {
    arena.enter(0)
    battleStore.startBattle(0)
    battleStore.updateEnemyHp(1)
    const goldBefore = playerStore.stats().goldCoins

    TestBed.inject(BattleManagerService).doDamage()

    expect(arena.run()?.kills).toBe(1)
    expect(playerStore.stats().goldCoins).toBeGreaterThan(goldBefore)
    expect(playerStore.zonesProgression()).toEqual({})
  })

  it('a run that ran out while away ends at its end time; the rest is claimed in the zone', async () => {
    const away = 60 * 60 * 1000
    spyOn(window, 'fetch').and.resolveTo(new Response(null, { headers: { Date: new Date(away).toUTCString() } }))
    const welcomeBack = spyOn(TestBed.inject(ModalService), 'openWelcomeBack')
    TestBed.inject(OfflineStore).setLastSeen(0)
    arena.enter(0)

    const claiming = TestBed.inject(OfflineProgressService).claim()
    // The game loop's first tick ends the run before the server time arrives.
    arena.tick(away)
    await claiming

    expect(arena.run()).toBeNull()
    expect(openResult).toHaveBeenCalledWith(jasmine.objectContaining({ outcome: 'timeout', timeMs: ARENA.timeLimitMs }))
    expect(welcomeBack).toHaveBeenCalledWith(jasmine.objectContaining({ elapsedMs: away - ARENA.timeLimitMs }))
    expect(playerStore.zonesProgression()[ZoneID.horseshoeBeach]).toBeDefined()
  })
})
