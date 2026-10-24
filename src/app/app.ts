import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core'
import { GameIntervalService } from './services/game-interval.service'
import { GameComponent } from './components/game/game.component'
import { VersionCheckService } from './services/version-check.service'
import { UpdateBannerComponent } from './components/shared/update-banner/update-banner.component'

@Component({
    selector: 'app-root',
    imports: [
        GameComponent,
        UpdateBannerComponent,
    ],
    templateUrl: './app.html',
    styleUrl: './app.sass',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
    private gameService = inject(GameIntervalService)
    private versionCheck = inject(VersionCheckService)

    async ngOnInit() {
        this.gameService.initGameLoop()
        this.versionCheck.start()
    }
}
