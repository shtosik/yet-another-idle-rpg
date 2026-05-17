import { inject, Injectable } from '@angular/core'
import { ALL_SKILLS, SKILL_TREE_DATA } from '../../data/skill-tree-data'
import { PlayerStore } from '../store/player/player.store'
import { SkillPointType } from '../../enums/skill-point-type.enum'
import { SkillPointID } from '../../enums/ids/skill-tree-node-id.enum'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { canBuySkillPoint } from '../../utils/skill-tree-requirements'
import { canRefundSkillPoint, CanRefundResult } from '../../utils/skill-tree-refund'
import { SKILL_TREE_GRAPH } from '../../data/skill-tree-graph'
import { PlayerStat } from '../../types/player/player-stat.type'
import { SpellID } from '../../enums/ids/spell-id.enum'

@Injectable({ providedIn: 'root' })
export class PlayerManagerService {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  private battleManagerService = inject(BattleManagerService)

  get playerStats() {
    return this.playerStore.stats
  }

  get unlockedSkillPoints() {
    return this.playerStore.unlockedSkillPoints
  }

  buySkillPoint(id: SkillPointID, buyMax: boolean) {
    const skillData = ALL_SKILLS[id]
    const stats = this.playerStore.stats()
    const unlocked = this.playerStore.unlockedSkillPoints()
    const currentEquippedSpells = this.battleStore.equippedSpells()

    if (!canBuySkillPoint(skillData, unlocked, stats.unspentSkillPoints).ok) return

    const currentLevel = unlocked[id] || 0
    const pointsToBuy = buyMax
      ? Math.min(skillData.maxLevel - currentLevel, Math.floor(stats.unspentSkillPoints / skillData.skillPointCost))
      : 1

    this.playerStore.updatePlayerStats([
      { stat: 'unspentSkillPoints', amount: -(pointsToBuy * skillData.skillPointCost) },
    ])

    if (skillData.type === SkillPointType.stat) {
      this.playerStore.updatePlayerStats([
        { stat: skillData.stat, amount: skillData.statAmount * pointsToBuy },
      ])
    }

    this.playerStore.updateUnlockedSkillPoints(id, pointsToBuy)

    if (skillData.type === SkillPointType.spell) {
      this.playerStore.levelUpSpell(skillData.spellId)

      const alreadyEquipped = currentEquippedSpells.some(s => s.spellId === skillData.spellId)
      if (!alreadyEquipped && currentEquippedSpells.length < 5) {
        this.battleManagerService.equipSpell(skillData.spellId)
      }
    }
  }

  previewRefund(id: SkillPointID, levels: number | 'all'): CanRefundResult {
    return canRefundSkillPoint(id, levels, this.playerStore.unlockedSkillPoints(), SKILL_TREE_GRAPH)
  }

  refundGoldCost(pointsReturned: number): number {
    return pointsReturned * SKILL_TREE_DATA.respec.perPointGoldCost
  }

  refundSkillPoint(id: SkillPointID, levels: number | 'all'): boolean {
    const skillData = ALL_SKILLS[id]
    if (!skillData) return false

    const check = this.previewRefund(id, levels)
    if (!check.ok) return false

    const goldCost = this.refundGoldCost(check.pointsReturned)
    const stats = this.playerStore.stats()
    if (stats.goldCoins < goldCost) return false

    const refundedLevels = check.pointsReturned
    const currentLevel = this.playerStore.unlockedSkillPoints()[id] || 0
    const newLevel = currentLevel - refundedLevels

    this.playerStore.updatePlayerStats([
      { stat: 'unspentSkillPoints', amount: refundedLevels * skillData.skillPointCost },
      { stat: 'goldCoins', amount: -goldCost },
    ])

    if (skillData.type === SkillPointType.stat) {
      this.playerStore.updatePlayerStats([
        { stat: skillData.stat, amount: -(skillData.statAmount * refundedLevels) },
      ])
    }

    this.playerStore.updateUnlockedSkillPoints(id, -refundedLevels)

    if (skillData.type === SkillPointType.spell && newLevel === 0) {
      this.playerStore.levelDownSpell(skillData.spellId, refundedLevels)
      this.battleManagerService.unequipSpell(skillData.spellId)
    }

    return true
  }

  respecPreview(): {
    allocatedLevels: number
    skillPointsToReturn: number
    goldCost: number
    canAfford: boolean
  } {
    const unlocked = this.playerStore.unlockedSkillPoints()
    let allocatedLevels = 0
    let skillPointsToReturn = 0
    for (const [idStr, level] of Object.entries(unlocked)) {
      if (!level) continue
      const node = ALL_SKILLS[Number(idStr) as SkillPointID]
      if (!node) continue
      allocatedLevels += level
      skillPointsToReturn += level * node.skillPointCost
    }
    const goldCost = SKILL_TREE_DATA.respec.fullResetGoldCost({ allocatedPointCount: allocatedLevels })
    const canAfford = this.playerStore.stats().goldCoins >= goldCost
    return { allocatedLevels, skillPointsToReturn, goldCost, canAfford }
  }

  respecEntireTree(): boolean {
    const unlocked = this.playerStore.unlockedSkillPoints()
    let allocatedLevels = 0
    let skillPointsToReturn = 0
    const statRollbacks: Array<{ stat: PlayerStat; amount: number }> = []
    const spellRollbacks: Array<{ spellId: SpellID; levels: number }> = []

    for (const [idStr, level] of Object.entries(unlocked)) {
      if (!level) continue
      const node = ALL_SKILLS[Number(idStr) as SkillPointID]
      if (!node) continue
      allocatedLevels += level
      skillPointsToReturn += level * node.skillPointCost
      if (node.type === SkillPointType.stat && node.stat) {
        statRollbacks.push({ stat: node.stat, amount: -(node.statAmount * level) })
      }
      if (node.type === SkillPointType.spell && node.spellId !== undefined) {
        spellRollbacks.push({ spellId: node.spellId, levels: level })
      }
    }

    if (allocatedLevels === 0) return false

    const goldCost = SKILL_TREE_DATA.respec.fullResetGoldCost({ allocatedPointCount: allocatedLevels })
    if (this.playerStore.stats().goldCoins < goldCost) return false

    this.playerStore.updatePlayerStats([
      ...statRollbacks,
      { stat: 'unspentSkillPoints', amount: skillPointsToReturn },
      { stat: 'goldCoins', amount: -goldCost },
    ])

    for (const { spellId, levels } of spellRollbacks) {
      this.playerStore.levelDownSpell(spellId, levels)
      this.battleManagerService.unequipSpell(spellId)
    }

    this.playerStore.resetUnlockedSkillPoints()
    return true
  }
}
