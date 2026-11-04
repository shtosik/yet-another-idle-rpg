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
