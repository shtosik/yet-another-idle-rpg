import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { NpcID } from '../../../enums/map/npc-id.enum'
import { ShopID } from '../../../enums/ids/shop-id.enum'

export enum ElarionDialogue {
  default = 0,
  intro1,
  aboutElarion,
  aboutMagic,
  aboutRunes,
  aboutSpellbook,
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
}

export default MAWOOD_ELARION
