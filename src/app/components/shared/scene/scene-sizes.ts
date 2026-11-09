/** Which art a Scene shows; every background of a kind has the same pixel size. */
export type SceneKind = 'zone' | 'building'

/** Pixel size of every background of each kind (`docs/systems/scene.md`); `npm run validate` checks the files. */
export const SCENE_SIZES: Record<SceneKind, { width: number, height: number }> = {
  zone: { width: 832, height: 1248 },
  building: { width: 1376, height: 566 },
}

/** A rect on a Scene in percent of its art. */
export interface SceneArea {
  left: number
  top: number
  width: number
  height: number
}
