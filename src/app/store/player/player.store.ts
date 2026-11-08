import { ChestContents, rollChest } from './chest'
import { PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE } from '../../../data/upgrade-data'
import { evaluateMerge, MergeResult, MergeSource, rollMerge } from './merge'
import { WeaponCategory } from '../../../enums/weapon-category.enum'
import { computed, effect, inject, untracked } from '@angular/core'
import { NoticesService } from '../../services/notices.service'
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { addResources, gainOf, Held, manaRegen, NO_GAIN, ResourceChange, ResourceGain, spendResource } from './resources'
import { initialEquipmentState, statsInitialState } from './player'
import { EquipmentItem, InventoryItem, RecipeItem } from 'interfaces/item.interface'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { EquipmentType } from 'interfaces/player/equipment.type'
import { ZonesProgression } from '../../../types/player/zones-progression.type'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'
import { UnlockedNodes } from '../../../types/player/unlocked-nodes.type'
import ITEM_DATA from '../../../data/items-data'
import ZONES_DATA from '../../../data/zones-data'
import type { KillBatch } from './kill-rewards'
import { addShinyKills, masteryModifiers, ZoneStar, zoneStarProgress, ZoneStarProgress } from './zone-mastery'
import { sellPrice } from '../shop/shop-prices'
import { ShopID } from '../../../enums/ids/shop-id.enum'
import { ShopCurrency } from '../../../types/shop/shop.type'
import { EquipmentSlotKey } from '../../../enums/equipment-slot.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import RECIPES_DATA from '../../../data/recipes-data'
import { RecipeID } from '../../../enums/ids/recipe-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { SkillNodeID } from '../../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { TownID } from '../../../enums/map/town-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { DamageElement } from '../../../enums/damage-element.enum'
import { withDevtools } from '../helpers/devtools'
import { GameClock } from '../../services/game-clock.service'
import { saveGameStateNow, SaveMigrations, withGameStateSync } from '../helpers/with-game-state-sync.hook'
import {
  stackKey,
  countFreeSlots,
  countItem,
  createInventories,
  Inventories,
  Inventory,
  inventoryCapacity,
  InventoryTab,
  ItemStack,
  MissingSlots,
  removeItems,
  resizeInventory,
  SlotDeltas,
  splitInventory,
  blockedTab,
  tabOf,
  withSlotDeltas,
} from './inventory'
import { canGrant, grantItems, grantMissing, GrantMode, GrantReport, GrantState } from './grant'
import { canInstall, evaluateRecipe, Stations } from './camp'
import { GearPlan, planEquip, planUnequip } from './equipment'
import { DEFAULT_ZONES, isUnlocked, withUnlocked } from './unlocked-content'
import { FARM_SEEDS } from '../../../data/farming-data'
import { FarmState, harvest as harvestPlot, harvestAll as harvestEveryPlot, initialFarm, isFarmUnlocked, plant as plantInPlot, plantAll as plantEveryPlot, syncPlots } from './farm'
import { ReputationGain, reputationTier, TierUp } from './reputation'
import { newProfession, professionLevel, professionLevels, Professions, professionXpMultiplier, settleProfession } from './professions'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { SiteID } from '../../../enums/ids/site-id.enum'
import PROFESSIONS_DATA from '../../../data/professions-data'
import { ReputationTier } from '../../../enums/reputation-tier.enum'
import { TitleID } from '../../../enums/ids/title-id.enum'
import TITLES_DATA from '../../../data/titles-data'
import { StationID } from '../../../enums/ids/station-id.enum'
import { UnlockTarget } from '../../../data/unlock-conditions'
import { BattleStore } from '../battle/battle.store'
import { ALL_SKILLS } from '../../../data/skill-tree-data'
import { abandonTask, acceptTask, claimTasks, guildRank, hasFreeTaskSlot, isTaskDone, progressTasks, Task, TaskSlice } from './tasks'
import { SkillNodeType } from '../../../enums/skill-node-type.enum'
import {
  activeBuffSpellIds,
  activeConsumableItemIds,
  bonusModifiers,
  buffModifiers,
  consumableModifiers,
  deriveStats,
  equipmentModifiers,
  expertiseModifiers,
  foodMultiplierOf,
  initialResources,
  isResourceStat,
  PlayerStatsType,
  Resources,
  sameIds,
  skillNodeModifiers,
  SourcedModifiers,
} from './stats'

export type { PlayerStatsType } from './stats'

/** What one XP change did to a profession; `skillPoints` were paid for the levels in between. */
export interface ProfessionGain {
  professionId: ProfessionID
  from: number
  to: number
  skillPoints: number
}

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
  /** Spell levels from used spell scrolls, the one spell source saved nowhere else; known spells are derived (`knownSpellIds`). */
  scrollSpellLevels: SpellLevels;
  activeTasks: Task[];
  totalTasksCompleted: number;
  explorerTokens: number;
  /** Points per town, never spent or lost; the tier is derived (`reputation.ts`). */
  reputation: Partial<Record<ReputationID, number>>;
  /** Unlocked professions with their XP; a missing entry is locked. The level is derived (`professions.ts`). */
  professions: Professions;
  /** Plots and the seed counts; seeds never enter the inventory (`farm.ts`). */
  farm: FarmState;
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
  /** The earned title shown in the stats panel; `null` shows none. Earned titles are derived, not saved. */
  selectedTitle: TitleID | null;
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
  scrollSpellLevels: {},
  enemyKillCounts: {},
  shinyKillsByZone: {},
  claimedZoneStars: {},
  activeTasks: [],
  totalTasksCompleted: 0,
  explorerTokens: 0,
  reputation: {},
  professions: {},
  farm: initialFarm,
  unlockedContent: {
    zones: DEFAULT_ZONES,
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
  selectedTitle: null,
}

