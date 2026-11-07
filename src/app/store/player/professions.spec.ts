import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import PROFESSIONS_DATA from '../../../data/professions-data'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { saveGameStateNow } from '../helpers/with-game-state-sync.hook'
import { levelFromXp, newProfession, settleProfession, xpForLevel, xpToNextLevel } from './professions'
import { PlayerStore } from './player.store'
import { expertiseGain, expertiseModifiers } from './stats'

const farming = PROFESSIONS_DATA[ProfessionID.farming]
const amountOf = (level: number, stat: string) =>
  expertiseModifiers({ [ProfessionID.farming]: level }).filter(m => m.stat === stat).reduce((sum, m) => sum + m.amount, 0)

describe('profession curve', () => {
  it('costs 20 x L^2 to go from level L to L+1', () => {
    expect(xpToNextLevel(1)).toBe(20)
    expect(xpToNextLevel(10)).toBe(2000)
  })

  it('totals the farm doc table', () => {
    const table: [number, number][] = [[1, 0], [2, 20], [5, 600], [8, 2800], [12, 10120], [17, 29920], [22, 66220], [30, 171100]]
    for (const [level, total] of table) expect(xpForLevel(level)).withContext(`level ${level}`).toBe(total)
  })

  it('reads the level from XP and stops at the cap', () => {
    expect(levelFromXp(0, 30)).toBe(1)
    expect(levelFromXp(19, 30)).toBe(1)
    expect(levelFromXp(20, 30)).toBe(2)
    expect(levelFromXp(171_099, 30)).toBe(29)
    expect(levelFromXp(171_100, 30)).toBe(30)
    expect(levelFromXp(10_000_000, 30)).toBe(30)
    expect(levelFromXp(10_000_000, 40)).toBe(40)
  })
})

describe('expertise stats', () => {
  it('gives nothing at level 1 or while locked', () => {
    expect(expertiseModifiers({ [ProfessionID.farming]: 1 })).toEqual([])
    expect(expertiseModifiers({})).toEqual([])
  })

  it('gives 0.5% grow time on each non-milestone level, 11.5% at the cap', () => {
    expect(amountOf(4, 'seedGrowthTimeReduction')).toBeCloseTo(0.015)
    expect(amountOf(5, 'seedGrowthTimeReduction')).toBeCloseTo(0.015) // level 5 is a milestone instead
    expect(amountOf(30, 'seedGrowthTimeReduction')).toBeCloseTo(0.115)
  })

  it('gives each milestone stat from its level on', () => {
    const milestones = [
      [5, 'farmSeedSaveChance', 0.1], [10, 'farmDoubleHarvestChance', 0.05], [15, 'farmBonusCropChance', 0.2],
      [20, 'turnInCooldownReduction', 0.1], [25, 'farmXpMultiplier', 0.1], [30, 'seedDropChance', 0.25],
    ] as const
    for (const [level, stat, amount] of milestones) {
      expect(amountOf(level - 1, stat)).withContext(`${stat} before ${level}`).toBe(0)
      expect(amountOf(level, stat)).withContext(`${stat} at ${level}`).toBe(amount)
    }
  })

  it('past the cap keeps only the grow time reward, still held to its 50% total', () => {
    expect(amountOf(35, 'seedDropChance')).toBe(0.25)
    expect(amountOf(35, 'farmSeedSaveChance')).toBe(0.1)
    expect(amountOf(35, 'seedGrowthTimeReduction')).toBeCloseTo(0.14)
    expect(amountOf(200, 'seedGrowthTimeReduction')).toBeCloseTo(farming.perLevelTotalCap)
  })

  it('reports what a level-up adds, milestone levels included', () => {
    expect(expertiseGain(ProfessionID.farming, 3, 4)).toEqual([{ stat: 'seedGrowthTimeReduction', amount: 0.005 }])
    expect(expertiseGain(ProfessionID.farming, 4, 5)).toEqual([{ stat: 'farmSeedSaveChance', amount: 0.1 }])
  })
})

describe('settleProfession', () => {
  it('pays only the levels not paid yet, once', () => {
    const first = settleProfession({ ...newProfession(), experience: xpForLevel(6) }, 30)
    expect(first.skillPoints).toBe(5)
    expect(first.progress.pointsPaidLevel).toBe(6)
    expect(settleProfession(first.progress, 30).skillPoints).toBe(0)
  })

  it('pays only the difference when the cap is raised, and refunds nothing when the level drops', () => {
    const atCap = settleProfession({ experience: xpForLevel(40), pointsPaidLevel: 1 }, 30)
    expect(atCap.skillPoints).toBe(29)
    expect(settleProfession(atCap.progress, 32).skillPoints).toBe(2)
    expect(settleProfession({ experience: 0, pointsPaidLevel: 12 }, 30)).toEqual({ progress: { experience: 0, pointsPaidLevel: 12 }, skillPoints: 0 })
  })
})

describe('Farming expertise in the player store', () => {
  let player: InstanceType<typeof PlayerStore>
  const reload = () => {
    saveGameStateNow()
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
  }

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
  })
  afterEach(() => localStorage.clear())

  it('ignores XP while the profession is locked', () => {
    expect(player.applyProfessionXp(ProfessionID.farming, 500)).toBeNull()
    expect(player.professionLevel(ProfessionID.farming)).toBe(0)
  })

  it('starts at level 1 and pays 1 skill point per level gained, with the stats following', () => {
    player.unlockProfession(ProfessionID.farming)
    expect(player.professionLevel(ProfessionID.farming)).toBe(1)

    const gain = player.applyProfessionXp(ProfessionID.farming, xpForLevel(5))
    expect(gain).toEqual({ professionId: ProfessionID.farming, from: 1, to: 5, skillPoints: 4 })
    expect(player.stats().unspentSkillPoints).toBe(4)
    expect(player.stats().farmSeedSaveChance).toBe(0.1)
    expect(player.stats().seedGrowthTimeReduction).toBeCloseTo(0.015)
  })

  it('pays skill points once across reloads and when XP is set lower and higher again', () => {
    player.unlockProfession(ProfessionID.farming)
    player.applyProfessionXp(ProfessionID.farming, xpForLevel(8))
    expect(player.stats().unspentSkillPoints).toBe(7)

    reload()
    expect(player.professionLevel(ProfessionID.farming)).toBe(8)
    expect(player.stats().unspentSkillPoints).toBe(7)

    player.applyProfessionXp(ProfessionID.farming, -xpForLevel(8)) // a lower level refunds nothing
    expect(player.stats().farmSeedSaveChance).toBe(0)
    player.applyProfessionXp(ProfessionID.farming, xpForLevel(8))
    expect(player.stats().unspentSkillPoints).toBe(7)
  })

  it('pays a save made before the rule exactly once on load', () => {
    saveGameStateNow()
    const envelope = JSON.parse(localStorage.getItem('playerStore') as string)
    envelope.state.professions = { [ProfessionID.farming]: { experience: xpForLevel(4), pointsPaidLevel: 1 } }
    localStorage.setItem('playerStore', JSON.stringify(envelope))

    TestBed.resetTestingModule()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    player = TestBed.inject(PlayerStore)
    expect(player.stats().unspentSkillPoints).toBe(3)

    reload()
    expect(player.stats().unspentSkillPoints).toBe(3)
  })
})
