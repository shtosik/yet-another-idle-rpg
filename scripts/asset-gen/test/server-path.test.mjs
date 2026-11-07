import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { resolveServerDir } from '../lib/server-path.mjs'

test('explicit server directory overrides automatic discovery', () => {
    assert.equal(resolveServerDir({ ASSET_GEN_SERVER_DIR: 'X:/custom' }, () => true), 'X:/custom')
})

test('finds relocated Krita when the old roaming installation is missing', () => {
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    const installed = new Set([join(relocated, 'ComfyUI', 'main.py'), join(relocated, 'venv', 'Scripts', 'pythonw.exe')])
    assert.equal(resolveServerDir({ APPDATA: 'C:/old' }, p => installed.has(p)), relocated)
})

test('prefers a complete roaming installation and skips incomplete installations', () => {
    assert.equal(resolveServerDir({ APPDATA: 'C:/roaming' }, () => true), join('C:/roaming', 'krita', 'ai_diffusion', 'server'))
    assert.equal(resolveServerDir({ APPDATA: 'C:/old' }, p => p === join('C:/old', 'krita', 'ai_diffusion', 'server', 'ComfyUI', 'main.py') || p.startsWith('D:')), 'D:/AppData/krita/ai_diffusion/server')
})

import { resolveMattingPaths } from '../lib/server-path.mjs'

const mattePython = dir => join(dir, 'venv', 'Scripts', 'python.exe')
const matteModel = dir => join(dir, 'models', 'matting', 'isnet-general-use.onnx')

test('retains roaming matting dependencies while ComfyUI uses relocated server', () => {
    const roaming = join('C:/old', 'krita', 'ai_diffusion', 'server')
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    const installed = new Set([mattePython(roaming), matteModel(roaming), join(relocated, 'ComfyUI', 'main.py'), join(relocated, 'venv', 'Scripts', 'pythonw.exe')])
    const exists = path => installed.has(path)
    assert.equal(resolveServerDir({ APPDATA: 'C:/old' }, exists), relocated)
    assert.deepEqual(resolveMattingPaths({ APPDATA: 'C:/old' }, exists), { python: mattePython(roaming), model: matteModel(roaming) })
})

test('matting can use Python and model from separate installations', () => {
    const roaming = join('C:/old', 'krita', 'ai_diffusion', 'server')
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    const installed = new Set([mattePython(roaming), matteModel(relocated)])
    assert.deepEqual(resolveMattingPaths({ APPDATA: 'C:/old' }, path => installed.has(path)), { python: mattePython(roaming), model: matteModel(relocated) })
})

test('missing model download targets the selected relocated installation', () => {
    const relocated = 'D:/AppData/krita/ai_diffusion/server'
    const installed = new Set([mattePython(relocated), join(relocated, 'ComfyUI', 'main.py'), join(relocated, 'venv', 'Scripts', 'pythonw.exe')])
    assert.deepEqual(resolveMattingPaths({ APPDATA: 'C:/old' }, path => installed.has(path)), { python: mattePython(relocated), model: matteModel(relocated) })
})

test('explicit server and per-dependency overrides take priority', () => {
    assert.deepEqual(resolveMattingPaths({ ASSET_GEN_SERVER_DIR: 'X:/custom' }, () => true), { python: mattePython('X:/custom'), model: matteModel('X:/custom') })
    assert.deepEqual(resolveMattingPaths({ ASSET_GEN_SERVER_DIR: 'X:/custom', ASSET_GEN_PYTHON: 'Y:/python.exe', ASSET_GEN_MATTE_MODEL: 'Z:/model.onnx' }, () => false), { python: 'Y:/python.exe', model: 'Z:/model.onnx' })
})
