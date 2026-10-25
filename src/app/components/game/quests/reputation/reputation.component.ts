import { ChangeDetectionStrategy, Component } from '@angular/core'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'

/** Reputation tab of the quest panel. Empty until reputation types exist (docs/ideas/quest-panel.md). */
@Component({
  selector: 'app-reputation',
  template: `<p class="empty">{{ 'quests:panel.reputationEmpty' | i18next }}</p>`,
  styles: `
.empty
  color: #a3a3a3
`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe],
})
export class ReputationComponent {}
