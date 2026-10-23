import { DamageElement } from 'enums/damage-element.enum'
import { EnemyDrop } from './enemy-drop.interface'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { EnemyType } from '../enums/enemy-type.enum'

export interface Enemy {
  id: EnemyID
  maxHp: number
  experience: number
  /** Gold per kill, before `goldCoinsMultiplier` and the shiny multiplier. */
  gold: number
  weakness?: DamageElement
  drops: EnemyDrop[]
  shinyDrops?: EnemyDrop[]
  url: string
  enemyTypes: EnemyType[]
}
