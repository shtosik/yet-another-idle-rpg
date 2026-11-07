import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { DialogueResult } from '../../../interfaces/dialogues/dialogue-option.type'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../../types/dialogues/dialogue-effect.type'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ARENA } from '../../arena-data'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { dialogueNodes } from '../dialogue-nodes'

// Character and voice: docs/character/lirold/ludo-crane.md. Text: dialogues/liroldArenaMaster.json.
export enum ArenaMasterDialogue {
  default = 0,
  intro1,
  rules,
  champions,
  aboutBrute,
  aboutArcanist,
  aboutBurrower,
  aboutYad,
  yadOrigin,
  aboutArena,
  aboutLudo,
  claimed,
  running,
  cooldown,
  coldForgeLead,
  pathfindersSealInfo,
  introName,
  rulesBouts,
  rulesSand,
  rulesPurse,
  yadFeed,
  aboutLudoCart,
  aboutLudoGate,
  kneeTalk,
  kneeThanks,
  kneeBetter,
  kneeHome,
  kneeName,
  gateTalk,
  gateTalkQuiet,
  firstBlood,
  yadFelled,
  yadFelledAsk,
  coldForgeCart,
  idleBusiness,
  idleCrowd,
}

export type LiroldArenaMasterDialogueType = Record<ArenaMasterDialogue, DialogueNode<ArenaMasterDialogue>>

const A = ArenaMasterDialogue
const say = dialogueNodes<ArenaMasterDialogue>('dialogues/liroldArenaMaster', ArenaMasterDialogue)

const TOLD_CART_FLAG = 'ludo_told_cart'
const SAW_BRUTE_FLAG = 'ludo_saw_brute'
const SAW_YAD_FALL_FLAG = 'ludo_saw_yad_fall'
const KNEE_WRAP_FLAG = 'ludo_knee_wrap'
const KNEE_TALKED_FLAG = 'ludo_knee_talked'
const KNEE_SILK = [{ itemId: ItemID.spiderSilk, amount: 10 }]

const metFlag = { type: 'flag', name: `met_${NpcID.liroldArenaMaster}` } as const
const flag = (name: string, isSet = true): DialogueCondition => ({ type: 'flag', name, isSet })
const setFlag = (name: string): DialogueEffect => ({ type: 'flag', name })
const killed = (enemyId: EnemyID): DialogueCondition => ({ type: 'killCount', enemyId, amount: 1 })

type Result = DialogueResult<ArenaMasterDialogue>
const toHub: Result = { next: A.default }
const close: Result = { closeDialogue: true }
const toCard: Result = { next: A.champions }

/** A champion's node: back to the list or to the hub. */
const champion = (id: ArenaMasterDialogue) => say(id, ['opt1', toCard], ['opt2', toHub])

