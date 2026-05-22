import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { calculateXp } from 'app/pipes/calculate-xp.pipe'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { UnlockedSkillPoints } from '../../../types/player/unlocked-skill-points.type'
import { UnlockedSpellsType } from '../../../types/player/unlocked-spells.type'
import { Enemy } from '../../../interfaces/enemy.interface'
import ITEM_DATA from '../../../data/items-data'
import ENEMIES_DATA from '../../../data/enemies-data'
import { EquipmentSlot, EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { SkillPointID } from '../../../enums/ids/skill-tree-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { UNLOCK_RULES } from '../../../data/unlock-conditions'

export type PlayerStatsType = Record<PlayerStat, number>;

export interface Task {
  id: string
  monsterId: EnemyID
  targetCount: number
  currentCount: number
  rewardTokens: number
  zoneId: ZoneID
}

interface PlayerState {
  stats: PlayerStatsType;
  zonesProgression: ZonesProgression;
  enemyKillCounts: Partial<Record<EnemyID, number>>
  inventory: (InventoryItem | null)[];
  equipment: EquipmentType;
  unlockedSkillPoints: UnlockedSkillPoints;
  unlockedSpells: UnlockedSpellsType;
  activeTasks: Task[];
  totalTasksCompleted: number;
  explorerTokens: number;
  unlockedContent: UnlockedContent;
  craftingUnlocked: boolean;
  skillTreeUnlocked: boolean;
  mapUnlocked: boolean;
}

export const initialState: PlayerState = {
  stats: statsInitialState,
  zonesProgression: {},
  inventory: new Array(40).fill(null),
  equipment: initialEquipmentState,
  unlockedSkillPoints: {},
  unlockedSpells: {},
  enemyKillCounts: {},
  activeTasks: [],
  totalTasksCompleted: 0,
  explorerTokens: 0,
  unlockedContent: {
    zones: [ZoneID.horseshoeBeach],
    towns: [],
  },
  craftingUnlocked: false,
  skillTreeUnlocked: false,
  mapUnlocked: false,
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

const calculateEnemyDrops = (enemy: Enemy, rolls: number): InventoryItem[] => {
  const accumulator = new Map<string, InventoryItem>()

  for (let r = 0; r < rolls; r++) {
    enemy.drops.forEach(drop => {
      const roll = Math.ceil(Math.random() * drop.chance)
      if (roll !== drop.chance) return

      const amount = Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount)
      const { type, tier } = ITEM_DATA[drop.id]
      const key = `${drop.id}:${tier}`
      const existing = accumulator.get(key)
      if (existing) {
        existing.amount += amount
      } else {
        accumulator.set(key, { id: drop.id, type, tier, amount })
      }
    })
  }

  return [...accumulator.values()]
}

const STORE_KEY = 'playerStore'

export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withComputed((store) => ({
    maxTaskSlots: () => 1,
    hasAvailableTaskSlot: () => store.activeTasks().length < 1,
    activeTask: () => store.activeTasks()[0] ?? null,
    isTaskComplete: () => {
      const task = store.activeTasks()[0]
      return task ? task.currentCount >= task.targetCount : false
    },
  })),
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

    removeItemsFromInventory(items: { id: ItemID; amount: number }[]) {
      patchState(store, (state) => {
        const inventory = [...state.inventory]

        for (const { id, amount } of items) {
          const itemIndex = inventory.findIndex(i => i?.id === id)
          if (itemIndex === -1) continue

          const existing = inventory[itemIndex]!
          if (existing.amount <= amount) {
            inventory[itemIndex] = null
          } else {
            inventory[itemIndex] = { ...existing, amount: existing.amount - amount }
          }
        }

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

    resetUnlockedSkillPoints() {
      patchState(store, { unlockedSkillPoints: {} })
    },

    levelUpSpell(id: SpellID) {
      patchState(store, (state) => ({
        unlockedSpells: {
          ...state.unlockedSpells,
          [id]: (state.unlockedSpells[id] || 0) + 1,
        },
      }))
    },

    levelDownSpell(id: SpellID, amount: number) {
      patchState(store, (state) => ({
        unlockedSpells: {
          ...state.unlockedSpells,
          [id]: Math.max(0, (state.unlockedSpells[id] || 0) - amount),
        },
      }))
    },

    acceptTask(task: Task) {
      patchState(store, (state) => ({
        activeTasks: [...state.activeTasks, task],
      }))
    },

    updateTaskProgress(monsterId: EnemyID) {
      patchState(store, (state) => {
        const updatedTasks = state.activeTasks.map(task => {
          if (task.monsterId === monsterId && task.currentCount < task.targetCount) {
            return { ...task, currentCount: task.currentCount + 1 }
          }
          return task
        })
        return { activeTasks: updatedTasks }
      })
    },

    claimTaskReward(taskId: string) {
      const task = store.activeTasks().find(t => t.id === taskId)
      if (!task || task.currentCount < task.targetCount) return

      patchState(store, (state) => ({
        activeTasks: state.activeTasks.filter(t => t.id !== taskId),
        totalTasksCompleted: state.totalTasksCompleted + 1,
        explorerTokens: state.explorerTokens + task.rewardTokens,
      }))
    },

    abandonTask(taskId: string) {
      patchState(store, (state) => ({
        activeTasks: state.activeTasks.filter(t => t.id !== taskId),
      }))
    },
  })),
  withMethods((store) => ({
    processBattleEnd(enemyId: EnemyID, zoneId: ZoneID, currentWave: number, isShiny: boolean) {
      const enemy = ENEMIES_DATA[enemyId]
      const stats = store.stats()

      const xpMultiplier = isShiny ? 5 : 1
      const goldMultiplier = isShiny ? 10 : 1
      const dropRolls = isShiny ? 10 : 1

      const xpGained = Math.ceil(enemy.experience * stats.xpMultiplier * xpMultiplier)
      const goldGained = 1 * goldMultiplier
      const itemsToUpdate = calculateEnemyDrops(enemy, dropRolls)

      store.updatePlayerStats([
        { stat: 'experience', amount: xpGained },
        { stat: 'goldCoins', amount: goldGained },
      ])

      store.updateZoneProgression(zoneId, currentWave)
      store.updateEnemyKillCount(enemyId)
      store.updateTaskProgress(enemyId)

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

    useItem(item: InventoryItem) {
      const itemData = ITEM_DATA[item.id]
      if (itemData.type !== ItemType.rewardsStats) return

      const statsToUpdate = itemData.stats.map(s => ({ stat: s.id, amount: s.amount }))
      store.updatePlayerStats(statsToUpdate)
      store.removeItemFromInventory(item.id, item.tier)
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

    getKillCountByZoneAndWave(zoneId: ZoneID, wave: number) {
      return (store.zonesProgression()[zoneId] || {})[wave] || 0
    },

    unlockZone(id: ZoneID): void {
      patchState(store, (state) => {
        const zones = state.unlockedContent.zones ?? [ZoneID.horseshoeBeach]
        if (zones.includes(id)) return {}
        return { unlockedContent: { ...state.unlockedContent, zones: [...zones, id] } }
      })
    },

    isZoneUnlocked(id: ZoneID): boolean {
      return (store.unlockedContent().zones ?? [ZoneID.horseshoeBeach]).includes(id)
    },

    unlockTown(id: TownID): void {
      patchState(store, (state) => {
        const towns = state.unlockedContent.towns ?? []
        if (towns.includes(id)) return {}
        return { unlockedContent: { ...state.unlockedContent, towns: [...towns, id] } }
      })
    },

    isTownUnlocked(id: TownID): boolean {
      return (store.unlockedContent().towns ?? []).includes(id)
    },

    unlockCrafting(): void {
      patchState(store, { craftingUnlocked: true })
    },

    unlockSkillTree(): void {
      patchState(store, { skillTreeUnlocked: true })
    },

    unlockMap(): void {
      patchState(store, { mapUnlocked: true })
    },
  })),
  withHooks((store) => ({
    onInit() {
      for (const rule of UNLOCK_RULES) {
        if (rule.condition.type !== 'waveReached') continue
        const killCount = store.getKillCountByZoneAndWave(rule.condition.zoneId, rule.condition.wave)
        if (killCount <= 0) continue
        if (rule.target.type === 'town') {
          store.unlockTown(rule.target.townId)
          store.unlockMap()
        }
      }
    },
  })),
)
