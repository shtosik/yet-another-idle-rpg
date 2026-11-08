import { ArenaBossesService } from './arena-bosses.service'
import { ArenaService } from './arena.service'
import { WeaponCategory } from '../../enums/weapon-category.enum'
import { computed, inject, Injectable, signal } from '@angular/core'
import i18next from 'i18next'
import { InventoryTab, ItemStack, tabOf } from '../store/player/inventory'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { AnimationsService } from './animations.service'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'
import { SpellID } from '../../enums/ids/spell-id.enum'
import SPELLS_DATA from '../../data/spells-data'
import { SpellType } from '../../enums/spell-type.enum'
import { SpellDamageOverTimeEffectProps } from '../../interfaces/spell.interface'
import { Enemy } from '../../interfaces/enemy.interface'
import { DamageElement } from '../../enums/damage-element.enum'
import { resolveHit } from './hit-resolution'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemType } from '../../enums/items/item-type.enum'
import ITEM_DATA from '../../data/items-data'
import { isConsumableItem } from '../../interfaces/item.interface'
import { OfflineStore } from '../store/offline/offline.store'
import { KillResolutionService } from './kill-resolution.service'
import { nextWave, previousWave } from '../store/battle/waves'

/** Cooldown reduction can't push a spell below this. */
const MIN_SPELL_COOLDOWN_IN_SECONDS = 1
const MS_PER_SECOND = 1000
const DROPS_LOST_TOAST_MS = 3000
const SEED_FOUND_TOAST_MS = 3000

@Injectable({ providedIn: 'root' })
export class BattleManagerService {
  private battleStore = inject(BattleStore)
  private arenaService = inject(ArenaService)
  private arenaBosses = inject(ArenaBossesService)
  private playerStore = inject(PlayerStore)
  private animations = inject(AnimationsService)
  private offlineStore = inject(OfflineStore)
  private killResolution = inject(KillResolutionService)

  /** Drops a full tab lost on the last kill, one line per tab; clears itself after `DROPS_LOST_TOAST_MS`. */
  dropsLostToast = signal<string | null>(null)
  private dropsLostTimer?: ReturnType<typeof setTimeout>

  /** "Found: Turnip Seeds x1" for seeds a kill dropped once the farm is unlocked; clears itself. */
  seedFoundToast = signal<string | null>(null)
  private seedFoundTimer?: ReturnType<typeof setTimeout>

  currentWaveKillCount = computed(() => this.playerStore.getKillCountByZoneAndWave(this.battleStore.currentZoneId(), this.battleStore.currentWave()))

  private nextPosition = computed(() => nextWave(
    this.battleStore.currentZoneData(), this.battleStore.currentWave(), this.currentWaveKillCount(), id => this.playerStore.isZoneUnlocked(id),
  ))
  private previousPosition = computed(() => previousWave(this.battleStore.currentZoneData(), this.battleStore.currentWave()))

  canMoveToPreviousWave = computed(() => this.previousPosition() !== null)
  canMoveToNextWave = computed(() => this.nextPosition() !== null)

  /** The wave arrows and auto wave progression: moves only where `nextWave` / `previousWave` allow. */
  changeWave(next: boolean): void {
    const position = next ? this.nextPosition() : this.previousPosition()
    if (position) this.battleStore.goToWave(position)
  }

