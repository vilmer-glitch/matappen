import { Check, Minus, Plus, UtensilsCrossed, X } from 'lucide-react'
import type { PlannedMealsStore } from '../hooks/usePlannedMeals'
import type { PlannedMeal, Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  planned: PlannedMealsStore
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
  // Opens the confirmation for adding a dish
  onAdd: (recipeId: string) => void
  // Opens "Jag har lagat …" for a planned dish
  onCook: (meal: PlannedMeal) => void
}

// "Att laga": the dishes you want to cook. What they need ends up on the shopping list.
export function WeeklyMeals({ recipes, planned, showUndo, openRecipe, onAdd, onCook }: Props) {
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const toCook = planned.meals.filter((m) => !m.cooked_at && recipesById.has(m.recipe_id))

  function remove(meal: PlannedMeal, name: string) {
    planned.removeMeals([meal.id])
    showUndo(`${name} togs bort`, () => planned.restoreMeals([meal]))
  }

  if (planned.loading) return <p className="text-sm text-faint">Hämtar rätter…</p>

  return (
    <div>
      {planned.error && <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{planned.error}</p>}

      {toCook.length === 0 && (
        <div className="mb-4 flex flex-col items-center rounded-xl bg-surface-2 px-4 py-6 text-center">
          <UtensilsCrossed size={28} className="mb-2 text-faint" />
          <p className="text-sm text-muted">Inga rätter valda än.</p>
          <p className="text-xs text-faint">Välj nedan eller tryck + vid en rätt under "Kan lagas nu".</p>
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
                onClick={() => onCook(meal)}
                title="Jag har lagat den här"
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
      </ul>

      <select
        value=""
        onChange={(e) => e.target.value && onAdd(e.target.value)}
        className="mt-3 w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted"
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
    </div>
  )
}
