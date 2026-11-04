import { Directive, inject, input } from '@angular/core'
import { ForgeSelection } from '../services/forge-selection'
import { MergeSource } from '../store/player/merge'

@Directive({
  selector: '[appForgeDrag]',
  host: {
    '[attr.draggable]': 'forge.open() && !!appForgeDrag()',
    '(dragstart)': 'start($event)',
    '(dragend)': 'forge.dragged.set(null)',
  },
})
export class ForgeDrag {
  protected readonly forge = inject(ForgeSelection)
  readonly appForgeDrag = input.required<MergeSource | null>()

  start(event: DragEvent): void {
    const source = this.appForgeDrag()
    if (!this.forge.open() || !source || !event.dataTransfer) {
      event.preventDefault()
      return
    }
    this.forge.dragged.set(source)
    event.dataTransfer.effectAllowed = 'copy'
    // Firefox needs data to start a native drag. Source identity stays typed and in memory.
    event.dataTransfer.setData('text/plain', 'forge-item')
  }
}
