import { ArenaService } from './arena.service'
import { WeaponCategory } from '../../enums/weapon-category.enum'
import { computed, inject, Injectable } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { AnimationsService } from './animations.service'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../data/spells-data'
import { SpellType } from '../../enums/spell-type.enum'
import { SpellDamageOverTimeEffectProps } from '../../interfaces/spell.interface'
import { Enemy } from '../../interfaces/enemy.interface'
import { ZONE_UNLOCK_NOTIFICATIONS } from '../../data/unlock-conditions'
import { ModalService } from './modal.service'
import { DamageElement } from '../../enums/damage-element.enum'
import { getActiveQuestIds } from './quest-status'
import { resolveHit } from './hit-resolution'
import { ItemID } from '../../enums/ids/item-id.enum'
import ITEM_DATA from '../../data/items-data'
import { isConsumableItem } from '../../interfaces/item.interface'
import { OfflineStore } from '../store/offline/offline.store'

/** Cooldown reduction can't push a spell below this. */
const MIN_SPELL_COOLDOWN_IN_SECONDS = 1
const MS_PER_SECOND = 1000

@Injectable({ providedIn: 'root' })
export class BattleManagerService {
  private battleStore = inject(BattleStore)
  private arenaService = inject(ArenaService)
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private animations = inject(AnimationsService)
  private modalService = inject(ModalService)
  private offlineStore = inject(OfflineStore)

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

