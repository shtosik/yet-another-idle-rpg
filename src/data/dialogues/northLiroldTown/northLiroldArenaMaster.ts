import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ARENA } from '../../arena-data'

export enum ArenaMasterDialogue {
  default = 0,
  intro1,
  rules,
  advice,
  running,
}

export type NorthLiroldArenaMasterDialogueType = Record<ArenaMasterDialogue, DialogueNode<ArenaMasterDialogue>>

const NS = 'dialogues/northLiroldArenaMaster'

const NORTH_LIROLD_ARENA_MASTER: NorthLiroldArenaMasterDialogueType = {
  [ArenaMasterDialogue.intro1]: {
    id: ArenaMasterDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          {
            next: ArenaMasterDialogue.rules,
            effects: [{ type: 'flag', name: `met_${NpcID.northLiroldArenaMaster}` }],
          },
        ],
      },
    ],
  },

  [ArenaMasterDialogue.default]: {
    id: ArenaMasterDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
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
      {
        responseKey: `${NS}:default.claim`,
        results: [
          {
            visibilityConditions: [{ type: 'arena', state: 'rewardsWaiting', hidden: true }],
            next: ArenaMasterDialogue.default,
            effects: [{ type: 'arena', action: 'claim' }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.rules`,
        results: [{ next: ArenaMasterDialogue.rules }],
      },
      {
        responseKey: `${NS}:default.advice`,
        results: [{ next: ArenaMasterDialogue.advice }],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: ArenaMasterDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [ArenaMasterDialogue.rules]: {
    id: ArenaMasterDialogue.rules,
    messageKey: `${NS}:rules.message`,
    options: [
      {
        responseKey: `${NS}:rules.opt1`,
        results: [{ next: ArenaMasterDialogue.default }],
      },
    ],
  },

  [ArenaMasterDialogue.advice]: {
    id: ArenaMasterDialogue.advice,
    messageKey: `${NS}:advice.message`,
    options: [
      {
        responseKey: `${NS}:advice.opt1`,
        results: [{ next: ArenaMasterDialogue.default }],
      },
    ],
  },

  [ArenaMasterDialogue.running]: {
    id: ArenaMasterDialogue.running,
    messageKey: `${NS}:running.message`,
    options: [
      {
        responseKey: `${NS}:running.opt1`,
        results: [{ next: ArenaMasterDialogue.default, closeDialogue: true }],
      },
    ],
  },
}

export default NORTH_LIROLD_ARENA_MASTER
