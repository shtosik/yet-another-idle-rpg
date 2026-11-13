import { SCENE_SIZES } from '../scene-sizes'
import { scenePoint } from './scene-mask.component'

describe('scenePoint', () => {
  const zone = SCENE_SIZES.zone

  it('maps a click to the same art pixel at any Scene size', () => {
    // The same spot of the art, clicked on the 1536-wide and the 1280-wide Scene.
    expect(scenePoint(91, 546, { width: 364, height: 728 }, zone)).toEqual({ x: 208, y: 1248 })
    expect(scenePoint(45, 270, { width: 180, height: 360 }, zone)).toEqual({ x: 208, y: 1248 })
  })
})