  doDamage(magicDamage = 0, damageType?: DamageElement) {
    const enemyHp = this.battleStore.currentEnemyHp()
    const enemy = this.battleStore.enemy()

    if (!enemy || !this.battleStore.isInCombat()) return
    const isArena = !!this.battleStore.arenaRun()
    // A burrowed champion: nothing to hit (a damage-over-time tick is spent).
    if (isArena && this.arenaBosses.isHidden()) return

    // Weapon spells and auto-attacks use the equipped weapon category.
    const isMelee = magicDamage === 0 && this.playerStore.equippedWeaponCategory() === WeaponCategory.melee
    // Ambush: melee hits use up the guaranteed crits; ranged and magic hits don't.
    const forceCrit = isMelee && this.battleStore.useEmpoweredHit()
    const hitType = damageType ?? this.playerStore.equippedWeaponDamageType()
    const hit = resolveHit({
      stats: this.playerStore.stats(),
      magicDamage,
      isMelee,
      forceCrit,
      damageType: hitType,
      enemyWeakness: enemy.weakness,
      enemyTypes: enemy.enemyTypes,
      hasWeaknessSkill: this.playerStore.hasSkillUnlocked(SkillNodeID.weaknesses),
      hasSpellCritSkill: this.playerStore.hasSkillUnlocked(SkillNodeID.spellCrit),
    })
    const { isCrit, isWeaknessHit } = hit
    const damage = isArena ? this.arenaBosses.modifyHit(hit.damage, hitType, magicDamage > 0) : hit.damage

    const newHp = Math.max(0, enemyHp - damage)
    this.battleStore.updateEnemyHp(newHp)
    this.animations.showDamage(damage, isCrit, isWeaknessHit)

    if (newHp === 0) {
      this.handleEnemyDeath(enemy)
    }
  }

  hasRequiredWeapon(spellId: SpellID): boolean {
    const required = SPELLS_DATA[spellId].requiredWeapon
    return required === undefined || (!!this.playerStore.equipment().weapon
      && this.playerStore.equippedWeaponCategory() === required)
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
    if (!this.playerStore.knownSpellIds().includes(spellId) || !this.hasRequiredWeapon(spellId)) return false

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
      case SpellType.ranged:
        for (let hit = 0; hit < spellData.effect.hits && this.battleStore.isInCombat(); hit++) {
          this.doDamage()
        }
        break
      case SpellType.magic:
        this.doDamage(spellData.effect.baseDamage, spellData.effect.damageType)
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
      this.doDamage(damagePerHit, damageType)
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
    const kill = { enemyId: enemy.id, isShiny, stats: this.playerStore.stats() }
    const { lost, receivedItems } = this.killResolution.resolveKills(zoneId, wave, [kill], Math.random)
    // Seeds are listed only once the farm is unlocked.
    const foundSeeds = receivedItems.filter(item => item.type === ItemType.seed)
    if (lost.length) this.showDropsLost(lost)
    if (foundSeeds.length) this.showSeedsFound(foundSeeds)

    // The toggle alone isn't enough: the node may have been refunded since it was switched on.
    const isAutoEnabled = this.battleStore.autoWaveProgressionEnabled()
      && this.playerStore.hasSkillUnlocked(SkillNodeID.autoWaveProgression)
    // A boss kill has just unlocked the next zone (Kill resolution), so the move from the boss wave is allowed.
    if (isAutoEnabled) this.changeWave(true)
  }

  private showSeedsFound(seeds: ItemStack[]): void {
    const names = seeds.map(({ id, amount }) => `${i18next.t(`items:names.${ItemID[id]}`)} x${amount}`)
    clearTimeout(this.seedFoundTimer)
    this.seedFoundToast.set(i18next.t('map:farm.seedFound', { seeds: names.join(', ') }))
    this.seedFoundTimer = setTimeout(() => this.seedFoundToast.set(null), SEED_FOUND_TOAST_MS)
  }

  private showDropsLost(lost: ItemStack[]): void {
    const byTab = new Map<InventoryTab, string[]>()
    for (const { id, amount } of lost) {
      const tab = tabOf(id)
      const name = i18next.t(`items:names.${ItemID[id]}`)
      byTab.set(tab, [...(byTab.get(tab) ?? []), amount > 1 ? `${name} x${amount}` : name])
    }
    const lines = [...byTab].map(([tab, names]) =>
      i18next.t('app:inventory.dropsLost', { tab: i18next.t(`app:inventory.tabs.${tab}`), items: names.join(', ') }))
    clearTimeout(this.dropsLostTimer)
    this.dropsLostToast.set(lines.join('\n'))
    this.dropsLostTimer = setTimeout(() => this.dropsLostToast.set(null), DROPS_LOST_TOAST_MS)
  }
}
