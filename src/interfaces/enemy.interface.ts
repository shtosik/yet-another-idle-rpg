import { DamageElement } from 'enums/damage-element.enum'
import { EnemyDrop } from './enemy-drop.interface'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { EnemyType } from '../enums/enemy-type.enum'

export interface Enemy {
  id: EnemyID
  maxHp: number
  experience: number
  weakness?: DamageElement
  drops: EnemyDrop[]
  shinyDrops?: EnemyDrop[]
  url: string
  isBossEnemy?: boolean
  enemyTypes: EnemyType[]
}
