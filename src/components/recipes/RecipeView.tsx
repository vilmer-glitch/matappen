import { useState } from 'react'
import { ChefHat, CircleCheck, ExternalLink, Minus, Pencil, Plus, StickyNote, Trash2, TriangleAlert, X } from 'lucide-react'
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
    <article className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink">{recipe.name}</h2>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Pencil size={15} />
            Redigera
          </button>
          <button
            onClick={onDelete}
            title="Ta bort rätten"
            className="rounded-full p-2.5 text-faint hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">Ingredienser</h3>
          <div className="flex items-center rounded-full bg-surface-2 text-sm font-semibold text-ink">
            <button
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="rounded-full p-2 hover:bg-line"
              title="Färre portioner"
            >
              <Minus size={15} />
            </button>
            <span className="min-w-24 text-center">{portionsText(servings)}</span>
            <button onClick={() => setServings(servings + 1)} className="rounded-full p-2 hover:bg-line" title="Fler portioner">
              <Plus size={15} />
            </button>
          </div>
          {servings !== recipe.servings && (
            <button onClick={() => setServings(recipe.servings)} className="text-xs font-semibold text-faint hover:text-ink">
              Återställ
            </button>
          )}
        </div>

        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-faint">Inga ingredienser än.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recipe.ingredients.map((ing) => {
              const item = itemsById.get(ing.item_id)
              const lacking = missingById.get(ing.item_id)
              return (
                <li key={ing.item_id} className="flex items-center gap-3 py-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      lacking ? 'bg-danger' : item?.is_staple ? 'bg-line' : 'bg-olive'
                    }`}
                  />
                  <span className="w-20 shrink-0 text-right font-semibold text-muted">
                    {ing.quantity !== null && `${formatAmount(ing.quantity * scale)} ${recipeUnitLabel(ing.unit)}`}
                  </span>
                  <span className={`flex-1 ${lacking ? 'text-danger' : 'text-ink'}`}>
                    {item?.name ?? 'Okänd vara'}
                    {item?.is_staple && <span className="ml-2 text-xs text-faint">basvara</span>}
                  </span>
                  {lacking && (
                    <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
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
          <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${missing.length === 0 ? 'bg-olive-soft' : 'bg-warn-soft'}`}>
            <p className={`font-semibold ${missing.length === 0 ? 'text-olive' : 'text-warn'}`}>
              {missing.length === 0
                ? `Du har allt för ${portionsText(servings)}.`
                : `Saknar ${missing.length} ${missing.length === 1 ? 'vara' : 'varor'} för ${portionsText(servings)}.`}
            </p>
            {maxServings !== null && (
              <p className="text-muted">
                Det du har hemma räcker till{' '}
                <strong className="text-ink">{maxServings === 0 ? 'ingen portion' : portionsText(maxServings)}</strong>.
                {maxServings > 0 && maxServings !== servings && (
                  <button
                    onClick={() => setServings(maxServings)}
                    className="ml-2 font-semibold text-accent-strong hover:underline"
                  >
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
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-strong sm:w-auto"
          >
            <ChefHat size={18} />
            Jag lagade {portionsText(servings)}
          </button>
        )}

        {report && (
          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-ink">Lagret efter {portionsText(report.servings)}</span>
              <button onClick={onCloseReport} className="rounded-full p-1 text-faint hover:bg-line hover:text-ink" title="Stäng">
                <X size={16} />
              </button>
            </div>
            <ul className="space-y-1">
              {report.lines.map((line) => (
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
          </div>
        )}
      </section>

      {recipe.instructions && (
        <section>
          <h3 className="mb-3 font-display text-xl font-semibold text-ink">Gör så här</h3>
          <p className="whitespace-pre-wrap leading-relaxed text-ink">{recipe.instructions}</p>
        </section>
      )}

      {recipe.note && (
        <section className="flex gap-3 rounded-xl bg-warn-soft px-4 py-3">
          <StickyNote size={18} className="mt-0.5 shrink-0 text-warn" />
          <p className="whitespace-pre-wrap text-ink">{recipe.note}</p>
        </section>
      )}

      {recipe.link && (
        <a
          href={recipe.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-accent-strong hover:bg-accent-soft"
        >
          <ExternalLink size={15} />
          Öppna originalreceptet
        </a>
      )}
    </article>
  )
}
