import { computed, inject, Injectable } from '@angular/core'
import { setInterval } from 'worker-timers'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'

const TICK_DURATION_IN_MS = 100
const TICK_DURATION_IN_SECONDS = 1000

@Injectable({ providedIn: 'root' })
export class GameIntervalService {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)


    private timePerAttack = computed(() => this.playerStore.stats().attackSpeed * TICK_DURATION_IN_SECONDS)

    private tickCounter = 0

    initGameLoop() {
        setInterval(() => this.tick(), TICK_DURATION_IN_MS)
    }

    private tick() {
        const isInCombat = this.battleStore.isInCombat()
        const currentAccumulator = this.battleStore.attackInterval()

        const newInterval = currentAccumulator + TICK_DURATION_IN_MS

        if (newInterval >= this.timePerAttack()) {
            this.battleStore.updateAttackInterval(0)

            if (!isInCombat) {
                this.battleStore.startBattle()
            } else {
                this.battleManagerService.doDamage()
            }
        } else {
            this.battleStore.updateAttackInterval(newInterval)
        }

        this.tickCounter += TICK_DURATION_IN_MS
        if (this.tickCounter >= 1000) {
            this.tickCounter = 0
            this.battleStore.updateTick()
        }
    }
}
