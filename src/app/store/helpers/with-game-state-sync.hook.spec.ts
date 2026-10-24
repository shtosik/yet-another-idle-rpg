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
