import { computed, inject, Injectable } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { AnimationsService } from './animations.service'
import { SkillPointID } from '../../enums/ids/skill-tree-node-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../data/spells-data'
import { SpellType } from '../../enums/spell-type.enum'
import { EquippedSpell } from '../../interfaces/spells/equipped-spell.interface'
import { Enemy } from '../../interfaces/enemy.interface'

@Injectable({ providedIn: 'root' })
export class BattleManagerService {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  private animations = inject(AnimationsService)

  currentWaveKillCount = computed(() => {
    const zoneProgression = this.playerStore.zonesProgression()[this.battleStore.currentZoneId()] || {}
    return zoneProgression[this.battleStore.currentWave()] || 0
  })

  canMoveToPreviousWave = computed(() => {
    return this.battleStore.currentZoneData().previousZoneId || this.battleStore.currentWave() !== 1
  })

  canMoveToNextWave = computed(() => {
    const zoneData = this.battleStore.currentZoneData()
    const requiredKillCount = this.battleStore.currentWave() === zoneData.maxWave ? 1 : zoneData.enemiesPerWave

    return zoneData.nextZoneId && this.currentWaveKillCount() >= requiredKillCount
  })

  doDamage(magicDamage = 0, isDoubleAttack = false) {
    const stats = this.playerStore.stats()
    const enemyHp = this.battleStore.currentEnemyHp()
    const enemy = this.battleStore.enemy()
    const hasSpellCritUnlocked = this.playerStore.hasSkillUnlocked(SkillPointID.spellCrit) // Generic getter we made earlier

    if (!enemy) return

    let damage = magicDamage > 0 ? (magicDamage + stats.magicDamage) : stats.attackPower

    const isMagic = magicDamage > 0
    const shouldRollCrit = stats.critChance > 0 && (!isMagic || hasSpellCritUnlocked)
    let isCrit = false

    if (shouldRollCrit && (Math.random() * 100 <= stats.critChance)) {
      isCrit = true
      damage = Math.ceil(damage * stats.critMulti)
    }

    if (isDoubleAttack) damage *= 2

    const newHp = Math.max(0, enemyHp - damage)
    this.battleStore.updateEnemyHp(newHp)
    this.animations.showDamage(damage, isCrit)

    if (newHp === 0) {
      this.handleEnemyDeath(enemy)
    }
  }

  castSpell(spellId: SpellID) {
    const spellData = SPELLS_DATA[spellId]
    const stats = this.playerStore.stats()

    const cooldown = spellData.baseCooldown - stats.spellCooldownReduction
    const duration = spellData.effect.type === SpellType.buff
      ? (spellData.effect.duration + stats.increasedSpellDuration)
      : 0

    this.battleStore.updateSpellCooldown(spellId, cooldown, duration)

    if (spellId === SpellID.doubleAttack) {
      this.doDamage(0, true)
    } else if (spellData.effect.type === SpellType.buff) {
      this.playerStore.updatePlayerStats([{ stat: spellData.effect.stat, amount: spellData.effect.amount }])
    } else if (spellData.effect.type === SpellType.magic) {
      this.doDamage(spellData.effect.baseDamage)
    }
  }

  equipSpell(spellId: SpellID) {
    const spellData = SPELLS_DATA[spellId]

    const currentSpells = this.battleStore.equippedSpells()
    if (currentSpells.find(s => s.spellId === spellId)) return

    const spellToEquip: EquippedSpell = {
      spellId,
      spellType: spellData.effect.type,
      cooldown: 0,
    }

    if (spellData.effect.type === SpellType.buff) {
      spellToEquip.duration = 0
    }

    this.battleStore.addSpell(spellToEquip)
  }

  private handleEnemyDeath(enemy: Enemy) {
    const zoneId = this.battleStore.currentZoneId()
    const wave = this.battleStore.currentWave()
    const currentKillCount = this.currentWaveKillCount()

    this.battleStore.endBattle()
    this.playerStore.processBattleEnd(enemy.id, zoneId, wave)

    const isAutoEnabled = this.battleStore.autoWaveProgressionEnabled()
    const zoneData = this.battleStore.currentZoneData()
    const isEnoughKillCountToProgress = currentKillCount >= zoneData.enemiesPerWave

    if (isAutoEnabled && isEnoughKillCountToProgress) {
      this.battleStore.changeWave(true)
    }
  }
}
