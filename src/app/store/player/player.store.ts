import { computed, effect, inject } from '@angular/core'
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { calculateXp } from './experience'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem, RecipeItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { UnlockedNodes } from '../../../types/player/unlocked-nodes.type'
import { UnlockedSpellsType } from '../../../types/player/unlocked-spells.type'
import ITEM_DATA from '../../../data/items-data'
import ZONES_DATA from '../../../data/zones-data'
import { killReward, rollEnemyDrops } from './kill-rewards'
import { sellPrice } from '../shop/shop-prices'
import { ShopID } from '../../../enums/ids/shop-id.enum'
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
import { withDevtools } from '../helpers/devtools'
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
  PlayerStatsType,
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

export const TASKS_PER_GUILD_RANK = 5

export const isTaskDone = (task: Task): boolean => task.currentCount >= task.targetCount

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

const stackAmount = (inventory: (InventoryItem | null)[], id: ItemID, tier: ItemTier): number =>
  inventory.reduce((sum, slot) => slot?.id === id && slot.tier === tier ? sum + slot.amount : sum, 0)

type StatSources = { [K in 'resources' | 'permanentBonuses' | 'equipment' | 'unlockedNodes']: () => PlayerState[K] }

const deriveStatsWith = (store: StatSources, buffSpellIds: SpellID[], consumableItemIds: ItemID[]) =>
  deriveStats(store.resources(), [
    ...bonusModifiers(store.permanentBonuses()),
    ...equipmentModifiers(store.equipment()),
    ...skillNodeModifiers(store.unlockedNodes()),
    ...buffModifiers(buffSpellIds),
    ...consumableModifiers(consumableItemIds),
  ])

/** Totals of a batch of kills (an offline claim), applied in one store update. */
export interface KillBatch {
  zoneId: ZoneID
  wave: number
  kills: number
  killsByEnemy: Partial<Record<EnemyID, number>>
  /** Task counts per enemy, Bounty Mark doubles included; capped at each task's target when applied. */
  taskCountsByEnemy: Partial<Record<EnemyID, number>>
  experience: number
  gold: number
  items: InventoryItem[]
}

