import { ChestContents, rollChest } from './chest'
import { WeaponCategory } from '../../../enums/weapon-category.enum'
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
import { rankBonus } from './bestiary-rank'
import { addShinyKills, masteryModifiers, ZoneStar, zoneStarProgress, ZoneStarProgress } from './zone-mastery'
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
import { saveGameStateNow, SaveMigrations, withGameStateSync } from '../helpers/with-game-state-sync.hook'
import {
  addItems,
  lostItems,
  canFit,
  countFreeSlots,
  countItem,
  createInventories,
  Inventories,
  Inventory,
  inventoryCapacity,
  InventoryTab,
  ItemStack,
  MissingSlots,
  missingSlotsByTab,
  removeItems,
  resizeInventory,
  SlotDeltas,
  slotDeltas,
  splitInventory,
  blockedTab,
  tabOf,
  withSlotDeltas,
} from './inventory'
import { canInstall, evaluateRecipe, installStations, Stations } from './camp'
import { ReputationGain, reputationTier, TierUp } from './reputation'
import { StationID } from '../../../enums/ids/station-id.enum'
import { UNLOCK_RULES, UnlockCondition, UnlockTarget } from '../../../data/unlock-conditions'
import { BattleStore } from '../battle/battle.store'
import { EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
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
  SourcedModifiers,
  StatModifier,
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
  /** Shiny kills per zone, for the zone's shiny mastery star. */
  shinyKillsByZone: Partial<Record<ZoneID, number>>
  /** Mastery stars whose chest was claimed (`zone-mastery.ts`). */
  claimedZoneStars: Partial<Record<ZoneID, ZoneStar[]>>
  /** One slot array per tab (`tabOf`). */
  inventory: Inventories;
  /** A chest's roll that didn't fit yet, kept (and saved at once) until that chest opens, so retrying or reloading can't re-roll it. */
  rolledChests: Partial<Record<ItemID, ChestContents>>;
  equipment: EquipmentType;
  unlockedNodes: UnlockedNodes;
  unlockedSpells: UnlockedSpellsType;
  activeTasks: Task[];
  totalTasksCompleted: number;
  explorerTokens: number;
  /** Points per town, never spent or lost; the tier is derived (`reputation.ts`). */
  reputation: Partial<Record<TownID, number>>;
  unlockedContent: UnlockedContent;
  campUnlocked: boolean;
  stations: Stations;
  skillTreeUnlocked: boolean;
  mapUnlocked: boolean;
  unlockedRecipes: RecipeID[];
  spellbookUnlocked: boolean;
  /** Bestiary entries and spells the player has looked at; the rest show as a navbar badge. */
  seenEnemies: EnemyID[];
  seenSpells: SpellID[];
}

export const initialState: PlayerState = {
  resources: initialResources(),
  permanentBonuses: {},
  manaRegenTimer: 0,
  zonesProgression: {},
  inventory: createInventories(),
  rolledChests: {},
  equipment: initialEquipmentState,
  unlockedNodes: {},
  unlockedSpells: {},
  enemyKillCounts: {},
  shinyKillsByZone: {},
  claimedZoneStars: {},
  activeTasks: [],
  totalTasksCompleted: 0,
  explorerTokens: 0,
  reputation: {},
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
  seenEnemies: [],
  seenSpells: [],
}

const revealedEnemies = (kills: PlayerState['enemyKillCounts']): EnemyID[] =>
  (Object.keys(kills).map(Number) as EnemyID[]).filter(id => (kills[id] ?? 0) > 0)

const knownSpells = (spells: UnlockedSpellsType): SpellID[] =>
  (Object.keys(spells).map(Number) as SpellID[]).filter(id => (spells[id] ?? 0) > 0)

/** Spells granted by equipped gear (`EquipmentItem.spell`). */
const equipmentSpells = (equipment: EquipmentType): SpellID[] =>
  Object.values(equipment).flatMap(equipped => {
    const spell = equipped ? (ITEM_DATA[equipped.id] as EquipmentItem).spell : undefined
    return spell === undefined ? [] : [spell]
  })

const unseen = <T>(ids: T[], seen: T[]): T[] => ids.filter(id => !seen.includes(id))

/** Stat modifiers one piece of gear grants (none for an empty slot). */
const gearModifiers = (equipped: { id: ItemID } | null): StatModifier[] =>
  equipped ? ((ITEM_DATA[equipped.id] as EquipmentItem).stats ?? []).map(s => ({ stat: s.id, amount: s.amount })) : []

