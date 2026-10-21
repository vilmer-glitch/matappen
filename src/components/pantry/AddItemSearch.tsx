import { useState, type FormEvent } from 'react'
import { CATEGORIES, UNITS, unitLabel, type Category, type Unit } from '../../lib/constants'
import type { Item } from '../../types'

export type NewItem = { name: string; group: Category | 'staple'; unit: Unit; quantity: number | null }

type Props = {
  items: Item[]
  onPick: (item: Item) => void
  onCreate: (newItem: NewItem) => void
  // Ask for the amount at home when creating a new item (off when picking recipe ingredients)
  withQuantity?: boolean
  placeholder?: string
}

const GROUPS = [...CATEGORIES, { value: 'staple', label: 'Basvara' }] as const

// Search field that suggests existing items while typing, or creates a new one.
export function AddItemSearch({
  items,
  onPick,
  onCreate,
  withQuantity = true,
  placeholder = 'Sök eller lägg till vara…',
}: Props) {
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState<string | null>(null)
  const [group, setGroup] = useState<NewItem['group']>('fridge')
  const [unit, setUnit] = useState<Unit>('g')
  const [quantity, setQuantity] = useState('')

  const text = query.trim()
  const matches = text
    ? items.filter((item) => item.name.toLowerCase().includes(text.toLowerCase())).slice(0, 6)
    : []
  const exact = items.find((item) => item.name.toLowerCase() === text.toLowerCase())

  function pick(item: Item) {
    onPick(item)
    setQuery('')
  }

  function startCreate() {
    setNewName(text.charAt(0).toUpperCase() + text.slice(1))
    setQuantity('')
    setQuery('')
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!text) return
    if (exact) pick(exact)
    else startCreate()
  }

  function create(e: FormEvent) {
    e.preventDefault()
    if (!newName) return
    const amount = Number(quantity.replace(/\s/g, '').replace(',', '.'))
    onCreate({
      name: newName,
      group,
      unit,
      quantity: quantity.trim() === '' || Number.isNaN(amount) ? null : amount,
    })
    setNewName(null)
  }

  if (newName !== null) {
    return (
      <form onSubmit={create} className="mb-4 space-y-3 rounded-lg bg-stone-50 p-3">
        <p className="text-sm text-stone-600">
          Ny vara: <strong className="text-stone-800">{newName}</strong>
        </p>

        <Choice options={GROUPS} value={group} onChange={setGroup} />

        {group !== 'staple' && (
          <div className="flex items-center gap-2">
            {withQuantity && (
              <input
                autoFocus
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Mängd"
                className="w-24 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
              />
            )}
            {!withQuantity && <span className="text-sm text-stone-500">Enhet i lagret:</span>}
            <Choice options={UNITS} value={unit} onChange={setUnit} />
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-md bg-emerald-600 py-1.5 text-sm font-medium text-white">
            Lägg till{group !== 'staple' && quantity.trim() ? ` ${quantity.trim()} ${unitLabel(unit)}` : ''}
          </button>
          <button
            type="button"
            onClick={() => setNewName(null)}
            className="rounded-md px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-200"
          >
            Avbryt
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSearch} className="relative mb-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
      />
      {text && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-stone-200 bg-white text-sm shadow-lg">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="flex w-full justify-between px-3 py-2 text-left hover:bg-stone-100"
              >
                <span>{item.name}</span>
                <span className="text-stone-400">
                  {item.is_staple
                    ? 'Basvara'
                    : item.quantity === null
                      ? ''
                      : `${item.quantity.toLocaleString('sv-SE')} ${unitLabel(item.unit)}`}
                </span>
              </button>
            </li>
          ))}
          {!exact && (
            <li>
              <button
                type="button"
                onClick={startCreate}
                className="w-full px-3 py-2 text-left text-emerald-700 hover:bg-stone-100"
              >
                + Lägg till ”{text}”
              </button>
            </li>
          )}
        </ul>
      )}
    </form>
  )
}

// A row of buttons where one is selected (also used in the item editor)
export function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-stone-300 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-1.5 ${o.value === value ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 hover:bg-stone-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
