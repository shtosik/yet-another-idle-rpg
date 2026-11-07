import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueResult } from '../../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../../types/dialogues/dialogue-effect.type'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { dialogueNodes } from '../dialogue-nodes'

// Character and voice: docs/character/lirold/phurgo.md. Text: dialogues/liroldPhurgo.json.
export enum PhurgoDialogue {
  default = 0,
  intro1,
  aboutForge,
  aboutForgeRestored,
  aboutPie,
  aboutHome,
  aboutHomeLife,
  aboutLeaving,
  coldForgeOffer,
  coldForgeProgressOne,
  coldForgeProgressTwo,
  coldForgeTongs,
  coldForgeProgressThree,
  coldForgeProgressFour,
  coldForgePie,
  coldForgeProgressFive,
  coldForgeComplete,
  forgeWork,
  forgeCost,
  forgeLimits,
  introBuckle,
  aboutSlatefall,
  aboutSlatefallGuess,
  coldForgeWhyTongs,
  coldForgeChair,
  coldForgeRecord,
  coldForgeWood,
  forgeJoin,
  forgeMatch,
  forgeRisk,
  aboutPieFirst,
  aboutTally,
  hearthPress,
  hearthPressArm,
  hearthPressEnd,
  idleForge,
  idleHot,
  aboutTable,
}

export type LiroldPhurgoDialogueType = Record<PhurgoDialogue, DialogueNode<PhurgoDialogue>>

const P = PhurgoDialogue
const say = dialogueNodes<PhurgoDialogue>('dialogues/liroldPhurgo', PhurgoDialogue)

const TABLE_APPLE_FLAG = 'phurgo_table_apple'
const FORGE_USED_FLAG = 'phurgo_forge_used'
const metFlag: DialogueEffect = { type: 'flag', name: `met_${NpcID.liroldPhurgo}` }

const forgeQuest = (questState: QuestState, step?: number): DialogueCondition => ({ type: 'quest', questId: QuestID.theColdForge, questState, step })
const completed = forgeQuest(QuestState.completed)
const available = forgeQuest(QuestState.available)
const ready = (step: number) => forgeQuest(QuestState.readyToAdvance, step)
const active = (step: number) => forgeQuest(QuestState.active, step)
/** Item steps: the reminder never shows beside the turn-in. Talk steps 1 and 3 are ready at once, at another NPC. */
const stillGathering = (step: number): DialogueCondition[] => [active(step), { ...ready(step), not: true }]

type Result = DialogueResult<PhurgoDialogue>
const toHub: Result = { next: P.default }
const close: Result = { closeDialogue: true }
const advance: DialogueEffect = { type: 'quest', questId: QuestID.theColdForge, action: 'advance' }
const startQuest: Result = { next: P.default, effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'start' }] }
const openForge: Result = { visibilityConditions: [completed], closeDialogue: true, effects: [{ type: 'flag', name: FORGE_USED_FLAG }, { type: 'forge' }] }

/** A step reminder: leave, or back to the hub. */
const reminder = (id: PhurgoDialogue) => say(id, ['opt1', close], ['opt2', toHub])

