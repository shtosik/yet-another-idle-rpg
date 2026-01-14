import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { AbbreviatePipe } from 'app/pipes/abbreviate.pipe'
import { CalculateXpPipe } from 'app/pipes/calculate-xp.pipe'
import { TranslatePipe } from 'app/pipes/i18next.pipe'
import { PlayerStore } from 'app/store/player/player.store'
import { StatToPercentagePipe } from '../../../pipes/stat-to-percentage.pipe'

@Component({
    selector: 'app-player-stats',
    templateUrl: 'player-stats.component.html',
    imports: [CommonModule, TranslatePipe, CalculateXpPipe, AbbreviatePipe, StatToPercentagePipe],
    styleUrls: ['./player-stats.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PlayerStatsComponent {
    playerStore = inject(PlayerStore)
    playerStats = this.playerStore.stats
}
