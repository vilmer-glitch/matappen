import { checkRecipe, portionsText, type Missing } from '../lib/availability'
import { unitLabel } from '../lib/constants'
import { formatAmount } from '../lib/recipeUnits'
import type { Item, Recipe } from '../types'

type Props = {
  recipes: Recipe[]
  items: Item[]
  loading: boolean
  openRecipe: (id: string) => void
  // Recipes already in Veckans rätter, and how to add one
  plannedIds: Set<string>
  onPlan: (recipeId: string) => void
}

// "Vad kan jag laga?": recipes that can be cooked now, and those missing only 1–2 items
export function CanCook({ recipes, items, loading, openRecipe, plannedIds, onPlan }: Props) {
  if (loading) return <p className="text-sm text-faint">Hämtar recept…</p>
  if (recipes.length === 0) return <p className="text-sm text-faint">Lägg till rätter under Recept först.</p>

  const itemsById = new Map(items.map((item) => [item.id, item]))
  const checked = recipes
    .map((recipe) => ({ recipe, ...checkRecipe(recipe, itemsById) }))
    .sort((a, b) => a.recipe.name.localeCompare(b.recipe.name, 'sv'))
  const ready = checked.filter((r) => r.canCook)
  const almost = checked.filter((r) => r.almost).sort((a, b) => a.missing.length - b.missing.length)

  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Kan lagas nu ({ready.length})</h3>
        {ready.length === 0 ? (
          <p className="py-1.5 text-sm text-faint">Ingen rätt just nu.</p>
        ) : (
          <ul>
            {ready.map(({ recipe, maxServings }) => (
              <li key={recipe.id} className="flex items-center gap-1">
                <button
                  onClick={() => openRecipe(recipe.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-olive" />
                  <span className="flex-1 text-ink">{recipe.name}</span>
                  {maxServings !== null && (
                    <span className="text-xs text-muted" title="Så många portioner räcker det du har hemma till">
                      {portionsText(maxServings)}
                    </span>
                  )}
                </button>
                <PlanButton planned={plannedIds.has(recipe.id)} onPlan={() => onPlan(recipe.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-faint">Saknar 1–2 varor ({almost.length})</h3>
        {almost.length === 0 ? (
          <p className="py-1.5 text-sm text-faint">Ingen rätt just nu.</p>
        ) : (
          <ul>
            {almost.map(({ recipe, missing }) => (
              <li key={recipe.id} className="flex items-start gap-1">
                <button
                  onClick={() => openRecipe(recipe.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-warn" />
                  <span>
                    <span className="block text-ink">{recipe.name}</span>
                    <span className="block text-xs text-muted">Saknar {missing.map(describeMissing).join(', ')}</span>
                  </span>
                </button>
                <PlanButton planned={plannedIds.has(recipe.id)} onPlan={() => onPlan(recipe.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// "köttfärs (300 g)" or just "köttfärs" when the amount isn't known
export function describeMissing({ item, short }: Missing) {
  const name = item?.name.toLowerCase() ?? 'okänd vara'
  return short !== null && item?.unit ? `${name} (${formatAmount(short)} ${unitLabel(item.unit)})` : name
}

// One click adds the recipe to Veckans rätter
function PlanButton({ planned, onPlan }: { planned: boolean; onPlan: () => void }) {
  if (planned) return <span className="px-2 py-1.5 text-xs text-faint">Vald</span>
  return (
    <button
      onClick={onPlan}
      title="Lägg till i veckans rätter"
      className="rounded-md px-2 py-1 text-sm font-medium text-accent-strong hover:bg-accent-soft"
    >
      +
    </button>
  )
}
