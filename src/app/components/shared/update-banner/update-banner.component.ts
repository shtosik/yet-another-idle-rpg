import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { VersionCheckService } from '../../../services/version-check.service'
import { APP_VERSION } from '../../../version'

/** Tells the player a newer build is deployed and offers a reload. */
@Component({
    selector: 'app-update-banner',
    templateUrl: './update-banner.component.html',
    styleUrl: './update-banner.component.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [I18nextPipe],
})
export class UpdateBannerComponent {
    private readonly versionCheck = inject(VersionCheckService)

    readonly available = this.versionCheck.available
    readonly currentVersion = APP_VERSION
    readonly saveFailed = signal(false)

    reload(): void {
        this.saveFailed.set(!this.versionCheck.reload())
    }
}
