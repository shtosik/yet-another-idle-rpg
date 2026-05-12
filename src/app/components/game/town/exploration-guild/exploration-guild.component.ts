import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { PlayerStore, Task } from '../../../../store/player/player.store'
import { ExplorationGuildService, TaskLength } from '../../../../services/exploration-guild.service'
import { DialogueManagerService } from '../../../../services/dialogue-manager.service'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'

@Component({
  selector: 'app-exploration-guild',
  templateUrl: './exploration-guild.component.html',
  styleUrl: './exploration-guild.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class ExplorationGuildComponent {
  private playerStore = inject(PlayerStore)
  private guildService = inject(ExplorationGuildService)
  private dialogueService = inject(DialogueManagerService)

  protected readonly NpcID = NpcID

  // Signals from store
  activeTask = this.playerStore.activeTask
  hasAvailableTaskSlot = this.playerStore.hasAvailableTaskSlot
  isTaskComplete = this.playerStore.isTaskComplete
  totalTasksCompleted = this.playerStore.totalTasksCompleted
  explorerTokens = this.playerStore.explorerTokens
  unlockedZoneCount = this.guildService.unlockedZoneCount

  /** Get the enemy name for display */
  getEnemyName(monsterId: EnemyID): string {
    return EnemyID[monsterId]
  }

  /** Select a task length and generate a task */
  selectTaskLength(length: TaskLength): void {
    this.guildService.acceptTask(length)
  }

  /** Claim the completed task reward and trigger Marvin's dialogue */
  claimReward(): void {
    const task = this.activeTask()
    if (!task) return

    this.playerStore.claimTaskReward(task.id)
    this.dialogueService.startDialogue(NpcID.laHarparMarvin)
  }

  /** Abandon the current task */
  abandonTask(): void {
    const task = this.activeTask()
    if (!task) return
    this.playerStore.abandonTask(task.id)
  }

  /** Calculate progress percentage for the progress bar */
  getProgressPercent(task: Task): number {
    return task.currentCount / task.targetCount
  }
}
