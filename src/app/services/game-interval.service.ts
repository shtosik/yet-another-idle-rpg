import { computed, inject, Injectable } from '@angular/core'
import { setInterval } from 'worker-timers'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { ShopStore } from '../store/shop/shop.store'

const TICK_DURATION_IN_MS = 100
/** Longest real-time gap one tick simulates; anything beyond it (sleeping device) is lost. */
const MAX_TICK_DELTA_IN_MS = 1000
/** Caps catch-up attacks in one tick, so a near-zero attack speed can't stall the loop. */
const MAX_ATTACKS_PER_TICK = 10
/** Time between an enemy's death and the next spawn. */
export const RESPAWN_DELAY_IN_MS = 2000
const MS_PER_SECOND = 1000

@Injectable({ providedIn: 'root' })
export class GameIntervalService {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)
    shopStore = inject(ShopStore)

    private timePerAttack = computed(() =>
        Math.max(TICK_DURATION_IN_MS, this.playerStore.stats().attackSpeed * MS_PER_SECOND),
    )

    // Runtime timers, deliberately not saved: a reload costs at most one attack or respawn.
    private lastTickAt = 0
    private attackTimer = 0
    private respawnTimer = 0
    private secondTimer = 0

    initGameLoop() {
        this.lastTickAt = performance.now()
        setInterval(() => this.tick(), TICK_DURATION_IN_MS)
    }

    private tick() {
        const now = performance.now()
        const deltaMs = Math.min(now - this.lastTickAt, MAX_TICK_DELTA_IN_MS)
        this.lastTickAt = now

        this.advanceCombat(deltaMs)
        this.playerStore.regenMana(deltaMs)
        this.battleManagerService.tickSpells(deltaMs)

        this.secondTimer += deltaMs
        while (this.secondTimer >= MS_PER_SECOND) {
            this.secondTimer -= MS_PER_SECOND
            this.battleManagerService.tickConsumables()
            this.shopStore.tickCooldowns(MS_PER_SECOND)
        }
    }

    /** Respawn after `RESPAWN_DELAY_IN_MS`, then attack once per `attackSpeed`, carrying leftover time. */
    private advanceCombat(deltaMs: number) {
        let remainingMs = deltaMs

        if (!this.battleStore.isInCombat()) {
            this.respawnTimer += remainingMs
            if (this.respawnTimer < RESPAWN_DELAY_IN_MS) return

            remainingMs = this.respawnTimer - RESPAWN_DELAY_IN_MS
            this.respawnTimer = 0
            this.attackTimer = 0
            this.battleStore.startBattle(this.playerStore.stats().shinyChance)
        }

        this.attackTimer += remainingMs
        const timePerAttack = this.timePerAttack()
        for (let attacks = 0; this.attackTimer >= timePerAttack; attacks++) {
            if (attacks === MAX_ATTACKS_PER_TICK) {
                this.attackTimer = timePerAttack
                return
            }

            this.attackTimer -= timePerAttack
            this.battleManagerService.doDamage()

            // Killed: leftover attack time is lost, the respawn delay starts now.
            if (!this.battleStore.isInCombat()) {
                this.attackTimer = 0
                return
            }
        }
    }
}
