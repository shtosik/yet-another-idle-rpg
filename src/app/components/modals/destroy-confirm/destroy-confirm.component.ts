import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { InventoryItem } from '../../../../interfaces/item.interface'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { ItemTier } from '../../../../enums/items/item-tier.enum'

/** Asks before an inventory stack is destroyed; closes with true on confirm. */
@Component({
    selector: 'app-destroy-confirm',
    templateUrl: './destroy-confirm.component.html',
    styleUrl: './destroy-confirm.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nextPipe, CloseButtonComponent],
})
export class DestroyConfirmComponent {
    private readonly modalRef = inject<MatDialogRef<DestroyConfirmComponent, boolean>>(MatDialogRef)
    readonly item = inject<InventoryItem>(MAT_DIALOG_DATA)
    protected readonly ItemID = ItemID
    protected readonly ItemTier = ItemTier

    confirm(): void {
        this.modalRef.close(true)
    }

    cancel(): void {
        this.modalRef.close(false)
    }
}
