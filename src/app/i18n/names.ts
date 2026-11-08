import i18next from 'i18next'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { ReputationID } from '../../enums/reputation-id.enum'

/** Display names: one lookup per key family. `npm run validate` checks every enum member has its key. */
export const itemName = (id: ItemID): string => i18next.t(`items:names.${ItemID[id]}`)
export const zoneName = (id: ZoneID): string => i18next.t(`zones:names.${ZoneID[id]}`)
export const questName = (id: QuestID): string => i18next.t(`quests:names.${QuestID[id]}`)
export const enemyName = (id: EnemyID): string => i18next.t(`enemies:names.${EnemyID[id]}`)
export const professionName = (id: ProfessionID): string => i18next.t(`app:professions.${ProfessionID[id]}`)
export const reputationName = (id: ReputationID): string => i18next.t(`map:reputations.${ReputationID[id]}`)

/** A name with the **Upgrade level** suffix when the level is above 0. */
export const upgradedName = (name: string, level: number): string =>
  level > 0 ? i18next.t('items:upgradedName', { name, level }) : name
export const upgradedItemName = (id: ItemID, level = 0): string => upgradedName(itemName(id), level)

export type NameFamily = 'item' | 'zone' | 'quest' | 'enemy' | 'profession' | 'reputation'
const LOOKUP: Record<NameFamily, (id: number) => string> = {
  item: itemName, zone: zoneName, quest: questName, enemy: enemyName, profession: professionName, reputation: reputationName,
}
/** Template entry point (see `DisplayNamePipe`); only items carry an **Upgrade level**. */
export const displayName = (family: NameFamily, id: number, level = 0): string =>
  family === 'item' ? upgradedName(LOOKUP.item(id), level) : LOOKUP[family](id)
