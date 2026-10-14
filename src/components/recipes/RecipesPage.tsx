import { useState } from 'react'
import { useItems } from '../../hooks/useItems'
import { useRecipes, type RecipeDraft } from '../../hooks/useRecipes'
import { statusFor, unitLabel } from '../../lib/constants'
import { convert, formatAmount, recipeUnitLabel } from '../../lib/recipeUnits'
import { checkRecipe } from '../../lib/availability'
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

  // Subtracts the ingredients for the cooked servings from the pantry. Staples are never subtracted.
  // Also builds a report so it's clear what happened with each ingredient.
  function cooked(recipe: Recipe, servings: number) {
    const scale = servings / recipe.servings
    const before: { id: string; quantity: number }[] = []
    const lines: CookReport['lines'] = []

    for (const ing of recipe.ingredients) {
      const item = itemsById.get(ing.item_id)
      if (!item) continue
      const name = item.name
      if (item.is_staple) {
        lines.push({ name, text: 'basvara, dras inte av', ok: true })
        continue
      }
      if (ing.quantity === null || !ing.unit) {
        lines.push({ name, text: 'ingen mängd i receptet – fyll i den under Redigera', ok: false })
        continue
      }
      if (item.quantity === null || !item.unit) {
        lines.push({ name, text: 'ingen mängd i lagret – fyll i den under Översikt', ok: false })
        continue
      }
      if (item.quantity === 0) {
        lines.push({ name, text: 'var redan slut i lagret (0)', ok: false })
        continue
      }
      const used = convert(ing.quantity * scale, ing.unit, item.unit)
      if (used === null) {
        lines.push({
          name,
          text: `kan inte räkna om ${recipeUnitLabel(ing.unit)} till ${unitLabel(item.unit)}`,
          ok: false,
        })
        continue
      }
      const left = Math.max(0, Math.round((item.quantity - used) * 100) / 100)
      const unit = unitLabel(item.unit)
      lines.push({ name, text: `${formatAmount(item.quantity)} ${unit} → ${formatAmount(left)} ${unit}`, ok: true })
      before.push({ id: item.id, quantity: item.quantity })
      items.updateItem(item.id, { quantity: left, status: statusFor(left) })
    }

    setReport({ recipeId: recipe.id, servings, lines })
    if (before.length === 0) return

    const portions = `${servings} ${servings === 1 ? 'portion' : 'portioner'}`
    showUndo(`${recipe.name}, ${portions}: ${before.length} varor drogs av`, () => {
      for (const { id, quantity } of before) items.updateItem(id, { quantity, status: statusFor(quantity) })
      setReport(null)
    })
  }

  const errorText = error || items.error

  return (
    <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[18rem_1fr]">
      <aside className="rounded-xl bg-white p-4 shadow lg:self-start">
        <button
          onClick={() => setMode('new')}
          className="mb-3 w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Ny rätt
        </button>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök rätt…"
          className="mb-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
        />
        <div className="mb-3 flex gap-1 text-xs">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-2.5 py-1 ${
                filter === f.value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-stone-400">Hämtar recept…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-stone-400">{recipes.length ? 'Ingen rätt matchar.' : 'Inga rätter än.'}</p>
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
                      ? 'bg-emerald-50 font-medium text-emerald-800'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">{recipe.name}</span>
                  <Badge missing={availability.get(recipe.id)?.missing.length ?? 0} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="rounded-xl bg-white p-6 shadow">
        {errorText && (
          <p className="mb-4 flex justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
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
            <div className="py-16 text-center text-stone-400">
              <p className="mb-2">Du har inga rätter än.</p>
              <button onClick={() => setMode('new')} className="text-emerald-700 hover:underline">
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

// Small label showing whether the recipe can be cooked with what's at home
function Badge({ missing }: { missing: number }) {
  if (missing === 0) return <span className="shrink-0 rounded-full bg-emerald-100 px-2 text-xs text-emerald-800">Kan lagas</span>
  return (
    <span
      className={`shrink-0 rounded-full px-2 text-xs ${missing <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'}`}
    >
      Saknar {missing}
    </span>
  )
}
