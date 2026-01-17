import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'

export enum ElaraDialogue {
  default,
  apology,
  fatherIntro,
  captainInfo,
  pirateInfo,
  treasureInfo,
  permitInfo,
  richnessInfo,
  hiddenJewelsInfo,
  rumorSceptre,
  primulaInfo,
  fairytaleInfo,
  fatherPersonality,
  villagersOpinion,
  marvinInfo,
  marvinLocation,
  villagesComment
}

export type LaHarparElaraDialogueType = Record<ElaraDialogue, DialogueNode<ElaraDialogue>>

const NS = 'dialogues/laHarparElara'

const LA_HARPAR_ELARA: LaHarparElaraDialogueType = {
  [ElaraDialogue.default]: {
    id: ElaraDialogue.default,
    messageKey: `${NS}:greeting.message`,
    options: [
      {
        responseKey: `${NS}:greeting.opt1`,
        results: [{ next: ElaraDialogue.apology }],
      },
      {
        responseKey: `${NS}:greeting.opt2`,
        results: [{ next: ElaraDialogue.apology }],
      },
      {
        responseKey: `${NS}:greeting.opt3`,
        results: [{ next: ElaraDialogue.default, closeDialogue: true }],
      },
    ],
  },
  [ElaraDialogue.apology]: {
    id: ElaraDialogue.apology,
    messageKey: `${NS}:apology.message`,
    options: [
      {
        responseKey: `${NS}:apology.opt1`,
        results: [{ next: ElaraDialogue.fatherIntro }],
      },
      {
        responseKey: `${NS}:apology.opt2`,
        results: [{ next: ElaraDialogue.villagersOpinion }],
      },
    ],
  },
  [ElaraDialogue.fatherIntro]: {
    id: ElaraDialogue.fatherIntro,
    messageKey: `${NS}:fatherIntro.message`,
    options: [
      { responseKey: `${NS}:fatherIntro.opt1`, results: [{ next: ElaraDialogue.captainInfo }] },
      { responseKey: `${NS}:fatherIntro.opt2`, results: [{ next: ElaraDialogue.treasureInfo }] },
      { responseKey: `${NS}:fatherIntro.opt3`, results: [{ next: ElaraDialogue.rumorSceptre }] },
    ],
  },
  [ElaraDialogue.captainInfo]: {
    id: ElaraDialogue.captainInfo,
    messageKey: `${NS}:captainInfo.message`,
    options: [
      { responseKey: `${NS}:captainInfo.opt1`, results: [{ next: ElaraDialogue.pirateInfo }] },
      { responseKey: `${NS}:captainInfo.opt2`, results: [{ next: ElaraDialogue.treasureInfo }] },
    ],
  },
  [ElaraDialogue.pirateInfo]: {
    id: ElaraDialogue.pirateInfo,
    messageKey: `${NS}:pirateInfo.message`,
    options: [
      {
        responseKey: `${NS}:pirateInfo.opt1`,
        results: [
          {
            next: ElaraDialogue.apology,
            closeDialogue: true,
            effects: [{ type: 'quest', action: 'start', questId: QuestID.aTaleOfACaptain }],
          },
        ],
      },
      {
        responseKey: `${NS}:pirateInfo.opt2`,
        results: [{ next: ElaraDialogue.apology, closeDialogue: true }],
      },
    ],
  },
  [ElaraDialogue.treasureInfo]: {
    id: ElaraDialogue.treasureInfo,
    messageKey: `${NS}:treasureInfo.message`,
    options: [
      { responseKey: `${NS}:treasureInfo.opt1`, results: [{ next: ElaraDialogue.permitInfo }] },
      { responseKey: `${NS}:treasureInfo.opt2`, results: [{ next: ElaraDialogue.richnessInfo }] },
    ],
  },
  [ElaraDialogue.permitInfo]: {
    id: ElaraDialogue.permitInfo,
    messageKey: `${NS}:permitInfo.message`,
    options: [
      { responseKey: `${NS}:permitInfo.opt1`, results: [{ next: ElaraDialogue.apology }] },
    ],
  },
  [ElaraDialogue.richnessInfo]: {
    id: ElaraDialogue.richnessInfo,
    messageKey: `${NS}:richnessInfo.message`,
    options: [
      { responseKey: `${NS}:richnessInfo.opt1`, results: [{ next: ElaraDialogue.hiddenJewelsInfo }] },
    ],
  },
  [ElaraDialogue.hiddenJewelsInfo]: {
    id: ElaraDialogue.hiddenJewelsInfo,
    messageKey: `${NS}:hiddenJewelsInfo.message`,
    options: [
      { responseKey: `${NS}:hiddenJewelsInfo.opt1`, results: [{ next: ElaraDialogue.apology }] },
    ],
  },
  [ElaraDialogue.rumorSceptre]: {
    id: ElaraDialogue.rumorSceptre,
    messageKey: `${NS}:rumorSceptre.message`,
    options: [
      { responseKey: `${NS}:rumorSceptre.opt1`, results: [{ next: ElaraDialogue.primulaInfo }] },
    ],
  },
  [ElaraDialogue.primulaInfo]: {
    id: ElaraDialogue.primulaInfo,
    messageKey: `${NS}:primulaInfo.message`,
    options: [
      { responseKey: `${NS}:primulaInfo.opt1`, results: [{ next: ElaraDialogue.fairytaleInfo }] },
      { responseKey: `${NS}:primulaInfo.opt2`, results: [{ next: ElaraDialogue.fatherPersonality }] },
    ],
  },
  [ElaraDialogue.fairytaleInfo]: {
    id: ElaraDialogue.fairytaleInfo,
    messageKey: `${NS}:fairytaleInfo.message`,
    options: [
      { responseKey: `${NS}:fairytaleInfo.opt1`, results: [{ next: ElaraDialogue.apology }] },
    ],
  },
  [ElaraDialogue.fatherPersonality]: {
    id: ElaraDialogue.fatherPersonality,
    messageKey: `${NS}:fatherPersonality.message`,
    options: [
      { responseKey: `${NS}:fatherPersonality.opt1`, results: [{ next: ElaraDialogue.apology }] },
    ],
  },
  [ElaraDialogue.villagersOpinion]: {
    id: ElaraDialogue.villagersOpinion,
    messageKey: `${NS}:villagersOpinion.message`,
    options: [
      { responseKey: `${NS}:villagersOpinion.opt1`, results: [{ next: ElaraDialogue.marvinInfo }] },
      { responseKey: `${NS}:villagersOpinion.opt2`, results: [{ next: ElaraDialogue.villagesComment }] },
    ],
  },
  [ElaraDialogue.marvinInfo]: {
    id: ElaraDialogue.marvinInfo,
    messageKey: `${NS}:marvinInfo.message`,
    options: [
      { responseKey: `${NS}:marvinInfo.opt1`, results: [{ next: ElaraDialogue.marvinLocation }] },
    ],
  },
  [ElaraDialogue.marvinLocation]: {
    id: ElaraDialogue.marvinLocation,
    messageKey: `${NS}:marvinLocation.message`,
    options: [
      {
        responseKey: `${NS}:marvinLocation.opt1`,
        results: [{ next: ElaraDialogue.apology, closeDialogue: true }],
      },
    ],
  },
  [ElaraDialogue.villagesComment]: {
    id: ElaraDialogue.villagesComment,
    messageKey: `${NS}:villagersComment.message`,
    options: [
      { responseKey: `${NS}:villagersComment.opt1`, results: [{ next: ElaraDialogue.apology }] },
    ],
  },
}

export default LA_HARPAR_ELARA
