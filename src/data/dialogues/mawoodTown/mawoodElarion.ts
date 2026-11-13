import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'

export enum ElarionDialogue {
  default = 0,
  intro1,
  aboutElarion,
  aboutMagic,
  aboutRunes,
  aboutSpellbook,
  sameWinterElarion,
  sameWinterElarionTrunk,
  sameWinterElarionNotes,
  sameWinterElarionMilo,
}

export type MawoodElarionDialogueType = Record<ElarionDialogue, DialogueNode<ElarionDialogue>>

const NS = 'dialogues/mawoodElarion'

const MAWOOD_ELARION: MawoodElarionDialogueType = {
  [ElarionDialogue.intro1]: {
    id: ElarionDialogue.intro1,
    messageKey: `${NS}:intro1.message`,
    options: [
      {
        responseKey: `${NS}:intro1.opt1`,
        results: [
          {
            next: ElarionDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodElarion}` }],
          },
        ],
      },
      {
        responseKey: `${NS}:intro1.opt2`,
        results: [
          {
            next: ElarionDialogue.default,
            effects: [{ type: 'flag', name: `met_${NpcID.mawoodElarion}` }],
          },
        ],
      },
    ],
  },

  [ElarionDialogue.default]: {
    id: ElarionDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.sameWinterElarionNotes`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theSameWinter, questState: QuestState.readyToAdvance, step: 2 }],
          next: ElarionDialogue.sameWinterElarionNotes,
          effects: [{ type: 'quest', questId: QuestID.theSameWinter, action: 'advance' }],
        }],
      },
      {
        responseKey: `${NS}:default.sameWinterElarion`,
        results: [{
          visibilityConditions: [{ type: 'quest', questId: QuestID.theSameWinter, questState: QuestState.active, step: 2 }, { type: 'quest', questId: QuestID.theSameWinter, questState: QuestState.readyToAdvance, step: 2, not: true }],
          next: ElarionDialogue.sameWinterElarion,
        }],
      },
      {
        responseKey: `${NS}:default.aboutElarion`,
        results: [{ next: ElarionDialogue.aboutElarion }],
      },
      {
        responseKey: `${NS}:default.aboutMagic`,
        results: [{ next: ElarionDialogue.aboutMagic }],
      },
      {
        responseKey: `${NS}:default.browseWares`,
        results: [
          {
            next: ElarionDialogue.default,
            effects: [{ type: 'shop', shopId: ShopID.mawoodMagicShop }],
          },
        ],
      },
      {
        responseKey: `${NS}:default.goodbye`,
        results: [{ next: ElarionDialogue.default, closeDialogue: true }],
      },
    ],
  },

  [ElarionDialogue.aboutElarion]: {
    id: ElarionDialogue.aboutElarion,
    messageKey: `${NS}:aboutElarion.message`,
    options: [
      {
        responseKey: `${NS}:aboutElarion.opt1`,
        results: [{ next: ElarionDialogue.aboutRunes }],
      },
      {
        responseKey: `${NS}:aboutElarion.opt2`,
        results: [{ next: ElarionDialogue.aboutSpellbook }],
      },
    ],
  },

  [ElarionDialogue.aboutMagic]: {
    id: ElarionDialogue.aboutMagic,
    messageKey: `${NS}:aboutMagic.message`,
    options: [
      {
        responseKey: `${NS}:aboutMagic.opt1`,
        results: [{ next: ElarionDialogue.default }],
      },
    ],
  },

  [ElarionDialogue.aboutRunes]: {
    id: ElarionDialogue.aboutRunes,
    messageKey: `${NS}:aboutRunes.message`,
    options: [
      {
        responseKey: `${NS}:aboutRunes.opt1`,
        results: [{ next: ElarionDialogue.default }],
      },
    ],
  },

  [ElarionDialogue.aboutSpellbook]: {
    id: ElarionDialogue.aboutSpellbook,
    messageKey: `${NS}:aboutSpellbook.message`,
    options: [
      {
        responseKey: `${NS}:aboutSpellbook.opt1`,
        results: [{ next: ElarionDialogue.default }],
      },
    ],
  },
  [ElarionDialogue.sameWinterElarion]: {
    id: ElarionDialogue.sameWinterElarion,
    messageKey: `${NS}:sameWinterElarion.message`,
    options: [
      { responseKey: `${NS}:sameWinterElarion.opt1`, results: [{ next: ElarionDialogue.sameWinterElarionTrunk }] },
      { responseKey: `${NS}:sameWinterElarion.opt2`, results: [{ next: ElarionDialogue.default }] },
    ],
  },
  [ElarionDialogue.sameWinterElarionTrunk]: {
    id: ElarionDialogue.sameWinterElarionTrunk,
    messageKey: `${NS}:sameWinterElarionTrunk.message`,
    options: [
      { responseKey: `${NS}:sameWinterElarionTrunk.opt1`, results: [{ next: ElarionDialogue.default }] },
    ],
  },
  [ElarionDialogue.sameWinterElarionNotes]: {
    id: ElarionDialogue.sameWinterElarionNotes,
    messageKey: `${NS}:sameWinterElarionNotes.message`,
    options: [
      { responseKey: `${NS}:sameWinterElarionNotes.opt1`, results: [{ next: ElarionDialogue.sameWinterElarionMilo }] },
      { responseKey: `${NS}:sameWinterElarionNotes.opt2`, results: [{ next: ElarionDialogue.default }] },
    ],
  },
  [ElarionDialogue.sameWinterElarionMilo]: {
    id: ElarionDialogue.sameWinterElarionMilo,
    messageKey: `${NS}:sameWinterElarionMilo.message`,
    options: [
      { responseKey: `${NS}:sameWinterElarionMilo.opt1`, results: [{ next: ElarionDialogue.default }] },
    ],
  },
}

export default MAWOOD_ELARION
