import { computed, inject, Injectable } from '@angular/core'
import { setInterval } from 'worker-timers'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { ShopStore } from '../store/shop/shop.store'
import { OfflineProgressService } from './offline-progress.service'
import { MS_PER_SECOND, RESPAWN_DELAY_IN_MS, TICK_DURATION_IN_MS, timePerAttackMs } from './combat-timing'

/** Longest real-time gap one tick simulates; a longer one is clamped to this. */
const MAX_TICK_DELTA_IN_MS = 1000
/** A gap this long (sleeping device) isn't simulated by the tick: it goes to an offline claim instead. */
const SLEEP_GAP_IN_MS = 60 * 1000
/** Caps catch-up attacks in one tick, so a near-zero attack speed can't stall the loop. */
const MAX_ATTACKS_PER_TICK = 10

@Injectable({ providedIn: 'root' })
export class GameIntervalService {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)
    shopStore = inject(ShopStore)
    offlineProgress = inject(OfflineProgressService)

    private timePerAttack = computed(() => timePerAttackMs(this.playerStore.stats()))

    // Runtime timers, deliberately not saved: a reload costs at most one attack or respawn.
    private lastTickAt = 0
    private lastTickWallAt = 0
    private attackTimer = 0
    private respawnTimer = 0
    private secondTimer = 0

    initGameLoop() {
        this.lastTickAt = performance.now()
        this.lastTickWallAt = Date.now()
        void this.offlineProgress.claim()
        setInterval(() => this.tick(), TICK_DURATION_IN_MS)
    }

    private tick() {
        const now = performance.now()
        const wallNow = Date.now()
        const rawDeltaMs = now - this.lastTickAt
        // Either clock can show the gap: the monotonic one may pause while the device sleeps.
        const isSleepGap = rawDeltaMs > SLEEP_GAP_IN_MS || wallNow - this.lastTickWallAt > SLEEP_GAP_IN_MS
        this.lastTickAt = now
        this.lastTickWallAt = wallNow

        if (isSleepGap) {
            this.offlineProgress.onSleepGap()
            return
        }

        const deltaMs = Math.min(rawDeltaMs, MAX_TICK_DELTA_IN_MS)
        this.advanceCombat(deltaMs)
        this.playerStore.regenMana(deltaMs)
        this.battleManagerService.tickSpells(deltaMs)

        this.secondTimer += deltaMs
        while (this.secondTimer >= MS_PER_SECOND) {
            this.secondTimer -= MS_PER_SECOND
            this.battleManagerService.tickConsumables()
            this.shopStore.tickCooldowns(MS_PER_SECOND)
            this.offlineProgress.markSeen()
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
