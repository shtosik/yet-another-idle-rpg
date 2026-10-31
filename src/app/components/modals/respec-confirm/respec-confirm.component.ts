import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { SkillTreeService } from '../../../services/skill-tree.service'
import { tabName } from '../../game/inventory/tab-text'

@Component({
    selector: 'app-respec-confirm',
    templateUrl: './respec-confirm.component.html',
    styleUrl: './respec-confirm.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nextPipe, CloseButtonComponent],
})
export class RespecConfirmComponent {
    private readonly modalRef = inject(MatDialogRef)
    private readonly skillTreeService = inject(SkillTreeService)

    preview = computed(() => this.skillTreeService.respecPreview())
    blockedTabName = computed(() => {
        const tab = this.preview().inventoryBlockedTab
        return tab && tabName(tab)
    })

    canExecute = computed(() => {
        const p = this.preview()
        return p.allocatedLevels > 0 && p.canAfford && !p.inventoryBlockedTab
    })

    confirm(): void {
        if (!this.canExecute()) return
        this.skillTreeService.respecEntireTree()
        this.modalRef.close()
    }

    cancel(): void {
        this.modalRef.close()
    }
}
