import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { ModalService } from '../../../services/modal.service'
import { SaveImport, SaveTransferService } from '../../../services/save-transfer.service'
import { APP_VERSION } from '../../../version'

/** Settings tab: game version and changelog, save export and import. */
@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nextPipe],
})
export class SettingsComponent {
    private readonly modalService = inject(ModalService)
    private readonly saveTransfer = inject(SaveTransferService)

    readonly version = APP_VERSION

    /** A checked file waiting for the player to confirm that it replaces their progress. */
    readonly pendingImport = signal<SaveImport | null>(null)
    readonly importErrorKey = signal<string | null>(null)
    readonly exported = signal(false)

    openChangelog(): void {
        this.modalService.openChangelog()
    }

    exportSave(): void {
        this.saveTransfer.exportToFile()
        this.exported.set(true)
    }

    async chooseFile(input: HTMLInputElement): Promise<void> {
        const blob = input.files?.[0]
        // Cleared so picking the same file again fires `change`.
        input.value = ''
        if (!blob) return

        this.exported.set(false)
        const result = await this.saveTransfer.readFile(blob)
        this.pendingImport.set('import' in result ? result.import : null)
        this.importErrorKey.set('errorKey' in result ? result.errorKey : null)
    }

    confirmImport(): void {
        const pending = this.pendingImport()
        if (pending) this.saveTransfer.importFile(pending.file)
    }

    cancelImport(): void {
        this.pendingImport.set(null)
    }

    exportedAtLabel(pending: SaveImport): string {
        const date = new Date(pending.file.exportedAt)
        return isNaN(date.getTime()) ? '?' : date.toLocaleString()
    }
}
