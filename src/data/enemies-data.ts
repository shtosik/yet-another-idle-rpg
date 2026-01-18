import { DamageElement } from 'enums/damage-element.enum'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { Enemy } from 'interfaces/enemy.interface'

const generateItem = (id: ItemID, minAmount: number, maxAmount: number, chance: number) => ({
  id,
  minAmount,
  maxAmount,
  chance,
})

const ENEMIES_DATA: Record<EnemyID, Enemy> = {
  [EnemyID.greenSlime]: {
    id: EnemyID.greenSlime,
    maxHp: 2,
    weakness: DamageElement.fire,
    experience: 5,
    drops: [generateItem(ItemID.slimeResidue, 1, 2, 3)],
    url: './assets/img/enemies/greenSlime.png',
  },
  [EnemyID.redSlime]: {
    id: EnemyID.redSlime,
    maxHp: 3,
    weakness: DamageElement.water,
    experience: 5,
    drops: [generateItem(ItemID.slimeResidue, 1, 2, 3)],
    url: './assets/img/enemies/redSlime.png',
  },
  [EnemyID.blueSlime]: {
    id: EnemyID.blueSlime,
    maxHp: 2,
    weakness: DamageElement.air,
    experience: 5,
    drops: [generateItem(ItemID.slimeResidue, 1, 2, 3)],
    url: './assets/img/enemies/blueSlime.png',
  },
  [EnemyID.kingSlime]: {
    id: EnemyID.kingSlime,
    maxHp: 100,
    weakness: DamageElement.fire,
    experience: 40,
    drops: [
      generateItem(ItemID.slimeGoldenCrown, 1, 1, 10),
      generateItem(ItemID.slimeResidue, 1, 10, 1),
    ],
    url: './assets/img/enemies/kingSlime.png',
    isBossEnemy: true,
  },
  [EnemyID.crab]: {
    id: EnemyID.crab,
    maxHp: 2,
    weakness: DamageElement.physical,
    experience: 5,
    drops: [
      generateItem(ItemID.crabMeat, 1, 1, 2),
      generateItem(ItemID.stick, 1, 1, 4),
    ],
    url: './assets/img/enemies/crab.png',
  },
  [EnemyID.seagull]: {
    id: EnemyID.seagull,
    maxHp: 3,
    weakness: DamageElement.physical,
    experience: 8,
    drops: [
      generateItem(ItemID.feather, 1, 2, 2),
      generateItem(ItemID.stick, 1, 1, 4),
      generateItem(ItemID.machete, 1, 1, 1),
    ],
    url: './assets/img/enemies/seagull.png',
  },
  [EnemyID.turtle]: {
    id: EnemyID.turtle,
    maxHp: 5,
    weakness: DamageElement.fire,
    experience: 10,
    drops: [
      generateItem(ItemID.turtleShell, 1, 1, 3),
      generateItem(ItemID.stick, 1, 1, 4),
    ],
    url: './assets/img/enemies/turtle.png',
  },
  [EnemyID.gangsterCrab]: {
    id: EnemyID.gangsterCrab,
    maxHp: 50,
    weakness: DamageElement.physical,
    experience: 50,
    drops: [
      generateItem(ItemID.knife, 1, 1, 10),
      generateItem(ItemID.crabMeat, 1, 3, 1),
    ],
    url: './assets/img/enemies/gangsterCrab.png',
    isBossEnemy: true,
  },
  [EnemyID.rat]: {
    id: EnemyID.rat,
    maxHp: 8,
    weakness: DamageElement.fire,
    experience: 11,
    drops: [
      generateItem(ItemID.ratTail, 1, 1, 1),
      generateItem(ItemID.cheese, 1, 1, 8),
    ],
    url: './assets/img/enemies/rat.png',
  },
  [EnemyID.giantRat]: {
    id: EnemyID.giantRat,
    maxHp: 75,
    weakness: DamageElement.fire,
    experience: 100,
    drops: [
      generateItem(ItemID.ratTail, 1, 1, 1),
      generateItem(ItemID.cheese, 1, 3, 2),
      generateItem(ItemID.ratCatcher, 1, 1, 40),
    ],
    url: './assets/img/enemies/giantRat.png',
    isBossEnemy: true,
  },
  [EnemyID.wolf]: {
    id: EnemyID.wolf,
    maxHp: 50,
    weakness: DamageElement.fire,
    experience: 30,
    drops: [generateItem(ItemID.wolfFangs, 1, 3, 2)],
    url: './assets/img/enemies/wolf.png',
  },
  [EnemyID.deer]: {
    id: EnemyID.deer,
    maxHp: 25,
    weakness: DamageElement.fire,
    experience: 20,
    drops: [generateItem(ItemID.deerPelt, 1, 1, 4)],
    url: './assets/img/enemies/deer.png',
  },
  [EnemyID.bandit]: {
    id: EnemyID.bandit,
    maxHp: 75,
    weakness: DamageElement.air,
    experience: 50,
    drops: [
      generateItem(ItemID.vialOfWater, 1, 1, 6),
      generateItem(ItemID.trophyNecklace, 1, 1, 100),
      generateItem(ItemID.machete, 1, 1, 80),
    ],
    url: './assets/img/enemies/bandit.png',
  },
  [EnemyID.goblinScout]: {
    id: EnemyID.goblinScout,
    maxHp: 30,
    weakness: DamageElement.fire,
    experience: 25,
    drops: [],
    url: './assets/img/enemies/goblinScout.png',
  },
  [EnemyID.troll]: {
    id: EnemyID.troll,
    maxHp: 200,
    weakness: DamageElement.water,
    experience: 500,
    drops: [],
    url: './assets/img/enemies/troll.png',
    isBossEnemy: true,
  },
}

export default ENEMIES_DATA
