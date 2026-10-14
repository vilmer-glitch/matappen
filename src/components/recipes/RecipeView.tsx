import { useState } from 'react'
import { formatAmount, recipeUnitLabel } from '../../lib/recipeUnits'
import { checkRecipe } from '../../lib/availability'
import { unitLabel } from '../../lib/constants'
import type { Item, Recipe } from '../../types'

type Props = {
  recipe: Recipe
  itemsById: Map<string, Item>
  onEdit: () => void
  onDelete: () => void
  onCooked: (servings: number) => void
  report: CookReport | null
  onCloseReport: () => void
}

// What happened with each ingredient after "Jag lagade"
export type CookReport = {
  recipeId: string
  servings: number
  lines: { name: string; text: string; ok: boolean }[]
}

export function RecipeView({ recipe, itemsById, onEdit, onDelete, onCooked, report, onCloseReport }: Props) {
  // Changing servings here only scales the amounts on screen; it isn't saved
  const [servings, setServings] = useState(recipe.servings)
  const scale = servings / recipe.servings
  const { missing, canCook } = checkRecipe(recipe, itemsById, servings)
  const missingById = new Map(missing.map((m) => [m.item?.id, m]))

  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold text-stone-800">{recipe.name}</h2>
        <div className="flex gap-2">
          <button onClick={onEdit} className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100">
            Redigera
          </button>
          <button onClick={onDelete} className="rounded-md px-3 py-1.5 text-sm text-stone-500 hover:bg-red-50 hover:text-red-700">
            Ta bort
          </button>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="font-semibold text-stone-800">Ingredienser</h3>
          <div className="flex items-center overflow-hidden rounded-md border border-stone-300 text-sm">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="px-2.5 py-1 hover:bg-stone-100"
              title="Färre portioner"
            >
              −
            </button>
            <span className="px-2 text-stone-700">{servings} portioner</span>
            <button onClick={() => setServings(servings + 1)} className="px-2.5 py-1 hover:bg-stone-100" title="Fler portioner">
              +
            </button>
          </div>
          {servings !== recipe.servings && (
            <button onClick={() => setServings(recipe.servings)} className="text-xs text-stone-400 hover:text-stone-700">
              Återställ
            </button>
          )}
        </div>

        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-stone-400">Inga ingredienser än.</p>
        ) : (
          <ul className="space-y-1">
            {recipe.ingredients.map((ing) => {
              const item = itemsById.get(ing.item_id)
              const lacking = missingById.get(ing.item_id)
              return (
                <li key={ing.item_id} className="flex gap-3">
                  <span className="w-20 text-right text-stone-500">
                    {ing.quantity !== null && `${formatAmount(ing.quantity * scale)} ${recipeUnitLabel(ing.unit)}`}
                  </span>
                  <span className={lacking ? 'text-red-700' : 'text-stone-800'}>{item?.name ?? 'Okänd vara'}</span>
                  {item?.is_staple && <span className="text-xs leading-6 text-stone-400">basvara</span>}
                  {lacking && (
                    <span className="text-xs leading-6 text-red-600">
                      {lacking.short !== null && item?.unit
                        ? `saknas ${formatAmount(lacking.short)} ${unitLabel(item.unit)}`
                        : 'saknas'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {recipe.ingredients.length > 0 && (
          <p className={`mt-3 text-sm ${canCook ? 'text-emerald-700' : 'text-stone-500'}`}>
            {canCook
              ? `✓ Du har allt för ${servings} portioner.`
              : `Saknar ${missing.length} ${missing.length === 1 ? 'vara' : 'varor'} för ${servings} portioner.`}
          </p>
        )}

        {recipe.ingredients.length > 0 && (
          <button
            onClick={() => onCooked(servings)}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Jag lagade {servings} {servings === 1 ? 'portion' : 'portioner'}
          </button>
        )}

        {report && (
          <div className="mt-3 rounded-lg bg-stone-50 p-3 text-sm">
            <div className="mb-2 flex justify-between">
              <span className="font-medium text-stone-700">
                Lagret efter {report.servings} {report.servings === 1 ? 'portion' : 'portioner'}:
              </span>
              <button onClick={onCloseReport} className="text-stone-400 hover:text-stone-700" title="Stäng">
                ×
              </button>
            </div>
            <ul className="space-y-0.5">
              {report.lines.map((line) => (
                <li key={line.name} className="flex gap-2">
                  <span className="w-4">{line.ok ? '✓' : '⚠'}</span>
                  <span className="text-stone-800">{line.name}:</span>
                  <span className={line.ok ? 'text-stone-500' : 'text-amber-700'}>{line.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {recipe.instructions && (
        <section>
          <h3 className="mb-2 font-semibold text-stone-800">Gör så här</h3>
          <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{recipe.instructions}</p>
        </section>
      )}

      {recipe.note && (
        <section>
          <h3 className="mb-2 font-semibold text-stone-800">Anteckning</h3>
          <p className="whitespace-pre-wrap text-stone-700">{recipe.note}</p>
        </section>
      )}

      {recipe.link && (
        <a
          href={recipe.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-emerald-700 underline hover:text-emerald-900"
        >
          Öppna originalreceptet ↗
        </a>
      )}
    </article>
  )
}
