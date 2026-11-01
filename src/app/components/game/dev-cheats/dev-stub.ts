type DevTools = Record<string, (...args: unknown[]) => unknown>

const devWindow = window as { dev?: DevTools }

/**
 * Puts a placeholder `window.dev` in place until the deferred cheat bar chunk sets the real one. A call made before
 * that waits for it and returns a Promise instead of throwing "Cannot read properties of undefined", which agents hit
 * by calling `dev.equip(...)` right after page load.
 */
export function installDevStub(): void {
  if (devWindow.dev) return
  const stub: DevTools = new Proxy({}, {
    get: (_, name) => (...args: unknown[]) => new Promise((resolve, reject) => {
      const call = (): void => {
        const dev = devWindow.dev
        const command = dev?.[String(name)]
        if (!dev || dev === stub) setTimeout(call, 50)
        else if (typeof command === 'function') resolve(command(...args))
        else reject(new Error(`dev.${String(name)} is not a command; commands: ${Object.keys(dev).join(', ')}`))
      }
      call()
    }),
  })
  devWindow.dev = stub
}
