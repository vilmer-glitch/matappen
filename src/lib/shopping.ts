import type { Item, PlannedMeal, Recipe } from '../types'
import { convert } from './recipeUnits'

export type Need = {
  item: Item
  // How much to buy, in the pantry unit. null when the amount isn't known.
  short: number | null
  // Names of the planned dishes that need it
  recipes: string[]
}

// Adds up what all planned (not yet cooked) meals need, compares it with the pantry,
// and returns each item that has to be bought – once per item, even if several dishes need it.
export function shoppingNeeds(meals: PlannedMeal[], recipesById: Map<string, Recipe>, itemsById: Map<string, Item>) {
  const totals = new Map<string, { need: number; unknown: boolean; recipes: Set<string> }>()

  for (const meal of meals) {
    if (meal.cooked_at) continue
    const recipe = recipesById.get(meal.recipe_id)
    if (!recipe) continue
    const scale = meal.servings / recipe.servings

    for (const ing of recipe.ingredients) {
      const item = itemsById.get(ing.item_id)
      if (!item || item.is_staple) continue
      const total = totals.get(item.id) ?? { need: 0, unknown: false, recipes: new Set<string>() }
      const amount = ing.quantity !== null && ing.unit && item.unit ? convert(ing.quantity * scale, ing.unit, item.unit) : null
      if (amount === null) total.unknown = true
      else total.need += amount
      total.recipes.add(recipe.name)
      totals.set(item.id, total)
    }
  }

  const needs: Need[] = []
  for (const [itemId, total] of totals) {
    const item = itemsById.get(itemId)!
    // An unknown amount at home counts as "enough"
    if (item.quantity === null) continue
    let need = total.need
    if (item.unit === 'pcs') need = Math.ceil(need)
    const short = Math.round((need - item.quantity) * 100) / 100
    if (short > 0) {
      needs.push({ item, short, recipes: [...total.recipes] })
    } else if (item.quantity === 0 && total.unknown) {
      // Out of stock and a dish needs some, but we don't know how much
      needs.push({ item, short: null, recipes: [...total.recipes] })
    }
  }
  return needs
}
