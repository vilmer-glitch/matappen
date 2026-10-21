import { useEffect, useState } from 'react'
import type { ItemsStore } from '../hooks/useItems'
import type { PlannedMealsStore } from '../hooks/usePlannedMeals'
import type { ShoppingListStore } from '../hooks/useShoppingList'
import { statusFor, unitLabel } from '../lib/constants'
import { formatAmount } from '../lib/recipeUnits'
import { shoppingNeeds } from '../lib/shopping'
import type { Item, Recipe, ShoppingRow } from '../types'
import { AddItemSearch, type NewItem } from './pantry/AddItemSearch'

type Props = {
  recipes: Recipe[]
  store: ItemsStore
  planned: PlannedMealsStore
  list: ShoppingListStore
  showUndo: (message: string, undo: () => void) => void
}

type Line = {
  item: Item
  quantity: number | null
  checked: boolean
  manual: boolean
  recipes: string[]
}

export function ShoppingList({ recipes, store, planned, list, showUndo }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const itemsById = new Map(store.items.map((item) => [item.id, item]))
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const needs = shoppingNeeds(planned.meals, recipesById, itemsById)
  const rowsByItem = new Map(list.rows.map((r) => [r.item_id, r]))

  // Automatic lines from Veckans rätter, plus items added by hand
  const lines: Line[] = needs.map((need) => {
    const row = rowsByItem.get(need.item.id)
    return {
      item: need.item,
      quantity: row?.quantity ?? need.short,
      checked: row?.checked ?? false,
      manual: false,
      recipes: need.recipes,
    }
  })
  for (const row of list.rows) {
    const item = itemsById.get(row.item_id)
    if (!row.is_manual || !item || lines.some((l) => l.item.id === item.id)) continue
    lines.push({ item, quantity: row.quantity, checked: row.checked, manual: true, recipes: [] })
  }
  const byName = (a: Line, b: Line) => a.item.name.localeCompare(b.item.name, 'sv')
  const toBuy = lines.filter((l) => !l.checked).sort(byName)
  const done = lines.filter((l) => l.checked).sort(byName)

  // Out-of-stock items that aren't on the list yet
  const suggestions = store.items
    .filter((item) => !item.is_staple && item.quantity === 0 && !lines.some((l) => l.item.id === item.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

  function addManual(item: Item) {
    if (lines.some((l) => l.item.id === item.id)) return
    list.saveRow(item.id, { is_manual: true, checked: false })
    showUndo(`${item.name} lades på listan`, () => list.removeRows([item.id]))
  }

  async function createManual({ name, group, unit }: NewItem) {
    const isStaple = group === 'staple'
    const created = await store.addItem({
      name,
      category: isStaple ? 'pantry' : group,
      is_staple: isStaple,
      unit: isStaple ? null : unit,
      quantity: isStaple ? null : 0,
      status: isStaple ? 'in_stock' : statusFor(0),
    })
    if (created) addManual(created)
  }

  function removeManual(line: Line) {
    const row = rowsByItem.get(line.item.id)
    list.removeRows([line.item.id])
    if (row) showUndo(`${line.item.name} togs bort från listan`, () => list.restoreRows([row]))
  }

  // Checked items go into the pantry with the amount on the list
  function doneShopping() {
    const before = done.map((line) => ({ item: line.item }))
    for (const line of done) {
      const { item, quantity } = line
      const next = quantity === null ? (item.quantity === 0 ? null : item.quantity) : (item.quantity ?? 0) + quantity
      store.updateItem(item.id, { quantity: next, status: statusFor(next) })
    }
    // Remove the checked rows, and leftovers for automatic items that are no longer needed
    const neededIds = new Set(needs.map((n) => n.item.id))
    const removed: ShoppingRow[] = list.rows.filter(
      (r) => r.checked || (!r.is_manual && !neededIds.has(r.item_id)),
    )
    list.removeRows(removed.map((r) => r.item_id))

    showUndo(`${done.length} varor lades i lagret`, () => {
      for (const { item } of before) store.updateItem(item.id, { quantity: item.quantity, status: item.status })
      list.restoreRows(removed)
    })
  }

  if (list.loading || planned.loading) return <p className="text-sm text-faint">Hämtar inköpslistan…</p>

  return (
    <div>
      {list.error && <p className="mb-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{list.error}</p>}

      <AddItemSearch
        items={store.items}
        onPick={addManual}
        onCreate={createManual}
        withQuantity={false}
        placeholder="Lägg till på listan…"
      />

      {lines.length === 0 && <p className="mb-3 text-sm text-faint">Listan är tom.</p>}

      <ul className="divide-y divide-line">
        {[...toBuy, ...done].map((line) => (
          <ShoppingLine
            key={line.item.id}
            line={line}
            onToggle={() => list.saveRow(line.item.id, { checked: !line.checked })}
            onQuantity={(quantity) => list.saveRow(line.item.id, { quantity })}
            onRemove={line.manual ? () => removeManual(line) : undefined}
          />
        ))}
      </ul>

      {done.length > 0 && (
        <button
          onClick={doneShopping}
          className="mt-4 w-full rounded-md bg-accent py-2 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          Klar med handlingen ({done.length})
        </button>
      )}

      {suggestions.length > 0 && (
        <section className="mt-4 border-t border-line pt-3">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs font-semibold uppercase tracking-wide text-faint hover:text-ink"
          >
            {showSuggestions ? '▾' : '▸'} Slut hemma ({suggestions.length})
          </button>
          {showSuggestions && (
            <ul className="mt-1">
              {suggestions.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-1 text-sm text-muted">
                  {item.name}
                  <button onClick={() => addManual(item)} className="rounded-md px-2 text-accent-strong hover:bg-accent-soft">
                    + Lägg till
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

type LineProps = {
  line: Line
  onToggle: () => void
  onQuantity: (quantity: number | null) => void
  onRemove?: () => void
}

function ShoppingLine({ line, onToggle, onQuantity, onRemove }: LineProps) {
  const [value, setValue] = useState(format(line.quantity))
  useEffect(() => setValue(format(line.quantity)), [line.quantity])

  function save() {
    const text = value.replace(/\s/g, '').replace(',', '.')
    const quantity = text === '' ? null : Number(text)
    if (quantity !== null && (Number.isNaN(quantity) || quantity < 0)) {
      setValue(format(line.quantity))
      return
    }
    if (quantity !== line.quantity) onQuantity(quantity)
  }

  return (
    <li className="group flex items-center gap-2 py-1.5">
      <input
        type="checkbox"
        checked={line.checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        title="Bocka av"
      />
      <span className={`min-w-0 flex-1 ${line.checked ? 'text-faint line-through' : 'text-ink'}`}>
        <span className="block truncate">{line.item.name}</span>
        {line.recipes.length > 0 && <span className="block truncate text-xs text-faint">{line.recipes.join(', ')}</span>}
      </span>
      {line.item.unit && (
        <label className="flex items-center gap-1 text-sm text-muted">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="?"
            title="Ändra till det du köpte"
            className="w-16 rounded border border-transparent px-1.5 py-0.5 text-right text-ink hover:border-line focus:border-accent focus:outline-none"
          />
          <span className="w-5">{unitLabel(line.item.unit)}</span>
        </label>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          title="Ta bort från listan"
          className="px-1 text-faint hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          ×
        </button>
      )}
    </li>
  )
}

function format(quantity: number | null) {
  return quantity === null ? '' : formatAmount(quantity)
}
