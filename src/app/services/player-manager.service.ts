import { inject, Injectable } from '@angular/core'
import { ALL_SKILLS } from '../../data/skill-tree-data'
import { PlayerStore } from '../store/player/player.store'
import { SkillPointType } from '../../enums/skill-point-type.enum'
import { SkillPointID } from '../../enums/ids/skill-tree-node-id.enum'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'

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

    const currentLevel = unlocked[id] || 0
    if (stats.unspentSkillPoints < skillData.skillPointCost || currentLevel >= skillData.maxLevel) {
      return
    }

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

    console.log(skillData)

    if (skillData.type === SkillPointType.spell) {
      this.playerStore.levelUpSpell(skillData.spellId)

      const alreadyEquipped = currentEquippedSpells.some(s => s.spellId === skillData.spellId)
      if (!alreadyEquipped && currentEquippedSpells.length < 5) {
        this.battleManagerService.equipSpell(skillData.spellId)
      }
    }
  }
}
