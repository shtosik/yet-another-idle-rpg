import { ItemID } from 'enums/ids/item-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { TownID } from 'enums/map/town-id.enum'

export interface WaveReachedCondition {
  type: 'waveReached'
  zoneId: ZoneID
  wave: number
}

export interface HasItemCondition {
  type: 'hasItem'
  itemId: ItemID
}

export interface LevelReachedCondition {
  type: 'levelReached'
  level: number
}

export type UnlockCondition = WaveReachedCondition | HasItemCondition | LevelReachedCondition

export interface TownUnlockTarget {
  type: 'town'
  townId: TownID
}

export type UnlockableFeature = 'camp' | 'skillTree'

export interface FeatureUnlockTarget {
  type: 'feature'
  feature: UnlockableFeature
}

export type UnlockTarget = TownUnlockTarget | FeatureUnlockTarget

export interface UnlockNotification {
  titleKey: string
  bodyKey: string
}

export interface UnlockRule {
  condition: UnlockCondition
  target: UnlockTarget
  notification?: UnlockNotification
}

export const UNLOCK_RULES: UnlockRule[] = [
  {
    condition: { type: 'hasItem', itemId: ItemID.turtleShell },
    target:    { type: 'feature', feature: 'camp' },
    notification: {
      titleKey: 'unlocks:camp.title',
      bodyKey:  'unlocks:camp.body',
    },
  },
  {
    condition: { type: 'levelReached', level: 2 },
    target:    { type: 'feature', feature: 'skillTree' },
    notification: {
      titleKey: 'unlocks:skillTree.title',
      bodyKey:  'unlocks:skillTree.body',
    },
  },
  {
    condition: { type: 'waveReached', zoneId: ZoneID.horseshoeBeach, wave: 5 },
    target:    { type: 'town', townId: TownID.laHarpar },
    notification: {
      titleKey: 'unlocks:towns.laHarpar.title',
      bodyKey:  'unlocks:towns.laHarpar.body',
    },
  },
  {
    // Mawood is revealed once the player pushes 4 waves deep into the Elderwood Wilds
    // (not the boss wave) — the town sits just past the outer rim of the forest.
    condition: { type: 'waveReached', zoneId: ZoneID.elderwoodWilds, wave: 4 },
    target:    { type: 'town', townId: TownID.mawood },
    notification: {
      titleKey: 'unlocks:towns.mawood.title',
      bodyKey:  'unlocks:towns.mawood.body',
    },
  },
  {
    // The Mountain Pass boss (its last wave) opens the road to the capital and its Arena.
    condition: { type: 'waveReached', zoneId: ZoneID.mountainPass, wave: 15 },
    target:    { type: 'town', townId: TownID.northLirold },
    notification: {
      titleKey: 'unlocks:towns.northLirold.title',
      bodyKey:  'unlocks:towns.northLirold.body',
    },
  },
]

export const ZONE_UNLOCK_NOTIFICATIONS: Partial<Record<ZoneID, UnlockNotification>> = {
  [ZoneID.plains]: {
    titleKey: 'unlocks:zones.plains.title',
    bodyKey:  'unlocks:zones.plains.body',
  },
  [ZoneID.elderwoodWilds]: {
    titleKey: 'unlocks:zones.elderwoodWilds.title',
    bodyKey:  'unlocks:zones.elderwoodWilds.body',
  },
}
