import { computed, inject, Injectable } from '@angular/core'
import { PlayerStore, Task } from '../store/player/player.store'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import ZONES_DATA from '../../data/zones-data'

export type TaskLength = 'short' | 'medium' | 'long'

@Injectable({ providedIn: 'root' })
export class ExplorationGuildService {
  private playerStore = inject(PlayerStore)

  /** Zone Unlock Formula: UnlockedZoneCount = Math.floor(totalTasksCompleted / 5) + 1 */
  unlockedZoneCount = computed(() => {
    return Math.floor(this.playerStore.totalTasksCompleted() / 5) + 1
  })

  /** Returns the list of zone IDs that are currently unlocked based on task completions */
  unlockedZoneIds = computed(() => {
    const count = this.unlockedZoneCount()
    // ZoneID enum values: horseshoeBeach=1, tradersBasement=2, plains=3, theLongPath=4
    const allZoneIds: ZoneID[] = [
      ZoneID.horseshoeBeach,
      ZoneID.tradersBasement,
      ZoneID.plains,
      ZoneID.theLongPath,
    ]
    return allZoneIds.slice(0, count)
  })

  /** Returns all eligible (non-boss) enemy IDs from unlocked zones */
  eligibleMonsterIds = computed(() => {
    const zones = this.unlockedZoneIds()
    const monsterIds: EnemyID[] = []

    zones.forEach(zoneId => {
      const zoneData = ZONES_DATA[zoneId]
      if (zoneData) {
        zoneData.enemies.forEach(enemyId => {
          // Only include regular enemies, not bosses
          if (!monsterIds.includes(enemyId)) {
            monsterIds.push(enemyId)
          }
        })
      }
    })

    return monsterIds
  })

  /** Rolls a random monster from the eligible pool */
  private rollMonsterId(): { monsterId: EnemyID; zoneId: ZoneID } {
    const eligible = this.eligibleMonsterIds()
    const randomIndex = Math.floor(Math.random() * eligible.length)
    const monsterId = eligible[randomIndex]

    // Find which zone this monster belongs to
    const zones = this.unlockedZoneIds()
    let zoneId = zones[0]
    for (const zId of zones) {
      if (ZONES_DATA[zId].enemies.includes(monsterId)) {
        zoneId = zId
        break
      }
    }

    return { monsterId, zoneId }
  }

  /** Generates a random target count based on task length */
  private rollTargetCount(length: TaskLength): number {
    switch (length) {
      case 'short':
        return Math.floor(Math.random() * (50 - 25 + 1)) + 25  // 25-50
      case 'medium':
        return Math.floor(Math.random() * (200 - 50 + 1)) + 50  // 50-200
      case 'long':
        return Math.floor(Math.random() * (400 - 200 + 1)) + 200  // 200-400
    }
  }

  /** Returns the token reward for a given task length */
  private getTokenReward(length: TaskLength): number {
    switch (length) {
      case 'short':
        return 1
      case 'medium':
        return 2
      case 'long':
        return 3
    }
  }

  /** Generates a unique task ID */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /** Creates a new task based on the selected length */
  generateTask(length: TaskLength): Task | null {
    if (!this.playerStore.hasAvailableTaskSlot()) return null

    const { monsterId, zoneId } = this.rollMonsterId()
    const task: Task = {
      id: this.generateTaskId(),
      monsterId,
      targetCount: this.rollTargetCount(length),
      currentCount: 0,
      rewardTokens: this.getTokenReward(length),
      zoneId,
    }

    return task
  }

  /** Convenience: generate and accept a task in one step */
  acceptTask(length: TaskLength): boolean {
    const task = this.generateTask(length)
    if (!task) return false

    this.playerStore.acceptTask(task)
    return true
  }
}
