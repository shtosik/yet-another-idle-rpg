import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { StationID } from '../../../../../enums/ids/station-id.enum'

const PATHS: Record<StationID, string[]> = {
  [StationID.workbench]: ['M14 10 4.5 19.5a2.1 2.1 0 0 1-3-3L11 7', 'm10 6 4-4 8 8-4 4z'],
  [StationID.cooking]: ['M12 2c1 3 5 6 5 11a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3.5 2.5 3.5 0-3.5-1-6 0-9.5z'],
  [StationID.alchemy]: ['M9 2h6', 'M10 2v7L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V2', 'M7 15h10'],
  [StationID.runeAltar]: ['M12 2 20 12 12 22 4 12z', 'M12 7v10', 'm9 10 3 3 3-3'],
}

/** Stroke icon per station, drawn in `currentColor`. Used on Camp tabs and quick-craft buttons. */
@Component({
  selector: 'app-station-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: inline-flex' },
  template: `
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      [attr.height]="size()"
      [attr.width]="size()"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d"/>
      }
    </svg>
  `,
})
export class StationIconComponent {
  stationId = input.required<StationID>()
  size = input(16)

  protected paths = computed(() => PATHS[this.stationId()])
}
