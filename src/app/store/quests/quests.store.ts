import { QuestStep } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withDevtools } from '../helpers/devtools'
import { saveGameStateNow, withGameStateSync } from '../helpers/with-game-state-sync.hook'
import QUEST_DATA, { RequirementProps } from '../../../data/quests-data'
import { inject } from '@angular/core'
import { NoticesService } from '../../services/notices.service'
import { PlayerStore } from '../player/player.store'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { canAdvanceQuest } from '../../services/quest-status'
import { GameClock } from '../../services/game-clock.service'
import { orderKey, TurnInKey, turnInRemainingMs } from './turn-in-cooldown'
import { rollOrder } from './orders'
import { KillBaseline, killBaseline, Progress, RequirementContext, requirementProgress, RequirementRow, requirementRows, waveKey } from './requirement-handlers'
import { QuestCompleted, QuestPayout, QuestSlice, questTransition } from './quest-transition'

export { orderKey }
export type { KillBaseline }

export interface QuestsState extends QuestSlice {
  stepKillBaselines: Partial<Record<QuestID, KillBaseline>>
  dialogueFlags: Record<string, boolean>
}

export const initialState: QuestsState = {
  questStepProgression: {},
  stepKillBaselines: {},
  dialogueFlags: {},
  pinnedQuests: [],
  lastTurnInAt: {},
  orders: {},
  questCompletions: {},
}

const STORE_KEY = 'questsStore'

