import { Injectable } from '@angular/core'
import { APP_VERSION } from '../version'
import {
    checkImportedSave,
    exportGameSaves,
    replaceGameSaves,
} from '../store/helpers/with-game-state-sync.hook'

const SAVE_FILE_GAME = 'yari'

/** A save file: every synced store's raw `localStorage` value, plus where it came from. */
export interface SaveFile {
    game: typeof SAVE_FILE_GAME
    /** Game version that exported it. */
    appVersion: string
    /** ISO time of the export. */
    exportedAt: string
    saves: Record<string, string>
}

/** A file that passed the checks, and how many of its stores this build would start fresh (older save versions). */
export interface SaveImport {
    file: SaveFile
    outdatedStores: number
}

/** `errorKey` is a full i18n key. */
export type SaveFileReadResult = { ok: true, import: SaveImport } | { ok: false, errorKey: string }

const error = (reason: string): SaveFileReadResult => ({ ok: false, errorKey: `app:settings.saves.errors.${reason}` })

/** Save export to a file and import from one (Settings tab, docs/systems/persistence.md). */
@Injectable({ providedIn: 'root' })
export class SaveTransferService {
    /** Downloads `yari-save-v<version>-<date>.json`. False when the current progress couldn't be saved first. */
    exportToFile(): boolean {
        const saves = exportGameSaves()
        if (!saves) return false
        const file: SaveFile = {
            game: SAVE_FILE_GAME,
            appVersion: APP_VERSION,
            exportedAt: new Date().toISOString(),
            saves,
        }
        const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `yari-save-v${APP_VERSION}-${file.exportedAt.slice(0, 10)}.json`
        link.click()
        // Revoked after the click is handled: some browsers cancel a download whose URL is revoked at once.
        setTimeout(() => URL.revokeObjectURL(url))
        return true
    }

    /**
     * Reads and checks a chosen file; nothing is written yet. A save from a newer build is refused: this build
     * would run that store from scratch and look like lost progress.
     */
    async readFile(blob: Blob): Promise<SaveFileReadResult> {
        let data: Partial<SaveFile>
        try {
            data = JSON.parse(await blob.text())
        } catch {
            return error('notJson')
        }
        if (data?.game !== SAVE_FILE_GAME || typeof data.saves !== 'object' || data.saves === null) {
            return error('notSave')
        }

        const checked = Object.entries(data.saves)
            .map(([key, raw]) => ({ key, raw, kind: checkImportedSave(key, raw) }))
            .filter(save => save.kind !== 'unknown')
        if (!checked.length) return error('notSave')
        if (checked.some(save => save.kind === 'unreadable')) return error('corrupt')
        if (checked.some(save => save.kind === 'newer')) return error('newerVersion')

        return {
            ok: true,
            import: {
                file: {
                    game: SAVE_FILE_GAME,
                    appVersion: String(data.appVersion ?? '?'),
                    exportedAt: String(data.exportedAt ?? ''),
                    saves: Object.fromEntries(checked.map(save => [save.key, save.raw as string])),
                },
                outdatedStores: checked.filter(save => save.kind === 'outdated').length,
            },
        }
    }

    /**
     * Replaces the current progress with the file's and reloads. Stores the file lacks start fresh.
     * False when storage couldn't take it; the current progress is kept and the page doesn't reload.
     */
    importFile(file: SaveFile): boolean {
        if (!replaceGameSaves(file.saves)) return false
        location.reload()
        return true
    }
}