    // Double Attack is the melee spell, melee whatever the weapon; an auto-attack is melee with a melee weapon.
    const isMelee = magicDamage === 0 && (isDoubleAttack || this.playerStore.equippedWeaponCategory() === WeaponCategory.melee)
    // Ambush: melee hits use up the guaranteed crits; ranged and magic hits don't.
    const forceCrit = isMelee && this.battleStore.useEmpoweredHit()
    const { damage, isCrit, isWeaknessHit } = resolveHit({
      stats: this.playerStore.stats(),
      magicDamage,
      isMelee,
      forceCrit,
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
    return this.playerStore.stats().mana >= this.manaCost(spellId)
  }

  /** Levels of the spell's perk node (`SpellProps.perk`); 0 without one. */
  private perkLevel(spellId: SpellID): number {
    const perk = SPELLS_DATA[spellId].perk
    return perk ? this.playerStore.unlockedNodes()[perk.nodeId] ?? 0 : 0
  }

  /** `baseManaCost` minus the perk's mana per level, never below 1. */
  manaCost(spellId: SpellID): number {
    const { baseManaCost, perk } = SPELLS_DATA[spellId]
    return Math.max(1, baseManaCost - (perk?.manaPerLevel ?? 0) * this.perkLevel(spellId))
  }

  /** Seconds, after `spellCooldownReduction` and the spell's perk, never below `MIN_SPELL_COOLDOWN_IN_SECONDS`. */
  spellCooldown(spellId: SpellID): number {
    const { baseCooldown, perk } = SPELLS_DATA[spellId]
    const perkReduction = (perk?.cooldownPerLevel ?? 0) * this.perkLevel(spellId)
    const reduced = baseCooldown - this.playerStore.stats().spellCooldownReduction - perkReduction
    return Math.max(MIN_SPELL_COOLDOWN_IN_SECONDS, reduced)
  }

  /**
   * Equipped, off cooldown, known (a gear spell: its gear is on) and affordable. Damage spells need a living enemy; buffs and
   * empower spells (Ambush) can be cast between fights but not while already active.
   */
  canCast(spellId: SpellID): boolean {
    const slot = this.battleStore.equippedSpells().find(s => s?.spellId === spellId)
    if (!slot || slot.cooldownRemainingMs > 0 || !this.canAffordSpell(spellId)) return false
    // A gear spell waiting out its cooldown after the gear came off.
    if (!this.playerStore.knownSpellIds().includes(spellId)) return false

    if (SPELLS_DATA[spellId].effect.type === SpellType.buff) {
      return !this.battleStore.activeBuffs().some(b => b.spellId === spellId)
    }
    if (SPELLS_DATA[spellId].effect.type === SpellType.damageOverTime
      && this.battleStore.activeDamageOverTime().some(d => d.spellId === spellId)) return false
    // Like a buff: castable between fights, not again while its crits are left.
    if (SPELLS_DATA[spellId].effect.type === SpellType.empower) return this.battleStore.empowered()?.spellId !== spellId
    return this.battleStore.isInCombat()
  }

  castSpell(spellId: SpellID) {
    if (!this.canCast(spellId)) return

    const spellData = SPELLS_DATA[spellId]
    this.playerStore.updatePlayerStats([{ stat: 'mana', amount: -this.manaCost(spellId) }])
    this.battleStore.setSpellCooldown(spellId, this.spellCooldown(spellId) * MS_PER_SECOND)

    switch (spellData.effect.type) {
      case SpellType.melee:
        this.doDamage(0, true)
        break
      case SpellType.magic:
        this.doDamage(spellData.effect.baseDamage, false, spellData.effect.damageType)
        break
      case SpellType.damageOverTime:
        this.battleStore.addDamageOverTime(spellId)
        break
      case SpellType.empower:
        this.battleStore.empower(spellId, spellData.effect.hits)
        break
      case SpellType.buff: {
        // The stat change itself is derived from activeBuffs (PlayerStore.stats).
        const seconds = spellData.effect.duration + this.playerStore.stats().increasedSpellDuration
        this.battleStore.addActiveBuff({ spellId, msRemaining: seconds * MS_PER_SECOND })
        break
      }
    }
  }

  /** A slot holding a spell on cooldown can't be emptied or given another spell. */
  isSpellSlotLocked(spellId: SpellID): boolean {
    return this.battleStore.equippedSpells().some(s => s?.spellId === spellId && s.cooldownRemainingMs > 0)
  }

  equipSpell(spellId: SpellID) {
    if (this.battleStore.equippedSpells().some(s => s?.spellId === spellId)) return
    this.battleStore.addSpell({ spellId, cooldownRemainingMs: 0 })
  }

  /** Skips a spell on cooldown unless `force` (refund and respec remove the spell itself). */
  unequipSpell(spellId: SpellID, force = false) {
    if (!force && this.isSpellSlotLocked(spellId)) return
    const remaining = this.battleStore.equippedSpells().map(s => s?.spellId === spellId ? null : s)
    this.battleStore.setAllEquippedSpells(remaining)
  }

  tickSpells(deltaMs: number): void {
    this.battleStore.tickSpellTimers(deltaMs)
  }

  /** Damage over time only runs while an enemy is alive, so a respawn doesn't use it up; it goes on to the next enemy. */
  tickDamageOverTime(deltaMs: number): void {
    let remainingMs = deltaMs
    // Hit by hit, so a kill stops the clock right there: the time and hits left wait for the next enemy.
    while (remainingMs > 0 && this.battleStore.isInCombat()) {
      const { spellId, usedMs } = this.battleStore.advanceDamageOverTime(remainingMs)
      remainingMs -= usedMs
      if (spellId === null) return
      const { damagePerHit, damageType } = SPELLS_DATA[spellId].effect as SpellDamageOverTimeEffectProps
      this.doDamage(damagePerHit, false, damageType)
    }
  }

  /** Once per second: consumable effects and locks, then auto-eat. */
  tickConsumables(): void {
    this.battleStore.tickConsumables()
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

    // The effect can never outlast the slot lock. Its stats are derived from the slot (PlayerStore.stats).
    const effectRemaining = Math.min(duration, cooldown)

    this.battleStore.setConsumable(slot, { itemId, effectRemaining, lockRemaining: cooldown })
    if (manaGained > 0) this.playerStore.updatePlayerStats([{ stat: 'mana', amount: manaGained }])
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
    // Arena kills pay XP and gold and count in the bestiary: no zone progress, drops, tasks or offline kill rate.
    if (this.battleStore.arenaRun()) {
      this.battleStore.endBattle()
      this.playerStore.updateEnemyKillCount(enemy.id, 1)
      this.arenaService.onKill(enemy)
      return
    }

    const zoneId = this.battleStore.currentZoneId()
    const wave = this.battleStore.currentWave()

    const isShiny = this.battleStore.isShinyEnemy()
    this.battleStore.endBattle()
    this.offlineStore.recordKill(performance.now(), zoneId, wave)
    const activeQuestIds = getActiveQuestIds(this.questsStore.questStepProgression())
    this.playerStore.processBattleEnd(enemy.id, zoneId, wave, isShiny, activeQuestIds)

    this.unlockNextZone(wave)

    const currentKillCount = this.currentWaveKillCount()
    // The toggle alone isn't enough: the node may have been refunded since it was switched on.
    const isAutoEnabled = this.battleStore.autoWaveProgressionEnabled()
      && this.playerStore.hasSkillUnlocked(SkillNodeID.autoWaveProgression)
    const requiredKills = this.battleStore.requiredKillCountOnCurrentWave()
    const isEnoughKillCountToProgress = currentKillCount >= requiredKills

    if (isAutoEnabled && isEnoughKillCountToProgress) {
      this.battleStore.changeWave(true)
    }
  }

  /**
   * A kill on `wave` of the current zone: the boss opens the next zone (online kills and offline claims).
   * Town and feature unlocks (`UNLOCK_RULES`) are `UnlockService`'s job.
   */
  unlockNextZone(wave: number): void {
    const zoneData = this.battleStore.currentZoneData()
    const isBossWave = wave === zoneData.maxWave

    if (isBossWave && zoneData.nextZoneId && !this.playerStore.isZoneUnlocked(zoneData.nextZoneId)) {
      this.playerStore.unlockZone(zoneData.nextZoneId)
      const notification = ZONE_UNLOCK_NOTIFICATIONS[zoneData.nextZoneId]
      if (notification) this.modalService.openUnlockNotification(notification)
    }
  }
}
