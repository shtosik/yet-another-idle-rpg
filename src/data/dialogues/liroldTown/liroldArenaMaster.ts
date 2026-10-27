import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ARENA } from '../../arena-data'

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
}

export type LiroldArenaMasterDialogueType = Record<ArenaMasterDialogue, DialogueNode<ArenaMasterDialogue>>

const NS = 'dialogues/liroldArenaMaster'
const metFlag = { type: 'flag', name: `met_${NpcID.liroldArenaMaster}` } as const

/** A champion's node: back to the list or to the hub. */
const champion = (id: ArenaMasterDialogue, key: string): DialogueNode<ArenaMasterDialogue> => ({
  id,
  messageKey: `${NS}:${key}.message`,
  options: [
    { responseKey: `${NS}:${key}.more`, results: [{ next: ArenaMasterDialogue.champions }] },
    { responseKey: `${NS}:${key}.thanks`, results: [{ next: ArenaMasterDialogue.default }] },
  ],
})

const LIROLD_ARENA_MASTER: LiroldArenaMasterDialogueType = {
  [ArenaMasterDialogue.intro1]: {
    id: ArenaMasterDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [{ next: ArenaMasterDialogue.rules, effects: [metFlag] }],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [{ next: ArenaMasterDialogue.default, closeDialogue: true, effects: [metFlag] }],
      },
    ],
  },

  [ArenaMasterDialogue.default]: {
    id: ArenaMasterDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.claim`,
        results: [
          {
            visibilityConditions: [{ type: 'arena', state: 'rewardsWaiting', hidden: true }],
            next: ArenaMasterDialogue.claimed,
            effects: [{ type: 'arena', action: 'claim' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.fight`,
        results: [
          {
            visibilityConditions: [{ type: 'arena', state: 'idle', hidden: true }],
            next: ArenaMasterDialogue.default,
            closeDialogue: true,
            effects: [
              { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: ARENA.entryFee }] },
              { type: 'arena', action: 'enter' },
            ],
          },
          // A run is already going on (the player walked back to town mid-fight).
          { next: ArenaMasterDialogue.running },
        ],
      },
      { responseKey: `${NS}:default.rules`, results: [{ next: ArenaMasterDialogue.rules }] },
      { responseKey: `${NS}:default.champions`, results: [{ next: ArenaMasterDialogue.champions }] },
      { responseKey: `${NS}:default.aboutArena`, results: [{ next: ArenaMasterDialogue.aboutArena }] },
      { responseKey: `${NS}:default.goodbye`, results: [{ next: ArenaMasterDialogue.default, closeDialogue: true }] },
    ],
  },

  [ArenaMasterDialogue.rules]: {
    id: ArenaMasterDialogue.rules,
    messageKey: `${NS}:rules.message`,
    options: [
      { responseKey: `${NS}:rules.champions`, results: [{ next: ArenaMasterDialogue.champions }] },
      { responseKey: `${NS}:rules.ok`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.champions]: {
    id: ArenaMasterDialogue.champions,
    messageKey: `${NS}:champions.message`,
    options: [
      { responseKey: `${NS}:champions.brute`, results: [{ next: ArenaMasterDialogue.aboutBrute }] },
      { responseKey: `${NS}:champions.arcanist`, results: [{ next: ArenaMasterDialogue.aboutArcanist }] },
      { responseKey: `${NS}:champions.burrower`, results: [{ next: ArenaMasterDialogue.aboutBurrower }] },
      { responseKey: `${NS}:champions.yad`, results: [{ next: ArenaMasterDialogue.aboutYad }] },
      { responseKey: `${NS}:champions.enough`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.aboutBrute]: champion(ArenaMasterDialogue.aboutBrute, 'aboutBrute'),
  [ArenaMasterDialogue.aboutArcanist]: champion(ArenaMasterDialogue.aboutArcanist, 'aboutArcanist'),
  [ArenaMasterDialogue.aboutBurrower]: champion(ArenaMasterDialogue.aboutBurrower, 'aboutBurrower'),

  [ArenaMasterDialogue.aboutYad]: {
    id: ArenaMasterDialogue.aboutYad,
    messageKey: `${NS}:aboutYad.message`,
    options: [
      { responseKey: `${NS}:aboutYad.origin`, results: [{ next: ArenaMasterDialogue.yadOrigin }] },
      { responseKey: `${NS}:aboutYad.more`, results: [{ next: ArenaMasterDialogue.champions }] },
      { responseKey: `${NS}:aboutYad.thanks`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.yadOrigin]: champion(ArenaMasterDialogue.yadOrigin, 'yadOrigin'),

  [ArenaMasterDialogue.aboutArena]: {
    id: ArenaMasterDialogue.aboutArena,
    messageKey: `${NS}:aboutArena.message`,
    options: [
      { responseKey: `${NS}:aboutArena.aboutLudo`, results: [{ next: ArenaMasterDialogue.aboutLudo }] },
      { responseKey: `${NS}:aboutArena.ok`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.aboutLudo]: {
    id: ArenaMasterDialogue.aboutLudo,
    messageKey: `${NS}:aboutLudo.message`,
    options: [
      { responseKey: `${NS}:aboutLudo.ok`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.claimed]: {
    id: ArenaMasterDialogue.claimed,
    messageKey: `${NS}:claimed.message`,
    options: [
      { responseKey: `${NS}:claimed.ok`, results: [{ next: ArenaMasterDialogue.default }] },
    ],
  },

  [ArenaMasterDialogue.running]: {
    id: ArenaMasterDialogue.running,
    messageKey: `${NS}:running.message`,
    options: [
      { responseKey: `${NS}:running.ok`, results: [{ next: ArenaMasterDialogue.default, closeDialogue: true }] },
    ],
  },
}

export default LIROLD_ARENA_MASTER
