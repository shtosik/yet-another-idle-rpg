import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createComfy } from '../lib/comfy.mjs'

const PNG = Buffer.from('89504e470d0a1a0a', 'hex')

/** Unmasked server -> client text frame (payloads here stay under 126 bytes). */
const wsFrame = (text) => Buffer.concat([Buffer.from([0x81, Buffer.byteLength(text)]), Buffer.from(text)])

/**
 * Minimal fake ComfyUI: /system_stats, /object_info, /prompt, /history, /view and a hand-rolled websocket.
 * `mode`: 'socket' announces completion over ws, 'history' never does (forces the poll fallback), 'error' fails the run.
 */
function startFake({ mode = 'socket', checkpoints = ['good.safetensors'] } = {}) {
    const state = { submitted: [], sockets: [], historyHits: 0 }
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, 'http://x')
        const json = (body, status = 200) => {
            res.writeHead(status, { 'content-type': 'application/json' })
            res.end(JSON.stringify(body))
        }
        if (url.pathname === '/system_stats') return json({ ok: true })
        if (url.pathname === '/object_info/CheckpointLoaderSimple') {
            return json({ CheckpointLoaderSimple: { input: { required: { ckpt_name: [checkpoints] } } } })
        }
        if (url.pathname === '/prompt' && req.method === 'POST') {
            let body = ''
            for await (const chunk of req) body += chunk
            state.submitted.push(JSON.parse(body))
            setTimeout(() => {
                for (const socket of state.sockets) {
                    if (mode === 'socket' || mode === 'late') socket.write(wsFrame(JSON.stringify({ type: 'executing', data: { node: null, prompt_id: 'p1' } })))
                    if (mode === 'error') socket.write(wsFrame(JSON.stringify({ type: 'execution_error', data: { prompt_id: 'p1', exception_message: 'boom' } })))
                }
            }, 20)
            return json({ prompt_id: 'p1' })
        }
        if (url.pathname === '/history/p1') {
            // 'late': the completion event is out, but /history only carries outputs from its 3rd read on
            const done = mode === 'history' || mode === 'socket' || (mode === 'late' && ++state.historyHits >= 3)
            return json(done ? { p1: { outputs: { save: { images: [{ filename: 'a.png', subfolder: '', type: 'output' }, { filename: 'b.png', subfolder: '', type: 'output' }] } } } } : {})
        }
        if (url.pathname === '/view') {
            res.writeHead(200, { 'content-type': 'image/png' })
            return res.end(Buffer.concat([PNG, Buffer.from(url.searchParams.get('filename'))]))
        }
        json({}, 404)
    })
    server.on('upgrade', (req, socket) => {
        const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')
        socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
        state.sockets.push(socket)
        socket.on('error', () => {})
    })
    return new Promise((resolve) =>
        server.listen(0, '127.0.0.1', () =>
            resolve({ state, port: server.address().port, close: () => { state.sockets.forEach((s) => s.destroy()); server.close() } }),
        ),
    )
}

const comfyFor = (fake, extra = {}) => createComfy({ port: fake.port, pollMs: 10, runTimeoutMs: 5000, pidFile: join(mkdtempSync(join(tmpdir(), 'comfy-')), 'comfy.pid'), ...extra })

test('submit, complete over the socket, fetch every image', async () => {
    const fake = await startFake({ mode: 'socket' })
    try {
        const images = await comfyFor(fake).run({ save: { class_type: 'SaveImage', inputs: {} } })
        assert.equal(images.length, 2)
        assert.ok(images[0].subarray(0, 8).equals(PNG))
        assert.equal(fake.state.submitted.length, 1)
        assert.ok(fake.state.submitted[0].client_id)
        assert.ok(fake.state.submitted[0].prompt.save)
    } finally {
        fake.close()
    }
})

test('falls back to history polling when the socket never reports completion', async () => {
    const fake = await startFake({ mode: 'history' })
    try {
        const images = await comfyFor(fake).run({})
        assert.equal(images.length, 2)
    } finally {
        fake.close()
    }
})

test('falls back to history polling when no WebSocket implementation exists', async () => {
    const fake = await startFake({ mode: 'history' })
    try {
        const images = await comfyFor(fake, { WebSocketImpl: undefined }).run({})
        assert.equal(images.length, 2)
    } finally {
        fake.close()
    }
})

test('execution_error from the server rejects the run', async () => {
    const fake = await startFake({ mode: 'error' })
    try {
        await assert.rejects(comfyFor(fake).run({}), /execution error: boom/)
    } finally {
        fake.close()
    }
})

test('missing checkpoint gives a clear error listing what is installed', async () => {
    const fake = await startFake({ checkpoints: ['good.safetensors'] })
    try {
        const comfy = comfyFor(fake)
        await comfy.assertCheckpoint('good.safetensors')
        await assert.rejects(comfy.assertCheckpoint('missing.safetensors'), /"missing\.safetensors" is not installed.*good\.safetensors/)
    } finally {
        fake.close()
    }
})

test('ensureServer leaves an already-running server alone and writes no pid', async () => {
    const fake = await startFake()
    try {
        const comfy = comfyFor(fake, { spawnFn: () => assert.fail('must not spawn') })
        assert.deepEqual(await comfy.ensureServer(), { started: false })
    } finally {
        fake.close()
    }
})

test('ensureServer spawns detached, records the pid and polls until ready', async () => {
    const fake = await startFake()
    const pidFile = join(mkdtempSync(join(tmpdir(), 'comfy-')), 'comfy.pid')
    let probes = 0
    const countingFetch = (url, init) => (String(url).endsWith('/system_stats') && ++probes < 3 ? Promise.reject(new Error('down')) : fetch(url, init))
    const spawned = []
    try {
        const comfy = createComfy({
            port: fake.port, pollMs: 10, pidFile, fetchFn: countingFetch,
            spawnFn: (cmd, args, opts) => (spawned.push({ cmd, args, opts }), { pid: 4242, unref() {} }),
        })
        assert.deepEqual(await comfy.ensureServer(), { started: true })
        assert.equal(readFileSync(pidFile, 'utf8'), '4242')
        assert.equal(spawned[0].opts.detached, true)
        assert.deepEqual(spawned[0].args, ['main.py', '--port', String(fake.port), '--reserve-vram', '2'])
        if (process.platform === 'win32') assert.match(spawned[0].cmd, /pythonw\.exe$/)
        assert.ok(existsSync(join(dirname(pidFile), 'comfy.log')))
    } finally {
        fake.close()
    }
})

test('stop kills only the pid it wrote, then forgets it', () => {
    const pidFile = join(mkdtempSync(join(tmpdir(), 'comfy-')), 'comfy.pid')
    writeFileSync(pidFile, '777')
    const killed = []
    const comfy = createComfy({ pidFile, killFn: (pid) => killed.push(pid) })
    assert.deepEqual(comfy.stop(), { stopped: true, pid: 777 })
    assert.deepEqual(killed, [777])
    assert.equal(existsSync(pidFile), false)
    assert.deepEqual(comfy.stop(), { stopped: false })
    assert.deepEqual(killed, [777])
})

test('retries /history when the completion event arrives before the outputs are written', async () => {
    const fake = await startFake({ mode: 'late' })
    try {
        const images = await comfyFor(fake).run({})
        assert.equal(images.length, 2)
        assert.ok(fake.state.historyHits >= 3)
    } finally {
        fake.close()
    }
})
