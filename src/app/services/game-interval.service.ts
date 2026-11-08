import { computed, inject, Injectable } from '@angular/core'
import { setInterval } from 'worker-timers'
import { PlayerStore } from '../store/player/player.store'
import { BattleStore } from '../store/battle/battle.store'
import { BattleManagerService } from './battle-manager.service'
import { ShopStore } from '../store/shop/shop.store'
import { OfflineProgressService } from './offline-progress.service'
import { ArenaService } from './arena.service'
import { TurnInCooldownService } from './turn-in-cooldown.service'
import { ARENA } from '../../data/arena-data'
import { MS_PER_SECOND, RESPAWN_DELAY_IN_MS, stepCombat, TICK_DURATION_IN_MS, timePerAttackMs } from './combat-step'

/** Longest real-time gap one tick simulates; a longer one is clamped to this. */
const MAX_TICK_DELTA_IN_MS = 1000
/** A gap this long (sleeping device) isn't simulated by the tick: it goes to an offline claim instead. */
const SLEEP_GAP_IN_MS = 60 * 1000

@Injectable({ providedIn: 'root' })
export class GameIntervalService {
    playerStore = inject(PlayerStore)
    battleStore = inject(BattleStore)
    battleManagerService = inject(BattleManagerService)
    shopStore = inject(ShopStore)
    offlineProgress = inject(OfflineProgressService)
    arenaService = inject(ArenaService)
    turnInCooldowns = inject(TurnInCooldownService)

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
        this.arenaService.tick(wallNow)
        this.advanceCombat(deltaMs)
        this.playerStore.regenMana(deltaMs)
        this.battleManagerService.tickSpells(deltaMs)
        this.battleManagerService.tickDamageOverTime(deltaMs)

        this.secondTimer += deltaMs
        while (this.secondTimer >= MS_PER_SECOND) {
            this.secondTimer -= MS_PER_SECOND
            this.battleManagerService.tickConsumables()
            this.shopStore.tickCooldowns(MS_PER_SECOND)
            this.turnInCooldowns.tick(wallNow)
            this.offlineProgress.markSeen()
        }
    }

    private advanceCombat(deltaMs: number) {
        const timers = stepCombat({ attackTimer: this.attackTimer, respawnTimer: this.respawnTimer }, deltaMs, {
            inCombat: this.battleStore.isInCombat(),
            respawnDelayMs: this.battleStore.arenaRun() ? ARENA.respawnDelayMs : RESPAWN_DELAY_IN_MS,
            timePerAttackMs: this.timePerAttack(),
            spawn: () => this.battleStore.startBattle(this.playerStore.stats().shinyChance),
            attack: () => {
                this.battleManagerService.doDamage()
                return !this.battleStore.isInCombat()
            },
        })
        this.attackTimer = timers.attackTimer
        this.respawnTimer = timers.respawnTimer
    }
}
