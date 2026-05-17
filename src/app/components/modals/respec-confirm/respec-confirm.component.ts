import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { PlayerManagerService } from '../../../services/player-manager.service'

@Component({
    selector: 'app-respec-confirm',
    templateUrl: './respec-confirm.component.html',
    styleUrl: './respec-confirm.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [TranslatePipe, CloseButtonComponent],
})
export class RespecConfirmComponent {
    private readonly modalRef = inject(MatDialogRef)
    private readonly playerManagerService = inject(PlayerManagerService)

    preview = computed(() => this.playerManagerService.respecPreview())

    canExecute = computed(() => {
        const p = this.preview()
        return p.allocatedLevels > 0 && p.canAfford
    })

    confirm(): void {
        if (!this.canExecute()) return
        this.playerManagerService.respecEntireTree()
        this.modalRef.close()
    }

    cancel(): void {
        this.modalRef.close()
    }
}
