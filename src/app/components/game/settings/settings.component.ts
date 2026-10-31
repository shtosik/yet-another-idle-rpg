import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { ModalService } from '../../../services/modal.service'
import { SaveImport, SaveTransferService } from '../../../services/save-transfer.service'
import { APP_VERSION } from '../../../version'
import { SettingsStore } from '../../../store/settings/settings.store'
import { ItemTier } from '../../../../enums/items/item-tier.enum'

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
    protected readonly settingsStore = inject(SettingsStore)
    protected readonly ItemTier = ItemTier
    readonly tiers = Object.values(ItemTier).filter((tier): tier is ItemTier => typeof tier === 'number')

    /** A checked file waiting for the player to confirm that it replaces their progress. */
    readonly pendingImport = signal<SaveImport | null>(null)
    /** Full i18n key of the last export or import error. */
    readonly errorKey = signal<string | null>(null)
    readonly exported = signal(false)

    /** Bumped per file pick, so a slower read of an earlier pick can't replace a newer one. */
    private pickId = 0

    setDestroyTier(value: string): void {
        this.settingsStore.setConfirmDestroyFromTier(Number(value))
    }

    openChangelog(): void {
        this.modalService.openChangelog()
    }

    exportSave(): void {
        const exported = this.saveTransfer.exportToFile()
        this.exported.set(exported)
        this.errorKey.set(exported ? null : 'app:settings.saves.errors.exportFailed')
    }

    async chooseFile(input: HTMLInputElement): Promise<void> {
        const blob = input.files?.[0]
        // Cleared so picking the same file again fires `change`.
        input.value = ''
        if (!blob) return

        const pickId = ++this.pickId
        // The previous pick can't be confirmed while this one is read.
        this.pendingImport.set(null)
        this.errorKey.set(null)
        this.exported.set(false)
        const result = await this.saveTransfer.readFile(blob)
        if (pickId !== this.pickId) return
        this.pendingImport.set('import' in result ? result.import : null)
        this.errorKey.set('errorKey' in result ? result.errorKey : null)
    }

    confirmImport(): void {
        const pending = this.pendingImport()
        if (!pending || this.saveTransfer.importFile(pending.file)) return
        this.pendingImport.set(null)
        this.errorKey.set('app:settings.saves.errors.importFailed')
    }

    cancelImport(): void {
        this.pendingImport.set(null)
    }

    exportedAtLabel(pending: SaveImport): string {
        const date = new Date(pending.file.exportedAt)
        return isNaN(date.getTime()) ? '?' : date.toLocaleString()
    }
}
