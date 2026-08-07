#!/usr/bin/env node
/**
 * Captures the README screenshots from a running server.
 *
 *   npm run build
 *   node --env-file=.env .output/server/index.mjs &
 *   npm run shots
 *
 * These are the product's shop window — a template nobody can see is a template
 * nobody buys — so the images are checked in rather than generated on demand.
 *
 * Chrome is driven over the DevTools Protocol rather than with `--screenshot`,
 * because the authenticated pages need a session cookie and the flag-based mode
 * has no way to set one. Node 24 ships a global WebSocket, so CDP costs no
 * dependency. Each shot pins its own viewport, so regenerating the set produces
 * comparable images instead of whatever the window happened to be.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3000'
const OUT = join(process.cwd(), 'docs', 'screenshots')
const PORT = 9223

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean)

const chrome = CANDIDATES.find(path => existsSync(path))
if (!chrome) {
  console.error('No Chrome found. Set CHROME_PATH, or install Chrome/Chromium.')
  process.exit(1)
}

const DESKTOP = { width: 1440, height: 900 }
const PHONE = { width: 414, height: 896, mobile: true }

const SHOTS = [
  { name: 'landing', path: '/', size: DESKTOP },
  { name: 'login', path: '/login', size: DESKTOP },
  { name: 'overview', path: '/dashboard', size: DESKTOP },
  { name: 'analytics', path: '/dashboard/analytics', size: DESKTOP },
  { name: 'subscribers', path: '/dashboard/subscribers', size: DESKTOP },
  { name: 'kanban', path: '/dashboard/kanban', size: DESKTOP },
  { name: 'settings', path: '/dashboard/settings', size: DESKTOP },
  { name: 'forms', path: '/dashboard/forms', size: DESKTOP },
  { name: 'overview-dark', path: '/dashboard', size: DESKTOP, theme: 'dark' },
  { name: 'mobile-overview', path: '/dashboard', size: PHONE }
]

// ── Sign in once; every authenticated shot reuses the cookie ──────────────────
const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@cadence.app', password: 'Cadence2026', remember: true })
})

const setCookie = login.headers.getSetCookie().find(value => value.startsWith('cadence-session=')) ?? ''
const sessionValue = setCookie.split(';')[0]?.split('=').slice(1).join('=')
if (!sessionValue) {
  console.error(`Could not sign in (status ${login.status}). Is the server running with NUXT_SESSION_PASSWORD set?`)
  console.error('Try: node --env-file=.env .output/server/index.mjs')
  process.exit(1)
}

// ── Launch Chrome ─────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'cadence-shots-'))

const browser = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  'about:blank'
], { stdio: 'ignore' })

/** Chrome needs a moment before the debugging endpoint answers. */
async function debuggerUrl() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const info = await fetch(`http://127.0.0.1:${PORT}/json/version`).then(response => response.json())
      if (info.webSocketDebuggerUrl) return info.webSocketDebuggerUrl
    } catch {
      // Not listening yet.
    }
    await sleep(200)
  }
  throw new Error('Chrome never opened its debugging port')
}

let socket
let nextId = 1
const pending = new Map()
const listeners = new Set()

function send(method, params = {}, sessionId) {
  const id = nextId++
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
  })
}

/** Resolves when an event arrives, or after `timeout` — never hangs the run. */
function waitFor(method, sessionId, timeout = 15000) {
  return new Promise((resolve) => {
    const timer = setTimeout(finish, timeout)
    function finish() {
      clearTimeout(timer)
      listeners.delete(listener)
      resolve()
    }
    function listener(message) {
      if (message.method === method && (!sessionId || message.sessionId === sessionId)) finish()
    }
    listeners.add(listener)
  })
}

async function main() {
  socket = new WebSocket(await debuggerUrl())

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      message.error ? reject(new Error(message.error.message)) : resolve(message.result)
      return
    }
    for (const listener of [...listeners]) listener(message)
  })

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

  await send('Page.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)

  const { hostname } = new URL(BASE)
  await send('Network.setCookie', {
    name: 'cadence-session',
    value: sessionValue,
    domain: hostname,
    path: '/'
  }, sessionId)

  for (const { name, path, size, theme } of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 2,
      mobile: Boolean(size.mobile)
    }, sessionId)

    // The template follows the OS theme unless the user has chosen one, so the
    // dark shot is taken by telling Chrome the OS is dark rather than by
    // clicking the toggle.
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: theme ?? 'light' }]
    }, sessionId)

    const loaded = waitFor('Page.loadEventFired', sessionId)
    await send('Page.navigate', { url: `${BASE}${path}` }, sessionId)
    await loaded
    // Fonts, charts and the icon fetches all settle after load.
    await sleep(2500)

    const { data } = await send('Page.captureScreenshot', { format: 'png' }, sessionId)
    const file = join(OUT, `${name}.png`)
    writeFileSync(file, Buffer.from(data, 'base64'))
    console.log(`✔ ${name.padEnd(16)} ${size.width}×${size.height}  ${(statSync(file).size / 1024).toFixed(0)} KB`)
  }

  await send('Target.closeTarget', { targetId })
}

try {
  await main()
  console.log(`\nWrote ${SHOTS.length} screenshots to docs/screenshots/`)
} catch (error) {
  console.error('Capture failed:', error.message)
  process.exitCode = 1
} finally {
  socket?.close()
  browser.kill()
  // Chrome keeps writing to its profile for a moment after the signal, so a
  // straight rmSync races it and throws ENOTEMPTY over a run that succeeded.
  await sleep(600)
  try {
    rmSync(profile, { recursive: true, force: true })
  } catch {
    // A leftover temp profile is not worth failing the run over.
  }
}
