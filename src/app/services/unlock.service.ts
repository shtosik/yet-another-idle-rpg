import { effect, inject, Injectable, untracked } from '@angular/core'
import { UNLOCK_RULES } from '../../data/unlock-conditions'
import { PlayerStore } from '../store/player/player.store'
import { ModalService } from './modal.service'

/**
 * Applies `UNLOCK_RULES` whenever the player state they read changes — kills, loot, quest rewards, XP from
 * anywhere — and shows each rule's notification once. `PlayerStore` re-applies them silently on load.
 */
@Injectable({ providedIn: 'root' })
export class UnlockService {
  private playerStore = inject(PlayerStore)
  private modalService = inject(ModalService)

  constructor() {
    effect(() => {
      const newlyMet = UNLOCK_RULES.filter(rule =>
        !this.playerStore.isUnlockTargetUnlocked(rule.target) && this.playerStore.isUnlockConditionMet(rule.condition),
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
}
