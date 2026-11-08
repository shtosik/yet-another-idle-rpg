import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleManagerService } from './battle-manager.service'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { emptyKillBatch } from '../store/player/kill-rewards'
import ZONES_DATA from '../../data/zones-data'
import { ZoneID } from '../../enums/ids/zone-id.enum'

describe('BattleManagerService wave moves', () => {
  let manager: BattleManagerService
  let battle: InstanceType<typeof BattleStore>
  let player: InstanceType<typeof PlayerStore>
  const beach = ZONES_DATA[ZoneID.horseshoeBeach]

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    manager = TestBed.inject(BattleManagerService)
    battle = TestBed.inject(BattleStore)
    player = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('moves forward only once the wave is cleared', () => {
    manager.changeWave(true)
    expect(battle.currentWave()).toBe(1)

    player.applyKillBatch({ ...emptyKillBatch(ZoneID.horseshoeBeach, 1), kills: beach.enemiesPerWave })
    manager.changeWave(true)
    expect(battle.currentWave()).toBe(2)
  })

  it('never enters a locked next zone from the boss wave', () => {
    battle.goToWave({ zoneId: ZoneID.horseshoeBeach, wave: beach.maxWave })
    manager.changeWave(true)
    expect(battle.currentZoneId()).toBe(ZoneID.horseshoeBeach)

    player.unlockZone(beach.nextZoneId!)
    manager.changeWave(true)
    expect(battle.currentZoneId()).toBe(beach.nextZoneId!)
    expect(battle.currentWave()).toBe(1)
  })
})
