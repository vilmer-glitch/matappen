import { APP_RECIPES, type AppIngredient, type AppRecipe } from '../data/appRecipes'
import type { Item, Recipe } from '../types'
import { statusFor } from './constants'
import { convert } from './recipeUnits'

// Ingredients the user doesn't have yet get a stand-in item with this id prefix. It counts as
// "out of stock" until the recipe is copied, when a real item is created.
const VIRTUAL_PREFIX = 'app-item:'

export function isVirtualItem(id: string) {
  return id.startsWith(VIRTUAL_PREFIX)
}

// The user's item for an ingredient: same name or an alias, with a unit that can be converted
function findItem(ing: AppIngredient, items: Item[]) {
  const names = [ing.name, ...(ing.aliases ?? [])].map((n) => n.toLowerCase())
  for (const name of names) {
    const item = items.find((i) => i.name.toLowerCase() === name)
    if (!item) continue
    if (item.is_staple || !ing.recipeUnit || !item.unit) return item
    if (convert(1, ing.recipeUnit, item.unit) !== null) return item
  }
  return undefined
}

function virtualItem(ing: AppIngredient): Item {
  const isStaple = ing.group === 'staple'
  return {
    id: VIRTUAL_PREFIX + ing.name.toLowerCase(),
    name: ing.name,
    category: isStaple ? 'pantry' : ing.group === 'staple' ? 'pantry' : ing.group,
    unit: isStaple ? null : (ing.unit ?? null),
    quantity: isStaple ? null : 0,
    status: isStaple ? 'in_stock' : statusFor(0),
    is_staple: isStaple,
    is_default: false,
  }
}

function toRecipe(app: AppRecipe, items: Item[], virtual: Map<string, Item>): Recipe {
  const ingredients = app.ingredients.map((ing) => {
    let item = findItem(ing, items)
    if (!item) {
      item = virtual.get(VIRTUAL_PREFIX + ing.name.toLowerCase()) ?? virtualItem(ing)
      virtual.set(item.id, item)
    }
    return { item_id: item.id, quantity: ing.quantity, unit: ing.recipeUnit }
  })
  // The same item can appear twice (e.g. salt and salt); keep the first
  const unique = ingredients.filter((ing, i) => ingredients.findIndex((x) => x.item_id === ing.item_id) === i)
  return {
    id: `app:${app.key}`,
    name: app.name,
    servings: app.servings,
    instructions: app.instructions,
    link: app.source.url,
    note: app.note ?? null,
    ingredients: unique,
    app_key: app.key,
    isApp: true,
    source: app.source,
    time: app.time,
  }
}

// The user's own recipes plus the app's recipes they haven't made their own version of yet.
// Also returns the item list including stand-ins for ingredients the user doesn't have.
export function withAppRecipes(personal: Recipe[], items: Item[]) {
  const copied = new Set(personal.map((r) => r.app_key).filter(Boolean))
  const virtual = new Map<string, Item>()
  const app = APP_RECIPES.filter((r) => !copied.has(r.key)).map((r) => toRecipe(r, items, virtual))
  return { recipes: [...personal, ...app], items: [...items, ...virtual.values()] }
}

type AddItem = (item: Omit<Item, 'id' | 'is_default'>) => Promise<Item | null>
type SaveRecipe = (draft: Omit<Recipe, 'id'>) => Promise<Recipe | null>

// Makes one of the app's recipes your own: creates the missing items (at 0 at home) and saves a copy.
export async function copyAppRecipe(recipe: Recipe, allItems: Item[], addItem: AddItem, saveRecipe: SaveRecipe) {
  const byId = new Map(allItems.map((i) => [i.id, i]))
  const realIds = new Map<string, string>()

  for (const ing of recipe.ingredients) {
    if (!isVirtualItem(ing.item_id) || realIds.has(ing.item_id)) continue
    const stand = byId.get(ing.item_id)!
    const { id: _id, is_default: _d, ...fields } = stand
    const created = await addItem(fields)
    // If an item with the same name already exists (with another unit), use that one
    const existing = created ?? allItems.find((i) => !isVirtualItem(i.id) && i.name.toLowerCase() === stand.name.toLowerCase())
    if (!existing) return null
    realIds.set(ing.item_id, existing.id)
  }

  return saveRecipe({
    name: recipe.name,
    servings: recipe.servings,
    instructions: recipe.instructions,
    link: recipe.link,
    note: recipe.note,
    app_key: recipe.app_key,
    ingredients: recipe.ingredients.map((ing) => ({ ...ing, item_id: realIds.get(ing.item_id) ?? ing.item_id })),
  })
}
