import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Enemy } from 'interfaces/enemy.interface'
import { ActiveBuff, EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import ZONES_DATA from 'data/zones-data'
import ENEMIES_DATA from 'data/enemies-data'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { withDevtools } from '../helpers/devtools'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { toShinyUrl } from 'utils/shiny-url'
import { waveMultipliers } from './wave-scaling'
import { ActiveConsumable, CONSUMABLE_SLOTS, ConsumableSlot } from '../../../interfaces/consumable.interface'

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
  isShinyEnemy: boolean;
  consumableSlots: Record<ConsumableSlot, ActiveConsumable | null>;
  autoEatEnabled: boolean;
}

export const initialState: BattleState = {
  isInCombat: false,
  enemyId: null,
  currentEnemyHp: 0,
  currentZoneId: ZoneID.horseshoeBeach,
  currentWave: 1,
  autoWaveProgressionEnabled: false,
  equippedSpells: [null, null, null, null, null],
  activeBuffs: [],
  isShinyEnemy: false,
  consumableSlots: { food: null, potion: null },
  autoEatEnabled: false,
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
      const maxHp = Math.round(enemy.maxHp * waveMultipliers(store.currentZoneData(), store.currentWave()).hp)
      return { ...enemy, maxHp, url: store.isShinyEnemy() ? toShinyUrl(enemy.url) : enemy.url }
    },
    requiredKillCountOnCurrentWave: () => store.currentWave() === store.currentZoneData().maxWave ? 1 : store.currentZoneData().enemiesPerWave,
  })),
  withMethods((store) => ({
    /** `shinyChance` is the player's stat in percent (passed in: PlayerStore derives its stats from this store). */
    startBattle(shinyChance: number): void {
      patchState(store, (state) => {
        const zoneData = store.currentZoneData()
        let enemy: Enemy

        if (state.currentWave !== zoneData.maxWave) {
          const possibleEnemies = zoneData.enemies
          const randomIndex = Math.floor(Math.random() * possibleEnemies.length)
          const enemyId = possibleEnemies[randomIndex]
          enemy = ENEMIES_DATA[enemyId]
        } else {
          enemy = ENEMIES_DATA[zoneData.bossEnemyId]
        }

        const isShiny = shinyChance > 0 && Math.random() * 100 < shinyChance
        const maxHp = Math.round(enemy.maxHp * waveMultipliers(zoneData, state.currentWave).hp)

        return {
          isInCombat: true,
          enemyId: enemy.id,
          currentEnemyHp: maxHp,
          isShinyEnemy: isShiny,
        }
      })
    },

    changeWave(next: boolean): void {
      patchState(store, (state) => {
        const zoneData = store.currentZoneData()

        if (next) {
          const nextZone = zoneData.nextZoneId
          const isMaxWave = state.currentWave === zoneData.maxWave
          const shouldGoNextZone = nextZone && isMaxWave

          // Past the last wave: the next zone's first wave, or stay on the last one when there's no next zone.
          const wave = shouldGoNextZone ? 1 : Math.min(state.currentWave + 1, zoneData.maxWave)
          const zone = shouldGoNextZone ? nextZone : state.currentZoneId

          return {
            currentEnemyHp: 0,
            enemyId: null,
            isInCombat: false,
            isShinyEnemy: false,
            currentWave: wave,
            currentZoneId: zone,
          }
        } else {
          const previousZoneId = zoneData.previousZoneId
          const previousZoneData = ZONES_DATA[previousZoneId]
          const isFirstWave = state.currentWave === 1
          const shouldGoPreviousZone = !!(previousZoneId && isFirstWave)

          // Before wave 1: the previous zone's last wave, or stay on wave 1 when there's no previous zone.
          const wave = shouldGoPreviousZone ? previousZoneData.maxWave : Math.max(state.currentWave - 1, 1)
          const zone = shouldGoPreviousZone ? previousZoneId : state.currentZoneId

          return {
            currentEnemyHp: 0,
            enemyId: null,
            isInCombat: false,
            isShinyEnemy: false,
            currentWave: wave,
            currentZoneId: zone,
          }
        }
      })
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
        while (arr.length < 5) arr.push(null)
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
      patchState(store, {
        currentZoneId: zoneId,
        currentWave: 1,
        currentEnemyHp: 0,
        enemyId: null,
        isInCombat: false,
        isShinyEnemy: false,
      })
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
