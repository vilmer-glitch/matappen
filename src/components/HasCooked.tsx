import { ChefHat, History } from 'lucide-react'
import type { PlannedMealsStore } from '../hooks/usePlannedMeals'
import { portionsText } from '../lib/availability'
import type { PlannedMeal, Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  planned: PlannedMealsStore
  onCook: () => void
  showUndo: (message: string, undo: () => void) => void
}

const HISTORY_DAYS = 14

// "Har lagat": the button for logging a cooked dish, and what was cooked lately
export function HasCooked({ recipes, planned, onCook, showUndo }: Props) {
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const since = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000
  const cooked = planned.meals
    .filter((m) => m.cooked_at && recipesById.has(m.recipe_id))
    .sort((a, b) => b.cooked_at!.localeCompare(a.cooked_at!))
  const recent = cooked.filter((m) => new Date(m.cooked_at!).getTime() >= since)

  function clear() {
    planned.removeMeals(cooked.map((m) => m.id))
    showUndo('Historiken rensades', () => planned.restoreMeals(cooked))
  }

  return (
    <div>
      <button
        onClick={onCook}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-strong"
      >
        <ChefHat size={18} />
        Jag har lagat …
      </button>
      <p className="mt-2 text-center text-xs text-faint">Drar av ingredienserna från lagret.</p>

      {recent.length > 0 && (
        <section className="mt-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-muted">
              <History size={16} className="text-accent" />
              Senast lagat
            </h3>
            <button onClick={clear} className="rounded-full px-2 py-1 text-xs font-semibold text-faint hover:bg-surface-2 hover:text-ink">
              Rensa
            </button>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((meal) => (
              <li key={meal.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">{recipesById.get(meal.recipe_id)!.name}</span>
                <span className="text-xs text-faint">
                  {portionsText(meal.servings)} · {when(meal)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function when(meal: PlannedMeal) {
  const day = new Date(meal.cooked_at!)
  const today = new Date()
  const daysAgo = Math.round((startOfDay(today) - startOfDay(day)) / (24 * 60 * 60 * 1000))
  if (daysAgo === 0) return 'idag'
  if (daysAgo === 1) return 'igår'
  return day.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
