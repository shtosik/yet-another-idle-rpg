import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core'
import { getState } from '@ngrx/signals'
import { SkillTreeService } from '../../../services/skill-tree.service'
import { GameNavigationService } from '../../../services/game-navigation.service'
import { ReputationService } from '../../../services/reputation.service'
import { GameTab } from 'enums/ids/game-tab.enum'
import { SkillNodeID } from 'enums/ids/skill-node-id.enum'
import { ShopID } from 'enums/ids/shop-id.enum'
import { TownID } from 'enums/map/town-id.enum'
import { EquipmentSlotKey } from 'enums/equipment-slot.enum'
import { ALL_SKILLS } from '../../../../data/skill-tree-data'
import { NodeRequirement } from '../../../../interfaces/skill-tree/skill-node.interface'
import ITEM_DATA from '../../../../data/items-data'
import TOWNS_DATA from '../../../../data/towns-data'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleStore } from '../../../store/battle/battle.store'
import { QuestsStore } from '../../../store/quests/quests.store'
import { TownsStore } from '../../../store/towns/towns.store'
import { ShopStore } from '../../../store/shop/shop.store'
import { SettingsStore } from '../../../store/settings/settings.store'
import { CampStore } from '../../../store/camp/camp.store'
import { OfflineStore } from '../../../store/offline/offline.store'
import { PlayerStat } from '../../../../types/player/player-stat.type'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { QuestID } from 'enums/ids/quest-id.enum'

/** Features `window.dev.unlock` can open. */
const DEV_FEATURES = ['camp', 'skillTree', 'map', 'spellbook', 'towns'] as const
type DevFeature = typeof DEV_FEATURES[number]

type NumericEnum = Record<string, string | number>
/** An enum number or its member name: `dev.equip('machete')` is `dev.equip(ItemID.machete)`. */
type Ref<E extends NumericEnum> = E[keyof E] | keyof E

/** Resolves a member name to its enum number, so agents don't look numbers up in `src/enums`. */
export function fromName<E extends NumericEnum>(e: E, kind: string, ref: Ref<E>): E[keyof E] {
  if (typeof ref !== 'string') return ref as E[keyof E]
  const value = e[ref]
  if (typeof value !== 'number') throw new Error(`dev: no ${kind} named '${ref}'; names: ${Object.keys(e).filter(k => isNaN(Number(k))).join(', ')}`)
  return value as E[keyof E]
}

