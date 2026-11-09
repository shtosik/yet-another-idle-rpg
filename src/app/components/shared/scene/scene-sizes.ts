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

/**
 * Where the enemy sprite stands on a battle Scene; the name and HP bar sit above it at a fixed size.
 * Low enough that the name clears the nav bar with a full task list at 1536, narrow enough to clear the side buttons at 1280.
 */
export const ENEMY_SPRITE_AREA: SceneArea = { left: 27, top: 50, width: 46, height: 26 }

/**
 * Battle HUD over the Scene, each rect the largest it gets at 1280–1536 wide (measured in the app).
 * The nav bar and footer only reach the Scene at 1536; the side buttons and the name block cover most at 1280.
 * No Scene mask spot may sit inside one (`npm run validate`).
 */
export const BATTLE_HUD_AREAS: Record<string, SceneArea> = {
  navBar: { left: 0, top: 0, width: 100, height: 23 },
  footer: { left: 0, top: 85, width: 100, height: 15 },
  sideButtons: { left: 73, top: 27, width: 27, height: 73 },
  enemyInfo: { left: ENEMY_SPRITE_AREA.left, top: 0, width: ENEMY_SPRITE_AREA.width, height: ENEMY_SPRITE_AREA.top },
  enemySprite: ENEMY_SPRITE_AREA,
}

/**
 * Town, Building and Site HUD over the Scene (the panel is a fixed 776×320, so one size). The title covers the
 * longest town name with its reputation tier; NPC frames move with their data, so they come from `npcFrameArea`.
 */
export const BUILDING_HUD_AREAS: Record<string, SceneArea> = {
  title: { left: 0, top: 0, width: 35, height: 17 },
  closeButton: { left: 91, top: 0, width: 9, height: 19 },
}

/** An NPC frame (portrait, cooldown and shop button) centred on its `position`, in % of a building Scene. */
export function npcFrameArea(position: { x: number, y: number }): SceneArea {
  const width = 17
  const height = 57
  return { left: position.x - width / 2, top: position.y - height / 2, width, height }
}
