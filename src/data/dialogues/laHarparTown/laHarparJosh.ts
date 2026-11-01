import { NpcID } from '../../../enums/map/npc-id.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { QuestState } from '../../../enums/quest-state.enum'
import { DialogueCondition } from '../../../types/dialogues/dialogue-condition.type'
import { TownID } from '../../../enums/map/town-id.enum'
import { ReputationTier } from '../../../enums/reputation-tier.enum'

export enum JoshDialogue {
  default,
  payBeer,
  talkReady,
  intro,
  placeInfo,
  workInfo,
  warning,
  beachName,
  tradeInfo,
  regionsInfo,
  unknownRegions,
  dangerMountain,
  mountainRumors,
  missionCheck,
  talkFree,
  aboutHeirloom,
  aboutHeirloomWho,
}

export type LaHarparJoshDialogueType = Record<JoshDialogue, DialogueNode<JoshDialogue>>

const NS = 'dialogues/laHarparJosh'
const PAID_BEER_FLAG = 'josh_paid_beer'
const LA_HARPAR_FRIENDLY: DialogueCondition = { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.friendly, hidden: true }
const LA_HARPAR_REVERED: DialogueCondition = { type: 'reputation', townId: TownID.laHarpar, tier: ReputationTier.revered, hidden: true }

