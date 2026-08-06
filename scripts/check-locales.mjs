#!/usr/bin/env node
/**
 * Compares every locale file against `en.json`, which is the source of truth.
 *
 * Catches the two failures that survive typechecking: a key added to English
 * and forgotten elsewhere, and a stale key left behind after a rename. Both
 * show up in the interface as English text where a translation should be, or
 * as dead weight in the bundle.
 *
 * Run with `npm run i18n:check`. Exits non-zero so CI can gate on it.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'i18n', 'locales')
const BASE = 'en.json'

/** Flattens nested messages to dotted paths, so ordering never matters. */
function flatten(object, prefix = '') {
  const keys = new Set()
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of flatten(value, path)) keys.add(nested)
    } else {
      keys.add(path)
    }
  }
  return keys
}

/** `{name}` placeholders must match, or an interpolation renders literally. */
function placeholders(value) {
  return new Set([...String(value).matchAll(/\{(\w+)\}/g)].map(match => match[1]))
}

function lookup(object, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), object)
}

const base = JSON.parse(readFileSync(join(DIR, BASE), 'utf8'))
const baseKeys = flatten(base)

const others = readdirSync(DIR).filter(file => file.endsWith('.json') && file !== BASE)

let failed = false

for (const file of others) {
  const locale = JSON.parse(readFileSync(join(DIR, file), 'utf8'))
  const keys = flatten(locale)

  const missing = [...baseKeys].filter(key => !keys.has(key))
  const extra = [...keys].filter(key => !baseKeys.has(key))

  const mismatched = [...baseKeys]
    .filter(key => keys.has(key))
    .filter((key) => {
      const wanted = placeholders(lookup(base, key))
      const got = placeholders(lookup(locale, key))
      return wanted.size !== got.size || [...wanted].some(name => !got.has(name))
    })

  const problems = missing.length + extra.length + mismatched.length

  if (problems === 0) {
    console.log(`✔ ${file.padEnd(14)} ${keys.size} keys`)
    continue
  }

  failed = true
  console.error(`✖ ${file}`)
  if (missing.length) console.error(`   missing (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`)
  if (extra.length) console.error(`   unknown (${extra.length}): ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ' …' : ''}`)
  if (mismatched.length) console.error(`   placeholder mismatch (${mismatched.length}): ${mismatched.slice(0, 10).join(', ')}`)
}

if (failed) {
  console.error('\nLocale files are out of sync with en.json.')
  process.exit(1)
}

console.log(`\nAll ${others.length + 1} locale files agree with ${BASE}.`)
