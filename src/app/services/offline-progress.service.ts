import { WeaponCategory } from '../../enums/weapon-category.enum'
import { inject, Injectable } from '@angular/core'
import { setTimeout } from 'worker-timers'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { OfflineStore } from '../store/offline/offline.store'
import { saveGameStateNow } from '../store/helpers/with-game-state-sync.hook'
import { activeBuffSpellIds } from '../store/player/stats'
import { CONSUMABLE_SLOTS } from '../../interfaces/consumable.interface'
import { isTaskDone } from '../store/player/player.store'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'
import { BattleManagerService } from './battle-manager.service'
import { ModalService } from './modal.service'
import { getActiveQuestIds } from './quest-status'
import { MS_PER_SECOND } from './combat-timing'
import { OfflineSegment, seededRng, simulateOfflineKills } from './offline-simulation'
import { InventoryItem } from '../../interfaces/item.interface'

/** Most offline time one claim pays for. */
export const OFFLINE_CAP_IN_MS = 24 * 60 * 60 * 1000
/** Shorter absences (a reload) are not worth a claim or a modal. */
export const MIN_OFFLINE_CLAIM_IN_MS = 60 * 1000
/** While the host can't be reached, the claim stays pending and is retried this often. */
const SERVER_TIME_RETRY_IN_MS = 30 * 1000

export interface OfflineSummary {
  elapsedMs: number
  kills: number
  shinies: number
  experience: number
  levelsGained: number
  gold: number
  items: InventoryItem[]
  lostDrops: number
}

/**
 * Host time from the `Date` header of a HEAD request to the page's own origin, so a moved local clock can't
 * fake offline time. `null` when the request fails or the header is missing.
 */
async function fetchServerTime(): Promise<number | null> {
  try {
    const response = await fetch(location.origin, { method: 'HEAD', cache: 'no-store' })
    const date = Date.parse(response.headers.get('Date') ?? '')
    return Number.isFinite(date) ? date : null
  } catch {
    return null
  }
}

/**
 * Offline progress (docs/systems/offline-progress.md): pays for the time since `lastSeenAt` as kills on the
 * current wave, on load and after a sleeping device wakes up.
 *
 * Session time is the host time from one request plus `performance.now()` since then, so changing the local
 * clock mid-session does nothing.
 */
@Injectable({ providedIn: 'root' })
export class OfflineProgressService {
  private playerStore = inject(PlayerStore)
  private battleStore = inject(BattleStore)
  private questsStore = inject(QuestsStore)
  private offlineStore = inject(OfflineStore)
  private battleManager = inject(BattleManagerService)
  private modalService = inject(ModalService)

  /** Host time at a `performance.now()` reading; `null` while a claim is pending. */
  private anchor: { hostMs: number, perfMs: number } | null = null
  /** `performance.now()` when the pending claim started: time after it is played online, so it isn't claimed. */
  private pendingSincePerf: number | null = null
  private isClaiming = false

  /** Host time now, or `null` until the host has answered. */
  private now(): number | null {
    return this.anchor && this.anchor.hostMs + performance.now() - this.anchor.perfMs
  }

  /** Once a second while the game runs. Does nothing while a claim is pending, so its time isn't skipped. */
  markSeen(): void {
    const now = this.now()
    if (now !== null) this.offlineStore.setLastSeen(now)
  }

  /** A gap the tick won't simulate (sleeping device): stop marking time and claim it. */
  onSleepGap(): void {
    this.anchor = null
    void this.claim()
  }

