import { useState } from 'react'
import { ChevronLeft, CircleCheck, Minus, Plus, Search, TriangleAlert } from 'lucide-react'
import { portionsText } from '../lib/availability'
import { planCooking } from '../lib/cook'
import { normalize } from '../lib/search'
import type { Item, PlannedMeal, Recipe } from '../types'
import { AppBadge } from './AppBadge'
import { Sheet } from './Sheet'

export type CookChoice = { recipe: Recipe; servings: number; mealId: string | null }

type Props = {
  recipes: Recipe[]
  planned: PlannedMeal[]
  itemsById: Map<string, Item>
  // Opened from a planned dish: that dish is already chosen
  start?: { recipeId: string; mealId: string | null; servings: number }
  onConfirm: (choice: CookChoice) => void
  onClose: () => void
}

// "Jag har lagat …": pick the dish and servings, see what is subtracted from the pantry, then confirm
export function CookSheet({ recipes, planned, itemsById, start, onConfirm, onClose }: Props) {
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const [choice, setChoice] = useState<{ recipeId: string; mealId: string | null; servings: number } | null>(start ?? null)
  const [search, setSearch] = useState('')

  const recipe = choice ? recipesById.get(choice.recipeId) : undefined

  if (!choice || !recipe) {
    const q = normalize(search)
    const toCook = planned.filter((m) => !m.cooked_at && recipesById.has(m.recipe_id))
    const all = [...recipes]
      .filter((r) => !q || normalize(r.name).includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

    return (
      <Sheet title="Jag har lagat …" onClose={onClose}>
        {toCook.length > 0 && !q && (
          <section className="mb-5">
            <h3 className="mb-2 text-sm font-semibold text-muted">Från Att laga</h3>
            <ul className="space-y-2">
              {toCook.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setChoice({ recipeId: m.recipe_id, mealId: m.id, servings: m.servings })}
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-left hover:border-accent"
                  >
                    <span className="font-semibold text-ink">{recipesById.get(m.recipe_id)!.name}</span>
                    <span className="text-xs text-muted">{portionsText(m.servings)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h3 className="mb-2 text-sm font-semibold text-muted">Alla recept</h3>
        <div className="relative mb-2">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök rätt…"
            className="w-full rounded-full border border-line bg-surface-2 py-2.5 pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
        <ul className="divide-y divide-line">
          {all.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setChoice({ recipeId: r.id, mealId: null, servings: r.servings })}
                className="flex min-h-11 w-full items-center py-2 text-left font-semibold text-ink hover:text-accent-strong"
              >
                {r.name}
                {r.isApp && <AppBadge />}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    )
  }

  const { lines, updates } = planCooking(recipe, choice.servings, itemsById)
  const setServings = (servings: number) => setChoice({ ...choice, servings: Math.max(1, servings) })

  return (
    <Sheet
      title="Jag har lagat …"
      onClose={onClose}
      confirmLabel={updates.length ? 'Dra av från lagret' : 'Markera som lagad'}
      onConfirm={() => onConfirm({ recipe, servings: choice.servings, mealId: choice.mealId })}
    >
      {!start && (
        <button
          onClick={() => setChoice(null)}
          className="-ml-1 mb-2 flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          <ChevronLeft size={16} />
          Byt rätt
        </button>
      )}
      <p className="font-display text-2xl font-semibold text-ink">
        {recipe.name}
        {recipe.isApp && <AppBadge large />}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm font-semibold text-muted">Portioner</span>
        <div className="flex items-center rounded-full bg-surface-2 text-sm font-semibold text-ink">
          <button onClick={() => setServings(choice.servings - 1)} className="rounded-full p-2 hover:bg-line" title="Färre portioner">
            <Minus size={15} />
          </button>
          <span className="min-w-24 text-center">{portionsText(choice.servings)}</span>
          <button onClick={() => setServings(choice.servings + 1)} className="rounded-full p-2 hover:bg-line" title="Fler portioner">
            <Plus size={15} />
          </button>
        </div>
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold text-muted">Så här ändras lagret</h3>
      <ul className="space-y-1.5 text-sm">
        {lines.map((line) => (
          <li key={line.name} className="flex gap-2">
            {line.ok ? (
              <CircleCheck size={16} className="mt-0.5 shrink-0 text-olive" />
            ) : (
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" />
            )}
            <span className="font-semibold text-ink">{line.name}</span>
            <span className={line.ok ? 'text-muted' : 'text-warn'}>{line.text}</span>
          </li>
        ))}
      </ul>
      {recipe.isApp && !choice.mealId && (
        <p className="mt-3 text-xs text-faint">Rätten sparas också bland dina recept.</p>
      )}
    </Sheet>
  )
}