const LIROLD_PHURGO: LiroldPhurgoDialogueType = {
  [P.intro1]: say(P.intro1, ['opt1', { next: P.introBuckle, effects: [metFlag] }], ['opt2', { closeDialogue: true, effects: [metFlag] }]),
  [P.introBuckle]: say(P.introBuckle, ['opt1', { next: P.aboutForge }], ['opt2', close]),

  [P.default]: say(P.default,
    // Turn-ins
    ['opt1', { visibilityConditions: [ready(5)], next: P.coldForgeComplete, effects: [advance] }],
    ['opt2', { visibilityConditions: [ready(4)], next: P.coldForgePie, effects: [advance] }],
    ['opt3', { visibilityConditions: [ready(2)], next: P.coldForgeTongs, effects: [advance] }],
    // Reminders
    [
      'opt4',
      { visibilityConditions: stillGathering(5), next: P.coldForgeProgressFive },
      { visibilityConditions: stillGathering(4), next: P.coldForgeProgressFour },
      { visibilityConditions: [active(3)], next: P.coldForgeProgressThree },
      { visibilityConditions: stillGathering(2), next: P.coldForgeProgressTwo },
      { visibilityConditions: [active(1)], next: P.coldForgeProgressOne },
    ],
    // Offer
    ['opt5', { visibilityConditions: [available], next: P.coldForgeOffer }],
    // The Forge
    ['opt6', openForge],
    ['opt7', { visibilityConditions: [completed], next: P.forgeWork }],
    ['opt8', { visibilityConditions: [completed], next: P.aboutForgeRestored }, { next: P.aboutForge }],
    // Talk
    ['opt9', { visibilityConditions: [active(4)], next: P.hearthPress }, { visibilityConditions: [active(5)], next: P.hearthPress }],
    ['opt10', { next: P.aboutPie }],
    ['opt11', { next: P.aboutHome }],
    ['opt12', { visibilityConditions: [completed], next: P.idleHot }, { next: P.idleForge }],
    // The table takes him some time to build, so it waits until the player has been back to use the Forge.
    ['opt13', { visibilityConditions: [completed, { type: 'flag', name: FORGE_USED_FLAG, isSet: true }, { type: 'flag', name: TABLE_APPLE_FLAG, isSet: false }], next: P.aboutTable, effects: [{ type: 'flag', name: TABLE_APPLE_FLAG }] }],
    ['opt14', close],
  ),

  // The cold Forge
  [P.aboutForge]: say(P.aboutForge,
    ['opt1', { visibilityConditions: [available], next: P.coldForgeOffer }, toHub],
    ['opt2', { next: P.aboutSlatefall }],
    ['opt3', close],
  ),
  [P.aboutSlatefall]: say(P.aboutSlatefall, ['opt1', { next: P.aboutSlatefallGuess }], ['opt2', toHub]),
  [P.aboutSlatefallGuess]: say(P.aboutSlatefallGuess, ['opt1', toHub]),

  // The Cold Forge
  [P.coldForgeOffer]: say(P.coldForgeOffer, ['opt1', startQuest], ['opt2', { next: P.coldForgeWhyTongs }], ['opt3', toHub]),
  [P.coldForgeWhyTongs]: say(P.coldForgeWhyTongs, ['opt1', startQuest], ['opt2', toHub]),
  [P.coldForgeProgressOne]: reminder(P.coldForgeProgressOne),
  [P.coldForgeProgressTwo]: reminder(P.coldForgeProgressTwo),
  [P.coldForgeTongs]: say(P.coldForgeTongs, ['opt1', { next: P.coldForgeChair }]),
  [P.coldForgeChair]: say(P.coldForgeChair, ['opt1', { next: P.coldForgeRecord }], ['opt2', { next: P.coldForgeRecord }]),
  [P.coldForgeRecord]: say(P.coldForgeRecord, ['opt1', toHub]),
  [P.coldForgeProgressThree]: reminder(P.coldForgeProgressThree),
  [P.coldForgeProgressFour]: reminder(P.coldForgeProgressFour),
  [P.coldForgePie]: say(P.coldForgePie, ['opt1', { next: P.coldForgeWood }]),
  [P.coldForgeWood]: say(P.coldForgeWood, ['opt1', toHub]),
  [P.coldForgeProgressFive]: reminder(P.coldForgeProgressFive),
  [P.coldForgeComplete]: say(P.coldForgeComplete, ['opt1', openForge], ['opt2', toHub]),

  // The hot Forge
  [P.aboutForgeRestored]: say(P.aboutForgeRestored, ['opt1', openForge], ['opt2', toHub]),
  [P.forgeWork]: say(P.forgeWork, ['opt1', { next: P.forgeJoin }], ['opt2', { next: P.forgeCost }], ['opt3', toHub]),
  [P.forgeJoin]: say(P.forgeJoin, ['opt1', { next: P.forgeMatch }], ['opt2', { next: P.forgeCost }], ['opt3', toHub]),
  [P.forgeMatch]: say(P.forgeMatch, ['opt1', { next: P.forgeCost }], ['opt2', toHub]),
  [P.forgeCost]: say(P.forgeCost, ['opt1', { next: P.forgeRisk }], ['opt2', { next: P.forgeLimits }], ['opt3', toHub]),
  [P.forgeRisk]: say(P.forgeRisk, ['opt1', { next: P.forgeLimits }], ['opt2', toHub]),
  [P.forgeLimits]: say(P.forgeLimits, ['opt1', toHub], ['opt2', openForge]),

  // Pie and home
  [P.aboutPie]: say(P.aboutPie, ['opt1', { next: P.aboutPieFirst }], ['opt2', toHub]),
  [P.aboutPieFirst]: say(P.aboutPieFirst, ['opt1', toHub]),
  [P.aboutHome]: say(P.aboutHome, ['opt1', { next: P.aboutHomeLife }], ['opt2', { next: P.aboutLeaving }], ['opt3', toHub]),
  [P.aboutHomeLife]: say(P.aboutHomeLife, ['opt1', { next: P.aboutLeaving }], ['opt2', { next: P.aboutTally }], ['opt3', toHub]),
  [P.aboutTally]: say(P.aboutTally, ['opt1', toHub]),
  [P.aboutLeaving]: say(P.aboutLeaving, ['opt1', { next: P.aboutHomeLife }], ['opt2', toHub]),

  // The thing he won't say
  [P.hearthPress]: say(P.hearthPress, ['opt1', { next: P.hearthPressArm }], ['opt2', toHub]),
  [P.hearthPressArm]: say(P.hearthPressArm, ['opt1', { next: P.hearthPressEnd }], ['opt2', toHub]),
  [P.hearthPressEnd]: say(P.hearthPressEnd, ['opt1', toHub]),

  // Idle
  [P.idleForge]: say(P.idleForge, ['opt1', { next: P.aboutPie }], ['opt2', toHub]),
  [P.idleHot]: say(P.idleHot, ['opt1', toHub], ['opt2', toHub]),
  [P.aboutTable]: say(P.aboutTable, ['opt1', toHub], ['opt2', close]),
}

export default LIROLD_PHURGO
