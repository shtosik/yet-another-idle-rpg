import { QuestProgression } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import QUEST_DATA, { QUEST_STEP_AFTER_COMPLETED, QuestProps } from '../../../data/quests-data'
import { inject } from '@angular/core'
import { ModalService } from '../../services/modal.service'
import { PlayerStore } from '../player/player.store'
import { InventoryItem } from '../../../interfaces/item.interface'
import ITEM_DATA from '../../../data/items-data'

export interface QuestState {
  questStepProgression: QuestProgression
  completedQuests: Partial<Record<QuestID, boolean>>
  dialogueFlags: Record<string, boolean>
}

export const initialState: QuestState = {
  questStepProgression: {},
  completedQuests: {},
  dialogueFlags: {},
}

const STORE_KEY = 'questsStore'

export const QuestsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withStorageSync({
    key: STORE_KEY,
    autoSync: true,
  }),
  withMethods((
    store,
    modalService = inject(ModalService),
    playerStore = inject(PlayerStore),
  ) => ({
    handleQuestCompleted(data: QuestProps) {
      const statsToUpdate = []
      const itemsToUpdate: InventoryItem[] = []

      data.rewards.forEach((reward) => {
        switch (reward.type) {
          case 'stat':
            statsToUpdate.push({ stat: reward.key, amount: reward.amount })
            break
          case 'item':
            const itemData = ITEM_DATA[reward.itemId]
            itemsToUpdate.push({ id: reward.itemId, amount: reward.amount, tier: itemData.tier, type: itemData.type })
            break
        }
      })

      patchState(store, (state) => ({
        completedQuests: { ...state.completedQuests, [data.questId]: true },
      }))

      modalService.openQuestCompleted(data)
      playerStore.updatePlayerStats(statsToUpdate)
      playerStore.updatePlayerInventory(itemsToUpdate)
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
      },

      getQuestStep(questId: QuestID) {
        return store.questStepProgression()[questId]
      },

      getQuestStepData(questId: QuestID, step: number) {
        return QUEST_DATA[questId].steps[step - 1] // -1 because its 0-indexed, but saved steps start from 1
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

      hasQuestStarted(questId: QuestID) {
        return !!store.questStepProgression()[questId]
      },

      checkStep(questId: QuestID, step?: number) {
        const isQuestActive = store.questStepProgression()[questId]

        if (step) {
          return isQuestActive && isQuestActive === step
        }

        return !!isQuestActive
      },
    }),
  ),
)
