import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import ZONES_DATA from '../../../data/zones-data'
import { seededRng } from '../../services/offline-simulation'
import {
  abandonTask, acceptTask, claimTasks, guildRank, progressTasks, rollTask, Task, taskTargets, TaskSlice,
} from './tasks'

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1', monsterId: EnemyID.crab, targetCount: 10, currentCount: 0, rewardTokens: 2, zoneId: ZoneID.horseshoeBeach, ...over,
})
const slice = (activeTasks: Task[], totalTasksCompleted = 0): TaskSlice => ({ activeTasks, totalTasksCompleted })

describe('tasks', () => {
  it('derives the rank from completed tasks', () => {
    expect([0, 4, 5, 12].map(guildRank)).toEqual([0, 0, 1, 2])
  })

  it('limits targets to unlocked zones within rank + 1 tiers', () => {
    const zones = [ZoneID.horseshoeBeach, ZoneID.plains]
    expect(new Set(taskTargets(0, zones).map(t => t.zoneId))).toEqual(new Set([ZoneID.horseshoeBeach]))
    expect(new Set(taskTargets(1, zones).map(t => t.zoneId))).toEqual(new Set(zones))
    expect(taskTargets(0, [ZoneID.plains])).toEqual([])
  })

  describe('rollTask', () => {
    const targets = taskTargets(1, [ZoneID.horseshoeBeach, ZoneID.plains])

    it('rolls a target from the pool, a count in the length range and tier-scaled tokens', () => {
      const rng = seededRng(3)
      for (const [length, min, max, reward] of [['short', 25, 50, 1], ['medium', 50, 200, 2], ['long', 200, 400, 3]] as const) {
        for (let i = 0; i < 20; i++) {
          const rolled = rollTask({ length, targets, now: 5 }, rng)!
          expect(targets).toContain(jasmine.objectContaining({ monsterId: rolled.monsterId, zoneId: rolled.zoneId }))
          expect(rolled.targetCount).toBeGreaterThanOrEqual(min)
          expect(rolled.targetCount).toBeLessThanOrEqual(max)
          expect(rolled.rewardTokens).toBe(reward * ZONES_DATA[rolled.zoneId].tier)
          expect(rolled.currentCount).toBe(0)
        }
      }
    })

    it('is repeatable for one seed and null with no targets', () => {
      expect(rollTask({ length: 'long', targets, now: 5 }, seededRng(9))).toEqual(rollTask({ length: 'long', targets, now: 5 }, seededRng(9)))
      expect(rollTask({ length: 'long', targets: [], now: 5 }, seededRng(9))).toBeNull()
    })
  })

  it('refuses to accept into a full slot', () => {
    const full = slice([task()])
    expect(acceptTask(full, task({ id: 't2' }), 1)).toBeNull()
    expect(acceptTask(full, task({ id: 't2' }), 2)?.activeTasks.map(t => t.id)).toEqual(['t1', 't2'])
  })

  it('claims every finished task and pays their tokens', () => {
    const { slice: next, tokens } = claimTasks(slice([
      task({ id: 'a', currentCount: 10, rewardTokens: 2 }),
      task({ id: 'b', currentCount: 3 }),
      task({ id: 'c', currentCount: 10, rewardTokens: 3 }),
    ], 4))
    expect(tokens).toBe(5)
    expect(next.totalTasksCompleted).toBe(6)
    expect(next.activeTasks.map(t => t.id)).toEqual(['b'])
  })

  it('abandons an unfinished task only', () => {
    const s = slice([task({ id: 'a', currentCount: 10 }), task({ id: 'b' })])
    expect(abandonTask(s, 0)).toBe(s)
    expect(abandonTask(s, 5)).toBe(s)
    expect(abandonTask(s, 1).activeTasks.map(t => t.id)).toEqual(['a'])
  })

  it('progresses every matching unfinished task, a Bounty Mark double kill counting 2, capped at the target', () => {
    const next = progressTasks([
      task({ id: 'a', currentCount: 3 }),
      task({ id: 'b', currentCount: 9 }),
      task({ id: 'c', currentCount: 10 }),
      task({ id: 'd', monsterId: EnemyID.seagull }),
    ], { [EnemyID.crab]: 2 })
    expect(next.map(t => t.currentCount)).toEqual([5, 10, 10, 0])
  })
})
