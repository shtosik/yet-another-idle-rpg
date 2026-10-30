import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DecimalPipe } from '@angular/common'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { DurationPipe } from '../../../pipes/duration.pipe'
import { CloseButtonComponent } from '../../shared/close-button/close-button.component'
import { SlotComponent } from '../../shared/slot/slot.component'
import { InventoryItemComponent } from '../../game/inventory/inventory-slot/inventory-slot.component'
import { ArenaResult, ArenaService } from '../../../services/arena.service'
import { BattleStore } from '../../../store/battle/battle.store'
import ITEM_DATA from '../../../../data/items-data'

@Component({
  selector: 'app-arena-result',
  templateUrl: './arena-result.component.html',
  styleUrl: './arena-result.component.sass',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [I18nextPipe, DurationPipe, CloseButtonComponent, SlotComponent, InventoryItemComponent, DecimalPipe],
})
export class ArenaResultComponent {
  private modalRef = inject(MatDialogRef)
  private arenaService = inject(ArenaService)
  readonly result = inject<ArenaResult>(MAT_DIALOG_DATA)

  readonly timeSeconds = Math.floor(this.result.timeMs / 1000)
  readonly rewards = inject(BattleStore).arenaRewards
  readonly canClaim = this.arenaService.canClaimRewards

  protected readonly ITEM_DATA = ITEM_DATA

  claim(): void {
    if (this.arenaService.claimRewards()) this.close()
  }

  close(): void {
    this.modalRef.close()
  }
}
