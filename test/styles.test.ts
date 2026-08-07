import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guards against a class of bug that no other test here can see: a Tailwind
 * utility that does not exist.
 *
 * The charts once labelled their axes with `class="fill-dimmed"`. Nuxt UI's
 * semantic colours are exposed as `text-dimmed`, `text-muted` and friends —
 * custom utilities that set `color`. There is no matching `fill-*` for them,
 * because Tailwind only generates `fill-*` from real `--color-*` theme entries.
 * So the class produced no rule at all, the SVG text fell back to its default
 * `fill: black`, and the labels read as intentional dark grey in light mode and
 * vanished into the background in dark mode.
 *
 * Nothing failed. It typechecked, it linted, every unit test passed, and the
 * page returned 200. Only a dark-mode screenshot showed it.
 *
 * The fix is `fill="currentColor"` alongside `class="text-dimmed"`, which
 * reuses the colour that already flips with the theme.
 */

const SEMANTIC = ['default', 'muted', 'dimmed', 'toned', 'highlighted', 'inverted']

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return walk(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

describe('tailwind utilities that must exist', () => {
  const files = walk(join(process.cwd(), 'app'))

  it('finds components to check', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it.each(SEMANTIC)('no component uses the non-existent fill-%s utility', (name) => {
    const offenders = files.filter(file => new RegExp(`\\bfill-${name}\\b`).test(readFileSync(file, 'utf8')))

    expect(
      offenders,
      `fill-${name} generates no CSS. Use fill="currentColor" with class="text-${name}" instead.`
    ).toEqual([])
  })

  it('svg text elements set an explicit fill', () => {
    // A `<text>` with no fill is black regardless of theme. Every one of them
    // in this template should inherit the themed colour instead.
    const missing: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const [element] of source.matchAll(/<text\b[^>]*>/g)) {
        if (!element.includes('fill=')) missing.push(`${file.split('/app/')[1]}: ${element.slice(0, 60)}`)
      }
    }

    expect(missing).toEqual([])
  })
})
