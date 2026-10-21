import { QuestProgression } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED, QuestProps } from '../../../data/quests-data'
import { inject } from '@angular/core'
import { ModalService } from '../../services/modal.service'
import { PlayerStore } from '../player/player.store'
import { ItemStack } from '../player/inventory'
import { ENTRANCE_ZONES_BY_QUEST } from '../../../data/helpers/entrance-zones'

export interface QuestsState {
  questStepProgression: QuestProgression
  dialogueFlags: Record<string, boolean>
}

export const initialState: QuestsState = {
  questStepProgression: {},
  dialogueFlags: {},
}

const STORE_KEY = 'questsStore'

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
  })),
  withMethods((store) => ({
      resetState(): void {
        patchState(store, initialState)
      },

      startQuest(questId: QuestID) {
        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: 1 },
        }))
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

      advanceQuest(questId: QuestID) {
        let currentProgress = store.questStepProgression()[questId]
        const questData = QUEST_DATA[questId]
        currentProgress++

        if (currentProgress > questData.steps.length) {
          currentProgress = QUEST_STEP_AFTER_COMPLETED
          store.handleQuestCompleted(questData)
        }

        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: currentProgress },
        }))
      },

      endQuest(questId: QuestID) {
        const questData = QUEST_DATA[questId]
        patchState(store, (state) => ({
          questStepProgression: { ...state.questStepProgression, [questId]: QUEST_STEP_AFTER_COMPLETED },
        }))
        store.handleQuestCompleted(questData)
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
