import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import ZONES_DATA from '../../../data/zones-data'
import { TaskLength } from '../../../types/dialogues/dialogue-effect.type'

export interface Task {
  id: string
  monsterId: EnemyID
  targetCount: number
  currentCount: number
  rewardTokens: number
  /** Only sets the reward tier: a kill counts for the task in any zone. */
  zoneId: ZoneID
}

/** The saved part of the Exploration Guild state. */
export interface TaskSlice {
  activeTasks: Task[]
  totalTasksCompleted: number
}

export interface TaskTarget {
  monsterId: EnemyID
  zoneId: ZoneID
}

export const TASKS_PER_GUILD_RANK = 5

const COUNT_RANGE: Record<TaskLength, [number, number]> = { short: [25, 50], medium: [50, 200], long: [200, 400] }
const LENGTH_REWARD: Record<TaskLength, number> = { short: 1, medium: 2, long: 3 }

export const isTaskDone = (task: Task): boolean => task.currentCount >= task.targetCount

/** One rank per `TASKS_PER_GUILD_RANK` completed tasks, no cap. Each rank adds a zone tier to the task pool. */
export const guildRank = (totalTasksCompleted: number): number => Math.floor(totalTasksCompleted / TASKS_PER_GUILD_RANK)

export const hasFreeTaskSlot = (tasks: readonly Task[], maxSlots: number): boolean => tasks.length < maxSlots

/**
 * Task targets: regular enemies (bosses are not in `enemies`) of unlocked zones within Guild rank.
 * Rank 0 allows tier 1; each rank adds the next tier. Old zones stay in the pool.
 */
export const taskTargets = (rank: number, unlockedZones: readonly ZoneID[]): TaskTarget[] =>
  unlockedZones
    .filter(zoneId => ZONES_DATA[zoneId].tier <= rank + 1)
    .flatMap(zoneId => ZONES_DATA[zoneId].enemies.map(monsterId => ({ monsterId, zoneId })))

/** Rolls a target uniformly from `targets` and a count for `length`; reward = length reward × target zone tier. */
export const rollTask = (
  ctx: { length: TaskLength; targets: readonly TaskTarget[]; now: number },
  rng: () => number,
): Task | null => {
  if (!ctx.targets.length) return null
  const { monsterId, zoneId } = ctx.targets[Math.floor(rng() * ctx.targets.length)]
  const [min, max] = COUNT_RANGE[ctx.length]
  return {
    id: `task_${ctx.now}_${rng().toString(36).substring(2, 9)}`,
    monsterId,
    targetCount: Math.floor(rng() * (max - min + 1)) + min,
    currentCount: 0,
    rewardTokens: LENGTH_REWARD[ctx.length] * ZONES_DATA[zoneId].tier,
    zoneId,
  }
}

/** Adds `task`, or returns null when every slot is taken. */
export const acceptTask = (slice: TaskSlice, task: Task, maxSlots: number): TaskSlice | null =>
  hasFreeTaskSlot(slice.activeTasks, maxSlots) ? { ...slice, activeTasks: [...slice.activeTasks, task] } : null

/** Claims every finished task at once; `tokens` is what they pay. */
export const claimTasks = (slice: TaskSlice): { slice: TaskSlice; tokens: number } => {
  const done = slice.activeTasks.filter(isTaskDone)
  return {
    slice: {
      activeTasks: slice.activeTasks.filter(task => !isTaskDone(task)),
      totalTasksCompleted: slice.totalTasksCompleted + done.length,
    },
    tokens: done.reduce((sum, task) => sum + task.rewardTokens, 0),
  }
}

/** Cancels the task at `index`. Finished tasks can only be claimed. */
export const abandonTask = (slice: TaskSlice, index: number): TaskSlice => {
  const task = slice.activeTasks[index]
  if (!task || isTaskDone(task)) return slice
  return { ...slice, activeTasks: slice.activeTasks.filter(t => t.id !== task.id) }
}

/** Adds each enemy's counted kills (already doubled by Bounty Mark) to every unfinished task on it. */
export const progressTasks = (tasks: Task[], countsByEnemy: Partial<Record<EnemyID, number>>): Task[] =>
  tasks.map(task => {
    const counts = countsByEnemy[task.monsterId]
    if (!counts || isTaskDone(task)) return task
    return { ...task, currentCount: Math.min(task.targetCount, task.currentCount + counts) }
  })
