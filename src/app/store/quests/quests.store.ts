import { QuestProgression } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'

export interface QuestState {
  questStepProgression: QuestProgression
  dialogueFlags: Record<string, boolean>
}

export const initialState: QuestState = {
  questStepProgression: {},
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

      setDialogueFlag(flag: string) {
        patchState(store, (state) => ({
          dialogueFlags: { ...state.dialogueFlags, [flag]: true },
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
