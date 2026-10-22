import QUEST_DATA, {
  QUEST_STEP_AFTER_COMPLETED,
  RequirementProps,
} from '../../data/quests-data'
import { QuestID } from '../../enums/ids/quest-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { QuestProgression, QuestStep } from '../../types/quests/quest-progression.type'
import { ItemStack } from '../store/player/inventory'

export type QuestStatus =
  | { state: QuestState.notStarted | QuestState.completed }
  | { state: QuestState.active, step: QuestStep }

export type RequirementCheck = (requirement: RequirementProps) => boolean

/** Status is always derived from the saved step, never stored separately. */
export function getQuestStatus(progression: QuestProgression, questId: QuestID): QuestStatus {
  const step = progression[questId]

  if (!step) return { state: QuestState.notStarted }
  if (step === QUEST_STEP_AFTER_COMPLETED) return { state: QuestState.completed }

  return { state: QuestState.active, step }
}

/** True when the quest is active at its current step and that step's requirements are met. */
export function canAdvanceQuest(
  progression: QuestProgression,
  questId: QuestID,
  isRequirementMet: RequirementCheck,
  atStep?: QuestStep,
): boolean {
  const status = getQuestStatus(progression, questId)
  if (status.state !== QuestState.active) return false
  if (atStep !== undefined && status.step !== atStep) return false

  const requirements = QUEST_DATA[questId].steps[status.step - 1].requirements // saved steps start from 1
  return !requirements || requirements.every(isRequirementMet)
}

/** True when the quest has not been started and its start requirements are met. */
export function isQuestAvailable(
  progression: QuestProgression,
  questId: QuestID,
  isRequirementMet: RequirementCheck,
): boolean {
  return getQuestStatus(progression, questId).state === QuestState.notStarted
    && QUEST_DATA[questId].startRequirements.every(isRequirementMet)
}

export function matchesQuestState(
  progression: QuestProgression,
  questId: QuestID,
  state: QuestState,
  isRequirementMet: RequirementCheck,
  atStep?: QuestStep,
): boolean {
  switch (state) {
    case QuestState.active: {
      const status = getQuestStatus(progression, questId)
      return status.state === QuestState.active && (atStep === undefined || status.step === atStep)
    }
    case QuestState.readyToAdvance:
      return canAdvanceQuest(progression, questId, isRequirementMet, atStep)
    case QuestState.available:
      return isQuestAvailable(progression, questId, isRequirementMet)
    case QuestState.notStarted:
    case QuestState.completed:
      return getQuestStatus(progression, questId).state === state
    default:
      return false
  }
}

/** Item requirements of a quest step (1-based); turn-ins consume these. */
export function getStepItems(questId: QuestID, step: QuestStep): ItemStack[] {
  return (QUEST_DATA[questId].steps[step - 1]?.requirements ?? [])
    .flatMap(r => r.type === 'item' ? [{ id: r.itemId, amount: r.amount }] : [])
}

export function getActiveQuestIds(progression: QuestProgression): Set<QuestID> {
  const active = new Set<QuestID>()
  for (const key in progression) {
    const questId = Number(key) as QuestID
    if (getQuestStatus(progression, questId).state === QuestState.active) active.add(questId)
  }
  return active
}
