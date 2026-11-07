import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** ComfyUI installation discovery; an explicit installation always wins. */
export function resolveServerDir(env = process.env, exists = existsSync) {
    if (env.ASSET_GEN_SERVER_DIR) return env.ASSET_GEN_SERVER_DIR
    const roaming = join(env.APPDATA ?? '', 'krita', 'ai_diffusion', 'server')
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    for (const candidate of [roaming, relocated]) {
        if (exists(join(candidate, 'ComfyUI', 'main.py')) && exists(join(candidate, 'venv', 'Scripts', 'pythonw.exe'))) return candidate
    }
    return roaming
}

/** Matting needs python.exe and its model, independently of ComfyUI's launcher. */
export function resolveMattingPaths(env = process.env, exists = existsSync) {
    const roaming = join(env.APPDATA ?? '', 'krita', 'ai_diffusion', 'server')
    const server = resolveServerDir(env, exists)
    let candidates = [roaming, 'D:/AppData/krita/ai_diffusion/server']
    if (env.ASSET_GEN_SERVER_DIR) candidates = [env.ASSET_GEN_SERVER_DIR]
    const pythonPath = dir => join(dir, 'venv', 'Scripts', 'python.exe')
    const modelPath = dir => join(dir, 'models', 'matting', 'isnet-general-use.onnx')
    return {
        python: env.ASSET_GEN_PYTHON ?? candidates.map(pythonPath).find(exists) ?? pythonPath(server),
        model: env.ASSET_GEN_MATTE_MODEL ?? candidates.map(modelPath).find(exists) ?? modelPath(server),
    }
}
