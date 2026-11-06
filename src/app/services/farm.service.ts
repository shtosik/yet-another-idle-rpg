import { computed, inject, Injectable, signal } from '@angular/core'
import i18next from 'i18next'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { ProfessionService } from './profession.service'
import { getQuestStatus } from './quest-status'
import { QuestState } from '../../enums/quest-state.enum'
import { plotCount } from '../store/player/farm'
import { ReputationID } from '../../enums/reputation-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { FARM_SEEDS, PLOT_GRANT_QUEST_IDS } from '../../data/farming-data'
import { missingSlotsText } from '../components/game/inventory/tab-text'

const TOAST_MS = 4000

/** Plot count, the active seed and the plot actions of the plots panel. */
@Injectable({ providedIn: 'root' })
export class FarmService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private professionService = inject(ProfessionService)
  private toastTimer?: ReturnType<typeof setTimeout>

  /** What the last harvest did ("4 Turnip, +3 Farming XP", or what a blocked one needs); clears itself. */
  toast = signal<string | null>(null)
  /** The seed a click on an empty plot plants. Read `activeSeed`: this one may have run out. */
  private selectedSeed = signal<ItemID | null>(null)

  guildTier = computed(() => this.playerStore.reputationTierOf(ReputationID.farmingGuild))
  level = computed(() => this.playerStore.professionLevel(ProfessionID.farming))

  /** Plots from this index on are locked. */
  plotLimit = computed(() => {
    const progression = this.questsStore.questStepProgression()
    const quests = PLOT_GRANT_QUEST_IDS.filter(id => getQuestStatus(progression, id).state === QuestState.completed).length
    return plotCount(this.guildTier(), quests)
  })

  activeSeed = computed(() => {
    const seedId = this.selectedSeed()
    return seedId !== null && this.canPlant(seedId) ? seedId : null
  })

  canPlant(seedId: ItemID): boolean {
    return (this.playerStore.farm().seeds[seedId] ?? 0) > 0 && this.level() >= (FARM_SEEDS[seedId]?.requiredLevel ?? Infinity)
  }

  /** Clicking the active seed again deselects it. */
  toggleSeed(seedId: ItemID): void {
    if (!this.canPlant(seedId)) return
    this.selectedSeed.update(current => current === seedId ? null : seedId)
  }

  plant(plotIndex: number): void {
    const seedId = this.activeSeed()
    if (seedId !== null) this.playerStore.plantSeed(seedId, this.plotLimit(), plotIndex)
  }

  plantAll(): void {
    const seedId = this.activeSeed()
    if (seedId !== null) this.playerStore.plantSeed(seedId, this.plotLimit())
  }

  /** One plot, or every ready plot when `plotIndex` is omitted. */
  harvest(plotIndex?: number): void {
    const { crops, xp, blocked, missing } = this.playerStore.harvestPlots(plotIndex)
    if (xp > 0) this.professionService.gainXp(ProfessionID.farming, xp)
    const lines: string[] = []
    if (crops.length) {
      const names = crops.map(({ id, amount }) => `${amount} ${i18next.t(`items:names.${ItemID[id]}`)}`).join(', ')
      lines.push(i18next.t('map:farm.harvested', { crops: names, xp }))
    }
    if (blocked) lines.push(i18next.t('map:farm.harvestBlocked', { slots: missingSlotsText(missing) }))
    if (lines.length === 0) return

    clearTimeout(this.toastTimer)
    this.toast.set(lines.join('\n'))
    this.toastTimer = setTimeout(() => this.toast.set(null), TOAST_MS)
  }
}
