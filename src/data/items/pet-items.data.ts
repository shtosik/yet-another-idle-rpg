import { ItemID } from '../../enums/ids/item-id.enum'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { EquipmentItem, EquipmentItemPossibleStat, Item } from '../../interfaces/item.interface'
import { ItemType } from '../../enums/items/item-type.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'
import { EquipmentSlot } from '../../enums/equipment-slot.enum'
import { EnemyDrop } from '../../interfaces/enemy-drop.interface'

export const PET_DROP_CHANCE = 2000

type PetEntry = {
  enemyId: EnemyID
  petId: ItemID
  shinyId: ItemID
  asset: string                              // filename stem under ./assets/img/enemies/
  stats: EquipmentItemPossibleStat[]         // stats on the normal pet
  shinyStats: EquipmentItemPossibleStat[]    // stats on the shiny pet (fully independent of normal)
}

const PETS: PetEntry[] = [
  {
    enemyId: EnemyID.greenSlime,
    petId: ItemID.petGreenSlime,
    shinyId: ItemID.shinyPetGreenSlime,
    asset: 'greenSlime',
    stats: [{ id: 'damageVsSlime', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsSlime', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.redSlime,
    petId: ItemID.petRedSlime,
    shinyId: ItemID.shinyPetRedSlime,
    asset: 'redSlime',
    stats: [{ id: 'damageVsSlime', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsSlime', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.blueSlime,
    petId: ItemID.petBlueSlime,
    shinyId: ItemID.shinyPetBlueSlime,
    asset: 'blueSlime',
    stats: [{ id: 'damageVsSlime', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsSlime', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.kingSlime,
    petId: ItemID.petKingSlime,
    shinyId: ItemID.shinyPetKingSlime,
    asset: 'kingSlime',
    stats: [{ id: 'damageVsSlime', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsSlime', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.crab,
    petId: ItemID.petCrab,
    shinyId: ItemID.shinyPetCrab,
    asset: 'crab',
    stats: [{ id: 'damageVsCrab', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsCrab', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.seagull,
    petId: ItemID.petSeagull,
    shinyId: ItemID.shinyPetSeagull,
    asset: 'seagull',
    stats: [{ id: 'damageVsBird', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsBird', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.turtle,
    petId: ItemID.petTurtle,
    shinyId: ItemID.shinyPetTurtle,
    asset: 'turtle',
    stats: [{ id: 'damageVsReptile', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsReptile', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.gangsterCrab,
    petId: ItemID.petGangsterCrab,
    shinyId: ItemID.shinyPetGangsterCrab,
    asset: 'gangsterCrab',
    stats: [{ id: 'damageVsCrab', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsCrab', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.rat,
    petId: ItemID.petRat,
    shinyId: ItemID.shinyPetRat,
    asset: 'rat',
    stats: [{ id: 'damageVsRat', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsRat', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.giantRat,
    petId: ItemID.petGiantRat,
    shinyId: ItemID.shinyPetGiantRat,
    asset: 'giantRat',
    stats: [{ id: 'damageVsRat', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsRat', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.wolf,
    petId: ItemID.petWolf,
    shinyId: ItemID.shinyPetWolf,
    asset: 'wolf',
    stats: [{ id: 'damageVsDog', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsDog', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.deer,
    petId: ItemID.petDeer,
    shinyId: ItemID.shinyPetDeer,
    asset: 'deer',
    stats: [{ id: 'damageVsMammal', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsMammal', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.bandit,
    petId: ItemID.petBandit,
    shinyId: ItemID.shinyPetBandit,
    asset: 'bandit',
    stats: [{ id: 'damageVsBandit', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsBandit', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.goblinScout,
    petId: ItemID.petGoblinScout,
    shinyId: ItemID.shinyPetGoblinScout,
    asset: 'goblinScout',
    stats: [{ id: 'damageVsGoblin', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsGoblin', amount: 0.4 }],
  },
  {
    enemyId: EnemyID.troll,
    petId: ItemID.petTroll,
    shinyId: ItemID.shinyPetTroll,
    asset: 'troll',
    stats: [{ id: 'damageVsTroll', amount: 0.2 }],
    shinyStats: [{ id: 'damageVsTroll', amount: 0.4 }],
  },
]


function buildPetItem(p: PetEntry, shiny: boolean): EquipmentItem {
  return {
    id: shiny ? p.shinyId : p.petId,
    tier: shiny ? ItemTier.legendary : ItemTier.rare,
    url: `./assets/img/enemies/${p.asset}${shiny ? '-shiny' : ''}.png`,
    value: -1,
    type: ItemType.equipment,
    slot: EquipmentSlot.pet,
    stats: shiny ? p.shinyStats : p.stats,
  }
}

export const PetItemsData: Partial<Record<ItemID, Item>> = Object.fromEntries(
  PETS.flatMap(p => [
    [p.petId, buildPetItem(p, false)],
    [p.shinyId, buildPetItem(p, true)],
  ]),
)

const PETS_BY_ENEMY: Partial<Record<EnemyID, PetEntry>> = Object.fromEntries(
  PETS.map(p => [p.enemyId, p]),
)

export const petDrop = (enemyId: EnemyID): EnemyDrop => {
  const p = PETS_BY_ENEMY[enemyId]!
  return { id: p.petId, minAmount: 1, maxAmount: 1, chance: PET_DROP_CHANCE }
}

export const shinyPetDrops = (enemyId: EnemyID): EnemyDrop[] => {
  const p = PETS_BY_ENEMY[enemyId]!
  return [{ id: p.shinyId, minAmount: 1, maxAmount: 1, chance: PET_DROP_CHANCE }]
}