const LA_HARPAR_JOSH: LaHarparJoshDialogueType = {
  [JoshDialogue.default]: {
    id: JoshDialogue.default,
    messageKey: `${NS}:greeting.message`,
    options: [
      {
        responseKey: `${NS}:greeting.opt1`,
        // One beer buys his company for good; La Harpar Friendly skips it.
        results: [
          { visibilityConditions: [{ type: 'flag', name: PAID_BEER_FLAG, isSet: true }], next: JoshDialogue.talkReady },
          { visibilityConditions: [LA_HARPAR_FRIENDLY], next: JoshDialogue.talkFree, effects: [{ type: 'flag', name: PAID_BEER_FLAG }] },
          { next: JoshDialogue.payBeer },
        ],
      },
      {
        responseKey: `${NS}:greeting.opt2`,
        results: [{ next: JoshDialogue.default, closeDialogue: true }],
      },
    ],
  },
  [JoshDialogue.payBeer]: {
    id: JoshDialogue.payBeer,
    messageKey: `${NS}:payBeer.message`,
    options: [
      {
        responseKey: `${NS}:payBeer.opt1`,
        results: [
          {
            next: JoshDialogue.talkReady,
            effects: [
              { type: 'stat', action: 'deduct', stats: [{ stat: 'goldCoins', amount: 20 }] },
              { type: 'flag', name: PAID_BEER_FLAG },
            ],
          },
        ],
      },
      {
        responseKey: `${NS}:payBeer.opt2`,
        results: [{ next: JoshDialogue.default, closeDialogue: true }],
      },
    ],
  },
  [JoshDialogue.talkReady]: {
    id: JoshDialogue.talkReady,
    messageKey: `${NS}:talkReady.message`,
    options: [
      {
        responseKey: `${NS}:talkReady.opt1`,
        results: [
          {
            visibilityConditions: [
              {
                type: 'quest',
                questId: QuestID.clearingOutTheBeach,
                questState: QuestState.readyToAdvance,
                step: 1,
              },
            ],
            next: JoshDialogue.talkReady,
            effects: [{ type: 'quest', questId: QuestID.clearingOutTheBeach, action: 'advance' }],
          },
        ],
      },
      { responseKey: `${NS}:talkReady.opt2`, results: [{ next: JoshDialogue.intro }] },
      { responseKey: `${NS}:talkReady.opt3`, results: [{ next: JoshDialogue.placeInfo }] },
      {
        responseKey: `${NS}:talkReady.opt4`,
        results: [
          {
            visibilityConditions: [{ type: 'quest', questId: QuestID.clearingOutTheBeach, questState: QuestState.completed }],
            next: JoshDialogue.missionCheck,
          },
          { next: JoshDialogue.workInfo },
        ],
      },
      {
        responseKey: 'quests:reputation.turnInOne',
        results: [{ next: JoshDialogue.talkReady, effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparJosh, bundles: 'one' }] }],
      },
      {
        responseKey: 'quests:reputation.turnInAll',
        results: [{ next: JoshDialogue.talkReady, effects: [{ type: 'reputationTurnIn', npcId: NpcID.laHarparJosh, bundles: 'all' }] }],
      },
      {
        responseKey: `${NS}:talkReady.opt6`,
        results: [
          {
            visibilityConditions: [
              LA_HARPAR_REVERED,
              { type: 'quest', questId: QuestID.clearingOutTheBeach, questState: QuestState.completed },
            ],
            next: JoshDialogue.aboutHeirloom,
          },
        ],
      },
      { responseKey: `${NS}:talkReady.opt5`, results: [{ next: JoshDialogue.talkReady, closeDialogue: true }] },
    ],
  },
  [JoshDialogue.talkFree]: {
    id: JoshDialogue.talkFree,
    messageKey: `${NS}:talkFree.message`,
    options: [
      { responseKey: `${NS}:talkFree.opt1`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.aboutHeirloom]: {
    id: JoshDialogue.aboutHeirloom,
    messageKey: `${NS}:aboutHeirloom.message`,
    options: [
      { responseKey: `${NS}:aboutHeirloom.opt1`, results: [{ next: JoshDialogue.talkReady }] },
      { responseKey: `${NS}:aboutHeirloom.opt2`, results: [{ next: JoshDialogue.aboutHeirloomWho }] },
    ],
  },
  [JoshDialogue.aboutHeirloomWho]: {
    id: JoshDialogue.aboutHeirloomWho,
    messageKey: `${NS}:aboutHeirloomWho.message`,
    options: [
      { responseKey: `${NS}:aboutHeirloomWho.opt1`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.intro]: {
    id: JoshDialogue.intro,
    messageKey: `${NS}:intro.message`,
    options: [
      { responseKey: `${NS}:intro.opt1`, results: [{ next: JoshDialogue.warning }] },
      { responseKey: `${NS}:intro.opt2`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.placeInfo]: {
    id: JoshDialogue.placeInfo,
    messageKey: `${NS}:placeInfo.message`,
    options: [
      { responseKey: `${NS}:placeInfo.opt1`, results: [{ next: JoshDialogue.beachName }] },
      { responseKey: `${NS}:placeInfo.opt2`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.workInfo]: {
    id: JoshDialogue.workInfo,
    messageKey: `${NS}:workInfo.message`,
    options: [
      {
        responseKey: `${NS}:workInfo.opt1`,
        results: [
          {
            next: JoshDialogue.talkReady,
            effects: [{ type: 'quest', questId: QuestID.clearingOutTheBeach, action: 'start' }],
          },
          // Already on it: workInfo doubles as the in-progress reminder
          { next: JoshDialogue.talkReady },
        ],
      },
    ],
  },
  [JoshDialogue.warning]: {
    id: JoshDialogue.warning,
    messageKey: `${NS}:warning.message`,
    options: [
      { responseKey: `${NS}:warning.opt1`, results: [{ next: JoshDialogue.talkReady }] },
      { responseKey: `${NS}:warning.opt2`, results: [{ next: JoshDialogue.talkReady, closeDialogue: true }] },
    ],
  },
  [JoshDialogue.beachName]: {
    id: JoshDialogue.beachName,
    messageKey: `${NS}:beachName.message`,
    options: [
      { responseKey: `${NS}:beachName.opt1`, results: [{ next: JoshDialogue.tradeInfo }] },
      { responseKey: `${NS}:beachName.opt2`, results: [{ next: JoshDialogue.regionsInfo }] },
    ],
  },
  [JoshDialogue.tradeInfo]: {
    id: JoshDialogue.tradeInfo,
    messageKey: `${NS}:tradeInfo.message`,
    options: [
      { responseKey: `${NS}:tradeInfo.opt1`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.regionsInfo]: {
    id: JoshDialogue.regionsInfo,
    messageKey: `${NS}:regionsInfo.message`,
    options: [
      { responseKey: `${NS}:regionsInfo.opt1`, results: [{ next: JoshDialogue.unknownRegions }] },
    ],
  },
  [JoshDialogue.unknownRegions]: {
    id: JoshDialogue.unknownRegions,
    messageKey: `${NS}:unknownRegions.message`,
    options: [
      { responseKey: `${NS}:unknownRegions.opt1`, results: [{ next: JoshDialogue.dangerMountain }] },
    ],
  },
  [JoshDialogue.dangerMountain]: {
    id: JoshDialogue.dangerMountain,
    messageKey: `${NS}:dangerMountain.message`,
    options: [
      { responseKey: `${NS}:dangerMountain.opt1`, results: [{ next: JoshDialogue.mountainRumors }] },
    ],
  },
  [JoshDialogue.mountainRumors]: {
    id: JoshDialogue.mountainRumors,
    messageKey: `${NS}:mountainRumors.message`,
    options: [
      { responseKey: `${NS}:mountainRumors.opt1`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
  [JoshDialogue.missionCheck]: {
    id: JoshDialogue.missionCheck,
    messageKey: `${NS}:missionCheck.message`,
    options: [
      { responseKey: `${NS}:missionCheck.opt1`, results: [{ next: JoshDialogue.talkReady }] },
    ],
  },
}

export default LA_HARPAR_JOSH
