import { effect, inject, Injectable, untracked } from '@angular/core'
import {
  UNLOCK_RULES,
  UnlockCondition,
  UnlockNotification,
  UnlockTarget,
  ZONE_UNLOCK_NOTIFICATIONS,
} from '../../data/unlock-conditions'
import { ENTRANCE_ZONES_BY_QUEST } from '../../data/helpers/entrance-zones'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { SiteID } from '../../enums/ids/site-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { ModalService } from './modal.service'
import { getQuestStatus } from './quest-status'

/**
 * Unlocks: the only owner of what is unlocked (zones, Sites, towns, features) and of its notices. `PlayerStore`
 * keeps the flags. Rules (`UNLOCK_RULES`) and town entrances (a started quest opens its building's zone) are
 * granted live whenever the state they read changes; the boss chain and dialogue call `grant` themselves.
 */
@Injectable({ providedIn: 'root' })
export class UnlockService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private modalService = inject(ModalService)

  constructor() {
    // The stores have loaded the save by now; the effect's first run then finds nothing new to notify.
    this.replayOnLoad()
    effect(() => {
      const targets = this.metTargets().filter(target => !this.playerStore.isUnlockTargetUnlocked(target))
      if (targets.length) untracked(() => targets.forEach(target => this.grant(target)))
    })
  }

  /** Unlocks the target and shows its notice, if it has one. No-op when it is already unlocked. */
  grant(target: UnlockTarget): void {
    if (this.playerStore.isUnlockTargetUnlocked(target)) return
    this.playerStore.applyUnlockTarget(target)
    const notice = this.noticeOf(target)
    if (notice) this.modalService.openUnlockNotification(notice)
  }

  /** Re-applies every met rule and town entrance silently, for saves made before they existed. */
  replayOnLoad(): void {
    this.metTargets().forEach(target => this.playerStore.applyUnlockTarget(target))
  }

  private metTargets(): UnlockTarget[] {
    const rules = UNLOCK_RULES.filter(rule => this.isConditionMet(rule.condition)).map(rule => rule.target)
    const entrances = Object.keys(this.questsStore.questStepProgression())
      .flatMap(key => ENTRANCE_ZONES_BY_QUEST[Number(key) as QuestID] ?? [])
      .map((zoneId): UnlockTarget => ({ type: 'zone', zoneId }))
    return [...rules, ...entrances]
  }

  /** `waveReached`: something was killed on that wave or a later one of the zone. */
  private isConditionMet(condition: UnlockCondition): boolean {
    switch (condition.type) {
      case 'hasItem':
        return this.playerStore.itemCount(condition.itemId) > 0
      case 'levelReached':
        return this.playerStore.stats().level >= condition.level
      case 'waveReached': {
        const waves = this.playerStore.zonesProgression()[condition.zoneId] ?? {}
        return Object.entries(waves).some(([wave, kills]) => Number(wave) >= condition.wave && kills > 0)
      }
      case 'questCompleted':
        return getQuestStatus(this.questsStore.questStepProgression(), condition.questId).state === QuestState.completed
    }
  }

  private noticeOf(target: UnlockTarget): UnlockNotification | undefined {
    const rule = UNLOCK_RULES.find(candidate => isSameTarget(candidate.target, target))
    if (rule?.notification) return rule.notification
    switch (target.type) {
      case 'zone':
        return ZONE_UNLOCK_NOTIFICATIONS[target.zoneId]
      case 'site': {
        const key = `unlocks:sites.${SiteID[target.siteId]}`
        return { titleKey: `${key}.title`, bodyKey: `${key}.body` }
      }
      case 'town':
      case 'feature':
        return undefined
    }
  }
}

// Targets are flat literals with the same field order, so their JSON compares them.
const isSameTarget = (a: UnlockTarget, b: UnlockTarget): boolean => JSON.stringify(a) === JSON.stringify(b)
