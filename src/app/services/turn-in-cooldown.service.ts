import { inject, Injectable, signal } from '@angular/core'
import { REPUTATION_TURN_INS } from '../../data/reputation-turn-ins'
import { NpcID } from '../../enums/map/npc-id.enum'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { bundleKey, TurnInKey, turnInRemainingMs } from '../store/quests/turn-in-cooldown'

/** Turn-in cooldowns as the UI sees them: one shared 1 s clock, so every tag and badge counts down together. */
@Injectable({ providedIn: 'root' })
export class TurnInCooldownService {
  private questsStore = inject(QuestsStore)
  private playerStore = inject(PlayerStore)

  private readonly now = signal(Date.now())

  /** Every second, from the game loop. The clock can lag the real one by up to a second, which only delays "ready". */
  tick(now = Date.now()): void {
    this.now.set(now)
  }

  /** Milliseconds until the turn-in is ready; 0 when ready. Reads the shared clock, so a template or computed stays live. */
  remainingMs(key: TurnInKey): number {
    return turnInRemainingMs(this.questsStore.lastTurnInAt()[key], this.playerStore.stats().turnInCooldownReduction, this.now())
  }

  /** The turn-in keys an NPC owns. Orders join here with the order feature. */
  keysOf(npcId: NpcID): TurnInKey[] {
    return REPUTATION_TURN_INS.filter(turnIn => turnIn.npcId === npcId).map(turnIn => bundleKey(turnIn.npcId, turnIn.itemId))
  }

  /** The soonest ready time when all of the NPC's turn-ins are cooling; null when it has none or one is ready. */
  npcWaitMs(npcId: NpcID): number | null {
    const waits = this.keysOf(npcId).map(key => this.remainingMs(key))
    return waits.length > 0 && waits.every(ms => ms > 0) ? Math.min(...waits) : null
  }
}
