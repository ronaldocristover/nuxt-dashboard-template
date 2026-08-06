import { z } from 'zod'
import lucide from '@iconify-json/lucide/icons.json'
import simple from '@iconify-json/simple-icons/icons.json'

/**
 * Icon name search, served from the server.
 *
 * The two bundled Iconify sets hold a few thousand names between them. Shipping
 * that list to the browser just to power a search box would cost more than the
 * icons themselves, so the list stays here and only matches cross the wire.
 *
 * Names only — the SVG itself is resolved by Nuxt Icon at render time.
 */

const querySchema = z.object({
  q: z.string().trim().max(60).catch(''),
  set: z.enum(['lucide', 'simple-icons']).catch('lucide'),
  limit: z.coerce.number().int().min(1).max(300).catch(120)
})

/** Built once per process, not per request. */
const CATALOGUE: Record<string, string[]> = {
  'lucide': Object.keys(lucide.icons).sort(),
  'simple-icons': Object.keys(simple.icons).sort()
}

export default defineEventHandler(async (event) => {
  const { q, set, limit } = await getValidatedQuery(event, querySchema.parse)

  const all = CATALOGUE[set] ?? []
  const needle = q.toLowerCase()

  const matches = needle ? all.filter(name => name.includes(needle)) : all

  return {
    set,
    total: all.length,
    matched: matches.length,
    // The cap is what keeps a blank search from rendering 1,800 SVGs at once.
    names: matches.slice(0, limit),
    truncated: matches.length > limit
  }
})
