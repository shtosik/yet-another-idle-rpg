import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { EnemyDrop } from 'interfaces/enemy-drop.interface'

export interface MonsterEntry {
    id: EnemyID
    url: string
    maxHp: number
    zones: ZoneID[]
    drops: EnemyDrop[]
    shinyDrops: EnemyDrop[]
    killCount: number
    isUnlocked: boolean
}
