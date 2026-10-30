import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ArenaBossesService } from './arena-bosses.service'
import { BattleStore } from '../store/battle/battle.store'
import { ARENA, ARENA_BOSSES } from '../../data/arena-data'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { DamageElement } from '../../enums/damage-element.enum'

describe('ArenaBossesService', () => {
  let bosses: ArenaBossesService
  let battleStore: InstanceType<typeof BattleStore>
  const rng = () => 0

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    bosses = TestBed.inject(ArenaBossesService)
    battleStore = TestBed.inject(BattleStore)
  })

  afterEach(() => localStorage.clear())

  /** A run at the champion's wave with the champion spawned and its fight started at t = 0. */
  const fightChampion = (enemyId: EnemyID) => {
    battleStore.startArenaRun(0)
    const wave = ARENA.waves.findIndex(w => w.enemies[0] === enemyId) + 1
    const killsBefore = ARENA.waves.slice(0, wave - 1).reduce((sum, w) => sum + w.count, 0)
    for (let i = 0; i < killsBefore; i++) battleStore.recordArenaKill(0, 0)
    battleStore.startBattle(0)
    expect(battleStore.enemyId()).toBe(enemyId)
    bosses.tick(0, rng)
  }

  it('Brute: hitting the weak point raises damage for a while', () => {
    fightChampion(EnemyID.arenaBrute)
    bosses.tick(ARENA_BOSSES.brute.firstAfterMs, rng)
    expect(bosses.weakPoint()).not.toBeNull()

    bosses.hitWeakPoint()
    expect(bosses.modifyHit(100, DamageElement.physical, false)).toBe(150)

    bosses.tick(ARENA_BOSSES.brute.firstAfterMs + ARENA_BOSSES.brute.bonusMs, rng)
    expect(bosses.modifyHit(100, DamageElement.physical, false)).toBe(100)
  })

  it('Arcanist: magic hits take run time, capped per hit and per fight', () => {
    fightChampion(EnemyID.arenaArcanist)
    const endsAt = battleStore.arenaRun()!.endsAt

    bosses.modifyHit(10, DamageElement.fire, true)
    expect(battleStore.arenaRun()!.endsAt).toBe(endsAt - 2000)
    bosses.modifyHit(10, DamageElement.physical, false)
    expect(battleStore.arenaRun()!.endsAt).toBe(endsAt - 2000)

    for (let i = 0; i < 20; i++) bosses.modifyHit(1000, DamageElement.fire, true)
    expect(battleStore.arenaRun()!.endsAt).toBe(endsAt - ARENA_BOSSES.arcanist.maxPerFightMs)
  })

  it('Burrower: hidden while burrowed; a wrong pick heals it, the right one stuns it', () => {
    fightChampion(EnemyID.arenaBurrower)
    battleStore.updateEnemyHp(100)
    const { everyMs } = ARENA_BOSSES.burrower

    bosses.tick(everyMs, rng)
    expect(bosses.isHidden()).toBeTrue()
    bosses.pickMound(bosses.burrow()!.correct + 1)
    expect(bosses.isHidden()).toBeFalse()
    expect(battleStore.currentEnemyHp()).toBe(100 + Math.round(battleStore.enemy()!.maxHp * ARENA_BOSSES.burrower.healFraction))

    bosses.tick(everyMs * 2, rng)
    bosses.pickMound(bosses.burrow()!.correct)
    expect(bosses.isStunned()).toBeTrue()
    expect(bosses.modifyHit(100, DamageElement.physical, false)).toBe(150)
  })

  it("Yad: only the shield's element hurts, and its first hit breaks it", () => {
    fightChampion(EnemyID.arenaYad)
    bosses.tick(ARENA_BOSSES.yad.maxGapMs, rng)
    const shield = bosses.shield()!
    const other = ARENA_BOSSES.yad.elements.find(element => element !== shield)!

    expect(bosses.modifyHit(500, other, false)).toBe(0)
    expect(bosses.shield()).toBe(shield)

    expect(bosses.modifyHit(5, shield, false)).toBe(5)
    expect(bosses.shield()).toBeNull()
    expect(bosses.modifyHit(500, other, false)).toBe(500)
  })
})
