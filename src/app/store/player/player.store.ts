import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { calculateXp } from 'app/pipes/calculate-xp.pipe'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedSkillPoints } from '../../../types/player/unlocked-skill-points.type'
import { UnlockedSpellsType } from '../../../types/player/unlocked-spells.type'
import { Enemy } from '../../../interfaces/enemy.interface'
import ITEM_DATA from '../../../data/items-data'
import ENEMIES_DATA from '../../../data/enemies-data'
import { EquipmentSlot, EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { SkillPointID } from '../../../enums/ids/skill-tree-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'

export type PlayerStatsType = Record<PlayerStat, number>;

interface PlayerState {
  stats: PlayerStatsType;
  zonesProgression: ZonesProgression;
  enemyKillCounts: Partial<Record<EnemyID, number>>
  inventory: (InventoryItem | null)[];
  equipment: EquipmentType;
  unlockedSkillPoints: UnlockedSkillPoints;
  unlockedSpells: UnlockedSpellsType;
}

export const initialState: PlayerState = {
  stats: statsInitialState,
  zonesProgression: {},
  inventory: new Array(40).fill(null),
  equipment: initialEquipmentState,
  unlockedSkillPoints: {},
  unlockedSpells: {},
  enemyKillCounts: {},
}

const itemIndexFromInventory = (inventory: (InventoryItem | null)[], id: ItemID, tier: ItemTier): number =>
  inventory.findIndex(item => item?.id === id && item?.tier === tier)

const handleExperience = (stats: PlayerStatsType) => {
  const xpForNextLevel = calculateXp(stats.level + 1)
  if (stats.experience < xpForNextLevel) return

  stats.level++
  stats.unspentSkillPoints++
  const leftoverXp = stats.experience - xpForNextLevel
  stats.experience = leftoverXp > 0 ? leftoverXp : 0
  handleExperience(stats)
}

const calculateEnemyDrops = (enemy: Enemy) => {
  const itemsToUpdate: InventoryItem[] = []

  enemy.drops.forEach(drop => {
    const roll = Math.ceil(Math.random() * drop.chance)

    if (roll === drop.chance) {
      const amount = Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount)
      const { type, tier } = ITEM_DATA[drop.id]
      console.log(drop.id, amount)
      itemsToUpdate.push({ id: drop.id, type, tier, amount })
    }
  })

  return itemsToUpdate
}

const STORE_KEY = 'playerStore'

