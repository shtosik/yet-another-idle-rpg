import { effect } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { calculateXp } from 'app/pipes/calculate-xp.pipe'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem, RecipeItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { UnlockedSkillPoints } from '../../../types/player/unlocked-skill-points.type'
import { UnlockedSpellsType } from '../../../types/player/unlocked-spells.type'
import { Enemy } from '../../../interfaces/enemy.interface'
import { EnemyDrop } from '../../../interfaces/enemy-drop.interface'
import ITEM_DATA from '../../../data/items-data'
import ENEMIES_DATA from '../../../data/enemies-data'
import { EquipmentSlot, EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { SkillPointID } from '../../../enums/ids/skill-tree-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { DamageElement } from '../../../enums/damage-element.enum'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { UNLOCK_RULES, UnlockCondition, UnlockTarget } from '../../../data/unlock-conditions'
import { addItems, canFit, countItem, createInventory, fitsCapacity, hasItems, ItemStack, removeItems, resizeInventory } from './inventory'

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
  unlockedRecipes: RecipeID[];
  spellbookUnlocked: boolean;
}

export const initialState: PlayerState = {
  stats: statsInitialState,
  zonesProgression: {},
  inventory: createInventory(),
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
  unlockedRecipes: [],
  spellbookUnlocked: false,
}

const equipmentInventorySlots = (itemId: ItemID): number =>
  (ITEM_DATA[itemId] as EquipmentItem).stats
    ?.filter(s => s.id === 'inventorySlots')
    .reduce((sum, s) => sum + s.amount, 0) ?? 0

const handleExperience =(stats: PlayerStatsType) => {
  const xpForNextLevel = calculateXp(stats.level + 1)
  if (stats.experience < xpForNextLevel) return

  stats.level++
  stats.unspentSkillPoints++
  const leftoverXp = stats.experience - xpForNextLevel
  stats.experience = leftoverXp > 0 ? leftoverXp : 0
  handleExperience(stats)
}

const rollDropList = (
  drops: EnemyDrop[],
  rolls: number,
  accumulator: Map<string, InventoryItem>,
  activeQuestIds?: Set<QuestID>,
) => {
  for (let r = 0; r < rolls; r++) {
    drops.forEach(drop => {
      if (drop.requiredActiveQuestId !== undefined && !activeQuestIds?.has(drop.requiredActiveQuestId)) return

      const roll = Math.ceil(Math.random() * drop.chance)
      if (roll !== drop.chance) return

      const amount = Math.floor(Math.random() * (drop.maxAmount - drop.minAmount + 1) + drop.minAmount)
      const { type, tier } = ITEM_DATA[drop.id]
      const key = `${drop.id}:${tier}`
      const existing = accumulator.get(key)
      if (existing) existing.amount += amount
      else accumulator.set(key, { id: drop.id, type, tier, amount })
    })
  }
}

