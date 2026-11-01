import { installDevStub } from './dev-stub'

describe('installDevStub', () => {
  const devWindow = window as { dev?: unknown }

  afterEach(() => delete devWindow.dev)

  it('runs a call made before the cheat bar loads once window.dev arrives', async () => {
    installDevStub()
    const result = (devWindow.dev as { equip: (id: number) => Promise<unknown> }).equip(26)
    devWindow.dev = { equip: (id: number) => `equipped ${id}` }
    expect(await result).toBe('equipped 26')
  })

  it('rejects an unknown command with the list of commands', async () => {
    installDevStub()
    const result = (devWindow.dev as { equp: () => Promise<unknown> }).equp()
    devWindow.dev = { equip: () => true }
    await expectAsync(result).toBeRejectedWithError(/dev.equp is not a command; commands: equip/)
  })

  it('rejects when the command throws', async () => {
    installDevStub()
    const result = (devWindow.dev as { equip: () => Promise<unknown> }).equip()
    devWindow.dev = { equip: () => { throw new Error('no room') } }
    await expectAsync(result).toBeRejectedWithError('no room')
  })
})
