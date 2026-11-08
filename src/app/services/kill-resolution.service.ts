import { inject, Injectable } from '@angular/core'
import ZONES_DATA from '../../data/zones-data'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { Kill, KillBatch, Rng, rollKills } from '../store/player/kill-rewards'
import { KillBatchResult, PlayerStore } from '../store/player/player.store'
import { isTaskDone } from '../store/player/tasks'
import { QuestsStore } from '../store/quests/quests.store'
import { getQuestDropLimits } from './quest-status'
import { UnlockService } from './unlock.service'

export type KillResolution = KillBatchResult & Pick<KillBatch, 'kills' | 'shinies' | 'experience' | 'gold'>

/**
 * Kill resolution: turns zone kills into XP, gold, drops, kill counts, task progress and zone progress, by the same
 * rules online (a batch of one) and in an offline claim. Arena kills are paid separately (ADR 0003).
 */
@Injectable({ providedIn: 'root' })
export class KillResolutionService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private unlockService = inject(UnlockService)

  /** Bestiary ranks and quest caps are read once, at the start of the batch. A boss kill opens the next zone. */
  resolveKills(zoneId: ZoneID, wave: number, kills: Kill[], rng: Rng): KillResolution {
    const zone = ZONES_DATA[zoneId]
    const batch = rollKills(zone, wave, kills, {
      questDropLimits: getQuestDropLimits(this.questsStore.questStepProgression(), this.questsStore.orders(), this.playerStore.itemCount),
      enemyKillCounts: this.playerStore.enemyKillCounts(),
      taskEnemyIds: new Set(this.playerStore.activeTasks().filter(task => !isTaskDone(task)).map(task => task.monsterId)),
    }, rng)
    const result = this.playerStore.applyKillBatch(batch)

    if (kills.length > 0 && wave === zone.maxWave && zone.nextZoneId) {
      this.unlockService.grant({ type: 'zone', zoneId: zone.nextZoneId })
    }
    return { ...result, kills: batch.kills, shinies: batch.shinies, experience: batch.experience, gold: batch.gold }
  }
}
