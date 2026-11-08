import { CONDITION_HANDLERS } from './dialogue-condition-handlers'
import { DialogueContext, DialogueLabel, EFFECT_HANDLERS } from './dialogue-effect-handlers'
import { DialogueCondition } from '../../types/dialogues/dialogue-condition.type'
import { DialogueEffect } from '../../types/dialogues/dialogue-effect.type'
import { QuestID } from '../../enums/ids/quest-id.enum'
import appText from '../../assets/locales/en/app.json'

type Of<U, T extends string, K extends keyof Extract<U, { type: T }>> = Extract<U, { type: T }>[K] & string

// Every member of the unions behind keys built in code; a new member fails to compile until listed here.
const QUEST_ACTIONS: Record<Of<DialogueEffect, 'quest', 'action'>, true> = { start: true, advance: true, end: true }
const GUILD_ACTIONS: Record<Of<DialogueEffect, 'guild', 'action'>, true> = { acceptTask: true, abandonTask: true, claimTask: true }
const GUILD_CONDITIONS: Record<Of<DialogueCondition, 'guild', 'condition'>, true> = {
  hasActiveTask: true, taskComplete: true, noActiveTask: true, hasFreeTaskSlot: true, taskInProgressAt: true,
}

/** The `app:` key's text in en/app.json, or undefined when the key is missing. */
const textOf = ({ key }: DialogueLabel): unknown => {
  const [namespace, path] = key.split(':')
  expect(namespace).toBe('app')
  return path.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], appText)
}

describe('dialogue labels built from code', () => {
  const ctx = {} as DialogueContext

  it('resolve every quest effect tag', () => {
    for (const action of Object.keys(QUEST_ACTIONS) as (keyof typeof QUEST_ACTIONS)[]) {
      const [label] = EFFECT_HANDLERS.quest.label({ type: 'quest', questId: QuestID.meatShortage, action }, ctx)
      expect(typeof textOf(label)).withContext(label.key).toBe('string')
    }
  })

  it('resolve every guild effect tag', () => {
    for (const action of Object.keys(GUILD_ACTIONS) as (keyof typeof GUILD_ACTIONS)[]) {
      const [label] = EFFECT_HANDLERS.guild.label({ type: 'guild', action }, ctx)
      expect(typeof textOf(label)).withContext(label.key).toBe('string')
    }
  })

  it('resolve every guild condition tag', () => {
    for (const condition of Object.keys(GUILD_CONDITIONS) as (keyof typeof GUILD_CONDITIONS)[]) {
      const [label] = CONDITION_HANDLERS.guild.label({ type: 'guild', condition }, ctx)
      expect(typeof textOf(label)).withContext(label.key).toBe('string')
    }
  })
})
