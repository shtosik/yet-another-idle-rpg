import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { SCENE_SPOTS, SceneSpots } from '../../../../../data/scene-spots'
import { maskColorAt, SceneSpotsService } from '../../../../services/scene-spots.service'
import { SCENE_SIZES, SceneKind } from '../scene-sizes'

/** A click at (offsetX, offsetY) in a box of `box` px, as a pixel of art `size` px. */
export function scenePoint(offsetX: number, offsetY: number, box: { width: number, height: number }, size: { width: number, height: number }) {
  return { x: offsetX / box.width * size.width, y: offsetY / box.height * size.height }
}

/**
 * The click layer of a Scene with spots (`SCENE_SPOTS`): reads the mask pixel under a click and uses that spot.
 * Draws nothing and has no hover or cursor, so the art alone gives a spot away. Project it under anything clickable.
 */
@Component({
  selector: 'app-scene-mask',
  template: `@if (spots(); as spots) { <div class="scene-mask" (click)="onClick($event, spots)"></div> }`,
  styles: `.scene-mask
    position: absolute
    inset: 0`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneMaskComponent {
  private sceneSpots = inject(SceneSpotsService)

  /** The art the Scene shows. */
  readonly artUrl = input.required<string>()
  readonly kind = input.required<SceneKind>()

  protected readonly spots = computed(() => {
    const entry = SCENE_SPOTS[this.artUrl()]
    return entry?.spots.length ? entry : null
  })

  protected async onClick(event: MouseEvent, { maskUrl, spots }: SceneSpots): Promise<void> {
    const box = event.currentTarget as HTMLElement
    const { x, y } = scenePoint(event.offsetX, event.offsetY, { width: box.clientWidth, height: box.clientHeight }, SCENE_SIZES[this.kind()])
    const color = maskColorAt(await this.sceneSpots.mask(maskUrl), x, y)
    const spot = spots.find(candidate => candidate.color === color)
    if (spot) this.sceneSpots.use(spot)
  }
}
