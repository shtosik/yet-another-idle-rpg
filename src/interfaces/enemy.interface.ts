import { DamageElement } from 'enums/damage-element.enum'
import { EnemyDrop } from './enemy-drop.interface'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'

export interface Enemy {
    id: EnemyID
    maxHp: number
    experience: number
    weakness: DamageElement
    drops: EnemyDrop[]
    url: string
    zones: ZoneID[]
    isBossEnemy?: boolean
}
