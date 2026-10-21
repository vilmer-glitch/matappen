import { useState } from 'react'
import { useItems } from '../../hooks/useItems'
import { useRecipes, type RecipeDraft } from '../../hooks/useRecipes'
import { usePlannedMeals } from '../../hooks/usePlannedMeals'
import { statusFor } from '../../lib/constants'
import { planCooking } from '../../lib/cook'
import { checkRecipe, portionsText, type Availability } from '../../lib/availability'
import type { Recipe } from '../../types'
import type { NewItem } from '../pantry/AddItemSearch'
import { RecipeForm } from './RecipeForm'
import { RecipeView, type CookReport } from './RecipeView'

type Props = {
  showUndo: (message: string, undo: () => void) => void
  recipeId: string | null
  onSelect: (id: string | null) => void
}

export function RecipesPage({ showUndo, recipeId, onSelect }: Props) {
  const items = useItems()
  const planned = usePlannedMeals()
  const { recipes, loading, error, clearError, saveRecipe, removeRecipe, restoreRecipe } = useRecipes()
  const [mode, setMode] = useState<'view' | 'edit' | 'new'>('view')
  const [search, setSearch] = useState('')
  const [report, setReport] = useState<CookReport | null>(null)
  const [filter, setFilter] = useState<'all' | 'ready' | 'almost'>('all')

  const itemsById = new Map(items.items.map((item) => [item.id, item]))
  const availability = new Map(recipes.map((r) => [r.id, checkRecipe(r, itemsById)]))
  const sorted = [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  const shown = sorted.filter((r) => {
    const status = availability.get(r.id)
    if (filter === 'ready' && !status?.canCook) return false
    if (filter === 'almost' && !status?.almost) return false
    return r.name.toLowerCase().includes(search.trim().toLowerCase())
  })
  // Show the first recipe until one is picked
  const selected = recipes.find((r) => r.id === recipeId) ?? (mode !== 'new' ? sorted[0] : undefined)

  // Items created from a recipe start at 0 at home, so they end up on the shopping list later
  async function createItem({ name, group, unit }: NewItem) {
    const isStaple = group === 'staple'
    return items.addItem({
      name,
      category: isStaple ? 'pantry' : group,
      is_staple: isStaple,
      unit: isStaple ? null : unit,
      quantity: isStaple ? null : 0,
      status: isStaple ? 'in_stock' : statusFor(0),
    })
  }

  async function save(draft: RecipeDraft) {
    const saved = await saveRecipe(draft, mode === 'edit' ? selected?.id : undefined)
    if (saved) {
      onSelect(saved.id)
      setMode('view')
    }
  }

  function remove(recipe: Recipe) {
    removeRecipe(recipe.id)
    onSelect(null)
    showUndo(`${recipe.name} togs bort`, () => {
      restoreRecipe(recipe)
      onSelect(recipe.id)
    })
  }

  // Subtracts the ingredients for the cooked servings from the pantry, and marks the dish
  // as cooked in Veckans rätter if it was planned. Shows a report of what happened.
  function cooked(recipe: Recipe, servings: number) {
    const { updates, lines } = planCooking(recipe, servings, itemsById)
    for (const { item, left } of updates) items.updateItem(item.id, { quantity: left, status: statusFor(left) })
    const meal = planned.meals.find((m) => m.recipe_id === recipe.id && !m.cooked_at)
    if (meal) planned.updateMeal(meal.id, { cooked_at: new Date().toISOString() })

    setReport({ recipeId: recipe.id, servings, lines })
    if (updates.length === 0 && !meal) return

    showUndo(`${recipe.name}, ${portionsText(servings)}: ${updates.length} varor drogs av`, () => {
      for (const { item } of updates) items.updateItem(item.id, { quantity: item.quantity, status: item.status })
      if (meal) planned.updateMeal(meal.id, { cooked_at: null })
      setReport(null)
    })
  }

  const errorText = error || items.error

  return (
    <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[18rem_1fr]">
      <aside className="rounded-xl bg-surface p-4 shadow lg:self-start">
        <button
          onClick={() => setMode('new')}
          className="mb-3 w-full rounded-md bg-accent py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          + Ny rätt
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök rätt…"
          className="mb-3 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <div className="mb-3 flex gap-1 text-xs">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-2.5 py-1 ${
                filter === f.value ? 'bg-ink text-bg' : 'bg-surface-2 text-muted hover:bg-line'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-faint">Hämtar recept…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-faint">{recipes.length ? 'Ingen rätt matchar.' : 'Inga rätter än.'}</p>
        ) : (
          <ul className="space-y-0.5">
            {shown.map((recipe) => (
              <li key={recipe.id}>
                <button
                  onClick={() => {
                    onSelect(recipe.id)
                    setMode('view')
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    mode !== 'new' && selected?.id === recipe.id
                      ? 'bg-accent-soft font-medium text-accent-strong'
                      : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  <span className="truncate">{recipe.name}</span>
                  <Badge status={availability.get(recipe.id)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="rounded-xl bg-surface p-6 shadow">
        {errorText && (
          <p className="mb-4 flex justify-between rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {errorText}
            <button
              onClick={() => {
                clearError()
                items.clearError()
              }}
            >
              ×
            </button>
          </p>
        )}

        {mode === 'new' || (mode === 'edit' && selected) ? (
          <RecipeForm
            key={mode === 'new' ? 'new' : selected?.id}
            recipe={mode === 'edit' ? (selected ?? null) : null}
            items={items.items}
            onCreateItem={createItem}
            onSave={save}
            onCancel={() => setMode('view')}
          />
        ) : selected ? (
          <RecipeView
            key={selected.id}
            recipe={selected}
            itemsById={itemsById}
            onEdit={() => setMode('edit')}
            onDelete={() => remove(selected)}
            onCooked={(servings) => cooked(selected, servings)}
            report={report?.recipeId === selected.id ? report : null}
            onCloseReport={() => setReport(null)}
          />
        ) : (
          !loading && (
            <div className="py-16 text-center text-faint">
              <p className="mb-2">Du har inga rätter än.</p>
              <button onClick={() => setMode('new')} className="text-accent-strong hover:underline">
                Lägg till din första rätt
              </button>
            </div>
          )
        )}
      </section>
    </main>
  )
}

const filters = [
  { value: 'all', label: 'Alla' },
  { value: 'ready', label: 'Kan lagas' },
  { value: 'almost', label: 'Saknar 1–2' },
] as const

// Small label showing whether the recipe can be cooked with what's at home, and how many servings
function Badge({ status }: { status: Availability | undefined }) {
  if (!status) return null
  if (status.canCook) {
    return (
      <span className="shrink-0 rounded-full bg-olive-soft px-2 text-xs font-semibold text-olive">
        {status.maxServings === null ? 'Kan lagas' : `${status.maxServings} port`}
      </span>
    )
  }
  return (
    <span
      className={`shrink-0 rounded-full px-2 text-xs ${status.almost ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted'}`}
    >
      Saknar {status.missing.length}
    </span>
  )
}
