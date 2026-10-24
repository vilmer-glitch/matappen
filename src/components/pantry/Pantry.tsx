import { useRef, useState } from 'react'
import { ChevronDown, CircleOff, ListPlus, Refrigerator, Sparkles, Wheat, type LucideIcon } from 'lucide-react'
import type { ItemsStore } from '../../hooks/useItems'
import { statusFor, unitLabel } from '../../lib/constants'
import type { Item } from '../../types'
import { AddItemSearch, type NewItem } from './AddItemSearch'
import { GetStarted } from './GetStarted'
import { ItemRow } from './ItemRow'

type Props = {
  store: ItemsStore
  showUndo: (message: string, undo: () => void) => void
  openItem: (id: string) => void
  onRequestNew: (name: string) => void
}

export function Pantry({ store, showUndo, openItem, onRequestNew }: Props) {
  const { items, loading, error, clearError, addItem, updateItem, removeItem, restoreItem } = store
  const [showStaples, setShowStaples] = useState(false)
  const [showOut, setShowOut] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [showGetStarted, setShowGetStarted] = useState(false)

  // Several taps on + or − in a row are one change: Ångra goes back to the amount before the first tap
  const series = useRef<{ id: string; before: number | null; at: number } | null>(null)

  function setQuantity(item: Item, quantity: number | null) {
    const now = Date.now()
    const continues = series.current && series.current.id === item.id && now - series.current.at < 6000
    const before = continues ? series.current!.before : item.quantity
    series.current = { id: item.id, before, at: now }
    updateItem(item.id, { quantity, status: statusFor(quantity) })
    const text = quantity === 0 ? 'slut' : quantity === null ? 'okänd mängd' : `${quantity.toLocaleString('sv-SE')} ${unitLabel(item.unit, item.name)}`
    showUndo(`${item.name}: ${text}`, () => updateItem(item.id, { quantity: before, status: statusFor(before) }))
  }

  async function remove(item: Item) {
    if (await removeItem(item)) showUndo(`${item.name} togs bort`, () => restoreItem(item))
  }

  // Picking an existing item from the search jumps to its amount field
  function pick(item: Item) {
    if (item.is_staple) return setShowStaples(true)
    // Out-of-stock items live in their own folded group; open it so the amount field can get focus
    if (item.quantity === 0) setShowOut(true)
    setFocusId(item.id)
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

  if (loading) return <p className="text-sm text-faint">Hämtar lagret…</p>

  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, 'sv')
  // Kyl and Skafferi only show what you have; amount 0 goes to "Slut hemma"
  const atHome = (item: Item) => !item.is_staple && item.quantity !== 0
  const fridge = items.filter((item) => atHome(item) && item.category === 'fridge').sort(byName)
  const pantry = items.filter((item) => atHome(item) && item.category === 'pantry').sort(byName)
  const out = items.filter((item) => !item.is_staple && item.quantity === 0).sort(byName)
  const staples = items.filter((item) => item.is_staple).sort(byName)

  function rows(list: Item[]) {
    return (
      <ul className="divide-y divide-line">
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
      <AddItemSearch items={items} onPick={pick} onCreate={create} onRequestNew={onRequestNew} />

      {/* A new pantry (only staples) starts with "Kom igång"; later it can be opened from the button */}
      {fridge.length + pantry.length === 0 ? (
        <div className="mb-5">
          <GetStarted store={store} showUndo={showUndo} />
        </div>
      ) : showGetStarted ? (
        <div className="mb-5">
          <GetStarted store={store} showUndo={showUndo} onClose={() => setShowGetStarted(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowGetStarted(true)}
          className="mb-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-accent-strong hover:bg-accent-soft"
        >
          <ListPlus size={16} />
          Fyll på från listan
        </button>
      )}

      {error && (
        <p className="mb-3 flex justify-between rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
          <button onClick={clearError}>×</button>
        </p>
      )}

      <Group title="Kyl" icon={Refrigerator} count={fridge.length}>
        {fridge.length ? rows(fridge) : <Empty text="Inget i kylen än. Sök ovan för att lägga till." />}
      </Group>
      <Group title="Skafferi" icon={Wheat} count={pantry.length}>
        {pantry.length ? rows(pantry) : <Empty text="Inget i skafferiet än." />}
      </Group>

      {out.length > 0 && (
        <section className="mb-3 rounded-xl bg-surface-2 px-3 py-2">
          <button
            onClick={() => setShowOut(!showOut)}
            className="flex w-full items-center gap-2 py-1 text-sm font-semibold text-muted hover:text-ink"
          >
            <CircleOff size={16} className="text-danger" />
            Slut hemma
            <span className="text-faint">{out.length}</span>
            <ChevronDown size={16} className={`ml-auto transition-transform ${showOut ? 'rotate-180' : ''}`} />
          </button>
          {showOut && (
            <>
              <p className="pb-1 text-xs text-faint">Skriv en mängd när du har köpt något, så flyttas varan upp.</p>
              {rows(out)}
            </>
          )}
        </section>
      )}

      <section className="rounded-xl bg-surface-2 px-3 py-2">
        <button
          onClick={() => setShowStaples(!showStaples)}
          className="flex w-full items-center gap-2 py-1 text-sm font-semibold text-muted hover:text-ink"
        >
          <Sparkles size={16} className="text-olive" />
          Basvaror
          <span className="text-faint">{staples.length}</span>
          <ChevronDown size={16} className={`ml-auto transition-transform ${showStaples ? 'rotate-180' : ''}`} />
        </button>
        {showStaples && (
          <>
            <p className="pb-1 text-xs text-faint">Finns alltid hemma och dras aldrig av.</p>
            {rows(staples)}
          </>
        )}
      </section>
    </div>
  )
}

function Group({ title, icon: Icon, count, children }: { title: string; icon: LucideIcon; count: number; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted">
        <Icon size={16} className="text-accent" />
        {title}
        <span className="text-faint">{count}</span>
      </h3>
      {children}
    </section>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="py-2 text-sm text-faint">{text}</p>
}
