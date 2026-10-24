import { useState } from 'react'
import type { RecipeDraft } from '../../hooks/useRecipes'
import { recipeUnitLabel, recipeUnitsFor, type RecipeUnit } from '../../lib/recipeUnits'
import type { Item, Recipe } from '../../types'
import { AddItemSearch, type NewItem } from '../pantry/AddItemSearch'

type IngredientRow = { item_id: string; quantityText: string; unit: RecipeUnit | null }

type Props = {
  recipe: Recipe | null
  items: Item[]
  onCreateItem: (newItem: NewItem) => Promise<Item | null>
  onSave: (draft: RecipeDraft) => Promise<void>
  onCancel: () => void
}

export function RecipeForm({ recipe, items, onCreateItem, onSave, onCancel }: Props) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [servings, setServings] = useState(recipe?.servings.toString() ?? '4')
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients.map((ing) => ({
      item_id: ing.item_id,
      quantityText: ing.quantity?.toLocaleString('sv-SE') ?? '',
      unit: ing.unit,
    })) ?? [],
  )
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '')
  const [link, setLink] = useState(recipe?.link ?? '')
  const [note, setNote] = useState(recipe?.note ?? '')
  const [saving, setSaving] = useState(false)

  const itemsById = new Map(items.map((item) => [item.id, item]))

  function addIngredient(item: Item) {
    setIngredients((prev) =>
      prev.some((row) => row.item_id === item.id) ? prev : [...prev, { item_id: item.id, quantityText: '', unit: item.unit }],
    )
  }

  async function createIngredient(newItem: NewItem) {
    const created = await onCreateItem(newItem)
    if (created) addIngredient(created)
  }

  function updateRow(index: number, changes: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)))
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= ingredients.length) return
    const next = [...ingredients]
    ;[next[index], next[target]] = [next[target], next[index]]
    setIngredients(next)
  }

  async function save() {
    setSaving(true)
    await onSave({
      name: name.trim(),
      servings: Math.max(1, Math.round(Number(servings)) || 4),
      instructions: instructions.trim() || null,
      link: link.trim() || null,
      note: note.trim() || null,
      ingredients: ingredients.map((row) => {
        const amount = Number(row.quantityText.replace(/\s/g, '').replace(',', '.'))
        return {
          item_id: row.item_id,
          quantity: row.quantityText.trim() === '' || Number.isNaN(amount) ? null : amount,
          unit: row.unit,
        }
      }),
    })
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold text-ink">{recipe ? 'Redigera rätt' : 'Ny rätt'}</h2>
      <div className="flex gap-3">
        <Field label="Namn" className="flex-1">
          <input
            autoFocus={!recipe}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. Köttfärssås"
            className={inputClass}
          />
        </Field>
        <Field label="Portioner" className="w-24">
          <input inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label={`Ingredienser för ${servings || '?'} portioner`}>
        {ingredients.length > 0 && (
          <ul className="mb-3 divide-y divide-line rounded-xl border border-line">
            {ingredients.map((row, index) => {
              const item = itemsById.get(row.item_id)
              return (
                <li key={row.item_id} className="group flex flex-wrap items-center gap-2 px-3 py-2">
                  <div className="flex flex-col text-[10px] leading-none text-faint">
                    <button type="button" onClick={() => moveRow(index, -1)} className="hover:text-ink" title="Flytta upp">
                      ▲
                    </button>
                    <button type="button" onClick={() => moveRow(index, 1)} className="hover:text-ink" title="Flytta ner">
                      ▼
                    </button>
                  </div>
                  <span className="min-w-32 flex-1 font-semibold text-ink">
                    {item?.name ?? 'Okänd vara'}
                    {item?.is_staple && <span className="ml-2 text-xs text-faint">basvara</span>}
                  </span>
                  <input
                    inputMode="decimal"
                    value={row.quantityText}
                    onChange={(e) => updateRow(index, { quantityText: e.target.value })}
                    placeholder="Mängd"
                    className="w-20 rounded-full border border-line px-3 py-1.5 text-right text-sm focus:border-accent focus:outline-none"
                  />
                  <select
                    title="Enheterna följer varans enhet i lagret. Byt den under fliken Varor."
                    value={row.unit ?? ''}
                    onChange={(e) => updateRow(index, { unit: (e.target.value || null) as RecipeUnit | null })}
                    className="w-16 rounded-full border border-line px-2 py-1.5 text-sm"
                  >
                    {item?.is_staple && <option value="">–</option>}
                    {recipeUnitsFor(item?.unit ?? null).map((u) => (
                      <option key={u.value} value={u.value}>
                        {recipeUnitLabel(u.value, item?.name)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                    title="Ta bort ingrediens"
                    className="rounded-full p-1.5 text-faint hover:bg-danger-soft hover:text-danger"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <AddItemSearch
          items={items}
          onPick={addIngredient}
          onCreate={createIngredient}
          withQuantity={false}
          placeholder="Lägg till ingrediens…"
        />
      </Field>

      <Field label="Instruktioner">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          placeholder={'1. Hacka löken.\n2. Bryn köttfärsen…'}
          className={inputClass}
        />
      </Field>

      <Field label="Anteckning">
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
      </Field>

      <Field label="Länk">
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
          className={inputClass}
        />
      </Field>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-50"
        >
          {saving ? 'Sparar…' : 'Spara'}
        </button>
        <button onClick={onCancel} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2">
          Avbryt
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none'

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      {children}
    </div>
  )
}
