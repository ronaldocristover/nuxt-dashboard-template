#!/usr/bin/env node
/**
 * Renders scripts/og/card.html to public/og.png at 1200×630.
 *
 * Social platforms want a raster image — an SVG `og:image` is ignored by
 * Twitter, Slack and LinkedIn alike — so the card is authored in HTML and
 * printed by headless Chrome. That keeps it editable in the same language as
 * the rest of the template, and it uses the real fonts from node_modules so
 * the card cannot drift from the product's own typography.
 *
 * Run with `npm run og`. Chrome is the only requirement; the checked-in PNG
 * means nobody needs it to build or deploy.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'public', 'og.png')

/** Chrome ships under a few names depending on the platform. */
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
  console.error('public/og.png is checked in, so this is only needed to regenerate it.')
  process.exit(1)
}

const FONTS = {
  __BRICOLAGE__: 'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
  __PLEX_SANS__: 'node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2',
  __PLEX_MONO__: 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'
}

let html = readFileSync(join(ROOT, 'scripts', 'og', 'card.html'), 'utf8')
for (const [token, relative] of Object.entries(FONTS)) {
  const absolute = resolve(ROOT, relative)
  if (!existsSync(absolute)) {
    console.error(`Missing font: ${relative}. Run npm install first.`)
    process.exit(1)
  }
  html = html.replace(token, `file://${absolute}`)
}

// Chrome writes the screenshot beside the page, so both go to a scratch dir.
const scratch = mkdtempSync(join(tmpdir(), 'cadence-og-'))
const page = join(scratch, 'card.html')
const shot = join(scratch, 'og.png')
writeFileSync(page, html)

try {
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    `--screenshot=${shot}`,
    // Fonts load from file://, which a file:// page may not reach otherwise.
    '--allow-file-access-from-files',
    // Give the webfonts a moment; a card rendered in a fallback face is worse
    // than no card at all.
    '--virtual-time-budget=4000',
    `file://${page}`
  ], { stdio: 'pipe' })

  if (!existsSync(shot)) throw new Error('Chrome produced no screenshot')
  copyFileSync(shot, OUT)

  const { size } = await import('node:fs').then(fs => fs.statSync(OUT))
  console.log(`✔ public/og.png — 1200×630, ${(size / 1024).toFixed(0)} KB`)
} catch (error) {
  console.error('Render failed:', error.message)
  process.exit(1)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
