import { DialogueNode } from '../../../interfaces/dialogues/dialogue-node.interface'
import { QuestID } from '../../../enums/ids/quest-id.enum'

enum TraderConversationId {
    intro1 = 0,
    intro2 = 1,
    intro3 = 2,
    default = 3,
    aboutMe = 4,
    aboutLiving = 5,
    aboutVillage = 10,
    aboutFishermen = 11,
    aboutFishQuality = 12,
    aboutPeople = 15,
    aboutGuild = 16,
    aboutDanger = 17,
    questOffer = 20,
    questCompleted = 21,
}

export type LaHarparTraderDialogueType = Record<TraderConversationId, DialogueNode<TraderConversationId>>

const LA_HARPAR_TRADER: LaHarparTraderDialogueType = {
    [TraderConversationId.intro1]: {
        id: TraderConversationId.intro1,
        messageKey: 'laHarparTrader:intro1.message',
        options: [{ responseKey: 'laHarparTrader:intro1.opt1', next: TraderConversationId.intro2 }],
    },
    [TraderConversationId.intro2]: {
        id: TraderConversationId.intro2,
        messageKey: 'laHarparTrader:intro2.message',
        options: [{ responseKey: 'laHarparTrader:intro2.opt1', next: TraderConversationId.intro3 }],
    },
    [TraderConversationId.intro3]: {
        id: TraderConversationId.intro3,
        messageKey: 'laHarparTrader:intro3.message',
        options: [{ responseKey: 'laHarparTrader:intro3.opt1', next: TraderConversationId.default }],
    },
    [TraderConversationId.default]: {
        id: TraderConversationId.default,
        messageKey: 'laHarparTrader:default.message',
        options: [
            {
                responseKey: 'laHarparTrader:default.opt1',
                next: TraderConversationId.default,
                conditions: [{ type: 'questStep', questId: QuestID.ratsWereRats, step: 1 }],
                effects: { type: 'quest', action: 'end', questId: QuestID.ratsWereRats },
            },
            {
                responseKey: 'laHarparTrader:default.opt2',
                next: TraderConversationId.default,
                effects: { type: 'shop', shopId: 0 },
                closeDialogue: true,
            },
            { responseKey: 'laHarparTrader:default.opt3', next: TraderConversationId.aboutMe },
            { responseKey: 'laHarparTrader:default.opt4', next: TraderConversationId.aboutVillage },
            { responseKey: 'laHarparTrader:default.opt5', next: TraderConversationId.aboutPeople },
            { responseKey: 'laHarparTrader:default.opt6', next: TraderConversationId.questOffer },
        ],
    },
    [TraderConversationId.aboutMe]: {
        id: TraderConversationId.aboutMe,
        messageKey: 'laHarparTrader:aboutMe.message',
        options: [
            { responseKey: 'laHarparTrader:aboutMe.opt1', next: TraderConversationId.aboutLiving },
            { responseKey: 'laHarparTrader:aboutMe.opt2', next: TraderConversationId.aboutPeople },
        ],
    },
    [TraderConversationId.aboutLiving]: {
        id: TraderConversationId.aboutLiving,
        messageKey: 'laHarparTrader:aboutLiving.message',
        options: [{ responseKey: 'laHarparTrader:aboutLiving.opt1', next: TraderConversationId.default }],
    },
    [TraderConversationId.aboutVillage]: {
        id: TraderConversationId.aboutVillage,
        messageKey: 'laHarparTrader:aboutVillage.message',
        options: [
            { responseKey: 'laHarparTrader:aboutVillage.opt1', next: TraderConversationId.aboutFishermen },
            { responseKey: 'laHarparTrader:aboutVillage.opt2', next: TraderConversationId.default },
        ],
    },
    [TraderConversationId.aboutFishermen]: {
        id: TraderConversationId.aboutFishermen,
        messageKey: 'laHarparTrader:aboutFishermen.message',
        options: [{ responseKey: 'laHarparTrader:aboutFishermen.opt1', next: TraderConversationId.aboutFishQuality }],
    },
    [TraderConversationId.aboutFishQuality]: {
        id: TraderConversationId.aboutFishQuality,
        messageKey: 'laHarparTrader:aboutFishQuality.message',
        options: [{ responseKey: 'laHarparTrader:aboutFishQuality.opt1', next: TraderConversationId.default }],
    },
    [TraderConversationId.aboutPeople]: {
        id: TraderConversationId.aboutPeople,
        messageKey: 'laHarparTrader:aboutPeople.message',
        options: [{ responseKey: 'laHarparTrader:aboutPeople.opt1', next: TraderConversationId.aboutGuild }],
    },
    [TraderConversationId.aboutGuild]: {
        id: TraderConversationId.aboutGuild,
        messageKey: 'laHarparTrader:aboutGuild.message',
        options: [
            { responseKey: 'laHarparTrader:aboutGuild.opt1', next: TraderConversationId.default },
            { responseKey: 'laHarparTrader:aboutGuild.opt2', next: TraderConversationId.aboutDanger },
        ],
    },
    [TraderConversationId.aboutDanger]: {
        id: TraderConversationId.aboutDanger,
        messageKey: 'laHarparTrader:aboutDanger.message',
        options: [{ responseKey: 'laHarparTrader:aboutDanger.opt1', next: TraderConversationId.default }],
    },
    [TraderConversationId.questOffer]: {
        id: TraderConversationId.questOffer,
        messageKey: 'laHarparTrader:questOffer.message',
        options: [
            {
                responseKey: 'laHarparTrader:questOffer.opt1',
                next: TraderConversationId.default,
                closeDialogue: true,
                effects: { questId: QuestID.ratsWereRats, type: 'quest', action: 'start' },
                // nextIfQuestStarted: TraderConversationId.questCompleted,
            },
            { responseKey: 'laHarparTrader:questOffer.opt2', next: TraderConversationId.default },
        ],
    },
    [TraderConversationId.questCompleted]: {
        id: TraderConversationId.questCompleted,
        messageKey: 'laHarparTrader:questCompleted.message',
        options: [{ responseKey: 'laHarparTrader:questCompleted.opt1', next: TraderConversationId.default }],
    },
}

export default LA_HARPAR_TRADER
