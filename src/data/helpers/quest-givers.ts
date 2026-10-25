import { QuestID } from 'enums/ids/quest-id.enum'
import { NpcID } from 'enums/map/npc-id.enum'
import { TownID } from 'enums/map/town-id.enum'
import { TownBuildingID } from 'enums/map/town-building-id.enum'
import { QuestStep } from 'types/quests/quest-progression.type'
import NPC_DATA from 'data/npc-data'
import TOWNS_DATA from 'data/towns-data'

export interface QuestGiver {
    npcId: NpcID
    townId: TownID
    buildingId: TownBuildingID
}

interface QuestNpcs {
    /** Turn-ins whose result is gated on a specific step (`questState` condition with `step`). */
    turnInByStep: Partial<Record<QuestStep, NpcID>>
    /** Turn-ins with no step on the result (the route to the node gates them). */
    turnIn?: NpcID
    starter?: NpcID
}

// Advance/end/start effects per quest, read from every NPC's dialogue once at module load.
const QUEST_NPCS: Partial<Record<QuestID, QuestNpcs>> = (() => {
    const result: Partial<Record<QuestID, QuestNpcs>> = {}

    for (const npc of Object.values(NPC_DATA)) {
        for (const node of Object.values(npc.dialogue)) {
            for (const option of node.options ?? []) {
                for (const dialogueResult of option.results ?? []) {
                    for (const effect of dialogueResult.effects ?? []) {
                        if (effect.type !== 'quest') continue
                        const entry = result[effect.questId] ??= { turnInByStep: {} }

                        if (effect.action === 'start') {
                            entry.starter ??= npc.id
                            continue
                        }
                        const step = [...dialogueResult.visibilityConditions ?? [], ...dialogueResult.requirementsNeeded ?? []]
                            .find(c => c.type === 'quest' && c.questId === effect.questId && c.step !== undefined)
                        if (step?.type === 'quest' && step.step !== undefined) entry.turnInByStep[step.step] ??= npc.id
                        else entry.turnIn ??= npc.id
                    }
                }
            }
        }
    }
    return result
})()

// An NPC standing in several buildings (the Trader: market and shop) resolves to the first one in TOWNS_DATA.
const placeOf = (npcId: NpcID): QuestGiver | null => {
    for (const town of Object.values(TOWNS_DATA)) {
        const building = town.buildings.find(b => b.npcs.some(n => n.id === npcId))
        if (building) return { npcId, townId: town.id, buildingId: building.buildingId }
    }
    return null
}

/** Who to talk to about `questId` at `step`: that step's turn-in NPC, else any turn-in NPC, else the one who gave it. */
export function questGiverFor(questId: QuestID, step: QuestStep): QuestGiver | null {
    const npcs = QUEST_NPCS[questId]
    const npcId = npcs && (npcs.turnInByStep[step] ?? npcs.turnIn ?? npcs.starter)
    return npcId === undefined ? null : placeOf(npcId)
}