export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withStorageSync({
    key: STORE_KEY,
    autoSync: true,
  }),
  withMethods((store) => ({
    resetState() {
      patchState(store, initialState)
    },

    updatePlayerStats(statsUpdates: { stat: PlayerStat; amount: number }[]) {
      patchState(store, (state) => {
        const tempStats = { ...state.stats }
        statsUpdates.forEach(({ stat, amount }) => {
          switch (stat) {
            case 'attackSpeed':
            case 'manaRegenRate':
            case 'shopRefreshCooldown':
              tempStats[stat] -= amount
              break
            case 'experience':
              tempStats[stat] += amount
              handleExperience(tempStats)
              break
            default:
              tempStats[stat] += amount
          }
        })
        return { stats: tempStats }
      })
    },

    updateZoneProgression(zoneId: ZoneID, currentWave: number) {
      patchState(store, (state) => ({
        zonesProgression: {
          ...state.zonesProgression,
          [zoneId]: {
            ...state.zonesProgression[zoneId],
            [currentWave]: ((state.zonesProgression[zoneId]?.[currentWave]) || 0) + 1,
          },
        },
      }))
    },

    updateEnemyKillCount(enemyId: EnemyID, amount = 1) {
      patchState(store, (state) => ({
        enemyKillCounts: {
          ...state.enemyKillCounts,
          [enemyId]: (state.enemyKillCounts[enemyId] || 0) + amount,
        },
      }))
    },

    updatePlayerInventory(items: InventoryItem[]) {
      patchState(store, (state) => {
        const inventory = [...state.inventory]

        items.forEach((item) => {
          const itemIndex = itemIndexFromInventory(inventory, item.id, item.tier)
          const emptySlotIndex = inventory.findIndex(i => i === null)

          if (itemIndex === -1 && emptySlotIndex !== -1) {
            inventory[emptySlotIndex] = item
          } else if (itemIndex !== -1) {
            const existing = inventory[itemIndex]!
            inventory[itemIndex] = { ...item, amount: existing.amount + item.amount }
          }
        })

        return { inventory }
      })
    },

    removeItemFromInventory(id: ItemID, tier: ItemTier) {
      patchState(store, (state) => {
        const itemIndex = itemIndexFromInventory(state.inventory, id, tier)
        if (itemIndex === -1) return {}

        const newInventory = [...state.inventory]
        const item = newInventory[itemIndex]!

        if (item.amount <= 1) {
          newInventory[itemIndex] = null
        } else {
          newInventory[itemIndex] = { ...item, amount: item.amount - 1 }
        }
        return { inventory: newInventory }
      })
    },

    updateUnlockedSkillPoints(id: SkillPointID, amount: number) {
      patchState(store, (state) => ({
        unlockedSkillPoints: {
          ...state.unlockedSkillPoints,
          [id]: (state.unlockedSkillPoints[id] || 0) + amount,
        },
      }))
    },

    levelUpSpell(id: SpellID) {
      patchState(store, (state) => ({
        unlockedSpells: {
          ...state.unlockedSpells,
          [id]: (state.unlockedSpells[id] || 0) + 1,
        },
      }))
    },
  })),
  withMethods((store) => ({
    processBattleEnd(enemyId: EnemyID, zoneId: ZoneID, currentWave: number) {
      const enemy = ENEMIES_DATA[enemyId]
      const stats = store.stats()

      const xpGained = Math.ceil(enemy.experience * stats.xpMultiplier)
      const itemsToUpdate = calculateEnemyDrops(enemy)

      store.updatePlayerStats([
        { stat: 'experience', amount: xpGained },
        { stat: 'goldCoins', amount: 1 },
      ])

      store.updateZoneProgression(zoneId, currentWave)
      store.updateEnemyKillCount(enemyId)

      if (itemsToUpdate.length) store.updatePlayerInventory(itemsToUpdate)
    },

    equipItem(item: InventoryItem) {
      const itemData = ITEM_DATA[item.id] as EquipmentItem
      const equipment = store.equipment()
      const statsToUpdate: { stat: PlayerStat, amount: number }[] = []

      itemData.stats?.forEach(s => statsToUpdate.push({ stat: s.id, amount: s.amount }))

      const slotKey = EquipmentSlot[itemData.slot] as EquipmentSlotKey
      const currentlyEquipped = equipment[slotKey]

      if (currentlyEquipped) {
        (ITEM_DATA[currentlyEquipped.id] as EquipmentItem).stats?.forEach(s =>
          statsToUpdate.push({ stat: s.id, amount: -s.amount }),
        )

        store.updatePlayerInventory([
          {
            ...currentlyEquipped,
            amount: 1,
            type: ITEM_DATA[currentlyEquipped.id].type,
          },
        ])
      }

      store.updatePlayerStats(statsToUpdate)
      store.removeItemFromInventory(item.id, item.tier)

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slotKey]: { id: item.id, tier: item.tier } },
      }))
    },

    unequipItem(slot: EquipmentSlotKey) {
      const equipment = store.equipment()
      const equippedItem = equipment[slot]

      if (!equippedItem) return

      const itemData = ITEM_DATA[equippedItem.id] as EquipmentItem
      const statsToUpdate: { stat: PlayerStat, amount: number }[] = []

      itemData.stats?.forEach(s => {
        statsToUpdate.push({ stat: s.id, amount: -1 * s.amount })
      })

      store.updatePlayerInventory([
        {
          ...equippedItem,
          amount: 1,
          type: itemData.type,
        } as InventoryItem,
      ])

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slot]: null },
      }))

      store.updatePlayerStats(statsToUpdate)
    },

    craftItem(recipeId: RecipeID) {
      const recipeData = RECIPES_DATA[recipeId]
      const playerResources = store.inventory()
      const itemsToUpdate: InventoryItem[] = []

      const canCraft = recipeData.itemsNeeded.every(req => {
        const owned = playerResources.find(i => i.id === req.id)
        return owned && owned.amount >= req.amount
      })

      if (!canCraft) return

      recipeData.itemsNeeded.forEach(req => {
        const itemData = ITEM_DATA[req.id]

        itemsToUpdate.push({ id: req.id, amount: -req.amount, type: itemData.type, tier: itemData.tier })
      })

      const itemData = ITEM_DATA[recipeData.itemId]

      itemsToUpdate.push({
        id: itemData.id,
        type: itemData.type,
        amount: recipeData.createsAmount,
        tier: itemData.tier,
      })

      store.updatePlayerInventory(itemsToUpdate)
    },
  })),
  withMethods((store) => ({
    hasSkillUnlocked(skillId: SkillPointID): boolean {
      return !!store.unlockedSkillPoints()[skillId]
    },
  })),
)
