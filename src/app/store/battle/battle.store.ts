import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Enemy } from 'interfaces/enemy.interface'
import { ActiveBuff, EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import ZONES_DATA from 'data/zones-data'
import ENEMIES_DATA from 'data/enemies-data'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { withDevtools } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'
import { PlayerStore } from '../player/player.store'
import { inject } from '@angular/core'
import { toShinyUrl } from 'utils/shiny-url'

export interface BattleState {
  isInCombat: boolean;
  enemy: Enemy | null;
  currentEnemyHp: number;
  currentZoneId: ZoneID;
  currentWave: number;
  autoWaveProgressionEnabled: boolean;
  equippedSpells: (EquippedSpell | null)[];
  activeBuffs: ActiveBuff[];
  attackInterval: number;
  isShinyEnemy: boolean;
}

export const initialState: BattleState = {
  isInCombat: false,
  enemy: null,
  currentEnemyHp: 0,
  currentZoneId: ZoneID.horseshoeBeach,
  currentWave: 1,
  autoWaveProgressionEnabled: false,
  equippedSpells: [null, null, null, null, null],
  activeBuffs: [],
  attackInterval: 0,
  isShinyEnemy: false,
}

const STORE_KEY = 'battleStore'

export const BattleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withComputed((store) => ({
    currentZoneData: () => ZONES_DATA[store.currentZoneId()],
  })),
  withComputed((store) => ({
    requiredKillCountOnCurrentWave: () => store.currentWave() === store.currentZoneData().maxWave ? 1 : store.currentZoneData().enemiesPerWave,
  })),
  withMethods((store, playerStore = inject(PlayerStore)) => ({
    startBattle(): void {
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

        const shinyChance = playerStore.stats().shinyChance ?? 0
        const isShiny = shinyChance > 0 && Math.random() * 100 < shinyChance

        return {
          isInCombat: true,
          enemy: isShiny ? { ...enemy, url: toShinyUrl(enemy.url) } : enemy,
          currentEnemyHp: enemy.maxHp,
          isShinyEnemy: isShiny,
        }
      })
    },

    updateAttackInterval(attackInterval: number): void {
      patchState(store, { attackInterval })
    },

    changeWave(next: boolean): void {
      patchState(store, (state) => {
        const zoneData = store.currentZoneData()

        if (next) {
          const nextZone = zoneData.nextZoneId
          const isMaxWave = state.currentWave === zoneData.maxWave
          const shouldGoNextZone = nextZone && isMaxWave

          const wave = shouldGoNextZone ? 1 : (isMaxWave ? zoneData.maxWave : state.currentWave + 1)
          const zone = shouldGoNextZone ? nextZone : state.currentZoneId

          return {
            currentEnemyHp: 0,
            enemy: null,
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

          const wave = shouldGoPreviousZone ? previousZoneData.maxWave : (isFirstWave ? state.currentWave : state.currentWave - 1)
          const zone = shouldGoPreviousZone ? previousZoneId : state.currentZoneId

          return {
            currentEnemyHp: 0,
            enemy: null,
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
        enemy: null,
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

    setSpellCooldown(spellId: SpellID, cooldown: number): void {
      patchState(store, (state) => ({
        equippedSpells: state.equippedSpells.map(s =>
          s && s.spellId === spellId ? { ...s, cooldownRemaining: cooldown } : s,
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

    tickCooldowns(): void {
      patchState(store, (state) => ({
        equippedSpells: state.equippedSpells.map(s =>
          s && s.cooldownRemaining > 0 ? { ...s, cooldownRemaining: s.cooldownRemaining - 1 } : s,
        ),
      }))
    },

    tickBuffs(): SpellID[] {
      const expired: SpellID[] = []
      const remaining: ActiveBuff[] = []

      for (const buff of store.activeBuffs()) {
        if (buff.ticksRemaining <= 1) {
          expired.push(buff.spellId)
        } else {
          remaining.push({ ...buff, ticksRemaining: buff.ticksRemaining - 1 })
        }
      }

      patchState(store, { activeBuffs: remaining })
      return expired
    },

    setZone(zoneId: ZoneID): void {
      patchState(store, {
        currentZoneId: zoneId,
        currentWave: 1,
        currentEnemyHp: 0,
        enemy: null,
        isInCombat: false,
        isShinyEnemy: false,
      })
    },

    resetState(): void {
      patchState(store, initialState)
    },

  })),
)