  async claim(): Promise<void> {
    if (this.isClaiming) return
    this.isClaiming = true
    // Kept across retries: the claim ends where the wait began, however long the host takes to answer.
    this.pendingSincePerf ??= performance.now()
    try {
      const hostNow = await fetchServerTime()
      if (hostNow === null) {
        setTimeout(() => void this.claim(), SERVER_TIME_RETRY_IN_MS)
        return
      }
      const claimEnd = hostNow - (performance.now() - this.pendingSincePerf)
      this.pendingSincePerf = null
      this.anchor = { hostMs: hostNow, perfMs: performance.now() }

      const lastSeen = this.offlineStore.lastSeenAt()
      this.offlineStore.setLastSeen(hostNow)
      // A clock moved back gives a negative gap: it claims nothing.
      const gapMs = lastSeen === null ? 0 : Math.max(0, claimEnd - lastSeen)
      const elapsedMs = Math.min(OFFLINE_CAP_IN_MS, gapMs)

      // An arena run held the fight while away: no zone kills for that time (its clock ran on; the tick ends it).
      const isClaimable = elapsedMs >= MIN_OFFLINE_CLAIM_IN_MS && !this.battleStore.arenaRun()
      const summary = isClaimable ? this.applyOffline(elapsedMs, lastSeen!) : null
      // Timers run out in real time even when the gap is too short to claim. After the simulation, which reads them.
      this.tickTimers(gapMs)
      if (!summary) return

      // No spells run offline, so a storm in progress ends with a claimed absence; a shorter gap (a reload) only pauses it.
      this.battleStore.clearDamageOverTime()

      // Rewards and the new `lastSeenAt` land together before the modal, so a reload can't claim twice.
      saveGameStateNow()
      if (summary.kills > 0) this.modalService.openWelcomeBack(summary)
    } finally {
      this.isClaiming = false
    }
  }

  private applyOffline(elapsedMs: number, seed: number): OfflineSummary {
    const zone = this.battleStore.currentZoneData()
    const wave = this.battleStore.currentWave()

    const result = simulateOfflineKills({
      zone,
      wave,
      segments: this.segments(elapsedMs),
      damageType: this.playerStore.equippedWeaponDamageType(),
      isMeleeWeapon: this.playerStore.equippedWeaponCategory() === WeaponCategory.melee,
      hasWeaknessSkill: this.playerStore.hasSkillUnlocked(SkillNodeID.weaknesses),
      activeQuestIds: getActiveQuestIds(this.questsStore.questStepProgression()),
      taskEnemyIds: new Set(this.playerStore.activeTasks().filter(task => !isTaskDone(task)).map(task => task.monsterId)),
      enemyKillCounts: this.playerStore.enemyKillCounts(),
      rollingKillMs: this.offlineStore.rollingKillMs(zone.id, wave),
      rng: seededRng(seed),
    })

    const { levelsGained, lostDrops, receivedItems, installedStations } = this.playerStore.applyKillBatch({ ...result, zoneId: zone.id, wave })
    // Town and feature unlocks follow from the new state on their own (UnlockService).
    if (result.kills > 0) this.battleManager.unlockNextZone(wave)
    installedStations.forEach(itemId => this.modalService.openStationInstalled(itemId))

    return {
      elapsedMs,
      kills: result.kills,
      shinies: result.shinies,
      experience: result.experience,
      levelsGained,
      gold: result.gold,
      items: receivedItems,
      lostDrops,
    }
  }

  /** Buffs, consumable effects, slot locks and spell cooldowns ran out while away. Auto-eat doesn't run. */
  private tickTimers(gapMs: number): void {
    if (gapMs <= 0) return
    this.battleStore.tickSpellTimers(gapMs)
    this.battleStore.tickConsumables(Math.floor(gapMs / MS_PER_SECOND))
  }

  /** Splits the claim where a buff or consumable effect runs out, so the stats change there. */
  private segments(elapsedMs: number): OfflineSegment[] {
    const buffs = this.battleStore.activeBuffs()
    const slots = this.battleStore.consumableSlots()
    const ends = new Set<number>([elapsedMs])
    buffs.forEach(buff => ends.add(buff.msRemaining))
    Object.values(slots).forEach(slot => slot && ends.add(slot.effectRemaining * MS_PER_SECOND))

    const boundaries = [...ends].filter(ms => ms > 0 && ms <= elapsedMs).sort((a, b) => a - b)
    let startMs = 0
    return boundaries.map(endMs => {
      const buffIds = activeBuffSpellIds(buffs.filter(buff => buff.msRemaining > startMs))
      const consumableIds = CONSUMABLE_SLOTS.flatMap(slot => {
        const active = slots[slot]
        return active && active.effectRemaining * MS_PER_SECOND > startMs ? [active.itemId] : []
      })
      const segment = { durationMs: endMs - startMs, stats: this.playerStore.statsFor(buffIds, consumableIds) }
      startMs = endMs
      return segment
    })
  }
}