const calculateEnemyDrops = (enemy: Enemy, rolls: number, isShiny = false, activeQuestIds?: Set<QuestID>): InventoryItem[] => {
  const accumulator = new Map<string, InventoryItem>()
  rollDropList(enemy.drops, rolls, accumulator, activeQuestIds)
  if (isShiny && enemy.shinyDrops?.length) rollDropList(enemy.shinyDrops, 1, accumulator, activeQuestIds)
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
    equippedWeaponDamageType: () => {
      const weapon = store.equipment().weapon
      if (!weapon) return DamageElement.physical
      return (ITEM_DATA[weapon.id] as EquipmentItem).damageType ?? DamageElement.physical
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

    addItems(items: ItemStack[]) {
      patchState(store, (state) => ({
        inventory: addItems(state.inventory, state.stats.inventorySlots, items),
      }))
    },

    removeItems(items: ItemStack[]) {
      patchState(store, (state) => ({ inventory: removeItems(state.inventory, items) }))
    },

    /** Whether `adding` fits after `removing` is taken out first. */
    canFitItems(adding: ItemStack[], removing: ItemStack[] = []): boolean {
      return canFit(store.inventory(), store.stats.inventorySlots(), adding, removing)
    },

    /**
     * Whether `inventorySlots` can change by `delta` (negative shrinks) without stranding items,
     * with `adding` still fitting afterwards once `removing` is taken out.
     */
    canChangeInventorySlots(delta: number, adding: ItemStack[] = [], removing: ItemStack[] = []): boolean {
      const capacity = store.stats.inventorySlots() + delta
      return fitsCapacity(removeItems(store.inventory(), removing), capacity)
        && canFit(store.inventory(), capacity, adding, removing)
    },

    /** Owns the ingredients and has room for the output. */
    canCraft(recipeId: RecipeID): boolean {
      const recipeData = RECIPES_DATA[recipeId]
      return hasItems(store.inventory(), recipeData.itemsNeeded)
        && canFit(
          store.inventory(),
          store.stats.inventorySlots(),
          [{ id: recipeData.itemId, amount: recipeData.createsAmount }],
          recipeData.itemsNeeded,
        )
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
    canUnequip(slot: EquipmentSlotKey): boolean {
      const equipped = store.equipment()[slot]
      if (!equipped) return false
      return store.canChangeInventorySlots(
        -equipmentInventorySlots(equipped.id),
        [{ id: equipped.id, tier: equipped.tier, amount: 1 }],
      )
    },

    canEquip(item: InventoryItem): boolean {
      const slotKey = EquipmentSlot[(ITEM_DATA[item.id] as EquipmentItem).slot] as EquipmentSlotKey
      const equipped = store.equipment()[slotKey]
      const delta = equipmentInventorySlots(item.id) - (equipped ? equipmentInventorySlots(equipped.id) : 0)
      const adding = equipped ? [{ id: equipped.id, tier: equipped.tier, amount: 1 }] : []
      return store.canChangeInventorySlots(delta, adding, [{ id: item.id, tier: item.tier, amount: 1 }])
    },
  })),
  withMethods((store) => ({
    processBattleEnd(enemyId: EnemyID, zoneId: ZoneID, currentWave: number, isShiny: boolean, activeQuestIds?: Set<QuestID>) {
      const enemy = ENEMIES_DATA[enemyId]
      const stats = store.stats()

      const xpMultiplier = isShiny ? 5 : 1
      const goldMultiplier = isShiny ? 10 : 1
      const dropRolls = isShiny ? 10 : 1

      const xpGained = Math.ceil(enemy.experience * stats.xpMultiplier * xpMultiplier)
      const goldGained = 1 * goldMultiplier
      const itemsToUpdate = calculateEnemyDrops(enemy, dropRolls, isShiny, activeQuestIds)

      store.updatePlayerStats([
        { stat: 'experience', amount: xpGained },
        { stat: 'goldCoins', amount: goldGained },
      ])

      store.updateZoneProgression(zoneId, currentWave)
      store.updateEnemyKillCount(enemyId)
      store.updateTaskProgress(enemyId)

      if (itemsToUpdate.length) store.addItems(itemsToUpdate)
    },

    equipItem(item: InventoryItem) {
      if (!store.canEquip(item)) return

      const itemData = ITEM_DATA[item.id] as EquipmentItem
      const equipment = store.equipment()
      const statsToUpdate: { stat: PlayerStat, amount: number }[] = []

      itemData.stats?.forEach(s => statsToUpdate.push({ stat: s.id, amount: s.amount }))

      const slotKey = EquipmentSlot[itemData.slot] as EquipmentSlotKey
      const currentlyEquipped = equipment[slotKey]

      // Remove first so the swapped-out item always has a free slot to return to.
      store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])

      if (currentlyEquipped) {
        (ITEM_DATA[currentlyEquipped.id] as EquipmentItem).stats?.forEach(s =>
          statsToUpdate.push({ stat: s.id, amount: -s.amount }),
        )

        store.addItems([{ id: currentlyEquipped.id, tier: currentlyEquipped.tier, amount: 1 }])
      }

      store.updatePlayerStats(statsToUpdate)

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slotKey]: { id: item.id, tier: item.tier } },
      }))
    },

    unequipItem(slot: EquipmentSlotKey) {
      const equipment = store.equipment()
      const equippedItem = equipment[slot]

      if (!equippedItem || !store.canUnequip(slot)) return

      const itemData = ITEM_DATA[equippedItem.id] as EquipmentItem
      const statsToUpdate: { stat: PlayerStat, amount: number }[] = []

      itemData.stats?.forEach(s => {
        statsToUpdate.push({ stat: s.id, amount: -1 * s.amount })
      })

      store.addItems([{ id: equippedItem.id, tier: equippedItem.tier, amount: 1 }])

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slot]: null },
      }))

      store.updatePlayerStats(statsToUpdate)
    },

    useItem(item: InventoryItem) {
      const itemData = ITEM_DATA[item.id]

      if (itemData.type === ItemType.recipe) {
        const recipeData = itemData as RecipeItem
        if (store.unlockedRecipes().includes(recipeData.recipeId)) return
        patchState(store, state => ({ unlockedRecipes: [...state.unlockedRecipes, recipeData.recipeId] }))
        store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])
        return
      }

      if (itemData.type !== ItemType.rewardsStats) return

      const statsToUpdate = itemData.stats.map(s => ({ stat: s.id, amount: s.amount }))
      store.updatePlayerStats(statsToUpdate)
      store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])
    },

    regenMana(deltaMs: number) {
      patchState(store, (state) => {
        const s = state.stats
        if (s.mana >= s.maxMana) {
          return s.currentManaRegenTimer === 0 ? {} : { stats: { ...s, currentManaRegenTimer: 0 } }
        }
        let timer = s.currentManaRegenTimer + deltaMs
        let mana = s.mana
        while (timer >= s.manaRegenRate && mana < s.maxMana) {
          timer -= s.manaRegenRate
          mana++
        }
        if (mana >= s.maxMana) timer = 0
        return { stats: { ...s, mana, currentManaRegenTimer: timer } }
      })
    },

    craftItem(recipeId: RecipeID) {
      const recipeData = RECIPES_DATA[recipeId]
      if (!store.canCraft(recipeId)) return

      store.removeItems(recipeData.itemsNeeded)
      store.addItems([{ id: recipeData.itemId, amount: recipeData.createsAmount }])
    },

    itemCount(id: ItemID): number {
      return countItem(store.inventory(), id)
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

    unlockSpellbook(): void {
      patchState(store, { spellbookUnlocked: true })
    },
  })),
  withMethods((store) => ({
    isUnlockTargetUnlocked(target: UnlockTarget): boolean {
      switch (target.type) {
        case 'town':
          return store.isTownUnlocked(target.townId)
        case 'feature':
          return target.feature === 'crafting' ? store.craftingUnlocked() : store.skillTreeUnlocked()
      }
    },

    applyUnlockTarget(target: UnlockTarget): void {
      switch (target.type) {
        case 'town':
          store.unlockTown(target.townId)
          store.unlockMap()
          break
        case 'feature':
          if (target.feature === 'crafting') store.unlockCrafting()
          else store.unlockSkillTree()
          break
      }
    },

    /** Conditions that depend only on saved player state. `waveReached` is judged by the caller. */
    isPlayerStateConditionMet(condition: UnlockCondition): boolean {
      switch (condition.type) {
        case 'hasItem':
          return store.inventory().some(i => i?.id === condition.itemId)
        case 'levelReached':
          return store.stats().level >= condition.level
        case 'waveReached':
          return false
      }
    },
  })),
  withHooks((store) => ({
    // Re-apply unlocks for existing saves silently (no notifications).
    onInit() {
      // Raising the inventorySlots stat grows the inventory; it never shrinks here.
      effect(() => {
        const capacity = store.stats.inventorySlots()
        patchState(store, (state) => ({ inventory: resizeInventory(state.inventory, capacity) }))
      })

      for (const rule of UNLOCK_RULES) {
        const { condition } = rule
        const isMet = condition.type === 'waveReached'
          ? store.getKillCountByZoneAndWave(condition.zoneId, condition.wave) > 0
          : store.isPlayerStateConditionMet(condition)
        if (isMet) store.applyUnlockTarget(rule.target)
      }
    },
  })),
)
