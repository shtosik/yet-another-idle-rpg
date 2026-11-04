import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Shared by ComfyUI startup and matting; an explicit installation always wins. */
export function resolveServerDir(env = process.env, exists = existsSync) {
    if (env.ASSET_GEN_SERVER_DIR) return env.ASSET_GEN_SERVER_DIR
    const roaming = join(env.APPDATA ?? '', 'krita', 'ai_diffusion', 'server')
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    for (const candidate of [roaming, relocated]) {
        if (exists(join(candidate, 'ComfyUI', 'main.py')) && exists(join(candidate, 'venv', 'Scripts', 'pythonw.exe'))) return candidate
    }
    return roaming
}
