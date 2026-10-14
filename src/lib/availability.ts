import type { Item, Recipe } from '../types'
import { convert } from './recipeUnits'

export type Missing = {
  item: Item | undefined
  // How much is missing, in the pantry unit. null when the amount isn't known.
  short: number | null
}

export type Availability = {
  // What is missing for the checked number of servings
  missing: Missing[]
  // How many whole servings can be cooked with what's at home. null = no limit (amounts aren't known).
  maxServings: number | null
  // At least one serving can be cooked
  canCook: boolean
  // Can't be cooked now, but only 1–2 items need to be bought
  almost: boolean
}

// Compares a recipe with what is at home.
export function checkRecipe(recipe: Recipe, itemsById: Map<string, Item>, servings = recipe.servings): Availability {
  const scale = servings / recipe.servings
  const missing: Missing[] = []
  let maxServings: number | null = null

  for (const ing of recipe.ingredients) {
    const item = itemsById.get(ing.item_id)
    if (!item) {
      missing.push({ item, short: null })
      maxServings = 0
      continue
    }
    // Staples are always at home, and an unknown amount at home counts as "some"
    if (item.is_staple || item.quantity === null) continue

    const perServing = amountInPantryUnit(ing.quantity, ing.unit, item, 1 / recipe.servings)
    if (item.quantity === 0) {
      missing.push({ item, short: needed(ing.quantity, ing.unit, item, scale) })
      maxServings = 0
      continue
    }
    // If the amount can't be compared, having some is enough
    if (perServing === null || perServing === 0) continue

    // Small margin so 0.999… from rounding still counts as a whole serving
    const possible = Math.floor(item.quantity / perServing + 1e-9)
    maxServings = maxServings === null ? possible : Math.min(maxServings, possible)

    const need = needed(ing.quantity, ing.unit, item, scale)
    if (need !== null && need > item.quantity) {
      missing.push({ item, short: Math.round((need - item.quantity) * 100) / 100 })
    }
  }

  const canCook = maxServings === null || maxServings >= 1
  return { missing, maxServings, canCook, almost: !canCook && missing.length <= 2 }
}

function amountInPantryUnit(quantity: number | null, unit: Recipe['ingredients'][number]['unit'], item: Item, scale: number) {
  if (quantity === null || !unit || !item.unit) return null
  return convert(quantity * scale, unit, item.unit)
}

function needed(quantity: number | null, unit: Recipe['ingredients'][number]['unit'], item: Item, scale: number) {
  const amount = amountInPantryUnit(quantity, unit, item, scale)
  // You can't buy half an onion
  return amount !== null && item.unit === 'pcs' ? Math.ceil(amount) : amount
}

export function portionsText(count: number) {
  return `${count} ${count === 1 ? 'portion' : 'portioner'}`
}
