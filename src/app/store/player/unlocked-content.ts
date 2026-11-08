import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { UnlockedContent } from '../../../types/player/unlocked-content.type'

/** Open from the first save, and in saves that lack the list. */
export const DEFAULT_ZONES: ZoneID[] = [ZoneID.horseshoeBeach]

type Kind = keyof UnlockedContent
type Id<K extends Kind> = NonNullable<UnlockedContent[K]>[number]

/** What `content` holds of one kind; a missing list is the kind's default (zones), else empty. */
export const unlockedOf = <K extends Kind>(content: UnlockedContent, kind: K): Id<K>[] =>
  (content[kind] ?? (kind === 'zones' ? DEFAULT_ZONES : [])) as Id<K>[]

export const isUnlocked = <K extends Kind>(content: UnlockedContent, kind: K, id: Id<K>): boolean =>
  unlockedOf(content, kind).includes(id)

/** `content` with `id` appended to its kind's list; the same object when it is already there. */
export function withUnlocked<K extends Kind>(content: UnlockedContent, kind: K, id: Id<K>): UnlockedContent {
  if (isUnlocked(content, kind, id)) return content
  return { ...content, [kind]: [...unlockedOf(content, kind), id] }
}
