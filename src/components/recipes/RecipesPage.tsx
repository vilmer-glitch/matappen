import { useState } from 'react'
import { BookOpen, ChevronLeft, Plus, Search } from 'lucide-react'
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
  // On a phone either the list or one recipe is shown; on a computer both side by side
  const showingDetail = recipeId !== null || mode !== 'view'

  function backToList() {
    setMode('view')
    onSelect(null)
  }

  return (
    <main className="mx-auto grid max-w-2xl grid-cols-1 gap-5 p-4 lg:max-w-[1300px] lg:grid-cols-[20rem_1fr] lg:p-6">
      <aside
        className={`rounded-2xl border border-line bg-surface p-4 shadow-sm lg:sticky lg:top-20 lg:block lg:self-start ${
          showingDetail ? 'hidden' : ''
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <BookOpen size={20} className="text-accent" />
            Recept
          </h2>
          <button
            onClick={() => setMode('new')}
            className="flex items-center gap-1 rounded-full bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong"
          >
            <Plus size={16} />
            Ny rätt
          </button>
        </div>
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök rätt…"
            className="w-full rounded-full border border-line bg-surface-2 py-2.5 pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
        <div className="mb-3 flex gap-1 text-xs font-semibold">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 ${
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
          <p className="px-1 py-2 text-sm text-faint">{recipes.length ? 'Ingen rätt matchar.' : 'Inga rätter än.'}</p>
        ) : (
          <ul className="space-y-0.5">
            {shown.map((recipe) => (
              <li key={recipe.id}>
                <button
                  onClick={() => {
                    onSelect(recipe.id)
                    setMode('view')
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left font-semibold ${
                    mode !== 'new' && selected?.id === recipe.id
                      ? 'lg:bg-accent-soft lg:text-accent-strong'
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

      <section
        className={`rounded-2xl border border-line bg-surface p-5 shadow-sm lg:block lg:p-8 ${showingDetail ? '' : 'hidden'}`}
      >
        <button
          onClick={backToList}
          className="-ml-1 mb-4 flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2 lg:hidden"
        >
          <ChevronLeft size={18} />
          Alla recept
        </button>
        {errorText && (
          <p className="mb-4 flex justify-between rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
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
            onCancel={() => (mode === 'new' && !recipeId ? backToList() : setMode('view'))}
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
            <div className="flex flex-col items-center py-16 text-center">
              <BookOpen size={32} className="mb-3 text-faint" />
              <p className="mb-3 text-muted">Du har inga rätter än.</p>
              <button
                onClick={() => setMode('new')}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong"
              >
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
      <span className="shrink-0 rounded-full bg-olive-soft px-2 py-0.5 text-xs font-semibold text-olive">
        {status.maxServings === null ? 'Kan lagas' : `${status.maxServings} port`}
      </span>
    )
  }
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.almost ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted'}`}
    >
      Saknar {status.missing.length}
    </span>
  )
}
