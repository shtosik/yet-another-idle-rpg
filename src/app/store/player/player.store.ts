import { computed, effect, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { calculateXp } from 'app/pipes/calculate-xp.pipe'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem, RecipeItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { UnlockedNodes } from '../../../types/player/unlocked-nodes.type'
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
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { DamageElement } from '../../../enums/damage-element.enum'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { addItems, canFit, countItem, createInventory, fitsCapacity, ItemStack, missingSlots, removeItems, resizeInventory } from './inventory'
import { canInstall, evaluateRecipe, installStations, Stations } from './camp'
import { StationID } from '../../../enums/ids/station-id.enum'
import { UNLOCK_RULES, UnlockCondition, UnlockTarget } from '../../../data/unlock-conditions'
import { BattleStore } from '../battle/battle.store'
import {
  activeBuffSpellIds,
  activeConsumableItemIds,
  bonusModifiers,
  buffModifiers,
  consumableModifiers,
  deriveStats,
  equipmentModifiers,
  initialResources,
  isResourceStat,
  Resources,
  sameIds,
  skillNodeModifiers,
} from './stats'

export type { PlayerStatsType } from './stats'

export interface Task {
  id: string
  monsterId: EnemyID
  targetCount: number
  currentCount: number
  rewardTokens: number
  zoneId: ZoneID
}

interface PlayerState {
  resources: Resources;
  /** Permanent stat gains from used items, quest rewards and dialogue. Raw amounts, before inversion. */
  permanentBonuses: Partial<Record<PlayerStat, number>>;
  /** Not saved: progress towards the next mana point. */
  manaRegenTimer: number;
  zonesProgression: ZonesProgression;
  enemyKillCounts: Partial<Record<EnemyID, number>>
  inventory: (InventoryItem | null)[];
  equipment: EquipmentType;
  unlockedNodes: UnlockedNodes;
  unlockedSpells: UnlockedSpellsType;
  activeTasks: Task[];
  totalTasksCompleted: number;
  explorerTokens: number;
  unlockedContent: UnlockedContent;
  campUnlocked: boolean;
  stations: Stations;
  skillTreeUnlocked: boolean;
  mapUnlocked: boolean;
  unlockedRecipes: RecipeID[];
  spellbookUnlocked: boolean;
}

export const initialState: PlayerState = {
  resources: initialResources(),
  permanentBonuses: {},
  manaRegenTimer: 0,
  zonesProgression: {},
  inventory: createInventory(),
  equipment: initialEquipmentState,
  unlockedNodes: {},
  unlockedSpells: {},
  enemyKillCounts: {},
  activeTasks: [],
  totalTasksCompleted: 0,
  explorerTokens: 0,
  unlockedContent: {
    zones: [ZoneID.horseshoeBeach],
    towns: [],
  },
  campUnlocked: false,
  stations: {},
  skillTreeUnlocked: false,
  mapUnlocked: false,
  unlockedRecipes: [],
  spellbookUnlocked: false,
}

const equipmentInventorySlots = (itemId: ItemID): number =>
  (ITEM_DATA[itemId] as EquipmentItem).stats
    ?.filter(s => s.id === 'inventorySlots')
    .reduce((sum, s) => sum + s.amount, 0) ?? 0

const handleExperience = (resources: Resources) => {
  const xpForNextLevel = calculateXp(resources.level + 1)
  if (resources.experience < xpForNextLevel) return

  resources.level++
  resources.unspentSkillPoints++
  const leftoverXp = resources.experience - xpForNextLevel
  resources.experience = leftoverXp > 0 ? leftoverXp : 0
  handleExperience(resources)
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
  withGameStateSync(STORE_KEY, initialState, ['manaRegenTimer']),
  withDevtools(STORE_KEY),
  withComputed((store, battleStore = inject(BattleStore)) => {
    // Buff and consumable timers tick constantly; only a change in what's active should recompute stats.
    const activeBuffs = computed(() => activeBuffSpellIds(battleStore.activeBuffs()), { equal: sameIds })
    const activeConsumables = computed(() => activeConsumableItemIds(battleStore.consumableSlots()), { equal: sameIds })

    return {
      /** Base stats plus every source; never stored (docs/adr/0002-player-stats-derived-from-sources.md). */
      stats: computed(() => deriveStats(store.resources(), [
        ...bonusModifiers(store.permanentBonuses()),
        ...equipmentModifiers(store.equipment()),
        ...skillNodeModifiers(store.unlockedNodes()),
        ...buffModifiers(activeBuffs()),
        ...consumableModifiers(activeConsumables()),
      ])),
    }
  }),
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

    /**
     * Earns or spends resources (gold, XP, mana, skill points), or grants a permanent stat bonus.
     * Equipment, skill nodes, buffs and consumables are not applied here: `stats` derives them from their source.
     */
    updatePlayerStats(statsUpdates: { stat: PlayerStat; amount: number }[]) {
      const maxMana = store.stats().maxMana
      patchState(store, (state) => {
        const resources = { ...state.resources }
        const permanentBonuses = { ...state.permanentBonuses }
        statsUpdates.forEach(({ stat, amount }) => {
          if (!isResourceStat(stat)) {
            permanentBonuses[stat] = (permanentBonuses[stat] ?? 0) + amount
            return
          }
          if (stat === 'mana') {
            resources.mana = Math.max(0, Math.min(maxMana, Math.min(resources.mana, maxMana) + amount))
            return
          }
          resources[stat] += amount
          if (stat === 'experience') handleExperience(resources)
        })
        return { resources, permanentBonuses }
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

    /** Station upgrades install instead of entering the inventory. Returns the ones installed. */
    addItems(items: ItemStack[]): ItemID[] {
      const { stations, rest, installed } = installStations(store.stations(), items)
      patchState(store, (state) => ({
        stations,
        inventory: addItems(state.inventory, store.stats().inventorySlots, rest),
      }))
      return installed
    },

    removeItems(items: ItemStack[]) {
      patchState(store, (state) => ({ inventory: removeItems(state.inventory, items) }))
    },

    /** Whether `adding` fits after `removing` is taken out first. */
    canFitItems(adding: ItemStack[], removing: ItemStack[] = []): boolean {
      return canFit(store.inventory(), store.stats().inventorySlots, adding, removing)
    },

    /** Slots still to free before `adding` fits, after `removing` is taken out first. */
    missingSlotsFor(adding: ItemStack[], removing: ItemStack[] = []): number {
      return missingSlots(store.inventory(), store.stats().inventorySlots, adding, removing)
    },

    /**
     * Whether `inventorySlots` can change by `delta` (negative shrinks) without stranding items,
     * with `adding` still fitting afterwards once `removing` is taken out.
     */
    canChangeInventorySlots(delta: number, adding: ItemStack[] = [], removing: ItemStack[] = []): boolean {
      const capacity = store.stats().inventorySlots + delta
      return fitsCapacity(removeItems(store.inventory(), removing), capacity)
        && canFit(store.inventory(), capacity, adding, removing)
    },

    updateUnlockedNodes(id: SkillNodeID, amount: number) {
      patchState(store, (state) => ({
        unlockedNodes: {
          ...state.unlockedNodes,
          [id]: (state.unlockedNodes[id] || 0) + amount,
        },
      }))
    },

    resetUnlockedNodes() {
      patchState(store, { unlockedNodes: {} })
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
      const slotKey = EquipmentSlot[itemData.slot] as EquipmentSlotKey
      const currentlyEquipped = store.equipment()[slotKey]

      // Remove first so the swapped-out item always has a free slot to return to.
      store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])

      if (currentlyEquipped) {
        store.addItems([{ id: currentlyEquipped.id, tier: currentlyEquipped.tier, amount: 1 }])
      }

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slotKey]: { id: item.id, tier: item.tier } },
      }))
    },

    unequipItem(slot: EquipmentSlotKey) {
      const equippedItem = store.equipment()[slot]

      if (!equippedItem || !store.canUnequip(slot)) return

      store.addItems([{ id: equippedItem.id, tier: equippedItem.tier, amount: 1 }])

      patchState(store, (state) => ({
        equipment: { ...state.equipment, [slot]: null },
      }))
    },

    /** Installs station gear that was kept because it arrived out of order. Returns whether it installed. */
    installStationItem(item: InventoryItem): boolean {
      const itemData = ITEM_DATA[item.id]
      if (itemData.type !== ItemType.stationUpgrade || !canInstall(store.stations(), itemData)) return false

      store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])
      store.addItems([{ id: item.id, amount: 1 }])
      return true
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
      const { mana: currentMana, maxMana, manaRegenRate } = store.stats()
      if (currentMana >= maxMana) {
        if (store.manaRegenTimer() !== 0) patchState(store, { manaRegenTimer: 0 })
        return
      }

      let timer = store.manaRegenTimer() + deltaMs
      let mana = currentMana
      while (timer >= manaRegenRate && mana < maxMana) {
        timer -= manaRegenRate
        mana++
      }
      if (mana >= maxMana) timer = 0

      patchState(store, (state) => ({
        manaRegenTimer: timer,
        ...(mana !== currentMana ? { resources: { ...state.resources, mana } } : {}),
      }))
    },

    /**
     * Crafts up to `times`, limited by ingredients. Blocked by station level and missing inventory space.
     * Returns how many were crafted and which station upgrades got installed.
     */
    craftItem(recipeId: RecipeID, times = 1): { crafted: number, installed: ItemID[] } {
      const recipeData = RECIPES_DATA[recipeId]
      const { maxCraftable, blockReason } = evaluateRecipe(recipeData, store.inventory(), store.stats().inventorySlots, store.stations(), store.unlockedRecipes())
      const count = Math.min(times, maxCraftable)
      if (blockReason || count < 1) return { crafted: 0, installed: [] }

      store.removeItems(recipeData.itemsNeeded.map(({ id, amount }) => ({ id, amount: amount * count })))
      const installed = store.addItems([{ id: recipeData.itemId, amount: recipeData.createsAmount * count }])
      return { crafted: count, installed }
    },

    itemCount(id: ItemID): number {
      return countItem(store.inventory(), id)
    },
  })),
  withMethods((store) => ({
    hasSkillUnlocked(skillId: SkillNodeID): boolean {
      return !!store.unlockedNodes()[skillId]
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

    /** Camp starts with the Workbench. */
    unlockCamp(): void {
      patchState(store, (state) => ({
        campUnlocked: true,
        stations: { [StationID.workbench]: 1, ...state.stations },
      }))
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
          return target.feature === 'camp' ? store.campUnlocked() : store.skillTreeUnlocked()
      }
    },

    applyUnlockTarget(target: UnlockTarget): void {
      switch (target.type) {
        case 'town':
          store.unlockTown(target.townId)
          store.unlockMap()
          break
        case 'feature':
          if (target.feature === 'camp') store.unlockCamp()
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
        const capacity = store.stats().inventorySlots
        patchState(store, (state) => ({ inventory: resizeInventory(state.inventory, capacity) }))
      })

      // Losing maxMana (buff expiry, unequip, respec) drops stored mana with it, so it can't come back later.
      effect(() => {
        const { maxMana } = store.stats()
        if (store.resources().mana > maxMana) {
          patchState(store, (state) => ({ resources: { ...state.resources, mana: maxMana } }))
        }
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
