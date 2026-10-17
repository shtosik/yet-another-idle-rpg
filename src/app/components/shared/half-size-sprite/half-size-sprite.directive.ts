import { Directive, signal } from '@angular/core'

/** Renders an `<img>` at half its intrinsic pixel size, so sprites of any size display at their natural scale. */
@Directive({
  selector: 'img[appHalfSizeSprite]',
  host: {
    '[style.width.px]': 'width()',
    '[style.height.px]': 'height()',
    '(load)': 'onLoad($event)',
  },
})
export class HalfSizeSpriteDirective {
  protected readonly width = signal<number | null>(null)
  protected readonly height = signal<number | null>(null)

  protected onLoad(event: Event): void {
    const img = event.target as HTMLImageElement
    this.width.set(img.naturalWidth / 2)
    this.height.set(img.naturalHeight / 2)
  }
}
