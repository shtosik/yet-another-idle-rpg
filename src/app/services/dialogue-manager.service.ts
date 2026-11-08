import { BattleStore } from '../store/battle/battle.store'
import { ArenaService } from './arena.service'
import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { computed, inject, Injectable, signal } from '@angular/core'
import { PlayerStore } from '../store/player/player.store'
import { DialogueEffect, QuestEffect, ReputationTurnInEffect } from '../../types/dialogues/dialogue-effect.type'
import { turnInFor } from '../../data/reputation-turn-ins'
import { TurnInCooldownService } from './turn-in-cooldown.service'
import { GameClock } from './game-clock.service'
import { orderKey, QuestsStore } from '../store/quests/quests.store'
import { DialogueOption, DialogueResult } from '../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { NpcID } from '../../enums/map/npc-id.enum'
import npcData, { NPCProps } from '../../data/npc-data'
import QUEST_DATA from '../../data/quests-data'
import { matchesQuestState } from './quest-status'
import { reputationTier } from '../store/player/reputation'
import { ReputationTier } from '../../enums/reputation-tier.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { MissingSlots } from '../store/player/inventory'
import { ExplorationGuildService } from './exploration-guild.service'
import { TownsStore } from '../store/towns/towns.store'
import { UnlockService } from './unlock.service'
import { DialogueContext, DialogueLabel, EffectCost, effectHandler, turnInState } from './dialogue-effect-handlers'
import { conditionHandler, requirementMet } from './dialogue-condition-handlers'

@Injectable({ providedIn: 'root' })
export class DialogueManagerService {
  private playerStore = inject(PlayerStore)
  private questStore = inject(QuestsStore)
  private cooldowns = inject(TurnInCooldownService)
  private ctx: DialogueContext = {
    player: this.playerStore,
    quests: this.questStore,
    towns: inject(TownsStore),
    battle: inject(BattleStore),
    arena: inject(ArenaService),
    guild: inject(ExplorationGuildService),
    cooldowns: this.cooldowns,
    clock: inject(GameClock),
    unlocks: inject(UnlockService),
    activeNpc: () => this.activeNpc(),
  }

  private currentConversation = signal<Record<any, DialogueNode<any>> | null>(null)
  private currentNodeId = signal<any>(null)

  activeNode = computed(() => {
    const conversation = this.currentConversation()
    const id = this.currentNodeId()
    return conversation && id !== null ? conversation[id] : null
  })

  activeNpc = signal<NPCProps | null>(null)

  /**
   * The shown and executed branch: the first result whose conditions pass, skipping quest starts that aren't available
   * and turn-ins whose town is Exalted.
   */
  getActiveResult<T>(option: DialogueOption<T>): DialogueResult<T> | undefined {
    if (!option.results || option.results.length === 0) return undefined

    return option.results.find(result => {
      const questStart = result.effects?.find(
        (e): e is QuestEffect => e.type === 'quest' && e.action === 'start',
      )
      if (questStart && !this.isQuestAvailable(questStart.questId)) return false
      const turnIn = result.effects?.find((e): e is ReputationTurnInEffect => e.type === 'reputationTurnIn')
      if (turnIn && this.isTurnInClosed(turnIn)) return false

      return this.checkConditions(result.visibilityConditions)
    })
  }

  private isQuestAvailable(questId: QuestID): boolean {
    // A repeatable order is not offered while its own turn-in cooldown runs.
    if (QUEST_DATA[questId].repeat && this.cooldowns.remainingMs(orderKey(questId)) > 0) return false
    return matchesQuestState(
      this.questStore.questStepProgression(),
      questId,
      QuestState.available,
      req => requirementMet(this.ctx, req, questId),
    )
  }

  /** Rechecks capacity, fees and one-time effects (each effect handler's `cost` and `canApply`). */
  canApplyResult(result: DialogueResult<any> | undefined): boolean {
    return Object.keys(this.missingSlots(result)).length === 0 && this.missingGold(result) === 0
      && (result?.effects ?? []).every(effect => effectHandler(effect).canApply?.(effect, this.ctx) ?? true)
  }

  /** What a turn-in hands over right now (`turnInState`). */
  turnIn(effect: ReputationTurnInEffect) {
    return turnInState(effect, this.ctx)
  }

  /** Turn-ins stop once their town is Exalted: more reputation would count for nothing. */
  private isTurnInClosed(effect: ReputationTurnInEffect): boolean {
    const reputationId = turnInFor(effect.npcId)?.reputationId
    return reputationId === undefined || reputationTier(this.playerStore.reputation()[reputationId] ?? 0) === ReputationTier.exalted
  }

  private costs(result: DialogueResult<any> | undefined): EffectCost[] {
    return (result?.effects ?? []).map(effect => effectHandler(effect).cost?.(effect, this.ctx) ?? {})
  }

  /** Gold still needed to pay the result's gold costs (owner decision: gold never goes negative). */
  missingGold(result: DialogueResult<any> | undefined): number {
    const fee = this.costs(result).reduce((sum, cost) => sum + (cost.gold ?? 0), 0)
    return Math.max(0, fee - this.playerStore.stats().goldCoins)
  }

  /** Slots the player must free, per tab, before the result's item or quest-completion rewards fit. */
  missingSlots(result: DialogueResult<any> | undefined): MissingSlots {
    const costs = this.costs(result)
    const adding = costs.flatMap(cost => cost.adds ?? [])
    return adding.length === 0 ? {} : this.playerStore.missingSlotsByTab(adding, costs.flatMap(cost => cost.removes ?? []))
  }

  /** True when the option's shown branch can run now: its requirements are met and its cost and effects apply. */
  canSelect(option: DialogueOption<any>): boolean {
    const result = this.getActiveResult(option)
    return !!result && this.checkConditions(result.requirementsNeeded) && this.canApplyResult(result)
  }

  selectOption(option: DialogueOption<any>) {
    const validResult = this.getActiveResult(option)

    if (!validResult) {
      console.error('No valid branch found for option:', option.responseKey)
      return
    }

    if (!this.canSelect(option)) return

    if (validResult.effects) {
      this.applyEffects(validResult.effects)
    }

    if (validResult.closeDialogue) {
      this.closeDialogue()
    } else if (validResult.next !== undefined) {
      this.currentNodeId.set(validResult.next)
    }
  }

  checkConditions(conditions?: DialogueCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true

    return conditions.every(c => this.checkCondition(c))
  }

  startDialogue(npcId: NpcID) {
    const data = npcData[npcId]

    if (!data) return

    this.activeNpc.set(data)
    this.currentConversation.set(data.dialogue)

    const hasMet = !!this.questStore.dialogueFlags()[`met_${npcId}`]
    const useFirstMeet = !hasMet && data.firstMeetNodeId !== undefined
    const startId = useFirstMeet ? data.firstMeetNodeId : (data.startNodeId ?? 0)

    this.currentNodeId.set(startId)
  }

  closeDialogue() {
    this.currentConversation.set(null)
    this.currentNodeId.set(null)
    this.activeNpc.set(null)
  }

  checkCondition(c: DialogueCondition): boolean {
    return conditionHandler(c).evaluate(c, this.ctx) !== !!c.not
  }

  conditionLabel(c: DialogueCondition): DialogueLabel[] {
    return conditionHandler(c).label(c, this.ctx)
  }

  effectLabel(effect: DialogueEffect): DialogueLabel[] {
    return effectHandler(effect).label(effect, this.ctx)
  }

  private applyEffects(effects: DialogueEffect[]) {
    effects.forEach(effect => effectHandler(effect).apply(effect, this.ctx))
  }
}
