import { inject, Injectable } from '@angular/core'
import { ALL_SKILLS, SKILL_TREE_DATA } from '../../data/skill-tree-data'
import { PlayerStore } from '../store/player/player.store'
import { SkillNodeType } from '../../enums/skill-node-type.enum'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { canBuyNode } from '../../utils/skill-tree-requirements'
import { canRefundNode, CanRefundResult } from '../../utils/skill-tree-refund'
import { SKILL_TREE_GRAPH } from '../../data/skill-tree-graph'
import { SpellID } from '../../enums/ids/spell-id.enum'

@Injectable({ providedIn: 'root' })
export class SkillTreeService {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  private battleManagerService = inject(BattleManagerService)

  get playerStats() {
    return this.playerStore.stats
  }

  get unlockedNodes() {
    return this.playerStore.unlockedNodes
  }

  buyNode(id: SkillNodeID, buyMax: boolean) {
    const skillData = ALL_SKILLS[id]
    const stats = this.playerStore.stats()
    const unlocked = this.playerStore.unlockedNodes()
    const currentEquippedSpells = this.battleStore.equippedSpells()

    if (!canBuyNode(skillData, unlocked, stats.unspentSkillPoints).ok) return

    const currentLevel = unlocked[id] || 0
    const pointsToBuy = buyMax
      ? Math.min(skillData.maxLevel - currentLevel, Math.floor(stats.unspentSkillPoints / skillData.skillPointCost))
      : 1

    this.playerStore.updatePlayerStats([
      { stat: 'unspentSkillPoints', amount: -(pointsToBuy * skillData.skillPointCost) },
    ])

    this.playerStore.updateUnlockedNodes(id, pointsToBuy)

    if (skillData.type === SkillNodeType.spell) {
      this.playerStore.levelUpSpell(skillData.spellId)

      const alreadyEquipped = currentEquippedSpells.some(s => s?.spellId === skillData.spellId)
      if (!alreadyEquipped && currentEquippedSpells.filter(Boolean).length < 5) {
        this.battleManagerService.equipSpell(skillData.spellId)
      }
    }
  }

  previewRefund(id: SkillNodeID, levels: number | 'all'): CanRefundResult {
    const check = canRefundNode(id, levels, this.playerStore.unlockedNodes(), SKILL_TREE_GRAPH)
    if (!check.ok) return check

    const node = ALL_SKILLS[id]
    const slotsLost = node.type === SkillNodeType.stat && node.stat === 'inventorySlots'
      ? node.statAmount * check.levelsRefunded
      : 0
    if (!this.playerStore.canChangeInventorySlots(-slotsLost)) {
      return { ok: false, reason: 'inventory-in-use', blockers: [] }
    }

    return check
  }

  refundGoldCost(levelsRefunded: number): number {
    return levelsRefunded * SKILL_TREE_DATA.respec.goldCostPerLevel
  }

  refundNode(id: SkillNodeID, levels: number | 'all'): boolean {
    const skillData = ALL_SKILLS[id]
    if (!skillData) return false

    const check = this.previewRefund(id, levels)
    if (!check.ok) return false

    const goldCost = this.refundGoldCost(check.levelsRefunded)
    const stats = this.playerStore.stats()
    if (stats.goldCoins < goldCost) return false

    const refundedLevels = check.levelsRefunded
    const currentLevel = this.playerStore.unlockedNodes()[id] || 0
    const newLevel = currentLevel - refundedLevels

    this.playerStore.updatePlayerStats([
      { stat: 'unspentSkillPoints', amount: refundedLevels * skillData.skillPointCost },
      { stat: 'goldCoins', amount: -goldCost },
    ])

    this.playerStore.updateUnlockedNodes(id, -refundedLevels)

    if (skillData.type === SkillNodeType.spell && newLevel === 0) {
      this.playerStore.levelDownSpell(skillData.spellId, refundedLevels)
      this.battleManagerService.unequipSpell(skillData.spellId, true)
    }

    return true
  }

  respecPreview(): {
    allocatedLevels: number
    skillPointsToReturn: number
    goldCost: number
    canAfford: boolean
    inventoryBlocked: boolean
  } {
    const unlocked = this.playerStore.unlockedNodes()
    let allocatedLevels = 0
    let skillPointsToReturn = 0
    for (const [idStr, level] of Object.entries(unlocked)) {
      if (!level) continue
      const node = ALL_SKILLS[Number(idStr) as SkillNodeID]
      if (!node) continue
      allocatedLevels += level
      skillPointsToReturn += level * node.skillPointCost
    }
    const goldCost = SKILL_TREE_DATA.respec.fullResetGoldCost({ allocatedLevels: allocatedLevels })
    const canAfford = this.playerStore.stats().goldCoins >= goldCost
    const inventoryBlocked = !this.playerStore.canChangeInventorySlots(-this.inventorySlotsGranted())
    return { allocatedLevels, skillPointsToReturn, goldCost, canAfford, inventoryBlocked }
  }

  private inventorySlotsGranted(): number {
    let slots = 0
    for (const [idStr, level] of Object.entries(this.playerStore.unlockedNodes())) {
      const node = ALL_SKILLS[Number(idStr) as SkillNodeID]
      if (level && node?.type === SkillNodeType.stat && node.stat === 'inventorySlots') {
        slots += node.statAmount * level
      }
    }
    return slots
  }

  respecEntireTree(): boolean {
    if (!this.playerStore.canChangeInventorySlots(-this.inventorySlotsGranted())) return false

    const unlocked = this.playerStore.unlockedNodes()
    let allocatedLevels = 0
    let skillPointsToReturn = 0
    const spellRollbacks: Array<{ spellId: SpellID; levels: number }> = []

    for (const [idStr, level] of Object.entries(unlocked)) {
      if (!level) continue
      const node = ALL_SKILLS[Number(idStr) as SkillNodeID]
      if (!node) continue
      allocatedLevels += level
      skillPointsToReturn += level * node.skillPointCost
      if (node.type === SkillNodeType.spell && node.spellId !== undefined) {
        spellRollbacks.push({ spellId: node.spellId, levels: level })
      }
    }

    if (allocatedLevels === 0) return false

    const goldCost = SKILL_TREE_DATA.respec.fullResetGoldCost({ allocatedLevels: allocatedLevels })
    if (this.playerStore.stats().goldCoins < goldCost) return false

    this.playerStore.updatePlayerStats([
      { stat: 'unspentSkillPoints', amount: skillPointsToReturn },
      { stat: 'goldCoins', amount: -goldCost },
    ])

    for (const { spellId, levels } of spellRollbacks) {
      this.playerStore.levelDownSpell(spellId, levels)
      this.battleManagerService.unequipSpell(spellId, true)
    }

    this.playerStore.resetUnlockedNodes()
    return true
  }
}
