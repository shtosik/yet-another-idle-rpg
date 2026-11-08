import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Enemy } from 'interfaces/enemy.interface'
import { ActiveBuff, ActiveDamageOverTime, EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import ZONES_DATA from 'data/zones-data'
import ENEMIES_DATA from 'data/enemies-data'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { toShinyUrl } from 'utils/shiny-url'
import { waveMultipliers } from './wave-scaling'
import { requiredKills, rollSpawn, WavePosition } from './waves'
import { ActiveConsumable, CONSUMABLE_SLOTS, ConsumableSlot } from '../../../interfaces/consumable.interface'
import SPELLS_DATA from '../../../data/spells-data'
import { SpellDamageOverTimeEffectProps } from '../../../interfaces/spell.interface'
import { ARENA } from '../../../data/arena-data'
import { ItemStack } from '../player/inventory'

const MS_PER_SECOND = 1000
/** Spells the bar holds. */
export const SPELL_BAR_SLOTS = 5

/** A Combat Arena run in progress (`ArenaService`). Times are wall-clock ms, so the clock runs while the game is closed. */
export interface ArenaRun {
  /** 1-based index into `ARENA.waves`; one past the last wave means cleared. */
  wave: number
  waveKills: number
  startedAt: number
  endsAt: number
  kills: number
  experience: number
  gold: number
}

export interface BattleState {
  isInCombat: boolean;
  /** The enemy alive now; its data is rebuilt from `ENEMIES_DATA` (computed `enemy`), so data edits apply to saves. */
  enemyId: EnemyID | null;
  currentEnemyHp: number;
  currentZoneId: ZoneID;
  currentWave: number;
  autoWaveProgressionEnabled: boolean;
  equippedSpells: (EquippedSpell | null)[];
  activeBuffs: ActiveBuff[];
  activeDamageOverTime: ActiveDamageOverTime[];
  /** An empower spell's guaranteed crits left (Ambush); saved, and not time-based, so it waits across reloads and offline. */
  empowered: { spellId: SpellID, hitsLeft: number } | null;
  isShinyEnemy: boolean;
  consumableSlots: Record<ConsumableSlot, ActiveConsumable | null>;
  autoEatEnabled: boolean;
  /** While set, the fight is the arena's: zone and wave moves are blocked, `currentZoneId` is where the player returns. */
  arenaRun: ArenaRun | null;
  arenaClears: number;
  arenaBestTimeMs: number | null;
  /** Wall-clock ms when the Arena takes the player again (`ARENA.entryCooldownMs` after the last entry). */
  arenaReadyAt: number;
  /** Clear rewards that didn't fit yet; claimed from the result modal or the Arena Master. */
  arenaRewards: ItemStack[];
}

export const initialState: BattleState = {
  isInCombat: false,
  enemyId: null,
  currentEnemyHp: 0,
  currentZoneId: ZoneID.horseshoeBeach,
  currentWave: 1,
  autoWaveProgressionEnabled: false,
  equippedSpells: new Array<EquippedSpell | null>(SPELL_BAR_SLOTS).fill(null),
  activeBuffs: [],
  activeDamageOverTime: [],
  empowered: null,
  isShinyEnemy: false,
  consumableSlots: { food: null, potion: null },
  autoEatEnabled: false,
  arenaRun: null,
  arenaClears: 0,
  arenaBestTimeMs: null,
  arenaReadyAt: 0,
  arenaRewards: [],
}

const STORE_KEY = 'battleStore'
/** 2: the enemy is saved as `enemyId`, not as a copy of its data. */
const SAVE_VERSION = 2

export const BattleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState, { version: SAVE_VERSION }),
  withDevtools(STORE_KEY),
  withComputed((store) => ({
    currentZoneData: () => ZONES_DATA[store.currentZoneId()],
  })),
  withComputed((store) => ({
    /** The current enemy with its wave-scaled max HP and, if shiny, the shiny sprite. */
    enemy: (): Enemy | null => {
      const enemyId = store.enemyId()
      if (enemyId === null) return null
      // An id the data no longer has (enemy removed or renumbered): no enemy; the fight is ended on load.
      const enemy = ENEMIES_DATA[enemyId]
      if (!enemy) return null
      // Arena enemies are never wave-scaled.
      const hpScale = store.arenaRun() ? 1 : waveMultipliers(store.currentZoneData(), store.currentWave()).hp
      const maxHp = Math.round(enemy.maxHp * hpScale)
      return { ...enemy, maxHp, url: store.isShinyEnemy() ? toShinyUrl(enemy.url) : enemy.url }
    },
    requiredKillCountOnCurrentWave: () => requiredKills(store.currentZoneData(), store.currentWave()),
  })),
  withMethods((store) => ({
    /** `shinyChance` is the player's stat in percent (passed in: PlayerStore derives its stats from this store). */
    startBattle(shinyChance: number): void {
      const run = store.arenaRun()
      if (run) {
        const { enemies } = ARENA.waves[run.wave - 1]
        const enemy = ENEMIES_DATA[enemies[Math.floor(Math.random() * enemies.length)]]
        patchState(store, { isInCombat: true, enemyId: enemy.id, currentEnemyHp: enemy.maxHp, isShinyEnemy: false })
        return
      }

      const { enemy, isShiny, maxHp } = rollSpawn(store.currentZoneData(), store.currentWave(), shinyChance, Math.random)
      patchState(store, { isInCombat: true, enemyId: enemy.id, currentEnemyHp: maxHp, isShinyEnemy: isShiny })
    },

    /** Moves to a wave without checking it: `BattleManagerService.changeWave` decides where a move may go. */
    goToWave({ zoneId, wave }: WavePosition): void {
      if (store.arenaRun()) return
      patchState(store, { currentZoneId: zoneId, currentWave: wave, currentEnemyHp: 0, enemyId: null, isInCombat: false, isShinyEnemy: false })
    },

    updateEnemyHp(newHp: number): void {
      patchState(store, { currentEnemyHp: newHp })
    },

    endBattle(): void {
      patchState(store, {
        currentEnemyHp: 0,
        enemyId: null,
        isInCombat: false,
        isShinyEnemy: false,
      })
    },

    toggleAutoWave(enabled: boolean): void {
      patchState(store, { autoWaveProgressionEnabled: enabled })
    },

    addSpell(spell: EquippedSpell): void {
      patchState(store, (state) => {
        const arr = [...state.equippedSpells]
        while (arr.length < SPELL_BAR_SLOTS) arr.push(null)
        const free = arr.findIndex(s => !s)
        if (free === -1) return {}
        arr[free] = spell
        return { equippedSpells: arr }
      })
    },

    setSpellCooldown(spellId: SpellID, cooldownMs: number): void {
      patchState(store, (state) => ({
        equippedSpells: state.equippedSpells.map(s =>
          s && s.spellId === spellId ? { ...s, cooldownRemainingMs: cooldownMs } : s,
        ),
      }))
    },

    setAllEquippedSpells(equippedSpells: (EquippedSpell | null)[]): void {
      patchState(store, { equippedSpells })
    },

    addActiveBuff(buff: ActiveBuff): void {
      patchState(store, (state) => ({
        activeBuffs: [...state.activeBuffs.filter(b => b.spellId !== buff.spellId), buff],
      }))
    },

    addDamageOverTime(spellId: SpellID): void {
      patchState(store, (state) => ({
        activeDamageOverTime: [...state.activeDamageOverTime.filter(d => d.spellId !== spellId), { spellId, msElapsed: 0, hits: 0 }],
      }))
    },

    /**
     * Advances running damage-over-time spells up to the next hit, at most `maxMs` of combat. Returns the spell that
     * hits there (null when none is due within `maxMs`) and the time used, so the caller can stop at a kill and the
     * rest waits for the next enemy. A spell ends after its last hit (`duration` / `interval` hits).
     */
    advanceDamageOverTime(maxMs: number): { spellId: SpellID | null, usedMs: number } {
      const running = store.activeDamageOverTime()
      if (!running.length) return { spellId: null, usedMs: maxMs }

      const timing = (spellId: SpellID) => {
        const { duration, interval } = SPELLS_DATA[spellId].effect as SpellDamageOverTimeEffectProps
        return { intervalMs: interval * MS_PER_SECOND, totalHits: Math.round(duration / interval) }
      }
      const usedMs = Math.min(maxMs, ...running.map(a => Math.max(0, (a.hits + 1) * timing(a.spellId).intervalMs - a.msElapsed)))

      let spellId: SpellID | null = null
      const next = running.flatMap(active => {
        const { intervalMs, totalHits } = timing(active.spellId)
        const advanced = { ...active, msElapsed: active.msElapsed + usedMs }
        if (spellId === null && advanced.msElapsed >= (advanced.hits + 1) * intervalMs) {
          spellId = active.spellId
          advanced.hits++
        }
        return advanced.hits < totalHits ? [advanced] : []
      })
      patchState(store, { activeDamageOverTime: next })
      return { spellId, usedMs }
    },

    empower(spellId: SpellID, hits: number): void {
      patchState(store, { empowered: { spellId, hitsLeft: hits } })
    },

    /** Uses one guaranteed crit; returns whether there was one. */
    useEmpoweredHit(): boolean {
      const empowered = store.empowered()
      if (!empowered) return false
      patchState(store, { empowered: empowered.hitsLeft > 1 ? { ...empowered, hitsLeft: empowered.hitsLeft - 1 } : null })
      return true
    },

    clearDamageOverTime(): void {
      patchState(store, { activeDamageOverTime: [] })
    },

    /** Advances spell cooldowns and buffs by `deltaMs`. Writes only when something is running. */
    tickSpellTimers(deltaMs: number): void {
      const isCooling = store.equippedSpells().some(s => s && s.cooldownRemainingMs > 0)
      if (isCooling) {
        patchState(store, (state) => ({
          equippedSpells: state.equippedSpells.map(s =>
            s && s.cooldownRemainingMs > 0 ? { ...s, cooldownRemainingMs: Math.max(0, s.cooldownRemainingMs - deltaMs) } : s,
          ),
        }))
      }

      if (store.activeBuffs().length) {
        patchState(store, (state) => ({
          activeBuffs: state.activeBuffs
            .map(buff => ({ ...buff, msRemaining: buff.msRemaining - deltaMs }))
            .filter(buff => buff.msRemaining > 0),
        }))
      }
    },

    setConsumable(slot: ConsumableSlot, consumable: ActiveConsumable): void {
      patchState(store, (state) => ({
        consumableSlots: { ...state.consumableSlots, [slot]: consumable },
      }))
    },

    /** Advances consumable effects and slot locks by `seconds` (one per tick second; the whole gap offline). */
    tickConsumables(seconds = 1): void {
      const slots = { ...store.consumableSlots() }
      let changed = false

      for (const slot of CONSUMABLE_SLOTS) {
        const active = slots[slot]
        if (!active || (active.effectRemaining === 0 && active.lockRemaining === 0)) continue

        slots[slot] = {
          ...active,
          effectRemaining: Math.max(0, active.effectRemaining - seconds),
          lockRemaining: Math.max(0, active.lockRemaining - seconds),
        }
        changed = true
      }

      if (changed) patchState(store, { consumableSlots: slots })
    },

    toggleAutoEat(enabled: boolean): void {
      patchState(store, { autoEatEnabled: enabled })
    },

    setZone(zoneId: ZoneID): void {
      if (store.arenaRun()) return
      patchState(store, {
        currentZoneId: zoneId,
        currentWave: 1,
        currentEnemyHp: 0,
        enemyId: null,
        isInCombat: false,
        isShinyEnemy: false,
      })
    },

    /** Starts a run at wave 1; the zone fight in progress is dropped. */
    startArenaRun(now: number): void {
      patchState(store, {
        arenaRun: { wave: 1, waveKills: 0, startedAt: now, endsAt: now + ARENA.timeLimitMs, kills: 0, experience: 0, gold: 0 },
        arenaReadyAt: now + ARENA.entryCooldownMs,
        currentEnemyHp: 0,
        enemyId: null,
        isInCombat: false,
        isShinyEnemy: false,
      })
    },

    /** One arena kill: counts it and its rewards, and moves to the next wave once this one has its kills. */
    recordArenaKill(experience: number, gold: number): void {
      patchState(store, ({ arenaRun: run }) => {
        if (!run) return {}
        const waveKills = run.waveKills + 1
        const isWaveDone = waveKills >= ARENA.waves[run.wave - 1].count
        return {
          arenaRun: {
            ...run,
            wave: isWaveDone ? run.wave + 1 : run.wave,
            waveKills: isWaveDone ? 0 : waveKills,
            kills: run.kills + 1,
            experience: run.experience + experience,
            gold: run.gold + gold,
          },
        }
      })
    },

    /** Ends the run; a clear counts and may set the best time. The zone fight respawns. */
    endArenaRun(cleared: boolean, timeMs: number): void {
      patchState(store, (state) => ({
        arenaRun: null,
        arenaClears: state.arenaClears + (cleared ? 1 : 0),
        arenaBestTimeMs: cleared && (state.arenaBestTimeMs === null || timeMs < state.arenaBestTimeMs) ? timeMs : state.arenaBestTimeMs,
        currentEnemyHp: 0,
        enemyId: null,
        isInCombat: false,
        isShinyEnemy: false,
      }))
    },

    /** The Arcanist's toll: run time taken off the clock. */
    shortenArenaRun(ms: number): void {
      patchState(store, ({ arenaRun: run }) => (run ? { arenaRun: { ...run, endsAt: run.endsAt - ms } } : {}))
    },

    addArenaRewards(items: ItemStack[]): void {
      patchState(store, (state) => ({ arenaRewards: [...state.arenaRewards, ...items] }))
    },

    clearArenaRewards(): void {
      patchState(store, { arenaRewards: [] })
    },

    resetState(): void {
      patchState(store, initialState)
    },

  })),
  withHooks((store) => ({
    // Runs after the save is loaded: a saved fight must still match the data, which may have changed since.
    onInit() {
      const enemy = store.enemy()
      if (store.isInCombat() && !enemy) {
        // Otherwise combat stalls: no enemy to hit, and no respawn while "in combat".
        store.endBattle()
      } else if (enemy && store.currentEnemyHp() > enemy.maxHp) {
        // Max HP is rebuilt from data; a lowered one must not leave the bar over 100%.
        store.updateEnemyHp(enemy.maxHp)
      }
    },
  })),
)
