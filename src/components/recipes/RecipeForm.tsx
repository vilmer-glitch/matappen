import { useState } from 'react'
import type { RecipeDraft } from '../../hooks/useRecipes'
import { recipeUnitsFor, type RecipeUnit } from '../../lib/recipeUnits'
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
  const available = items.filter((item) => !ingredients.some((ing) => ing.item_id === item.id))

  function addIngredient(item: Item) {
    setIngredients((prev) => [...prev, { item_id: item.id, quantityText: '', unit: item.unit }])
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
      <div className="flex gap-4">
        <Field label="Namn" className="flex-1">
          <input
            autoFocus={!recipe}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="T.ex. Köttfärssås"
            className={inputClass}
          />
        </Field>
        <Field label="Portioner" className="w-28">
          <input inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label={`Ingredienser för ${servings || '?'} portioner`}>
        {ingredients.length > 0 && (
          <ul className="mb-2 divide-y divide-stone-100 rounded-md border border-stone-200">
            {ingredients.map((row, index) => {
              const item = itemsById.get(row.item_id)
              return (
                <li key={row.item_id} className="group flex items-center gap-2 px-2 py-1.5">
                  <div className="flex flex-col text-[10px] leading-none text-stone-300">
                    <button type="button" onClick={() => moveRow(index, -1)} className="hover:text-stone-700" title="Flytta upp">
                      ▲
                    </button>
                    <button type="button" onClick={() => moveRow(index, 1)} className="hover:text-stone-700" title="Flytta ner">
                      ▼
                    </button>
                  </div>
                  <span className="flex-1 text-stone-800">
                    {item?.name ?? 'Okänd vara'}
                    {item?.is_staple && <span className="ml-2 text-xs text-stone-400">basvara</span>}
                  </span>
                  <input
                    inputMode="decimal"
                    value={row.quantityText}
                    onChange={(e) => updateRow(index, { quantityText: e.target.value })}
                    placeholder="Mängd"
                    className="w-20 rounded border border-stone-300 px-2 py-1 text-right text-sm"
                  />
                  <select
                    value={row.unit ?? ''}
                    onChange={(e) => updateRow(index, { unit: (e.target.value || null) as RecipeUnit | null })}
                    className="w-16 rounded border border-stone-300 px-1 py-1 text-sm"
                  >
                    {item?.is_staple && <option value="">–</option>}
                    {recipeUnitsFor(item?.unit ?? null).map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                    title="Ta bort ingrediens"
                    className="px-1 text-stone-300 hover:text-red-600"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <AddItemSearch
          items={available}
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
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'Sparar…' : 'Spara'}
        </button>
        <button onClick={onCancel} className="rounded-md px-4 py-2 text-sm text-stone-500 hover:bg-stone-100">
          Avbryt
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none'

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <span className="mb-1 block text-sm font-medium text-stone-600">{label}</span>
      {children}
    </div>
  )
}
