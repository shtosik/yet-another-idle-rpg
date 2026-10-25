import { ChangeDetectionStrategy, Component, ElementRef, signal, viewChildren } from '@angular/core'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { QuestListComponent } from './quest-list/quest-list.component'
import { ReputationComponent } from './reputation/reputation.component'

type PanelTab = 'quests' | 'reputation'

const TABS: PanelTab[] = ['quests', 'reputation']

/** The panel on the right: tabs, each tab its own component. */
@Component({
  selector: 'app-quests',
  templateUrl: 'quests.component.html',
  styleUrls: ['./quests.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, QuestListComponent, ReputationComponent],
})
export class QuestsComponent {
  protected readonly TABS = TABS

  tab = signal<PanelTab>('quests')

  private tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton')

  selectTab(tab: PanelTab): void {
    this.tab.set(tab)
  }

  /** Arrow keys, Home and End move between tabs (roving tabindex). */
  onTabKeydown(event: KeyboardEvent): void {
    const index = TABS.indexOf(this.tab())
    let next: number
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % TABS.length
        break
      case 'ArrowLeft':
        next = (index - 1 + TABS.length) % TABS.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = TABS.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    this.selectTab(TABS[next])
    this.tabButtons()[next]?.nativeElement.focus()
  }
}
