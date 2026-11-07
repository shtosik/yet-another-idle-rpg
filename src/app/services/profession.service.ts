import { inject, Injectable, signal } from '@angular/core'
import i18next from 'i18next'
import { PlayerStore, ProfessionGain } from '../store/player/player.store'
import { expertiseGain } from '../store/player/stats'
import { formatStat } from '../components/game/player-stats/stat-rows'
import { ProfessionID } from '../../enums/ids/profession-id.enum'

const LEVEL_UP_TOAST_MS = 4000

/** Every profession XP gain goes through `gainXp`, so each one shows its level-ups. */
@Injectable({ providedIn: 'root' })
export class ProfessionService {
  private playerStore = inject(PlayerStore)
  private levelUpTimer?: ReturnType<typeof setTimeout>

  /** "Farming expertise 10: +5% ..., +1 skill point" for the last gain that levelled; clears itself. */
  levelUpToast = signal<string | null>(null)

  /** Adds XP and toasts a level-up. Does nothing while the profession is locked. */
  gainXp(professionId: ProfessionID, amount: number): void {
    const gain = this.playerStore.applyProfessionXp(professionId, amount)
    if (!gain || gain.to <= gain.from) return

    clearTimeout(this.levelUpTimer)
    this.levelUpToast.set(this.levelUpText(gain))
    this.levelUpTimer = setTimeout(() => this.levelUpToast.set(null), LEVEL_UP_TOAST_MS)
  }

  private levelUpText({ professionId, from, to, skillPoints }: ProfessionGain): string {
    const rewards = expertiseGain(professionId, from, to).map(({ stat, amount }) =>
      `+${formatStat('bonus', amount)} ${i18next.t(`app:playerStats.${stat}`)}`)
    if (skillPoints > 0) rewards.push(i18next.t('app:expertise.skillPoints', { count: skillPoints }))
    return i18next.t('app:expertise.levelUp', {
      expertise: i18next.t('app:expertise.label', { profession: i18next.t(`app:professions.${ProfessionID[professionId]}`), level: to }),
      rewards: rewards.join(', '),
    })
  }
}
