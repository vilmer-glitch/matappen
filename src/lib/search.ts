import { CATALOG, stepFor, type CatalogItem } from '../data/catalog'
import type { Item } from '../types'

// Lowercase and without accents, so "Tomatpuré", "tomatpure" and "TOMATPURÉ" are the same.
// å, ä and ö are kept, since they are separate letters in Swedish.
export function normalize(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[éèêë]/g, 'e')
    .replace(/[áàâ]/g, 'a')
    .replace(/[íìî]/g, 'i')
    .replace(/[óòô]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[’'`´]/g, '')
    .replace(/\s+/g, ' ')
}

// How many letters have to change to turn a into b (Levenshtein distance)
function distance(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return prev[b.length]
}

// Small typos are allowed: one letter for short words, two for longer ones
function allowedTypos(length: number) {
  return length < 4 ? 0 : length < 8 ? 1 : 2
}

// A typo in the whole name, or in the beginning of it while you're still typing ("krosade tom")
function isClose(query: string, name: string) {
  const allowed = allowedTypos(query.length)
  if (allowed === 0) return false
  if (distance(query, name) <= allowed) return true
  for (let length = query.length - 1; length <= query.length + 1; length++) {
    if (length > 0 && length < name.length && distance(query, name.slice(0, length)) <= allowed) return true
  }
  return false
}

// 0 = exact, 1 = starts with, 2 = contains, 3 = close (typo), +0.5 for another name, null = no match
function score(query: string, names: string[]) {
  let best: number | null = null
  for (const [index, raw] of names.entries()) {
    const name = normalize(raw)
    let s: number | null = null
    if (name === query) s = 0
    else if (name.startsWith(query) || name.split(' ').some((word) => word.startsWith(query))) s = 1
    else if (query.length >= 4 && name.includes(query)) s = 2
    else if (isClose(query, name)) s = 3
    // A match on the main name ranks above a match on another name
    if (s !== null && index > 0) s += 0.5
    if (s !== null && (best === null || s < best)) best = s
  }
  return best
}

export type Suggestion =
  | { kind: 'own'; item: Item; score: number }
  | { kind: 'catalog'; entry: CatalogItem; score: number }

// The catalog entry for an item name (by name or alias), if the app knows it
export function catalogEntryFor(name: string) {
  const n = normalize(name)
  return CATALOG.find((c) => normalize(c.name) === n || c.aliases.some((a) => normalize(a) === n))
}

// Suggestions while typing: your own items first, then the app's catalog items you don't have yet.
export function suggest(query: string, items: Item[], limit = 8): Suggestion[] {
  const q = normalize(query)
  if (!q) return []

  const own: Suggestion[] = []
  for (const item of items) {
    const entry = catalogEntryFor(item.name)
    const s = score(q, entry ? [item.name, entry.name, ...entry.aliases] : [item.name])
    if (s !== null) own.push({ kind: 'own', item, score: s })
  }

  // Leave out catalog items you already have (under their name or an alias)
  const haveNames = new Set(items.map((i) => normalize(i.name)))
  const catalog: Suggestion[] = []
  for (const entry of CATALOG) {
    const names = [entry.name, ...entry.aliases]
    if (names.some((n) => haveNames.has(normalize(n)))) continue
    const s = score(q, names)
    if (s !== null) catalog.push({ kind: 'catalog', entry, score: s })
  }

  const byScore = (a: Suggestion, b: Suggestion) => a.score - b.score
  return [...own.sort(byScore), ...catalog.sort(byScore)].slice(0, limit)
}

// How much + and − change an item's amount
export function itemStep(name: string, unit: Item['unit']) {
  return stepFor(catalogEntryFor(name)?.name, unit)
}