const revealedEnemies = (kills: PlayerState['enemyKillCounts']): EnemyID[] =>
  (Object.keys(kills).map(Number) as EnemyID[]).filter(id => (kills[id] ?? 0) > 0)

type SpellLevels = Partial<Record<SpellID, number>>

/** Spell levels from owned skill nodes: each level of a node that teaches the spell. */
export const nodeSpellLevels = (nodes: UnlockedNodes): SpellLevels => {
  const levels: SpellLevels = {}
  for (const [key, level] of Object.entries(nodes)) {
    const node = ALL_SKILLS[Number(key) as SkillNodeID]
    if (node?.type !== SkillNodeType.spell || node.spellId === undefined || !level) continue
    levels[node.spellId] = (levels[node.spellId] ?? 0) + level
  }
  return levels
}

const learnedSpells = (...sources: SpellLevels[]): SpellID[] =>
  sources.flatMap(levels => (Object.keys(levels).map(Number) as SpellID[]).filter(id => (levels[id] ?? 0) > 0))

/** Spells granted by equipped gear (`EquipmentItem.spell`). */
const equipmentSpells = (equipment: EquipmentType): SpellID[] =>
  Object.values(equipment).flatMap(equipped => {
    const spell = equipped ? (ITEM_DATA[equipped.id] as EquipmentItem).spell : undefined
    return spell === undefined ? [] : [spell]
  })

const unseen = <T>(ids: T[], seen: T[]): T[] => ids.filter(id => !seen.includes(id))

/** Version 1 Guild Satchels gave +5 slots; version 2 gives +2 to each slot tab. They were the only permanent slot source. */
const V1_SATCHEL_SLOTS = 5
const V2_SATCHEL_SLOTS = 2

/** Version 1 saves held one flat inventory; version 2 splits it into tabs. Version 3 saves scroll spell levels, not every source's. */
const SAVE_VERSION = 3
export const SAVE_MIGRATIONS: SaveMigrations = {
  1: ({ inventory, ...state }) => {
    const bonuses = state['permanentBonuses'] as PlayerState['permanentBonuses'] | undefined
    const slots = bonuses?.inventorySlots
    return {
      ...state,
      ...(Array.isArray(inventory) && { inventory: splitInventory(inventory as Inventory) }),
      ...(slots && { permanentBonuses: { ...bonuses, inventorySlots: Math.round(slots / V1_SATCHEL_SLOTS) * V2_SATCHEL_SLOTS } }),
    }
  },
  // `unlockedSpells` summed node and scroll levels; what the owned nodes don't explain came from scrolls.
  2: ({ unlockedSpells, ...state }) => {
    const fromNodes = nodeSpellLevels((state['unlockedNodes'] ?? {}) as UnlockedNodes)
    const scrollSpellLevels = Object.fromEntries(Object.entries((unlockedSpells ?? {}) as Record<string, number>)
      .map(([id, level]) => [id, level - (fromNodes[Number(id) as SpellID] ?? 0)])
      .filter(([, level]) => (level as number) > 0))
    return { ...state, scrollSpellLevels }
  },
}

/** Takes `items` out; a kept chest roll goes with the last chest of its id at any upgrade level (sold, destroyed), so a later one rolls fresh. */
type StateSignals<K extends keyof PlayerState> = { [P in K]: () => PlayerState[P] }

const taskSlice = (store: StateSignals<'activeTasks' | 'totalTasksCompleted'>): TaskSlice => ({
  activeTasks: store.activeTasks(),
  totalTasksCompleted: store.totalTasksCompleted(),
})

type ResourceSlice = Pick<PlayerState, 'resources' | 'explorerTokens'>
/** Resources and tokens in the shape `resources.ts` works on, and back. */
const heldOf = (state: ResourceSlice): Held => ({ ...state.resources, explorerTokens: state.explorerTokens })
const sliceOf = ({ explorerTokens, ...resources }: Held): ResourceSlice => ({ resources, explorerTokens })
const heldNow = (store: StateSignals<'resources' | 'explorerTokens'>): Held =>
  heldOf({ resources: store.resources(), explorerTokens: store.explorerTokens() })

const grantStateOf = (store: StateSignals<'inventory' | 'stations' | 'farm' | 'spellbookUnlocked'>): GrantState => ({
  inventory: store.inventory(),
  stations: store.stations(),
  seeds: store.farm().seeds,
  spellbookUnlocked: store.spellbookUnlocked(),
})

