import { compressToUTF16 } from 'lz-string'
import { classifySave, readSave } from './with-game-state-sync.hook'

describe('readSave', () => {
  const state = { gold: 5 }
  const envelope = (v: unknown, s: unknown = state) => JSON.stringify({ v, state: s })

  it('loads a save of the same version', () => {
    expect(readSave(envelope(2), 2)).toEqual({ kind: 'load', state })
  })

  it('treats a bare state object as version 1', () => {
    expect(readSave(JSON.stringify(state), 1)).toEqual({ kind: 'load', state })
    expect(readSave(JSON.stringify(state), 2)).toEqual({ kind: 'outdated', savedVersion: 1 })
  })

  it('reports an older save as outdated and a newer one as newer', () => {
    expect(readSave(envelope(1), 2)).toEqual({ kind: 'outdated', savedVersion: 1 })
    expect(readSave(envelope(3), 2)).toEqual({ kind: 'newer', savedVersion: 3 })
  })

  it('reads a compressed (production) save', () => {
    expect(readSave('z:' + compressToUTF16(envelope(1)), 1)).toEqual({ kind: 'load', state })
  })

  it('throws on a save it cannot read, so it is never overwritten', () => {
    expect(() => readSave('{not json', 1)).toThrow()
    expect(() => readSave('null', 1)).toThrow()
    expect(() => readSave('[1, 2]', 1)).toThrow()
    expect(() => readSave('z:garbage', 1)).toThrow()
  })

  it('throws on a malformed envelope instead of loading it as a bare state', () => {
    expect(() => readSave(envelope(1, null), 1)).toThrow()
    expect(() => readSave(envelope(1, 'x'), 1)).toThrow()
    expect(() => readSave(envelope(1, []), 1)).toThrow()
    expect(() => readSave(envelope('1'), 1)).toThrow()
  })
})

describe('readSave migrations', () => {
  const migrations = {
    1: (s: Record<string, unknown>) => ({ ...s, coins: s['gold'] }),
    2: (s: Record<string, unknown>) => ({ ...s, step: 3 }),
  }

  it('migrates an older save up to the current version, one step at a time', () => {
    expect(readSave(JSON.stringify({ v: 1, state: { gold: 5 } }), 3, migrations))
      .toEqual({ kind: 'load', state: { gold: 5, coins: 5, step: 3 } })
    expect(readSave(JSON.stringify({ v: 2, state: { gold: 5 } }), 3, migrations))
      .toEqual({ kind: 'load', state: { gold: 5, step: 3 } })
  })

  it('migrates a bare pre-versioning save as version 1', () => {
    expect(readSave(JSON.stringify({ gold: 5 }), 2, migrations)).toEqual({ kind: 'load', state: { gold: 5, coins: 5 } })
  })

  it('reports a save as outdated when a step of its path is missing', () => {
    expect(readSave(JSON.stringify({ v: 1, state: {} }), 3, { 2: migrations[2] })).toEqual({ kind: 'outdated', savedVersion: 1 })
  })

  it('throws when a migration fails, so the save is never overwritten', () => {
    const broken = { 1: () => { throw new Error('bad') } }
    expect(() => readSave(JSON.stringify({ v: 1, state: {} }), 2, broken)).toThrow()
    expect(classifySave(JSON.stringify({ v: 1, state: {} }), 2, broken)).toBe('unreadable')
  })

  it('lets an import load a migratable save instead of counting it as outdated', () => {
    expect(classifySave(JSON.stringify({ v: 1, state: { gold: 5 } }), 2, migrations)).toBe('load')
  })
})

describe('classifySave (save import check)', () => {
  const envelope = (v: number) => JSON.stringify({ v, state: { gold: 5 } })

  it('says how each save would load into a store of the given version', () => {
    expect(classifySave(envelope(2), 2)).toBe('load')
    expect(classifySave(envelope(1), 2)).toBe('outdated')
    expect(classifySave(envelope(3), 2)).toBe('newer')
    expect(classifySave('z:' + compressToUTF16(envelope(2)), 2)).toBe('load')
  })

  it('marks anything it cannot read as unreadable instead of throwing', () => {
    expect(classifySave('{not json', 1)).toBe('unreadable')
    expect(classifySave('z:garbage', 1)).toBe('unreadable')
    expect(classifySave(42, 1)).toBe('unreadable')
    expect(classifySave(null, 1)).toBe('unreadable')
  })
})
