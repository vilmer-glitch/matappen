import { portionsText } from '../lib/availability'
import { statusFor } from '../lib/constants'
import { planCooking } from '../lib/cook'
import type { ItemsStore } from '../hooks/useItems'
import type { PlannedMealsStore } from '../hooks/usePlannedMeals'
import type { PlannedMeal, Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  store: ItemsStore
  planned: PlannedMealsStore
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
}

// The dishes picked for the coming period
export function WeeklyMeals({ recipes, store, planned, showUndo, openRecipe }: Props) {
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const itemsById = new Map(store.items.map((item) => [item.id, item]))
  const meals = planned.meals.filter((m) => recipesById.has(m.recipe_id))
  const toCook = meals.filter((m) => !m.cooked_at)
  const cooked = meals.filter((m) => m.cooked_at)

  async function add(recipeId: string) {
    const recipe = recipesById.get(recipeId)
    if (!recipe) return
    const meal = await planned.addMeal(recipe.id, recipe.servings)
    if (meal) showUndo(`${recipe.name} lades till`, () => planned.removeMeals([meal.id]))
  }

  function remove(meal: PlannedMeal, name: string) {
    planned.removeMeals([meal.id])
    showUndo(`${name} togs bort`, () => planned.restoreMeals([meal]))
  }

  // Same as "Jag lagade" on the recipe page, for the planned number of servings
  function markCooked(meal: PlannedMeal, recipe: Recipe) {
    const { updates } = planCooking(recipe, meal.servings, itemsById)
    for (const { item, left } of updates) store.updateItem(item.id, { quantity: left, status: statusFor(left) })
    planned.updateMeal(meal.id, { cooked_at: new Date().toISOString() })
    showUndo(`${recipe.name} lagad: ${updates.length} varor drogs av`, () => {
      for (const { item } of updates) store.updateItem(item.id, { quantity: item.quantity, status: item.status })
      planned.updateMeal(meal.id, { cooked_at: null })
    })
  }

  function clearCooked() {
    planned.removeMeals(cooked.map((m) => m.id))
    showUndo(`${cooked.length} lagade rätter rensades`, () => planned.restoreMeals(cooked))
  }

  if (planned.loading) return <p className="text-sm text-faint">Hämtar veckans rätter…</p>

  return (
    <div>
      {planned.error && <p className="mb-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{planned.error}</p>}

      {toCook.length === 0 && cooked.length === 0 && (
        <p className="mb-3 text-sm text-faint">Inga rätter valda. Välj bland förslagen nedan eller i listan.</p>
      )}

      <ul className="divide-y divide-line">
        {toCook.map((meal) => {
          const recipe = recipesById.get(meal.recipe_id)!
          return (
            <li key={meal.id} className="group flex items-center gap-2 py-1.5">
              <button onClick={() => openRecipe(recipe.id)} className="min-w-0 flex-1 truncate text-left text-ink hover:underline">
                {recipe.name}
              </button>
              <div className="flex items-center rounded-md border border-line text-xs text-muted">
                <button
                  onClick={() => planned.updateMeal(meal.id, { servings: Math.max(1, meal.servings - 1) })}
                  className="px-1.5 py-0.5 hover:bg-surface-2"
                  title="Färre portioner"
                >
                  −
                </button>
                <span className="w-12 text-center">{meal.servings} port</span>
                <button
                  onClick={() => planned.updateMeal(meal.id, { servings: meal.servings + 1 })}
                  className="px-1.5 py-0.5 hover:bg-surface-2"
                  title="Fler portioner"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => markCooked(meal, recipe)}
                title={`Jag lagade ${portionsText(meal.servings)} – drar av från lagret`}
                className="rounded-md border border-accent px-2 py-0.5 text-xs text-accent-strong hover:bg-accent-soft"
              >
                Lagad
              </button>
              <button
                onClick={() => remove(meal, recipe.name)}
                title="Ta bort"
                className="px-1 text-faint hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              >
                ×
              </button>
            </li>
          )
        })}
        {cooked.map((meal) => (
          <li key={meal.id} className="flex items-center gap-2 py-1.5 text-faint">
            <span className="flex-1 truncate line-through">{recipesById.get(meal.recipe_id)!.name}</span>
            <span className="text-xs">{meal.servings} port · lagad</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between gap-2">
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className="flex-1 rounded-md border border-line px-2 py-1.5 text-sm text-muted"
        >
          <option value="">+ Lägg till rätt…</option>
          {[...recipes]
            .sort((a, b) => a.name.localeCompare(b.name, 'sv'))
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
        </select>
        {cooked.length > 0 && (
          <button onClick={clearCooked} className="text-xs text-faint hover:text-ink">
            Rensa lagade
          </button>
        )}
      </div>
    </div>
  )
}
