import { ZoneID } from 'enums/ids/zone-id.enum'
import { TownID } from 'enums/map/town-id.enum'

export interface WaveReachedCondition {
  type: 'waveReached'
  zoneId: ZoneID
  wave: number
}

export type UnlockCondition = WaveReachedCondition

export interface TownUnlockTarget {
  type: 'town'
  townId: TownID
}

export type UnlockTarget = TownUnlockTarget

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
