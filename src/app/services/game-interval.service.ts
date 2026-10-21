import { computed, inject, Injectable } from '@angular/core'
import { setInterval } from 'worker-timers'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { ShopStore } from '../store/shop/shop.store'

const TICK_DURATION_IN_MS = 100
const MS_PER_SECOND = 1000

@Injectable({ providedIn: 'root' })
export class GameIntervalService {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)
    shopStore = inject(ShopStore)


    private timePerAttack = computed(() => this.playerStore.stats().attackSpeed * MS_PER_SECOND)

    private tickCounter = 0

    initGameLoop() {
        setInterval(() => this.tick(), TICK_DURATION_IN_MS)
    }

    private tick() {
        const isInCombat = this.battleStore.isInCombat()
        const currentAccumulator = this.battleStore.attackTimer()

        const newTimer = currentAccumulator + TICK_DURATION_IN_MS

        if (newTimer >= this.timePerAttack()) {
            this.battleStore.updateAttackTimer(0)

            if (!isInCombat) {
                this.battleStore.startBattle()
            } else {
                this.battleManagerService.doDamage()
            }
        } else {
            this.battleStore.updateAttackTimer(newTimer)
        }

        this.playerStore.regenMana(TICK_DURATION_IN_MS)

        this.tickCounter += TICK_DURATION_IN_MS
        if (this.tickCounter >= MS_PER_SECOND) {
            this.tickCounter = 0
            this.battleManagerService.tickSpells()
            this.shopStore.tickCooldowns(MS_PER_SECOND)
        }
    }
}
