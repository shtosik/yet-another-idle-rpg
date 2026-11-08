import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import i18next from 'i18next'
import { QuestsStore } from '../../../../store/quests/quests.store'
import { PlayerStore } from '../../../../store/player/player.store'
import { GameNavigationService } from '../../../../services/game-navigation.service'
import QUEST_DATA from '../../../../../data/quests-data'
import { isNpcPlaceUnlocked, npcPlace, NpcPlace } from '../../../../../data/helpers/npc-places'
import { QuestID } from '../../../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../../../enums/quest-state.enum'
import { ZoneID } from '../../../../../enums/ids/zone-id.enum'
import { NpcID } from '../../../../../enums/map/npc-id.enum'
import { getQuestStatus } from '../../../../services/quest-status'
import { I18nextPipe } from '../../../../pipes/i18next.pipe'
import { RequirementRow } from '../../../../store/quests/requirement-handlers'

interface ActiveQuestRow {
  id: QuestID
  description: string
  requirements: RequirementRow[]
  /** The current step's requirements are met. Says nothing about how many steps are left. */
  ready: boolean
  pinned: boolean
  /** Who to talk to, once the Map and their town are unlocked. */
  giver: NpcPlace | null
}

/** Quests tab of the quest panel: active quests with progress, pins and links, then completed ones. */
@Component({
  selector: 'app-quest-list',
  templateUrl: './quest-list.component.html',
  styleUrls: ['./quest-list.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, I18nextPipe],
})
export class QuestListComponent {
  private questsStore = inject(QuestsStore)
  private playerStore = inject(PlayerStore)
  private navigation = inject(GameNavigationService)

  protected readonly QuestID = QuestID
  protected readonly NpcID = NpcID
  protected readonly ZoneID = ZoneID

  expandedQuest = signal<QuestID | null>(null)
  showCompleted = signal(false)

  private questIds = computed(() =>
    Object.keys(this.questsStore.questStepProgression()).map(Number) as QuestID[])

  /** Pinned first (in pin order), then ready to turn in, then the rest; QuestID order within each group. */
  activeQuests = computed<ActiveQuestRow[]>(() => {
    const pins = this.questsStore.pinnedQuests()
    const rows = this.questIds().flatMap(id => this.activeRow(id, pins))
    return rows.sort((a, b) => this.sortRank(a, pins) - this.sortRank(b, pins))
  })

  completedQuests = computed(() => {
    const progression = this.questsStore.questStepProgression()
    return this.questIds().filter(id => getQuestStatus(progression, id).state === QuestState.completed)
  })

  toggleQuest(id: QuestID): void {
    this.expandedQuest.update(current => (current === id ? null : id))
  }

  togglePin(id: QuestID): void {
    this.questsStore.togglePin(id)
  }

  toggleCompleted(): void {
    this.showCompleted.update(show => !show)
  }

  talkTo(giver: NpcPlace): void {
    this.navigation.talkTo(giver)
  }

  fightIn(zoneId: ZoneID): void {
    this.navigation.fightIn(zoneId)
  }

  /** The quest's row, or none when it isn't active or its saved step no longer exists in data. */
  private activeRow(id: QuestID, pins: QuestID[]): ActiveQuestRow[] {
    const status = getQuestStatus(this.questsStore.questStepProgression(), id)
    if (status.state !== QuestState.active) return []

    const step = QUEST_DATA[id]?.steps[status.step - 1] // saved steps start from 1
    if (!step) return []

    const requirements = step.requirements.flatMap(req => this.questsStore.requirementRows(id, req))
    return [{
      id,
      description: i18next.t(`quests:steps.${QuestID[id]}.${status.step}`, { defaultValue: step.description }),
      requirements,
      ready: this.questsStore.isStepReady(id),
      pinned: pins.includes(id),
      giver: this.reachableGiver(step.turnInNpc),
    }]
  }

  /** Pinned rows rank below zero in pin order, ready rows 0, the rest 1. */
  private sortRank(row: ActiveQuestRow, pins: QuestID[]): number {
    if (row.pinned) return pins.indexOf(row.id) - pins.length
    if (row.ready) return 0
    return 1
  }

  /** Towns open through the Map tab, so the link waits for the Map like the tab does. */
  private reachableGiver(npcId: NpcID): NpcPlace | null {
    const giver = npcPlace(npcId)
    if (!giver || !this.playerStore.mapUnlocked()) return null
    if (!isNpcPlaceUnlocked(giver, this.playerStore)) return null
    return giver
  }
}
