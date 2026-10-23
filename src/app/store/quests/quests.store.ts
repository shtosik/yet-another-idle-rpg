import { QuestProgression, QuestStep } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED, QuestProps } from '../../../data/quests-data'
import { inject } from '@angular/core'
import { ModalService } from '../../services/modal.service'
import { PlayerStore } from '../player/player.store'
import { ItemStack } from '../player/inventory'
import { ENTRANCE_ZONES_BY_QUEST } from '../../../data/helpers/entrance-zones'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { getQuestStatus, getStepItems } from '../../services/quest-status'

/** Lifetime kill counters at the moment the quest reached its current step. */
export interface KillBaseline {
  enemies: Partial<Record<EnemyID, number>>
  waves: Record<string, number> // key: waveKey(zoneId, wave)
}

export interface QuestsState {
  questStepProgression: QuestProgression
  stepKillBaselines: Partial<Record<QuestID, KillBaseline>>
  dialogueFlags: Record<string, boolean>
}

export const initialState: QuestsState = {
  questStepProgression: {},
  stepKillBaselines: {},
  dialogueFlags: {},
}

const STORE_KEY = 'questsStore'

const waveKey = (zoneId: ZoneID, wave: number) => `${zoneId}-${wave}`

export const QuestsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withMethods((
    store,
    modalService = inject(ModalService),
    playerStore = inject(PlayerStore),
  ) => ({
    handleQuestCompleted(data: QuestProps) {
      const statsToUpdate = []
      const itemsToUpdate: ItemStack[] = []

      data.rewards.forEach((reward) => {
        switch (reward.type) {
          case 'stat':
            statsToUpdate.push({ stat: reward.key, amount: reward.amount })
            break
          case 'item':

            itemsToUpdate.push({ id: reward.itemId, amount: reward.amount })
            break
        }
      })

      modalService.openQuestCompleted(data)
      playerStore.updatePlayerStats(statsToUpdate)
      playerStore.addItems(itemsToUpdate)
    },

    /** Zones entered from a town building open when that building's quest starts. */
    unlockEntranceZones(questId: QuestID) {
      ENTRANCE_ZONES_BY_QUEST[questId]?.forEach(zoneId => playerStore.unlockZone(zoneId))
    },

    /** A turn-in consumes the step's item requirements, so dialogue never restates them. */
    takeStepItems(questId: QuestID, step: QuestStep) {
      const items = getStepItems(questId, step)
      if (items.length > 0) playerStore.removeItems(items)
    },

    /** Kill requirements count from the moment the quest reaches a step; `null` drops the baseline. */
    setStepKillBaseline(questId: QuestID, step: QuestStep | null) {
      const baseline: KillBaseline = { enemies: {}, waves: {} }
      const requirements = step === null ? [] : QUEST_DATA[questId].steps[step - 1].requirements

      for (const req of requirements) {
        if (req.type === 'enemy') {
          baseline.enemies[req.enemyId] = playerStore.enemyKillCounts()[req.enemyId] ?? 0
        } else if (req.type === 'wave') {
          baseline.waves[waveKey(req.zoneId, req.wave)] = playerStore.getKillCountByZoneAndWave(req.zoneId, req.wave)
        }
      }

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
  withMethods((store) => ({
      resetState(): void {
        patchState(store, initialState)
      },

      /** No-op once started. Dialogue gates offers on `QuestState.available` for `startRequirements`. */
      startQuest(questId: QuestID) {
        if (store.questStepProgression()[questId] !== undefined) return

        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: 1 },
        }))
        store.setStepKillBaseline(questId, 1)
        store.unlockEntranceZones(questId)
      },

      getQuestStep(questId: QuestID) {
        return store.questStepProgression()[questId]
      },

      setDialogueFlag(flag: string) {
        patchState(store, (state) => ({
          dialogueFlags: { ...state.dialogueFlags, [flag]: true },
        }))
      },

      /** Takes the current step's items, then moves to the next step or completes. No-op unless active. */
      advanceQuest(questId: QuestID) {
        const status = getQuestStatus(store.questStepProgression(), questId)
        if (status.state !== QuestState.active) return

        const questData = QUEST_DATA[questId]
        const completes = status.step >= questData.steps.length
        const nextStep = completes ? QUEST_STEP_AFTER_COMPLETED : status.step + 1

        store.takeStepItems(questId, status.step)
        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: nextStep },
        }))
        store.setStepKillBaseline(questId, completes ? null : nextStep)
        if (completes) store.handleQuestCompleted(questData)
      },

      /** Takes the current step's items and completes the quest from any step. No-op unless active. */
      endQuest(questId: QuestID) {
        const status = getQuestStatus(store.questStepProgression(), questId)
        if (status.state !== QuestState.active) return

        store.takeStepItems(questId, status.step)
        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: QUEST_STEP_AFTER_COMPLETED },
        }))
        store.setStepKillBaseline(questId, null)
        store.handleQuestCompleted(QUEST_DATA[questId])
      },

      hasQuestStarted(questId: QuestID) {
        return !!store.questStepProgression()[questId]
      },
    }),
  ),
  withHooks((store) => ({
    // Re-applies entrance zone unlocks on load, like UNLOCK_RULES in PlayerStore.
    onInit() {
      for (const key of Object.keys(store.questStepProgression())) {
        store.unlockEntranceZones(Number(key) as QuestID)
      }
    },
  })),
)
