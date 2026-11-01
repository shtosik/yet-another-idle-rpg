import { StatToPercentagePipe } from './stat-to-percentage.pipe'

describe('StatToPercentagePipe', () => {
  const pipe = new StatToPercentagePipe()

  it('shows the stats panel unit on bonuses', () => {
    expect(pipe.transform('increasedSpellDuration', 10)).toBe('+10s')
    expect(pipe.transform('spellCooldownReduction', 5)).toBe('+5s')
    expect(pipe.transform('attackSpeed', 0.1)).toBe('-0.1s')
    expect(pipe.transform('attackPower', 3)).toBe('+3')
    expect(pipe.transform('foodEffectMultiplier', 0.5)).toBe('+50%')
  })
})