/** Version 1 Guild Satchels gave +5 slots; version 2 gives +2 to each slot tab. They were the only permanent slot source. */
const V1_SATCHEL_SLOTS = 5
const V2_SATCHEL_SLOTS = 2

/** Version 1 saves held one flat inventory; version 2 splits it into tabs. */
const SAVE_VERSION = 2
const SAVE_MIGRATIONS: SaveMigrations = {
  1: ({ inventory, ...state }) => {
    const bonuses = state['permanentBonuses'] as PlayerState['permanentBonuses'] | undefined
    const slots = bonuses?.inventorySlots
    return {
      ...state,
      ...(Array.isArray(inventory) && { inventory: splitInventory(inventory as Inventory) }),
      ...(slots && { permanentBonuses: { ...bonuses, inventorySlots: Math.round(slots / V1_SATCHEL_SLOTS) * V2_SATCHEL_SLOTS } }),
    }
  },
}

const handleExperience = (resources: Resources) => {
  const xpForNextLevel = calculateXp(resources.level + 1)
  if (resources.experience < xpForNextLevel) return

  resources.level++
  resources.unspentSkillPoints++
  const leftoverXp = resources.experience - xpForNextLevel
  resources.experience = leftoverXp > 0 ? leftoverXp : 0
  handleExperience(resources)
}

const stackAmount = (inventory: Inventories, id: ItemID, tier: ItemTier): number =>
  inventory[tabOf(id)].reduce((sum, slot) => slot?.id === id && slot.tier === tier ? sum + slot.amount : sum, 0)

/** Takes `items` out; a kept chest roll goes with the last chest of its id (sold, destroyed), so a later one rolls fresh. */
const withoutItems = (state: PlayerState, items: ItemStack[]): Pick<PlayerState, 'inventory' | 'rolledChests'> => {
  const inventory = removeItems(state.inventory, items)
  const rolledChests = Object.fromEntries(
    Object.entries(state.rolledChests).filter(([id]) => countItem(inventory, Number(id) as ItemID) > 0))
  return { inventory, rolledChests }
}

type StatSources = { [K in 'resources' | 'permanentBonuses' | 'equipment' | 'unlockedNodes' | 'claimedZoneStars']: () => PlayerState[K] }

/** Every stat modifier, grouped by where it comes from (the stats panel's breakdown order). */
const sourcedModifiersOf = (store: StatSources, buffSpellIds: SpellID[], consumableItemIds: ItemID[]): SourcedModifiers => ({
  equipment: equipmentModifiers(store.equipment()),
  skills: skillNodeModifiers(store.unlockedNodes()),
  buffs: buffModifiers(buffSpellIds),
  consumables: consumableModifiers(consumableItemIds),
  bonuses: bonusModifiers(store.permanentBonuses()),
  mastery: masteryModifiers(store.claimedZoneStars()),
})

