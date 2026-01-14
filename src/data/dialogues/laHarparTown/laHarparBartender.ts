import { QuestID } from '../../../enums/ids/quest-id.enum'
import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'

enum laHarparBartenderConversationID {
    introduction1 = 0,
    introduction2 = 1,
    default = 2,
    whatIsThisPlace1 = 3,
    anyWorkForMe1 = 4,
    anyoneWhoCanTrainMe1 = 5,
    anyoneWhoCanTrainMe2 = 6,
    anyWorkForMe2 = 7,
}

export type LaHarparBartenderDialogueType = Record<laHarparBartenderConversationID, DialogueNode<laHarparBartenderConversationID>>

const LA_HARPAR_BARTENDER: LaHarparBartenderDialogueType = {
    [laHarparBartenderConversationID.introduction1]: {
        id: laHarparBartenderConversationID.introduction1,
        messageKey: 'dialogues/laHarparBartender:introduction1.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:introduction1.opt1',
                next: laHarparBartenderConversationID.introduction2,
            },
            {
                responseKey: 'dialogues/laHarparBartender:introduction1.opt2',
                next: laHarparBartenderConversationID.default,
            },
        ],
    },
    [laHarparBartenderConversationID.introduction2]: {
        id: laHarparBartenderConversationID.introduction2,
        messageKey: 'dialogues/laHarparBartender:introduction2.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:introduction2.opt1',
                next: laHarparBartenderConversationID.default,
            },
        ],
    },
    [laHarparBartenderConversationID.default]: {
        id: laHarparBartenderConversationID.default,
        messageKey: 'dialogues/laHarparBartender:default.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:default.beer',
                next: laHarparBartenderConversationID.default,
                conditions: [{ type: 'questStep', questId: QuestID.meatShortage, step: 1 }],
                effects: { type: 'quest', action: 'end', questId: QuestID.meatShortage },
            },
            {
                responseKey: 'dialogues/laHarparBartender:default.whatIsThisPlace',
                next: laHarparBartenderConversationID.whatIsThisPlace1,
                effects: { type: 'stat', stats: [{ key: 'goldCoins', amount: 20 }] },
            },
            {
                responseKey: 'dialogues/laHarparBartender:default.anyWork',
                next: laHarparBartenderConversationID.anyWorkForMe1,
                effects: { type: 'stat', stats: [{ key: 'goldCoins', amount: 40 }] },
                alternativeDialogueNext: {
                    type: 'questStep',
                    questId: QuestID.meatShortage,
                    step: 1,
                    next: laHarparBartenderConversationID.anyWorkForMe2,
                },
            },
            {
                responseKey: 'dialogues/laHarparBartender:default.anyTrainer',
                next: laHarparBartenderConversationID.anyoneWhoCanTrainMe1,
                effects: { type: 'stat', stats: [{ key: 'goldCoins', amount: 60 }] },
            },
            {
                responseKey: 'dialogues/laHarparBartender:default.goodbye',
                next: laHarparBartenderConversationID.default,
                closeDialogue: true,
            },
        ],
    },
    [laHarparBartenderConversationID.whatIsThisPlace1]: {
        id: laHarparBartenderConversationID.whatIsThisPlace1,
        messageKey: 'dialogues/laHarparBartender:whatIsThisPlace1.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:whatIsThisPlace1.opt1',
                next: laHarparBartenderConversationID.default,
            },
        ],
    },
    [laHarparBartenderConversationID.anyWorkForMe1]: {
        id: laHarparBartenderConversationID.anyWorkForMe1,
        messageKey: 'dialogues/laHarparBartender:anyWorkForMe1.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:anyWorkForMe1.accept',
                next: laHarparBartenderConversationID.default,
                effects: { type: 'quest', action: 'start', questId: QuestID.meatShortage },
            },
            {
                responseKey: 'dialogues/laHarparBartender:anyWorkForMe1.decline',
                next: laHarparBartenderConversationID.default,
            },
        ],
    },
    [laHarparBartenderConversationID.anyoneWhoCanTrainMe1]: {
        id: laHarparBartenderConversationID.anyoneWhoCanTrainMe1,
        messageKey: 'dialogues/laHarparBartender:anyoneWhoCanTrainMe1.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:anyoneWhoCanTrainMe1.opt1',
                next: laHarparBartenderConversationID.default,
            },
            {
                responseKey: 'dialogues/laHarparBartender:anyoneWhoCanTrainMe1.opt2',
                next: laHarparBartenderConversationID.anyoneWhoCanTrainMe2,
            },
        ],
    },
    [laHarparBartenderConversationID.anyoneWhoCanTrainMe2]: {
        id: laHarparBartenderConversationID.anyoneWhoCanTrainMe2,
        messageKey: 'dialogues/laHarparBartender:anyoneWhoCanTrainMe2.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:anyoneWhoCanTrainMe2.opt1',
                next: laHarparBartenderConversationID.default,
                closeDialogue: true,
            },
        ],
    },
    [laHarparBartenderConversationID.anyWorkForMe2]: {
        id: laHarparBartenderConversationID.anyWorkForMe2,
        messageKey: 'dialogues/laHarparBartender:anyWorkForMe2.message',
        options: [
            {
                responseKey: 'dialogues/laHarparBartender:anyWorkForMe2.opt1',
                next: laHarparBartenderConversationID.default,
                closeDialogue: true,
            },
        ],
    },
}

export default LA_HARPAR_BARTENDER
