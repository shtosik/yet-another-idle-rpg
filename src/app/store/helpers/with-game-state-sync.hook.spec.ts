import { compressToUTF16 } from 'lz-string'
import { readSave } from './with-game-state-sync.hook'

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
