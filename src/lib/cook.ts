import type { Item, Recipe } from '../types'
import { unitLabel } from './constants'
import { convert, formatAmount, recipeUnitLabel } from './recipeUnits'

export type CookLine = { name: string; text: string; ok: boolean }

// Works out what is left in the pantry after cooking a number of servings.
// Staples are never subtracted. Returns the new amounts and a line per ingredient explaining what happened.
export function planCooking(recipe: Recipe, servings: number, itemsById: Map<string, Item>) {
  const scale = servings / recipe.servings
  const updates: { item: Item; left: number }[] = []
  const lines: CookLine[] = []

  for (const ing of recipe.ingredients) {
    const item = itemsById.get(ing.item_id)
    if (!item) continue
    const name = item.name
    if (item.is_staple) {
      lines.push({ name, text: 'basvara, dras inte av', ok: true })
      continue
    }
    if (ing.quantity === null || !ing.unit) {
      lines.push({ name, text: 'ingen mängd i receptet – fyll i den under Redigera', ok: false })
      continue
    }
    if (item.quantity === null || !item.unit) {
      lines.push({ name, text: 'ingen mängd i lagret – fyll i den under Översikt', ok: false })
      continue
    }
    if (item.quantity === 0) {
      lines.push({ name, text: 'var redan slut i lagret (0)', ok: false })
      continue
    }
    const used = convert(ing.quantity * scale, ing.unit, item.unit)
    if (used === null) {
      lines.push({ name, text: `kan inte räkna om ${recipeUnitLabel(ing.unit, name)} till ${unitLabel(item.unit, name)}`, ok: false })
      continue
    }
    const left = Math.max(0, Math.round((item.quantity - used) * 100) / 100)
    const unit = unitLabel(item.unit, name)
    lines.push({ name, text: `${formatAmount(item.quantity)} ${unit} → ${formatAmount(left)} ${unit}`, ok: true })
    updates.push({ item, left })
  }

  return { updates, lines }
}
