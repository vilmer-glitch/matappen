import { Check, Minus, Plus, UtensilsCrossed, X } from 'lucide-react'
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
  // Adds a recipe to the plan (copies the app's recipes to your own first)
  onAdd: (recipeId: string) => void
}

// The dishes picked for the coming period
export function WeeklyMeals({ recipes, store, planned, showUndo, openRecipe, onAdd }: Props) {
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const itemsById = new Map(store.items.map((item) => [item.id, item]))
  const meals = planned.meals.filter((m) => recipesById.has(m.recipe_id))
  const toCook = meals.filter((m) => !m.cooked_at)
  const cooked = meals.filter((m) => m.cooked_at)

  function add(recipeId: string) {
    if (recipeId) onAdd(recipeId)
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
      {planned.error && <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{planned.error}</p>}

      {toCook.length === 0 && cooked.length === 0 && (
        <div className="mb-4 flex flex-col items-center rounded-xl bg-surface-2 px-4 py-6 text-center">
          <UtensilsCrossed size={28} className="mb-2 text-faint" />
          <p className="text-sm text-muted">Inga rätter valda än.</p>
          <p className="text-xs text-faint">Tryck + vid en rätt under "Kan lagas nu" eller välj nedan.</p>
        </div>
      )}

      <ul className="space-y-2">
        {toCook.map((meal) => {
          const recipe = recipesById.get(meal.recipe_id)!
          return (
            <li key={meal.id} className="group flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 py-2 pl-3 pr-2">
              <button
                onClick={() => openRecipe(recipe.id)}
                className="min-w-0 flex-1 truncate text-left font-semibold text-ink hover:underline"
              >
                {recipe.name}
              </button>
              <div className="flex items-center rounded-full bg-surface text-xs font-semibold text-muted">
                <button
                  onClick={() => planned.updateMeal(meal.id, { servings: Math.max(1, meal.servings - 1) })}
                  className="rounded-full p-1.5 hover:bg-line"
                  title="Färre portioner"
                >
                  <Minus size={14} />
                </button>
                <span className="w-11 text-center">{meal.servings} port</span>
                <button
                  onClick={() => planned.updateMeal(meal.id, { servings: meal.servings + 1 })}
                  className="rounded-full p-1.5 hover:bg-line"
                  title="Fler portioner"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                onClick={() => markCooked(meal, recipe)}
                title={`Jag lagade ${portionsText(meal.servings)} – drar av från lagret`}
                className="flex items-center gap-1 rounded-full bg-olive-soft px-3 py-1.5 text-xs font-semibold text-olive hover:brightness-95"
              >
                <Check size={14} />
                Lagad
              </button>
              <button
                onClick={() => remove(meal, recipe.name)}
                title="Ta bort"
                className="rounded-full p-1.5 text-faint hover:bg-danger-soft hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              >
                <X size={16} />
              </button>
            </li>
          )
        })}
        {cooked.map((meal) => (
          <li key={meal.id} className="flex items-center gap-2 px-3 py-1 text-sm text-faint">
            <Check size={14} />
            <span className="flex-1 truncate line-through">{recipesById.get(meal.recipe_id)!.name}</span>
            <span className="text-xs">{meal.servings} port</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          className="flex-1 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted"
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
          <button onClick={clearCooked} className="rounded-full px-3 py-2 text-xs font-semibold text-faint hover:bg-surface-2 hover:text-ink">
            Rensa lagade
          </button>
        )}
      </div>
    </div>
  )
}
