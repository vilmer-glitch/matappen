import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
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
      <form onSubmit={create} className="mb-4 space-y-3 rounded-xl border border-line bg-surface-2 p-4">
        <p className="text-sm text-muted">
          Ny vara: <strong className="text-ink">{newName}</strong>
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
                className="w-24 rounded-full border border-line px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            )}
            {!withQuantity && <span className="text-sm text-muted">Enhet i lagret:</span>}
            <Choice options={UNITS} value={unit} onChange={setUnit} />
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-full bg-accent py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong">
            Lägg till{group !== 'staple' && quantity.trim() ? ` ${quantity.trim()} ${unitLabel(unit)}` : ''}
          </button>
          <button
            type="button"
            onClick={() => setNewName(null)}
            className="rounded-full px-4 py-2 text-sm text-muted hover:bg-line"
          >
            Avbryt
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSearch} className="relative mb-4">
      <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        placeholder={placeholder}
        className="w-full rounded-full border border-line bg-surface-2 py-2.5 pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none"
      />
      {text && (
        <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface text-sm shadow-lg">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="flex w-full justify-between px-4 py-2.5 text-left hover:bg-surface-2"
              >
                <span>{item.name}</span>
                <span className="text-faint">
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
                className="w-full px-4 py-2.5 text-left font-semibold text-accent-strong hover:bg-surface-2"
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
    <div className="flex overflow-hidden rounded-full border border-line text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-2 font-semibold ${o.value === value ? 'bg-accent text-on-accent' : 'bg-surface text-muted hover:bg-surface-2'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
