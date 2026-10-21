import { Check, Plus } from 'lucide-react'
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
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted"><span className="h-2.5 w-2.5 rounded-full bg-olive" />Kan lagas nu <span className="text-faint">{ready.length}</span></h3>
        {ready.length === 0 ? (
          <p className="px-3 py-1.5 text-sm text-faint">Ingen rätt just nu.</p>
        ) : (
          <ul>
            {ready.map(({ recipe, maxServings }) => (
              <li key={recipe.id} className="flex items-center gap-1">
                <button
                  onClick={() => openRecipe(recipe.id)}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="flex-1 font-semibold text-ink">{recipe.name}</span>
                  {maxServings !== null && (
                    <span className="rounded-full bg-olive-soft px-2 py-0.5 text-xs font-semibold text-olive" title="Så många portioner räcker det du har hemma till">
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
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted"><span className="h-2.5 w-2.5 rounded-full bg-warn" />Saknar 1–2 varor <span className="text-faint">{almost.length}</span></h3>
        {almost.length === 0 ? (
          <p className="px-3 py-1.5 text-sm text-faint">Ingen rätt just nu.</p>
        ) : (
          <ul>
            {almost.map(({ recipe, missing }) => (
              <li key={recipe.id} className="flex items-start gap-1">
                <button
                  onClick={() => openRecipe(recipe.id)}
                  className="flex min-h-11 min-w-0 flex-1 items-start gap-2 rounded-xl px-3 py-1.5 text-left hover:bg-surface-2"
                >
                  <span>
                    <span className="block font-semibold text-ink">{recipe.name}</span>
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
  if (planned)
    return (
      <span className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-olive" title="Finns i veckans rätter">
        <Check size={14} />
        Vald
      </span>
    )
  return (
    <button
      onClick={onPlan}
      title="Lägg till i veckans rätter"
      className="rounded-full bg-accent-soft p-2 text-accent-strong hover:bg-accent hover:text-on-accent"
    >
      <Plus size={16} />
    </button>
  )
}
