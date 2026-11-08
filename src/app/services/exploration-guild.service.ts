import { computed, inject, Injectable } from '@angular/core'
import { PlayerStore } from '../store/player/player.store'
import { Task } from '../store/player/tasks'
import { rollTask, taskTargets } from '../store/player/tasks'
import { TaskLength } from '../../types/dialogues/dialogue-effect.type'

export type { TaskLength }

/** Rolls Tasks for the player; the rules live in `store/player/tasks.ts`. */
@Injectable({ providedIn: 'root' })
export class ExplorationGuildService {
  private playerStore = inject(PlayerStore)

  private targets = computed(() => taskTargets(this.playerStore.guildRank(), this.playerStore.unlockedContent().zones))

  /** Creates a new task based on the selected length */
  generateTask(length: TaskLength): Task | null {
    if (!this.playerStore.hasAvailableTaskSlot()) return null
    return rollTask({ length, targets: this.targets(), now: Date.now() }, Math.random)
  }

  /** Convenience: generate and accept a task in one step */
  acceptTask(length: TaskLength): boolean {
    const task = this.generateTask(length)
    return !!task && this.playerStore.acceptTask(task)
  }
}
