import { computed, inject, Injectable } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { AnimationsService } from './animations.service'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../data/spells-data'
import { SpellType } from '../../enums/spell-type.enum'
import { SpellBuffEffectProps } from '../../interfaces/spell.interface'
import { Enemy } from '../../interfaces/enemy.interface'
import { UNLOCK_RULES, ZONE_UNLOCK_NOTIFICATIONS } from '../../data/unlock-conditions'
import { ModalService } from './modal.service'
import { DamageElement } from '../../enums/damage-element.enum'
import { getActiveQuestIds } from './quest-status'
import { resolveHit } from './hit-resolution'
import { ItemID } from '../../enums/ids/item-id.enum'
import ITEM_DATA from '../../data/items-data'
import { isConsumableItem } from '../../interfaces/item.interface'

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
    const enemyHp = this.battleStore.currentEnemyHp()
    const enemy = this.battleStore.enemy()

    if (!enemy) return

    const { damage, isCrit, isWeaknessHit } = resolveHit({
      stats: this.playerStore.stats(),
      magicDamage,
      isDoubleAttack,
      damageType: damageType ?? this.playerStore.equippedWeaponDamageType(),
      enemyWeakness: enemy.weakness,
      enemyTypes: enemy.enemyTypes,
      hasWeaknessSkill: this.playerStore.hasSkillUnlocked(SkillNodeID.weaknesses),
      hasSpellCritSkill: this.playerStore.hasSkillUnlocked(SkillNodeID.spellCrit),
    })

    const newHp = Math.max(0, enemyHp - damage)
    this.battleStore.updateEnemyHp(newHp)
    this.animations.showDamage(damage, isCrit, isWeaknessHit)

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
        const seconds = spellData.effect.duration + stats.increasedSpellDuration
        this.battleStore.addActiveBuff({ spellId, secondsRemaining: seconds })
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
      const effect = SPELLS_DATA[spellId].effect as SpellBuffEffectProps
      this.playerStore.updatePlayerStats([{ stat: effect.stat, amount: -effect.amount }])
    }

    const expiredConsumableStats = this.battleStore.tickConsumables()
    if (expiredConsumableStats.length) {
      this.playerStore.updatePlayerStats(expiredConsumableStats.map(({ stat, amount }) => ({ stat, amount: -amount })))
    }
    this.autoEat()
  }

  /** Food and potions share one lock per slot, so swapping items can't stack effects. */
  useConsumable(itemId: ItemID): void {
    const itemData = ITEM_DATA[itemId]
    if (!itemData || !isConsumableItem(itemData)) return

    const { slot, cooldown, duration = 0, stats = [], manaRestore = 0 } = itemData.effect
    const current = this.battleStore.consumableSlots()[slot]
    if (current && current.lockRemaining > 0) return
    if (this.playerStore.itemCount(itemId) < 1) return

    const playerStats = this.playerStore.stats()
    const manaGained = Math.min(manaRestore, playerStats.maxMana - playerStats.mana)
    // Don't waste a pure mana potion at full mana.
    if (manaRestore > 0 && !stats.length && manaGained <= 0) return

    // The effect can never outlast the slot lock.
    const effectRemaining = Math.min(duration, cooldown)
    const appliedStats = effectRemaining > 0 ? stats : []

    this.playerStore.updatePlayerStats([
      ...appliedStats,
      ...(manaGained > 0 ? [{ stat: 'mana' as const, amount: manaGained }] : []),
    ])
    this.battleStore.setConsumable(slot, { itemId, effectRemaining, lockRemaining: cooldown, stats: appliedStats })
    this.playerStore.removeItems([{ id: itemId, amount: 1 }])
  }

  private autoEat(): void {
    if (!this.battleStore.autoEatEnabled() || !this.playerStore.hasSkillUnlocked(SkillNodeID.autoEat)) return

    // Re-eats whatever was last used in the food slot.
    const food = this.battleStore.consumableSlots().food
    if (!food || food.lockRemaining > 0 || this.playerStore.itemCount(food.itemId) < 1) return

    this.useConsumable(food.itemId)
  }

  private handleEnemyDeath(enemy: Enemy) {
    const zoneId = this.battleStore.currentZoneId()
    const wave = this.battleStore.currentWave()

    const isShiny = this.battleStore.isShinyEnemy()
    this.battleStore.endBattle()
    const activeQuestIds = getActiveQuestIds(this.questsStore.questStepProgression())
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

    this.checkProgressionUnlocks(wave)
  }

  private checkProgressionUnlocks(wave: number): void {
    const currentZoneId = this.battleStore.currentZoneId()

    for (const rule of UNLOCK_RULES) {
      const { condition, target } = rule
      if (this.playerStore.isUnlockTargetUnlocked(target)) continue

      const isMet = condition.type === 'waveReached'
        ? currentZoneId === condition.zoneId && wave >= condition.wave
        : this.playerStore.isPlayerStateConditionMet(condition)
      if (!isMet) continue

      this.playerStore.applyUnlockTarget(target)
      if (rule.notification) this.modalService.openUnlockNotification(rule.notification)
    }
  }
}
