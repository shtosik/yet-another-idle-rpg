import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { DialogueModalComponent } from './dialogue-modal.component'
import NPC_Data from '../../../../data/npc-data'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { QuestsStore } from '../../../store/quests/quests.store'
import { NpcID } from '../../../../enums/map/npc-id.enum'

@Component({
    selector: 'app-dialogue-modal-container',
    template: `
        <app-dialogue-modal
            [npc]="npc"
            [dialogue]="dialogue"
            [questProgressions]="questProgressions()"
            (startQuest)="startQuest($event)"
            (close)="close()"
        />`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogueModalComponent,

    ],
})
export class DialogueModalContainer {
    questsStore = inject(QuestsStore)
    dialogRef = inject(MatDialogRef<DialogueModalContainer>)
    data: { npcId: NpcID } = inject(MAT_DIALOG_DATA)
    npc = NPC_Data[this.data.npcId]
    dialogue = this.npc.dialogue
    questProgressions = this.questsStore.questStepProgression

    close() {
        this.dialogRef.close()
    }

    startQuest(questId: QuestID) {
        this.questsStore.startQuest(questId)
    }
}
