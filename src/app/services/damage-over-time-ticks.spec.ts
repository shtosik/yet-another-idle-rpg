import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleManagerService } from './battle-manager.service'
import { BattleStore } from '../store/battle/battle.store'
import { SpellID } from '../../enums/ids/spell-id.enum'

describe('BattleManagerService damage over time', () => {
  let service: BattleManagerService
  let battleStore: InstanceType<typeof BattleStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    service = TestBed.inject(BattleManagerService)
    battleStore = TestBed.inject(BattleStore)
    battleStore.startBattle(0)
    battleStore.addDamageOverTime(SpellID.thunderstorm)
  })

  afterEach(() => localStorage.clear())

  it('stops the clock at the hit that kills, so the rest waits for the next enemy', () => {
    battleStore.updateEnemyHp(1)

    // One long tick that would cover four hits: the first one kills.
    service.tickDamageOverTime(9000)

    expect(battleStore.isInCombat()).toBeFalse()
    expect(battleStore.activeDamageOverTime()).toEqual([{ spellId: SpellID.thunderstorm, msElapsed: 2000, hits: 1 }])
  })

  it('does not run while no enemy is alive', () => {
    battleStore.updateEnemyHp(1)
    service.tickDamageOverTime(2000)
    expect(battleStore.isInCombat()).toBeFalse()

    service.tickDamageOverTime(5000)
    expect(battleStore.activeDamageOverTime()).toEqual([{ spellId: SpellID.thunderstorm, msElapsed: 2000, hits: 1 }])
  })
})
