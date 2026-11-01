import { StatToPercentagePipe } from './stat-to-percentage.pipe'
import { STAT_GROUPS, StatFormat } from '../components/game/player-stats/stat-rows'

describe('StatToPercentagePipe', () => {
  const pipe = new StatToPercentagePipe()

  it('shows the stats panel unit on bonuses', () => {
    expect(pipe.transform('increasedSpellDuration', 10)).toBe('+10s')
    expect(pipe.transform('spellCooldownReduction', 5)).toBe('+5s')
    expect(pipe.transform('attackSpeed', 0.1)).toBe('-0.1s')
    expect(pipe.transform('attackPower', 3)).toBe('+3')
    expect(pipe.transform('foodEffectMultiplier', 0.5)).toBe('+50%')
  })

  it('keeps the unit of every time stat in the stats panel', () => {
    const units: Partial<Record<StatFormat, string>> = { seconds: 's', ms: 's', minutes: ' min' }
    for (const row of STAT_GROUPS.flatMap(group => group.rows)) {
      const unit = units[row.format]
      if (unit) expect(pipe.transform(row.stat, 1000)).withContext(row.stat).toMatch(new RegExp(`${unit}$`))
    }
  })
})
