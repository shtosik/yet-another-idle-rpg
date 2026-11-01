type DevTools = Record<string, (...args: unknown[]) => unknown>

const devWindow = window as { dev?: DevTools }
const LOAD_TIMEOUT_MS = 30_000

/**
 * Puts a placeholder `window.dev` in place until the deferred cheat bar chunk sets the real one. A call made before
 * that waits for it and returns a Promise instead of throwing "Cannot read properties of undefined", which agents hit
 * by calling `dev.equip(...)` right after page load.
 */
export function installDevStub(): void {
  if (devWindow.dev) return
  const stub: DevTools = new Proxy({}, {
    get: (_, name) => (...args: unknown[]) => new Promise((resolve, reject) => {
      const giveUpAt = Date.now() + LOAD_TIMEOUT_MS
      const call = (): void => {
        const dev = devWindow.dev
        const command = dev?.[String(name)]
        if (!dev || dev === stub) {
          if (Date.now() < giveUpAt) setTimeout(call, 50)
          else reject(new Error(`dev.${String(name)}: the cheat bar didn't load within ${LOAD_TIMEOUT_MS / 1000} s`))
        } else if (typeof command !== 'function') {
          reject(new Error(`dev.${String(name)} is not a command; commands: ${Object.keys(dev).join(', ')}`))
        } else {
          try {
            resolve(command(...args))
          } catch (error) {
            reject(error)
          }
        }
      }
      call()
    }),
  })
  devWindow.dev = stub
}
