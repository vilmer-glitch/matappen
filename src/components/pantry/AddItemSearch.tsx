import { useState, type FormEvent } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { CATEGORIES, UNITS, unitLabel, type Category, type Unit } from '../../lib/constants'
import { stepFor, type CatalogItem } from '../../data/catalog'
import { formatAmount } from '../../lib/recipeUnits'
import { AmountStepper } from '../AmountStepper'
import { catalogEntryFor, suggest } from '../../lib/search'
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

const groupLabel: Record<NewItem['group'], string> = { fridge: 'Kyl', pantry: 'Skafferi', staple: 'Basvara' }

// Search field that suggests your items and the app's catalog while typing, or creates a new item.
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
  const [quantity, setQuantity] = useState<number | null>(null)

  // Known from the catalog: group and unit are already set
  const [known, setKnown] = useState(false)

  const text = query.trim()
  const suggestions = suggest(text, items, 7)
  const exact = suggestions.some((s) => s.score === 0)

  function pick(item: Item) {
    onPick(item)
    setQuery('')
  }

  // Opens the form for a new item, prefilled when the app knows it
  function open(name: string, entry?: CatalogItem) {
    setNewName(name)
    setQuantity(null)
    setQuery('')
    setKnown(Boolean(entry))
    if (entry) {
      setGroup(entry.group)
      if (entry.unit) setUnit(entry.unit)
    }
  }

  function pickCatalog(entry: CatalogItem) {
    // Without an amount to ask for (recipes, shopping list) the item is added at once
    if (!withQuantity) {
      onCreate({ name: entry.name, group: entry.group, unit: entry.unit ?? 'g', quantity: null })
      setQuery('')
      return
    }
    open(entry.name, entry)
  }

  function startCreate() {
    const entry = catalogEntryFor(text)
    if (entry) pickCatalog(entry)
    else open(text.charAt(0).toUpperCase() + text.slice(1))
  }

  // Enter picks the best suggestion, or creates a new item if there is none
  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!text) return
    const first = suggestions[0]
    if (!first) startCreate()
    else if (first.kind === 'own') pick(first.item)
    else pickCatalog(first.entry)
  }

  function create(e: FormEvent) {
    e.preventDefault()
    if (!newName) return
    onCreate({ name: newName, group, unit, quantity })
    setNewName(null)
  }

  if (newName !== null) {
    return (
      <form onSubmit={create} className="mb-4 space-y-3 rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex items-center justify-between gap-2 text-sm text-muted">
          <span>
            {known ? 'Lägg till' : 'Ny vara'}: <strong className="text-ink">{newName}</strong>
            {known && (
              <span className="ml-2 text-faint">
                {groupLabel[group]}
                {group !== 'staple' && ` · ${unitLabel(unit)}`}
              </span>
            )}
          </span>
          {known && (
            <button type="button" onClick={() => setKnown(false)} className="text-xs font-semibold text-faint hover:text-ink">
              Ändra
            </button>
          )}
        </div>

        {!known && <Choice options={GROUPS} value={group} onChange={setGroup} />}

        {group !== 'staple' && (
          <div className="flex items-center gap-2">
            {withQuantity && known && (
              <AmountStepper
                value={quantity}
                unit={unit}
                step={stepFor(newName, unit)}
                onChange={setQuantity}
                label={newName}
                focus
                live
              />
            )}
            {!known && (
              <>
                {withQuantity ? (
                  <AmountStepper
                    value={quantity}
                    unit={unit}
                    step={stepFor(undefined, unit)}
                    onChange={setQuantity}
                    label={newName}
                    live
                  />
                ) : (
                  <span className="text-sm text-muted">Enhet i lagret:</span>
                )}
                <Choice options={UNITS} value={unit} onChange={setUnit} />
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-full bg-accent py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong">
            Lägg till{group !== 'staple' && quantity !== null ? ` ${formatAmount(quantity)} ${unitLabel(unit)}` : ''}
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
          {!exact && suggestions.length > 0 && (
            <li className="px-4 pb-1 pt-2.5 text-xs font-semibold text-faint">Menade du …</li>
          )}
          {suggestions.map((s) =>
            s.kind === 'own' ? (
              <li key={s.item.id}>
                <button
                  type="button"
                  onClick={() => pick(s.item)}
                  className="flex w-full justify-between px-4 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="font-semibold">{s.item.name}</span>
                  <span className="text-faint">
                    {s.item.is_staple
                      ? 'Basvara'
                      : s.item.quantity === null
                        ? 'hemma'
                        : `${s.item.quantity.toLocaleString('sv-SE')} ${unitLabel(s.item.unit)}`}
                  </span>
                </button>
              </li>
            ) : (
              <li key={s.entry.name}>
                <button
                  type="button"
                  onClick={() => pickCatalog(s.entry)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={13} className="text-accent" />
                    {s.entry.name}
                  </span>
                  <span className="text-faint">
                    {groupLabel[s.entry.group]}
                    {s.entry.unit && ` · ${unitLabel(s.entry.unit)}`}
                  </span>
                </button>
              </li>
            ),
          )}
          {!exact && (
            <li className="border-t border-line">
              <button
                type="button"
                onClick={() => open(text.charAt(0).toUpperCase() + text.slice(1))}
                className="w-full px-4 py-2.5 text-left font-semibold text-accent-strong hover:bg-surface-2"
              >
                + Lägg till ”{text}” som ny vara
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
