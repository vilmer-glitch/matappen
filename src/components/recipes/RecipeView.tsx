import { useState } from 'react'
import { formatAmount, recipeUnitLabel } from '../../lib/recipeUnits'
import { checkRecipe, portionsText } from '../../lib/availability'
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
  const { missing, maxServings } = checkRecipe(recipe, itemsById, servings)
  const missingById = new Map(missing.map((m) => [m.item?.id, m]))

  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold text-ink">{recipe.name}</h2>
        <div className="flex gap-2">
          <button onClick={onEdit} className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2">
            Redigera
          </button>
          <button onClick={onDelete} className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-danger-soft hover:text-danger">
            Ta bort
          </button>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="font-semibold text-ink">Ingredienser</h3>
          <div className="flex items-center overflow-hidden rounded-md border border-line text-sm">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="px-2.5 py-1 hover:bg-surface-2"
              title="Färre portioner"
            >
              −
            </button>
            <span className="px-2 text-ink">{servings} portioner</span>
            <button onClick={() => setServings(servings + 1)} className="px-2.5 py-1 hover:bg-surface-2" title="Fler portioner">
              +
            </button>
          </div>
          {servings !== recipe.servings && (
            <button onClick={() => setServings(recipe.servings)} className="text-xs text-faint hover:text-ink">
              Återställ
            </button>
          )}
        </div>

        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-faint">Inga ingredienser än.</p>
        ) : (
          <ul className="space-y-1">
            {recipe.ingredients.map((ing) => {
              const item = itemsById.get(ing.item_id)
              const lacking = missingById.get(ing.item_id)
              return (
                <li key={ing.item_id} className="flex gap-3">
                  <span className="w-20 text-right text-muted">
                    {ing.quantity !== null && `${formatAmount(ing.quantity * scale)} ${recipeUnitLabel(ing.unit)}`}
                  </span>
                  <span className={lacking ? 'text-danger' : 'text-ink'}>{item?.name ?? 'Okänd vara'}</span>
                  {item?.is_staple && <span className="text-xs leading-6 text-faint">basvara</span>}
                  {lacking && (
                    <span className="text-xs leading-6 text-danger">
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
          <div className="mt-3 space-y-1 text-sm">
            <p className={missing.length === 0 ? 'font-semibold text-olive' : 'text-muted'}>
              {missing.length === 0
                ? `✓ Du har allt för ${portionsText(servings)}.`
                : `Saknar ${missing.length} ${missing.length === 1 ? 'vara' : 'varor'} för ${portionsText(servings)}.`}
            </p>
            {maxServings !== null && (
              <p className="text-muted">
                Det du har hemma räcker till{' '}
                <strong className="text-ink">{maxServings === 0 ? 'ingen portion' : portionsText(maxServings)}</strong>.
                {maxServings > 0 && maxServings !== servings && (
                  <button onClick={() => setServings(maxServings)} className="ml-2 text-accent-strong hover:underline">
                    Visa för {portionsText(maxServings)}
                  </button>
                )}
              </p>
            )}
          </div>
        )}

        {recipe.ingredients.length > 0 && (
          <button
            onClick={() => onCooked(servings)}
            className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
          >
            Jag lagade {servings} {servings === 1 ? 'portion' : 'portioner'}
          </button>
        )}

        {report && (
          <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm">
            <div className="mb-2 flex justify-between">
              <span className="font-medium text-ink">
                Lagret efter {report.servings} {report.servings === 1 ? 'portion' : 'portioner'}:
              </span>
              <button onClick={onCloseReport} className="text-faint hover:text-ink" title="Stäng">
                ×
              </button>
            </div>
            <ul className="space-y-0.5">
              {report.lines.map((line) => (
                <li key={line.name} className="flex gap-2">
                  <span className="w-4">{line.ok ? '✓' : '⚠'}</span>
                  <span className="text-ink">{line.name}:</span>
                  <span className={line.ok ? 'text-muted' : 'text-warn'}>{line.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {recipe.instructions && (
        <section>
          <h3 className="mb-2 font-semibold text-ink">Gör så här</h3>
          <p className="whitespace-pre-wrap leading-relaxed text-ink">{recipe.instructions}</p>
        </section>
      )}

      {recipe.note && (
        <section>
          <h3 className="mb-2 font-semibold text-ink">Anteckning</h3>
          <p className="whitespace-pre-wrap text-ink">{recipe.note}</p>
        </section>
      )}

      {recipe.link && (
        <a
          href={recipe.link}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-accent-strong underline hover:text-accent-strong"
        >
          Öppna originalreceptet ↗
        </a>
      )}
    </article>
  )
}
