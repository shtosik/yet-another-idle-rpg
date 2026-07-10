import { computed, inject, Injectable } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { AnimationsService } from './animations.service'
import { SkillPointID } from '../../enums/ids/skill-tree-node-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../data/spells-data'
import { SpellType } from '../../enums/spell-type.enum'
import { SpellSupportStatBuffEffectProps } from '../../interfaces/spell.interface'
import { Enemy } from '../../interfaces/enemy.interface'
import { ItemID } from '../../enums/ids/item-id.enum'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { UNLOCK_RULES, ZONE_UNLOCK_NOTIFICATIONS } from '../../data/unlock-conditions'
import { ModalService } from './modal.service'
import { DamageElement } from '../../enums/damage-element.enum'
import { PlayerStat } from '../../types/player/player-stat.type'
import { EnemyType } from '../../enums/enemy-type.enum'
import { QUEST_STEP_AFTER_COMPLETED, QUEST_STEP_AFTER_FAILED } from '../../data/quests-data'

@Injectable({ providedIn: 'root' })
export class BattleManagerService {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private animations = inject(AnimationsService)
  private modalService = inject(ModalService)

  currentWaveKillCount = computed(() => {
    const zoneProgression = this.playerStore.zonesProgression()[this.battleStore.currentZoneId()] || {}
    return zoneProgression[this.battleStore.currentWave()] || 0
  })

  canMoveToPreviousWave = computed(() => {
    return this.battleStore.currentZoneData().previousZoneId || this.battleStore.currentWave() !== 1
  })

  canMoveToNextWave = computed(() => {
    const zoneData = this.battleStore.currentZoneData()
    const isCurrentWaveLast = this.battleStore.currentWave() === zoneData.maxWave

    if (isCurrentWaveLast) {
      return !!(zoneData.nextZoneId && this.playerStore.isZoneUnlocked(zoneData.nextZoneId))
    }

    return this.currentWaveKillCount() >= zoneData.enemiesPerWave
  })

  doDamage(magicDamage = 0, isDoubleAttack = false, damageType?: DamageElement) {
    const stats = this.playerStore.stats()
    const enemyHp = this.battleStore.currentEnemyHp()
    const enemy = this.battleStore.enemy()
    const hasSpellCritUnlocked = this.playerStore.hasSkillUnlocked(SkillPointID.spellCrit) // Generic getter we made earlier

    if (!enemy) return

    let damage = magicDamage > 0
      ? Math.ceil((magicDamage + stats.magicDamage) * stats.magicDamageMultiplier)
      : stats.attackPower

    const isMagic = magicDamage > 0
    const shouldRollCrit = stats.critChance > 0 && (!isMagic || hasSpellCritUnlocked)
    let isCrit = false

    if (shouldRollCrit && (Math.random() * 100 <= stats.critChance)) {
      isCrit = true
      damage = Math.ceil(damage * stats.critMulti)
    }

    if (isDoubleAttack) damage *= 2

    const effectiveDamageType = damageType ?? this.playerStore.equippedWeaponDamageType()
    const hasWeaknessSkill = this.playerStore.hasSkillUnlocked(SkillPointID.weaknesses)
    const isStrong = hasWeaknessSkill && enemy.weakness === effectiveDamageType
    if (isStrong) {
      const elementName = DamageElement[effectiveDamageType]
      const multiplierStat = `extra${elementName.charAt(0).toUpperCase() + elementName.slice(1)}DamageMultiplier` as PlayerStat
      damage = Math.ceil(damage * (stats[multiplierStat] as number))
    }

    const typeBonus = enemy.enemyTypes.reduce((sum, type) => {
      const typeName = EnemyType[type]
      const statName = `damageVs${typeName.charAt(0).toUpperCase() + typeName.slice(1)}` as PlayerStat
      return sum + (stats[statName] as number)
    }, 0)
    if (typeBonus > 0) damage = Math.floor(damage * (1 + typeBonus))

    const newHp = Math.max(0, enemyHp - damage)
    this.battleStore.updateEnemyHp(newHp)
    this.animations.showDamage(damage, isCrit, isStrong)

    if (newHp === 0) {
      this.handleEnemyDeath(enemy)
    }
  }

  canAffordSpell(spellId: SpellID): boolean {
    const spellData = SPELLS_DATA[spellId]
    return this.playerStore.stats().mana >= spellData.baseManaCost
  }