const withoutItems = (state: PlayerState, items: ItemStack[]): Pick<PlayerState, 'inventory' | 'rolledChests'> => {
  const inventory = removeItems(state.inventory, items)
  const rolledChests = Object.fromEntries(Object.entries(state.rolledChests).filter(([key]) => {
    const id = Number(key) as ItemID
    return inventory[tabOf(id)].some(slot => slot?.id === id)
  }))
  return { inventory, rolledChests }
}

type StatSources = { [K in 'resources' | 'permanentBonuses' | 'equipment' | 'unlockedNodes' | 'claimedZoneStars' | 'professions']: () => PlayerState[K] }

/** Every stat modifier, grouped by where it comes from (the stats panel's breakdown order). */
const sourcedModifiersOf = (store: StatSources, buffSpellIds: SpellID[], consumableItemIds: ItemID[]): SourcedModifiers => {
  const equipment = equipmentModifiers(store.equipment())
  return {
    equipment,
    skills: skillNodeModifiers(store.unlockedNodes()),
    buffs: buffModifiers(buffSpellIds),
    consumables: consumableModifiers(consumableItemIds, foodMultiplierOf(equipment)),
    bonuses: bonusModifiers(store.permanentBonuses()),
    mastery: masteryModifiers(store.claimedZoneStars()),
    expertise: expertiseModifiers(professionLevels(store.professions())),
  }
}

export interface KillBatchResult {
  levelsGained: number
  /** XP, levels and gold the batch paid. */
  gain: ResourceGain
  /** Drops that landed in the inventory (not the lost ones, not installed station upgrades). */
  receivedItems: InventoryItem[]
  /** Drops that didn't fit in the inventory and were lost. */
  lost: ItemStack[]
  /** Total amount of `lost`. */
  lostDrops: number
  installedStations: ItemID[]
}

const STORE_KEY = 'playerStore'

