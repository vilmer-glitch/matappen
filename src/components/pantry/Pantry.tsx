import { useState } from 'react'
import type { ItemsStore } from '../../hooks/useItems'
import { statusFor, unitLabel } from '../../lib/constants'
import type { Item } from '../../types'
import { AddItemSearch, type NewItem } from './AddItemSearch'
import { ItemRow } from './ItemRow'

type Props = {
  store: ItemsStore
  showUndo: (message: string, undo: () => void) => void
  openItem: (id: string) => void
}

export function Pantry({ store, showUndo, openItem }: Props) {
  const { items, loading, error, clearError, addItem, updateItem, removeItem, restoreItem } = store
  const [showStaples, setShowStaples] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)

  function setQuantity(item: Item, quantity: number | null) {
    const before = item.quantity
    updateItem(item.id, { quantity, status: statusFor(quantity) })
    const text = quantity === 0 ? 'slut' : quantity === null ? 'okänd mängd' : `${quantity.toLocaleString('sv-SE')} ${unitLabel(item.unit)}`
    showUndo(`${item.name}: ${text}`, () => updateItem(item.id, { quantity: before, status: statusFor(before) }))
  }

  async function remove(item: Item) {
    if (await removeItem(item)) showUndo(`${item.name} togs bort`, () => restoreItem(item))
  }

  // Picking an existing item from the search jumps to its amount field
  function pick(item: Item) {
    if (item.is_staple) setShowStaples(true)
    else setFocusId(item.id)
  }

  async function create({ name, group, unit, quantity }: NewItem) {
    const isStaple = group === 'staple'
    const created = await addItem({
      name,
      category: isStaple ? 'pantry' : group,
      is_staple: isStaple,
      unit: isStaple ? null : unit,
      quantity: isStaple ? null : quantity,
      status: isStaple ? 'in_stock' : statusFor(quantity),
    })
    if (created) showUndo(`${name} lades till`, () => removeItem(created))
  }

  if (loading) return <p className="text-sm text-stone-400">Hämtar lagret…</p>

  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, 'sv')
  const fridge = items.filter((item) => !item.is_staple && item.category === 'fridge').sort(byName)
  const pantry = items.filter((item) => !item.is_staple && item.category === 'pantry').sort(byName)
  const staples = items.filter((item) => item.is_staple).sort(byName)

  function rows(list: Item[]) {
    return (
      <ul className="divide-y divide-stone-100">
        {list.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            focused={item.id === focusId}
            onFocused={() => setFocusId(null)}
            onQuantityChange={(quantity) => setQuantity(item, quantity)}
            onRemove={() => remove(item)}
            onOpen={() => openItem(item.id)}
          />
        ))}
      </ul>
    )
  }

  return (
    <div>
      <AddItemSearch items={items} onPick={pick} onCreate={create} />

      {error && (
        <p className="mb-3 flex justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
          <button onClick={clearError}>×</button>
        </p>
      )}

      <Group title="Kyl" count={fridge.length}>
        {fridge.length ? rows(fridge) : <Empty />}
      </Group>
      <Group title="Skafferi" count={pantry.length}>
        {pantry.length ? rows(pantry) : <Empty />}
      </Group>

      <section className="border-t border-stone-200 pt-3">
        <button
          onClick={() => setShowStaples(!showStaples)}
          className="text-xs font-semibold uppercase tracking-wide text-stone-400 hover:text-stone-700"
        >
          {showStaples ? '▾' : '▸'} Basvaror ({staples.length})
        </button>
        {showStaples && (
          <>
            <p className="mt-1 text-xs text-stone-400">Finns alltid hemma och dras aldrig av.</p>
            {rows(staples)}
          </>
        )}
      </section>
    </div>
  )
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
        {title} ({count})
      </h3>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="py-1.5 text-sm text-stone-400">Inga varor än.</p>
}