// Cheat buttons for dev and testing builds. GameComponent renders it only when environment.cheats is on.
@Component({
  selector: 'app-dev-cheats',
  templateUrl: 'dev-cheats.component.html',
  styles: `
    :host
      display: flex
      gap: 0.2rem
      margin-top: 1rem
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevCheatsComponent {
  private playerStore = inject(PlayerStore)
  private battleStore = inject(BattleStore)
  private questsStore = inject(QuestsStore)
  private townsStore = inject(TownsStore)
  private shopStore = inject(ShopStore)
  private campStore = inject(CampStore)
  private settingsStore = inject(SettingsStore)
  private offlineStore = inject(OfflineStore)
  private skillTree = inject(SkillTreeService)
  private navigation = inject(GameNavigationService)
  private reputationService = inject(ReputationService)

  /**
   * `window.dev` in the browser console: puts the game into a state in one call when checking UI.
   * IDs are enum member names or numbers (`dev.equip('machete')`, `dev.tab('map')`); `dev.help()` lists the commands.
   */
  readonly commands = {
    tab: (tab: Ref<typeof GameTab>) => this.navigation.changeTab(fromName(GameTab, 'GameTab', tab)),
    setZone: (zone: Ref<typeof ZoneID>) => {
      const zoneId = fromName(ZoneID, 'ZoneID', zone)
      this.playerStore.unlockZone(zoneId)
      this.battleStore.setZone(zoneId)
    },
    grantStat: (stat: PlayerStat, amount: number) => this.playerStore.updatePlayerStats([{ stat, amount }]),
    /** Learns the node and, first, whatever it requires (the first option of an `any`), granting the points. */
    learnSkill: (node: Ref<typeof SkillNodeID>): boolean => this.learnSkill(fromName(SkillNodeID, 'SkillNodeID', node), 1),
    giveItem: (item: Ref<typeof ItemID>, amount = 1, tier?: Ref<typeof ItemTier>, upgradeLevel = 0) => this.addItem(item, amount, tier, upgradeLevel),
    addItem: (item: Ref<typeof ItemID>, amount = 1, tier?: Ref<typeof ItemTier>, upgradeLevel = 0) => this.addItem(item, amount, tier, upgradeLevel),
    /** Gives the item and equips it; false (with a console warning) when there's no room or it can't be equipped. */
    equip: (itemRef: Ref<typeof ItemID>, tier?: Ref<typeof ItemTier>, upgradeLevel = 0): boolean => {
      const itemId = fromName(ItemID, 'ItemID', itemRef)
      const stack = { id: itemId, tier: this.tierOf(itemId, tier), amount: 1, upgradeLevel }
      if (!this.playerStore.canFitItems([stack])) {
        console.warn('dev.equip: no inventory space for the item')
        return false
      }
      this.playerStore.addItems([stack])
      const item = { ...stack, type: ITEM_DATA[itemId].type }
      if (!this.playerStore.canEquip(item)) {
        this.playerStore.removeItems([stack])
        console.warn('dev.equip: the item can\'t be equipped (not equipment, or no room to swap out the current one)')
        return false
      }
      this.playerStore.equipItem(item)
      return true
    },
    unequip: (slot: EquipmentSlotKey) => this.playerStore.unequipItem(slot),
    /** Opens the shop over La Harpar's first building, whatever town or building was open. */
    openShop: (shop: Ref<typeof ShopID>) => {
      this.navigation.changeTab(GameTab.towns)
      this.townsStore.selectTown(TownID.laHarpar)
      this.townsStore.selectTownBuilding(TOWNS_DATA[TownID.laHarpar].buildings[0])
      this.townsStore.openShop(fromName(ShopID, 'ShopID', shop))
    },
    /** Opens the Forge over La Harpar's first building without adding any Forge building or NPC data. */
    openForge: () => {
      this.navigation.changeTab(GameTab.towns)
      this.townsStore.selectTown(TownID.laHarpar)
      this.townsStore.selectTownBuilding(TOWNS_DATA[TownID.laHarpar].buildings[0])
      this.townsStore.openForge()
    },
    /** Sets an enemy's lifetime kill count (bestiary ranks, zone mastery, quest kill steps). */
    setKills: (enemy: Ref<typeof EnemyID>, count: number) => {
      const enemyId = fromName(EnemyID, 'EnemyID', enemy)
      this.playerStore.updateEnemyKillCount(enemyId, count - (this.playerStore.enemyKillCounts()[enemyId] ?? 0))
    },
    /** Adds shiny kills in a zone (zone mastery's Shiny Hunter star). */
    addShinyKills: (zone: Ref<typeof ZoneID>, count: number) => this.playerStore.applyKillBatch({
      zoneId: fromName(ZoneID, 'ZoneID', zone), wave: 1, kills: 0, shinies: count, killsByEnemy: {}, taskCountsByEnemy: {}, experience: 0, gold: 0, items: [],
    }),
    unlock: (feature: DevFeature) => this.unlockFeature(feature),
    /** Every feature, town and zone. */
    unlockAll: () => {
      DEV_FEATURES.forEach(feature => this.unlockFeature(feature))
      this.unlockAllZones()
    },
    /** Live state of every store plus derived `stats`; unlike `localStorage`, current without waiting for the batched save. */
    state: () => ({
      stats: this.playerStore.stats(),
      player: getState(this.playerStore),
      battle: getState(this.battleStore),
      quests: getState(this.questsStore),
      towns: getState(this.townsStore),
      shop: getState(this.shopStore),
      camp: getState(this.campStore),
      offline: getState(this.offlineStore),
      settings: getState(this.settingsStore),
    }),
    /** Every store back to a fresh save, like the `reset state` button. */
    reset: () => this.resetState(),
    /** Starts and completes the quest, rewards and completed modal included; a no-op once it's done. */
    completeQuest: (quest: Ref<typeof QuestID>) => {
      const questId = fromName(QuestID, 'QuestID', quest)
      this.questsStore.startQuest(questId)
      this.questsStore.endQuest(questId)
    },
    /** Adds town reputation the way a quest reward does, tier-up toast included. */
    addReputation: (town: Ref<typeof TownID>, amount: number) =>
      this.reputationService.gain([{ townId: fromName(TownID, 'TownID', town), amount }]),
  }

  /** `dev.help()` output; typed by `commands`, so a new command doesn't compile without its line. */
  private readonly usage: Record<keyof DevCheatsComponent['commands'], string> = {
    tab: 'tab(GameTab) — switch tab',
    setZone: 'setZone(ZoneID) — unlock and enter a zone',
    grantStat: "grantStat(stat, amount) — add to a player stat, e.g. grantStat('goldCoins', 1000)",
    learnSkill: 'learnSkill(SkillNodeID) — learn a node and its prerequisites, points granted',
    giveItem: 'giveItem(ItemID, amount = 1, ItemTier?, upgradeLevel = 0) — add to inventory',
    addItem: 'addItem(ItemID, amount = 1, ItemTier?, upgradeLevel = 0) — same as giveItem',
    equip: 'equip(ItemID, ItemTier?, upgradeLevel = 0) — give and equip; false when it can\'t',
    unequip: "unequip(slot) — slot name, e.g. unequip('weapon')",
    openShop: 'openShop(ShopID) — open a shop',
    openForge: 'openForge() — open the Forge',
    setKills: 'setKills(EnemyID, count) — set lifetime kills',
    addShinyKills: 'addShinyKills(ZoneID, count) — add shiny kills in a zone',
    unlock: `unlock(${DEV_FEATURES.map(f => `'${f}'`).join('|')}) — unlock a feature`,
    unlockAll: 'unlockAll() — every feature, town and zone',
    state: 'state() — live state of every store plus derived stats',
    reset: 'reset() — fresh save',
    completeQuest: 'completeQuest(QuestID) — start and complete a quest, rewards included',
    addReputation: 'addReputation(TownID, amount) — add town reputation',
  }

  private readonly devTools = {
    ...this.commands,
    /** Every command with its arguments. IDs take enum member names or numbers. */
    help: () => Object.values(this.usage),
  }

  /** The given tier, or the item's own tier when none is given. */
  private tierOf(id: ItemID, tier?: Ref<typeof ItemTier>): ItemTier {
    if (tier === undefined) return ITEM_DATA[id].tier
    return fromName(ItemTier, 'ItemTier', tier)
  }

  private addItem(item: Ref<typeof ItemID>, amount: number, tier: Ref<typeof ItemTier> | undefined, upgradeLevel: number): void {
    const id = fromName(ItemID, 'ItemID', item)
    this.playerStore.addItems([{ id, tier: this.tierOf(id, tier), amount, upgradeLevel }])
  }

  private unlockFeature(feature: DevFeature): void {
    switch (feature) {
      case 'camp': return this.playerStore.unlockCamp()
      case 'skillTree': return this.playerStore.unlockSkillTree()
      case 'map': return this.playerStore.unlockMap()
      case 'spellbook': return this.playerStore.unlockSpellbook()
      case 'towns': return Object.keys(TOWNS_DATA).forEach(id => this.playerStore.unlockTown(Number(id) as TownID))
    }
  }

  private learnSkill(nodeId: SkillNodeID, level: number): boolean {
    const node = ALL_SKILLS[nodeId]
    if (node.requires) this.meetRequirement(node.requires)
    while ((this.playerStore.unlockedNodes()[nodeId] ?? 0) < Math.min(level, node.maxLevel)) {
      this.playerStore.updatePlayerStats([{ stat: 'unspentSkillPoints', amount: node.skillPointCost }])
      const before = this.playerStore.unlockedNodes()[nodeId] ?? 0
      this.skillTree.buyNode(nodeId, false)
      if ((this.playerStore.unlockedNodes()[nodeId] ?? 0) === before) {
        // Refused (a prerequisite didn't take): take back the points granted for it.
        this.playerStore.updatePlayerStats([{ stat: 'unspentSkillPoints', amount: -node.skillPointCost }])
        return false
      }
    }
    return true
  }

  private meetRequirement(requirement: NodeRequirement): void {
    switch (requirement.kind) {
      case 'node':
        this.learnSkill(requirement.id, requirement.minLevel)
        return
      case 'all':
        requirement.of.forEach(r => this.meetRequirement(r))
        return
      case 'any':
        this.meetRequirement(requirement.of[0])
        return
    }
  }

  constructor() {
    Object.assign(window, { dev: this.devTools })
    inject(DestroyRef).onDestroy(() => delete (window as { dev?: unknown }).dev)
  }

  resetState() {
    this.playerStore.resetState()
    this.battleStore.resetState()
    this.questsStore.resetState()
    this.townsStore.resetState()
    this.shopStore.resetState()
    this.campStore.resetState()
    this.offlineStore.resetState()
    this.settingsStore.resetState()
  }

  resetQuests() {
    this.questsStore.resetState()
  }

  resetShops() {
    this.shopStore.resetState()
  }

  giveStat(stat: PlayerStat) {
    this.playerStore.updatePlayerStats([{ stat, amount: 1000 }])
  }

  unlockAllZones() {
    this.playerStore.unlockMap()
    this.unlockFeature('towns')
    for (const id of Object.values(ZoneID)) {
      if (typeof id === 'number') this.playerStore.unlockZone(id)
    }
  }

  giveMachete() {
    this.playerStore.addItems([{ id: ItemID.machete, tier: ItemTier.uncommon, amount: 1 }])
  }
}
