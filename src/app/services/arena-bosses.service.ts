import { computed, inject, Injectable, signal } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { ARENA_BOSSES } from '../../data/arena-data'
import { EnemyID } from '../../enums/ids/enemy-id.enum'
import { DamageElement } from '../../enums/damage-element.enum'

const { brute, arcanist, burrower, yad } = ARENA_BOSSES
const CHAMPIONS = [EnemyID.arenaBrute, EnemyID.arenaArcanist, EnemyID.arenaBurrower, EnemyID.arenaYad]

/** One champion fight's ability timers (wall-clock ms). */
interface ChampionFight {
  enemyId: EnemyID
  wave: number
  /** Brute: where the weak point shows, in % of the sprite box, and until when. */
  weakPoint: { x: number; y: number; until: number } | null
  nextWeakPointAt: number
  damageBonusUntil: number
  /** Arcanist: run time already taken this fight. */
  timeLostMs: number
  /** Burrower: under ground, with the mound that hides it. */
  burrow: { correct: number; until: number } | null
  nextBurrowAt: number
  stunnedUntil: number
  /** Yad: the shield up now, the last one (never repeated) and when the next comes. */
  shield: DamageElement | null
  lastShield: DamageElement | null
  nextShieldAt: number
}

/**
 * The arena champions' abilities (docs/systems/arena.md). Timers aren't saved: a reload mid-fight restarts them.
 * `tick` runs every game tick; `modifyHit` adjusts every hit on a champion.
 */
@Injectable({ providedIn: 'root' })
export class ArenaBossesService {
  private battleStore = inject(BattleStore)

  private readonly fight = signal<ChampionFight | null>(null)
  private readonly now = signal(0)

  readonly weakPoint = computed(() => this.fight()?.weakPoint ?? null)
  readonly burrow = computed(() => this.fight()?.burrow ?? null)
  readonly shield = computed(() => this.fight()?.shield ?? null)
  readonly isDamageBoosted = computed(() => this.now() < (this.fight()?.damageBonusUntil ?? 0))
  readonly isStunned = computed(() => this.now() < (this.fight()?.stunnedUntil ?? 0))
  readonly timeLostSeconds = computed(() => Math.round((this.fight()?.timeLostMs ?? 0) / 1000))
  readonly moundCount = burrower.mounds

  /** Burrowed: nothing to hit, though the fight (and a running damage-over-time spell's clock) goes on. */
  isHidden(): boolean {
    return !!this.fight()?.burrow
  }

  tick(now: number, rng: () => number = Math.random): void {
    this.now.set(now)
    const run = this.battleStore.arenaRun()
    const enemy = this.battleStore.enemy()
    if (!run || !this.battleStore.isInCombat() || !enemy || !CHAMPIONS.includes(enemy.id)) {
      if (this.fight()) this.fight.set(null)
      return
    }

    let fight = this.fight()
    if (!fight || fight.wave !== run.wave) fight = this.startFight(enemy.id, run.wave, now, rng)

    if (enemy.id === EnemyID.arenaBrute) {
      if (fight.weakPoint && now >= fight.weakPoint.until) {
        fight = { ...fight, weakPoint: null, nextWeakPointAt: now + brute.cooldownMs }
      } else if (!fight.weakPoint && now >= fight.nextWeakPointAt) {
        fight = { ...fight, weakPoint: { x: 25 + rng() * 50, y: 20 + rng() * 50, until: now + brute.visibleMs } }
      }
    } else if (enemy.id === EnemyID.arenaBurrower) {
      if (fight.burrow && now >= fight.burrow.until) {
        this.heal()
        fight = { ...fight, burrow: null, nextBurrowAt: now + burrower.everyMs }
      } else if (!fight.burrow && now >= fight.nextBurrowAt) {
        fight = { ...fight, burrow: { correct: Math.floor(rng() * burrower.mounds), until: now + burrower.pickMs } }
      }
    } else if (enemy.id === EnemyID.arenaYad && !fight.shield && now >= fight.nextShieldAt) {
      const choices = yad.elements.filter(element => element !== fight!.lastShield)
      const shield = choices[Math.floor(rng() * choices.length)]
      fight = { ...fight, shield, lastShield: shield }
    }

    this.fight.set(fight)
  }

  /** Clicking the Brute's weak point while it shows: more damage for a while, and the next one comes later. */
  hitWeakPoint(now = this.now()): void {
    const fight = this.fight()
    if (!fight?.weakPoint || now >= fight.weakPoint.until) return
    this.fight.set({ ...fight, weakPoint: null, nextWeakPointAt: now + brute.cooldownMs, damageBonusUntil: now + brute.bonusMs })
  }

  /** Picking a mound: the shaking one stuns the Burrower, any other heals it. Either way it comes back up. */
  pickMound(index: number, now = this.now()): void {
    const fight = this.fight()
    if (!fight?.burrow) return
    const isRight = index === fight.burrow.correct
    if (!isRight) this.heal()
    this.fight.set({
      ...fight,
      burrow: null,
      nextBurrowAt: now + burrower.everyMs,
      stunnedUntil: isRight ? now + burrower.stunMs : fight.stunnedUntil,
    })
  }

  /** A hit on the current enemy after `resolveHit`: the champions' bonuses, Yad's shield and the Arcanist's toll. */
  modifyHit(damage: number, damageType: DamageElement, isMagic: boolean, rng: () => number = Math.random): number {
    const fight = this.fight()
    if (!fight) return damage
    const now = this.now()

    let result = damage
    if (now < fight.damageBonusUntil) result *= 1 + brute.damageBonus
    if (now < fight.stunnedUntil) result *= 1 + burrower.stunDamageBonus
    result = Math.round(result)

    if (fight.shield !== null) {
      if (damageType !== fight.shield) return 0
      if (result >= yad.breakDamage) this.fight.set({ ...fight, shield: null, nextShieldAt: now + this.shieldGap(rng) })
    }

    if (isMagic && fight.enemyId === EnemyID.arenaArcanist) {
      const costMs = Math.min(arcanist.maxPerHitMs, result * arcanist.secondsPerDamage * 1000, arcanist.maxPerFightMs - fight.timeLostMs)
      if (costMs > 0) {
        this.battleStore.shortenArenaRun(costMs)
        this.fight.set({ ...fight, timeLostMs: fight.timeLostMs + costMs })
      }
    }
    return result
  }

  private startFight(enemyId: EnemyID, wave: number, now: number, rng: () => number): ChampionFight {
    return {
      enemyId,
      wave,
      weakPoint: null,
      nextWeakPointAt: now + brute.firstAfterMs,
      damageBonusUntil: 0,
      timeLostMs: 0,
      burrow: null,
      nextBurrowAt: now + burrower.everyMs,
      stunnedUntil: 0,
      shield: null,
      lastShield: null,
      nextShieldAt: now + this.shieldGap(rng),
    }
  }

  private shieldGap(rng: () => number): number {
    return yad.minGapMs + rng() * (yad.maxGapMs - yad.minGapMs)
  }

  private heal(): void {
    const enemy = this.battleStore.enemy()
    if (!enemy) return
    const healed = this.battleStore.currentEnemyHp() + Math.round(enemy.maxHp * burrower.healFraction)
    this.battleStore.updateEnemyHp(Math.min(enemy.maxHp, healed))
  }
}