export const QuestsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withMethods((
    store,
    notices = inject(NoticesService),
    playerStore = inject(PlayerStore),
  ) => ({
    /**
     * The one payer of a completed quest or Order. Pays everything or nothing: null when the item rewards don't fit.
     * `questTransition` checks the fit before anything is taken, so a refusal here never costs the turn-in.
     */
    handleQuestCompleted(questId: QuestID, payout: QuestPayout): QuestCompleted | null {
      if (Object.keys(playerStore.grant(payout.items, 'atomic').missing).length > 0) return null

      const completed = { questId, payout }
      notices.push({ type: 'questCompleted', completed })
      playerStore.updatePlayerStats(payout.stats)
      playerStore.addReputation(payout.reputation)
      payout.professionXp.forEach(({ professionId, amount }) => playerStore.applyProfessionXp(professionId, amount))
      return completed
    },

    /** Kill requirements count from the moment the quest reaches a step; `null` drops the baseline. */
    setStepKillBaseline(questId: QuestID, step: QuestStep | null) {
      const requirements = step === null ? [] : QUEST_DATA[questId].steps[step - 1].requirements
      const baseline = killBaseline(requirements, {
        enemy: enemyId => playerStore.enemyKillCounts()[enemyId] ?? 0,
        wave: (zoneId, wave) => playerStore.getKillCountByZoneAndWave(zoneId, wave),
      })

      patchState(store, (state) => {
        const { [questId]: _, ...rest } = state.stepKillBaselines
        return { stepKillBaselines: step === null ? rest : { ...rest, [questId]: baseline } }
      })
    },

    /** Kills since the quest reached its current step (lifetime when there is no baseline). */
    questEnemyKills(questId: QuestID, enemyId: EnemyID): number {
      const lifetime = playerStore.enemyKillCounts()[enemyId] ?? 0
      return lifetime - (store.stepKillBaselines()[questId]?.enemies[enemyId] ?? 0)
    },

    /** Wave kills since the quest reached its current step (lifetime when there is no baseline). */
    questWaveKills(questId: QuestID, zoneId: ZoneID, wave: number): number {
      const lifetime = playerStore.getKillCountByZoneAndWave(zoneId, wave)
      return lifetime - (store.stepKillBaselines()[questId]?.waves[waveKey(zoneId, wave)] ?? 0)
    },
  })),
  withMethods((store, playerStore = inject(PlayerStore)) => ({
      /** What `questId`'s requirements read; kill counts are since it reached its current step. */
      requirementContext(questId: QuestID): RequirementContext {
        return {
          stats: playerStore.stats(),
          progression: store.questStepProgression(),
          picks: store.orders()[questId]?.requirements ?? [],
          itemCount: id => playerStore.itemCount(id),
          enemyKills: enemyId => store.questEnemyKills(questId, enemyId),
          waveKills: (zoneId, wave) => store.questWaveKills(questId, zoneId, wave),
          professionLevel: id => playerStore.professionLevel(id),
          reputation: id => playerStore.reputation()[id] ?? 0,
          isZoneUnlocked: id => playerStore.isZoneUnlocked(id),
        }
      },
    }),
  ),
  withMethods((store) => ({
      /** How far a requirement is (`requirement-handlers.ts`). Met when `current >= target`. */
      requirementProgress(questId: QuestID, req: RequirementProps): Progress {
        return requirementProgress(req, store.requirementContext(questId))
      },

      /** The quest panel's lines for a requirement. */
      requirementRows(questId: QuestID, req: RequirementProps): RequirementRow[] {
        return requirementRows(req, store.requirementContext(questId))
      },
    }),
  ),
  withMethods((store) => ({
      /** The quest is active and its current step's requirements are met now. */
      isStepReady(questId: QuestID): boolean {
        return canAdvanceQuest(store.questStepProgression(), questId, req => {
          const { current, target } = store.requirementProgress(questId, req)
          return current >= target
        })
      },
    }),
  ),
  withMethods((store, playerStore = inject(PlayerStore)) => ({
      /** Milliseconds until the order's own turn-in cooldown is over; 0 when ready. */
      orderRemainingMs(questId: QuestID, now: number): number {
        return turnInRemainingMs(store.lastTurnInAt()[orderKey(questId)], playerStore.stats().turnInCooldownReduction, now)
      },
    }),
  ),
  withMethods((store, playerStore = inject(PlayerStore), gameClock = inject(GameClock)) => ({
      /** Runs `questTransition` and applies it: takes the items, writes the quest state and the kill baseline, pays. False when refused (nothing changes). */
      applyTransition(questId: QuestID, action: 'advance' | 'end', now: number): boolean {
        const transition = questTransition(questId, action, {
          questStepProgression: store.questStepProgression(),
          orders: store.orders(),
          lastTurnInAt: store.lastTurnInAt(),
          questCompletions: store.questCompletions(),
          pinnedQuests: store.pinnedQuests(),
        }, {
          now,
          settled: gameClock.isSettled(),
          stats: playerStore.stats(),
          itemCount: id => playerStore.itemCount(id),
          fits: (adds, removes) => playerStore.canGrant(adds, removes),
        })
        if (!transition) return false

        if (transition.take.length > 0) playerStore.removeItems(transition.take)
        patchState(store, transition.quests)
        store.setStepKillBaseline(questId, transition.baselineStep)
        if (transition.payout) store.handleQuestCompleted(questId, transition.payout)
        return true
      },
    }),
  ),
  withMethods((store) => ({
      /**
       * Ends a repeatable order, whichever dialogue route got here. Rejected (false), changing nothing, when the order
       * isn't active, the clock is unsettled, the player lacks the saved items, its cooldown is running or its rewards
       * don't fit. Otherwise it takes the items, pays the saved rewards, starts the cooldown and frees the quest for its next pick.
       */
      completeOrder(questId: QuestID, now: number): boolean {
        return !!QUEST_DATA[questId].repeat && store.applyTransition(questId, 'end', now)
      },
    }),
  ),
  withMethods((store, playerStore = inject(PlayerStore), gameClock = inject(GameClock)) => ({
      resetState(): void {
        patchState(store, initialState)
      },

      /**
       * No-op once started. Dialogue gates offers on `QuestState.available` for `startRequirements`. A repeatable order
       * also needs its cooldown over and an eligible pick; it rolls the pick and saves it at once so a reload can't re-roll.
       */
      startQuest(questId: QuestID) {
        if (store.questStepProgression()[questId] !== undefined) return

        const repeat = QUEST_DATA[questId].repeat
        if (repeat) {
          if (store.orderRemainingMs(questId, gameClock.nowMs()) > 0) return
          const eligible = repeat.pool.filter(entry =>
            playerStore.reputationTierOf(repeat.reputationId) >= entry.minTier
            && (!entry.sourceZones || entry.sourceZones.some(zone => playerStore.isZoneUnlocked(zone))))
          const order = rollOrder(repeat, eligible)
          if (!order) return
          patchState(store, (state) => ({ orders: { ...state.orders, [questId]: order } }))
        }

        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: 1 },
        }))
        if (repeat) saveGameStateNow()
        store.setStepKillBaseline(questId, 1)
      },

      getQuestStep(questId: QuestID) {
        return store.questStepProgression()[questId]
      },

      togglePin(questId: QuestID) {
        patchState(store, (state) => ({
          pinnedQuests: state.pinnedQuests.includes(questId)
            ? state.pinnedQuests.filter(id => id !== questId)
            : [...state.pinnedQuests, questId],
        }))
      },

      /** Starts the turn-in's cooldown. */
      recordTurnIn(key: TurnInKey, now: number) {
        patchState(store, (state) => ({ lastTurnInAt: { ...state.lastTurnInAt, [key]: now } }))
      },

      setDialogueFlag(flag: string) {
        patchState(store, (state) => ({
          dialogueFlags: { ...state.dialogueFlags, [flag]: true },
        }))
      },

      /** Takes the current step's items, then moves to the next step or completes. No-op unless the step is still ready and, on the last step, its rewards fit. */
      advanceQuest(questId: QuestID) {
        // Rechecked here: items can be used up between opening a turn-in node and confirming it.
        if (store.isStepReady(questId)) store.applyTransition(questId, 'advance', gameClock.nowMs())
      },

      /** Takes the current step's items and completes the quest from any step (`questTransition` refuses when it can't; `dev.completeQuest` skips the ready check). */
      endQuest(questId: QuestID) {
        store.applyTransition(questId, 'end', gameClock.nowMs())
      },

      hasQuestStarted(questId: QuestID) {
        return !!store.questStepProgression()[questId]
      },
    }),
  ),
)
