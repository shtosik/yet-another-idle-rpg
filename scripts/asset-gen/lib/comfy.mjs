// ComfyUI adapter: boots the server on demand, runs a graph, returns image buffers, stops only what it started.
// All I/O seams (fetch, WebSocket, spawn, kill) are injectable so the adapter is testable against a fake server.

import { spawn as nodeSpawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const defaultServerDir = () => join(process.env.APPDATA ?? '', 'krita', 'ai_diffusion', 'server')

function defaultKill(pid) {
    if (process.platform === 'win32') {
        // The venv python launcher can leave a child behind; /T takes the whole tree owned by that pid.
        nodeSpawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' })
    } else {
        process.kill(pid)
    }
}

export function createComfy({
    host = '127.0.0.1',
    port = 8188,
    pidFile = join('.tmp-gen', 'comfy.pid'),
    serverDir = defaultServerDir(),
    fetchFn = fetch,
    WebSocketImpl = globalThis.WebSocket,
    spawnFn = nodeSpawn,
    killFn = defaultKill,
    readyTimeoutMs = 120_000,
    pollMs = 1000,
    runTimeoutMs = 600_000,
    outputRetries = 20,
} = {}) {
    const base = `http://${host}:${port}`
    const clientId = randomUUID()

    const getJson = async (path) => {
        const res = await fetchFn(base + path)
        if (!res.ok) throw new Error(`ComfyUI ${path} -> HTTP ${res.status}`)
        return res.json()
    }

    async function isUp() {
        try {
            const res = await fetchFn(`${base}/system_stats`)
            return res.ok
        } catch {
            return false
        }
    }

    /** Probes the server; if down, spawns it detached, records its pid and polls until ready. */
    async function ensureServer() {
        if (await isUp()) return { started: false }
        const python = join(serverDir, 'venv', 'Scripts', 'python.exe')
        const child = spawnFn(python, ['main.py', '--port', String(port)], {
            cwd: join(serverDir, 'ComfyUI'),
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        })
        child.unref?.()
        mkdirSync(dirname(pidFile), { recursive: true })
        writeFileSync(pidFile, String(child.pid))
        const deadline = Date.now() + readyTimeoutMs
        while (Date.now() < deadline) {
            if (await isUp()) return { started: true }
            await sleep(pollMs)
        }
        throw new Error(`ComfyUI did not become ready within ${readyTimeoutMs / 1000}s (pid ${child.pid})`)
    }

    /** Throws a clear error when the checkpoint is not installed on the server. */
    async function assertCheckpoint(name) {
        const info = await getJson('/object_info/CheckpointLoaderSimple')
        const available = info.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] ?? []
        if (!available.includes(name)) {
            throw new Error(`Checkpoint "${name}" is not installed on the ComfyUI server. Available: ${available.join(', ') || '(none)'}`)
        }
    }

    /**
     * Opens the progress socket before the prompt is queued, so a fast prompt cannot finish unobserved.
     * `wait(id)` resolves on completion and rejects (fatal) on execution_error; if the socket is unavailable it
     * simply never settles and the history poll in `run` wins the race.
     */
    function openSocket() {
        const finished = new Map() // promptId -> Error | null
        const waiters = new Map() // promptId -> { resolve, reject }
        const settle = (id, err) => {
            finished.set(id, err)
            const w = waiters.get(id)
            if (w) err ? w.reject(err) : w.resolve()
        }
        let ws
        try {
            ws = new WebSocketImpl(`ws://${host}:${port}/ws?clientId=${clientId}`)
            ws.onerror = () => {}
            ws.onmessage = (event) => {
                if (typeof event.data !== 'string') return
                const msg = JSON.parse(event.data)
                const id = msg.data?.prompt_id
                if (!id) return
                if (msg.type === 'execution_error') settle(id, Object.assign(new Error(`ComfyUI execution error: ${msg.data.exception_message}`), { fatal: true }))
                if ((msg.type === 'executing' && msg.data.node === null) || msg.type === 'execution_success') settle(id, null)
            }
        } catch {
            ws = undefined
        }
        return {
            wait: (id) =>
                new Promise((resolve, reject) => {
                    if (finished.has(id)) return finished.get(id) ? reject(finished.get(id)) : resolve()
                    waiters.set(id, { resolve, reject })
                }),
            close: () => ws?.close?.(),
        }
    }

    async function waitViaHistory(promptId, signal) {
        while (!signal.aborted) {
            const entry = (await getJson(`/history/${promptId}`))[promptId]
            if (entry?.status?.status_str === 'error') throw Object.assign(new Error('ComfyUI execution error (see server log)'), { fatal: true })
            if (entry?.outputs && Object.keys(entry.outputs).length) return
            await sleep(pollMs)
        }
    }

    /** Submits `graph` and returns every SaveImage output as a PNG buffer. */
    async function run(graph) {
        const socket = WebSocketImpl ? openSocket() : undefined
        const abort = new AbortController()
        const timer = setTimeout(() => abort.abort(), runTimeoutMs)
        try {
            const res = await fetchFn(`${base}/prompt`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ prompt: graph, client_id: clientId }),
            })
            if (!res.ok) throw new Error(`ComfyUI rejected the graph (HTTP ${res.status}): ${await res.text()}`)
            const { prompt_id: promptId } = await res.json()
            await Promise.race([socket?.wait(promptId) ?? new Promise(() => {}), waitViaHistory(promptId, abort.signal)])
            if (abort.signal.aborted) throw new Error('timed out waiting for ComfyUI')
            // The completion event can arrive a beat before /history carries the outputs, so retry briefly.
            let images = []
            for (let attempt = 0; attempt < outputRetries && !images.length; attempt++) {
                if (attempt) await sleep(pollMs)
                const entry = (await getJson(`/history/${promptId}`))[promptId]
                images = Object.values(entry?.outputs ?? {}).flatMap((out) => out.images ?? [])
            }
            if (!images.length) throw new Error('ComfyUI finished but produced no images')
            return await Promise.all(
                images.map(async ({ filename, subfolder, type }) => {
                    const qs = new URLSearchParams({ filename, subfolder, type })
                    const img = await fetchFn(`${base}/view?${qs}`)
                    if (!img.ok) throw new Error(`ComfyUI /view ${filename} -> HTTP ${img.status}`)
                    return Buffer.from(await img.arrayBuffer())
                }),
            )
        } finally {
            abort.abort()
            clearTimeout(timer)
            socket?.close()
        }
    }

    /** Kills only the process this adapter spawned (the pid it wrote); no-op if it never started one. */
    function stop() {
        let pid
        try {
            pid = Number(readFileSync(pidFile, 'utf8'))
        } catch {
            return { stopped: false }
        }
        rmSync(pidFile, { force: true })
        if (!Number.isInteger(pid) || pid <= 0) return { stopped: false }
        killFn(pid)
        return { stopped: true, pid }
    }

    return { isUp, ensureServer, assertCheckpoint, run, stop }
}
