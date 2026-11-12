import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { UrlPipe } from '../../../pipes/url.pipe'
import { SCENE_SIZES, SceneKind } from './scene-sizes'

/**
 * Shows background art whole at its kind's fixed shape, centred in the host and scaled as one piece,
 * over a blurred Scene fill. Projected content is positioned in % of the art, so it stays on its spot at any host size.
 */
@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UrlPipe],
  host: {
    '[style.--scene-width]': 'size().width',
    '[style.--scene-height]': 'size().height',
  },
})
export class SceneComponent {
  readonly url = input.required<string>()
  readonly kind = input.required<SceneKind>()

  protected readonly size = computed(() => SCENE_SIZES[this.kind()])
}
