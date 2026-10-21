import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core'
import { GameTab } from 'enums/ids/game-tab.enum'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../store/player/player.store'

@Component({
    selector: 'app-game-menu',
    templateUrl: 'game-menu.component.html',
    styleUrls: ['./game-menu.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, I18nextPipe],
})

export class GameMenuComponent {
    playerStore = inject(PlayerStore)
    skillPoints = this.playerStore.stats.unspentSkillPoints
    level = this.playerStore.stats.level

    @Output() changeTab = new EventEmitter<GameTab>()

    readonly GameTab = GameTab
}
