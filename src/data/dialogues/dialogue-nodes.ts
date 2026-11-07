import { DialogueNode } from '../../interfaces/dialogues/dialogue-node.interface'
import { DialogueResult } from '../../interfaces/dialogues/dialogue-option.type'

/**
 * Builds nodes whose text keys come from the enum member's name: `say(W.intro1, ['opt1', { next: W.default }])`
 * has `<ns>:intro1.message` and `<ns>:intro1.opt1`. An option is its key, then its results, most specific first.
 */
export const dialogueNodes = <T extends number>(ns: string, names: { [id: number]: string }) =>
  (id: T, ...options: [key: string, ...results: DialogueResult<T>[]][]): DialogueNode<T> => ({
    id,
    messageKey: `${ns}:${names[id]}.message`,
    options: options.map(([key, ...results]) => ({ responseKey: `${ns}:${names[id]}.${key}`, results })),
  })
