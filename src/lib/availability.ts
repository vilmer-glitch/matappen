import type { Item, Recipe } from '../types'
import { convert } from './recipeUnits'

export type Missing = {
  item: Item | undefined
  // How much is missing, in the pantry unit. null when the amount isn't known.
  short: number | null
}

export type Availability = {
  missing: Missing[]
  canCook: boolean
  // Can be cooked if only 1–2 items are bought
  almost: boolean
}

// Compares a recipe (for a number of servings) with what is at home.
export function checkRecipe(recipe: Recipe, itemsById: Map<string, Item>, servings = recipe.servings): Availability {
  const scale = servings / recipe.servings
  const missing: Missing[] = []

  for (const ing of recipe.ingredients) {
    const item = itemsById.get(ing.item_id)
    if (!item) {
      missing.push({ item, short: null })
      continue
    }
    // Staples are always at home, and an unknown amount at home counts as "some"
    if (item.is_staple || item.quantity === null) continue
    if (item.quantity === 0) {
      missing.push({ item, short: needed(ing.quantity, ing.unit, item, scale) })
      continue
    }
    const need = needed(ing.quantity, ing.unit, item, scale)
    // If the amount can't be compared, having some is enough
    if (need !== null && need > item.quantity) {
      missing.push({ item, short: Math.round((need - item.quantity) * 100) / 100 })
    }
  }

  return { missing, canCook: missing.length === 0, almost: missing.length > 0 && missing.length <= 2 }
}

function needed(quantity: number | null, unit: Recipe['ingredients'][number]['unit'], item: Item, scale: number) {
  if (quantity === null || !unit || !item.unit) return null
  const amount = convert(quantity * scale, unit, item.unit)
  // You can't buy half an onion
  return amount !== null && item.unit === 'pcs' ? Math.ceil(amount) : amount
}
