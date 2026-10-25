import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import i18next from 'i18next'
import { QuestsStore } from '../../../store/quests/quests.store'
import { PlayerStore } from '../../../store/player/player.store'
import { GameNavigationService } from '../../../services/game-navigation.service'
import QUEST_DATA, { RequirementProps } from '../../../../data/quests-data'
import { questGiverFor, QuestGiver } from '../../../../data/helpers/quest-givers'
import { ZONES_BY_ENEMY } from '../../../../data/helpers/enemy-zones'
import { QuestID } from '../../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../../enums/quest-state.enum'
import { ItemID } from '../../../../enums/ids/item-id.enum'
import { EnemyID } from '../../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../../enums/ids/zone-id.enum'
import { NpcID } from '../../../../enums/map/npc-id.enum'
import { getQuestStatus } from '../../../services/quest-status'
import { I18nextPipe } from '../../../pipes/i18next.pipe'

type PanelTab = 'quests' | 'reputation'

interface RequirementRow {
  label: string
  current: number
  target: number
  /** An unlocked zone where this kill requirement can be done. */
  zoneId: ZoneID | null
}

interface ActiveQuestRow {
  id: QuestID
  description: string
  requirements: RequirementRow[]
  /** The current step's requirements are met. Says nothing about how many steps are left. */
  ready: boolean
  pinned: boolean
  /** Who to talk to, once the Map and their town are unlocked. */
  giver: QuestGiver | null
}

@Component({
  selector: 'app-quests',
  templateUrl: 'quests.component.html',
  styleUrls: ['./quests.component.sass'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, I18nextPipe],
})
export class QuestsComponent {
  private questsStore = inject(QuestsStore)
  private playerStore = inject(PlayerStore)
  private navigation = inject(GameNavigationService)

  protected readonly QuestID = QuestID
  protected readonly NpcID = NpcID
  protected readonly ZoneID = ZoneID

  tab = signal<PanelTab>('quests')
  expandedQuest = signal<QuestID | null>(null)
  showCompleted = signal(false)

  private questIds = computed(() =>
    Object.keys(this.questsStore.questStepProgression()).map(Number) as QuestID[])

  /** Pinned first (in pin order), then ready to turn in, then the rest; QuestID order within each group. */
  activeQuests = computed<ActiveQuestRow[]>(() => {
    const progression = this.questsStore.questStepProgression()
    const pins = this.questsStore.pinnedQuests()
    // Towns open through the Map tab, so the link waits for it like the tab does.
    const canTravel = this.playerStore.mapUnlocked()
    const rank = (row: ActiveQuestRow) => (row.pinned ? pins.indexOf(row.id) - pins.length : row.ready ? 0 : 1)

    return this.questIds()
      .flatMap(id => {
        const status = getQuestStatus(progression, id)
        if (status.state !== QuestState.active) return []

        const step = QUEST_DATA[id].steps[status.step - 1] // saved steps start from 1
        const requirements = step.requirements.map(req => ({
          label: this.requirementLabel(req),
          zoneId: this.requirementZone(req),
          ...this.questsStore.requirementProgress(id, req),
        }))
        const giver = questGiverFor(id, status.step)
        return [{
          id,
          description: step.description,
          requirements,
          ready: requirements.every(({ current, target }) => current >= target),
          pinned: pins.includes(id),
          giver: giver && canTravel && this.playerStore.isTownUnlocked(giver.townId) ? giver : null,
        }]
      })
      .sort((a, b) => rank(a) - rank(b))
  })

  completedQuests = computed(() => {
    const progression = this.questsStore.questStepProgression()
    return this.questIds().filter(id => getQuestStatus(progression, id).state === QuestState.completed)
  })

  selectTab(tab: PanelTab): void {
    this.tab.set(tab)
  }

  toggleQuest(id: QuestID): void {
    this.expandedQuest.update(current => (current === id ? null : id))
  }

  togglePin(id: QuestID): void {
    this.questsStore.togglePin(id)
  }

  toggleCompleted(): void {
    this.showCompleted.update(show => !show)
  }

  talkTo(giver: QuestGiver): void {
    this.navigation.talkTo(giver.townId, giver.buildingId, giver.npcId)
  }

  fightIn(zoneId: ZoneID): void {
    this.navigation.fightIn(zoneId)
  }

  private requirementZone(req: RequirementProps): ZoneID | null {
    const zones = req.type === 'enemy' ? ZONES_BY_ENEMY[req.enemyId] ?? []
      : req.type === 'wave' ? [req.zoneId]
        : []
    return zones.find(zoneId => this.playerStore.isZoneUnlocked(zoneId)) ?? null
  }

  private requirementLabel(req: RequirementProps): string {
    switch (req.type) {
      case 'item':
        return i18next.t(`items:names.${ItemID[req.itemId]}`)
      case 'enemy':
        return i18next.t(`enemies:names.${EnemyID[req.enemyId]}`)
      case 'wave':
        return i18next.t('quests:requirements.wave', {
          wave: req.wave,
          zone: i18next.t(`zones:names.${ZoneID[req.zoneId]}`),
        })
      case 'stat':
        return i18next.t(`app:playerStats.${req.key}`)
      case 'quest':
        return i18next.t(`quests:names.${QuestID[req.questId]}`)
    }
  }
}
