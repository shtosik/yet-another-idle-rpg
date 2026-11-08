import { CombatStepContext, MAX_ATTACKS_PER_TICK, stepCombat } from './combat-step'

const setup = (over: Partial<CombatStepContext> = {}, kills: boolean[] = []) => {
  const calls = { spawns: 0, attacks: 0 }
  const ctx: CombatStepContext = {
    inCombat: true,
    respawnDelayMs: 2000,
    timePerAttackMs: 1000,
    spawn: () => calls.spawns++,
    attack: () => {
      calls.attacks++
      return kills.shift() ?? false
    },
    ...over,
  }
  return { ctx, calls }
}
const zero = { attackTimer: 0, respawnTimer: 0 }

describe('stepCombat', () => {
  it('waits out the respawn delay without spawning early', () => {
    const { ctx, calls } = setup({ inCombat: false })
    expect(stepCombat(zero, 1500, ctx)).toEqual({ attackTimer: 0, respawnTimer: 1500 })
    expect(calls.spawns).toBe(0)
  })

  it('spawns when the delay passes and carries the overshoot into attacks', () => {
    const { ctx, calls } = setup({ inCombat: false })
    const out = stepCombat({ attackTimer: 700, respawnTimer: 1500 }, 1700, ctx)
    expect(calls).toEqual({ spawns: 1, attacks: 1 })
    expect(out).toEqual({ attackTimer: 200, respawnTimer: 0 })
  })

  it('uses the given respawn delay (arena)', () => {
    const { ctx, calls } = setup({ inCombat: false, respawnDelayMs: 500 })
    stepCombat(zero, 500, ctx)
    expect(calls.spawns).toBe(1)
  })

  it('carries leftover attack time between ticks', () => {
    const { ctx, calls } = setup()
    const out = stepCombat({ attackTimer: 600, respawnTimer: 0 }, 600, ctx)
    expect(calls.attacks).toBe(1)
    expect(out.attackTimer).toBe(200)
  })

  it('drops leftover attack time on a kill and stops attacking', () => {
    const { ctx, calls } = setup({}, [true])
    const out = stepCombat(zero, 3500, ctx)
    expect(calls.attacks).toBe(1)
    expect(out).toEqual({ attackTimer: 0, respawnTimer: 0 })
  })

  it('caps attacks per tick and parks the timer at one attack', () => {
    const { ctx, calls } = setup({ timePerAttackMs: 100 })
    const out = stepCombat({ attackTimer: 100000, respawnTimer: 0 }, 0, ctx)
    expect(calls.attacks).toBe(MAX_ATTACKS_PER_TICK)
    expect(out.attackTimer).toBe(100)
  })
})