/** Totals of a batch of kills (an offline claim), applied in one store update. */
export interface KillBatch {
  zoneId: ZoneID
  wave: number
  kills: number
  shinies: number
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
  withGameStateSync(STORE_KEY, initialState, { version: SAVE_VERSION, migrations: SAVE_MIGRATIONS, transientKeys: ['manaRegenTimer'] }),
  withDevtools(STORE_KEY),
  withComputed((store, battleStore = inject(BattleStore)) => {
    // Buff and consumable timers tick constantly; only a change in what's active should recompute stats.
    const activeBuffs = computed(() => activeBuffSpellIds(battleStore.activeBuffs()), { equal: sameIds })
    const activeConsumables = computed(() => activeConsumableItemIds(battleStore.consumableSlots()), { equal: sameIds })

    const sourcedModifiers = computed(() => sourcedModifiersOf(store, activeBuffs(), activeConsumables()))
    const modifiers = computed(() => Object.values(sourcedModifiers()).flat())

    return {
      sourcedModifiers,
      /** Base stats plus every source; never stored (docs/adr/0002-player-stats-derived-from-sources.md). */
      stats: computed(() => deriveStats(store.resources(), modifiers())),
      /** Slots per tab: the `inventorySlots` stat keyed by tab, derived like `stats`. */
      inventoryCapacity: computed(() => inventoryCapacity(modifiers())),
    }
  }),
  withComputed((store, battleStore = inject(BattleStore)) => {
    /** Spells from the skill tree plus spells from equipped gear. */
    const knownSpellIds = computed(() => [
      ...new Set([...knownSpells(store.unlockedSpells()), ...equipmentSpells(store.equipment())]),
    ])

    /** Known spells not on the spell bar and not yet viewed: what the Spellbook palette shows as new. */
    const unseenSpells = computed(() => {
      const equipped = battleStore.equippedSpells().map(slot => slot?.spellId)
      return unseen(knownSpellIds(), store.seenSpells()).filter(id => !equipped.includes(id))
    })

    return {
      knownSpellIds,
      unseenSpells,
      unseenSpellCount: () => unseenSpells().length,
    }
  }),
  withComputed((store) => ({
    /** One rank per `TASKS_PER_GUILD_RANK` completed tasks, no cap. Each rank adds a zone tier to the task pool. */
    guildRank: () => Math.floor(store.totalTasksCompleted() / TASKS_PER_GUILD_RANK),
    hasAvailableTaskSlot: () => store.activeTasks().length < store.stats().maxTaskSlots,
    hasCompletedTask: () => store.activeTasks().some(isTaskDone),
    hasTaskInProgress: () => store.activeTasks().some(task => !isTaskDone(task)),
    unseenEnemyCount: () => unseen(revealedEnemies(store.enemyKillCounts()), store.seenEnemies()).length,
    equippedWeaponDamageType: () => {
      const weapon = store.equipment().weapon
      if (!weapon) return DamageElement.physical
      return (ITEM_DATA[weapon.id] as EquipmentItem).damageType ?? DamageElement.physical
    },
    /** Melee without a weapon. */
    equippedWeaponCategory: () => {
      const weapon = store.equipment().weapon
      return (weapon && (ITEM_DATA[weapon.id] as EquipmentItem).weaponCategory) ?? WeaponCategory.melee
    },
    /** Mastery star progress for every zone. */
    zoneMastery: computed(() => {
      const state = {
        enemyKillCounts: store.enemyKillCounts(),
        shinyKillsByZone: store.shinyKillsByZone(),
        claimedZoneStars: store.claimedZoneStars(),
      }
      return Object.fromEntries(
        (Object.keys(ZONES_DATA).map(Number) as ZoneID[]).map(id => [id, zoneStarProgress(id, state)]),
      ) as Record<ZoneID, ZoneStarProgress[]>
    }),
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
        inventory: addItems(state.inventory, store.inventoryCapacity(), rest),
      }))
      return installed
    },

    removeItems(items: ItemStack[]) {
      patchState(store, (state) => withoutItems(state, items))
    },

    /** Throws away the whole stack (same id and tier). Quest items can't be destroyed; returns whether anything was. */
    destroyItem(item: InventoryItem): boolean {
      if (item.type === ItemType.quest) return false
      patchState(store, (state) => withoutItems(state, [{ id: item.id, amount: item.amount, tier: item.tier }]))
      return true
    },

    /** Whether `adding` fits, each item in its tab, after `removing` is taken out first. */
    canFitItems(adding: ItemStack[], removing: ItemStack[] = []): boolean {
      return canFit(store.inventory(), store.inventoryCapacity(), adding, removing)
    },

    /** Slots still to free in each tab before `adding` fits, after `removing` is taken out first. */
    missingSlotsByTab(adding: ItemStack[], removing: ItemStack[] = []): MissingSlots {
      return missingSlotsByTab(store.inventory(), store.inventoryCapacity(), adding, removing)
    },

    /**
     * Whether each tab's capacity can change by `deltas` (negative shrinks) without stranding items in any tab,
     * with `adding` still fitting afterwards once `removing` is taken out.
     */
    canChangeInventorySlots(deltas: SlotDeltas, adding: ItemStack[] = [], removing: ItemStack[] = []): boolean {
      const capacity = store.inventoryCapacity()
      return blockedTab(store.inventory(), capacity, withSlotDeltas(capacity, deltas), adding, removing) === null
    },

    /** The tab that stops `canChangeInventorySlots`, so a message can name it; null when none does. */
    slotChangeBlockedTab(deltas: SlotDeltas, adding: ItemStack[] = [], removing: ItemStack[] = []): InventoryTab | null {
      const capacity = store.inventoryCapacity()
      return blockedTab(store.inventory(), capacity, withSlotDeltas(capacity, deltas), adding, removing)
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
        slotDeltas([], gearModifiers(equipped)),
        [{ id: equipped.id, tier: equipped.tier, amount: 1 }],
      )
    },

    canEquip(item: InventoryItem): boolean {
      // Only items with an equipment slot can be equipped; anything else would land under an undefined slot key.
      const slot = (ITEM_DATA[item.id] as EquipmentItem).slot
      if (slot === undefined) return false
      const slotKey = EquipmentSlot[slot] as EquipmentSlotKey
      const equipped = store.equipment()[slotKey]
      const deltas = slotDeltas(gearModifiers(item), gearModifiers(equipped))
      const adding = equipped ? [{ id: equipped.id, tier: equipped.tier, amount: 1 }] : []
      return store.canChangeInventorySlots(deltas, adding, [{ id: item.id, tier: item.tier, amount: 1 }])
    },

    /** Finished, unclaimed, and its chest's items fit in the inventory. */
    canClaimZoneStar(zoneId: ZoneID, star: ZoneStar): boolean {
      const progress = store.zoneMastery()[zoneId].find(p => p.star === star)
      if (!progress?.done || progress.claimed) return false
      return store.canFitItems(ZONES_DATA[zoneId].masteryReward.items)
    },
  })),
  withMethods((store) => ({
    processBattleEnd(enemyId: EnemyID, zoneId: ZoneID, currentWave: number, isShiny: boolean, activeQuestIds?: Set<QuestID>): ItemStack[] {
      const enemy = ENEMIES_DATA[enemyId]
      const { experience, gold, dropRolls } = killReward(enemy, ZONES_DATA[zoneId], currentWave, isShiny, store.stats())
      const drops = new Map<string, InventoryItem>()
      const { dropChance } = rankBonus(enemyId, store.enemyKillCounts()[enemyId] ?? 0)
      rollEnemyDrops(enemy, dropRolls, isShiny, dropChance, drops, activeQuestIds)
      const itemsToUpdate = [...drops.values()]

      store.updatePlayerStats([
        { stat: 'experience', amount: experience },
        { stat: 'goldCoins', amount: gold },
      ])

      store.updateZoneProgression(zoneId, currentWave)
      store.updateEnemyKillCount(enemyId)
      store.updateTaskProgress(enemyId)
      if (isShiny) patchState(store, (state) => ({ shinyKillsByZone: addShinyKills(state.shinyKillsByZone, zoneId, 1) }))

      // Station upgrades install instead of being stored, so they never count as lost.
      const lost = lostItems(store.inventory(), store.inventoryCapacity(), installStations(store.stations(), itemsToUpdate).rest)
      if (itemsToUpdate.length) store.addItems(itemsToUpdate)
      return lost
    },

    /** `stats` as it would be with only these buffs and consumable effects running (offline buff segments). */
    statsFor(buffSpellIds: SpellID[], consumableItemIds: ItemID[]): PlayerStatsType {
      return deriveStats(store.resources(), Object.values(sourcedModifiersOf(store, buffSpellIds, consumableItemIds)).flat())
    },

    /**
     * Applies many kills in one state update: XP (with level-ups), gold, wave and enemy kill counts, task progress
     * and drops. Drops that don't fit are lost, as online.
     */
    applyKillBatch(batch: KillBatch): KillBatchResult {
      const startLevel = store.resources().level
      const capacity = store.inventoryCapacity()
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
          shinyKillsByZone: addShinyKills(state.shinyKillsByZone, batch.zoneId, batch.shinies),
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

    /** Pays the zone's mastery chest for a finished, unclaimed star. Refused when the items don't fit (`canClaimZoneStar`). */
    claimZoneStar(zoneId: ZoneID, star: ZoneStar): boolean {
      if (!store.canClaimZoneStar(zoneId, star)) return false
      const { gold, explorerTokens, items } = ZONES_DATA[zoneId].masteryReward

      store.updatePlayerStats([{ stat: 'goldCoins', amount: gold }])
      store.addItems(items)
      patchState(store, (state) => ({
        explorerTokens: state.explorerTokens + explorerTokens,
        claimedZoneStars: { ...state.claimedZoneStars, [zoneId]: [...(state.claimedZoneStars[zoneId] ?? []), star] },
      }))
      return true
    },

    /** Sells up to `amount` from one stack at `shopId`'s price (`sellPrice`). No-op when that shop won't buy it. */
    sellItem(item: InventoryItem, shopId: ShopID, amount = 1) {
      const price = sellPrice(shopId, item.id)
      const owned = store.inventory()[tabOf(item.id)].find(slot => slot?.id === item.id && slot.tier === item.tier)?.amount ?? 0
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

      if (itemData.type === ItemType.spellScroll) {
        if (store.knownSpellIds().includes(itemData.spellId)) return
        store.levelUpSpell(itemData.spellId)
        store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])
        return
      }

      if (itemData.type !== ItemType.rewardsStats) return

      const statsToUpdate = itemData.stats.map(s => ({ stat: s.id, amount: s.amount }))
      store.updatePlayerStats(statsToUpdate)
      store.removeItems([{ id: item.id, tier: item.tier, amount: 1 }])
    },

    /**
     * Rolls one chest (or reuses its kept roll) and opens it when the rolled items fit; otherwise keeps the roll and
     * returns the slots to free per tab (owner rule: only what was actually rolled needs room). Saved at once either
     * way, so reloading can't undo an opening or re-roll a kept roll.
     */
    openChest(item: InventoryItem, rng: () => number = Math.random): { contents: ChestContents | null, missing: MissingSlots } {
      const itemData = ITEM_DATA[item.id]
      if (itemData.type !== ItemType.chest) return { contents: null, missing: {} }
      const chest = { id: item.id, tier: item.tier, amount: 1 }
      const contents = store.rolledChests()[item.id] ?? rollChest(itemData, rng)
      const missing = store.missingSlotsByTab(contents.items, [chest])
      const rolledChests = { ...store.rolledChests() }
      const blocked = Object.keys(missing).length > 0

      if (blocked) {
        rolledChests[item.id] = contents
        patchState(store, { rolledChests })
      } else {
        delete rolledChests[item.id]
        patchState(store, { rolledChests })
        store.removeItems([chest])
        if (contents.gold) store.updatePlayerStats([{ stat: 'goldCoins', amount: contents.gold }])
        if (contents.items.length) store.addItems(contents.items)
      }
      saveGameStateNow()
      return { contents: blocked ? null : contents, missing }
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
      const { maxCraftable, blockReason } = evaluateRecipe(recipeData, store.inventory(), store.inventoryCapacity(), store.stations(), store.unlockedRecipes())
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

    /** Adds points per town; returns each town whose tier went up, once, with its new tier. */
    addReputation(gains: ReputationGain[]): TierUp[] {
      const before = store.reputation()
      const after = { ...before }
      gains.forEach(({ townId, amount }) => after[townId] = (after[townId] ?? 0) + amount)
      patchState(store, { reputation: after })
      return [...new Set(gains.map(gain => gain.townId))]
        .map(townId => ({ townId, tier: reputationTier(after[townId] ?? 0) }))
        .filter(({ townId, tier }) => tier > reputationTier(before[townId] ?? 0))
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

    markEnemiesSeen(): void {
      const fresh = unseen(revealedEnemies(store.enemyKillCounts()), store.seenEnemies())
      if (fresh.length) patchState(store, { seenEnemies: [...store.seenEnemies(), ...fresh] })
    },

    markSpellsSeen(): void {
      const fresh = store.unseenSpells()
      if (fresh.length) patchState(store, { seenSpells: [...store.seenSpells(), ...fresh] })
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
          return countItem(store.inventory(), condition.itemId) > 0
        case 'levelReached':
          return store.stats().level >= condition.level
        case 'waveReached': {
          const waves = store.zonesProgression()[condition.zoneId] ?? {}
          return Object.entries(waves).some(([wave, kills]) => Number(wave) >= condition.wave && kills > 0)
        }
        case 'questCompleted':
          return false // UnlockService checks it; the unlocked target itself is saved.
      }
    },
  })),
  withHooks((store) => ({
    // Re-apply unlocks for existing saves silently (no notifications).
    onInit() {
      // Raising a tab's capacity grows that tab; it never shrinks here.
      effect(() => {
        const capacity = store.inventoryCapacity()
        patchState(store, (state) => ({ inventory: resizeInventory(state.inventory, capacity) }))
      })

      // Losing maxMana (buff expiry, unequip, respec) drops stored mana with it, so it can't come back later.
      effect(() => {
        const { maxMana } = store.stats()
        if (store.resources().mana > maxMana) {
          patchState(store, (state) => ({ resources: { ...state.resources, mana: maxMana } }))
        }
      })

      // A spell from gear leaves the spell bar with the gear (unequip, swap), but only once its cooldown is over: the
      // slot stays locked meanwhile (no free slot for another spell), and re-equipping the gear keeps the cooldown.
      const battleStore = inject(BattleStore)
      const isGone = (slot: EquippedSpell | null, known: SpellID[]) =>
        !!slot && !known.includes(slot.spellId) && slot.cooldownRemainingMs <= 0
      effect(() => {
        const known = store.knownSpellIds()
        const bar = battleStore.equippedSpells()
        if (bar.some(slot => isGone(slot, known))) {
          battleStore.setAllEquippedSpells(bar.map(slot => isGone(slot, known) ? null : slot))
        }
      })

      // UnlockService takes over (with notifications) once the game runs.
      for (const rule of UNLOCK_RULES) {
        if (store.isUnlockConditionMet(rule.condition)) store.applyUnlockTarget(rule.target)
      }
    },
  })),
)
