import type { Item, Recipe } from '../types'
import { statusFor, type Category, type Unit } from './constants'
import { convert } from './recipeUnits'

export type Group = Category | 'staple'

export type ItemEdit = { name: string; group: Group; unit: Unit }

// Works out what changes when an item gets a new name, group or unit.
// - Same kind of unit (ml ↔ dl ↔ l): the amount at home is converted.
// - Another kind (g → st): the amount at home and in recipes is emptied, and those recipes are listed.
// - Staples never have an amount or unit.
export function planItemEdit(item: Item, edit: ItemEdit, recipes: Recipe[]) {
  const isStaple = edit.group === 'staple'
  const unit: Unit | null = isStaple ? null : edit.unit

  let quantity: number | null = null
  if (!isStaple && item.quantity !== null && item.unit) {
    quantity = item.unit === unit ? item.quantity : convert(item.quantity, item.unit, unit!)
    if (quantity !== null) quantity = Math.round(quantity * 100) / 100
  }

  const itemChanges: Partial<Item> = {
    name: edit.name.trim(),
    category: isStaple ? item.category : edit.group as Category,
    is_staple: isStaple,
    unit,
    quantity,
    status: isStaple ? 'in_stock' : statusFor(quantity),
  }

  // Recipe amounts that can't be converted to the new unit are emptied
  const changedRecipes: Recipe[] = []
  for (const recipe of recipes) {
    let changed = false
    const ingredients = recipe.ingredients.map((ing) => {
      if (ing.item_id !== item.id || !unit || !ing.unit) return ing
      if (convert(1, ing.unit, unit) !== null) return ing
      changed = true
      return { ...ing, quantity: null, unit }
    })
    if (changed) changedRecipes.push({ ...recipe, ingredients })
  }

  return { itemChanges, changedRecipes, amountLost: !isStaple && item.quantity !== null && quantity === null }
}

export function recipesUsing(itemId: string, recipes: Recipe[]) {
  return recipes.filter((r) => r.ingredients.some((ing) => ing.item_id === itemId))
}

export function groupOf(item: Item): Group {
  return item.is_staple ? 'staple' : item.category
}
