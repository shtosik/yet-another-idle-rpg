import { computed, inject, Injectable } from '@angular/core'
import { PlayerStore, Task } from '../store/player/player.store'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import ZONES_DATA from '../../data/zones-data'
import { TaskLength } from '../../types/dialogues/dialogue-effect.type'

export type { TaskLength }

@Injectable({ providedIn: 'root' })
export class ExplorationGuildService {
  private playerStore = inject(PlayerStore)

  /**
   * Task targets: regular enemies (bosses are not in `enemies`) of zones that are unlocked and within Guild rank.
   * Rank 0 allows tier 1 (Horseshoe Beach); each rank adds the next tier. Old zones stay in the pool.
   */
  private taskTargets = computed(() => {
    const maxTier = this.playerStore.guildRank() + 1
    return this.playerStore.unlockedContent().zones
      .filter(zoneId => ZONES_DATA[zoneId].tier <= maxTier)
      .flatMap(zoneId => ZONES_DATA[zoneId].enemies.map(monsterId => ({ monsterId, zoneId })))
  })

  /** Rolls a random monster from the task target pool */
  private rollMonsterId(): { monsterId: EnemyID; zoneId: ZoneID } {
    const targets = this.taskTargets()
    return targets[Math.floor(Math.random() * targets.length)]
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

  /** Length reward × the tier of the zone the target lives in. */
  private getTokenReward(length: TaskLength, zoneId: ZoneID): number {
    return this.lengthReward(length) * ZONES_DATA[zoneId].tier
  }

  private lengthReward(length: TaskLength): number {
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
    if (!this.playerStore.hasAvailableTaskSlot() || !this.taskTargets().length) return null

    const { monsterId, zoneId } = this.rollMonsterId()
    const task: Task = {
      id: this.generateTaskId(),
      monsterId,
      targetCount: this.rollTargetCount(length),
      currentCount: 0,
      rewardTokens: this.getTokenReward(length, zoneId),
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
