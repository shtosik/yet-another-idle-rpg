import { maskColorAt } from '../../../../services/scene-spots.service'
import { SCENE_SIZES } from '../scene-sizes'
import { scenePoint } from './scene-mask.component'

describe('scenePoint', () => {
  const zone = SCENE_SIZES.zone
  // A zone-sized mask: transparent, with a red spot at art pixels x 200–215, y 1240–1255.
  const data = new Uint8ClampedArray(zone.width * zone.height * 4)
  for (let y = 1240; y < 1256; y++) {
    for (let x = 200; x < 216; x++) data.set([255, 0, 0, 255], (y * zone.width + x) * 4)
  }
  const mask = { width: zone.width, height: zone.height, data }

  it('maps a click to the same art pixel and mask colour at any Scene size', () => {
    // The Scene is about 364×728 at 1536 wide and 180×360 at 1280 wide (docs/systems/scene.md).
    const big = scenePoint(91, 546, { width: 364, height: 728 }, zone)
    const small = scenePoint(45, 270, { width: 180, height: 360 }, zone)

    expect(big).toEqual({ x: 208, y: 1248 })
    expect(small).toEqual({ x: 208, y: 1248 })
    expect(maskColorAt(mask, big.x, big.y)).toBe('#ff0000')
    expect(maskColorAt(mask, small.x, small.y)).toBe('#ff0000')
    expect(maskColorAt(mask, scenePoint(10, 10, { width: 180, height: 360 }, zone).x, 40)).toBeNull()
  })
})