// Blocks are ordered by dependency (a block sees only what earlier blocks define), not by topic; each starts with
// a label. Pure logic lives in the sibling files (stats.ts, inventory.ts, reputation.ts, zone-mastery.ts, ...).
export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState, { version: SAVE_VERSION, migrations: SAVE_MIGRATIONS, transientKeys: ['manaRegenTimer'] }),
  withDevtools(STORE_KEY),
  // Stats: derived `stats`, their sources, inventory capacity.
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
  // Spells: known and unseen.
  withComputed((store, battleStore = inject(BattleStore)) => {
    /** Derived from the sources, like `stats`: skill nodes, used spell scrolls and equipped gear. */
    const knownSpellIds = computed(() => [
      ...new Set([...learnedSpells(nodeSpellLevels(store.unlockedNodes()), store.scrollSpellLevels()), ...equipmentSpells(store.equipment())]),
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
  // Guild rank and tasks, titles, bestiary, equipped weapon, zone mastery.
  withComputed((store) => ({
    canRegisterPathfindersSeal: computed(() => (store.permanentBonuses().upgradedDropChance ?? 0) === 0
      && countItem(store.inventory(), ItemID.pathfindersSeal) > 0),
    guildRank: () => guildRank(store.totalTasksCompleted()),
    /** Titles whose source is met, in `TitleID` order. */
    earnedTitles: computed(() => (Object.keys(TITLES_DATA).map(Number) as TitleID[]).filter(id => {
      const source = TITLES_DATA[id]
      return reputationTier(store.reputation()[source.reputationId] ?? 0) >= source.tier
    })),
    hasAvailableTaskSlot: () => hasFreeTaskSlot(store.activeTasks(), store.stats().maxTaskSlots),
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
  // The growth rate plots accrue at, and the Game time they accrue on: `syncFarm` keeps it until the watcher in `onInit` sees the rate change.
  withProps(() => ({ _farmRate: { current: null as number | null }, _gameClock: inject(GameClock), _notices: inject(NoticesService) })),
  // Basic writes: stats, zone progress, kill counts, inventory and capacity, skill nodes, spell levels, guild tasks, tokens.
  withMethods((store) => ({
    resetState() {
      patchState(store, initialState)
    },

    /**
     * Earns or spends resources (gold, XP, mana, skill points), or grants a permanent stat bonus.
     * Equipment, skill nodes, buffs and consumables are not applied here: `stats` derives them from their source.
     */
    updatePlayerStats(statsUpdates: { stat: PlayerStat; amount: number }[]): ResourceGain {
      const maxMana = store.stats().maxMana
      let gain = NO_GAIN
      patchState(store, (state) => {
        const before = heldOf(state)
        let held = before
        const permanentBonuses = { ...state.permanentBonuses }
        statsUpdates.forEach(({ stat, amount }) => {
          if (!isResourceStat(stat)) {
            permanentBonuses[stat] = (permanentBonuses[stat] ?? 0) + amount
            return
          }
          held = addResources(held, { [stat]: amount }, maxMana).held
        })
        gain = gainOf(before, held, maxMana)
        return { ...sliceOf(held), permanentBonuses }
      })
      store._notices.push({ type: 'currency', gain })
      return gain
    },

    /** Adds gold, tokens, XP (with level-ups) or mana; spends go through `spend`. Kills pass `silent`: kill gold doesn't float. */
    changeResources(change: ResourceChange, { silent = false } = {}): ResourceGain {
      const { held, gain } = addResources(heldNow(store), change, store.stats().maxMana)
      patchState(store, sliceOf(held))
      if (!silent) store._notices.push({ type: 'currency', gain })
      return gain
    },

    updateEnemyKillCount(enemyId: EnemyID, amount = 1) {
      patchState(store, (state) => ({
        enemyKillCounts: {
          ...state.enemyKillCounts,
          [enemyId]: (state.enemyKillCounts[enemyId] || 0) + amount,
        },
      }))
    },

    /**
     * The only writer of an Item grant (`grantItems`): seeds go to the seed store, books unlock, station gear installs
     * (each shows its notice, whoever gave it), the rest goes to its tab. `removing` is taken out first. Atomic changes
     * nothing when anything doesn't fit (see `missing`); lossy is for kills only.
     */
    grant(items: ItemStack[], mode: GrantMode, removing: ItemStack[] = []): GrantReport {
      const before = grantStateOf(store)
      const { state, ...report } = grantItems(before, store.inventoryCapacity(), items, mode, removing)
      // A refused grant hands back `before` itself.
      if (state !== before) {
        patchState(store, (current) => ({
          inventory: state.inventory,
          stations: state.stations,
          farm: { ...current.farm, seeds: state.seeds },
          spellbookUnlocked: state.spellbookUnlocked,
        }))
      }
      report.installed.forEach(itemId => store._notices.push({ type: 'stationInstalled', itemId }))
      return report
    },

    /** Accrues plot growth up to `now` at the rate in force since the last change of `seedGrowthTimeReduction`. */
    syncFarm(now = store._gameClock.nowMs()) {
      const rate = store._farmRate.current ?? store.stats().seedGrowthTimeReduction
      patchState(store, (state) => ({ farm: { ...state.farm, plots: syncPlots(state.farm.plots, now, rate) } }))
    },

    removeItems(items: ItemStack[]) {
      patchState(store, (state) => withoutItems(state, items))
    },

    /** Consume the Seal and save its one-time lesson together; repeated or stale effects do nothing. */
    registerPathfindersSeal(): boolean {
      if (!store.canRegisterPathfindersSeal()) return false
      patchState(store, state => ({
        inventory: removeItems(state.inventory, [{ id: ItemID.pathfindersSeal, amount: 1 }]),
        permanentBonuses: { ...state.permanentBonuses, upgradedDropChance: PATHFINDERS_SEAL_UPGRADED_DROP_CHANCE },
      }))
      saveGameStateNow()
      return true
    },

    /** Throws away the whole stack (same id, tier and upgrade level). Quest items can't be destroyed; returns whether anything was. */
    destroyItem(item: InventoryItem): boolean {
      if (item.type === ItemType.quest) return false
      patchState(store, (state) => withoutItems(state, [{ id: item.id, amount: item.amount, tier: item.tier, upgradeLevel: item.upgradeLevel }]))
      return true
    },

    /** Whether `grant(adding, 'atomic', removing)` would go through; the same routing, nothing written. */
    canGrant(adding: ItemStack[], removing: ItemStack[] = []): boolean {
      return canGrant(grantStateOf(store), store.inventoryCapacity(), adding, removing)
    },

    /** Slots still to free in each tab before `adding` can be granted, after `removing` is taken out first. */
    missingSlotsByTab(adding: ItemStack[], removing: ItemStack[] = []): MissingSlots {
      return grantMissing(grantStateOf(store), store.inventoryCapacity(), adding, removing)
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

    /** Refused (false) when every task slot is taken. */
    acceptTask(task: Task): boolean {
      const next = acceptTask(taskSlice(store), task, store.stats().maxTaskSlots)
      if (!next) return false
      patchState(store, { activeTasks: next.activeTasks })
      return true
    },

    /** Claims every finished task at once. */
    claimCompletedTasks(): ResourceGain {
      const { slice, tokens } = claimTasks(taskSlice(store))
      if (slice.totalTasksCompleted === store.totalTasksCompleted()) return NO_GAIN
      const { held, gain } = addResources(heldNow(store), { explorerTokens: tokens }, store.stats().maxMana)
      patchState(store, { ...slice, ...sliceOf(held) })
      store._notices.push({ type: 'currency', gain })
      return gain
    },

    /** Cancels the task at `index` in `activeTasks`. Finished tasks can only be claimed. */
    abandonTask(index: number) {
      patchState(store, abandonTask(taskSlice(store), index))
    },
  })),
  // Equip and zone-star checks.
  withMethods((store) => ({
    /** What the player holds of a shop currency. A new `ShopCurrency` fails to compile until handled here. */
    balanceOf(currency: ShopCurrency): number {
      switch (currency) {
        case 'gold':
          return store.stats().goldCoins
        case 'explorerTokens':
          return store.explorerTokens()
      }
    },

    /** Takes `amount` of `currency`; null (and nothing changes) when the player holds less, so a balance never goes below 0. */
    spend(currency: ShopCurrency, amount: number): ResourceGain | null {
      const spent = spendResource(heldNow(store), currency, amount)
      if (!spent) return null
      patchState(store, sliceOf(spent.held))
      store._notices.push({ type: 'currency', gain: spent.gain })
      return spent.gain
    },

    canUnequip(slot: EquipmentSlotKey): boolean {
      const plan = planUnequip(slot, store.equipment())
      return !!plan && store.canChangeInventorySlots(plan.deltas, plan.returning, plan.removing)
    },

    /** Writes a checked Gear plan: the worn gear returns, the slot changes. Refused grants (nothing fits) change nothing. */
    _wearPlan(plan: GearPlan): void {
      const { missing } = store.grant(plan.returning, 'atomic', plan.removing)
      if (Object.keys(missing).length > 0) return
      patchState(store, (state) => ({ equipment: { ...state.equipment, [plan.slot]: plan.equipped } }))
    },

    /** False for an item without an equipment slot: anything else would land under an undefined slot key. */
    canEquip(item: InventoryItem): boolean {
      const plan = planEquip(item, store.equipment())
      return !!plan && store.canChangeInventorySlots(plan.deltas, plan.returning, plan.removing)
    },

    /** Finished, unclaimed, and its chest's items fit in the inventory. */
    canClaimZoneStar(zoneId: ZoneID, star: ZoneStar): boolean {
      const progress = store.zoneMastery()[zoneId].find(p => p.star === star)
      if (!progress?.done || progress.claimed) return false
      return store.canGrant(ZONES_DATA[zoneId].masteryReward.items)
    },
  })),
  // Game actions: kills and drops, zone stars, selling, equipping, using items and chests, mana regen, crafting.
  withMethods((store) => ({
    /** `stats` as it would be with only these buffs and consumable effects running (offline buff segments). */
    statsFor(buffSpellIds: SpellID[], consumableItemIds: ItemID[]): PlayerStatsType {
      return deriveStats(store.resources(), Object.values(sourcedModifiersOf(store, buffSpellIds, consumableItemIds)).flat())
    },

    /**
     * The only writer of kill rewards (`KillResolutionService`): XP (with level-ups), gold, wave and enemy kill counts,
     * shiny kills and task progress in one state update; drops go through a lossy `grant`.
     */
    applyKillBatch(batch: KillBatch): KillBatchResult {
      const maxMana = store.stats().maxMana
      let gain = NO_GAIN
      // Each stack arrives whole or not at all (one entry per id + tier + upgradeLevel, rolled into a map).
      const { received, lost, installed } = store.grant(batch.items, 'lossy')
      // Seeds are counted before the farm unlocks too, but only listed after it; they are never lost.
      const farmUnlocked = isFarmUnlocked(store.unlockedContent())
      const receivedItems = received.filter(item => farmUnlocked || item.type !== ItemType.seed)
      const lostDrops = lost.reduce((sum, item) => sum + item.amount, 0)

      patchState(store, (state) => {
        const paid = addResources(heldOf(state), { goldCoins: batch.gold, experience: batch.experience }, maxMana)
        gain = paid.gain

        const enemyKillCounts = { ...state.enemyKillCounts }
        for (const [id, kills] of Object.entries(batch.killsByEnemy) as [string, number][]) {
          const enemyId = Number(id) as EnemyID
          enemyKillCounts[enemyId] = (enemyKillCounts[enemyId] ?? 0) + kills
        }

        const zoneProgression = state.zonesProgression[batch.zoneId]
        return {
          ...sliceOf(paid.held),
          enemyKillCounts,
          shinyKillsByZone: addShinyKills(state.shinyKillsByZone, batch.zoneId, batch.shinies),
          zonesProgression: {
            ...state.zonesProgression,
            [batch.zoneId]: { ...zoneProgression, [batch.wave]: (zoneProgression?.[batch.wave] ?? 0) + batch.kills },
          },
          activeTasks: progressTasks(state.activeTasks, batch.taskCountsByEnemy),
        }
      })

      return { levelsGained: gain.levelsGained, gain, receivedItems, lost, lostDrops, installedStations: installed }
    },

    /** Pays the zone's mastery chest for a finished, unclaimed star. Refused (null) when the items don't fit (`canClaimZoneStar`). */
    claimZoneStar(zoneId: ZoneID, star: ZoneStar): ResourceGain | null {
      if (!store.canClaimZoneStar(zoneId, star)) return null
      const { gold, explorerTokens, items } = ZONES_DATA[zoneId].masteryReward

      store.grant(items, 'atomic')
      const gain = store.changeResources({ goldCoins: gold, explorerTokens })
      patchState(store, (state) => ({
        claimedZoneStars: { ...state.claimedZoneStars, [zoneId]: [...(state.claimedZoneStars[zoneId] ?? []), star] },
      }))
      return gain
    },

    /** Sells up to `amount` from one stack at `shopId`'s price (`sellPrice`). No-op when that shop won't buy it. */
    sellItem(item: InventoryItem, shopId: ShopID, amount = 1): ResourceGain {
      const price = sellPrice(shopId, item.id, item.upgradeLevel)
      const owned = store.inventory()[tabOf(item.id)].find(slot => slot !== null && stackKey(slot) === stackKey(item))?.amount ?? 0
      const sold = Math.min(amount, owned)
      if (price <= 0 || sold <= 0) return NO_GAIN

      store.removeItems([{ id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel, amount: sold }])
      return store.changeResources({ goldCoins: price * sold })
    },

    /** Merges owned copies atomically, so refusals spend nothing and never roll. */
    mergeItem(base: MergeSource, sacrifice: MergeSource, rng: () => number = Math.random): MergeResult {
      const plan = evaluateMerge({
        base, sacrifice, inventory: store.inventory(), equipment: store.equipment(),
        capacity: store.inventoryCapacity(), goldCoins: store.resources().goldCoins,
      })
      if (plan.status === 'refused') return plan
      // `evaluateMerge` checked the cost by the same rule (`canAfford`), so this never refuses after a ready plan.
      const paid = spendResource(heldNow(store), 'gold', plan.cost)
      if (!paid) return { status: 'refused', reason: 'notEnoughGold' }
      const { result, state } = rollMerge(plan, rng)
      patchState(store, {
        inventory: state.inventory,
        equipment: state.equipment,
        ...sliceOf(paid.held),
      })
      store._notices.push({ type: 'currency', gain: paid.gain })
      return result
    },

    equipItem(item: InventoryItem) {
      const plan = planEquip(item, store.equipment())
      if (plan && store.canEquip(item)) store._wearPlan(plan)
    },

    unequipItem(slot: EquipmentSlotKey) {
      const plan = planUnequip(slot, store.equipment())
      if (plan && store.canUnequip(slot)) store._wearPlan(plan)
    },

    /** Installs station gear that was kept because it arrived out of order. Returns whether it installed. */
    installStationItem(item: InventoryItem): boolean {
      const itemData = ITEM_DATA[item.id]
      if (itemData.type !== ItemType.stationUpgrade || !canInstall(store.stations(), itemData)) return false

      store.grant([{ id: item.id, amount: 1 }], 'atomic', [{ id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel, amount: 1 }])
      return true
    },

    /** Learns a recipe or spell scroll, or pays a stat reward item; false (nothing taken) when already known or not one of those. */
    useItem(item: InventoryItem): boolean {
      const itemData = ITEM_DATA[item.id]

      if (itemData.type === ItemType.recipe) {
        const recipeData = itemData as RecipeItem
        if (store.unlockedRecipes().includes(recipeData.recipeId)) return false
        patchState(store, state => ({ unlockedRecipes: [...state.unlockedRecipes, recipeData.recipeId] }))
      } else if (itemData.type === ItemType.spellScroll) {
        const { spellId } = itemData
        if (store.knownSpellIds().includes(spellId)) return false
        patchState(store, state => ({ scrollSpellLevels: { ...state.scrollSpellLevels, [spellId]: (state.scrollSpellLevels[spellId] ?? 0) + 1 } }))
      } else if (itemData.type === ItemType.rewardsStats) {
        store.updatePlayerStats(itemData.stats.map(s => ({ stat: s.id, amount: s.amount })))
      } else {
        return false
      }
      store.removeItems([{ id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel, amount: 1 }])
      return true
    },

    /**
     * Rolls one chest (or reuses its kept roll) and opens it when the rolled items fit; otherwise keeps the roll and
     * returns the slots to free per tab (owner rule: only what was actually rolled needs room). Saved at once either
     * way, so reloading can't undo an opening or re-roll a kept roll.
     */
    openChest(item: InventoryItem, rng: () => number = Math.random): { contents: ChestContents | null, missing: MissingSlots, gain: ResourceGain } {
      const itemData = ITEM_DATA[item.id]
      if (itemData.type !== ItemType.chest) return { contents: null, missing: {}, gain: NO_GAIN }
      const chest = { id: item.id, tier: item.tier, upgradeLevel: item.upgradeLevel, amount: 1 }
      const bonus = itemData.bonusRoll
      const bonusEligible = !!bonus && (store.permanentBonuses()[bonus.registeredStat] ?? 0) === 0
        && countItem(store.inventory(), bonus.itemId) === 0
      const contents = store.rolledChests()[item.id] ?? rollChest(itemData, rng, bonusEligible, store.stats().seedDropChance)
      const { missing } = store.grant(contents.items, 'atomic', [chest])
      const rolledChests = { ...store.rolledChests() }
      const blocked = Object.keys(missing).length > 0
      let gain = NO_GAIN

      if (blocked) {
        rolledChests[item.id] = contents
      } else {
        delete rolledChests[item.id]
        if (contents.gold) gain = store.changeResources({ goldCoins: contents.gold })
      }
      patchState(store, { rolledChests })
      saveGameStateNow()
      return { contents: blocked ? null : contents, missing, gain }
    },

    regenMana(deltaMs: number): ResourceGain {
      const { maxMana, manaRegenRate } = store.stats()
      const { held, timer, gain } = manaRegen(heldNow(store), store.manaRegenTimer(), deltaMs, { maxMana, manaRegenRate })
      if (timer !== store.manaRegenTimer() || gain.mana) {
        patchState(store, { manaRegenTimer: timer, ...(gain.mana ? sliceOf(held) : {}) })
      }
      return gain
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

      const ingredients = recipeData.itemsNeeded.map(({ id, amount }) => ({ id, amount: amount * count }))
      const { installed, missing } = store.grant([{ id: recipeData.itemId, amount: recipeData.createsAmount * count }], 'atomic', ingredients)
      return { crafted: Object.keys(missing).length > 0 ? 0 : count, installed }
    },

    itemCount(id: ItemID, tier?: ItemTier, upgradeLevel = 0): number {
      return countItem(store.inventory(), id, tier, upgradeLevel)
    },
  })),
  // Lookups and unlocks: skills, zones, towns, titles, reputation, features, seen markers.
  withMethods((store) => ({
    hasSkillUnlocked(skillId: SkillNodeID): boolean {
      return !!store.unlockedNodes()[skillId]
    },

    getKillCountByZoneAndWave(zoneId: ZoneID, wave: number) {
      return (store.zonesProgression()[zoneId] || {})[wave] || 0
    },

    unlockZone(id: ZoneID): void {
      patchState(store, (state) => ({ unlockedContent: withUnlocked(state.unlockedContent, 'zones', id) }))
    },

    isZoneUnlocked(id: ZoneID): boolean {
      return isUnlocked(store.unlockedContent(), 'zones', id)
    },

    unlockTown(id: TownID): void {
      patchState(store, (state) => ({ unlockedContent: withUnlocked(state.unlockedContent, 'towns', id) }))
    },

    /** Opens a Site (the `unlockSite` dialogue effect, a `site` unlock target or a cheat). */
    unlockSite(id: SiteID): void {
      patchState(store, (state) => ({ unlockedContent: withUnlocked(state.unlockedContent, 'sites', id) }))
    },

    /** Shows an earned title in the stats panel, or none with `null`; unearned titles are ignored. */
    selectTitle(id: TitleID | null): void {
      if (id === null || store.earnedTitles().includes(id)) patchState(store, { selectedTitle: id })
    },

    reputationTierOf(reputationId: ReputationID): ReputationTier {
      return reputationTier(store.reputation()[reputationId] ?? 0)
    },

    /** Adds points per reputation; returns each one whose tier went up, once, with its new tier. */
    addReputation(gains: ReputationGain[]): TierUp[] {
      const before = store.reputation()
      const after = { ...before }
      gains.forEach(({ reputationId, amount }) => after[reputationId] = (after[reputationId] ?? 0) + amount)
      patchState(store, { reputation: after })
      const tierUps = [...new Set(gains.map(gain => gain.reputationId))]
        .map(reputationId => ({ reputationId, tier: reputationTier(after[reputationId] ?? 0) }))
        .filter(({ reputationId, tier }) => tier > reputationTier(before[reputationId] ?? 0))
      store._notices.push({ type: 'tierUp', tierUps })
      return tierUps
    },

    /** Cheat: every planted plot is fully grown. */
    growAllPlots(): void {
      patchState(store, (state) => ({
        farm: { ...state.farm, plots: state.farm.plots.map(plot => plot && { ...plot, progressMs: FARM_SEEDS[plot.seedId]?.growMs ?? plot.progressMs }) },
      }))
    },

    /** Plants the seed in one plot, or in every empty plot when `plotIndex` is omitted; false when nothing was planted. Plots from `plotLimit` on are locked. */
    plantSeed(seedId: ItemID, plotLimit: number, plotIndex?: number): boolean {
      // A plot planted before a pending claim lands would grow by the whole absence.
      if (!store._gameClock.isSettled()) return false
      store.syncFarm()
      const stats = store.stats()
      const ctx = { now: store._gameClock.nowMs(), level: professionLevel(store.professions(), ProfessionID.farming), plotLimit, seedSaveChance: stats.farmSeedSaveChance }
      const farm = store.farm()
      const next = plotIndex === undefined ? plantEveryPlot(farm, seedId, ctx) : plantInPlot(farm, plotIndex, seedId, ctx)
      if (!next || next === farm) return false
      patchState(store, { farm: next })
      return true
    },

    /**
     * Harvests one plot, or every ready plot when `plotIndex` is omitted. The crops go to the inventory; the caller pays the XP.
     * A harvest the inventory has no room for leaves the plot with its roll saved (`missing`: the slots to free).
     */
    harvestPlots(plotIndex?: number): { crops: ItemStack[], xp: number, blocked: boolean, missing: MissingSlots } {
      store.syncFarm()
      const stats = store.stats()
      let notFitting: ItemStack[] = []
      const fits = (crops: ItemStack[]) => {
        const ok = store.canGrant(crops)
        if (!ok) notFitting = crops
        return ok
      }
      const ctx = { doubleChance: stats.farmDoubleHarvestChance, bonusChance: stats.farmBonusCropChance, xpMultiplier: professionXpMultiplier(stats, ProfessionID.farming), fits }
      const farm = store.farm()
      const result = plotIndex === undefined ? harvestEveryPlot(farm, ctx) : harvestPlot(farm, plotIndex, ctx)
      const blocked = 'blocked' in result ? result.blocked : result.status === 'blocked'
      patchState(store, { farm: result.farm })
      if (result.crops.length) store.grant(result.crops, 'atomic')
      return { crops: result.crops, xp: result.xp, blocked, missing: blocked ? store.missingSlotsByTab(notFitting) : {} }
    },

    /** Starts the profession at level 1; no-op when already unlocked. */
    unlockProfession(id: ProfessionID): void {
      if (store.professions()[id]) return
      patchState(store, (state) => ({ professions: { ...state.professions, [id]: newProfession() } }))
    },

    /** 0 while locked. */
    professionLevel(id: ProfessionID): number {
      return professionLevel(store.professions(), id)
    },

    /**
     * Adds XP (negative removes it, for cheats) to an unlocked profession and pays the skill points of every new level,
     * in the same state update. Null while the profession is locked: its XP is not kept.
     */
    applyProfessionXp(id: ProfessionID, amount: number): ProfessionGain | null {
      const current = store.professions()[id]
      if (!current) return null
      const { maxLevel } = PROFESSIONS_DATA[id]
      const from = professionLevel(store.professions(), id)
      const { progress, skillPoints } = settleProfession({ ...current, experience: Math.max(0, current.experience + amount) }, maxLevel)
      patchState(store, (state) => ({
        professions: { ...state.professions, [id]: progress },
        resources: { ...state.resources, unspentSkillPoints: state.resources.unspentSkillPoints + skillPoints },
      }))
      const gain = { professionId: id, from, to: professionLevel(store.professions(), id), skillPoints }
      store._notices.push({ type: 'expertiseUp', gain })
      return gain
    },

    isTownUnlocked(id: TownID): boolean {
      return isUnlocked(store.unlockedContent(), 'towns', id)
    },

    isSiteUnlocked(id: SiteID): boolean {
      return isUnlocked(store.unlockedContent(), 'sites', id)
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
  // Unlock targets (`data/unlock-conditions.ts`); `UnlockService` decides when to grant them.
  withMethods((store) => ({
    isUnlockTargetUnlocked(target: UnlockTarget): boolean {
      switch (target.type) {
        case 'zone':
          return store.isZoneUnlocked(target.zoneId)
        case 'town':
          return store.isTownUnlocked(target.townId)
        case 'site':
          return store.isSiteUnlocked(target.siteId)
        case 'feature':
          return target.feature === 'camp' ? store.campUnlocked() : store.skillTreeUnlocked()
      }
    },

    /** Sets the flag only, with no notice; `UnlockService.grant` is the way in during play. */
    applyUnlockTarget(target: UnlockTarget): void {
      switch (target.type) {
        case 'zone':
          store.unlockZone(target.zoneId)
          break
        case 'town':
          store.unlockTown(target.townId)
          store.unlockMap()
          break
        case 'site':
          store.unlockSite(target.siteId)
          store.unlockMap()
          break
        case 'feature':
          if (target.feature === 'camp') store.unlockCamp()
          else store.unlockSkillTree()
          break
      }
    },
  })),
  withHooks((store) => ({
    onInit() {
      // Raising a tab's capacity grows that tab; it never shrinks here.
      effect(() => {
        const capacity = store.inventoryCapacity()
        patchState(store, (state) => ({ inventory: resizeInventory(state.inventory, capacity) }))
      })

      // Offline time counts at the rate the save was made with. After that, whenever any source (gear, a level-up, a
      // buff) changes the rate, the old rate covers the time so far.
      store.syncFarm()
      store._farmRate.current = store.stats().seedGrowthTimeReduction
      effect(() => {
        const rate = store.stats().seedGrowthTimeReduction
        if (rate === store._farmRate.current) return
        untracked(() => store.syncFarm())
        store._farmRate.current = rate
      })

      // Pays skill points a save has not been paid for yet (older saves, edited XP, a raised level cap), once.
      for (const [key, progress] of Object.entries(store.professions())) {
        const id = Number(key) as ProfessionID
        if (!PROFESSIONS_DATA[id]) continue
        const { progress: settled, skillPoints } = settleProfession(progress, PROFESSIONS_DATA[id].maxLevel)
        if (settled.pointsPaidLevel === progress.pointsPaidLevel) continue
        patchState(store, (state) => ({
          professions: { ...state.professions, [id]: settled },
          resources: { ...state.resources, unspentSkillPoints: state.resources.unspentSkillPoints + skillPoints },
        }))
      }

      // Losing maxMana (buff expiry, unequip, respec) drops stored mana with it, so it can't come back later.
      effect(() => {
        const { maxMana } = store.stats()
        if (store.resources().mana > maxMana) {
          patchState(store, (state) => ({ resources: { ...state.resources, mana: maxMana } }))
        }
      })

      // A spell no source teaches any more (gear off, node refunded) leaves the spell bar once its cooldown is over: the
      // slot stays locked meanwhile (no free slot for another spell), and getting the spell back keeps the cooldown.
      const battleStore = inject(BattleStore)
      effect(() => battleStore.pruneSpells(store.knownSpellIds()))
    },
  })),
)
