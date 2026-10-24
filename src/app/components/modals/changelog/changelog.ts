/**
 * Changelog note types; each draws as a colored badge. `npm run validate` checks they match `NOTE_TYPES` in
 * scripts/release.mjs and the `changelog.badge` labels in app.json.
 */
export const CHANGELOG_NOTE_TYPES = ['feature', 'bug', 'buff', 'nerf'] as const
export type ChangelogNoteType = typeof CHANGELOG_NOTE_TYPES[number]

const NOTE_TYPES: readonly string[] = CHANGELOG_NOTE_TYPES

export interface ChangelogNote {
    type: ChangelogNoteType
    text: string
}

export interface ChangelogRelease {
    /** MAJOR.MINOR.PATCH, or `Unreleased`. */
    version: string
    date?: string
    notes: ChangelogNote[]
}

/**
 * Reads CHANGELOG.md: `## [version] - date` sections holding `- [type] text` notes.
 * Anything else (the intro, blank lines) is skipped; `npm run validate` checks the format.
 */
export function parseChangelog(md: string): ChangelogRelease[] {
    const releases: ChangelogRelease[] = []
    for (const line of md.split(/\r?\n/)) {
        const heading = /^## \[([^\]]+)\](?: - (\S+))?/.exec(line)
        if (heading) {
            releases.push({ version: heading[1], date: heading[2], notes: [] })
            continue
        }
        const note = /^- \[(\w+)\] (\S.*)$/.exec(line)
        if (note && releases.length && NOTE_TYPES.includes(note[1])) {
            releases.at(-1).notes.push({ type: note[1] as ChangelogNoteType, text: note[2] })
        }
    }
    return releases.filter(r => r.notes.length)
}