const LIROLD_ARENA_MASTER: LiroldArenaMasterDialogueType = {
  [A.intro1]: say(A.intro1,
    ['opt1', { next: A.introName, effects: [metFlag] }],
    ['opt2', { next: A.rules, effects: [metFlag] }],
    ['opt3', { next: A.default, closeDialogue: true, effects: [metFlag] }],
  ),
  [A.introName]: say(A.introName, ['opt1', { next: A.rules }], ['opt2', toHub], ['opt3', close]),

  [A.default]: say(A.default,
    ['coldForge', {
      visibilityConditions: [{ type: 'quest', questId: QuestID.theColdForge, questState: QuestState.readyToAdvance, step: 1 }],
      next: A.coldForgeLead,
      effects: [{ type: 'quest', questId: QuestID.theColdForge, action: 'advance' }],
    }],
    ['opt2', { visibilityConditions: [killed(EnemyID.arenaYad), flag(SAW_YAD_FALL_FLAG, false)], next: A.yadFelled, effects: [setFlag(SAW_YAD_FALL_FLAG)] }],
    ['opt3', { visibilityConditions: [killed(EnemyID.arenaBrute), { ...killed(EnemyID.arenaYad), not: true }, flag(SAW_BRUTE_FLAG, false)], next: A.firstBlood, effects: [setFlag(SAW_BRUTE_FLAG)] }],
    ['opt4', { visibilityConditions: [{ type: 'arena', state: 'rewardsWaiting', hidden: true }], next: A.claimed, effects: [{ type: 'arena', action: 'claim' }] }],
    [
      'opt5',
      {
        visibilityConditions: [{ type: 'arena', state: 'ready', hidden: true }],
        next: A.default,
        closeDialogue: true,
        effects: [
          { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: ARENA.entryFee }] },
          { type: 'arena', action: 'enter' },
        ],
      },
      // A run is already going on (the player walked back to town mid-fight).
      { visibilityConditions: [{ type: 'arena', state: 'running', hidden: true }], next: A.running },
      // The 30-minute entry cooldown.
      { next: A.cooldown },
    ],
    ['opt6', { next: A.rules }],
    ['opt7', toCard],
    ['opt8', { next: A.aboutArena }],
    ['opt9', { next: A.idleBusiness }],
    ['opt10', { visibilityConditions: [flag(TOLD_CART_FLAG), killed(EnemyID.arenaBrute)], next: A.gateTalk }],
    ['opt11', { visibilityConditions: [flag(TOLD_CART_FLAG), flag(KNEE_WRAP_FLAG, false)], next: A.kneeTalk }],
    ['opt12', { visibilityConditions: [flag(KNEE_WRAP_FLAG), flag(KNEE_TALKED_FLAG, false)], next: A.kneeBetter }],
    ['pathfindersSeal', {
      visibilityConditions: [
        { type: 'item', itemId: ItemID.pathfindersSeal, amount: 1 },
        { type: 'stat', stat: 'upgradedDropChance', comparison: 'lte', amount: 0, hidden: true },
      ],
      next: A.pathfindersSealInfo,
    }],
    ['opt14', { next: A.default, closeDialogue: true }],
  ),

  // The rules
  [A.rules]: say(A.rules, ['opt1', { next: A.rulesBouts }], ['opt2', toCard], ['opt3', toHub]),
  [A.rulesBouts]: say(A.rulesBouts, ['opt1', { next: A.rulesSand }], ['opt2', { next: A.rulesPurse }], ['opt3', toCard]),
  [A.rulesSand]: say(A.rulesSand, ['opt1', { next: A.rulesPurse }], ['opt2', toHub]),
  [A.rulesPurse]: say(A.rulesPurse, ['opt1', toCard], ['opt2', toHub]),

  // The card
  [A.champions]: say(A.champions, ['opt1', { next: A.aboutBrute }], ['opt2', { next: A.aboutArcanist }], ['opt3', { next: A.aboutBurrower }], ['opt4', { next: A.aboutYad }], ['opt5', toHub]),
  [A.aboutBrute]: champion(A.aboutBrute),
  [A.aboutArcanist]: champion(A.aboutArcanist),
  [A.aboutBurrower]: champion(A.aboutBurrower),
  [A.aboutYad]: say(A.aboutYad, ['opt1', { next: A.yadOrigin }], ['opt2', { next: A.yadFeed }], ['opt3', toCard], ['opt4', toHub]),
  [A.yadOrigin]: champion(A.yadOrigin),
  [A.yadFeed]: champion(A.yadFeed),

  // The Arena and the man
  [A.aboutArena]: say(A.aboutArena, ['opt1', { next: A.aboutLudo }], ['opt2', toHub]),
  [A.aboutLudo]: say(A.aboutLudo, ['opt1', { next: A.aboutLudoCart }], ['opt2', { next: A.aboutLudoCart }], ['opt3', toHub]),
  [A.aboutLudoCart]: say(A.aboutLudoCart, ['opt1', { next: A.aboutLudoGate, effects: [setFlag(TOLD_CART_FLAG)] }], ['opt2', toHub]),
  [A.aboutLudoGate]: say(A.aboutLudoGate, ['opt1', { next: A.kneeTalk }], ['opt2', toHub]),

  // The knee
  [A.kneeTalk]: say(A.kneeTalk,
    ['opt1', {
      visibilityConditions: [flag(KNEE_WRAP_FLAG, false)],
      requirementsNeeded: [{ type: 'item', itemId: ItemID.spiderSilk, amount: 10 }],
      next: A.kneeThanks,
      effects: [{ type: 'item', action: 'take', items: KNEE_SILK }, setFlag(KNEE_WRAP_FLAG)],
    }],
    ['opt2', toHub],
  ),
  [A.kneeThanks]: say(A.kneeThanks, ['opt1', toHub]),
  [A.kneeBetter]: say(A.kneeBetter,
    ['opt1', { next: A.kneeHome, effects: [setFlag(KNEE_TALKED_FLAG)] }],
    ['opt2', { next: A.kneeHome, effects: [setFlag(KNEE_TALKED_FLAG)] }],
  ),
  [A.kneeHome]: say(A.kneeHome, ['opt1', { next: A.kneeName }], ['opt2', { next: A.kneeName }]),
  [A.kneeName]: say(A.kneeName, ['opt1', toHub]),

  // Watching from the gate
  [A.gateTalk]: say(A.gateTalk, ['opt1', { next: A.gateTalkQuiet }], ['opt2', toHub]),
  [A.gateTalkQuiet]: say(A.gateTalkQuiet, ['opt1', toHub]),
  [A.firstBlood]: say(A.firstBlood, ['opt1', toHub], ['opt2', toHub]),
  [A.yadFelled]: say(A.yadFelled, ['opt1', { next: A.yadFelledAsk }], ['opt2', toHub]),
  [A.yadFelledAsk]: say(A.yadFelledAsk, ['opt1', toHub]),

  // Gate business
  [A.claimed]: say(A.claimed, ['opt1', toHub]),
  [A.running]: say(A.running, ['opt1', { next: A.default, closeDialogue: true }]),
  [A.cooldown]: say(A.cooldown, ['opt1', toHub]),
  [A.coldForgeLead]: say(A.coldForgeLead, ['opt1', { next: A.coldForgeCart }], ['opt2', { next: A.coldForgeCart }]),
  [A.coldForgeCart]: say(A.coldForgeCart, ['opt1', toHub]),
  [A.pathfindersSealInfo]: say(A.pathfindersSealInfo, ['opt1', toHub]),

  // Idle
  [A.idleBusiness]: say(A.idleBusiness, ['opt1', { next: A.idleCrowd }], ['opt2', toHub]),
  [A.idleCrowd]: say(A.idleCrowd, ['opt1', toHub]),
}

export default LIROLD_ARENA_MASTER
