import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../../store/player/player.store'
import { TitleID } from '../../../../../enums/ids/title-id.enum'

/** Picks which earned title the stats panel shows. Hidden until a title is earned. */
@Component({
  selector: 'app-title-picker',
  templateUrl: './title-picker.component.html',
  styleUrl: './title-picker.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
})
export class TitlePickerComponent {
  private playerStore = inject(PlayerStore)

  protected readonly TitleID = TitleID
  earnedTitles = this.playerStore.earnedTitles
  selectedTitle = this.playerStore.selectedTitle

  select(value: string): void {
    this.playerStore.selectTitle(value === '' ? null : Number(value) as TitleID)
  }
}
