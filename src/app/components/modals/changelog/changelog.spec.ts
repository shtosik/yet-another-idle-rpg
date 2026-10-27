import { parseChangelog } from './changelog'

describe('parseChangelog', () => {
  const md = [
    '# Changelog',
    '',
    'Intro text with a `- [feature] not a note` inside.',
    '',
    '## [Unreleased]',
    '',
    '## [0.2.0] - 2026-11-01',
    '- [buff] Fire Strike hits harder.',
    '- [nerf] Harpy plumes drop less often.',
    '- [bug] Damage popups no longer vanish.',
    '- [unknown] Skipped.',
    'Loose text is skipped.',
    '',
    '## [0.1.0] - 2026-10-24',
    '- [feature] Battle.',
  ].join('\r\n')

  it('reads versions newest first with their dates and typed notes', () => {
    expect(parseChangelog(md)).toEqual([
      {
        version: '0.2.0',
        date: '2026-11-01',
        notes: [
          { type: 'buff', text: 'Fire Strike hits harder.' },
          { type: 'nerf', text: 'Harpy plumes drop less often.' },
          { type: 'bug', text: 'Damage popups no longer vanish.' },
        ],
      },
      { version: '0.1.0', date: '2026-10-24', notes: [{ type: 'feature', text: 'Battle.' }] },
    ])
  })

  it('keeps Unreleased once it has notes', () => {
    const releases = parseChangelog('## [Unreleased]\n- [feature] Settings tab.\n')
    expect(releases).toEqual([{ version: 'Unreleased', date: undefined, notes: [{ type: 'feature', text: 'Settings tab.' }] }])
  })
})