export interface KillBatchResult {
  levelsGained: number
  /** Drops that landed in the inventory (not the lost ones, not installed station upgrades). */
  receivedItems: InventoryItem[]
  /** Item amounts that didn't fit in the inventory and were lost. */
  lostDrops: number
  installedStations: ItemID[]
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
      stats: computed(() => deriveStatsWith(store, activeBuffs(), activeConsumables())),
    }
  }),
  withComputed((store) => ({
    /** One rank per `TASKS_PER_GUILD_RANK` completed tasks, no cap. Each rank adds a zone tier to the task pool. */
    guildRank: () => Math.floor(store.totalTasksCompleted() / TASKS_PER_GUILD_RANK),
    hasAvailableTaskSlot: () => store.activeTasks().length < store.stats().maxTaskSlots,
    hasCompletedTask: () => store.activeTasks().some(isTaskDone),
    hasTaskInProgress: () => store.activeTasks().some(task => !isTaskDone(task)),
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

    /** Bounty Mark (`taskDoubleKillChance`, percent) can make one kill count twice. */
    updateTaskProgress(monsterId: EnemyID) {
      if (!store.activeTasks().some(task => task.monsterId === monsterId && !isTaskDone(task))) return

      const counts = Math.random() * 100 < store.stats().taskDoubleKillChance ? 2 : 1
      patchState(store, (state) => ({
        activeTasks: state.activeTasks.map(task =>
          task.monsterId === monsterId && !isTaskDone(task)
            ? { ...task, currentCount: Math.min(task.targetCount, task.currentCount + counts) }
            : task,
        ),
      }))
    },

    /** Claims every finished task at once. */
    claimCompletedTasks() {
      const done = store.activeTasks().filter(isTaskDone)
      if (!done.length) return

      patchState(store, (state) => ({
        activeTasks: state.activeTasks.filter(task => !isTaskDone(task)),
        totalTasksCompleted: state.totalTasksCompleted + done.length,
        explorerTokens: state.explorerTokens + done.reduce((sum, task) => sum + task.rewardTokens, 0),
      }))
    },

    /** Cancels the task at `index` in `activeTasks`. Finished tasks can only be claimed. */
    abandonTask(index: number) {
      const task = store.activeTasks()[index]
      if (!task || isTaskDone(task)) return

      patchState(store, (state) => ({
        activeTasks: state.activeTasks.filter(t => t.id !== task.id),
      }))
    },

    /** Returns whether the tokens were spent; never goes below 0. */
    spendTokens(amount: number): boolean {
      if (amount < 0 || store.explorerTokens() < amount) return false
      patchState(store, (state) => ({ explorerTokens: state.explorerTokens - amount }))
      return true
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
      const { experience, gold, dropRolls } = killReward(enemy, ZONES_DATA[zoneId], currentWave, isShiny, store.stats())
      const drops = new Map<string, InventoryItem>()
      rollEnemyDrops(enemy, dropRolls, isShiny, drops, activeQuestIds)
      const itemsToUpdate = [...drops.values()]

      store.updatePlayerStats([
        { stat: 'experience', amount: experience },
        { stat: 'goldCoins', amount: gold },
      ])

      store.updateZoneProgression(zoneId, currentWave)
      store.updateEnemyKillCount(enemyId)
      store.updateTaskProgress(enemyId)

      if (itemsToUpdate.length) store.addItems(itemsToUpdate)
    },

    /** `stats` as it would be with only these buffs and consumable effects running (offline buff segments). */
    statsFor(buffSpellIds: SpellID[], consumableItemIds: ItemID[]): PlayerStatsType {
      return deriveStatsWith(store, buffSpellIds, consumableItemIds)
    },

    /**
     * Applies many kills in one state update: XP (with level-ups), gold, wave and enemy kill counts, task progress
     * and drops. Drops that don't fit are lost, as online.
     */
    applyKillBatch(batch: KillBatch): KillBatchResult {
      const startLevel = store.resources().level
      const capacity = store.stats().inventorySlots
      const { stations, rest, installed } = installStations(store.stations(), batch.items)
      const inventoryBefore = store.inventory()
      const inventory = addItems(inventoryBefore, capacity, rest)
      // Each stack arrives whole or not at all; `rest` holds one entry per id + tier (rolled into a map).
      const receivedItems: InventoryItem[] = rest.flatMap(({ id, tier: requestedTier }) => {
        const tier = requestedTier ?? ITEM_DATA[id].tier
        const amount = stackAmount(inventory, id, tier) - stackAmount(inventoryBefore, id, tier)
        return amount > 0 ? [{ id, type: ITEM_DATA[id].type, tier, amount }] : []
      })
      const received = receivedItems.reduce((sum, item) => sum + item.amount, 0)
      const lostDrops = rest.reduce((sum, item) => sum + item.amount, 0) - received

      patchState(store, (state) => {
        const resources = { ...state.resources }
        resources.goldCoins += batch.gold
        resources.experience += batch.experience
        handleExperience(resources)

        const enemyKillCounts = { ...state.enemyKillCounts }
        for (const [id, kills] of Object.entries(batch.killsByEnemy) as [string, number][]) {
          const enemyId = Number(id) as EnemyID
          enemyKillCounts[enemyId] = (enemyKillCounts[enemyId] ?? 0) + kills
        }

        const zoneProgression = state.zonesProgression[batch.zoneId]
        return {
          resources,
          enemyKillCounts,
          stations,
          inventory,
          zonesProgression: {
            ...state.zonesProgression,
            [batch.zoneId]: { ...zoneProgression, [batch.wave]: (zoneProgression?.[batch.wave] ?? 0) + batch.kills },
          },
          activeTasks: state.activeTasks.map(task => {
            const counts = batch.taskCountsByEnemy[task.monsterId]
            if (!counts || isTaskDone(task)) return task
            return { ...task, currentCount: Math.min(task.targetCount, task.currentCount + counts) }
          }),
        }
      })

      return { levelsGained: store.resources().level - startLevel, receivedItems, lostDrops, installedStations: installed }
    },

    /** Sells up to `amount` from one stack at `shopId`'s price (`sellPrice`). No-op when that shop won't buy it. */
    sellItem(item: InventoryItem, shopId: ShopID, amount = 1) {
      const price = sellPrice(shopId, item.id)
      const owned = store.inventory().find(slot => slot?.id === item.id && slot.tier === item.tier)?.amount ?? 0
      const sold = Math.min(amount, owned)
      if (price <= 0 || sold <= 0) return

      store.removeItems([{ id: item.id, tier: item.tier, amount: sold }])
      store.updatePlayerStats([{ stat: 'goldCoins', amount: price * sold }])
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

    /** One rule for load and play. `waveReached`: something was killed on that wave or a later one of the zone. */
    isUnlockConditionMet(condition: UnlockCondition): boolean {
      switch (condition.type) {
        case 'hasItem':
          return store.inventory().some(i => i?.id === condition.itemId)
        case 'levelReached':
          return store.stats().level >= condition.level
        case 'waveReached': {
          const waves = store.zonesProgression()[condition.zoneId] ?? {}
          return Object.entries(waves).some(([wave, kills]) => Number(wave) >= condition.wave && kills > 0)
        }
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

      // UnlockService takes over (with notifications) once the game runs.
      for (const rule of UNLOCK_RULES) {
        if (store.isUnlockConditionMet(rule.condition)) store.applyUnlockTarget(rule.target)
      }
    },
  })),
)
