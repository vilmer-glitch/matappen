import { useState } from 'react'
import { Check, ChevronDown, Lightbulb, PackageCheck, Plus, ShoppingBasket, X } from 'lucide-react'
import type { ItemsStore } from '../hooks/useItems'
import type { PlannedMealsStore } from '../hooks/usePlannedMeals'
import type { ShoppingListStore } from '../hooks/useShoppingList'
import { statusFor } from '../lib/constants'
import { itemStep } from '../lib/search'
import { shoppingNeeds } from '../lib/shopping'
import type { Item, Recipe, ShoppingRow } from '../types'
import { AmountStepper } from './AmountStepper'
import { AddItemSearch, type NewItem } from './pantry/AddItemSearch'

type Props = {
  recipes: Recipe[]
  store: ItemsStore
  planned: PlannedMealsStore
  list: ShoppingListStore
  showUndo: (message: string, undo: () => void) => void
  onRequestNew: (name: string) => void
}

type Line = {
  item: Item
  quantity: number | null
  checked: boolean
  manual: boolean
  recipes: string[]
}

export function ShoppingList({ recipes, store, planned, list, showUndo, onRequestNew }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const itemsById = new Map(store.items.map((item) => [item.id, item]))
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const needs = shoppingNeeds(planned.meals, recipesById, itemsById)
  const rowsByItem = new Map(list.rows.map((r) => [r.item_id, r]))

  // Automatic lines from Att laga, plus items added by hand
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
      {list.error && <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{list.error}</p>}

      <AddItemSearch
        items={store.items}
        onPick={addManual}
        onCreate={createManual}
        withQuantity={false}
        placeholder="Lägg till på listan…"
        onRequestNew={onRequestNew}
      />

      {lines.length === 0 && (
        <div className="mb-4 flex flex-col items-center rounded-xl bg-surface-2 px-4 py-6 text-center">
          <ShoppingBasket size={28} className="mb-2 text-faint" />
          <p className="text-sm text-muted">Listan är tom.</p>
          <p className="text-xs text-faint">Det som rätterna i Att laga saknar hamnar här automatiskt.</p>
        </div>
      )}

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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-on-accent shadow-sm hover:bg-accent-strong"
        >
          <PackageCheck size={18} />
          Klar med handlingen ({done.length})
        </button>
      )}

      {suggestions.length > 0 && (
        <section className="mt-5 rounded-xl bg-surface-2 px-3 py-2">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex w-full items-center gap-2 py-1 text-sm font-semibold text-muted hover:text-ink"
          >
            <Lightbulb size={16} className="text-warn" />
            Slut hemma
            <span className="text-faint">{suggestions.length}</span>
            <ChevronDown size={16} className={`ml-auto transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>
          {showSuggestions && (
            <div className="flex flex-wrap gap-2 py-2">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addManual(item)}
                  title="Lägg till på listan"
                  className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-accent hover:text-accent-strong"
                >
                  <Plus size={14} />
                  {item.name}
                </button>
              ))}
            </div>
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
  return (
    <li className="group flex min-h-12 items-center gap-3 py-1.5">
      <button
        onClick={onToggle}
        role="checkbox"
        aria-checked={line.checked}
        title={line.checked ? 'Ångra avbockning' : 'Bocka av'}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          line.checked ? 'border-olive bg-olive text-surface' : 'border-line hover:border-olive'
        }`}
      >
        {line.checked && <Check size={16} strokeWidth={3} />}
      </button>
      <span className={`min-w-0 flex-1 ${line.checked ? 'text-faint line-through' : 'text-ink'}`}>
        <span className="block truncate font-semibold">{line.item.name}</span>
        {line.recipes.length > 0 && <span className="block truncate text-xs text-faint">{line.recipes.join(', ')}</span>}
      </span>
      {line.item.unit && (
        <AmountStepper
          value={line.quantity}
          unit={line.item.unit}
          step={itemStep(line.item.name, line.item.unit)}
          onChange={onQuantity}
          label={line.item.name}
        />
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          title="Ta bort från listan"
          className="rounded-full p-1.5 text-faint hover:bg-danger-soft hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <X size={16} />
        </button>
      )}
    </li>
  )
}
