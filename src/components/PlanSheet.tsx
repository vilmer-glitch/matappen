import { useState } from 'react'
import { CircleCheck, Minus, Plus, ShoppingBasket } from 'lucide-react'
import { portionsText } from '../lib/availability'
import { unitLabel } from '../lib/constants'
import { formatAmount } from '../lib/recipeUnits'
import { shoppingNeeds } from '../lib/shopping'
import type { Item, PlannedMeal, Recipe } from '../types'
import { AppBadge } from './AppBadge'
import { Sheet } from './Sheet'

type Props = {
  recipe: Recipe
  meals: PlannedMeal[]
  recipesById: Map<string, Recipe>
  itemsById: Map<string, Item>
  onConfirm: (servings: number) => void
  onClose: () => void
}

// Confirmation before a dish is added to "Att laga": shows what ends up on the shopping list
export function PlanSheet({ recipe, meals, recipesById, itemsById, onConfirm, onClose }: Props) {
  const [servings, setServings] = useState(recipe.servings)

  // What the shopping list needs now, and with this dish added
  const before = new Map(shoppingNeeds(meals, recipesById, itemsById).map((n) => [n.item.id, n.short]))
  const preview: PlannedMeal = { id: 'preview', recipe_id: recipe.id, servings, cooked_at: null }
  const added = shoppingNeeds([...meals, preview], recipesById, itemsById)
    .map((n) => {
      const was = before.get(n.item.id)
      if (was === undefined) return { item: n.item, amount: n.short }
      if (n.short !== null && was !== null && n.short > was) return { item: n.item, amount: n.short - was }
      return null
    })
    .filter((a): a is { item: Item; amount: number | null } => a !== null)

  return (
    <Sheet title="Att laga" onClose={onClose} confirmLabel="Lägg till" onConfirm={() => onConfirm(servings)}>
      <p className="font-display text-2xl font-semibold text-ink">
        {recipe.name}
        {recipe.isApp && <AppBadge large />}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-sm font-semibold text-muted">Portioner</span>
        <div className="flex items-center rounded-full bg-surface-2 text-sm font-semibold text-ink">
          <button onClick={() => setServings(Math.max(1, servings - 1))} className="rounded-full p-2 hover:bg-line" title="Färre portioner">
            <Minus size={15} />
          </button>
          <span className="min-w-24 text-center">{portionsText(servings)}</span>
          <button onClick={() => setServings(servings + 1)} className="rounded-full p-2 hover:bg-line" title="Fler portioner">
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5">
        {added.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-olive-soft px-4 py-3 text-sm font-semibold text-olive">
            <CircleCheck size={18} />
            Du har allt hemma. Inget behöver köpas.
          </p>
        ) : (
          <>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">
              <ShoppingBasket size={16} className="text-accent" />
              Hamnar på inköpslistan
            </h3>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {added.map(({ item, amount }) => (
                <li key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="font-semibold text-ink">{item.name}</span>
                  <span className="text-muted">
                    {amount !== null && item.unit ? `${formatAmount(amount)} ${unitLabel(item.unit)}` : 'mängd okänd'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-faint">Resten finns hemma. Basvaror räknas alltid som hemma.</p>
          </>
        )}
        {recipe.isApp && (
          <p className="mt-3 text-xs text-faint">Rätten sparas också bland dina recept, så att du kan ändra den.</p>
        )}
      </div>
    </Sheet>
  )
}