  castSpell(spellId: SpellID) {
    const spellData = SPELLS_DATA[spellId]
    const stats = this.playerStore.stats()
    const cooldown = spellData.baseCooldown - stats.spellCooldownReduction

    // for buff re-cast: don't charge costs, but keep existing cooldown behaviour
    if (spellData.effect.type === SpellType.buff) {
      const alreadyActive = this.battleStore.activeBuffs().some(b => b.spellId === spellId)
      if (alreadyActive) {
        this.battleStore.setSpellCooldown(spellId, cooldown)
        return
      }
    }

    if (!this.canAffordSpell(spellId)) return

    this.playerStore.updatePlayerStats([{ stat: 'mana', amount: -spellData.baseManaCost }])

    this.battleStore.setSpellCooldown(spellId, cooldown)

    switch (spellData.effect.type) {
      case SpellType.melee:
        this.doDamage(0, true)
        break
      case SpellType.magic:
        this.doDamage(spellData.effect.baseDamage, false, spellData.effect.damageType)
        break
      case SpellType.buff: {
        const ticks = spellData.effect.duration + stats.increasedSpellDuration
        this.battleStore.addActiveBuff({ spellId, ticksRemaining: ticks })
        this.playerStore.updatePlayerStats([{ stat: spellData.effect.stat, amount: spellData.effect.amount }])
        break
      }
    }
  }

  equipSpell(spellId: SpellID) {
    if (this.battleStore.equippedSpells().some(s => s?.spellId === spellId)) return
    this.battleStore.addSpell({ spellId, cooldownRemaining: 0 })
  }

  unequipSpell(spellId: SpellID) {
    const remaining = this.battleStore.equippedSpells().map(s => s?.spellId === spellId ? null : s)
    this.battleStore.setAllEquippedSpells(remaining)
  }

  tickSpells(): void {
    this.battleStore.tickCooldowns()
    const expired = this.battleStore.tickBuffs()
    for (const spellId of expired) {
      const effect = SPELLS_DATA[spellId].effect as SpellSupportStatBuffEffectProps
      this.playerStore.updatePlayerStats([{ stat: effect.stat, amount: -effect.amount }])
    }
  }

  private activeQuestIds(): Set<QuestID> {
    const progression = this.questsStore.questStepProgression()
    const active = new Set<QuestID>()
    for (const key in progression) {
      const step = progression[key as unknown as QuestID]
      if (step === undefined || step === QUEST_STEP_AFTER_COMPLETED || step === QUEST_STEP_AFTER_FAILED) continue
      active.add(Number(key) as QuestID)
    }
    return active
  }

  private handleEnemyDeath(enemy: Enemy) {
    const zoneId = this.battleStore.currentZoneId()
    const wave = this.battleStore.currentWave()

    const isShiny = this.battleStore.isShinyEnemy()
    this.battleStore.endBattle()
    const activeQuestIds = this.activeQuestIds()
    this.playerStore.processBattleEnd(enemy.id, zoneId, wave, isShiny, activeQuestIds)

    this.checkUnlocks(wave)

    const currentKillCount = this.currentWaveKillCount()
    const isAutoEnabled = this.battleStore.autoWaveProgressionEnabled()
    const requiredKills = this.battleStore.requiredKillCountOnCurrentWave()
    const isEnoughKillCountToProgress = currentKillCount >= requiredKills

    if (isAutoEnabled && isEnoughKillCountToProgress) {
      this.battleStore.changeWave(true)
    }
  }

  private checkUnlocks(wave: number): void {
    const zoneData = this.battleStore.currentZoneData()
    const isBossWave = wave === zoneData.maxWave

    if (isBossWave && zoneData.nextZoneId && !this.playerStore.isZoneUnlocked(zoneData.nextZoneId)) {
      this.playerStore.unlockZone(zoneData.nextZoneId)
      const notification = ZONE_UNLOCK_NOTIFICATIONS[zoneData.nextZoneId]
      if (notification) this.modalService.openUnlockNotification(notification)
    }

    if (!this.playerStore.craftingUnlocked() && this.playerStore.inventory().some(i => i?.id === ItemID.turtleShell)) {
      this.playerStore.unlockCrafting()
      this.modalService.openUnlockNotification({ titleKey: 'unlocks:crafting.title', bodyKey: 'unlocks:crafting.body' })
    }

    if (!this.playerStore.skillTreeUnlocked() && this.playerStore.stats().level >= 2) {
      this.playerStore.unlockSkillTree()
      this.modalService.openUnlockNotification({ titleKey: 'unlocks:skillTree.title', bodyKey: 'unlocks:skillTree.body' })
    }

    this.checkProgressionUnlocks(wave)
  }

  private checkProgressionUnlocks(wave: number): void {
    const currentZoneId = this.battleStore.currentZoneId()

    for (const rule of UNLOCK_RULES) {
      const { condition, target } = rule

      if (condition.type === 'waveReached') {
        if (currentZoneId !== condition.zoneId) continue
        if (wave < condition.wave) continue

        if (target.type === 'town' && !this.playerStore.isTownUnlocked(target.townId)) {
          this.playerStore.unlockTown(target.townId)
          this.playerStore.unlockMap()
          if (rule.notification) this.modalService.openUnlockNotification(rule.notification)
        }
      }
    }
  }
}
