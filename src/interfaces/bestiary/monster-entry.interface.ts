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
}
