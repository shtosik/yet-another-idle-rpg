import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { EnemyDrop } from 'interfaces/enemy-drop.interface'
import { DamageElement } from 'enums/damage-element.enum'
import { EnemyType } from 'enums/enemy-type.enum'

export interface MonsterEntry {
    id: EnemyID
    url: string
    maxHp: number
    experience: number
    gold: number
    weakness?: DamageElement
    enemyTypes: EnemyType[]
    zones: ZoneID[]
    drops: EnemyDrop[]
    shinyDrops: EnemyDrop[]
    killCount: number
    isUnlocked: boolean
    /** Bestiary stars reached, 0 to 3. */
    rank: number
    /** Kills at the current star (0 before the first); the progress bar starts here. */
    rankStartKills: number
    /** Kills needed for the next star; null at max rank. */
    nextRankKills: number | null
}
