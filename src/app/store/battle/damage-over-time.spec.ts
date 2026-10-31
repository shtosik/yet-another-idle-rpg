import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleStore } from './battle.store'
import { SpellID } from '../../../enums/ids/spell-id.enum'

describe('BattleStore damage over time', () => {
  let store: InstanceType<typeof BattleStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    store = TestBed.inject(BattleStore)
  })

  afterEach(() => localStorage.clear())

  /** Advances like the game loop does (hit by hit) and counts the hits, without killing anything. */
  const runFor = (ms: number): number => {
    let hits = 0
    while (ms > 0) {
      const { spellId, usedMs } = store.advanceDamageOverTime(ms)
      ms -= usedMs
      if (spellId === null) break
      hits++
    }
    return hits
  }

  // Thunderstorm: a hit every 2 s for 10 s.
  it('hits once per interval and ends after its duration', () => {
    store.addDamageOverTime(SpellID.thunderstorm)

    expect(runFor(1900)).toBe(0)
    expect(runFor(100)).toBe(1)
    expect(runFor(5000)).toBe(2)
    expect(runFor(60000)).toBe(2)
    expect(store.activeDamageOverTime()).toEqual([])
  })

  it('stops at a hit, so time after a kill is not used up', () => {
    store.addDamageOverTime(SpellID.thunderstorm)

    // A long tick: only the time up to the first hit is used; the caller stops there if the hit kills.
    expect(store.advanceDamageOverTime(9000)).toEqual({ spellId: SpellID.thunderstorm, usedMs: 2000 })
    expect(store.activeDamageOverTime()).toEqual([{ spellId: SpellID.thunderstorm, msElapsed: 2000, hits: 1 }])
  })

  it('recasting restarts it instead of stacking', () => {
    store.addDamageOverTime(SpellID.thunderstorm)
    store.advanceDamageOverTime(3000)
    store.addDamageOverTime(SpellID.thunderstorm)
    expect(store.activeDamageOverTime()).toEqual([{ spellId: SpellID.thunderstorm, msElapsed: 0, hits: 0 }])
  })
})
