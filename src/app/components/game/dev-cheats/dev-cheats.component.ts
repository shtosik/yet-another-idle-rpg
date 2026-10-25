import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core'
import { SkillTreeService } from '../../../services/skill-tree.service'
import { GameNavigationService } from '../../../services/game-navigation.service'
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
import { CampStore } from '../../../store/camp/camp.store'
import { OfflineStore } from '../../../store/offline/offline.store'
import { PlayerStat } from '../../../../types/player/player-stat.type'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ItemTier } from 'enums/items/item-tier.enum'

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
  private offlineStore = inject(OfflineStore)
  private skillTree = inject(SkillTreeService)
  private navigation = inject(GameNavigationService)

  /**
   * `window.dev` in the browser console: puts the game into a state in one call when checking UI.
   * IDs are the enum numbers (`ShopID`, `ZoneID`, `SkillNodeID`, `ItemID`, `GameTab`).
   */
  private readonly devTools = {
    tab: (tab: GameTab) => this.navigation.changeTab(tab),
    setZone: (zoneId: ZoneID) => {
      this.playerStore.unlockZone(zoneId)
      this.battleStore.setZone(zoneId)
    },
    grantStat: (stat: PlayerStat, amount: number) => this.playerStore.updatePlayerStats([{ stat, amount }]),
    /** Learns the node and, first, whatever it requires (the first option of an `any`), granting the points. */
    learnSkill: (nodeId: SkillNodeID): boolean => this.learnSkill(nodeId, 1),
    giveItem: (itemId: ItemID, amount = 1, tier = ITEM_DATA[itemId].tier) =>
      this.playerStore.addItems([{ id: itemId, tier, amount }]),
    /** Gives the item and equips it; false (with a console warning) when there's no room or it can't be equipped. */
    equip: (itemId: ItemID, tier = ITEM_DATA[itemId].tier): boolean => {
      const stack = { id: itemId, tier, amount: 1 }
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
    openShop: (shopId: ShopID) => {
      this.navigation.changeTab(GameTab.towns)
      this.townsStore.selectTown(TownID.laHarpar)
      this.townsStore.selectTownBuilding(TOWNS_DATA[TownID.laHarpar].buildings[0])
      this.townsStore.openShop(shopId)
    },
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
    for (const id of Object.values(ZoneID)) {
      if (typeof id === 'number') this.playerStore.unlockZone(id)
    }
  }

  giveMachete() {
    this.playerStore.addItems([{ id: ItemID.machete, tier: ItemTier.uncommon, amount: 1 }])
  }
}
