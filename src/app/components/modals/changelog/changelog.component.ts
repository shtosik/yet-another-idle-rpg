import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { APP_VERSION } from '../../../version'
import { parseChangelog } from './changelog'
// The file's text (`.md` loader in angular.json). This component is loaded on demand, so the text stays out of
// the initial bundle. The notes are English only; the labels around them are translated.
import CHANGELOG from '../../../../../CHANGELOG.md'

@Component({
    selector: 'app-changelog',
    templateUrl: './changelog.component.html',
    styleUrl: './changelog.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nextPipe, CloseButtonComponent],
})
export class ChangelogComponent {
    private readonly modalRef = inject(MatDialogRef)

    readonly releases = parseChangelog(CHANGELOG)
    readonly currentVersion = APP_VERSION

    close(): void {
        this.modalRef.close()
    }
}
