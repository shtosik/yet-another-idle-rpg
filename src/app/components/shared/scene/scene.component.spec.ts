import { Component, provideZonelessChangeDetection, signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SceneComponent } from './scene.component'
import { SCENE_SIZES, SceneKind } from './scene-sizes'

@Component({
  imports: [SceneComponent],
  template: `
    <app-scene [kind]="kind()" url="" [style.width.px]="width()" [style.height.px]="height()">
      <div class="marker" style="position: absolute; left: 25%; top: 60%; width: 10%; height: 10%"></div>
    </app-scene>
  `,
})
class SceneHostComponent {
  readonly kind = signal<SceneKind>('zone')
  readonly width = signal(800)
  readonly height = signal(300)
}

describe('Scene', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
  })

  async function render(kind: SceneKind, width: number, height: number) {
    const fixture = TestBed.createComponent(SceneHostComponent)
    fixture.componentInstance.kind.set(kind)
    fixture.componentInstance.width.set(width)
    fixture.componentInstance.height.set(height)
    document.body.appendChild(fixture.nativeElement)
    await fixture.whenStable()
    const element: HTMLElement = fixture.nativeElement
    const host = element.querySelector('app-scene')!.getBoundingClientRect()
    const scene = element.querySelector('.scene')!.getBoundingClientRect()
    const marker = element.querySelector('.marker')!.getBoundingClientRect()
    fixture.destroy()
    return { host, scene, marker }
  }

  for (const kind of ['zone', 'building'] as const) {
    const ratio = SCENE_SIZES[kind].width / SCENE_SIZES[kind].height

    it(`keeps the ${kind} ratio and fits, centred, in a wide and a narrow host`, async () => {
      for (const [width, height] of [[1600, 300], [200, 900]]) {
        const { host, scene } = await render(kind, width, height)
        expect(scene.width / scene.height).toBeCloseTo(ratio, 2)
        expect(Math.min(host.width - scene.width, host.height - scene.height)).toBeCloseTo(0, 0)
        expect(scene.left - host.left).toBeCloseTo(host.right - scene.right, 0)
        expect(scene.top - host.top).toBeCloseTo(host.bottom - scene.bottom, 0)
      }
    })

    it(`puts a % position on the same ${kind} art spot in a wide and a narrow host`, async () => {
      const spots = []
      for (const [width, height] of [[1600, 300], [200, 900]]) {
        const { scene, marker } = await render(kind, width, height)
        spots.push([(marker.left - scene.left) / scene.width, (marker.top - scene.top) / scene.height, marker.width / scene.width])
      }
      expect(spots[0][0]).toBeCloseTo(0.25, 3)
      expect(spots[0][1]).toBeCloseTo(0.6, 3)
      for (const [i, value] of spots[0].entries()) {
        expect(spots[1][i]).toBeCloseTo(value, 3)
      }
    })
  }
})
