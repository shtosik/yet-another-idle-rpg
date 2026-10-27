import { effect, inject, Injectable, untracked } from '@angular/core'
import { UNLOCK_RULES, UnlockCondition } from '../../data/unlock-conditions'
import { QuestState } from '../../enums/quest-state.enum'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { ModalService } from './modal.service'
import { getQuestStatus } from './quest-status'

/**
 * Applies `UNLOCK_RULES` whenever the player state they read changes — kills, loot, quest rewards, XP from
 * anywhere, quest completion — and shows each rule's notification once. `PlayerStore` re-applies them silently
 * on load (all but `questCompleted`, whose target is already saved).
 */
@Injectable({ providedIn: 'root' })
export class UnlockService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private modalService = inject(ModalService)

  constructor() {
    effect(() => {
      const newlyMet = UNLOCK_RULES.filter(rule =>
        !this.playerStore.isUnlockTargetUnlocked(rule.target) && this.isConditionMet(rule.condition),
      )
      if (!newlyMet.length) return

      untracked(() => {
        for (const rule of newlyMet) {
          this.playerStore.applyUnlockTarget(rule.target)
          if (rule.notification) this.modalService.openUnlockNotification(rule.notification)
        }
      })
    })
  }

  private isConditionMet(condition: UnlockCondition): boolean {
    if (condition.type === 'questCompleted') {
      return getQuestStatus(this.questsStore.questStepProgression(), condition.questId).state === QuestState.completed
    }
    return this.playerStore.isUnlockConditionMet(condition)
  }
}
