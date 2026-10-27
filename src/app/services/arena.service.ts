import { rollEnemyDrops } from '../store/player/kill-rewards'
import { InventoryItem } from '../../interfaces/item.interface'
import { computed, inject, Injectable, Injector, signal } from '@angular/core'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { ModalService } from './modal.service'
import { GameNavigationService } from './game-navigation.service'
import { ArenaBossesService } from './arena-bosses.service'
import { ARENA } from '../../data/arena-data'
import { Enemy } from '../../interfaces/enemy.interface'
import { GameTab } from '../../enums/ids/game-tab.enum'

export type ArenaOutcome = 'cleared' | 'timeout' | 'left'

export interface ArenaResult {
  outcome: ArenaOutcome
  timeMs: number
  kills: number
  experience: number
  gold: number
  isBestTime: boolean
}

/** The Combat Arena run: starting it, its kills, its clock and how it ends (docs/systems/arena.md). */
@Injectable({ providedIn: 'root' })
export class ArenaService {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)
  private modalService = inject(ModalService)
  private bosses = inject(ArenaBossesService)
  // Looked up on use: GameNavigationService → DialogueManagerService → ArenaService would be a cycle.
  private injector = inject(Injector)

  readonly run = this.battleStore.arenaRun
  /** Wall clock at the last tick, for the countdown. */
  private readonly now = signal(Date.now())
  readonly remainingSeconds = computed(() => {
    const run = this.run()
    return run ? Math.max(0, Math.ceil((run.endsAt - this.now()) / 1000)) : 0
  })
  readonly canClaimRewards = computed(() => {
    const rewards = this.battleStore.arenaRewards()
    return rewards.length > 0 && this.playerStore.canFitItems(rewards)
  })

  /** Starts a run and shows the fight. The entry fee is the caller's (the Arena Master's `stat` deduct). */
  /** No run going on and the entry cooldown is over. */
  isReady(now = Date.now()): boolean {
    return !this.run() && now >= this.battleStore.arenaReadyAt()
  }

  enter(now = Date.now()): void {
    if (!this.isReady(now)) return
    this.battleStore.startArenaRun(now)
    this.injector.get(GameNavigationService).changeTab(GameTab.main)
  }

  /** An arena kill (the enemy is already gone): XP and gold, and the clear after the last wave. */
  onKill(enemy: Enemy, now = Date.now()): void {
    const stats = this.playerStore.stats()
    const experience = Math.ceil(enemy.experience * stats.xpMultiplier)
    const gold = Math.ceil(enemy.gold * stats.goldCoinsMultiplier)
    this.playerStore.updatePlayerStats([
      { stat: 'experience', amount: experience },
      { stat: 'goldCoins', amount: gold },
    ])
    this.battleStore.recordArenaKill(experience, gold)
    // Champions' pets; lost on a full inventory, like any drop.
    const drops = new Map<string, InventoryItem>()
    rollEnemyDrops(enemy, 1, false, 0, drops)
    if (drops.size) this.playerStore.addItems([...drops.values()])

    if (this.run()!.wave > ARENA.waves.length) this.finish('cleared', now)
  }

  /** Every game tick: the run fails once its clock runs out, also when that happened while the game was closed. */
  tick(now: number): void {
    this.now.set(now)
    const run = this.run()
    if (run && now >= run.endsAt) this.finish('timeout', now)
    else this.bosses.tick(now)
  }

  leave(now = Date.now()): void {
    if (this.run()) this.finish('left', now)
  }

  /** Puts the waiting clear rewards in the inventory; false (nothing moves) while they don't fit. */
  claimRewards(): boolean {
    if (!this.canClaimRewards()) return false
    this.playerStore.addItems(this.battleStore.arenaRewards())
    this.battleStore.clearArenaRewards()
    return true
  }

  private finish(outcome: ArenaOutcome, now: number): void {
    const run = this.run()!
    const timeMs = Math.min(now, run.endsAt) - run.startedAt
    const cleared = outcome === 'cleared'
    const best = this.battleStore.arenaBestTimeMs()
    const isBestTime = cleared && (best === null || timeMs < best)
    const isFirstClear = cleared && this.battleStore.arenaClears() === 0

    this.battleStore.endArenaRun(cleared, timeMs)
    if (cleared) this.battleStore.addArenaRewards([...ARENA.clearRewards, ...(isFirstClear ? ARENA.firstClearRewards : [])])

    const result: ArenaResult = { outcome, timeMs, kills: run.kills, experience: run.experience, gold: run.gold, isBestTime }
    this.modalService.openArenaResult(result)
  }
}
