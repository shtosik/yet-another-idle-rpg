import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { Enemy } from 'interfaces/enemy.interface'
import { EquippedSpell } from '../../../interfaces/spells/equipped-spell.interface'
import ZONES_DATA from 'data/zones-data'
import ENEMIES_DATA from 'data/enemies-data'
import { SpellID } from '../../../enums/ids/spell-id.enum'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { pipe, tap } from 'rxjs'
import { PlayerStat } from '../../../types/player/player-stat.type'
import { SpellType } from '../../../enums/spell-type.enum'
import SPELLS_DATA, { SpellSupportStatBuffEffectProps } from '../../../data/spells-data'
import { inject } from '@angular/core'
import { PlayerStore } from '../player/player.store'
import { withDevtools, withStorageSync } from '@angular-architects/ngrx-toolkit'
import { withGameStateSync } from '../helpers/with-game-state-sync.hook'

export interface BattleState {
  isInCombat: boolean;
  enemy: Enemy | null;
  currentEnemyHp: number;
  currentZoneId: ZoneID;
  currentWave: number;
  autoWaveProgressionEnabled: boolean;
  equippedSpells: EquippedSpell[];
  attackInterval: number;
}

export const initialState: BattleState = {
  isInCombat: false,
  enemy: null,
  currentEnemyHp: 0,
  currentZoneId: ZoneID.horseshoeBeach,
  currentWave: 1,
  autoWaveProgressionEnabled: false,
  equippedSpells: [],
  attackInterval: 0,
}

const STORE_KEY = 'battleStore'

export const BattleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withGameStateSync(STORE_KEY, initialState),
  withDevtools(STORE_KEY),
  withStorageSync({
    key: STORE_KEY,
    autoSync: true,
  }),
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

        return {
          isInCombat: true,
          enemy,
          currentEnemyHp: enemy.maxHp,
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
      })
    },

    toggleAutoWave(enabled: boolean): void {
      patchState(store, { autoWaveProgressionEnabled: enabled })
    },

    addSpell(spell: EquippedSpell): void {
      patchState(store, (state) => ({
        equippedSpells: [...state.equippedSpells, spell],
      }))
    },

    updateSpellCooldown(spellId: SpellID, cooldown: number, duration: number): void {
      patchState(store, (state) => {
        const spells = state.equippedSpells.map(s =>
          s.spellId === spellId ? { ...s, cooldown, duration } : s,
        )
        return { equippedSpells: spells }
      })
    },

    setAllEquippedSpells(equippedSpells: EquippedSpell[]): void {
      patchState(store, { equippedSpells })
    },

    resetState(): void {
      patchState(store, initialState)
    },

    updateSpellDuration() {
      const spells = store.equippedSpells()
      if (spells.length === 0) return

      const statsToDecrement: { stat: PlayerStat, amount: number }[] = []

      const updatedSpells = spells.map(spell => {
        console.log(spell)
        const s = { ...spell }
        if (s.cooldown > 0) s.cooldown--

        if (s.spellType === SpellType.buff && s.duration > 0) {
          s.duration--

          if (s.duration === 0) {
            const data = SPELLS_DATA[s.spellId].effect as SpellSupportStatBuffEffectProps
            statsToDecrement.push({ stat: data.stat, amount: -data.amount })
          }
        }
        return s
      })

      patchState(store, { equippedSpells: updatedSpells })

      if (statsToDecrement.length > 0) {
        playerStore.updatePlayerStats(statsToDecrement)
      }
    },
  })),
  withMethods((store) => ({
    updateTick: rxMethod<void>(pipe(
      tap(() => {
        store.updateSpellDuration()
      }),
    )),
  })),
)
