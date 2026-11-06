import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { ShopID } from '../../../enums/ids/shop-id.enum'

// Stub: only the shop. The full tree (intro, quest hub, orders, pet) comes with C10.
export enum WardenDialogue {
  default = 0,
}

export type FarmWardenDialogueType = Record<WardenDialogue, DialogueNode<WardenDialogue>>

const NS = 'dialogues/farmWarden'

const FARM_WARDEN: FarmWardenDialogueType = {
  [WardenDialogue.default]: {
    id: WardenDialogue.default,
    messageKey: `${NS}:default.message`,
    options: [
      {
        responseKey: `${NS}:default.shop`,
        results: [{ next: WardenDialogue.default, effects: [{ type: 'shop', shopId: ShopID.farmWardenShop }] }],
      },
      { responseKey: `${NS}:default.bye`, results: [{ closeDialogue: true }] },
    ],
  },
}

export default FARM_WARDEN
