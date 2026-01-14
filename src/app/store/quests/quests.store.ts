import { QuestProgression } from '../../../types/quests/quest-progression.type'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { withStorageSync } from '@angular-architects/ngrx-toolkit'

export interface QuestState {
    questStepProgression: QuestProgression
}

export const initialState: QuestState = {
    questStepProgression: {},
}

export const QuestsStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withStorageSync({
        key: 'questsStore',
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
        }),
    ),
)
