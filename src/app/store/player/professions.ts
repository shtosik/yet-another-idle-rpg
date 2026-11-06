import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import PROFESSIONS_DATA from '../../../data/professions-data'

/** Saved per unlocked profession; the level is derived from `experience`. */
export interface ProfessionProgress {
  experience: number
  /** Highest level whose skill points were paid (starts at 1), so a reload or a raised cap never pays twice. */
  pointsPaidLevel: number
}

export type Professions = Partial<Record<ProfessionID, ProfessionProgress>>

export const SKILL_POINTS_PER_EXPERTISE_LEVEL = 1

export const newProfession = (): ProfessionProgress => ({ experience: 0, pointsPaidLevel: 1 })

/** XP to go from `level` to `level + 1`. */
export const xpToNextLevel = (level: number): number => 20 * level * level

/** Total XP needed to reach `level` (level 1 = 0, 2 = 20, 5 = 600, 30 = 171,100). */
export const xpForLevel = (level: number): number => level <= 1 ? 0 : 20 * (level - 1) * level * (2 * level - 1) / 6

export function levelFromXp(experience: number, maxLevel: number): number {
  let level = 1
  while (level < maxLevel && experience >= xpForLevel(level + 1)) level++
  return level
}

/** 0 while the profession is locked. */
export const professionLevel = (professions: Professions, id: ProfessionID): number => {
  const progress = professions[id]
  return progress ? levelFromXp(progress.experience, PROFESSIONS_DATA[id].maxLevel) : 0
}

/** Level of every unlocked profession. */
export const professionLevels = (professions: Professions): Partial<Record<ProfessionID, number>> =>
  Object.fromEntries((Object.keys(professions).map(Number) as ProfessionID[]).map(id => [id, professionLevel(professions, id)]))

/**
 * Pays the skill points of levels not paid yet and records them as paid. Runs after every XP change and on load.
 * A level lost to a changed curve refunds nothing.
 */
export function settleProfession(progress: ProfessionProgress, maxLevel: number): { progress: ProfessionProgress, skillPoints: number } {
  const level = levelFromXp(progress.experience, maxLevel)
  const unpaid = Math.max(0, level - progress.pointsPaidLevel)
  return {
    progress: { ...progress, pointsPaidLevel: Math.max(progress.pointsPaidLevel, level) },
    skillPoints: unpaid * SKILL_POINTS_PER_EXPERTISE_LEVEL,
  }
}
